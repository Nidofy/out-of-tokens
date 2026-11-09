# VF1.1 返修检查点（待 Gemini 复审）

2026-11-09。本段覆盖下方历史 VF1 完成度。返修基线 `147ddac4d875d421fffefafdd577be091196f83f` / 记录 `46070d1`；性能比较基线仍是 `040031e`。固定实现 SHA 和复审 Prompt 由独立记录提交写入 `harness/reviews/vf11-handoff.md`。本轮只到 VF1.1，不自动进入 VF2/VF3，不推送。

## VF1.1 审查来源与裁决边界

收到的是用户提供的《VF1 检查点独立审查裁决与 VF1.1 返修交接指令》，原字节归档 `harness/reviews/vf11-user-handoff.txt`，SHA256 `1277769AF6720AC7EAF5B9DA2538E9EA03EDB53C21ADF64DBE43E5A016D61F1E`。本轮没有收到另一个独立完整报告文件；不补造审查者的操作记录。

该指令已批准三屏结构、暖木场景与不透明纸面操作区、轻 HUD、原版 Q 角色及现代无衬线字体候选。此次沿用并收敛，不推翻重做。其“有条件进入 VF2/VF3”要求先修 VF1.1；下面是 Codex 的实施和验证结果，**不是 Gemini 已复审通过**，也不是整体视觉冻结。

## VF1.1 返修台账

| ID | 实施与实际验证 | 状态 / 限制 |
|---|---|---|
| R-01 | 同场景、远征、活跃委托统一派生；首屏聊天禁用与异地找人入口；折叠区去掉重复聊天/找人；送礼、吃饭、学习、加班按既有规则禁用。验证忙碌、异地空闲、同场景空闲、真实夜间加班及重复禁用 | 已实施待复审；远征没有新增实机夹具，召回偏离见下 |
| R-02 | 显式 tri/single 布局；posted 无抢跑红错，三步骤底栏都可接单；接单保持弹窗切到队伍、不打开背景抽屉；review 固定返工/验收栏；waiting 说明；结束态实际流水与质量；移除无条件全局 message | 六种状态各有 1280/390 截图；手机真实接单、跨步草稿、派遣、review 交付已验证；breached 分支未单独实机复现 |
| R-03 | 候选说明扁平两行，none 显示岗位设施规则，已选显示实际设施；“本单在岗”与其他占用区分；收紧行距 | DOM 嵌套 small=0，standard 两位本单在岗；twelve 英文深色 12 卡可滚动 |
| R-04 | 低高度下收紧标题、步骤和固定确认栏 | 844×390 中间 section=225.53px（修前136.25px），超过190px；bodyWidth=844，关闭和底栏均在视口内 |
| R-05 | 站姿命中88宽，工位坐姿命中随上移；缓存共享形状，保留双会议席中央白板通道 | 两项新增几何测试通过；standard Qwen 帽顶(426,383)开档案；meeting 双席中央(613,347)开委托 |
| R-06/09/10 | 标题“伙伴档案”，角色名仅一个大标题；方形160/128/112相框；FlavorPanel 最后且同 class；金额/质量覆盖 Georgia | 四人桌面截图逐一复核；160×160框与128×128源资产记录；手机使用112px规则；原角色资产不变 |

### 源码核对后必要的调整

