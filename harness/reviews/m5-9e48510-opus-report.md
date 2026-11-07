# M4/M5 Opus 独立审查报告(经营/协议/M5状态机)

- 固定审查目标:**9e485100dfe22e31a6894022f3664e971c4818b7**(`git -C . rev-parse HEAD`于目标提交检出)
- 审查worktree:`out-of-tokens-review-opus-9e48510`(detached于目标SHA);审查期间本地追加提交 `77486ea`(冻结计划)→`1c5a1db`(探针+驱动冻结)→报告提交(见文末SHA)。仅新增 harness/review-m5-opus/ 与本报告,未改任何 packages/apps/content 源码。
- 主工程状态:主worktree HEAD `68d5996` = 目标 + 1个纯文档提交(Prompt/交接/打包记录,`git diff --stat 9e48510..68d5996` 仅 docs/与harness/记录文件),符合"只增Prompt/交接记录"条件,未动主工作区。
- 环境:Windows 10.0.26200 x64,Node v24.16.0,pnpm 11.25.0(corepack,shim安装于仓库外 `.review-opus-shims/`,未污染仓库);Git Bash。日期 2026-11-07。
- 引擎 0.10.0、内容 m5-1(loadFullContent);m0.6-1 装载器独立复核。

## 0. 结论摘要

**无P0,无新增P1。** 协议与M5状态机在全部9组探针(9701–9710)与100局正常内容队列(9601–9700)中未发现违反M5_RULES的实现缺陷:竞标、远征、五结局冻结、无尽挑战、章节门、命令原子性、回放、跨内容存档拒绝全部按书面规则工作。基线 `pnpm check` 22文件132测试复现通过;M05-03训练诊断逐字节复现(34/152=22.37%不变);固定包字节与SHA256全匹配。

新发现:**P2×1**(第0章56槽一次性判定在正常内容队列中锁死76%的局的全部M5战役内容)、**P3×2**(违约罚金不随竞标倍率缩放;五结局中4个的正常数值可达性未量化)。均为工程/设计观察,不是对M5_RULES书面规则的违反;主线程已在M5_ACCEPTANCE自行保留"正常M5长局平衡/章节可达性"未验收,本报告提供该缺口的定量证据。**主线程工程通过≠经营/真人/真实宿主验收**;M05-03 P1维持开放。

## 1. 实际命令与退出码

| 命令 | 退出码 | 说明 |
|---|---|---|
| `git worktree add ../out-of-tokens-review-opus-9e48510 9e48510...` | 0 | 新建独立worktree,未触碰旧worktree |
| `corepack pnpm install --frozen-lockfile` | 0 | review-m5-opus/install-frozen.log |
| `corepack pnpm check` | 0 | review-m5-opus/check-baseline.log:22文件132测试+构建通过,与主线程声称一致 |
| `node harness/m5/training-counterfactual.mjs` | 0 | §4复现,输出与提交JSON逐字节一致(git diff为空) |
| `node harness/review-m5-opus/probes.mjs` | 0 | 9/9探针通过(首轮6项失败均为本方探针搭台错误,修的是探针不是引擎;过程见probes-run1.log) |
| `node harness/review-m5-opus/run-normal-queue.mjs` | 0 | 100局×480槽,150秒,review-m5-opus/m5-normal-results.json |
| zip哈希重算 | — | 字节6203568与SHA256 `88bfcf5d…1259` 全匹配(只读,未重打包/未启动服务) |

种子消费记录(独占队列9601–9800):**9601–9700** 正常内容队列;**9701–9710** 状态机探针;**9711–9715** 驱动调试(冻结计划中"9711–9740复现保留"段,已按计划条款使用并在此注明);9716–9740其余与9741–9800未消费。种子1–100仅重跑主线程已提交脚本(已见训练样本复核,非新消费)。未使用7001–8000、8101–8520、9001–9020、9101–9300、9401–9420;未运行verify-m05/verify-m06。

## 2. 内容装载分离(§1,PASS)

