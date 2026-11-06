# 状态与恢复入口
2026-11-06；根目录为 ai-game/out-of-tokens；分支 codex/m0。
环境：Node24.16.0，Corepack0.35.0，pnpm11.25.0；无全局tsc，使用项目固定版本。
原目录只有docs，无Git、源码或资源；已原样归档GDD与实施Prompt。
已完成M0.0与M0.1/M0.2首个可运行切片，M0.4诊断工具部分完成。
初始化SHA：7752322ba162edfe4e31d787a270e7663416f8a2。
最新代码检查点SHA：a6e8d93b8fcbd33bddd47d29de97c99d9fb75e1b；其后仅审查/恢复文档记录提交。
审查包：harness/reviews/m0-slice-a6e8d93-packet.md。
四角色、三委托、两个原型事件；接单/澄清/派遣/事件/交付/返工/账单/危机/存档重载已接通。
验证：pnpm install --frozen-lockfile、pnpm check全部通过（4文件16测试）；真实CLI进程冒烟、hash回放通过；原始日志 harness/m0-slice-check.log。
25局60天诊断：value/random/no-clarify/clear-only破产100%，greedy80%。非正式平衡验收，不达标。
14天试验平均净现金变化 value -7226、greedy -6994、random -9198、no-clarify -7980、clear-only -7600；均未证明欠费后健康现金流。
下一命令：pnpm check；然后按ROADMAP B01改bot人员选择和逐项目成本统计，再用相同种子对比。
未解决：30模板/20卡、完整经济/隐藏需求、利润率定义、平衡目标、外部审查、美术逐资产授权。M1尚未开始。
git在沙箱/用户账号间有所有者差异；必要时仅命令级 -c safe.directory=<本目录绝对路径>，不改全局配置。
