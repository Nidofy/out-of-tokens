# 《Out of Tokens》1108 复审报告 —— 玩法 · UI · 视觉 · 美术

| 项目 | 内容 |
|---|---|
| 审查者 | GLM 5.3 Flash（glm-5.3-flash via DeepSeek Harness） |
| 审查时间 | 2026-11-08 10:17–11:00（Asia/Shanghai） |
| 审查对象 | `ai-game/out-of-tokens`，分支 `codex/m1-foundation`，HEAD `1b68b18`（工作区干净；自上轮审查基线 `6683752` 以来共 6 个功能/记录提交：61b2433 → 3465dd3 → 5fffb05 → 8b2770c → a523679 → fa53ea2 → f311fcb → f9d27af → 67bc3ca → 1b68b18） |
| 基准文档 | `docs/GDD-v0.1.md`（产品基准）+ 上轮三份 1107 review + `docs/REVIEW_1107_INTEGRATION.md` + `docs/PRODUCTIZATION_A2/A3_A6/B.md` + AGENTS.md |
| 审查方式 | **静态全文审查 + 实机浏览器验证**：逐行阅读 `apps/web/src` 全部 26 个文件（alpha-app/scene/scene-layout/village-characters/paper-doll/onboarding/project-panel/decision-panels/character-profiles/player-labels/use-game/tokens.css/style.css 等）与 `packages/oot-core` 本轮全部改动（projects/chapter-goal/settlement/jobs/preview/simulation/campaign/model diff）；阅读 `commissions-b1.json`、`projects-b1.json`、`m5.json` 全量并脚本化统计隐藏需求分布；**用 Chrome 156 无头浏览器在 1280×720 实机运行 Vite dev 构建**，实拍 15 张界面截图（见 `shots/`），覆盖主场景、看板、地图、四个抽屉、委托详情、角色档案、四档光照深夜档、12 人场景实验室、深色模式；捕获期间浏览器 console/page-error 全程为空。 |
| 诚实声明 | 我**没有**重跑 `pnpm check`（仓库记录为 31 文件 173 测试通过，非本次复现）；**没有**导入存档实测第 1 章项目面板的运行态（`project-panel.tsx` 为纯静态审查；`PRODUCTIZATION_B.md` 自带 IAB 4 步实测记录，我未重复）；破产界面的深色模式可读性问题为**代码推断**，未实际触发破产复现；390px 移动端与英文界面**未**在本轮重测（仓库记录通过，标记为「仓库记录，未复验」）。所有行号基于 HEAD `1b68b18`。截图为 dev 构建实拍，生产构建差异未覆盖。 |

---

## 一、总体结论

> **上一轮（1107）提出的用户 8 点反馈已全部有工程落地（多数为文档自认的「第一版」），并且 Productization A/B 把第 0→1 章串成了一条真实的玩法闭环：声明式开局 → 精选前 7 天委托 → 范围协商 → 双路线大订单 → 多期交付与客户回信 → 同源章节目标 → 融资路演。玩法骨架的质量明显高于上轮。当前最大的短板已经从「缺体验骨架」转移到两个新位置：① 视觉一致性——暖木 re-theme 只改了 CSS 变量，旧青绿色硬编码与新色在级联中互相打架，并已产生一个可截图复现的 hover 变色 bug；② 任务流信息缺口——接单前看不到截止时间与工期预估，玩家仍在「盲接」。**

三层判断：

| 层面 | 状态 | 说明 |
|---|---|---|
| 上轮 8 点反馈落实 | ✅ 全部有落地（6 项完整、2 项第一版） | 见 §二 逐条核查表；对照 `REVIEW_1107_INTEGRATION.md` 台账，文档与代码一致，无虚报 |
| 玩法完成度 | ✅ 明显提升 | 第 0→1 章闭环、项目系统、范围协商、同源章节目标、派遣预估、交付结算说明全部落地且有测试与回放证据 |
| 视觉/美术一致性 | ❌ 本轮新短板 | 详见 §四：级联冲突 bug（可截图复现）+ 11 处旧青绿硬编码残留 + 深色模式三处不一致；「去掉白绿 AI 风」只完成约一半 |

与上轮报告的连续性：上轮 §九 工作包中 P0-2（UI 确定性修复）**全部完成**；P0-3（配色+光照）**部分完成**（光照✅、配色留了尾巴，正是本轮最大发现）；P1-1（看板）✅、P1-2（简历页）第一版、P1-3（锚点+行走）第一版、P1-4（地图）第一版、P1-5（谜题密度）**基本未动**（隐藏工作量计价规则未改，见 §五）；P2-3（派遣预估）✅ 提前完成。

