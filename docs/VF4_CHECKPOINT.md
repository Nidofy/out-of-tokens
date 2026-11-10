# VF4-A.1 + VF4-A2 检查点（2026-11-10）

固定实现：`__VF4A2_IMPLEMENTATION_SHA__`；本轮起点记录提交 `f0edf5529ba1c259947f589fe2f6d40d419646b1`，上一固定实现 `d3e0c87d96bf4fe3baa77ab745163d8baa9ca052`。本轮实现与证据已完成，整体裁决仍为 **待独立复审 / HOLD**，不宣称完整视觉或性能冻结。两个本地提交后暂停；不push、不部署、不付费调用、不进入VF4-B/C。

## 串行门禁与实现范围

- A.1门禁于UTC02:53:50写入 `harness/vf4a2/phase1-gate.json`，八项通过后才开始A2。F03补齐Settings/Map/work-steps的选中inset与外焦点环，Map选中边框用selected-indicator。
- F01真实导出下载再导入。保留导入仅载入内存的原契约（用户明确确认），验证原手动档不被覆盖，随后手动保存更新槽位；合法/损坏/不兼容文件各为单一顶部反馈。发现busy禁用file input后焦点落body，用户明确批准白名单例外：Saves既有onChange中先focus当前dialog，再执行原导入。修复前三个分支中的不兼容失败和稳定帧失败记录保留，修复后全部复验。
- F04在harness transform中模拟locked，只在office-lab查询开启，不进生产；实际DOM是 `.world-map > button`，不是不存在的 `.map-card`。三个按钮全部disabled且caption可见。
- F02最多一次24条归因（另有4条排除预热）已结束；同步head与普通探针读数逐条相同，动态导入均早于首Canvas。没有证据支持修改探针，`main.tsx` / `vf-metrics.ts`保持0diff。Vite现有CLI不支持cacheDir参数，启动器接受显式`--cacheDir`并传Vite API配置，各版本独立；日志0 EPERM。
- A2仅Studio/Journal及其Project/Finale面板：纸面卡片、折叠章节/升级/招募/资源、禁用解释；手账四个aria-pressed分段按钮（不是ARIA tab角色，按普通按钮Tab导航）、概览/项目/明天/收支。项目Command及原禁用条件不变，纯函数测试覆盖负现金时普通项目操作不新增现金门禁。仅重试沿用现金检查。
- 背景工具隐藏后，经营抽屉保留dock触发器焦点；HUD现金入口回到实际现金按钮或更多。关闭/返回/Escape延续原契约。没有修改S2/S3、领域模型、存档协议、依赖或任何public资产。

## 实机与工程证据

38文件304测试、类型/lint/Web及DSH构建通过（`check-final.log`）。统一JSON共58条，28条抽屉记录，所有记录都有bodyMetrics/bodyRect/focusInDialog；逐条检查，失败有明确后续对应记录，不用缺字段过滤来伪造通过。四视口1280×720中文浅色、390×844中文浅色、560×800英文深色、844×390横屏，Studio所有分区与Journal四栏目（含真实非空项目、展开终局内容）均无水平溢出，可见内容控件≥44px、焦点在抽屉、背景工具隐藏，关闭/Escape回到入口。截图 `harness/vf4a2/studio-*.png`、`journal-*.png`。

项目测试存档来自已有delivery隔离夹具，通过现有Command继续经营到第18天并进入第1章后导出，再真实文件导入UI；`project-fixture.mjs`、proof/save文件保留。停在第14天现金不足以及额外review委托的失败夹具日志保留；这不是平衡性或自然结局验收。初始空项目也已检查。VF3.1核心回归：390布置取消镜头style同值、位置Escape焦点、Qwen局部错误关闭重开清空；A2后Settings/Map回归通过，文件导入A.1证据和A2项目导入共同覆盖Saves。

12px说明文字沿用muted token，最坏背景合成计算：浅色≥5.22:1，深色≥6.74:1（`caption-contrast.json`，非截图像素扫描）。保留一项视觉规范偏差 **VF4A2-TYPE-01 / P3 OPEN**：卡片h3/h4、财务和账本金金额使用现有16px层级；附件要求20/14/12px，不能声称已严格统一。请独立审查确定是否统一至14/20，或明确接纳16px作为既有token的例外。此项在冻结后收尾审阅发现，未静默改源码或追加采样。

