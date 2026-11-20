"""Export the six 12A portrait sets from the archived paintings and measured landmarks."""
import hashlib
import json
import math
from io import BytesIO
from pathlib import Path
from runpy import run_path
from shutil import copyfile
from tempfile import TemporaryDirectory

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[1]
BATCH = ROOT / "art/art-batch-12a"
PUBLIC = ROOT / "apps/web/public/art/portraits"
REVIEW = BATCH / "review"
PORTRAIT = (768, 1024)
AVATAR = (256, 256)
LANCZOS = Image.Resampling.LANCZOS
# Keep the existing avatar encoder and decoded pixel measurements.
batch9 = run_path(str(Path(__file__).with_name("export-art-batch9.py")))
encode, measurements = batch9["encode"], batch9["measurements"]
save_json = batch9["b8"]["save_json"]


def file_record(path, published_path=None):
    data = path.read_bytes()
    return dict(file=(published_path or path).relative_to(ROOT).as_posix(), bytes=len(data), sha256=hashlib.sha256(data).hexdigest())


def staged_path(stage, destination):
    path = stage / destination.relative_to(ROOT)
    path.parent.mkdir(parents=True, exist_ok=True)
    return path


def clean_edges(original):
    """Remove low-alpha matte noise while retaining detached leaves, crystals and sparks."""
    rgba = np.array(original)
    alpha = rgba[:, :, 3]
    labels, _ = ndimage.label(alpha >= 16, structure=np.ones((3, 3)))
    sizes = np.bincount(labels.ravel())
    cores = np.bincount(labels[alpha >= 56], minlength=len(sizes))
    keep = (sizes >= 12) & (cores >= 3)
    keep[0] = False
    rgba[~keep[labels]] = 0
    # Restrict de-matting to subpixel pale edges beside solid ink. Translucent
    # sashes and glows away from the outline keep their own painted colour.
    fringe = (alpha >= 16) & (alpha < 120) & (rgba[:, :, :3].min(axis=2) > 170)
    if fringe.any():
        distance, nearest = ndimage.distance_transform_edt(alpha < 225, return_indices=True)
        fringe &= distance <= 2.5
        interior = rgba[nearest[0][fringe], nearest[1][fringe], :3]
        rgba[fringe, :3] = np.rint(rgba[fringe, :3] * 0.4 + interior * 0.6)
    return Image.fromarray(rgba)


def resized(image, size):
    result = image.resize(size, LANCZOS)
    result.putalpha(result.getchannel("A").point(lambda a: a if a >= 10 else 0))
    return result


def map_landmarks(marks, source_origin, scale, offset):
    def point(x, y):
        return [round((v - start) * factor + pad, 2)
                for v, start, factor, pad in zip((x, y), source_origin, scale, offset)]

    left, top, right, bottom = marks["headRegion"]
    region = [round(v) for v in point(left, top) + point(right, bottom)]
    return dict(eyes=[point(*eye) for eye in marks["eyes"]], headRegion=region)