---

## 二、上轮用户 8 点反馈逐条落实核查

| # | 反馈 | 状态 | 本轮实证 |
|---|---|---|---|
| 1 | 角色自由活动、派遣走到工位干活 | 🟡 第一版（文档自认） | `scene.ts:18` walkers 按角色 ID 持久化；`scene.ts:54` 沿 3 个局部锚点 `[−24,28,0]` 每约 5 秒换点漫步，改场景重置入口 `(40, h·0.7)` 再走回工位；`scene-layout.ts:9-16` 按状态给出 work/review/meal/read/rest/idle；`village-characters.ts:18-27` 手臂/腿/头部姿态按活动区分（走＝腿臂摆动，用餐＝抬臂±5°）。**不是寻路**，是「原地小范围游走」，与文档声明一致。实拍确认角色在不同截图中位置不同、名牌随人移动 |
| 2 | UI/配色参考 ai-village、去白绿 | 🟡 半途而废（本轮核心发现） | `tokens.css:1-2` 已换成暖纸/木色（`--paper:#f1e5cd --green:#98663d`），浅色主场景观感确实大幅改善（见 shots/01）；但 `style.css` 仍有 11 处旧青绿硬编码未清理，且新旧规则**级联冲突产生真实 bug**（§四.1，shots/11 截图可复现） |
| 3 | 伙伴页简历形式 | 🟡 第一版 | 详情弹窗已具备完整简历形态：`alpha-app.tsx:84` 照片+档案文案+擅长+版本+状态+六项能力条+版本切换+故事（好感不足不剧透，`:84` 尾部）；未招募者有灰度锁定卡+招募条件按钮（`:67`）。**但列表卡片本身仍只有「头像+名字+场景·精力」两行**（`:66`），简历要素只在二级弹窗；12 人中仅 7 人有专属档案文案（§五.2） |
| 4 | 世界地图选点 | 🟡 第一版 | `alpha-app.tsx:77` + `style.css:4` `.world-map`：三地点缩略图卡片+错落布局+当前地点描边，切场景不推进时段。**道路几乎不可见**（`.map-road` 旋转边框太弱，shots/03），仍非 GDD §10.1 的 17 场景世界地图 |
| 5 | 接单后状态可见 | ✅ 完成首版 | `alpha-app.tsx:62` 常驻可折叠工作看板（进行中委托+进度+空闲伙伴）；`:69` 委托抽屉 active/posted/history 三分组+搜索，`slice(-25)` 截断已移除；`use-game.ts:19` 接单/派遣后 toast 为「接单成功，请为委托安排执行者。/队伍已就位…」，accept 成功自动切到「进行中」标签（`:80`） |
| 6 | 四时段光照 | ✅ 完成 | `alpha-app.tsx:54` `data-period={absoluteSlot%4}` 四档；`style.css:4` 四组 tint（晨 `#ffd68b0c`→午近无→黄昏橙紫渐变→深夜 `#17244377`），只覆盖场景层（`.scene-stage` z-index −2）不影响控件。实拍深夜档确认：整景蓝紫压暗、HUD 仍清晰、角色按时段去食堂/图书馆、引导卡文案自动切换为「晚上不默认工作…」（shots/11）。**旧的 `data-night` CSS 分支已死代码**（`style.css:7`，属性不再被设置） |
| 7 | 真人试玩不作门禁 | ✅ 已按建议登记 | `STATUS.md:2`「真人试玩不再作为评判依据或阻碍」；`REVIEW_1107_INTEGRATION.md:7` 同口径；本轮 `PRODUCTIZATION_B.md` 验收全部以自动化+浏览器证据放行，口径执行到位 |
| 8 | 无要求不接平台 | ✅ 已冻结 | 本轮 6 个提交零平台改动；apps/dsh、apps/desktop 仅受全量检查波及；`PRODUCTIZATION_B.md:65`「只Web」重申 |

**小结**：8 点中没有虚报。需要用户知道的是：1/3/4 三项是「能用的第一版」而非完成态；第 2 项（配色）是本轮唯一出现**回退风险**的——见 §四。

---

## 三、玩法复审（本轮新增系统逐项）

### 3.1 第 0→1 章闭环（Productization A/B），质量高于上轮任何切片

