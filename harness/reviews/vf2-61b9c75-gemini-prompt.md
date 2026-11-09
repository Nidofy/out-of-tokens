# Gemini 独立审查 Prompt：VF2 检查点

请对下面固定实现进行独立只读审查，结合源码、测试和实机浏览器复现裁决是否达到VF2检查点。中文报告；不直接改代码、不提交/推送/部署、不调用外部付费模型。你的报告末尾必须给出完整可复制的“交接回Codex的执行Prompt”，具体要求见末节。

## 固定版本与依据

- 仓库：`D:\Documents\FeiyangChen\devApps\ai-game\out-of-tokens`，分支 `codex/m1-foundation`。
- **审查实现 SHA：`61b9c7594dcf288e7cb0f136aec11911cdc7cbb6`**。
- 本轮父提交：`fed8c40`（VF1.1记录）；VF1.1固定实现：`2bd6d40733d6ffcd575a3bbcef59d89f5887cf9f`。
- 长期性能基线：`040031e`；不要把它与VF1.1混用。
- 固定实现之后的提交只补SHA/Prompt记录，不改变实现。当前仅本地，未push；若你只能看到GitHub旧HEAD，明确“目标不可用”，不要审旧版本后宣称通过。
- 先核对 `git status -sb`、`git log -5`、`git show --stat <目标SHA>`，阅读 `AGENTS.md` 和 `docs/STATUS.md` 最新段。不覆盖用户未提交改动、不reset/clean、不递归删除依赖junction目标；需构建可使用独立worktree及ignored产物。

必读：`harness/reviews/vf2-user-handoff.txt`（用户VF1.1裁决/VF2指令）、`docs/VF2_CHECKPOINT.md`（当前验收与限制）、`docs/VISUAL_FREEZE_1.md`、`docs/DECISIONS.md` D051、`harness/build-log.md`、`harness/vf2/`。本轮只收到裁决/交接原文，没有另一个完整报告，不补造其内容。

用户已批准VF1.1和三屏方向，本轮严格限定VF2：VF11-F-01/02、S2/S3组件抽取、VF-07单主反馈、状态/字级/焦点统一和字体形状规范确认。不要重做美术方向，也不要把VF3定位/离屏、VF4量产或O4新玩法当成本轮承诺。

必须保留：S1场景/推进及手机经营摘要；S2桌面三栏/手机分步、挂载保留跨步草稿、关闭丢弃告知、固定底栏；S3单角色名、方框、四项现状与主动作；暖木/不透明暖白或深褐纸面/深胡桃轻HUD/黄铜细饰；现代系统无衬线+tabular-nums；原12Q角色、槽位/完整工位、1920×1080世界坐标、遮挡层。保护路径 `packages/`、`pnpm-lock.yaml`、`apps/web/public/art/ai-village` 必须零改动，engine0.16.0/content office-2保持。

## 实现审查范围

先查看 `git diff fed8c40 61b9c7594dcf288e7cb0f136aec11911cdc7cbb6 -- apps docs`，重点：

- `partner-state.ts`、`partner-profile.tsx`：状态派生、角色操作和普通召回。
- `commission-workbench.tsx`、`dialog.tsx`、`ui-labels.ts`、`alpha-app.tsx`：组件边界、草稿生命周期、导航/关闭/命令接线。
- `use-game.ts`、`presentation-events.ts`、`feedback-notice.tsx`：反馈归属、唯一显示、寿命/错误、保存失败与gate行为。
- `tokens.css`、`vf1.css`：字体、字级、焦点、禁用/选中、横屏和错误sticky。
- `apps/sim-cli/vf2.test.ts`：8项新增测试是否真正对照core及反馈隔离。

### A. VF11-F-01与规则一致性

1. standard推进两槽到晚上：Qwen仍在working委托、actor.busy=true，但去图书馆找他后，聊天/送礼/吃饭/学习/请回工作室应可用。lifeBusy必须只按busyUntil、本槽overtime、白天活跃队伍派生；不得误改S2派遣/澄清占用。
2. 聊天/礼物/吃饭/学习成功后，当槽日常互动与加班互斥；先加班则回工作室，日常与加班全部禁用。检查精力10、费用、地点、locked等条件。
3. 普通recall要求非远征、非工作室、当槽空闲、同场景或remote软件，准确命名“请回工作室”。特别注意真实core的recall提前返回，不写busyUntil，所以召回后继续加班是合法行为；不要机械要求改领域规则去实现附件概括的互斥。
4. 版本切换/训练锁定继续按actor.busy；研发动作不应被错误地按在岗锁死。远征仍等待返程，不得伪装为远征取消。

