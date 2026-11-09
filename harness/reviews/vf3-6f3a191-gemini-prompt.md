# Gemini 独立审查 Prompt：VF2 收尾 + VF3

请用中文对以下固定实现做独立只读审查，结合源码、测试、实机复现和原始证据，裁决VF2四项先决返修是否闭环，以及限定VF3是否可以通过。不要直接改代码、提交、push、部署或调用外部付费模型。**报告末尾必须提供完整可复制的“交接回Codex的执行Prompt”**，不能仅写“按上述建议修改”。

## 版本与依据

- 仓库：`D:\Documents\FeiyangChen\devApps\ai-game\out-of-tokens`；分支 `codex/m1-foundation`。
- **唯一目标实现 SHA：`6f3a19122f4508004aeb1ae3bfe0c1387047e9dc`**。
- 父提交 `e693642215f6406fa6e945144591ef0a8c736720`；上一固定实现 VF2 `61b9c7594dcf288e7cb0f136aec11911cdc7cbb6`；VF1.1 `2bd6d40733d6ffcd575a3bbcef59d89f5887cf9f`；长期性能基线 `040031e`。
- 此SHA之后的独立记录提交只写SHA/Prompt，不改变实现。仅本地，未推送；若只能访问GitHub旧版本，明确目标不可用，不能审旧HEAD后宣称通过。
- 先核对 `git status -sb`、`git log -5 --oneline`、`git show --stat 6f3a19122f4508004aeb1ae3bfe0c1387047e9dc`。不覆盖用户改动、不reset/clean、不递归删除worktree依赖junction。
- 必读：`AGENTS.md`、`docs/STATUS.md`最新段、`harness/reviews/vf3-user-handoff.txt`、`docs/VF3_CHECKPOINT.md`、`docs/VF2_CHECKPOINT.md`收尾段、`docs/VISUAL_FREEZE_1.md`、`docs/ROADMAP.md`、`docs/DECISIONS.md` D052、`harness/build-log.md`本轮和`harness/vf3/`。

用户已裁决VF2有条件通过：先VF2-F-01～04再限定VF3。三屏布局、字体/纸面/圆角/焦点已确认，禁止借审查推翻方向或要求直接进入VF4/O4-B/O4-C。`packages/`、`pnpm-lock.yaml`、`apps/web/public/art/ai-village`必须相对VF1.1零改动；engine0.16.0/content office-2保持。严禁把本轮称为完整Visual Freeze 1冻结。

## A. 四项先决返修（先单独裁决）

1. `presentation-events.ts` / `use-game.ts`：关窗后仅global或assign/deliver收据可进入S1；角色错误、visit、accept/clarify/scope/reject和局部saves不得串入。global存储错误在活动job/actor/saves的notice中可见；paused且未关闭的global错误不得被普通成功抹除，手动关闭或load/import/reconcile恢复后解除优先级。检查函数式setFeedback是否有过期状态或时序问题。
2. 实机 `?office-lab=initial`：Qwen→成长→研发触发资源不足→关闭，S1不残留；去找伙伴不留DONE；派遣/验收仍各有一条跨屏收据。`?office-lab=initial&test-fault=storage-events` 档案内按Ctrl+Shift+F9注入内存存储通知，再聊天，告警仍在。该路径不是实际双标签竞争；请另查StorageFeedbackError接线，并尽量独立复现S2接单后告警保留及存档恢复。
3. S3 sticky：1280×720、390×844展开成长、触发错误、滚到底，`notice.top-head.bottom`应在0–2px，标题下无透字，研发按钮可见可点。对照profile-error-feedback.json与两张错误截图。
4. 异地且lifeBusy提示优先于elsewhere；standard推进两槽，未加班Qwen图书馆提示可去找；去图书馆安排加班后Qwen回工作室，应提示工作忙碌。不得破坏原lifeBusy/actor.busy区分、晚间日常互动和普通recall提前返回不写busyUntil契约。
5. S1/S2/S3及actors/jobs/studio/journal全部details展开，实际待接单技能标签、version-tag≥12px；只允许lab badge和矮横屏work-confirm small例外。text-audit里一次误扫背景的S3尝试已明确无效，不能算成S3覆盖。

## B. VF3 实现与设计审查

重点文件：`alpha-app.tsx`、`office-scene-spec.ts`、`office-scene.ts`（`scene.ts`重导出）、`partner-profile.tsx`、`commission-workbench.tsx`、`vf1.css`、`office-lab.ts`、`apps/sim-cli/vf2.test.ts`和`vf3.test.ts`。

