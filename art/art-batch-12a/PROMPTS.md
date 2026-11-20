# Art-Batch 12A 生成与取舍

2026-11-20 使用内置 image_gen，19 次调用均开启 `transparent_background: true`。每次均挂载该角色的设定表和 Stage B 图，觉醒版与 Mistral 正面头像还挂载了入选日常母版。工具没有返回可固定的模型版本或随机种子。下列 PNG 是复现导出的输入。

13 张生成原图入选，另有 5 张头像直接精裁自日常母版。6 张退选生成稿和 1 张 Mistral 精裁试样归档在本目录的 `rejected/`。全部入选 PNG、WebP 和目录的字节数、SHA256 与来源链见[批次清单](manifest.json)。

## 退选记录

| 角色 | 稿件 | 取舍依据 |
| --- | --- | --- |
| bluewhale | [flagship 首稿](rejected/bluewhale-flagship-01.png) | 首稿沿用了日常装的袖型和正面站姿，改用侧肩礼袖和横越躯干的蓝金星盘书。 |
| qwen | [flagship 首稿](rejected/qwen-flagship-01.png) | 首稿的星图集中在胸前，二稿展开三层面板，金绣披层和触点更清楚。 |
| llama | [base 首稿](rejected/llama-base-01.png) | 两只耳朵直立，改绘后更接近任务设定的毛茸垂耳。 |
| mistral | [base 首稿](rejected/mistral-base-01.png) | 狐尾外轮廓贴近左界，帽羽过高，收拢后给尾尖和帽顶留出空间。 |
| gpt | [flagship 首稿](rejected/gpt-flagship-01.png) | 首稿的披纱挤在外侧，胸前光棱较小，二稿的多面体和袖纱在小图里更清楚。 |
| claude | [base 首稿](rejected/claude-base-01.png) | 怀表表盘含罗马刻度，改为合盖、无字的太阳纹金表。 |
| mistral | [头像精裁试样](rejected/mistral-avatar-crop.png) | 侧脸、扶帽的手与宽帽檐在 32px 下挤占脸部空间。入选版改为同脸正面胸像，完整保留狐耳、卷羽和帽饰。 |

头像退选试样的 SHA256 为 `46dc58607134e005f3f0787e5ecdc7a03d333498bf397b25189162ccd03031cc`。它来自入选的 Mistral 日常原图，原图肩部弧线采用 `bottomY=670`、`arcCurvature=0.00062`，眼中点目标为 `[0.548, 0.48]`。

## 母版与坐标

Bluewhale、Qwen、Llama、GPT、Claude 的头像在日常 PNG 的原始分辨率上裁取。双瞳中心、头颅区域和肩部弧线由原图逐张标定。只在头像下缘收肩，保留头顶、耳朵、帽饰与发丝轮廓。Mistral 头像以生成原图归档。六张头像均等比缩小到 256px。[构图坐标](composition.json)

目录路径相对 `apps/web/public/art/portraits/`。坐标原点在画布左上，`alphaBounds` 和 `headRegion` 用左、上、右、下表示，右界及下界不包含在区域内。`headCentroid` 是最终解码图在标定头颅椭圆内按 alpha 加权的像素中心，`eyes` 是标定瞳心在最终画布中的坐标，`eyeCenter` 是两瞳中点。

## 逐次提示词

参考路径均相对仓库根目录。日常初稿曾作为重绘的第三个输入，记录列出该输入在退选目录中的等字节归档路径。各条目内的参考顺序与调用顺序一致。

### bluewhale · base · 入选

[masters/bluewhale/base.png](masters/bluewhale/base.png) · 生成文件 `exec-2d2f778e-df28-4887-af19-8a57ce8bae3d.png` · SHA256 `45f89aa229d0967529e4c55dc76e8b016efe595f0c7ed1ea75a5f6b1750eca43`。

1. `art/art-batch-8/masters/bluewhale/ref_sheet.png`
2. `apps/web/public/art/stage-b/bluewhale.r1.webp`

```text
Use case: stylized-concept. A single polished production character cutout for Out of Tokens, one figure, upright portrait 3:4. Image 1 (character design sheet) and image 2 (existing powered-up portrait) are strict identity references. Translate this specific chibi character into a slender young adult anime character illustration, 5.5-head to 6-head tall natural figure proportions, NOT chibi, NOT super-deformed. Anatomically elegant neck, adult shoulder width ~2.1 head widths, normal sized face and hands, graceful long torso and arms. Frame crown through mid-thigh, never full-body, single coherent figure. Both eyes and signature head ornaments clearly visible. Entire top, ornaments, hair, lateral silhouette and props inside frame with generous transparent room. The only permissible crop is a clean horizontal lower edge across the thighs. Portrait-oriented compact composition.
Deep-sea cobalt wavy hair turning cyan at the ends, one curved ahoge, azure bow on her left temple (viewer right), white frilled maid headband, two dark blue sideways whale-fin ears with pale undersides, sea-blue star-bright eyes, navy and white maid dress, white apron with a small embroidered whale silhouette, visible blue whale tail. Theme #3B6EA8.
BASE / Studio Everyday: quiet daylight, recognizable everyday garments with modest decoration and a practical studio object. No magic, aura, glow effects or extra ornaments.
DeepSeek V3. Relaxed slight three-quarter standing pose, facing us, gently hug a closed beige paper notebook with one hand and hold a capped blue fountain pen in the other. A faint attentive smile, soft sunlight rim on hair. Keep whale embroidery and tail readable.
One consistent Japanese animation key-visual painter: clean fine warm espresso #3A241A tapered linework, exquisite but restrained transparent watercolor and artful cel-shaded gouache, soft warm daylight, luminous eyes, deft highlights, readable silhouette. Natural correct hands, five fingers per hand. Produce actual isolated RGBA transparency everywhere outside the figure/intentional effects. No background, decorative frame, border, printed text, letters, numerals, logos, signature, watermark, ground plane, cast shadow, vignette or colored backdrop. No pure black ink; darkest strokes are warm brown.
```

### bluewhale · flagship · 退选

[rejected/bluewhale-flagship-01.png](rejected/bluewhale-flagship-01.png) · 生成文件 `exec-c0cd5b03-1a6a-426d-ae38-ac855eee80aa.png` · SHA256 `7152a9be3e4d81f78e5c6949aa95d6d84926a796661eb5748d86d270828584a6`。

1. `art/art-batch-8/masters/bluewhale/ref_sheet.png`
2. `apps/web/public/art/stage-b/bluewhale.r1.webp`
3. `art/art-batch-12a/masters/bluewhale/base.png`

