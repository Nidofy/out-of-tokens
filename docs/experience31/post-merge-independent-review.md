# Living Studio 3.1：PM-01 返修后独立复验

2026-11-17（Asia/Shanghai）。固定实现 **3ec1908a6f43dc87fd69e330d1bbd7b83849fd18**。

结论：**PM-01 独立复验 PASS / CLOSED；整轮合流后独立复核仍 HOLD（尚余实屏证据缺口）**。没有新增可复现问题。本结论来自本轮实际读代码、重新运行检查和浏览器操作，不是转述 Gemini 自验。

## 固定身份与源码检查

- 主仓开始/结束保持 bb971352c9c5f81a836be922f73b3047aa1f7697 且干净，未合并修复。
- 本轮新工作树：D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-pm01-review；分支 review/experience31-pm01-verify。
- 3ec1908a 已包含 B 修复 6f27926a98a413790868245f819eeeb3b4fe727a，因此直接从这个固定整合实现检出，无需再次 cherry-pick B。
- A 相对 B 确实只改 office-lab.ts、experience-ui.test.ts、track-a.md。实际核读全部代码/测试差异，CAS 与参数检查在 mutation 前；boundaryHead 保留完整前边界与 metadata；clone 防止外部对象污染；close 清理 head。
- I2 修改只纠正错误的 backup 内容预期，并增加 auto revision=3、backup revision=1/lineage 断言；原 drain、dirty/saved、最终 auto 文本以及 I3/I4 回归没有删除。原测试标题仍使用历史“drains dirty queue into backup-1”字样，判定以实际断言为准，不构成功能缺陷。
- 相对 bb97135，persistence、DSH、历史 fixtures、campaign、content.ts、living-art.ts 零 diff。没有编辑 A 或 B 实现。
- 新证据目录：D:/Documents/FeiyangChen/devApps/ai-game/commission-evidence/experience31/post-merge-review/3ec1908a6f43dc87fd69e330d1bbd7b83849fd18/。以下日志均在此新目录；旧 bb97135 红测及报告未改。

## 本轮真实门禁

| 检查 | 独立结果 |
|---|---|
| 离线 frozen install | PASS，install.log |
| pnpm check | PASS，53 文件 / 474 测试；严格类型、Lint、Web/DSH 构建通过，check.log |
| 原 Lab 红测 | PASS 1/1；从前轮 lab.audit.test.ts 原样临时复制到本树 apps/sim-cli 执行并删除，lab-independent.log |
| 原 I4 外部审计 | PASS 1/1；仅更换配置和测试中定位到本工作树，原断言不变，i4-independent.log |
| git diff --check bb97135 HEAD | PASS，diff-check.log |
| B/A 保存回归 | 包含于上述完整门禁，I2/I3/I4 与七边界/五备份/返回对象隔离均通过 |

实施方 pm01-track-a 下的 pnpm-check-full.log 只作交接资料。本轮结果以新的 check.log 为准。没有为了通过而删断言、改门槛或重采性能样本。

## 原生 Chromium / IndexedDB / Worker

Windows x64、Node24.16.0、pnpm11.25.0、IAB Chrome157。独立服务4233只加载本审查树真实模块，未使用 fake-indexeddb，也不操作玩家数据库。

1. BrowserSaves 与 LabSaves 各运行七次 boundary，每个 boundary 后50次普通 checkpoint；每轮故意使用错误 CAS 写 boundary 并确认拒绝。
2. Browser 每轮 close 后重新打开原生 IndexedDB，验证 head 持久化；最终五备份严格为 boundary-5/4/3/2/1，lineage 对应 run-5/4/3/2/1，公开 list 仍九槽。
3. 实际 GameSession、CheckpointCoordinator、A createSaveEncoder、原生 IndexedDB：阻塞首个已提交写入，连续发送原始 build-2 前50个合法命令。DayEnd=16/31/47，实际写入前缀=1/16/31/47/50，最大并发写=1；auto 逐字节等于 session 导出，backup-1 为31命令前缀。
4. 明确断言 encoder.stats.usedWorker=true（sampleCount=5），不是 fallback。这里的五次指五个写入，不是性能warmups/samples。
5. 三个可丢弃数据库均 close/delete。native-results.json pass=true；probe.js/index.html/server.mjs 留存可复现脚本。

初次正确性执行已通过，但误读不存在的 lastTiming 字段，未形成 Worker 启用的明确证据。保留 native-results-initial.json/probe-initial.js，随后增加对公开 stats.usedWorker 的硬断言再次执行，native-results.json 为补齐身份的正确性结果。没有挑选性能样本；本轮不是5+30计时批次，不据此声称性能预算通过。

复现 server.mjs：将其临时复制到本工作树 apps/sim-cli/pm01-probe.mjs，从工作树根 node 运行；更换输出目录及端口以免覆盖历史结果。原脚本结果使用 wx 拒绝覆盖；测试输入、被测模块绝对路径可核对。

## 正式生产构建的备份读回

新 origin http://127.0.0.1:4234，来自本工作树完整 pnpm check 构建，首次打开，无旧 SW/cache；全过程不再重建 dist，避免前轮 bundle 身份歧义。production-index.html 与 production-bundles.json 保留构建文件及哈希。

实际 UI 连续推进8次到第3天上午，等待“已保存”；打开存档、展开备份、载入“边界备份1”，恢复到**第2天上午**（上一真实日结），而非第2天深夜普通 checkpoint。手动读档自身完成边界保存，UI显示已保存；刷新后仍是第2天上午，额度90，现金5000。无force click、无fixture、没有直接改页面状态。

原始证据：production-eight-advances.json、production-loaded-boundary.txt、production-refresh-boundary.txt、production-boundary-restored.png。这一实际 UI/原生IDB检查关闭 PM-01 的生产接入疑问，不冒充完整接单交付闭环或全部故障场景。

## 结论与仍需完成的范围

PM-01 的 Browser B修复、Lab A修复、错误断言修正及必要完整门禁已独立复验通过。无需再交 Gemini 返修，也没有新增 B 修复。本轮只提交独立复验文档，不自动合并主仓、push或部署。

整轮独立复核仍 HOLD 的原因已不再是 PM-01 或测试红灯，而是上一份报告所列未完成的独立实屏覆盖：

- 分别在桌面与390px各自完成整圈接单至互动/保存刷新。
- 真实页面 write-error/retry、存储不可用的确认切换。
- 模态 Bark 连续交互/关闭与焦点归还；HTTP404图片故障注入。
- mistral-llama 本地/云端、qwen-kimi 澄清语义、有效上下文/负载与停工的完整实屏组合。

这些由独立复核线程继续补证，不转嫁给 Gemini 作为尚未发现的代码问题。此前通过的768四组合命中、旧档/规则/回执检查不无理由重跑；不重开I1–I4。上述缺口未补齐前，不声明“3.1合流后独立复核PASS”。

Host每次auto服务端轮转例外、VF5/Visual Freeze、真机触摸、系统200%字号、真实DSH安装认证持续独立HOLD；没有启动受历史停止条件限制的性能批次，未实施EXP-12/恢复EXP-13。

清理：4233/4234服务停止，两测试标签关闭；未改变视口。4234专属数据库、SW/cache/preferences已删除并留cleanup.txt；服务探针数据库也已删除。临时复验脚本已从工作树移除。主仓、原review树及Gemini返修树均未被修改。
