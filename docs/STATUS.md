# 状态与恢复入口
2026-11-06；根目录为 ai-game/out-of-tokens；分支 codex/m0。
环境：Node24.16.0，Corepack0.35.0，pnpm11.25.0；无全局tsc，使用项目固定版本。
原目录只有docs，无Git、源码或资源；已原样归档GDD与实施Prompt。
目标：完成M0.0检查点后直接实施M0.1/M0.2。
M0.0完成；pnpm install及pnpm check通过（1文件/1测试，类型/lint/build通过）。检查点SHA见随后提交的审查包。
下一命令：pnpm check；然后实现内核状态机和交互CLI。
未解决：完整内容/经济、M0平衡验收、外部审查、美术逐资产授权。
