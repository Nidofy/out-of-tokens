# M4/M5 独立复审报告（Sonnet）

- **固定审查目标（完整SHA）**：`9e485100dfe22e31a6894022f3664e971c4818b7`（分支 `codex/m1-foundation` 上的 M5 工程提交）
- **审查时实际 HEAD**：`9e48510`（detached，审查分支 `out-of-tokens-review-sonnet-9e48510`，报告与证据提交在其上；报告SHA见提交记录，不自引用）
- **主工程工作区**：`D:\Documents\FeiyangChen\devApps\ai-game\out-of-tokens`，主 HEAD `68d5996`，`git status` 干净。`git diff --name-status 9e48510..68d5996` 仅 12 个文件：`docs/STATUS.md`、`harness/build-log.md` 修改与 `harness/m5/package-*`、`harness/reviews/*prompt*` 新增，无实现改动，符合"仅新增 Prompt/交接记录"前提；未对主工作区做任何 reset/checkout/写操作。
- **审查 worktree**：`out-of-tokens\.agents\worktrees\out-of-tokens-review-sonnet-9e48510`（新建；同名旧 worktree 不存在，旧 worktree 全部未动）
- **环境**：Windows 10 (10.0.26200)、PowerShell 5.1.26100、Node v24.16.0、pnpm 11.25.0（corepack 0.35.0 shim，`packageManager` 字段解析）、git 2.54.0.windows.1、Chrome 156.0.8078.81（本地无头/有头实测）、WebView2 运行时（桌面实测，6 个子进程）。
- **审查性质**：独立只读工程复审。**主线程修复不因本报告视为审查批准；工程通过不等于经营/真人/真实宿主验收通过。**

## 一、命令与退出码汇总（证据：`harness/review-m5-sonnet/`）

| # | 命令 | 退出码 | 关键结果 | 日志 |
|---|---|---|---|---|
| 1 | `git status/log/worktree list`（主工程） | 0 | 主区干净；68d5996 仅文档+Prompt 超集 | — |
| 2 | `corepack pnpm install --frozen-lockfile`（worktree） | 0 | 168 包复用，3.5s | install-frozen-v1.log |
| 3 | `corepack pnpm check`（第1次） | **1** | 嵌套 `pnpm` 不在 PATH（我方装置问题，见§五） | check-attempt1-pnpm-not-on-path.log |
| 4 | `corepack enable --install-directory %APPDATA%\npm` 后 `pnpm check` | 0 | typecheck+lint+**22 文件 132 测试全过**+构建 | check-final-v2.log |
| 5 | zip 校验（PowerShell Get-FileHash） | 0 | 6203568 字节、SHA256 `88bfcf5d…1259` 与声明一致；条目 1101=199 目录+**902 文件** | 见§三 |
| 6 | `node harness/review-m5-sonnet/verify-package.mjs`（独立解压对账） | 0 | manifest 列 901 文件，**901/901 hash 全匹配**，缺 0、多出者仅 manifest.json 自身 | package-verify-sonnet.log |
| 7 | `node harness/review-m5-sonnet/check-stories.mjs` | 0 | 60 段剧情、12 角色×5、英文无中文字符、首句无重复、字段齐全 | stories-check.log |
| 8 | `node start.mjs`（包内服务器，后台） | 0 | `GET /` 200 | server-console.log |
| 9 | `node walk-core.mjs`（真实 Chrome CDP 走读） | 0 | 见§四 | walk-core-console.log、ui-walkthrough.jsonl |
| 10 | `node walk-fixup.mjs`（澄清/章节拒绝/吃饭/气泡复测） | 0 | 见§四 | walk-fixup-console.log |
| 11 | `node walk-packs.mjs`（对话包6用例+卸载+存档隔离） | 0 | 见§四 | walk-packs-console.log |
| 12 | SW 探针4个 + profile A/B | 0 | 见§五（我方装置根因定位） | sw-*.log |
| 13 | 停服后 `node walk-offline.mjs`（OOT_OFFLINE=1） | 0 | **离线重载+推进成功** | walk-offline-offline-v1.log |
| 14 | `desktop-test.ps1`（exe 启动/截图/Ctrl+R/关闭） | 0 | 见§四-7 | desktop-test.log |
| 15 | `node scripts/…` 模拟批次 | **未运行** | 本审查未消费任何训练/正式种子队列 | — |

审查者专属种子队列 9901–9920：**未消费**（本审查全部为 UI/包/测试级核验，无需种子）。

## 二、pnpm check 复现

