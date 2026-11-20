# Art-Batch 12A 生成与取舍

## 赛璐璐终版

用户通过的 Bluewhale V3 和双眼睁开的头像是本批画风基准，两张 PNG 与两张运行态 WebP 均保留原字节。R1 单独修正了肩胸平面、对称袖型和两手。其余五位均分别生成日常、觉醒和独立胸像。

从定调到终版共有 23 次成功出图，18 张入选，5 张退选。定调之后的 19 次出图全部使用内置 `image_gen`，均设置 `transparent_background=true`。

### 实际挂载的参考图

每次调用的前四个附件依次为官方 `style_reference.jpg`、该角色高头身原设 JPG、已通过的 Bluewhale V3 原始 PNG、当前角色大厅原始 `ref_sheet.png`。风格总图权重最高。第五个附件补充已通过的 Bluewhale 胸像与该角色 Stage B。各角色的文件路径和 SHA256 记录在构图文件中。[构图与输入记录](composition.json)

| 角色 | 高头身原设 | 大厅设定 | Stage B |
| --- | --- | --- | --- |
| bluewhale | `deepseek.jpg` | `art/art-batch-8/masters/bluewhale/ref_sheet.png` | `bluewhale.r1.webp` |
| qwen | `qwen.jpg` | `art/art-batch-10a/masters/qwen/ref_sheet.png` | `qwen.qwq.webp` |
| llama | `llama.jpg` | `art/art-batch-10a/masters/llama/ref_sheet.png` | `llama.3.1.webp` |
| mistral | `Mistral.jpg` | `art/art-batch-10a/masters/mistral/ref_sheet.png` | `mistral.large.webp` |
| gpt | `gpt.jpg` | `art/art-batch-10a/masters/gpt/ref_sheet.png` | `gpt.4o.webp` |
| claude | `claude.jpg` | `art/art-batch-10a/masters/claude/ref_sheet.png` | `claude.sonnet.webp` |

第五个附件为原图并排组成的 RGBA PNG。每格 424 × 424，使用 Pillow 的 LANCZOS 将原图等比缩小到 408 × 408 内，整像素向下取整居中，按原 alpha 合成在透明画布上。日常稿及 Bluewhale R1 使用两格，先放已通过的 Bluewhale 头像，再放当前角色 Stage B。其余五位的觉醒和头像在右侧第三格加入该角色已选日常母版。Claude 终版使用第四格补充此前闭盖怀表的退选稿，专门修正蜡封侧手掌。各拼图的输入顺序和成图 SHA256 见 `generationGuides`。

### 入选母版

| 角色 / 档位 | 原始出图文件 | SHA256 |
| --- | --- | --- |
| [bluewhale / base](masters/bluewhale/base.png) | `exec-b79924a5-bc42-410c-87e9-784f98af572b.png` | `9c1f8664ea314b53c1c401ed50b00c3cd44b363701766d7c080ece2d7052e0a5` |
| [bluewhale / flagship](masters/bluewhale/flagship.png) | `exec-806737cb-44f8-4a1c-a570-e511ca5702eb.png` | `e617595149ef2de2e9ba5231087a16c47763dee533a9074069ecde5424a0d718` |
| [bluewhale / avatar](masters/bluewhale/avatar.png) | `exec-89ccc8ec-252a-4d0b-b871-8446a8116fdb.png` | `fa3b413b626ccdc1f3207eb31df9a3a90bd2cb47d40bd823de14d1d795523142` |
| [qwen / base](masters/qwen/base.png) | `exec-0cbabc5b-0f54-4534-9955-0e9e80423a58.png` | `b0306852490d1cb2a0cacded63ca7602b4726e65a403c7f18f169bbc0fad3c72` |
| [qwen / flagship](masters/qwen/flagship.png) | `exec-bace9283-2c20-4117-9d1e-0052364e31ab.png` | `e4340905b6126ca458ac76e2c618ad41bfbc7d21dde56ec58d1650b022ffc17e` |
| [qwen / avatar](masters/qwen/avatar.png) | `exec-8c50d8bd-200c-42b0-996b-67b66cb00ed9.png` | `04d03da3054112718feeec4253279bd6e29a1267a42c83842b386a6dadc5efbf` |
| [llama / base](masters/llama/base.png) | `exec-27bd9990-061d-40c6-89df-92faa662d2c4.png` | `1ea291bc4ba17fbea9ebbc68c60855f1d46321f2a71626b4d475f6bc3d937387` |
| [llama / flagship](masters/llama/flagship.png) | `exec-81acb01c-f0de-420f-9655-84ce62916e62.png` | `6ddc3624e13721e2d8cd4d2c84b1894f1cd93789157331ff0310c9c3698e3283` |
| [llama / avatar](masters/llama/avatar.png) | `exec-6d6e27a4-6824-47dd-81cd-536c6942b56c.png` | `e9c51fe03611f316f492f410cf2891678ebc3359481e2f26f257168048786a7f` |
| [mistral / base](masters/mistral/base.png) | `exec-ef808ec9-1e31-46b2-b8b0-fa008fdc9de0.png` | `342c34f4884429d40c0324fe0f847ef95df63f783bbb11a7113df43200bd5d91` |
| [mistral / flagship](masters/mistral/flagship.png) | `exec-77933d77-267d-410f-ac66-9fe655d697e6.png` | `9fa2ca0c72b5691d82fd59cb0d67b101a792afdf9765c923e4f33d3f9c7efd32` |
| [mistral / avatar](masters/mistral/avatar.png) | `exec-d112183e-fdf0-4ae7-954a-6fb93886c005.png` | `9ae8251354ce047e02a5b41dbdf7411fb3c7b16d654f28e00fa69f20cc76379a` |
| [gpt / base](masters/gpt/base.png) | `exec-22ddc4e0-8e30-4151-a38c-bea5776009bb.png` | `be91d7eae857ee549ee9ac84618b52fe7f501e40564f43dacc5cb199b965d599` |
| [gpt / flagship](masters/gpt/flagship.png) | `exec-9d58a9d8-d964-43c6-b8ee-089d9d7e1aad.png` | `ff0f2f18c7e820d272ef67571549e1660ff25897ce40829098ade1fac407ce8d` |
| [gpt / avatar](masters/gpt/avatar.png) | `exec-45f8334c-d775-4f0f-9248-3efb4f5d30c4.png` | `e3d01e324c6e53d4c30742a215fde84bca029fc51f905c6bada5bc1d86790222` |
| [claude / base](masters/claude/base.png) | `exec-8b7946ca-22d2-4d37-8c94-74d1abf688eb.png` | `b44ed9d840f45f8c2de6ea2145dea80aa29a18d4041e54091866c377c8ba6e84` |
| [claude / flagship](masters/claude/flagship.png) | `exec-f1fba29f-cfb0-4b9a-9bd2-1731f4c881d3.png` | `925764a4b2a41058898c9752f8fa42e5fe8253ad2d20c5bf7ae1a275e3c15ac9` |
| [claude / avatar](masters/claude/avatar.png) | `exec-dc6bd4db-7e40-4114-9057-1b0c1d8b8208.png` | `7ba314349de3b11222a9dce3d1e69e3c0dab8345da1eb2a655d4f9a68b5625ce` |

