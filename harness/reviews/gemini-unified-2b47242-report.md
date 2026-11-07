# Gemini 统一独立复审报告：集成修复 + 现代 UI 美术 + AI Village 原版 Q 角色 + 试玩包与离线核验 (`2b47242`)

- **审查者**：Gemini（独立审查 worktree，单审查者统一复核技术、UI、原版 Q 角色美术、PWA/离线与试玩包）
- **审查日期**：2026-11-07
- **目标固定源码 SHA**：`2b47242f236683b540faa6b1885d6267cf98c9f7` (`feat: reuse AI Village original chibi characters and portraits`)
- **独立审查 Worktree 路径**：`D:\Documents\FeiyangChen\devApps\ai-game\out-of-tokens-review-gemini-2b47242`
- **独立审查 Worktree 检出基线 HEAD**：`2b47242f236683b540faa6b1885d6267cf98c9f7`
- **主工作区当前 HEAD**：`6683752a067598947d834992bbc7f8d84381f91c` (`docs: record original chibi package and unified Gemini review prompt`)
- **源 AI Village 仓库只读核对**：`D:\Documents\FeiyangChen\devApps\dsh_plugin` @ `f4c2ac633d5ad5e9ee0f7c2cd66bd1af9fc90352`
- **版本元数据**：`engineVersion = 0.11.0`，`contentVersion = m5-1`，视觉资源集 `ai-village-chibi-v1`
- **固定试玩包 ZIP**：`D:\Documents\FeiyangChen\devApps\ai-game\out-of-tokens\artifacts\out-of-tokens-2b47242.zip`
  - 字节数：`88,904,715` bytes
  - SHA256：`a4319d41c30b7d78653f47c56bcb1134e9bf3dcd0208af2abb0f8260e1ca90a6`
  - 文件数：`manifest.json` 受校验条目 `1296` 个，连同 `manifest.json` 自身共 `1297` 个文件
  - 桌面可执行文件 `desktop/out-of-tokens.exe` SHA256：`958b5f263edf8f31f3fbd9c2eed58afbc4596fc0421239d5d8c799bf479af35c`（PE `Subsystem = 2` 即 `IMAGE_SUBSYSTEM_WINDOWS_GUI`）

---

## 1. 结论先行（五项核心问题逐一回答）

> **总体工程与放行判定：本轮未发现新增 P0 或新增 P1 级代码崩溃/数据损坏缺陷，工程质量与美术还原度较 `9e48510` 基线显著提升；但发现了 4 项可复现的新增/遗留 P2 缺陷与 1 项 P3 缺陷，且历史 P1 经营平衡阻塞项（`M05-03`）、真人试玩（`0/10`）、M2 公测及多项已知开放项尚未关闭。因此本报告确认固定源码 `2b47242` 的大部分集成修复与原版 Q 角色复用有效，但不构成完整产品放行批准。**

### 1.1 上轮审阅修复是否通过独立复验？
- **大部分通过独立复验，但 `GEM-02`（辅助岗位属性与资源预估）仍存在 2 项边界偏差（1 项 P2、1 项 P3）**：
  - **独立验证通过（6 项）**：
    - `GEM-01`（P2 打包 provenance 与桌面产物强制校验）：`package-playtest.mjs` 与 `verify-playtest.mjs` 均已按干净 HEAD 强制重建并写入 `web/build-meta.json`、`dsh/dist/build-meta.json`、`desktop/build-meta.json`，回归测试含缺 `exe` 与伪造 `dirty/commit` 拒绝。
    - `GEM-03`（P2 远征位置与在途补给/单次结算）：远征中角色 `location === 'expedition'`，在途不追加本地饥饿/压力处罚，返程仅结算一次。
    - `GEM-04 Host`（P2 Host `WRITE_UNCERTAIN` 只读对账与 `oot:checkpoint` 去重）：`HostSaves.reconcile` 空档/非空档/已提交(`revision+1` 且字节一致)/外部冲突分流正确，不覆盖内存或盲刷手动槽；`savedAuto` 消除重复 `oot:checkpoint` 空转写入。
    - `GEM-05`（P3 桌面 GUI 子系统与逐命令自动保存）：`apps/desktop/src/main.rs:1` 无条件启用 `#![windows_subsystem = "windows"]`（实测 `out-of-tokens.exe` PE 头 `Subsystem = 2`），`use-game.ts:19` 在 `desktop` 模式下每次成功命令后写 `auto` 档。
    - `GEM-07`（P3 `Origin: null` 拒绝与 ready 前关闭无需空等 11 秒）：`apps/dsh/src/index.ts:28` 使用 `!URL.canParse(req.headers.origin)` 返回 `403`；`apps/dsh/src/client.ts:13,18-19` 在收到 `oot:ready` 前关闭立即跳过 11 秒超时等待。
    - `OP-01`（P2 第 0 章 56 槽后迟到补救）：`campaign.ts:37` 在 `s.absoluteSlot >= 56 && p.chapterZero !== 'passed'` 时持续按原条件（`liquidCash(s) >= 0 && delivered > 0`）重评。
  - **部分修复 / 复现仍存在（`GEM-02` 衍生出 `GEM-2b47242-01` [P2] 与 `GEM-2b47242-02` [P2/P3]）**：
    - 主线程已修复 `tool + worker`（无 `planner`）错乘 `planner` 加成、`events.ts:26` 过载严格大于号（`load > effectiveVersion(...).context`）、`preview.ts` 挑战角色过滤及 `planner.mode` 传入。
    - **但新增/遗留了两个问题**：
      1. **`GEM-2b47242-01`（P2）**：当同一委托同时派遣 `planner`（`order=0`）与 `tool`（`order=1`）时，`simulation.ts:88` 在遍历到 `tool` 时调用 `estimateResources(s, c, j)` 重新估算**整支队伍（含已执行完并扣减了算力的 `planner`）**的总消耗，并与已被 `planner` 扣减后的剩余 `local`/`quota` 比较。导致当初始可用算力介于 `[全队总消耗, 全队总消耗 + planner消耗)` 之间时，`tool` 被静默 `continue` 跳过且不触发 `OutOfTokens`。
      2. **`GEM-2b47242-02`（P3）**：当拥有 `prompt` 软件升级且委托 `progress === 0` 并含 `tool` 角色时，`preview.ts:21` 对全队所有角色（含 `planner` 和 `tool`）一律乘 `1.4`，而 `simulation.ts:81,129` 中 `planner`（`order=0`）与 `tool`（`order=1`）执行时 `toolReady` 仍为 `false`（仅获 `1.2x`）；此外 `preview.ts:21` 未先对 `units` 做 `round` 及剩余工作量截断再乘 `v.price`，造成 UI 预估与实际扣减存在偏差（如 `qwen` 预估 `34.93T` vs 实际 `29.96T`）。
  - **设计决策待评估（1 项）**：`OP-02`（违约罚款按基础报酬 30% 不乘竞标倍率）已在 `finale-panel.tsx:20` 明确向玩家披露，代码与文案一致。
  - **既有开放项保持开放（不得偷偷关闭）**：`M05-03`（P1 小费拒绝占优率 `22.37% < 25%`）、`GEM-06`（P3 18 个 Rust crate 缺独立许可证正文）、`OP-03`（P3 其余四结局自然长局可达性）均保持开放。