1. **不把 recall 伪装成远征取消**：`packages/oot-core/src/campaign.ts` 的 recall 是将伙伴从当前日程场景召回工作室，并受 busyUntil / actorScene 校验；不是远征提前返回命令。附件建议的“远征时启用召回”会触发既有校验错误。档案不再提供错误的远征召回按钮，远征时显示禁用的等待返程说明。没有改 Command 或领域规则；这也使原有普通日程召回入口暂不在此档案提供，是否在 VF3 以准确名称恢复交给复审决定。
2. **加班与学习补齐真实前置条件**：仅判断夜间仍会因没有 working 委托报 NO_ACTIVE_ACTOR。按 `simulation.ts` 既有要求补 working 委托、精力>=10、busyUntil<=当前槽，加班成功后禁止重复。学习补精力>=10；费用/数值均未改。保留忙碌/同场景/地点规则说明。
3. **历史金额不读动态估算**：`job.settlement` 按当前槽计算预估迟到因子，不适合作历史收据。结束态改读 ViewModel 已有 ledger 最后一次 delivery/breach 条目，明确多期逐期入账；近期10条流水之外明确说明缺失，不伪造金额。delivery 后推进8槽超过截止时间，仍显示已发生的 ¥958.65，见 `vf11-history-after-deadline.txt`。预估与领域结算公式没有变化。
4. **启动下载提前并保留降级**：原先在 Scene effect 中才开始下载场景模块；现在与首次 UI render 同时开始下载并复用 Promise。渲染故障仍可通过 roster 打开档案，见 `vf11-renderer-fallback.txt`。不将这一改动宣称为经统计确认的固定百分比提速。

## VF1.1 证据索引与复现

所有相对文件名在 `harness/vf1/`。截图为本轮工作树实现，后续仅做类型、诊断构建入口裁剪与文档修正；固定 SHA 见独立 handoff。普通截图为中文浅色，除明确标注外均4人；`animation-time=1` 固定场景动画。不是实体手机测试。

| 状态 / 夹具与操作 | 1280×720 | 390×844 |
|---|---|---|
| posted / initial，待接单列表开第一单 | s2-posted-1280.png | s2-posted-390.png |
| accepted / 待接单接受后；桌面为 twelve 英文深色试选 Qwen | s2-accepted-1280.png | s2-accepted-390.png |
| working / standard | vf11-s2-working-1280.png | vf11-s2-working-390.png |
| review / review | s2-review-1280.png | s2-review-390.png |
| waiting / waiting | s2-waiting-1280.png | s2-waiting-390.png |
| delivered / delivery，历史列表 | s2-delivered-1280.png | s2-delivered-390.png |

- `s2-844.png` 更新为返修后 working 横屏；`vf11-844-geometry.json` 记录实测边界，修前另存 `vf11-before-844.png`，原 VF1 图仍可从 Git 取回。
- `vf11-s2-1920.png`：1920×1080，meeting 双会议席+执行者三人队伍；`vf11-s2-twelve-560-dark-en.png`：560×800，twelve、英文深色，12卡可滚动（不是12卡同时在首屏）。
- `s3-elsewhere-1280.png`：initial 推进两槽，Qwen 在图书馆、玩家在工作室；找人后同场景聊天/吃饭/学习可用；`vf11-after-busy.txt`、`vf11-s3-busy-1280.png` 为 standard 忙碌禁用；`vf11-overtime.txt` 为 standard 两槽后夜间真实加班。
- `vf11-profile-{deepseek,qwen,llama,mistral}-1280.png` 四人方框；DeepSeek 是显示名，实际角色 ID 为 bluewhale。`vf11-profile-frames.json` 记录框与源资产尺寸。早期批量截图存在画面落后一帧，已分次重新截取并逐张视觉复核，交付的是重截结果。
- `vf11-meeting-before-click.png`、`vf11-meeting-hit.txt`：双会议席白板点击；`vf11-before-{hat,profile,team,posted,elsewhere}.txt` 保留修前复现。
- 新 review/waiting/meeting 都在 `office-lab.ts` 隔离内存夹具中；前两者只改克隆测试内容以快速到目标状态，使用真实 accept/assign/advance/deliver 命令，不改正式内容、不写玩家存档。

开发复现：`pnpm --filter oot-web dev --port 5181`，访问 `http://127.0.0.1:5181/?office-lab=standard&animation-time=1&vf-metrics=1`，按上表替换夹具。英文深色加 `&locale=en&theme=dark`。夹具不自动开弹窗，从委托/伙伴列表进入。review/waiting/delivery 直接构造目标状态，meeting 检查白板。