### 赛璐璐退选稿

| 原图 | SHA256 | 退选原因 |
| --- | --- | --- |
| [bluewhale-flagship-cel-01.png](rejected/bluewhale-flagship-cel-01.png) | `7be067005b6677dab15bff5da840ed969612351c3fcc37366d80b414560e9780` | 定调初稿的肩胸方向和上身动势过于接近 V3，之后调整了星盘书的位置和角色动作。 |
| [bluewhale-flagship-cel-02-anatomy.png](rejected/bluewhale-flagship-cel-02-anatomy.png) | `098e61b6aed860d2ce1737e06429c0902a21658349f5349a3f956c0a6533b3dd` | 定调 R1 的回身角度过大，两侧袖型不一致，白袖手臂看起来从前胸接出。改用朝前肩线和同款海军蓝短袖。 |
| [qwen-flagship-cel-01-planning.png](rejected/qwen-flagship-cel-01-planning.png) | `e6859bdb0ee6c0e1398179e464e209e0e003c76a8c7faa3825a298ab7dc5aedd` | 三片叠放的星图在缩略尺寸下接近日常折扇，觉醒轮廓区分不足。改用多轴星轨和展开的礼服侧裙。 |
| [claude-flagship-cel-01-dial.png](rejected/claude-flagship-cel-01-dial.png) | `fb4568314b180cebed7893dfd7c6642b1968762330087176fe4cac727a9c64cc` | 怀表表盘出现罗马数字，违反无文字约定。重画为带一朵雏菊的实心闭合表盖。 |
| [claude-flagship-cel-02-palm.png](rejected/claude-flagship-cel-02-palm.png) | `35cf3bac6ce57253c2b0199841d4cbc5d03b449f8263d7c73642c2a31abcb169` | 托蜡封的侧向手掌有指尖重叠，缩小后只能清楚分辨四个指尖。改用迎向镜头的手掌并逐指检查。 |

### 定调通过后的逐次提示词

下列提示词把重复的原文收在共用段。把每段中的 `〔画风〕`、`〔构图〕`、`〔身份〕` 对应替换为以下原文，即为实际调用内容。每次调用只生成一个角色的一档。

**画风**

```text
Use reference 1, the official style_reference.jpg, as highest authority for the drawing: pure Japanese ACG light-novel and gacha illustration. Reference 2 is this character's official tall design, use that silhouette and identity. Reference 3 is the approved Bluewhale Base painting: match that exact artist’s eyes, soft round cheeks, teen-anime facial proportions on a young adult, thin warm brown/colored lines, tiny minimal dot or dash nose with zero bridge shading, short expressive ink mouth, light blush, airy high-key pastel cel shadow shapes and luminous hair. Ref 4 is this character’s lobby sheet, for exact hair ornaments, ears, eye color and outfit palette. Ref 5 is an identity/styling sheet: left shows Bluewhale’s approved avatar for consistent rendering, then this character's Stage B icon. Keep THIS subject's own indexed colors, clothing and decorations. No Bluewhale hair or maid props transferred. Polished 2D anime, simple purposeful celestial highlights and clean fabric folds. No pure black ink, photorealism, western or Korean painterly shading, dark chiaroscuro, cheekbones, nostrils, rendered lips. Never copy the poster labels, background panels, typography, checkboxes, logos, lettering, watermarks or grid. Exactly one isolated character on genuine transparent alpha with no colored backdrop or ground shadow.
```

**base 构图**

```text
A single vertical 3:4 character sprite, upright thigh-up portrait. Slender 5.5–6-head-total anatomy, with full hips and upper thighs in frame. Camera at comfortable chest height, natural relaxed face toward viewer, eye line nearly level. Head roughly one fourth the visible height. Both arms properly emerge from the outer shoulder joints, both clavicles and front of chest aligned, sleeves and cuffs of identical matching cut and color left and right. Hands naturally drawn at ordinary scale, five correctly jointed fingers per hand, partly occluded digits only where physically justified. Do not twist torso away or look over shoulder. Protect all sleeves, accessories and hair from side/top cropping; at least 4% empty above highest hat/ears and at sides, cut cleanly only at bottom thighs.
```

**flagship 构图**

```text
Vertical 3:4 upright thigh-up character sprite. Irresistible bright Japanese gacha awakened art by the same artist as the everyday painting. Same youthful face, regular slim 5.5–6-head full-body proportions with head around 1/4 of visible thigh-up height. Hips, chest and head face same general direction; at most 15–20° front three-quarter. Both shoulder seams, sternum and matching sleeve caps and cuffs connected to the same thoracic plane. Two correctly attached arms, conventional hand size, five naturally separated articulated digits on each hand where visible, anatomically placed thumbs. No extreme back twist or foreshortening. Dynamic upgrade comes from flying locks, cloth, and a character-specific magic prop. Keep generous transparent negative space between effects, face and hands. Limit lace density and rendered texture. Keep topmost accessory, sides and tail completely inside canvas with transparent margins; bottom ends at mid-thigh.
```

**avatar 构图**

```text
A square ONE-character front-facing bust portrait, matching the face size and framing of the approved Bluewhale avatar (left part of ref 5). Eyes both wide OPEN, gaze meets camera, naturally smiling small ink mouth with a warm welcome. Symmetric healthy shoulder anatomy and compact curved bust bottom. Show collar and both shoulders, no arms/hands/props reaching into frame; keep the shoulders visually narrower than the hair. Large face and clear pupils, simplified bold accessory silhouettes and gloss shapes readable at 32px and 48px. Entire hat, plume, ears, horns, tuft, ribbons and near-side hair ends fully inside; generous true-alpha padding around all four sides, a discrete self-contained shoulder-up bust with gently rounded ends above bottom (do not cut a rectangle off at screen edge). No magic, wings or halo. Only this character's own classic everyday outfit.
```

**qwen 身份**

