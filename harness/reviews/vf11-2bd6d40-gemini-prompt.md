# Gemini 独立复审 Prompt：VF1.1 返修检查点

请对下面的固定实现进行独立、只读审查，并实际运行可用的测试/浏览器复现。你是审查者，不直接替 Codex 修代码，不提交、不推送、不部署、不调用外部付费模型。报告使用中文。不能把 Codex 的自验结论当成已证实事实，也不能因为本轮只到检查点就要求推翻已批准的美术方向。

## 目标与固定版本

- 仓库：`D:\Documents\FeiyangChen\devApps\ai-game\out-of-tokens`
- 分支：`codex/m1-foundation`
- **本次固定实现 SHA：`2bd6d40733d6ffcd575a3bbcef59d89f5887cf9f`**。
- 返修父提交：`46070d1`（VF1记录）；原 VF1 实现：`147ddac4d875d421fffefafdd577be091196f83f`。
- 性能/原设计实施前基线：`040031e`，不要与147ddac混为一谈。
- SHA 后面的提交只记录本 Prompt、交接及文档说明，不作为另一个实现版本。
- 版本必须保持 engine0.16.0 / content office-2；本轮 packages、正式内容、锁文件、原版角色资产应零改动。
- 代码仅在本地，未 push。若只能访问 GitHub 且没有目标 SHA，明确说明无法完成固定版本审查；不要审远端旧 HEAD 后宣称通过。

请先确认 `git status -sb` / `git log -5` / `git show --stat <目标SHA>`，阅读 `AGENTS.md`、`docs/STATUS.md` 的最新段。不要重置、清理或覆盖现有工作树；需要构建时允许正常生成 ignored 产物，必要时使用独立 worktree。仅运行工具实际支持的检查，不能声称未做的实机操作。

## 审查依据、范围与不动项

必读材料：

1. `harness/reviews/vf11-user-handoff.txt`：用户提供的VF1裁决及VF1.1返修指令。本轮仅收到此交接，没有另外一份完整报告；不要凭空引述其全文。
2. `docs/VF1_CHECKPOINT.md` 顶部VF1.1部分：逐项实施、证据索引、性能协议、失败与未验范围。下方VF1历史不能覆盖当前状态。
3. `docs/VISUAL_FREEZE_1.md`、`docs/DECISIONS.md` D050、`docs/ROADMAP.md`、`harness/build-log.md`。
4. `harness/vf1/` 新旧截图、JSON、日志，特别是 final-v4，而非只看成功摘要。

用户已批准：S1场景/推进与手机常显经营摘要；S2桌面三栏/手机三步骤、保持挂载保留跨步草稿、关闭丢弃未提交草稿并告知；S3大头像身份、四项现状、主操作；暖木+不透明暖白/深褐纸面+深胡桃轻HUD+黄铜细饰；现代系统无衬线+tabular-nums；原12名Q角色、固定槽位、完整工位、1920×1080逻辑坐标、前后遮挡层。请验证贯彻程度，不重新选风格。

本次重点是R-01/02/03/04四个P1、R-05命中、R-06/09/10一致性，以及性能证据充分性。不要把VF2的VF-07反馈系统、VF3的VF-03定位/离屏、VF4资产量产、O4新玩法当成这轮已承诺完成；如发现新阻断，给出明确理由和分级。

## 必查实现与验收

先看 `git diff 46070d1 2bd6d40733d6ffcd575a3bbcef59d89f5887cf9f -- apps docs`，重点文件：

- `apps/web/src/alpha-app.tsx`、`vf1.css`、`decision-panels.tsx`、`flavor-panel.tsx`。
- `office-hit-area.ts`、`office-scene.ts`、`office-lab.ts`。
- `main.tsx`、`visual-review.ts`、`vf-metrics.ts`、`use-game.ts`。
- `apps/sim-cli/office-hit-area.test.ts`、`office.test.ts`。

逐项结论必须附源码位置或可复现证据：

