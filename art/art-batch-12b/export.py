"""Export the six 12B sets and the twelve-partner comparison from archived RGBA masters."""
import hashlib
import json
from pathlib import Path
from runpy import run_path
from shutil import copyfile
from tempfile import TemporaryDirectory
from types import SimpleNamespace

from PIL import Image, ImageDraw

BATCH = Path(__file__).resolve().parent
ROOT = BATCH.parents[1]
PUBLIC = ROOT / "apps/web/public/art/portraits"
# Use the accepted renderer, encoder and pixel measurements without running the 12A export.
batch12a = SimpleNamespace(**run_path(str(ROOT / "scripts/export-art-batch12a.py")))
TIERS = ("base", "flagship", "avatar")
DISPLAY = {"kimi": "Kimi", "gemini": "Gemini", "grok": "Grok", "glm": "GLM",
           "minimax": "MiniMax", "seedance": "Seedance", "gpt": "GPT"}


def historical_catalog(new_ids):
    previous = json.loads((ROOT / "art/art-batch-12a/manifest.json").read_bytes())
    catalog = json.loads((PUBLIC / "catalog.json").read_bytes())
    current = catalog["characters"]
    if set(current) - previous["masters"].keys() - new_ids:
        raise ValueError("Unrecognized entries in the live portrait catalog")
    catalog["characters"] = {key: current[key] for key in previous["masters"]}
    data = (json.dumps(catalog, indent=2, ensure_ascii=False) + "\n").encode()
    if hashlib.sha256(data).hexdigest() != previous["catalog"]["sha256"]:
        raise ValueError("The six accepted 12A catalog entries have changed")
    return catalog


def render_tier(stage, character, tier, marks, references):
    path = BATCH / "masters" / character / (tier + ".png")
    record = batch12a.file_record(path)
    if record["sha256"] != marks["sha256"]:
        raise ValueError(f"Master digest mismatch: {path}")
    if previous := marks.get("editedFrom"):
        study = batch12a.file_record(ROOT / previous["file"])
        if study["sha256"] != previous["sha256"]:
            raise ValueError(f"Edit source digest mismatch: {study['file']}")
        record["editedFrom"] = dict(**study, sourceFile=previous["sourceFile"], references=references)
        references = [*references[:-1], study]
    if guide := marks.get("attachmentGuide"):
        attachment = batch12a.file_record(ROOT / guide["file"])
        if attachment["sha256"] != guide["sha256"]:
            raise ValueError(f"Style guide digest mismatch: {attachment['file']}")
        record["attachmentGuide"] = attachment
    with Image.open(path) as master:
        assert (master.format, master.mode, master.getchannel("A").getextrema()) == ("PNG", "RGBA", (0, 255))
        record.update(method="built-in image_gen", sourceFile=marks["sourceFile"], references=references,
                      width=master.width, height=master.height, alphaRange=(0, 255),
                      alphaBounds=master.getchannel("A").getbbox())
        painting = batch12a.clean_edges(master)
    if tier == "avatar":
        square, landmarks = batch12a.square_at_eyes(painting, marks, (0.5, 0.465))
        # One additional pixel of optical clearance protects the tighter 12B four-edge gate.
        side = 254
        canvas = Image.new("RGBA", batch12a.AVATAR)
        canvas.paste(batch12a.resized(square, (side, side)), (1, 1))
        landmarks = batch12a.map_landmarks(landmarks, (0, 0), (side / square.width,) * 2, (1, 1))
    else:
        canvas, landmarks = batch12a.frame_portrait(painting, marks)
    image, entry, runtime = batch12a.export_webp(stage, character, tier, canvas, landmarks, record)
    if tier == "avatar":
        left, top, right, bottom = entry["alphaBounds"]
        assert min(left, top, 256 - right, 256 - bottom) >= 12, (character, entry["alphaBounds"])
    return record, image, entry, runtime


def name(character):
    return DISPLAY.get(character, character.capitalize())


