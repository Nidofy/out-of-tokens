# Art-Batch 13 世界观美术验收

2026-11-21 在 `codex/m1-foundation` 验收。基线为 `0c32bc961f551434075e6b6a782d383d6597d0e1`，资产提交为 `b22f42810940cd401a0ea00601ec8e4dbac444d7`。本批 20 张运行态 WebP 共 1,338,018 字节。故事白名单提供 16 条离线路径，家具目录追加食堂、图书馆各两件摆件。页面展示、引导触发和摆件点击反馈留待引擎接入。[故事目录](../../apps/web/public/art/story/catalog.json) · [家具目录](../../apps/web/public/art/furniture/catalog.json)

| 类别 | 数量 | 画布与模式 | 总字节 | 最大单张字节 |
| --- | ---: | --- | ---: | ---: |
| 客户圆章 | 6 | 256 × 256 RGBA | 101,304 | 20,526 |
| 结局 CG | 5 | 1280 × 720 RGB | 890,644 | 179,124 |
| 远征卡片 | 3 | 768 × 512 RGB | 265,508 | 89,876 |
| 回形针助手 | 2 | 256 × 256 RGBA | 29,276 | 14,898 |
| 公共场景摆件 | 4 | 256 × 256 RGBA | 51,286 | 13,784 |

## 逐图目检

- 六位客户的旧图与新图按相同画布大小排布，右侧使用项目当前的 Bluewhale 日常立绘。48 px 小样仍可分辨林姐的绿头巾、周叔的圆镜、严总的平板、苏女士的低马尾、哲哥的耳机和陆总的丝巾。哲哥定稿用窗光取代了初稿屏幕上的拟代码笔划。[客户圆章与 Bluewhale 对照](../../art/art-batch-13/review/clients-review.png)
- 天台晨光、抽屉中的车库工牌、敞开车库的柑橘与手账、夜间共餐、回形针金字塔均在宽屏画面中清晰可辨。远征三图保留水彩肌理，分别以搬晶块的史莱姆、环绕档案馆的纸鹤和云中的齿轮风车为主体。城堡定稿将带罗马数字的表盘换为齿轮窗。已按运行尺寸逐张检查文字、构图和压缩效果。[结局与远征全览](../../art/art-batch-13/review/endings-worlds-review.png)
- 闲置助手持笔尖向右引导，提醒姿态举起双手，顶部有两道星芒。两种底色上都能看到回形针的中空轮廓。摆件按各自的脚底锚点叠合到实际食堂和图书馆背景，推车轮、立牌底脚与书堆下沿均落在地面上，轮廓外无白边、投影或文字。拼版为静态合成。[双底与场景叠合](../../art/art-batch-13/review/mascot-decor-review.png)

## 解码与离线包

12 张 RGBA 解码后的 alpha 范围均为 [0, 255]。在全部 alpha 大于零的像素中，RGB 纯黑总数为 0。四件摆件可见高度均为 196 px，最低可见像素均为 y=236。按整张 alpha 加权的水平质心依次为推车 127.6978、立牌 128.0956、书车 128.0546、猫头鹰 128.2725 px。

五张结局母版为 1672 × 941，导出时上下各裁 0.25 个源像素并等比缩放。三张远征母版为 1536 × 1024，整幅等比缩至运行尺寸。预算按十进制 180,000 和 90,000 字节逐张执行。首次编码时一张高细节结局超过预算，现按单图搜索 WebP 质量，并重新解码成品复核。[母版、裁切参数与逐图 SHA256](../../art/art-batch-13/manifest.json)

Web 与 DSH 各自的 `offline-assets.json` 都已列出本批 20 张 WebP 和两份目录。两个发行目录共 44 个文件副本的 SHA256 逐一匹配公共源文件。第 11 批原有 8 类家具及 4 件摆件的目录内容可重建为原 SHA256 `062227ca351a894643fb3b58fcef97c9a18f53e969e8e04b0709d2c51646a3c1`。首次全量测试发现旧断言把所有目录条目视为工作室摆件，现按原四件核对实际工坊摆放，并继续检查五章所有工位的间距。新四件单独接受几何与离线副本校验。[发行包测试](../../apps/web/package-verification.test.ts) · [工坊回归测试](../../apps/sim-cli/furniture-upgrade.test.ts)

## 可复现性

内置 image_gen 共生成 22 张 PNG。20 张定稿母版共 52,393,338 字节，两个编辑输入共 6,168,928 字节。22 份归档均与对应工具输出逐字节散列匹配。每次请求的提示词、绑定参考和文件名均已归档。[提示词与修订记录](../../art/art-batch-13/PROMPTS.md)

在仓库根目录使用 Pillow 12.1.1、libwebp 1.6.0、NumPy 和 SciPy，连续运行两次 `python -B art/art-batch-13/export.py`。每轮结束后对 20 张母版、2 张编辑输入、20 张 WebP、3 张拼版、2 份目录及批次清单建立摘要表。48 项逐一相同，两轮摘要表的 SHA256 均为 `e910390980e323c0f2f8b8ef329e10421550c1da74dabbb89413355606cb6f58`。[导出脚本](../../art/art-batch-13/export.py)

下列 Python 可在每次导出后复算摘要表指纹。

```python
from hashlib import sha256
import json
from pathlib import Path

manifest = Path("art/art-batch-13/manifest.json")
data = json.loads(manifest.read_bytes())
paths = [manifest.as_posix()]
paths += [a[k]["file"] for a in data["assets"] for k in ("master", "runtime")]
paths += [r["file"] for r in data["catalogs"] + data["reviews"] + data["studies"]]
hashes = {p: sha256(Path(p).read_bytes()).hexdigest() for p in sorted(paths)}
print(len(hashes), sha256((json.dumps(hashes, indent=2) + "\n").encode()).hexdigest())
```

`pnpm check` 通过类型检查、lint、57 个测试文件的 525 项测试和 Web/DSH 生产构建。`git diff --check` 通过。相对基线检查了规则与内容包、原始根目录 WebP、living、office、stage-b、ai-village 以及全部历史美术归档，差异为零。
