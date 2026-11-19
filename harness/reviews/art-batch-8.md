# Art-Batch 8 静态美术验收

本地资产检查点 `e71cfd75fead70b6b3948edf9516b47bc2519f59`，起始版本 `78ee332`。

已逐张查看参考母版及 12 张运行态单图，并复核 [核验图](../../art/art-batch-8/review/batch8-review.png)。四姿态的头饰、卷发、鲸尾和鞋底完整，工位双手位于模拟桌面上方，站姿镜像前后鞋底质心落在同一条蓝轴上。八枚贴片在明暗两底的 128px 与 48px 对照中均可辨认。实际场景接入等待人工审核。

在仓库根目录使用 Python、Pillow、NumPy、SciPy 运行 `python scripts/export-art-batch8.py`。相同环境中两次导出，批次目录与 `apps/web/public/art/chibi` 资产共 43 个文件的 SHA256 均一致。独立运行 `pnpm check` 通过 53 个测试文件、476 项测试，包括 12 个 WebP 和两份 JSON 的离线覆盖。运行 `git diff --check 78ee332 e71cfd75fead70b6b3948edf9516b47bc2519f59` 可复核提交差异。记录本次生成与重刷的原始提示见 [PROMPTS.md](../../art/art-batch-8/PROMPTS.md)。
