# Art-Batch 13 生成记录

本批插画按项目委托使用内置 image_gen 生成，用于《Out of Tokens》游戏资产。选用的原始 PNG 逐张归档于 `masters/`。工具未返回后端模型版本或随机种子。可复现导出从归档母版开始，逐文件的尺寸、模式、SHA256、字节数、裁切范围及 WebP 编码参数见 [manifest.json](manifest.json)。

绘制前对照了项目的 Bluewhale 日常立绘、车库、食堂、图书馆、仪式舞台背景，以及第 11 批的工作室猫和龟背竹。旧客户头像用于新旧对照拼版。五张客户变体绑定林姐原图，一张吉祥物变体绑定闲置表情原图，其余项目按文字委托独立生成。引用的源图均属于本项目。

## 如何还原每次请求

每次提交一张图片。提示词为该类别的共用段、对应单图段，以及有绑定原图时的编辑段，按此顺序用单个换行连接。下列英文均为实际提交的文本。圆章、吉祥物和摆件使用 `transparent_background=true`，结局与远征使用 `false`。原始文件名列在每项下方，方便与工具输出逐字节比对。

## 客户圆章

**共用段**

```text
Use case: illustration-story. Square dialogue portrait for a warm East Asian hand-painted studio game. Make a single perfectly circular medallion, exactly centered and fully visible, unbroken very thin double rim of hand-inked pale cream and antique gold, restrained and plain. Inside: large chest-up anime face occupying the upper middle, readable at 64 px, shoulders and all props neatly clipped INSIDE the rim. Delicate walnut #4A3123 linework, clean expressive animation facial shapes, soft two-tone cel shadows and warm luminous Japanese watercolor/gouache washes on paper. Mature face proportions as specified; no photographic detail, western oil portrait, or 3D. Soft interior light only. Transparent PNG outside the circle extending cleanly to all four edges, small uniform transparent margin (6–9%), no white matte or cast shadow. No letters, words, numbers, insignia, watermark or captions.
```

**绑定原图时使用的编辑段**

```text
Edit the attached dialogue medallion into this NEW character portrait. Preserve the reference badge diameter, double gold rim, centered chest-up scale, warm Japanese animation watercolor pencil handling, facial vocabulary and transparent exterior. Fully replace the tea seller, her hairstyle, kerchief, apron and tea with the subject described here; retain no tea-seller accessories or tea leaves. The reference supplies framing and style.
```

### client-tea-lin

工具原图为 `exec-e9771776-dbff-43cc-8250-2d1d54168738.png`。独立生成。

```text
Lin, a kind, capable East Asian tea-shop owner about thirty. Chestnut hair in a soft bun tied with a sage-green kerchief, a beige linen apron, cradling a little cup of hot amber tea in both hands. Open warm smile, eyes on the viewer; suggest pale fresh tea leaves in the disc wash.
```

### client-book-zhou

工具原图为 `exec-e324c087-79a5-4ff4-804a-3b9b315aa411.png`。绑定本批 `masters/client-tea-lin.png`。

```text
Zhou, an East Asian secondhand bookseller around fifty, cultured, approachable, with softly unruly grey-streaked curls, round amber spectacles, gentle creased eyes, a camel chunky-knit sweater. He hugs a small worn clothbound hardcover with no lettering to his chest. A muted honey-brown wash suggests his bookshop.
```

### client-tech-yan

工具原图为 `exec-8e305f1d-4cfb-47e3-8fc3-29c2c1536d9c.png`。绑定本批 `masters/client-tea-lin.png`。

```text
Yan, an independent East Asian technology founder in his early thirties, neatly cropped dark hair, fine wire-frame glasses, navy casual suit jacket over a plain white T-shirt. One hand holds the side of an unbranded slim tablet against his chest, its back facing us. Quiet resolve and an observant steady gaze. Pale blue-and-honey interior wash.
```

### client-curator-su

工具原图为 `exec-119cfae2-64f8-4d4f-a9b5-81497bb32c4c.png`。绑定本批 `masters/client-tea-lin.png`。

```text
Su, an East Asian art museum curator about thirty-five. Dark hair pulled into a low ponytail, ivory trench coat with a caramel scarf, small pearl stud earrings. In a graceful three-quarter turn she looks back towards us with composure and a knowing, kind smile. A luminous muted peach gallery wash.
```

### client-oss-zhe

初稿工具原图为 `exec-41a2367b-825c-4b5d-861c-730e2fcb515e.png`。绑定本批 `masters/client-tea-lin.png`。该次输出归档于 `studies/client-oss-zhe.png`，定稿见文末的目检修订。

