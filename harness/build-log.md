# 实施日志
2026-11-06：只读审计；原目录无Git；node24.16.0/pnpm11.25.0；npm registry核实版本，初次网络查询等待过久，短超时重试成功。
首次pnpm install沙箱EPERM，已请求工具权限重试；结果以检查点原始日志为准。
M0.0：安装初次因esbuild构建未批准退出；显式allowBuilds后成功。曾重复YAML键，修正后pnpm install、pnpm check全部通过。Vitest 1文件1测试，336ms。eslint9.39.5有上游弃用提示，当前与TS工具链兼容；升级列后续维护项。
M0首切片：实现core/content/persistence/CLI。初次事件测试暴露相邻种子相关性，加混合派生；12测试通过。
CLI真实进程存档/重载与独立replay通过。60天批量暴露负现金时免费事件选项被拒绝，修复cost=0判定并加回归；15测试通过。
25局60天运行完成：value/random/no-clarify/clear-only各100%破产，greedy80%；原始结果见harness/results/batch.json及batch.csv，日志m0-slice-batch.log。
回放：REPLAY_OK f9209084616923a0e3eee4d8a0e5e85fbc30f7313b913a58f36c0ddb57fc5962 slot=68。
补充ViewModel内容对象隔离及移除core循环导入后再次运行门禁，见最终原始日志；未收到外部审查。
最终16测试/4文件全部通过，571ms；冻结安装成功；代码检查点a6e8d93b8fcbd33bddd47d29de97c99d9fb75e1b。后续记录提交仅保存审查包和恢复SHA，无代码变更。

2026-11-06 M0.0–M0.2完成轮：恢复基线16测试通过。新增资源流水、审查排序/逐缺陷检测、busy云端条件与作用域、免费退路schema、CLI决策信息/中文错误/严格命令语法。
新增逐分支验收及真实CLI纯文本命令；唯一失败为测试未使用导入lint，移除后31测试通过，再补付费事件恢复后32测试通过。
使用固定TypeScript打印器格式化便于审查。pnpm test先构建，修复干净检出单独test依赖缺失构建产物的问题。
最终门禁见m0.2-check.log。25局14天诊断仍负现金；不调参数，不改变胜率口径。回放hash=6aded55719135ba185776e34357bcdfb5f36ed766f886d7dbc65274534362fe5，slot56。
下一任务：M0.3/B01人员调度与成本归因，再做经济校准；外部审查继续按固定SHA回交，无等待阻断。
M0.0–M0.2代码检查点：15e2775e8f9bc88ab26ecf421f7b9988c49c3104；最后门禁32测试/5文件754ms全部通过。后续提交仅记录目标SHA与审查包。
M0.3：恢复32测试基线后扩充30模板/20卡、条件/效果/冷却、多阶段/长期、贷款周息、危机累计、继承重开与加班。初次旧测试依赖生产菜单价格和固定3张日板，改为显式500元单元fixture及5张日板；修复bot遗漏waiting占用后32通过。
补经济/内容/20卡全部选项、自然加班触发上下文事件等回归：44测试/6文件通过，826ms。统计失败轨迹及冻结策略v2见BALANCE.md，正式未见种子尚未运行。

M0.4审查修复与统计检查点（2026-11-06），基准29862c2。
读取15e2775固定快照三份报告；修复澄清时序、辅助空转/永久加分、上下文边界、宽限、undefined稳定hash和预付款危机；增加模板质量线、Planner半速WP、协作损耗及资源预览。
专项回归首轮51/53：旧event账本匹配未带job、危机用例误用200WP大单；修正测试后53/53。调报酬后53/56：公式fixture继承0.81倍率，将固定500报酬测试显式设rewardScale=1，不改生产断言；失败摘要m0.4-check.log，修复后check-pass和check-final均56/56。
配额120扫描发现buy导致破产后仍advance，修复并补100种子低额度回归；失败局全部保留。
pnpm sim:batch 100 60 1 harness/training-v4：500局四门禁通过，仅训练非正式；m0.4-training-v4.log。
node scripts/review-experiments.mjs：30模板×合法岗位×20种子，另100种子×14天逐角色消融；更正（M05-02）：当时产物仅三人有最优组合，Mistral未进入，原记录错误，Qwen移除收入仅64%，保留P1复核。
pnpm sim:batch 5 14 1 harness/results：短规模和诊断回放成功。pnpm check：8文件56测试通过；m0.4-check-final.log。
下一步：固定M0.4 SHA后1001–2000未见种子验证，完成M0.5包；M1仍有P1/资产门禁。

