# Art-Batch 12B 生图提示词与选稿

六位伙伴分别生成日常立绘、觉醒立绘和独立胸像。内置 `image_gen` 共输出 28 张透明 PNG，18 张入选，均以原始字节保存在 `masters/{id}/`。调用参数为 `transparent_background=true`，工具未提供模型版本或随机种子。[母版与运行图哈希](manifest.json)

## 参考图与构图

每次生成均挂载五个附件。下表记录逐角绘制时的顺序，Kimi 最终修谱的两处附件调整见文末。原设 JPG 和总画风 JPG 是用户提供的外部参考。仓库只保存路径、字节数与 SHA256。双眼坐标均按画面左右标注。[构图坐标与参考索引](composition.json)

| 附件 | 日常立绘 | 觉醒立绘与独立头像 |
| --- | --- | --- |
| 1 | `Character-reference/style_reference.jpg` | 同一张画风总图 |
| 2 | `apps/web/public/art/portraits/base/bluewhale.webp` | 下述 Bluewhale 三图拼版 |
| 3 | `apps/web/public/art/portraits/flagship/bluewhale.webp` | `Character-reference/{id}.jpg` |
| 4 | `Character-reference/{id}.jpg` | `art/art-batch-10b/masters/{id}/ref_sheet.png` |
| 5 | `art/art-batch-10b/masters/{id}/ref_sheet.png` | `art/art-batch-12b/masters/{id}/base.png` |

Bluewhale 拼版由终版 `base`、`flagship`、`avatars` 中的三张 WebP 依次组成。将每张以 Pillow `ImageOps.contain` 和 LANCZOS 等比缩放至 432 × 544 以内，在各自的 448 × 560 格内整像素向下取整居中，按 alpha 合成至 1344 × 560 透明画布。拼版 PNG 的 SHA256 为 `0ca36aaceb60471937818289a7f23cc8ffc13554c8a0540708ec16643ddc78e4`。

## 提示词组合

逐角绘制时依次连接六段原文，中间各空一行。顺序为附件说明、共同画风、档位构图、角色身份、该档动作与服装、共用限制。Kimi K2 在此基础上做了局部修谱，三次校样的完整提示词附于文末。

| 角色 | 日常 | 觉醒 | 头像 |
| --- | --- | --- | --- |
| kimi | 日常 | 觉醒修正版 → 五线谱校样 C | 头像 |
| gemini | 日常修正版 | 觉醒修正版 | 头像 |
| grok | 日常 | 觉醒修正版 | 头像 |
| glm | 日常 | 觉醒修正版 | 头像 |
| minimax | 日常 | 觉醒修正版 | 头像 |
| seedance | 日常 | 觉醒修正版 | 头像 |

### 共用原文

**日常附件说明**

```text
Input 1 is the Japanese style poster. Inputs 2 and 3 are the approved Bluewhale everyday and awakened sprites, the exact drawing, face scale, soft light, and mid-thigh framing target. Input 4 is THIS character's original Japanese design, adult version. Input 5 is THIS character's lobby identity sheet. Transfer the Bluewhale artist's hand, not her hair, costume or props. Keep the identity and palette in 4 and 5. The new art must look like a fellow cast member painted in the same session.
```

**觉醒与头像附件说明**

```text
Input 1 is the style poster. Input 2 shows the actual 12A Bluewhale everyday, awakened and open-eyed avatar from left to right; use their airy line and cel treatment, figure scale or bust framing as appropriate. Inputs 3 and 4 are THIS character's original Japanese design and lobby identity sheet; 5 is this character's selected 12B everyday master. Match the same face, headwear, colors and characteristic hairstyle as 5.
```

**共同画风**

```text
pure Japanese ACG anime illustration matching the exact art style of style_reference.jpg and Art-Batch 12A bluewhale, modern Japanese light-novel & anime gacha character sprite, ultra-clean delicate thin colored anime lineart (#3A241A / matching dark ink, zero pure black), bright high-key airy pastel cel-shading with soft luminous hair halo highlights, cute youthful Japanese anime face with soft round cheeks, gentle pink blush, large sparkling jewel-like anime eyes, tiny minimal dot/dash nose with ZERO nose-bridge shading, dainty small expressive anime mouth with NO realistic lips, clean crisp airy anime fabric folds and lightweight frills, 5.5-head to 6-head slender anime proportions (NOT chibi), genuine transparent background
```

