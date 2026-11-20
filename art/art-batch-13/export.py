"""Rebuild Batch 13 from its original PNGs. Requires Pillow, NumPy and SciPy."""
import hashlib
from io import BytesIO
import json
from pathlib import Path
from runpy import run_path
from tempfile import TemporaryDirectory

import numpy as np
from PIL import Image, features

from review import make_sheets


BATCH = Path(__file__).resolve().parent
ROOT = BATCH.parents[1]
PUBLIC = Path("apps/web/public/art")
ARCHIVE = BATCH.relative_to(ROOT)
FURNITURE = PUBLIC / "furniture/catalog.json"
STORY = PUBLIC / "story/catalog.json"
# Batch 11 supplies the edge cleanup, premultiplied resizing, centering and encoder.
furniture = run_path(str(ROOT / "scripts/export-art-batch11.py"))
GROUPS = {
    "client": ("tea-lin", "book-zhou", "tech-yan", "curator-su", "oss-zhe", "vc-lu"),
    "ending": ("independent", "acquired", "open-source", "warm-shop", "paperclip"),
    "world": ("slime", "paper", "castle"),
    "mascot-paperclip": ("idle", "alert"),
    "decor": ("ramen_cart", "bento_board", "book_trolley", "library_owl"),
}
SCENES = {"ending": ((1280, 720), 180000), "world": ((768, 512), 90000)}
STUDIES = ("client-oss-zhe", "world-castle")


