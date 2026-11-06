# Out of Tokens — Gemini 4 Argon M1–M3 工程独立审查报告

## 一、审查元信息、环境、执行命令与 Diff 范围

- **审查者**：Gemini 4 Argon（独立软件架构、并发安全与宿主工程审查员）
- **固定审查目标 SHA**：`b5d1365355cba2d09ae50ecde9ff382bebe1af12`
- **游戏工程实现 SHA**：`afe87343cca5eb3460ad4b23f30b10f1346d99ca`
- **上一轮复审基线 SHA**：`41dd3c4c2398e9cd5e706298adc8e935bb509df4`
- **主仓库路径与当时 HEAD**：`D:\Documents\FeiyangChen\devApps\ai-game\out-of-tokens`（分支 `codex/m1-foundation`，`HEAD = bab864ce09bc1e0e72af737864ea12fab104be59`，仅多出目标后的打包验证文档与固定 SHA 审查 Prompt 提交，主仓库与历史审查 Worktree 均保持原样未触碰）
- **独立审查 Worktree 路径与检出 HEAD**：`D:\Documents\FeiyangChen\devApps\ai-game\out-of-tokens-review-gemini-b5d1365`（Detached `HEAD = b5d1365355cba2d09ae50ecde9ff382bebe1af12`）
- **运行环境**：Windows 11 (`win32 x64`) | Node.js `v24.14.0` | `pnpm v11.25.0` | TypeScript `6.0.3` | Vitest `4.1.8` | Vite `8.3.6`
- **引擎与内容版本**：
  - `engineVersion = 0.8.0`
  - M0 策略基线内容：`contentVersion = m0.6-1`（SHA-256: `0c7a07d2829482d1efbd42f122946815ca551c4c00aea7da8cf96cd6a29a727d`）
  - M1 战役内容：`contentVersion = m1-1`（SHA-256: `f49dabb462143dc20d4a1352826cce959306274e0980fe1bc4480479a7f3ea5a`）
  - M2/M3 Alpha 内容：`contentVersion = m2-1`（SHA-256: `e2e93c46e8eaf4006ba9b02982297f4a02af861119f7a3a6b31b305323161bed`）

### 1.1 独立实测命令与退出码

在独立审查 Worktree（保持 `b5d1365` 干净状态下完成构建与打包测试后，再写入独立验证脚本与本报告）实际执行并记录如下：

| 序号 | 执行命令 | 退出码 | 实测输出与验证结果 | 证据文件 |
| :--- | :--- | :---: | :--- | :--- |
| 1 | `pnpm install --frozen-lockfile --offline` | `0` | 8 个 workspace 项目离线锁定安装通过（`+168 packages`，`Done in 2.6s`）。 | `harness/review-gemini/install.log` |
| 2 | `pnpm check` | `0` | `tsc -b --pretty false` 零错误；`eslint packages apps` 零警告；`oot-web` 与 `oot-dsh` 生产构建成功；Vitest **15 个测试文件 / 114 项测试全部通过**。 | `harness/review-gemini/check.log` |
| 3 | `node scripts/package-playtest.mjs` | `0` | 在干净 `b5d1365` Worktree 上生成 `artifacts/out-of-tokens-b5d1365`（未覆盖主仓库旧包）。 | `harness/review-gemini/package-playtest.log` |
| 4 | `node scripts/verify-playtest.mjs artifacts/out-of-tokens-b5d1365` | `0` | 输出 `{"sourceCommit":"b5d1365355cba2d09ae50ecde9ff382bebe1af12","verifiedFiles":211,"businessApproved":false,"humanTesters":0}`。 | `harness/review-gemini/verify-playtest.log` |
| 5 | `node harness/review-gemini/verify-m3-gemini.mjs` | `0` | 实测 `scripts/dsh-contract-harness.mjs` 临时 Profile 契约测试、复现 `GEM-b5d1365-01..04`、校验许可证与边界，并运行独立种子 `9001–9020`（首次使用）。 | `harness/review-gemini/verify-m3-gemini.mjs`<br>`harness/review-gemini/verify-m3-gemini-results.json` |

### 1.2 Diff 范围核验

