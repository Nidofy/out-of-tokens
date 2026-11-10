# VF4-A4 复审交接

固定实现：`3be52f46586047722e96f759975d36c0eb9ebaf7`。起点 `bb2fa10e2598b0dc1eff1dab2051ba0685c9ee75`，分支 codex/m1-foundation。状态：实现及本地验证完成，**待独立复审**；实现提交后仅四份文档回填SHA，再暂停。未push、部署、付费调用或启动VF4-B/C。

用户提供的Gemini裁决已确认A3/A3.1独立复审PASS：实现d1072f6b2d0f7bd42b3a1078164753b0acc6fec8，记录7b7b5faa937b4415cf1bc63e0a7c1d68a582fe0c。FOCUS-01/CSS-01/CSS-02、历史完整性均CLOSED/PASS；Actors海报墙与S3封板，A4未更改它们。VF4A2-PERF-01保持CLOSED。

## 结果

Jobs纸面卡片、带计数分段筛选、搜索/双语空态；所有panel路由失焦统一修复，直接Escape回原Dock。S2保持原领域行为与草稿/回执契约，补禁用原因、44px控件、横屏底栏与状态变化后的焦点。OfficeEditor新增纯函数可读槽位映射，原ID不变；控件纸面样式、SVG键盘聚焦、采购撤销与退出焦点闭环。保存后在渲染完成的effect中恢复原More/Dock，避免对隐藏节点聚焦。

完整pnpm check（check-release.log）38文件310测试通过；151文件raw/LF冻结匹配；261条实机观察、12条历史失败保留且后续复验对应，四视口几何/44px/状态/镜头焦点矩阵通过。`delivery-verification.json` 20/20 true；生产无探针、5181–5186无监听、专用缓存和测试页清理。

最终72正式+12预热，3版本×4格×n6。dev standard/twelve、preview standard/twelve相对c68541d为+2.82%/+0.56%/+4.89%/-0.40%，未触发确认批。**另保留旧冻结版72+12**：采样完成后补修Studio→Office保存焦点，原批失去最终源码适用性，重新完整check、冻结后采集最终批；实际总量144+24，不能写成全程只有72+12。见`pre-final-focus/`与`protocol.md`；请独立评估这项额外批次，不隐藏或合并数据。

## 审查入口与复现

- `docs/VF4_CHECKPOINT.md` 当前节：范围、矩阵、四格中位数与未闭合边界。
- `harness/vf4a4/protocol.md`：夹具、历史失败归因、采样偏离、路径基线解释。
- `interaction-results.json`、`browser-methods.txt`：原始DOM/几何与采集动作；`delivery-verification.json`含逐项失败对应。
- 截图：jobs-{1280,844,560,390}.png、s2-tri-1280.png、s2-step-390.png、s2-review-1280.png、office-editor-{1280,844,560,390}.png。
- `source-freeze.json`、`source-freeze-verified.json`、`startup-balanced.json`、`startup-warmup-excluded.json`、`startup-summary.json`；旧冻结版对应文件在pre-final-focus/。
- 只读复核可重算JSON/哈希；如运行会写时间戳的verify脚本，使用可丢弃检出，不覆盖固定证据。命令：`pnpm check`；`node harness/vf4a4/freeze-source.mjs --verify`；`node harness/vf4a4/summarize-startup.mjs`；`node harness/vf4a4/verify-delivery.mjs`（需先有正常生产dist，依赖清理记录）。不要为复审无条件重跑性能采样。
- 实机复现：`node harness/vf4a4/server.mjs --root . --cacheDir harness/vf4a4/.vite-cache/review --port 5184 --fixtures`，访问`?office-lab=initial|standard|waiting|review|delivery|a4-project|a4-rework|a4-breached|a4-clarified|a4-scope|a4-night|a4-no-posted&motion=still`；英文深色另加`&locale=en&theme=dark`。竖线代表逐个可选值，不是URL字面值。仅隔离内存存档；返工夹具修改隔离内容副本的工作量/质量门槛，不是自然经营验收。结束后停服务清缓存。

## 尚未闭合

VF31-PERF-01完整预算：冷缓存、完整assetsReady、GPU纹理上传、长会话驻留、输入延迟、低端移动真机。完整Visual Freeze 1认证、VF4-B/C（含Stage B专属立绘）、真实DSH宿主端到端冲突、Service Worker更新全分支、200%系统字体缩放保持OPEN/HOLD。S2本轮所需矩阵已验证，整体A4仍待独立裁决。posted零数量专用空态亦由a4-no-posted夹具四视口实测，断言数量0、专用双语说明与零卡片；active/history空态和搜索无结果同时覆盖。

保护路径对既有基线零diff；S3以已封板bb2fa10为基线，真实文件名character-profiles.ts。源码仅五个白名单文件变化。原A3 evidence、资源、领域包、锁文件和共享UI/renderer不修改。额外采样与边界应纳入复审意见，不由执行者预先宣告免审。
