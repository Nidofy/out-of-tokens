"""Replay Art-Batch 10A from untouched image_gen PNGs with Pillow, NumPy and SciPy."""
from io import BytesIO
from pathlib import Path
import json
import runpy

import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageOps

phase2 = runpy.run_path(str(Path(__file__).with_name("export-art-batch9.py")))
phase1 = phase2["b8"]
ROOT = Path(__file__).resolve().parents[1]
BATCH = ROOT / "art/art-batch-10a"
PUBLIC = ROOT / "apps/web/public"
CHARACTERS = PUBLIC / "art/chibi/characters"
POSES = (*phase1["POSES"], "back_3q")
SEATED = {"work_front", "rest_3q"}
MOTION_KEYS = ("walkSpeed", "hopHeight", "stepCadenceHz", "squashAmount", "breathAmp")
MOTION = {
    "qwen": (1.0, 9, 3.1, 0.055, 0.024),
    "llama": (0.96, 9, 2.9, 0.05, 0.024),
    "mistral": (1.08, 11, 3.5, 0.065, 0.026),
    "gpt": (1.0, 9, 3.0, 0.05, 0.023),
    "claude": (0.98, 8.5, 2.95, 0.05, 0.022),
}
head_width = phase2["head_width"]
normalize_seated_by_head_ratio = phase2["normalize_seated_by_head_ratio"]


def normalize_pose(master, subject, pose, stand):
    if pose in SEATED:
        canvas = normalize_seated_by_head_ratio(master, stand)
    else:
        canvas, _ = phase1["normalize"](subject, pose)
    box = canvas.getchannel("A").getbbox()
    sprite = canvas.crop(box)
    uniform_height = sprite.height
    if pose in SEATED and not 356 <= uniform_height <= 392:
        raise ValueError(f"Redraw {pose}: head-matched height is {uniform_height} px")
    target_height = uniform_height if pose in SEATED else 400
    # Walk and back silhouettes can differ in width at the same 400 px height.
    # Seated poses already match by uniform scale, up to raster rounding.
    # Resize from the cleaned master so the width adjustment adds no extra blur.
    target_width = head_width(stand) if stand is not None else head_width(canvas)
    if uniform_height != target_height or head_width(canvas) != target_width:
        width = round(sprite.width * target_width / head_width(canvas))
        for delta in (0, -1, 1, -2, 2, -3, 3):
            candidate = phase1["scaled"](subject, width + delta, target_height)
            if head_width(candidate) == target_width:
                sprite = candidate
                break
        else:
            raise ValueError(f"Head width did not converge for {pose}")
    x = round(256 - phase1["shoe_x"](sprite))
    y = 481 - sprite.height
    assert x >= 12 and x + sprite.width <= 501 and sprite.height == target_height
    canvas = Image.new("RGBA", (512, 512))
    canvas.paste(sprite, (x, y))
    return canvas, dict(headMatchedHeightBeforeFit=uniform_height, scaledSize=list(sprite.size),
                        cleanedSize=list(subject.size), pasteXY=[x, y], headBandFraction=0.45,
                        alphaCutoff=14, quality=88, method=6)


def review_sheet(title, panels, dest):
    size = 352
    sheet = Image.new("RGB", (size * len(panels), size + 65), "#faf3e9")
    text = ImageDraw.Draw(sheet)
    text.text((14, 7), title, font=ImageFont.load_default(size=23), fill="#412d21")
    text.text((size * len(panels) - 565, 13), "Feet y480 (green)    Pivot x256 (blue)    Head (violet)    Desk y370 (red)",
              font=ImageFont.load_default(size=16), fill="#412d21")
    for index, (label, sprite, mirrored) in enumerate(panels):
        panel = Image.new("RGBA", sprite.size, "#e8d5bc")
        panel.alpha_composite(sprite)
        if mirrored:
            reflected = Image.new("RGBA", sprite.size, "#e8d5bc")
            reflected.alpha_composite(ImageOps.mirror(sprite), (1, 0))
            panel = Image.blend(panel, reflected, 0.5)
        guides = ImageDraw.Draw(panel)
        left, top, right, _ = sprite.getchannel("A").getbbox()
        head_x = (left + right) // 2
        guides.line((0, 480, 511, 480), fill="#26864a", width=2)
        guides.line((256, 0, 256, 511), fill="#477fa7", width=2)
        guides.line((0, 370, 511, 370), fill="#bd5146", width=2)
        guides.line((head_x-12, top, head_x+12, top), fill="#953dab", width=4)
        sheet.paste(panel.resize((size, size), Image.Resampling.LANCZOS), (index*size, 38))
        text.text((index*size + 12, size+40), label, font=ImageFont.load_default(size=17), fill="#412d21")
    dest.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(dest)


def record_master(path, job):
    payload = path.read_bytes()
    with Image.open(BytesIO(payload)) as image:
        assert image.format == "PNG" and image.mode == "RGBA" and image.width == image.height
        master = image.copy()
    stats = phase2["measurements"](master, payload)
    assert stats["sha256"] == job["sourceSha256"], path
    for ref in job["references"]:
        assert phase1["digest"](ROOT / ref["file"]) == ref["sha256"], ref["file"]
    stats["blackPixelsAtNonzeroAlpha"] = stats.pop("visiblePureBlackPixels")
    black = phase2["visible_black"](master)
    stats["blackPixelsAtAlpha14OrAbove"] = int((black & (np.asarray(master)[:, :, 3] >= 14)).sum())
    assert stats["blackPixelsAtAlpha14OrAbove"] == 0, path
    subject, bounds = phase1["clean"](master)
    l, t, r, b = bounds
    assert min(l, t, master.width-r, master.height-b) >= 0.12*master.width, path
    return master, subject, dict(**stats, file=path.relative_to(BATCH).as_posix(),
                                 subjectBoundsAfterNoiseThreshold=bounds, **job)