1. **R-01**：忙碌/同场景空闲/异地空闲/可加班四状态；首屏聊天与找人/查看工作可用性；折叠区无重复按钮；礼物/吃饭/学习前置条件；找人成功关闭档案后操作仍通。核对加班真实core要求与重复禁用。
2. **R-02**：posted/accepted/working/waiting/review/delivered六种状态在1280×720、390×844有正确布局和固定底栏；posted首次无红色空队错误，任一步可接单且接单后进入队伍、不暗开背景抽屉；review返工/验收可达且有间距；waiting有解释；全局消息不污染需求首段；跨步保留草稿，关闭明确丢弃。检查breached分支，不把未测当通过。
3. **历史结算附加修复**：结束态读取实际ledger而非按当前slot重算的settlement；多期仅展示最后一次实际结算是否明确，近期10条以外无记录时文案是否诚实。尝试交付后推进过截止时间，金额不能变成当前日期估算。不可为了详细收据修改领域契约。
4. **R-03**：`.candidate small small`为0；none岗位描述固有设施规则；已选岗位展示真实电脑/会议席，覆盖需电脑支持岗特例；本单在岗与其他占用区分；4人/12人列表密度和滚动。
5. **R-04**：844×390中间内容>=190px，关闭/底栏完整，无水平溢出。Codex实测225.53px，请独立判断，不能只抄JSON。
6. **R-05**：坐姿头顶点击正常进档案，桌面仍进委托；meeting双会议席中央可点白板，角色自身可点；新增几何测试是否证明真实坐标和前后层关系。不要只数测试数量。
7. **R-06/09/10**：四人方框、唯一角色名大标题、Flavor最后、折叠样式、金额/质量无Georgia覆盖残留；英文深色/手机检查。保留原资产比例与身份。
8. **加载与诊断隔离**：提前下载scene的错误处理/生命周期/故障降级；诊断构建只显式启用，默认发布包不因URL开启fixture/metrics、也不新增无用指标离线缓存项；夹具内存存档不污染真实玩家存档；正常SW注册路径不受损。

特别核对两项有意偏离附件的地方：

- `campaign.ts` 的 recall 是普通日程场景召回，不是远征取消。Codex没有按附件建议启用远征召回，改为等待返程说明；原普通日程召回入口也暂不在该档案提供。判断这是否合理，是否需要在VF1.1恢复准确命名的既有动作，或允许VF3处理；不得要求通过修改core支持远征取消。
- 仅“夜间、非远征、未重复”不足以保证加班成功，core还要求working委托、精力>=10、busyUntil<=slot。Codex补齐这些条件，学习也补精力>=10。请核对UI和core是否一致，不机械按原建议删掉必要条件。

## 验证方法与已有证据

自动化：在仓库根执行 `pnpm check`、`git diff --check`、`git diff 46070d1 <目标SHA> -- packages pnpm-lock.yaml`。Codex记录最终36文件251测试通过；你需区分自己运行与引用日志。

开发浏览器：`pnpm --filter oot-web dev --port 5181`，访问：

`http://127.0.0.1:5181/?office-lab=standard&animation-time=1&vf-metrics=1`

替换夹具：initial（posted/手动accept）、standard（working/忙碌）、review、waiting、delivery、meeting、twelve。初始档案异地：initial推进两槽；实际夜间加班用standard推进两槽，不能用无委托initial断言加班应成功。英文深色加 `&locale=en&theme=dark`。新夹具是克隆测试内容快速到状态，不能用其经济数字评价正式平衡。

覆盖视口1280×720、1920×1080、390×844、560×800英文深色、844×390。required截图对照 `s2-posted-{1280,390}.png`、`s2-review-{1280,390}.png`、`s2-844.png`、`s3-elsewhere-1280.png`；其余六状态/四人头像/12人/双会议席索引在检查点文档。截图或DOM实际不一致时报告不一致，不把CSS源码当视觉证据。

优化诊断preview：`pnpm --filter oot-web exec vite build --mode visual-review` 后 `pnpm --filter oot-web preview --port 5183`，相同URL参数。这是生产优化流程+显式诊断开关，禁SW，不是默认发布包冷启动测试。普通build仍为默认生产；不要将diagnostic产物交付部署。最后关闭自己开的端口并恢复视口。