**日常构图**

```text
Studio Everyday. Exactly one standing young adult character, hair crown to mid-thigh, 3:4 vertical game portrait. Camera square to her front at chest height; at most a gentle front three-quarter angle. Chest, shoulders and hips aligned, two naturally joined arms and matching sleeve construction, correctly articulated hands with five ordinary digits. Same LARGE face scale as Bluewhale: head roughly one quarter of visible thigh-up portrait. Place her top and side silhouette and accessories wholly within the canvas, crop only at mid-thigh along the bottom. Express personality through a small facial gesture and a clear work prop. Simple economical background-free silhouette.
```

**觉醒构图**

```text
High-Spec Awakened. One upright mid-thigh-up young adult, vertical 3:4 sprite matching the scale and bottom crop of Bluewhale. Keep head roughly one quarter of visible height. Natural FRONT or slight FRONT THREE-QUARTER torso and face. Shoulder seams match left and right; collar, clavicles and hips agree. Two beautifully drawn hands, five natural fingers, relaxed thumbs, no forced foreshortening. The silhouette, gesture and grown-up outfit should make this an unmistakable upgrade even at 120px, while the eyes and face stay the same. Restrained translucent signature effects clustered near hands and garment, with real empty gaps. Keep entire top and side silhouette inside transparent margins, crop only at mid-thigh along lower edge.
```

**头像构图**

```text
Square standalone, closely framed head-and-shoulders bust for a 256px avatar. Front or tiny front three-quarter turn, BOTH EYES WIDE OPEN AND VISIBLE, gaze into camera, small welcoming smile. Eye center close to middle width, 46.5% down. Match the Bluewhale square avatar's facial scale and chest crop. Show upper shoulders, signature collar, all head ornaments and ear/halo tips, with transparent breathing room on all four edges. Large clean face, distinct iris highlights and grouped locks readable at 32px. Compact bust with a gently curved, finished lower silhouette, floating centered above the bottom edge. No hands or handheld props. Everyday styling.
```

**共用限制**

```text
One isolated 2D character. Actual transparent alpha, including outside curls and between effects. No scenery, floor, shadow, plate, border, type, pseudo-writing, initials, lettering, numerals, poster graphics, checkboxes, signature, insignia or watermark. Props and badges are entirely blank or simple nonlinguistic geometry. No Western or Korean semi-realistic painting, realistic lips, shaded nose bridge, heavy gradients or painterly textures.
```

### kimi

**角色身份**

```text
Kimi, a serene archivist. Long softly waved silver-lavender hair with faint periwinkle shadows, clear BLUE irises, white scalloped lace maid headdress and a dark-navy bow with a gold starburst at image RIGHT, a single dangling blue bead. Navy-and-white formal maid dress, small star at her navy throat bow and a tidy white pleated bib. Ink navy #222944. Preserve gentle arched brows and a small quiet smile.
```

**日常**

```text
Calm librarian stance. She hugs one substantial navy cloth-bound hardback notebook against her chest, its pale paper edge fanning four separately colored blank index tabs at the top and side. One arm supports the book from underneath, the other hand lies naturally against its cover. Simple navy sleeves ending in matched pale ruffled cuffs. Understated and approachable.
```

**觉醒初稿**

```text
She conducts the long-memory symphony with a delicate fingertip gesture to one side. Layered midnight navy and antique-gold-thread formal gown, translucent star-tulle capelet lifted to reveal matching sleeves; a swooping five-line musical star orbit and two folded luminous paper leaves, only small stars on blank pages. Airy negative space, regal stillness in her face. Free hand rests gracefully on the navy skirt, far from the floating pages.
```

**觉醒修正版**

