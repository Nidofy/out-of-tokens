# Out of Tokens
纯 TypeScript 经营模拟原型；源需求见 docs/GDD-v0.1.md。

需要 Node 24.16.0 和 pnpm 11.25.0。PowerShell 中先 cd 到本目录。
运行 `pnpm install --frozen-lockfile`、`pnpm check`。
开发恢复入口：docs/STATUS.md；规则：AGENTS.md。
M0 先实现 CLI，M1 才安装 Vite / Preact / PixiJS。

`pnpm sim:play` 启动交互控制台；输入 `help`、`status` 查看命令和状态。
例如 `accept 0-0` 后 `assign 0-0 bluewhale:worker:cloud qwen:reviewer:local`，
用 `advance` 推进；出现事件时 `choose 0`；验收后 `deliver 0-0` 或 `rework 0-0`。
`save` / `load` 使用本地 saves/manual.json；`quit` 退出。存档采用临时文件写完后rename。
`pnpm sim:replay saves/manual.json` 校验回放hash。
`pnpm sim:batch 5 14` 运行五策略×5种子×14天，结果写harness/results（会覆盖上次报告）。
当前3委托/2原型事件；尚未达到完整M0的30委托/20事件及经济验收。