## 冻结与性能（不得筛掉不利结果）

151源码/测试文件raw与LF SHA256已冻结，前后全部匹配。正式采样四版本040031e/6f3a191/c68541d/current；每批72条、每版本18、每模式36、每模式/场景18，每细分组4或5条，正反交替+平衡尾轮。附件72与16组×6不相容；已提出可选澄清，未收到回复后采用预先登记的72上限，不能写成各6轮。两批各16预热排除，共32条；归因24条不计入正式批。确认严格由首批preview twelve >10%触发，只有一次，之后停止，无配置或源码调整。样本DPR一致、rAF p50约8.3ms、AC性能电源120Hz。040沿用之前的诊断补丁，完整差异归档于 `040031e-existing-diagnostic.patch`。

| 单元 | 当前首批 ms | 对 c685 首批 | 当前确认 ms | 对 c685 确认 | 对 040 首批 / 确认 |
|---|---:|---:|---:|---:|---:|
| dev standard | 189.25 | +1.15% | 206.70 | +1.67% | -0.50% / +2.38% |
| dev twelve | 187.80 | +2.71% | 197.60 | -0.78% | +7.44% / -4.19% |
| preview standard | 142.80 | +4.31% | 139.20 | +0.87% | -10.44% / -13.59% |
| preview twelve | 153.60 | +19.91% | 146.70 | +14.97% | +5.35% / -3.80% |


**VF4A2-PERF-01 / P2 HOLD**：preview twelve对c685首批+19.91%、确认+14.97%，两批都超10%。这证明本轮该指标未过阈值，但仅是热缓存首HUD+canvas读数，不能直接归因为本轮抽屉CPU退化，也不能用其他单元改善抵销。两批原始值及200.8/195.6ms等不利样本全部保留；不追加第三批。完整 `VF31-PERF-01` 仍OPEN/HOLD。

## 清洁交付与后续门禁

`verify-delivery.mjs` 18项机器检查通过；它验证完整性/受控流程，不把性能或字体偏差改判PASS。白名单从本轮起点f0edf55核对；保护路径仍对照d3e0c87，packages/lock/ai-village另对照2bd6d40。首次脚本误将上一轮记录提交的build-log/verification当本轮越界，原结果 `delivery-verification-initial.json`保留；修正起点后通过。另保留快捷入口错误预期：本来预期更多，实际返回现金原按钮符合契约，纠正断言而非改产品。

生产dist无vf-metrics/vf-startup/vf-attribution或锁定夹具；5181–5186关闭，自己的临时`.vite-cache`确认绝对路径及无junction后删除，浏览器临时页关闭、视口/可见性恢复。历史worktree和依赖junction保留，无install。应用engine0.16.0/content office-2不变；office-lab-1仅隔离测试内容。

下步仅接收Gemini独立裁决：先评估VF4A2-PERF-01与TYPE-01，明确返修白名单、一次有界测量协议和停止条件，再决定是否允许下一零资源检查点。未获后续裁决前不继续开发。冷缓存/GPU纹理/长会话内存预算、完整Visual Freeze 1（S2完整矩阵、S3对话细化、VF4-B/C资产）、真实DSH端到端冲突、SW更新全分支、200%系统字体、低端移动真机继续未完成。

审查入口：`harness/reviews/vf4a2-gemini-review-prompt.md`，固定SHA交接：`harness/reviews/vf4a2-handoff.md`。本轮不更新白名单外的harness/build-log.md，执行日志置于harness/vf4a2/build-log.md。

---

以下为历史检查点：

# VF4-A：系统弹窗试点检查点

2026-11-10，父提交 d00071a，上一固定实现 c68541da920b346b02c11b8e27540024c8ea30a5。用户指令原文见 `harness/reviews/vf4a-user-handoff.txt`。本轮先完成 VF31-PERF-01 阶段归因，记录限定门禁后再实现 Saves / Settings / Map；两个本地提交后暂停。固定实现 SHA 与独立审查入口由第二次记录提交写入 `harness/reviews/vf4a-handoff.md`。

