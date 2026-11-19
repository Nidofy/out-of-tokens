"""Export Batch 9 from its untouched PNGs. Requires Pillow, NumPy and SciPy."""
from io import BytesIO
import hashlib
import json
import math
from pathlib import Path
import runpy

import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageOps

# Load the frozen Batch 8 pixel routines without invoking its export entry point.
b8 = runpy.run_path(str(Path(__file__).with_name("export-art-batch8.py")))
clean, scaled, shoe_x = (b8[key] for key in ("clean", "scaled", "shoe_x"))
ROOT = Path(__file__).resolve().parents[1]
BATCH = ROOT / "art/art-batch-9"
PUBLIC = ROOT / "apps/web/public"
CHIBI = PUBLIC / "art/chibi"
CHAR = CHIBI / "characters/bluewhale"
FX = {
    "emote-slack": ("emoteRight", "float", 0.9),
    "emote-anger": ("emoteLeft", "shake", 0.9),
    "emote-dizzy": ("headTop", "float", 1.0),
    "emote-heart": ("emoteRight", "pop", 0.9),
    "emote-alert": ("headTop", "pop", 1.0),
    "emote-spark": ("emoteLeft", "pulse", 0.9),
    "prop-doc_page": ("propHand", "rise", 0.7),
    "prop-smoke_puff": ("headTop", "rise", 0.8),
    "prop-dust_step": ("propHand", "pop", 0.55),
    "prop-heal_leaf": ("emoteRight", "float", 0.75),
}


def head_width(image):
    """Horizontal extent of visible pixels in the top 45% of the subject."""
    alpha = image.getchannel("A")
    left, top, right, bottom = alpha.getbbox()
    band = alpha.crop((left, top, right, top + math.ceil((bottom - top) * 0.45)))
    x0, _, x1, _ = band.getbbox()
    return x1 - x0


def normalize_seated_by_head_ratio(seated_master, stand_runtime):
    """Scale a seated master uniformly to the standing reference's head width, then pin its feet."""
    seated, _ = clean(seated_master)
    ratio = head_width(stand_runtime) / head_width(seated)
    sprite = scaled(seated, max(1, round(seated.width * ratio)), max(1, round(seated.height * ratio)))
    x, y = round(256 - shoe_x(sprite)), 481 - sprite.height
    if x < 12 or x + sprite.width > 501 or y < 0:
        raise ValueError("Matching the seated head width would clip the sprite or its safe margins")
    canvas = Image.new("RGBA", (512, 512))
    canvas.paste(sprite, (x, y))
    return canvas


