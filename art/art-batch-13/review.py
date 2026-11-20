"""Visual proofs made from the decoded, published WebPs at their native aspect ratios."""
from PIL import Image, ImageDraw, ImageFont, ImageOps


PAPER = "#f4eddf"
INK = "#473426"
MUTED = "#715e4b"
DARK = "#403b3b"
LIGHT = "#fff7e6"
RULE = "#cbbb9f"
RESAMPLE = Image.Resampling.LANCZOS
TITLE = ImageFont.load_default(size=34)
LABEL = ImageFont.load_default(size=21)
SMALL = ImageFont.load_default(size=16)


def text(image, xy, value, font=LABEL, fill=INK):
    ImageDraw.Draw(image).text(xy, value, font=font, fill=fill)


def heading(image, title, note):
    text(image, (24, 12), title, TITLE)
    text(image, (26, 59), note, SMALL, MUTED)
    ImageDraw.Draw(image).line((24, 87, image.width - 24, 87), fill=RULE)


def fit(image, src, rect):
    x, y, w, h = rect
    fitted = ImageOps.contain(src, (w, h), method=RESAMPLE)
    position = (x + (w - fitted.width) // 2, y + (h - fitted.height) // 2)
    image.paste(fitted, position, fitted.getchannel("A") if fitted.mode == "RGBA" else None)


def clients(images, public, dest):
    sheet = Image.new("RGB", (1560, 668), PAPER)
    heading(sheet, "Recurring clients", "Dialogue portraits     /     Legacy and watercolor redraws at equal scale")
    names = {"tea-lin": "Lin", "book-zhou": "Zhou", "tech-yan": "Yan", "curator-su": "Su",
             "oss-zhe": "Zhe", "vc-lu": "Lu"}
    draw = ImageDraw.Draw(sheet)
    draw.rectangle((0, 358, 1199, 667), fill="#eee1cb")
    draw.rectangle((1200, 88, 1559, 667), fill="#e0d9cf")
    text(sheet, (25, 107), "Previous portraits", LABEL)
    text(sheet, (25, 368), "Watercolor redraws", LABEL)
    for i, (name, label) in enumerate(names.items()):
        x = 18 + i * 196
        key = "client-" + name
        with Image.open(public / "living" / (key + ".webp")) as old:
            fit(sheet, old, (x, 153, 184, 184))
        fit(sheet, images[key], (x, 405, 184, 184))
        text(sheet, (x + 12, 610), label)
        # Small dialogue read at actual 48 px beside each name.
        fit(sheet, images[key], (x + 114, 600, 48, 48))
    text(sheet, (1220, 107), "Bluewhale", LABEL)
    text(sheet, (1220, 141), "Current studio portrait", SMALL, MUTED)
    with Image.open(public / "portraits/base/bluewhale.webp") as bluewhale:
        fit(sheet, bluewhale, (1207, 174, 346, 474))
    sheet.save(dest / "clients-review.png")


def scenes(images, dest):
    canvas = Image.new("RGB", (1536, 1300), PAPER)
    heading(canvas, "Endings and expeditions", "Five cinematic stills at 16:9     /     Three expedition cards at 3:2")
    layout = [
        ("ending-independent", "Independent listing", 24, 103, 736, 414),
        ("ending-acquired", "Acquisition", 776, 103, 736, 414),
        ("ending-open-source", "Open source", 24, 575, 480, 270),
        ("ending-warm-shop", "The little shop", 528, 575, 480, 270),
        ("ending-paperclip", "Paperclips", 1032, 575, 480, 270),
    ]
    # Give the two rows of endings and the expedition row their full native proportions.
    for key, label, x, y, w, h in layout:
        fit(canvas, images[key], (x, y, w, h))
        text(canvas, (x, y + h + 7), label)
    for i, (key, label) in enumerate((("world-slime", "Crystal workshop"), ("world-paper", "Origami archive"),
                                      ("world-castle", "Clockwork castle"))):
        x = 24 + i * 504
        fit(canvas, images[key], (x, 910, 480, 320))
        text(canvas, (x, 1239), label)
    canvas.save(dest / "endings-worlds-review.png")


def room_preview(public, images, room, props, pose):
    size = (728, 410)
    with Image.open(public / (room + ".webp")) as source:
        scene = ImageOps.fit(source.convert("RGBA"), size, method=RESAMPLE)
    # Place each pin at its actual floor pivot. Both objects share a floor plane with the room.
    for key, x, y, side in props:
        sprite = images[key].resize((side, side), RESAMPLE)
        scene.alpha_composite(sprite, (x - side // 2, y - round(236 * side / 256)))
    guide = images["mascot-paperclip-" + pose].resize((81, 81), RESAMPLE)
    scene.alpha_composite(guide, (size[0] - 90, 9))
    return scene


def props_and_mascots(images, public, dest):
    sheet = Image.new("RGB", (1536, 948), PAPER)
    heading(sheet, "Paperclip guide and room props", "Two expression states and four floor props on warm paper, dark walnut and the current room paintings")
    items = [("mascot-paperclip-idle", "Guide / idle"), ("mascot-paperclip-alert", "Guide / alert"),
             ("decor-ramen_cart", "Soup cart"), ("decor-bento_board", "Bento board"),
             ("decor-book_trolley", "Book trolley"), ("decor-library_owl", "Library owl")]
    for i, (key, label) in enumerate(items):
        x = 24 + i * 248
        text(sheet, (x + 9, 97), label)
        for j, color in enumerate(("#fcf4df", DARK)):
            y = 132 + j * 158
            ImageDraw.Draw(sheet).rectangle((x, y, x + 239, y + 151), fill=color)
            fit(sheet, images[key], (x, y, 240, 152))
    rooms = [
        ("canteen", "Canteen", "idle", [("decor-ramen_cart", 163, 350, 152), ("decor-bento_board", 539, 369, 129)]),
        ("library", "Library", "alert", [("decor-book_trolley", 177, 352, 151), ("decor-library_owl", 549, 370, 119)]),
    ]
    for i, (room, label, pose, props) in enumerate(rooms):
        x = 24 + i * 760
        text(sheet, (x, 465), label)
        sheet.paste(room_preview(public, images, room, props, pose).convert("RGB"), (x, 505))
    sheet.save(dest / "mascot-decor-review.png")


def make_sheets(images, public, dest):
    clients(images, public, dest)
    scenes(images, dest)
    props_and_mascots(images, public, dest)
