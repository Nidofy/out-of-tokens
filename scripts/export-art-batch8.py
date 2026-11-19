"""Export Art-Batch 8 from immutable PNGs. Requires Pillow, numpy and scipy."""
import hashlib
import json
import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageOps
from scipy import ndimage

ROOT = Path(__file__).resolve().parents[1]
BATCH = ROOT / "art/art-batch-8"
PUBLIC = ROOT / "apps/web/public"
CHIBI = PUBLIC / "art/chibi"
POSES = ("stand_3q", "walk_3q", "work_front", "rest_3q")
FX = {
    "emote-focus": ("headTop", "pulse", 1.0),
    "emote-sweat": ("emoteRight", "drop", 0.9),
    "emote-crash": ("headTop", "shake", 1.0),
    "emote-zzz": ("emoteRight", "float", 1.0),
    "emote-excited": ("emoteLeft", "pop", 1.0),
    "emote-daze": ("headTop", "float", 1.0),
    "prop-code_bit": ("propHand", "rise", 0.7),
    "prop-coffee_cup": ("emoteRight", "float", 0.9),
}
LANCZOS = Image.Resampling.LANCZOS


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def save_json(path, value):
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n",
                    encoding="utf-8", newline="\n")


def measure(path):
    with Image.open(path) as image:
        alpha = image.convert("RGBA").getchannel("A")
        assert alpha.getextrema() == (0, 255), path
        return dict(file=path.relative_to(BATCH).as_posix(), width=image.width,
                    height=image.height, bytes=path.stat().st_size, sha256=digest(path),
                    alphaRange=list(alpha.getextrema()), alphaBounds=list(alpha.getbbox()))


def clean(image):
    rgba = np.array(image.convert("RGBA"))
    alpha = rgba[:, :, 3]
    labels, count = ndimage.label(alpha >= 14, structure=np.ones((3, 3)))
    assert count > 0
    sizes = np.bincount(labels.ravel())
    keep = sizes >= sizes[1:].max() * 0.0015
    keep[0] = False
    rgba[~keep[labels]] = 0
    # Only pull pale semi-transparent matte toward its nearest opaque colour.
    fringe = (alpha >= 14) & (alpha < 245) & (rgba[:, :, :3].min(axis=2) > 175)
    if fringe.any():
        nearest = ndimage.distance_transform_edt(alpha < 245, return_distances=False,
                                                return_indices=True)
        interior = rgba[nearest[0][fringe], nearest[1][fringe], :3]
        rgba[fringe, :3] = np.rint(0.75 * rgba[fringe, :3] + 0.25 * interior)
    result = Image.fromarray(rgba)
    bounds = result.getchannel("A").getbbox()
    return result.crop(bounds), bounds


def scaled(image, width, height):
    result = image.resize((width, height), LANCZOS)
    alpha = result.getchannel("A").point(lambda a: a if a >= 14 else 0)
    result.putalpha(alpha)
    return result.crop(alpha.getbbox())


def shoe_x(crop):
    alpha = np.asarray(crop.getchannel("A"))
    return float(np.nonzero(alpha[-math.ceil(crop.height * 0.15):])[1].mean())