```text
Design the K2 formal outfit as a GRAND FLOOR-LENGTH deep midnight navy ball gown with narrow gold-thread constellations embroidered on a continuous navy skirt. The camera crops the unbroken fabric at mid-thigh; its hem and all legs are far below the image. Replace the daytime apron and buttoned bib with a graceful pale gathered neckline, star clasp and tailored deep navy bodice. Generous translucent constellation-tulle stole floated around the shoulders. Turn her head a few degrees to image LEFT, eye line nearly LEVEL, gentle serene smile. She guides five parallel curved gold staff lines and two translucent blank sheets with the tips of her bare fingers, no baton, tool, book or wand in her hand. One hand lifts with its index out and four other relaxed correctly jointed digits, the other hand follows the skirt low. Keep all fingers, headwear, effects and outer hair tips fully inside an 8% transparent top/side inset. Do not transfer the short hem of version 5.
```

**头像**

```text
Gentle open-eyed smile and calm blue gaze. Keep the whole white ruffle and starburst bow, long pale lavender locks curling softly around both shoulders, deep navy neck bow and white collar.
```

### gemini

**角色身份**

```text
Gemini, a playful prism magician with long periwinkle blue to violet wavy hair, fluffy purple CAT ears with ivory inner tufts, small side buns, iridescent four-point star hair clip on image RIGHT, violet star-trimmed magical dress (#675BC8). Absolute eye orientation READ FROM THE VIEWER: the iris on the LEFT SIDE OF THE PICTURE is vivid rose PINK; the iris on the RIGHT SIDE OF THE PICTURE is clearly warm honey GOLD, directly below the star clip. Both eyes open. These are solid, distinct iris colors, never reversed.
```

**日常初稿**

```text
A bright multimodal demo. On one naturally upturned hand she presents a small geometric clear crystal prism which catches a delicate rainbow along one edge. Free hand makes a relaxed theatrical presentation near her waist. Streamlined violet star dress, playful direct smile, face entirely clear of hands and prism.
```

**日常修正版**

```text
A bright multimodal demonstration, both eyes open, vertical head and natural front shoulders. One clearly formed relaxed hand grips the BASE of a small handheld crystal prism by its narrow little silver mounting, three fingers wrap the mount and thumb visibly opposes the index; put the little rainbow reflection INSIDE the crystal. Other hand rests flat on the side of the violet skirt near her hip, BACK of hand facing the viewer; visibly draw one thumb and four separately outlined increasingly short fingertips with narrow readable gaps. Preserve all five digits on each hand. Streamlined violet star dress and a cheerful smile. Keep both hands away from the face.
```

**觉醒初稿**

```text
She opens both palms at different gentle heights to release two separated floating solid-light prisms, one rosy pink, the other honey gold. An elegant multilayered galaxy-violet evening dress with luminous pink-and-gold star ribbons and a restrained fine orbit of stardust. Let one broad ribbon echo the curve of her wavy hair. Keep light away from irises to preserve their true pink on image left, gold on image right.
```

**觉醒修正版**

```text
An elegant galaxy-violet BALLROOM MAGICIAN'S GOWN in a noticeably different cut from the daily dress: a star-cut fitted waist and a sweeping layered midnight-violet tulle overskirt, two broad floating silk streamers, one pink and one gold, their starburst tips visible. She releases two translucent light prisms: a rosy pink prism floats to picture left, a honey-gold prism to picture right. Both hands slightly open, raised at different levels, fingers CURLED loosely toward the prisms with BOTH palms rotated to a front 3/4 view so each thumb and all four fingertips on each hand are individually visible with air gaps. Avoid the edge-on upturned-palms pose. Keep all hands inside central 70% of frame. Confident direct smile and near-level eyes, blue-lilac hair. Light is localized, with only a few restrained orbit stars. Never contaminate the pink viewer-left and gold viewer-right irises.
```

**头像**

```text
Straight-on, cheerful eyes BOTH OPEN. Unmistakably PINK iris on viewer's LEFT and GOLD iris on viewer's RIGHT, star clip above the gold eye. Show both cat ears fully with space above the highest tuft, two wisps and violet collar.
```

### grok

**角色身份**

