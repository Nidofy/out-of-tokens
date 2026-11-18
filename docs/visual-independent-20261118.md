# 视觉独立补验与 Gemini 交接更新（2026-11-18）

基线主线 `3489b3c2daaa91581dcf2e40e654fb1f8c942c04`，产品实现仍为 `3ec1908`（含 B `6f27926`）。本轮没有改动任何产品源码或美术资产。用户明确维持 Gemini 修复前端/UI/Pixi、Codex 独立验收与合流；DSH 安装验证按用户要求暂缓，真机触摸因无设备延期。

证据目录：`../commission-evidence/visual-independent-1118/`。`build.mjs` 从主线构建独立验收包，在编译时插入仓外 `probe.js`；正式源码、生产构建不含此探针。原生测试 origin 为 `127.0.0.1:4249`，受控动画诊断为 `127.0.0.1:4250`，均使用可丢弃的新局。

## 结果与证据范围

| 子项 | 结论 | 证据与限制 |
|---|---|---|
| 家具透明/实色原生点击 | PASS，覆盖基础桌代表点 | 原生指针 `isTrusted=true`；透明点 (857,403) 不打开布局，实色点 (929,449) 打开并选中 f1/工位4。`native-hit-v2.json`、`transparent-v2-ui.txt`、`opaque-v2-ui.txt`；不是全部家具穷举，也不是触屏验收。 |
| 布局保存→退出→刷新恢复 | PASS | 将 f1 从工位1移动至工位4，保存成功、修订1；退出布局并刷新，再打开显示工位1空、工位4有基础桌。`layout-saved.txt`、`layout-restored.txt`、`layout-restored.jpg`、`before-reload.json`。未修改日常存档。 |
| 原生减少动态模式的共同变换 | PASS，限定本模式 | 游戏内 motion=full，但系统媒体查询 reduced=true。记录10941帧，8次不同变换，背景位置/尺寸与 Pixi world 位置/比例最大分量差0.0000304，超0.001计数0；包括工作区切换、放大、真实拖动。`camera-native-reduced.json`、`environment.json`。 |
| 受控完整动画分支 | 诊断 PASS，不替代真实环境门禁 | 外部构建仅将 office-scene 中系统减少动态查询替换为 false，保留实际相机插值、渲染、UI与资源。原生点击工作区Ⅱ、放大、拖动、会议区，记录6725帧、113次不同变换，最大分量差0.000499625，超0.001计数0。`camera-controlled-full.json`、对应截图、`build.mjs --controlled-full`；不用于VF5性能对照，不宣称系统偏好已关闭。 |
| Windows 200%系统字号 | HOLD，环境阻塞 | 已核实 SystemSettings.exe 存在，通过电脑工具直接启动返回无可操作窗口，随后窗口清单无 Settings/设置。没有修改系统字号；不使用CSS zoom替代。 |

共同变换探针在 Pixi 场景 ticker 之后逐帧比较 CSS backgroundPosition 与 world.x/y，以及 backgroundSize / 1920、1080 与 world.scale。阈值0.001用于容纳CSS数值序列化精度，不是屏幕观感或性能阈值。记录帧数包含静止帧，不冒称数千帧都处于插值。

首次探针在原生指针尚未初始化 rootBoundary.rootTarget 时调用 hitTest，产生探针异常；不是产品异常。修正版先检查 rootTarget，重新构建后复验，v2命中结果为准。原始证据保留。stage pointertap 数组未收到冒泡事件，命中通过实际 UI 打开/未打开、选中工位以及可信原生指针证据判断，不将空数组冒充已捕获回调。

## 对历史性能证据的审查补充

原 VF5 36+36原始数据及失败结论不变，仍然 HOLD。旧协议写了“完整动态”，但探针没有保存系统媒体查询值；本轮实测证明游戏内 full 与系统 reduced=true 可以同时成立。因此，历史“系统层完整动态已核实”的说法缺少证据，不能由当前偏好反推旧样本当时一定为 true 或 false。

Gemini 做新实现归因和新 SHA 正式采样前，须记录：游戏内 motion、`matchMedia('(prefers-reduced-motion: reduce)').matches`、固定 animation-time 是否启用、可见性、实际动画分支；三个对照版本保持同一环境。实际全动态环境不可达时保持对应门禁 HOLD，不以强制分支诊断代替正式性能数据，不以环境不确定为理由删除旧失败或对同 SHA 开第三批。

## 余项与交接

1. Gemini A1：VF5因果归因、最小前端修复；新SHA复验通过后才启动受门禁约束的600秒长驻。
2. Gemini A2：Tier2/3真实走近/入座/工作/起身/离开的时序和层级合同；Codex依据具体包络制作必要美术修正。原型仍不得直接接入商店。
3. Gemini A3：采用本轮已通过的代表点/保存恢复证据；其修复若触及命中、布局或相机，应做针对性回归。真实完整动态环境及系统200%字号仍待验证。
4. Codex：收到固定A实现SHA、文件清单和证据后独立复验、检查所有权边界，再本地合流。当前没有新的A返修提交，未合入未验代码。
5. DSH暂缓、真机触摸延期；EXP-12不恢复，EXP-13/真人试玩要求已取消。

## 检查与清理

本轮主线实际 `pnpm check` PASS：53测试文件、474测试，含类型、Lint、Web/DSH构建；只构建DSH，不安装或启用。`check.log` 为完整输出。第一次探针构建因Vite缓存写入EPERM失败，日志保留；授权本地构建后成功。提交前执行 `git diff --check`。

4249/4250测试页已关闭，浏览器视口已恢复；两个已核实的测试Node进程已关闭。系统设置未变。独立origin测试存档保留供复查，不宣称已删除。未push、发布或重新打候选包；现有843e0e5候选不变。