```text
Qwen, a courteous young adult planning assistant. Periwinkle/lavender-blue wavy long hair, side braid, violet eyes, navy tilted beret with ONE ivory flower and a blue jewel + ribbon on image LEFT, blue bow, cobalt and ivory flowing attendant dress. Distinct graceful eyelash shape. Use the official Qwen's design and the flower side from the lobby.
```

**llama 身份**

```text
Llama, an open-source forest librarian. Creamy ivory fluffy hair in long soft curls, a pair of distinctive pale fluffy alpaca ears with warm pink interiors, blue infinity-shaped hair clip at her image RIGHT temple, small woodland green bows, clear sky-blue eyes; oatmeal ivory dress, pale sage accents and cream lace. Keep the lobby's two ears with gently yielding tips, bows, and soft woodland palette; no human ears added.
```

**mistral 身份**

```text
Mistral, a bright young fox-witch. Tangerine-orange to coral long wavy hair, amber-gold eyes, actual upright fox ears underneath a broad coral-crimson witch hat with thin gold rim, curled pale plume and small red feather, and one fluffy orange fox tail with pale tip. White/ivory and red lightweight witch dress. Lobby ears must remain distinct from the feather. Give her a sporty expressive anime smile.
```

**gpt 身份**

```text
GPT, a gentle elegant young adult mentor. Long silvery white hair with a faint lilac gradient, violet jewel eyes, matched pearly white horn-like ornaments curving upward with lavender tips, a white rose at image RIGHT temple, high curled ahoge, white/lilac frilled dress and violet neck bow. Airy fair-lavender palette; retain both horns entirely. Her own distinctive violet-eyed gentle gaze, no whale motifs.
```

**claude 身份**

```text
Claude, upright auburn-haired literary scholar. Long fluffy tangerine/copper-orange curls, amber-orange gem eyes, a distinct orange daisy over a large dark cocoa lace bow at image RIGHT temple, antique pocket watch at waist, ivory and espresso school-uniform dress with apricot accents. Polished young Japanese anime scholar, friendly intelligence and round cheeks. The figure is upright with top of head UP at top of canvas; ignore the upside-down gag in reference 1.
```

**bluewhale / flagship · 入选**

```text
Paint ONE finished upright Bluewhale / DeepSeek R1 awakened gacha sprite, vertical 3:4, transparent background, cut across mid thigh. Create a NEW anatomically sound front-facing pose from the approved Bluewhale. Reference 1 style_reference.jpg is the supreme Japanese cel style and face language. 2 deepseek.jpg is the official tall Bluewhale design. 3 is the approved same-game Bluewhale everyday, 4 is her lobby model, and 5 shows her approved avatar at left and her game icon at right. Use precisely her jewel blue eyes, small smiling mouth, tiny dot nose, pastel matte skin and line widths. Single slender character, natural 5.5–6-head anime proportions (thigh crop). Complete blue ahoge loop, scalloped white maid headband, blue bow, fin ears, long indigo to aquamarine hair, whale fluke behind skirt, tiny whale embroidery.
POSE DRAWING: Front, very gentle 10-degree three-quarter towards viewer. The sternum, center of collar and gold center button line all face the viewer together with her hips; full front bib visible. The two clavicles form one shallow arc and the two sleeve caps start at the actual shoulder tips on EITHER SIDE of the ribcage, both shoulders visible. Both arms have precisely matching navy short puffed sleeves, identical fine gold piping at the ends and identical white wrist cuffs. No cape or hair hiding the shoulder-to-upper-arm joins. Two arms of same realistic length: her right elbow by her right waist, forearm extending toward image LEFT with a naturally cupped upturned hand, five fingers under a small floating open midnight-blue and gold astrolabe book, with clear air gap. Her other elbow down along the outside of her left ribs, relaxed forearm opening to image RIGHT, elegant five naturally spaced fingers guiding a thin water ribbon. Both hands kept to either side of torso, natural thumbs, moderate-size hands in the picture plane, no foreshortening or overlapping extra hands. Head aligned with ribcage, both open eyes looking toward us, warm confident smile. NO extreme back twist, NO over-shoulder turn. Use wind through the ombré hair, light layered deep-blue dress, floating star gauze skirt panels, two fine water silk streamers and a few clear diamond crystals to animate the silhouette. Loose bright arcs of hair and sash; keep all costume edges away from fingers and face. Delicate warm colored Japanese lineart, high-key clean flat cel shapes, airy powder blue/violet reflected light; almost flat skin, absolutely no shading on nose bridge, no sculpted nose or lips, no Victorian painterly folds. Small geometric stars on blank pages, no writing. Single clean genuine alpha cutout, full external padding on top and sides, no floor, backdrop, ground shadow, panel, check marks, letters, text or watermark.
```

**qwen / base · 入选**

```text
〔画风〕
〔身份〕
〔构图〕
2.5 everyday, a reserved bright smile, light upright slightly front-three-quarter stance. A small partly opened indigo-to-lavender folding fan in one hand beside her shoulder, tips below chin and clear of her face; other hand cradles a slim plain light wood clipboard at the waist with two unmarked pastel page tabs. Simple matching ivory-lined blue sleeves and clean white front skirt. Compact, still silhouette, no magical effects.
```

**qwen / flagship · 退选一稿**

```text
〔画风〕
〔身份〕
〔构图〕
QwQ planner, confident open-eyed smile. Body and face forward, one shoulder only slightly nearer, dropped relaxed shoulders. A radiant sophisticated sapphire-and-cream ballroom planning dress, fine gold edging, pearl strands attached symmetrically, airy translucent indigo overskirt unfurling to one side, windblown periwinkle curls. One index fingertip lightly touches an elegant floating stack of three transparent blue-gold leaf-shaped polygon sheets with abstract constellations (dots and lines only); the other hand naturally gathers one end of the silk away from the first. No square UI panels. A few soft feathers and a thin orbital arc follow the sweep. Position prop to one side at chest height, clear negative space.
At the far right of ref 5 is this character's chosen new everyday portrait. Closely match that face, hairline, irises and ornament sides in this new painting.
```

**qwen / flagship · 入选**