```text
Grok, a mischievous brass-and-gold gothic investigator (#C98A24). Honey-blonde wavy high twin ponytails with a looping curled ahoge on top, tiny black-and-gold openwork gothic crown, bright blue eyes and two clearly pointed ELF ears. On EACH ponytail an individual dark bow with small distinctive bat-wing-shaped tails, as in the reference, visible beside the temples. Charcoal and gold gear-edged gothic dress with a touch of white ruffle.
```

**日常**

```text
Playful, curious front three-quarter stance. Near her shoulder she holds one little brass magnifying glass by its handle, its clear lens away from her eyes. Lifts chin a touch, knowing sideways smile with direct blue eyes, free hand lightly gathers the dress near her hip. Keep dress embellishment simple and lens perfectly clear.
```

**觉醒初稿**

```text
A lively brass celestial armillary sphere floats just above one outturned hand. The three concentric engraved brass hoops are blank, with a warm gold starflame in the center. Other hand lightly holds a gilded ribbon at her hip. Gorgeous gear-edged black-gold steam-gothic court dress with a flaring overskirt, small precise cogs, gilded sash and wine-colored underside. Confident playful smile, compact clean gold spark light, no weapon.
```

**觉醒修正版**

```text
A spirited clockwork astronomer in BLACK-AND-GOLD STEAMPUNK COURT REGALIA, tailored black bolero with matched sleeves over a high-waisted wine-lined bustle, two articulated brass gear clasps, asymmetrically sweeping gold silk sash, and precise gold piping. Keep the design luminous and graphic with few deliberate details. Chin nearly upright. A complete small brass astronomical armillary spins above her bent hand on image RIGHT. Three empty overlapping brass hoops enclose a small warm gold star flame. Her hand is angled palm FRONT toward camera at a slight tilt so the thumb and four fingertips are individually drawn, subtly curled like a cradle. Each finger connects to her palm, ordinary proportions. The opposite hand rests lightly on the low sash. Keep the whole sphere, both free hands, both prominently bat-winged bows and every fingertip inside generous transparent margins. Clever direct gaze and a playful, tiny fanged smile, no added letters on the blank rings.
```

**头像**

```text
Front-facing knowing smile, two open BLUE eyes, both elf ears, tiny black-gold crown and curled ahoge. Include BOTH ponytail bat-wing bows in full inside the cropped bust. Ivory collar with one little brass gear.
```

### glm

**角色身份**

```text
GLM, a composed architect. Long charcoal hair shaded progressively midnight blue at the tips, cool grey-violet eyes, a pair of black-furred WOLF ears with thick white inner tufts, white lace maid headdress with a silver-and-ice-blue tassel at image RIGHT. Black and white gothic maid couture. One expressive BLACK WOLF TAIL with a clearly pure-ivory white end, a distinct fluffy tail visible outside her dress on the standing portraits. Theme charcoal #4A4E57; preserve bright whites.
```

**日常**

```text
Quiet attentive architect stance. One hand securely holds an unmarked frosted grey tablet horizontally just below chest level, other hand loosely grips a slim stylus above it. Both wolf ears and the white-tipped tail visible. Black bodice, white pleated bib and sleeves, quiet precise cuts. A small calm smile.
```

**觉醒初稿**

```text
Composed ice-blue architectural magic. One upturned hand unfolds a floating, translucent ice-blue wireframe matrix: two or three interlocking open geometric architectural volumes with crisp transparent negative space, no labels, numbers or runes. Other hand poised below at the waist. Long black-and-white formal gown with silver thread and a sharply tailored half-cape separate from matching sleeves. Unfurl her fluffy white-tipped black tail prominently on the opposite side from the matrix.
```

**觉醒修正版**

```text
GLM Plus formal design. Replace the daily mini-dress with a full-length structured black evening gown. Continuous floor-length skirt in black satin with a slim ivory center panel, clean diagonal silver piping, sharply cut HALF CAPE on one shoulder over two symmetrical tailored sleeves. The skirt continues below the mid-thigh camera crop: no visible thighs, bare legs, short hem, apron or petticoat. White-tipped wolf tail arcs outside the skirt. Square LEVEL shoulders and head, face up and engaged, quiet authority. On image RIGHT, unfold an abstract glowing ice-blue spatial matrix: three overlapping OPEN wireframe cuboids with nodes on their vertices and a few split glass planes. Let the viewer see clear alpha through the boxes. This is pure non-figurative three-dimensional geometry, no house, miniature building, architecture facade, arch, UI or text. Her raised index traces one vertex, the other relaxed fingers and thumb are naturally separated. Her other hand lightly gathers the edge of the cape. Keep all hands and matrix vertices completely inside generous transparent side margins.
```

