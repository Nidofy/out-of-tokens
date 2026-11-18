# Living Studio 3.1 Track A 第二次独立复验（2026-11-18）

结论：**暂缓合流（HOLD）**。VC-R1、VC-R3、A3 正常路径通过；固定 `5af83704` 在本机实际减少动态分支的 VF5 正式批及两段 600 秒长驻通过。新增 **VC-R4 / P1：secondary-panels 首次加载失败后无法恢复，且存档入口形成无可见弹窗的模态锁定**。必须由 Gemini 修复后再验，不因性能通过而忽略功能阻塞。

## 固定对象与边界

- 目标主仓：`out-of-tokens`，分支 `codex/m1-foundation`；入场 `2b9fc04664e41783c50eafd90dff3bd6db4afc50`，产品内容仍为 `51c50b6880ad71ec712ed2a949d78d80c1626a19` 对应版本。
- 候选：`out-of-tokens-visual-closure-1118` / `gemini/visual-closure-1118`，干净 HEAD `088e4b115b111498628a6525a81d3764ed6f99fc`。
- VC-R1：`bfc322e412a26deb3e66503472d2fb12eab033b0`。
- 本轮冻结实现：`5af837040de58527c130c098366df3e7cc89c866`；到 HEAD 仅两份文档变化。
- 对照：`1745653315e0fc50e50e8fbbfbbad8bf16611190`、`c68541da920b346b02c11b8e27540024c8ea30a5`。
- 独立证据：`D:\Documents\FeiyangChen\devApps\ai-game\commission-evidence\visual-rework-codex-1118`。入口 `boundary-audit.json`、`README.md`、`SHA256SUMS.txt`。

`51c50b6..088e4b11` 仅 17 个 A 源码/测试文件及两份 A 文档变化。packages、content、art、public/art、DSH、历史 fixtures、content/living-art/experience-copy/experience-art.ts、vite.config.ts、package-verification.test.ts、根配置、锁文件及 STATUS 均零 diff。来件树无 Codex 修改。旧 Codex 126 项、旧 Gemini 134 项、新 Gemini 35 项哈希全部一致，历史证据未覆盖。

候选完整 `pnpm check` 通过：**54 文件 / 482 测试**，含类型、Lint、Web/DSH 构建。`git diff --check 51c50b6 088e4b11` 通过。旧独立 trajectory-audit.ts 原字节复制到新证据目录运行，断言和源码引用未修改，仅通过 import.meta.url 将输出写入新目录；退出 0。此做法避免原脚本覆盖历史 JSON。

## 独立裁决

| 项目 | 结论 | 证据及范围 |
|---|---|---|
| VC-R1 起身/离桌同步 | PASS | 旧独立断言跳变 0；完整测试含新 3 项；真实 GLM 起身重复同步脚底 573→573 |
| VC-R2 / VF5 性能 | PASS，限实际减少动态分支 | 正式 36 通过；无需确认；两个版本各约 605 秒长驻通过 |
| VC-R3 Tier 外部探针 | PASS，限沙箱 | 72 组合/1152 样本，72/72 实际姿态变化，重复同步零跳变、相机扰动锚点误差 0 |
| A3 正常路径 | PASS | 原生命中、布局保存刷新、按需档案、桌面/390 焦点闭环、遮罩/Bark、共同相机变换 |
| VC-R4 新加载故障恢复 | **HOLD / P1** | 单次 503 后重开委托永久空白；存档进入 modal=open 且无 dialog，Escape 无法退出 |
| Track A 合流 / Visual Freeze | **HOLD** | 不合流产品源码；旧通过项不撤销，新 P1 必须修复 |

## VF5 数据与协议

可见 IAB，1280×720，DPR 约 1，zh/light，`inGameMotion=full`、`osPrefersReducedMotion=true`、`effectiveAnimationBranch=reduced-still`，未启用 animation-time。三个版本预构建静态包；采样期间无编译、无强制 GC。每个独立 URL 导航到同一可见前台标签页；通过原生 locator 点击开关伙伴面板，无 force/dispatchEvent。

