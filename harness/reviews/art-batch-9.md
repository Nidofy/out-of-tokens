# Art-Batch 9 资产核验

基线 `5f5efa71957682eeae241abdc952fd3693ba145b`。本地资产提交 `cf63f306fac5d79cc8a4b6d5027f94af717d3330`。

已查看[核验图](../../art/art-batch-9/review/batch9-review.png)及全部 11 张运行态单图。背向朝右，侧颊仅露一线，发带蓝结、双侧鳍耳、后腰白结与鲸尾完整。镜像时鞋跟绕中心轴对齐。等高 400px 时，上方 45% 剪影宽度为站姿 235px、斜背 226px。十张贴片在 48px 和 128px 明暗背景中均可辨认。纸页的三条短横与勾选徽记清晰。斜背重刷 4 次，详见 [PROMPTS.md](../../art/art-batch-9/PROMPTS.md)。

运行 `python scripts/export-art-batch9.py` 需要 Pillow、NumPy 和 SciPy。同一环境连续导出后，批次目录和公共 chibi 目录的 51 个文件 SHA256 相同。坐姿辅助函数用既有工位和休息母版在内存中复核，两例均对齐到站姿头宽 235px，脚底 y480。原始母版保留工具产生的低 alpha 噪点，alpha ≥ 14 区域的纯黑像素均为零；所有 WebP 在 alpha > 0 下纯黑像素均为零。

`pnpm check` 通过 55 个测试文件、493 项测试。离线清单覆盖当前 chibi 目录的 5 张姿态、18 张贴片及 2 份配置。可运行 `git diff --check 5f5efa7 cf63f306fac5d79cc8a4b6d5027f94af717d3330` 复核提交。步尘的静态目录使用现有类型支持的 propHand 锚点，场景中的足底粒子定位留待行为接入。