`packages/oot-content/src/index.ts`:
- `loadContent()` = m0.6-1:30委托/20事件/4版本,**无campaign**;`loadFullContent()` = m5-1:108委托/64事件/20版本/12人名册,maxChapter=4,60剧情;m0.6的委托/事件ID是m5集合的子集,无串染;m0.6无任何minChapter字段(audit-loaders.txt)。
- 绑定:sim-cli(batch/main/replay)只用`loadContent`;web(apps/web/src/content.ts)与dsh用m5字段集;实测 web内容hash === loadFullContent hash(`128f6df13c92f1ce…`),与m0.6 hash不同。
- 存档绑定:oot-persistence decode要求 schemaVersion+engineVersion+contentVersion+contentHash 全匹配;m5-1存档在m2-1内容下 `INCOMPATIBLE_SAVE`(探针P9);引擎层 dispatchCommand 亦有 `VERSION_MISMATCH` 双保险。
- 章前不可见:8个minChapter>=3委托、4个事件;refill按`minChapter<=chapter`过滤(simulation.ts:30),事件按`eligible`过滤(events.ts:5),静态审计+内容计数确认。
- 双语:108/108委托、64/64事件带titleEn;60剧情文本与选项全去重、textEn/labelEn零CJK字符。
- DSH契约:`apps/dsh/cas-worker.mjs` 仅用 `OOT_TEST_PROFILE` 环境变量,未触碰真实Profile。

## 3. M5状态机探针(§2,种子9701–9710,9/9通过)

全部经 `dispatchCommand` 真实命令通路;直接字段写入仅用于搭台(章节/声望/现金),与主线程测试风格一致。逐项:

- **P1 竞标预付款/结算同倍率**:budget胜出后 `rewardFactor=0.85`;accept预付款=reward×0.85×scale×0.3(373.5口径验算一致);交付净额=reward×0.85×scale×mult−advance,实测q=94.59按1.35档结算,误差<0.02。
- **P2 一次性+失败移除**:同单二次竞标 `BID_LOCKED`;败标后job→`rejected`、不可再accept、60元照扣;胜标仍需自行接单(与M5_RULES一致)。
- **P3 守卫**:chapter<2拒;未知rival拒;现金<60拒;wrapper对非novice客户必败(实测rejected);hidden>0时wrapper败。
- **P3b 违约**(见M5-OP-02):wrapper(1.5×)与无竞标(1×)违约的**净罚金完全相同**=0.3×基础报酬×scale。
- **P4 远征**:忙碌/在队/加班角色拒`ACTOR_BUSY`;energy<30或现金不足拒`INSUFFICIENT_RESOURCES`;chapter<3拒`EXPEDITION_LOCKED`;扣费120/精力-20/busyUntil=+8槽;返回发奖**恰好一次**(重复tick研发/纪念物不再增加);重复世界得研发、纪念物去重(`["slime","paper"]`验证);slot54出发跨周边界返程正常;远征中不可被assign。
- **P5 结局冻结**:选定acquired后 advance/accept/assign/loan/buy/chapter/story/expedition/bid/challenge/meal/study/recruit **全部** `ENDING_FINISHED` 且状态引用不变;二次结局选择拒(`ENDING_FINISHED`,调度层先于applyFinale);`visit`放行;显式endless后解冻、advance恢复;endless后二次endless拒`ENDLESS_LOCKED`、再次ending拒`ENDING_LOCKED`;无结局现金奖励、无重复领取路径。
- **P6 无尽周挑战**:无尽外challenge拒`CHALLENGE_LOCKED`;3单q>=75才可领、领取+5研发并记录周号、同周重复拒;**旧订单排除**(无尽前accept/assign的订单challengeWeek未标记,交付后不计入,实测week1不可领取);轮换三档在**assign时**(`CHALLENGE_TEAM`:price>8拒/ctx>6拒/cloud拒week1)与**resolve时**(不符成员停工)双重拦截;switch仅空闲角色可行、换版本后assign重新校验(kimi.k2 ctx12在ctx周仍拒)。无尽前旧订单在cloud禁用周连resolve推进都被拦(设计如此,跨层一致)。
- **P7 章节门/原子性**:chapter<2时expedition/ending/endless/bid/challenge分别返回对应LOCKED错误且hash不变;非法action/类型/晨间overtime等错误命令原状态原hash返回;第0章`missed`后`CHAPTER_LOCKED`永久(设计事实,见M5-OP-01);maxChapter=4封顶(第4章领取后completed=[0..4],再领拒)。
- **P9 回放/跨内容**:纯命令场景(含事件选择)save→restore→hash一致;重放协议从全新初始态重放,**搭台状态无法混入重放**(实验中staged expedition在restore重放中被正确拒绝,反向证明协议严密);m2-1拒m5存档。