`pnpm check` = typecheck + eslint + vitest + build，**22 个测试文件 / 132 个测试全部通过**，与主线程 `harness/m5/check-final-v1.log` 声明一致（0.10.0 / m5-1，含 finale、finale-replay、host 9 项、host-reconcile 等）。首次运行失败系我方 shell 无 pnpm shim（已留档），修复装置后通过，未触碰任何历史日志（m3/check-final-v3.log、validation-v3/v4、manifest 绑定日志均未读改）。

## 三、固定包核验（artifacts/out-of-tokens-9e48510.zip）

- 大小 6203568 字节 ✅；SHA256 `88bfcf5d3259c1dd8d91ab5504a8a013ab96068257ad462c8e860759c1611259` ✅（主工程 artifacts 下原件）。
- ZIP 条目 1101 = 199 目录 + **902 文件**；包内 `manifest.json` 列 **901** 文件、全部在盘、**901/901 SHA256 匹配**；第 902 个文件即 `manifest.json` 自身（打包脚本先遍历后写 manifest，`scripts/package-playtest.mjs:27-28`）。
- manifest：sourceCommit=目标SHA ✅、engineVersion=0.10.0 ✅、contentVersion=m5-1 ✅、businessApproved=false ✅、humanTesters=0 ✅、desktopIncluded=true ✅。
- 桌面 `out-of-tokens.exe` SHA256 `c070de24be8cb3c1981b4493a90ba30398b12b6dc50346efc1bbeffd162a1e46` 与 `harness/m5/package-results.md:7` 声明一致。
- 独立解压至 `harness/review-m5-sonnet/pkg-extract`（不入库），`node start.mjs` 启动、HTTP 200、页面标题 `Out of Tokens · 开源万事屋` 正常。
- **新包 PWA 离线实测（主线程本轮未做，本审查补齐）**：干净短路径 Chrome profile 下 SW 自动注册→`activated`→`controller=true`、缓存 `oot-alpha-cefaf60a30c2` 建立；**停止服务器后**（HEAD 探测确认不通）重载页面 `readyState=complete`、应用渲染（第 1 天·上午自动恢复）、离线推进时段成功（第 1 天·下午，提示"时段已推进。"）、对不存在文件 `fetch` 失败证明网络确断、壳层来自 SW 缓存。截图 27/28。

## 四、真实 UI 走读结果（Chrome 156，CDP 驱动 + DOM/AX 断言）

以下全部为真实浏览器操作（选择器点击/键盘/文件上传），证据为 `ui-walkthrough.jsonl`、`walk-*-console.log`、截图 `ui-shots/01–30`。**注**：本审查模型无图像输入，截图仅作存档；断言均取自 DOM/AX 求值文本。