```text
Use case: stylized-concept. A single polished production character cutout for Out of Tokens, one figure, upright portrait 3:4. Image 1 (character design sheet) and image 2 (existing powered-up portrait) are strict identity references. Translate this specific chibi character into a slender young adult anime character illustration, 5.5-head to 6-head tall natural figure proportions, NOT chibi, NOT super-deformed. Anatomically elegant neck, adult shoulder width ~2.1 head widths, normal sized face and hands, graceful long torso and arms. Frame crown through mid-thigh, never full-body, single coherent figure. Both eyes and signature head ornaments clearly visible. Entire top, ornaments, hair, lateral silhouette and props inside frame with generous transparent room. The only permissible crop is a clean horizontal lower edge across the thighs. Portrait-oriented compact composition.
Deep-sea cobalt wavy hair turning cyan at the ends, one curved ahoge, azure bow on her left temple (viewer right), white frilled maid headband, two dark blue sideways whale-fin ears with pale undersides, sea-blue star-bright eyes, navy and white maid dress, white apron with a small embroidered whale silhouette, visible blue whale tail. Theme #3B6EA8.
FLAGSHIP / High-Spec Awakened: same artist and same adult face as image 3 (approved base portrait). A distinctly upgraded dynamic premium key visual with flaring layered fabrics, elaborate fine embroidery and a spectacular but localized themed prop/effect. Keep glows close, with true transparent gaps around every ribbon; no atmospheric fog or full-canvas glow.
DeepSeek R1. Confident deep ocean ceremonial navy maid gown with fine gold tidal embroidery and flowing translucent water-silk sashes. Turn the torso in a graceful diagonal, two open palms gently suspending one open deep-blue luminous astrolabe codex. Only a few clean cyan geometric crystals, tiny starlight and ripple arcs close to the book. Keep the white frilled headband, hair bow, fin ears and unmistakable whale tail.
One consistent Japanese animation key-visual painter: clean fine warm espresso #3A241A tapered linework, exquisite but restrained transparent watercolor and artful cel-shaded gouache, soft warm daylight, luminous eyes, deft highlights, readable silhouette. Natural correct hands, five fingers per hand. Produce actual isolated RGBA transparency everywhere outside the figure/intentional effects. No background, decorative frame, border, printed text, letters, numerals, logos, signature, watermark, ground plane, cast shadow, vignette or colored backdrop. No pure black ink; darkest strokes are warm brown.
```

### bluewhale · flagship · 入选

[masters/bluewhale/flagship.png](masters/bluewhale/flagship.png) · 生成文件 `exec-6985d938-7f51-4aae-bfe0-54f879c5d994.png` · SHA256 `50aa18288337ba42450fce3cb6f9c3e2fb22e17ed3047b78579eea666dec9e6a`。

1. `art/art-batch-8/masters/bluewhale/ref_sheet.png`
2. `apps/web/public/art/stage-b/bluewhale.r1.webp`
3. `art/art-batch-12a/masters/bluewhale/base.png`

```text
Use case: stylized-concept. A single polished production character cutout for Out of Tokens, one figure, upright portrait 3:4. Image 1 (character design sheet) and image 2 (existing powered-up portrait) are strict identity references. Translate this specific chibi character into a slender young adult anime character illustration, 5.5-head to 6-head tall natural figure proportions, NOT chibi, NOT super-deformed. Anatomically elegant neck, adult shoulder width ~2.1 head widths, normal sized face and hands, graceful long torso and arms. Frame crown through mid-thigh, never full-body, single coherent figure. Both eyes and signature head ornaments clearly visible. Entire top, ornaments, hair, lateral silhouette and props inside frame with generous transparent room. The only permissible crop is a clean horizontal lower edge across the thighs. Portrait-oriented compact composition.
Deep-sea cobalt wavy hair turning cyan at the ends, one curved ahoge, azure bow on her left temple (viewer right), white frilled maid headband, two dark blue sideways whale-fin ears with pale undersides, sea-blue star-bright eyes, navy and white maid dress, white apron with a small embroidered whale silhouette, visible blue whale tail. Theme #3B6EA8.
FLAGSHIP / High-Spec Awakened: same artist and same adult face as image 3 (approved base portrait). A distinctly upgraded dynamic premium key visual with flaring layered fabrics, elaborate fine embroidery and a spectacular but localized themed prop/effect. Keep glows close, with true transparent gaps around every ribbon; no atmospheric fog or full-canvas glow.
DeepSeek R1. Confident deep ocean ceremonial navy maid gown with fine gold tidal embroidery and flowing translucent water-silk sashes. Turn the torso in a graceful diagonal, two open palms gently suspending one open deep-blue luminous astrolabe codex. Only a few clean cyan geometric crystals, tiny starlight and ripple arcs close to the book. Keep the white frilled headband, hair bow, fin ears and unmistakable whale tail.
New silhouette: low three-quarter camera, head turned toward us over the far shoulder, deep-blue tide mantle curving behind one elbow like a crest. Compose a large open star-chart codex diagonally across her lower torso, pages floating between palms. The embroidered whale apron, fin ears, fluked tail and bow identify her instantly. Face remains finely drawn and recognizable. Change neckline, sleeves and the angle of both shoulders from the everyday dress.
Design a NEW pose and NEW silhouette, taking ONLY the facial identity and rendering finish from image 3. The flagship should read as a higher rank even at thumbnail size from the change in outline and costume. Paint the COMPLETE left and right outline, head, hands, hat and floating effects inside an empty transparent moat of at least 8% raw canvas on left, right and top. Pull the camera back to leave this breathing room. Let the lower hem or thighs end near the bottom. An intentional handful of bright accents, not a fog of sparkles. Fingers overlap naturally with clean joints; exactly two hands. Render a single character cutout, no layout or comparison.
One consistent Japanese animation key-visual painter: clean fine warm espresso #3A241A tapered linework, exquisite but restrained transparent watercolor and artful cel-shaded gouache, soft warm daylight, luminous eyes, deft highlights, readable silhouette. Natural correct hands, five fingers per hand. Produce actual isolated RGBA transparency everywhere outside the figure/intentional effects. No background, decorative frame, border, printed text, letters, numerals, logos, signature, watermark, ground plane, cast shadow, vignette or colored backdrop. No pure black ink; darkest strokes are warm brown.
```

### qwen · base · 入选

[masters/qwen/base.png](masters/qwen/base.png) · 生成文件 `exec-87e732d6-02b4-4872-b212-dcc4d337c7b8.png` · SHA256 `b6d449c89bb4fe5f1513334b852aa426784f60027941c87af84bfd6b6500776c`。

1. `art/art-batch-10a/masters/qwen/ref_sheet.png`
2. `apps/web/public/art/stage-b/qwen.qwq.webp`

```text
Use case: stylized-concept. A single polished production character cutout for Out of Tokens, one figure, upright portrait 3:4. Image 1 (character design sheet) and image 2 (existing powered-up portrait) are strict identity references. Translate this specific chibi character into a slender young adult anime character illustration, 5.5-head to 6-head tall natural figure proportions, NOT chibi, NOT super-deformed. Anatomically elegant neck, adult shoulder width ~2.1 head widths, normal sized face and hands, graceful long torso and arms. Frame crown through mid-thigh, never full-body, single coherent figure. Both eyes and signature head ornaments clearly visible. Entire top, ornaments, hair, lateral silhouette and props inside frame with generous transparent room. The only permissible crop is a clean horizontal lower edge across the thighs. Portrait-oriented compact composition.
Long lavender-periwinkle softly curled hair with a small side braid, violet eyes, tilted indigo-blue beret with a white frill, white flower set in blue-and-gold settings and tassel, delicate periwinkle/white attendant dress, ribbons, small blue gem. Theme #4E67C8.
BASE / Studio Everyday: quiet daylight, recognizable everyday garments with modest decoration and a practical studio object. No magic, aura, glow effects or extra ornaments.
Qwen 2.5. A warm universal studio assistant standing with a courteous smile, arms loosely cradling a wood-grain organizer clipboard against her torso. Several unmarked pastel page tabs peek out; blank stationery. Her blue/white day dress has a neat bow.
One consistent Japanese animation key-visual painter: clean fine warm espresso #3A241A tapered linework, exquisite but restrained transparent watercolor and artful cel-shaded gouache, soft warm daylight, luminous eyes, deft highlights, readable silhouette. Natural correct hands, five fingers per hand. Produce actual isolated RGBA transparency everywhere outside the figure/intentional effects. No background, decorative frame, border, printed text, letters, numerals, logos, signature, watermark, ground plane, cast shadow, vignette or colored backdrop. No pure black ink; darkest strokes are warm brown.
```

