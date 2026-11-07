# Out of Tokens — Gemini 4 Argon M4/M5 独立技术审查报告 (`9e48510`)

- **审查角色**：Gemini 4 Argon（独立软件架构、并发、宿主与分发正确性审查员）
- **固定审查目标 SHA**：`9e485100dfe22e31a6894022f3664e971c4818b7`（`feat: implement M5 campaign endings rivals expeditions and endless play`）
- **上一轮复审基线 SHA**：`b5d1365355cba2d09ae50ecde9ff382bebe1af12`（`docs: record M3 packaged playtest verification`）
- **中间检查点提交**：
  - `224bbbe8cda5076b759ab3788c38895a79d28b81`（`fix: integrate M3 reviews and restore library character meals`）
  - `9ab9281762c3689abff40ee79226f9283c866286`（`feat: add M4 desktop and isolated local dialogue expansion`）
- **实际仓库 HEAD 核验**：
  - 主仓库（`D:\Documents\FeiyangChen\devApps\ai-game\out-of-tokens`，分支 `codex/m1-foundation`）：`68d59963f1f5a9e3ab2b27599b44365a4fe7bfd0`（`9e48510..68d5996` 仅涉及 [STATUS.md](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/docs/STATUS.md)、[build-log.md](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/harness/build-log.md)、`harness/m5/*` 打包记录与 `harness/reviews/m5-*` 交接提示词共 12 个文件，**零业务代码或声明式内容差异**）
  - 独立审查 Worktree（`D:\Documents\FeiyangChen\devApps\ai-game\out-of-tokens-review-gemini-9e48510`）：detached HEAD 检出固定目标 `9e485100dfe22e31a6894022f3664e971c4818b7`