1. **核心循环**：打开委托（邻里节导览词/小店收银界面方案）→ 澄清（Qwen 59%，揭示隐藏需求"特定交付格式 +2 WP"，扣1槽）→ 接单 → 选执行者/云端 → 确认派遣 → 推进 15 槽（其间 2 次随机事件弹窗均作选择）→ 待验收（质量 51.11）→ 验收结算。全链路提示逐级诚实（"安排好了。/委托操作已完成。"）。截图 01–06、17。
2. **食堂/图书馆外卖**：忙碌伙伴吃饭被诚实拒绝（ACTOR_BUSY"伙伴正在忙碌，请推进时段或换人。"）；图书馆找到 Qwen 后"吃饭/图书馆外卖 ¥30"成功（"安排好了。"）——M3-02 同价外卖修复在真实 UI 复验通过；错场景拒绝提示（ACTOR_ELSEWHERE"先去同一场景找伙伴。"）与源码一致。截图 07/08、18/19。
3. **存档/刷新/恢复**：manual-1 保存（"进度已保存。"）→ 刷新页面（新鲜自动档态）→ 载入 manual-1，**第 4 天·下午、现金 4726/4726、委托板逐项与存档前一致**；manual-2 在对话包挂载时保存、卸载并刷新后精确载入，同样逐字段一致（存档隔离）。截图 09–12、21–26。
4. **M5 面板诚实性**：第 0 章时点——五个结局按钮全部 disabled（`独立上市=true,…回形针彩蛋=true`）、竞标三路线按钮全部 disabled（第2章前）、远征按钮全部 disabled（第3章前）、周挑战不显示（未进无尽）；"确认章节目标"可点击但被规则拒绝：提示从"委托操作已完成。"变为"本章经营目标尚未完成。"且天数不变（CHAPTER_LOCKED，无代价拒绝）。面板文案明示各解锁条件与"失败失去该单/返程自动结算一次"等规则。截图 13。
5. **英文/剧情**：切换 English 后 `document.documentElement.lang=en`，委托板显示英文标题（Neighbourhood festival guide 等）。60 段剧情内容级核验：12 角色×5 段、英文正文与选项**零中文字符**、英文首句互不重复、字段（affinity/choices 效果）齐全；与 M5_RULES"英文不含中文首句"一致。
6. **390px / 键盘 / 读屏**：`Emulation.setDeviceMetricsOverride(390×844, mobile)` 重载后 `documentElement.scrollWidth=390=clientWidth`（**无横向溢出**，正文 body 同）；Tab 连续 10 次遍历顶栏→场景导航→角色卡→"推进时段"主按钮，均获焦；AX 全树 685 节点，场景容器有 aria-label（"当前场景；可通过下方角色卡操作"）、对话框有标题 aria-label、岗位/模式下拉有 aria-label。截图 15/16。
7. **桌面试玩**：包内 `out-of-tokens.exe` 启动 → 窗口 "Out of Tokens — Experimental"（1214×857）→ Ctrl+R 后进程与窗口仍在 → 6 个 `msedgewebview2.exe` 子进程（独立应用标识）→ 干净关闭。`tauri.conf.json`：`bundle.active=false`（开发构建，与 M4_SCOPE 声明一致）、窗口 `index.html?desktop=1`（源码中该参数跳过 SW 注册，与 web 行为隔离）。截图 29/30。**限制**：WebView2 无调试端口，桌面内 DOM 级保存/载入无法独立驱动；桌面加载与浏览器同一 `apps/web/dist` 产物（浏览器侧已验证存档链路），此限制如实记录，不冒充已验。
8. **Worker 开关**：开启气泡→模板文案（"我们一件一件来。"）；勾选"复古微型文本模型"→bigram 产物（"这朵云今天。"，出自自研语料风格）；关闭恢复正常。500ms 超时/异常回退路径无法在快 Worker 下从 UI 直接观测，回退逻辑由 `apps/web/flavor.test.ts`（本审查 check 中通过）与源码 `flavor-panel.tsx:7-9`（`setTimeout(500)`+`onerror`→模板）支撑，标注为**代码+单测验证、UI 观测为即时成功**。
9. **对话包六用例**：坏 JSON / 超大(>64KB) / HTML 注入 / 重复行 ID / 旧引擎(engine=0.9.0) 全部被拒（状态"内容包无效，保留当前包。"，此前合法包不被破坏）；合法包（schemaVersion=1、engine=0.10.0）导入成功（"sonnet-review · sonnet-reviewer · MIT"）且气泡输出改为包行；"卸载内容包"清空状态；**刷新后包不持久化（仅内存）**；挂包期间保存的经营档在卸载+刷新后精确恢复——"卸载包不影响经营存档"成立。截图 21–26。

## 五、本审查装置的自我纠错记录（透明性）

1. `pnpm check` 首次 exit 1：嵌套脚本找不到 `pnpm`（corepack shim 未装）。装 shim 重跑通过；失败日志已留档，未删改。
2. SW 首测"未注册"：根因为我方 Chrome `--user-data-dir` 位于超长证据目录路径，Windows 路径长度限制使 CacheStorage 报 "Unexpected internal error"、SW install→redundant。**A/B 对照**（`sw-profile-location-test.log`）：TEMP 与 D 盘短路径 profile 下包的 SW 均正常 `activated+controlled`。结论：**环境装置问题，非包缺陷**；顺带的 P3 观察见下。其间一次端口复用了残留旧实例，清场后复测（sw-ready-check-v3.log）。
3. 存档对话框行选择器两次误选（首按钮文本过滤），导致一次实际载入 backup-1；已用行首 `manual-2` 精确匹配复测（exact-load-manual2）。误操作本身不构成工程缺陷，且反向证明备份槽可载入。

## 六、发现清单（P0–P3）

**P0：无。**
**P1：无新增。**（既有 M05-03 P1 维持开放，见§七）

### P3-SON-M5-01 包"901文件"与 ZIP 实际 902 文件的口径差
- 文件行：`harness/m5/package-results.md:5`（"manifest901文件"）、`harness/m5/package-verify-9e48510.log:3`（verifiedFiles:901）、`scripts/package-playtest.mjs:27-28`
- 最小复现：`[IO.Compression.ZipFile]::OpenRead(zip).Entries | ? {$_.Name -ne ''} | measure` → 902；`node verify-package.mjs` → manifestListedFiles=901、notInManifest=["manifest.json"]。
- 预期/实际：声称 901 文件；ZIP 实含 902（manifest.json 自身不计入清单，hash 校验 901/901 全过）。
- 影响：极小（文档口径）；不影响完整性校验有效性。
- 建议：表述为"manifest 校验 901 文件（另含 manifest.json 自身，共 902）"。
- 置信度：高（本机实测+脚本源码双重确认）。