### 1.2 AI Village 原版 Q 角色是否正确复用？
- **原版资产字节级复用与身份还原通过验证，但 12 人多行同屏布局存在垂直碰撞缺陷（`GEM-2b47242-03` [P2]）**：
  - **字节级溯源与离线覆盖**：`art/ai-village-chibi-v1/manifest.json` 记录的全部 `179` 个文件（`25,455,059` bytes，含 12 个 `character.json`、141 张部件 PNG、12 张头像 PNG、12 个 `source-manifests/*.json`、`source-portraits-manifest.json`、`LICENSE.txt`）与源仓库 `D:\Documents\FeiyangChen\devApps\dsh_plugin` @ `f4c2ac633d5ad5e9ee0f7c2cd66bd1af9fc90352` 逐字节 SHA256 比对 **179/179 完全一致**；运行时 `166` 个文件全部列入 `offline-assets.json` 与 `sw.js` 预缓存，并在独立包 `web/` 与 `dsh/dist/web/` 中 **166/166 字节一致**。`.gitattributes` 已配置 `*.png binary` 与 `*.json text eol=lf`，保证跨平台重新检出后字节不变。
  - **目视身份核验**：逐一目视核验全部 12 张头像与场景渲染截图，确认 `DeepSeek`（蓝鲸女仆装+鲸尾+呆毛）、`Qwen`（蓝紫发贝雷帽原服饰）、`Llama`（奶白卷发羊驼耳与无限发夹）、`Mistral`（红金羽饰宽檐帽）以及 `GPT`、`Claude`、`Kimi`、`Gemini`、`Grok`、`GLM`、`MiniMax`、`Seedance` 全部为 AI Village 原版 Q 角色设计，无穿帮、无透明切边异常、桌面/椅背前后遮挡关系正确，四表情（`neutral`/`happy`/`surprised`/`sleepy`）切换及懒加载失败降级（`立绘未载入` / `Art unavailable`）均正常。此前重设计的 12 名角色已归档至 `art/studio-v1/retired-actors/`，运行时零引用。
  - **新发现的 12 人同屏布局缺陷 `GEM-2b47242-03`（P2）**：在 `apps/web/src/scene.ts:22-42` 中，多行布局行距 `step = unit`，而角色高度 `height = Math.min(compact ? 106 : 150, unit / 1.5)`，换算为工位局部坐标系后行距恒为 `225` 单位；但单个工位从头顶/气泡（`y = -144 ~ -148`）到底部状态文字（`y = +64 ~ +78`）及升级版本标签（`y = +80 ~ +92`，如 `R1`、`QWQ`、`LARGE`）的总垂直跨度达 `222 ~ 240` 单位。实测在 `1280×720`（2 行 × 6 列）和 `390×844`（3 行 × 4 列）12 人同屏夹具下，**第 2 行角色头顶/帽饰与第 1 行底部状态文字紧贴甚至重叠，并直接遮挡第 1 行角色的升级版本文字标签（`R1`、`QWQ`）**。

### 1.3 UI 主流程是否可用？
- **可用（通过真实 Chrome 浏览器端到端验证）**：
  - 自然游玩主流程（第 0 章车库开局 → 委托抽屉查看需求 → 选人澄清 → 同槽立即接单被 `STILL_CLARIFYING` 拦截 → 推进至下一时段接单 → 指派负责人/执行者并切换本地/云端模式 → 核对资源预估 → 推进触发非可关闭事件弹窗 `PendingChoice` 并决策 → 傍晚切换地图去食堂/图书馆并买外卖/学习 → 深夜进入 `data-night="true"` 犯困状态 → 委托进入 `待验收` 并完成交付结算）全程无报错（控制台错误 `0`，页面异常 `0`）。
  - 伙伴/委托/工作室/手账四抽屉、地图/存档/设置弹窗、中英文切换（`zh-CN`/`en`）、浅色/深色主题、减少动态效果（`data-motion="still"`）、键盘 `Escape` 关闭弹窗与抽屉并精确恢复焦点、桌面 `1280×720` 与手机 `390×844`（`scrollWidth === 390`，无横向溢出）、触控热区（导航栏 `78×64px`、HUD 工具按钮 `44×44px`、主推进按钮 `122×53px`，均 `>= 44px`）、Canvas 点击角色与 DOM 伙伴卡片等价入口、同引擎 `0.11.0` 存档兼容与旧 `0.10.0` 存档明确拒绝（`INCOMPATIBLE_SAVE`）均验证通过。

### 1.4 新包来源和离线是否可信？
- **独立试玩包（`out-of-tokens-2b47242.zip` + `start.mjs` 4173/4174）来源与离线完全可信；同时通过 2×2 正交对照实验彻底查明 `UI-OFFLINE-01`（`vite preview` 4182 停服刷新白屏）的精确根因（`GEM-2b47242-04` [P2]）**：
  - **独立包离线验证**：在短路径独立 Chrome Profile 下首次加载 `start.mjs` 激活 Service Worker（`cachedCount = 205`）后，彻底关闭 `start.mjs` 进程并开启 CDP `Network.setCacheDisabled(true)`（强制绕过浏览器 HTTP 磁盘/内存缓存，仅允许使用 Service Worker `CacheStorage`），执行页面刷新：页面完整渲染（`readyState = 'complete'`，`rootLength = 5095`，`<canvas>` 正常），23 个同源请求全部由 Service Worker 响应，离线推进时段、离线加载未访问角色（如 `kimi/character.json` 与部件 PNG）及离线读取手动存档均 100% 成功。
  - **`UI-OFFLINE-01` 根因定性（排除 `gzip` 猜测，确认为 `Vary: Origin` + `crossorigin` 子资源导致的 `Cache.match` 失配）**：
    - 我们构建了 2×2 正交对照实验（`harness/review-gemini-unified-2b47242/diagnose-offline-2x2.mjs`），在同一构建产物与独立短路径 Profile 下分别控制 `Vary: Origin` 与 `Content-Encoding: gzip` 两个变量：
      1. `Vary: Origin = OFF, gzip = OFF`（`start.mjs` 基线）：停服刷新 **成功**（`rootLength = 5095`，SW 命中 23 项，失败 0）。
      2. `Vary: Origin = ON, gzip = OFF`：**停服刷新白屏**（`rootLength = 0`，`index-D_WGnb_O.css` 与 `index-BmeNfrD9.js` 报 `net::ERR_FAILED`）。
      3. `Vary: Origin = OFF, gzip = ON`：停服刷新 **成功**（`rootLength = 5095`，SW 命中 23 项，失败 0）——**直接证伪 `gzip` 导致白屏的猜测**。
      4. `Vary: Origin = ON, gzip = ON`（`vite preview` 4182 行为）：**停服刷新白屏**（`rootLength = 0`，`index-D_WGnb_O.css` 与 `index-BmeNfrD9.js` 报 `net::ERR_FAILED`）。
    - **机理**：`vite preview` 默认 CORS 中间件为所有响应附加 `Vary: Origin`。SW `install` 阶段 `c.addAll(FILES...)` 发起的预缓存请求不含 `Origin` 请求头；而 `index.html` 中 `<script type="module" crossorigin src="./assets/index-BmeNfrD9.js">` 与 `<link rel="stylesheet" crossorigin href="./assets/index-D_WGnb_O.css">` 带有 `crossorigin` 属性，浏览器刷新请求这两个资源时会携带 `Origin: http://127.0.0.1:4182` 请求头。`sw.js:5` 调用 `c.match(e.request)` 与 `caches.match(e.request)` 时未传 `{ ignoreVary: true }`，按 Fetch Cache 规范因 `Vary: Origin` 不匹配（缓存项无 `Origin` vs 请求含 `Origin`）判定为缓存未命中，进而回退到 `fetch(e.request)` 并在离线时抛出 `net::ERR_FAILED`。

### 1.5 哪些风险仍阻塞产品放行？
1. **`M05-03`（既有 P1 阻塞项）**：训练集 seeds `1–100` 下小费拒绝严格占优率 `34/152 = 22.37% < 25%` 门槛，不能用历史 M0 统计代替当前 M5 规则下的 M2 Alpha 放行门槛。
2. **本轮新发现的 P2 缺陷（3 项）**：
   - `GEM-2b47242-01`（P2）：`simulation.ts:88` 在 `Planner + Tool + Worker` 组合下重复计入 `Planner` 算力，导致 `Tool` 在边界算力下被静默跳过。
   - `GEM-2b47242-03`（P2）：`scene.ts:22-42` 在 12 人同屏多行布局下，第 2 行角色头部与第 1 行状态文字/升级版本文字标签（`y=80`）发生垂直重叠遮挡。
   - `GEM-2b47242-04`（P2 / `UI-OFFLINE-01`）：`sw.js:5` 的 `c.match(e.request)` 未启用 `{ ignoreVary: true }`，在任何带 `Vary: Origin` 的静态服务器（如 `vite preview` 或开启 CORS 的 CDN/网关）下离线刷新会因 `crossorigin` 脚本/样式表失配而白屏。
3. **真人试玩与宿主实机未完成项**：10 人外部真人试玩（当前 `0/10`）、M2 Alpha 公开试玩、真实 DSH Profile 安装共存/卸载实测、桌面 `out-of-tokens.exe` 原生 WebView2 窗口交互实测（本轮已核验编译、PE GUI 子系统头及本机 WebView2 Runtime `157.0.4341.42` 存在，未做原生窗口交互冒烟）、`GEM-06`（18 个 Rust 依赖缺独立许可证正文）、`OP-03`（其余 4 个结局自然长局可达性）及剧情文本人工润色。

---

## 2. 环境、工作区核对、命令与退出码索引

