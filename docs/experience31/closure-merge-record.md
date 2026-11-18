# 2026-11-18 本地主线合流记录

主仓：`D:\Documents\FeiyangChen\devApps\ai-game\out-of-tokens`，分支 `codex/m1-foundation`。

- 合流前 `bb971352c9c5f81a836be922f73b3047aa1f7697`，主树干净。
- 独立验收树 `out-of-tokens-closure-1117` / `closure/experience31-visual`，文档检查点 `843e0e5e5930ae3b701b19c8c6d9e5c747238e33`。
- 主线已通过 `git merge --ff-only closure/experience31-visual` 快进到该检查点，包含 B PM-01 `6f27926`、Gemini A PM-01 `3ec1908`、独立复验 `06aebde`。
- 功能实现固定为3ec1908；本轮只新增文档与仓库外诊断，没有越权编辑A源码。53文件474测试完整check通过；主线相同源码不重复刷全套测试。快进后重新从干净固定SHA完成Web/DSH生产构建。
- 候选包：`artifacts/out-of-tokens-843e0e5`，其中DSH入口为`dsh/`。`node scripts/verify-playtest.mjs artifacts/out-of-tokens-843e0e5`通过819文件哈希/清单/构建身份校验；该验证不是宿主安装通过。包manifest.sourceCommit仍为843e0e5，后续纯文档记录不重写包身份。
- 安装包的旧字段humanTesters=0只是既有打包格式，不恢复已取消的真人试玩要求；businessApproved=false与尚未封板一致。
- 本地提交，不push、不部署。测试服务4241–4248已停，测试标签已关、视口已恢复。独立origin测试数据保留；未改玩家真实存档。Windows字号未改，未在DSH安装/启用/卸载候选。

## 后续真实依赖

| 项目 | 状态 | 接续负责人/条件 |
|---|---|---|
| 3.1功能补验及PM-01 | PASS / 已本地合流 | 无新增功能返修；原I1–I4不重开 |
| VF5 | HOLD | Gemini归因并提交新实现；确认十二人就绪相对c685+15.24%；同SHA不再开第三批 |
| 600秒长驻 | BLOCKED | VF5完整门槛通过后才启动 |
| Tier2/3 | HOLD / 沙箱 | Gemini确定真实进出层级/时序，Codex按明确像素范围修图；不提前出售或加载 |
| 背景/Pixi逐帧同步、透明边缘命中等收尾 | 待补证 | Gemini，详见交接prompt；既有镜头16组合PASS不抹除 |
| 真机触摸 | 用户延期 | 用户明确没有设备，保留待验收 |
| 系统200%字号 | 待验收 | 应用访问请求超时，需可操作系统设置窗口；未用CSS缩放替代 |
| 真实DSH | 待环境/安装确认 | 当前0.2.2-rc.1与候选契约0.2.1-rc.5不同；未建立隔离Profile，CLI也未在PATH发现；已向用户给出具体候选路径和安装位置选择 |

前端交接文档：`docs/GEMINI_VISUAL_CLOSURE_PROMPT_20261118.md`。证据与统计：`docs/visual-closure-20261118.md`；功能覆盖边界：`docs/experience31/closure-20261118.md`。本记录不宣称剩余所有工作已完成或Visual Freeze已解除。
