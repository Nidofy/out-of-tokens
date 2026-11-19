# Art-Batch 10B 全员升级核验

基线 `e8e8e55fabcc0d1896b9ee7e5bf462ba5505c3e2`。本地资产提交 `b93bf028edd43f1135bb464be91ee46f25f3cf3a`。

## 角色与成品

6 位伙伴各归档 1 张身份母版和 5 张姿态原图，导出 5 张 WebP 与 1 份 rig。57 张透明候选中保留了 36 张原图。每次生成使用的输入、提示词、选用结果与退选原因见 [生成记录](../../art/art-batch-10b/PROMPTS.md)。原始 PNG 在 alpha ≥ 14 区域的纯黑数为 0，36 张原图的主体四边最小留白为 13.23% 以上。30 张 WebP 共 1,079,018 字节，单张最大 40,052 字节。解码后全部为 512 × 512，alpha 范围 [0, 255]，alpha > 0 区域纯黑数为 0。

| 单人核验图 | 五张 WebP 字节 | 工作姿高 / px | 休息姿高 / px | 站姿头宽 / px |
| --- | ---: | ---: | ---: | ---: |
| [kimi](../../art/art-batch-10b/review/kimi-review.png) | 178988 | 388 | 378 | 243 |
| [gemini](../../art/art-batch-10b/review/gemini-review.png) | 184804 | 384 | 383 | 223 |
| [grok](../../art/art-batch-10b/review/grok-review.png) | 193808 | 375 | 387 | 250 |
| [glm](../../art/art-batch-10b/review/glm-review.png) | 177262 | 384 | 380 | 220 |
| [minimax](../../art/art-batch-10b/review/minimax-review.png) | 156000 | 363 | 379 | 240 |
| [seedance](../../art/art-batch-10b/review/seedance-review.png) | 188156 | 383 | 389 | 261 |

18 张站、走、斜背的实测高度均为 400 px，脚底 maxY 均为 480。底部 15% 质心距 x256 的最大误差为 0.4701 px 以内。工作与休息姿态上 45% 剪影宽度与对应站姿相同，实测高度已写入 rig 和 manifest。Kimi 的一版斜背导出后仅为 399 px，重生成后达到 400 px。Grok 工作姿重画后按站姿头宽等比导出为 375 px。

## 目视复核

逐一打开六张单人核验图、七人对照图和全员双排合照。Kimi 的蕾丝头饰与深蓝星饰、Gemini 左粉右金异瞳与猫耳、Grok 皇冠和蝠翼发结、GLM 狼耳与白尖狼尾、MiniMax 贝雷帽与琴键包、Seedance 青色光环与高侧马尾均可辨。六张斜背姿态都朝右转身，工作姿两手都在红色 y370 线上方。两排站姿脚底贴线，未见截断、多肢、白边、家具或地面阴影。[本批与 bluewhale 对照](../../art/art-batch-10b/review/batch10b-overview.png) · [全员双排合照](../../art/art-batch-10b/review/all-12-lineup.png)

## 复现与范围

1. 在仓库根目录使用含 Pillow、NumPy、SciPy 的 Python 运行 `python -B scripts/export-art-batch10b.py`。相同环境再次导出，比较本批归档及六个运行目录的 83 个文件，SHA256 全部一致。
2. 运行 `pnpm check`。类型检查、lint、55 个测试文件内的 504 项测试及生产构建通过。包验证重新解码原图和成品，同时核对参考文件 SHA256、各姿态和 rig 配置、离线清单与发行副本。
3. 从仓库根目录运行 `pnpm --filter oot-web dev`，在开发服务打开 `/?office-lab=twelve&motion=still&animation-time=1&locale=en`。本次在 Chromium 的独立页面上记录两个 rig 类的 update 调用与角色资源请求。1440×900、1280×720、844×390、560×800、390×844 每个视口都观察到 12 个不同角色的 MapleChibiRig、0 个 PaperDoll 回退和 72 个角色资源（60 张 WebP 和 12 份 rig）。页面异常和角色资源请求错误均为 0。窄视口按既有相机取景，只显示工坊的一部分。
4. 运行 `git diff --check e8e8e55 b93bf028edd43f1135bb464be91ee46f25f3cf3a`。对照基线复核保护路径，包括旧批次、六个既有角色、FX、原画、规则、场景和样式，均为零差异。
