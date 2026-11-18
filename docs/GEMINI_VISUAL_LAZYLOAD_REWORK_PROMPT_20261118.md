# 交给 Gemini：Track A VC-R4 懒加载失败恢复最小返修

继续在现有隔离树 `D:\Documents\FeiyangChen\devApps\ai-game\out-of-tokens-visual-closure-1118`、分支 `gemini/visual-closure-1118` 工作。起点干净 `088e4b115b111498628a6525a81d3764ed6f99fc`，产品实现 `5af837040de58527c130c098366df3e7cc89c866`。不要修改共享主仓，不 push/部署、不生成正式候选包。

先读主仓 `docs/visual-rework-codex-20261118.md` 及新独立证据 `D:\Documents\FeiyangChen\devApps\ai-game\commission-evidence\visual-rework-codex-1118`。主线未合流任何本轮 A 实现。VC-R1 / VC-R3 / A3 正常路径已经独立通过；固定5af83704本机 reduced-still 的正式36及双605秒长驻通过，确认批0。不要再次修已经通过的轨迹或重画 Tier 图，不补跑旧735b0aec。

## 必修 VC-R4 / P1

`apps/web/src/alpha-app.tsx:53–55` 的 `secondaryTask ??= import('./secondary-panels.js').then(...)` 缓存失败 Promise；347–348 的 effect 不捕获失败。`secondary` 为空时，委托/档案/工作室/手账内容和存档等弹窗直接 null。

独立复现：隔离服务首次 secondary-panels chunk 返回一次503后恢复正常；打开委托只出现空框。关闭再开仍为空白，无新资源请求、无错误或重试入口。再点击保存状态，data-modal=open 但没有 open dialog，Escape 不能解除。整页刷新才恢复。日志和截图在 `a3/captures/chunk-fault-*`，服务器脚本 `a3/serve-chunk-fault.mjs`。

请最小修复：

1. 建立共享的加载中/失败/重试状态，捕获 Promise rejection；失败不能永久污染后续尝试。UI 需明确反馈而非无限空白。
2. 同一会话内，在资源恢复后用户能显式重试并成功打开内容；核实浏览器失败 import 的 URL/module 缓存行为，不能仅把 secondaryTask 清空便视作恢复。避免无限自动重试、无界缓存/请求、未处理 rejection。
3. 对没有独立外壳的存档、设置、地图、布置、群聊等入口提供可取消/可恢复状态；失败时不能留下 modal=true 却无弹窗、dock不可用的状态。
4. 未决事件/破产等强制处理入口加载失败也必须有可访问恢复界面，不能绕过领域限制或改变游戏规则。明确测试首次由这些入口触发加载的情形。
5. 保持成功路径懒加载收益、完整内容与资源、原生焦点陷阱、scrim阻断、Bark交互、正常保存和页面状态。不用整页刷新/重开作为唯一恢复，不丢失当前会话进度。

## 验证与文件边界

- Gemini 只修改 A 文件；优先 alpha-app 与小型前端加载器/反馈组件/对应测试。若涉及其它所有权文件，先给出具体补丁并按原分工取得确认。不得修改 packages、persistence、DSH、内容/美术、历史fixtures、根配置、锁文件、共享STATUS及冻结资源。
- 完整 `pnpm check`、`git diff --check`。保持已有54文件482测试断言，不弱化门禁。新增测试覆盖实际失败→重试→成功及 modal 解除，不写只复述实现的测试。
- 原生浏览器故障复验：一次503→服务恢复→同会话点击重试成功；先开委托失败再开存档；首次直接开存档/设置失败可退出；事件失败可恢复。1280×720与390×844验证键盘、焦点恢复、提示可读。零 force/dispatchEvent。
- 将这轮故障服务复制到新的证据目录，不能覆盖 Codex 或历史 Gemini 数据；保存服务请求状态/次数、UI与console、屏幕证据、SHA256SUMS。
- 保留5af83704的独立性能通过证据；新实现 SHA 性能尚未验收。提交最小补丁后冻结新 SHA，交 Codex 在可见 IAB 按预固定协议做新 SHA 验收。不要自行刷正式批，也不要把旧 PASS 冒领为新 SHA PASS。
- DSH暂缓、Windows200%字号、物理触控、真实系统完整动态、Tier2/3正式接入与Visual Freeze仍保留明确HOLD。I1–I4/PM-01保持关闭，不扩大范围。

## 交付

实现提交与仅文档提交分开；更新你拥有的 track-a 交接记录。返回实现 SHA / 文档 SHA、精确修改清单、失败缓存与重试设计、各入口验收矩阵、完整检查结果、新证据目录及哈希，并说明正式性能批次消费数（预计0）。保持工作树干净，等待 Codex 独立复验与本地合流裁决。