def export_character(character, jobs, manifest, notes):
    images, poses = {}, {}
    folder = CHARACTERS / character
    folder.mkdir(parents=True, exist_ok=True)
    for pose in ("ref_sheet", *POSES):
        job = jobs[character][pose]
        path = BATCH / "masters" / character / (pose + ".png")
        master, subject, entry = record_master(path, job)
        common = dict(characterId=character, id=pose, tool="built-in image_gen", model="unknown; not exposed",
                      parameters={"transparent_background": True},
                      license="User-authorized generation for Out of Tokens; no separate license supplied.")
        manifest.append(dict(**common, **entry))
        notes.extend([f"## {character} / {pose}", "", job["prompt"], "",
                      f"Accepted PNG: {job['sourceFile']} ({job['sourceSha256']}).", "",
                      "References: " + ", ".join(ref["file"] + " (" + ref["sha256"] + ")" for ref in job["references"]),
                      "", f"Discarded attempts: {len(job['discarded'])}.", ""])
        for rejected in job["discarded"]:
            notes.extend([rejected["sourceFile"] + " — " + rejected["reason"], "", rejected["prompt"], ""])
        if pose == "ref_sheet":
            continue
        canvas, geometry = normalize_pose(master, subject, pose, images.get("stand_3q"))
        payload, decoded, corrections = phase2["encode"](canvas)
        stats = phase2["measurements"](decoded, payload)
        left, top, right, bottom = stats["alphaBounds"]
        height = bottom - top
        center = left + phase1["shoe_x"](decoded.crop(stats["alphaBounds"]))
        assert len(payload) < 90000 and bottom == 481 and abs(center - 256) < 1
        assert stats["visiblePureBlackPixels"] == 0
        if pose in SEATED:
            assert 356 <= height <= 392
        else:
            assert height == 400
        images[pose] = decoded
        stand_width = head_width(images["stand_3q"])
        measured_width = head_width(decoded)
        assert measured_width == stand_width
        geometry.update(visibleHeight=height, feet=[256, 480], shoeCentroidX=center, poseScale=1.0,
                        standHeadWidth=stand_width, headWidth=measured_width, headWidthRatio=measured_width/stand_width,
                        cocoaCorrectionPasses=corrections)
        spec = dict(file=pose + ".webp", mirrorable=pose != "work_front", feet=[256, 480], visibleHeight=height,
                    poseScale=1.0, headWidthRatio=geometry["headWidthRatio"], anchors=phase1["anchors"](stats["alphaBounds"]))
        poses[pose] = spec
        dest = folder / spec["file"]
        dest.write_bytes(payload)
        manifest.append(dict(**common, **stats, file=dest.relative_to(ROOT).as_posix(),
                             publicFile=dest.relative_to(PUBLIC).as_posix(), masterSha256=entry["sha256"],
                             normalization=geometry))
    rig = dict(schemaVersion=2, renderer="maple-chibi", id=character, canvas=[512, 512], feet=[256, 480],
               visibleHeight=400, facingDefault="right", heightScale=1.0, anchors=poses["stand_3q"]["anchors"],
               poses={key: poses[key] for key in phase1["POSES"]}, optionalPoses=dict(back_3q=poses["back_3q"], react_front=None),
               faceOverrides=None, motionProfile=dict(zip(MOTION_KEYS, MOTION[character])))
    rig_path = folder / "rig.json"
    phase1["save_json"](rig_path, rig)
    manifest.append(dict(characterId=character, id="rig", file=rig_path.relative_to(ROOT).as_posix(),
                         publicFile=rig_path.relative_to(PUBLIC).as_posix(), bytes=rig_path.stat().st_size,
                         sha256=phase1["digest"](rig_path)))
    panels = [(pose, images[pose], False) for pose in POSES]
    panels.append(("stand / mirror 50%", images["stand_3q"], True))
    review_sheet(character, panels, BATCH / "review" / (character + "-review.png"))
    return images["stand_3q"]


def main():
    jobs = json.loads((BATCH / "generation.json").read_bytes())
    with Image.open(CHARACTERS / "bluewhale/stand_3q.webp") as image:
        overview = [("bluewhale", image.convert("RGBA"), False)]
    entries = []
    notes = ["# Art-Batch 10A generation record", "",
             "All PNGs are untouched built-in image_gen outputs with transparent_background enabled. "
             "The tool did not expose the backend model. SHA-256 identifies every accepted input and output.", "",
             "PNG inspection records both nonzero alpha and the alpha 14 visibility threshold. "
             "Runtime black is checked after WebP decoding at every nonzero alpha.", "",
             "## Visual review", "",
             "All five six-panel sheets and the six-character lineup were reviewed. Qwen's cap flower, "
             "Llama's ears and clip, Mistral's hat and fox tail, GPT's horns and rose, and Claude's daisy "
             "and ribbon remain identifiable. All five backs turn away toward the right. All five typing "
             "poses clear the red desk line with both hands. Claude is upright throughout. The accepted "
             "Claude typing master was additionally checked on light and dark backgrounds. Its faint "
             "outer matte falls below the alpha 14 cleanup threshold.", ""]
    for character in MOTION:
        overview.append((character, export_character(character, jobs, entries, notes), False))
    review_sheet("Art-Batch 10A   /   standing lineup", overview, BATCH / "review/batch10a-overview.png")
    phase1["save_json"](BATCH / "manifest.json", entries)
    (BATCH / "PROMPTS.md").write_text("\n".join(notes).rstrip()+"\n", encoding="utf-8", newline="\n")


if __name__ == "__main__":
    main()
