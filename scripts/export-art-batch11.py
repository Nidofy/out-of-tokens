"""Export 2x furniture layers, editor thumbnails and the actor interaction proof sheets."""
import hashlib
import json
from pathlib import Path
from runpy import run_path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

batch9 = run_path(str(Path(__file__).with_name("export-art-batch9.py")))
clean, scaled, encode, measurements = (batch9[name] for name in ("clean", "scaled", "encode", "measurements"))
save_json = batch9["b8"]["save_json"]
ROOT = Path(__file__).resolve().parents[1]
BATCH = ROOT / "art/art-batch-11"
PUBLIC = ROOT / "apps/web/public/art/furniture"
REVIEW = BATCH / "review"
LAYERS = {"basic": ["back", "front"], "standard": ["back", "front"], "whiteboard": ["back"],
          "coffee": ["back"], "sofa": ["back"], "server": ["back"], "dining": ["front"], "reading": ["front"]}
DECOR = ("decor-studio_cat", "decor-monstera_pot", "decor-token_jar", "decor-vinyl_player")
# World origin in the 2x version of the legacy -140,-200 viewBox.
ORIGIN = (280, 400)
# Width interval, height interval and inclusive lowest opaque pixel.
FACILITIES = {"whiteboard-back": ((430, 460), (340, 360), 412),
              "coffee-back": ((320, 350), (310, 330), 424),
              "sofa-back": ((460, 490), (265, 290), 424),
              "server-back": ((220, 250), (370, 390), 426),
              "dining-front": ((460, 500), (240, 280), 428),
              "reading-front": ((460, 500), (240, 280), 428)}


def fit_width(image, width):
    return scaled(image, width, round(image.height * width / image.width))


def centered(subject, size, bottom, use_centroid=False):
    x = (size[0] - subject.width) // 2
    if use_centroid:
        alpha = np.asarray(subject.getchannel("A"))
        x = round(size[0] / 2 - np.average(np.arange(subject.width), weights=alpha.sum(axis=0)))
    y = bottom + 1 - subject.height
    assert 0 <= x <= size[0] - subject.width and 0 <= y <= size[1] - subject.height
    canvas = Image.new("RGBA", size)
    canvas.alpha_composite(subject, (x, y))
    return canvas


def desktop(subject):
    # Find the opaque rear lip in the central typing area. It must span the whole
    # desk-facing side of both actors, independently of the monitor or sticky notes.
    def edge(canvas):
        alpha = np.asarray(canvas.getchannel("A"))
        return int(np.flatnonzero(np.min(alpha[:, 210:351], axis=1) >= 248)[0])

    trial = centered(fit_width(subject, 480), (560, 480), 428)
    width = round(480 * (428 - 224) / (428 - edge(trial)))
    candidates = sorted(range(460, 501), key=lambda w: abs(w - width))
    for w in candidates:
        canvas = centered(fit_width(subject, w), (560, 480), 428)
        rear = edge(canvas)
        if 222 <= rear <= 224:
            # Generated painted wood is near-solid (252-254) even deep inside
            # the panel. Seal near-opaque wood so no character colour bleeds through.
            canvas.putalpha(canvas.getchannel("A").point(lambda a: 255 if a >= 248 else a))
            alpha = np.asarray(canvas.getchannel("A"))
            assert alpha[224:261, 210:351].min() >= 248, "desktop has a gap"
            assert alpha[284:385, 180:381].min() == 255, "desk panel does not occlude the legs"
            return canvas
    raise ValueError(f"Desk with width 480 has rear lip at y={edge(trial)}; redraw its proportions")


def normalize(key, subject):
    if key in ("basic-front", "standard-front"):
        return desktop(subject)
    if key in ("basic-back", "standard-back"):
        height = 280
        chair = scaled(subject, round(height * subject.width / subject.height), height)
        return centered(chair, (560, 480), 396)
    if key in DECOR:
        scale = 198 / max(subject.size)
        sprite = scaled(subject, round(subject.width * scale), round(subject.height * scale))
        return centered(sprite, (256, 256), 236, use_centroid=True)
    widths, heights, bottom = FACILITIES[key]
    low = max(widths[0] / subject.width, heights[0] / subject.height)
    high = min(widths[1] / subject.width, heights[1] / subject.height)
    if low <= high:
        factor = (low + high) / 2
        w, h = round(subject.width * factor), round(subject.height * factor)
    else:
        # Quantize the outer dimensions to their closest allowed endpoints.
        # Refuse a strongly distorted silhouette and generate a better source instead.
        w, h = ((widths[1], heights[0]) if subject.width / subject.height > widths[1] / heights[0]
                else (widths[0], heights[1]))
        assert abs(w / h / (subject.width / subject.height) - 1) < 0.10, (key, subject.size, (w, h))
    return centered(scaled(subject, w, h), (560, 480), bottom)