预检 180 帧/12 输入通过。正式 6 轮交错 × 2 场景 × 3 版本共 36 样本、6480 帧、432 输入；每样本资源就绪小于 1500ms，零 >=250ms 帧、零可见性变化，四人/十二人数和环境记录一致。没有删样本或重跑不利样本。

正式汇总（ms；就绪为 6 样本中位数，帧和输入为合并样本 nearest-rank p95）：

| 场景 | 版本 | assetsReady | 帧 p95 | 输入 p95 |
|---|---|---:|---:|---:|
| 四人 | 5af83704 | 503.15 | 8.60 | 18.60 |
| 四人 | 1745653 | 508.70 | 8.60 | 22.30 |
| 四人 | c68541d | 946.15 | 8.60 | 20.70 |
| 十二人 | 5af83704 | 665.25 | 8.60 | 18.70 |
| 十二人 | 1745653 | 769.35 | 8.60 | 23.20 |
| 十二人 | c68541d | 849.15 | 8.60 | 19.00 |

所有相对比较均 <=+10%。个别基线高就绪/高输入样本保留，不能将这些单机数值推广为普遍加速比例。正式批通过，**确认批 0；该 SHA 本轮消费 1 批**。旧 `735b0aec` 已用满两批的失败证据不变，本轮未补跑旧 SHA。

顺序长驻自动落盘汇总：

| 版本 / 十二人 | 连续时长 | 十秒窗口 | 窗口总帧 | 输入 | 首10/末10窗口 p95 中位数 | 输入 p95 | JS 堆首→末 / 最大 |
|---|---:|---:|---:|---:|---|---:|---|
| 5af83704 | 605.508s | 60 | 71,769 | 108 | 8.6 / 8.6ms | 16.9ms | 163.56→140.34 /175.60MB |
| c68541d | 605.243s | 60 | 71,799 | 120 | 8.6 / 8.6ms | 16.2ms | 151.89→146.77 /151.89MB |

两段均零 >=250ms 帧、零 visibility 变化；候选 >50ms 帧 0、基线 1。每约一分钟进行 12 次开关点击；工具调用产生轻微间隔浮动，时间戳全部保留。候选自动落盘早于最后一组点击，其最终观察另存 120 次输入，不用最终观察覆盖自动落盘。窗口 p95 未恶化、堆未持续增长；这不是无限时长无泄漏保证。

预检后的首个采样函数曾引用上一轮已关闭标签，导航前即报错，正式文件为 0；改为显式传入当前标签后才启动正式批。基线长驻等待 data-saved 的一次工具等待提前超时，页面仍持续前台运行，随后自动落盘，未重启或删除样本。

## VC-R1 / VC-R3 审查细节

新的 stand/depart 分支保留旧工位和 arrived，只更新有效目标坐标及 zone；回原工位仍先走 sameStation 分支反转为 seat/approach，未跳过目标更新。测试覆盖相同目标、换工位、中途改目标、回原工位和每帧同步的脚底/缩放连续性。

外部探针明确通过 setElapsed 推进工作相位；`poseChangedCombos=72/72`。最大零时间 resync 跳变 0，正常/扰动相邻帧最大脚底步长 5.6、角色高度步长 0.693；锚点、mask、腿、阴影错误均 0。单角色名牌遮脸 0，独立四角色样例名牌遮脸/互相重叠均 0；不外推到任意密集布局。

启发式中央 face-box ROI 遮挡为 0；它不等于逐角色语义眼嘴分割。真实 `glm-3-620-stand` 在原生点击同步前后保持 stage=stand、arrived=.5、footWorldY=573、jumpPx=0。Tier2/3 仍仅从原型目录载入外部沙箱，无生产图、商店规则或内容接入，也不要求重新绘制原型。

## A3 正常路径

