"""Build the expansion artwork, catalog and review sheets from the archived PNGs."""
from io import BytesIO
from pathlib import Path
from runpy import run_path
import sys

import numpy as np
from PIL import Image, ImageFilter, features

from review import make_sheets

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "scripts"))
from art_archive import ROOT, digest, publish, record, write_json

ARCHIVE = Path("art/art-batch-14")
PUBLIC = Path("apps/web/public/art/expansion")
GROUPS = {
    "outcome": ("pitch-demo", "code-ops", "release-night", "crisis-429", "museum-media", "open-dawn"),
    "software": ("rag", "vllm", "autotest", "multiagent", "versioncontrol", "tokenbank", "prompt", "remote"),
    "vignette": ("chapter-clear", "duo-tea", "crisis-429"),
    "world": ("town-map",),
}
SPECS = {"outcome": ((768, 512), 95000), "software": ((128, 128), 18000),
         "vignette": ((960, 320), 95000), "world": ((1280, 720), 185000)}
# Pixel centers measured on the exported 1280 x 720 image, in top-left coordinates.
PIN_PIXELS = {"workshop": (380, 496), "canteen": (560, 222),
              "library": (1021, 194), "expedition": (1004, 476)}
sprites = run_path(str(ROOT / "scripts/export-art-batch9.py"))


def scene(image, size, budget):
    width = min(image.width, image.height * size[0] / size[1])
    height = width * size[1] / size[0]
    left, top = (image.width - width) / 2, (image.height - height) / 2
    box = (left, top, left + width, top + height)
    canvas = image.convert("RGB").resize(size, Image.Resampling.LANCZOS, box=box)
    # Fine foliage and paper grain compete for bits at map scale. Prefilter subpixel detail.
    radius = 0.65 if size == (1280, 720) else 0
    if radius:
        canvas = canvas.filter(ImageFilter.GaussianBlur(radius))
    # Highest passing quality on the discrete ladder. Keep the per-file choice reproducible.
    for quality in (92, 89, 86, 83, 80, 77, 74, 70, 65, 60, 55, 50):
        stream = BytesIO()
        canvas.save(stream, "WEBP", quality=quality, method=6)
        data = stream.getvalue()
        if len(data) <= budget:
            with Image.open(BytesIO(data)) as decoded:
                return data, decoded.copy(), {"sourceBox": box, "prefilterRadius": radius, "quality": quality}
    raise ValueError(f"Scene exceeds {budget} bytes")


def icon(image):
    assert image.mode == "RGBA" and image.getchannel("A").getextrema()[0] == 0
    item, box = sprites["clean"](image)
    item.putalpha(item.getchannel("A").point(lambda value: 255 if value >= 250 else value))
    scale = 103 / max(item.size)
    item = sprites["scaled"](item, round(item.width * scale), round(item.height * scale))
    canvas = Image.new("RGBA", (128, 128))
    canvas.paste(item, ((128 - item.width) // 2, (128 - item.height) // 2))
    data, decoded, passes = sprites["encode"](canvas)
    return data, decoded, {"sourceBox": box, "quality": 88, "warmInkPasses": passes}


def export(stage):
    """Rebuild 18 expansion assets from their independent PNG masters."""
    (stage / PUBLIC).mkdir(parents=True)
    images, assets, entries = {}, [], []
    pins = {key: {"x": x / 1280, "y": y / 720} for key, (x, y) in PIN_PIXELS.items()}
    for category, names in GROUPS.items():
        size, budget = SPECS[category]
        for name in names:
            key = f"{category}-{name}"
            master = ARCHIVE / "masters" / (key + ".png")
            with Image.open(ROOT / master) as source:
                assert source.format == "PNG", key
                source_info = dict(**record(ROOT, master), width=source.width, height=source.height, mode=source.mode)
                data, decoded, encoder = icon(source) if category == "software" else scene(source, size, budget)
            assert decoded.size == size and len(data) <= budget, key
            assert decoded.mode == ("RGBA" if category == "software" else "RGB"), key
            images[key] = decoded
            path = PUBLIC / (key + ".webp")
            (stage / path).write_bytes(data)
            entry = dict(id=key, category=category, file=path.name, width=size[0], height=size[1],
                         mode=decoded.mode, **digest(data))
            pixels = np.asarray(decoded)
            black = np.all(pixels[:, :, :3] == 0, axis=2)
            if category == "software":
                alpha = decoded.getchannel("A")
                l, t, r, b = alpha.getbbox()
                assert alpha.getextrema() == (0, 255) and min(l, t, 128 - r, 128 - b) >= 8, key
                entry.update(alphaRange=alpha.getextrema(), alphaBounds=(l, t, r, b))
                black &= pixels[:, :, 3] > 0
            assert not black.any(), key
            entry["visiblePureBlackPixels"] = 0
            if category == "world":
                entry["mapPins"] = pins
            entries.append(entry)
            assets.append({"id": key, "master": source_info,
                           "runtime": {**entry, "file": path.as_posix(), "encoder": {"method": 6, **encoder}}})
    catalog = PUBLIC / "catalog.json"
    write_json(stage / catalog, {"schemaVersion": 1, "assets": entries})
    review = ARCHIVE / "review"
    (stage / review).mkdir(parents=True)
    make_sheets(images, GROUPS, pins, ROOT / PUBLIC.parent / "upgrades", stage / review)
    write_json(stage / ARCHIVE / "manifest.json", {
        "batch": "14", "generator": "built-in image_gen", "usage": "Commissioned for Out of Tokens.",
        "encoderVersions": {"pillow": Image.__version__, "libwebp": features.version("webp")},
        "assets": assets, "catalog": record(stage, catalog),
        "reviews": [record(stage, p.relative_to(stage)) for p in sorted((stage / review).glob("*.png"))],
    })
    print(f"{len(entries)} expansion WebPs, {sum(item['bytes'] for item in entries)} bytes")


if __name__ == "__main__":
    publish(export)