### P3-SON-M5-02 深路径自定义 Chrome profile 下 CacheStorage/SW 失效（环境观察）
- 文件行：包内 `README.txt`（无解压路径建议）
- 最小复现：`--user-data-dir` 指向 ≥约125 字符路径时 `caches.open` 抛 "Unexpected internal error"、SW 安装 redundant；短路径正常（A/B 日志）。
- 预期/实际：包本身在常规用户默认 profile 下正常；仅测试者自定义深路径 profile 受 Windows 长度限制。
- 影响：测试者复现 PWA 项时的注意事项；非包缺陷。
- 建议：复审/试玩 SOP 注明自定义 profile 用短路径。
- 置信度：高（现象稳定复现且 A/B 定位）。

（桌面 `bundle.active=false` 为已声明的开发构建边界，不列为发现；PWA 两版真实更新对照、Host 并发关闭/卸载的完整浏览器回归仍按 M5_ACCEPTANCE:9 留待后续复审，本审查未宣称关闭。）

## 七、边界与声明核对（审查取舍，不默认批准）

- **M05-03 P1 开放确认**：`harness/m5/training-counterfactual-1-100.json` 独立复算：分母 152=28+88+36（零/低/中三桶全保留，未删平局），拒绝严格占优 34/152=**22.37%<25%**；nonTieDeclineShare 低桶 0.692、中桶 0.806；低心情日占比 0.1945；空闲 0→40 需 14 天——与 M5_RULES:14 逐项吻合。本审查未运行任何新批次，未触碰 7001–8000（仍封存）、未复用 8101–8520/9001–9020/9101–9300/9401–9420。
- **未验收项与声明一致**：真人试玩仍 0/10（manifest humanTesters=0）；公测、真实 DSH Profile 安装/共存/卸载（本审查未触碰任何真实 Profile，`apps/dsh/host.test.ts` 9 项契约测试在独立 check 中通过，但**不等同真实 DSH 共存**）；M4 为 KB 级字符 bigram（源码 `flavor.ts` 语料 8 句、无模型下载/API）；对话包≠完整访客资源包；M5 对手为明示确定性条件的合同竞标（每单一次、失败移除、胜出仍需自行接单），非自主对手经营/挖角/递归竞价；60 剧情为 AI 分线草稿，未经人工编辑（内容核验仅证明结构与双语纯度，不构成创作质量验收）。
- **历史不冒充**：旧 b5d1365 包与旧 worktree/日志未读改；本轮离线证据来自**新包**（新解压、新服务器进程、新 profile）。
- 版本一致性：引擎 `engineVersion='0.10.0'`（version.ts）、M2 历史 `loadAlphaContent` 仍钉 `m2-1`、M5 叠加为 `m5-1`（oot-content/src/index.ts:15-23），与声明一致。

## 八、结论

固定目标 9e48510 的工程声明在本独立复现中**全部成立**：frozen install+check（22/132）、固定包字节与 hash 与 manifest 全量校验、真实浏览器全流程走读、M5 入口诚实门控、对话包安全边界与存档隔离、**新包 PWA 停服离线（本轮补齐主线程缺口）**、桌面 exe 冒烟。未发现 P0/P1 新缺陷；两条 P3 为文档口径与环境注意事项。**本报告不构成经营放行（M05-03 仍开放）、真人试玩、公测或真实 DSH 共存的验收批准。**

## 附：证据索引（harness/review-m5-sonnet/）

install-frozen-v1.log、check-attempt1-pnpm-not-on-path.log、check-final-v2.log、toolchain.txt、verify-package.mjs、package-verify-sonnet.log、check-stories.mjs、stories-check.log、server-console.log、cdp.mjs、walk-core.mjs/.log、walk-fixup.mjs/.log、walk-packs.mjs/.log、walk-offline.mjs（online-v2/offline-v1）、sw-probe*.log、sw-deep*.log、sw-addall-console.log、sw-profile-location-test.log、cachestorage-baseline.log、sw-ready-check*.log、desktop-test.ps1/.log、pack-fixtures/（6 个样本）、ui-shots/01–30（截图，未经人眼复核）、ui-walkthrough.jsonl（逐步 DOM 断言）