```text
Zhe, a sunny East Asian open-source community maintainer in his twenties, tousled short dark hair, headphones visibly resting around his neck, a charcoal hoodie. Candid open grin with bright, friendly eyes. Pale ochre and muted teal workshop light behind him within the circle.
```

### client-vc-lu

工具原图为 `exec-e41feb4e-fc8d-46da-8cad-6335fb1eb378.png`。绑定本批 `masters/client-tea-lin.png`。

```text
Lu, a capable and elegant East Asian woman investor about forty. A crisp straight shoulder-length bob, warm grey tailored suit and a small softly patterned silk neck scarf. A warm yet perceptive gaze, mature features and a restrained smile. Pale apricot light inside the circle.
```

## 结局 CG

**共用段**

```text
Use case: illustration-story. Full-bleed 16:9 landscape ending still for a hand-painted Japanese slice-of-life animation game; wide single shot, no borders. Design for 1280x720. Carefully observed timber, warm brown pencil details, layered transparent watercolor and gouache, confident hand-drawn perspective, lucid shadows and rich color separation, believable human scale, atmospheric depth. Compose the key narrative details inside the central 82% for a gentle widescreen trim. Restrained everyday physical detail, a distinct foreground motif, stillness after a long story. No lettering, writing, numbers, branding, UI, captions or watermarks anywhere, including books and signage.
```

### ending-independent

工具原图为 `exec-7621223f-99d5-4351-94dc-3e0d396feffc.png`。独立生成。

```text
Independently going public. A rooftop terrace at rose-gold sunrise, seen from just outside a warmly lit glass-walled studio. In the near left a wood table with mugs of hot tea and an unmarked notebook, further off a handful of young teammates as distinct backlit figures, backs to us, looking out at the golden city skyline. One plain warm-white flag with a fine gold hem billows in the morning breeze. Give sky, people, and flag breathing room. Joy that feels earned.
```

### ending-acquired

工具原图为 `exec-def38163-44d1-4d3c-8fe3-ed75dd60f46e.png`。独立生成。

```text
Acquired by a large firm. Low, intimate perspective from the edge of a pale oak desk in a bright minimalist high-rise glass office at dusk. The near wooden drawer is partly open; inside, unmistakable focal objects: a worn handmade wooden name badge, completely unlettered with a little etched outline of a garage roof, its faded warm coral lanyard curling around a single round copper pin. Tall blue-grey windows and the city lights coming on behind; let a last strip of amber sunlight touch the little keepsakes. Quiet bittersweet memory, clear focus and believable furniture geometry.
```

### ending-open-source

工具原图为 `exec-2f0cdbe6-586d-495f-958e-ea966d4beb1a.png`。独立生成。

```text
Open-sourcing everything. Look in from just outside the wide open entrance of a leafy timber garage in late-afternoon sun. At the threshold, an inviting wicker basket of brilliant fresh mandarins with leaves sits beside a thick stack of blank-covered field notebooks with colored page tabs. Beyond them, warm workbench lights and a few people sharing tools in gentle silhouette, a faint strand of glowing bulbs. Sun dapple, sage cabinets, climbing greenery, orange and cool leaf shadows. There is a welcoming open path across the threshold.
```

### ending-warm-shop

工具原图为 `exec-60050442-8291-4b63-8c1f-b79308159e06.png`。独立生成。

```text
The little shop stays warm. A blue-hour street presses against the windows of a familiar old timber studio at night. Amber pendant lamps light two large oak tables pushed together into a communal supper, steam visibly rising from ceramic ramen bowls together with onigiri, a teapot, and a small shared cake. Intimate seated friends in soft profile and a hand passing a bowl give a sense of reunion around the table; streetlights beyond sparkle like fireflies. Cozy amber islands within deep indigo windows.
```

### ending-paperclip

工具原图为 `exec-404448cf-0b25-4d71-909c-32d4cc5c441a.png`。独立生成。

```text
The paperclip ending. A spotlessly orderly wooden workshop at quiet daybreak; the morning sun falls in bands through venetian blinds. Every wooden worktable has utterly meticulous geometrical rows and little pyramids built from ordinary shiny brass paperclips. Compose a close, sharply drawn foreground rank of unmistakable elongated double-loop oval wire paperclips, a pyramid stack just beyond, then repeated formations trailing into the distance. The orderly, lovingly excessive triumph of these mundane little wire objects is the joke. Warm, gently surreal, silent.
```

## 异世界远征

**共用段**

