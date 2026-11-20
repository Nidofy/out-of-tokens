"""Contact sheets assembled from decoded runtime pixels."""
from PIL import Image, ImageDraw, ImageFont

PAPER, INK, DARK = "#f5eddf", "#493222", "#45352d"
LABEL = ImageFont.load_default(size=20)
SMALL = ImageFont.load_default(size=16)
LARGE = ImageFont.load_default(size=32)
LANCZOS = Image.Resampling.LANCZOS


def label(canvas, xy, value, font=LABEL, color=INK):
    ImageDraw.Draw(canvas).text(xy, value, font=font, fill=color)


def scenes(images, groups, dest):
    sheet = Image.new("RGB", (1264, 1280), PAPER)
    label(sheet, (20, 12), "Deliveries and milestones", LARGE)
    for i, name in enumerate(groups["outcome"]):
        x, y = 20 + (i % 3) * 412, 60 + (i // 3) * 306
        sheet.paste(images["outcome-" + name].resize((402, 268), LANCZOS), (x, y))
        label(sheet, (x, y + 272), name)
    label(sheet, (20, 674), "Original banner", LABEL)
    label(sheet, (650, 674), "Title placement proof", LABEL)
    for i, (name, title) in enumerate(zip(groups["vignette"], ("Chapter clear", "Tea for two", "Capacity alert"))):
        # Exact 3:1 previews; the right-hand title is added only to this proof.
        preview = images["vignette-" + name].resize((552, 184), LANCZOS)
        y = 704 + i * 189
        sheet.paste(preview, (20, y))
        sheet.paste(preview, (650, y))
        label(sheet, (670, y + 72), title, LARGE, "#fff9e8" if i == 2 else "#402a1c")
    sheet.save(dest / "outcomes-vignettes-review.png")


def icons(images, names, upgrades, dest):
    legacy = ("mcp", "tools", "monitor", "explain", "messenger")
    sheet = Image.new("RGB", (1390, 918), PAPER)
    label(sheet, (20, 10), "Software inventory", LARGE)
    label(sheet, (20, 52), "128 px and 48 px on paper and walnut", SMALL)
    for row, (title, ids, old) in enumerate((("Expansion", names[:4], False),
                                              ("Expansion", names[4:], False),
                                              ("Existing upgrades", legacy, True))):
        top = 83 + row * 276
        label(sheet, (18, top), title)
        for col, name in enumerate(ids):
            if old:
                with Image.open(upgrades / ("software-" + name + ".webp")) as original:
                    item = original.convert("RGBA")
            else:
                item = images["software-" + name]
            x = 18 + col * 274
            label(sheet, (x + 6, top + 27), name, SMALL)
            small = item.resize((48, 48), LANCZOS)
            for i, color in enumerate(("#f9f0db", DARK)):
                tile = Image.new("RGBA", (132, 192), color)
                tile.alpha_composite(item, (2, 4))
                tile.alpha_composite(small, (42, 138))
                sheet.paste(tile.convert("RGB"), (x + i * 133, top + 54))
    sheet.save(dest / "software-icons-review.png")


def town(image, pins, dest):
    sheet = Image.new("RGB", (1312, 1562), PAPER)
    label(sheet, (16, 8), "Creative campus", LARGE)
    sheet.paste(image, (16, 54))
    overlay = image.copy()
    draw = ImageDraw.Draw(overlay)
    for name, point in pins.items():
        x, y = round(point["x"] * image.width), round(point["y"] * image.height)
        draw.ellipse((x-13, y-13, x+13, y+13), outline="white", width=5)
        for color, width in (("white", 5), ("#aa2535", 2)):
            draw.line((x-23, y, x+23, y), fill=color, width=width)
            draw.line((x, y-23, x, y+23), fill=color, width=width)
        caption = f"{name}  ({x}, {y})"
        bounds = draw.textbbox((x+25, y+6), caption, font=SMALL)
        draw.rectangle((bounds[0]-3, bounds[1]-3, bounds[2]+3, bounds[3]+3), fill=PAPER)
        draw.text((x+25, y+6), caption, fill=INK, font=SMALL)
    label(sheet, (16, 789), "Landmark centers in the 1280 x 720 runtime image", LABEL)
    sheet.paste(overlay, (16, 827))
    sheet.save(dest / "town-map-review.png")


def make_sheets(images, groups, pins, upgrades, dest):
    scenes(images, groups, dest)
    icons(images, groups["software"], upgrades, dest)
    town(images["world-town-map"], pins, dest)