### B. VF-07与VF11-F-02

1. 推进后打开任何档案，头像与四项现状间不能有“时段已推进”。与当前job/actor无关的错误码也不能仅凭字符串白名单串入。
2. accept/assign/deliver/hardware不再同时出现presentation-receipt与status-toast；一般日常/推进/存读档也应有唯一主回执。用DOM计数和实际可见性验证，不只看截图。
3. 当前实现为单UiFeedback：最新操作替代，成功6秒，聚焦反馈控件时延后（每秒检查离焦），错误不自动过期但下一操作可替代。按origin和对象ID路由：当前S2固定栏、S3操作区、存档面板或无弹窗S1。评价这套协议是否一致、是否有旧回执在重开时不合理重复、异步/计时器竞态或读屏问题。
4. 角色错误滚动到成长区仍应可见。initial→Qwen→能力成长→研发，研发点不足应只有一条alert，吸附在标题下，不得变成不可见的屏外反馈，也不应遮住关键主操作。
5. **重点审查已披露边界**：全局存储错误在非所属弹窗中暂不显示，关窗/存档面板再承接；错误可以被下一操作替代。判断这是否会隐藏重要失败，需要本轮修还是可后续细化；不要只因文档声明就判合理。自动保存失败仍保持既有send/gate语义；没有完整实机Host/跨窗口故障矩阵。
6. 即时assignment-error、现金流/更新chip、待选事件、编辑器局部校验、可选FlavorPanel氛围文本分别是不同职责，不应把不同内容机械数为“同事件重复”；但若实际重复播报同一操作必须指出。

### C. 组件重构与回归

1. S2按job.id挂载，初始队伍从已提交team读取；跨brief/team/result保留，accepted状态变化不重置试选；关闭重开应丢弃未提交修改。确保previewAssignment调用仍纯、无隐藏命令、无额外RNG消费。
2. posted/accepted/working三栏和review/waiting/delivered/breached单栏分支仍完整；accept留窗切team、assign/deliver成功关窗，失败不误关。返工与历史结算仍用正确路径；历史金额不按当前slot重算。
3. 伙伴查看工作、找人后关闭、焦点恢复、ESC/原生dialog行为、字体/头像尺寸没有组件抽取回归。所有领域和原资产保护路径确实无改动。

### D. VF-04/05规范

1. 当前规范正式确认系统无衬线栈/同栈display、tabular-nums、12–14px说明、>=16px核心数字、20px档案现状；横屏主数字仍16，仅副文案可11。请检查实际computed style及重要抽屉，不能只看tokens。
2. 10/12/16px小控件/主按钮/面板与头像圆角，HUD胶囊；三屏材质沿用。不得擅自新增字体文件或换角色母版。
3. 蓝色3px双环与黄铜装饰分离；实际Tab检查HUD/Dock、步骤/select/底栏、档案按钮/summary；浅深色、手机与横屏不能裁掉焦点。检查禁用状态仍可读、选中不只靠hover、错误提示不会抢焦点或到期移除当前焦点。
4. `solid-contrast.json`只覆盖不透明纸面上的明示前景，不是透明HUD/渐变/所有禁用背景的完整像素审计。以证据充分性评价，不把有限检查夸成全部无障碍认证。

## 复现和已有证据

运行 `pnpm check`、`git diff --check`、`git diff 2bd6d40733d6ffcd575a3bbcef59d89f5887cf9f <目标SHA> -- packages pnpm-lock.yaml apps/web/public/art/ai-village`。Codex最终37文件259测试通过，日志 `harness/vf2/check-final-v3.log`；请区分自己运行与引用日志。

开发：`pnpm --filter oot-web dev --port 5181`，`http://127.0.0.1:5181/?office-lab=standard&animation-time=1`。夹具initial/standard/review/waiting/delivery/twelve均可用；twelve英文深色加 `&locale=en&theme=dark`。都是内存存档，不操作真实玩家存档。

必须实机抽检1280×720、1920×1080、390×844、560×800英文深色、844×390。证据索引在VF2_CHECKPOINT：重点 `s3-elsewhere-1280.png`、`s3-evening-working-library-1280.png`与txt、`s3-error-visible-1280.png`、`s2-focus-844-final.png`、`layout-844-final.json`（224.13px/16px）、五视口focus截图、单条反馈JSON、`draft-discard.json`、`focused-feedback-retained.json`。

S3某些截图因Tab/展开而滚到操作区，顶部身份不在图内，这不等于头像丢失；请查看现场和配套txt。旧`s2-focus-844.png`/`layout-844.json`是14px主数字中间版本，已保留但不作为最终验收。原VF1.1证据仍在harness/vf1，本轮未冒充全部状态复验。