- **声明式开局**（`simulation.ts:34-47`）：槽 0 的 5 张委托板由 `campaign.openingJobs` 固定为 menu/bugs/website/backup/review；前 28 槽（7 天）随机池限定 `starterJobs` 12 份精选；两者均过 schema 引用校验且 `!offerOnly && minChapter===0`（`oot-content/src/browser.ts` 新增 `OPENING_REFERENCE` 检查）。RNG 消耗方式不变（`roll` 先抽再查表），历史内容无该字段时行为不变——符合「改规则升版本+回放」的仓库约定（engine 0.11.0→0.13.0，旧档明确拒绝）。
- **范围协商**（`simulation.ts:336-345`）：`scope` 命令要求 `hidden===0 && clarifyingUntil<=slot`，把委托模板整体换成方案模板并重置 `work/hidden/revealed`；`Command` 联合类型、parse 校验、失败原状态返回都齐。UI 侧（`alpha-app.tsx:80`）明确告知「选择后不能切回、不自动接单」。这是 GDD §6.3「接单前五选项」中**第一次出现有机制意义的选择**，虽然目前只挂在 website 一份委托上。
- **大订单项目**（`projects.ts` + `projects-b1.json`）：社区书店双路线（系统 2×26WP/1550 vs 手册 2×22WP/1350），三步走：验收单(65) → 两期交付(75) → 路演材料(70)；`requiredForChapter` 使其进入同源章节目标；失败可 ¥60 重约同阶段合同，成功历史与费用保留；项目合同 `offerOnly` 不进随机板。**内容质量是本仓库迄今最好的**：brief 单有真实可澄清边界（+2WP），每步带双语客户回信（如「读者连按两次预约，系统只留一条记录」），pitch 单明确教「预付款不是利润」。schema 层校验路线唯一性、步骤质量线必须等于模板及格线、`minChapter` 不越章——内容一致性 lint 从上轮建议变成了现实。
- **同源章节目标**（`chapter-goal.ts`）：第 0/1/2/3/4 章 + 项目条件全部在纯函数里产出 `requirements[]`，`applyCampaign` 的 `chapter` 命令与 ViewModel 用同一来源（`campaign.ts:72-73` 只调 `chapterGoal(s,c).ready`）；UI 逐项显示 current/target 并在未达标时禁用确认按钮（`alpha-app.tsx:70`）。上轮「前后端判定不一致」这类问题从结构上被消灭了。
- **第 1 章分章招募**：`recruits.minChapter`（`m5.json`：gpt/claude/kimi=1，gemini/grok/minimax/seedance=2，glm=3），core 校验（`campaign.ts:50`）与 UI 禁用双保险。配套 7 份新角色档案文案（§五.2）。

### 3.2 派遣预估与交付结算（上轮 P2-3 提前交付）

- `preview.ts` 新增纯函数 `forecastAssignment`：在冻结个人条件的假设下逐槽模拟 112 槽，产出**完成时段、工作槽数、资源预算（含本地电费）、质量区间 ±5、5 类风险旗**，并在 UI 上逐条解释假设（「不是结果保证」「云端数字不是再次扣现金」）。实现与 `resolve` 的口径对齐得很细：prompt 倍率 1.2/1.4 分角色、worker/planner 输出按剩余工作量截断、reviewer「无新进度且零缺陷则跳过」都一一镜像（`simulation.ts:89-93` vs `preview.ts:28-31`）。这是**可以把「为什么这个组合快/慢/贵」讲清楚**的预估，超出上轮建议的最低要求。
- `settlement.ts` 把评级/倍率/逾期/预付/净额/声望全部收敛为一个纯函数；`DeliverySummary`（`decision-panels.tsx:9-12`）以「阶段合同基数→倍率→已收预付→本次现金变动→扣分明细→电费不重复扣」的顺序讲清一次结算，评级用每委托 `qualityLines`（上轮 P0 的 `>=90` 硬编码确认已死）。质量构成明细仍锁在「可解释性报告」软件后（`alpha-app.tsx:82`），但**基础反馈（评级+扣分项）已不再被锁**——符合上轮建议的分层。

### 3.3 引导链（上轮 P2-1 提前交付，第一版）

`onboarding.tsx`：10 个状态推导步骤（第一单→接单→派遣→执行→澄清→夜间→验收→返工→周结→重开→章节），从恢复的游戏状态推导步骤、可折叠且偏好进 localStorage（A6 验证刷新保持）、每次只教一件事、失败有解释（rework 步骤）。**缩水版但符合 GDD §14.4 精神**。问题见 §四.6（遮挡工位）。

### 3.4 玩法层新问题（本轮发现，按影响排序）

