# Out of Tokens — Gemini 4 Argon 独立技术与正确性审查报告

## 第一部分：结论

- **审查结论**：`PASS WITH CONDITIONS`
- **审查目标 Commit SHA**：`15e2775e8f9bc88ab26ecf421f7b9988c49c3104`（短 SHA：`15e2775`，基准 SHA：`c0a1e4b` / `a6e8d93b8fcbd33bddd47d29de97c99d9fb75e1b`）
- **审查对应 Packet**：`harness/reviews/m0.2-15e2775-packet.md`
- **审查方式**：在独立隔离目录解包固定快照 `15e2775e8f9bc88ab26ecf421f7b9988c49c3104` 执行只读审查与实机复现验证，不改动主开发工作树代码。

### 一、六项核心审查任务核验总览

| 审查维度 | 核验结论 | 关键证据与说明 |
|---|---|---|
| **1. 架构边界** | **通过（含 1 项 P3 建议）** | `oot-core` 零运行时外部依赖（`package.json` 无 `dependencies`，`tsconfig.base.json` 限定 `"lib": ["ES2022"], "types": []`），经 `eslint.config.js` 规则校验无 `window`/`document`/`fetch`/`Date`/`process`/`Math.random`/`node:*`；`getViewModel` 做了深层数组与对象浅拷贝隔离；`oot-content` 使用 Zod `.strict()` 校验范围、权重和为 1、ID 唯一性、免费退路及事件触发引用。建议将 `draw()` 改为内部函数并将 `no-restricted-imports` 扩展至全仓禁止 `../../` 跨包相对路径导入（`GEM-15e2775-07`）。 |
| **2. 确定性与状态一致性** | **通过（含 1 项 P2 边界）** | 相同种子、内容版本和命令序列在连续推进、存档恢复和机器人批处理下产出完全一致的状态与 SHA-256；`board`、`event`、`quality` 三路 xorshift32 + 雪崩混合（`mix`）互不干扰；`pendingChoice` 期间拦截一切非 `choose` 命令，且结算后清空 `pending`，防止重复扣费或重复结算；非法命令在 `JSON.parse(JSON.stringify(original))` 前或 `catch` 中原样返回 `original` 引用且不推进 RNG。发现 `oot-persistence` 的 `stable()` 未过滤值为 `undefined` 的对象属性（`GEM-15e2775-06`）。 |
| **3. 时钟与任务生命周期** | **有条件通过（含 1 项 P1、1 项 P2）** | `deadlineAfterWorkSlots` 对标准工作槽（`slot % 4 < 2`）的转换正确，日结（`% 4 === 0`）、周结（`% 28 === 0`）、第 14 天旧债（`slot >= 56`）均只结算一次。但 `clarify` 未限制时段且立即扣减 `hidden`，导致：(a) 可在同一工作槽内“0 时段延迟”先由闲人澄清再立即接单派主力当槽执行；(b) 在深夜（`slot % 4 === 3`）执行 `clarify` 会使角色丧失夜间 `+60` 精力恢复与 `load = 0` 清空，且刚澄清的委托在跨入次日晨间（`slot = 4`）时立即过期（`GEM-15e2775-01`）。此外 `j.duration = j.deadline - s.absoluteSlot` 包含非工作槽，导致相同 `workSlots` 在不同时段接单的 50% 违约宽限期不一致（`GEM-15e2775-04`）。 |
| **4. 角色与团队约束** | **有条件通过（含 1 项 P1）** | 同一角色不能兼岗或跨活跃委托（`accepted`/`working`/`review`）重复派遣；部署方式（`cloud`/`local`）在 `Version.modes` 上声明并校验；仅 `worker` 累加 `progress` 与 `weighted`。但 `resolve()` 中：(a) 当全队 `worker` 因精力 `<10`、云端繁忙等待或资源不足而产出为 `0 WP` 时，同队 `planner`/`reviewer` 仍被扣除 Token/算力、精力与上下文负载，且 `reviewer` 在 `0 WP` 槽位即可永久写入全额 `j.review` 质量加成；(b) 事件 `multiplier > 1`（如 `tip` 卡 `1.2×`）会放大 `planner`/`reviewer` 的 `units` 从而多收 20% Token，但二者并不产出 WP 且加速/审查收益不变（`GEM-15e2775-02`）。 |
| **5. 数值边界** | **有条件通过（含 1 项 P1、1 项 P2）** | 质量分数与精力均经 `clamp` 钳制在 `[0, 100]`，云配额优先于购买额度扣除且不会出现负 Token 或超额本地算力。但 `resolve()` 在第 84 行先执行 `a.load++`，随后在第 91 行计算当槽缺陷率时使用自增后的 `a.load > v.context`，导致角色以 `a.load === v.context` 进入时段时产出未腐烂（`1.0×`）但当槽缺陷率已提前触发上下文腐烂惩罚（`1.5×`）；同时 `j.review` 与 `match()` 未经 `round()` 舍入，在多权重组合下可写入 `7.000000000000001` 等 IEEE-754 尾数（`GEM-15e2775-03`）。 |
| **6. 工程质量与测试** | **通过（含 1 项 P3 建议）** | `tsconfig.base.json` 启用 `strict`、`noUncheckedIndexedAccess`、`exactOptionalPropertyTypes`、`verbatimModuleSyntax`；`.github/workflows/ci.yml` 真实执行 `pnpm install --frozen-lockfile` 与 `pnpm check`；引擎 `0.2.0` 与内容 `m0.2-2` 对不兼容存档明确 `fail-closed` 拒绝。 |