**头像**

```text
Both grey-violet eyes softly OPEN, quiet small smile. Keep entire pair of black-and-white wolf ears, white headdress and dangling silver-blue tassel intact; her dark hair frames a luminous clear face above the white maid collar.
```

### minimax

**角色身份**

```text
MiniMax, a warm-hearted stage rehearsal director (#A8547E). Long coral-orange waves with one side braid secured by a pink clip, honey amber-orange eyes, a cream beret with a pink satin bow and a little pink flower. Ivory jacket with a pink-trimmed collar, camel plaid skirt, a distinctive small cross-body piano-key purse at the waist on a single pink shoulder strap: visible alternating ivory and charcoal musical keyboard keys. Rose accents. No brand marks.
```

**日常**

```text
She cradles a plain rose-colored closed rehearsal score folder, with a few plain cream paper edges, in a relaxed hand at her side; her other hand rests on its upper edge. Welcoming open-eyed smile and poised upright figure. Place the score at the OTHER hip from the clearly exposed rectangular piano-key purse, whose keys can be counted at thumbnail size. Cream pink-trim collar, skirt plaid.
```

**觉醒初稿**

```text
A conductor caught on an upbeat. Raise one slender luminous brass conductor's baton diagonally beside her head, held delicately with a natural grip, while her opposite hand cues the music low and open. A stage-coat gown with descending rose-gold gradient, ivory lapels, dusty rose silk ribbon tails; two gentle rose-gold soundwave bands and a couple of small musical note sparkles. Keep the cream beret, side braid, pink tie and the unmistakable small piano keyboard purse at her belt, unobscured. Energetic poised face.
```

**觉醒修正版**

```text
Stage conductor at the climax of a rehearsal. Build the new silhouette with a long tailored ivory and rose-gold TAILCOAT, flowing ribbon tails, flared lapels and a rose gradient woven into the cloth. Echo the camel plaid in one inset panel, the piano-key purse is still prominently visible. Level eyes and engaged warm smile, neatly aligned shoulders. Bring her conducting gesture INSIDE the composition: one bent arm holding a thin polished brass baton high on image RIGHT, one cuing hand closer to her torso on image LEFT near the sternum, palm angled down and relaxed, visible distinct tips. Exactly two complete hands, a thumb and four well-defined fingers; leave at least a hand-width of transparent air after the outermost fingertip and baton tip, neither arm reaches toward a canvas edge. A single rose-gold arc with two musical notes floats in the empty space near the baton, plus a second rising soundwave band near her waist. Whole beret, jewelry and hands included, bottom crop through draped coat near mid-thigh.
```

**头像**

```text
Kind amber eyes, both open, warm smile. Entire cream beret, pink flower and satin bow, side braid and pink clip, a hint of blush collar and coral waves. Keep the face large.
```

### seedance

**角色身份**

```text
Seedance, a focused young film director, violet eyes and a wavy high SIDE ponytail on the viewer's RIGHT fading purple to cyan at the tips. The ponytail is actually threaded through a thick luminous CYAN HALO RING hair tie; the ring is seated at the hair root, never floating above the head. White, blue and purple asymmetric stage tailoring with matching sleeves, teal ribbons, blank ice-blue badge on a visible neck lanyard. Teal #2C7A7B, restrained bright cyan.
```

**日常**

```text
Focused filming-day stance, a small blank storyboard board tucked at her hip with pale geometric storyboard panels, and a separate lightweight matte dark rectangular director's viewfinder in the raised hand to the side, safely away from the face. Fingers grip the lower corner, no hands overlap. White/blue/violet asymmetrically draped short stage coat, blank badge. Natural attentive smile.
```

**觉醒初稿**

