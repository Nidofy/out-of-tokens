2026-11-10 收尾更新：用户独立裁决VF2有条件通过。本轮已闭环VF2-F-01～04：局部反馈不泄漏、暂停存储告警在活动弹窗保留、S3 sticky gap约0.43px、异地忙碌优先、job-tags/version-tag≥12px。先决实机验证后进入限定VF3；本轮全量291测试、证据和当前风险以VF3_CHECKPOINT.md为准。下文VF2原始实现/259测试及旧反馈边界是历史，不代表返修后的语义。

# VF2：组件、反馈与字体形状规范检查点

2026-11-09。实现基线 `2bd6d40733d6ffcd575a3bbcef59d89f5887cf9f` / 记录 `fed8c40`。本轮已实施并到检查点暂停，待 Gemini 独立复审；固定实现 SHA 和完整 Prompt 见后续记录提交的 `harness/reviews/vf2-handoff.md`。不自动进入 VF3/VF4，不 push。

## 来源与边界

用户提供的《VF1.1 独立复审裁决与 VF2 检查点执行指令》明确批准 VF1.1、放行 VF2，同时要求闭环 VF11-F-01/02。原文为 `harness/reviews/vf2-user-handoff.txt`：原附件/CRLF副本 SHA256 `97758f24ea527f733eea80036ae835fa8b1ed2303063f796f7214af710e11d83`，Git规范LF后的 SHA256 `19792f6d8d3f710197397deeabcd1192c33b24f41a05a204e1f556fb2862e3fa`，正文未改。只收到这份裁决与交接，不补造另外的独立报告。

保留三屏阅读顺序、暖木场景和不透明暖白/深褐操作纸面、深胡桃轻HUD、黄铜细饰、原12名AI Village Q角色、固定槽位/工位、1920×1080坐标和遮挡层。未触碰 `packages/`、`pnpm-lock.yaml`、`apps/web/public/art/ai-village`，engine0.16.0/content office-2不变。没有相机定位、离屏提示、资产生成或O4新玩法。

## 完成台账与组件责任

| 项目 | 本轮结果 | 校验 |
|---|---|---|
| VF11-F-01 日常状态 | `partnerAvailability` 区分actor.busy派遣占用与lifeBusy当槽互动占用；晚间未加班在岗伙伴可互动 | standard两槽到图书馆，实机吃饭成功、心情69→77，互动/加班随后禁用；5种日常命令逐项自动对照真实core |
| 普通召回 | 恢复“请回工作室 / Recall to workshop”；同场景或remote软件、非工作室、非远征、当槽空闲 | 实机召回成功；同场景/remote/锁定/远征派生测试；不将召回伪装为远征取消 |
| VF11-F-02 / VF-07 | 移除S3身份区无条件全局message；一个UiFeedback对象，按来源与对象ID选择唯一主显示位置 | 推进后开档案无推进文字；接单/派遣/交付/存读档/角色错误仅一个反馈节点；错误滚动吸附可见 |
| S2抽取 | `commission-workbench.tsx`持有本单草稿、步骤和纯预估；父级按job.id挂载 | 手机试选→预估→接单保留Qwen执行者并切到队伍；真实派遣成功；改none后关闭重开恢复已提交worker |
| S3抽取 | `partner-profile.tsx`持有展示与操作接线，`partner-state.ts`只派生状态；`dialog.tsx`复用原焦点恢复，`ui-labels.ts`共享词表 | 不引入effect发命令，不改send顺序，不新增RNG调用；档案跳工作、关闭和找人路径保留 |
| VF-04/05 | 核心金额16px、现状20px；常用说明/候选12–14px；浅深蓝色双焦点环、禁用/选中分离 | 五视口截图；HUD金额/底栏16px，抽检dialog无<12px叶子；纸面前景与次要文本对比度记录 |

规则校正：`actor.busy`仍用于派遣/澄清、版本切换和训练锁定；`lifeBusy = busyUntil>slot || overtime.includes(id) || (activeJobs.length>0 && slot%4<2)`，不再把活跃委托的全天占用直接当成日常忙碌。头像档案中的加班仍要求working委托、精力>=10、无个人活动。切换版本与训练/对齐在actor.busy时禁用；研发本身不错误地按在岗锁死，仍走既有资源校验。