### qwen · flagship · 退选

[rejected/qwen-flagship-01.png](rejected/qwen-flagship-01.png) · 生成文件 `exec-c18d4659-98af-4626-951b-b69ea2b321ad.png` · SHA256 `f5e732bad2d552282620316b2336b38e2e3f1c848f0669aa0a33cd73765b7dd5`。

1. `art/art-batch-10a/masters/qwen/ref_sheet.png`
2. `apps/web/public/art/stage-b/qwen.qwq.webp`
3. `art/art-batch-12a/masters/qwen/base.png`

```text
Use case: stylized-concept. A single polished production character cutout for Out of Tokens, one figure, upright portrait 3:4. Image 1 (character design sheet) and image 2 (existing powered-up portrait) are strict identity references. Translate this specific chibi character into a slender young adult anime character illustration, 5.5-head to 6-head tall natural figure proportions, NOT chibi, NOT super-deformed. Anatomically elegant neck, adult shoulder width ~2.1 head widths, normal sized face and hands, graceful long torso and arms. Frame crown through mid-thigh, never full-body, single coherent figure. Both eyes and signature head ornaments clearly visible. Entire top, ornaments, hair, lateral silhouette and props inside frame with generous transparent room. The only permissible crop is a clean horizontal lower edge across the thighs. Portrait-oriented compact composition.
Long lavender-periwinkle softly curled hair with a small side braid, violet eyes, tilted indigo-blue beret with a white frill, white flower set in blue-and-gold settings and tassel, delicate periwinkle/white attendant dress, ribbons, small blue gem. Theme #4E67C8.
FLAGSHIP / High-Spec Awakened: same artist and same adult face as image 3 (approved base portrait). A distinctly upgraded dynamic premium key visual with flaring layered fabrics, elaborate fine embroidery and a spectacular but localized themed prop/effect. Keep glows close, with true transparent gaps around every ribbon; no atmospheric fog or full-canvas glow.
QwQ. Blue-and-gold ceremonial attendant gown with embroidered flaring overskirt and fine pearl epaulettes. Calm and capable, one fingertip touches a hovering, inclined set of layered transparent blue-gold star-map planning panels made of nodes and fine lines only. A few graceful close-set arcs and feather motes outline the flowing gesture.
One consistent Japanese animation key-visual painter: clean fine warm espresso #3A241A tapered linework, exquisite but restrained transparent watercolor and artful cel-shaded gouache, soft warm daylight, luminous eyes, deft highlights, readable silhouette. Natural correct hands, five fingers per hand. Produce actual isolated RGBA transparency everywhere outside the figure/intentional effects. No background, decorative frame, border, printed text, letters, numerals, logos, signature, watermark, ground plane, cast shadow, vignette or colored backdrop. No pure black ink; darkest strokes are warm brown.
```

### qwen · flagship · 入选

[masters/qwen/flagship.png](masters/qwen/flagship.png) · 生成文件 `exec-57d6f928-cca5-480b-957c-f811269ed411.png` · SHA256 `d9fdf68fa9dc52c55ac788dfe33523e079c7f442a77c5ff3659132b5797fc2bd`。

1. `art/art-batch-10a/masters/qwen/ref_sheet.png`
2. `apps/web/public/art/stage-b/qwen.qwq.webp`
3. `art/art-batch-12a/masters/qwen/base.png`

```text
Use case: stylized-concept. A single polished production character cutout for Out of Tokens, one figure, upright portrait 3:4. Image 1 (character design sheet) and image 2 (existing powered-up portrait) are strict identity references. Translate this specific chibi character into a slender young adult anime character illustration, 5.5-head to 6-head tall natural figure proportions, NOT chibi, NOT super-deformed. Anatomically elegant neck, adult shoulder width ~2.1 head widths, normal sized face and hands, graceful long torso and arms. Frame crown through mid-thigh, never full-body, single coherent figure. Both eyes and signature head ornaments clearly visible. Entire top, ornaments, hair, lateral silhouette and props inside frame with generous transparent room. The only permissible crop is a clean horizontal lower edge across the thighs. Portrait-oriented compact composition.
Long lavender-periwinkle softly curled hair with a small side braid, violet eyes, tilted indigo-blue beret with a white frill, white flower set in blue-and-gold settings and tassel, delicate periwinkle/white attendant dress, ribbons, small blue gem. Theme #4E67C8.
FLAGSHIP / High-Spec Awakened: same artist and same adult face as image 3 (approved base portrait). A distinctly upgraded dynamic premium key visual with flaring layered fabrics, elaborate fine embroidery and a spectacular but localized themed prop/effect. Keep glows close, with true transparent gaps around every ribbon; no atmospheric fog or full-canvas glow.
QwQ. Blue-and-gold ceremonial attendant gown with embroidered flaring overskirt and fine pearl epaulettes. Calm and capable, one fingertip touches a hovering, inclined set of layered transparent blue-gold star-map planning panels made of nodes and fine lines only. A few graceful close-set arcs and feather motes outline the flowing gesture.
New silhouette: the confident planner turns her upper body the opposite way from the base pose; one slender arm extends across the body to tap three thin staggered transparent star-map panels. Pearl-fringed blue mantle sweeping from one shoulder, layered court overskirt with intricate gold celestial embroidery, extended sash, unmistakable ceremonial fashion. No digits or lettering on panels.
Design a NEW pose and NEW silhouette, taking ONLY the facial identity and rendering finish from image 3. The flagship should read as a higher rank even at thumbnail size from the change in outline and costume. Paint the COMPLETE left and right outline, head, hands, hat and floating effects inside an empty transparent moat of at least 8% raw canvas on left, right and top. Pull the camera back to leave this breathing room. Let the lower hem or thighs end near the bottom. An intentional handful of bright accents, not a fog of sparkles. Fingers overlap naturally with clean joints; exactly two hands. Render a single character cutout, no layout or comparison.
One consistent Japanese animation key-visual painter: clean fine warm espresso #3A241A tapered linework, exquisite but restrained transparent watercolor and artful cel-shaded gouache, soft warm daylight, luminous eyes, deft highlights, readable silhouette. Natural correct hands, five fingers per hand. Produce actual isolated RGBA transparency everywhere outside the figure/intentional effects. No background, decorative frame, border, printed text, letters, numerals, logos, signature, watermark, ground plane, cast shadow, vignette or colored backdrop. No pure black ink; darkest strokes are warm brown.
```

### llama · base · 退选

[rejected/llama-base-01.png](rejected/llama-base-01.png) · 生成文件 `exec-003f0007-1e9f-4351-83c9-e00a3e830555.png` · SHA256 `e65392441597ec7a7edee116c6be6a4f9944cec8678dfc607e6aa7b4813c7589`。

1. `art/art-batch-10a/masters/llama/ref_sheet.png`
2. `apps/web/public/art/stage-b/llama.3.1.webp`