### 二、实机测试执行记录

在固定快照 `15e2775e8f9bc88ab26ecf421f7b9988c49c3104` 的独立检出目录中实际运行以下命令，全部通过：

```text
$ corepack pnpm install --frozen-lockfile --offline
Scope: all 5 workspace projects ... Done in 2s using pnpm v11.25.0

$ corepack pnpm typecheck
$ tsc -b --pretty false  (exit code 0)

$ corepack pnpm lint
$ eslint packages apps   (exit code 0)

$ corepack pnpm build
$ tsc -b                 (exit code 0)

$ corepack pnpm exec vitest run
 ✓ packages/oot-core/clock.test.ts (1 test) 2ms
 ✓ packages/oot-content/content.test.ts (1 test) 11ms
 ✓ apps/sim-cli/acceptance.test.ts (16 tests) 53ms
 ✓ apps/sim-cli/cli.test.ts (1 test) 327ms
 ✓ apps/sim-cli/core.test.ts (13 tests) 456ms
 Test Files  5 passed (5) | Tests 32 passed (32)

$ corepack pnpm exec tsx apps/sim-cli/src/replay.ts harness/results/value-replay.json
REPLAY_OK 6aded55719135ba185776e34357bcdfb5f36ed766f886d7dbc65274534362fe5 slot=56
```

---

## 第二部分：问题清单

统一格式：`ID | P0/P1/P2/P3 | 文件:行 | 复现步骤 | 预期结果 | 实际结果 | 根因 | 最小修复建议`