M0.4代码提交a91a52f0a4ea2c08ab6542c993ee91a6aa5c60b0；795cc34记录审查包。
M0.5最终验证（2026-11-06）：pnpm install --frozen-lockfile --offline成功；pnpm check为8文件56测试；pnpm sim:batch 5 14 21 harness/smoke-m05成功。
pnpm sim:batch 1000 60 1001 harness/validation-v3 --enforce：5000局、四门禁全真、退出0，计算77.57秒。value章末现金1625.97/非负86.4%，random60天破产43.5%，四人参与18.31–32.56%，小白违约比10.16。
pnpm sim:replay及全部14个诊断CLI回放均REPLAY_OK；verify-m05验证行数/唯一种子/指标重算/内容与状态hash，退出0。原始日志m0.5-*.log，文件校验m0.5-manifest.json。
实现/参数在a91a52f后冻结，未用未见种子反调。M0.5工程检查点完成，不声称外部批准；Qwen消融和部分P1范围意见保留，M1未启动。

2026-11-07 M0.6整改与M1.0宿主首切片，基准a8fb63c，分支codex/m1-foundation。新报告原件均在独立worktree核对HEAD后导入。9项预期回归先红；三份报告22项逐项台账REVIEW_M05_INTEGRATION。修复危机、恢复时机、辅助计费/覆盖、事件出勤、预览、贷款负债、错误提示；更正三人最优的旧错误记录。
原报告脚本重跑复现；新训练v5偿付率71%失败保留，训练报酬0.83后v6四门禁过。正式3001–4000共5000局四主门禁全过，77.73秒；新增200配对专项贷款45%破产通过，加班现金+82.13%/+153.90%仍超目标，M05-03不关闭。
浏览器基础等待报告期间已独立实现：GameSession/WebCrypto/IndexedDB revision CAS与5备份、原创Pixi画面、Preact交互。实浏览器完成接单/派遣/事件/存读档/刷新恢复；发现手机宽634>375，canvas改绝对定位+grid子项min-width:0后375=375。无console error。
pnpm check最终74测试/10文件、lint/typecheck/生产构建通过；新证据由verify-m06校验。下一项M05-03训练疲劳取舍；无依赖宿主继续，不宣称完整M1或外部批准。下一记录提交写入固定SHA与三审查Prompt、主线程继续Prompt。
首次代码检查点e4e86f6d57445198c3e846b8f4bd10df62627056。暂存diff检查发现4份原始测试日志末尾空行，提交命令未按检查失败中止；现仅规范日志尾换行并重新记录manifest，保留全部失败内容，不改代码/参数。后续检查显式退出码阻断。
固定复审SHA=41dd3c4c2398e9cd5e706298adc8e935bb509df4，实现SHA=e4e86f6d57445198c3e846b8f4bd10df62627056；四份Prompt见harness/reviews/m0.6-handoff.md。verify-m06 --require-business实际退出1，M05-03开放；离线frozen-lock安装成功。

## 2026-11-07 M0.7复审整改
核对并归档三份41dd3c4报告；恢复74测试与verify-m06通过，business按预期1。red四项失败，疲劳红测失败；训练全部为已见1–100，保留B/AB/喘息5/10结果。收入达标但小费22.37%失败，M05-03继续开放；7001未消费。新日志harness/m07，历史不覆盖。下一任务独立M1工程，尚无人类测试批准。

M0.7工程检查点 c9aa14598ad74794476c44e7838389ce1352ca38；pnpm check 81测试及构建通过、diff --check退出0。下一任务M1三场景/找人/成长，P1小费仍开放。

## M1工程检查点
0.7.0/m1-1，三场景、8×2、成长、40事件、硬件三级/8软件。首次40事件校验失败（write触发类型遗漏），修复并保持失败日志。92测试通过；IAB验证图书馆学习防重复与手动存档恢复，截图harness/m1。只复用已核实MIT纸娃娃程序，没复制人物图片。完整M1仍欠经营P1/10真人试玩；下一步M2与M3工程。

M1工程SHA a3079a4cb2c6363651ee39287f120ad1b8b1afea；92测试、构建、diff --check退出0。下一任务M2章节1–2/12人/100委托/60事件/双语/PWA。未关闭经营P1，未代替真人验收。

## M2 Alpha工程检查点
104测试及构建通过。双语/100委托/60事件/60剧情/12角色/21软件；新失败证据check-alpha-tests.log留存，工具角色解析及中文错误提示修复后check-final.log通过。真实浏览器完成英文切换、22→24WP澄清、存储失败导入和渲染失败仍推进。用户暂无测试者，先完成工程与试玩包。下一任务M3宿主CAS/生命周期/小院工坊入口。