1. **`afe87343cca5eb3460ad4b23f30b10f1346d99ca..b5d1365355cba2d09ae50ecde9ff382bebe1af12`**：
   - 仅 3 个文件各新增 1 行（共 `+3/-0`）：[docs/STATUS.md](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-b5d1365/docs/STATUS.md#L40) 记录 `afe8734`、[harness/build-log.md](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-b5d1365/harness/build-log.md#L64) 记录首次打包 `ENOENT` 修复、[scripts/package-playtest.mjs](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-b5d1365/scripts/package-playtest.mjs#L7) 增加 `await mkdir('artifacts',{recursive:true});`。无任何游戏或宿主业务代码变更。
2. **`41dd3c4c2398e9cd5e706298adc8e935bb509df4..b5d1365355cba2d09ae50ecde9ff382bebe1af12`**：
   - 包含四个演进阶段：
     - **M0.7（`c9aa145`、`e6606bb`）**：集成 `41dd3c4` 三份复审报告，修复 `GEM-41dd3c4-01..04` 与 `WEB-01/02`，实施连续心情函数、次日早班疲劳与零产出加班考勤成本，保留 `M05-03` 开放状态。
     - **M1 工程检查点（`a3079a4`、`5671f26`）**：三场景（`workshop` / `canteen` / `library`）、PaperDoll 程序化复用、8 角色 16 版本、开源训练/对齐、硬件 3 级与 8 项软件、第 0 章判定。
     - **M2 Alpha 工程检查点（`2e4d915`、`65add8b`）**：升级至 `0.8.0` / `m2-1`，12 角色 20 版本、100 双语委托、60 双语事件、60 伙伴剧情、21 软件与 4 硬件×5 级、饥饿/压力、概率澄清（独立 `clarifyRng` 游标）、`tool` 岗位、SLA 事故响应、中英切换与离线 PWA。
     - **M3 DSH Host 工程检查点（`afe8734`、`b5d1365`）**：新增 `apps/dsh`（服务端 `FileSaves` + `apply`、客户端 `client.ts` 工坊入口与 `dialog/iframe` 生命周期）、`packages/oot-platform/src/host-storage.ts`（`HostSaves`）、Pixi `unsafe-eval` 静态兼容导入与 `csp.test.ts`、可丢弃契约测试 `scripts/dsh-contract-harness.mjs` 及离线试玩打包校验工具。

---

## 二、阶段放行裁决与未完成验收边界

| 评估维度 | 独立审查结论 | 证据与边界说明 |
| :--- | :--- | :--- |
| **M1–M3 工程检查点与本地试玩包** | **有条件通过（PASS WITH CONDITIONS）** | 15 文件 114 项自动化测试、构建与 211 文件试玩包校验全部通过；核心纯函数边界、跨进程文件锁 CAS、5 备份原子轮转、严格 CSP 及临时 Profile 隔离契约成立。本轮发现 `P0 = 0`、`P1 = 0`、`P2 = 4`（含 `WEB-03` 与 `PWA-01` 独立复现及根因定位）、`P3 = 1`，详见第四节。 |
| **M0 / M0.7 经营平衡放行** | **未通过 / 阻塞（BLOCKED BY `M05-03`）** | `M05-03`（`P1`）仍处于 Open 状态：虽然训练种子 `1–100` 上精力门控晚间加班 14 天净项目收入增幅降至 `+5.87% <= 10%`，但 `tip` 事件处拒绝选项严格占优比例为 `34/152 = 22.37% < 25%`（未达标），且正式未见队列 `7001–8000` 尚未消费，`M06-02/03/04/05`（`P2`）仍开放。 |
| **M1 真人乐趣验收 & M2 公开试玩** | **未验收（DEFERRED — `0/10` 真人）** | `manifest.json` 明确记录 `businessApproved: false, humanTesters: 0`。工程测试不替代 M1 10 人试玩与 M2 公测留存验收。 |
| **M3 真实 DSH 安装与小院共存验收** | **未验收（CONTRACT TESTED ONLY）** | 本轮仅在 OS 临时目录可丢弃 Profile 与 `dsh-contract-harness.mjs` 契约页中验证了接口协议；尚未在真实 DSH `0.2.1-rc.5` Profile 中与真实 AI-Village 插件做安装、共存、断连重连与卸载回归。 |

---

## 三、`41dd3c4` 复审问题核销与旧报告源码纠偏核实

1. **旧报告源码描述纠偏核实**：
   经直接核对 `41dd3c4` 与 `b5d1365` 源码，确认 [docs/REVIEW_M06_INTEGRATION.md](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-b5d1365/docs/REVIEW_M06_INTEGRATION.md#L23) 与 [docs/M0.7_PROTOCOL.md](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-b5d1365/docs/M0.7_PROTOCOL.md#L15) 的核查完全准确：
   - RNG 实现位于 [simulation.ts:10-18](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-b5d1365/packages/oot-core/src/simulation.ts#L10-L18)（`board`、`event`、`quality` 三流）及 [campaign.ts:118](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-b5d1365/packages/oot-core/src/campaign.ts#L118)（M2 新增独立 `clarifyRng`），无独立 `rng.ts` 文件。
   - IndexedDB 持久层位于 [storage.ts:26-79](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-b5d1365/packages/oot-platform/src/storage.ts#L26-L79)，使用单一 `'slots'` ObjectStore（键为 `manual-1..3`、`auto`、`backup-1..5`）、方法 `write(id, text, expectedRevision)` 与错误码 `'SAVE_CONFLICT'`。
   - 三场景名称为 `'workshop' | 'canteen' | 'library'`（工作室 / 食堂 / 图书馆）；多阶段委托每阶段按 `t.reward * rewardScale * ... * multiplier` 结算并扣减首期 `j.advance`。
2. **`GEM-41dd3c4-01..04` 修复核验**：
   - **`GEM-41dd3c4-01`（已修复）**：[simulation.ts:428](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-b5d1365/packages/oot-core/src/simulation.ts#L428) 已导出 `liquidCash`、`overtime`、`loanGraceUntil`、`crisisLength`；[alpha-app.tsx:35-36](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-b5d1365/apps/web/src/alpha-app.tsx#L35-L36) 显式展示 `现金 / 净偿付资金` 并在 `view.liquidCash < 0` 时渲染红色危机警告条。
   - **`GEM-41dd3c4-02`（原问题已修复；M1/M2 新引入的 `effectiveVersion` 差异见 `GEM-b5d1365-01`）**：[events.ts:6-25](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-b5d1365/packages/oot-core/src/events.ts#L6-L25) 新增 `resourced(m)`，要求 `attending(m.character)` 且对应 `cloud`/`local` 资源池 `> 0`，并应用于 `worker`、`cloud` 与 `overload` 触发器。
   - **`GEM-41dd3c4-03`（按设计说明结项）**：[alpha-app.tsx:49](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-b5d1365/apps/web/src/alpha-app.tsx#L49) 已明确标注 `"本槽无事件资源上限估计（未加班的夜间为0）"`；手动槽位保持各自独立 revision 以免盲目刷新绕过 CAS（但 `HostSaves` 下跨槽位对账的边界见 `GEM-b5d1365-04`）。
   - **`GEM-41dd3c4-04`（考勤已修复；睡眠清上下文按规则保留）**：[simulation.ts:152-160](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-b5d1365/packages/oot-core/src/simulation.ts#L152-L160) 对所有 `s.overtime` 角色记录 `lastOvertimeSlot = s.absoluteSlot`，即使 `units <= 0` 未实际产出也扣除加班精力/心情并计入 `worked`，深夜仅恢复 `+30` 精力且次日早晨触发 `fatigueFactor = 0.8`（见 [review-m06.test.ts:7, 10](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-b5d1365/apps/sim-cli/review-m06.test.ts#L7-L10)）。

---

## 四、架构、宿主、并发与许可证专项核查

1. **`oot-core` 纯净性**：扫描 [packages/oot-core/src/](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-b5d1365/packages/oot-core/src/simulation.ts) 全部 9 个源文件，`window`、`document`、`fetch`、`localStorage`、`indexedDB`、`Math.random`、`new Date`、`process`、`node:*` 命中数为 **`0`**；扫描 `apps/web/dist/assets/*.js`（13 个文件）与 `apps/dsh/dist/client.js`，Node 内置模块泄漏数为 **`0`**。
2. **`GameSession`、`BrowserSaves`、`HostSaves`、`FileSaves` 状态与所有权**：
   - [`GameSession`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-b5d1365/packages/oot-platform/src/session.ts#L4-L36) 独占持有内存态 `state`、`commands` 与单调递增的会话 `revision`；`previewAssignment` 不改变 `state`/`commands`/`revision`；`importSave` 在 `await restoreBrowser` 前后比对 `this.revision`，若等待期间发生 `send()` 则抛出 `'SESSION_CHANGED'`，保证异步导入绝不回滚期间发生的新命令。
   - [`BrowserSaves`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-b5d1365/packages/oot-platform/src/storage.ts#L11-L81) 在单一 `'slots'` ObjectStore 的单 `'readwrite'` 事务内完成 CAS 检查（`(previous?.revision ?? 0) !== expectedRevision` -> `'SAVE_CONFLICT'` + `transaction.abort()`）、`backup-1..5` 轮转与新记录写入，并通过 `BroadcastChannel` 通知同源其他标签页。
   - [`FileSaves`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-b5d1365/apps/dsh/src/store.ts#L9-L43) 将存档限定在 `<profile>/out-of-tokens/v1/slots.json`（逐级 `mkdir` `0o700` 并校验 `lstat` 非软链与 `realpath` 一致，不触碰邻接 `ai-village` 目录）。写入前先调用 `restore(this.content, text)` 完整重放校验，再通过 `withFileLock`（`<file>.lock` `wx` 跨进程锁，支持 `ESRCH` 死进程锁安全接管与 3 进程并发竞争）在锁内重读 `envelope()`、校验 `expectedRevision`、轮转 `backup-1..5`、调用 `writeFileAtomic`（随机后缀 `.tmp` `wx` 写入后原子 `rename`，含 Windows `EACCES`/`EBUSY`/`EPERM` 退避重试）并执行 `file.sync()`。
   - **断连与禁止自动重试**：[`store.ts:35-38`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-b5d1365/apps/dsh/src/store.ts#L35-L38) 在进入 `writeFileAtomic` 前最后一次检查 `abort.throwIfAborted()`，一旦开始原子替换则即使客户端断连也完成发布，且 `close()` 通过 `Promise.allSettled(this.pending)` 等待全部进行中任务结束。客户端 [`HostSaves`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-b5d1365/packages/oot-platform/src/host-storage.ts#L5-L22) 在 `write` 抛错时立即置 `this.uncertain = true` 并触发 `onExternalChange`，后续一切 `write` 立即拒绝为 `'WRITE_UNCERTAIN'`，绝不自动重发 POST。
3. **HTTP 路由、Origin、CSP 与客户端生命周期**：
   - [`apps/dsh/src/index.ts`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-b5d1365/apps/dsh/src/index.ts#L14-L36) 仅拦截 `/out-of-tokens/` 前缀，其余路径调用 `next()` 交还宿主；静态文件在启动时通过 `assets()` 预加载至内存 `Map`（拒绝软链，且运行期按 `Map.get(key)` 精确匹配，杜绝路径穿越）；HTML/静态响应附带严格 CSP（`default-src 'self'; script-src 'self'; ... frame-ancestors 'self'; object-src 'none'; base-uri 'none'`，不含 `unsafe-eval`）。
   - [`apps/web/src/scene.ts:5`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-b5d1365/apps/web/src/scene.ts#L5) 导入 `pixi.js/unsafe-eval` 安装静态 uniform 同步器，经 [apps/web/csp.test.ts](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-b5d1365/apps/web/csp.test.ts) 与真实浏览器验证无需放宽 CSP。
   - [`apps/dsh/src/client.ts`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-b5d1365/apps/dsh/src/client.ts) 通过捕获阶段监听 `.village-community-map button[data-place="workshop"]` 并提供 `[data-conversation-header-corner]` / 右下角浮动按钮备用入口，在 `ctx.effect` 卸载回调中断开 `MutationObserver`、移除事件监听并移除自身 DOM 节点。
4. **许可证来源、原文与分发完整性**：
   - `apps/dsh/src/vendor/atomic-write.js` 实测 SHA-256 为 `872d7c1e6e9b267775199bdd3632870f82780d0a5ba047febc93fde94fde53f7`，与 [PROVENANCE.md](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-b5d1365/apps/dsh/src/vendor/PROVENANCE.md) 完全一致；原 MIT 许可证 [ATOMIC-WRITE-LICENSE.txt](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-b5d1365/apps/dsh/src/vendor/ATOMIC-WRITE-LICENSE.txt) 已随试玩包分发至 `dsh/ATOMIC-WRITE-LICENSE.txt`。
   - `PaperDoll`（源自邻接仓库 `f4c2ac633d5ad5e9ee0f7c2cd66bd1af9fc90352`）原 MIT 许可证 [PAPER-DOLL-LICENSE.txt](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-b5d1365/apps/web/public/PAPER-DOLL-LICENSE.txt) 已随 Web 构建与试玩包分发至 `web/PAPER-DOLL-LICENSE.txt`。
   - 试玩包 `dependency-license-files/` 包含锁文件安装树提取的 156 份原始第三方许可证及 1 份说明 `README.txt`（共 157 个文件），`manifest.json` 全部 211 个文件经 `verify-playtest.mjs` 校验通过。

---

## 五、问题清单（按严重度排序：`P0 = 0, P1 = 0, P2 = 4, P3 = 1`）

### `GEM-b5d1365-01` | `P2` | `oot-core` 战役有效属性（`effectiveVersion`）在 Planner/Tool 预检与 `overload` 事件触发器中漏传导致预检失真

- **文件与行号**：
  - [packages/oot-core/src/simulation.ts:88, 95](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-b5d1365/packages/oot-core/src/simulation.ts#L88-L95)
  - [packages/oot-core/src/events.ts:24](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-b5d1365/packages/oot-core/src/events.ts#L24)
  - [packages/oot-core/src/preview.ts:11](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-b5d1365/packages/oot-core/src/preview.ts#L11)
- **触发条件**：
  1. 在 M1/M2 战役模式下，玩家升级了 `hardware.storage`（每级上下文容量 `+1`）、完成了开源训练（`bonuses` 技能 `+1/+2`）、安装了 `vllm`（本地 `reason * 1.3`）或同时安装了 `prompt` 软件并派遣 `tool` 岗位；
  2. 队伍中同时包含 `planner`（或 `tool`）与 `worker`，且当前剩余配额处于边界区间；或者角色的 `load` 处于 `[基础 context, 基础 context + hardware.storage)` 区间。
- **最小复现**：
  运行 `node harness/review-gemini/verify-m3-gemini.mjs`（见 `reproducers.GEM_b5d1365_01_EffectiveVersionMismatch`）：
  1. **子用例 A（Planner 预检漏算 `effectiveVersion`）**：在 `m2-1` 内容、种子 `9001` 下，派遣 `llama (planner, cloud)` + `qwen (worker, cloud)` 执行委托 `0-0`，设置 `s.campaign.hardware.storage = 1`（`qwen` 有效 `context = 6 + 1 = 7`），`qwen.load = 7`，剩余配额 `quota = 62.63 T`。执行 `dispatchCommand(s, { type: 'advance' }, c)`。
  2. **子用例 B（`overload` 事件忽略 `hardware.storage`）**：设置 `s.campaign.hardware.storage = 2`（`qwen` 有效 `context = 8`），`qwen.load = 6`（未达有效上下文上限 `8`），执行 `advance`。
- **预期与实际**：
  - **预期**：
    - 子用例 A：Planner 预检应与实际执行使用相同的 `version(c, wa, s, w.mode)`（有效 `context = 7`，`load = 7` 未过载，Worker 实际需 `59.57 T`），识别出 `llama (12 T) + qwen (59.57 T) = 71.57 T > 62.63 T`，因此 Planner 跳过不空转扣费，留出配额供 `qwen` 独立执行。
    - 子用例 B：`qwen.load = 6 < 有效 context 8`，不应触发 `overload`（`context`）事件。
  - **实际（实测）**：
    - 子用例 A：[simulation.ts:88](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-b5d1365/packages/oot-core/src/simulation.ts#L88) 调用了 `const wv = version(c, wa);`（漏传 `s, w.mode`，退回基础版本 `wv.context = 6`），预检误判 `qwen` 处于过载（`0.7x` 产能，仅需约 `41.7 T`），判定 `62.63 - 12 >= 41.7` 通过！导致 `llama` 先扣走 `12 T`（产出 `3 WP`），随后 `qwen` 在第 63 行使用 `version(c, a, s, m.mode)` 按 `1.0x` 计算需 `59.57 T > 50.63 T`，触发 `OutOfTokens` 停工（`workerProgress: 3`）。此外第 95 行硬编码了 `1.2`（未像第 78 行那样在 `toolReady` 时取 `1.4`），且 [preview.ts:11](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-b5d1365/packages/oot-core/src/preview.ts#L11) 调用 `effectiveVersion` 漏传了 `planner.mode`。
    - 子用例 B：[events.ts:24](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-b5d1365/packages/oot-core/src/events.ts#L24) 使用 `c.versions.find(v => v.id === a.version)!.context`（基础值 `6`），在 `load = 6 < 8` 时仍错误触发了 `pending = { card: 'context', slot: 0, job: '0-0' }`。
- **影响**：削弱了战役模式下 `storage` 硬件升级、开源训练、`vllm` 与 `prompt+tool` 组合在混合队伍中的资源预检准确性，并在已升级存储硬件时提前误触发上下文过载事件。
- **证据**：`harness/review-gemini/verify-m3-gemini-results.json` 中 `reproducers.GEM_b5d1365_01_EffectiveVersionMismatch` 实测记录。
- **最小修复建议**：
  1. 在 [simulation.ts:88](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-b5d1365/packages/oot-core/src/simulation.ts#L88) 将 `const wv = version(c, wa);` 改为 `const wv = version(c, wa, s, w.mode);`，并在第 95 行同步 `1 + .2 * (toolReady ? 2 : 1)`；
  2. 在 [events.ts:24](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-b5d1365/packages/oot-core/src/events.ts#L24) 改用 `effectiveVersion(s, c, a, m.mode).context`；
  3. 在 [preview.ts:11](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-b5d1365/packages/oot-core/src/preview.ts#L11) 传入 `planner.mode`。

---

### `GEM-b5d1365-02` | `P2` | `WEB-03` 独立复现与根因：`BrowserSaves` 构造函数同步创建未挂载 `.catch` 的拒绝 Promise，早于 `useEffect` 触发 `unhandledrejection`

- **文件与行号**：
  - [packages/oot-platform/src/storage.ts:15-34](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-b5d1365/packages/oot-platform/src/storage.ts#L15-L34)
  - [apps/web/src/use-game.ts:8, 14](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-b5d1365/apps/web/src/use-game.ts#L8-L14)
- **触发条件**：当浏览器环境禁用 IndexedDB（`globalThis.indexedDB` 为空或 `factory.open` 同步抛出异常 / 在同一微任务队列内立即触发 `onerror`），组件在 `useState(() => new BrowserSaves(...))` 渲染阶段同步构造 `BrowserSaves`。
- **最小复现**：
  运行 `node harness/review-gemini/verify-m3-gemini.mjs`（见 `reproducers.GEM_b5d1365_02_Web03UnhandledRejectionBeforeEffect`）：
  构造 `new BrowserSaves('out-of-tokens-alpha', { open() { throw Error('STORAGE_UNAVAILABLE'); } })`，等待一个宏任务周期（模拟 Preact 从 `useState` 同步渲染到 DOM 挂载后执行 `useEffect` 之间的时间窗），再调用 `close()`。
- **预期与实际**：
  - **预期**：存储不可用错误应仅在 `useEffect` 调用 `await storage.list()`（或 `read`/`write`/`close`）时被捕获并降级为 `STORAGE_UNAVAILABLE` UI 提示，不应向全局抛出未处理的 Promise 拒绝（`unhandledrejection`）。
  - **实际（实测）**：`this.db = new Promise(...)` 在构造函数中立即进入 `rejected` 状态，而此时 Preact 尚处于 `useState` 渲染阶段，`useEffect`（[use-game.ts:14](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-b5d1365/apps/web/src/use-game.ts#L14)）尚未挂载执行 `storage.list()`。在渲染结束的微任务检查点，`this.db` 上没有任何 rejection handler，实测确定性触发 `unhandledRejection`（`unhandledRejectionFiredBeforeEffectMount: true, unhandledRejectionMessage: "STORAGE_UNAVAILABLE"`），随后当 `useEffect` 挂载并 `await storage.list()` 时又触发 `PromiseRejectionHandledWarning`。
- **影响**：在禁用存储的隐私窗口、受限 WebView 或 `test-fault=storage` 故障注入下，控制台产生未捕获异常告警（即 `package-results.md` 记录的 `WEB-03` 现象）。
- **证据**：`harness/review-gemini/verify-m3-gemini-results.json` 中 `reproducers.GEM_b5d1365_02_Web03UnhandledRejectionBeforeEffect`。
- **最小修复建议**：在 [packages/oot-platform/src/storage.ts:33](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-b5d1365/packages/oot-platform/src/storage.ts#L33) 构造 `this.db = new Promise(...)` 之后立即附加一行 `this.db.catch(() => {});`（这不会改变 `this.db` 本身的 rejected 状态，`read`/`list`/`write`/`close` 中 `await this.db` 依然会原样抛出该 Error，但彻底消除了 `useEffect` 挂载前的裸 rejected Promise 窗口）。

---

### `GEM-b5d1365-03` | `P2` | `PWA-01` 独立复现与根因：Service Worker 更新按钮状态未随激活清理且未校验 `controller`，导致点击更新不自动刷新

- **文件与行号**：
  - [apps/web/src/alpha-app.tsx:29, 37](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-b5d1365/apps/web/src/alpha-app.tsx#L29-L37)
  - [apps/web/vite.config.ts:10-12](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-b5d1365/apps/web/vite.config.ts#L10-L12)
- **触发条件**：
  1. 首次访问或硬刷新后无现存 `controller` 时注册 `sw.js`；或
  2. 存在旧 SW 时，新 SW 在 `statechange` 经过 `'installed'`（此时 `reg.waiting` 非空）后已自动或由其他入口完成激活（`reg.waiting` 变回 `null`，`worker.state` 变为 `'activated'`），玩家随后点击页面上的 `"已准备新版本；先导出存档，再点击更新"` 按钮。
- **最小复现**：
  运行 `node harness/review-gemini/verify-m3-gemini.mjs`（见 `reproducers.GEM_b5d1365_03_Pwa01StaleUpdateWorker`），按 [alpha-app.tsx:29](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-b5d1365/apps/web/src/alpha-app.tsx#L29) 原样执行：
  ```ts
  const observe = () => { if (live && reg.waiting) setUpdate(reg.waiting); };
  observe();
  reg.addEventListener('updatefound', () => reg.installing?.addEventListener('statechange', observe));
  ```
- **预期与实际**：
  - **预期**：仅当存在旧 `navigator.serviceWorker.controller` 且新 Worker 仍处于 `waiting`（`state === 'installed'`）状态时才显示更新按钮；一旦 Worker 进入 `'activating'` / `'activated'`（`reg.waiting === null`）或点击按钮后已完成控制权接管，应立即刷新或隐藏按钮。
  - **实际（实测）**：
    1. 在 [alpha-app.tsx:29](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-b5d1365/apps/web/src/alpha-app.tsx#L29) 中，当 `reg.installing` 完成 `install` 切换到 `'installed'` 状态时，浏览器在启动激活前会将 `reg.waiting` 设为该 Worker 并触发 `statechange`，此时 `observe()` 执行 `setUpdate(reg.waiting)`；紧接着当该 Worker 进入 `'activating'` -> `'activated'`（例如首次安装或旧 SW 无客户端占用而直接激活，`clients.claim()` 在按钮点击前就已完成）时，`reg.waiting` 变为 `null`，但 `observe()` **只有 `if (live && reg.waiting) setUpdate(reg.waiting)` 而没有 `else setUpdate(null)`**，导致 `update` 状态永久残留为已激活的 Worker！
    2. 当用户随后点击 [alpha-app.tsx:37](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-b5d1365/apps/web/src/alpha-app.tsx#L37) 的更新按钮时：
       `update.postMessage({type:'ACTIVATE'}); navigator.serviceWorker.addEventListener('controllerchange',()=>location.reload(),{once:true});`
       一方面 `addEventListener('controllerchange', ...)` 写在 `postMessage` 之后；另一方面若 `update.state` 已经是 `'activated'`（或 `reg.waiting` 已为空），向已激活的 Worker 发送 `'ACTIVATE'`（`skipWaiting()`）不会再次触发 `controllerchange`，页面永远不会自动刷新，必须手动刷新后按钮才会消失（与 `harness/m3/package-results.md:10` 观察到的现象完全吻合）。
- **影响**：PWA 更新提示可能在首次安装后误显示，或在点击更新按钮后无响应、需玩家手动刷新页面。
- **证据**：`harness/review-gemini/verify-m3-gemini-results.json` 中 `reproducers.GEM_b5d1365_03_Pwa01StaleUpdateWorker`。
- **最小修复建议**：
  1. 在 [alpha-app.tsx:29](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-b5d1365/apps/web/src/alpha-app.tsx#L29) 将 `observe` 改为：
     `const observe = () => { if (live) setUpdate(navigator.serviceWorker.controller ? reg.waiting : null); };`
  2. 在 [alpha-app.tsx:37](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-b5d1365/apps/web/src/alpha-app.tsx#L37) 点击回调中，先注册 `controllerchange` 监听，并检查若 `update.state === 'activated'` 或 `!reg.waiting` 则直接调用 `location.reload()`。

---

### `GEM-b5d1365-04` | `P2` | `HostSaves` 空档位下 `WRITE_UNCERTAIN` 无法通过 UI 载入解除，且 `useGame` 的 `oot:checkpoint` 在自动保存进行中时立即返回 `ok: false`

- **文件与行号**：
  - [packages/oot-platform/src/host-storage.ts:14-20](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-b5d1365/packages/oot-platform/src/host-storage.ts#L14-L20)
  - [apps/web/src/use-game.ts:14-17](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-b5d1365/apps/web/src/use-game.ts#L14-L17)
  - [apps/web/src/alpha-app.tsx:53](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-b5d1365/apps/web/src/alpha-app.tsx#L53)
  - [apps/dsh/src/client.ts:16, 23](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-b5d1365/apps/dsh/src/client.ts#L16-L23)
- **触发条件**：
  1. **空档对账死锁**：新 Profile 首次进入工坊（服务端 9 个槽位均为 `null`），首次触发 `write('auto')` 因瞬时网络超时或宿主忙失败（服务端未落盘，仍为全 `null`），`HostSaves` 进入 `this.uncertain = true`。
  2. **跨槽位冲突对账遗漏**：在 `HostSaves` 模式下，另一窗口更新了 `manual-1` 导致本窗口保存 `manual-1` 报 `SAVE_CONFLICT`（`this.uncertain = true`），玩家按提示点击 `auto` 槽位的 `"载入"` 对账后再次点击 `manual-1` 的 `"保存"`。
  3. **保存进行中点击“保存并关闭”**：在 Host 模式下，每条游戏命令都会在 `send()` 内异步执行 `await write('auto')`（期间 `gate.current === true`）；若玩家在命令触发后立即点击外层面板的 `"保存并关闭"`（或按 `Esc`），或卸载插件时 `hide()` 的 `checkpoint()` 尚在进行中。
- **最小复现**：
  运行 `node harness/review-gemini/verify-m3-gemini.mjs`（见 `reproducers.GEM_b5d1365_04_HostSavesReconciliationAndCheckpoint`）：
  1. 模拟服务端 `records` 全为 `null`，首次 `hostClient.write('auto', text, 0)` 抛出 `NETWORK_TIMEOUT`；随后网络恢复，调用 `hostClient.list()`（对应打开存档弹窗 `game.refresh()`），检查可载入槽位数并再次调用 `write`。
  2. 检查 [use-game.ts:15](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-b5d1365/apps/web/src/use-game.ts#L15) 与 [client.ts:16, 23](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-b5d1365/apps/dsh/src/client.ts#L16-L23)。
- **预期与实际**：
  - **预期**：
    1. 当服务端全部槽位为空（`null`）时，玩家应能在存档弹窗中完成只读对账以解除 `WRITE_UNCERTAIN`；
    2. 载入对账后，已从服务端获取的最新槽位列表与 `revision` 应同步更新；
    3. 当 `send()` 正在执行 `write('auto')`（`gate.current === true`）时收到 `oot:checkpoint`，应等待当前操作完成后再执行或确认保存，而不应直接返回 `ok: false`；且 `client.ts:23` 卸载时若已有 `waiting` checkpoint 在途，应等待其完成而非立即返回 `false` 销毁 iframe。
  - **实际（实测）**：
    1. `hostClient.list()` 不清除 `this.uncertain`（仅 `read(id)` 清除），而在 [alpha-app.tsx:53](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-b5d1365/apps/web/src/alpha-app.tsx#L53) 中所有 `"载入"` 按钮均设置 `disabled={busy || !r}`（且 [use-game.ts:17](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-b5d1365/apps/web/src/use-game.ts#L17) `load` 在 `!row` 时抛 `NO_SAVE`）。因此当服务端全空时，`loadableSlotsInUiWhenServerEmpty = 0`，玩家在 UI 中没有任何可点击的 `"载入"` 按钮来触发 `storage.read()`，后续任何保存永远报错 `WRITE_UNCERTAIN`（除非先导出文件再重新导入文件）。
    2. [use-game.ts:17](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-b5d1365/apps/web/src/use-game.ts#L17) `load(id)` 连续发起两次 `storage.read(id)` 与 `storage.read('auto')`（在 `HostSaves` 中每次 `read` 都拉取完整 9 槽列表），但只更新了 `revisions.current[id]` 和 `revisions.current.auto`，且未调用 `setRecords(rows)`。
    3. [use-game.ts:15](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-b5d1365/apps/web/src/use-game.ts#L15) 的 `useEffect` 漏写了依赖数组 `[]`（导致每次组件重渲染都解绑并重绑 `window` 的 `message` 监听器），且当 `gate.current === true` 时直接跳过 `write('auto')` 并向父窗口发送 `{ type: 'oot:checkpoint-result', id, ok: false }`；同时 [client.ts:16, 23](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-b5d1365/apps/dsh/src/client.ts#L16-L23) 中若 `hide()` 正在等待 `checkpoint()` 时触发插件卸载，`await checkpoint()` 因 `if (waiting) return false;` 立即返回 `false` 并执行 `panel.remove()`。
- **影响**：在 Host 模式下首次保存超时或操作紧邻点击“保存并关闭”时，容易出现无法在 UI 内直接对账恢复或误报“保存未确认”。
- **证据**：`harness/review-gemini/verify-m3-gemini-results.json` 中 `reproducers.GEM_b5d1365_04_HostSavesReconciliationAndCheckpoint`。
- **最小修复建议**：
  1. 在 [use-game.ts:15](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-b5d1365/apps/web/src/use-game.ts#L15) 为 `useEffect` 补上依赖数组 `[hosted]`，并用操作队列/Promise 链等待当前 `run()` 结束后再执行 `checkpoint` 的 `write('auto')`；
  2. 在 [client.ts:16](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-b5d1365/apps/dsh/src/client.ts#L16) 中若 `waiting` 已存在则复用/等待当前 in-flight Promise，而非直接 `return false`；
  3. 当 `storage.read('auto')` 返回 `null`（服务端确认尚无任何自动档）时，允许用户通过显式“同步空档对账”或刷新对账解除 `WRITE_UNCERTAIN` 并置 `revisions.current.auto = 0`。

---

### `GEM-b5d1365-05` | `P3` | 客户端备用入口样式残留、`Origin: null` 异常状态码与跨工作区打包文档 CRLF 哈希差异

- **文件与行号**：
  - [apps/dsh/src/client.ts:13](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-b5d1365/apps/dsh/src/client.ts#L13)
  - [apps/dsh/src/index.ts:28](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-b5d1365/apps/dsh/src/index.ts#L28)
  - [scripts/package-playtest.mjs:13, 21](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-b5d1365/scripts/package-playtest.mjs#L13-L21)
- **触发条件与现象**：
  1. **[client.ts:13](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-b5d1365/apps/dsh/src/client.ts#L13)**：若宿主页面初始尚未渲染 `[data-conversation-header-corner]`，`mount()` 会将 `launch` 挂到 `document.body` 并设置 `launch.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:9999'`；随后当 `MutationObserver` 观测到 `[data-conversation-header-corner]` 出现并执行 `corner.append(launch)` 时，未清空 `launch.style.cssText`，导致按钮虽在 DOM 上移入 header corner 但视觉上仍固定在右下角。
  2. **[apps/dsh/src/index.ts:28](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-b5d1365/apps/dsh/src/index.ts#L28)**：`if (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host)` 在收到沙箱或隐私上下文常见的 `Origin: null` 请求头时，`new URL('null')` 抛出 `TypeError: Invalid URL`，落入 `catch` 返回 `400 {"error":"Invalid URL"}` 而非 `403 {"error":"FOREIGN_ORIGIN"}`（请求仍被安全拒绝，无越权风险）。
  3. **[scripts/package-playtest.mjs:13, 21](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-b5d1365/scripts/package-playtest.mjs#L13-L21)**：对比本审查 Worktree 独立打包的 `artifacts/out-of-tokens-b5d1365/manifest.json` 与主工作区生成的 `manifest.json`，211 个文件中有 **209 个文件（含全部 Web/DSH 编译产物与 157 个许可证文件）SHA-256 100% 相同**，仅 `docs/M1_ACCEPTANCE.md` 与 `docs/M3_ACCEPTANCE.md` 因主工作区为 CRLF 而新检出 Worktree 为 LF 产生行尾字节差异（LF 归一化后内容完全一致）。
- **建议**：
  1. 在 `client.ts:13` 的 `corner.append(launch)` 分支加上 `launch.style.cssText = '';`；
  2. 在 `apps/dsh/src/index.ts:28` 封装安全 Origin 解析函数，对无法解析为合法同源 URL 的 `Origin` 统一返回 `403 FOREIGN_ORIGIN`；
  3. 新增 `.gitattributes`（`* text=auto eol=lf`）或在 `package-playtest.mjs` 复制 `.md` 文档时统一归一化为 LF。

---

## 六、可丢弃 Profile 宿主契约测试与独立种子 `9001–9020` 实测报告

### 6.1 `scripts/dsh-contract-harness.mjs` 契约测试实测

通过 `verify-m3-gemini.mjs` 实际拉起 `node scripts/dsh-contract-harness.mjs` 并对 `http://127.0.0.1:5181` 进行契约探测：
- 启动自动创建独立临时目录 `C:\Users\enxi1\AppData\Local\Temp\oot-m3-harness-OyfJjD`（未触碰真实用户 Profile）；
- `GET /` 返回 `200`（含 `.village-community-map button[data-place="workshop"]` 与邻接 `data-place="library"` 按钮）；
- `GET /fixture-client.js` 返回 `200`；
- `GET /out-of-tokens/web/index.html?dsh=1` 返回 `200`，响应头 `Content-Security-Policy` 含 `frame-ancestors 'self'` 且**不含** `unsafe-eval`；
- `GET /out-of-tokens/api/saves` 返回 `200`（9 个槽位初始均为 `null`）；
- 发送 `SIGTERM` 关闭进程后，临时 Profile 目录已干净移除。

### 6.2 独立盲测种子 `9001–9020` 首次使用验证报告（非主线程正式验收）

- **声明**：以下 `9001–9020`（共 20 个种子）为本审查员在 `b5d1365` 上**首次使用**的独立小样本工程核验，**不替代主线程预留正式队列 `7001–8000`**。由于 `m2-1` 包含 100 委托与战役专属机制，M0 五策略基线机器人按协议在 `engineVersion = 0.8.0`、`contentVersion = m0.6-1` 上运行（100 局），同时在 `contentVersion = m2-1` 上对 `9001–9005` 进行了战役与生活指令的 Node/WebCrypto 双端存取回放一致性检验。
- **不变量与双端回放结果**：
  - `m0.6-1` 100 局（5 策略 × 20 种子）：`invariantViolations = 0`（无越界、无负配额、无 `NaN`）。
  - `m2-1` 种子 `9001–9005`：Node `save` 与 WebCrypto `saveBrowser` 输出字符串 100% 逐字节一致，`restoreBrowser` 状态哈希 100% 匹配。

#### 1. `9001–9020` 五策略汇总表（`engineVersion = 0.8.0` / `contentVersion = m0.6-1`）

| 策略 (`strategy`) | 局数 | 60天破产率 (`bankruptcy`) | 第14天偿付率 (`chapterSolvent`) | 14–21天持续偿付率 (`sustainedSolvent`) | 第14天净现金均值 (`chapterLiquid`) | 60天终局净现金 (`netCash`) | 交付率 (`deliveryRate`) | 违约率 (`breachRate`) | 新手期违约率 (`noviceBreachRate`) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **`value`** | 20 | **0.0%** (0/20) | **75.0%** (15/20) | **75.0%** (15/20) | +988.78 | +13555.30 | 91.10% | 4.24% | 0.00% (0/74) |
| **`greedy`** | 20 | 65.0% (13/20) | 20.0% (4/20) | 15.0% (3/20) | -1605.77 | -3390.34 | 87.50% | 0.45% | 0.00% (0/12) |
| **`random`** | 20 | 25.0% (5/20) | 30.0% (6/20) | 25.0% (5/20) | -645.35 | +951.34 | 87.07% | 5.44% | 0.00% (0/16) |
| **`no-clarify`** | 20 | 20.0% (4/20) | 45.0% (9/20) | 40.0% (8/20) | -73.72 | +8355.82 | 76.23% | 17.49% | **30.23%** (65/215) |
| **`clear-only`** | 20 | 0.0% (0/20) | 75.0% (15/20) | 70.0% (14/20) | +665.29 | +8828.25 | 89.03% | 6.05% | 0.00% (0/0) |

#### 2. `9001–9020` 全部失败局 / 未达持续偿付局完整清单（共 55 局）

以下完整列出 100 局中所有满足 `bankrupt === true || !chapterSolvent || !sustainedSolvent` 的 55 局明细（原始 JSON 位于 `harness/review-gemini/verify-m3-gemini-results.json`）：

- **`value`（共 5 局未达第 14 天偿付，0 局破产）**：
  - `seed 9001`：`bankrupt=false, chapterSolvent=false, sustainedSolvent=false, chapterLiquid=-144.31, netCash=15003.10, delivered=38, breached=0`
  - `seed 9005`：`bankrupt=false, chapterSolvent=false, sustainedSolvent=false, chapterLiquid=-51.15, netCash=14293.26, delivered=34, breached=1`
  - `seed 9007`：`bankrupt=false, chapterSolvent=false, sustainedSolvent=false, chapterLiquid=-686.30, netCash=11525.62, delivered=34, breached=2`
  - `seed 9010`：`bankrupt=false, chapterSolvent=false, sustainedSolvent=false, chapterLiquid=-1819.05, netCash=16465.15, delivered=37, breached=2`
  - `seed 9020`：`bankrupt=false, chapterSolvent=false, sustainedSolvent=false, chapterLiquid=-868.70, netCash=10368.80, delivered=27, breached=2`
- **`greedy`（共 17 局失败，其中 13 局破产）**：
  - 破产局（13 局）：`9002` (`netCash=-6251.60`), `9003` (`-5177.93`), `9004` (`-6288.19`, 章末偿付但后续破产), `9005` (`-6043.90`), `9007` (`-5483.15`), `9009` (`-5909.23`), `9010` (`-7703.00`), `9011` (`-5292.05`), `9013` (`-5502.53`), `9015` (`-5391.44`), `9018` (`-6875.69`), `9019` (`-5217.15`), `9020` (`-5488.00`)。
  - 未破产但章末/持续未偿付（4 局）：`9001` (`chapterLiquid=-1157.54, netCash=644.30`), `9006` (`chapterLiquid=-697.09, netCash=5174.66`), `9008` (`chapterLiquid=-1234.93, netCash=-2319.84`), `9017` (`chapterLiquid=-252.02, netCash=-1167.18`)。
- **`random`（共 16 局失败，其中 5 局破产）**：
  - 破产局（5 局）：`9001` (`netCash=-5749.45`), `9003` (`-6890.70`), `9007` (`-5038.70`), `9009` (`-5235.41`, 章末偿付但后续破产), `9013` (`-5506.48`)。
  - 未破产但章末/持续未偿付（11 局）：`9005` (`chapterLiquid=-433.15`), `9008` (`-1261.27`), `9010` (`-2933.74`), `9011` (`-817.02`), `9015` (`-1572.32`), `9016` (`-358.04`), `9017` (`-424.85`), `9018` (`-1591.20`), `9019` (`-1051.09`), `9020` (`-2030.90`)。
- **`no-clarify`（共 11 局失败，其中 4 局破产）**：
  - 破产局（4 局）：`9003` (`netCash=-6679.20`), `9010` (`-4733.80`), `9016` (`-5280.70`), `9018` (`-5025.69`)。
  - 未破产但章末/持续未偿付（7 局）：`9002` (`chapterLiquid=-548.52`), `9004` (`-424.84`), `9005` (`-1498.04`), `9007` (`-2471.00`), `9009` (`-1367.30`), `9012` (`chapterLiquid=+606.22`, 章末偿付但 14–21 天失守), `9013` (`-685.47`), `9020` (`-375.45`)（共 8 局非破产未持续偿付 + 4 局破产 = 12 局）。
- **`clear-only`（共 6 局未达持续偿付，0 局破产）**：
  - `9002` (`chapterLiquid=-217.15`), `9003` (`-764.52`), `9008` (`-830.72`), `9011` (`-760.80`), `9018` (`chapterLiquid=+637.55`, 章末偿付但 14–21 天失守), `9019` (`-593.76`)。
