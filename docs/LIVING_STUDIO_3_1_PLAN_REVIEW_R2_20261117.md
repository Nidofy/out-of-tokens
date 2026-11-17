# Living Studio 3.1 方案第二轮审核（R2）

- 日期：2026-11-17（Asia/Shanghai）
- 审核对象：`53f0991` 中修订后的 [主方案](LIVING_STUDIO_3_1_PARALLEL_PLAN_20261116.md) 与 [执行补充](LIVING_STUDIO_3_1_PARALLEL_PLAN_REVIEW_20261117.md)
- 核对代码：同一提交的 `packages/oot-platform`、`oot-core`、`oot-persistence`、`apps/web/src`
- 性质：只做审核，不修改两份方案原文。
- **处置状态（2026-11-17 10:37 更新）**：用户已批准 N1、N2 两项建议（主方案裁决 6、7）。N1–N7 及第 3 节小问题已全部并入主方案与执行补充，见第 5 节对照表。本报告保留审核原文作为依据。

---

## 0. 结论

第一轮提出的 R1–R12 已全部落实或按用户裁决关闭，落实质量较高。其中三处写得比第一轮建议更严格：
- 保存性能：分段测量，并预先冻结预算；
- lineage：写明失败或取消时不得更换周目 ID；
- 推进预览对照：区分 certain / conditional 字段，并分别统计样本。

本轮仍发现 **2 个会阻断执行的问题**、**4 个契约缺口**和若干小问题。主方案 §4 原写“不再存在待用户拍板事项”，但 N1、N2 涉及玩家可见行为，已提交用户裁决并获批准（见第 4 节）。

| 编号 | 严重度 | 一句话 |
|---|---|---|
| N1 | **阻断** | 每个命令都写自动档，会让 5 个备份在 5 次操作内被全部轮换掉，备份失去恢复价值 |
| N2 | **阻断** | 新的“切换前必须 drain 成功”屏障，会把“暂停状态下读档恢复”这条现有出路堵死 |
| N3 | 高 | A 拿不到 `State`，`explain*` 系列和 Worker 方案按现在的写法无法调用 |
| N4 | 高 | “把保存的 CPU 工作移进 Worker”时，Worker 宿主归 A、协调器归 B，接口没有定义 |
| N5 | 中 | EXP-02 漏掉了占槽代价最大的三类动作：训练、对齐、加班 |
| N6 | 中 | §6 的接口表与 §6.4 / 执行补充 §3.2 的接口名、挂载位置不一致 |
| N7 | 低 | Codex 在 W1 的负载明显重于 Gemini，Gemini 不依赖 Codex 的任务没有排在前面 |

---

## 1. 第一轮问题的落实核对

| 第一轮 | 落实位置 | 评价 |
|---|---|---|
| R1 规则副本 → EXP-14 | 主方案 §5、§6.4 | ✅ 写明“五类规则而不只是五个函数”，并以核心结算为准、不迁就旧 bug |
| R2 推进预览不得偷看 RNG | §6.4 | ✅ 比原建议更严格：明确禁止“抽样后再过滤”，条件字段要写明前提，并用受控 fixture 严格核对 |
| R3 保存时序 | §6.2 | ✅ 写明 `async` 函数在第一个 await 前仍会阻塞、要分四段测量，并且 `cancelPending` 不能代替 drain。**但引出了 N1 和 N2** |
| R4 lineage | §6.3 | ✅ UUID 由宿主生成、不消费 RNG；不能用 `hosted:<slot>` 识别周目 |
| R5 共享文件 | §3 | ✅ |
| R6 文案归属 | §3 | ✅ |
| R7 单向同步 | §12 第 7 条 | ✅ |
| R8 搜索预算 | §6.1 第 8 条 | ✅ Worker 的复制与传输成本也计入。**但调用路径不通，见 N3** |
| R9 真人试玩 | 用户裁决取消 | ✅ EXP-13 只保留编号，没有被换个名字重新带回 |
| R10 文档提交 | D0 = `53f0991` | ✅ |
| R11 插槽规格 | §9 | ✅ |
| R12 持久化例外 | 裁决 2 + §6.2 | ✅ 要求导出文本逐字节相同，并写明不能拿这个优化掩盖同步 replay 的阻塞 |