| # | 问题 | 证据 | 影响与建议 |
|---|---|---|---|
| B1 | **接单前看不到截止时间与工期预估**。委托详情显示「工作量 / 截止时间 / 及格线：30 / **—** / 60」（shots/08）；deadline 在 accept 时才生成，forecast 也只在 accepted/working 后出现（`alpha-app.tsx:81`）。模板数据本身没有 deadline 字段，所以「—」是数据现状而非渲染 bug | shots/08；`alpha-app.tsx:80` | 玩家仍在「盲接」：无法在接单前权衡「这单会不会拖到逾期 −10%/槽」。建议最小改法：在模板上加 `deadlineSlots`（或按 workSlots 推导），接单前显示「预计截止：第 X 天·时段」，并让 forecast 支持 posted 态「假设接单」预览。这是当前任务流里**信息缺口最大**的一处 |
| B2 | **零隐藏需求委托仍展示一排禁用的澄清按钮**（menu `clarity:95` → hidden=0；四个按钮 50% 淡显但仍带「DeepSeek 55%」等字样），没有「本单无需澄清，可直接接单」的解释（shots/15）。同理澄清说明文案在 hidden=0 时照常显示 | `commissions-m5.json` menu；`alpha-app.tsx:80`；shots/15 | 新手第一单就会遇到。建议 hidden===0 时把按钮行替换成一句「甲方需求已明确，直接接单即可」，并把澄清教学挪到第一份有隐藏需求的委托 |
| B3 | **澄清的收益结构未改**：接单即计入全量隐藏工作量、澄清只避免 −8/条的扣分——上轮 §五.1 的核心建议（「未揭示部分才计工作量」）未落地。脚本复核：114 份模板中 81 份带隐藏需求，其中 **97/138 条仍是 5 个通用标签**（「特定交付格式」×52），17 条情境化标签全部集中在 A3/B1 新内容里。旧 100 份 m2 池委托的谜题密度原地踏步 | 本次脚本统计；`simulation.ts:333`（接单计价未改） | 继续维持上轮判断：这是「甲方即谜题」支柱的最大缺口，且现在是第 0/1 章精修内容与旧池内容**质量断层**的根源。至少先把「接单计价」一行语义改掉（改动小、有回放基建） |
| B4 | 项目重约 ¥60 定价与合同体量（¥1550/期）相比**几乎无成本**，失败重试的代价感很弱；文档已诚实声明「失败不撤销收支」，但重约费本身不构成张力 | `projects-b1.json` retryCost:60 | 观察项：等第 1 章失败补救专项（STATUS 已排队）时一并复核，不建议现在单独改 |
| B5 | 待决事件未绑定委托时 `pending.actors=[]`，无角色惊讶反应 | `getViewModel`（simulation.ts 尾部）；`scene-layout.ts:18` | 小事；给无 job 事件按文案挑 1-2 名相关角色即可 |
| B6 | 手账面板第 0 天即展示「五个结局/异世界远征/对手竞标」三个终局系统入口（shots/10），新手第一次打开手账看到的是还远未解锁的系统列表 | `alpha-app.tsx:74`+`finale-panel.tsx` | 信息架构偏早。建议 locked 面板收成一行「终局内容将在第 3 章后逐步开放」 |
| B7 | 事件选项按钮无条件显示「¥0 · ×1」后缀 | `alpha-app.tsx:79` | 零成本选项显示「¥0 · ×1」是噪音；cost===0 或 multiplier===1 时省略即可 |

### 3.5 引擎质量抽查（未发现新违约）

抽查本轮核心改动对仓库铁律的遵守情况：`applyProject` 失败路径全部先 `check` 后改状态、重约扣款走 `round`+ledger；`cloneCampaign` 补了 `projects` 深拷贝（含 `history` 数组）；`postedJob` 抽成共享工厂保证板内单与项目单同构；`forecastAssignment` 不读 RNG、不推进状态（`frame={...s, absoluteSlot}` 浅拷贝只读）。**未发现确定性/回滚违约**。31 文件 173 测试的仓库记录与新增测试清单（非法章节/路线、四种终结态重约回滚、VM 隔离、旧档拒绝等）覆盖面合理。

---

## 四、UI / 视觉复审（本轮重点发现）

### 4.1 【P0·确定性 bug】新旧配色在 CSS 级联中打架，主按钮 hover 变回青绿

本轮 `style.css` 在**文件头部插入**了新块（`:4`），把主按钮 hover 改成棕色 `#785030`、深色主题按钮文字改成 `#352b24`；但**旧块未被删除**：