| ID | 级别 | 文件:行 | 复现步骤 | 预期结果 | 实际结果 | 根因 | 最小修复建议 |
|---|---|---|---|---|---|---|---|
| `GEM-15e2775-01` | **P1** | `packages/oot-core/src/simulation.ts:211-218`, `110-115`, `19-21` | **场景 A（同槽零延迟澄清+开工）**：`seed=2` 时在 `slot=0` 对 `0-0`（`hidden=2`）依次派发 `clarify(0-0, bluewhale)`、`accept(0-0)`、`assign(0-0, [qwen:worker:cloud])`、`advance`。<br>**场景 B（深夜澄清丢睡眠且次晨即过期）**：推进到 `slot=3`（深夜），将 `bluewhale` 设为 `energy=20, load=5`，派发 `clarify(0-0, bluewhale)` 后 `advance` 进入 `slot=4`。 | **场景 A**：按 GDD §6.3/§6.7 与 `M0_SPEC.md`（“澄清派 1 名角色 1 个时段”、“占角色到下一槽”），澄清中的委托应待该时段结束才完成揭示或进入可接单/执行。<br>**场景 B**：未开加班时深夜不应执行澄清工作，或不应吞没深夜 `+60` 睡眠/上下文清零并在结算瞬间令刚澄清的委托过期。 | **场景 A**：`slot=0` 当槽即获得 `hidden=1` 减免并同时由 `qwen` 产出 `10.61 WP`，澄清耗时为 0 个日历时段。<br>**场景 B**：`slot=4` 时 `bluewhale` 为 `energy=5, load=5`（扣 15 精力且丢失深夜 `+60` 精力与 `load=0` 重置），同时 `0-0` 在 `slot=4` 日结 `refill()` 中立即变为 `status='expired'`。 | `clarify` 未检查工作时段（`s.absoluteSlot % 4 < 2`），且在命令派发瞬间直接 `j.hidden--` 而未标记委托处于本槽澄清占用，同时 `busyUntil = s.absoluteSlot + 1` 在 `slot=3` 阻断了第 111 行的深夜睡眠恢复。 | 1. 限制 `clarify` 仅可在标准工作时段（`s.absoluteSlot % 4 < 2`）执行（或禁止对当晚即将过期的委托澄清）；<br>2. 将澄清揭示延迟到当槽 `resolve` 生效，或在委托上记录 `clarifyingUntil: s.absoluteSlot + 1`，期间禁止同槽 `accept`/`assign`。 |
| `GEM-15e2775-02` | **P1** | `packages/oot-core/src/simulation.ts:48-103` | **场景 A（0 产出空转计费与刷审查分）**：`seed=2` 接受含隐藏需求的委托，派遣 `qwen(worker:cloud)` 与 `bluewhale(reviewer:cloud)`，令 `qwen.energy = 5`（罢工 `<10`）或触发 `busy` 选免费等待使唯一 `worker` 暂停，执行 `advance`。<br>**场景 B（`tip` 卡对非产出岗多收 20% Token）**：派遣 `llama(planner)` + `qwen(worker)` + `bluewhale(reviewer)`，设 `pending={card:'tip', slot:0}`，分别执行 `choose 0`（`multiplier=1.2`）与 `choose 1`（`multiplier=1.0`）。 | **场景 A**：当槽无任何 `worker` 实际产出 WP 时，`planner`/`reviewer` 不应空转扣费，更不应在 `progress=0` 时永久获得满额 `j.review`（`+10×matching`）加成。<br>**场景 B**：`tip` 卡（“本时段产出+20%”）只提升产出，不应向不产 WP 且加成固定的 `planner`/`reviewer` 多收 20% Token。 | **场景 A**：`progress=0`，但 `bluewhale(reviewer)` 仍被扣 `12.6 T`、`-15` 精力、`load+1`，且 `j.review` 被永久写为 `7`（下一槽即可撤下 `reviewer` 白拿审查加分）。<br>**场景 B**：`choose 0` 下 `llama(planner)` 耗费 `14.4 T`（vs `12 T`）、`bluewhale(reviewer)` 耗费 `15.12 T`（vs `12.6 T`），多付 20% Token 但 `bonus` 与 `j.review` 毫无增加。 | 1. `resolve()` 未追踪当槽是否有 `worker` 实际工作，且 `j.review = Math.max(j.review, matching * 10)` 取单槽历史最高值而非按工作槽覆盖或要求当槽有实际交付产出；<br>2. 第 58 行对所有岗位统一乘以 `effect`（`multiplier`），但 `planner`/`reviewer` 的 `units` 仅用于计费，不增加加速或审查效果。 | 1. 仅对 `m.role === 'worker'` 应用正向 `multiplier > 1`（当 `multiplier === 0` 暂停时仍令目标角色停工）；<br>2. `reviewer` 仅在当槽有 `worker` 实际产出（`delivered > 0`）或存在待检缺陷时才执行计费与 `j.review` 更新；若 `planner` 付费后当槽无任何 `worker` 实际工作，应在 `worker` 可工作预检通过后再结算 `planner`。 |
| `GEM-15e2775-03` | **P1** | `packages/oot-core/src/simulation.ts:39, 58, 84, 91, 95` | **场景 A（上下文腐烂阈值在同槽内前后不一致）**：派 `mistral`（`context=4`）任 `worker`，设槽初 `mistral.load = 4`（尚未超过 `context`），执行 `advance` 并对比 `load = 3`。<br>**场景 B（未舍入浮点数写入 `State`）**：对三技能权重（如 `0.6 / 0.3 / 0.1`）且技能值为 `7` 的角色计算 `match(c, j, v) * 10` 写入 `j.review`。 | **场景 A**：根据 GDD §5.2/§7.2，`Load <= Ctx` 时不触发上下文腐烂；同一时段内产出计算与缺陷率判定应使用一致的槽初 `load > v.context` 状态。<br>**场景 B**：按 `M0_SPEC.md` §6（“所有小数保留2位”），`State` 中的 `j.review` 应舍入到 2 位小数。 | **场景 A**：槽初 `load = 4` 时第 58 行 `4 > 4` 为假（产出 `10.8 WP` 未打 7 折），但第 84 行先执行了 `a.load++`（变为 `5`），导致第 91 行缺陷判定 `5 > 4` 为真，提前 1 个时段承受 `1.5×` 缺陷率惩罚（200 种子下缺陷数 `38` vs `31`）。<br>**场景 B**：`0.6*0.7 + 0.3*0.7 + 0.1*0.7 = 0.7000000000000001`，`j.review` 直接存入未舍入的 `7.000000000000001`。 | 1. 第 56 行提前快照了 `const energy`，但未快照槽初 `const overloaded = a.load > v.context`，而在第 84 行原地 `a.load++` 后于第 91 行再次读取 `a.load`；<br>2. 第 95 行 `j.review = Math.max(j.review, matching * 10)` 未调用 `round()`。 | 1. 在第 56 行附近保存 `const overloaded = a.load > v.context;`，第 58 行与第 91 行统一使用 `overloaded`；<br>2. 将第 95 行改为 `j.review = Math.max(j.review, round(matching * 10));`。 |
| `GEM-15e2775-04` | **P2** | `packages/oot-core/src/simulation.ts:119, 202-203` | 对同一委托 `0-0`（`workSlots=4`）：局 A 在 `slot=0`（上午）直接 `accept`；局 B 先 `advance` 1 槽，在 `slot=1`（下午）或澄清后在 `slot=2`（晚上）执行 `accept`，查看 `j.duration` 及自动违约宽限槽数 `Math.floor(j.duration / 2)`。 | 同一 `workSlots=4` 的委托，其“超过期限的 50% 自动违约”（GDD §7.5 / `M0_SPEC.md` §7）宽限额度应当一致，不应因接单落在上午还是下午/晚上而平白多出宽限槽。 | `slot=0` 接单：`deadline=6, duration=6`，宽限 `Math.floor(6/2) = 3` 个绝对时段；`slot=1` 接单：`deadline=9, duration=8`，宽限 `Math.floor(8/2) = 4` 个绝对时段。 | `j.duration = j.deadline - s.absoluteSlot` 把跨过的晚间/深夜非工作槽数量计入 `duration`，在跨 1 个夜晚与跨 2 个夜晚时相差 2 个绝对时段。 | 用 `t.workSlots` 定义宽限边界（例如 `deadlineAfterWorkSlots(j.deadline, Math.max(1, Math.floor(t.workSlots / 2)))` 或固定以 `t.workSlots` 换算宽限槽数）。 |
| `GEM-15e2775-05` | **P2** | `packages/oot-core/src/simulation.ts:171-172` | 令 `bluewhale` 处于云端 `working` 委托团队中，但设 `bluewhale.energy = 5`（`<10` 罢工状态，或云额度 `quota + purchased = 0`），在工作时段派发 `advance`，触发 `busy` 事件后派发 `choose 1`（支付 ¥80 使用备用队列）。 | 当 `bluewhale` 因精力不足（`<10`）或 Token 耗尽在本时段根本无法工作时，不应触发针对该角色的 `busy` 付费疏通事件，避免玩家白付 ¥80 后角色依然罢工停工。 | 仍可抽中 `busy` 事件，玩家支付 ¥80（`choose 1`）后进入 `resolve()`，`bluewhale` 在第 52 行 `if (a.energy < 10) continue;` 直接跳过，¥80 白花且产出为 0。 | 第 171–172 行仅检查 `j.status === 'working'` 及 `m.character === 'bluewhale' && m.mode === 'cloud'`，未检查角色在当槽是否具备基本工作条件（`energy >= 10`）。 | 在事件抽取过滤条件中校验目标角色（及工作委托中至少一名成员）满足 `energy >= 10`。 |
| `GEM-15e2775-06` | **P2** | `packages/oot-persistence/src/index.ts:4-10`, `apps/sim-cli/src/bot.ts:24-29, 51-52` | 1. 调用 `hash({ a: 1, b: undefined })` 与 `hash(JSON.parse(JSON.stringify({ a: 1, b: undefined })))` 对比。<br>2. 检查 `bot.ts` 在晚间/深夜交付后的 `clarify` 行为与违约单 `advance:` 计入 `income` 的逻辑。 | 1. `stable()` 对值为 `undefined` 的对象属性应与 JSON 序列化语义一致（忽略该键），避免反序列化前后 hash 不一致。<br>2. `bot.ts` 不应在深夜盲目发起 `clarify` 导致委托次晨过期，且违约退回的预付款不应虚增 `income`。 | 1. `stable({ a: 1, b: undefined })` 输出 `'{"a":1,"b":undefined}'`，与 JSON 序列化后的 `'{"a":1}'` 哈希不同（`420b9e...` vs `015abd...`）。<br>2. `bot.ts` 在 `slot % 4 >= 2` 时仍会发起 `clarify`；`operatingMargin` 将已违约退回的 `advance:` 仍算作正收入。 | 1. `Object.entries(value)` 包含值为 `undefined` 的键，而 `JSON.stringify(undefined)` 返回 `undefined`，字符串拼接后变成 `"key":undefined`。<br>2. `bot.ts` 未判断当前时段与挂牌剩余寿命，`income` 未扣除已 `breached` 委托的预付款。 | 1. 在 `stable()` 中增加 `.filter(([, v]) => v !== undefined)`；<br>2. 在 `ROADMAP.md` B01 任务中一并修正 `bot.ts` 的澄清时段条件与违约预付款冲销。 |
| `GEM-15e2775-07` | **P3** | `packages/oot-core/src/simulation.ts:7`, `eslint.config.js:3-5`, `package.json:13-17` | 1. 检查 `oot-core` 导出符号与 `eslint.config.js`。<br>2. 在仅提供 `corepack` 而未全局安装 `pnpm` shim 的 Windows 终端执行 `corepack pnpm check`。 | 1. `oot-core` 仅通过 `Command` 修改状态，ESLint 阻止所有包跨目录 `../../` 导入内部实现。<br>2. 脚本在 `corepack` 环境下可直接串联执行。 | 1. `draw(state, stream)` 作为公开 API 导出且会原地修改 `state.rng[stream]`；`no-restricted-imports` 仅作用于 `packages/oot-core/src/**/*.ts`。<br>2. `package.json` 内层子命令硬编码 `pnpm ...`，未配置全局 shim 时子进程报 `'pnpm' is not recognized`。 | 1. `core.test.ts` 直接调用了 `draw`；ESLint 规则未配置 `../../*` 跨包限制。<br>2. Windows `cmd.exe` 子进程不继承 `corepack` 包装器上下文。 | 1. 保持 `dispatchCommand` 为唯一状态修改入口，在 `eslint.config.js` 增加跨包相对路径限制；<br>2. 在文档中提示运行 `corepack enable` 或在脚本中使用 `corepack pnpm`。 |