def normalize(image, asset):
    is_fx = asset in FX
    side = 128 if is_fx else 512
    canvas = Image.new("RGBA", (side, side))
    if is_fx:
        ratio = 96 / max(image.size)
        sprite = scaled(image, round(image.width * ratio), round(image.height * ratio))
        pos = ((128 - sprite.width) // 2, (128 - sprite.height) // 2)
        metrics = dict(safeBox=[96, 96])
    else:
        target = 348 if asset == "work_front" else 400
        # Try descending integer heights, so a safety reduction is always minimal.
        for height in range(target, 0, -1):
            sprite = scaled(image, max(1, round(image.width * height / image.height)), height)
            center = shoe_x(sprite)
            x = round(256 - center)
            if x >= 12 and x + sprite.width - 1 <= 500:
                break
        else:
            raise ValueError(f"No safe placement for {asset}")
        pos = (x, 481 - sprite.height)
        warn = ["reduced height for horizontal clearance"] if height < target else []
        metrics = dict(targetHeight=target, visibleHeight=sprite.height, feet=[round(x + center), 480],
                       shoeCentroidX=round(x + center, 5), shoeSliceRows=math.ceil(sprite.height * 0.15),
                       warnings=warn)
        assert sprite.height == height and abs(x + center - 256) <= 0.5
    canvas.paste(sprite, pos)
    metrics.update(pasteXY=list(pos), cleanedSize=list(image.size), scaledSize=list(sprite.size),
                   alphaCutoff=14, connectivity=8, minComponentFraction=0.0015, quality=88, method=6)
    return canvas, metrics


def anchors(bounds):
    left, top, right, bottom = bounds
    w, h = right - left, bottom - top

    def point(x, y):
        return [round(left + w * x), round(top + h * y)]

    return dict(headTop=point(0.5, 0), faceCenter=point(0.60, 0.40),
                emoteLeft=point(0.15, 0.13), emoteRight=point(0.85, 0.13),
                propHand=point(0.74, 0.65), deskClipY=370)


def review(images, poses):
    wood = "#E8D5BC"
    sheet = Image.new("RGB", (1600, 712), "#f9f1e7")
    draw = ImageDraw.Draw(sheet)
    label = ImageFont.load_default(size=18)
    draw.text((12, 8), "Bluewhale   /   feet y480 (green)    pivot x256 (blue)    head (violet)    desktop y370 (red)",
              font=label, fill="#39291f")
    for i, name in enumerate((*POSES, "mirror")):
        asset = "stand_3q" if name == "mirror" else name
        panel = Image.new("RGBA", (512, 512), wood)
        sprite = images[asset]
        panel.alpha_composite(sprite)
        if name == "mirror":
            # Pixel coordinates reflected about x=256 (Pillow's flip alone uses 255.5).
            mirror = Image.new("RGBA", panel.size, wood)
            mirror.alpha_composite(ImageOps.mirror(sprite), (1, 0))
            panel = Image.blend(panel, mirror, 0.5)
        guides = ImageDraw.Draw(panel)
        guides.line((0, 480, 511, 480), fill="#25814c", width=2)
        guides.line((256, 0, 256, 511), fill="#3979ab", width=2)
        guides.line((0, 370, 511, 370), fill="#bd5850", width=2)
        x, y = poses[asset]["anchors"]["headTop"]
        guides.line((x-16, y, x+16, y), fill="#9442ab", width=4)
        guides.ellipse((x-3, y-3, x+3, y+3), fill="#9442ab")
        sheet.paste(panel.resize((320, 320), LANCZOS), (i * 320, 40))
        draw.text((i * 320 + 10, 46), name if name != "mirror" else "stand / mirror 50%",
                  font=label, fill="#39291f")
    for i, asset in enumerate(FX):
        x = i * 200
        draw.text((x + 8, 373), asset, font=label, fill="#39291f")
        for j, color in enumerate(("#fff3e0", "#302b37")):
            y = 404 + 150 * j
            draw.rectangle((x, y, x + 199, y + 149), fill=color)
            for offset, size in ((5, 128), (145, 48)):
                icon = images[asset].resize((size, size), LANCZOS)
                sheet.paste(icon, (x + offset, y + (150 - size) // 2), icon)
    path = BATCH / "review/batch8-review.png"
    path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(path)


def main():
    records = json.loads((BATCH / "generation.json").read_text(encoding="utf-8"))
    entries, images, poses, catalog = [], {}, {}, []
    notes = ["# Art-Batch 8 generation record", "",
             "Built-in image_gen with transparent_background enabled on every attempt. "
             "Backend model/version unknown. PNG masters are byte-identical to the accepted tool outputs.",
             "", "Alpha bounds use Pillow's exclusive right and bottom coordinates. "
             "The shoe pivot averages occupied pixel columns across the lowest 15% of visible rows, "
             "then rounds the translation to the nearest pixel.", ""]
    for asset in ("ref_sheet", *POSES, *FX):
        job = records[asset]
        group = "fx" if asset in FX else "bluewhale"
        master = BATCH / "masters" / group / (asset + ".png")
        stats = measure(master)
        assert stats["sha256"] == job["sourceSha256"], master
        assert stats["width"] == stats["height"]
        refs = job["references"]
        for ref in refs:
            assert digest(ROOT / ref["file"]) == ref["sha256"]
        provenance = dict(id=asset, tool="built-in image_gen", model="unknown; not exposed",
                          sourceFile=job["sourceFile"], prompt=job["prompt"],
                          parameters=dict(transparent_background=True), references=refs,
                          license="User-authorized generation for Out of Tokens; no separate license supplied.")
        with Image.open(master) as original:
            cleaned, subject_bounds = clean(original)
            left, top, right, bottom = subject_bounds
            clearance = min(left, top, original.width - right, original.height - bottom)
            assert clearance >= original.width * 0.10, (asset, subject_bounds)
        entries.append({**provenance, **stats, "processing": "untouched PNG",
                        "subjectBoundsAfterNoiseThreshold": list(subject_bounds)})
        notes.extend([f"## {asset}", "", job["prompt"], "", f"Accepted: `{job['sourceFile']}`.",
                      "", "References: " + (", ".join(f"`{r['file']}` ({r['sha256']})" for r in refs) or "none"),
                      "", f"Discarded attempts: {len(job['discarded'])}.", ""])
        for prior in job["discarded"]:
            notes.extend([f"- `{prior['file']}` — {prior['reason']}", "", prior["prompt"], ""])
        if asset == "ref_sheet":
            continue
        canvas, metrics = normalize(cleaned, asset)
        directory = Path("fx" if asset in FX else "characters/bluewhale")
        relative = directory / (asset + ".webp")
        output = BATCH / "runtime" / relative
        output.parent.mkdir(parents=True, exist_ok=True)
        # Lossy RGB quantization can undershoot to black even from warm ink.
        # Correct only those decoded visible pixels, then check the final encoding.
        for attempt in range(3):
            canvas.save(output, quality=88, method=6)
            with Image.open(output) as encoded:
                decoded = np.array(encoded.convert("RGBA"))
            black = (decoded[:, :, 3] > 0) & (decoded[:, :, :3] == 0).all(axis=2)
            if not black.any():
                break
            source = np.array(canvas)
            source[black, :3] = [58, 36, 26]
            canvas = Image.fromarray(source)
        else:
            raise ValueError(f"Visible pure black after WebP encoding: {asset}")
        metrics["cocoaCorrectionPasses"] = attempt
        stats = measure(output)
        assert stats["bytes"] < (25000 if asset in FX else 90000)
        with Image.open(output) as encoded:
            images[asset] = encoded.convert("RGBA")
        assert np.array_equal(canvas.getchannel("A"), images[asset].getchannel("A"))
        dest = CHIBI / relative
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(output.read_bytes())
        entries.append({**provenance, **stats, "publicFile": dest.relative_to(PUBLIC).as_posix(),
                        "masterSha256": job["sourceSha256"], "normalization": metrics})
        left, top, right, bottom = stats["alphaBounds"]
        if asset in FX:
            assert min(left, top, 128-right, 128-bottom) >= 16
            anchor, preset, scale = FX[asset]
            catalog.append(dict(id=asset, file=dest.name, anchor=anchor, animationPreset=preset,
                                scale=scale, sha256=stats["sha256"], bytes=stats["bytes"]))
        else:
            assert bottom == 481 and bottom - top == metrics["visibleHeight"]
            poses[asset] = dict(file=dest.name, mirrorable=asset != "work_front",
                                anchors=anchors(stats["alphaBounds"]), feet=metrics["feet"],
                                visibleHeight=metrics["visibleHeight"], warnings=metrics["warnings"])
            if asset == "work_front":
                poses[asset]["seatedOffsetY"] = -42

    idle = poses["stand_3q"]
    rig = dict(schemaVersion=2, renderer="maple-chibi", id="bluewhale", canvas=[512, 512],
               feet=idle["feet"], visibleHeight=idle["visibleHeight"], facingDefault="right",
               heightScale=1.0, anchors=idle["anchors"], poses=poses,
               optionalPoses=dict(back_3q=None, react_front=None), faceOverrides=None,
               motionProfile=dict(walkSpeed=1.0, hopHeight=10, stepCadenceHz=3.2,
                                  squashAmount=0.06, breathAmp=0.025))
    save_json(CHIBI / "characters/bluewhale/rig.json", rig)
    save_json(CHIBI / "fx/catalog.json", catalog)
    save_json(BATCH / "manifest.json", entries)
    (BATCH / "PROMPTS.md").write_text("\n".join(notes).rstrip() + "\n", encoding="utf-8", newline="\n")
    review(images, poses)


if __name__ == "__main__":
    main()