- `style.css:6` 仍保留 `button.primary:hover:not(:disabled){background:#315e59}` —— 与 `:4` 新规则**同特异性、声明更靠后 → 青绿胜出**。新写的棕色 hover 永远不生效；
- `style.css:15` 仍保留 `:root[data-theme=dark] button.primary:hover:not(:disabled){background:#b4ddc8}`（旧浅薄荷绿）和 `color:#173b2b`（旧深绿字），同样覆盖 `:4` 的 `#352b24`。

**实机复现**：鼠标悬停「下一时段」主按钮时，按钮从暖棕 `#98663d` 变为青绿 `#315e59`（对比 shots/01 棕色常态 与 shots/11 右下角绿色 hover 态）。这正是用户要求去掉的「青绿 AI 风」残留，而且发生在**全界面最高频的按钮**上。同理深色模式下主按钮 hover 会变成浅薄荷绿。

**修法（半小时级）**：删除 `:6` 的旧 hover 规则与 `:15` 整行旧深色覆盖，让 `:4` 的新规则生效；或反过来删 `:4` 重复块——总之**同一选择器只能存在一份**。建议同时加一条 CI grep 检查（禁止 `#315f59/#315e59/#42756a/#b4ddc8` 等旧色值出现在 tokens.css 之外），防止下次 re-theme 再留尾巴。

### 4.2 旧青绿/冷色硬编码残留清单（与暖木 tokens.css 不一致）

| 位置 | 现值 | 问题 |
|---|---|---|
| `style.css:7` `.brand-mark{background:#315f59}` | 青绿 | **品牌 logo 块，画面最显眼的元素之一**仍是旧主色（shots/01 左上角「ot.」） |
| `style.css:7` `.studio-brand{color:#233d37}` / `.studio-brand small{#324a40}` | 青黑 | 品牌文字未随主题（深色模式下 `text-shadow:0 1px 8px #fff` + 深色字，浅色字阴影） |
| `style.css:7` `.place-heading{color:#294138}` | 青黑 | 场景大标题「开源车库」硬编码深青，不随深浅主题 |
| `style.css:7` `.scene-location{color:#244136;background:#fffaecd9}`、`.location-dot{background:#639979}` | 青绿 | 左下角场景切换 chip 整体浅米底+深青字，深色模式下不跟随 |
| `style.css:7` `.hud-tools button{background:#fff9eddd;border-color:#fff9ed88}` | 浅米 | 右上角地图/存档/设置三个图标按钮**深色模式下仍是浅色块**（shots/13 右上角） |
| `style.css:15` `.hud-tools button{color:#30453f}` | 深青 | 同上，覆盖了 `:4` 的 `var(--ink)` |
| `style.css:7` `.scene-fallback{color:#243c38}`；`style.css:6` body `background:#e6dfd1`；`style.css:7` `dialog::backdrop{#18343d55}` | 冷灰青 | 降级文案、页面底色、弹窗遮罩均为旧色系 |
| `style.css:14` `.bankrupt{background:#fdebd8}` | 浅桃 | **深色模式下破产面板 = 浅桃底 + `--ink:#f3e7ce` 奶油字，对比度约 1.2:1，基本不可读**（代码推断，未实机触发破产复现——诚实标注） |

另有一处**非颜色**的残留：`<meter>` 能力条实际渲染为浏览器默认**绿色**（shots/06 六条绿杆），`.skill-list meter{accent-color:var(--green)}` 未生效（Chromium 对 meter 的 accent-color 支持不完整），与暖色系冲突。建议改为自绘 div 条或 `::-webkit-meter-*` 伪元素上色。

### 4.3 深色模式三处结构性不一致（实拍 shots/13）

1. **场景背景完全不压暗**：深色只改了控件面板色，正午工作室背景依旧全亮，「深色界面」实际是「深色控件 + 白天场景」的拼接感。建议给 `:root[data-theme=dark] .scene-stage` 加一层低透明暗色滤镜（CSS 一行），并考虑与 `data-period` tint 相乘而非覆盖。
2. HUD 图标按钮浅色块（见 4.2 表）。
3. 主按钮 hover 浅薄荷绿（见 4.1）。

### 4.4 引导卡遮挡工位（实拍 shots/01、shots/02 动态复现）

