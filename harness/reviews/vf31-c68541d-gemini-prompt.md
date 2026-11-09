# Gemini 独立复审 Prompt：VF3.1 收尾 + VF4 准备门禁

你是独立只读审查者。请审查固定实现，不修改源码、不替Codex实现、不push/部署/调用付费模型。区分“实际运行验证”“源码推断”“沿用历史证据”“未覆盖”，不要只复述检查点的自评。

## 1. 固定目标与依据

- 仓库：`D:\Documents\FeiyangChen\devApps\ai-game\out-of-tokens`
- 分支：`codex/m1-foundation`
- **本次固定实现：`c68541da920b346b02c11b8e27540024c8ea30a5`**
- 实现父提交：`38cce8d`（VF3记录）；上一固定VF3：`6f3a19122f4508004aeb1ae3bfe0c1387047e9dc`。
- 保护基线VF1.1：`2bd6d40733d6ffcd575a3bbcef59d89f5887cf9f`；长期性能基线040031e。
- 当前HEAD可能是后续独立SHA记录提交，仅文档/证据；实现必须以c68541d为准。
- 最新用户原文：`harness/reviews/vf31-user-handoff.txt`。先前裁决：VF2四项返修PASS，限定VF3 CONDITIONAL PASS，剩VF3-F-01 P2、F-02/F-03 P3。
- 当前入口：`docs/STATUS.md`、`docs/VF3_CHECKPOINT.md`开头的VF3.1节、`docs/VF4_PREPARATION.md`。不要把下方历史入口当新任务。

## 2. 审查范围A：三项收尾，逐项给裁决

### A1 VF3-F-01：镜头隔离

检查alpha-app.tsx与scene-navigation.ts：sceneFocus/editorFocus/cameraZone独立；Scene仅在arranging使用editorFocus与编辑器overview分区。取消和保存退出都清editorFocus，恢复进入前的S1 focus/zone；reset按钮不把编辑器预览当成S1定位。

实机至少：

1. 390×844，`?office-lab=initial&motion=still`，记录workshop backgroundSize/backgroundPosition，工作室→布置→取消，稳定帧精确恢复且无返回全景。补560×800、844×390。
2. 1280×720，先从伙伴位置定位Qwen，再进布置→取消，镜头不丢失；用镜像预设保存退出再验。
3. 会议区进入编辑器：覆盖层与场景同坐标；退出恢复会议区；编辑期间resize/选位不覆盖S1状态。
4. 普通S2/S3开关仍不动相机；不派发额外领域Command。

注意interaction-results.json早期844即时读数pass:false被保留；后续稳定帧往返相同并有截图。请判断是否只是观察时序，或仍存在可见闪动/持续相机错误，不机械把一条false或一条true当完整结论。

### A2 VF3-F-02：位置列表键盘、焦点、模态

Escape与X均关闭并将焦点还给scene-tools的位置触发按钮；无模态时才由列表处理Escape。mapOpen/saves/settings/jobId/actorId/arranging/pending打开均自动收起，不能在模态关闭后复活。自动收起不得抢走模态焦点。检查village-ui.css的dialog/layout规则包含scene-tools/scene-presence。

至少实测列表→Escape、列表→X、列表→地图，以及存档/设置或对象模态的一条路径；验证document.activeElement与computed visibility。检查OfficeEditor非原生dialog路径；只验证原生地图不能证明所有模态组合。

### A3 VF3-F-03：局部反馈退出寿命

检查presentation-events.ts、use-game.ts、alpha-app.tsx与PartnerProfile/CommissionWorkbench调用链。clearLocalFeedback必须按surface+id精确匹配；closeActor/closeJob覆盖X、Escape、底部关闭、visit、locate、查看工作及派遣/交付自动关闭。函数式setFeedback必须读取最新状态，不能用visit开始前的旧feedback闭包判断。

必须复现：

- initial Qwen→能力、版本与成长→研发¥600/10RP不足→关窗→立即重开，无旧错误；locate关闭也验证一次。
- standard推进两槽→Qwen在图书馆→去找伙伴→6秒内重开，无上次DONE。本轮已有901ms证据，独立确认异步路径。
- S2接单/普通局部反馈关闭重开无残留；assign/deliver自动回S1各只有一个回执。
- `?office-lab=initial&test-fault=storage-events&motion=still` Ctrl+Shift+F9产生EXTERNAL_CHANGE：S3→普通聊天成功→S1→S2→Saves仍保留一份全局告警。AUTO_PAUSED还需检查单测与归属；不要把EXTERNAL_CHANGE实测冒充两种注入均实测。
- 非当前对象反馈不能被误删；手动“收起反馈”和成功恢复仍可正常结束全局告警。

## 3. 审查范围B：约束与回归

运行/核对：