def normalize_fx(subject):
    ratio = 96 / max(subject.size)
    sprite = scaled(subject, max(1, round(subject.width * ratio)), max(1, round(subject.height * ratio)))
    xy = ((128 - sprite.width) // 2, (128 - sprite.height) // 2)
    canvas = Image.new("RGBA", (128, 128))
    canvas.paste(sprite, xy)
    return canvas, dict(safeBox=[96, 96], pasteXY=xy, scaledSize=sprite.size, cleanedSize=subject.size,
                        alphaCutoff=14, connectivity=8, minComponentFraction=0.0015, quality=88, method=6)


def visible_black(image):
    rgba = np.asarray(image)
    return (rgba[:, :, 3] > 0) & (rgba[:, :, :3] == 0).all(axis=2)


def encode(canvas):
    for attempt in range(3):
        buffer = BytesIO()
        canvas.save(buffer, "WEBP", quality=88, method=6)
        buffer.seek(0)
        with Image.open(buffer) as image:
            decoded = image.convert("RGBA")
        black = visible_black(decoded)
        if not black.any():
            assert np.array_equal(decoded.getchannel("A"), canvas.getchannel("A"))
            return buffer.getvalue(), decoded, attempt
        pixels = np.array(canvas)
        pixels[black, :3] = [58, 36, 26]
        canvas = Image.fromarray(pixels)
    raise ValueError("Visible black persists after WebP quantization")


def measurements(image, payload):
    alpha = image.getchannel("A")
    assert alpha.getextrema() == (0, 255)
    return dict(width=image.width, height=image.height, bytes=len(payload),
                sha256=hashlib.sha256(payload).hexdigest(), alphaBounds=alpha.getbbox(),
                alphaRange=alpha.getextrema(), visiblePureBlackPixels=int(visible_black(image).sum()))


def draw_review(stand, images, rig, metrics):
    sheet = Image.new("RGB", (1536, 1028), "#faf3e8")
    draw = ImageDraw.Draw(sheet)
    ink = "#422d22"
    font = ImageFont.load_default(size=19)
    title = ImageFont.load_default(size=26)
    draw.text((22, 12), "Bluewhale    /    3-quarter rear view", fill=ink, font=title)
    draw.text((650, 18), "Feet y480 (green)     Pivot x256 (blue)     Head (violet)", fill=ink, font=font)
    names = ("stand_3q", "back_3q", "back / mirror 50%")
    for i, name in enumerate(names):
        is_back = i > 0
        sprite = images["back_3q"] if is_back else stand
        pose = rig["optionalPoses"]["back_3q"] if is_back else rig["poses"]["stand_3q"]
        panel = Image.new("RGBA", (512, 512), "#E8D5BC")
        panel.alpha_composite(sprite)
        if i == 2:
            mirror = Image.new("RGBA", panel.size, "#E8D5BC")
            mirror.alpha_composite(ImageOps.mirror(sprite), (1, 0))
            panel = Image.blend(panel, mirror, 0.5)
        guides = ImageDraw.Draw(panel)
        guides.line((0, 480, 511, 480), fill="#27844c", width=2)
        guides.line((256, 0, 256, 511), fill="#477ea9", width=2)
        x, y = pose["anchors"]["headTop"]
        guides.line((x-12, y, x+12, y), fill="#8d389e", width=3)
        guides.ellipse((x-3, y-3, x+3, y+3), fill="#8d389e")
        guides.text((14, 13), name, fill=ink, font=font)
        sheet.paste(panel, (i*512, 56))
    draw.text((20, 577), f"Head width, upper 45%     stand {metrics['standHeadWidth']} px     rear "
              f"{metrics['backHeadWidth']} px     ratio {metrics['headWidthRatio']:.3f}", fill=ink, font=font)
    for i, name in enumerate(FX):
        row, col = divmod(i, 5)
        x, y = 10+col*305, 618+row*203
        draw.text((x+10, y), name, font=font, fill=ink)
        for j, color in enumerate(("#fff3e0", "#302b37")):
            # Each swatch shows both the exact 128px texture and a 48px display sample.
            panel = Image.new("RGBA", (150, 168), color)
            panel.alpha_composite(images[name], (0, 0))
            panel.alpha_composite(images[name].resize((48, 48), Image.Resampling.LANCZOS), (96, 118))
            sheet.paste(panel, (x+j*150, y+27))
    dest = BATCH / "review/batch9-review.png"
    dest.parent.mkdir(exist_ok=True)
    sheet.save(dest)


def main():
    jobs = json.loads((BATCH / "generation.json").read_bytes())
    rig_path, catalog_path = CHAR / "rig.json", CHIBI / "fx/catalog.json"
    rig = json.loads(rig_path.read_bytes())
    catalog = json.loads(catalog_path.read_bytes())
    with Image.open(CHAR / "stand_3q.webp") as image:
        stand = image.convert("RGBA")
    entries, images, outputs, additions = [], {}, {}, []
    notes = ["# Art-Batch 9 generation record", "",
             "All attempts used built-in image_gen with transparent_background enabled. "
             "PNG masters retain the original tool bytes. Backend model/version unknown.", ""]
    for name in ("back_3q", *FX):
        job = jobs[name]
        is_fx = name in FX
        master = Path("masters", "fx" if is_fx else "bluewhale", name + ".png")
        relative = Path("fx" if is_fx else "characters/bluewhale", name + ".webp")
        payload = (BATCH/master).read_bytes()
        with Image.open(BytesIO(payload)) as original:
            assert original.format == "PNG" and original.width == original.height
            rgba = original.convert("RGBA")
        stats = measurements(rgba, payload)
        # Raw masters include matte noise at very low alpha; retain both counts.
        stats["blackPixelsAtNonzeroAlpha"] = stats.pop("visiblePureBlackPixels")
        stats["blackPixelsAtAlpha14OrAbove"] = int(
            (visible_black(rgba) & (np.asarray(rgba.getchannel("A")) >= 14)).sum())
        assert stats["blackPixelsAtAlpha14OrAbove"] == 0, master
        assert stats["sha256"] == job["sourceSha256"]
        for ref in job["references"]:
            assert b8["digest"](ROOT / ref["file"]) == ref["sha256"]
        common = dict(id=name, tool="built-in image_gen", model="unknown; not exposed",
                      license="User-authorized generation for Out of Tokens; no separate license supplied.",
                      parameters={"transparent_background": True}, prompt=job["prompt"],
                      sourceFile=job["sourceFile"], references=job["references"], discarded=job["discarded"])
        subject, bounds = clean(rgba)
        l, t, r, b = bounds
        assert min(l, t, rgba.width-r, rgba.height-b) >= 0.10 * rgba.width
        entries.append(dict(**common, **stats, file=master.as_posix(), subjectBoundsAfterNoiseThreshold=bounds))
        notes.extend([f"## {name}", "", job["prompt"], "", f"Accepted: `{job['sourceFile']}`.", "",
                      "References: " + ", ".join(f"`{ref['file']}` ({ref['sha256']})" for ref in job["references"]),
                      "", f"Discarded attempts: {len(job['discarded'])}.", ""])
        for prior in job["discarded"]:
            notes.extend([f"- `{prior['sourceFile']}` — {prior['reason']}", "", prior["prompt"], ""])

        canvas, norm = normalize_fx(subject) if is_fx else b8["normalize"](subject, name)
        encoded, decoded, norm["cocoaCorrectionPasses"] = encode(canvas)
        info = measurements(decoded, encoded)
        left, top, right, bottom = info["alphaBounds"]
        assert info["visiblePureBlackPixels"] == 0
        assert len(encoded) < (25000 if is_fx else 90000)
        if is_fx:
            assert min(left, top, 128-right, 128-bottom) >= 16
            anchor, preset, scale = FX[name]
            additions.append(dict(id=name, file=relative.name, anchor=anchor, animationPreset=preset,
                                  scale=scale, sha256=info["sha256"], bytes=info["bytes"]))
        else:
            assert bottom == 481 and bottom-top == 400 and left >= 12 and right <= 501
            center = left + shoe_x(decoded.crop(info["alphaBounds"]))
            assert abs(center-256) < 1
            front_width, back_width = head_width(stand), head_width(decoded)
            norm.update(standHeadWidth=front_width, backHeadWidth=back_width, headBandFraction=0.45,
                        headWidthRatio=back_width/front_width)
            back_metrics = norm
            rig["optionalPoses"][name] = dict(file=relative.name, mirrorable=True, feet=[round(center), bottom-1],
                                              visibleHeight=bottom-top, anchors=b8["anchors"](info["alphaBounds"]),
                                              warnings=norm["warnings"])
        runtime = Path("runtime") / relative
        dest = CHIBI / relative
        entries.append(dict(**common, **info, file=runtime.as_posix(), publicFile=dest.relative_to(PUBLIC).as_posix(),
                            masterSha256=stats["sha256"], normalization=norm))
        outputs[BATCH/runtime] = outputs[dest] = encoded
        images[name] = decoded

    for path, data in outputs.items():
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)
    # Replace only this batch's entries on replay; retain existing items in order.
    b8["save_json"](catalog_path, [item for item in catalog if item["id"] not in FX] + additions)
    b8["save_json"](rig_path, rig)
    b8["save_json"](BATCH / "manifest.json", entries)
    (BATCH / "PROMPTS.md").write_text("\n".join(notes).rstrip()+"\n", encoding="utf-8", newline="\n")
    draw_review(stand, images, rig, back_metrics)


if __name__ == "__main__":
    main()