### 2.1 主工作区与提交历史核对
- **主工作区路径**：`D:\Documents\FeiyangChen\devApps\ai-game\out-of-tokens`
- **分支与状态**：`codex/m1-foundation`，`git status --short` 为空（干净工作区）。
- **`2b47242..6683752` 差异核对**：仅含 `6683752a067598947d834992bbc7f8d84381f91c` 一个提交，修改范围严格限于 10 个文档/日志/Prompt 文件（`docs/ROADMAP.md`、`docs/STATUS.md`、`harness/build-log.md`、`harness/reviews/gemini-unified-2b47242-prompt.md`、`harness/village-chibi/package-*`），无任何源码或美术资产改动。
- **累计检查点演进核对**：
  - `9e485100dfe22e31a6894022f3664e971c4818b7`：上轮 M5 三模型审查基线。
  - `1bbebab1f2afedd6f89fdb741eb9d6375c89632f`：历史失败检查点（`apps/sim-cli/review-m5.test.ts` 误导入未导出的 `estimateResources`，失败记录完整保留于 `harness/ui-art/check-integration-v3.log`，未作为通过检查点）。
  - `d5f21bb7bb378aa71bdb76c03f312a9099406171`：审查修复有效检查点（改用 `getViewModel(s, c)`，23 文件 136 测试通过，记录于 `check-integration-v4.log`）。
  - `5b7e5effbe7fe2d3ee4f001dc08cf41a25590287`：现代工作室背景与场景优先 UI 检查点（25 文件 138 测试通过）。
  - `2b47242f236683b540faa6b1885d6267cf98c9f7`：本轮固定审查目标 SHA，切换为 AI Village 原版 12 名 Q 版角色与原版头像（25 文件 138 测试通过）。

### 2.2 运行环境与执行命令清单

| 序号 | 执行目录 | 命令 | 退出码 | 证据日志 / 输出文件 | 说明 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | 主仓库 `out-of-tokens` | `git status --short -b` / `git diff --stat 2b47242f236683b540faa6b1885d6267cf98c9f7..HEAD` | `0` | 终端记录 | 确认主工程后续提交仅含文档/Prompt/打包日志 |
| 2 | 主仓库 `out-of-tokens` | `git worktree add --detach ..\out-of-tokens-review-gemini-2b47242 2b47242f236683b540faa6b1885d6267cf98c9f7` | `0` | 终端记录 | 创建独立审查 worktree，保护主工程与旧 worktree |
| 3 | 审查 worktree | `corepack pnpm install --frozen-lockfile` | `0` | `harness/review-gemini-unified-2b47242/install-v1.log` | Node `v24.16.0` / pnpm `10.30.3` 恢复锁文件依赖 |
| 4 | 审查 worktree | `corepack pnpm check` | `0` | `harness/review-gemini-unified-2b47242/check-v1.log` | **25 个测试文件 / 138 项测试全部通过**，全量构建通过 |
| 5 | 审查 worktree | `Expand-Archive ... out-of-tokens-2b47242.zip` + `node scripts/verify-playtest.mjs ...` | `0` | `harness/review-gemini-unified-2b47242/package-verify.json` | 校验固定 ZIP（`88,904,715` B，SHA256 `a4319d41...`，`1296` 受控文件 + `manifest.json`） |
| 6 | 审查 worktree | `node harness/review-gemini-unified-2b47242/verify-core-and-assets.mjs` | `0` | `harness/review-gemini-unified-2b47242/verify-core-and-assets.json` | 独立复验 `REVIEW_M5_INTEGRATION` 全部条目 + `dsh_plugin` 179 文件 SHA256 + PE 头校验 |
| 7 | 审查 worktree | `node harness/review-gemini-unified-2b47242/verify-browser-gameplay.mjs` | `0` | `harness/review-gemini-unified-2b47242/verify-browser-gameplay.json` | 真实 Chrome 156 自然游玩主流程、无障碍、存档兼容与 12 人/远征/结局定向夹具验证 |
| 8 | 审查 worktree | `node harness/review-gemini-unified-2b47242/verify-pwa-and-offline.mjs` | `0` | `harness/review-gemini-unified-2b47242/verify-pwa-and-offline.json` | 跨标签冲突、12 人清晨同屏夹具、双构建 waiting 更新流与 `4173`/`4182` 对照 |
| 9 | 审查 worktree | `node harness/review-gemini-unified-2b47242/diagnose-offline-ab.mjs` | `0` | `harness/review-gemini-unified-2b47242/diagnose-offline-ab.json` | 独立端口 `start.mjs` (`4174`) vs `vite preview` (`4182`) 停服离线最小对照 |
| 10 | 审查 worktree | `node harness/review-gemini-unified-2b47242/diagnose-offline-2x2.mjs` | `0` | `harness/review-gemini-unified-2b47242/diagnose-offline-2x2.json` | `UI-OFFLINE-01` 的 `Vary: Origin` × `Content-Encoding: gzip` 2×2 正交实验 |

> **注：关于本机遗留进程的环境观察**：在执行脚本 8 时，我们发现本机 `127.0.0.1:4173` 端口自 `2026-11-07 21:28:24` 起已驻留有一个主线程此前启动的 `node start.mjs` 进程（PID `47664`）。为避免干扰主线程环境，我们未杀除该外部进程，而是在脚本 9（`diagnose-offline-ab.mjs`）和脚本 10（`diagnose-offline-2x2.mjs`）中使用干净独立端口（`4174`、`4185`–`4188`）执行了完整启停与连接销毁验证，确保 `serverDown === true` 后再测试离线刷新。

---

## 3. 上轮问题逐项复核状态（`REVIEW_M5_INTEGRATION` 及历史开放项）

