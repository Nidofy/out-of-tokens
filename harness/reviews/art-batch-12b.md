# Art-Batch 12B 全员立绘核验

2026-11-20 在 `codex/m1-foundation` 完成验收。12A 验收基线为 `b9f302c247a35c49b72f46901e98e065f0bf10de`，12B 资产提交为 `92c8ccb34ff9fb1d2293dfd111d7d4f7498284d1`。本批六位角色各新增日常、觉醒和独立头像，两个离线包现均收录十二位角色的 36 张 WebP。[12 人全员对照图](../../art/art-batch-12b/review/all-12-portraits-lineup.png) · [本批六人双底总览](../../art/art-batch-12b/review/batch12b-overview.png)

## 运行图与原始母版

表中为发行文件的实际字节数。每张个人四联图依次放置大厅原设、日常立绘、觉醒立绘和头像。头像另附 48 px、32 px 的浅暖纸底及深胡桃木底实尺寸预览。

| 角色与核验图 | 日常 · 768 × 1024 | 觉醒 · 768 × 1024 | 头像 · 256 × 256 |
| --- | ---: | ---: | ---: |
| [Kimi](../../art/art-batch-12b/review/kimi-review.png) | 120,904 | 134,532 | 21,282 |
| [Gemini](../../art/art-batch-12b/review/gemini-review.png) | 122,902 | 136,974 | 23,654 |
| [Grok](../../art/art-batch-12b/review/grok-review.png) | 135,570 | 136,606 | 27,090 |
| [GLM](../../art/art-batch-12b/review/glm-review.png) | 101,436 | 136,370 | 21,996 |
| [MiniMax](../../art/art-batch-12b/review/minimax-review.png) | 101,494 | 136,550 | 19,922 |
| [Seedance](../../art/art-batch-12b/review/seedance-review.png) | 118,850 | 131,740 | 20,056 |
| 合计 | 701,156 | 812,772 | 134,000 |

本批 18 张 WebP 共 1,647,928 字节。全员 36 张共 3,265,500 字节。本批 18 张 RGBA PNG 母版共 39,125,015 字节，逐一与所选工具原始输出比对了 SHA256。六张头像均为单独绘制的胸像。[全员运行图目录](../../apps/web/public/art/portraits/catalog.json) · [母版、参考源和编码记录](../../art/art-batch-12b/manifest.json)

## 逐角目检