---

## 第三部分：测试建议

建议在 M0.3 / B01 集成时新增以下 5 个高价值自动化回归测试（均可放入 `apps/sim-cli/acceptance.test.ts` 或 `core.test.ts`）：

1. **澄清时段边界与跨夜睡眠保护测试（对应 `GEM-15e2775-01`）**
   - **测试内容**：验证在同一工作时段内 `clarify` 后不能立即在同槽 `accept + assign` 白拿零延迟澄清；验证在非工作时段（或即将于次晨 `slot % 4 === 0` 过期的挂牌委托上）拒绝 `clarify`，确保角色深夜 `+60` 精力恢复与 `load = 0` 重置不被无效澄清吞没。
2. **零有效产出槽位的 Planner / Reviewer 免计费与防刷分测试（对应 `GEM-15e2775-02`）**
   - **测试内容**：构造 `worker` 精力 `<10`、云端额度不足或因 `busy` 事件选 0 倍率暂停的场景，断言当槽 `progress === 0` 时同队 `planner` 与 `reviewer` 不消耗 Token/算力、不扣减精力、不累加 `load`，且 `j.review` 不会在 `0 WP` 时被写入。
3. **事件倍率作用域隔离测试（对应 `GEM-15e2775-02`）**
   - **测试内容**：在配置 `planner + worker + reviewer` 的完整团队下触发 `tip` 事件（`multiplier = 1.2`），断言仅 `worker` 的产出与 Token 消耗按 `1.2×` 放大，`planner` 与 `reviewer` 的 Token 消耗与 `multiplier = 1.0` 时严格相等。
