# VF31-PERF-01 阶段归因与限定试点门禁

2026-11-10。54条正式阶段采样与24条单因素实验已完成，应用源码尚未修改。结论：本轮允许进入用户指定的零新增资源Saves/Settings/Map试点；不放行资产扩产、全站CSS、整体视觉冻结或完整性能预算。

## 证据

| dev twelve阶段中位数(ms) | VF3 6f3a191 | VF3.1 c68541d |
|---|---:|---:|
| navigation→moduleEntry | 132.70 | 146.45 |
| moduleEntry→HUD commit | 2.35 | 2.50 |
| HUD→sceneModuleLoaded | 33.05 | 40.55 |
| Pixi init（含异步等待） | 27.60 | 27.50 |
| 首次sync同步工作 | 3.80 | 4.95 |
| 首HUD+Canvas rAF绝对时间 | 200.55 | 226.30 |

入口前与动态导入阶段解释主要差异；不能将各阶段独立中位数相加等同总耗时中位数。firstSync约1.15ms差异存在但远小于总差异，并在单因素批次回到3.85–3.95ms，不支持持续的约25%场景执行退化。standard首HUD提交2.8/2.95/3.15ms、Pixi26.1/25.95/28.55ms（040/VF3/VF3.1），没有与历史启动百分比相应的提交/场景CPU大幅膨胀。54条canvas前longtask计数均0，不代表无短任务成本。

新增scene-navigation请求数使dev模块数80→81，但六条twelve中它在64.3–123.4ms已响应，moduleEntry在131.4–381.7ms才发生，末端响应是既有共享包模块。第6轮entry381.7ms对应既有模块最后响应370.7ms，定位到入口前资源等待；不将这条离群值删除。因此不支持把scene-navigation单文件当唯一关键阻塞项，也不做未经验证的模块合并。

奇偶轮：c68541d twelve总时间奇-偶=-9.8ms，entry=-17.8ms，HUD提交=0，Pixi=+3.3ms；旧固定“奇数慢约两帧”未稳定重现。VF3 twelve总差=-22.3ms，末模块响应差=-23.3ms。详细每阶段奇偶中位数见attribution-summary.json。preview模块数均15，VF3/VF3.1总中位数154.75/157.15ms，Pixi37.95/37.45ms。

单因素实验只将c68541d的Scene初始化useEffect改为useLayoutEffect，产品文件不动：等待由standard6.2/twelve6.05ms变为约0ms；总启动standard190.05→202.3ms、twelve203.7→199.3ms，未出现稳定改善。Pixi和sync近似，说明当前关键路径主要受模块就绪控制，不能靠移动生命周期声称解决历史双峰。实验补丁只存在harness诊断配置。

环境因果证据：最初document.visibilityState=visible时实际rAF约1000ms；显示IAB仍不能解决，用户手动保持Codex窗口前台后恢复p50=8.3ms、p95=8.4ms。正式54+24样本均在相同前台、1280×720、DPR1.0000000447034836运行，rAF p50≤20ms。原校准记录排除但保留。历史批次没有完整窗口遮挡记录，**不能据此反推历史24.37%全部由遮挡造成**。

## 最小治理与范围裁决

1. 保留生产模块结构和初始化调度：没有证据支持将scene-navigation合并或将Scene换layout effect。无“为了跑分”产品修改。
2. 测量固定前台、记录实际rAF和模块/提交/初始化阶段；把未打包ESM响应等待、after-paint等待与真实同步CPU成本分别报告。后续固定SHA采样不再用纯百分比猜根因。
3. 当前可复现主要耗时已归入模块加载/调度等待，未发现无法在本范围处理的组件/Pixi持续运行时退化，满足用户对**单一零资源弹窗组试点**的前置要求。Task2完成后仍须冻结源码并按原协议三版本72条采样；任一>10%只补一次确认，保留不利数据。
4. 旧dev standard和twelve的精确历史差值无法用新观测完全追溯，不宣布历史百分比闭环或完整预算通过。对资产VF4-B/C与全站CSS的HOLD继续；下一独立审查须单独裁决是否接受本归因与限定试点，而非由本文件自封整体PASS。

复算：`node harness/vf4a/summarize-attribution.mjs`。原始dev-attribution.json54条、effect-experiment.json24条，预热/烟测另存。本文件在任何Task2产品修改前写入，明确串行依赖。
