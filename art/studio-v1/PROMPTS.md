# Studio v1 原创图像生成与导出记录

2026-11-07；模式：OpenAI 内置 imagegen 新图生成，无参考图片输入，没有调用项目真实模型 API。9张原始 PNG 保存在 masters；27个 WebP 为运行时资产。manifest 记录每张母版 SHA256 和生成结果 ID。没有复制 AI Village 社区图片、字体、音频或品牌标志。UI 参考其场景优先、HUD、底部入口、抽屉交互形式；已有 PaperDoll MIT 代码继续附原许可证。生成资产不冒充第三方 MIT 授权图片。

以下为可重用的生成 prompt 规格，按实际生成约束整理，不声称逐字还原工具调用。母版与结果 ID 是本次资产的固定依据。

## 七个场景

共同 prompt：Production 2D game background, wide 16:9, cozy modern AI studio. Near-frontal slightly elevated cutaway, warm cream/oak/teal/blue-grey palette, detailed painted anime storybook style. Leave the lower 55% as clear floor for separately rendered characters and desks. Fixed architecture and furniture at rear and edges. No people, no text, no UI, no logos.

| 母版 | 增补 prompt |
|---|---|
| garage | Renovated urban garage, roller door, timber rafters, blank whiteboard, small server and coffee corner, warm daylight. |
| incubator | Modern shared incubator, white brick, glass meeting pod, acoustic felt, plants, compact equipment shelf. |
| office | Modern city studio, skyline windows, glass meeting room, oak slats, restrained professional workspace. |
| campus | Creative campus atrium, double-height windows, greenery, oak stairs and planted wall. |
| lab | Friendly AGI research lab, white curves, observation window into server room, contained portal apparatus. |
| canteen | Modern community canteen, sage tiles, rice cooker, terrazzo, food counter, warm welcoming dining atmosphere. |
| library | Modern quiet library, oak bookshelves, window bench, green plants, soft reading light. |

## 12人透明角色图集

Prompt 规格：Exactly 12 separate full-body young-adult chibi characters, 2.5-head proportions, front neutral pose, uniform 4-column by 3-row grid, generous separation, true transparent background. Consistent clean painted anime style, no text, no UI, no shadows baked into the floor. Row1: blue hair whale clip navy/white pinafore; purple beret cream blouse; ivory llama ears beige cardigan; copper bob rust beret and cape. Row2: mint hair emerald circle clip teal jacket; long copper hair daisy scholar cream/brown; silver hair crescent navy cardigan; indigo/lavender twin stars violet dress. Row3: black hair electric-blue accent charcoal jacket; dark green hair glasses sage blouse; pink hair red ribbon ivory sweater; blonde/peach hair music clip peach cardigan and pleated skirt.

格序对应 bluewhale/qwen/llama/mistral/gpt/claude/kimi/gemini/grok/glm/minimax/seedance。全身单图驱动程序化动作，未制作完整分肢或逐帧行走图集。20版本保留游戏版本ID，以角色差异配饰和版本标记表示进阶，不声称20套独立立绘。

## 八格剧情图集

Prompt 规格：A consistent 4-column by 2-row game illustration atlas, eight clearly separated equal panels, cozy modern fantasy storybook, no text, no people, no UI. Row1: green slime-world portal and meadow; lavender floating castle; folded-paper hills with cranes and paperclip bridges; independent studio rooftop with blank flag. Row2: acquired corporate studio with blank gold sign and old badge; open-source workshop with open doors and orange details; warm neighborhood cafe with rice cooker and dinner table; eerie office overtaken by paperclips.

格序 slime/castle/paper/independent/acquired/open-source/warm-shop/paperclip。它们用于远征与结局卡，未新增可步行世界场景。

## 离线导出

`scripts/export-studio-art.mjs <已安装sharp绝对路径> <本次generated_images目录>`。不下载依赖。场景 WebP quality86、原尺寸；角色等格裁切、高256、quality90保留alpha；剧情4×2等格裁切quality88。原图保留，不用代码重画图像。正式包仅携带27个WebP及来源记录，不包含生产母版。UI图标为项目原创SVG，场内桌椅/电脑/餐碗/书本为原绘Pixi矢量。