`.onboarding` 固定 `left:28px;top:270px;width:260px`（`style.css:2`），而 4 人布局的第一个工位锚点约 x≈172、y≈302（`scene-layout.ts:3-7`，1280×720）：**引导卡完整盖住第一位角色的工位与身体**。实拍还捕捉到 DeepSeek 漫步走进卡片后方、只剩椅子腿露出的帧（shots/04 左侧）。面板打开时引导卡自动隐藏（`style.css:2` `[data-panel]` 规则），说明作者知道遮挡问题但没有解决主界面常态。建议：把引导卡移到左下角场景位置 chip 上方（那里是空的），或第一工位锚点右移/引导卡宽度收窄。

### 4.5 委托过滤按钮无选中态

`alpha-app.tsx:69` 的 进行中/待接单/已结束 三键都设了 `aria-pressed`，但 `style.css` 中**没有对应规则**（只有 dock 和 world-map 的 `aria-pressed=true` 有样式）。实拍点击「待接单」后三个按钮外观零变化，只有光标 hover 的浅色差异（对比 shots/07 与切换前后）。可访问性属性是对的，视觉反馈缺失。一行 CSS 即可修复。

### 4.6 其余 UI 细节（快速清单）

- **地图道路不可见**：`.map-road` 用 18px 旋转边框模拟道路，实拍中几乎被卡片和底色吞掉（shots/03）。三地点地图目前是「带插画的对话框」而非「地图」。上轮建议的「热点+高亮」已有（当前地点棕描边 ✅），缺的是可读的路网/地名。
- **死代码**：`apps/web/src/campaign-ui.tsx`（5.3KB）**仍然零引用**——上轮 P0 建议删除，未执行；本轮又新增两段死 CSS：`.map-cards`（已被 `.world-map` 取代，`style.css:11`）与 `.scene-stage[data-night=true]`（`:7`，属性已不再设置）。
- **章节眉标文案**：`alpha-app.tsx:57` `{tr('第','CHAPTER ')} {p.chapter} · {chapterTitles[...]}` 渲染为「**第 0 · 开源车库联盟**」——中文缺「章」字（放大截图 shots/14 确认数字被背景木梁半遮，辨识度也差）。应为「第 0 章 · 开源车库联盟」，或干脆用英文章节格式。同一行在深色模式/夜间下为 `#294138` 深青固定色，深夜档可读性下降。
- 深色模式下场景大标题、引导卡标题等文字阴影仍按浅色场景调校（`text-shadow:#fff` 系），在深色+黄昏叠加时发灰。
- 角色「···」思考气泡位置固定在 `(32,-147)`（`scene.ts:47`），放大缩小的工位上偶见悬空；可接受，列入打磨项。

### 4.7 值得表扬的 UI 进步（避免只挑刺）

- 四入口抽屉的滚动位置按面板记忆（`studio-ui.tsx:12`）、Esc 关闭、焦点还原（`:11`）——细节完整；
- 预估/结算面板的「假设声明」「这不是利润」「额度不重复扣现金」三段免责文案，是把上轮「账本显示原始术语」问题治理成了**对玩家诚实**的文案（`decision-panels.tsx:7`、`project-panel.tsx:17`）；
- 角色档案把「擅长」「当前版本」与 GDD §5.4 定位文案联动（`character-profiles.ts` 注释明确「不产生机制加成」，符合「不静默改 GDD」）；
- 看板/手账/工作室面板打开时自动隐藏引导卡与场景标题淡出（`style.css:2,10`），层级意识明显变好。

---

## 五、美术复审

### 5.1 资产现状

- **角色**：AI Village 原版 12 人 Q 版纸娃娃 + 12 张头像（MIT，来源/哈希记录齐全，`apps/web/public/art/ai-village/`，每人 ~11 部件含 4 表情脸）。12 人同屏实拍（shots/12）：比例统一、工位遮挡关系正确（椅子背→人→桌子前景三层，`scene.ts:28-35`）、名牌+版本号清晰；12 人时工位缩放至 ~0.46 仍可辨认。**角色美术质量是稳定的，无需再动**。
- **场景背景**：7 张手绘风 webp（garage/incubator/office/campus/lab/canteen/library，按章节切换工作室背景 `studio-ui.tsx:5`）。暖色手作质感与 Q 版角色**基本融合**（shots/01），上轮「照片感现代室内 vs Q 版」的违和已大幅缓解。
- **场景内物件**：矢量家具（桌子/显示器/键盘/代码线条/机箱灯/餐桌/书架）虽然简单，但本轮补齐了工位成长可视化（office 0/1/3：折叠桌→工作站→多屏+吊柜；compute 灯珠，`scene.ts:37-41`），「赚钱改变工作室」现在看得见（`?scene-lab` 可验证）。矢量家具与手绘背景之间的风格差仍存在（平面纯色 vs 手绘光影），是可接受的价差，若要消除需统一描边/投影规范。
- **动画**：待机呼吸/走路摆动/工作手臂/用餐抬臂/惊讶/睡眠表情已接入 `activityPose`（`village-characters.ts:18-27`）；`prefers-reduced-motion` 与「减少动态」设置双通道停用（`style.css:13` + ticker 判断）。**手部工作感（键盘敲击、屏幕亮起）仍缺**——上轮 §七.3 的建议保持有效。
- **性能/体积**：静态部件 PNG 合计 ~24.9MB/141 文件（`harness/a5-art-budget.json` 记录）——**压缩图集与低端设备帧率验收仍开放**（STATUS 明示未验收）。本轮未变化，风险不增不减；第 2 章发布会前建议处理一次（WebP/图集化已有离线清单基建 `offline-assets.json` 可挂）。
- **音频**：仍为 0。上轮「最小音频包」（1 首 Lo-fi + 5 音效 ≤2MB）建议维持不变，第 2 章「发布会」是比第 1 章更合适的接入时机。