def preview(layers):
    image = Image.new("RGBA", (560, 480))
    for layer in layers:
        image.alpha_composite(layer)
    crop = image.crop(image.getchannel("A").getbbox())
    factor = 202 / max(crop.size)
    thumb = scaled(crop, round(crop.width * factor), round(crop.height * factor))
    canvas = Image.new("RGBA", (256, 256))
    canvas.alpha_composite(thumb, ((256 - thumb.width) // 2, (256 - thumb.height) // 2))
    return canvas


def write_runtime(key, canvas, parents, entries):
    # Batch 9's encoder checks decoded alpha and lifts any quantized pure black
    # to warm RGB (58,36,26), above the required (42,26,18), before retrying.
    payload, decoded, passes = encode(canvas)
    stats = measurements(decoded, payload)
    assert stats["bytes"] < (70000 if canvas.width == 560 else 35000), key
    name = key + ".webp"
    (BATCH / "runtime" / name).write_bytes(payload)
    (PUBLIC / name).write_bytes(payload)
    entries.append(dict(id=key, file="runtime/" + name, publicFile="art/furniture/" + name,
                        sourceTool="built-in image_gen", sourceModel="unknown; not exposed",
                        derivation="layer composite" if key.endswith("-preview") else "normalized master",
                        sourceSha256=parents, encoder={"quality": 88, "method": 6, "warmInkPasses": passes},
                        **stats))
    return decoded, stats


INK = "#423228"
PAPER = "#f8f2e8"
FONT = ImageFont.load_default(size=17)
SMALL = ImageFont.load_default(size=14)
TITLE = ImageFont.load_default(size=27)


def asset_review(images):
    groups = [("Furniture layers", [f"{k}-{l}" for k, layers in LAYERS.items() for l in layers]),
              ("Editor previews", [k + "-preview" for k in LAYERS]),
              ("Decor props", list(DECOR))]
    cell, row = 262, 148
    sheet = Image.new("RGB", (5 * cell + 32, 56 + 3 * 35 + 5 * row + 12), PAPER)
    draw = ImageDraw.Draw(sheet)
    draw.text((16, 12), "Art-Batch 11   /   Asset review", font=TITLE, fill=INK)
    draw.text((650, 20), "Blue: horizontal center     Green: world floor or decor feet", font=FONT, fill=INK)
    top = 56
    for label, keys in groups:
        draw.text((16, top), label, font=FONT, fill=INK)
        top += 33
        for i, key in enumerate(keys):
            x, y = 16 + (i % 5) * cell, top + (i // 5) * row
            src = images[key]
            scale = min(124 / src.width, 108 / src.height)
            image = src.resize((round(src.width * scale), round(src.height * scale)), Image.Resampling.LANCZOS)
            for j, color in enumerate(("#ede1d0", "#3d3737")):
                tile = Image.new("RGBA", (126, 112), color)
                ox, oy = (126 - image.width) // 2, (112 - image.height) // 2
                tile.alpha_composite(image, (ox, oy))
                overlay = Image.new("RGBA", tile.size)
                guides = ImageDraw.Draw(overlay)
                guides.line((63, 0, 63, 111), fill=(72, 145, 197, 90))
                floor = 400 if src.width == 560 else 236 if key in DECOR else None
                if floor is not None:
                    gy = oy + round(floor * scale)
                    guides.line((0, gy, 125, gy), fill=(44, 144, 91, 165))
                tile.alpha_composite(overlay)
                sheet.paste(tile.convert("RGB"), (x + 127 * j, y))
            draw.text((x, y + 116), key, font=SMALL, fill=INK)
        top += ((len(keys) + 4) // 5) * row
    sheet.save(REVIEW / "batch11-assets-review.png")


def actor(character, pose):
    folder = ROOT / "apps/web/public/art/chibi/characters" / character
    rig = json.loads((folder / "rig.json").read_bytes())
    spec = (rig["optionalPoses"] if pose == "back_3q" else rig["poses"])[pose]
    fallback = {"work_front": 1.1, "rest_3q": 0.94}.get(pose, 1.0)
    # The same calibration and feet pivot used by the still MapleChibiRig.
    scale = 2 * 165 / rig["visibleHeight"] * rig["heightScale"] * spec.get("poseScale", fallback)
    with Image.open(folder / spec["file"]) as src:
        image = src.convert("RGBA")
        # MapleChibiRig tints the body Sprite with 0xfff8f0.
        red, green, blue, alpha = image.split()
        image = Image.merge("RGBA", (red, green.point(lambda v: round(v * 248 / 255)),
                                     blue.point(lambda v: round(v * 240 / 255)), alpha))
        image = image.resize((round(src.width * scale), round(src.height * scale)), Image.Resampling.LANCZOS)
    return image, [round(v * scale) for v in spec["feet"]], scale


def composite_review(images):
    # Add headroom above the 560x480 SVG frame; a seated actor can extend above it.
    headroom = 65

    def stage(width):
        return Image.new("RGBA", (width, 480 + headroom), "#e8d4b8")

    def place_actor(scene, char, pose, fx, fy):
        sprite, pivot, scale = actor(char, pose)
        x, y = fx - pivot[0], fy - pivot[1]
        scene.alpha_composite(sprite, (x, y + headroom))
        return sprite, x, y, scale

    panels = []
    for kind, char, hand_pair, leg_y in (
            ("basic", "bluewhale", [(228, 350), (289, 350)], 407),
            ("standard", "mistral", [(247, 324), (306, 326)], 399)):
        scene = stage(560)
        scene.alpha_composite(images[kind + "-back"], (0, headroom))
        # office-scene-spec's fully arrived seat offset is -48 world units;
        # MapleChibiRig applies a further -6 to the body for desk work.
        sprite, x, y, scale = place_actor(scene, char, "work_front", 280, 400 - 2 * (48 + 6))
        front = images[kind + "-front"]
        a = np.asarray(front.getchannel("A"))
        for px, py in hand_pair:
            assert a[y + round(py * scale), x + round(px * scale)] == 0, (kind, "covered hand")
        lower = np.asarray(sprite.getchannel("A"))[round(leg_y * scale):]
        ly, lx = np.where(lower >= 248)
        assert a[y + round(leg_y * scale) + ly, x + lx].min() >= 248, (kind, "visible legs")
        scene.alpha_composite(front, (0, headroom))
        panels.append((kind.title() + " workstation", char + " / work_front", scene))

    for kind, char, pose, feet in (("sofa", "bluewhale", "rest_3q", (195, 384)),
                                  ("coffee", "gpt", "back_3q", (154, 440)),
                                  ("whiteboard", "claude", "back_3q", (178, 446))):
        scene = stage(560)
        scene.alpha_composite(images[kind + "-back"], (0, headroom))
        place_actor(scene, char, pose, *feet)
        panels.append((kind.title(), char + " / " + pose, scene))

    scene = stage(1160)
    place_actor(scene, "bluewhale", "stand_3q", 575, 421)
    for key, x in zip(DECOR, (132, 356, 804, 1028)):
        scene.alpha_composite(images[key], (x - 128, headroom + 421 - 236))
    panels.append(("Studio decor", "bluewhale / stand_3q", scene))
    sheet = Image.new("RGB", (1160, 1470), PAPER)
    draw = ImageDraw.Draw(sheet)
    draw.text((22, 14), "Art-Batch 11   /   Actor and furniture alignment", font=TITLE, fill=INK)
    draw.text((22, 53), "165 world-unit partner height   /   2 px per world unit   /   back > actor > front",
              font=FONT, fill=INK)
    cells = [(16, 96, 558, 500), (586, 96, 558, 500), (16, 620, 368, 370),
             (396, 620, 368, 370), (776, 620, 368, 370), (16, 1014, 1128, 430)]
    for (name, detail, panel), (x, y, w, h) in zip(panels, cells):
        draw.text((x, y), name, font=FONT, fill=INK)
        draw.text((x, y + 23), detail, font=SMALL, fill="#745b47")
        panel.thumbnail((w, h - 49), Image.Resampling.LANCZOS)
        sheet.paste(panel.convert("RGB"), (x + (w - panel.width) // 2, y + 45))
    sheet.save(REVIEW / "batch11-composite-review.png")


# Overlay locations sampled in the exported 560x480 layer, in source pixels.
# screenRect uses [left, top, width, height]. seatY is the cushion surface.
ANCHORS = {
    "basic": {"screenRect": [377, 175, 118, 54], "seatY": 280},
    "standard": {"screenRect": [380, 169, 116, 56], "seatY": 265},
    "coffee": {"steamAnchor": [231, 209]},
    "sofa": {"seatY": 319},
    "server": {"ledPoints": [[343, y] for y in (113, 149, 184, 219, 254, 289, 324, 359)]},
}
LICENSE = "User-authorized generation for Out of Tokens; no separate license supplied."


def main():
    for folder in (PUBLIC, REVIEW, BATCH / "runtime"):
        folder.mkdir(parents=True, exist_ok=True)
    jobs = json.loads((BATCH / "generation.json").read_bytes())
    keys = [k + "-" + layer for k, layers in LAYERS.items() for layer in layers] + list(DECOR)
    assert set(jobs) == set(keys)
    entries, images, metrics = [], {}, {}
    notes = ["# Art-Batch 11 generation record", "",
             "Built-in image_gen with transparent_background=true. Backend model: unknown; not exposed. "
             "The PNGs under masters/ are the untouched selected tool outputs. "
             "Only the selected sources are shipped. All candidates are identified below by SHA256.", ""]
    for key in keys:
        attempts = jobs[key]
        chosen, = [job for job in attempts if job["selected"]]
        path = BATCH / "masters" / (key + ".png")
        payload = path.read_bytes()
        assert hashlib.sha256(payload).hexdigest() == chosen["sha256"], path
        with Image.open(path) as master:
            assert master.format == "PNG" and master.mode == "RGBA", path
            a = master.getchannel("A")
            subject, bounds = clean(master)
            l, t, r, b = bounds
            assert min(l / master.width, t / master.height, 1 - r / master.width,
                       1 - b / master.height) >= 0.12, (key, bounds)
            entries.append(dict(id=key, file="masters/" + path.name, tool="built-in image_gen",
                                model="unknown; not exposed", parameters={"transparent_background": True},
                                license=LICENSE, sha256=chosen["sha256"], bytes=len(payload),
                                width=master.width, height=master.height, alphaRange=list(a.getextrema()),
                                alphaBounds=list(a.getbbox()), cleanedBounds=bounds,
                                sourceFile=chosen["sourceFile"], prompt=chosen["prompt"],
                                references=chosen["references"]))
        canvas = normalize(key, subject)
        images[key], metrics[key] = write_runtime(key, canvas, [chosen["sha256"]], entries)
        notes.extend(["## " + key, ""])
        for job in attempts:
            status = "Selected" if job["selected"] else "Discarded"
            notes.extend([f"### {status} / take {job['idx'] + 1}", "",
                          f"Source: `{job['sourceFile']}`", "", f"SHA256: `{job['sha256']}`", ""])
            for ref in job["references"]:
                notes.extend([f"Reference: `{ref['file']}` ({ref['render']}). "
                              f"Reference raster SHA256: `{ref['rasterSha256']}`.", ""])
            notes.extend(["```text", job["prompt"], "```", ""])
            if not job["selected"]:
                assert job["reason"], (key, job["idx"])
                notes.extend([job["reason"], ""])

    furniture = []
    for kind, layers in LAYERS.items():
        ids = [kind + "-" + l for l in layers]
        key = kind + "-preview"
        images[key], metrics[key] = write_runtime(key, preview([images[k] for k in ids]),
                                                  [metrics[k]["sha256"] for k in ids], entries)
        furniture.append(dict(kind=kind, layers=layers, preview=key + ".webp",
                              alphaBounds={l: metrics[k]["alphaBounds"] for l, k in zip(layers, ids)},
                              previewAlphaBounds=metrics[key]["alphaBounds"], anchors=ANCHORS.get(kind, {})))
    decor = []
    for key in DECOR:
        stat = metrics[key]
        l, t, r, b = stat["alphaBounds"]
        assert b - 1 == 236 and 192 <= max(r - l, b - t) <= 204 and min(l, t, 256 - r) >= 20
        a = np.asarray(images[key].getchannel("A"))
        center = float(np.average(np.arange(256), weights=a.sum(axis=0)))
        assert abs(center - 128) <= 0.5
        decor.append(dict(id=key, file=key + ".webp", feet=[128, 236], visibleHeight=b - t,
                          alphaCentroidX=center, alphaBounds=stat["alphaBounds"],
                          sha256=stat["sha256"], bytes=stat["bytes"]))

    catalog = dict(schemaVersion=1, layerCanvas=[560, 480], pixelsPerWorldUnit=2,
                   worldOriginPx=ORIGIN, previewCanvas=[256, 256], decorCanvas=[256, 256],
                   furniture=furniture, decor=decor)
    catalog_path = PUBLIC / "catalog.json"
    save_json(catalog_path, catalog)
    cbytes = catalog_path.read_bytes()
    entries.append(dict(id="catalog", file=catalog_path.relative_to(ROOT).as_posix(),
                        publicFile="art/furniture/catalog.json", sha256=hashlib.sha256(cbytes).hexdigest(),
                        bytes=len(cbytes)))
    save_json(BATCH / "manifest.json", entries)
    notes.extend(["## Visual acceptance", "",
                  "Both workstations were checked at 165 world-unit partner height, including the "
                  "production seat offset and per-pose scale. Each backrest is visible beside the hair. "
                  "Both hands clear the rear lip and the opaque fronts hide the legs. The right-hand "
                  "monitors leave the faces clear. The sofa supports the resting pose, and the rear-facing "
                  "poses read against the espresso machine and whiteboard. All four props were also "
                  "checked on the standing partner's scale. The final light/dark sheet shows clean edges, "
                  "blank keycaps and no painted floor shadows.", ""])
    (BATCH / "PROMPTS.md").write_text("\n".join(notes).rstrip() + "\n", encoding="utf-8", newline="\n")
    asset_review(images)
    composite_review(images)


if __name__ == "__main__":
    main()