---

## 2. 新问题

### N1【阻断】按命令保存会冲掉全部备份

- 代码：`packages/oot-platform/src/storage.ts` 第 66–75 行。**每次写 `auto` 都会在同一事务里把 `auto → backup-1 → … → backup-5` 整体后移一格。**
- 现在普通 Web 只在 `DayEnd/Restarted` 写自动档，所以 5 个备份 ≈ 最近 5 天，是有意义的恢复点。
- 改成每个成功命令都保存后，5 个备份只等于**最近 5 次点击**。玩家误选事件、误买资源，或者存档链出现异常时，几乎没有回退空间。
- 附带的写放大：每次保存要写 6 条完整存档文本（auto + 5 个备份），长日志下 IndexedDB 的写入量会成倍增长。§6.2 只说要“记录备份轮转耗时”，没有处理语义问题。

**建议（由 B 在 `oot-platform` 内实现，不涉及持久化保护区）**：
- `write()` 增加轮转策略参数：命令检查点只覆盖 `auto`，**只有 DayEnd、Restarted、导入、手动读档这些边界才轮转备份**，并保留“最近一次跨日”的恢复点。
- 新增测试：连续 50 个命令之后，`backup-1` 仍然是上一个跨日边界的存档。
- 存档界面中“5 份备份”的说明文字要与新策略一致。这一项属于 A 的界面文案。

> 需要用户确认：备份语义从“最近 5 次自动写入”明确改为“最近 5 个跨日/边界节点”。

### N2【阻断】drain 屏障堵死了现有的恢复路径

- 现状：另一个标签页写入存档后，本页进入 `EXTERNAL_CHANGE / AUTO_PAUSED`。现有提示文案就是“自动存档暂停，**请先载入最新档**”，也就是说，**读档本身就是从暂停状态恢复的唯一出路**。存储完全不可用时，“导入文件”是继续游玩的出路（`IMPORTED_NO_STORAGE`）。
- 修订后的 §6.2 和执行补充 §3.4 规定：导入、读档、重开前必须 `drain()` 成功，`error/paused` 时中止切换。**这正好把上面两条出路都堵死**：暂停态下 drain 永远不会成功，玩家只能刷新页面，并丢失内存中的进度。

**建议**：屏障分成两种情况：
- **正常态**：锁住新命令 → drain → 切换（维持现行条款）。
- **暂停 / 错误 / 存储不可用态**：先弹出明确的二次确认，说明“当前内存进度尚未保存，将被所选存档替换”，并提供**导出当前进度**按钮。用户确认后，执行 `abandonPending()`：丢弃尚未开始的待写；正在进行的写入等它结束，或者按 CAS 失败处理。然后再切换。
- 新增测试：外部更改暂停 → 读档成功并恢复自动保存；存储不可用 → 导入成功 → 显示“已载入但尚未保存”。

### N3【高】A 没有 `State`，`explain*` 与 Worker 方案调用不到

- `GameSession.state` 是私有字段，A 只能拿到 `GameView`。执行补充 §3.2 写的是 `explainTeamDuos(state, content, …)`、`explainActorCapacity(state, …)` 这种接收 `State` 的签名。主方案 §6.1 第 8 条又让 A 负责 Worker 宿主，在 Worker 里跑候选搜索，可是 **A 拿不到可以传进 Worker 的状态快照**。
- 如果 A 为了能调用，自己从 `GameView` 拼一个近似 `State`，就会重新造出规则副本，与 EXP-14 的目标相反。

**建议在 C0 契约中写明**：
1. A 只调用 `GameSession` 上的方法：`explainTeamDuos(jobId, draft)`、`explainActorCapacity(actorId)`、`explainFinance()`。接收 `State` 的纯函数只供 B 内部和 Worker 使用。
2. B 提供 `session.workerSnapshot(): { contract, revision, lineageId, state, seed }`（结构化克隆的成本由 A 测量），以及一个 Worker 可以导入的纯入口 `oot-platform/worker`（例如 `suggestAssignmentsFromSnapshot(content, snapshot, jobId, draft)`）。
3. Worker 里的 Content 由 A 的 Worker 宿主导入 `content.ts` 获得（该文件只读、受保护）；按 contentVersion 与主线程校验一致后才接受结果。

