# Art-Batch 10A 资产核验

基线 `da21d7843d5c01873bb4dc0786c8aaaa07c0d4c5`。本地资产提交 `7664d4cba9921c679c5d9f4d868bdd641feaf42e`。

## 目视复核

已打开五张单人六格图与六人总览，逐格对照站、走、工作、休息、斜背和镜像。Qwen 的帽花与蓝紫长发、Llama 的羊驼耳与蓝发卡、Mistral 的女巫帽与狐尾、GPT 的双角与白玫瑰、Claude 的雏菊与缎带均能辨认。Claude 全部姿态正立。五张斜背朝右，工作姿双手均在红色 y370 桌面线之上，休息姿均闭眼捧杯。未见家具、裁切、多肢或地面阴影。[六人总览](../../art/art-batch-10a/review/batch10a-overview.png)

| 角色 | 工作姿高 / px | 休息姿高 / px | 头宽 / px | 五张 WebP 字节数 |
| --- | ---: | ---: | ---: | ---: |
| [qwen](../../art/art-batch-10a/review/qwen-review.png) | 388 | 378 | 228 | 183832 |
| [llama](../../art/art-batch-10a/review/llama-review.png) | 382 | 363 | 239 | 167468 |
| [mistral](../../art/art-batch-10a/review/mistral-review.png) | 381 | 376 | 263 | 191674 |
| [gpt](../../art/art-batch-10a/review/gpt-review.png) | 390 | 389 | 230 | 189128 |
| [claude](../../art/art-batch-10a/review/claude-review.png) | 389 | 390 | 248 | 176412 |

## 复现与边界

1. 安装项目依赖，并为 Python 提供 Pillow、NumPy、SciPy。在仓库根目录运行 `python scripts/export-art-batch10a.py`。同一环境连续导出两次，批次目录和五个公共角色目录内的 69 个文件 SHA256 全部一致。
2. 运行 `pnpm check`。类型检查、lint、55 个测试文件的 498 项测试及生产构建通过。新增门禁独立解码 30 张原始 PNG 与 25 张 WebP，核对参考链、配置、几何数据以及 dist 中全部 25 张 WebP 和 5 份 rig 的 SHA256。
3. 运行 `git diff --check da21d78 7664d4cba9921c679c5d9f4d868bdd641feaf42e`。已检查保护目录、渲染与行为文件和 CSS 相对基线零差异。

五人的站、走、斜背均高 400 px。坐姿按站姿上 45% 剪影宽等比归一化，行走与斜背在固定高度下调整宽度。像素取整后逐姿检查，所有头宽比均为 1.0。脚底 maxY 为 480，鞋底水平质心相对 x256 的最大误差为 0.479 px。

原始 PNG 保留工具生成的低透明度杂点，alpha ≥ 14 区域纯黑为零。Claude 工作母版在浅、深底上复核过，轮廓外的低透明度杂点在清洗时去除。25 张 WebP 在 alpha > 0 区域纯黑均为零。内置 image_gen 未返回后端模型名称。全部 72 次生成中的 42 次退选均记录了实际提示词和原因。[生成记录](../../art/art-batch-10a/PROMPTS.md)