```text
Use case: stylized-concept. A single polished production character cutout for Out of Tokens, one figure, upright portrait 3:4. Image 1 (character design sheet) and image 2 (existing powered-up portrait) are strict identity references. Translate this specific chibi character into a slender young adult anime character illustration, 5.5-head to 6-head tall natural figure proportions, NOT chibi, NOT super-deformed. Anatomically elegant neck, adult shoulder width ~2.1 head widths, normal sized face and hands, graceful long torso and arms. Frame crown through mid-thigh, never full-body, single coherent figure. Both eyes and signature head ornaments clearly visible. Entire top, ornaments, hair, lateral silhouette and props inside frame with generous transparent room. The only permissible crop is a clean horizontal lower edge across the thighs. Portrait-oriented compact composition.
Long creamy ivory curls, curled cowlick, pair of soft furry alpaca ears matching the reference, tips tilting gently outward, sky-blue eyes, distinctive blue infinity hair clip, olive side bows, ivory lace dress with pale sage layers and delicate blue ribbons. Theme #4B7F52.
BASE / Studio Everyday: quiet daylight, recognizable everyday garments with modest decoration and a practical studio object. No magic, aura, glow effects or extra ornaments.
Llama 3. Warm, gentle open-source mentor, easy standing pose and natural smile, hugging a kraft-paper loose-leaf manual with visible binding rings and one small fresh green leaf bookmark. Cream lace and soft green studio day dress. Keep both fluffy ears visible.
One consistent Japanese animation key-visual painter: clean fine warm espresso #3A241A tapered linework, exquisite but restrained transparent watercolor and artful cel-shaded gouache, soft warm daylight, luminous eyes, deft highlights, readable silhouette. Natural correct hands, five fingers per hand. Produce actual isolated RGBA transparency everywhere outside the figure/intentional effects. No background, decorative frame, border, printed text, letters, numerals, logos, signature, watermark, ground plane, cast shadow, vignette or colored backdrop. No pure black ink; darkest strokes are warm brown.
```

### llama · base · 入选

[masters/llama/base.png](masters/llama/base.png) · 生成文件 `exec-53cdd433-b5a1-4629-9d97-faf9079c7bad.png` · SHA256 `31512fe9940015c511dcbb1efd7208acfe493ef1da7429640fc57345e5bb4dda`。

1. `art/art-batch-10a/masters/llama/ref_sheet.png`
2. `apps/web/public/art/stage-b/llama.3.1.webp`
3. `art/art-batch-12a/rejected/llama-base-01.png`

```text
Use case: stylized-concept. A single polished production character cutout for Out of Tokens, one figure, upright portrait 3:4. Image 1 (character design sheet) and image 2 (existing powered-up portrait) are strict identity references. Translate this specific chibi character into a slender young adult anime character illustration, 5.5-head to 6-head tall natural figure proportions, NOT chibi, NOT super-deformed. Anatomically elegant neck, adult shoulder width ~2.1 head widths, normal sized face and hands, graceful long torso and arms. Frame crown through mid-thigh, never full-body, single coherent figure. Both eyes and signature head ornaments clearly visible. Entire top, ornaments, hair, lateral silhouette and props inside frame with generous transparent room. The only permissible crop is a clean horizontal lower edge across the thighs. Portrait-oriented compact composition.
Long creamy ivory curls, curled cowlick, pair of soft furry alpaca ears matching the reference, tips tilting gently outward, sky-blue eyes, distinctive blue infinity hair clip, olive side bows, ivory lace dress with pale sage layers and delicate blue ribbons. Theme #4B7F52.
BASE / Studio Everyday: quiet daylight, recognizable everyday garments with modest decoration and a practical studio object. No magic, aura, glow effects or extra ornaments.
Llama 3. Warm, gentle open-source mentor, easy standing pose and natural smile, hugging a kraft-paper loose-leaf manual with visible binding rings and one small fresh green leaf bookmark. Cream lace and soft green studio day dress. Keep both fluffy ears visible.
Image 3 is the first adult studio painting. Match her face, age, long ivory curls, blue eye colour, green bows, light forest dress and kraft-paper manual. Soften the two distinct furry alpaca ears: their bases stay on the crown in the same positions as image 1 and 2, but the soft long tips bend OUT and DOWN to either side, drooping slightly with a rounded taper, ivory outside and peach inside. The pair are recognizable alpaca ears, not upright triangular cat ears. Blue infinity clip and both eyes unobstructed, ears may drape outward into empty space, entire ears inside canvas. Hips and thighs visible like image 3.
One consistent Japanese animation key-visual painter: clean fine warm espresso #3A241A tapered linework, exquisite but restrained transparent watercolor and artful cel-shaded gouache, soft warm daylight, luminous eyes, deft highlights, readable silhouette. Natural correct hands, five fingers per hand. Produce actual isolated RGBA transparency everywhere outside the figure/intentional effects. No background, decorative frame, border, printed text, letters, numerals, logos, signature, watermark, ground plane, cast shadow, vignette or colored backdrop. No pure black ink; darkest strokes are warm brown.
```

### llama · flagship · 入选

[masters/llama/flagship.png](masters/llama/flagship.png) · 生成文件 `exec-17b56d8d-58d5-4f6b-9d41-c09589f81227.png` · SHA256 `f4db65b96d67d24ddb28606169108c4f04f1d039c9cc0d1cc177c8103fcfe0b1`。

1. `art/art-batch-10a/masters/llama/ref_sheet.png`
2. `apps/web/public/art/stage-b/llama.3.1.webp`
3. `art/art-batch-12a/masters/llama/base.png`

```text
Use case: stylized-concept. A single polished production character cutout for Out of Tokens, one figure, upright portrait 3:4. Image 1 (character design sheet) and image 2 (existing powered-up portrait) are strict identity references. Translate this specific chibi character into a slender young adult anime character illustration, 5.5-head to 6-head tall natural figure proportions, NOT chibi, NOT super-deformed. Anatomically elegant neck, adult shoulder width ~2.1 head widths, normal sized face and hands, graceful long torso and arms. Frame crown through mid-thigh, never full-body, single coherent figure. Both eyes and signature head ornaments clearly visible. Entire top, ornaments, hair, lateral silhouette and props inside frame with generous transparent room. The only permissible crop is a clean horizontal lower edge across the thighs. Portrait-oriented compact composition.
Long creamy ivory curls, curled cowlick, pair of soft furry alpaca ears matching the reference, tips tilting gently outward, sky-blue eyes, distinctive blue infinity hair clip, olive side bows, ivory lace dress with pale sage layers and delicate blue ribbons. Theme #4B7F52.
FLAGSHIP / High-Spec Awakened: same artist and same adult face as image 3 (approved base portrait). A distinctly upgraded dynamic premium key visual with flaring layered fabrics, elaborate fine embroidery and a spectacular but localized themed prop/effect. Keep glows close, with true transparent gaps around every ribbon; no atmospheric fog or full-canvas glow.
Llama 3.1. Forest-green mantle with gold tassels, ivory lace court dress. She raises an open knowledge tome on one hand; a warm green light catches her face. Bright tender leaves and a few emerald motes curve in a rising diagonal near the book. Learned, quietly authoritative, soft ears and blue hair clip visible.
Keep the gently drooping, soft furry alpaca ears from the adult base (image 3), both visible. She turns in a graceful three-quarter contrapposto, raising her leaf-lit tome; the long asymmetric forest green scholar's cape with gold piping, tassels and embroidery frames the white tiered-lace dress. A few separate bright bud-green leaves curl past the sleeve; book pages have botanical diagrams of leaves only, no writing.
Design a NEW pose and NEW silhouette, taking ONLY the facial identity and rendering finish from image 3. The flagship should read as a higher rank even at thumbnail size from the change in outline and costume. Paint the COMPLETE left and right outline, head, hands, hat and floating effects inside an empty transparent moat of at least 8% raw canvas on left, right and top. Pull the camera back to leave this breathing room. Let the lower hem or thighs end near the bottom. An intentional handful of bright accents, not a fog of sparkles. Fingers overlap naturally with clean joints; exactly two hands. Render a single character cutout, no layout or comparison.
One consistent Japanese animation key-visual painter: clean fine warm espresso #3A241A tapered linework, exquisite but restrained transparent watercolor and artful cel-shaded gouache, soft warm daylight, luminous eyes, deft highlights, readable silhouette. Natural correct hands, five fingers per hand. Produce actual isolated RGBA transparency everywhere outside the figure/intentional effects. No background, decorative frame, border, printed text, letters, numerals, logos, signature, watermark, ground plane, cast shadow, vignette or colored backdrop. No pure black ink; darkest strokes are warm brown.
```