- 独立 origin 4294 的真实保存模式，使用可丢弃新档。家具初始 workHits=0，空白点击初始化后，在桌面透明区域 (360,403) 无面板；不透明 (409,449) 打开布置。探针首个透明候选 (336.7,403.3) 与 Qwen 形象区域接近，实际采用同一精灵透明顶部、避开角色的可见点，未冒称点击了原候选点。
- 原生 (223,380) 命中 bluewhale / DeepSeek，成功按需载入档案。探针记录画布输入 `isTrusted=true`。
- 小木桌从工位1移动工位4，保存提示与修订1可见，刷新再开布局确认工位1空、工位4占用。
- 1280×720：Shift+Tab 到末尾 Seedance，Tab 回首个伙伴，再 Shift+Tab 回末尾；Escape 返回 dock 伙伴。390×844：末尾底部手账与首个可见“全部”循环，Escape 返回伙伴；无横向溢出。关闭壳的 inert 由外部 DOM 探针记录。
- 桌面 terminal 点 (1246,35) 的 elementFromPoint 命中 stage-hub-scrim，原生点击后 hub 保持打开、overlay=closed。
- 桌面 Qwen / 窄屏 DeepSeek 聊天反馈在 dialog 内，窄屏关闭按钮中心命中其后代；关闭 Bark 后 hub 仍打开。窄屏零横向溢出。
- 原生相机记录 16,460 帧/16 次变换，最大误差 0.00033922；受控 full 记录 3,965 帧/120 次变换，最大误差 0.00049079；均零超 0.001。包含区域、缩放和真实拖动。受控 full 是外部构建替换媒体查询后的诊断，不替代真实 OS no-preference 门禁。

## VC-R4 / P1：失败的懒加载 Promise 永久缓存

位置：`apps/web/src/alpha-app.tsx:53–55,347–348`，以及依赖 `secondary &&` 的弹窗分支。`secondaryTask ??= import(...).then(...)` 无 catch/失败复位；effect 无失败状态；所依赖的内容未加载时直接 null。

独立故障服务只让首个 `/assets/secondary-panels-B1pa5jO6.js` 返回 503，之后正常服务。原生打开委托：只有标题框架、内容空白；关闭重开依然空白，控制台重复 rejected import，但网络没有新请求。再打开保存入口，DOM `data-modal=open`，却没有任何 open dialog、无错误提示；原生 Escape 后仍如此。整页刷新再开委托才出现分类与搜索，服务日志第二次请求 200，证明服务已经恢复。

这不是 I1–I4 / PM-01 重开，也不是存档算法问题；是本次新增前端分包的恢复缺失。若 pending event 等首次触发加载也失败，源码同样依赖该模块，存在阻断处理的风险；本轮仅对委托与存档进行了故障实测，不冒称事件故障已实测。

验收要求：Gemini 提供共用 loading/error/retry 状态，处理 rejection 并解除永久失败缓存，允许同一会话在资源恢复后重试（需实测浏览器对失败 import URL 的缓存行为，不能只置空 Promise 就宣称修复）；存档/设置/地图等入口在失败时必须可取消或恢复，不留下无弹窗的 modal 锁定。不得强制重开游戏或以整页刷新作为唯一恢复路径。

## 合流裁决与保留项

不合流本轮任何 A 产品实现。VC-R1 已通过，但它依赖此前仍未合流的 A2 轨迹状态机，不能将四行修复直接视作主线独立补丁。选择保留完整候选分支，等待 Gemini 最小修复；避免 Codex 拆写 A 文件或把性能已通过但存在 P1 的版本放入主线。本轮主仓仅增加独立审查和状态文档检查点，SHA 另记。

下一步见 `GEMINI_VISUAL_LAZYLOAD_REWORK_PROMPT_20261118.md`。新产品 SHA 不能继承本 SHA 性能实测为自身 PASS；修复发布后按固定新 SHA 再复核，不为了改变本轮结论重新抽样。

以下保持明确 HOLD：真实 DSH 安装验证（用户暂缓）、Windows 200% 系统字号、物理真机触控（用户延期）、系统 no-preference 全动态、Tier2/3 正式接入及整体 Visual Freeze。未重开 I1–I4 / PM-01，未改原存档，未 push/部署或重打正式候选包。

测试页已关闭、视口恢复；本轮 Node PID 1472/20776/6916/3560 已停止，端口4291–4297清理。独立 origin 的可丢弃测试数据保留，不宣称清空。最终端口检查及哈希见证据目录。