**这是零新增资源的系统弹窗组试点，尚非完整 Visual Freeze 1。** VF4-B/C、全站 CSS、四抽屉重排及 O4-B/O4-C 继续 HOLD；不 push、部署或付费调用。

## 1. 前置归因与裁决边界

采样前协议 `harness/vf4a/performance-attribution-protocol.md`，三基线 040031e / 6f3a191 / c68541d，54 条正式阶段记录、9 条预热，另一次24条单因素 effect/layout-effect 实验及4条预热。使用 harness Vite transform 注入标记，未改 main/scene/office-scene 产品源码。完整阶段中位数、资源响应、奇偶差及 longtask 见 `attribution-summary.json`，进入试点前写出的门禁见 `attribution-gate.md`。

- dev twelve 的 VF3→VF3.1 入口前中位数132.70→146.45ms、HUD→场景模块33.05→40.55ms，而首次HUD提交2.35→2.50ms、Pixi27.60→27.50ms。首次同步3.80→4.95ms的差异在单因素批次回落，不支持稳定的大幅场景CPU退化。
- 新 scene-navigation 响应先于入口就绪，末尾响应来自已有共享包模块；不能把额外一个文件当作唯一瀑布瓶颈。旧奇偶两帧差未稳定重现。未合并模块，未更换 Scene 生命周期。
- 隔离 effect 等待后总启动没有稳定改善。54条 canvas 前 longtask 为0，并不等于没有短任务成本或完成输入延迟预算。
- 初始可见性读数为 visible 时仍遇到约1000ms rAF；用户保持窗口前台后恢复8.3ms。正式阶段批、实验批、最终12组预热在相同DPR/前台环境；电源与刷新率前后相同：性能方案、AC、Intel120Hz，虚拟显示刷新率为空。**历史批次未记录遮挡，不能把旧24.37%全部归因于此。**
- 当前可复现差异主要位于模块资源等待和调度，未发现持续的 Preact/Pixi 执行退化，故仅推进用户授权的零资源弹窗组。历史 dev standard/twelve 精确差值及完整性能门禁仍开放，须由独立审查裁决。

初期共享依赖junction下出现一次Vite缓存rename EPERM（9:25:44，见6f3a191-attribution-dev.err.log）；正式阶段样本始于9:35以后。保留该日志及校准失败，不声称物理冷缓存隔离。最终普通dev/preview服务错误日志为空。标准正式批不注入阶段诊断器，与阶段批不可混算。

## 2. 实现和修复

应用仅修改 `dialog.tsx`、`alpha-app.tsx`、`vf1.css`，测试只改 `vf2.test.ts`。未修改任何SVG/WebP/PNG资产；harness中的PNG仅为浏览器证据截图。packages、锁文件、原AI Village资产相对VF1.1保持零diff；engine0.16.0/content office-2、Command、价格、存档格式、RNG不变。

- Saves按固定ID展示3手动/1自动/5备份；手动可保存，有记录才可载入。修正原列表依赖返回顺序/空元素索引推断槽ID的问题；部分或乱序返回不误标档位。零时间戳有效，lab的1970时间来自既有内存夹具，不伪造真实时钟。
- 备份默认折叠，文件区位于底部；保存/载入/导入/导出继续调用原game方法。顶部单一FeedbackNotice独立于滚动正文，EXTERNAL_CHANGE全局告警关闭弹窗后保留。版本更新按钮、DSH只读核对按钮和原处理函数保留。
- Settings提供当前语言、深色、减少动态的文字值与aria-pressed，复用卡片行。进入Saves时原生模态在layout effect内接管；关闭时微任务检查新模态所有权，避免旧触发器抢焦点。来自更多弹出层的入口已卸载时，回到稳定的“更多”按钮。共享Dialog生命周期变化涉及S2/S3，因此保留VF3逻辑回归并实测Qwen；未重排它们。
- Map复用同一头部/正文/关闭/焦点，保留三卡与28×32头像、当前场景aria-pressed、既有visit与镜头重置；locked时补禁用原因。
- 实机发现旧全局pressed样式在浅色Settings造成白字低对比、Map选中卡辅助字不清晰。限定系统弹窗使用纸面卡+ink文字+绿色选中指示修复；蓝色双焦点环与选中态分离。