```text
〔画风〕
〔身份〕
〔构图〕
Redesign the awakened composition from scratch. Make her recognizable as the awakened form even without looking at the face. The visual idea is a GLOBULAR CELESTIAL PLANNER: three OPEN interlocking elliptical sapphire-and-champagne orbital rings tilted on intersecting axes around a small luminous center and a few suspended tiny translucent constellation planes. Leave gaps between them, give absolutely no shape resembling fan blades, a book or a stack of paper. Float that glowing instrument at image RIGHT at shoulder level, where the nearer gently extended index finger maps its orbit. The opposite hand holds a blue silk pinion beside her hip on image LEFT. Face and ribcage toward viewer, eyes open, slight confident small closed smile, head almost level. Both matching short structured ivory silk puff sleeves with slim gold bands are clearly joined at real shoulder joints, both wrists have the same gloves or (preferably) both bare. NEW formal silhouette: a paired small pearl strand at collar, navy fitted ray-shaped bodice over white blouse, open split cobalt-to-periwinkle overskirt edged with a SINGLE simple gold arc sweeping diagonally, long sheer tails of fabric like lifted sails; preserve her own tilted blue beret and white flower, braided periwinkle curls streaming to image LEFT. Keep the upper silhouette poised and forward; make the motion in hair, sleeves and sweeping skirt rather than twisting the torso. A small number of clean broad flat shapes aid readability; minimize tiny embroidery and particles. No clocks, writing, poster elements.
Far right of ref 5 is this same character's chosen everyday version. Preserve the face, hair color and signature head accessory from it.
```

**qwen / avatar · 入选**

```text
〔画风〕
〔身份〕
〔构图〕
Soft cool-to-warm highlights in the bangs and crisp colored ink at the eyes. Natural upright head, clear separation between eyes and ornaments, both ears and hairpins consistent with official and lobby identity.
At the far right of ref 5 is this character's chosen new everyday portrait. Closely match that face, hairline, irises and ornament sides in this new painting.
```

**llama / base · 入选**

```text
〔画风〕
〔身份〕
〔构图〕
3 everyday, a gentle open-eyed curious smile, relaxed front-three-quarter stance, both shoulders and the waist visible. Cradle a compact kraft-paper loose-leaf handbook in one arm with visible plain leather binding and a SINGLE leaf bookmark. Other hand lightly rests on the cover with a natural bend of the fingers. Soft knit cream cuffs on both wrists, lightly pleated pale-sage and ivory skirt, sparse lace, stationery and gardening atmosphere, no magic.
```

**llama / flagship · 入选**

```text
〔画风〕
〔身份〕
〔构图〕
3.1 awakened keeper of the living archive. Full front of torso with a tiny natural lean, one elbow relaxed offering a floating OPEN deep forest-green volume above a warm upward palm left of her waist; other hand draws aside light green silk. An airy cropped forest-green cape with matching shoulders, fine wheat-gold braid on both sides, a couple of long split translucent leaf-veined panels, ivory lace dress beneath; pastel golden-green trim. A luminous branching seedling sprouts from the pages, and three large translucent green leaves ride an S-shaped current upward. Clear hands, buoyant pale curls, elegant dynamic forest silhouette distinct from everyday. Only leaf emblems on cover, blank pages.
At the far right of ref 5 is this character's chosen new everyday portrait. Closely match that face, hairline, irises and ornament sides in this new painting.
```

**llama / avatar · 入选**

```text
〔画风〕
〔身份〕
〔构图〕
Soft cool-to-warm highlights in the bangs and crisp colored ink at the eyes. Natural upright head, clear separation between eyes and ornaments, both ears and hairpins consistent with official and lobby identity.
At the far right of ref 5 is this character's chosen new everyday portrait. Closely match that face, hairline, irises and ornament sides in this new painting.
```

**mistral / base · 入选**

```text
〔画风〕
〔身份〕
〔构图〕
7B studio courier. Upright near-frontal stance, chest toward viewer. One elbow naturally rises at her side and fingertips lightly steady the near outer brim of her big crimson hat without crossing her face. Her other hand naturally holds the handle of a small closed tan leather messenger satchel at her waist. Matching ivory short ruffled sleeves, coral vest, simple red skirt panels. Lively, open-eyed friendly smile. Entire curled plume/hat edge visible. No magic, no over-shoulder look.
```

**mistral / flagship · 入选**

```text
〔画风〕
〔身份〕
〔构图〕
Large, awakened wind courier. Upbeat open-eyed confident grin. Straight front three-quarter torso and hips face the same direction. A symmetrical short scarlet capelet outlined with delicate gold wind-scroll curves, ivory and poppy-red layered festival dress, feather streamers and one sweeping fox tail. One hand presents a small levitating open vermilion spellbook with a gold wind-rose motif, the other reaches comfortably to the side along a narrow curling S-ribbon of apricot breeze. Star-shaped sparks and loose curls flow in the same wind. Keep the effects thin translucent and separated from wrists, shoulders and hands. Book pages completely free of writing.
At the far right of ref 5 is this character's chosen new everyday portrait. Closely match that face, hairline, irises and ornament sides in this new painting.
```

**mistral / avatar · 入选**

```text
〔画风〕
〔身份〕
〔构图〕
Soft cool-to-warm highlights in the bangs and crisp colored ink at the eyes. Natural upright head, clear separation between eyes and ornaments, both ears and hairpins consistent with official and lobby identity.
At the far right of ref 5 is this character's chosen new everyday portrait. Closely match that face, hairline, irises and ornament sides in this new painting.
```

**gpt / base · 入选**

```text
〔画风〕
〔身份〕
〔构图〕
3.5 everyday. Soft closed-mouth smile with both violet eyes open, approachable youthful mentor. Naturally facing forward, a narrow champagne-gold demonstration tablet held horizontally at her waist with BOTH hands on opposite side/bottom edges, fingers naturally curling around the plain bevel. Its back is blank, no logo or icons. Simple airy white and mauve dress with matching short lilac sleeves, paired light cuffs and clean broad skirt folds. A few silver hair strands arch softly, no magic.
```

**gpt / flagship · 入选**

```text
〔画风〕
〔身份〕
〔构图〕
4o, luminous multi-modal stage conductor. Open eyes and gentle delight, facing the viewer with symmetrical shoulder caps and a subtle front three-quarter lean. Weightless pearl-white and pale-lilac formal dress with iridescent silver edging and a pair of winglike TRANSPARENT lilac silk ribbons from her waist, softly sweeping curls. One open hand below a small hovering faceted triangular prism, its other end emitting three very fine interleaving rose/lavender/gold waveforms and little stars. Her opposite hand guides one arc farther to the outside, visibly separate from her body. Use bright crystal refractions, extremely light star gauze and a sweeping alternating hem. No feathery wings, no written music, no signs, no other characters.
At the far right of ref 5 is this character's chosen new everyday portrait. Closely match that face, hairline, irises and ornament sides in this new painting.
```

**gpt / avatar · 入选**

