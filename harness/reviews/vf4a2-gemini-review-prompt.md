# Gemini 独立复审 Prompt：VF4-A.1 + VF4-A2

你是只读独立审查者。请审阅固定实现及证据，区分“代码实现完成”“实机功能通过”“设计规范满足”“性能门禁通过”，不要因测试全绿就批准整体视觉冻结。不要修改仓库、提交、push、部署、调用付费API，也不要继续本轮已用尽的性能采样。

## 1. 仓库与锚点

- 仓库：`D:\Documents\FeiyangChen\devApps\ai-game\out-of-tokens`
- 分支：`codex/m1-foundation`
- 本轮固定实现：`__VF4A2_IMPLEMENTATION_SHA__`
- 本轮起点记录：`f0edf5529ba1c259947f589fe2f6d40d419646b1`
- 上一固定实现：`d3e0c87d96bf4fe3baa77ab745163d8baa9ca052`
- VF3.1：`c68541da920b346b02c11b8e27540024c8ea30a5`
- VF3：`6f3a19122f4508004aeb1ae3bfe0c1387047e9dc`
- 保护基线：`2bd6d40733d6ffcd575a3bbcef59d89f5887cf9f`；长期性能基线：`040031e`

第二提交仅回填实现SHA，不能把第二提交当源码基线。先读AGENTS.md、docs/STATUS.md、docs/VF4_CHECKPOINT.md当前节、harness/reviews/vf4a2-user-handoff.txt、vf4a2-handoff.md，再审阅固定提交。白名单本轮差异从f0edf55算，保护路径从d3e0c87和2bd6d40算；不要把前一轮记录提交误认作本轮越界。

用户明确接受的两项补充授权：①导入仅载入内存，不覆盖手动档；随后手动保存更新槽位。②允许alpha-app.tsx Saves既有文件回调在导入前先focus当前dialog，修复busy禁用input导致body焦点；其余alpha范围仍限Studio/Journal及必要无障碍。原始错误和后续复验均留存。

## 2. A.1四项逐一复核

1. VF4A-F-03：Settings、Map、work-steps、Journal选中分段按钮同时focus-visible时，inset选中阴影和外层3px对比环共存，outline solid；Map pressed border为selected-indicator。核对CSS特异性、实际DOM与截图，非只看字符串。
2. VF4A-F-01：真实export/download/import回环，合法LOADED，损坏BAD_JSON，不兼容INCOMPATIBLE_SAVE；唯一顶部system-notice、焦点保持dialog、无横向溢出。核对原槽位不被覆盖+随后手动保存的用户确认契约；导入焦点例外不得改变use-game/存档/领域语义。
3. VF4A-F-04：harness隔离locked模拟与生产分离，真实`.world-map > button`共3个disabled且system-caption可见（产品没有`.map-card`）。每条interaction JSON须包含bodyMetrics/bodyRect/focusInDialog，检查verify-delivery没有过滤漏检。
4. VF31-PERF-01 / VF4A-F-02：独立cacheDir的解析配置及0EPERM日志；唯一24条归因+4预热。检查同步head firstCanvasRafMs、vfMetricsLoadedMs和普通探针逐条差值为0的证据，是否足以支持“本次未发现探针启动延后”，不得推导为长期性能风险关闭。main/vf-metrics应0diff。检查phase1-gate写入先于A2记录，不能倒置串行门禁。

## 3. A2代码、视觉与无障碍

审阅alpha-app.tsx、vf1.css、project-panel.tsx、finale-panel.tsx、vf2.test.ts：Studio资金/工位/章节/项目/招募/升级/SLA/资源，Journal概览/项目/明天/收支；只规范UI，不扩张玩法。检查全部原有操作入口、禁用条件、Command payload、项目负现金边界；公开projectActionBlock是否保持原语义。

检查四视口截图与58条记录：1280×720中文浅色、390×844中文浅色、560×800英文深色、844×390横屏；每个抽屉和每个Journal栏目无水平溢出、可见控件≥44px、场景工具/位置/dock隐藏、Escape/X/返回按钮焦点回归。分段按钮使用aria-pressed而非ARIA tab，核验键盘语义是否合理。关注窄屏长项目路线、英文禁用解释、终局展开、真实非空项目与空态。

