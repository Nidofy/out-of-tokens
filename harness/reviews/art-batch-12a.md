# Art-Batch 12A 核心角色赛璐璐终版核验

2026-11-20 在 `codex/m1-foundation` 上核验。重刷基线为 `faa4d04c320ef5ede7b3aff65ab032d5b8f4e3e8`，终版资产提交为 `15680778ce2d679977aa7a873d37e51293e714ac`。用户确认的 Bluewhale 日常与头像作为全批画风基准。六位角色均有日常立绘、觉醒立绘和独立胸像。

## 成品

表中数字为单张透明 WebP 的实际字节数。每个角色名链接到浅暖纸底与深胡桃木底个人核验图，其中含 256、48 和 32 px 三种头像预览。

| 角色 | 日常 · 768 × 1024 | 觉醒 · 768 × 1024 | 头像 · 256 × 256 |
| --- | ---: | ---: | ---: |
| [bluewhale](../../art/art-batch-12a/review/bluewhale-review.png) | 94,068 | 132,276 | 19,052 |
| [qwen](../../art/art-batch-12a/review/qwen-review.png) | 111,816 | 130,996 | 19,404 |
| [llama](../../art/art-batch-12a/review/llama-review.png) | 108,960 | 128,840 | 21,804 |
| [mistral](../../art/art-batch-12a/review/mistral-review.png) | 130,362 | 130,718 | 25,866 |
| [gpt](../../art/art-batch-12a/review/gpt-review.png) | 122,216 | 135,818 | 21,888 |
| [claude](../../art/art-batch-12a/review/claude-review.png) | 133,282 | 129,856 | 20,350 |
| 合计 | 700,704 | 788,504 | 128,364 |

18 张 WebP 共 1,617,572 字节，18 张 PNG 母版共 37,768,553 字节。导出及离线包脚本沿用基线版本。[成品索引](../../apps/web/public/art/portraits/catalog.json) · [母版与运行图清单](../../art/art-batch-12a/manifest.json)

## 逐张目检

导出前打开了 16 张新选稿，另查看了双手与道具交界、双瞳标注和头饰边缘的放大图。导出后逐张打开六张个人核验图和六人双底总览，复核正向肩胸、左右袖口的连接、双档在缩略尺寸下的区别，以及发丝和光效的透明边缘。六张头像都是双眼睁开的笑脸胸像，头饰、耳尖和帽檐完整。浅纸底上的 Llama 与 GPT 主要依靠耳形、角饰和眼线辨识，深色底上的发丝轮廓更鲜明。[六人双底总览](../../art/art-batch-12a/review/batch12a-overview.png)

- **Bluewhale** 保留眨眼执笔的 V3 和原头像。R1 将左右同款海军蓝泡袖接回两个肩尖，领口与门襟正对胸腔，两手分置星盘书与水带下方。逐字节核对通过定调的两张 PNG 和两张 WebP，四个 SHA256 与返工前完全一致。[原 R1 退选稿](../../art/art-batch-12a/rejected/bluewhale-flagship-cel-02-anatomy.png)
- **Qwen** 日常执折扇与夹板，QwQ 指向由交叉蓝金轨道围成的立体星图。白花贝雷帽、紫眸与侧辫在三档位置一致。
- **Llama** 日常抱带叶签的手册，觉醒的典籍上长出荧光嫩芽。奶油色兽耳、蓝发夹、绿色斗篷和叶脉轻纱在两种底色上均能分开。
- **Mistral** 日常扶帽拎包，觉醒双袖成对，红金书与风带位于身体两侧。头像同时保留帽檐、卷羽和两只狐耳。
- **GPT** 日常双手捧香槟金平板，4o 双臂向外舒展，光棱镜与紫金波形留下清楚的空隙。双角、白玫瑰与紫色眼线在小头像中可辨。
- **Claude** 三档均为正立。Haiku 手持钢笔与空白书页。Sonnet 改为迎向镜头的掌心，雏菊蜡封悬于清晰分开的五个指尖上方。闭合的金怀表上只有花纹。

从定调到终版共出图 23 次，18 张入选。五张退选稿分别为 Bluewhale 的两版 R1、Qwen 的叠页星图、Claude 的数字表盘与侧掌蜡封。原图、SHA256、逐次提示词与取舍理由已归档。[生成与退选记录](../../art/art-batch-12a/PROMPTS.md)

## 像素、复现与离线包

1. 连续两次运行 `python -B scripts/export-art-batch12a.py`。对 18 张母版、18 张 WebP、两份 JSON 和七张核验图逐文件计算 SHA256，共 45 项，两轮完全一致。用原始素材按记录重建了全部 12 张辅助参考拼图，逐张 SHA256 匹配。[构图、眼位与参考来源](../../art/art-batch-12a/composition.json)
2. 用 Pillow 重新解码全部 WebP。18 张图的 alpha 极值均为 `[0, 255]`，所有可见像素中纯黑数均为 0。12 张立绘的可见高度均为 920 px，顶部留白 104 px，最窄侧边留白 35 px，下缘位于 y = 1024。六张头像各自的最窄边距均为 12 px，双瞳的纵坐标范围为 117.01 至 121.11 px。按可见 alpha 权重独立复算了全部头部质心，与索引一致。
3. `pnpm check` 的类型检查、ESLint、56 个测试文件中的 515 项测试及 Web、DSH 生产构建均通过。另运行 `pnpm vitest run apps/web/package-verification.test.ts`，25 项通过。验证逐一比对两个离线包中的 18 张 WebP 与目录文件，均与公共源文件同哈希。[发行包验证](../../apps/web/package-verification.test.ts)
4. `git diff --check` 和暂存区空白检查通过。和重刷基线比较，`packages/`、`content/`、旧 `ai-village/`、`stage-b/`、`office/`、`chibi/`、`furniture/` 及此前各批美术归档的差异数均为 0。