### N4【高】保存移进 Worker 时没有接口

- §6.2 允许“超预算的 CPU 工作移至 Worker”。但协调器在 `oot-platform`（B），Worker 宿主在 `apps/web`（A），而 `saveBrowser` 在受保护的 `oot-persistence`。平台包无法以与打包器无关的方式自己创建 Vite Worker。

**建议**：C0 定义一个可注入接口 `SaveEncoder { encode(content, seed, commands, state): Promise<string> }`。
- 默认实现在主线程调用 `saveBrowser`；
- A 可以提供 Worker 实现，由 B 的协调器负责调用；
- 门禁要求两种实现对同一输入输出逐字节相同。

这样“谁写 Worker、谁对正确性负责”的边界就清楚了。

### N5【中】EXP-02 漏掉占槽代价最大的动作

核心中会占用个人时段的动作，不止原列表中的 chat/gift/meal/study/story：

| 动作 | 占用 | 来源 |
|---|---|---|
| `train` | **8 个时段（2 天）**，并移动到图书馆 | `campaign.ts` 第 148 行 |
| `align` | **4 个时段** | 同上 |
| `overtime` | 夜间工作，**跳过当晚恢复** | `simulation.ts` 第 81/107/170 行 |
| `tea` / `duo` | 需要双方空闲，具体是否占槽以核心为准 | `campaign.ts` 第 58/69 行 |

**建议**：
- EXP-02 和 `previewActivity` 的覆盖范围改为“所有会改变 `busyUntil`、加班名单或 location 的命令”，而不是按动作名逐个枚举。
- `overtime` 是独立命令类型，不属于 campaign action，签名要能表达它，例如改成 `previewActivity(command: Command)`。
- 契约测试要逐个遍历动作，证明预览给出的 `occupiesSlot` 和时长与真实执行后的 `busyUntil` 一致。

### N6【中】接口命名与挂载位置不一致

- 主方案 §6 的表格只有 `previewNextPeriod / previewActivity / suggestAssignments / getExperienceView / CheckpointCoordinator`，并且把“有效容量 / 协同解释”放进了 `getExperienceView()`。
- §6.4 和执行补充 §3.2 又单独列出 `explainTeamDuos / explainActorCapacity / explainFinance`。
- 两处同时存在，C0 冻结时会出现“到底调用哪个”的分歧。

**建议**：C0 只保留一张接口总表，标明每个接口挂在哪里（`GameSession` 方法 / `oot-platform/worker` 纯入口 / 仅 B 内部使用）、输入是 `GameView` 键还是 id，以及对应 revision。`getExperienceView()` 只放学习事实、建议目标和事实回执，不再包含规则解释。

### N7【低】W1 负载不均衡

- B 在 W1 要做：协调器 + lineage + 两类预览 + 等价性门禁 + 学习事实 + EXP-14 第一批接口 + 两张样张，同时还兼任合流负责人。B 是关键路径。
- A 在 H2 之前主要依赖 fixture。

**建议**：在 A 的 W1 任务卡中，把不依赖 B 的任务排在前面：
- EXP-05 的阅读状态 UI（lineage 先用 fixture 值）；
- 首单说明（只用已有的 `previewAssignment` / forecast）；
- 保存状态的视觉与横幅（fixture）。

B 的顺序固定为：保存协调器 → 推进 / 活动预览 → 学习事实 → 样张。如果 W1 超期，学习事实可以挪到 W2 开头，W1 的最小交付仍然包含保存与预览。

---

## 3. 小问题

