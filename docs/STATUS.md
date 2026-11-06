# 状态与恢复入口
2026-11-06；仓库 ai-game/out-of-tokens；分支 codex/m0。
环境：Node24.16.0、Corepack0.35.0、pnpm11.25.0；本地固定TypeScript，无全局tsc。
初始化7752322，M0.2检查点15e2775，M0.3检查点29862c2dd75d110a4fa4d3e91cc11e9c7dd73ec5。

M0.0–M0.4工程完成，M0.5进入最终验证。4角色30模板20事件，多轮/长期、加班、贷款/还款、三次危机、继承重开、资源预览、五策略/逐项目利润/CSV/JSON/异常回放可用。
引擎0.4.0，内容m0.4-1；规则以M0_RULES_FINAL为准，M0_SPEC是首切片历史。JSON为内容唯一数据源，旧生成器移除防止覆盖调参；旧存档在历史SHA继续，新版明确拒绝。
已读取针对15e2775的Gemini/Opus/Sonnet固定快照报告，逐条处理见REVIEW_RESPONSE；不将自测标成外部批准。
M0.4代码检查点：a91a52f0a4ea2c08ab6542c993ee91a6aa5c60b0；包harness/reviews/m0.4-a91a52f-packet.md。

实际验证：pnpm check通过8文件56测试，含纯文本/JSON真实CLI进程、存档与回放；harness/m0.4-check-final.log。短规模5种子×14天×5策略输出在harness/results，不能当成60天验收。
训练1–100种子结果在harness/training-v4：value第14天现金均值1287.67，random60天破产48%，四项M0门禁通过。仍非未见种子结果。早期失败、报酬/额度扫描、training-v3均保留。

下一命令：pnpm sim:batch 1000 60 1001 harness/validation-v3 --enforce。BALANCE已冻结；验证后如改规则/策略/参数，必须另换3001起的新队列。之后锁安装、check、短模拟、五策略回放，提交M0.5固定SHA审查包。
未结风险：OPUS04移除Qwen收入64%（建议80%未达），概率澄清/玩家资源排序建议部分采纳待复核；闭源旗舰毛利/12人覆盖延至M2；人工乐趣和资产授权未验收。M1未开始，不绕过未结P1进入M1。
Git所有者差异仅用命令级 -c safe.directory=<仓库绝对路径>，不改全局配置；只本地commit，不push。