```text
〔画风〕
〔身份〕
〔构图〕
Soft cool-to-warm highlights in the bangs and crisp colored ink at the eyes. Natural upright head, clear separation between eyes and ornaments, both ears and hairpins consistent with official and lobby identity.
At the far right of ref 5 is this character's chosen new everyday portrait. Closely match that face, hairline, irises and ornament sides in this new painting.
```

**claude / base · 入选**

```text
〔画风〕
〔身份〕
〔构图〕
Haiku daily editor, fully upright, head UP, shoulders underneath, hips below. Gentle attentive open-eyed smile, frontal upright balanced stance. An open chestnut leather pocket notebook with absolutely blank pages in one hand at the waist and a small dark brown and gold fountain pen held in a natural tripod grip in the other, writing tip poised away from her face. Mirrored ivory sleeve caps and dark cocoa cuffs, uncluttered apron and a closed antique pocket watch on a short chain. Small warm contrast against cream blouse. No checkmarks, checkboxes, writing, symbols, rotation or stage effects.
```

**claude / flagship · 退选一稿 · 表盘**

```text
〔画风〕
〔身份〕
〔构图〕
Sonnet golden literary awakening, 100% upright. Eyes open, softly proud smile. Natural frontal three-quarter stance with hip, shoulder and face aligned; both shoulder seams clearly visible. An airy ivory and honey formal dress underneath two matching cocoa cape shoulders with fine amber embroidery; billowing lightweight copper silk panels, diagonal flow of loose curls, fine gold pocketwatch chain in front. A hand lifts an elegant long golden quill held as a real pen, other hand loosely offers a hovering circular amber wax seal embossed with a single daisy, comfortably away from face. A single calligraphic arc of golden feather-shaped light WITHOUT LETTERS curls behind her at waist height. Keep high-key warm, no heavy Victorian drapery; upright from hair at top to thighs at bottom.
At the far right of ref 5 is this character's chosen new everyday portrait. Closely match that face, hairline, irises and ornament sides in this new painting.
```

**claude / flagship · 退选二稿 · 手掌**

```text
〔画风〕
〔身份〕
〔构图〕
Fresh composition for the fully UPRIGHT Sonnet variant, with stronger hair and robe movement. The antique pocketwatch MUST have a CLOSED SOLID OPAQUE convex amber-gold LID, flat in profile with at most ONE tiny flower relief. No clock face, no numerals of any kind (Roman or Arabic), letters, tick marks, writing, check marks, black logos or book. Tall and properly vertical 3/4 forward-facing with shoulder line and chest aligned; both matching short ivory puff sleeve caps and matching warm dark cuffs clearly seen each side of the bib. Both large amber eyes open, subtle knowing closed-smile as she looks to the viewer. Change the scholarly everyday apron silhouette into an ivory and champagne formal gown with TWO honey-gold translucent cape tails billowing outward from matching short cocoa shoulder panels. Copper curls stream to the LEFT of canvas in deliberate broad curves. A long sweeping cream underskirt under petal-shaped copper-gold overskirt. Restrained clean anime folds, little embroidery. Draw BOTH simple naturally attached hands: image right hand elegantly writes in midair with one clearly outlined gold QUILL FLOURISH sweeping diagonally downward to her own waist. The other palm open, floating above it a WARM AMBER WAX SEAL with an orange daisy in relief, framed by a detached geometric luminous arc. Keep a visible air gap between seal and fingers. The luminous stroke is a single very broad loose C-curve (no glyph). Jewelry is only a closed case and chain. Maintain same cheerful youthful anime face and ordinary limbs, avoid overly ornate or dark painting. Full transparent cutout and all hair/props within the canvas.
Far right of ref 5 is this same character's chosen everyday version. Preserve the face, hair color and signature head accessory from it.
```

**claude / flagship · 入选**

```text
〔画风〕
〔身份〕
〔构图〕
Fresh composition for the fully UPRIGHT Sonnet variant, with stronger hair and robe movement. The antique pocketwatch MUST have a CLOSED SOLID OPAQUE convex amber-gold LID, flat in profile with at most ONE tiny flower relief. No clock face, no numerals of any kind (Roman or Arabic), letters, tick marks, writing, check marks, black logos or book. Tall and properly vertical 3/4 forward-facing with shoulder line and chest aligned; both matching short ivory puff sleeve caps and matching warm dark cuffs clearly seen each side of the bib. Both large amber eyes open, subtle knowing closed-smile as she looks to the viewer. Change the scholarly everyday apron silhouette into an ivory and champagne formal gown with TWO honey-gold translucent cape tails billowing outward from matching short cocoa shoulder panels. Copper curls stream to the LEFT of canvas in deliberate broad curves. A long sweeping cream underskirt under petal-shaped copper-gold overskirt. Restrained clean anime folds, little embroidery. Draw BOTH simple naturally attached hands: image right hand elegantly writes in midair with one clearly outlined gold QUILL FLOURISH sweeping diagonally downward to her own waist. The other palm open, floating above it a WARM AMBER WAX SEAL with an orange daisy in relief, framed by a detached geometric luminous arc. Keep a visible air gap between seal and fingers. The luminous stroke is a single very broad loose C-curve (no glyph). Jewelry is only a closed case and chain. Maintain same cheerful youthful anime face and ordinary limbs, avoid overly ornate or dark painting. Full transparent cutout and all hair/props within the canvas.

Ref 5 is a four-part strip: approved Bluewhale face, Claude's game miniature, approved Claude everyday, then the desired closed-watch Sonnet composition. Preserve the last image's copper-honey colors, quill, wax seal, flowing cape, closed floral pocketwatch, face and front-facing anatomy. REQUIRED CORRECTION to the SEAL-SIDE HAND on image RIGHT: move the seal slightly higher. Change from a side-on palm to an almost straight-on palm turned toward camera in a gentle greeting, so ALL FIVE individual fingertips independently silhouette against clean transparent air, with a generous gap to the floating round seal. Draw the thumb branching sideways low from the base of the palm, then an index, middle (longest), ring and shorter pinky, with four shallow V-shaped webspaces, all fingers naturally relaxed and gently curved; no two behind one another. Draw this entire hand and wrist inside frame, ordinary size. Grip the slim golden quill comfortably with the other hand. Prioritize clear hand anatomy, symmetric sleeves, 100% upright body, bright clean simplified cel art, absolutely no numerals or writing.
```

**claude / avatar · 入选**

```text
〔画风〕
〔身份〕
〔构图〕
Soft cool-to-warm highlights in the bangs and crisp colored ink at the eyes. Natural upright head, clear separation between eyes and ornaments, both ears and hairpins consistent with official and lobby identity.
At the far right of ref 5 is this character's chosen new everyday portrait. Closely match that face, hairline, irises and ornament sides in this new painting.
```