## 4. 正常内容长局(§3,种子9601–9700,100局×上限480槽)

驱动器 `m5-driver.mjs`(冻结于1c5a1db):**loadFullContent()原样数值**(与主线程合成贯通测试不同,不改balance/技能/委托);价值型接单+及时领章+晚间吃饭/学习+招募/解锁/network升级/竞标/远征+acquired结局+无尽轮换感知派遣+挑战领取;仅可见信息,无引擎状态写入;全部命令经dispatchCommand。冻结判读(PLAN-FROZEN.md第3节)适用如下:

| 冻结指标 | 实测 |
|---|---|
| chapterZero passed / missed | **24 / 76** |
| 破产 | 56(其中55局发生在ch0 missed后;ch0 passed且破产仅1局) |
| completed分布 | 0章:76;1章:1;**5章(全部):23** |
| ch0通过且未破产局中到达ch3 / ch4 | 23/23 = **100%** / 100% |
| 非破产局ch3达成率 | 23/44 = 52.3%(≥50%冻结线,不触发P1旗标) |
| 结局/无尽/挑战 | acquired×23、endless×23、挑战领取共22次(单局0–3次) |
| 竞标 | 23次尝试23胜(策略仅在条件满足时出手) |
| 远征 | 46次(每局2次),纪念物全部slime+castle |
| 平均领取槽位 | ch0@56,ch1@125,ch2@278,ch3@279,ch4@291 |
| 合法命令被意外拒绝 | **0局**(unexpectedRuns=0;CHAPTER_LOCKED等预期拒绝已单列) |
| 回放抽样 | 首局/全通关局/最早破产局 save→restore→hash 全一致 |

判读:
1. **52.3%≥50%冻结线,P1旗标不触发**——但这是"全有或全无"分布:通过第0章的经济幸存局100%通到结局+无尽,其余76%在第56槽即被永久锁死。通关弧线本身(ch1约day31、ch4约day70)在480槽预算内宽裕。
2. chapterZero missed率76%≫10%冻结线 → **M5-OP-01(P2)成立**。55局随后破产(M05-03经济世界),**21局经济极优(平均现金75,454/声望156/交付101单)却与全部M5内容永久无缘**——一局经营越好越能暴露该门与整体成功的错位。
3. 驱动器局限(不构成降级理由的诚实声明):价值型策略+战役维管是"勤奋经营者"的一种实现,非最优;76%数值依赖该策略(见m5-driver.mjs),机制的"单槽快照+永久miss"则是代码事实(campaign.ts:36,:70-71)。主线程m0.6策略v4在m5内容上原样运行会因无队伍上限/危机守卫而抛错,故本审查驱动器=v4+M5适配,无法给出"内容vs策略"的完全归因——这正是需要主线程在自己长局验证中量化的部分。
4. 无尽挑战可达但受轮换约束:23局无尽共22次领取,单局0–3次;轮换周(price≤8/local-only/ctx≤6)压缩可用高技能队伍,质量≥75×3/周在部分周不可达——作为平衡观察记录(不判级)。

## 5. M05-03训练诊断复核(§4,PASS)

重跑主线程已提交的 `harness/m5/training-counterfactual.mjs`(种子1–100,m0.6-1):输出与 `training-counterfactual-1-100.json` **逐字节一致**(脚本自身重写该JSON,git diff为空,未覆盖任何历史日志):zero 28全平;(0,25) 9拒/4胜/75平;[25,50) 25/6/5;总34/152=**22.37%**<25%不变;energy60低心情份额0.1945、空闲恢复14天。分母与阈值未动;确定性成立。M05-03 P1维持开放,本审查不提出删平局/放宽。