4. **上下文容量边界（`load === context`）产出与缺陷判定一致性测试（对应 `GEM-15e2775-03`）**
   - **测试内容**：固定种子，令角色以 `load === context` 进入工作时段，断言该时段既不触发 `0.7×` 产出衰减，也不触发 `1.5×` 上下文腐烂缺陷率乘数；进入下一工作时段（`load === context + 1`）时二者同步触发。
5. **序列化稳定性与跨时段接单宽限期一致性测试（对应 `GEM-15e2775-04`、`GEM-15e2775-06`）**
   - **测试内容**：断言 `hash(obj)` 对含 `undefined` 属性的对象在 `JSON.parse(JSON.stringify(obj))` 前后哈希值完全一致；断言相同 `workSlots` 的委托在上午与下午接单时具有一致的逾期自动违约宽限工作槽数。

---

## 第四部分：阶段放行意见

### 1. 是否允许 Codex 进入下一阶段
- **允许放行（`PASS WITH CONDITIONS`）**：核心架构边界、纯函数式状态克隆、非法命令无副作用回滚、`pendingChoice` 单次结算保护、三路 RNG 独立分流以及存档哈希重放校验在 `15e2775` 上均已跑通且有 32 项自动化测试覆盖。Codex 主线程**可以继续推进 `ROADMAP.md` 中的 B01（机器人调度与成本归因修正）及 M0.3（内容扩充与经济机制）**，无需停工等待。