截图在harness/vf4a2/studio-*.png、journal-*.png；项目夹具由已有delivery lab通过合法命令继续到第18天导出/导入，见project-fixture.mjs、proof与save。保留失败尝试，不得当正常经营平衡验收。VF3.1回归包括390取消布置镜头同值、位置Escape焦点、Qwen错误关闭重开清理；A2后系统Settings/Map以及项目文件导入继续可用。

**已知VF4A2-TYPE-01 / P3 OPEN**：h3/h4及金额采用既有16px档，与本次附件20/14/12px三档要求不完全一致。请明确裁决统一到14/20，还是建议用户接受16px例外；不能默认接受。12px说明文字保守token合成对比浅色≥5.22、深色≥6.74，caption-contrast.json不是像素实测，请评估其证据边界。新UI不得生产任何图片/纹理/音频/字体或依赖。

## 4. 性能与源码冻结（重点）

阅读performance-protocol.md、source-freeze*.json、startup-balanced.json、startup-confirmation.json、startup-summary.json与warmup-excluded。151源码冻结后才开始正式批，raw/LF哈希均核验。四版本×四单元不能在72条内各6轮，因此采样前登记4/5条平衡分配：每版本18、每模式36、每模式/场景18；两批各72，共32条预热排除。请裁决这个明确披露的方案是否可接受及统计局限，不把它写成16组各6条。040沿用既有诊断补丁，见040031e-existing-diagnostic.patch。

对c68541d的中位数变化：

| 单元 | 首批 | 唯一确认 |
|---|---:|---:|
| dev standard | +1.15% | +1.67% |
| dev twelve | +2.71% | -0.78% |
| preview standard | +4.31% | +0.87% |
| preview twelve | **+19.91%** | **+14.97%** |

**VF4A2-PERF-01 / P2 HOLD**：首批触发确认，确认仍超10%，已立即停止。所有离群值都保留，禁止合并筛样本掩盖。判断证据能支持什么，不能仅凭首HUD+canvas就宣称CPU退化或资产全就绪。给出下一轮最小可归因、有限预算的检查建议，不让Codex反复跑分直到通过。完整VF31-PERF-01继续OPEN/HOLD。

## 5. 保护与交付

核对38文件304测试与type/lint/Web/DSH构建记录；verify-delivery的18项是完整性门禁，不等于性能/字体规范PASS。两次导入焦点失败对应修复后的记录；快捷入口原先错误预期More，实际回到现金原按钮符合契约，纠正断言也保留。首次白名单脚本误把上一记录提交当本轮差异，初始误报与修正版均保留。

核验packages、pnpm-lock、全部public、S2/S3、scene/office-scene/village-characters/paper-doll/scene-navigation相对d3零diff；packages/lock/ai-village相对2bd6d40零diff。engine0.16.0/content office-2不变。生产无vf-metrics/vf-startup/vf-attribution/locked夹具；5181–5186无监听；本轮独立cache已安全删除，无共享junction依赖删除；浏览器页关闭、视口可见性恢复。核对两个本地提交、第二仅SHA回填、无push。

可只读复算JSON/哈希与git diff。若运行现有验证脚本会写证据，请在隔离副本执行；不修改固定实现，也不重跑性能。

## 6. 必须输出

1. 总裁决PASS / CONDITIONAL PASS / HOLD，并分别裁决A.1、A2功能、视觉规范、增量性能、保护交付。明确下一门禁允许/阻断范围，不能把HOLD写成通过。
2. P0–P3问题清单，每项固定SHA文件/行号、证据、影响、最小修复和可复现验收；区分确定bug、规范偏差、测试缺口、待确认推断。没有证据不要虚构。
3. 继续明确保留：冷缓存/GPU纹理/长会话内存、完整Visual Freeze 1、S2完整矩阵、S3对话细化、VF4-B/C资产未冻结未授权、真实DSH端到端冲突、SW全分支、200%字体和低端移动真机待测。
4. **末尾必须提供可直接复制交接回Codex的完整执行Prompt**：包含仓库/分支/固定40位SHA、逐项裁决、优先级和串行依赖、严格文件白名单/保护路径、用户已授权例外、具体改动与实机验收、最多一次有界归因与有限正式/确认采样规则、失败时停止条件、源码冻结、清洁交付、两次本地提交（第二只SHA记录）和暂停规则，并要求下一轮Gemini prompt。先处置本轮PERF-01/TYPE-01，再明确是否允许下一零资源检查点；不得授权VF4-B/C、push、部署或付费API，也不得自动推进多检查点。