def frame_portrait(painting, marks):
    box = painting.getchannel("A").getbbox()
    subject = painting.crop(box)
    factor = min(736 / subject.width, 920 / subject.height)
    width, height = (round(v * factor) for v in subject.size)
    origin = ((PORTRAIT[0] - width) // 2, PORTRAIT[1] - height)
    canvas = Image.new("RGBA", PORTRAIT)
    canvas.paste(resized(subject, (width, height)), origin)
    return canvas, map_landmarks(marks, box[:2], (width / subject.width, height / subject.height), origin)


def bust_master(base, marks, crop):
    """A native-resolution crop. Only the shoulder line is shaped into a shallow arc."""
    eye_x = np.mean(marks["eyes"], axis=0)[0]
    x = np.arange(base.width)
    cut = crop["bottomY"] - crop["arcCurvature"] * (x - eye_x) ** 2
    coverage = np.clip(cut - np.arange(base.height)[:, None] + 0.5, 0, 1)
    bust = base.copy()
    bust.putalpha(Image.fromarray(np.rint(np.asarray(base.getchannel("A")) * coverage).astype("uint8")))
    return square_at_eyes(bust, marks, crop["eyeTarget"])


def square_at_eyes(bust, marks, eye_target):
    eye_x, eye_y = np.mean(marks["eyes"], axis=0)
    left, top, right, bottom = bust.getchannel("A").getbbox()
    # Fit all four edges around the annotated eye midpoint, including asymmetric hats.
    eye_u, eye_v = eye_target
    pad = 0.048
    side = math.ceil(max((eye_x - left) / (eye_u - pad), (right - eye_x) / (1 - pad - eye_u),
                         (eye_y - top) / (eye_v - pad), (bottom - eye_y) / (1 - pad - eye_v)))
    x0, y0 = round(eye_x - side * eye_u), round(eye_y - side * eye_v)
    master = bust.crop((x0, y0, x0 + side, y0 + side))
    return master, map_landmarks(marks, (x0, y0), (1, 1), (0, 0))


def head_measurements(image, marks):
    # Alpha-weighted pixel centres in the annotated crown-to-chin ellipse.
    left, top, right, bottom = marks["headRegion"]
    assert 0 <= left < right <= image.width and 0 <= top < bottom <= image.height
    alpha = np.asarray(image.getchannel("A").crop((left, top, right, bottom)))
    y, x = np.ogrid[top:bottom, left:right]
    ellipse = ((2 * x + 1 - left - right) / (right - left)) ** 2 + ((2 * y + 1 - top - bottom) / (bottom - top)) ** 2 <= 1
    weights = alpha * ellipse
    centroid = [np.average(x.ravel() + 0.5, weights=weights.sum(axis=0)),
                np.average(y.ravel() + 0.5, weights=weights.sum(axis=1))]
    for ex, ey in marks["eyes"]:
        assert left <= ex < right and top <= ey < bottom and image.getpixel((round(ex), round(ey)))[3] >= 192
    return dict(**marks, headCentroid=[round(v, 2) for v in centroid],
                eyeCenter=np.mean(marks["eyes"], axis=0).round(2).tolist())


def encode_portrait(canvas, marks):
    # The transparent generator leaves slight alpha variation even in solid fabric.
    # Seal near-opaque paint and preserve the antialiasing and intentional translucency.
    alpha = canvas.getchannel("A")
    matte = alpha.point(lambda a: 255 if a >= 242 else round(a / 6) * 6)
    interior = alpha.point(lambda a: 255 if a >= 235 else 0).filter(ImageFilter.MinFilter(3))
    reserve = ImageDraw.Draw(interior)
    for x, y in marks["eyes"]:
        reserve.ellipse((x - 18, y - 12, x + 18, y + 12), fill=0)
    pixels = np.array(canvas.convert("RGB"))
    dark = (pixels.max(axis=2) < 26) & (np.asarray(matte) > 0)
    pixels[dark] = np.maximum(pixels[dark], [42, 27, 20])
    rgb = Image.fromarray(pixels)
    # Use the smallest grain reduction that fits the budget. Never smooth the
    # eyes or the alpha silhouette, even on densely embroidered flagship gowns.
    for radius in (0, 0.45, 0.65, 0.8, 0.95):
        color = Image.composite(rgb.filter(ImageFilter.GaussianBlur(radius)), rgb, interior) if radius else rgb
        sprite = color.convert("RGBA")
        sprite.putalpha(matte)
        buffer = BytesIO()
        sprite.save(buffer, "WEBP", quality=86, method=6)
        payload = buffer.getvalue()
        if len(payload) <= 140000:
            with Image.open(BytesIO(payload)) as image:
                decoded = image.convert("RGBA")
            assert np.array_equal(matte, decoded.getchannel("A"))
            return payload, decoded, dict(quality=86, method=6, grainRadius=radius, liftedPixels=int(dark.sum()))
    raise ValueError("Portrait exceeds 140,000 bytes")


def export_webp(stage, character, tier, canvas, marks, source):
    if tier == "avatar":
        payload, decoded, passes = encode(canvas)
        encoder = dict(quality=88, method=6, warmInkPasses=passes)
    else:
        payload, decoded, encoder = encode_portrait(canvas, marks)
    stats = measurements(decoded, payload)
    left, top, right, bottom = stats["alphaBounds"]
    assert decoded.mode == "RGBA" and stats["alphaRange"] == (0, 255) and stats["visiblePureBlackPixels"] == 0
    head = head_measurements(decoded, marks)
    if tier == "avatar":
        assert decoded.size == AVATAR and len(payload) <= 35000, (character, tier, stats)
        assert min(left, top, 256 - right, 256 - bottom) >= 10, (character, tier, stats)
        assert all(0.38 * 256 <= y <= 0.54 * 256 for _, y in marks["eyes"]), (character, marks)
        assert abs(head["eyeCenter"][0] - 128) <= 16
    else:
        assert decoded.size == PORTRAIT and len(payload) <= 140000, (character, tier, stats)
        assert min(left, 768 - right) >= 12 and top >= 24, (character, tier, stats)
        assert 840 <= bottom - top <= 972 and 990 <= bottom <= 1024
    directory = "avatars" if tier == "avatar" else tier
    path = PUBLIC / directory / (character + ".webp")
    pending = staged_path(stage, path)
    pending.write_bytes(payload)
    catalog_entry = dict(path=path.relative_to(PUBLIC).as_posix(), **stats, **head)
    provenance = dict(id=character, tier=tier, **file_record(pending, path), sourceSha256=source["sha256"], encoder=encoder)
    return decoded, catalog_entry, provenance


PAPER, WALNUT = "#f6eddf", "#38281f"
INK, LIGHT = "#422e23", "#f8ead9"


def label(sheet, xy, value, size=18, color=INK):
    ImageDraw.Draw(sheet).text(xy, value, font=ImageFont.load_default(size=size), fill=color)


def fit(sheet, image, box):
    left, top, width, height = box
    factor = min(width / image.width, height / image.height)
    scaled = image.resize((round(image.width * factor), round(image.height * factor)), LANCZOS)
    xy = (left + (width - scaled.width) // 2, top + (height - scaled.height) // 2)
    sheet.paste(scaled, xy, scaled)


def reference(path):
    with Image.open(ROOT / path) as im:
        image = im.convert("RGBA")
    return image.crop(image.getchannel("A").point(lambda v: 255 if v >= 16 else 0).getbbox())


def review_sheets(sets, layouts, review):
    review.mkdir(exist_ok=True)
    cell, row, header = 250, 327, 48
    block = header + 2 * row
    overview = Image.new("RGB", (cell * len(sets), block * 2), PAPER)
    for theme, (ground, ink, title) in enumerate(((PAPER, INK, "Warm paper"), (WALNUT, LIGHT, "Dark walnut"))):
        y = theme * block
        ImageDraw.Draw(overview).rectangle((0, y, overview.width, y + block - 1), fill=ground)
        label(overview, (18, y + 9), "12A    /    " + title, 22, ink)
        label(overview, (cell * 4 + 15, y + 14), "Top row   Base     /     Bottom row   Flagship", 16, ink)
        for n, (character, images) in enumerate(sets.items()):
            layout = layouts[character]
            for tier_n, tier in enumerate(("base", "flagship")):
                top = y + header + tier_n * row
                name = layout["versions"][tier_n]
                label(overview, (n * cell + 15, top), character + "    /    " + name, 16, ink)
                fit(overview, images[tier], (n * cell + 4, top + 19, cell - 8, row - 22))
    overview.save(review / "batch12a-overview.png")

    for character, images in sets.items():
        item = layouts[character]
        sheet = Image.new("RGB", (1384, 606), PAPER)
        draw = ImageDraw.Draw(sheet)
        draw.rectangle((630, 0, 1014, 605), fill=WALNUT)
        label(sheet, (16, 10), character + "    /    12A", 24)
        label(sheet, (16, 55), "Identity sheet", 17)
        fit(sheet, reference(item["references"][0]), (12, 84, 206, 285))
        label(sheet, (16, 389), "Stage B", 16)
        fit(sheet, reference(item["references"][1]), (15, 415, 200, 175))
        for n, (tier, x, ink) in enumerate((("base", 230, INK), ("flagship", 630, LIGHT))):
            label(sheet, (x + 15, 18), tier.capitalize() + "    /    " + item["versions"][n], 22, ink)
            fit(sheet, images[tier], (x + 2, 48, 380, 548))
        label(sheet, (1036, 18), "Avatar    /    256 px", 21)
        sheet.paste(images["avatar"], (1068, 100), images["avatar"])
        for n, (ground, ink) in enumerate(((PAPER, INK), (WALNUT, LIGHT))):
            x = 1015 + n * 185
            draw.rectangle((x, 404, x + 184, 605), fill=ground)
            for size, pad in ((48, 27), (32, 104)):
                thumb = images["avatar"].resize((size, size), LANCZOS)
                sheet.paste(thumb, (x + pad, 450 + (48 - size) // 2), thumb)
                label(sheet, (x + pad, 517), str(size) + " px", 14, ink)
        sheet.save(review / (character + "-review.png"))


def build(stage):
    layouts = json.loads((BATCH / "composition.json").read_bytes())
    catalog = dict(schemaVersion=1, portraitCanvas=PORTRAIT, avatarCanvas=AVATAR, characters={})
    manifest = dict(schemaVersion=1, tool="built-in image_gen", model="not exposed",
                    parameters=dict(transparent_background=True),
                    license="User-authorized generation for Out of Tokens; no separate license supplied.",
                    masters={}, runtime=[])
    sets = {}
    for character, item in layouts.items():
        master_dir = BATCH / "masters" / character
        entries, images, masters = {}, {}, {}
        references = [file_record(ROOT / path) for path in item["references"]]
        for tier in ("base", "flagship", "avatar"):
            path = master_dir / (tier + ".png")
            master_file = path
            if tier == "avatar" and "sourceFile" not in item[tier]:
                master, marks = bust_master(base, item["base"], item["avatar"])
                master_file = staged_path(stage, path)
                master.save(master_file)
                source = dict(method="native-resolution contour crop", references=[file_record(master_dir / "base.png")])
                square = master
            else:
                with Image.open(path) as original:
                    assert original.format == "PNG" and original.mode == "RGBA", path
                    master = original.copy()
                raw = file_record(path)
                assert raw["sha256"] == item[tier]["sourceSha256"], path
                refs = list(references)
                if tier in ("flagship", "avatar"):
                    refs.append(file_record(master_dir / "base.png"))
                elif "redrawnFrom" in item[tier]:
                    refs.append(file_record(BATCH / item[tier]["redrawnFrom"]))
                source = dict(method="built-in image_gen", sourceFile=item[tier]["sourceFile"], references=refs)
                painting = clean_edges(master)
                if tier == "avatar":
                    square, marks = square_at_eyes(painting, item[tier], item[tier]["eyeTarget"])
                else:
                    canvas, marks = frame_portrait(painting, item[tier])
                if tier == "base":
                    base = painting
            if tier == "avatar":
                canvas = resized(square, AVATAR)
                marks = map_landmarks(marks, (0, 0), (256 / square.width, 256 / square.height), (0, 0))
            masters[tier] = dict(**file_record(master_file, path), **source, width=master.width, height=master.height,
                                 alphaRange=master.getchannel("A").getextrema(), alphaBounds=master.getchannel("A").getbbox())
            images[tier], entries[tier], record = export_webp(stage, character, tier, canvas, marks, masters[tier])
            manifest["runtime"].append(record)
        sets[character] = images
        manifest["masters"][character] = masters
        catalog["characters"][character] = entries
    catalog_path = PUBLIC / "catalog.json"
    pending_catalog = staged_path(stage, catalog_path)
    save_json(pending_catalog, catalog)
    manifest["catalog"] = file_record(pending_catalog, catalog_path)
    save_json(staged_path(stage, BATCH / "manifest.json"), manifest)
    review_sheets(sets, layouts, staged_path(stage, REVIEW))
    return manifest


def main():
    # Finish every pixel gate and proof sheet before publishing any output. Use
    # same-volume replacements and publish the catalogs after their image files.
    with TemporaryDirectory(dir=BATCH, prefix=".export-") as temp:
        stage = Path(temp)
        manifest = build(stage)
        for path in sorted(stage.rglob("*"), key=lambda p: (p.suffix == ".json", p)):
            if path.is_file():
                target = ROOT / path.relative_to(stage)
                target.parent.mkdir(parents=True, exist_ok=True)
                # On Windows a moved file keeps the private ACL of TemporaryDirectory.
                # A fresh sibling inherits the destination directory's normal permissions.
                sibling = target.with_name(target.name + stage.name + ".tmp")
                try:
                    copyfile(path, sibling)
                    sibling.replace(target)
                finally:
                    sibling.unlink(missing_ok=True)
    print(f"{len(manifest['masters'])} characters, {len(manifest['runtime'])} WebPs, {sum(e['bytes'] for e in manifest['runtime']):,} bytes")


if __name__ == "__main__":
    main()