- 相机只改变同一背景/世界变换，不能通过renderable隐藏画内人物。普通打开/关闭S2/S3/抽屉不自动移镜头。区域相机已由Alpha管理，不应与layout预览相互污染。
- S3同工作室显式定位伙伴；S2仅有实际预订工位/会议席时可定位；定位关闭浮层并对准共享锚点，返回全景清focus与zone。确认没有send/Command/RNG/存档变化，且视角菜单打开时返回入口可达。
- 窄屏初始统一overview，位置列表承接画外伙伴。检查同场景画内/画外、食堂/图书馆/远征提示，异地进入档案而不是定位错误坐标；列表滚动、关闭、键盘焦点和抽屉互斥。移动中的角色与场景变化后提示应及时更新。
- 审查顶栏下定位工具的尺寸、层级和长英文；主HUD/推进仍第一权重。已冻结的S1双排摘要、S2跨步草稿/固定底栏、S3头像与四现状不应回退。
- 1920×1080逻辑世界、原站位/槽位、电脑坐姿上移48和前挡板遮挡保留。名牌最终移到电脑前挡板；scale<0.8的双会议席第二牌向下错开22px，避免挤压。双会议席本来是协作白板两侧的支持锚点，非新增椅子坐姿。
- 五视口1280×720、1920×1080、390×844、560×800英文深色twelve、844×390检查4/12人、基础/标准电脑、双会议席、GLM特殊体型。脸/上身→对应S3，占用桌面/白板→对应S2，空桌→OfficeEditor，透明区域不得抢点。重点复核边缘角色、名牌与HUD的覆盖。
- 证据42次实点覆盖四人/十二人站姿全员及代表性坐姿组合；不是十二人×每姿态×每视口的穷举。请明确新增实机覆盖和仍未验证的组合，不以截图或纯几何测试推断全部通过。

## C. 复现与性能协议

自动化：`pnpm check`（本轮38文件291测试）、`git diff --check`，以及：

```powershell
git diff 2bd6d40733d6ffcd575a3bbcef59d89f5887cf9f 6f3a19122f4508004aeb1ae3bfe0c1387047e9dc -- packages pnpm-lock.yaml apps/web/public/art/ai-village
pnpm --filter oot-web dev --port 5181 --strictPort
```

开发URL `http://127.0.0.1:5181/?office-lab=standard&motion=still`。夹具initial/twelve/working/standard/meeting/twelve-basic/twelve-standard/twelve-meeting；`locale=en&theme=dark`为英文深色。正常动态检查去掉motion=still。夹具只用克隆测试内容与真实Command，不写玩家存档。新增夹具初稿曾被core拒绝INVALID_TEAM，已改合法三人队伍并回归；fixture-initial-failure保留。preview-verification.json中的同一旧5181 URL历史错误不要误当新5183错误，也不要直接忽略真正的新错误。

优化诊断：`pnpm --filter oot-web exec vite build --mode visual-review`，然后preview；默认生产不启用夹具/指标。结束必须`pnpm --filter oot-web build`恢复默认产物，无vf-metrics/vf-startup，关闭临时端口、还原视口。

性能须审原始数据和时序：source-freeze.json在UTC16:28:30.958冻结源码后才采样；source-freeze-verified.json记录150文件原始一致及LF规范化哈希，后续没有源码/CSS收尾。DPR精确1.0000000447034836、1280×720、standard/twelve、dev/optimized preview、三版本6轮正反交替；12预热排除，首批与复核各72条，所有原始JSON保留，summarize-startup.mjs可重算。

**必须正面审查不利批次**：首批dev standard对040031e +14.82%；复核dev standard对VF2 +20.20%。preview对VF2首批标准-2.50%/十二人-1.89%、复核-4.78%/-4.30%。补充180帧诊断p50约8.3ms、p95约8.4–8.5ms、无>50ms帧，资源数VF2/VF3相同但载荷+36720B，不能据此断言启动回退不存在或GPU内存通过。禁止挑选好批次覆盖坏批次；判明是本轮阻断、持续观察还是需专项profile，并说明证据/阈值。此指标仅首次HUD+canvas，不是assets-ready或完整性能预算。

## D. 报告格式与必须交回的执行Prompt

报告先给VF2返修与VF3分别的PASS / CONDITIONAL PASS / FAIL及理由。逐项问题给优先级、文件/行号、视口/夹具/步骤、期望/实际、用户影响、最小修复和可验证标准；区分已复现、源码推断、未验证。没有发现也须列覆盖边界，不虚构问题。列出允许冻结的设计、仍需定调的项目和按依赖排序的后续计划，不能泛化成重做美术。

**报告最后必须附一个独立完整、可直接复制给Codex的执行Prompt**，至少包含：

1. 仓库、分支、上述完整固定SHA、你的明确裁决；用户当前阶段与不变规范。
2. 按依赖排列的必修项，每项P级/文件/复现/最小改动/验收；未发现则明确无需返修，不杜撰。
3. VF3.1返修与未来VF4的边界。若认为VF4可放行，明确前提及具体范围，不能默认已获用户执行授权；整体Visual Freeze 1和O4仍受门禁。
4. 保护路径零改动、禁止覆盖用户改动/删junction、默认只读外部审查、不push/部署/付费模型。
5. pnpm check、实机矩阵和原始证据要求；任何源码/CSS改动后重新定稿冻结，再按同DPR协议采样，所有>10%批次保留，最后恢复默认构建。
6. 先本地实现提交，再独立固定SHA/下一轮Gemini Prompt记录提交；关闭5181–5186、恢复视口，到检查点立即暂停。再次要求下一轮Gemini输出回交Codex Prompt，维持完整审查链。

这段回交Prompt必须自包含，不能依赖“见上文”“按附件”才能执行；不要给Codex自动开始VF4/新玩法或覆盖用户文件的隐含授权。