## Bluewhale 定调历史

首次定调时分别绘制了 Bluewhale 的 V3、R1 和头像。用户通过 V3 与头像，随后指出 R1 两肩与袖型的问题。下面保留当时的调用与选稿记录。

各次调用均按表中顺序挂载参考图。前两条路径从仓库根目录定位到工作区内的官方设定文件，原图文件名与 SHA256 可用于在其他检出位置核对来源。

| 输入 | 画稿用途 | 参考文件 | SHA256 |
| ---: | --- | --- | --- |
| 1 | 最高权重画风 | `../../dsh_docs/live2d_assets/Character-reference/style_reference.jpg` | `2e5eb208edb3ae49f7bffbd299a4a5960fbc902878e858424ae1b117b0f4daf1` |
| 2 | 高头身原设 | `../../dsh_docs/live2d_assets/Character-reference/deepseek.jpg` | `ceb4fe6ca8632d5a7e01b93b48b11bb1ec063a354931a85c49a5a58d55a103f4` |
| 3 | 大厅身份 | `art/art-batch-8/masters/bluewhale/ref_sheet.png` | `15d0e69f0e2cd9da3e619f8ec8130edd285fc410e2dc52c119c3bf5c743a04a3` |
| 4 | Stage B 身份补充 | `apps/web/public/art/stage-b/bluewhale.r1.webp` | `8ea8181da3380a8f776ba0786791da695552abd171921d2bd54a69c2b09f56c4` |
| 5 | 新日常脸，仅用于觉醒和头像 | `art/art-batch-12a/masters/bluewhale/base.png` | `9c1f8664ea314b53c1c401ed50b00c3cd44b363701766d7c080ece2d7052e0a5` |

| 画稿 | 生成文件 | SHA256 | 版本取舍 |
| --- | --- | --- | --- |
| [V3 日常](masters/bluewhale/base.png) | `exec-b79924a5-bc42-410c-87e9-784f98af572b.png` | `9c1f8664ea314b53c1c401ed50b00c3cd44b363701766d7c080ece2d7052e0a5` | 采用官方海报里的眨眼笑、点鼻和简洁女仆装；闭眼一侧的定位点标在眼睑弧线中心。 |
| [R1 首稿](rejected/bluewhale-flagship-cel-01.png) | `exec-0c4868b0-b38f-4df4-a76e-86a916823301.png` | `7be067005b6677dab15bff5da840ed969612351c3fcc37366d80b414560e9780` | 姿态接近日常版，调整了上身转向、书的位置和飘带轮廓。 |
| [定调时的 R1](rejected/bluewhale-flagship-cel-02-anatomy.png) | `exec-31c9b318-43cf-4797-a2de-cf60f51bfc2b.png` | `098e61b6aed860d2ce1737e06429c0902a21658349f5349a3f956c0a6533b3dd` | 首次定调时展示的回身托书稿，之后按用户的人体反馈归入退选。 |
| [高清头像](masters/bluewhale/avatar.png) | `exec-89ccc8ec-252a-4d0b-b871-8446a8116fdb.png` | `fa3b413b626ccdc1f3207eb31df9a3a90bd2cb47d40bd823de14d1d795523142` | 采用双眼睁开的独立胸像，完整保留呆毛、蓝结与侧鳍。 |

首次定调在只含 Bluewhale 输入的临时目录运行原版脚本，当时仅替换 Bluewhale 的记录。当前个人核验图与六人总览均已用终版重新导出。[当前个人核验图](review/bluewhale-review.png)

### 本阶段调用提示词

**V3 日常，输入 1–4**

```text
Image 1, style_reference.jpg, is the HIGHEST priority for every mark on the page. Study the blue-haired winking girl in its blue upper-left panel: the flat ivory face, round cheeks, blue oval iris, near-invisible point nose, tiny smiling mouth, the thin soft hairline and the two-tone folds. Reproduce that animation drawing language as standalone sprite art. Ignore all print layout and every other character. Image 2, deepseek.jpg: use the LEFT, adult-proportioned design only, for this specific character's body, costume construction and sweeping hair silhouette. Image 3, the lobby identity sheet: take the whale-fin ears, exact hair bow/headband and ink/cyan identity colours only. Image 4, Stage B: a secondary check on her whale identity only. Never transfer chibi proportions, glossy rendering or large doll head from the latter references.
Pure Japanese ACG anime illustration matching the exact art style of style_reference.jpg, modern Japanese light-novel & anime gacha character sprite, ultra-clean delicate thin colored anime lineart (#3A241A / matching dark ink, zero pure black), bright high-key airy pastel cel-shading with soft luminous hair halo highlights, cute youthful Japanese anime face with soft round cheeks, gentle pink blush, large sparkling jewel-like anime eyes, tiny minimal dot/dash nose with ZERO nose-bridge shading, dainty small expressive anime mouth with NO realistic lips, clean crisp airy anime fabric folds and lightweight frills, 5.5-head to 6-head slender young-adult anime proportions (NOT chibi), genuine transparent background.
Keep Bluewhale's one looping ahoge, long midnight-periwinkle hair in loose soft cobalt-to-aqua waves, white ruffle maid headband, little blue bow on viewer right, two sideways navy whale fin ears with white scalloped undersides, and a blue whale tail. Soft face shading stays within a single flat under-bangs shadow; pink cheeks, a single short nose mark and an animated mouth. Use generous unbroken colour areas and broad ribbon-like locks with only a few graphic highlights. The line between light and shadow should read like a clean hand-drawn anime cel. Hands drawn naturally.
BASE, DeepSeek V3. Draw one vertical 3:4 character cutout, from the entire ahoge down to mid-thigh. A playful wink on viewer RIGHT, looking at us with one wide, jewel-blue open eye on viewer LEFT, a small joyful open smile, gently tilted head. Easier, relaxed pose: cradling a slim, closed cream notebook at her waist and lifting a blue fountain pen loosely in her other hand. The left adult design's clean everyday navy-and-white maid dress: white bib, dark bow with a blue gem, four simple gold waist buttons, shoulder ruffles, airy white apron with a single tiny stitched whale near the lower side. A few spare pale blue fold shapes in white fabric, big simple folds in the overskirt; absolutely no allover embroidery or busy lace. Daylight and a buoyant studio mood. Keep the full ahoge, ribbon, fins, tail tip and both hands inside ample transparent top and side gutters. One intentional lower crop at mid-thigh. Match the face and simplicity of the girl in the first reference's upper-left panel, at her original apparent age and adult body scale.
NO Western fantasy art, NO Korean semi-realistic RPG painting, NO heavy thick oil painterly shading, NO realistic nose bridge/nostrils/cheekbones/full shaded lips, NO overly cluttered dark Victorian fabric rendering, NO text/letters/numbers/checkboxes/colored poster background/grid borders/logos/watermarks, NO upside-down pose. No matte backdrop, floor, drop shadow, stroke around the whole silhouette or printed poster elements. Only this upright character on alpha.
```

