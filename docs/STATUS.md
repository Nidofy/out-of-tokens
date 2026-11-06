# 状态与恢复入口
2026-11-06；仓库 ai-game/out-of-tokens；分支 codex/m0。Node24.16.0 / pnpm11.25.0 / Corepack0.35.0。

M0.0–M0.5工程检查点完成，M1未开始。实现4角色、30委托、20事件、多轮/长期、贷款/危机/加班/重开、CLI及确定性存档、五策略批量报告和诊断回放。
规则：M0_RULES_FINAL；决策：DECISIONS；验收：M0.5_ACCEPTANCE；未结审查：REVIEW_RESPONSE；任务：ROADMAP。
引擎0.4.0，内容m0.4-1，策略v3；旧存档须在历史SHA运行，禁止静默迁移。

初始化7752322；M0.2 15e2775；M0.3 29862c2；M0.4实现SHA a91a52f0a4ea2c08ab6542c993ee91a6aa5c60b0。
M0.5可审查检查点：73222ef263bb6a4c3eda373827daa54b4b08e6a9；固定审查包harness/reviews/m0.5-73222ef-packet.md。其后记录提交只写SHA与交接文档。
已读取15e2775的Gemini/Opus/Sonnet报告并修复关键问题；未收到新快照复审，不把自测等同外部通过。

最终验证：离线frozen-lockfile安装成功；pnpm check为8文件56测试；25局短模拟；5000局未见种子1001–2000×5策略×60天四门禁全通过；14个正常/最差/破产案例CLI回放一致。证据harness/m0.5-*.log、m0.5-manifest.json、validation-v3。
value第14天现金¥1625.97、非负86.4%、第0章破产0%；random60天破产43.5%；四角色参与率18.31–32.56%；不澄清小白违约率为澄清10.16倍。验证后未改核心规则或参数。早期失败保留，报告不删除破产局。

下次接手先git status / log，再pnpm check；node scripts/verify-m05.mjs可重核证据。若收到审查意见，按固定目标SHA判断是否仍存在，相关P1处理后重新测试并提交；改变平衡需3001起的新未见种子队列，不复用验证集调参。
未结：OPUS04消融64%未达建议80%；概率澄清和资源ID顺序意见待复核；属性greedy毛利比88.51%未达70%，正式闭源旗舰/12人覆盖按D010延期M2；资产授权和人工乐趣未完成。M1不能越过这些门禁。
可以用pnpm sim:play直接试玩，help查看命令。只本地提交，没有push或部署。Git所有者差异只用命令级 -c safe.directory=<本仓库绝对路径>。