### 2. 哪些具体模块必须先修复（在 M0.3 / M0.5 正式平衡验收前必须合入）
1. **`packages/oot-core/src/simulation.ts`（澄清与作息生命周期，`GEM-15e2775-01`）**：修复同槽零延迟澄清接单与深夜澄清吞睡眠/次晨过期问题，否则“澄清 vs 直接接单”的策略评估（M0.4/M0.5 验收指标：“不澄清 bot 碰到小白甲方的违约率是澄清 bot 的 2 倍以上”）会产生失真。
2. **`packages/oot-core/src/simulation.ts`（岗位计费与审查加成，`GEM-15e2775-02`）**：修复 `worker` 停工时 `planner`/`reviewer` 空转计费、`0 WP` 槽位永久写入 `j.review` 以及 `tip` 倍率多收 `planner`/`reviewer` Token 的问题，否则团队岗位搭配与 Token 经济核算会偏离设计意图。
3. **`packages/oot-core/src/simulation.ts`（`load` 自增顺序与 `j.review` 舍入，`GEM-15e2775-03`）**：将 `a.load > v.context` 快照提取到 `a.load++` 之前，并对 `j.review` 增加 `round()`，保证数值边界与 2 位小数规范严格成立。

### 3. 哪些问题可以暂时进入 Backlog
- `GEM-15e2775-04`（`j.duration` 跨时段接单宽限期差异）：可在 B03 / M0.3 完善委托期限与多轮机制时统一收敛。
- `GEM-15e2775-05`（角色精力 `<10` 时仍可抽中 `busy` 事件）：可在 B04 / M0.3 实装 20 张事件卡通用触发条件 DSL 时一并收敛。
- `GEM-15e2775-06`（`oot-persistence` 的 `stable()` 过滤 `undefined` 键，及 `bot.ts` 利润归因）：`bot.ts` 改动已列入 `ROADMAP.md` B01，`stable()` 单行过滤可随下一次 persistence 或 core 检查点顺带合入。
- `GEM-15e2775-07`（`draw` 导出收敛、ESLint 跨包相对路径规则与 `corepack` 脚本说明）：属于工程卫生项，可放入 `ROADMAP.md` B05。

### 4. 哪些内容缺少证据，需要进一步验证
- **第 0 章 14 天偿债与 60 天经济平衡指标（GDD §4.3 / §16.8）**：当前 `15e2775` 快照的 `harness/results/batch.json` 显示 5 种策略在 14 天（`slot=56`）扣除 ¥8,000 旧债后平均净现金变化均为负值（`-6350` 至 `-10210`），60 天诊断破产率高。文档已诚实声明当前数值尚未达标，需在修复上述 P1 问题并完成 B01–B04 后，重新运行 `sim:batch` 提供正式平衡达标证据。
- **M0.3 完整内容规模与多机制交互（30 委托模板 / 20 事件卡 / 隐藏需求工作量下调 / 完整现金流危机与贷款）**：在 `15e2775` 快照中仅包含 4 角色、3 委托、2 事件的最小闭环切片（符合 M0.2 范围定义）；待 M0.3 完成后需对新增内容的数据可达性、触发条件和经济闭环开展下一轮快照审查。