- **Kimi** 的银紫长发、蓝眸和深蓝星芒头饰贯穿三图。K1.5 怀抱彩色页签笔记，K2 的指尖牵引金色星轨与两张空白书页。修谱前出现过四线和六线稿。定稿在裙面中央保留五条线和四个间隙。解码后于 `x = 398、418、480` 的三列各检出五条金线，测量纵区间为 `795 ≤ y < 880`。[修谱提示词与选稿理由](../../art/art-batch-12b/PROMPTS.md#kimi-k2-五线谱校样)
- **Gemini** 的两只猫耳、蓝紫长卷发和星饰保持一致。Flash 托小棱镜，Pro 张开双手引出粉金双棱镜与双色飘带。按画面方向检查三张图，左眼均为粉色，右眼均为金色。逐眼取样的 RGB 中位数依次为日常 `(203,95,156) / (205,148,115)`、觉醒 `(207,98,154) / (207,150,111)`、头像 `(200,90,151) / (186,131,103)`。
- **Grok** 的金色双马尾、两侧蝠翼蝴蝶结、卷呆毛、尖耳和黑金皇冠都可辨认。日常手持黄铜放大镜，觉醒将发光星象仪托在身体另一侧，黑金齿轮和腰际缎带勾出礼装轮廓。
- **GLM** 的黑白狼耳、灰紫眼、午夜蓝发梢和白尖黑尾在两种底色上均清楚。日常以触控笔配磨砂平板，觉醒以冰蓝透明几何矩阵配银线长裙和半披风。
- **MiniMax** 的奶油贝雷帽、侧编发和琴键包贯穿三图。日常抱着试演夹，觉醒举起黄铜指挥棒，腰侧声波和玫金丝带留出琴键轮廓。
- **Seedance** 的青色发光环扣在画面右侧高马尾根部。日常的分镜板和手持取景器位置分开，觉醒以悬浮的青色取景光框和带齿孔的胶片轨道呼应导演身份。头像四边完整容纳发环与渐变马尾。

在全员横排中对照了两批的脸部大小、正向肩臂、裙摆裁切、发丝高光和道具边缘。日常与觉醒的立绘取景沿用 Bluewhale 的大腿上段裁切。12B 六张头像均双眼睁开。256 px 图中，12A 双瞳中心间的直线距离为 30.60–36.93 px，12B 为 31.44–37.43 px。缩至 32 px 后，Grok 的冠翼、GLM 的耳尖与 Seedance 的发环仍可区分。[两批全员横排与头像网格](../../art/art-batch-12b/review/all-12-portraits-lineup.png)

## 像素、来源与可复现性

- 用 Pillow 重新解码全部 36 张 WebP。每张都有 RGBA 四通道，alpha 极值为 `[0, 255]`，在全部 `alpha > 0` 的像素中纯黑计数为 0。12B 的 12 张立绘可见高度均为 920 px，占 1024 px 的 89.84%，顶部均留白 104 px，最窄侧边为 38 px。六张头像各自的最窄边距均为 13 px，双眼中点位于 x = 127.91–128.10、y = 119.06–119.18。
- 开始绘制时绑定用户提供的总画风 JPG、12A 的 Bluewhale 日常与觉醒图、对应角色的日系原设 JPG 和大厅参考图。七张外部 JPG 的字节数和 SHA256 已与实际文件核对。28 张生成稿中入选 18 张，精确提示词及其余十张的取舍均已归档。清单记录了用户授权用途和工具实际返回的信息。[构图与参考索引](../../art/art-batch-12b/composition.json) · [完整提示词](../../art/art-batch-12b/PROMPTS.md)
- 从仓库根目录连续两次执行 `python -B art/art-batch-12b/export.py`，每次导出后立即采样。18 张母版、18 张 WebP、8 张核验 PNG 和 2 份 JSON，共 46 个文件的 SHA256 逐项相同。将按路径排序的摘要表以 UTF-8、两个空格缩进和末尾换行写入后，两轮摘要表的 SHA256 均为 `e6bdaa0660f2a4821267f9bea0d195e49d4a7693dac497e8a2b0bddce13d155c`。[导出脚本](../../art/art-batch-12b/export.py)

在仓库根目录执行以下 Python 可复核该摘要。

```python
import hashlib
import json
from pathlib import Path

batch = Path("art/art-batch-12b")
manifest_path = batch / "manifest.json"
manifest = json.loads(manifest_path.read_bytes())
files = [*batch.glob("masters/*/*.png"), *batch.glob("review/*.png"),
         manifest_path, Path(manifest["catalog"]["file"])]
files.extend(Path(entry["file"]) for entry in manifest["runtime"])
hashes = {path.as_posix(): hashlib.sha256(path.read_bytes()).hexdigest()
          for path in sorted(files)}
assert len(hashes) == 46
print(hashlib.sha256((json.dumps(hashes, indent=2) + "\n").encode()).hexdigest())
```

## 发行验证与改动范围

- `pnpm check` 通过类型检查、ESLint、56 个文件中的 517 项测试，以及 Web、DSH 生产构建。单独重跑 `pnpm vitest run apps/web/package-verification.test.ts`，27 项通过。早先一次 Vite 启动在写临时缓存时遇到 Windows 权限错误，获准在工作区写缓存后，以相同项目配置通过上述命令。[发行包校验及颜色、谱线回归测试](../../apps/web/package-verification.test.ts)
- 分别读取 `apps/web/dist` 与 `apps/dsh/dist/web` 的离线清单，并核对各自发行目录。每套恰有 36 张 WebP 及一份目录，每个文件的字节与公共源文件完全一致。抽取 12A 的六项目录并按原格式序列化，SHA256 仍为 `6c62d7862036981a534da39b53c786cf6af984779438f8926dabc700804593e2`。
- 与 12A 验收基线比较，既有文件仅改动全员目录、角色白名单和发行包校验。任务书列出的受保护路径差异为零。`git diff --check` 和暂存区空白检查均通过。