### 5.2 美术相关内容缺口

- **角色专属档案 7/12**：`character-profiles.ts` 仅有 gpt/claude/kimi/bluewhale/qwen/llama/mistral 七人；gemini/grok/glm/minimax/seedance 五人（恰好全是第 2/3 章招募角色）点击档案时显示通用兜底文案。文档已自认「专属人物介绍仍待精修」，这里给出精确缺口清单以便排期。
- **60 段剧情仍是单句草稿**（本轮未变化；上轮 §五.4 的「精修 20 段」建议维持）。
- 隐藏需求标签同质化见 §三 B3。

---

## 六、推荐工作包（1108 修订版）

优先级依据：确定性 bug > 视觉一致性收尾 > 任务流信息缺口 > 谜题密度 > 生活感打磨。

| 序 | 工作包 | 内容 | 验收 |
|---|---|---|---|
| P0-1 | **配色收尾与防复发** | 删 `style.css:6/:15` 旧主按钮 hover 与深色覆盖（修 hover 变青绿 bug）；清理 §四.2 表中 11 处硬编码（brand-mark/place-heading/hud-tools/scene-location/scene-fallback/backdrop/body/bankrupt）；meter 条自绘；加「旧色值不得出现在 tokens.css 之外」的 grep 检查进 `pnpm check` | 深浅两主题下 hover/品牌块/标题全部随主题；grep 门禁通过 |
| P0-2 | **引导卡让位** | onboarding 卡移至左下空白区或收窄，不与工位锚点重叠 | 4 人与 12 人布局下无遮挡实拍 |
| P1-1 | **接单前预估** | 模板加截止时间（或 workSlots 推导）+ forecast 支持 posted 态「假设接单」预览；委托详情显示「预计截止/预计工期/预算区间」 | 不接单能回答「这单几天、会不会逾期」 |
| P1-2 | **委托过滤选中态 + 零澄清提示** | `.button-row button[aria-pressed=true]` 样式；hidden=0 时澄清区替换为「甲方需求已明确」 | 实拍三态可见；第一单无困惑 |
| P1-3 | **深色模式一致性** | 场景暗化滤镜；HUD 图标按钮/场景标题跟随主题；深色下主按钮 hover 用 `#b4ddc8` 的替代棕色 | 深浅×四时段 8 张对比图 |
| P1-4 | **伙伴卡片简历化（收尾 1107 #3）** | 列表卡加一句身份+前三能力迷你条；补 5 位后期角色专属档案文案 | 12 人卡片信息等价、档案 12/12 |
| P2-1 | **谜题密度第一波（沿用上轮 §五.1）** | 「未揭示部分才计工作量」一行语义改动+边界/回放测试；旧 100 份池的 5 通用标签按「甲方×类别」情境化重写 20 份样板 | 澄清有信息量；lint 保持绿 |
| P2-2 | **地图可读性** | 道路重画（SVG 路径+虚线）、未来地点灰色占位 | 一眼能读出「小镇有三处可去、还有更多待解锁」 |
| P2-3 | **死代码清理** | `campaign-ui.tsx`、`.map-cards`、`data-night` 分支 | grep 零引用 |
| P2-4 | **文案微调** | 眉标「第 N 章」；事件选项省略「¥0 · ×1」；手账终局入口折叠 | — |

---

## 七、GDD 差距的增量更新（只列变化，其余沿用 1107 报告 §二）