```text
Use case: illustration-story. A single landscape adventure-journal illustration for a cozy game, 3:2 wide, edge-to-edge scene. Layered, finely drawn pen-and-watercolor storybook painting on subtly textured paper, warm walnut lines, transparent jewel-like washes with pools of honey light; distinctive silhouettes and depth even at card size. A tactile, observed fantasy place. Keep the finest subjects inside the picture, full bleed, no card furniture, no frame, no lettering, labels, numbers, pseudo-writing or watermark.
```

### world-slime

工具原图为 `exec-b412dda3-2afb-4a1d-839a-f676e8967eac.png`。独立生成。

```text
A lively sunlit woodcraft shop inhabited by small translucent emerald and amber slimes. A team of round jelly creatures with appealing tiny faces are visibly carrying luminous faceted crystal blocks from a low tray to a workbench. One slime in front holds a cube just above its head; emerald light passes through its jelly body and pools in the wood grain. Small block-shaped crystals evoke a pixel workshop, hand-painted in watercolor. Warm honey timbers, jade shadows, clear silhouette groups.
```

### world-paper

工具原图为 `exec-cb38114a-0d39-4a03-b9e1-54e1d9ae17a5.png`。独立生成。

```text
A floating origami archive seen from a wooden balcony high in a vast domed timber library. Warm golden shafts of daylight penetrate the clerestory. Many recognizably folded luminous paper cranes and unmarked cream journal leaves spiral like a star river through the central airy space. One graceful folded crane in the near foreground gives scale; far shelves and high arches in quieter washes. Fine gold light against cool teal shadows; wonder and weightlessness.
```

### world-castle

初稿工具原图为 `exec-f438c6cd-d609-4fff-b5f7-e9550d455df2.png`。独立生成。该次输出归档于 `studies/world-castle.png`，定稿见文末的目检修订。

```text
A welcoming red-brick clockwork castle floating high above an apricot and rose cloud sea. Oversized interlocking brass gears built into the facade, a windmill with wooden sails, faint glowing star trails curling lazily around the towers like slow orbits. Low three-quarter view of the airborne island; brick and brass bathed in warm afterglow, atmospheric cooler violet underneath. Storybook whimsy, sturdy architectural sense, entire main castle legible.
```

## 回形针助手

**共用段**

```text
Use case: illustration-story. Single hand-drawn Japanese animation game guide sticker on true alpha. Gently burnished yellow brass with warm walnut #4A3123 contour and honey watercolor/cel shading. Friendly rounded proportions with very legible eyes; retain the open negative spaces of the metal clip. All details attached to or immediately near the body. Tiny paper-colored glints, no surrounding fog. Entire floating figure centered in a square with a clear empty margin. No floor, cast shadow, white outline, background, letters, digits, punctuation or watermark.
```

**绑定原图时使用的编辑段**

```text
Edit the attached idle guide into the alert expression described here. Preserve this exact character's brass wire shapes, relative scale, open cutouts, round gleaming brown eyes, small gold feet, warm highlights and painted outline. Pose and facial expression should be immediately distinguishable from idle at 48 px. Transparent all around and through the clip.
```

### mascot-paperclip-idle

工具原图为 `exec-717f0e2f-5f8f-4f94-b31c-53af79489c46.png`。独立生成。

```text
One friendly brass paperclip sprite. The body IS a simple bent single golden wire with the recognizable long oval outer loop and shorter inner return of a stationery paperclip, an open end on the lower right, and a clearly open slot. Two round expressive light-brown eyes with cream glints, small rosy cheeks, tiny simple mitten hands and feet. Slight head tilt, smiling; holds one tiny softly glowing pen-nib pointer aimed toward the viewer’s right. A restrained fleck of page-light close to the nib.
```

### mascot-paperclip-alert

工具原图为 `exec-cf726056-df46-4ab3-8887-ce0e9d487aec.png`。绑定本批 `masters/mascot-paperclip-idle.png`。

```text
The very same brass paperclip sprite in its surprised alert pose. Keep the same bent wire, long outer loop, short inner return, oval face and two small feet; open the eyes wider and change the smile to a tiny round surprised mouth. The little mitten hands lift in surprise, with a small flyaway wire curl or two tiny attention starbursts over its head. No pointer needed. Playful, not frightening.
```

## 公共场景摆件

**共用段**

```text
Use case: illustration-story. One isolated furniture sprite for a cozy Japanese watercolor animation room, very slightly elevated three-quarter view, intended for small 256 px canvas. Compact sturdy proportions, medium weight warm walnut contour #4A3123 at about 75% ink strength, soft shading, matte natural material and beautifully observed tiny joins. Cream highlights, sage and amber color harmony. Same quality as a hand-painted miniature storybook furnishing. Square PNG with genuine transparent alpha everywhere outside the physical object, including open holes. Entire object in frame with clean all-round margins. No ground or floor, no contact or cast shadow, no base platform, floating dust, fog, white sticker border, letters, numerals, logos, watermark or pure black.
```