### mistral · base · 退选

[rejected/mistral-base-01.png](rejected/mistral-base-01.png) · 生成文件 `exec-8582698a-d6b3-41d9-aefe-829562807fc4.png` · SHA256 `1b5efe037a6cdd4917c592ece933f6dcd4c4590111d3358eab613f8175e0b2cd`。

1. `art/art-batch-10a/masters/mistral/ref_sheet.png`
2. `apps/web/public/art/stage-b/mistral.large.webp`

```text
Use case: stylized-concept. A single polished production character cutout for Out of Tokens, one figure, upright portrait 3:4. Image 1 (character design sheet) and image 2 (existing powered-up portrait) are strict identity references. Translate this specific chibi character into a slender young adult anime character illustration, 5.5-head to 6-head tall natural figure proportions, NOT chibi, NOT super-deformed. Anatomically elegant neck, adult shoulder width ~2.1 head widths, normal sized face and hands, graceful long torso and arms. Frame crown through mid-thigh, never full-body, single coherent figure. Both eyes and signature head ornaments clearly visible. Entire top, ornaments, hair, lateral silhouette and props inside frame with generous transparent room. The only permissible crop is a clean horizontal lower edge across the thighs. Portrait-oriented compact composition.
Orange-red long wavy hair with marigold highlights and copper ends, amber-gold eyes, fox ears, broad vermilion witch hat with gold piping, a curled horn-shaped feather ornament (ivory curled plume like the reference, with a red feather accent), jewel clasp, lively red and ivory witch dress, one large fluffy copper fox tail. Theme #D06A4C.
BASE / Studio Everyday: quiet daylight, recognizable everyday garments with modest decoration and a practical studio object. No magic, aura, glow effects or extra ornaments.
Mistral 7B. An energetic courier turning her shoulders to look back toward us, her face visible; one hand lightly touching the side brim, the other holding a small chestnut leather messenger satchel by its handle. Silhouette of hat, plume, both fox ears and lifted tail clearly readable. Easy lively grin.
One consistent Japanese animation key-visual painter: clean fine warm espresso #3A241A tapered linework, exquisite but restrained transparent watercolor and artful cel-shaded gouache, soft warm daylight, luminous eyes, deft highlights, readable silhouette. Natural correct hands, five fingers per hand. Produce actual isolated RGBA transparency everywhere outside the figure/intentional effects. No background, decorative frame, border, printed text, letters, numerals, logos, signature, watermark, ground plane, cast shadow, vignette or colored backdrop. No pure black ink; darkest strokes are warm brown.
```

### mistral · base · 入选

[masters/mistral/base.png](masters/mistral/base.png) · 生成文件 `exec-3b964fc3-5304-4067-8fec-67a15d35abbe.png` · SHA256 `5318a3f23b42bb469c71ded34a3381eefd0f45846de0ffd1aff7659b564ec547`。

1. `art/art-batch-10a/masters/mistral/ref_sheet.png`
2. `apps/web/public/art/stage-b/mistral.large.webp`
3. `art/art-batch-12a/rejected/mistral-base-01.png`

```text
Use case: stylized-concept. A single polished production character cutout for Out of Tokens, one figure, upright portrait 3:4. Image 1 (character design sheet) and image 2 (existing powered-up portrait) are strict identity references. Translate this specific chibi character into a slender young adult anime character illustration, 5.5-head to 6-head tall natural figure proportions, NOT chibi, NOT super-deformed. Anatomically elegant neck, adult shoulder width ~2.1 head widths, normal sized face and hands, graceful long torso and arms. Frame crown through mid-thigh, never full-body, single coherent figure. Both eyes and signature head ornaments clearly visible. Entire top, ornaments, hair, lateral silhouette and props inside frame with generous transparent room. The only permissible crop is a clean horizontal lower edge across the thighs. Portrait-oriented compact composition.
Orange-red long wavy hair with marigold highlights and copper ends, amber-gold eyes, fox ears, broad vermilion witch hat with gold piping, a curled horn-shaped feather ornament (ivory curled plume like the reference, with a red feather accent), jewel clasp, lively red and ivory witch dress, one large fluffy copper fox tail. Theme #D06A4C.
BASE / Studio Everyday: quiet daylight, recognizable everyday garments with modest decoration and a practical studio object. No magic, aura, glow effects or extra ornaments.
Mistral 7B. An energetic courier turning her shoulders to look back toward us, her face visible; one hand lightly touching the side brim, the other holding a small chestnut leather messenger satchel by its handle. Silhouette of hat, plume, both fox ears and lifted tail clearly readable. Easy lively grin.
Image 3 is the first adult base painting. Preserve its coherent face, proportions, studio action, colours and texture. Redraw with a clear moat of actual empty alpha around the entire hat and tail. Keep the tiny hat plume folded down near the crown. Turn the face a little more toward the viewer and center the face in the upper composition, place the tail behind her within the silhouette, and fit the entire round tail contour and messenger satchel comfortably inside the canvas. Clear breathing room to left, right and top. Keep mid-thigh framing and do not show feet.
One consistent Japanese animation key-visual painter: clean fine warm espresso #3A241A tapered linework, exquisite but restrained transparent watercolor and artful cel-shaded gouache, soft warm daylight, luminous eyes, deft highlights, readable silhouette. Natural correct hands, five fingers per hand. Produce actual isolated RGBA transparency everywhere outside the figure/intentional effects. No background, decorative frame, border, printed text, letters, numerals, logos, signature, watermark, ground plane, cast shadow, vignette or colored backdrop. No pure black ink; darkest strokes are warm brown.
```

### mistral · flagship · 入选

[masters/mistral/flagship.png](masters/mistral/flagship.png) · 生成文件 `exec-52a06e98-fe25-4dbd-907f-8b2d61e8fcdc.png` · SHA256 `12ff835520ba2d63002d04ed0270ba8e4bb712602bb57c819c39086cbb591bbc`。

1. `art/art-batch-10a/masters/mistral/ref_sheet.png`
2. `apps/web/public/art/stage-b/mistral.large.webp`
3. `art/art-batch-12a/masters/mistral/base.png`

