# VF4-A 定稿采样协议（正式采样前固定）

应用源码/CSS/测试完成后生成 source-freeze.json（原始及 LF SHA256）。之后不再改应用实现，结束运行 freeze-source.mjs --verify。

- 同机 IAB，1280×720，精确 DPR 1.0000000447034836；性能电源方案、120Hz、AC，保持 Codex 与测试页前台可见。每组180帧预热记录实际 rAF；遮挡不可仅用 visibilityState 推断。
- 040031e（沿用原既有 vf-metrics 诊断补丁）、c68541d、vf4a；普通 vite dev + 原项目 vite.config.ts 优化 visual-review preview。最终批次不注入 attribution probe，也不使用 effect 实验。
- standard/twelve，各版本各模式共12组先预热至180帧，全部排除于中位数。正式6轮：奇数版本/场景正序，偶数反序；每轮12条，共72条。记录首个 HUD+Canvas 同rAF时间（既有协议），不以资源全就绪为指标。
- 任一组相对任一基线 >+10%，仅执行一次相同72条确认批。所有不利批次与离群值保留，不反复采到通过。
- 此批不能与历史不同前台状态的绝对数值直接合并。阶段归因见独立54条+24条记录；原 dev 波动风险及 VF4-B/C HOLD 不自动解除。完整冷缓存/资源/GPU/输入预算留 VF5。
- 结束默认生产构建、无 vf-metrics/vf-startup/vf-attribution，关闭5181–5186，恢复视口/可见性并关闭临时页。保留所有旧worktree和junction，不install或删除依赖。