## 性能复核必须保持审慎

原+19.1%是单次dev183→218ms。最终受控JSON `vf11-preload-balanced-startup.json` 有48条：040031e/本轮、dev/preview、standard/twelve，每组6条，1280×720和精确相同DPR `1.0000000447034836`；热缓存、预热排除、交替正反顺序。`node harness/vf1/summarize-startup.mjs` 可重算中位数。

最终dev standard -10.56%、twelve -2.80%；优化诊断preview standard **+9.47%**、twelve -2.50%。前期controlled、interleaved、reverse、final-balanced批次包含+31.5%/+11.34%/+11.76%等不利结果，全部保留。请审查采样定义、顺序、缓存、基线诊断插桩的可比性和环境噪声，不能只挑最后一组，也不要把“不到10%”当统计学安全线。

指标是rAF首次观察到HUD+canvas；`#vf-startup`在同一ready时刻导出JSON，`#vf-metrics`仍保留180帧统计。不是素材加载完毕、输入延迟或GPU显存。单条final-runtime观察不能证明持续帧预算。早期带baseline字样的warm文件实际为147ddac且跨夹具DPR不同，不能混入040031e对照。基线审计worktree `../vf11-perf-baseline` 保留，只加诊断开关/指标，依赖含junction；不可递归删链接目标。

请明确裁决：这是否足够关闭“单次+19.1%未调查”，是否足够作为VF2/VF3前置证据；即使调查闭环，完整冷缓存/低端GPU/纹理解码/输入延迟预算仍不应标通过。Codex已披露标准preview接近线及未测范围。

## 报告格式与必需的回交 Prompt

先给一个明确阶段裁决：**VF1.1通过，可按约定进入VF2/VF3 / 有条件通过（列先决项）/ 不通过**。分开判断设计方向、交互正确性、证据充分性和性能风险，不直接宣布Visual Freeze 1完成。

随后提供：

1. P0/P1/P2/P3发现表：稳定ID、文件和行号、复现步骤、实际/预期、影响、最小修复建议、验收标准、证据来源与信心。不要用宽泛审美偏好充当P1；无法复现者注明推断。
2. 原R-01–06/09/10逐项“通过/部分/未通过/未验证”，含两项规则偏离的判断。
3. 自己执行的命令、测试和浏览器覆盖；仅引用Codex证据与亲自验证分列。未测试项和环境限制写明。
4. 性能结论与后续具体门禁；允许延期的VF2/VF3事项及任何必须先返修的事项。
5. **报告最后必须提供一段完整、可直接复制给Codex执行的中文 Prompt**，不得只有“请按上述修改”。这段Prompt必须自包含：
   - 固定目标SHA `2bd6d40733d6ffcd575a3bbcef59d89f5887cf9f`、分支和本次裁决；提醒不覆盖用户未提交改动。
   - 依赖顺序排列的任务ID、文件范围、最小修改目标及逐项可检查的验收条件；把本轮必须修与下轮任务分开。
   - 如果放行，说明下一检查点只推进哪些VF2/VF3内容、具体交付物和停止点；如果不放行，限定返修，不越阶段。
   - 必须保留的美术/布局决策及packages/规则/价格/奖励/RNG/Command/存档版本零改动边界。
   - 需要补的测试、实际浏览器状态/视口/截图、性能采样条件，要求保留不利结果；未完成项不伪称通过。
   - 更新STATUS/ROADMAP/VF1_CHECKPOINT/VISUAL_FREEZE_1/DECISIONS/build-log；实现提交后另作固定SHA和交接记录提交。
   - 明确“到下一检查点停止并关闭临时服务，提供下一轮Gemini审查Prompt，要求再次包含交接回Codex的Prompt”；不自动push/部署/付费调用，不扩展O4-B/O4-C，不启VF4量产。

如果没有阻断缺陷，不要为凑数量编造问题；给出可放行的证据和仍然适用的限制。