1. **关页兜底**：§6.2 要求不能依赖 unload，这是对的。可以再加一条 `visibilitychange → hidden` 时尽力执行一次 `drain()`，但不作为正确性的依据，也不显示成“已保存”。
2. **多标签频率**：按命令保存后，`BroadcastChannel` 广播频率会大幅上升，其他标签页会几乎立刻进入暂停。这是正确行为，但应补一条浏览器验收：两个标签页交替操作时，暂停提示和恢复路径都清楚（与 N2 联动）。
3. **lineage 字段写入位置**：`meta` 必须在 `storage.ts` 第 76 行写记录时一并带上，备份轮转时 `...backup.result` 会自然保留它。读取旧备份时恢复对应时期的 lineage，这一点要在 §6.3 写明是预期行为。
4. **fixture 出口**：建议用 `oot-platform/fixtures` 子路径导出，而不是从 `index.ts` 导出。这样“发布包不可达”可以通过检查依赖图来证明，而不只靠 tree-shaking。

---

## 4. 用户裁决（已确认）

1. **N1 备份语义**：✅ 已批准。5 个备份改为“最近 5 个跨日 / 边界节点”，命令检查点只覆盖 `auto`。→ 主方案裁决 6。
2. **N2 暂停态切换**：✅ 已批准。在暂停、错误或存储不可用时，经二次确认（并提供导出）后，允许放弃未保存的内存进度去读档、导入或重开。→ 主方案裁决 7。

N3–N7 及小问题不需要额外裁决，已直接并入方案。

---

## 5. 并入对照

| 问题 | 主方案位置 | 执行补充位置 | 并入要点 |
|---|---|---|---|
| N1 边界备份 | §1 裁决 6；§5 EXP-01；§6.2“备份轮转策略”；§11“备份策略”；§12 H2 | §3.3 `WritePolicy`；§3.4“备份轮转策略”；§3.8 B-W1-1、A-W1-1；§3.10 | `write(policy)`：`checkpoint` 只写 auto，`boundary` 同事务轮转；50 命令测试；存档界面说明由 A 更新 |
| N2 暂停态切换 | §1 裁决 7；§5 EXP-01；§6.2 两态屏障；§11“暂停态切换”；§12 H2 | §3.3 `abandonPending`、`canSwitchWithoutConfirm`；§3.4 两态屏障与时序图；§3.8；§3.10 | 正常态 drain；异常态二次确认 + 导出 → `abandonPending` → 切换；取消则不变；四种异常情形都要测 |
| N3 State 不可达 | §6 唯一接口总表；§6.1 第 9 条；§6.4 表 | §3.1；§3.2 接口改为 session 方法；§3.3 `WorkerSnapshot` | A 只调用 `GameSession` 方法；Worker 经 `workerSnapshot()` + `oot-platform/worker`；禁止从 `GameView` 拼装 `State` |
| N4 SaveEncoder | §6 接口总表；§6.2 | §3.3 `SaveEncoder`；§3.4；§3.10 | 接口与默认实现归 B，Worker 实现归 A；逐字节等价门禁 |
| N5 占用覆盖 | §5 EXP-02；§6 `previewActivity(command)`；§11“占用预览覆盖” | §3.3 `ActivityPreview` 增补字段；§3.8 A-W1-3、B-W1-2；§3.10 | 覆盖所有改变 `busyUntil`/加班名单/location 的命令（含 train/align/overtime/tea/duo）；逐动作对照真实执行 |
| N6 接口不一致 | §6 唯一接口总表替换原表；`getExperienceView` 只保留学习/目标/回执 | §3.2、§3.3 | 一张总表标明挂载位置、调用方、输入与约束 |
| N7 W1 负载 | §4 “W1 内部顺序”；§13 两张执行单 | §3.7 防空等规则与时序图节点；§5 第 2 步 | A 先做不依赖 B 的卡片；B 固定顺序，学习事实可顺延到 W2 开头 |
| 小问题 1 关页兜底 | §6.2 | §3.4 | `visibilitychange` 时尽力 drain，不显示“已保存” |
| 小问题 2 多标签 | §6.2 CAS 条目 | §3.4 | 双标签交替操作的浏览器验收 |
| 小问题 3 meta 写入位置 | §6.3 | §3.5 | meta 与记录同写；读旧备份时恢复当时的 lineage |
| 小问题 4 fixture 出口 | §3 Track B | §3.1 | 子路径 `oot-platform/fixtures`，不从 `index.ts` 导出 |

修订仍属规划，未改产品代码；三份文档的修订尚未提交。