**recall的例外**：现有core的recall分支提前返回，将location设为工作室一槽，但不写busyUntil。因此它成功后可继续合法加班，不应把附件“日常互动后都占用”的概括强加到recall。聊天/礼物/吃饭/学习会占用当槽并阻止加班；这四类和recall分别测试。本轮没有修改core补造互斥。

## VF-07 反馈协议与状态表

单主渠道针对同一操作回执；持久领域状态、预算预估与可选氛围文本不是第二份操作回执。`use-game.ts`负责发布，`presentation-events.ts`负责来源与显示位置，`FeedbackNotice`负责渲染。旧receipt队列不再接到应用UI；原纯helper及其历史测试保留不参与排队。

| 来源/状态 | 唯一主位置 | 生命周期/优先级 |
|---|---|---|
| 推进、DayEnd、一般日常或经营成功 | 无弹窗时一个顶层轻提示 | 最新操作替代上一条，6秒或收起关闭；不会同时渲染receipt和toast |
| accept/assign/deliver/hardware成功 | 同一FeedbackNotice的receipt文案样式；位置依当前所属界面 | 不另开浮动卡；assign/deliver关窗后在S1显示一条 |
| 委托命令成功/失败 | 对应job.id的固定确认栏内 | 换到别的委托不串消息；澄清/范围/接单/派遣/返工/验收按命令来源归属，不再只凭错误码白名单 |
| 草稿预估不合法 | 工作台预估区assignment-error | 属于当前草稿的即时校验；底栏仅作禁用说明，不另发toast。posted空队仍温和引导 |
| 档案内角色动作（含版本研发、故事） | 对应actor.id的主操作区后方 | 不进入头像与现状之间；滚动时吸附标题下，失败原因不落在屏幕外 |
| 手动存/读/导出/导入/对账 | 存档弹窗；关窗且未过期时可回到S1 | 成功6秒；错误不自动消失；实验夹具只用内存存档 |
| 初始化、跨窗口、自动保存失败 | 全局错误；存档弹窗可承接 | 不伪装为委托/角色错误；在其他弹窗中暂不显示，关窗后仍保留，直至收起或下一操作替代。这是本轮明确策略，非即时跨弹窗警报系统 |
| 现金流预警/版本更新/待选事件 | 原持久chip或事件弹窗 | 领域状态提醒，不再复制操作成功回执；不会消耗或改写领域事件 |
| 布置草稿与本地气泡包 | 原编辑器局部校验、FlavorPanel自身内容状态 | 不转发同一条command成功消息；布置失败原有局部提示仍保留，完整编辑器错误细分不在本轮重构范围 |

成功用单个 `role=status`，失败用单个 `role=alert`；最新操作获显示权，错误不被计时器关闭，但用户下一次操作可以替换它。其他对象弹窗不显示旧消息，关闭后可能在有效期内显示该条。没有宣称跨界面切换绝不重复读屏播报，也未用真人读屏软件验收。键盘聚焦成功提示时延后过期，离开后下一次1秒检查再关闭；`focused-feedback-retained.json`记录聚焦超过6秒仍保留，避免自动移除当前焦点。

## VF2 已确认的字体、材质与形状规范

此处将原“候选”升级为**VF2已确认规范**，后续页面应遵守；这是样板规范确认，不是全部平台和完整Visual Freeze 1放行。