优化诊断构建：从仓库根执行 `pnpm --filter oot-web exec vite build --mode visual-review`，再 `pnpm --filter oot-web preview --port 5183`，使用相同 URL 参数。**这使用生产优化流程，但显式保留诊断夹具/指标且不注册 SW，不等同于默认发布包的冷启动表现。** 普通 `pnpm check` 的默认构建仍禁止 URL 开启诊断，main 的指标条件直接在构建时裁剪，避免无用指标 chunk 被离线清单收录。

## VF1.1 受控启动复核

原 VF1 的 +19.1% 是开发环境单次183→218ms，不能当成已证实回归。此次用相同工具、Windows Chrome156 / 16逻辑线程、1280×720、**每条 DPR 精确相同 `1.0000000447034836`**，对040031e与候选分别测 standard/twelve，开发和优化诊断 preview 各自比较。每组预热一轮不计，最后六轮交替正反顺序，共48条；热缓存、本机HTTP，无网络节流、未清缓存。没有把DPR1.75旧样本混入。

`vf11-preload-balanced-startup.json` 是最终预加载实现的原始48条；`vf11-startup-summary.json` 是中位数，可用 `node harness/vf1/summarize-startup.mjs` 重算：

| 模式 | 夹具 | 基线中位数 ms | VF1.1中位数 ms | 差异 |
|---|---|---:|---:|---:|
| dev | standard | 233.85 | 209.15 | -10.56% |
| dev | twelve | 221.20 | 215.00 | -2.80% |
| 优化诊断 preview | standard | 157.90 | 172.85 | +9.47% |
| 优化诊断 preview | twelve | 156.05 | 152.15 | -2.50% |

观测定义保持“首个同时发现 HUD button 与 canvas 的 rAF 时间”，不是纹理全加载、输入延迟或可玩时间。增加 `#vf-startup` 在同一 ready 时刻导出 JSON，避免后台自动化等待180帧导致采样周期漂移；原 `#vf-metrics` 180帧输出保留。最终独立单条 `vf11-final-runtime-observation.json`：180帧，p50=8.3ms/p95=8.6ms/over50=0；它只是一条观察，未用于上表，也不是帧率/GPU门禁通过的证据。

**不隐藏早期不利数据**：`vf11-controlled-startup.json` 首轮顺序采样 dev standard 约+31.5%；`vf11-interleaved-startup.json` 与 `vf11-reverse-startup.json` 合并 preview standard +11.34%；`vf11-final-balanced-startup.json` 预加载修正前为+11.76%。不同批次基线本身波动明显。上述数据都保留，不能从最后一组推导“所有环境无退化”。`vf11-baseline-*-warm-*.json` 是更早147ddac现状观测且夹具间DPR不同，只作诊断，不作040031e对照；`vf11-before-standard-1.json` 初次629ms同样排除。

结论：原“单次+19.1%未复核”已完成同DPR多样本调查，并提前启动场景下载；最终组未超过10%调查线，但 standard preview +9.47% 接近线，**性能风险仍保留，需 Gemini 判断本轮证据是否足以放行**。不得标“完整性能预算通过”；VF2/VF3继续同条件抽检，VF5仍须冷缓存、低端设备、纹理解码/GPU占用、稳定帧时间与输入延迟。

基线 worktree `../vf11-perf-baseline` 固定040031e，只为对照加入同样的指标/诊断开关（main/use-game/office-scene/alpha-app/vf-metrics/visual-review）；未带入本轮UI、几何或预加载修改。包实现与主仓一致。为避免重复安装，依赖使用 junction，构建产物复制自相同包；该 worktree 留作审计，勿递归删除其依赖链接目标。第一次 pnpm 自动安装扰动 workspace 链接后已在主仓用离线 frozen-lockfile 恢复，锁文件及 packages 零差异。四个临时5181–5184服务均已停止，浏览器视口恢复、验证标签关闭。

## VF1.1 校验与下一门禁

