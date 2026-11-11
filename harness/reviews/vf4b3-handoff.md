# VF4-B2 闭环 + VF4-B3 联合交接（2026-11-11）

本轮实现与本地验证完成，**暂停待独立只读复审**。当前固定实现直接读取`git log -1`/`HEAD`；基线为`e96fc5d`。依用户简化授权仅一次本地提交，不再PENDING或二次SHA回填，不建立raw+LF源码双哈希台账。未push、部署或跨入VF4-C。

## B2 复审项本地闭环

用户提供B2实现`30e35cd`的Gemini独立裁决为CONDITIONAL PASS（P0=0/P1=0/P2=2/P3=2）。主体实现、原样SVG、alpha>=96、名牌避让、会议矩阵/真实点击/编辑器与性能批次已获认可；本轮修复两项P2和两项P3后按授权直推B3，不将执行者本地通过冒充新的独立PASS。

- P2-1：coffee lounge-3的透明顶边不再误挡(335,655)。按真实绘制顶边158.4world收紧包络，横向候选限定170～1770；meeting-2/lounge-2的12人避障保持有效。新“画内角色不得无故隐藏名牌”断言还发现560全景Seedance右边界问题，画内名牌先夹入视口再避让。新增lounge-3单测与四视口复验，未改slotPoint、席位±72或镜头。
- P2-2：24张旧`harness/vf4b2/retest-coffee-*-zone.png`原样保存在`harness/vf4b3/b2-pre-review-screens/`，原路径已换为真正lounge镜头。截图前确认目标视角及“返回全景/Reset view”，同时记录DOM、背景映射和截图清单；四视口代表图已目视核对。
- P3-1：B2的`visibilityRestored:false`改为`visibilityRestoredSuccessfully:true`和`restoredVisibility:hidden`，明确表示成功；B2验证器及B3联合验证器均检查成功布尔值。
- P3-2：README.md与.github/workflows/pages.yml已先`git stash push -u`隔离，stash信息见user-changes.json；仅提交本轮文件，提交后恢复原样。恢复后工作区预期只留下这两份用户改动，不能误清理它们。

B2共44配置×overview/目标镜头，另在B3修改结束后复查12个关键配置。旧B2大证据JSON与性能样本不重写；原固定提交的冻结/交付文件仍是历史证据，当前联合结果以B3为准，不再调用旧冻结门禁证明新源码。

## B3 实现与资产

四类家具sofa/server/dining/reading八张SVG均“实屏核验通过 · 原样复用”；**全部16张office SVG保持0diff**。初测56配置发现四类旧矩形透明区误触、桌面细节漏点、sofa lounge-2/server server-1遮住12人空闲样本。仅两个scene文件扩展已验证alpha>=96遮罩与有证据的空闲站位避障；vf2新增几何回归。服务器前方回退还需避开下一排身体，已按真实命中宽度选择空隙；两次中间失败保留。

角色母版/立绘/许可证、packages、pnpm-lock.yaml、scripts、六个已封板UI、B1证据与B1/B2 SVG均0diff。server只审核设备外壳，不新增算力。office/SOURCE.txt原有原创声明引用的根LICENSE缺失限制保留，不借用ai-village许可证。

台账corner-audit.json列出八层来源/派生入口、字节、源raster175×150、逻辑280×240、bbox、空层、锚点、z层、命中与加载成本，以及既有高光/接触阴影观察。复用依据为git diff，不增加多套SHA交叉校验。

## 矩阵与真实交互

四视口1280×720 zh/light、844×390 zh/light、560×800 en/dark、390×844 zh/light；五样本bluewhale/Qwen/Llama/Mistral/GLM，4/12人。

