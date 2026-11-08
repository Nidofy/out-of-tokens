# 《Out of Tokens》深度复审报告（玩法 · UI · 视觉 · 美术）

- **审查者**：Gemini 4 Argon（独立代码、运行时与无头浏览器实机渲染复审）
- **审查日期**：2026-11-08
- **目标仓库**：`D:\Documents\FeiyangChen\devApps\ai-game\out-of-tokens`
- **分支 / HEAD**：`codex/m1-foundation` @ `1b68b18a82b2c0ef3152bd5a1aabcd4443c218a9`（代码提交 `67bc3ca350a4ea931a5be061858c173fd2f5f2e2`）
- **版本标识**：`engineVersion = 0.13.0` / `contentVersion = b1-2`
- **对照基准**：
  - 上一轮固定审查基线：`2b47242f236683b540faa6b1885d6267cf98c9f7`（`0.11.0 / m5-1`）
  - 用户 8 项核心反馈：[review-by-user.md](file:///D:/Documents/FeiyangChen/devApps/ai-game/docs/review-1107/review-by-user.md)
  - 1107 多方评审报告：[review-by-gpt6.md](file:///D:/Documents/FeiyangChen/devApps/ai-game/docs/review-1107/review-by-gpt6.md)、[review-by-glm53flash.md](file:///D:/Documents/FeiyangChen/devApps/ai-game/docs/review-1107/review-by-glm53flash.md)、[gemini-unified-2b47242-report.md](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens-review-gemini-2b47242/harness/reviews/gemini-unified-2b47242-report.md)
  - 设计与视觉参照：[GDD-v0.1.md](file:///D:/Documents/FeiyangChen/devApps/ai-game/docs/GDD-v0.1.md) 及源项目 `ai-village`（`D:\Documents\FeiyangChen\devApps\dsh_plugin\packages\ai-village`）
- **自动化测试状态**：`vitest run` **31 个测试文件 / 173 项测试全部通过**；本报告在此基础上结合**真实 Chromium 渲染截图（桌面 `1280×720` 与移动 `390×844`）**及源码级逻辑走查给出独立结论。

---

## 一、总体结论（Executive Summary）

从 `2b47242`（`0.11.0`）到当前 `1b68b18`（`0.13.0`），主线程连续完成了 **1107 评审修复、Productization A2（派遣预估与交付结算解释）、A3–A6（第 0 章开局引导、12 张精选委托、`website` 范围谈判、自然通关测试）以及 Productization B（第 1 章“社区书店”双路线大订单与路演目标）**。

**核心肯定：**
1. **工程与核心可解释性显著提升**：上一轮 Gemini 报告指出的 `GEM-2b47242-01`（`Planner + Tool` 预算检查顺序）、`GEM-2b47242-02`（`preview.ts` 提示词系数与取整对齐）、`GEM-2b47242-04`（`sw.js` `ignoreVary: true` 离线缓存命中）以及 GPT-6 指出的评级硬编码 `>=90`、剧透泄露、列表 `.slice(-25)` 截断均已修复。
2. **经营决策终于“有账可算”**：新增的 [`forecastAssignment`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/packages/oot-core/src/preview.ts#L39-L65) 与 [`settlement`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/packages/oot-core/src/settlement.ts#L5-L17) 让玩家在派遣前能看到预计完工时段、阶段资源消耗、电费与条件质量区间，交付时能看到预付款抵扣、评级倍率与扣分明细。
3. **第 0 章前半程与第 1 章主线有代表性内容支撑**：第 1 天固定 5 单开局（`menu`、`bugs`、`website`、`backup`、`review`）、`website` 澄清后二选一范围谈判（小站 vs 两期站点），以及第 1 章“社区书店”双路线三阶段项目（含客户回信与失败重约机制），让前两章初步具备了 GDD 所要求的“读题—权衡—担责”体验。

**核心问题与差距（为什么距离用户期望仍有明显落差）：**
尽管自动化测试增至 173 项，但通过**实机浏览器渲染目视检查**与**跨文件源码对账**，当前实现针对用户提出的 8 项核心反馈（尤其是 **#1 像 `ai-village` 一样自由活动再走到工位、#2 全面参考 `ai-village` 配色去白绿风、#4 `ai-village` 式世界地图、#6 四时段环境光照**）主要停留在**“最小表面打补丁”**层面，不仅未真正对齐 `ai-village` 的交互与美术范式，反而引入了**首屏 UI 重叠遮挡、CSS 层叠覆盖失效、人桌绑定滑步穿模、夜间阳光穿帮、验收弹窗卡死**等直接影响游玩的体验缺陷：

| 维度 | 当前完成度评级 | 关键进展 | 最突出的阻塞/短板 |
|---|---|---|---|
| **玩法（Gameplay）** | **B+** | 开局 12 精选委托、`website` 范围谈判、第 1 章书店双路线大订单、A2 预估与结算闭环 | ① `starterJobs` 仅锁前 7 天（`slot < 28`），第 8 天（仍在第 0 章内）88 张模板委托重新涌入（52 处“特定交付格式”）；② 委托 4 槽（1 天）过期与下午澄清锁单冲突；③ `forecastAssignment` 冻结精力/负载导致晚间误报“28天内无法完成” |
| **UI 与交互（UI/UX）** | **C+** | 新增主屏工作看板、开业手册、委托三分类与搜索、派遣预估面板、伙伴简历头 | ① **P1 级遮挡**：`.onboarding`（开业手册）在桌面与移动端同时切穿场景副标题并严严实实盖住首排角色（DeepSeek），且跨章节不自动收起；② 点击“验收结算”后弹窗不关闭且变为空白无按钮死框；③ 派遣面板报错时不显示禁用原因；④ 待招募伙伴卡不可点击查看能力 |
| **视觉呈现（Visual）** | **C** | 引入 `tokens.css` 暖纸色变量、四时段伪元素滤镜、工位硬件分档绘制 | ① **CSS 层叠覆盖 Bug**：`style.css` 后半段旧规则覆盖了前半段新规则，Logo、场景大标题、主按钮悬停（`#315e59`/`#b4ddc8`）、深色主按钮文字（`#173b2b`）、`<meter>` 能力条与 Canvas 显示器/字色**依然是大面积墨绿/薄荷绿**；② 深夜滤镜直接压暗 Canvas 名牌，但背景天窗依旧洒满正午烈日 |
| **美术与动画（Art）** | **C+** | 保留 AI Village 原版 12 角色纸娃娃，新增四肢正弦摆动、工位双屏与机箱灯 | ① **未兑现“自由活动再走到工位”**：代码仍将每名角色死绑在各自 `station`（椅子与桌子之间），待机时角色带着脚下名牌在桌后左右平移 24px（身体偏离显示器与椅子），未移植 `ai-village` 的空间锚点漫游、关键帧动画与工作/用餐手部精灵；② 12 人同屏时 `station.scale` 将文字缩至 `4.5px–6.2px` 无法辨认 |

---

## 二、上轮审查与用户 8 项核心反馈逐项复核矩阵

### 2.1 用户 8 项核心诉求（`review-by-user.md`）落地核验

| # | 用户诉求原文 | 当前代码实现位置 | 独立复核结论 | 真实表现与差距说明 |
|---|---|---|---|---|
| 1 | 角色应该像 `ai-village` 里面一样可以自由活动，被安排了委托的再走到工位前干活。 | [`scene.ts`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/src/scene.ts#L18-L54)、[`scene-layout.ts`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/src/scene-layout.ts#L2-L16)、[`village-characters.ts`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/src/village-characters.ts#L18-L27) | ⚠️ **仅表面模拟，架构未解耦（部分未达标）** | 每个在场角色无论是否接单，都被创建在一个自带椅背和办公桌的 `station` 容器内。待机（`idle`）时，角色并未离开工位自由活动，而是在桌后夹层里每 5 秒左右平移 `[-24, +28, 0]` 像素，导致**人歪在显示器侧面、脚下名牌跟着偏离桌子，但人依然被关在办公桌后面**。详见第五节 §5.1。 |
| 2 | UI 配色的白绿的 AI 风太严重，UI、配色全面参考 `ai-village`。 | [`tokens.css`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/src/tokens.css#L1-L2)、[`style.css`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/src/style.css#L1-L17) | ⚠️ **半途而废 + CSS 覆盖缺陷（部分未达标）** | 虽然 `tokens.css` 换成了暖米色与棕褐色（`--green: #98663d`），但 `style.css` 第 6、7、15、17 行保留了大量硬编码墨绿/薄荷绿且层叠顺序靠后，直接覆盖了第 4 行的新样式；左上角 `ot.` 标志（`#315f59`）、大标题“开源车库”（`#294138`）、左下角绿色圆点（`#639979`）、角色简历 `<meter>` 进度条、Canvas 电脑屏幕与状态文字全部仍是绿色系。详见第五节 §5.2。 |
| 3 | 伙伴页面可以用类似简历的形式，有照片、个人介绍、能力，已经招募的伙伴有心情、干劲等属性，未招募的则是类似“锁定，待招募”。 | [`alpha-app.tsx`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/src/alpha-app.tsx#L66-L68)、[`character-profiles.ts`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/src/character-profiles.ts#L1-L10) | ⚠️ **基础结构已具备，但信息缺失（基本可用但需补齐）** | 角色详情弹窗已改为左大图右简介的简历头，抽屉内也增加了灰阶“锁定 · 待招募”列表。但：① 抽屉内已招募卡片只显示“位置 · 精力”，**不显示心情、负载与擅长能力**；② 待招募卡片**不可点击查看简历/能力/部署模式**，玩家盲盒式花钱招募；③ 12 人中仅前 7 人写了档案，`gemini`/`grok`/`glm`/`minimax`/`seedance` 5 人缺失个人简介。 |
| 4 | 地图需要有一个和 `ai-village` 一样的世界地图，然后在上面选点切换。 | [`alpha-app.tsx`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/src/alpha-app.tsx#L77)、[`style.css`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/src/style.css#L4-L5) | ⚠️ **与 `ai-village` 地图差距明显** | `ai-village`（[`CommunityMap.tsx`](file:///D:/Documents/FeiyangChen/devApps/dsh_plugin/packages/ai-village/src/client/CommunityMap.tsx#L26-L44)）是带地形底图、2D 百分比坐标地标、SVG 曲线道路网、未开放规划节点及下方地点预览面板的世界地图；而当前实现只是把原来的 3 张矩形场景卡放进 `grid-template-columns: repeat(3, 1fr)`，背后垫了一个旋转 20° 的椭圆 CSS 边框（右下角还露出了尖角穿帮），且地图上不显示各场景有哪些伙伴。 |
| 5 | 接单委托之后没有自动跳转、主界面没有状态变化或者委托看板，看不出来接了什么委托。需要找一个地方有一个可展开的看板，说明当前空余的角色、正在进行的委托、委托状态等等。 | [`alpha-app.tsx`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/src/alpha-app.tsx#L62)、[`alpha-app.tsx`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/src/alpha-app.tsx#L80-L81) | ✅ **核心流程已打通（含局部交互瑕疵）** | 接单后自动留在该委托弹窗并切换为派遣工作台，确认派遣后自动关闭弹窗回到主场景；右上角新增了 `<details class="work-board">` 可展开工作看板（显示空闲伙伴与进行中委托进度，点击可直接打开对应委托）。不足之处是：看板默认折叠（`<details>` 未设默认 `open`），且不显示委托剩余截止时段与当前派遣了谁。 |
| 6 | 不同时间段环境光照没有变化，看不出来时间变更了。 | [`alpha-app.tsx`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/src/alpha-app.tsx#L54)、[`style.css`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/src/style.css#L4) | ⚠️ **仅加了单层 CSS 半透明蒙版，白天几乎无感、夜晚违和** | 上午（`#ffd68b0c`，透明度 4.7%）与下午（`#ffe2a620`，透明度 12.5%）肉眼几乎无法分辨；深夜（`#17244377`）直接用深蓝半透明层盖在 Canvas 之上，导致角色白底名牌变灰暗，但背景图天窗外仍是蓝天白云、地板上仍是正午强烈阳光光斑，室内也无灯光亮起。 |
| 7 | 真人试玩不要作为评判依据和阻碍项。 | [`STATUS.md`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/docs/STATUS.md#L56-L61)、[`ROADMAP.md`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/docs/ROADMAP.md#L12) | ✅ **已落实** | 文档与验收口径已将真人试玩移出开发阻塞项，不再阻断主线迭代。 |
| 8 | 没有用户要求不要进行 DSH 插件接入或其他平台接入，先保持 Web 端。 | [`ROADMAP.md`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/docs/ROADMAP.md#L13) | ✅ **已落实** | `61b2433`..`1b68b18` 全部聚焦于 `oot-core`、`oot-content` 与 `apps/web`，未再推进 DSH 或桌面端新接入。 |

### 2.2 上轮技术与体验审查问题（Gemini / GPT-6 / GLM）修复验证

| 编号 / 来源 | 问题描述 | 当前状态 | 复核证据 |
|---|---|---|---|
| `GEM-2b47242-01` | `simulation.ts` 中 `Planner + Tool` 组合在预算刚好够 `Planner + Worker` 时，`Planner` 先扣费导致 `Tool` 失败且 `Worker` 因 `bonus` 膨胀停工 | ✅ **独立验证通过** | [`simulation.ts:70-71`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/packages/oot-core/src/simulation.ts#L70-L71) 在成员循环前预检 `supportBudgetReady`，[`review-1107.test.ts:5-19`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/sim-cli/review-1107.test.ts#L5-L19) 覆盖（注：残余工作量场景下 `estimateResources` 未传 `partial=true` 的衍生问题见 §3.3）。 |
| `GEM-2b47242-02` | `preview.ts` 提示词软件系数（`1.2x/1.4x` vs `1.15x`）与 `units` 两位小数取整同 `simulation.ts` 不一致 | ✅ **独立验证通过** | [`preview.ts:22-28`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/packages/oot-core/src/preview.ts#L22-L28) 已对齐 `1.4 : 1.2` 与 `Math.round(units * 100) / 100`。 |
| `GEM-2b47242-03` | 12 角色同屏窄视口下版本标签 `y=82` 与下一行工位重叠 | ⚠️ **包围盒已不重叠，但引发字号缩水副作用** | [`scene.ts:44`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/src/scene.ts#L44) 将版本号合并进名牌（如 `DeepSeek · R1`），[`scene-layout.ts:6`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/src/scene-layout.ts#L6) 缩小了 `scale`，但导致 12 人同屏时名牌字号被连带缩至 `4.5px–6.2px`（见 §5.4）。 |
| `GEM-2b47242-04` | `sw.js` 缓存查询未设 `ignoreVary: true`，在带 `Vary: Origin` 的静态服务器上离线刷新白屏 | ✅ **独立验证通过** | [`build-web.mjs`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/scripts/build-web.mjs) 生成的 `sw.js` 已加入 `{ignoreVary: true}`，[`offline-vary.test.ts`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/offline-vary.test.ts#L1-L16) 验证通过。 |
| `GPT6-评级硬编码` | UI 将 `quality >= 90` 硬编码为“出色”，与配置中 `[60, 69, 80]` 的 `qualityLines` 脱节 | ✅ **独立验证通过** | [`settlement.ts:7-8`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/packages/oot-core/src/settlement.ts#L7-L8) 与 [`alpha-app.tsx:82`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/src/alpha-app.tsx#L82) 统一读取 `job.qualityLines`。 |
| `GPT6-类别权重错配` | 6 张终局委托 `category` 主属性在 `weights` 中权重为 0 | ✅ **独立验证通过** | [`commissions-m5.json`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/content/campaign/commissions-m5.json) 已修正，[`review-1107.test.ts:21-24`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/sim-cli/review-1107.test.ts#L21-L24) 全量断言 `t.weights[main[t.category]] > 0`。 |
| `GPT6-未解锁剧情剧透` | 伙伴故事未达好感要求时直接渲染正文再禁用按钮 | ✅ **独立验证通过** | [`alpha-app.tsx:84`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/src/alpha-app.tsx#L84) 改为未达好感时仅显示“再熟悉一些，就能听到这段故事。” |
| `GPT6-委托列表截断` | 委托抽屉 `.slice(-25)` 截断导致长局已接委托丢失 | ✅ **独立验证通过** | [`alpha-app.tsx:69`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/src/alpha-app.tsx#L69) 已改为“进行中 / 待接单 / 已结束”三栏过滤 + 搜索框，不再截断。 |

---

## 三、玩法深度审查（Gameplay Review）

### 3.1 第 0 章开局引导与 `website` 范围谈判：机制亮眼，但存在“单日过期 vs 次槽锁单”的时间窗陷阱

在 Productization A3 中，主线程设计了非常契合 GDD 支柱的开局课程：
- 第 1 天早晨（`absoluteSlot === 0`）固定刷出 5 张开局委托（`menu`、`bugs`、`website`、`backup`、`review`），引导玩家认识“清晰短单（奶茶菜单）”、“带隐藏缺陷风险的修复单（修小 bug）”与“需求极度膨胀的小白客户单（做个类似微信的简单网站）”。
- 特别是 `website`（[`commissions-m5.json:71-123`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/content/campaign/commissions-m5.json#L71-L123)）：初始 `40 WP / 1500 元 / 清晰度 20（2 条隐藏需求）`，全部澄清后可通过 `scope` 命令改签为 **`website-small`（22 WP，单期 1050 元）** 或 **`website-phased`（26 WP × 2 期，每期 950 元）**。

**但源码走查发现一个极易让正常玩家踩坑的时间窗死锁（P1 玩法交互缺陷）：**
1. **委托板仅保留 4 个时段（1 整天）即过期**：
   [`simulation.ts:30-32`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/packages/oot-core/src/simulation.ts#L30-L32)：
   ```ts
   for (const j of s.jobs)
       if (j.status === 'posted' && s.absoluteSlot - j.posted >= 4)
           j.status = 'expired';
   ```
   每天早晨刷新（`s.absoluteSlot % 4 === 0`）时，凡是上一天早晨生成（`s.absoluteSlot - j.posted >= 4`）且仍处于 `posted` 状态的委托会**立即过期消失**。
2. **每天只有上午（`0`）、下午（`1`）两个时段允许澄清，且澄清成功率并非 100%**：
   - [`simulation.ts:364`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/packages/oot-core/src/simulation.ts#L364) 限制 `requireRule(s.absoluteSlot % 4 < 2, 'NOT_WORK_SLOT')`，即晚上（`2`）和深夜（`3`）**禁止澄清需求**。
   - 同时请注意 [`simulation.ts:371`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/packages/oot-core/src/simulation.ts#L371)：
     ```ts
     if((c.campaign?.maxChapter??0)<2 || clarifyRoll(s)<clarifyChance(s,c,a))
     ```
     这里判断的是静态内容配置 `c.campaign?.maxChapter`（在 `m5.json` 中固定为 `4`），**而不是玩家当前所处的章节 `s.campaign?.chapter`**！因此即便在第 0 章第 1 天，初始四人的澄清成功率也只有 **51%–59%**（见实机截图 `08a`：`DeepSeek 55%`、`Qwen 59%`、`Llama 55%`、`Mistral 51%`）。
3. **后果：只要 2 条隐藏需求没有在当天下午结束前全部揭示，或者下午揭示后玩家没在深夜结束前点“接单”，之前投入的所有澄清精力与时段全部作废！**
   - 假设玩家在上午（`slot 0`）派 1 人澄清 `website`，下午（`slot 1`）再派 1 人澄清 `website`：
     - **情况 A（常见）**：上午或下午有一次掷骰未命中（55% 概率极易发生），到 `slot 2`（晚上）时 `j.hidden` 仍大于 `0`。此时晚上和深夜不准继续澄清，而一旦推进到第 2 天早晨（`slot 4`），`website` 直接触发 `s.absoluteSlot - j.posted >= 4` **强制过期**！玩家白白浪费了伙伴的个人时段和 15–30 点精力，连谈判和接单的机会都没有。
     - **情况 B（反直觉锁单）**：就算下午（`slot 1`）成功揭示了最后一条隐藏需求，由于 [`simulation.ts:372`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/packages/oot-core/src/simulation.ts#L372) 设置了 `j.clarifyingUntil = s.absoluteSlot + 1`（即 `2`），在下午当前时段内，`scope`（第 341 行）和 `accept`（第 349 行）全部被锁死（报错 `SCOPE_NOT_CLARIFIED` / `STILL_CLARIFYING`）。玩家**必须**在推进到晚上（`slot 2`）或深夜（`slot 3`）时手动重新点开委托弹窗完成改签和接单；如果玩家以为“晚上不办公，等明天早会再接单”，一推进到第 2 天早晨（`slot 4`），已经澄清完毕的合同同样直接过期消失！
   - **修复建议**：
     - **方案 1（推荐）**：凡是已被玩家投入过澄清行动（`j.revealed > 0` 或 `j.clarifyingUntil > 0`）的委托，在早晨 `refill` 时额外保留 1 天（例如过期阈值从 `4` 延长至 `8`），或者将普通委托的自然保留期设为 `8` 槽（2 天）。
     - **方案 2**：若本意是“前两章（第 0–1 章）降低了澄清门槛”，应将 [`simulation.ts:371`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/packages/oot-core/src/simulation.ts#L371) 与 [`simulation.ts:453`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/packages/oot-core/src/simulation.ts#L453) 中的 `(c.campaign?.maxChapter ?? 0) >= 2` 修正为 `(s.campaign?.chapter ?? 0) >= 2`（同理检查第 135 行与第 183 行的压力/饥饿开关是否也误写了 `c.campaign?.maxChapter` 而非 `s.campaign?.chapter`！）。

---

### 3.2 第 0 章精选池（`starterJobs`）仅生效 7 天，第 8 天起 88 张未精修模板委托提前涌入

在 [`docs/PRODUCTIZATION_A3_A6.md`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/docs/PRODUCTIZATION_A3_A6.md) 中，主线程声明为第 0 章精选了 12 张委托（`starterJobs`）。但查看 [`simulation.ts:34-35`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/packages/oot-core/src/simulation.ts#L34-L35)：
```ts
const starters=c.campaign?.starterJobs;
const pool=c.commissions.filter(t=>!t.offerOnly&&(t.minChapter??0)<=(s.campaign?.chapter??0)&&(!(starters&&s.absoluteSlot<28)||starters.includes(t.id)));
```
- **问题所在**：
  1. 第 0 章的旧债结算点在 **第 14 天结束（`debtSlot = 56`）**，但过滤条件写成了 `s.absoluteSlot < 28`（仅第 1–7 天）！
  2. 而在 [`content/campaign/commissions-m5.json`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/content/campaign/commissions-m5.json) 的 110 张委托中，有多达 **102 张委托未设置 `minChapter`（默认 `0`）**！
  3. 结果：玩家在第 0 章第 8 天早晨（`absoluteSlot === 28`），距离还清旧债还有整整一周时，`s.absoluteSlot < 28` 失效，**88 张未经 A3 精修的模板委托瞬间涌入第 0 章委托板**！
- **内容断层统计（实测数据）**：
  - 在这 88 张非 `starterJobs` 委托中，仍有 **12 张**直接使用完全相同的 3 句模板套话（如 `rivals`“看看别人怎么做的”、`logo`“五彩斑斓的黑色标志”的描述均为 `"甲方描述含糊；先澄清范围，隐藏要求会影响验收。"`，`history`、`poster` 均为 `"需求与验收标准明确，可按能力权重安排团队。"`）。
  - 在全部 110 张委托的隐藏需求（`requirements`）中，仍有 **52 处**叫 `"特定交付格式"`、**17 处**叫 `"需要可编辑原稿"`、**13 处**叫 `"补充交付格式"`、**8 处**叫 `"保留反例"`、**7 处**叫 `"确认目标读者"`；且所有隐藏需求揭示后**依然只是机械地 `+2 WP` 并消除 `-8` 质量扣分**，没有任何一条隐藏需求会改变能力权重（如揭示出需要写文档而增加 `write` 权重）或改变工期/报酬。
  - 在 [`content/campaign/m5.json`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/content/campaign/m5.json) 的 **60 段伙伴剧情**中，仅开局 4 位角色的各前 2 段（共 8 段）改写成了有具体情境的互动选项；其余 **52 段剧情**（包括开局 4 人的第 3–5 段以及后续 8 位可招募角色的全部剧情）的选项依然是 `陪伴：<标题>` vs `记录：<标题>` 的机械模板。

---

### 3.3 A2 派遣预估（`forecastAssignment`）与实际模拟结算（`simulation.ts`）的三大偏差

Productization A2 新增的 [`forecastAssignment`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/packages/oot-core/src/preview.ts#L39-L65) 是一项非常关键的改进，但在边界条件下存在 3 处逻辑失真：

1. **在晚间/深夜预览低精力角色时，误报“28天内无法完成”（`noProgress` 假阴性）**：
   - [`preview.ts:44-47`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/packages/oot-core/src/preview.ts#L44-L47) 在推演未来 112 个时段时，构造的帧为 `const frame = {...s, absoluteSlot: slot, overtime: offset === 0 ? s.overtime : []}`，**完全冻结了角色当前的 `energy` 和 `load`**。
   - 假如当前是晚上（`slot % 4 === 2`）或深夜（`slot % 4 === 3`），某位主力角色因为白天干活导致当前 `energy < 10`（例如 `5`）。在真实规则（[`simulation.ts:178-181`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/packages/oot-core/src/simulation.ts#L178-L181)）中，只要今晚不加班，该角色在深夜（`slot % 4 === 3`）睡觉后会确定性恢复 `+60` 精力并清空 `load = 0`，第二天早上满血开工！
   - 但由于 `forecastAssignment` 冻结了 `energy = 5`，它在全部 112 个未来时段中都判定该角色 `!attending(a.id)`，直接向玩家显示 **`本阶段完成时间：—（0 工作时段）`** 并弹出红字警告：**“28天内无法完成：检查执行者精力、工作节律或挑战限制”**，严重误导玩家在晚间排班。
2. **对连续多槽工作的精力衰减与上下文过载（`load > context`）盲目乐观（假阳性）**：
   - 反过来，当角色在上午处于 `energy = 60`（产出系数 `1.0`）、`load = context`（尚未过载，系数 `1.0`）时，上午工作 1 槽后，下午其精力必降至 `45`（系数 `0.85`）且负载升至 `context + 1`（过载系数 `0.7`），实际下午产出只有上午的 `0.85 × 0.7 = 59.5%`。
   - 但 `forecastAssignment` 假设未来所有工作槽都維持 `1.0 × 1.0` 的初始状态，高估了多时段长单的推进速度，导致紧迫委托（如 `speech` 3 个工作槽交期）在预估中显示“准时完成”，实际执行却因下午降速而逾期。
3. **残余工作量（Partial Work）未截断导致 `risks.cloud` 与 `supportBudgetReady` 虚报资源不足**：
   - 在 [`preview.ts:64`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/packages/oot-core/src/preview.ts#L64) 中：`cloud: estimateResources(s, c, job).cloud > s.quota + s.purchased` 调用了默认的 `partial = false`（不按剩余 `job.work - job.progress` 截断工作量），而非 `firstSlot.cloud`（`partial = true`）。
   - 同理，在 [`simulation.ts:70`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/packages/oot-core/src/simulation.ts#L70) 中：`const budget = estimateResources(s, c, j)` 也未传入 `partial = true`！
   - 当一张委托只剩最后 `2 WP` 即可完工、且队伍中带有 `tool`（工具人）时，实际本槽只需消耗 `2 WP` 对应的少量额度；但 `estimateResources(s, c, j, false)` 会按整槽满额产出（如 `15 WP`）计算 `budget`，一旦当前剩余配额介于“2 WP 所需额度”与“15 WP 满槽额度”之间，`simulation.ts:71` 会错误判定 `supportBudgetReady = false`，导致 `Planner` 和 `Tool` 无故罢工，同时 UI 也会误报“本槽云端额度不足”。

---

### 3.4 第 1 章“社区书店”大订单（Productization B）体验评估

[`projects.ts`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/packages/oot-core/src/projects.ts) 与 [`projects-b1.json`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/content/campaign/projects-b1.json) 的设计质量很高：
- **双路线差异真实**：路线一“小范围系统”（`build`，偏代码 `0.7` + 推理 `0.3`，26 WP × 2 期，报酬 1550/期）适合培养 `DeepSeek`/`Llama` 本地算力体系；路线二“服务手册先行”（`guide`，偏写作 `0.5` + 知识 `0.4`，22 WP × 2 期，报酬 1350/期）适合 `Qwen` 及第 1 章新招募的 `Claude`/`Kimi`。
- **客户反馈有叙事温度**：每阶段验收达标后都有一段具体的书店试营业反馈（如读者连按两次预约只留一条记录、新店员照手册改期不再发“在线等，急”），把干瘪的“阶段 1/3”变成了可感知的甲乙双方合作过程。
- **需要注意的体验细节**：
  - 当玩家在第 1 章选择路线（`project-start`）或点击“确认反馈，领取下一单”（`project-next`）时，系统将专属合同推入 `s.jobs`，但**UI 只显示“安排好了。”，既没有自动弹出刚刚生成的专属委托详情框，也没有高亮提示“请点击下方『打开当前委托』先进行澄清/接单”**。如果玩家没注意到要在当天接单，次日早晨刷新时该专属合同就会过期并被迫支付 `¥60` 重约费。

---

## 四、UI 与交互体验审查（UI/UX Review）

### 4.1 【P1 视觉/UI 缺陷】“回形针 · 开业手册”（`.onboarding`）严重遮挡场景标题与首排角色

在桌面端（`1280×720`）和移动端（`390×844`）实机截图中，新增的左中悬浮窗 `.onboarding`（[`style.css:2`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/src/style.css#L2)）存在严重的布局碰撞：
- **桌面端（`1280×720`）**：
  - `.place-heading` 位于 `top: 178px; left: 34px`，其副标题 `<p>今天，也一起好好开工。</p>` 渲染在 `y = 262px..282px`。
  - `.onboarding` 硬编码在 `top: 270px; left: 28px; width: 260px`（高约 `145px`，底边至 `y = 415px`）。
  - **实机表现**：`.onboarding` 的上边框**直接横切在“今天，也一起好好开工。”这行字的正中间**；下半部分则**将左侧第 1 个工位的角色（4 人局的 `DeepSeek`、12 人局第 1 排的 `DeepSeek` 与 `Qwen` 左半身）从头到脚完全盖住**！
- **移动端（`390×844`）**：
  - `@media(max-width:650px)` 将 `.onboarding` 设为 `top: 245px; left: 14px; width: calc(100% - 28px)`（全宽横幅，底边至 `y = 385px`）。
  - 而 `stationLayout(390, 844, 12)` 计算出的第 1 排角色头部位于 `y = 305px..375px`。
  - **实机表现**：移动端上 `.onboarding` **把第一排全部 4 名角色（`DeepSeek`、`Qwen`、`Llama`、`Mistral`）的脑袋和上半身整齐截断遮死**！
- **跨章节常驻不消失**：
  - 查看 [`onboarding.tsx:8,23-24`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/src/onboarding.tsx#L8)：当 `view.campaign.chapter > 0` 时，它返回 `{ key: 'chapter', job: null }` 并继续显示长段提示文案。除非玩家手动点击标题栏来折叠，否则从第 0 章一直到第 4 章通关，这块面板永远挡在画面左中位置。

### 4.2 【P1 交互缺陷】点击“验收结算（Deliver）”后弹窗变成空白无按钮死框，且遮挡交付庆祝

查看 [`alpha-app.tsx:80-83`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/src/alpha-app.tsx#L80-L83)：
- 在委托弹窗 `<Dialog>` 中：
  - 第 80 行仅在 `job.status === 'posted'` 时渲染澄清/接单按钮；
  - 第 81 行仅在 `['accepted', 'working'].includes(job.status)` 时渲染派遣工作台；
  - 第 82 行仅在 `job.status === 'review'` 时渲染 `<DeliverySummary>` 与“返工 / 验收结算”按钮：
    ```tsx
    <button class="primary" disabled={locked||!job.settlement.canDeliver} onClick={()=>{void send({type:'deliver',job:job.id});}}>{tr('验收结算','Deliver')}</button>
    ```
- **复现与后果**：
  1. 当玩家在 `job.status === 'review'` 时点击 **“验收结算”**，命令执行成功后：
     - 若是单期委托（`oneshot`）或末期合同，`job.status` 变为 `'delivered'`；
     - 若是多期合同（`multi` / `retainer`）的非末期阶段且未装 `ci` 软件，`job.status` 变为 `'waiting'`。
  2. 但此时 `jobId` **既没有被清空（`setJobId(null)`），`<Dialog>` 中也没有针对 `'delivered'` 或 `'waiting'` 分支的任何操作按钮或说明组件**！
  3. 玩家点击“验收结算”后，原本的结算卡片和按钮瞬间消失，屏幕上只剩下一个光秃秃的半截模态框（仅显示委托标题、描述和一行“本阶段已结算，现金变动 ¥xxx”），没有任何“完成/关闭”或“查看下一阶段”的主按钮；同时因为模态框与抽屉仍然遮挡着整个屏幕，主线程在 `scene-layout.ts:19-20` 专门为交付槽设计的**角色庆祝动作（`reactionFor -> 'happy'`）被弹窗背景遮得严严实实，玩家根本看不见**！

### 4.3 派遣工作台、伙伴简历与双抽屉重复面板问题

1. **派遣工作台禁用时缺少错误原因反馈（[`alpha-app.tsx:81`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/src/alpha-app.tsx#L81)）**：
   - 当 `preview.error` 非空时（例如玩家先选了“审查者”或“负责人”但还没选“执行者”导致 `INVALID_ROLES`，或选了超过 4 人导致 `INVALID_TEAM`，或在无尽周挑战中选了不符合条件的版本导致 `CHALLENGE_TEAM`），`preview.forecast` 为 `null`，“确认派遣”按钮变灰禁用，但**界面上没有任何文字显示 `messages[preview.error]`**！玩家不知道为什么选了人却不显示预估、也不让点确认。
   - 此外，第 81 行 `<select onChange={e => setTeam({...team, ...})}>` 使用了非函数式状态更新，若快速连续触发两次变更会因闭包读取旧 `team` 导致前一次修改丢失，建议改为 `setTeam(prev => ({...prev, ...}))`。
2. **伙伴抽屉与待招募卡片信息不完整（[`alpha-app.tsx:66-67`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/src/alpha-app.tsx#L66-L67)）**：
   - 用户明确提出：“伙伴页面可以用类似简历的形式，有照片、个人介绍、能力，已经招募的伙伴有心情、干劲等属性，未招募的则是类似‘锁定，待招募’。”
   - 目前抽屉列表里的已招募卡片只写了 `工作室 · 精力 100`，**没有显示心情（Mood）、负载（Load/Context）和前两项核心能力**；
   - 待招募列表（`.locked-profile`）则是纯 `<div>` 而非 `<button>`，**玩家在花钱招募前无法点击查看 GPT、Claude、Kimi 等角色的擅长能力、单价、速度以及是否支持本地部署**。
   - [`character-profiles.ts`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/src/character-profiles.ts) 仅编写了 7 位角色（`bluewhale`、`qwen`、`llama`、`mistral`、`gpt`、`claude`、`kimi`），后 5 位角色（`gemini`、`grok`、`glm`、`minimax`、`seedance`）缺失专属简历文案。
3. **`<ProjectPanel>` 在“工作室”与“手账”两个抽屉顶部重复渲染（[`alpha-app.tsx:70,74`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/src/alpha-app.tsx#L70)）**：
   - 第 1 章开启后，近 400px 高的 `<ProjectPanel>` 同时出现在“经营工作室”抽屉最上方和“工作室手账”抽屉最上方，甚至在项目归档完成（`p.completed === true`）后依然占据两个抽屉的首屏，把工作室的资金面板/章节目标以及手账的终局/收支流水全部挤到了折叠区下方。建议在“工作室”抽屉保留完整操作面板，在“手账”抽屉仅作为可折叠归档记录展示。

---

## 五、视觉与美术表现审查（Visual & Art Review — 对照 `ai-village`）

### 5.1 角色活动、家具关系与动画：为何不像 `ai-village`？

对照 `ai-village`（[`packages/ai-village/src/frame/scene.ts`](file:///D:/Documents/FeiyangChen/devApps/dsh_plugin/packages/ai-village/src/frame/scene.ts) 与 [`animation.ts`](file:///D:/Documents/FeiyangChen/devApps/dsh_plugin/packages/ai-village/src/art/animation.ts)）与当前 `out-of-tokens`（[`apps/web/src/scene.ts`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/src/scene.ts)）：

1. **核心差异一：空间与工位解耦 vs “人桌强绑定阵列”**
   - 在 `ai-village` 中，场景家具（工作桌、餐桌、长椅、阅读角、花草角）是固定在房间地板上的独立图层（拆分为 `-back.png` 和 `-front.png` 按 `y * 10` 深度排序）；角色在空闲时在院子/长椅/书架旁散步或互动，只有触发工作或用餐意图（`intent.furnitureId === 'work'`）时，才会寻路走到工作桌的座位锚点坐下。
   - 而在 `out-of-tokens` 的 [`scene.ts:25-49`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/src/scene.ts#L25-L49) 中：
     - 代码遍历当前场景的每位角色 `members.forEach`，**为每个人现场画一套独立的椅子（`box(station, -27, -58, ...)`）和办公桌/显示器（`furniture`）**！
     - 这意味着：**哪怕角色处于“空闲（可以安排）”或“深夜休息”状态，她也永远被关在自己的椅子和办公桌之间**！
     - 更违和的是 [`scene.ts:54`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/src/scene.ts#L54) 的“待机走动”逻辑：
       ```ts
       const idle=a.activity==='idle';
       const phase=Math.floor(elapsed/5+a.base)%3;
       const tx=a.x+(idle?[-24,28,0][phase]!*a.scale:0),ty=a.y+(idle?[10,-8,0][phase]!*a.scale:0);
       ...
       a.layer.position.set((walker.x-a.x)/a.scale,(walker.y-a.y)/a.scale);
       ```
       因为 `a.layer`（包含人物纸娃娃、脚下椭圆阴影、底部名牌、头顶气泡）是 `station` 的子容器，夹在椅背（`z` 在后）和办公桌（`z` 在前）中间，当 `idle` 触发 `[-24, 28, 0]` 偏移时，**办公桌和显示器原地不动，而角色连同脚下的名牌一起在桌子后面往左歪 24px、再往右歪 28px**！在实机截图中可以看到：Qwen、Llama、Mistral 站在显示器偏右侧，名牌也歪在桌子右下方，既没有真正走出工位，又破坏了工位的对齐感。
     - 同样地，当角色首次进入场景时，`walker` 从左下方 `(40, h * 0.7)` 走向 `(a.x, a.y)`。此时她的办公桌已经孤零零地摆在 `(a.x, a.y)`，而她本人顶着脚下的名牌和“可以安排”字样从屏幕左侧一路穿过别人的桌子滑进自己的桌后。
2. **核心差异二：矢量几何块家具 vs 手绘背景与精致 Q 版角色的美术割裂**
   - 背景图（`garage.webp`、`incubator.webp`、`canteen.webp`、`library.webp`）本身已经绘制了极其精美的透视木桌、咖啡吧台、白板、服务器机柜、沙发和书架。
   - 但 `scene.ts:29-43` 用 PixiJS `Graphics().roundRect` 在前景地板上又画了一排**纯色几何矩形块**充当桌子、显示器和饭碗。这些无纹理、无透视变化的纯色圆角矩形与精细的 AI Village 纸娃娃及手绘背景在美术风格上格格不入。
3. **核心差异三：未复用 `ai-village` 原生动作数据（`animations.json` 与手部动作贴图）**
   - 源仓库 `dsh_plugin/packages/ai-village` 中原本就有完整的 `animations.json` 关键帧数据、12 位角色的专属微动作（[`applyLifePose`](file:///D:/Documents/FeiyangChen/devApps/dsh_plugin/packages/ai-village/src/art/animation.ts#L74-L143)：如 DeepSeek 摇鲸鱼尾 `whale-tail`、Qwen 记笔记 `thoughtful-note`、Llama 拥抱 `woolly-hug`、Mistral 抚羽帽 `feather-tip`）以及 `work-left.png` / `eat-left.png` / `rest-pose.png`。
   - 当前 [`village-characters.ts:18-27`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/src/village-characters.ts#L18-L27) 只是手写了一个简单的正弦波 `Math.sin(phase)` 旋转左右手臂与双腿，导致所有角色的工作、吃饭、阅读动作看起来都像同一种机械摆臂。

---

### 5.2 UI 配色与深浅色主题：CSS 层叠覆盖 Bug 导致“白绿 AI 风”大量残留

用户在 `review-by-user.md` #2 中明确指出：**“UI 配色的白绿的 AI 风太严重，UI、配色全面参考 `ai-village`。”**
主线程修改了 [`tokens.css`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/src/tokens.css)，并在 [`style.css`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/src/style.css) 第 4 行插入了部分覆盖规则，但**因为没有清理 `style.css` 第 6–17 行的旧规则，引发了多处 CSS 层叠反转（Cascade Override Bug）与硬编码绿色残留**：

1. **`style.css` 后半段旧规则直接覆盖了第 4 行的新规则（P1 样式缺陷）**：
   - **主按钮悬停变回墨绿色**：第 4 行写了 `button.primary:hover:not(:disabled){background:#785030}`（暖棕），但**第 6 行紧接着又定义了同优先级的 `button.primary:hover:not(:disabled){background:#315e59}`（墨绿）**！由于第 6 行在后，浅色模式下所有主按钮（如“下一时段”、“接单”、“确认派遣”）鼠标悬停时全部变成墨绿色 `#315e59`！
   - **深色模式主按钮文字与悬停变回绿/薄荷绿**：第 4 行写了 `:root[data-theme=dark] button.primary,:root[data-theme=dark] .studio-dock button[aria-pressed=true]{color:#352b24}`，但**第 15 行（位于文件末尾）再次定义了完全相同的选择器**：
     ```css
     .hud-tools button{color:#30453f}
     :root[data-theme=dark] button.primary,:root[data-theme=dark] .studio-dock button[aria-pressed=true]{color:#173b2b}
     :root[data-theme=dark] button.primary:hover:not(:disabled){background:#b4ddc8}
     ```
     导致：
     - 右上角工具按钮图标永远是墨绿色 `#30453f`（覆盖了第 4 行的 `color: var(--ink)`）；
     - 深色模式下主按钮文字变成深绿色 `#173b2b`，鼠标悬停时背景直接变成刺眼的**薄荷绿 `#b4ddc8`**！
2. **首屏 HUD 与 Canvas 内部硬编码绿色未清理**：
   - [`style.css:7`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/src/style.css#L7)：
     - `.brand-mark`：`background: #315f59`（左上角醒目的墨绿方块 `ot.`）
     - `.studio-brand`：`color: #233d37`；`.studio-brand small`：`color: #324a40`
     - `.place-heading`：`color: #294138`（左侧大标题“开源车库 / 共享孵化器”全部为深森林绿）
     - `.scene-location`：`color: #244136`；`.location-dot`：`background: #639979`（左下角场景切换胶囊的绿字与绿点）
     - `.project-panel blockquote`（第 17 行）：`border-left: 3px solid #668a79; background: #668a7915`（绿框引用块）
   - [`scene.ts`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/src/scene.ts)：
     - 第 12 行：`label(..., color=0x344b42)`（名牌文字墨绿）
     - 第 39、41 行：显示器外壳 `0x465d5b`、屏幕 `0xb2d3cb`/`0xd6e0d3`、代码线 `0x5e8b7d`（青绿色电脑）
     - 第 42 行：食堂餐盘 `0x94b3a2`（青绿色）
     - 第 46 行：状态文字 `0x405f53`（“可以安排/工作中”为墨绿色）
   - **角色简历弹窗 `<meter>` 进度条（实机截图 `07`）**：
     - 6 条能力进度条在 Chromium 中呈现为高饱和度的**原生亮绿色**（`#107c41`），与暖色简历卡极不协调（需自定义 `meter::-webkit-meter-bar` 与 `meter::-webkit-meter-optimum-value` 样式或改用自定义进度条 `<div>`）。
3. **深色模式（Dark Mode）下 HUD 局部未响应主题（实机截图 `12-dark-mode-main.png`）**：
   - 开启深色界面后，右上角 `.hud-tools button`（`background: #fff9eddd`）和左下角 `.scene-location`（`background: #fffaecd9; color: #244136`）仍然是亮米白底配深绿字，在深色 UI 中格外突兀；同时左上角 `.place-heading` 保持深绿字配亮白光晕（`text-shadow: 0 1px 8px #fff`）。
   - 对照 `ai-village`（[`ui-v11-contract.ts:122-145`](file:///D:/Documents/FeiyangChen/devApps/dsh_plugin/packages/ai-village/src/core/ui-v11-contract.ts#L122-L145) & [`ui-theme.ts:4`](file:///D:/Documents/FeiyangChen/devApps/dsh_plugin/packages/ai-village/src/client/ui-theme.ts#L4)）：`ai-village` 严格使用浅色 `rgba(255, 248, 235, 0.68)` / 文字 `#342E28` / 强调色 `#4A351F`，深色 `rgba(57, 51, 47, 0.74)` / 文字 `#FFF6EA` / 强调色 `#F7E9CF`，且根据环境自动切换 `--hud-ink`（`#342E28` vs `#FFF6EA`）与 `--hud-halo`（`#fff6eaaa` vs `#342e28aa`）。

---

### 5.3 四时段环境光照（Morning / Afternoon / Evening / Night）视觉表现

查看 [`style.css:4`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/src/style.css#L4) 与实机截图 `01`～`04`：
```css
.scene-stage[data-period='0']::after{background:#ffd68b0c}
.scene-stage[data-period='1']::after{background:#ffe2a620}
.scene-stage[data-period='2']::after{background:linear-gradient(130deg,#e8924c38,#705c9145)}
.scene-stage[data-period='3']::after{background:#17244377}
```
1. **上午（`0`）与下午（`1`）几乎看不出变化**：`4.7%` 与 `12.5%` 透明度的浅黄色叠加在原本就是暖黄调的工作室背景上，切换时段时玩家几乎感知不到光线移动。
2. **深夜（`3`）滤镜层级错误，压暗了角色名牌却压不住背景的白天烈日**：
   - `.scene-stage::after` 盖在整个 `.workshop`（含 PixiJS `<canvas>`）上方，导致深夜时角色脚下的白底名牌（`#fff9ee`）被染成灰蓝色（`#9aa0a6`），降低了文字可读性。
   - 与此同时，底图 `garage.webp` 天窗外的蓝天、白云以及地面上明晃晃的日照光斑依然清晰可见，而室内的吊灯、台灯、电脑屏幕没有任何暖光点亮效果（对比 `ai-village` 在黄昏/夜晚通过 `backdrop.tint`、`worldContent.tint` 分层调色并在窗户/灯具坐标绘制 `0xffdf9d` 暖光晕）。
   - 深夜时左上角 `.place-heading` 的白色文字光晕（`text-shadow: 0 1px 8px #fff`）在深蓝底色上显得像刺眼的白雾。

---

### 5.4 12 角色同屏缩放与文字可读性（`11a-12-actors-desktop.png` / `11b-12-actors-mobile.png`）

在 [`scene-layout.ts:6`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/src/scene-layout.ts#L6) 中：
```ts
const scale=Math.max(.1,Math.min(compact?.72:1,cellWidth/160,cellHeight/250));
```
- 当 12 人同在工作室时：
  - 桌面端（`1280×720`，2 行 × 6 列）：`cellHeight = (530 - 302.4) / 2 = 113.8px` $\Rightarrow$ `scale = 113.8 / 250 = 0.455`！
  - 移动端（`390×844`，3 行 × 4 列）：`cellWidth = 358 / 4 = 89.5px`，`cellHeight = 261 / 3 = 87px` $\Rightarrow$ `scale = 87 / 250 = 0.348`！
- 因为 [`scene.ts:26,44-46`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/src/scene.ts#L26) 将 `station.scale.set(scale)` 直接作用在包含名牌和状态文字的父容器上，原本 `fontSize: 10` 的文字在 12 人同屏时被缩到了 **桌面端 `4.5px`、移动端 `3.5px`**！
- 在实机截图 `11a` 和 `11b` 中，12 人同屏时所有角色底部的名字和状态字已经缩成一团无法辨认的像素点。
- **修复建议**：
  - 将角色名牌/状态标签移出 `station` 缩放容器（或按 `1 / scale` 反向补偿字号，保持最终渲染字号不低于 `11px`），并在超过 6 人同场时采用紧凑单行名牌或仅对选中/忙碌角色常显状态行；
  - 更根本的做法是参考 `ai-village`：工作室只固定摆放 **4–6 个工作站工位**（对应硬件“办公线”支持的并行工位），正在执行委托的角色坐在工位前，其余空闲角色分布在休息角、咖啡吧台、书架旁或食堂/图书馆，既符合 GDD §4.1“工位限制并行”的设定，又彻底解决了 12 套办公桌挤满屏幕导致缩成蚂蚁的问题！

---

## 六、具体缺陷清单（按优先级排序，附精确代码定位与复现）

### P1 级缺陷（直接损害核心体验、主流程交互或造成明显视觉穿帮，建议下轮最优先修复）

#### 1. `[UI-1108-01]` 开业手册浮窗（`.onboarding`）在桌面与移动端遮挡场景标题及首排角色，且跨章节常驻
- **定位**：[`apps/web/src/style.css:2`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/src/style.css#L2)、[`apps/web/src/onboarding.tsx:5-27`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/src/onboarding.tsx#L5-L27)
- **最小复现**：在 `1280×720` 或 `390×844` 分辨率下打开游戏首页。
- **实际表现**：`.onboarding`（桌面 `top: 270px; left: 28px; width: 260px`，移动 `top: 245px; width: calc(100% - 28px)`）上半部直接切穿 `.place-heading` 的副标题“今天，也一起好好开工。”，下半部完全盖住左侧首排角色（`DeepSeek` 等）及工位；进入第 1–4 章后仍默认展开。
- **修复建议**：将开业手册整合进右上角 `.work-board`（作为看板顶部的“当前引导”折叠栏）或移至底栏上方紧凑提示条；当 `view.campaign.chapter > 0` 或完成首个委托交付后默认自动收起。

#### 2. `[UI-1108-02]` 点击“验收结算（Deliver）”后委托弹窗不关闭且变为空白无按钮死框，遮挡角色庆祝演出
- **定位**：[`apps/web/src/alpha-app.tsx:80-83`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/src/alpha-app.tsx#L80-L83)
- **最小复现**：推进任意委托至 `review`（待验收）状态，打开委托弹窗并点击“验收结算”。
- **实际表现**：`job.status` 变为 `'delivered'`（或 `'waiting'`），但 `jobId` 未清空，`<Dialog>` 保持打开且内部无任何匹配 `'delivered'` / `'waiting'` 的组件或按钮，玩家面对一个无操作按钮的半截弹窗，且画布上的交付庆祝表情被弹窗背景完全遮住。
- **修复建议**：点击“验收结算”成功后（`send({type:'deliver', job:job.id}).then(ok => ...)`），若单期/末期已完成则自动关闭弹窗（或展示带“确认并关闭”按钮的结算回执卡）；若进入多期合同的 `'waiting'` 阶段，则在弹窗内明确展示“第 X 期已结算，第 X+1 期将于第 Y 天上午开始”并提供关闭按钮。

#### 3. `[VIS-1108-01]` `style.css` 层叠顺序（Cascade）错误导致旧版墨绿/薄荷绿样式覆盖新暖色方案
- **定位**：[`apps/web/src/style.css:4,6,7,15,17`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/src/style.css#L4)、[`apps/web/src/scene.ts:12,30,39,41,42,46`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/src/scene.ts#L12)
- **最小复现**：在浅色/深色模式下查看首页左上角标志、场景标题、左下角胶囊、悬停“下一时段”主按钮，或打开角色详情查看能力条。
- **实际表现**：
  1. `style.css:6` 的 `button.primary:hover:not(:disabled){background:#315e59}` 覆盖了第 4 行的 `#785030`；
  2. `style.css:15` 的 `.hud-tools button{color:#30453f}` 与 `:root[data-theme=dark] button.primary{color:#173b2b}`、`hover{background:#b4ddc8}` 覆盖了第 4 行的深色暖棕规则；
  3. `.brand-mark`（`#315f59`）、`.place-heading`（`#294138`）、`.scene-location`（`#244136` / `#639979`）、`<meter>` 原生绿条及 `scene.ts` 中的显示器/文字颜色全部残留旧版青绿/墨绿色。
- **修复建议**：彻底删除 `style.css` 第 6、7、15、17 行中的重复/旧版绿色硬编码，统一收敛至 `tokens.css` 变量（参考 `ai-village` 的 `#342E28` / `#4A351F` / `#FFF6EA`）；为 `<meter>` 编写显式 WebKit/Moz 伪元素暖棕配色；同步更新 `scene.ts` 中的矢量显示器与文字色值。

#### 4. `[ART-1108-01]` 角色与工位强绑定，待机走动在桌后夹层内带名牌歪斜平移，未实现“自由活动再上工位”
- **定位**：[`apps/web/src/scene.ts:24-54`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/src/scene.ts#L24-L54)、[`apps/web/src/scene-layout.ts:2-16`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/src/scene-layout.ts#L2-L16)
- **最小复现**：开局不派单，观察主场景中处于“可以安排（`idle`）”状态的 4 位角色 5–10 秒；或切换场景观察角色进场。
- **实际表现**：每位角色无论忙闲都被绑定在自己的 `station`（椅背+桌子+显示器）内；`idle` 时 `a.layer` 相对桌子左右偏移 `-24px / +28px`，导致角色身体偏到显示器侧面、脚下名牌与桌子错位，但人依然被关在办公桌后面；且 12 人同屏时 `station.scale` 缩至 `0.35–0.45`，导致名牌文字缩至 `3.5px–4.5px` 无法阅读。
- **修复建议**：
  1. 将**工位（Workstations）**与**角色（Actors）**分离：工作室场景固定摆放工位锚点（仅 `working`/`review` 角色入座工位）与休闲锚点（沙发、咖啡角、白板、书架，供 `idle`/`rest` 角色站立或走动）；
  2. 角色名牌保持固定可读字号（`>=11px`），不随人数增加而无下限缩小；
  3. 接入 `ai-village` 原有的 `animations.json` 关键帧与角色特色微动作（`applyLifePose`）。

#### 5. `[GAME-1108-01]` 委托 4 槽（1 天）过期与“仅白天可澄清 + 澄清后次槽才可改签/接单”冲突，且第 0 章澄清率误用 `maxChapter`
- **定位**：[`packages/oot-core/src/simulation.ts:30-32,135,183,341,349,364,371,453`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/packages/oot-core/src/simulation.ts#L30-L32)
- **最小复现**：第 1 天上午对 `website`（2 条隐藏需求）澄清 1 次，若未命中（41%–49% 概率）或下午揭示第 2 条需求后未在当晚/深夜手动点开弹窗改签接单，推进至第 2 天上午（`slot 4`）。
- **实际表现**：`website` 在 `slot 4` 早晨刷新时直接过期消失，玩家此前投入的澄清时段与精力全部打水漂。同时 `simulation.ts:135,183,371,453` 全部将章节门槛写成了 `(c.campaign?.maxChapter ?? 0) >= 2`（静态恒为 `true`）而非 `(s.campaign?.chapter ?? 0) >= 2`。
- **修复建议**：
  1. 将 `simulation.ts` 中判断当前战役章节的 `c.campaign?.maxChapter` 修正为 `s.campaign?.chapter`（或明确区分静态配置与动态章节）；
  2. 对已开始澄清（`j.revealed > 0 || j.clarifyingUntil > 0`）或属于项目邀约（`project`）的委托，延长其在委托板上的过期时间（如至少保留至澄清完成后的下一个白天工作时段结束）。

---

### P2 级缺陷（影响策略准确性、内容连贯性或次级界面体验）

#### 6. `[GAME-1108-02]` `forecastAssignment` 冻结精力与负载，导致晚间预览低精力角色误报“28天内无法完成”，且残余工作量未截断导致 `risks.cloud` / `supportBudgetReady` 误判
- **定位**：[`packages/oot-core/src/preview.ts:39-65`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/packages/oot-core/src/preview.ts#L39-L65)、[`packages/oot-core/src/simulation.ts:70`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/packages/oot-core/src/simulation.ts#L70)
- **最小复现**：
  1. 在晚上（`slot % 4 === 2`）选择一名白天工作后 `energy < 10` 的角色作为执行者预览派遣；
  2. 或在委托仅剩 `2 WP`、配额剩余 `30 T`（够完成 `2 WP` 但不够满槽 `15 WP`）时，派遣含 `tool` 的队伍。
- **实际表现**：
  1. 晚间预览直接显示 `completion: null` 并警告“28天内无法完成”，忽略了角色当晚睡觉后会恢复 `+60` 精力并清空负载；
  2. `simulation.ts:70` 与 `preview.ts:64` 调用 `estimateResources(s, c, j)` 未传 `partial = true`，按未截断的满槽工作量检查配额，导致收尾阶段误判额度不足。
- **修复建议**：在 `forecastAssignment` 的帧推演中同步模拟确定性的日夜精力恢复/消耗与负载增减；将 `simulation.ts:70` 与 `preview.ts:64` 的 `estimateResources` 调用改为 `estimateResources(s, c, j, true)`（或对比 `firstSlot.cloud`）。

#### 7. `[GAME-1108-03]` 第 0 章精选委托池（`starterJobs`）仅限制前 7 天（`slot < 28`），第 8 天起 88 张未精修模板委托涌入
- **定位**：[`packages/oot-core/src/simulation.ts:35`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/packages/oot-core/src/simulation.ts#L35)、[`content/campaign/commissions-m5.json`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/content/campaign/commissions-m5.json)
- **最小复现**：在第 0 章推进到第 8 天早晨（`absoluteSlot === 28`），打开“待接单”列表。
- **实际表现**：第 0 章尚未结束（第 14 天才结算旧债），但从第 8 天起，102 张 `minChapter: 0` 的全量委托解禁，其中包含大量描述千篇一律（“甲方描述含糊；先澄清范围…”）及隐藏需求同质化（52 处“特定交付格式”）的旧模板委托。
- **修复建议**：将 [`simulation.ts:35`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/packages/oot-core/src/simulation.ts#L35) 的 `s.absoluteSlot < 28` 改为 `(s.campaign?.chapter ?? 0) === 0`（使第 0 章全程使用精选池，或将第 0 章后半周扩充至 18–20 张精修委托），并为 `commissions-m5.json` 中其余委托合理分配 `minChapter: 1..4` 及差异化隐藏需求。

#### 8. `[UI-1108-03]` 伙伴列表缺心情/擅长展示、待招募卡不可点击查看能力、后 5 位伙伴缺个人档案文案
- **定位**：[`apps/web/src/alpha-app.tsx:66-67`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/src/alpha-app.tsx#L66-L67)、[`apps/web/src/character-profiles.ts:1-10`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/src/character-profiles.ts#L1-L10)
- **实际表现**：
  1. 伙伴抽屉中已招募卡片仅显示 `位置 · 精力`，不显示心情、负载与前两项擅长能力；
  2. 待招募伙伴卡（`.locked-profile`）无法点击打开预览弹窗，玩家在招募前看不到角色属性、单价与支持模式（云端/本地）；
  3. `gemini`、`grok`、`glm`、`minimax`、`seedance` 在 `character-profiles.ts` 中无条目，打开详情仅显示通用占位句。
- **修复建议**：补齐后 5 位角色的双语个人档案；在已招募卡片补充心情、负载与擅长标签；允许点击待招募卡片打开只读预览档案（显示能力条、初始版本属性、支持部署方式与解锁条件）。

#### 9. `[VIS-1108-02]` 四时段环境光照在白天变化微弱、深夜压暗 Canvas 名牌且与背景正午烈日冲突，深色模式下浅色胶囊未适配
- **定位**：[`apps/web/src/style.css:4,7,15`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/src/style.css#L4)
- **实际表现**：
  1. `data-period='0'`（`#ffd68b0c`）与 `'1'`（`#ffe2a620`）透明度过低，上午与下午无明显视觉区分；
  2. `data-period='3'`（深夜 `#17244377`）作为顶层伪元素把角色白色名牌染成灰暗色，而背景图天窗与地板日照光斑仍如正午，且 `.place-heading` 深绿字配白光晕在暗底上发白刺眼；
  3. 深色模式（`data-theme=dark`）下，`.scene-location` 与 `.hud-tools button` 仍为浅米色背景（`#fffaecd9` / `#fff9eddd`）。
- **修复建议**：将时段色调作用于背景层與 PixiJS 角色层（而非盖在名牌 UI 之上），在傍晚/深夜提高夕阳暖橙与夜色对比度，并在 `scene.ts` 中为夜晚工位显示器/室内灯具叠加暖色发光圆晕；在 `data-period='3'` 及 `data-theme='dark'` 下同步切换 `.place-heading`、`.studio-brand`、`.scene-location` 与 `.hud-tools button` 的前景色和底色变量。

#### 10. `[UI-1108-04]` 世界地图弹窗（`.world-map`）仍为 3 列网格卡片配穿帮旋转边框，未对齐 `ai-village` 地图交互且不显示在场伙伴
- **定位**：[`apps/web/src/alpha-app.tsx:77`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/src/alpha-app.tsx#L77)、[`apps/web/src/style.css:4-5`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/src/style.css#L4-L5)
- **实际表现**：地图弹窗只是 3 个并排按钮加一个旋转 20° 的 `.map-road` 半圆边框（右下角“图书馆”卡片左下方露出断裂尖角），且不显示当前各场景有哪些伙伴在场，玩家找人时仍需盲猜。
- **修复建议**：参考 `ai-village` 的 [`CommunityMap.tsx`](file:///D:/Documents/FeiyangChen/devApps/dsh_plugin/packages/ai-village/src/client/CommunityMap.tsx)，使用 SVG 路径连接 2D 坐标地标节点（工作室、食堂、图书馆，以及第 3 章解锁的异世界远征入口或规划节点），并在每个节点旁直接展示当前在该场景的伙伴小头像（或已安装“精准找人”软件时的精确名单）。

---

### P3 级建议（打磨项与长线内容深化）

1. **`[UI-1108-05]` 派遣弹窗增加错误信息展示与函数式状态更新**：在 [`alpha-app.tsx:81`](file:///D:/Documents/FeiyangChen/devApps/ai-game/out-of-tokens/apps/web/src/alpha-app.tsx#L81) 中，当 `members.length > 0 && preview?.error` 时直接渲染提示文案（如 `messages[preview.error]`），并将 `setTeam({...team, ...})` 改为 `setTeam(prev => ({...prev, ...}))`。
2. **`[UI-1108-06]` 消除 `<ProjectPanel>` 在“工作室”与“手账”双抽屉的重复置顶**：在“经营工作室”抽屉展示当前章节活跃项目，在“工作室手账”抽屉将其放入 `<details>` 归档区。
3. **`[CONTENT-1108-01]` 补齐剩余 52 段伙伴剧情与第 2–4 章专属大项目**：按照 A3（开局 4 人前 2 段剧情）与 Productization B（第 1 章社区书店项目）的质量标准，逐步替换 `m5.json` 中剩余 52 段 `陪伴/记录` 模板剧情，并为第 2–4 章补充具象化的主线客户项目。

---

## 七、下一阶段迭代优先级路线图（Actionable Roadmap）

建议主线程在下一轮迭代中不要急于扩充新系统，而是按以下 4 步集中解决上述视觉、UI 与玩法闭环问题：

1. **Step 1：清理 UI 遮挡与 CSS 样式覆盖缺陷（约 0.5 天）**
   - 调整 `.onboarding` 位置（并入右上角工作看板或改为顶部/底部非遮挡窄条，第 1 章起默认收起），彻底解决首排角色与场景标题被盖住的问题。
   - 清理 `style.css` 第 6、7、15、17 行残留的墨绿/薄荷绿硬编码与重复选择器，修复 `<meter>` 绿色进度条与深色模式下 `.scene-location` / `.hud-tools` 的亮白底色反差。
   - 修复点击“验收结算（`Deliver`）”后弹窗停留空白死框的问题，并在派遣工作台显示 `preview.error` 禁用原因。
2. **Step 2：重构场景工位布局与角色活动表现，真正对齐 `ai-village`（约 1–1.5 天）**
   - 将“背景固定工位/休闲位锚点”与“角色实体”解耦：仅被派单工作的角色走到工位入座，空闲角色分布在休息区/白板/书架/餐桌锚点，消除“带着桌下名牌在桌后夹层左右横移”的怪异感。
   - 保持名牌字号独立于 `station.scale`（最小不低于 `11px`），并引入 `ai-village` 的 `animations.json` 关键帧与角色特色微动作。
   - 升级四时段光照：在傍晚/深夜调暗背景层并点亮室内暖光源/屏幕光，避免顶层半透明蒙版把角色白色名牌染灰。
3. **Step 3：完善伙伴简历预览与 `ai-village` 式世界地图（约 0.5–1 天）**
   - 补齐后 5 位角色的个人简介（`character-profiles.ts`），在伙伴列表卡展示心情/负载/擅长标签，并支持点击“待招募”卡片预览其能力与部署方式。
   - 用 SVG 路线网 + 2D 地标节点重构世界地图弹窗，消除 `.map-road` 边框穿帮，并在地图节点上显示在场伙伴头像。
4. **Step 4：校准第 0 章委托池边界、澄清过期时间窗与 `forecastAssignment` 推演（约 0.5–1 天）**
   - 将 `simulation.ts` 中误写为 `c.campaign?.maxChapter` 的动态章节判断修正为 `s.campaign?.chapter`；
   - 让第 0 章全程（`chapter === 0`）使用精修委托池，并对已澄清过的委托延长过期保护；
   - 在 `forecastAssignment` 中纳入日夜睡眠精力恢复/工作消耗与 `partial = true` 残余工作量截断，消除晚间排班误报“28天内无法完成”与收尾阶段额度误判。
