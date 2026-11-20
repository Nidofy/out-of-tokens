"""Register independent imagegen facial edits to each accepted avatar camera and silhouette."""
import json
from pathlib import Path
from runpy import run_path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont, features
from scipy import ndimage

from art_archive import ROOT, publish, record, write_json

PORTRAITS = Path("apps/web/public/art/portraits")
DIRECTORY = PORTRAITS / "expressions"
CATALOG = DIRECTORY / "catalog.json"
EMOTIONS = ("happy", "flustered", "focused")
LANCZOS = Image.Resampling.LANCZOS
codec = run_path(str(ROOT / "scripts/export-art-batch9.py"))


def alpha_geometry(image):
    alpha = np.asarray(image.getchannel("A"))
    center = [float(np.average(np.arange(n), weights=alpha.sum(axis=axis)))
              for n, axis in ((image.width, 0), (image.height, 1))]
    return image.getchannel("A").getbbox(), center


def solid_shape(image):
    # Ignore faint matte specks when measuring the original, untrimmed generator canvas.
    labels, _ = ndimage.label(np.asarray(image.getchannel("A")) >= 180)
    sizes = np.bincount(labels.ravel())
    y, x = np.where(labels == 1 + np.argmax(sizes[1:]))
    return int(y.max() - y.min() + 1), np.array([x.mean(), y.mean()])


def face_mask(eyes):
    (lx, ly), (rx, ry) = eyes
    distance = np.hypot(rx - lx, ry - ly)
    x, y = (lx + rx) / 2, (ly + ry) / 2 + 0.06 * distance
    mask = Image.new("L", (256, 256))
    ImageDraw.Draw(mask).ellipse((x - 1.15 * distance, y - 1.02 * distance,
                                  x + 1.15 * distance, y + 1.02 * distance), fill=255)
    return mask.filter(ImageFilter.GaussianBlur(1.2))


def registered_frame(source, default, reference_shape, raw_eyes, eyes):
    height, center = solid_shape(source)
    ref_height, ref_center = reference_shape
    # Raw and runtime eye pairs define the original camera; the solid silhouette registers the edit.
    raw_span = np.linalg.norm(np.subtract(raw_eyes[1], raw_eyes[0]))
    final_span = np.linalg.norm(np.subtract(eyes[1], eyes[0]))
    raw_to_runtime = final_span / raw_span
    scale = ref_height / height * raw_to_runtime
    target_center = np.mean(eyes, axis=0) + (ref_center - np.mean(raw_eyes, axis=0)) * raw_to_runtime
    left, top = np.rint(center - target_center / scale).astype(int).tolist()
    side = round(default.width / scale)
    box = [left, top, left + side, top + side]
    return source.crop(box).resize(default.size, LANCZOS), box


def render(source, default, reference_shape, raw_eyes, eyes):
    assert source.mode == "RGBA" and source.getchannel("A").getextrema()[0] == 0
    aligned, box = registered_frame(source, default, reference_shape, raw_eyes, eyes)
    mask = face_mask(eyes)
    face = np.asarray(mask) > 220
    assert np.min(np.asarray(aligned.getchannel("A"))[face]) >= 180, "Missing paint in expression region"
    # Animate only the painted face. Reuse the accepted costume, camera and entire alpha channel.
    canvas = Image.composite(aligned.convert("RGB"), default.convert("RGB"), mask).convert("RGBA")
    canvas.putalpha(default.getchannel("A"))
    payload, decoded, passes = codec["encode"](canvas)
    stats = codec["measurements"](decoded, payload)
    bounds, center = alpha_geometry(decoded)
    ref_bounds, ref_center = alpha_geometry(default)
    ratio = (bounds[3] - bounds[1]) / (ref_bounds[3] - ref_bounds[1])
    shift = [round(value - baseline, 6) for value, baseline in zip(center, ref_center)]
    l, t, r, b = bounds
    assert decoded.size == (256, 256) and decoded.mode == "RGBA" and stats["alphaRange"] == (0, 255)
    assert len(payload) <= 35000 and min(l, t, 256 - r, 256 - b) >= 10 and stats["visiblePureBlackPixels"] == 0
    assert 0.94 <= ratio <= 1.06 and abs(shift[0]) <= 4 and abs(shift[1]) <= 5
    assert np.array_equal(decoded.getchannel("A"), default.getchannel("A"))
    delta = np.abs(np.asarray(decoded.convert("RGB"), dtype=int) - np.asarray(default.convert("RGB"), dtype=int))
    outside = (np.asarray(mask) == 0) & (np.asarray(default.getchannel("A")) >= 180)
    assert delta[outside].mean() < 4 and delta[face].mean() > 3, "Check registration or ineffective facial edit"
    stats.update(mode="RGBA", heightRatio=round(ratio, 6), centroidShiftPx=shift, alphaCentroidPx=center)
    return payload, decoded, stats, {"sourceBox": box, "quality": 88, "method": 6, "warmInkPasses": passes,
                                      "outsideFaceMeanRgbError": round(float(delta[outside].mean()), 4)}