```text
A confident film director raises one hand underneath a floating, open, semitransparent CYAN cinema viewfinder light frame placed beside her face; absolutely blank inside with small corner ticks only. Her opposite arm sweeps low as two curving fragments of translucent film with sparse sprocket holes and one restrained lens glint follow the trailing cyan silk ribbons of her white/teal/violet luminous director's regalia. Keep film trails local, her face and the hair-tie halo both clear.
```

**觉醒修正版**

```text
Create the awakened director's NEW gala regalia for a film premiere: a fitted high-collared pearl-white and indigo formal jacket with distinct iridescent lapels, silver piping, two matched tailored sleeves, broad asymmetric teal sash, and split long organza coat tails with flying cyan ribbon streamers. No everyday short skirt-and-belt silhouette. Set head upright, shoulders front, bright confident intent. Image RIGHT hand raised beside the shoulder toward an OPEN cinematic cyan viewfinder made of four sleek luminous glass corner brackets with a completely EMPTY center. Let the far edge of the open bracket be visible beside the ponytail and keep the cyan hair-ring easy to see. A slender broken filmstrip orbit with sprocket holes sweeps diagonally near the opposite hip, just two lens glints. Her other hand pinches the teal sash at the waist. Natural wrists and five clearly drawn fingers, both hands and viewfinder fully inside, at least an 8% transparent top/side inset. Keep magical light crisp with transparent gaps, avoid any broad neon panel or luminous fog.
```

**头像**

```text
Both bright purple eyes open, lively focused smile. Complete cyan luminous ponytail ring on viewer's right, violet-to-cyan ponytail curling down beside her face, crisp collar and a glimpse of the lanyard. Simplify outward curls for small sizes.
```

## 取舍记录

入选母版的原始输出文件名、SHA256、双眼位置和头部区域可按角色与档位查阅。下表列出最初七张退选稿。另有三张 Kimi 修谱过程稿，包括作为编辑输入的四线原图（`exec-92701c92-4f50-47ef-bf41-97d158de4dd3.png`，SHA256 为 `e69cc101fac92217e5ae58a17d913f0e7571e50f0a49c242818bac131a6702cf`）与文末的校样 A、B。[入选记录](composition.json)

| 退选稿 | 原始 PNG 与 SHA256 | 改动依据 |
| --- | --- | --- |
| Gemini 日常 | `exec-1f22f38b-8763-45c7-8b01-d989d4ec742c.png`<br>`42f84705fded28d6de25ea009b2ccad36961732c72b7942b55ee6f25772c50e6` | 托棱镜及扶裙的指尖重叠。入选稿改握细托柄，另一手轻放裙侧。 |
| kimi 觉醒 | `exec-f3cac3c2-d3da-4f72-b346-3ecf5f248645.png`<br>`e4a920c7735e6592519f5db4ae638c369ebe05799beb220530a64ab157040808` | 首稿仍露出短裙下摆。第二稿改成长及画外的藏青金线礼裙，让指尖直接牵引书页。 |
| gemini 觉醒 | `exec-bc9c11e9-9601-46e8-8c68-8c2be3a50bd3.png`<br>`e766b52c472e3d9d5a30847c1d63e53a5587b3f8cb4e10a89f87d00c0b892f34` | 首稿的侧向掌心遮住指尖，飘带与日常裙摆接近。第二稿让两只手向内微拢，粉金双带分别呼应两颗光棱镜。 |
| grok 觉醒 | `exec-8c88f006-f5a0-4b98-b40b-6b1ff177bcd7.png`<br>`6404cc3dc4de07f5fedcf0415587b050dc2c5c13d56c3bf7b12060efdff70bbb` | 首稿的托举动作与日常放大镜都集中在画面左侧。第二稿将星象仪移到右侧，补出短礼服外套和横贯腰际的鎏金饰带。 |
| glm 觉醒 | `exec-b82f7ae7-be60-4c78-8db2-fd8078fcd0e7.png`<br>`b5593e61f0832cd8436c56f9c9833a5c487792e62ac3bbd51a1a6b249b3628c3` | 首稿的投影更像带拱门的建筑模型，裙长也接近日常装。第二稿用顶点与透明截面表现空间矩阵，银线长裙延伸至画外。 |
| minimax 觉醒 | `exec-edef4737-aefe-4109-a536-a06066f68e77.png`<br>`dc9dc4bceac9587a7396f845a9751097b613b39eb8713034370cc2214d86f8b7` | 首稿的提示手伸到画面右缘。第二稿把这一手收回胸前，黄铜棒、琴键包和腰际声波各有位置。 |
| seedance 觉醒 | `exec-04cc4c92-9f0b-4095-9e38-7208bf693187.png`<br>`f07866e26121fbec356354fe0bf45169c5f2f962e480f08c81e30fdd5398ea3e` | 首稿的短衣、腰带和日常装轮廓接近。第二稿采用高领礼服长外套，留下取景光框中间的透明区域。 |