## 6. 固定包核验(§5,PASS)

`artifacts/out-of-tokens-9e48510.zip`(主工程,只读):6,203,568字节、SHA256 `88bfcf5d3259c1dd8d91ab5504a8a013ab96068257ad462c8e860759c1611259` 与Prompt声明全匹配。未重新解压/未重跑manifest计数/未启动服务(字节级一致已覆盖主线程已验证的同源工件;901文件计数以主线程package-results.md证据为准)。

## 7. 发现明细

### M5-OP-01 [P2] 第0章"56槽一次性判定"在正常内容中锁死大多数局的全部M5战役
- 位置:`packages/oot-core/src/campaign.ts:36`(`if (s.absoluteSlot === 56 && p.chapterZero === 'pending') …: 'missed'`)、`campaign.ts:70-71`(ch0 claim仅接受`'passed'`)。
- 最小复现:`node harness/review-m5-opus/run-normal-queue.mjs`;任一missed种子(如9611)在第56槽后发送任意`{type:'campaign',action:'chapter',id:'next'}`永远`CHAPTER_LOCKED`。
- 预期/实际:GDD第0章章末目标为"还清欠费"(GDD-v0.1.md §11.2),实现固化为恰好slot56的单点快照(debtPaid && liquidCash>=0 && 任一phase>0),错过即`missed`且**不可补救**,后续第1–4章、结局、无尽、竞标、远征全部不可达;实际正常内容100局中76局如此,其中21局最终现金均值75,454、声望156(经济上远超"还清欠费"能力,只是不在第56槽那一个时段满足快照)。
- 影响:M5全部新增内容对大多数正常数值局不可达;章节可达性验收(主线程M3-07遗留、M5_ACCEPTANCE自认未验收)在最入口处即失败;与"逐章领取"的进度假设冲突。注意liquidCash把在途预付款记为负债(economy.ts:5),接单越积极快照越差,对策略呈反直觉惩罚。
- 证据:m5-normal-results.json(agg.chapterZero、missed非破产局统计);PLAN-FROZEN.md判读2;本报告§4表。
- 建议(不代调参):主线程书面决策——(a)维持严厉性则在产品/提示层明示"第14天结算,错过即失战役"并纳入长局验收量化;或(b)提供迟到补救路径(如missed后允许在满足条件时补判,需引擎版本递增+回放证据)。该决策应先于任何"正常M5长局平衡"验收结论。
- 置信度:机制=确定(代码+探针P7);76%数值=高但依赖驱动策略(已附驱动器与局限)。

### M5-OP-02 [P3] 违约罚金不随竞标倍率缩放,高倍率合同相对违约成本更低
- 位置:`packages/oot-core/src/simulation.ts:51`(breach罚=advance+0.3×**基础**reward×scale)、`finale.ts:61`(rewardFactor仅写advance/交付路径)、`simulation.ts:337,385`。
- 最小复现:probes.mjs P3b(种子9704/9705):同模板novice单,无竞标违约步内-747.00,wrapper(1.5×)违约步内-933.75,**净-of-advance后两者同为-373.50**。
- 预期/实际:M5_RULES只写"预付款与最终交付使用同一倍率",未提违约;实际违约净罚金=0.3×基础报酬×scale,与倍率无关。无漏洞可赚(advance全额追回,违约恒为净亏损+声望-8),但wrapper(150%收益)的违约罚仅占合同价值20%,budget(85%)占35%——风险不对称,与竞标倍率的对称意图不完全一致。
- 影响:低;经济边缘扭曲,可能让高倍率单在不可交付时的弃单相对更"便宜"。
- 证据:probe-results.json P3b;源码三处行号。
- 建议:主线程书面决策违约公式是否乘rewardFactor;若改,引擎版本递增并更新回放证据(不代调参)。
- 置信度:高(公式+双种子实验一致)。