`pnpm check` 最终日志 `vf11-check-final-v4.log`：36文件251测试、TypeScript、lint、默认生产Web与既有DSH构建通过；242→251来自2项命中、3个新增lab自动案例及4项夹具状态/双席专项。`git diff --check` 与 `git diff -- packages` 在提交前复核；packages、正式内容、引擎0.16.0/内容office-2、锁文件、原版资产不变。没有付费调用、推送或部署。

失败不抹除：meeting 最初误用显示名 deepseek 作ID导致 LAB:UNKNOWN_ACTOR，改成bluewhale；首轮夜间无工作加班触发NO_ACTIVE_ACTOR，补齐禁用；`vf11-check-final-v2.log` 有历史流水可选prop严格类型失败，已修，v3/v4成功；v3发现未被加载的指标chunk仍进入离线清单，main直接编译期判断后v4复核。中间日志均保留。

暂停待Gemini独立复审，复审通过才按下一检查点指令推进。VF2负责组件收敛、VF-07单主渠道反馈及失败/锁定完整矩阵；VF3负责VF-03显式定位/离屏提示与场景命中扩展。真实手机/软键盘、200%字体、完整中英明暗矩阵、远征实机、breached实机、长局流水缺失文案、低端GPU与完整离线回归均未由本轮证明。VF4量产、O4-B/O4-C继续禁止。既有经营/许可证/平台待办不因UI检查点消失。

---

# 历史：VF1 首版样板检查点

2026-11-09。实施基线 `040031e`；固定实现 SHA 见 `harness/reviews/vf1-handoff.md`（后续记录提交）。本轮达到的是阻断问题修复和 S1/S2/S3 可运行首版，不是 VF1 全状态验收，更不是 Visual Freeze 1 完成。按用户要求在此暂停，收到复审交接后再推进。

## 交付与定调边界

保留温暖现代 AI 工作室、原版 Q 角色、暖木场景、纸面操作面板、黄铜装饰。三屏采用不同信息结构：S1 场景与推进优先，S2 决策比较优先，S3 角色身份与当前状态优先。系统无衬线字体是候选方案，无新增字体或生成资产。此次没有改动 packages 内领域规则、内容、存档版本或原角色资产；engine 0.16.0 / content office-2 保持。

| 屏幕 | 首版结构 / 阅读顺序 | 可运行行为 | 尚待定调 |
|---|---|---|---|
| S1 办公室 | 推进 → 日期与经营摘要 → 场景角色 → 四入口；浅色推进按钮、深色透明 HUD | 手机资金/额度恢复常显并可点击详情；视角不再按 zone 隐藏画内人物 | 双排手机 HUD 是否占景过多；通知权重；定位和离屏提示；长金额压力 |
| S2 工作台 | 桌面需求 → 队伍 → 预估，底部确认；手机三步骤，队伍保持挂载 | 原接单/岗位/模式/预估/派遣路径；无执行者时报错并禁用确认；切步骤保留草稿；关闭丢弃未提交队伍，界面告知 | 独立滚动与信息密度；确认前风险摘要；12 人和完整失败矩阵；组件抽取 |
| S3 档案 | 大头像与身份 → 四项现状 → 聊天/查看工作 → 折叠成长、故事与互动 | 有工作可跳回对应委托；忙碌时首要聊天禁用并说明；原互动/成长入口保留 | 首屏放哪些可用动作；定位按钮；忙碌/异地/锁定等禁用原因统一，折叠区仍沿用旧校验 |

候选尺寸：profile 桌面 180×216，<=899 为 120×160，<=679 为 112×144；candidate 48×56，list 44×52，map 28×32。主标题 24–28px、区标题 16px、正文 14px、候选属性 12px、核心预估数值 20px；间距以 8/12/16/20/24px 为主。它们是实屏起点，不是已经批准的组件规范。

## 缺陷台账

