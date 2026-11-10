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