### M5-OP-03 [P3] 五结局中四个的正常数值可达性未量化(工程缺口确认,非实现缺陷)
- 位置:`finale.ts:21-31`(endingReady各谓词)。
- 复现/证据:正常内容23个通关局全部按策略选acquired(ending类型分布{acquired:23});independent(12000+声望30)、open-source(6名本地角色好感≥85)、warm-shop(12人好感≥65)、paperclip(全员<25+纸片纪念物+112槽内28次交付)在正常数值下的达成时间/可行性未测;主线程合成测试(finale.test.ts:51-60)只验证谓词逻辑,给满资金/好感。
- 影响:结局层验收仍是空白;主线程M5_ACCEPTANCE已如实列为未验收项,本条提供佐证而非新缺陷。
- 建议:纳入主线程"正常M5长局"验证:用专攻好感(chat+story)与专攻交付的两类策略各测结局可达性;好感成长率(chat+3/晚,story+4~10)与85×6人的时间预算需实测。
- 置信度:中(可达性未测即无法断言不可达;不违反任何书面规则)。

### 通过项(无缺陷确认,择要)
竞标60元一次性/胜负明示条件/失败移除/预付款与结算同倍率;远征忙碌-精力-现金三门、返程一次性发奖、纪念物去重、跨周返程;结局冻结覆盖全部命令族、二次结局/二次无尽拒绝、显式解冻;无尽挑战每周一次、旧订单/旧队伍(_ASSIGN与resolve双层)/版本切换三重防绕过、周切换不清债不清资源;章节门与maxChapter;非法命令原子性(state引用与hash不变);回放hash一致与搭台状态不可混入;跨内容存档拒绝;m0.6/m5装载器彻底分离且web/dsh同指纹;M05-03诊断逐字节复现;基线22/132;包字节/SHA匹配;60剧情双语零CJK混入。

## 8. GDD简化取舍审核(按Prompt要求"审核而非默认批准")

- **对手=明示规则合同竞标**(卷王/精品/套壳,非GDD的自主经营/挖角/递归竞价):M5_RULES§10如实声明保留缺口。条件全明示、结果确定,作为实验代理自洽;**不构成**GDD对手系统验收。取舍合理,边界诚实。
- **无尽周挑战**:GDD示例("只能用N级版本/全员OOT开局/全是小白甲方")与实现轮换(price≤8/全员local/ctx≤6)不同;M5_RULES§8已声明为实验决策。可接受的工程代理,建议在正式平衡轮前对照GDD意图复核轮换池(不改数值,只对照)。
- **KB字符bigram/对话包/Windows-only桌面**(M4):M4_SCOPE边界与实测(无模型下载/无外呼/默认关)一致;MB神经模型、完整访客包、透明挂机、Steam/微信未做且未宣称——如实。
- **60剧情为AI草稿**:主线程明示未经人工编辑,不冒充GDD"全部人工撰写"验收;双语完整性抽查通过,质量评审属Sonnet侧。
- **算力按槽**(M3-06)未改:维持开放P2,无回退。
- **章节0-2目标保持**与GDD §11.2章纲方向一致,但"章末=还清欠费"的实现化(M5-OP-01)比GDD文字更苛,见上。
- 依赖阻塞:M05-03(P1)继续阻塞经营放行;正常长局平衡/章节可达性(本报告M5-OP-01证据)应在结局/平衡验收前解决;真人0/10、公测、真实DSH共存未验收状态不变。

## 9. 边界与声明

- 本报告仅为独立工程审查;**不构成**经营放行、真人试玩、公测、真实DSH共存、GDD全功能验收;主线程任何后续修复不因本报告自动获批。
- 未push/部署/付费API/下载模型/修改真实DSH Profile/外发消息;仅本地提交于审查worktree。
- 未覆盖:实UI/内容质量(Sonnet)、架构/宿主(Gemini)、PWA两版更新与Host并发关闭浏览器回归(主线程自留)、结局4/5正常可达性(本报告M5-OP-03)。
- 证据目录:`harness/review-m5-opus/`(PLAN-FROZEN.md、probes.mjs、probe-results.json、m5-driver.mjs、run-normal-queue.mjs、m5-normal-results.json、normal-queue.log、audit-loaders.txt、m0503-training-counterfactual-rerun.log、install/check日志)。