- **目标版本**：`engineVersion = 0.10.0`（[version.ts](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/packages/oot-core/src/version.ts#L1)），M5 内容版本 `contentVersion = m5-1`（[index.ts](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/packages/oot-content/src/index.ts#L20-L24)、[content.ts](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/apps/web/src/content.ts#L7)；`loadAlphaContent()` 保持 `m2-1`，`loadContent()` 保持 `m0.6-1`）
- **执行环境**：Windows 11 x64 (`win32`)，Node.js `v24.16.0`，pnpm `11.25.0`（通过本机 Node Corepack 调用，未改动全局配置、主工作区、历史审查 worktree 或真实 DSH Profile）
- **独占审查种子队列**：`9501–9520`（首次消费；未触碰主线程封存的 `7001–8000` 及历史队列 `1–100`、`3001–4000`、`8101–8520`、`9001–9020`、`9101–9300`、`9401–9420`）

---

## 一、独立验证命令、退出码与结果摘要

所有命令均在独立 worktree `D:\Documents\FeiyangChen\devApps\ai-game\out-of-tokens-review-gemini-9e48510` 中实际执行，日志与结构化证据保存在 [harness/review-m5-gemini/](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/harness/review-m5-gemini/)，未覆盖任何历史日志或历史试玩包：

| 序号 | 实际执行命令 | 退出码 | 实际结果与证据路径 |
|---|---|---:|---|
| 1 | `git status --short && git rev-parse HEAD && git diff --stat 9e485100dfe22e31a6894022f3664e971c4818b7..HEAD`（主仓库） | `0` | 主仓库工作区干净；`9e48510..68d5996` 仅新增打包记录与审查 Prompt，无代码变更 |
| 2 | `git diff --stat b5d1365355cba2d09ae50ecde9ff382bebe1af12..9e485100dfe22e31a6894022f3664e971c4818b7` | `0` | 95 files changed, 14,758 insertions(+), 52 deletions(-) |
| 3 | `pnpm install --frozen-lockfile` | `0` | 锁定依赖完整解析（8 个 workspace 项目，168 包），日志见 [install.log](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/harness/review-m5-gemini/install.log) |
| 4 | `pnpm check`（`pnpm typecheck && pnpm lint && pnpm test && pnpm build`） | `0` | **22 个测试文件、132 项测试全部通过**；Core / Web / DSH 生产构建通过，日志见 [check.log](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/harness/review-m5-gemini/check.log) |
| 5 | `node scripts/verify-playtest.mjs D:\Documents\FeiyangChen\devApps\ai-game\out-of-tokens\artifacts\out-of-tokens-9e48510` | `0` | 固定包 `out-of-tokens-9e48510.zip`（`6,203,568` 字节，SHA-256 `88bfcf5d3259c1dd8d91ab5504a8a013ab96068257ad462c8e860759c1611259`）解压目录校验 `verifiedFiles: 901`、`sourceCommit: 9e485100dfe22e31a6894022f3664e971c4818b7`、`businessApproved: false`、`humanTesters: 0` |
| 6 | `node harness/review-m5-gemini/verify-m5-gemini.mjs` | `0` | 独立执行固定包/Cargo 许可证核查、陈旧 `dist`/桌面二进制错误绑定最小复现、`GEM-b5d1365-01` 复现、M5 远征饥饿/场景脱节复现、`WEB-03`/Host 对账并发复现及独占种子 `9501–9520` 验证；结果见 [verify-m5-gemini-results.json](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/harness/review-m5-gemini/verify-m5-gemini-results.json) 与 [verify-m5-gemini.log](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/harness/review-m5-gemini/verify-m5-gemini.log) |

---

## 二、问题清单（按严重度 P0 / P1 / P2 / P3 排列）

本轮发现 **0 项 P0**、**1 项开放 P1**（历史经营门禁 `M05-03`）、**4 项 P2**（打包工具陈旧构建绑定漏洞、`GEM-b5d1365-01` 有效属性与无尽周挑战预览不一致、M5 远征期间饥饿累加且场景未脱离本地、`PWA-01` 跨标签接管与 Host 非空档不确定写恢复缺口）、**3 项 P3**（Tauri 调试二进制控制台子系统与关闭窗口未自动存档、Cargo 18 个依赖包缺失独立许可证正文、`Origin: null` 状态码与 iframe 加载期关闭等待）。

### `GEM-9e48510-00`（原 `M05-03` / `Opus M3-01`）| P1 | `9e485100dfe22e31a6894022f3664e971c4818b7`

- **文件:行号**：[simulation.ts:126-127](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/packages/oot-core/src/simulation.ts#L126-L127)、[simulation.ts:165-173](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/packages/oot-core/src/simulation.ts#L165-L173)、[economy.ts:9-10](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/packages/oot-core/src/economy.ts#L9-L10)、[training-counterfactual-1-100.json](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/harness/m5/training-counterfactual-1-100.json#L1-L32)
- **最小复现**：
  ```bash
  node harness/review-m5-gemini/verify-m5-gemini.mjs
  ```
- **预期/实际**：
  - **预期**：按 [M0.6_VALIDATION_PROTOCOL.md](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/docs/M0.6_VALIDATION_PROTOCOL.md#L33-L45) 与 [M0.7_PROTOCOL.md](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/docs/M0.7_PROTOCOL.md#L5-L15)，在保留全部平局的全样本分母、28 槽反事实窗口与样本量 `>= 30` 下，`declineStrictlyBetter >= 25%`（`0.25`）。
  - **实际**：训练集 `1–100` 全样本分母下仍为 `34 / 152 = 22.37% < 25%`（其中 `mood === 0` 分桶 28 次全平局 `0/28`；`mood in (0, 25)` 为 `9 拒绝胜 / 4 接受胜 / 75 平`；`mood in [25, 50)` 为 `25 拒绝胜 / 6 接受胜 / 5 平`；空闲角色从 `mood = 0` 恢复到 `40` 需 `14` 天）。在独占种子 `9501–9520`（20 局小样本诊断，不代替主门禁）中触发 27 次低心情 `tip` 分叉（`8 拒绝胜 / 2 接受胜 / 17 平 = 29.63%`，其中 `mood < 25` 占 `24/27` 且平局达 `17/24 = 70.8%`）。
- **影响**：角色跌入 `mood < 20`（产能 `0.6x` 地板）后，夜间仅恢复 `+3` 心情（[simulation.ts:169](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/packages/oot-core/src/simulation.ts#L169)），再扣除 `-5` 心情不会跨越更低的产能阈值，导致 28 槽窗口内大量分叉呈平局（`tie`），阻塞 M0.6–M5 经营数值放行。
- **证据**：[training-counterfactual-1-100.json](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/harness/m5/training-counterfactual-1-100.json#L2-L32)、[verify-m5-gemini-results.json:105-133](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/harness/review-m5-gemini/verify-m5-gemini-results.json#L105-L133)。
- **建议**：保持全样本分母与 25% 阈值不变（禁止通过删除平局或放宽阈值关闭）；在训练种子 `1–100` 上调整休息/恢复速度或极低心情（`< 10`）下的缺陷率/停工代价，使 `mood < 25` 区间拒绝高负荷小费具备可观测的 28 槽恢复收益，再解封正式队列验证。
- **置信度**：高（100%，实测确认）

---

### `GEM-9e48510-01` | P2 | `9e485100dfe22e31a6894022f3664e971c4818b7`

- **文件:行号**：[package-playtest.mjs:10-14](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/scripts/package-playtest.mjs#L10-L14)、[package-playtest.mjs:26-28](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/scripts/package-playtest.mjs#L26-L28)、[bundle-desktop.mjs:4-7](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/scripts/bundle-desktop.mjs#L4-L7)、[verify-playtest.mjs:3-5](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/scripts/verify-playtest.mjs#L3-L5)、[.gitignore:3-11](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/.gitignore#L3-L11)
- **最小复现**：
  ```bash
  node harness/review-m5-gemini/verify-m5-gemini.mjs
  ```
  （脚本第 2 节 `stalePackagingRepro` 在系统临时目录构造含 `Commit A` 与 `Commit B` 的干净 Git 仓库，保留 `Commit A` 的陈旧 `apps/web/dist/index.html` 与 `apps/desktop/target/debug/out-of-tokens-desktop.exe`，在不重新构建的情况下直接运行真实 `scripts/package-playtest.mjs --desktop` 与 `scripts/verify-playtest.mjs`）。
- **预期/实际**：
  - **预期**：`package-playtest.mjs` 与 `verify-playtest.mjs` 应拒绝将未随当前 `HEAD` 重新构建的陈旧 `apps/web/dist`、`apps/dsh/dist`、`packages/*/dist` 或陈旧 `apps/desktop/target/debug/out-of-tokens-desktop.exe` 绑定到新提交 `sourceCommit` 的 `manifest.json` 中；且当 `manifest.desktopIncluded === true` 时，`verify-playtest.mjs` 应强制校验 `desktop/out-of-tokens.exe` 等桌面产物存在。
  - **实际**：
    1. [package-playtest.mjs:10](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/scripts/package-playtest.mjs#L10) 仅检查 `git status --porcelain`。由于 [.gitignore:3-11](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/.gitignore#L3-L11) 忽略了 `dist/` 与 `target/`，`porcelain` 在 `dist/` 和 `target/` 陈旧时恒为空字符串 `""`。
    2. `package-playtest.mjs` 既不执行 `pnpm build` / `cargo build --locked`，也不校验 `apps/web/dist`、`apps/dsh/dist` 或 `out-of-tokens-desktop.exe` 内嵌的 `frontendDist` 是否对应当前 `HEAD`（实测 `packageExitCode = 0`、`verifyExitCode = 0`，生成的 `manifest.json` 声明 `sourceCommit = Commit B`，但 `web/index.html` 与 `desktop/out-of-tokens.exe` 实际绑定的是 `Commit A` 的陈旧字节）。
    3. [verify-playtest.mjs:4](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/scripts/verify-playtest.mjs#L4) 的必填文件列表仅检查 `['start.mjs','start.cmd','web/index.html','dsh/dist/index.js','dsh/dist/client.js','dsh/dist/content.json','dsh/cordis.patch.yml']`，即使 `manifest.desktopIncluded === true`，将 `desktop/` 目录及其 `manifest.files` 条目全部删空后，`verify-playtest.mjs` 仍以退出码 `0` 通过（`verifyPassesWhenDesktopDirDeletedFromManifest: true`）。
    4. 注：对主仓库已生成的固定包 `artifacts/out-of-tokens-9e48510` 实测确认，其 `desktop/out-of-tokens.exe`（SHA-256 `c070de24be8cb3c1981b4493a90ba30398b12b6dc50346efc1bbeffd162a1e46`）内嵌的 `index-B0s34IMX.js`、`index-CYME1d5y.css`、`flavor-worker-EJdz_56z.js` 与 `web/offline-assets.json`（`oot-alpha-cefaf60a30c2`）一致，固定包本身未发生陈旧二进制错绑，但打包与校验脚本存在该结构性漏洞。
- **影响**：后续任何代码提交后若漏跑 `pnpm build` 或漏跑 `cargo build --locked`（或先跑 `cargo build` 后跑 `pnpm build` 导致 Vite 产物更新而 Tauri 嵌入旧版 `web/dist`），打包与校验工具均会静默放行并签发带新 `sourceCommit` 的 `manifest.json`，破坏固定 SHA 审计链。
- **证据**：[verify-m5-gemini-results.json:48-58](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/harness/review-m5-gemini/verify-m5-gemini-results.json#L48-L58)。
- **建议**：
  1. 在 `package-playtest.mjs` 入口显式执行构建（或将当前 `HEAD` SHA 写入 `apps/web/dist/build-meta.json` 与 `apps/dsh/dist/build-meta.json`，并在 `bundle-desktop.mjs` 中校验 `out-of-tokens-desktop.exe` 二进制中包含相同的 `apps/web/dist/offline-assets.json` key 且 mtime 不早于 `apps/web/dist/offline-assets.json`）。
  2. 在 `verify-playtest.mjs` 中，当 `m.desktopIncluded === true` 时，强制要求 `desktop/out-of-tokens.exe`、`desktop/Cargo.lock`、`desktop/dependency-notices.json` 存在于 `m.files`，并校核 `desktop/out-of-tokens.exe` 内嵌的 `oot-alpha-<hash>` 与 `web/offline-assets.json` 一致。
- **置信度**：高（100%，最小复现已实测验证）

---

### `GEM-9e48510-02`（原 `GEM-b5d1365-01` 延续 + M5 无尽挑战扩展）| P2 | `9e485100dfe22e31a6894022f3664e971c4818b7`

- **文件:行号**：[simulation.ts:91](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/packages/oot-core/src/simulation.ts#L91)、[simulation.ts:99](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/packages/oot-core/src/simulation.ts#L99)、[events.ts:25](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/packages/oot-core/src/events.ts#L25)、[preview.ts:11-12](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/packages/oot-core/src/preview.ts#L11-L12)、[preview.ts:20](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/packages/oot-core/src/preview.ts#L20)
- **最小复现**：
  ```bash
  node harness/review-m5-gemini/verify-m5-gemini.mjs
  ```
- **预期/实际**：
  - **预期**：`resolve` 中的辅助岗位（`planner`/`tool`）预检、`overload` 事件卡触发条件以及 `estimateResources` 预览应与实际结算使用完全一致的 `effectiveVersion(s, c, actor, mode)` 及无尽周挑战过滤 `challengeAllows(s, c, version, mode)`。
  - **实际**（`9e48510` 实测确认仍完全开放，且在 M5 无尽模式下新增一处同类偏差）：
    1. **辅助岗位预检（[simulation.ts:91,99](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/packages/oot-core/src/simulation.ts#L91)）**：第 91 行 `const wv = version(c, wa)` 未传入 `s` 与 `w.mode`，导致预检忽略 Worker 的训练加成、`vllm` 与存储硬件 `storage`；同时第 99 行在 `m.role === 'tool'` 时仍对 Worker 预检乘以 `(1 + v.skills.reason * .015)`（Planner 专属加成）。实测当 `qwen`（`tool`, `cost = 27.72`）与 `llama`（`worker`, 实际 `cost = 24`）组队且 `localCapacity = 51.72`（恰好够 `27.72 + 24`）时，预检错误将 `llama` 成本算为 `26.16`（合计 `53.88 > 51.72`），导致 `qwen` 被无故跳过（`qwenWorkedWhenCapacityExact: false`）。
    2. **过载事件卡触发（[events.ts:25](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/packages/oot-core/src/events.ts#L25)）**：`a.load >= c.versions.find(v => v.id === a.version)!.context` 仍读取原始 `context`（忽略 `p.hardware.storage`）且使用 `>=` 而非 `>`。实测 `qwen` 基础 `context = 6`、升级 `storage = 2`（有效 `context = 8`）时，在 `load = 6`（未过载）即错误触发 `overload` 事件卡（`overloadEligibleWhenNotOverloaded: true`）。
    3. **资源预览（[preview.ts:11-12,20](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/packages/oot-core/src/preview.ts#L11-L12)）**：
       - 第 12 行 `effectiveVersion(s, c, ...)` 未传 `planner.mode`，导致本地 Planner 安装 `vllm` 时预览漏算 `1.3x` 推理加成；
       - **M5 新增不一致**：第 11 行 `planner` 与第 20 行 `tool` 仅检查 `attending(m.character)`，**未检查 `challengeAllows(s, c, a.version, m.mode)`**。当无尽模式跨周切换（如进入第 1 周 `challenge === 1` 全员本地）导致既有队伍中的云端 Planner/Tool 在 `resolve` 中被跳过时，`estimateResources` 仍将其加成计入 Worker 消耗（实测 `estWithDisallowedPlannerLocal = 26.52` vs 实际 `24`）。
- **影响**：Tool/Planner 在边界算力下无故停工且不报 `OutOfTokens`；购买存储硬件后仍提前触发过载事件；无尽周切换或本地 `vllm` 下 UI 资源预览与实际结算不一致。
- **证据**：[verify-m5-gemini-results.json:59-80](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/harness/review-m5-gemini/verify-m5-gemini-results.json#L59-L80)。
- **建议**：在下一引擎版本（递增 `engineVersion`）中统一：
  1. [simulation.ts:91](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/packages/oot-core/src/simulation.ts#L91) 改为 `const wv = version(c, wa, s, w.mode);`，第 99 行仅在 `m.role === 'planner'`（或已有 `bonus > 1`）时乘以 Planner 加成；
  2. [events.ts:25](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/packages/oot-core/src/events.ts#L25) 改为 `a.load > effectiveVersion(s, c, a, m.mode).context`；
  3. [preview.ts:11-12,20](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/packages/oot-core/src/preview.ts#L11-L12) 为 `planner` 与 `tool` 补齐 `challengeAllows` 过滤，并向 `effectiveVersion` 传入 `planner.mode`。
- **置信度**：高（100%，实测复现）

---

### `GEM-9e48510-03` | P2 | `9e485100dfe22e31a6894022f3664e971c4818b7`

- **文件:行号**：[finale.ts:49-55](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/packages/oot-core/src/finale.ts#L49-L55)、[simulation.ts:165-173](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/packages/oot-core/src/simulation.ts#L165-L173)、[campaign.ts:14-19](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/packages/oot-core/src/campaign.ts#L14-L19)
- **最小复现**：
  ```bash
  node harness/review-m5-gemini/verify-m5-gemini.mjs
  ```
  （脚本第 4 节 `expeditionNeedsAndScene`：在第 3 章派 `qwen` 前往 `paper` 纸片宇宙远征 16 槽，观察远征期间的场景归属、喂食响应及饥饿/心情变化）。
- **预期/实际**：
  - **预期**：按 [M5_RULES.md:9](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/docs/M5_RULES.md#L9)，远征角色处于“离岗”状态（出发已预扣费用与 20 精力）；在异世界远征期间，角色不应既被禁止进食/休息恢复，又在本地按每槽 `+3` 累积饥饿并在深夜因无法吃饭而连续扣减心情，且本地场景不应继续显示该角色在场。
  - **实际**：
    1. [finale.ts:53](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/packages/oot-core/src/finale.ts#L53) 仅设置 `a.busyUntil = s.absoluteSlot + w.slots`。
    2. 在远征的 8 / 12 / 16 槽期间，因 `a.busyUntil > s.absoluteSlot`，[simulation.ts:166](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/packages/oot-core/src/simulation.ts#L166) 跳过该角色的精力与夜间心情恢复，且玩家执行 `meal` 被 [campaign.ts:97](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/packages/oot-core/src/campaign.ts#L97) 拒绝（`ACTOR_BUSY`）；但 [simulation.ts:173](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/packages/oot-core/src/simulation.ts#L173) 仍无条件对所有 `s.actors` 每槽累加 `r.hunger = clamp(r.hunger + 3)`（16 槽远征固定暴涨 `+48` 饥饿），一旦 `hunger >= 80` 或 `stress >= 80` 即在每晚深夜扣减 `-5` 心情（实测 `qwen` 从 `hunger = 40, mood = 70` 出发，远征期间无法喂食，归来时 `hunger = 88, mood = 65, energy = 80`）。
    3. [campaign.ts:14-19](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/packages/oot-core/src/campaign.ts#L14-L19) `actorScene(s, a)` 未感知 `finale.expeditions`，导致正在异世界远征的角色在白天仍显示在 `workshop`、夜晚仍显示在 `library`/`canteen` 的 Pixi 场景与角色卡中。
- **影响**：长线远征（尤其第 4 章/回形针结局所需的 12 槽 `castle` 与 16 槽 `paper`）会使角色在完全无法通过 `meal` 干预的情况下陷入高饥饿与深夜扣心情惩罚，且 UI 场景展示与“异世界离岗远征”语义矛盾。
- **证据**：[verify-m5-gemini-results.json:81-92](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/harness/review-m5-gemini/verify-m5-gemini-results.json#L81-L92)。
- **建议**：在 `simulation.ts:173` 中对正处于 `s.campaign.finale?.expeditions.some(x => x.actor === a.id && x.until > s.absoluteSlot)` 的远征离岗角色免除本地每槽 `hunger + 3` 累加（或在远征归来时结算固定状态），并在 UI / `ViewModel` 中标识角色当前处于远征世界而非本地三场景。
- **置信度**：高（100%，实测复现）

---

### `GEM-9e48510-04`（`GEM-b5d1365-03` / `PWA-01` 复核 + `GEM-b5d1365-04` 非空档对账缺口）| P2 | `9e485100dfe22e31a6894022f3664e971c4818b7`

- **文件:行号**：[alpha-app.tsx:36,44](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/apps/web/src/alpha-app.tsx#L36)、[updates.ts:1-9](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/apps/web/src/updates.ts#L1-L9)、[vite.config.ts:11-12](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/apps/web/vite.config.ts#L11-L12)、[host-storage.ts:15-21](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/packages/oot-platform/src/host-storage.ts#L15-L21)、[use-game.ts:16-22](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/apps/web/src/use-game.ts#L16-L22)
- **最小复现**：
  ```bash
  node harness/review-m5-gemini/verify-m5-gemini.mjs
  ```
- **预期/实际**：
  - **预期**：
    1. PWA 在首次安装、单标签第二版更新及多标签并发打开时，状态与控制器切换应保持一致；
    2. DSH `HostSaves` 在网络超时/断连导致 `WRITE_UNCERTAIN` 后，即使宿主已存在历史存档（如 `manual-1` 或旧 `auto`），也应能在不强制丢弃内存进度的前提下完成只读 revision 对账。
  - **实际**：
    1. **`PWA-01`（部分修复，跨标签接管与预存 waiting 监听仍开放）**：
       - [updates.ts:1-9](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/apps/web/src/updates.ts#L1-L9) 已修复首次安装（`controlled === false` 时 `waitingUpdate` 返回 `null`）及单标签点击更新时的 `controllerchange` 订阅顺序。
       - 但在多标签场景下，若标签 B 打开时新 SW 已处于 `reg.waiting`（未触发新的 `updatefound` 事件），[alpha-app.tsx:36](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/apps/web/src/alpha-app.tsx#L36) 仅在 `reg.addEventListener('updatefound', ...)` 内挂载 `statechange`，未对初始已存在的 `reg.waiting` 挂载 `statechange`，也未在 `navigator.serviceWorker` 上挂载被动 `controllerchange` 监听。当标签 A 点击更新触发 `skipWaiting()` + `clients.claim()` 并删除旧版 `oot-alpha-*` 缓存（[vite.config.ts:11-12](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/apps/web/vite.config.ts#L11-L12)）时，标签 B 被新 SW 静默接管但不会自动重载（若标签 B 曾经历 `updatefound`，`observe()` 会将 `update` 置回 `null` 隐藏更新按钮却使页面继续运行已被删缓存的旧版 JS；若标签 B 打开时 `reg.waiting` 已存在，则 `update` 残留已激活的旧引用）。此外，两版真实浏览器 SW 更新尚未实测（见 [STATUS.md:53](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/docs/STATUS.md#L53)）。
    2. **Host 非空 Profile 下 `WRITE_UNCERTAIN` 对账限制与 `oot:checkpoint` 重复写**：
       - [host-storage.ts:16](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/packages/oot-platform/src/host-storage.ts#L16) `reconcileEmpty()` 解决了“全新空 Profile 首次写入超时后无法恢复”的死锁，且 [use-game.ts:18](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/apps/web/src/use-game.ts#L18) 保持了各手动槽独立 CAS `revision`（不盲刷未载入的手动槽）。
       - 但若宿主已有任意存档（例如 `manual-1` 有档，或 `auto` 已有旧档），此后一次 `write('auto')` 因网络超时进入 `WRITE_UNCERTAIN`（请求未到达服务端），调用 `reconcileEmpty()` 会直接抛出 `EXISTING_SAVE`（实测见 `nonEmptyProfileUncertainRecovery`）。此时唯一能清除 `this.uncertain` 的 `load(id)` 会调用 `session.importSave(row.text)` 覆盖玩家当前未保存的内存进度（除非玩家先点击“导出当前进度”再通过“导入文件”触发 `storage.read('auto')` 恢复）。
       - 另外在 `hosted` 模式下，[use-game.ts:17](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/apps/web/src/use-game.ts#L17) `send(cmd)` 每次成功后已执行 `await write('auto')`；当宿主关闭触发 `oot:checkpoint`（[use-game.ts:16](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/apps/web/src/use-game.ts#L16)）时，在 `await active.current` 完成后仍无条件再次执行 `run(() => write('auto'))`，导致同一状态被重复写入两次并额外轮转一次 `backup-1..5`。
- **影响**：多标签 PWA 更新时后台标签状态与缓存生命周期脱节；DSH 非空档下偶发网络超时后，玩家若直接点“载入”会丢失当槽未存进度；DSH 每次打开并关闭会多消耗一次备份轮转槽位。
- **证据**：[verify-m5-gemini-results.json:93-102](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/harness/review-m5-gemini/verify-m5-gemini-results.json#L93-L102)。
- **建议**：
  1. 在 [alpha-app.tsx:36](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/apps/web/src/alpha-app.tsx#L36) 中对初始已存在的 `reg.waiting` 同样挂载 `reg.waiting?.addEventListener('statechange', observe)`，并在 `navigator.serviceWorker` 上监听被动 `controllerchange` 以提示用户刷新或清理陈旧 `update` 状态；补齐两版真实浏览器 SW 回归。
  2. 为 `HostSaves` 提供只读同步目标槽位 `revision` 的对账操作（仅更新指定槽位的已知 `revision` 而不覆盖内存 `session`，若服务端 `revision` 已变化则明确提示玩家选择“载入服务端存档”或“确认以当前内存进度覆盖”），并在 `use-game.ts` 中记录 `dirty` 标志以避免 `oot:checkpoint` 对已保存状态重复写 `auto`。
- **置信度**：高（95%，源码与单元测试实测确认）

---

### `GEM-9e48510-05` | P3 | `9e485100dfe22e31a6894022f3664e971c4818b7`

- **文件:行号**：[main.rs:1](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/apps/desktop/src/main.rs#L1)、[bundle-desktop.mjs:7](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/scripts/bundle-desktop.mjs#L7)、[use-game.ts:7,17](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/apps/web/src/use-game.ts#L7)
- **最小复现**：
  ```bash
  node harness/review-m5-gemini/verify-m5-gemini.mjs
  ```
- **预期/实际**：
  - **预期**：Windows 桌面可执行文件在不依赖终端启动时应使用 GUI 子系统（或明确告知控制台窗口行为），且关闭原生窗口时不易丢失日内未达 `DayEnd` 的操作。
  - **实际**：
    1. [main.rs:1](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/apps/desktop/src/main.rs#L1) 配置了 `#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]`，但 [bundle-desktop.mjs:7](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/scripts/bundle-desktop.mjs#L7) 打包的是 `apps/desktop/target/debug/out-of-tokens-desktop.exe`（`debug` 构建，`debug_assertions` 为真）。实测 PE Header `Subsystem = 3`（`IMAGE_SUBSYSTEM_WINDOWS_CUI`），双击 `out-of-tokens.exe` 会同时弹出黑色控制台窗口，若玩家关闭该控制台窗口会直接强杀 WebView2 进程。
    2. 桌面端 URL 为 `index.html?desktop=1`（`hosted === false`），[use-game.ts:17](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/apps/web/src/use-game.ts#L17) 仅在 `DayEnd`（每 4 槽）或 `Restarted` 时自动保存 `auto`，关闭 Tauri 窗口不会触发 `auto` 存档。
- **影响**：Windows 桌面试玩时伴随额外控制台窗口，且在非日结时段直接关闭窗口重启会回退至上一日结存档。
- **证据**：[verify-m5-gemini-results.json:18-20](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/harness/review-m5-gemini/verify-m5-gemini-results.json#L18-L20)。
- **建议**：若继续分发开发构建，可将 `main.rs:1` 改为无条件 `#![windows_subsystem = "windows"]`（或改用 `--release` 构建），并在 `?desktop=1` 模式下与 `hosted` 一样在每次有效命令后自动写入 `auto` 槽。
- **置信度**：高（100%，PE 头与源码实测确认）

---

### `GEM-9e48510-06` | P3 | `9e485100dfe22e31a6894022f3664e971c4818b7`

- **文件:行号**：[bundle-desktop.mjs:10-18](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/scripts/bundle-desktop.mjs#L10-L18)、`artifacts/out-of-tokens-9e48510/desktop/dependency-notices.json`
- **最小复现**：
  ```bash
  node harness/review-m5-gemini/verify-m5-gemini.mjs
  ```
- **预期/实际**：
  - **预期**：随编译后的 Windows 二进制 `out-of-tokens.exe` 分发的第三方 Rust 依赖，应具备完整的许可证文本（或对缺失独立 `LICENSE` 文件的子包补充标准许可证全文/上游说明）。
  - **实际**：`Cargo.lock` 共 427 个 registry 包，其中 258 个在本地缓存提取了 `Cargo.toml`（覆盖 `cargo tree --target x86_64-pc-windows-msvc` 全部 236 个实际 Windows 依赖，缺失来源为 `0`），其余 169 个非本平台/未用包如实标记 `sourceAvailable: false`。但在 258 个已提取包中，有 **18 个包**（包括 `tauri@2.11.5`、`tauri-build@2.6.3`、`tauri-runtime-wry@2.11.4`、`webview2-com@0.38.2` [MIT]、`alloc-stdlib@0.2.4` [BSD-3-Clause]、`selectors@0.36.1` [MPL-2.0] 等）因上游发布的 `.crate` 目录内未包含独立 `LICENSE*` 文件，`dependency-notices.json` 中 `licenseFiles` 为空数组 `[]`，仅复制了含 `license = "..."` SPDX 标识符的 `Cargo.toml`。
- **影响**：二进制分发合规性上，这 18 个 crate 仅有 `Cargo.toml` 中的 SPDX 名称而无对应许可证正文文本（尽管同目录其他 crate 已包含 MIT/Apache-2.0 正文，但 `BSD-3-Clause` 与 `MPL-2.0` 仍需注意）。
- **证据**：[verify-m5-gemini-results.json:21-46](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/harness/review-m5-gemini/verify-m5-gemini-results.json#L21-L46)。
- **建议**：在 `bundle-desktop.mjs` 生成 `desktop/licenses/` 时，对 `licenseFiles.length === 0` 的已提取 crate 读取其 `Cargo.toml` 的 `license` SPDX 字段，并随包附带一份标准 SPDX 许可证全文汇总文件（涵盖 `MIT`、`Apache-2.0`、`BSD-3-Clause`、`MPL-2.0` 及 `selectors` 源码获取说明）。
- **置信度**：高（100%，实测清点确认）

---

### `GEM-9e48510-07`（原 `GEM-b5d1365-05` 延续）| P3 | `9e485100dfe22e31a6894022f3664e971c4818b7`

- **文件:行号**：[index.ts:28,34](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/apps/dsh/src/index.ts#L28)、[client.ts:16-19](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/apps/dsh/src/client.ts#L16-L19)
- **最小复现**：
  1. 向 `/out-of-tokens/api/saves` 发送带 `Origin: null` 请求头的请求；
  2. 在 DSH 客户端首次点击打开工坊（`frame.src = '/out-of-tokens/web/index.html?dsh=1'`）后、iframe 内 Preact 挂载完成前立即触发 `hide()`（或按 `Esc`）。
- **预期/实际**：
  - **预期**：`Origin: null` 应明确返回 `403 { error: 'FOREIGN_ORIGIN' }`；iframe 尚未完成首次挂载时关闭面板不应挂起 11 秒。
  - **实际**：
    1. `b5d1365` 中报告的备用入口按钮样式残留已在 [client.ts:14](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/apps/dsh/src/client.ts#L14)（`launch.style.cssText=''`）修复；
    2. 但 [index.ts:28](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/apps/dsh/src/index.ts#L28) 对 `Origin: null` 调 `new URL('null')` 仍抛出 `TypeError` 并落入 `catch` 返回 `400` 而非 `403 FOREIGN_ORIGIN`（无越权风险）；
    3. 若在 iframe 首次加载完成前触发 `hide()`，`postMessage({type:'oot:checkpoint'})` 被未就绪的 iframe 丢弃，`checkpoint()` 会等待完整 11 秒超时后返回 `false` 并阻塞关闭。
- **影响**：仅影响边缘状态码语义与首次打开即刻关闭时的 UI 响应等待，无安全越权或数据损坏。
- **证据**：[index.ts:28-34](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/apps/dsh/src/index.ts#L28-L34)、[client.ts:16-19](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/apps/dsh/src/client.ts#L16-L19)。
- **建议**：在 `index.ts:28` 先用 `URL.canParse(req.headers.origin)` 校验，失败直接返回 `403 FOREIGN_ORIGIN`；在 `client.ts` 中记录 iframe 已发送/接收就绪握手的标志，未就绪前关闭无需等待 11 秒超时。
- **置信度**：高（100%）

---

## 三、上一轮问题（`b5d1365`）逐项复核台账

| 问题 ID | `b5d1365` 级别 | `9e48510` 复审状态 | 核验结论与实测证据 |
|---|---|---|---|
| `Opus M3-02`（图书馆角色晚间无法吃饭） | P1 | **已修复（Fixed）** | [campaign.ts:113](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/packages/oot-core/src/campaign.ts#L113) 允许在 `canteen` 或 `library` 执行同价（¥30）`meal`（图书馆外卖），保留同场景、空闲、一槽占用与原子拒绝；[review-m3.test.ts:6-51](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/apps/sim-cli/review-m3.test.ts#L6-L51) 覆盖全部 12 名角色晚间进食可达性、5 类非法边界原子拒绝、命令重放及 `0.8.0` 旧档拒绝 |
| `Opus M3-01` / `M05-03`（加班/小费取舍） | P1 | **未修复 / 仍开放（Open）** | 全样本分母 `34 / 152 = 22.37% < 25%`，见 `GEM-9e48510-00` |
| `GEM-b5d1365-01`（有效属性不一致） | P2 | **未修复 / 仍开放（Open）** | `simulation.ts:91,99`、`events.ts:25`、`preview.ts:11-12,20` 均未修改，且在 M5 无尽模式下 `preview.ts` 新增 `challengeAllows` 漏检，见 `GEM-9e48510-02` |
| `GEM-b5d1365-02` / `WEB-03`（`BrowserSaves` 构造至 `useEffect` 之间同步拒绝窗口） | P2 | **已修复（Fixed）** | [storage.ts:35](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/packages/oot-platform/src/storage.ts#L35) 新增 `void this.db.catch(() => {});` 消化构造函数内的早期未监听拒绝，同时保留 `this.db` 拒绝状态供后续 `list()`/`read()`/`write()`/`close()` 消费者捕获；[storage-failure.test.ts:3-15](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/apps/web/storage-failure.test.ts#L3-L15) 与 `verify-m5-gemini.mjs` 独立进程实测 `unhandledRejection = 0` |
| `GEM-b5d1365-03` / `PWA-01`（SW 首次安装误报与激活监听顺序） | P2 | **部分修复（Partially Fixed）** | [updates.ts:1-9](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/apps/web/src/updates.ts#L1-L9) 修复了首次安装误报与单标签激活前订阅顺序（[updates.test.ts:3-16](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/apps/web/updates.test.ts#L3-L16)）；但跨标签 `clients.claim()` 被动接管、初始已存在 `reg.waiting` 时的 `statechange` 绑定及两版真实浏览器 SW 更新验证仍未完成，见 `GEM-9e48510-04` |
| `GEM-b5d1365-04`（Host 空档死锁、跨槽 CAS revision、关闭时等待 active Promise、卸载复用 checkpoint） | P2 | **部分修复（Partially Fixed）** | 1) [host-storage.ts:16](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/packages/oot-platform/src/host-storage.ts#L16) 新增 `reconcileEmpty()` 解决全空 Profile 死锁（[host-reconcile.test.ts:3-11](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/apps/web/host-reconcile.test.ts#L3-L11)）；2) [use-game.ts:16](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/apps/web/src/use-game.ts#L16) 在 `oot:checkpoint` 中先 `await active.current`；3) [client.ts:13,17,24](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/apps/dsh/src/client.ts#L13) 用 `checkpointFlight` 复用在途 Promise；4) 各手动槽保留独立 `revision` 不盲刷。但非空 Profile 下的 `WRITE_UNCERTAIN` 仍无法通过 `reconcileEmpty()` 解除，且 `oot:checkpoint` 在 `send` 后存在重复写 `auto`，见 `GEM-9e48510-04` |
| `GEM-b5d1365-05`（备用入口样式残留、`Origin: null`、CRLF） | P3 | **部分修复（Partially Fixed）** | [client.ts:14](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/apps/dsh/src/client.ts#L14) 已在挂载至 header corner 时清空 `launch.style.cssText = ''`；`Origin: null` 仍返回 400，见 `GEM-9e48510-07` |
| `M3-SON-01 / 02 / 03`（`STILL_CLARIFYING`、`Restarted`、`REPLAY_*` 错误提示映射） | P3 | **已修复（Fixed）** | [alpha-app.tsx:26,31](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/apps/web/src/alpha-app.tsx#L26) 已补齐中英文提示并将 `REPLAY_*` 映射为 `HASH_MISMATCH` |

---

## 四、架构、宿主、并发与 M4/M5 范围取舍专项审计

### 1. 纯净度与分层边界（`oot-core` / `oot-content` / `oot-platform` / `apps/*`）
- `packages/oot-core` 保持零运行时依赖与纯函数式确定性演进，无 `window`、`document`、`fetch`、`Date`、`Math.random` 或 Node I/O；新增的 [finale.ts](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/packages/oot-core/src/finale.ts#L1-L68) 完全通过 `dispatchCommand`（`action: 'expedition' | 'ending' | 'endless' | 'bid' | 'challenge'`）驱动，远征耗时按游戏时段（`absoluteSlot`）推进，不读取真实系统离线时钟。
- M4 新增的氛围文本层（[flavor.ts](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/apps/web/src/flavor.ts#L1-L24)、[flavor-worker.ts](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/apps/web/src/flavor-worker.ts#L1-L5)、[flavor-panel.tsx](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/apps/web/src/flavor-panel.tsx#L1-L13)）完全位于 `apps/web` 表现层：使用 FNV-1a + LCG 独立种子派生字符级 bigram 文本，在独立 Web Worker 中执行并设 500ms 超时回退模板，**不接触 `oot-core` 状态、Command、RNG 游标或账本**（[flavor.test.ts:5-14](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/apps/web/flavor.test.ts#L5-L14) 已验证）。
- 对话内容包 `parseFlavorPack`（[flavor.ts:5-12](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/apps/web/src/flavor.ts#L5-L12)）严格校验 `64 KB` 上限、`schemaVersion === 1`、`engine === '0.10.0'`、1–100 行、禁止未知字段、禁止 `< >` / 控制字符 / `http(s):` / `javascript:`，并强制将行 ID 命名空间化为 `${pack.id}:${line.id}`；仅在内存中生效，不污染经营存档。

### 2. M4 与 M5 范围取舍审核（工程实施 vs GDD 完整产品差距）
经逐条核对 [GDD-v0.1.md](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/docs/GDD-v0.1.md)、[M4_SCOPE.md](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/docs/M4_SCOPE.md)、[M5_RULES.md](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/docs/M5_RULES.md) 与 [M5_ACCEPTANCE.md](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/docs/M5_ACCEPTANCE.md)，以下工程取舍已在文档中如实披露，**只能作为工程检查点记录，不得视为完整 GDD 产品验收批准**：
1. **M4 边界**：实现了 Windows Tauri `2.11.5` 本地离线构建、Web Worker 字符级 bigram 微型文本模型与只读对话包（`schemaVersion: 1`）；**未实现** MB 级神经模型/WASM 权重、完整访客角色/委托/场景联动包 Schema、桌面透明挂机模式、macOS/Linux 打包安装器、Steam SDK/上架及微信小游戏适配。
2. **M5 对手工作室边界**：当前 [finale.ts:56-62](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/packages/oot-core/src/finale.ts#L56-L62) 实现的是第 2 章开放的**明示确定性规则合同竞标**（每次 ¥60，按隐藏需求/声望/研发/客户类型判定胜负并缩放报酬 `0.85x / 1.15x / 1.5x`，落标移除合同），**并非** GDD 中具备独立经营状态、主动抢单/压价 15% 或挖角的自主对手工作室系统。
3. **M5 战役与通关验证边界**：[finale-replay.test.ts:5-29](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/apps/sim-cli/finale-replay.test.ts#L5-L29) 使用的是合成夹具（`startingCash: 100000`、全技能 `10`、`workload: 1`）以验证第 0–4 章、竞标、远征、结局与无尽模式的 Command 状态机与重放闭环；**尚未在标准 `m5-1` 数值下验证第 0–4 章与五结局的自然通关可达性及平衡性**。
4. **剧情与文案边界**：`content/campaign/m5.json` 中的 60 段分角色双语剧情已消除英文版残留中文首句与重复正文（[finale.test.ts:61-66](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/apps/sim-cli/finale.test.ts#L61-L66)），但由 AI 主线程生成（[author-m5-stories.mjs](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/scripts/author-m5-stories.mjs)），**未经人工创作与文学编辑验收**；同时 `m2.json` 历史内容保持未改。

### 3. 独占种子队列 `9501–9520` 独立实测结果
- **M5（`0.10.0` / `m5-1`）重放确定性**：在 `9501–9520` 共 20 个种子上执行包含澄清、接单、派遣、时段推进、事件选择、晚间访问图书馆与 `meal` 外卖的命令序列，`save()` 与 `restore()` 状态哈希 **20/20（100%）完全一致**（见 [verify-m5-gemini-results.json:154-204](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/harness/review-m5-gemini/verify-m5-gemini-results.json#L154-L204)）。
- **基线策略与失败局完整保留**：在 `9501–9520` 上运行 60 天（240 槽）`value` 与 `random` 策略，`value` 策略 `20/20` 偿付存活（`0` 破产），`random` 策略 `8/20`（`40%`）破产（破产种子：`9502, 9509, 9510, 9511, 9512, 9515, 9517, 9519`，完整保留于 [verify-m5-gemini-results.json:140-153](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-9e48510/harness/review-m5-gemini/verify-m5-gemini-results.json#L140-L153)）。

---

## 五、分项验收结论矩阵

| 验收维度 | 当前状态 | 独立审查判定与阻塞原因 |
|---|---|---|
| **M4/M5 工程检查点（纯 Core 状态机、确定性回放、Tauri 离线编译、KB 氛围模型与对话包校验）** | **工程检查点成立（带 P2 缺陷）** | 22 文件 132 测试通过；固定包 `out-of-tokens-9e48510.zip`（901 文件）哈希与清单校验通过；但存在打包脚本可错绑陈旧构建（`GEM-9e48510-01`）、有效属性/无尽预览不一致（`GEM-9e48510-02`）、远征饥饿累加（`GEM-9e48510-03`）及 `PWA-01`/Host 非空档对账缺口（`GEM-9e48510-04`） |
| **M0.6–M5 经营数值验收** | **未通过（阻塞）** | `M05-03` P1 仍开放（全分母 `34/152 = 22.37% < 25%`），`M06-02`（贷款救援 `rescued = 0`）、`M06-03`（廉价单人 `solo = 0`）、`M3-06`（本地算力按槽 vs GDD 按天）及 M5 正常数值长局通关平衡均未验收，正式队列 `7001–8000` 保持封存 |
| **真实 DSH 宿主安装/共存/卸载验收** | **未完成（未验收）** | 仅完成可丢弃临时 Profile 契约测试；禁止也未在真实用户 DSH Profile 中安装验证 |
| **完整 M1–M5 产品验收（真人试玩 / 公测 / 人工剧情 / 全平台渠道）** | **未完成（未验收）** | 真人试玩 `0/10`、M2 外部公测未执行、60 段剧情为 AI 草稿未经人工编辑、MB 模型/完整联动包/透明挂机/Steam/微信未实施 |