| ID | 当前状态 | 证据与剩余边界 |
|---|---|---|
| VF-01 | 已修复覆盖问题 | 显式 Portrait 变体，移除后加载通用尺寸覆盖；1280 实测 180×216，390 实测 112×144。完整四人裁切与各入口矩阵未验完 |
| VF-02 | 已复现并修复主要拦截 | standard、1280 点击 Qwen 脸 (426,438)，修前打开委托，修后打开档案；1920 点击上身 (640,685) 打开档案；1280 桌面 (420,489) 仍开委托、透明处 (494,425) 不开弹窗。新增 8 项命中几何测试。采用世界坐标矩形并集，非逐像素 alpha 命中；全部家具/缩放/坐姿仍需 VF3 回归 |
| VF-03 | 部分完成 | 去掉 camera zone 驱动的角色 renderable 过滤；390 工作视角能同时看到会议席 Llama。显式定位、返回及离屏引导留 VF3；没有把本项关闭 |
| VF-04 | 首版落实 | ledger 金额 16px，工位/精力/加成标签 12px，预估 20px；不是全站字号审计完成 |
| VF-05 | 首版落实 | 装饰、焦点、选中 token 分离；HUD 用明暗双环。下表仅针对不透明样板底色，透明浮层/场景背景须继续实测 |
| VF-06 | 部分完成 | 手机两列资金/额度摘要，点击仍开详情；390 中文、560 英文可见。极长值、事件并存、200% 字体待补 |
| VF-07 | 开放 | 实际派遣成功观察到持久 message 与 presentation 回执并存。下一阶段先列事件→主渠道→寿命→历史入口，再统一，不在本轮假称修完 |

用 sRGB 相对亮度公式 `(L亮+.05)/(L暗+.05)` 本地计算：浅底 #fcf6eb，焦点 #775021 为 6.61:1、选中 #43684d 为 5.87:1、次要文字 #6e5c4d 为 5.91:1；深底 #282320，焦点 #f1cc86 为 10.15:1、选中 #8bc29a 为 7.61:1、次要文字 #c9b9a6 为 8.12:1。这不是全站无障碍认证。

## 实际验证与截图索引

本轮截图均为实现过程中工作树，最终实现提交收录；无第三方外部审查结论。使用 Windows / Chrome 156 IAB、DEV 内存隔离夹具，`animation-time=1` 固定场景动画观测时刻。主路径 standard 为 4 人、Qwen 工作/Llama 支持，twelve 为 12 人空闲。默认中文浅色；下表注明例外。文件均位于 `harness/vf1/`。

| 文件 | 场景与视口 / 说明 |
|---|---|
| before-standard.png、before-face-click-context.png | 修前 standard 1280×720 主界面；两图为相同点击前上下文，不能作为错误弹窗截图。错误对象由当时实时 AX 状态确认，未另存 AX 文件 |
| s1-1280.png、s1-1920.png、s1-390.png | standard 主界面 1280×720、1920×1080、390×844 |
| s2-1280.png、s2-1920.png | standard 桌面三栏工作台，分别 1280×720 / 1920×1080 |
| s2-invalid-team.png | 1280×720 无执行者的错误与禁用确认 |
| s2-390-brief.png、s2-390-team.png、s2-390-forecast.png | 390×844 三步骤；Qwen 改不参与后切预估再返回，选择保留；恢复执行者后预估恢复 |
| s3-1280.png、s3-390.png | 1280×720 / 390×844 档案；拍摄早于最后补充忙碌原因文案，不能用这两张断言缺失原因 |
| s3-1920.png | 1920×1080 工作中 Qwen 档案，已含忙碌原因 |
| s3-keyboard-1280.png | twelve、1280×720，Enter 打开伙伴入口和 Qwen 卡片得到档案；空闲可聊天 |
| s1-560-dark-en.png、s2-560-dark-en.png | standard、560×800，英文暗色主界面/队伍步骤 |
| s2-844.png | standard、844×390 横屏，确认区可见，需求区独立滚动 |
| s1-twelve-1280.png | twelve、1280×720，12 人画面，标签/身体仅首轮抽检 |