```powershell
git diff 38cce8d c68541da920b346b02c11b8e27540024c8ea30a5 -- apps/web/src apps/sim-cli
git diff 2bd6d40733d6ffcd575a3bbcef59d89f5887cf9f c68541da920b346b02c11b8e27540024c8ea30a5 -- packages pnpm-lock.yaml apps/web/public/art/ai-village
pnpm check
git diff --check
```

保护路径必须零diff；engine0.16.0/content office-2不变。三屏布局、暖木暖纸、字体字级、原12Q、1920×1080世界、前挡板名牌-32、低缩放双会议席+22、精确hitArea不得回退。自动化应为38文件299测试；新增8项测试覆盖相机往返、列表焦点策略、反馈对象/回执/异步最新值。请评估它们与真实接线的覆盖差距，不把纯函数断言当完整DOM测试。

实机使用隔离office-lab内存存档，不改玩家真实存档。可运行 `pnpm --filter oot-web dev --port 5181 --strictPort`；优化诊断需 `pnpm --filter oot-web exec vite build --mode visual-review` 后preview。不得在复用worktree执行pnpm install或递归删除junction目标。

## 4. 审查范围C：性能证据与未通过门禁

先读 `harness/vf31/performance-protocol.md`。source-freeze.json记录151文件（原始及LF哈希），源码冻结后才采样；source-freeze-verified.json证实采样后零变化。固定实现的Git blob可按lfSha256核对。

`startup-balanced.json`与`startup-confirmation.json`各72条；`startup-warmup-excluded.json`12条。三版本040031e/6f3a191/VF3.1，dev/优化preview，standard/twelve，各组6轮正反交替，1280×720、DPR1.0000000447034836。`node harness/vf31/summarize-startup.mjs`重算汇总。

关键不利事实：首批dev twelve对040031e+14.40%，触发预定唯一确认；确认对040031e+24.69%、对VF3+24.37%。优化preview相对VF3标准-13.84%/-5.02%，十二人-0.81%/+1.59%。两批全部保留，没有继续采样到通过；旧VF3 dev standard不利批次也未被关闭。

请明确裁决 **VF31-PERF-01是否阻断VF4试点/新增资产**，给出下一步可归因的最小调查，不凭“未新增纹理”认定无实现原因，也不凭一组热缓存启动值宣布全性能不合格或全部合格。观测是首个HUD+canvas rAF，不是全部素材就绪、冷缓存、GPU内存或输入延迟；完整预算留VF5。若要独立重测，预先固定协议、保存全部样本，并记录环境差异。

收尾核查：默认 `pnpm --filter oot-web build` 后assets JS无vf-metrics/vf-startup；关闭你启动的端口并恢复浏览器视口。当前实现证据中19个JS无指标、5181–5186全部关闭，工作树应干净；不要递归删除任何对照worktree。

## 5. 审查范围D：VF4准备计划

评审VF4_PREPARATION.md是否足以受控进入下个检查点：组件试点、八类双层家具、十二角色只复用保护原资产、食堂/图书馆及章节、逐屏状态/视口矩阵、性能定位、每批停止点。明确哪些已定规范可以推广，哪些接触/光影/姿态/性能/离线尚未验证必须先补。

本轮没有资产生产，也没有完整Visual Freeze 1冻结。不要把文档计划判成已经实现。若通过，给出**下一单一检查点**的具体允许文件/组件与验收条件；不要一次放行全量资产和新玩法。O4-B/O4-C继续门禁。

## 6. 报告格式与强制交接

1. 总裁决：PASS / CONDITIONAL PASS / FAIL；A1/A2/A3分别判定，性能与VF4准备另列，不能混成一句通过。
2. 问题按P0–P3排序：文件/行号、触发条件、期望/实际、影响、最小修复、回归验证；无发现则明确写无新增问题。
3. 已验证/源码推断/未复现/未覆盖清单，列命令结果与截图/测量位置；解释23条记录中的早期失败与复核。
4. 明确整体Visual Freeze 1仍未完成；给出允许下一步及阻断项，不要求重做已通过方向。
5. **报告最后必须输出完整、可直接复制给Codex执行的Prompt（不能仅写“按上文处理”）。** Prompt须自包含：仓库、分支、固定实现c68541d、裁决、逐项问题ID/等级、依赖顺序、具体允许修改范围、保护路径/版本/风格边界、必要单测与浏览器步骤、性能调查协议/停止条件、产物与清洁要求、两个本地提交与固定SHA记录、到检查点暂停并生成下一轮Gemini Prompt。若三项未通过，先VF3.2；若通过但性能阻断，先限定性能定位；只有明确满足门禁才进入一个VF4试点。禁止自动push/部署/付费模型/新玩法/整体冻结。

你的交接Prompt是供用户确认转交的下一步建议，不等于你获得写入实现或自动执行下一阶段的授权。
