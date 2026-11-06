# Out of Tokens
纯 TypeScript 经营模拟原型；源需求见 docs/GDD-v0.1.md。

需要 Node 24.16.0 和 pnpm 11.25.0。PowerShell 中先 cd 到本目录。只有Corepack时先运行 `corepack enable` 使子进程也能找到pnpm。
运行 `pnpm install --frozen-lockfile`、`pnpm check`。
开发恢复入口：docs/STATUS.md；规则：AGENTS.md。
M0 先实现 CLI，M1 才安装 Vite / Preact / PixiJS。

`pnpm sim:play` 启动交互控制台；输入 `help`、`status` 查看命令和状态。
例如 `accept 0-0` 后 `assign 0-0 bluewhale:worker:cloud qwen:reviewer:local`，
用 `advance` 推进；出现事件时 `choose 0`；验收后 `deliver 0-0` 或 `rework 0-0`。
`save` / `load` 使用本地 saves/manual.json；`quit` 退出。存档采用临时文件写完后rename。
`pnpm sim:replay saves/manual.json` 校验回放hash。
`pnpm sim:batch 5 14` 运行五策略×5种子×14天，结果写harness/results（会覆盖上次报告）。
当前4角色、30委托、20事件，支持多轮/长期合同、加班、贷款/还款、三次危机和继承重开。资源预览提示本地/云端共享容量竞争。
M0.0–M0.2已经逐项验收，证据见 docs/M0.0-M0.2_ACCEPTANCE.md。
当前引擎0.4.0 / 内容m0.4-1，旧存档请在对应历史检查点打开；新版不会静默重算旧档。
`node scripts/format.mjs` 使用已固定TypeScript打印器整理源码；提交前仍需pnpm check。

`pnpm sim:batch 100 60 1 harness/training` 指定次数、天数、起始种子和报告目录，生成逐局CSV/JSON、指标summary、最差/破产案例、资金曲线及可重放命令。末尾可加 `--enforce`，四项M0门禁不通过时退出码为1；短窗口不能伪装通过60天门禁。
规则见docs/M0_RULES_FINAL.md，平衡协议见docs/BALANCE.md，外部意见逐项处理见docs/REVIEW_RESPONSE.md。
JSON内容为当前唯一数据源；历史内容生成器已删除以免覆盖调参结果，旧配方在29862c2可查。
M0.5工程检查点为73222ef，验收见docs/M0.5_ACCEPTANCE.md；56测试、5000局未见种子和14例回放通过。独立审查及未结P1仍在跟进，M1尚未开始。`node scripts/verify-m05.mjs` 可复核已提交证据。