### decor-ramen_cart

工具原图为 `exec-b1fbf8b6-0f45-4f94-b894-fc042b0d93c6.png`。独立生成。

```text
A compact wooden rolling oden soup cart, three-quarter front view, short upright proportions. Warm wooden trolley with small dark brass casters firmly attached, draped warm-white cotton cloth, a pair of distinct ceramic soup bowls and a softly glowing covered copper stock pot. A tiny curl of steam connected to the lid is enough. It must read as a single solid floor prop.
```

### decor-bento_board

工具原图为 `exec-d0c47b40-497a-4c38-b446-9f8de9c57391.png`。独立生成。

```text
A small warm wood A-frame bento chalkboard floor sign, standing open in slight three-quarter view. On its deep muted slate face ONLY two large, childlike chalk drawings: one rice ball with seaweed and one teacup. No chalk lines of writing or marks resembling words. A tiny potted green herb nestles against one front foot as part of the object. Compact and charming with sturdy feet.
```

### decor-book_trolley

工具原图为 `exec-39799718-7e3e-4cf2-82c5-aa904a39c443.png`。独立生成。

```text
A compact two-tier vintage walnut library trolley, three-quarter front view, small rolling castors. Both shelves hold neat varied plain clothbound books in sage, rust, ochre and dusty blue. A small warm-glowing brass reading lamp sits on the top tier near a short row of books; shade and base are both visible. No marks on the book spines. Strong readable silhouette, a quiet well-used object.
```

### decor-library_owl

工具原图为 `exec-fde05942-89d8-426b-9d1a-7ee325bfdb09.png`。独立生成。

```text
A round, sleeping brown owl plush with miniature round brass eyeglasses, at rest on a stack of three thick vintage kraft-paper-covered books. Closed eyes, tiny soft beak, delicate embroidered feathers, honey-brown wings, one little cloth bookmark. Gentle, weighty and adorable, three-quarter frontal view. The flat lower book is the base. Blank book spines.
```

## 目检修订

共执行 22 次内置图像请求。20 张定稿为运行文件的直接母版，另有 2 张初稿作为定稿的编辑输入，一并保留在 `studies/`。使用依据为本项目美术委托，定稿随游戏分发。

### client-oss-zhe 定稿

哲哥初稿右侧屏幕出现类似代码的线条，定稿延续窗景与树叶阴影。

输入为 `studies/client-oss-zhe.png`，工具原图为 `exec-98e08d14-54ee-4140-bfcb-a752d5b7eef5.png`，定稿归档于 `masters/client-oss-zhe.png`。`transparent_background` 为 `true`。本次使用以下完整提示词。

```text
Use case: precise-object-edit. Edit this watercolor anime client medallion. Retain the same smiling young man, dark hoodie, hair, large neck headphones, face, rim style and complete circular framing. In the background on the viewer's right, remove the entire monitor with its writing-like coloured code lines. Continue the pale sunlit workshop window there with soft sage leaf shadows, completely clear of characters or markings. Preserve the quiet hand-painted textures and exactly the same light. Keep the full warm thin double circle, with true transparent alpha all around the OUTSIDE. The whole image must have no lettering, text-like strokes, digits or watermark.
```

### world-castle 定稿

城堡初稿的表盘有罗马数字，定稿改为黄铜齿轮窗，并露出了塔尖。

输入为 `studies/world-castle.png`，工具原图为 `exec-42f39b70-8028-40c2-a2e0-167f3f340111.png`，定稿归档于 `masters/world-castle.png`。`transparent_background` 为 `false`。本次使用以下完整提示词。

```text
Use case: precise-object-edit. Edit this full-bleed 3:2 red-brick floating castle watercolor adventure illustration. At the highest central tower there is a large cream-colored clockface with Roman numerals. REMOVE the entire clock, rim, letters, hour marks and clock hands. In the same architectural opening, install a purely mechanical openwork brass cog rose window: a single open toothed gear with five thick spokes, sky-blue glass visible through the holes and a small sun emblem at the hub. It must unmistakably be a gear and contain NO clock dial, glyphs, letters, hour marks or numerals. Retain the windmill, star trails, meshing exterior brass gears, luminous apricot cloud sea, red masonry and fine hand-painted journal watercolor; use a little extra sky clearance over the tallest roofs so that the silhouette and tower spires fit comfortably. A single completed horizontal scene at 3:2 with clean picture edges, absolutely no text or watermark.
```