诊断preview：`pnpm --filter oot-web exec vite build --mode visual-review`、`pnpm --filter oot-web preview --port 5183`，相同URL参数。它显式保留夹具和指标、跳过SW，使用生产优化，但不是默认生产冷启动。测试结束必须 `pnpm --filter oot-web build` 恢复默认产物，关闭你开的端口、恢复视口。

## 性能审查要求

读取全部 `startup-balanced.json`（72条）、`startup-dev-confirmation.json`（36条）、`startup-warmup-excluded.json`（12条不计）、`startup-summary.json`。可运行 `node harness/vf2/summarize-startup.mjs` 重算；首次脚本SyntaxError日志保留，final日志是修复后。固定1280×720、DPR精确1.0000000447034836、6轮正反顺序、Chrome156/16线程、本机热缓存，无清缓存/节流；首次HUD+canvas的rAF观察，不是纹理加载完、TTI、输入延迟或显存。

首批VF2对VF1.1：dev标准-19.22%、十二人**+15.66%**；preview标准+3.57%、十二人-5.07%。对040031e分别-7.37%、**+12.08%**、-0.74%、-0.84%。dev越线触发不改实现的36条复核，对VF1.1标准+8.89%、十二人+5.41%。请保留并评价所有不利结果，不只挑复核，也不要把单批相对改善宣传为确定性优化。

组件拆分的dev模块请求与基线噪声是可能原因，未隔离证明因果；原VF1.1 +9.47%风险仍作为持续监控背景。**采样发生在最后三项收尾之前**：错误回执sticky、聚焦回执延长寿命、横屏主数字16px；采样路径无操作回执且1280宽，不触发这些行为。判断这个覆盖是否足够，若需最终固定SHA补测给出具体条件，不虚构已有测量。

基线审计worktree：`../vf11-perf-baseline`（040031e+原诊断插桩）、`../vf2-vf11-baseline`（2bd6d40无源码改动）；依赖为junction、包产物同源，禁止递归删链接目标。不要拿默认生产冷启动与diagnostic热缓存横比。完整冷缓存/低端GPU/帧时间/输入延迟预算仍未通过。

## 输出与交接回Codex Prompt（必需）

先明确阶段裁决：**VF2通过可进入约定VF3 / 有条件通过（列先决项）/ 不通过**。分开说明设计规范、交互/重构正确性、反馈协议、证据和性能风险；不能直接宣布Visual Freeze 1整体完成。

报告至少包括：

1. 稳定ID的P0/P1/P2/P3发现表：文件/行号、复现、实际/预期、影响、最小修复、验收、证据/信心。可复现缺陷与审美偏好分开，不为凑数编问题。
2. F-01/F-02/VF-07/组件抽取/VF-04/05逐项通过、部分、失败或未验证；确认哪些既有VF1.1行为无回归。
3. 亲自执行的命令/测试/浏览器状态/视口，与仅引用Codex证据分开。未覆盖和环境限制必须写明。
4. 性能首批越线与复核的判断，允许延期的具体项，以及任何必须先修的放行条件。
5. **末尾提供完整可复制给Codex的中文执行Prompt，必须自包含，不能仅写“按上述建议修改”**：
   - 固定实现SHA `61b9c7594dcf288e7cb0f136aec11911cdc7cbb6`、分支、明确裁决、开始前查干净状态且不覆盖用户改动。
   - 依赖顺序的任务ID/优先级、文件范围、最小修复与可核验验收；本轮先决返修与可后续项分开。
   - 若放行，限定下一VF3检查点具体范围/交付/停止点；若未放行，只安排VF2返修，不自动越阶段。
   - 保留已批准的三屏、美术、字体/形状规范；packages/规则/价格/奖励/RNG/Command/存档/锁文件/原版资产红线不变。
   - 精确测试/浏览器状态和尺寸/截图/性能协议，保留不利批次、说明未完成项，不混用基线。
   - 更新STATUS/ROADMAP/对应CHECKPOINT/VISUAL_FREEZE_1/DECISIONS/build-log；先实现本地提交，再独立固定SHA与Prompt记录提交。
   - 两提交后暂停、关闭服务、恢复默认生产产物与视口，提供下一轮Gemini审查Prompt，并要求其再次交接回Codex；禁止自动push/部署/付费模型、VF4量产与O4-B/O4-C新玩法。

若无阻断问题，请明确说明放行证据和适用范围；不要把未做的检查写成通过。