### Kimi K2 五线谱校样

原始修正版保留了星纱、指尖和空白书页，裙面上的谱线只有四条。以同一张四线原图分别生成下列三张校样。三次的第 5 张附件都是这张归档的四线图。校样 A 的第 2 张附件为标准 Bluewhale 三图拼版。B、C 的第 2 张附件在三图下方增加了五根平行金线色样。其余附件均为原画风图、Kimi 原设和大厅设定图。[四线输入](studies/kimi-flagship.png) · [五线参考拼版](studies/kimi-five-rule-guide.png)

| 校样 | 原始输出与 SHA256 | 目检 |
| --- | --- | --- |
| A | `exec-3f008e4b-f05f-496c-b730-7238fb7dcd45.png`<br>`5e06ae5ad4532f667e2013e5dde69fffe2073afa533fc6898b6169bb6838ab58` | 生成了六条金线，退选。 |
| B | `exec-8c216869-d870-419a-815c-51242902a024.png`<br>`36cfd6bd61c26da24797d2b05516bf8c608f9e46cac693f24e4b4e3ad73e54a4` | 五线正确。中央星芒较少，作为备选稿。 |
| C | `exec-02f11b5e-de14-49f3-af01-bfacd7a0f41d.png`<br>`6c9dc0284f1af26624e03323f0c7446efc07da14e92202664fccb1abbd7d9db6` | 入选。五线间距清楚，两颗星芒和两张空白书页均保留。 |

**校样 A 原文**

```text
Exact local correction to input 5, the selected Kimi K2 painting. Treat the entire portrait, face, original lineart, full-length constellation gown with transparent star-tulle, bright eyes, natural hands, and both translucent blank sheets as locked. Input 1 is style_reference.jpg, input 2 the approved Bluewhale style triptych, input 3 Kimi's Japanese source design, input 4 Kimi's lobby sheet. They confirm the style and identity. Preserve the 3:4 resolution, same crop, same placement, transparent alpha.

pure Japanese ACG anime illustration matching the exact art style of style_reference.jpg and Art-Batch 12A bluewhale, modern Japanese light-novel & anime gacha character sprite, ultra-clean delicate thin colored anime lineart (#3A241A / matching dark ink, zero pure black), bright high-key airy pastel cel-shading with soft luminous hair halo highlights, cute youthful Japanese anime face with soft round cheeks, gentle pink blush, large sparkling jewel-like anime eyes, tiny minimal dot/dash nose with ZERO nose-bridge shading, dainty small expressive anime mouth with NO realistic lips, clean crisp airy anime fabric folds and lightweight frills, 5.5-head to 6-head slender anime proportions (NOT chibi), genuine transparent background

As a music engraver, correct the golden music staff that passes diagonally across the dark skirt between the hanging star and the right floating page. On input 5 it has FOUR distinct fine arcs; a real musical staff has FIVE. Keep the four existing arcs. Draw ONE extra full-length parallel gold arc immediately BELOW the lowest one at the same spacing, with the same curve and thin glowing stroke, continuing round to the hand at the other side. At the middle of her dark navy skirt the viewer must be able to count five fine continuous gold rules and FOUR empty gaps between them from top to bottom. Give all five lines enough contrast against the navy to count them at thumbnail scale. No numbers printed, no clefs, no letters and no textual notation. Small star glints and translucent blank leaves may cross the staff but never obscure its center. No other changes. One character, genuinely transparent background, no shadows on floor.
```

