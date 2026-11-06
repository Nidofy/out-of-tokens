# 状态与恢复入口
2026-11-07；codex/m1-foundation。

M0.7整改工程检查点：三份41dd3c4复审已原样归档；详见REVIEW_M06_INTEGRATION.md。引擎0.6.0、内容m0.6-1。仅训练1–100已见样本；7001–8000仍未消费。M05-03 P1仍开放：加班收入训练+5.87%通过，但小费拒绝严格占优34/152=22.37%未过25%；经营放行不成立。M06-01指标歧义已按Opus建议书面决策，保留旧现金比值诊断。

下一步继续独立M1场景、纸娃娃代码许可复用、宿主故障验证；M1–M3新增玩法以实验模式实施，不能用完成工程代替P1及真实试玩/公开测试/真实DSH验收。每一大版本检查点单独提交，再统一交付固定SHA审查Prompt。

恢复：pnpm install --frozen-lockfile、pnpm check。历史verify-m06仅在41dd3c4检出验证（本轮恢复已运行，基线74测试，business退出1）。新日志harness/m07，不覆盖历史manifest。

## 上一检查点历史（当时状态）
2026-11-07；仓库ai-game/out-of-tokens；分支codex/m1-foundation；Node24.16.0 / pnpm11.25.0。

M0.0–M0.5工程检查点保留。本轮M0.6审查整改与M1.0浏览器宿主首切片完成工程验证；经营验收未全部通过，完整M1未完成。M05-03加班收益/小费取舍仍为P1，阻塞相关玩法放行。先读REVIEW_M05_INTEGRATION逐项台账及M0.6_VALIDATION_PROTOCOL冻结协议，不能只看四项主门禁宣称全部通过。

新报告均针对a8fb63cdad76352e9cb5f59739735fcb4c98ce18；比73222ef仅文档变化。原报告harness/reviews，复现和新证据harness/review-integration。7项P1中6项主线程整改通过、1项部分缓解，未代替外部批准。

当前引擎0.5.0，内容m0.5-1，策略v4。贷款本金和未结预付款扣入可支配现金；危机只接合同总WP<=40；retainer槽初恢复；心情影响产能，晚间实际工作后深夜恢复30。两批量文案形成Mistral单人优势；训练报酬倍率0.81→0.83，其余基础经济不变。旧档须用历史SHA，不静默迁移。

pnpm check为10文件74测试通过及生产构建通过。3001–4000×5策略×60天共5000局四主门禁全通过，计算77.73秒。value章末现金1576.00、偿付率78.5%、14–21天连续偿付78%；random60天破产48.5%。专项200配对局random+loan破产45%；加班现金+82.13%、加班+预购+153.90%超25%目标，M05-03不得关闭。完整失败局保留在validation-v4及variants-validation.json。

浏览器：Vite8.3.6/Preact11.2.0/Pixi8.22.0；Command→GameSession→ViewModel，core无DOM/Node；WebCrypto与CLI互通；IndexedDB三手动、一自动、五备份，revision事务冲突保护；原绘程序化工作室与4纸娃娃。实浏览器已验证接单/派遣/事件/估算/错误提示/手存/日结自动保存/刷新恢复/手动回退；移动横溢修复后scrollWidth=clientWidth=375，无浏览器error。不是10人乐趣测试。

恢复：git status/log → pnpm install --frozen-lockfile → pnpm check → node scripts/verify-m06.mjs。旧verify-m05仅在a8fb63c独立worktree运行，旧manifest不重写。pnpm dev:web本地试玩；pnpm sim:play为CLI。临时验证服务器结束时关闭。

下一任务：M05-03只用训练1–100研究连续加班疲劳和事件心情取舍，先复现/回归；3001–4000已消费，下一正式队列7001–8000。独立可继续存档故障/跨标签实浏览器回归和资产协议；后续M1.1三场景找人，M1.2八角色两版本成长，M1.3第0章与10人试玩。当前未复制外部资产，社区资产逐件授权未完成。

代码SHA与四份下一轮Prompt见harness/reviews/m0.6-handoff.md（另一个记录提交写入SHA）。只本地提交，无push/部署/真实API调用。Git所有者差异仅命令级safe.directory。