| 类别 | 规范 |
|---|---|
| 字体 | `--font-sans: PingFang SC / Hiragino Sans GB / Microsoft YaHei / Segoe UI / sans-serif`；`--font-display`引用同栈；数字`tabular-nums`。不添加字体文件或依赖 |
| 字级 | 正文14px；决策说明/标签12–14px；关键金额/核心状态>=16px，档案四项现状20px；标题20–32px。`--fs-xs`升12px；只允许max-height479px横屏底栏副文案11px |
| 材质 | 场景暖木；S2/S3不透明`--solid`纸面（浅#fcf6eb/深#282320）；轻HUD深胡桃、黄铜仅装饰。抽屉继承现有纸面体系，不新增纹理/模糊层 |
| 形状 | 小控件`--r-sm=10px`，面板/头像`--r-md=16px`；工作台/档案主按钮12px，HUD胶囊999px。角色相框桌面160、899以下128、679以下112，始终1:1 |
| 普通/悬停 | 暖白或深褐底、正文ink；hover token轻变色，不靠跳动/缩放表示可用性 |
| 选中 | `aria-pressed`+selected-indicator（浅#43684d/深#8bc29a）及文字/底色；候选卡focus-within轻底色，岗位/模式仍为原生select |
| 焦点 | 浅蓝#174f87/深蓝#9ed5ff的3px外环+反差衬环，offset3px，独立于黄铜装饰；覆盖HUD/Dock、按钮、摘要、select、input、链接 |
| 禁用 | 原生disabled，正常字形、muted色、低强调底和边框、无投影/not-allowed光标；HUD用独立深底。原因通过当前状态/规则/预估表达，不只靠颜色 |
| 错误 | 单条alert、danger侧线、可收起；成功sage侧线；焦点仍使用蓝环，不复用错误/装饰色 |

纸面计算对比度：浅正文13.18、次要5.91、焦点7.79；深正文13.43、次要8.12、焦点9.93，见 `solid-contrast.json`。这些是明确前景/不透明纸面的计算，不等于所有场景像素、透明HUD、渐变和禁用底色的完整对比度审计。

## 实机证据与复现

目录 `harness/vf2/`。Windows Chrome156、固定动画参数，默认中文浅色、4人；560英文深色用twelve/12人。截图来自最终工作树；最后补的是错误提示sticky样式，不影响已拍的无错误状态。所有图为浏览器视口模拟，不是真实手机。

| 视口 | S1 | S2 | S3 |
|---|---|---|---|
|1280×720|s1-focus-1280.png|s2-working-focus-1280.png、s2-review-focus-1280.png、s2-waiting-1280.png、s2-history-1280.png|s3-elsewhere-1280.png、s3-evening-working-library-1280.png、s3-error-visible-1280.png|
|1920×1080|s1-focus-1920.png|s2-footer-focus-1920.png|s3-summary-focus-1920.png|
|390×844|s1-focus-390.png|s2-accepted-focus-390.png|s3-summary-focus-390.png|
|560×800英文深色|s1-focus-560-dark-en.png|s2-twelve-focus-560-dark-en.png|s3-focus-560-dark-en.png|
|844×390|s1-focus-844.png|s2-focus-844-final.png|s3-action-focus-844.png|

焦点截图通过真实Tab/Shift+Tab取得，未用DOM强制添加focus class。S3部分截图因Tab把摘要/操作滚入视口，顶部身份已滚走；晚间展开图记录操作区，可用性全文见同名txt，不冒充同一首屏容纳全部档案。`layout-844-final.json`：主数字16px、内容224.13px、body844、底栏在视口；早期`layout-844.json`的225.53px/14px主数字及截图保留为中间状态。`dock-focus.json`和`type-style-audit.json`记录计算样式。

`before-*`为修前复现；`recall-success.txt`、`meal-success.txt`、`overtime-disabled.txt`记录成功和互斥；`single-assignment-feedback.json`、`delivery-feedback.json`、`save-feedback.json`记录各自只有1条反馈，旧presentation-receipt数量0；`load-feedback.txt`为内存读档；`profile-error-feedback.json`记录研发点不足唯一alert在视口内；`draft-discard.json`记录关闭后恢复已提交worker。

复现：仓库根 `pnpm --filter oot-web dev --port 5181`，访问 `http://127.0.0.1:5181/?office-lab=standard&animation-time=1`。推进两槽、伙伴列表打开Qwen、去找伙伴、再开Qwen。普通召回将他请回工作室；如先吃饭本槽全部日常和加班禁用；重新载入夹具可检查先加班的互斥。initial用于posted/手动接单，review/waiting/delivery为目标阶段；twelve加`locale=en&theme=dark`。角色研发点不足：initial Qwen→能力成长→研发。以上不改真实存档。

## 性能持续门禁（完整保留不利结果）