```text
Use case: stylized-concept. A single polished production character cutout for Out of Tokens, one figure, upright portrait 3:4. Image 1 (character design sheet) and image 2 (existing powered-up portrait) are strict identity references. Translate this specific chibi character into a slender young adult anime character illustration, 5.5-head to 6-head tall natural figure proportions, NOT chibi, NOT super-deformed. Anatomically elegant neck, adult shoulder width ~2.1 head widths, normal sized face and hands, graceful long torso and arms. Frame crown through mid-thigh, never full-body, single coherent figure. Both eyes and signature head ornaments clearly visible. Entire top, ornaments, hair, lateral silhouette and props inside frame with generous transparent room. The only permissible crop is a clean horizontal lower edge across the thighs. Portrait-oriented compact composition.
Orange-red long wavy hair with marigold highlights and copper ends, amber-gold eyes, fox ears, broad vermilion witch hat with gold piping, a curled horn-shaped feather ornament (ivory curled plume like the reference, with a red feather accent), jewel clasp, lively red and ivory witch dress, one large fluffy copper fox tail. Theme #D06A4C.
FLAGSHIP / High-Spec Awakened: same artist and same adult face as image 3 (approved base portrait). A distinctly upgraded dynamic premium key visual with flaring layered fabrics, elaborate fine embroidery and a spectacular but localized themed prop/effect. Keep glows close, with true transparent gaps around every ribbon; no atmospheric fog or full-canvas glow.
Mistral Large. The fox witch sweeps her ample tail upward; gold-foiled scarlet short cape over an elaborate red-and-ivory ceremonial spell dress. Her hand conducts a floating red-and-gold wind grimoire. Slender amber gust ribbons and a few bright sparks wrap the lower pose in a controlled S-curve. Spirited, sharp eyes and a daring smile.
New silhouette: spirited fox witch leaning into a rising diagonal gesture, gaze toward viewer, a billowing scarlet and gold cape, wind-swept curls and upcurled fox tail. Gold edges of the flying red grimoire catch the orange gust. Keep fox ears, broad hat brim and curved ivory plume with a red feather accent entirely inside canvas. Grimoire has an unlettered embossed wind-rose medallion.
Design a NEW pose and NEW silhouette, taking ONLY the facial identity and rendering finish from image 3. The flagship should read as a higher rank even at thumbnail size from the change in outline and costume. Paint the COMPLETE left and right outline, head, hands, hat and floating effects inside an empty transparent moat of at least 8% raw canvas on left, right and top. Pull the camera back to leave this breathing room. Let the lower hem or thighs end near the bottom. An intentional handful of bright accents, not a fog of sparkles. Fingers overlap naturally with clean joints; exactly two hands. Render a single character cutout, no layout or comparison.
One consistent Japanese animation key-visual painter: clean fine warm espresso #3A241A tapered linework, exquisite but restrained transparent watercolor and artful cel-shaded gouache, soft warm daylight, luminous eyes, deft highlights, readable silhouette. Natural correct hands, five fingers per hand. Produce actual isolated RGBA transparency everywhere outside the figure/intentional effects. No background, decorative frame, border, printed text, letters, numerals, logos, signature, watermark, ground plane, cast shadow, vignette or colored backdrop. No pure black ink; darkest strokes are warm brown.
```

### gpt · base · 入选

[masters/gpt/base.png](masters/gpt/base.png) · 生成文件 `exec-9a1b1a43-abb7-421c-8251-2ad6580985d3.png` · SHA256 `59a4bfa019866d53d77d7da4d77f25c4f5690a8f94f9076e80dc7390a227912a`。

1. `art/art-batch-10a/masters/gpt/ref_sheet.png`
2. `apps/web/public/art/stage-b/gpt.4o.webp`

```text
Use case: stylized-concept. A single polished production character cutout for Out of Tokens, one figure, upright portrait 3:4. Image 1 (character design sheet) and image 2 (existing powered-up portrait) are strict identity references. Translate this specific chibi character into a slender young adult anime character illustration, 5.5-head to 6-head tall natural figure proportions, NOT chibi, NOT super-deformed. Anatomically elegant neck, adult shoulder width ~2.1 head widths, normal sized face and hands, graceful long torso and arms. Frame crown through mid-thigh, never full-body, single coherent figure. Both eyes and signature head ornaments clearly visible. Entire top, ornaments, hair, lateral silhouette and props inside frame with generous transparent room. The only permissible crop is a clean horizontal lower edge across the thighs. Portrait-oriented compact composition.
Silver-white long hair with pale lilac shadows and a single curled cowlick, violet eyes, pointed ears, two ivory curled horn hair ornaments and a white rose with a hanging lilac pendant on her left (viewer right); elegant white and lavender ruffled dress with rose details. Theme #8576B8.
BASE / Studio Everyday: quiet daylight, recognizable everyday garments with modest decoration and a practical studio object. No magic, aura, glow effects or extra ornaments.
GPT 3.5. An elegant, intelligent incubator mentor, relaxed standing, both hands gently supporting one slim champagne-gold presentation tablet at mid-torso. The blank rear of the tablet faces the viewer. Welcoming subtle smile. Her white and lilac ruffled studio dress flows naturally.
One consistent Japanese animation key-visual painter: clean fine warm espresso #3A241A tapered linework, exquisite but restrained transparent watercolor and artful cel-shaded gouache, soft warm daylight, luminous eyes, deft highlights, readable silhouette. Natural correct hands, five fingers per hand. Produce actual isolated RGBA transparency everywhere outside the figure/intentional effects. No background, decorative frame, border, printed text, letters, numerals, logos, signature, watermark, ground plane, cast shadow, vignette or colored backdrop. No pure black ink; darkest strokes are warm brown.
```

### gpt · flagship · 退选

[rejected/gpt-flagship-01.png](rejected/gpt-flagship-01.png) · 生成文件 `exec-3dcbbb3a-8503-4808-ac04-f24285bb1457.png` · SHA256 `0b368267f2bbb8c939680ebd39d2a5660b61a882dd46cf9443cebc49b3b29df8`。

1. `art/art-batch-10a/masters/gpt/ref_sheet.png`
2. `apps/web/public/art/stage-b/gpt.4o.webp`
3. `art/art-batch-12a/masters/gpt/base.png`

```text
Use case: stylized-concept. A single polished production character cutout for Out of Tokens, one figure, upright portrait 3:4. Image 1 (character design sheet) and image 2 (existing powered-up portrait) are strict identity references. Translate this specific chibi character into a slender young adult anime character illustration, 5.5-head to 6-head tall natural figure proportions, NOT chibi, NOT super-deformed. Anatomically elegant neck, adult shoulder width ~2.1 head widths, normal sized face and hands, graceful long torso and arms. Frame crown through mid-thigh, never full-body, single coherent figure. Both eyes and signature head ornaments clearly visible. Entire top, ornaments, hair, lateral silhouette and props inside frame with generous transparent room. The only permissible crop is a clean horizontal lower edge across the thighs. Portrait-oriented compact composition.
Silver-white long hair with pale lilac shadows and a single curled cowlick, violet eyes, pointed ears, two ivory curled horn hair ornaments and a white rose with a hanging lilac pendant on her left (viewer right); elegant white and lavender ruffled dress with rose details. Theme #8576B8.
FLAGSHIP / High-Spec Awakened: same artist and same adult face as image 3 (approved base portrait). A distinctly upgraded dynamic premium key visual with flaring layered fabrics, elaborate fine embroidery and a spectacular but localized themed prop/effect. Keep glows close, with true transparent gaps around every ribbon; no atmospheric fog or full-canvas glow.
GPT 4o. A luminous ceremonial white and lilac gown with layered star tulle, silver-violet winglike sheer sashes fanning up in a compact arc. A single multifaceted holographic prism floats between her outstretched hands, refracting delicate violet-gold waveforms, geometric light and tiny stars. Poised stage presence.
One consistent Japanese animation key-visual painter: clean fine warm espresso #3A241A tapered linework, exquisite but restrained transparent watercolor and artful cel-shaded gouache, soft warm daylight, luminous eyes, deft highlights, readable silhouette. Natural correct hands, five fingers per hand. Produce actual isolated RGBA transparency everywhere outside the figure/intentional effects. No background, decorative frame, border, printed text, letters, numerals, logos, signature, watermark, ground plane, cast shadow, vignette or colored backdrop. No pure black ink; darkest strokes are warm brown.
```

### gpt · flagship · 入选

[masters/gpt/flagship.png](masters/gpt/flagship.png) · 生成文件 `exec-960c6f9a-c16a-425a-9485-5b9ea943f721.png` · SHA256 `240818dd0bdf05523a80b7f848505e672b53640ecd3fc75b59bf049f929e1dfe`。

1. `art/art-batch-10a/masters/gpt/ref_sheet.png`
2. `apps/web/public/art/stage-b/gpt.4o.webp`
3. `art/art-batch-12a/masters/gpt/base.png`