## 3. 当前值 → 复用值 → 影响页面

| 项目 | c68541d当前值/结构 | 本试点复用值 | 影响范围 |
|---|---|---|---|
| 字体与数字 | 系统无衬线、tabular-nums | 保持，无字体资源 | 三弹窗 |
| 标题/正文/辅助 | Dialog标题fs-lg；直接p13px，行内档位无层级；版权跟随正文 | 标题20、正文14、分组16、时间/说明/版权12px | Saves/Settings/Map |
| 纸面/边框 | paper/solid等既有token，原存档纯p行 | 外层paper、头solid、行card、1px line | 三弹窗，存档行 |
| 圆角 | Dialog r-md；按钮r-sm；档位无卡片 | 外层沿用16、按钮12、档位10px；工具pill999不动 | 三弹窗；不覆盖S2/S3 |
| 头部/内边距 | padding20；头10×16、负margin、sticky | 头12×20，正文20；手机头10×16/正文16；矮横屏头6×16/正文12×16 | 三弹窗 |
| 内容间距 | 存档p默认margin，Settings gap12 | 分组20、行gap8、行padding12（手机10）、按钮gap8（手机6）；Settings gap12 | Saves/Settings |
| 高度/滚动 | 外Dialog max80dvh整体滚动 | max100dvh−32（矮横屏−16）；头/通知固定、正文单独滚动 | 三弹窗 |
| 操作尺寸 | 通用button≥44，关闭依赖min尺寸，文件控件通用样式 | 关闭明确44×44，button/input/summary≥44；file-selector-button≥44，文件输入实测53.14px | 三弹窗、文件区 |
| 禁用/空态 | busy禁用；记录不存在禁载入；原ID标签 | 保留原disabled样式，按稳定ID验证；空/Empty、自动与备份说明，Map锁定原因 | Saves/Map |
| 选中态 | 全局pressed主色/白字，Map棕色outline | Settings与Map卡面ink字、绿色selected-indicator；语言也有aria-pressed | Settings/Map |
| 键盘焦点 | 通用VF2蓝色双环；旧Dialog延迟effect恢复旧activeElement | 3px focus-ring +3px focus-contrast、offset3；summary/input也覆盖；新模态优先 | 三弹窗；共享Dialog焦点生命周期 |
| 回执 | Saves内联在更新/host按钮后 | 唯一notice放正文外顶部，底部滚动不带走告警 | Saves |

方向保持暖木场景、96%暖白/深褐纸面、深胡桃工具、黄铜细饰与现代无衬线。以上仅作为VF4-A待审组件规范，不能由试点推断全站已冻结。

## 4. 验证证据与限制

`check-baseline.log` 38文件299测试；`check-first.log`及最终`check-final.log` 38文件303测试，TypeScript/ESLint/Web/DSH构建通过。新增4项逻辑测试覆盖稳定槽ID/空档、乱序部分记录与零时间戳、busy全部禁用、Saves单主回执与全局优先；既有VF3镜头/位置/反馈测试继续通过。实机31条观察记录在 `interaction-results.json`，完整截图放 `harness/vf4a/`。