- **新完成**：§6.3 接单前选项中的「方案选择」（scope，单范例）；§11.2 章节判定同源化；§14.3 决策前预估（forecast 版）；§14.4 引导链（收缩版）；§10.4 的 visit 到场（配合行走第一版）。
- **未变化、维持上轮判断**：Version 无 traits/rarity/size（§5.3/5.8 未建）；思考深度 Depth/Surge 未建（Token 公式仍为产出×单价）；协同表 B_syn 为空；压力未进缺陷公式；交付模式仅 3 种；甲方画像深度不足；17 场景只做了 3+5 背景；音效/BGM 0；周报/梗图鉴未做；纸娃娃 10 态只接了 6 种活动姿态（有意识推迟，有记录）。
- **口径类**：经济参数仍为实验值（D029/D037）；M05-03 仍 34/152=22.37%<25%，7001–8000 封存未动——本轮未为过关改任何平衡参数，符合协议。

---

## 八、证据索引

**实机截图（`docs/review-1108/shots/`，Chrome 156 无头 @1280×720，Vite dev 构建）**

| 文件 | 内容 |
|---|---|
| 01-workshop-morning-1280.png | 第 1 天上午主场景：暖木主视觉、4 人工位、资源条、看板入口（注意左上角青绿 logo 块、引导卡遮挡 DeepSeek） |
| 02-workboard-expanded.png | 工作看板展开态（空闲伙伴列表） |
| 03-world-map.png | 世界地图弹窗：三地点卡片+当前描边；道路几乎不可见 |
| 04-canteen-switch-nochange-evidence.png | 漫游态抓帧：DeepSeek 走入引导卡后方（遮挡动态证据）；本帧亦为「点到当前场景」的操作留档 |
| 05-actors-drawer.png / 06-actor-resume-qwen.png | 伙伴抽屉（名字+场景·精力两行卡）与 Qwen 简历弹窗（绿色 meter 条证据） |
| 07-jobs-posted-list.png / 08-job-dialog-menu.png | 待接单列表（标签/报酬/0 待澄清）与委托详情（截止时间「—」、禁用澄清按钮、百分比展示） |
| 09-studio-panel.png / 10-journal-panel.png | 经营面板（净偿付资金+章节目标逐项）与手账面板（终局系统入口暴露） |
| 11-night-lighting-hover-teal-bug.png | 深夜光照档 + **主按钮 hover 变青绿的 bug 实拍**（右下角） |
| 12-scenelab-12-actors.png | 场景实验室 12 人同屏（office 0 档） |
| 13-dark-mode.png | 深色模式：控件已暗、场景未暗、HUD 图标按钮仍浅色 |
| 14-eyebrow-missing-zhang.png | 「第 0 ·」缺「章」字 4× 放大 |
| 15-clarify-disabled-zero-hidden.png | 零隐藏需求委托的禁用澄清按钮 2× 放大 |

**关键代码位置**：配色冲突 `apps/web/src/style.css:4 vs :6 vs :15`；硬编码残留 `style.css:6,7,14,15`；光照 `alpha-app.tsx:54` + `style.css:4`；看板/分组 `alpha-app.tsx:62,69`；引导 `onboarding.tsx:5-27`；遮挡 `style.css:2` + `scene-layout.ts:3-7`；行走 `scene.ts:18,54`；反应 `scene-layout.ts:17-22`；项目系统 `oot-core/src/projects.ts`；章节目标 `chapter-goal.ts`；结算 `settlement.ts`；预估 `preview.ts`（forecastAssignment）；scope `simulation.ts:336-345`；开局/池 `simulation.ts:34-47`；内容校验 `oot-content/src/browser.ts`；档案缺口 `character-profiles.ts`（7 条目）。

**复现命令**（本轮实机验证方式）：

```powershell
corepack pnpm dev:web          # http://127.0.0.1:5173
# 无头截图批次由 REA capture_browser_scenario 驱动；人工复核可直接浏览器打开
# 场景实验室：http://127.0.0.1:5173/?scene-lab （仅 DEV 构建渲染，不读写玩家存档）
```

---

## 九、给下一轮的三句话

1. **把暖木 re-theme 做完**：删掉旧青绿残留与级联冲突（含可截图复现的 hover bug），加旧色值 grep 门禁——这是当前唯一在「倒退」的方向。
2. **把「盲接」变成「算着接」**：接单前给出截止时间与工期/预算预估，委托任务流就真正闭环了。
3. **谜题密度欠账开始还**：先改「未揭示部分才计工作量」一行语义，再情境化旧池标签——第 1 章内容已经证明这个团队写得出好谜题，把旧 100 份拉到同一水位即可。