def digest(data):
    return {"bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()}


def record(root, path):
    return {"file": path.as_posix(), **digest((root / path).read_bytes())}


def json_bytes(value):
    return (json.dumps(value, indent=2, ensure_ascii=False) + "\n").encode()


def base_furniture():
    current = json.loads((ROOT / FURNITURE).read_bytes())
    legacy = {**current, "decor": [item for item in current["decor"] if item["id"] in furniture["DECOR"]]}
    manifest = json.loads((ROOT / "art/art-batch-11/manifest.json").read_bytes())
    accepted = next(item for item in manifest if item["id"] == "catalog")
    if digest(json_bytes(legacy))["sha256"] != accepted["sha256"]:
        raise ValueError("Existing Batch 11 furniture records differ from the accepted catalog")
    return current


def render_scene(image, group):
    size, limit = SCENES[group]
    # Crop in source coordinates and resample once, preserving proportions.
    aspect = size[0] / size[1]
    width = min(image.width, image.height * aspect)
    height = min(image.height, image.width / aspect)
    x, y = (image.width - width) / 2, (image.height - height) / 2
    box = (x, y, x + width, y + height)
    canvas = image.convert("RGB").resize(size, Image.Resampling.LANCZOS, box=box)
    # WebP's quality/size curve varies with the amount of fine paper grain and foliage.
    low, high = 42, 93
    selected = None
    while low <= high:
        quality = (low + high) // 2
        stream = BytesIO()
        canvas.save(stream, "WEBP", quality=quality, method=6)
        payload = stream.getvalue()
        if len(payload) <= limit:
            selected = payload, quality
            low = quality + 1
        else:
            high = quality - 1
    if selected is None:
        raise ValueError(f"{group} exceeded {limit} bytes")
    payload, quality = selected
    with Image.open(BytesIO(payload)) as decoded:
        assert (decoded.format, decoded.mode, decoded.size) == ("WEBP", "RGB", size)
        return payload, decoded.copy(), {"sourceBox": box, "encoder": {"quality": quality, "method": 6}}


def render_sprite(image, group):
    assert image.mode == "RGBA" and image.getchannel("A").getextrema()[0] == 0
    subject, box = furniture["clean"](image)
    # Generated coverage may peak at 254. Seal near-opaque paint before encoding.
    subject.putalpha(subject.getchannel("A").point(lambda value: 255 if value >= 250 else value))
    if group == "decor":
        scale = min(196 / subject.height, 222 / subject.width)
    else:
        scale = (238 if group == "client" else 218) / max(subject.size)
    sprite = furniture["scaled"](subject, round(subject.width * scale), round(subject.height * scale))
    if group == "decor":
        canvas = furniture["centered"](sprite, (256, 256), 236, use_centroid=True)
    else:
        canvas = Image.new("RGBA", (256, 256))
        canvas.alpha_composite(sprite, ((256 - sprite.width) // 2, (256 - sprite.height) // 2))
    payload, decoded, passes = furniture["encode"](canvas)
    stats = furniture["measurements"](decoded, payload)
    assert stats["visiblePureBlackPixels"] == 0 and stats["alphaRange"] == (0, 255)
    if group == "decor":
        _, top, _, bottom = stats["alphaBounds"]
        columns = np.asarray(decoded.getchannel("A")).sum(axis=0)
        center = float(np.average(np.arange(256), weights=columns))
        assert bottom == 237 and 170 <= bottom - top <= 198 and abs(center - 128) <= 0.5
        stats.update(feet=[128, 236], visibleHeight=bottom - top, alphaCentroidX=center)
    return payload, decoded, {"sourceBox": box, "encoder": {"quality": 88, "method": 6, "warmInkPasses": passes},
                              **stats}


def export(stage):
    catalog = base_furniture()
    story, assets, images = [], [], {}
    for group, names in GROUPS.items():
        for name in names:
            key = f"{group}-{name}"
            directory = "furniture" if group == "decor" else "story"
            path = PUBLIC / directory / (key + ".webp")
            master_path = ARCHIVE / "masters" / (key + ".png")
            with Image.open(ROOT / master_path) as image:
                assert image.format == "PNG"
                master = dict(**record(ROOT, master_path), width=image.width, height=image.height, mode=image.mode)
                if key in STUDIES:
                    master["editedFrom"] = (ARCHIVE / "studies" / (key + ".png")).as_posix()
                elif group == "client" and name != "tea-lin":
                    master["editedFrom"] = (ARCHIVE / "masters/client-tea-lin.png").as_posix()
                elif key == "mascot-paperclip-alert":
                    master["editedFrom"] = (ARCHIVE / "masters/mascot-paperclip-idle.png").as_posix()
                payload, decoded, details = render_scene(image, group) if group in SCENES else render_sprite(image, group)
            images[key] = decoded
            runtime = {"file": path.as_posix(), "width": decoded.width, "height": decoded.height,
                       "mode": decoded.mode, **digest(payload), **details}
            (stage / path).parent.mkdir(parents=True, exist_ok=True)
            (stage / path).write_bytes(payload)
            assets.append({"id": key, "master": master, "runtime": runtime})
            if group == "decor":
                item = {"id": key, "file": path.name, **{k: runtime[k] for k in
                        ("feet", "visibleHeight", "alphaCentroidX", "alphaBounds", "sha256", "bytes")}}
                # Update our own previous export in place and retain independently appended props.
                pos = next((i for i, old in enumerate(catalog["decor"]) if old["id"] == key), len(catalog["decor"]))
                catalog["decor"][pos:pos + 1] = [item]
            else:
                item = {k: v for k, v in runtime.items() if k not in ("file", "sourceBox", "encoder")}
                story.append({"id": key, "file": path.name, **item})
    (stage / STORY).write_bytes(json_bytes({"schemaVersion": 1, "assets": story}))
    (stage / FURNITURE).write_bytes(json_bytes(catalog))
    review = ARCHIVE / "review"
    (stage / review).mkdir(parents=True)
    make_sheets(images, ROOT / PUBLIC, stage / review)
    manifest = {
        "batch": 13, "generator": "built-in image_gen", "model": "not exposed by the tool",
        "source": "Original game artwork generated for this commission. Per-image prompts and reference roles in PROMPTS.md.",
        "usage": "Commissioned for distribution as part of Out of Tokens.",
        "encoderVersions": {"pillow": Image.__version__, "libwebp": features.version("webp")},
        "assets": assets, "catalogs": [record(stage, path) for path in (STORY, FURNITURE)],
        "studies": [record(ROOT, ARCHIVE / "studies" / (key + ".png")) for key in STUDIES],
        "reviews": [record(stage, path.relative_to(stage)) for path in sorted((stage / review).glob("*.png"))],
    }
    (stage / ARCHIVE / "manifest.json").write_bytes(json_bytes(manifest))
    print(f"Verified {len(assets)} WebPs, {sum(a['runtime']['bytes'] for a in assets):,} bytes")


if __name__ == "__main__":
    # A bad source or budget fails before either public catalog is replaced.
    with TemporaryDirectory() as temp:
        stage = Path(temp)
        export(stage)
        for file in sorted(stage.rglob("*")):
            if file.is_file():
                target = ROOT / file.relative_to(stage)
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(file.read_bytes())