| 范围 | 实际结果 | 关键截图 |
|---|---|---|
| 1280×720三弹窗 | 20px标题、44px关闭、无横溢出；空档/保存/载入唯一反馈；Escape和×回更多/地图 | saves-empty-1280、saves-saved-1280、settings-1280-final、map-1280-final |
| 390×844三弹窗 | 保存/载入、备份展开、键盘到达文件区；正文滚动，顶部可见 | saves-390、saves-import-focus-390、settings-390、map-390 |
| 560×800英文深色 | 长英文说明、设置语言/深色状态及Map三卡正常；无横溢出 | saves-560-dark、settings-560-dark、map-560-dark |
| 844×390矮横屏 | 内部纵向滚动，关闭常驻，文件输入可达、双焦点环可见 | saves-844、saves-import-focus-844、settings-844、map-844 |
| 模态与设置 | 中↔英、Light↔Dark、Still↔Full；Settings→Saves后焦点仍在dialog，scene-tools/dock hidden | interaction-results中的对应条目 |
| Map | 4头像28×32；切图书馆自动关闭、回地图按钮、无reset-view残留；返回工作室 | Map travel closes and resets |
| EXTERNAL_CHANGE | 隔离storage-events快捷键触发；顶端单告警滚动不丢、关窗保留 | global-warning-390 |
| VF3回归 | 390布置取消前后backgroundSize/Position字符串一致；位置Escape回触发器；Qwen错误重开0notice | editor-cancel-390、qwen-error-390、qwen-reopened-390 |

`settings-1280.png`与`map-1280.png`为选中态修复前图，保留作发现证据，最终审阅使用带`-final`图。初次Full-motion记录误选旧class而得到空按钮数组，后补`Settings Full state final`为有效记录，旧记录不冒充有效断言。所有交互URL均为office-lab隔离内存档；没有进行文件上传/下载或接触真实档。文件控件验证尺寸/焦点/可达性，未重做跨版本导入导出全矩阵；DSH真实宿主与版本更新提示分支仅代码保留+构建/现有测试，未声称实机通过。Map锁定说明已实现，未单独制造全部锁定状态；设置切换记录验证稳定DOM与原生模态，不声称逐显示帧摄影证明零闪烁。S2全状态、200%字体、低端真机与全资产姿态不属于本轮完成项。

## 5. 冻结后性能与清洁交付

UTC 02:01:02.946冻结151文件原始/LF哈希。12组180帧预热均p50=8.3ms，正式72+唯一确认72条，六轮正反交替，三版本同IAB1280×720/DPR1.0000000447034836。`source-freeze-verified.json` changed/missing均空；最终帧p50=8.3/p95=8.7。首批与确认批均完整保留。

| 模式/场景 | 首批相对040031e / c68541d | 确认相对040031e / c68541d |
|---|---:|---:|
| dev standard | +16.85% / −2.56% | +6.81% / +7.45% |
| dev twelve | −11.24% / −3.54% | +2.10% / −4.08% |
| preview standard | −10.80% / −8.65% | −8.41% / +1.58% |
| preview twelve | −10.07% / +1.71% | +4.78% / +1.71% |

首批dev standard越10%故执行唯一确认。试点对上一实现两批均未越10%，但首批对长期基线仍不利；不能择优关闭历史风险。正式是首HUD+Canvas观察，不代表冷启动全部资源完成、GPU显存或输入预算。只做预先指定一次确认，无后续刷分。复算：`node harness/vf4a/summarize-startup.mjs`。

默认生产重新构建完成，JS无vf-metrics/vf-startup/vf-attribution；5181–5186无监听；浏览器viewport reset、临时页关闭、可见性恢复。无安装依赖、递归删除worktree/junction操作。

## 6. 后续计划与停止点

1. Gemini先独立裁决归因充分性、门禁顺序、试点行为和共享Dialog风险；分别给PASS/CONDITIONAL PASS/FAIL，不能用本文件替代其判断。
2. 如需返修，仅处理具体P0/P1或限定P2，并重新冻结、检查与采样；如通过，只记录系统弹窗规范接受，下一批仍需用户明确范围。
3. 经营/手账等推广应独立成批，不重排S2/S3；先列状态/当前值映射，再一屏样板、四视口长中英、焦点与反馈验证、性能和固定SHA。
4. VF4-B/C继续HOLD：阶段根因与冷缓存/输入/资源预算不足不能靠本轮确认批放行。后续先定接触光影、比例/锚点/命中、来源许可和成本预算，再经用户明确授权才制作一个代表角落；原ai-village资产继续保护。
5. VF5全矩阵通过后才讨论完整Visual Freeze 1及O4-B/O4-C。当前双本地提交后停止，交Gemini并要求回交可直接执行的Codex Prompt。