`startup-balanced.json`：三版本040031e/2bd6d40/VF2 × dev/优化诊断preview × standard/twelve × 6次，共72条。预热12条单存 `startup-warmup-excluded.json`不计；六轮正反交替版本顺序及场景顺序，每条1280×720、DPR精确 `1.0000000447034836`、Chrome156/16逻辑线程、本机HTTP热缓存，无清缓存/节流。沿用VF1.1同一`#vf-startup`、首个HUD+canvas的rAF时刻定义，不是资产齐备或输入可用时间。

| 模式/场景 | 040031e中位ms | VF1.1中位ms | VF2中位ms | VF2对040031e | VF2对VF1.1 |
|---|---:|---:|---:|---:|---:|
|dev standard|205.70|235.90|190.55|-7.37%|-19.22%|
|dev twelve|184.55|178.85|206.85|**+12.08%**|**+15.66%**|
|preview standard|149.20|143.00|148.10|-0.74%|+3.57%|
|preview twelve|130.20|136.00|129.10|-0.84%|-5.07%|

dev twelve超过10%触发独立复核；不修改代码、不丢旧样本，另做36条同条件6轮，保存 `startup-dev-confirmation.json`：

|dev复核场景|040031e|VF1.1|VF2|对040031e|对VF1.1|
|---|---:|---:|---:|---:|---:|
|standard|199.00|185.05|201.50|+1.26%|+8.89%|
|twelve|180.05|176.55|186.10|+3.36%|+5.41%|

调查结论：本轮优化诊断preview未见>10%的组中位退化；dev首批十二人越线，复核未稳定重现，基线本身也波动。组件拆分增加开发模式模块请求，而优化构建打包；这是可能因素，不是已经隔离证明的因果。不能宣布+15.66%“不存在”或全面性能预算通过，也不能把dev标准-19.22%宣传为稳定提速。保留首批与复核，VF3继续监控；冷缓存/低端GPU/纹理解码/稳定帧与输入延迟仍由VF5门禁处理。采样之后的收尾修改是错误回执sticky、成功回执聚焦时延后过期与横屏主数字16px；采样场景无操作反馈、1280宽，新增行为未触发，但这些原始记录严格说是最后收尾前的工作树，不伪称提交后重新测量。

`node harness/vf2/summarize-startup.mjs` 校验组数/轮次/DPR并重算 `startup-summary.json`。首次脚本漏闭合括号导致SyntaxError，保留 `startup-summary.log`；修复后的 `startup-summary-final.log` 和JSON成功，不用手写摘要代替原数据。

040031e沿用 `../vf11-perf-baseline`，只含上一轮诊断开关/指标插桩；2bd6d40本轮新建 `../vf2-vf11-baseline`，该基线无源码修改。两者复用依赖junction并拷贝相同包构建产物，未安装或改锁文件。保留工作树供审计，不递归删除junction目标。诊断构建为 `vite build --mode visual-review`，不注册SW；它不是默认发布包的冷启动性能。已执行 `pnpm --filter oot-web build`恢复默认生产，最终日志 `restore-production-build-final.log`；正常产物无vf-metrics脚本。

## 自动检查、已知边界与停止

基线251；新增8项测试，最终 `check-final-v3.log` 为37文件259测试、TypeScript、lint、默认Web与既有DSH构建全部通过。`check-first.log`、`check-final.log`、`check-final-v2.log`也通过，最终版本额外包含sticky错误可见性、聚焦寿命与横屏主数字；`typecheck-first.log`通过。抽取文件逐步落盘时开发服务器一度提示新import尚不存在，所有文件完成后消失；Python临时脚本默认GBK读失败与写证据沙箱失败已换UTF-8/允许的写入工具，不修改业务逻辑。

提交前 `git diff --check`，与2bd6d40比较三个保护路径输出空。只清理本轮日志尾部空白，原失败信息保留。全部5181–5186临时监听已停止，浏览器视口恢复、验证标签关闭；没有远端/部署/付费调用。

仍未证明：所有语言/主题/200%字体组合、实体手机/软键盘、真人读屏、所有存储/跨窗口/Host故障的交互、远征实机、完整布置反馈重构及全性能预算。VF11原命中、头像、历史金额修复保留，不将本轮抽检冒充全部状态复验。下一步只接收Gemini对本固定实现的审查与回交Prompt；VF3/VF4和O4-B/O4-C均不自动推进。