- B3最终240配置：工作室160（两roster×idle/working×sofa三槽/server两槽×两人数×四视口）；公共场景80（五roster×dining/reading×两人数×四视口）。每配置overview、目标镜头、reset，720条最新记录全部通过，背景size/position逐字段精确恢复；3,240条最终样本观察。
- 联合967条几何记录，保留97条历史失败及明确复验映射：B2 3条、B3修前87条、早期final 6条、探针诊断1条。包括重复与中断前已落盘记录，不宣称全部为独立统计样本。
- 469条真实指针记录全部通过：320次五样本脸/身体点击（四类×四视口×4/12人×五人×两部位），其余家具实心/细节、透明角/间隙/阴影及补验。通过pointer-events:none标记点击生产canvas，验证实际角色Dialog或OfficeEditor。公共桌面现有点击无业务弹层，结合实际命中和无误弹层验证，不伪造公共OfficeEditor功能。
- 最终覆盖门禁发现lounge-2沙发原实心探针都被前景角色挡住，虽正确打开角色但缺少家具入口证据；保留失败门禁文件delivery-before-exposed-arm.json，补四视口暴露扶手点击，均实际打开OfficeEditor。补验只改harness，发生在性能后，应用代码未动、性能未重跑。
- 80次编辑器往返：64次交换（两家具×四视口×overview/meeting/lounge/locate×cancel/save），16次实际采购（两家具×四视口×cancel/save）。核对两个锚点的x/y、预览交换、取消回滚/不收费、保存扣款（sofa600/server200）、背景精确恢复和More触发按钮焦点。

两次定位镜头使透明探针落在画外，未派发成功点击，不计通过；pointer-attempts.json说明后续改镜头。餐桌细笔画原(54,-97)为alpha57抗锯齿边缘，改笔画中心(52,-90)后验证，不放宽生产阈值。服务器实心点选暴露柜体左侧；被前景角色挡住的点应选择该角色。

夹具采购/assign使用真实命令，隔离存档；roster排序仅克隆内容。公共场景用隔离session view getter置canteen/library与在场演员，仍由生产public-table meeting-1渲染。它不是自然日程达成，也不包含背景/章节扩产。面部率为贴图家具alpha交集，不是五官分割；画外裁切、全动态与其他七角色全姿态不据此关闭。

Windows汇总文件间歇占用后改为records/逐条落盘；一次浏览器批处理超时按持久队列恢复。原始记录与重复保留。首轮完整check有一项测试写死x1642而实际安全位置为1658，改为两角色之间安全区间断言；失败日志保留，应用没有因此修改。

## 工程、性能与清理

最终完整pnpm check：38文件318测试、类型/lint/Web/DSH构建全通过，见check-release.log。code-finalized.json时间为2026-11-11T02:46:46.5168902Z（北京时间10:46:46），所有性能样本在其后，应用/测试此后未改。无B2中间性能批次。

唯一首批72正式+12预热，三版本040031e/c68541d/current×dev/preview×standard/twelve×n=6；前台1280×720、visibility可见、rAF p50<=25ms。

| 单元 | 当前中位数ms | 对c68541d |
| --- | ---: | ---: |
| dev standard | 238.00 | -7.61% |
| dev twelve | 252.55 | -5.02% |
| preview standard | 155.50 | -3.60% |
| preview twelve | 162.30 | -2.17% |

全部<=+10%，**未触发确认批**。全部原始值与预热保留；仅首控件+Canvas指标，不等于完整assetsReady或冷缓存预算。

联合交付26/26 true。正常production dist恢复、无诊断探针，5181–5186无监听、专用.vite-cache删除；补验DEV服务也已关闭并再次清理。浏览器视口恢复、测试标签关闭、成功恢复隐藏。单次提交前隔离用户改动，提交后按原字节恢复。

## 独立复审入口与开放风险

直接从git log/HEAD取本次实现，比较基线e96fc5d。阅读protocol、b2-closure、interaction-analysis、delivery-verification、pointer-click-results、office-roundtrips、corner-audit、build-log及截图清单；可执行`node harness/vf4b3/verify-delivery.mjs --read-only`，不会改验证时间戳或产物。分析器会写派生文件，如需重算请使用副本。无需重跑采样。

重点复核B2四项本地闭环、画内名牌、新增家具空闲避障与alpha命中、公共夹具边界、实心入口补验、采购与交换、代码定稿后72+12，以及提交未混入用户文件。

继续OPEN/HOLD：其余七角色全姿态、完整动态、VF4-C背景/全员推广（食堂/图书馆/章节背景改造）、Stage B专属立绘、完整Visual Freeze 1、VF31-PERF-01完整预算（冷缓存、完整assetsReady、GPU上传、长会话驻留、输入延迟、低端真机）、真实DSH、SW更新全分支、200%系统字体、lounge-4不可达/未验收。VF4-A全阶段、B1与VF4A2-PERF-01仍CLOSED/PASS。本轮联合独立裁决待审。