def personal_sheet(character, item, images, review):
    sheet = Image.new("RGB", (1450, 646), batch12a.PAPER)
    draw = ImageDraw.Draw(sheet)
    draw.rectangle((0, 0, 230, 645), fill="#eaddcd")
    draw.rectangle((625, 0, 1020, 645), fill=batch12a.WALNUT)
    batch12a.label(sheet, (18, 15), name(character), 29)
    batch12a.label(sheet, (18, 57), "Lobby design", 18)
    batch12a.fit(sheet, batch12a.reference(item["lobbySheet"]), (12, 96, 207, 450))
    draw.rounded_rectangle((21, 582, 50, 603), radius=5, fill=item["themeColor"])
    batch12a.label(sheet, (62, 581), item["themeColor"], 16)
    for i, (tier, x, ink) in enumerate((("base", 232, batch12a.INK), ("flagship", 626, batch12a.LIGHT))):
        batch12a.label(sheet, (x + 16, 15), ("Studio Everyday", "High-Spec Awakened")[i], 23, ink)
        batch12a.label(sheet, (x + 17, 52), item["versions"][i], 18, ink)
        batch12a.fit(sheet, images[tier], (x + 6, 77, 380, 554))
    avatar = images["avatar"]
    batch12a.label(sheet, (1040, 15), "Avatar", 25)
    batch12a.label(sheet, (1041, 53), "256 px", 17)
    sheet.paste(avatar, (1109, 100), avatar)
    for n, (ground, ink) in enumerate(((batch12a.PAPER, batch12a.INK), (batch12a.WALNUT, batch12a.LIGHT))):
        x = 1021 + n * 214
        draw.rectangle((x, 408, x + 214, 645), fill=ground)
        batch12a.label(sheet, (x + 15, 426), ("Warm paper", "Dark walnut")[n], 17, ink)
        for size, offset in ((48, 32), (32, 130)):
            thumb = avatar.resize((size, size), batch12a.LANCZOS)
            sheet.paste(thumb, (x + offset, 490 + (48 - size) // 2), thumb)
            batch12a.label(sheet, (x + offset - 2, 557), f"{size} px", 15, ink)
    sheet.save(review / f"{character}-review.png")


def overview(sets, layouts, review):
    cell, row, header = 250, 330, 50
    block = header + row * 2
    sheet = Image.new("RGB", (len(sets) * cell, 2 * block), batch12a.PAPER)
    draw = ImageDraw.Draw(sheet)
    for index, (ground, ink, title) in enumerate(((batch12a.PAPER, batch12a.INK, "Warm paper"), (batch12a.WALNUT, batch12a.LIGHT, "Dark walnut"))):
        y = index * block
        draw.rectangle((0, y, sheet.width, y + block - 1), fill=ground)
        batch12a.label(sheet, (16, y + 11), f"Art-Batch 12B    /    {title}", 24, ink)
        batch12a.label(sheet, (966, y + 14), "Studio Everyday above    /    High-Spec Awakened below", 17, ink)
        for col, (character, images) in enumerate(sets.items()):
            for i, tier in enumerate(("base", "flagship")):
                top = y + header + i * row
                batch12a.label(sheet, (col * cell + 16, top + 1), layouts[character]["versions"][i], 18, ink)
                batch12a.fit(sheet, images[tier], (col * cell + 4, top + 24, cell - 8, row - 27))
    sheet.save(review / "batch12b-overview.png")


def lineup(catalog, sets, review):
    cell, side, band, grid_row = 206, 26, 360, 151
    width = 2 * side + 12 * cell
    sheet = Image.new("RGB", (width, band * 2 + 68 + 2 * grid_row), batch12a.PAPER)
    draw = ImageDraw.Draw(sheet)
    for col, (character, entries) in enumerate(catalog["characters"].items()):
        if character in sets:
            images = sets[character]
        else:
            images = {}
            for tier in TIERS:
                with Image.open(PUBLIC / entries[tier]["path"]) as image:
                    images[tier] = image.convert("RGBA")
        for i, tier in enumerate(("base", "flagship")):
            top = i * band
            ink = (batch12a.INK, batch12a.LIGHT)[i]
            if col == 0:
                draw.rectangle((0, top, width - 1, top + band - 1), fill=(batch12a.PAPER, batch12a.WALNUT)[i])
                batch12a.label(sheet, (side, top + 10), ("Studio Everyday", "High-Spec Awakened")[i], 28, ink)
                for x, text in ((3 * cell, "Art-Batch 12A"), (9 * cell, "Art-Batch 12B")):
                    batch12a.label(sheet, (x, top + 16), text, 18, ink)
                draw.line((side + 6 * cell, top + 13, side + 6 * cell, top + band - 8), fill="#ac947e")
            x = side + col * cell
            batch12a.label(sheet, (x + 10, top + 56), name(character), 18, ink)
            batch12a.fit(sheet, images[tier], (x + 2, top + 78, cell - 4, band - 82))
        row, column = divmod(col, 6)
        top = 2 * band + 62 + row * grid_row
        x = side + column * cell * 2
        if col == 0:
            batch12a.label(sheet, (side, 2 * band + 14), "Avatars", 28)
        batch12a.fit(sheet, images["avatar"], (x + 9, top, 145, 145))
        batch12a.label(sheet, (x + 169, top + 57), name(character), 22)
    sheet.save(review / "all-12-portraits-lineup.png")


def build(stage):
    layout = json.loads((BATCH / "composition.json").read_bytes())
    characters = layout["characters"]
    catalog = historical_catalog(characters.keys())
    style_inputs = [batch12a.file_record(ROOT / path) for path in layout["bluewhaleGuide"]["inputs"]]
    manifest = dict(schemaVersion=1, tool="built-in image_gen", model="not exposed",
                    parameters=dict(transparent_background=True),
                    license="User-authorized generation for Out of Tokens; no separate license supplied.",
                    masters={}, runtime=[])
    sets = {}
    review = batch12a.staged_path(stage, BATCH / "review")
    review.mkdir()
    for character, item in characters.items():
        entries, masters, images = {}, {}, {}
        lobby = batch12a.file_record(ROOT / item["lobbySheet"])
        for tier in TIERS:
            refs = [layout["styleReference"], *style_inputs[:2 if tier == "base" else 3],
                    item["originalDesign"], lobby]
            if tier != "base":
                refs.append(batch12a.file_record(BATCH / "masters" / character / "base.png"))
            masters[tier], images[tier], entries[tier], runtime = render_tier(
                stage, character, tier, item[tier], refs)
            manifest["runtime"].append(runtime)
        manifest["masters"][character] = masters
        catalog["characters"][character] = entries
        sets[character] = images
        personal_sheet(character, item, images, review)
    overview(sets, characters, review)
    lineup(catalog, sets, review)
    catalog_path = PUBLIC / "catalog.json"
    pending_catalog = batch12a.staged_path(stage, catalog_path)
    batch12a.save_json(pending_catalog, catalog)
    manifest["catalog"] = batch12a.file_record(pending_catalog, catalog_path)
    batch12a.save_json(batch12a.staged_path(stage, BATCH / "manifest.json"), manifest)
    return manifest


def main():
    # Validate all six sets before replacing any output. Atomic sibling swaps also
    # avoid inheriting the private ACL of the temporary staging directory on Windows.
    with TemporaryDirectory(prefix=".export-", dir=BATCH) as temp:
        stage = Path(temp)
        manifest = build(stage)
        for path in sorted(stage.rglob("*"), key=lambda p: (p.suffix == ".json", p)):
            if path.is_file():
                target = ROOT / path.relative_to(stage)
                target.parent.mkdir(parents=True, exist_ok=True)
                sibling = target.with_name(target.name + stage.name + ".tmp")
                try:
                    copyfile(path, sibling)
                    sibling.replace(target)
                finally:
                    sibling.unlink(missing_ok=True)
    print(f"{len(manifest['runtime'])} WebPs, {sum(row['bytes'] for row in manifest['runtime']):,} bytes")


if __name__ == "__main__":
    main()