**R1 首稿，输入 1–5**

```text
Image 1, style_reference.jpg, is the HIGHEST priority for every mark on the page. Study the blue-haired winking girl in its blue upper-left panel: the flat ivory face, round cheeks, blue oval iris, near-invisible point nose, tiny smiling mouth, the thin soft hairline and the two-tone folds. Reproduce that animation drawing language as standalone sprite art. Ignore all print layout and every other character. Image 2, deepseek.jpg: use the LEFT, adult-proportioned design only, for this specific character's body, costume construction and sweeping hair silhouette. Image 3, the lobby identity sheet: take the whale-fin ears, exact hair bow/headband and ink/cyan identity colours only. Image 4, Stage B: a secondary check on her whale identity only. Never transfer chibi proportions, glossy rendering or large doll head from the latter references.
Image 5 is the NEW Bluewhale V3 painting in the target style. Carry over exactly her rounded face, short eye-to-chin distance, the proportions of the big blue eye, the thin colored outlines and the very simple cel-shadow shapes. Give her two OPEN eyes of that same design for this variant. Keep the cute youthful face of the adult Bluewhale, the high key blues and soft blue-to-cyan gradient hair accents. The global poster sample remains the first authority on the art style.
Pure Japanese ACG anime illustration matching the exact art style of style_reference.jpg, modern Japanese light-novel & anime gacha character sprite, ultra-clean delicate thin colored anime lineart (#3A241A / matching dark ink, zero pure black), bright high-key airy pastel cel-shading with soft luminous hair halo highlights, cute youthful Japanese anime face with soft round cheeks, gentle pink blush, large sparkling jewel-like anime eyes, tiny minimal dot/dash nose with ZERO nose-bridge shading, dainty small expressive anime mouth with NO realistic lips, clean crisp airy anime fabric folds and lightweight frills, 5.5-head to 6-head slender young-adult anime proportions (NOT chibi), genuine transparent background.
Keep Bluewhale's one looping ahoge, long midnight-periwinkle hair in loose soft cobalt-to-aqua waves, white ruffle maid headband, little blue bow on viewer right, two sideways navy whale fin ears with white scalloped undersides, and a blue whale tail. Soft face shading stays within a single flat under-bangs shadow; pink cheeks, a single short nose mark and an animated mouth. Use generous unbroken colour areas and broad ribbon-like locks with only a few graphic highlights. The line between light and shadow should read like a clean hand-drawn anime cel. Hands drawn naturally.
FLAGSHIP, DeepSeek R1 awakened illustration for a Japanese anime gacha game. One vertical 3:4 character from the complete ahoge through mid-thigh, center the eyes and readable figure in the stage area. Cheerful self-assured smile, BOTH bright anime eyes open, torso in three-quarter turn with an elegant diagonal arm gesture. Float an open deep-blue star atlas between her two hands at waist/chest height, palms naturally supporting the book's light, its pages made of sparse nonverbal star-map dots and geometric lines. Two or three clear pale-aqua prisms orbit it on one delicate water ripple arc. The upgraded cut of her maid dress must be unmistakable even as a thumbnail: lightly flaring short marine-blue shoulder cape with a single gold tidal border, pale blue star-organza overskirt with a long sweeping translucent sash that arcs across the navy skirt, small gold star fastenings. Leave a large white apron area with tiny whale motif visible. The upgrade comes from a bolder S-curve of hair and fabric, clean separated geometric shapes and costume silhouette. A few clean pleats rather than many jeweled layers, lace webs, heavy brocade or ornate metal filigree. Picture the identical Bluewhale anime character in a more dynamic splash-art pose, same delicate lines and flat daylight shading as V3. Generous crop clearance around head, magical book, both fins, sash and whale flukes on both sides. No book lettering, no overwhelming ambient glow.
NO Western fantasy art, NO Korean semi-realistic RPG painting, NO heavy thick oil painterly shading, NO realistic nose bridge/nostrils/cheekbones/full shaded lips, NO overly cluttered dark Victorian fabric rendering, NO text/letters/numbers/checkboxes/colored poster background/grid borders/logos/watermarks, NO upside-down pose. No matte backdrop, floor, drop shadow, stroke around the whole silhouette or printed poster elements. Only this upright character on alpha.
```

**R1 觉醒，输入 1–5**