```text
Use case: stylized-concept. A single polished production character cutout for Out of Tokens, one figure, upright portrait 3:4. Image 1 (character design sheet) and image 2 (existing powered-up portrait) are strict identity references. Translate this specific chibi character into a slender young adult anime character illustration, 5.5-head to 6-head tall natural figure proportions, NOT chibi, NOT super-deformed. Anatomically elegant neck, adult shoulder width ~2.1 head widths, normal sized face and hands, graceful long torso and arms. Frame crown through mid-thigh, never full-body, single coherent figure. Both eyes and signature head ornaments clearly visible. Entire top, ornaments, hair, lateral silhouette and props inside frame with generous transparent room. The only permissible crop is a clean horizontal lower edge across the thighs. Portrait-oriented compact composition.
Silver-white long hair with pale lilac shadows and a single curled cowlick, violet eyes, pointed ears, two ivory curled horn hair ornaments and a white rose with a hanging lilac pendant on her left (viewer right); elegant white and lavender ruffled dress with rose details. Theme #8576B8.
FLAGSHIP / High-Spec Awakened: same artist and same adult face as image 3 (approved base portrait). A distinctly upgraded dynamic premium key visual with flaring layered fabrics, elaborate fine embroidery and a spectacular but localized themed prop/effect. Keep glows close, with true transparent gaps around every ribbon; no atmospheric fog or full-canvas glow.
GPT 4o. A luminous ceremonial white and lilac gown with layered star tulle, silver-violet winglike sheer sashes fanning up in a compact arc. A single multifaceted holographic prism floats between her outstretched hands, refracting delicate violet-gold waveforms, geometric light and tiny stars. Poised stage presence.
New silhouette: conductor-like asymmetrical arm gesture, sharply faceted luminous optical prism hovering just below the shoulder, receiving open hand lower, side-swept white and amethyst ceremonial evening gown, translucent silver-lilac wing shapes on ribbons behind her. A little amethyst and pale gold colour separation around the luminous glass helps it read with either pale or dark UI backgrounds.
Design a NEW pose and NEW silhouette, taking ONLY the facial identity and rendering finish from image 3. The flagship should read as a higher rank even at thumbnail size from the change in outline and costume. Paint the COMPLETE left and right outline, head, hands, hat and floating effects inside an empty transparent moat of at least 8% raw canvas on left, right and top. Pull the camera back to leave this breathing room. Let the lower hem or thighs end near the bottom. An intentional handful of bright accents, not a fog of sparkles. Fingers overlap naturally with clean joints; exactly two hands. Render a single character cutout, no layout or comparison.
One consistent Japanese animation key-visual painter: clean fine warm espresso #3A241A tapered linework, exquisite but restrained transparent watercolor and artful cel-shaded gouache, soft warm daylight, luminous eyes, deft highlights, readable silhouette. Natural correct hands, five fingers per hand. Produce actual isolated RGBA transparency everywhere outside the figure/intentional effects. No background, decorative frame, border, printed text, letters, numerals, logos, signature, watermark, ground plane, cast shadow, vignette or colored backdrop. No pure black ink; darkest strokes are warm brown.
```

### claude · base · 退选

[rejected/claude-base-01.png](rejected/claude-base-01.png) · 生成文件 `exec-4887bf26-e8d3-410b-b7a9-79f160828473.png` · SHA256 `403445861ad79f3db216fd2095aff5769ab36edcf938fdbf4cc40d9b507dd582`。

1. `art/art-batch-10a/masters/claude/ref_sheet.png`
2. `apps/web/public/art/stage-b/claude.sonnet.webp`

```text
Use case: stylized-concept. A single polished production character cutout for Out of Tokens, one figure, upright portrait 3:4. Image 1 (character design sheet) and image 2 (existing powered-up portrait) are strict identity references. Translate this specific chibi character into a slender young adult anime character illustration, 5.5-head to 6-head tall natural figure proportions, NOT chibi, NOT super-deformed. Anatomically elegant neck, adult shoulder width ~2.1 head widths, normal sized face and hands, graceful long torso and arms. Frame crown through mid-thigh, never full-body, single coherent figure. Both eyes and signature head ornaments clearly visible. Entire top, ornaments, hair, lateral silhouette and props inside frame with generous transparent room. The only permissible crop is a clean horizontal lower edge across the thighs. Portrait-oriented compact composition.
Upright adult scholar, head at top and dress below, warm amber-orange eyes, long voluminous copper-orange curls, orange daisy with dark espresso lace bow and cream lace tails on her left (viewer right), ivory and black-brown vintage academic butler dress with amber brooch and gold pocket watch at the waist. Theme #C45B38.
BASE / Studio Everyday: quiet daylight, recognizable everyday garments with modest decoration and a practical studio object. No magic, aura, glow effects or extra ornaments.
Claude 3 Haiku. Completely upright serious but approachable scholar, reading an open leather acceptance checklist binder with plain paper (only tiny blank check boxes if visible). Holds a dark brown-and-gold fountain pen in the other hand. Upright portrait, careful thoughtful expression, antique pocket watch visible.
One consistent Japanese animation key-visual painter: clean fine warm espresso #3A241A tapered linework, exquisite but restrained transparent watercolor and artful cel-shaded gouache, soft warm daylight, luminous eyes, deft highlights, readable silhouette. Natural correct hands, five fingers per hand. Produce actual isolated RGBA transparency everywhere outside the figure/intentional effects. No background, decorative frame, border, printed text, letters, numerals, logos, signature, watermark, ground plane, cast shadow, vignette or colored backdrop. No pure black ink; darkest strokes are warm brown.
```

### claude · base · 入选

[masters/claude/base.png](masters/claude/base.png) · 生成文件 `exec-b628cad1-8ae0-459d-8242-171c152a64f9.png` · SHA256 `ee7cd19b4af4c3c3ec4895dcfaba5806dce642b66aaaed765b90d65683f65b65`。

1. `art/art-batch-10a/masters/claude/ref_sheet.png`
2. `apps/web/public/art/stage-b/claude.sonnet.webp`
3. `art/art-batch-12a/rejected/claude-base-01.png`

```text
Use case: stylized-concept. A single polished production character cutout for Out of Tokens, one figure, upright portrait 3:4. Image 1 (character design sheet) and image 2 (existing powered-up portrait) are strict identity references. Translate this specific chibi character into a slender young adult anime character illustration, 5.5-head to 6-head tall natural figure proportions, NOT chibi, NOT super-deformed. Anatomically elegant neck, adult shoulder width ~2.1 head widths, normal sized face and hands, graceful long torso and arms. Frame crown through mid-thigh, never full-body, single coherent figure. Both eyes and signature head ornaments clearly visible. Entire top, ornaments, hair, lateral silhouette and props inside frame with generous transparent room. The only permissible crop is a clean horizontal lower edge across the thighs. Portrait-oriented compact composition.
Upright adult scholar, head at top and dress below, warm amber-orange eyes, long voluminous copper-orange curls, orange daisy with dark espresso lace bow and cream lace tails on her left (viewer right), ivory and black-brown vintage academic butler dress with amber brooch and gold pocket watch at the waist. Theme #C45B38.
BASE / Studio Everyday: quiet daylight, recognizable everyday garments with modest decoration and a practical studio object. No magic, aura, glow effects or extra ornaments.
Claude 3 Haiku. Completely upright serious but approachable scholar, reading an open leather acceptance checklist binder with plain paper (only tiny blank check boxes if visible). Holds a dark brown-and-gold fountain pen in the other hand. Upright portrait, careful thoughtful expression, antique pocket watch visible.
Image 3 is the first adult studio painting. Keep the same recognizable adult face, daisy/bow, upright pose, amber brooch, open blank checklist and correctly held pen. Crucial correction: show the pocket watch CLOSED with its antique golden lid facing us, no dial, no engraved characters or numerals on the cover; use a simple small sunburst of clean unlettered ornamental lines on the cover. Preserve outline of all hair with clear lateral breathing room. Upright medium-long portrait to thighs, nothing lettered anywhere.
One consistent Japanese animation key-visual painter: clean fine warm espresso #3A241A tapered linework, exquisite but restrained transparent watercolor and artful cel-shaded gouache, soft warm daylight, luminous eyes, deft highlights, readable silhouette. Natural correct hands, five fingers per hand. Produce actual isolated RGBA transparency everywhere outside the figure/intentional effects. No background, decorative frame, border, printed text, letters, numerals, logos, signature, watermark, ground plane, cast shadow, vignette or colored backdrop. No pure black ink; darkest strokes are warm brown.
```