| 编号 | 原级别 | 议题摘要 | 本轮独立复核状态 | 复核证据与结论说明 |
| :--- | :--- | :--- | :--- | :--- |
| **GEM-01** | P2 | `package-playtest.mjs` 未强制重编构建且未校验源码 provenance / 缺 `exe` | **主线程修复独立验证通过** | [package-playtest.mjs](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-2b47242/scripts/package-playtest.mjs#L1-L18) 强制校验干净工作区并执行 `pnpm build`，动态读取 `oot-core`/`oot-content` 版本，向 `web/`、`dsh/dist/`、`desktop/` 写入 `build-meta.json`（含 `commit: 2b47242f236683b540faa6b1885d6267cf98c9f7`、`dirty: false`）；[verify-playtest.mjs](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-2b47242/scripts/verify-playtest.mjs#L1-L26) 与 [package-verification.test.ts](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-2b47242/scripts/package-verification.test.ts#L1-L40) 已覆盖缺 `exe` 与伪造 `build-meta` 拒绝。 |
| **GEM-02** | P2 | 辅助角色（Planner/Reviewer/Tool）有效属性、本地 mode 预估、过载严格边界、无尽挑战过滤与 UI 预估一致性 | **复现仍存在（部分修复，遗留/衍生 `GEM-2b47242-01` [P2] 与 `GEM-2b47242-02` [P3]）** | **已修复部分**：① `tool + worker`（无 `planner`）在 [simulation.ts:99](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-2b47242/packages/oot-core/src/simulation.ts#L99) 不再误乘 `planner` 加成（实测 `local=68` 时 `qwen+llama` 正常完工）；② [events.ts:26](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-2b47242/packages/oot-core/src/events.ts#L26) 改为 `a.load > effectiveVersion(s,c,a,m.mode).context`（`load=8, context=8` 不误触发过载）；③ [preview.ts:11-18](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-2b47242/packages/oot-core/src/preview.ts#L11-L18) 已用 `challengeAllows` 过滤失效成员并向 `planner` 传 `planner.mode`。<br>**未修复/新增偏差**：① `Planner + Tool + Worker` 组合在 [simulation.ts:88](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-2b47242/packages/oot-core/src/simulation.ts#L88) 重复计入已执行的 `Planner` 算力导致 `Tool` 被无故跳过（见 `GEM-2b47242-01`）；② `prompt` 升级 + `tool` 在 `progress===0` 时 [preview.ts:21](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-2b47242/packages/oot-core/src/preview.ts#L21) 对 `planner`/`tool` 误按 `1.4x` 预估（实际为 `1.2x`）且未先对 `units` 舍入（见 `GEM-2b47242-02`）。 |
| **GEM-03** | P2 | 远征中角色仍按本地工作室日程去食堂/图书馆并承受饥饿/压力处罚 | **主线程修复独立验证通过** | [campaign.ts:15,43](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-2b47242/packages/oot-core/src/campaign.ts#L15) 在角色处于未领取远征时返回 `'expedition'`，晚间跳过本地饥饿 `+12` 与高饥饿心情扣减；8 槽返程仅结算一次（实测 `locDuring: 'expedition', hungerAfter: 40, moodAfter: 70`）。 |
| **GEM-04 Host** | P2 | Host `WRITE_UNCERTAIN` 恢复路径覆盖内存或盲刷手动槽；`oot:checkpoint` 重复写 `auto` | **主线程修复独立验证通过** | [host-storage.ts:53-68](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-2b47242/packages/oot-platform/src/host-storage.ts#L53-L68) 新增只读对账 `reconcile`/`reconcileEmpty`：空档返回 `EXISTING_SAVE` 保护、revision 不变返回 `committed: false`、revision+1 且字节一致返回 `committed: true`、内容不同抛 `SAVE_CONFLICT`；[use-game.ts:10,16](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-2b47242/apps/web/src/use-game.ts#L16) 通过 `savedAuto` 去重避免重复 checkpoint 刷满备份槽。 |
| **GEM-05** | P3 | 桌面端退出前未自动保存最新命令；Windows 调试构建弹控制台窗口 | **主线程修复独立验证通过** | [apps/desktop/src/main.rs:1](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-2b47242/apps/desktop/src/main.rs#L1) 顶层无条件声明 `#![windows_subsystem = "windows"]`，实测 `out-of-tokens.exe` PE Header `Subsystem = 2`；[use-game.ts:19](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-2b47242/apps/web/src/use-game.ts#L19) 在 `desktop` 为真时每次命令成功后写 `auto` 档。 |
| **GEM-06** | P3 | `dependency-notices.json` 中 18 个 MIT/BSD/ISC/Zlib Rust crate 缺少独立许可证正文文件 | **复现仍存在（已知开放 P3）** | 实测 `verify-core-and-assets.json` 中 `rustCratesWithoutLicenseFilesCount = 18`（含 `bitflags`、`bumpalo`、`cfg-if`、`core-foundation` 等 18 个 crate 的 `licenseFiles` 为空数组 `[]`）。主线程已在 `docs/STATUS.md` 如实登记为开放项。 |
| **GEM-07** | P3 | DSH API 在 `Origin: null` 时抛 `TypeError` 返回 `500`；`close()` 在 iframe ready 前固定等待 11 秒 | **主线程修复独立验证通过** | [apps/dsh/src/index.ts:28](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-2b47242/apps/dsh/src/index.ts#L28) 使用 `!URL.canParse(req.headers.origin)` 返回 `403`（实测 `Origin: null` 返回 `403`）；[apps/dsh/src/client.ts:13,18-19](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-2b47242/apps/dsh/src/client.ts#L13) 在收到 `oot:ready` 前调用 `close()` 立即返回（实测耗时 `< 5ms`）。 |
| **OP-01** | P2 | 第 0 章在第 56 槽 `missed` 后，后续偿清债务并交付仍永远无法推进到第 1 章 | **主线程修复独立验证通过** | [campaign.ts:37](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-2b47242/packages/oot-core/src/campaign.ts#L37) 在 `s.absoluteSlot >= 56 && p.chapterZero !== 'passed'` 时持续重评，实测槽 56 `missed` 后补齐净资金与交付可在槽 57 转为 `passed` 并解锁第 1 章。 |
| **OP-02** | P3 | 竞标合同违约罚款基于基础报酬 `t.reward` 30% 而非竞标倍率后报酬 `j.reward` | **设计决策待评估（UI 已如实披露）** | [simulation.ts:138](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-2b47242/packages/oot-core/src/simulation.ts#L138) 保持原公式，[finale-panel.tsx:20](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-2b47242/apps/web/src/finale-panel.tsx#L20) 已明确披露“违约时追回全部预付款，另按基础报酬30%罚款；罚款不随竞标倍率变化”。 |
| **OP-03** | P3 | 除 `acquired` 外的其余 4 个结局在自然长局中的可达性未验证 | **无法验证 / 仍开放 P3** | 遵守本轮不跑新统计批次与不占用封存种子队列的边界；单次特征谓词已由测试覆盖，自然长局策略可达性仍保持开放。 |
| **M05-03** | P1 | 训练集 seeds `1–100` 下小费拒绝严格占优率 `34/152 = 22.37% < 25%` 门槛 | **复现仍存在（已知开放 P1 阻塞项）** | 本轮未修改经营平衡规则，保持 P1 阻塞状态，不套用历史 M0 统计批准 M2 Alpha。 |

---

## 4. 本轮新发现与遗留缺陷详情（按严重度分级）

- **P0（阻塞依赖 / 崩溃 / 数据损坏）**：**0 项**
- **P1（相关模块下次集成前必修复）**：**0 项新增**（历史开放 P1 `M05-03` 见第 3 节）
- **P2（计划修复的功能/视觉/离线兼容性缺陷）**：**3 项**（`GEM-2b47242-01`、`GEM-2b47242-03`、`GEM-2b47242-04`）
- **P3（低优先级预估精度与合规建议）**：**1 项新增**（`GEM-2b47242-02`，历史开放 P3 `GEM-06`、`OP-03` 见第 3 节）

---

### [P2] `GEM-2b47242-01`：`Planner + Tool + Worker` 同队派遣时，`simulation.ts` 在 `Tool` 阶段重复计入 `Planner` 算力消耗，导致 `Tool` 在边界算力下被静默跳过

- **文件与行号**：
  - [packages/oot-core/src/simulation.ts](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-2b47242/packages/oot-core/src/simulation.ts#L78-L88)
  - [packages/oot-core/src/preview.ts](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-2b47242/packages/oot-core/src/preview.ts#L10-L24)
- **最小复现**：
  ```ts
  import { createInitialState, dispatchCommand, defaultCatalog } from 'oot-core';
  const c = defaultCatalog();
  c.events = [];
  c.balance.eventChance = 0;
  let s = createInitialState(c, 1);
  // 设全队总本地算力需求为 62.71（bluewhale planner: 12.3, qwen tool: 12.0, llama worker: 38.41）
  // 设 localCapacity = 68（大于全队总消耗 62.71，但小于 62.71 + 12.3 = 75.01）
  s.localCapacity = 68;
  s.jobs[0].status = 'working';
  s.jobs[0].work = 100;
  s.jobs[0].team = [
    { character: 'bluewhale', role: 'planner', mode: 'local' },
    { character: 'qwen', role: 'tool', mode: 'local' },
    { character: 'llama', role: 'worker', mode: 'local' },
  ];
  const r = dispatchCommand(s, { type: 'advance' }, c);
  console.log(r.state.resources.map(x => x.character));
  // 实际输出: ['bluewhale', 'llama'] —— 'qwen' (tool) 被无故跳过！
  ```
- **预期行为**：
  - 当可用本地算力（`68`）充足覆盖全队本槽总消耗（`62.71 = 12.30 + 12.00 + 38.41`）时，`planner`、`tool`、`worker` 三人均应正常执行并记录资源消耗，且 `worker` 应获得 `toolReady` 的 `0.85x` 成本减免。
- **实际行为**：
  - 在 [simulation.ts:78-88](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-2b47242/packages/oot-core/src/simulation.ts#L78-L88) 中，成员按 `order(m.role)` 排序执行：`planner`（`order = 0`）最先执行，并在第 102 行将 `local` 从 `68` 扣减为 `68 - 12.3 = 55.7`。
  - 随后循环进入 `tool`（`order = 1`），第 88 行再次执行：
    ```ts
    if (j.team.some(member => member.role === 'tool')) {
      const budget = estimateResources(s, c, j);
      if (budget.cloud > s.quota + s.purchased || budget.local > local) continue;
    }
    ```
  - 因为 `estimateResources(s, c, j)` 重新估算了**包含 `planner` 在内的整支队伍**总消耗（`budget.local = 62.71`），并将其与**已经扣除了 `planner` 消耗后的剩余 `local`（`55.7`）**比较，`62.71 > 55.7` 成立，导致 `tool`（`qwen`）命中 `continue` 被静默跳过（既不报错也不发 `OutOfTokens` 事件），接着 `llama`（`worker`）因已不在第 88 行拦截范围内（或当 `worker` 为云端而 `planner+tool` 为本地时）在无 `toolReady` 减免的情况下执行。
- **影响**：
  - 在任何同时包含 `planner` 和 `tool` 的队伍中，只要当前可用云端配额或本地算力处于 `[全队总需求, 全队总需求 + planner需求)` 区间内（本应 100% 够用），`tool` 角色都会被静默跳过，不仅吞掉 `tool` 的协助效果，还导致后续 `worker` 失去 `0.85x` Token 减免。
- **置信度**：**100%**（已在 `verify-core-and-assets.mjs` 中确定性复现，证据见 `verify-core-and-assets.json` 的 `gem02.plannerPlusToolBug`）。
- **自动回归与修复建议**：
  - 在 [simulation.ts:78](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-2b47242/packages/oot-core/src/simulation.ts#L78) 进入 `for (const m of [...j.team].sort(...))` 循环**之前**执行一次整队预算检查（或在估算剩余成员预算时排除本槽已执行完毕的 `planner`），并新增 `planner + tool + worker` 在 `localCapacity = 68` 下的单元测试断言三名成员全部执行。

---

### [P2] `GEM-2b47242-03`：12 人同屏多行布局（`2×6` / `3×4`）下，行距 `step` 小于含升级版本标签/气泡的工位垂直跨度，导致上下行角色头顶与文字标签重叠遮挡

- **文件与行号**：
  - [apps/web/src/scene.ts](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-2b47242/apps/web/src/scene.ts#L21-L42)
- **最小复现**：
  1. 在 `1280×720` 桌面视口或 `390×844` 手机视口下，令 12 名角色同时位于 `workshop`（清晨/下午工作时段）或 8 名以上角色同时位于 `canteen`/`library`，且第 1 行角色切换至升级版本（如 `bluewhale.r1`、`qwen.qwq`、`mistral.large`）。
  2. 查看生成的渲染画面（见证据截图 `screenshots/08-fixture-12actors-lab-1280x720.png`、`screenshots/09-fixture-12actors-lab-390x844.png`、`screenshots/10-fixture-12actors-canteen-1280x720.png`）。
- **预期行为**：
  - 多行工位之间应留有足够垂直间距，第 1 行工位底部的状态文字（`y = +64`）与升级版本文字标签（`y = +80`，如 `R1`、`QWQ`、`LARGE`）不应与第 2 行角色头顶、帽饰或工作气泡（`y = -144 ~ -148`）发生重叠遮挡。
- **实际行为**：
  - 在 [scene.ts:22-24](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-2b47242/apps/web/src/scene.ts#L22-L24) 中：
    ```ts
    const unit = Math.max(60, (h - (compact ? 210 : 170) - top) / rows),
          height = Math.min(compact ? 106 : 150, unit / 1.5);
    const startX = ..., firstY = rows === 1 ? h * .69 : top + height, step = unit;
    ```
  - 当 `rows >= 2` 时，`height = unit / 1.5`，工位缩放比为 `scale = height / 150 = unit / 225`，因此相邻两行的局部坐标垂直间距恒为 `step / scale = 225` 单位。
  - 然而在单个 `station` 局部坐标系中：
    - 第 2 行角色立绘根节点位于 `paper.root.y = 6`，缩放后可视高度为 `150`（头顶到达 `y = -144`），工作/低心情气泡位于 `y = -148`；换算到第 1 行坐标系，第 2 行头顶/气泡位于 `225 - 144 = +81`（或 `225 - 148 = +77`）。
    - 第 1 行角色的状态标签位于 `y = +64`（文字下缘延伸至 `~+78`），而升级版本标签（第 32 行 `label(station, ..., 0, 80, 9, 0x527b70)`）位于 `y = +80`（文字下缘延伸至 `~+92`）。
  - 因此，第 1 行的升级版本标签（`y = +80..+92`）完全落入第 2 行角色头部区域（`y = +81..+225`）内部，被第 2 行角色的头发/头饰直接遮盖（在 `08-fixture-12actors-lab-1280x720.png` 中，`DeepSeek` 下方的 `R1` 与 `Qwen` 下方的 `QWQ` 被第 2 行 `Kimi` 与 `Gemini` 的头顶遮挡；而在 `10-fixture-12actors-canteen-1280x720.png` 中，因第 2 行第 3 列为空位，才得以看到 `Mistral` 下方的 `LARGE` 标签）。
- **影响**：
  - 中后期招募超过 6 人（桌面端 `rows = 2`）或移动端初期 4 人（`390×844` 下 `cols = 3, rows = 2`）及后期 12 人（`rows = 3`）时，上下行工位视觉拥挤，升级版本文字标签与下排角色头顶/气泡发生重叠遮挡。
- **置信度**：**100%**（代码坐标计算与 `08`/`09`/`10` 三张实机渲染截图完全吻合）。
- **修复建议**：
  - 将升级版本标签整合进姓名铭牌（如 `DeepSeek · R1`）或置于桌面显示器侧上方，避免在 `y = +80` 处向下延伸；同时在 `rows >= 2` 时将 `height = Math.min(compact ? 96 : 135, unit / 1.75)`（使局部坐标行距从 `225` 扩大至 `262.5` 单位），即可彻底消除多行头顶与文字/气泡碰撞。

---

### [P2] `GEM-2b47242-04`（即 `UI-OFFLINE-01` 根因）：`sw.js` 缓存匹配未设置 `{ ignoreVary: true }`，在返回 `Vary: Origin` 的服务器（如 `vite preview` 4182）下因 `crossorigin` 脚本/样式表携带 `Origin` 头导致离线刷新白屏

- **文件与行号**：
  - [scripts/build-web.mjs](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-2b47242/scripts/build-web.mjs#L15-L21)
  - [apps/web/dist/sw.js](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-2b47242/apps/web/dist/sw.js#L5)
  - [apps/web/dist/index.html](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-2b47242/apps/web/dist/index.html#L2-L3)
- **最小复现**：
  - 运行 `node harness/review-gemini-unified-2b47242/diagnose-offline-2x2.mjs`（在同一构建产物、独立短路径 Profile 下对 `Vary: Origin` 与 `Content-Encoding: gzip` 进行 2×2 正交实验）：
    1. 启动 `vite preview --port 4182`（或任何在响应头中返回 `Vary: Origin` 的静态服务器），用全新短路径 Chrome Profile 打开页面，等待 Service Worker `activated` 且 `CacheStorage` 完整写入 205 个条目。
    2. 停止服务器进程，执行普通刷新（`Page.reload({ ignoreCache: false })`）。
- **预期行为**：
  - Service Worker 应从 `CacheStorage` 命中 `index.html`、`assets/index-*.js`、`assets/index-*.css` 及全部美术资产，离线正常渲染页面。
- **实际行为**：
  - `index.html` 导航请求虽由 `catch` 分支的 `c.match(new URL('index.html', self.registration.scope).href)` 兜底返回，但紧接着浏览器解析 `index.html` 中的：
    ```html
    <script type="module" crossorigin src="./assets/index-BmeNfrD9.js"></script>
    <link rel="stylesheet" crossorigin href="./assets/index-D_WGnb_O.css">
    ```
  - 因标签带有 `crossorigin` 属性，Chromium 发送子资源请求时附带了请求头 `Origin: http://127.0.0.1:4182`；而在 SW `install` 阶段，`c.addAll(FILES.map(f => new URL(f, self.registration.scope).href))` 发送的预缓存请求**不含 `Origin` 请求头**。
  - 当响应头包含 `Vary: Origin` 时，`sw.js:5` 中的 `await c.match(e.request)` 与 `await caches.match(e.request)`（未传 `{ ignoreVary: true }`）按 Fetch 规范比对缓存请求与当前请求的 `Origin` 头（`null !== 'http://127.0.0.1:4182'`），判定为 **缓存未命中（返回 `undefined`）**，随后进入 `await fetch(e.request)` 并在离线时抛出 `net::ERR_FAILED`，导致主脚本与样式表加载失败，页面白屏（`rootLength = 0`）。
- **影响**：
  - 独立试玩包自带的 `start.mjs` 不发送 `Vary: Origin`，因此 **玩家通过 `node start.mjs` 运行独立试玩包时离线功能完全正常**。
  - 但若开发者使用 `vite preview` 验收离线功能，或未来将 `web/` 部署到默认附加 `Vary: Origin` 的静态托管/CDN/反向代理上，PWA 离线刷新将必现白屏。
- **置信度**：**100%**（通过 `diagnose-offline-2x2.json` 2×2 正交实验完整证伪 `gzip` 假说并复现/消除故障）。
- **自动回归与修复建议**：
  - 在 [scripts/build-web.mjs](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-2b47242/scripts/build-web.mjs#L19) 生成 `sw.js` 时，将缓存匹配改为忽略 `Vary` 头：
    ```js
    const hit = await c.match(e.request, { ignoreVary: true });
    if (hit) return hit;
    const legacy = await caches.match(e.request, { ignoreVary: true });
    if (legacy) return legacy;
    ```

---

### [P3] `GEM-2b47242-02`：`preview.ts` 与 `simulation.ts` 在 `prompt` 软件升级 + `tool` 角色同队（`progress === 0`）及 `units` 舍入顺序上存在预估偏差

- **文件与行号**：
  - [packages/oot-core/src/preview.ts](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-2b47242/packages/oot-core/src/preview.ts#L19-L22)
  - [packages/oot-core/src/simulation.ts](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-2b47242/packages/oot-core/src/simulation.ts#L81-L86)
- **最小复现**：
  ```ts
  import { createInitialState, dispatchCommand, getViewModel, defaultCatalog } from 'oot-core';
  const c = defaultCatalog();
  c.events = []; c.balance.eventChance = 0;
  let s = createInitialState(c, 1);
  s.campaign.software.push('prompt');
  s.jobs[0].status = 'accepted';
  s.jobs[0].work = 100;
  s.jobs[0].progress = 0;
  s = dispatchCommand(s, {
    type: 'assign',
    job: s.jobs[0].id,
    team: [
      { character: 'qwen', role: 'tool', mode: 'cloud' },
      { character: 'llama', role: 'worker', mode: 'cloud' },
    ],
  }, c).state;
  const est = getViewModel(s, c).jobs[0].resourceEstimate.cloud; // 84.33
  const next = dispatchCommand(s, { type: 'advance' }, c).state;
  const actual = next.resources.reduce((acc, r) => acc + r.quota + r.purchased, 0); // 79.38
  // est = 84.33 vs actual = 79.38（偏差 +4.95T）
  ```
- **预期行为**：
  - UI 显示的“本槽无事件资源上限估计”应与无事件发生时 `simulation.ts` 实际结算的云端/本地消耗完全一致。
- **实际行为**：
  1. 在 [simulation.ts:81,129](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-2b47242/packages/oot-core/src/simulation.ts#L81) 中，`toolReady` 初始为 `false`，直到 `tool`（`order = 1`）执行完毕后才在第 129 行设为 `true`。因此当 `owns(s, 'prompt') && j.progress === 0` 时，`planner`（`order = 0`）与 `tool`（`order = 1`）执行时 `toolReady` 为 `false`，产能倍率为 `1.2x`；只有后续执行的 `worker`/`reviewer`（`order >= 2`）才享受 `toolReady = true` 的 `1.4x` 倍率。但 [preview.ts:21](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-2b47242/packages/oot-core/src/preview.ts#L21) 使用了静态布尔值 `const tool = j.team.some(...)`，对包含 `planner` 和 `tool` 在内的所有成员一律乘了 `1.4`（导致 `qwen` 预估 `34.93T` vs 实际 `29.96T`）。
  2. 在 [simulation.ts:81-86](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-2b47242/packages/oot-core/src/simulation.ts#L81-L86) 中，先计算 `units = round(rawUnits)`（且对 `worker` 受 `Math.min(units, round(j.work - j.progress))` 截断），再计算 `round(units * v.price * discount)`；而 [preview.ts:21-22](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-2b47242/packages/oot-core/src/preview.ts#L21-L22) 直接将未舍入的 `units` 乘以 `v.price` 后再 `round`，导致小数位舍入偏差（如开启 `vllm` 后本地预估 `25.74` vs 实际扣减 `25.72`）。
- **影响**：
  - 仅影响预估数值精度（差值约 `0.02 ~ 4.95`），不破坏存档或状态机安全性。
- **置信度**：**100%**（证据见 `verify-core-and-assets.json` 的 `gem02.promptPlusToolPreviewMismatch` 与 `gem02.localModePreview`）。
- **自动回归与修复建议**：
  - 在 `preview.ts:21` 中，仅对 `m.role === 'worker' || m.role === 'reviewer'` 在 `tool` 存在时应用 `1.4`（对 `planner`/`tool` 应用 `1.2`），并对 `units` 先执行 `round`（以及 `worker` 的剩余工作量上限截断）后再乘价格。

---

## 5. 实际 UI、原版 Q 角色资产、PWA 与独立包核验矩阵

### 5.1 AI Village 原版 Q 角色与现代背景资产核验（Section 3.B）

| 核验维度 | 核验方法 | 结果 | 关键数据与目视观察结论 |
| :--- | :--- | :--- | :--- |
| **源仓库 HEAD 与 179 条复制记录字节核对** | 对照 `D:\Documents\FeiyangChen\devApps\dsh_plugin` @ `f4c2ac633d5ad5e9ee0f7c2cd66bd1af9fc90352` 计算 SHA256 | **通过 (179/179)** | `art/ai-village-chibi-v1/manifest.json` 全部 179 条记录（`25,455,059` B）与源仓库字节级 SHA256 100% 匹配，无任何重绘或有损重压缩。 |
| **166 个运行时资源离线与多宿主一致性** | 比对 `offline-assets.json`、`sw.js`、独立包 `web/` 与 `dsh/dist/web/` | **通过 (166/166)** | 12 个 `character.json` + 141 张部件 PNG + 12 张头像 PNG + 1 个 `LICENSE.txt` 共 166 个运行时文件全部进入离线预缓存，Web 与 DSH 产物字节完全一致。 |
| **`.gitattributes` 跨平台字节保护** | 检查 `.gitattributes` 规则 | **通过** | 已配置 `*.png binary`、`*.webp binary`、`*.json text eol=lf`，防止 CRLF 转换破坏 JSON 哈希。 |
| **MIT 许可证保留与 UI 可达性** | 检查 `PAPER-DOLL-LICENSE.txt` 与 `art/ai-village/LICENSE.txt` | **通过 (HTTP 200)** | 设置弹窗底部提供 `PaperDoll · MIT` 与 `AI Village Q版角色` 两个链接，点击返回 `200 OK`，保留原作者 `LemonXH / AI Village contributors` 版权声明。 |
| **退役角色隔离核验** | 检查 `art/studio-v1/retired-actors` 与源码引用 | **通过** | 之前重设计的 12 名角色已移至 `art/studio-v1/retired-actors/`，运行时代码、构建产物与独立包均不再引用。 |
| **12 名原版 Q 角色目视身份与部件装配** | 逐张检视 12 张头像、部件 PNG 及 `01`/`03`/`08`/`09`/`10`/`11` 实机截图 | **通过（含 1 项多行间距 P2）** | `DeepSeek`（蓝鲸女仆装+鲸尾+呆毛）、`Qwen`（蓝紫发贝雷帽）、`Llama`（奶白卷发羊驼耳）、`Mistral`（红金羽帽）、`GPT`（白发角饰）、`Claude`（橙发向日葵发饰）、`Kimi`（银发月牙女仆头饰）、`Gemini`（紫发双星耳饰）、`Grok`（金黑双马尾蝴蝶结）、`GLM`（黑发猫耳女仆）、`MiniMax`（粉橙护士帽）、`Seedance`（蓝紫渐变发）身份特征鲜明，头身比统一，桌椅前后遮挡自然；四表情（`neutral`/`happy`/`surprised`/`sleepy`）切换正常。多行垂直间距存在 `GEM-2b47242-03` 重叠问题。 |
| **15 张现代场景与剧情插图 WebP** | 逐张目视检视 7 张场景 + 8 张远征/结局 WebP | **通过 (15/15)** | 5 章工作室（`garage`/`incubator`/`office`/`campus`/`lab`）+ `canteen` + `library` 共 7 张可切换场景；3 张远征（`slime`/`castle`/`paper`）+ 5 张结局（`independent`/`acquired`/`open-source`/`warm-shop`/`paperclip`）共 8 张插图仅在手账面板展示，未误作可步行场景。 |
| **12 人同屏解码耗时、纹理内存与包体积评估** | 统计 PNG IHDR 像素尺寸与 Chrome 实测解码耗时/JS 堆内存 | **已量化评估** | ① **解码与内存**：12 人共 141 张 PNG 部件（`23.72 MB` PNG），解压后 RGBA 纹理总计 `14,598,042` 像素 = **`55.69 MB` 显存/纹理解码内存**（其中 `bluewhale` 含 20 张高分辨率部件，占 `16.57 MB` RGBA / `5.69 MB` PNG；`mistral` 与 `glm` 各占 `6.46 MB` RGBA；其余 9 人各占 `2.55–3.17 MB` RGBA）。在 Chrome 156 下首次并发拉取并解码全部 12 人耗时约 `2.2–3.0s`，JS Heap 仅 `11.7–13.8 MB`。<br>② **ZIP 包体积（`88.9 MB`）合理性与优化建议**：原版 Q 角色 PNG 约 `24.3 MB`，因独立包内 `web/` 与 `dsh/dist/web/` 各存一份静态资源（`2 × 26.1 MB = 52.2 MB`）加上 `out-of-tokens.exe`（`1.49 MB`）与 `node_modules`（约 `35 MB`），总 ZIP 约 `88.9 MB`。符合“不擅自改画或重压缩替换母版”的要求；后续可在构建期让 `dsh` 直接复用顶层 `web/` 静态目录（立省 `~26 MB`），并对 `bluewhale`/`mistral`/`glm` 的超大分辨率部件提供可选构建期等比缩放到 `2x` 显示尺寸（不改母版的前提下可将 12 人 RGBA 显存从 `55.7 MB` 降至 `< 20 MB`）。 |

### 5.2 UI、玩法主流程、PWA 存储与宿主边界覆盖矩阵（Section 3.C & 3.D）

> **严格区分声明**：下表明确区分 **自然游玩（Natural Gameplay）** 与 **定向状态夹具（Deterministic Fixture）**。第 4 章实验室 12 人同屏、异世界远征、对手竞标、五结局与无尽模式截图均由定向状态夹具生成，仅用于验证 UI/美术渲染与状态机门禁，**不作为自然长局可达性证据**。

| 模块 / 场景 | 验证方式 | 结果 | 关键观测指标与证据索引 |
| :--- | :--- | :--- | :--- |
| **场景优先 HUD 与四抽屉导航** | 自然游玩 (`verify-browser-gameplay.mjs`) | **通过** | 顶部 HUD（地图/存档/设置 `44×44px`）、资源条（现金/云端额度/本地算力/声望）、底部四抽屉（伙伴/委托/工作室/手账 `78×64px`）与时段推进按钮（`122×53px`）布局清晰，见 `01-initial-workshop-1280x720.png`。 |
| **Canvas 角色点击与 DOM 等价入口** | 自然游玩 (`verify-browser-gameplay.mjs`) | **通过** | 直接点击 `<canvas>` 工位坐标 `(370, 480)` 成功弹出 `DeepSeek` 详情 `<dialog>`；从「伙伴」抽屉点击角色卡同样打开详情弹窗，大图头像 `128×128` 完整加载。 |
| **本地气泡与内容包 (`FlavorPanel`)** | 自然游玩 (`verify-browser-gameplay.mjs`) | **通过** | 开启气泡生成默认台词（`我们一件一件来。`），切换复古微型文本模型 Worker 正常生成台词（`我把月亮排进了日程。`），导入损坏 JSON 保持原状态并报错，全程零网络请求、不改动经营状态。 |
| **自然接单 → 澄清 → `STILL_CLARIFYING` → 派遣 → 事件 → 交付** | 自然游玩 (`verify-browser-gameplay.mjs`) | **通过** | 澄清消耗个人时段后同槽点接单被 `刚澄清过，下个时段才能接单。` 拦截；下一时段成功接单并配置 `planner(local) + worker(cloud)`；推进中触发非可关闭事件弹窗（无关闭按钮），决策后继续推进至 `待验收`（质量 `92`）并完成交付结算，见 `05-natural-delivered.png`。 |
| **晚间食堂/图书馆切换与外卖/学习** | 自然游玩 (`verify-browser-gameplay.mjs`) | **通过** | 傍晚通过地图切换至 `食堂`（`canteen.webp`）与 `图书馆`（`library.webp`），在图书馆点选 `吃饭/图书馆外卖 ¥30` 成功扣费恢复状态，见 `03-natural-canteen-evening.png`、`04-natural-library-evening.png`。 |
| **中英双语、浅深色、减少动态、键盘无障碍与 390px 布局** | 自然游玩 (`verify-browser-gameplay.mjs`) | **通过** | 切换英文（`lang="en"`）、深色（`data-theme="dark"`）、减少动态（`data-motion="still"`）立即生效；`Escape` 键关闭角色 `<dialog>` 焦点回到 `.actor-card`，再按 `Escape` 关闭 `.studio-drawer` 焦点回到导航按钮；`390×844` 视口下 `scrollWidth === 390` 无横向滚动条，见 `06-settings-en-dark-1280x720.png`、`07-natural-mobile-390x844.png`。 |
| **懒加载失败降级 (`scene.ts`)** | 故障注入 (`verify-browser-gameplay.mjs`) | **通过** | 从 `CacheStorage` 移除并用 CDP `Network.setBlockedURLs` 拦截 `qwen/character.json` 后刷新，Canvas 上 `Qwen` 工位显示 `立绘未载入`，其余角色立绘与下方全部 DOM 按钮正常可用，见 `12-lazy-load-fallback.png`。 |
| **12 人同屏（工作室/食堂/图书馆）与快速切景销毁重载** | **定向夹具 (`isFixture: true`)** | **通过（含 `GEM-2b47242-03` 间距重叠）** | 注入 12 人第 4 章夹具后，12 名原版 Q 角色在 `lab.webp`（`1280×720` 与 `390×844`）、`canteen.webp`、`library.webp` 全部正常加载且连续快速切换场景 5 次无 WebGL/Pixi 报错，见 `08`、`09`、`10`、`11` 截图。 |
| **竞标、异世界远征、五结局与无尽解锁** | **定向夹具 (`isFixture: true`)** | **通过** | 手账面板完整展示 3 张异世界插图与 5 张结局插图；派遣 `DeepSeek` 远征后其从工作室 Canvas 消失（剩 11 人）且伙伴卡片显示 `远征中`（见 `13-fixture-expedition-active.png`）；选择 `独立上市` 结局后展示结局插图并禁用「下一时段」（见 `15-fixture-ending-selected.png`），点击「继续无尽经营」后恢复推进并展示周挑战（见 `16-fixture-endless-mode.png`）。 |
| **存档兼容（`0.11.0` vs `0.10.0`）与跨标签冲突保护** | 真实浏览器双标签 (`verify-pwa-and-offline.mjs`) | **通过** | 导入 `0.10.0` 存档明确提示 `版本不兼容，请用原版本打开。` 并保持当前进度不变；导入 `0.11.0` 存档成功载入；连续跨日自动轮转生成 `backup-1`；Tab B 保存后 Tab A 立即通过 `BroadcastChannel` 收到 `另一窗口更新了存档，自动保存已暂停。请先载入最新档。`，载入最新档后恢复保存。 |
| **PWA 首次安装不误报 & 双构建 waiting 更新与旧标签懒加载** | 真实浏览器双构建双标签 (`verify-pwa-and-offline.mjs`) | **通过** | 首次安装激活 SW 时 `.update-chip` 为 `false`（不误报升级）；构建 B 进入 `waiting` (`installed`) 后 Tab 1 显示 `新版本可用 · 先保存进度`（见 `18-pwa-waiting-update-banner.png`）；激活更新后 Tab 2 被动收到 `controllerchange` 并显示更新提示；停服状态下未刷新的旧标签仍可从保留的旧缓存 `oot-alpha-a04dd989a348` 懒加载 `seedance` 资源（`status = 200`）。 |
| **SW 旧缓存保留策略与存储增长评估** | 检查 `sw.js` 与 `caches.keys()` | **已评估** | 当前 `sw.js` 刻意不在 `activate` 时删除旧版本 `CACHE`，以保证未刷新的旧标签页在后台升级后仍能通过 `caches.match(e.request)` 懒加载旧版 JS chunk 与美术资源。每个版本缓存约 `26.1 MB`（205 个文件）；单次试玩或少量版本迭代完全在浏览器配额（数 GB）安全范围内，但若长期频繁热更新会按 `~26 MB/构建` 线性增长。建议后续在 `activate` 中仅保留当前版本与最近 1 个旧版本缓存（最多保留 2 个 cache bucket ≈ `52 MB`），并在报告中如实记录当前未做自动回收。 |

---

## 6. 截图与证据文件完整索引

所有新生成的日志、脚本、JSON 数据与截图均保存在独立审查 worktree 的 `harness/review-gemini-unified-2b47242/` 目录下：

### 6.1 日志与结构化数据
- `harness/review-gemini-unified-2b47242/install-v1.log`：`corepack pnpm install --frozen-lockfile` 完整输出（退出码 `0`）。
- `harness/review-gemini-unified-2b47242/check-v1.log`：`corepack pnpm check` 完整输出（25 测试文件 / 138 测试通过，退出码 `0`）。
- `harness/review-gemini-unified-2b47242/package-verify.json`：独立解压 `out-of-tokens-2b47242.zip` 并运行 `scripts/verify-playtest.mjs` 的校验结果。
- `harness/review-gemini-unified-2b47242/verify-core-and-assets.mjs` & `.json`：`REVIEW_M5_INTEGRATION` 核心逻辑复验、`dsh_plugin` 179 文件 SHA256 核对、166 运行时资产离线覆盖、12 角色 PNG 像素/RGBA 显存统计及 `out-of-tokens.exe` PE 头校验结果。
- `harness/review-gemini-unified-2b47242/verify-browser-gameplay.mjs` & `.json`：真实 Chrome 自然游玩主流程、FlavorPanel、中英/深色/减少动态、键盘无障碍、`390×844` 移动端、`0.11.0`/`0.10.0` 存档兼容、懒加载失败降级与第 4 章定向夹具验证结果。
- `harness/review-gemini-unified-2b47242/verify-pwa-and-offline.mjs` & `.json`：手动/自动/备份轮转、跨标签冲突、12 人清晨同屏夹具、双构建 waiting 更新流与离线初步对照数据。
- `harness/review-gemini-unified-2b47242/diagnose-offline-ab.mjs` & `.json`：干净端口 `start.mjs` (`4174`) 与 `vite preview` (`4182`) 在确认 `serverDown: true` 后的离线刷新对照数据。
- `harness/review-gemini-unified-2b47242/diagnose-offline-2x2.mjs` & `.json`：`UI-OFFLINE-01` 的 `Vary: Origin` × `Content-Encoding: gzip` 2×2 正交实验完整证据。

### 6.2 实机截图索引（均已通过视觉工具逐张目视核验）
- `screenshots/01-initial-workshop-1280x720.png`：**[自然游玩]** 第 0 章开源车库初始画面（`1280×720`），展示 `DeepSeek`、`Qwen`、`Llama`、`Mistral` 四名 AI Village 原版 Q 角色、工位电脑与场景优先 HUD。
- `screenshots/03-natural-canteen-evening.png`：**[自然游玩]** 第 1 天晚上切换至 `食堂`（`canteen.webp`），展示餐盘道具与原版 Q 角色用餐工位。
- `screenshots/04-natural-library-evening.png`：**[自然游玩]** 第 1 天晚上切换场地与缺席提示文案。
- `screenshots/05-natural-delivered.png`：**[自然游玩]** 委托推进、事件处理与验收交付完成后的工作室状态。
- `screenshots/06-settings-en-dark-1280x720.png`：**[自然游玩]** 英文界面（`lang="en"`）+ 深色主题（`data-theme="dark"`）+ 减少动态（`data-motion="still"`）桌面端效果。
- `screenshots/07-natural-mobile-390x844.png`：**[自然游玩]** 手机端 `390×844` 视口深色英文布局（`scrollWidth === 390`，无横向溢出）。
- `screenshots/08-fixture-12actors-lab-1280x720.png`：**[定向夹具]** 第 4 章 `AGI 实验室`（`lab.webp`）清晨 12 名原版 Q 角色同屏（`1280×720`，2 行 × 6 列），直观复现 `GEM-2b47242-03`（第 2 行角色头顶遮挡第 1 行 `R1`/`QWQ` 版本标签）。
- `screenshots/09-fixture-12actors-lab-390x844.png`：**[定向夹具]** 手机端 `390×844` 下第 4 章 12 名原版 Q 角色同屏（3 行 × 4 列）。
- `screenshots/10-fixture-12actors-canteen-1280x720.png`：**[定向夹具]** 深夜 `食堂` 8 名原版 Q 角色同屏（展示 `sleepy` 闭眼表情与 `Mistral` 下方未受遮挡的 `LARGE` 版本标签）。
- `screenshots/11-fixture-12actors-library-1280x720.png`：**[定向夹具]** 深夜 `图书馆` 4 名原版 Q 角色（`Qwen`、`Claude`、`Kimi`、`GLM`）阅读台灯道具、闭眼休息表情与 `QWQ` 版本标签。
- `screenshots/12-lazy-load-fallback.png`：**[故障注入]** 拦截 `qwen/character.json` 后，`Qwen` 工位优雅降级显示 `立绘未载入`，其余三名角色与下方操作栏正常。
- `screenshots/13-fixture-expedition-active.png`：**[定向夹具]** 派遣 `DeepSeek` 前往异世界远征后，工作室画面仅显示其余 11 名本地角色（`DeepSeek` 状态为 `远征中`）。
- `screenshots/14-fixture-five-endings.png`：**[定向夹具]** 手账抽屉展开五个结局卡片与插图预览。
- `screenshots/15-fixture-ending-selected.png`：**[定向夹具]** 选择 `独立上市` 结局后展示大幅结局插图 `independent.webp`，底部「下一时段」按钮按规则禁用。
- `screenshots/16-fixture-endless-mode.png`：**[定向夹具]** 点击「继续无尽经营」后恢复时段推进按钮。
- `screenshots/17-offline-start-mjs-4173.png`：**[离线验证]** 独立包加载存档并推进时段后的渲染画面。
- `screenshots/18-pwa-waiting-update-banner.png`：**[PWA 双构建更新]** 新版本 Service Worker 进入 `waiting` 状态时，右侧浮现 `新版本可用 · 先保存进度` 提示按钮（`.update-chip`）。

---

## 7. 未执行项目与安全边界遵守说明

1. **未运行新种子统计批次**：严格遵守第 4 节规定，仅使用已见种子 `1` 与确定性定向夹具，未触碰 `7001–8000` 主线程未见封存队列或 `8101–8520` / `9001+` 等历史审查队列。
2. **未修改实际 DSH Profile / 未做破坏性桌面安装测试**：DSH 宿主集成通过契约测试、源码审查与构建产物核验完成，未修改用户本机真实 DSH Profile。
3. **桌面原生窗口交互未做自动化 UI 驱动**：已验证 `out-of-tokens.exe` 文件哈希、PE `IMAGE_SUBSYSTEM_WINDOWS_GUI (2)` 头、Rust 源码编译测试及本机 WebView2 Runtime（`157.0.4341.42`）安装状态；未在无头审查脚本中弹窗阻塞桌面。
4. **真人试玩与长期编辑项**：10 人外部真人试玩（`0/10`）、M2 Alpha 公测、剧情文本人工编辑润色仍待产品主线安排。
5. **主工作区与源仓库零污染**：主工作区 `D:\Documents\FeiyangChen\devApps\ai-game\out-of-tokens`、源仓库 `D:\Documents\FeiyangChen\devApps\dsh_plugin` 及所有历史审查 worktree 均保持原状未改动；临时解压目录与临时 Chrome Profile 均已清理。

---

## 8. 后续修复与放行优先级建议

1. **P1（阻塞 M2 Alpha 放行）**：
   - **`M05-03` 经营平衡复调**：在不破坏章节节奏的前提下微调小费合同或拒单机会成本，待主线程明确提出冻结统计协议后再用未见种子验证小费拒绝占优率 `>= 25%`。
2. **P2（下次集成提交前优先修复，改动极小且收益明确）**：
   - **修复 `GEM-2b47242-04`（`UI-OFFLINE-01`）**：在 `scripts/build-web.mjs` 生成的 `sw.js` 中为 `c.match(e.request, { ignoreVary: true })` 和 `caches.match(e.request, { ignoreVary: true })` 加上 `{ ignoreVary: true }`，彻底消除 `vite preview` 及带 `Vary: Origin` 服务器下的离线刷新白屏。
   - **修复 `GEM-2b47242-01`（`Planner + Tool` 算力重复计入）**：在 `packages/oot-core/src/simulation.ts:88` 将整队 `tool` 预算检查移至成员循环外（或仅检查尚未执行的成员），防止 `Planner` 扣减算力后误跳过 `Tool`。
   - **修复 `GEM-2b47242-03`（12 人多行工位垂直重叠）**：在 `apps/web/src/scene.ts:22,32` 将升级版本标签合并至姓名牌或上移，并在 `rows >= 2` 时略微缩小 `height / unit` 比例（如 `unit / 1.75`），消除第 2 行头顶与第 1 行底部文字重叠。
3. **P3（计划内完善）**：
   - **修复 `GEM-2b47242-02`**：对齐 `preview.ts:21` 与 `simulation.ts:81` 在 `prompt` 升级下对 `planner`/`tool` 的倍率（`1.2x` vs `1.4x`）及 `units` 舍入顺序。
   - **推进 `GEM-06`、`OP-03` 及构建体积优化**：补齐 18 个 Rust crate 的独立许可证文本引用；在 `sw.js` `activate` 阶段仅保留当前与上一版本缓存；后续打包可让 `dsh` 共享或按需引用 `web/art` 以缩减 ZIP 重复体积。