def matrix(images, ids, path, title):
    paper, ink = "#f5eee4", "#493627"
    row_h, col_w, left, header = 234, 404, 108, 90
    sheet = Image.new("RGB", (left + col_w * 4 + 12, header + len(ids) * row_h + 12), paper)
    draw = ImageDraw.Draw(sheet)
    font = ImageFont.load_default(size=18)
    small = ImageFont.load_default(size=15)
    draw.text((16, 10), title, font=ImageFont.load_default(size=30), fill=ink)
    draw.text((sheet.width-418, 18), "Warm paper / walnut     184 px and 48 px", font=small, fill=ink)
    for col, state in enumerate(("default", *EMOTIONS)):
        draw.text((left + col*col_w + 6, 55), state.title(), font=font, fill=ink)
        for row, character in enumerate(ids):
            y, x = header + row * row_h, left + col * col_w
            if col == 0:
                draw.text((12, y + 95), character.title(), font=small, fill=ink)
            image = images[character, state]
            large, thumb = image.resize((184, 184), LANCZOS), image.resize((48, 48), LANCZOS)
            for ground, color in enumerate(("#fff6e8", "#443832")):
                tile = Image.new("RGBA", (196, 228), color)
                tile.alpha_composite(large, (6, 0))
                tile.alpha_composite(thumb, (74, 180))
                sheet.paste(tile.convert("RGB"), (x + ground * 197, y))
    sheet.save(path)


def preserve_other_entries(stage, destination):
    # Rebuilding an earlier snapshot in place must retain later accepted records.
    existing = destination / CATALOG
    if existing.is_file():
        local = json.loads((stage / CATALOG).read_bytes())
        current = json.loads(existing.read_bytes())
        assert current["schemaVersion"] == local["schemaVersion"] and current["canvas"] == local["canvas"]
        ids = {item["id"] for item in local["assets"]}
        extra = [item for item in current["assets"] if item["id"] not in ids]
        if extra:
            for item in extra:
                assert record(destination, DIRECTORY / item["file"])["sha256"] == item["sha256"]
            local["assets"].extend(extra)
            write_json(stage / CATALOG, local)


def export_batch(batch, reference_batch, ids):
    archive = Path("art/art-batch-" + batch)
    original = Path("art/art-batch-" + reference_batch)
    layout = json.loads((ROOT / original / "composition.json").read_bytes())
    accepted = json.loads((ROOT / PORTRAITS / "catalog.json").read_bytes())["characters"]

    def build(stage):
        (stage / DIRECTORY).mkdir(parents=True)
        images, entries, assets = {}, [], []
        for character in ids:
            reference = original / "masters" / character / "avatar.png"
            default_file = PORTRAITS / "avatars" / (character + ".webp")
            with Image.open(ROOT / reference) as painting, Image.open(ROOT / default_file) as avatar:
                reference_shape = solid_shape(painting)
                default = avatar.copy()
            images[character, "default"] = default
            eyes = accepted[character]["avatar"]["eyes"]
            raw_eyes = layout[character]["avatar"]["eyes"]
            for emotion in EMOTIONS:
                key = f"{character}-{emotion}"
                master = archive / "masters" / character / (emotion + ".png")
                runtime = DIRECTORY / (key + ".webp")
                with Image.open(ROOT / master) as src:
                    assert src.format == "PNG", master
                    master_info = dict(**record(ROOT, master), width=src.width, height=src.height, mode=src.mode)
                    payload, decoded, stats, encoder = render(src, default, reference_shape, raw_eyes, eyes)
                (stage / runtime).write_bytes(payload)
                images[character, emotion] = decoded
                entry = dict(id=key, character=character, emotion=emotion, file=runtime.name, **stats)
                entries.append(entry)
                assets.append({"id": key, "master": master_info, "reference": record(ROOT, reference),
                               "default": record(ROOT, default_file), "encoder": encoder,
                               "runtime": {**entry, "file": runtime.as_posix()}})
        write_json(stage / CATALOG, {"schemaVersion": 1, "canvas": [256, 256], "assets": entries})
        review = archive / "review"
        (stage / review).mkdir(parents=True)
        matrix(images, ids, stage / review / f"batch{batch}-expressions-review.png", f"Partner expressions   /   {batch.upper()}")
        write_json(stage / archive / "manifest.json", {
            "batch": batch, "generator": "built-in image_gen", "transparent_background": True,
            "usage": "Commissioned for Out of Tokens.", "pillow": Image.__version__, "libwebp": features.version("webp"),
            "assets": assets, "catalog": record(stage, CATALOG),
            "reviews": [record(stage, path.relative_to(stage)) for path in sorted((stage / review).glob("*.png"))],
        })
        print(f"{len(entries)} expressions, {sum(item['bytes'] for item in entries)} bytes")

    publish(build, finalize=preserve_other_entries)