### claude · flagship · 入选

[masters/claude/flagship.png](masters/claude/flagship.png) · 生成文件 `exec-18de7c24-4e40-4027-b0f2-4ee90a4fb355.png` · SHA256 `18bd0cbc7673340ee6caa5d6284fbda0b2a9ee8acc5b869ae463bdb39c997784`。

1. `art/art-batch-10a/masters/claude/ref_sheet.png`
2. `apps/web/public/art/stage-b/claude.sonnet.webp`
3. `art/art-batch-12a/masters/claude/base.png`

```text
Use case: stylized-concept. A single polished production character cutout for Out of Tokens, one figure, upright portrait 3:4. Image 1 (character design sheet) and image 2 (existing powered-up portrait) are strict identity references. Translate this specific chibi character into a slender young adult anime character illustration, 5.5-head to 6-head tall natural figure proportions, NOT chibi, NOT super-deformed. Anatomically elegant neck, adult shoulder width ~2.1 head widths, normal sized face and hands, graceful long torso and arms. Frame crown through mid-thigh, never full-body, single coherent figure. Both eyes and signature head ornaments clearly visible. Entire top, ornaments, hair, lateral silhouette and props inside frame with generous transparent room. The only permissible crop is a clean horizontal lower edge across the thighs. Portrait-oriented compact composition.
Upright adult scholar, head at top and dress below, warm amber-orange eyes, long voluminous copper-orange curls, orange daisy with dark espresso lace bow and cream lace tails on her left (viewer right), ivory and black-brown vintage academic butler dress with amber brooch and gold pocket watch at the waist. Theme #C45B38.
FLAGSHIP / High-Spec Awakened: same artist and same adult face as image 3 (approved base portrait). A distinctly upgraded dynamic premium key visual with flaring layered fabrics, elaborate fine embroidery and a spectacular but localized themed prop/effect. Keep glows close, with true transparent gaps around every ribbon; no atmospheric fog or full-canvas glow.
Claude 3.5 Sonnet. Completely upright, dignified scholar with an amber-gold embroidered vintage ceremonial cape and intricate gold pocket-watch chains. Lifts her fountain pen in a sweeping calligraphic gesture; a glowing golden feather trail and a small amber wax-seal halo of pure abstract light trace her movement. No writing, stamps with lettering, numbers or characters.
Upright upright upright. The formal scholar plants her weight and looks confidently at the viewer while her raised pen traces an amber feather of light on the diagonal. Other hand relaxed, long asymmetrical tailored espresso cape with antique gold embroidery, layered ivory lace, bright amber sash and CLOSED gold pocket watch on chains. The wax seal halo shows an unlettered daisy motif only. No dial with numbers, no calligraphy, no actual letters.
Design a NEW pose and NEW silhouette, taking ONLY the facial identity and rendering finish from image 3. The flagship should read as a higher rank even at thumbnail size from the change in outline and costume. Paint the COMPLETE left and right outline, head, hands, hat and floating effects inside an empty transparent moat of at least 8% raw canvas on left, right and top. Pull the camera back to leave this breathing room. Let the lower hem or thighs end near the bottom. An intentional handful of bright accents, not a fog of sparkles. Fingers overlap naturally with clean joints; exactly two hands. Render a single character cutout, no layout or comparison.
One consistent Japanese animation key-visual painter: clean fine warm espresso #3A241A tapered linework, exquisite but restrained transparent watercolor and artful cel-shaded gouache, soft warm daylight, luminous eyes, deft highlights, readable silhouette. Natural correct hands, five fingers per hand. Produce actual isolated RGBA transparency everywhere outside the figure/intentional effects. No background, decorative frame, border, printed text, letters, numerals, logos, signature, watermark, ground plane, cast shadow, vignette or colored backdrop. No pure black ink; darkest strokes are warm brown.
```

### mistral · avatar · 入选

[masters/mistral/avatar.png](masters/mistral/avatar.png) · 生成文件 `exec-42c0b77b-1bf3-4920-acb6-ecc415c50e1a.png` · SHA256 `5369777f707e431dd73a240549738040569feeae0bd99f16c4da6ee79cafb6f1`。

1. `art/art-batch-10a/masters/mistral/ref_sheet.png`
2. `apps/web/public/art/stage-b/mistral.large.webp`
3. `art/art-batch-12a/masters/mistral/base.png`

```text
Use case: identity-preserve. Deliver one finished SQUARE avatar painting for a 32 px partner switcher, very large FRONT FACING expressive face with a tightly composed upper shoulder bust. Image 1 is her canonical design sheet; image 2 is the Stage B identity reference. Image 3 is her approved adult base painting. Match image 3 exactly in facial shape, amber pupils, red-orange wavy hair, hairline, vermilion hat with gold trim, two orange fox ears, ivory curled plume plus red feather accent, wardrobe and her warm playful smile. Paint her turned nearly straight toward camera in this bust, both eyes visible and open, face at the exact horizontal center. Balanced width of face and brim. Angle the wide-brim hat toward the viewer so its apparent width is compact; curl the plume close to its crown. Include BOTH ears and every part of the hat; all accessories retained and none cut. Arms and hands outside this shoulder portrait; compact curls and a narrow red shoulder cape with ivory bow finish the bust in a softly rounded silhouette. No body below collarbone, no disembodied hands, NO circular disc or painted badge behind her. Modern detailed watercolor anime young adult face, same slender 5.5–6-head body proportions implied as image 3, NOT chibi, NOT super-deformed. Gleaming well-defined amber eyes for strong reading at icon scale. The face with cheeks should fill almost half the width. Eye midpoint about 49% down in square composition. This is one high-resolution adult head portrait, NOT a standing pose. Transparent padding around complete hair and shoulders on all four sides. True transparent background.
Orange-red long wavy hair with marigold highlights and copper ends, amber-gold eyes, fox ears, broad vermilion witch hat with gold piping, a curled horn-shaped feather ornament (ivory curled plume like the reference, with a red feather accent), jewel clasp, lively red and ivory witch dress, one large fluffy copper fox tail. Theme #D06A4C.
One consistent Japanese animation key-visual painter: clean fine warm espresso #3A241A tapered linework, exquisite but restrained transparent watercolor and artful cel-shaded gouache, soft warm daylight, luminous eyes, deft highlights, readable silhouette. Natural correct hands, five fingers per hand. Produce actual isolated RGBA transparency everywhere outside the figure/intentional effects. No background, decorative frame, border, printed text, letters, numerals, logos, signature, watermark, ground plane, cast shadow, vignette or colored backdrop. No pure black ink; darkest strokes are warm brown.
```