真实路径结果：档案“查看工作”能进入正确委托；非法队伍禁用确认，恢复后确认派遣成功并关闭弹窗；预估保持本槽 76.31T、本阶段 242.8T、条件质量 68–78（不解释为成功概率）；手机步骤切换不丢岗位选择；390 dialog 左右边界 17/373，页面 scrollWidth=390，确认区约 y673–791。横屏确认可见，英文暗色 Escape 关闭并返回原委托卡焦点。12 人新导航检查 console error/warn 为空。

最终 `pnpm check`：36 文件 / 242 测试，类型、lint、Web 与 DSH 构建通过，见 `check-final-v2.log`；较基线 234 新增 8 项命中测试。`git diff -- packages` 为空。不把此事实或测试数当作全操作领域状态/RNG 对照已经完成。

未覆盖：真实手机、软键盘、200% 字体、680/2560、本轮离线/资源失败/无 blur、全四人档案、12 人工作台完整异常组合、提交重复点击/失败恢复、基础/标准全缩放点击矩阵、领域状态/RNG 前后快照。既有测试通过不填补这些实屏证据。

## 性能观察的限制

`vf-metrics.ts` 仅 DEV 且显式 `vf-metrics=1` 加载，记录首次出现 HUD 按钮和 canvas 的 rAF 时刻及早期 180 帧；它不触发游戏命令。浏览器只读评估不开放 navigator/performance，所以以宿主 DEV 埋点读 DOM 输出；不伪造不能取得的设备/GPU指标。

| JSON 文件 | DPR | 控件+canvas ms | rAF p50 / p95 ms | >50ms |
|---|---:|---:|---:|---:|
| baseline-standard | 1.75 | 183.0 | 8.3 / 8.6 | 0 |
| after-standard | 1.75 | 218.0 | 8.3 / 8.5 | 0 |
| after-standard-repeat | 约1 | 197.9 | 8.3 / 8.7 | 0 |
| baseline-twelve | 1.75 | 187.3 | 8.3 / 8.7 | 0 |
| after-twelve | 约1 | 240.8 | 8.3 / 8.6 | 0 |

全部 1280×720、同一 Windows 浏览器环境、16 逻辑线程。DEV 本地网络、已有缓存，未执行受控冷缓存实验；DPR 在后续视口模拟后变化，12 人前后不可直接比较。standard 同 DPR 单次观测 +19.1%，触发 >10% 复核线：性能门禁保持未通过，不能用不同 DPR 的第二次较快值覆盖首个结果。数据规模不足以认定代码导致回退，也不足以排除。

资源 transfer/decodedBody 原始数值保存在 JSON；decodedBody 是响应体解码字节，绝不是纹理解码内存或 GPU 显存。控件+canvas 出现不是资产加载完毕或完整可操作性。无 CPU/GPU 型号、GPU 内存、S2/S3 开合帧时间或生产冷启动结果，VF0 基线只完成初测。下一次先固定 DPR/缓存条件、重复采样并测生产构建，再确定预算。

## 收到复审后的工作顺序

1. 核对固定 SHA；独立复现 Gemini 的 P0/P1，先修会影响判断和操作的回归，保留失败证据。
2. 依据审查结论修订三屏信息层级；补长金额/英文需求/四人档案/12 人派遣/设施与资源不足/提交失败/手机横屏和软键盘。明确哪些是 VF1 必补、哪些进入 VF2/VF3。
3. 固定 DPR 和冷热缓存补 VF0 测量，定位 +19.1% 观察，不降低预算以求通过。
4. VF2：抽出工作台和档案、统一按钮/候选卡/焦点/禁用原因状态表，完成字体与形状选择；盘点并统一 VF-07 反馈渠道。
5. VF3：定位/离屏/全景，工作角落接触与遮挡，基础/标准工位及特殊体型命中矩阵。
6. VF2/VF3 达标后才批量资产；VF5 全门禁后才恢复 O4-B/O4-C。当前按用户指令暂停，不能依据仓库历史“等审继续”条款擅自进入下一步。