**校样 B 原文**

```text
You are finishing Kimi K2, the single transparent portrait supplied in ATTACHMENT FIVE. Return that same complete portrait with a small correction to her foreground magical music staff. Attachment one is the exact Japanese drawing style. Attachment TWO is an artist's guide: Bluewhale at the top and, at the bottom, the exact gold five-line staff to use. Attachments three and four are Kimi's original Japanese design and chibi identity sheet. Preserve the face, flowing lavender hair, headpiece, raised fingers, translucent blank floating leaves, navy starry gown, bodily proportions and alpha of attachment five. Preserve the whole figure placement and same portrait aspect. The guide's dark swatch and Bluewhale characters must never appear in the output.

pure Japanese ACG anime illustration matching the exact art style of style_reference.jpg and Art-Batch 12A bluewhale, modern Japanese light-novel & anime gacha character sprite, ultra-clean delicate thin colored anime lineart (#3A241A / matching dark ink, zero pure black), bright high-key airy pastel cel-shading with soft luminous hair halo highlights, cute youthful Japanese anime face with soft round cheeks, gentle pink blush, large sparkling jewel-like anime eyes, tiny minimal dot/dash nose with ZERO nose-bridge shading, dainty small expressive anime mouth with NO realistic lips, clean crisp airy anime fabric folds and lightweight frills, 5.5-head to 6-head slender anime proportions (NOT chibi), genuine transparent background

Trace the five gold curves from the bottom of attachment TWO as a group, one for one, then bend and scale the group into the same diagonal perspective around the lower front of the navy skirt as the old staff in attachment five. REPLACE the entire small old staff with this copied group, avoiding any extra gold rule above or below it. From top to bottom there is the top hairline, three evenly spaced interior hairlines, and the bottom hairline. This gives four empty spaces of equal width. Keep the central stretch between the hanging pendant and the page clear enough to count. Rules must be simple thin pale gold, with no double outlines and no additional decoration on this central stretch. Star glints and the translucent blank sheets outside the central stretch should remain. This is an isolated character sprite, no writing and no floor.
```

**校样 C 原文**

```text
You are finishing Kimi K2, the single transparent portrait supplied in ATTACHMENT FIVE. Return that same complete portrait with a small correction to her foreground magical music staff. Attachment one is the exact Japanese drawing style. Attachment TWO is an artist's guide: Bluewhale at the top and, at the bottom, the exact gold five-line staff to use. Attachments three and four are Kimi's original Japanese design and chibi identity sheet. Preserve the face, flowing lavender hair, headpiece, raised fingers, translucent blank floating leaves, navy starry gown, bodily proportions and alpha of attachment five. Preserve the whole figure placement and same portrait aspect. The guide's dark swatch and Bluewhale characters must never appear in the output.

pure Japanese ACG anime illustration matching the exact art style of style_reference.jpg and Art-Batch 12A bluewhale, modern Japanese light-novel & anime gacha character sprite, ultra-clean delicate thin colored anime lineart (#3A241A / matching dark ink, zero pure black), bright high-key airy pastel cel-shading with soft luminous hair halo highlights, cute youthful Japanese anime face with soft round cheeks, gentle pink blush, large sparkling jewel-like anime eyes, tiny minimal dot/dash nose with ZERO nose-bridge shading, dainty small expressive anime mouth with NO realistic lips, clean crisp airy anime fabric folds and lightweight frills, 5.5-head to 6-head slender anime proportions (NOT chibi), genuine transparent background

Make just one small alteration to the fifth image: its old four-line ornament consists of an upper pair and a lower pair. Keep the outer shape and positions of the extreme top and bottom rules. Place ONE clearly distinct new CENTER hairline between the pre-existing upper pair and lower pair, opening up the complete group a little to give all four spaces equal width. The effect should be an engraved classical sheet-music staff, following the five-stroke technical swatch at the bottom of the second reference EXACTLY; the same five strokes as the guide. Visually think of a central gold hairline with two fine arcs on each side. The rest of the sprite and the existing stars and floating pages are identical to the source. Keep actual transparency, the same blank pages and the same diagonal position across the skirt. No lettering, notes or extra rows.
```