```text
Image 1, style_reference.jpg, is the HIGHEST priority for every mark on the page. Study the blue-haired winking girl in its blue upper-left panel: the flat ivory face, round cheeks, blue oval iris, near-invisible point nose, tiny smiling mouth, the thin soft hairline and the two-tone folds. Reproduce that animation drawing language as standalone sprite art. Ignore all print layout and every other character. Image 2, deepseek.jpg: use the LEFT, adult-proportioned design only, for this specific character's body, costume construction and sweeping hair silhouette. Image 3, the lobby identity sheet: take the whale-fin ears, exact hair bow/headband and ink/cyan identity colours only. Image 4, Stage B: a secondary check on her whale identity only. Never transfer chibi proportions, glossy rendering or large doll head from the latter references.
Pure Japanese ACG anime illustration matching the exact art style of style_reference.jpg, modern Japanese light-novel & anime gacha character sprite, ultra-clean delicate thin colored anime lineart (#3A241A / matching dark ink, zero pure black), bright high-key airy pastel cel-shading with soft luminous hair halo highlights, cute youthful Japanese anime face with soft round cheeks, gentle pink blush, large sparkling jewel-like anime eyes, tiny minimal dot/dash nose with ZERO nose-bridge shading, dainty small expressive anime mouth with NO realistic lips, clean crisp airy anime fabric folds and lightweight frills, 5.5-head to 6-head slender young-adult anime proportions (NOT chibi), genuine transparent background.
Keep Bluewhale's one looping ahoge, long midnight-periwinkle hair in loose soft cobalt-to-aqua waves, white ruffle maid headband, little blue bow on viewer right, two sideways navy whale fin ears with white scalloped undersides, and a blue whale tail. Soft face shading stays within a single flat under-bangs shadow; pink cheeks, a single short nose mark and an animated mouth. Use generous unbroken colour areas and broad ribbon-like locks with only a few graphic highlights. The line between light and shadow should read like a clean hand-drawn anime cel. Hands drawn naturally.
R1 AWAKENED SPLASH POSE, one upright 3:4 isolated illustration from crown to mid-thigh. IMAGE 5 identifies the new V3 face and the incredibly clean flat cel linework only. Redraw a radically different gesture and silhouette from reference 5. Bluewhale has just SWUNG around to catch her constellation atlas: on viewer LEFT, a tilted deep-blue OPEN book floats at her SHOULDER height above her raised palm, with a gold astrolabe disk integrated in its binding and just a few star-map nodes on its pages; her other open hand reaches down and towards viewer RIGHT as if guiding a clear crescent of water, lightly foreshortened. Turn her hips away, shoulders twist back toward us, look directly at us with both round sea-blue eyes happily open and a small confident closed smile. A gust whips her loose ocean-blue hair in a long sideways arc behind her toward viewer RIGHT. An asymmetrical short sapphire sailor-mantle, single clean gold wave trim and a lighter sky-blue layer of organza, with TWO long translucent tide streamers turning in a broad S around the flared skirt. Show the flowing light fabric in large ribbon-like shapes with crisp single cel shadows; keep the white apron and whale tail readable. Two or three glass polyhedra and crisp floating starlight accent the gesture. Dress upgrade should read in the OUTLINE, not by multiplying costume folds or small golden details. Maintain the soft cheek, minimal dot nose, delicate sparse lines and high-key lightness of reference 1, no graphic material pasted in. Every part of ahoge, white headband, fin ears, hair, both hands and effects fully within the frame. Keep the broad gesture contained within the portrait width and maintain ample transparent gutters along the left, right and top. Both hands have natural joint directions and five fingers. No text or writing on book, no ambient fog.
NO Western fantasy art, NO Korean semi-realistic RPG painting, NO heavy thick oil painterly shading, NO realistic nose bridge/nostrils/cheekbones/full shaded lips, NO overly cluttered dark Victorian fabric rendering, NO text/letters/numbers/checkboxes/colored poster background/grid borders/logos/watermarks, NO upside-down pose. No matte backdrop, floor, drop shadow, stroke around the whole silhouette or printed poster elements. Only this upright character on alpha.
```

**头像，输入 1–5**

```text
Image 1, style_reference.jpg, is the HIGHEST priority for every mark on the page. Study the blue-haired winking girl in its blue upper-left panel: the flat ivory face, round cheeks, blue oval iris, near-invisible point nose, tiny smiling mouth, the thin soft hairline and the two-tone folds. Reproduce that animation drawing language as standalone sprite art. Ignore all print layout and every other character. Image 2, deepseek.jpg: use the LEFT, adult-proportioned design only, for this specific character's body, costume construction and sweeping hair silhouette. Image 3, the lobby identity sheet: take the whale-fin ears, exact hair bow/headband and ink/cyan identity colours only. Image 4, Stage B: a secondary check on her whale identity only. Never transfer chibi proportions, glossy rendering or large doll head from the latter references.
Image 5 is the NEW Bluewhale V3 painting in the target style. Carry over exactly her rounded face, short eye-to-chin distance, the proportions of the big blue eye, the thin colored outlines and the very simple cel-shadow shapes. Give her two OPEN eyes of that same design for this variant. Keep the cute youthful face of the adult Bluewhale, the high key blues and soft blue-to-cyan gradient hair accents. The global poster sample remains the first authority on the art style.
Pure Japanese ACG anime illustration matching the exact art style of style_reference.jpg, modern Japanese light-novel & anime gacha character sprite, ultra-clean delicate thin colored anime lineart (#3A241A / matching dark ink, zero pure black), bright high-key airy pastel cel-shading with soft luminous hair halo highlights, cute youthful Japanese anime face with soft round cheeks, gentle pink blush, large sparkling jewel-like anime eyes, tiny minimal dot/dash nose with ZERO nose-bridge shading, dainty small expressive anime mouth with NO realistic lips, clean crisp airy anime fabric folds and lightweight frills, 5.5-head to 6-head slender young-adult anime proportions (NOT chibi), genuine transparent background.
Keep Bluewhale's one looping ahoge, long midnight-periwinkle hair in loose soft cobalt-to-aqua waves, white ruffle maid headband, little blue bow on viewer right, two sideways navy whale fin ears with white scalloped undersides, and a blue whale tail. Soft face shading stays within a single flat under-bangs shadow; pink cheeks, a single short nose mark and an animated mouth. Use generous unbroken colour areas and broad ribbon-like locks with only a few graphic highlights. The line between light and shadow should read like a clean hand-drawn anime cel. Hands drawn naturally.
AVATAR, draw only one SQUARE illustration of the NEW V3 girl's face and upper shoulders, front-facing, straight and centered. For a 32 px game avatar: the eyes are large OPEN matching sea-blue ovals with a tiny star glint and clear eyelash line; a light happy small open anime smile, pink washes limited to the cheeks, nose barely one dot. Same youthful rounded cheek line, eye spacing, bangs, rhythm of thin coloured outlines from image 5. Frame the face large, about half the width of the artwork, and centre the midpoint of the eyes around 49% canvas height. Fold her single loop of ahoge close to her crown so the complete ahoge and frill headband fit; both sideways fin ears and tiny blue bow stay inside the edges. Full head entirely visible. Hair curls tuck close to the shoulders and finish in a rounded bust silhouette; include only her simplified white ruffles, upper navy collar and small blue-gem neck bow. No hands, pen, notebook or magic. True transparent margin all around every part, fully isolated bust intended to read on cream and dark walnut UI, no circle, solid panel or backdrop. Match the first reference face in clean paper-bright cel colour. Square shoulder avatar, not a tall standing character.
NO Western fantasy art, NO Korean semi-realistic RPG painting, NO heavy thick oil painterly shading, NO realistic nose bridge/nostrils/cheekbones/full shaded lips, NO overly cluttered dark Victorian fabric rendering, NO text/letters/numbers/checkboxes/colored poster background/grid borders/logos/watermarks, NO upside-down pose. No matte backdrop, floor, drop shadow, stroke around the whole silhouette or printed poster elements. Only this upright character on alpha.
```

## 初版归档

以下为本地提交 `6f0b76e2511744a620ced75aafbb5eca2e51c289` 的历史记录。Bluewhale 初版的三张图可用该提交和各自原文件路径取回。

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
