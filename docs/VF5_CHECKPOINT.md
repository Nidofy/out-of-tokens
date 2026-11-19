2026-11-19 Codex独立复验443cd699/303815b8：候选完整check54/486通过、429项历史/来件哈希一致、保护路径零diff。VC-R4旧链路及事件/破产首次加载恢复、UI引导关闭重开、保存告警保留通过。VF5可见IAB正式36通过，确认0；候选/基线各605秒60窗口长驻通过，限系统reduced-still。允许本地合流，无Codex改写A产品源码。严格页面内Tab循环仍需改善（本轮观察到原生dialog边界转移至浏览器焦点，无背景控件误入或软锁，P2）；真实完整动态、200%字号、真机触控、DSH、Tier正式接入及整体Visual Freeze继续HOLD。详见visual-vcr4-codex-20261119.md；合流SHA另记。

2026-11-18 Track A第二次独立复验：冻结5af83704/交付088e4b11，保护路径零diff、历史295项哈希一致、pnpm check54文件482测试PASS。VC-R1旧轨迹及真实GLM重复同步零跳变，VC-R3 1152样本/72实际相位、A3正常交互PASS。VF5可见IAB正式36通过、确认0；候选/基线各605秒60窗口长驻通过，无降频/可见性变化，限实际reduced-still分支。新发现VC-R4/P1：secondary-panels一次503后失败Promise永久缓存，委托重开仍空白、保存入口modal=open却无dialog，Escape不能解除；仅刷新恢复。合流HOLD，未合入A产品，仅文档检查点；维持Gemini返修/Codex验收。DSH暂缓、200%字号、真机触控、真实系统完整动态、Tier正式接入/整体Visual Freeze仍HOLD。详见visual-rework-codex-20261118.md及GEMINI_VISUAL_LAZYLOAD_REWORK_PROMPT_20261118.md。

2026-11-18 固定735b0aec由Codex独立完成正式36+唯一确认36；三版本系统reduced=true，72样本均180帧/12输入、无>=250ms或visibility异常。确认仍有相对c68541d的帧/输入指标超10%，VF5 HOLD；735b0aec两批额度已用完，不开第三批或600秒长驻。另有VC-R1起身同步47px跳变，未合流A实现。详见visual-review-codex-20261118.md；新证据visual-review-codex-1118，历史不覆盖。
2026-11-19 Track A VC-R4 懒加载失败恢复与界面关闭修复更新（隔离分支 `gemini/visual-closure-1118`，界面快修 `f91132de07f6de731753e5a3f3218476da2d4f6a` + VC-R4 冻结实现 `<IMPL3_SHA> = 443cd6991edfa0be8377285afd6eed6a26cd0c1d`；证据 `../commission-evidence/visual-vcr4-1119-gemini/`）：
- 界面快修 PASS（`f91132de`）：`SaveAlertBanner` 增加 `onDismiss` 与 `.ui2-save-banner-close`（`44×44`），主场景关闭后仍可在存档弹窗内查看告警且保留错误代码分流文案；`Onboarding` 区分 `surface="scene" | "drawer"`，关闭或`跳过全部`后主界面完全隐藏，可在`工作看板 -> 重看全部`重开（注：静态 `visual-review` 构建下 `?test-fault=storage` 受 `use-game.ts:148` `import.meta.env.DEV` 限制不注入故障；完整关闭流程已在 Vite DEV `4288` 及 `4300` 实测通过）。
- VC-R4 懒加载恢复与强制弹窗防 Esc 解锁 PASS（`443cd699`）：新增 `secondary-loader.ts`（共享 `idle/loading/ready/error` 状态、捕获 rejection 防未处理异常、`error` 状态重开不自动重拉、并发 `retry()` 去重、同源 `?vcr4Retry=<n>` 绕过失败 ESM 模块缓存且受 `script-src 'self'` CSP 允许与跨源拦截）；`alpha-app.tsx` 静态复用 `Dialog` 维持 `secondary-panels` `109.10 kB` 分包、为所有次级入口补齐可退出的 `<SecondaryFallbackSurface>` 与强制 `pending/bankrupt` 无关闭恢复视图、修正 `dialogOpen`/`data-mode` 及恢复后焦点守护；`dialog.tsx` 新增 `guardNonDismissibleDialog` 修复 Chromium `CloseWatcher` 在无前置用户激活恢复强制弹窗时强行忽略 `cancel.preventDefault()` 导致 `Escape` 关闭 `[open]` 软锁的缺陷。
- 新生端口全入口实测 PASS（`4300–4306`，真实 `isTrusted` 点击/输入/按键，0 `force:true`/0 `dispatchEvent`/0 控制台错误）：`4301` 委托故障重试、Esc 关框后切开 `4302` 存档可见弹窗（`740×268`px）、`4303` 直开存档/群聊/地图/布置布局、390×844 `4304` 设置故障 `Tab` 陷阱与零横向溢出、以及 `4305` `view.pending` 与 `4306` `view.bankrupt` 连续两次 `Escape` 均不关闭 `[open]` 且点击`重试加载`（`?vcr4Retry=1` HTTP `200`）原地恢复业务选项；服务端请求日志证实每次均为严格 `1×503` 后 `1×200 ?vcr4Retry=1`。`pnpm check`（54 文件 / 486 测试，含 3 项 VC-R4 回归）与 `git diff --check`、`protected-zero-diff`（0 字节）及四组历史 `SHA256SUMS`（`126`/`134`/`35`/`107`）全部校验通过。
- VF5 与全局 HOLD 说明：**`443cd699` 上消费正式性能批 = `0`，长驻 = `0`**；严禁把 Codex 对前序 `5af83704` 的 reduced-still 通过结果继承给新 SHA `443cd699`。`443cd699` 的 VF5 正式 36 + 600s 长驻验收、真实系统无 `reduce` 全动态、Windows 200% 字号、真机触控、DSH 实装、Tier 2/3 正式接入及 Visual Freeze 裁决继续保持 **HOLD**。

2026-11-18 Track A 独立复验返修更新（基于 51c50b6 隔离分支 `gemini/visual-closure-1118`，从 `d389b34` 续做；VC-R1 提交 `<VCR1_SHA> = bfc322e412a26deb3e66503472d2fb12eab033b0`，VC-R2 新冻结实现 `<IMPL2_SHA> = 5af837040de58527c130c098366df3e7cc89c866`；证据 `../commission-evidence/visual-rework-1118-gemini/`）：
- VC-R1 轨迹连续性 PASS：`office-scene-spec.ts` `syncWorkstationTarget` 在 `stand`/`depart` 阶段保留原 `station`、`stage`、`arrived` 与退场路径（仅更新目标坐标），修复重复 sync 导致 47.231px 瞬跳；`vcr1/trajectory-audit` 从 `jump=47.230769` 转 `jump=0`；`tier-trajectory.test.ts` 新增 3 项连续性与中途换桌回归（`8/8` 通过）。
- VC-R2 因果归因与冻结修复（`5af83704`，0 正式/确认批消耗）：对退役 `735b0ae` 全部 72 份捕获定位 3 个因果项——(1) 无边界 `ensureWorkHit` 在指针移动后触发至多 8 次同步 `280×240` `getImageData`（`hitMask` 最长 `59.7ms` / 累计 `82.8ms`，引发 6 个 ready 后 `53–89ms` LongTask）；(2) 冷首开 `<StageHubShell>` + `700ms` `hubWarm` 落入首次点击（`input[0]` `paintMs` 达 `37.9ms`）；(3) `visibility:hidden` 销毁合成层及未拆包入口使 `probeInstalled` 中位抬升至 `240.7–267.3ms`（对照 `c68541d` `166.7–200.2ms`）。`5af83704` 新增精灵包络 `[-140..140,-200..40]` 预拒绝并保留 `alpha>=96` 惰性掩码、预挂载 `.inert` + 合成 `opacity`/`pointer-events`、dock `onPointerEnter` 预热、延迟音效、动态拆出 `secondary-panels.ts`（`109.18 kB`）。预构建 3 版本包均完整出包；`preflight.json` 验证 `probeInstalled=229.4ms`、`longTasksPostReady=[]`、`hitMask=0`、`sync.max=4.1ms`，因宿主非可见面板 rAF ~1Hz 降频出现 `throttledFrames=52`（`frameP95=1000.1ms`），立即停止且 `formalBatchesConsumed=0`，**VF5 与 600s 长驻及 OS 无 reduce 全动态继续 HOLD**，待可见 IAB 执行正式对比。
- VC-R3 Tier 2/3 与 A3 原生回归 PASS：`tier/` 12×2×3×16（1,152 样本）用 `setElapsed` 实测 `poseChangedCombos=72/72`、`maxResyncJumpPx=0`、扰动下 `perturbedMaxFeetError=0`、`faceBoxCenterRoiTotalHits=0`、`multiActorBadgeCheck` 4 人零重叠，`glm-3-620-stand` 原生点击 `jumpPx=0`；`a3/` 原生 `isTrusted=true` 全项通过（`initialWorkHitsSize=0`、`工位 1->4` 保存重载、`bluewhale` 原生点击、1280/390 `Tab`/`Escape` 焦点陷阱、`scrim-open-check.json` 证实 `(1246,35)` 命中 `stage-hub-scrim` 阻断终端按钮、`BarkOverlay` 关闭不退出 hub、双版本共同变换误差 `<=0.000492`）。历史证据校验、`protected-zero-diff` 与 `pnpm check`（54/482）全通过。

2026-11-18 Track A 视觉收尾更新（基于主线 51c50b6；隔离分支 `gemini/visual-closure-1118`，实现冻结 SHA `735b0aec66a04ec392f9d741ae7f9042a38d3828`，A1 前置修复 `b63d8825299d6f274e227186d8d6b66f339495a6`；证据 `../commission-evidence/visual-closure-1118-gemini/`）：
- A1 因果归因与最小修复 PASS：`scene-preload.ts` 预热与 `queueSync` 避让首帧、`HudBar`/`AlphaApp` 记忆化、非紧急浮层改 `visibility:hidden`、预挂载 `StageHubShell` 移除 `showModal()`/`close()` 消除约 5.5ms 全文档 `inert` 失效并保留 ESC/Tab 焦点陷阱，完整保留 `alpha>=96` 惰性掩码与家具/角色数量及 `assetsReady` 定义。同机未降频 120Hz A1 对照（`vf5-attribution/attribution-summary.json`，`osPrefersReducedMotion=true`、`inGameMotion=full`、`reduced-still`）：四人就绪 374.40 vs c68541d 374.90ms（-0.13%）、输入p95 19.10 vs 18.20ms（+4.95%）；十二人就绪 485.10 vs 510.30ms（-4.94%）、输入p95 17.70 vs 17.60ms（+0.57%），均 0 丢帧/可见性变化（此组属 `b63d882` 归因数据，不替代冻结 `735b0ae` 的正式 VF5 批与 600s 长驻）。
- A2 Tier2/3 动态状态机校准 PASS：`office-scene-spec.ts` 新增五阶段工位状态机（`approach->seat->work->stand->depart`）及过道/桌后动态 `zIndex`（`apps/` 零原型引用）。真实 `createWorkshop` 12 角色×2 Tier×3 深度×16 阶段（1,152 样本）实测 `maskParityErrors=0`、`maxFeetError=0`、`legVisibilityErrors=0`、`shadowVisibilityErrors=0`、`badgeOverlapCount=0`、`eyeMouthTotalHits=0`（过道横向全 0 遮眼口；`depart-behind` 71/72 为 0px、仅 `glm-t3-d620` 发梢边缘接触 2px 且眼口 0），原生 `isTrusted=true` 角色与家具点击通过，`art-envelope-spec.md` 已交付；原型仍不接入正式商店/规则。
- A3 冻结实现原生回归 PASS：`native-hit.json` / `native-hit-opaque.jpg` 验证透明点未误触、角色点击打开档案且 Esc 关闭、空闲基础桌点击进入布局、已占用工位点击打开委托日志（4 次 `isTrusted=true` 输入，`overThreshold=0`）；`layout-restore.json` / `layout-restored.jpg` 验证 `工位 1 -> 工位 4` 保存重载恢复；`camera-native.json`（364 帧/32 变化/最大差 `0.000364 <= 0.001`）及 `--controlled-full` 诊断（82 帧/31 变化/最大差 `0.000490 <= 0.001`，不替代系统全动态门禁）全部通过。
- VF5 正式批与 600 秒长驻 HOLD：`vf5-formal/protocol.json` 与三版本预构建包（`735b0ae`/`1745653`/`c68541d`）已就绪；`preflight.json`（`assetsReady=1149.5ms`、`throttledFrames=218`、约 `525–541ms` 2Hz 降频、`longTasks=[]`、`tickBeforePresence<=0.8ms`、`visibilityChanges=0`）、`c68541d` 基线对照（6125ms 仍停 `VF5:READY`）及 6s 预检复核（6694ms 仍停 `VF5:READY`）均触发宿主浏览器约 2Hz 合成降频，未在 `735b0ae` 上开跑正式批或 600s 长驻（`hold-verdict.json`）。真实系统无 `reduce` 全动态、Windows 200% 系统字号、真机触控、DSH 实装及 Codex 独立 Visual Freeze 评审继续 HOLD；下文历史记录保留。

2026-11-18 后续审查补充：基础桌原生命中、保存布局刷新恢复及减少动态模式共同变换已补验；受控完整动画诊断113次变换无超0.001误差。旧72样本未存系统减少动态媒体查询，不能证明“系统完整动态已核实”；本轮full/reduced=true并存，不反推旧样本当时偏好。原VF5失败HOLD、禁止同SHA第三批/长驻的结论不变。新SHA采样须记录实际动画分支。用户维持Gemini修复、Codex验收合流，DSH暂缓、真机触摸延期，系统200%字号环境阻塞。详见visual-independent-20261118.md。

2026-11-18 新固定实现3ec1908独立复核：正式36+唯一确认36完整样本，180帧/12指针、无>=250ms帧/可见性变化。首批四人输入p95超10%；确认输入恢复但十二人assetsReady414.05ms相对c68541d359.30ms为+15.24%，VF5 HOLD，未开第三批或600秒长驻。Tier2/3新增有效1008姿态诊断，静态坐定零face相交；入座.61为45/72、横向仍有遮挡，原型继续沙箱。首次无效参数采样留档。详见visual-closure-20261118.md；下文历史证据全部保留。

2026-11-16 镜头/惰性命中验证检查点：入场dc6bc79，用户既有6文件Pan/Zoom/ensureWorkHit直接修复原样保留并提交为 b80d1a8cefb8ccfb2857d11d01c9d38fcb54c1ae；本轮未追加业务源码改动。最终pnpm check 42文件341测试及类型/Lint/Web/DSH构建通过，git diff --check通过，保护路径零diff，生产dist无外部probe/previewSession。新证据仅在 ../commission-evidence/vf5-camera-closure-1116/，历史目录未覆盖。

本轮IAB实测：四视口×zh/en×light/dark共16组镜头面板截图，8按钮尺寸>=44（浮点容差0.01px）、中心elementFromPoint命中、视口可见及无横向溢出通过。390竖屏100→110→120缩放与真实鼠标拖动100px通过；桌面角色/家具起手拖动未误开，轻点分别打开档案/编辑器。定位160→130→100通过，布局进入全景、拖动隔离、取消后110%背景参数精确恢复通过；取消后首个同步读取仍旧值，已保留瞬时与settled两份记录。滚轮(700,250)从110%到130%，背景反算世界定焦点误差<0.001，画外计数0→1。此为代表性交互，未穷举16配置全部手势；双指真实触摸（当前接口无多指注入）、透明边缘原生点击、保存布局恢复分支、完整Pixi/background逐帧变换同步仍OPEN，不以鼠标或数学单测代替。

standard/twelve真实createWorkshop组件各10层×67200像素与独立新Canvas比较全部mismatch=0，查询前workHits.size=0，容器身份、每层1Sprite/1监听器成立。组件ready为角色/家具加载完成，不等于完整VF5 assetsReady；缓存大小0结合ensureWorkHit唯一写入位置证明该观察点尚未生成掩码，不虚构独立Canvas调用计数器或24.20ms实测收益。原函数和浏览器动态alpha>=96语义保留。

性能：可见预检180帧p95=16.5ms、>=250ms为0、无visibility变化。按原5ms/no-store/唯一路径协议启动正式首个current/standard样本，却出现assetsReady=2119ms；中止留样时只有60/180帧，46个>=250ms长帧，12输入已记录。该样本不构成完整正式36批，更不能与历史中位数计算改善百分比；原始中途及停止记录均保留。降频现象已证实，尚未独立排除代码或宿主影响，不声称唯一外部根因。停止正式批、唯一确认和600s长驻，VF5相对/绝对门槛保持HOLD，未刷样本。

Tier2/3外部沙箱12角色×2Tier×3深度×6 arrived=432组（phase=0），sit=-48*arrived、腿visible=arrived<=.6。arrived .2/.4/.6/.61/.8/1的face相交组数分别68/66/47/45/12/0（每档72），所有锚点/feet及mask比较零差异。坐姿阶段仍有57/216组相交，最大临界例GLM Tier3 depth620 arrived.61为223/5602像素（含face精灵轮廓），head为无独立纹理父容器N/A。只验证固定平面锚点下的垂直过渡，不是完整走道水平轨迹或独立起身状态机；原型保持沙箱，禁止据此正式接入。新数据取代“坐定工作相位可覆盖过渡”的任何推断。

DSH：实际apps/dsh/dist/index.js apply挂在独立Node HTTP HostContext及可丢弃磁盘profile，生产前端双标签加载、推进自动写rev1、旧rev0写入409 SAVE_CONFLICT、载入自动档恢复、手动档1写入成功有UI与HTTP日志。不含正式DSH宿主认证/安装壳，无新增认证模拟；本地插件E2E子项通过，完整真实DSH认证/安装仍OPEN。HTTP日志保存方法/URL/状态/响应，未采完整POST请求体。预期409控制台网络错误单独记录，不宣称全流程0error。

5250/5252/5253/5254/5255自启端口与3个IAB测试标签均关闭，5250/5255测试SW/cache/IndexedDB清空，独立DSH磁盘profile删除，未动用户原存档/浏览器/正在运行的DSH。Windows200%系统字体、物理无障碍继续HOLD/OPEN。整体为局部验证检查点，Visual Freeze 1未封板；需先定位性能降频并裁决57组入座face遮挡，再补齐未覆盖UI/DSH项。

以下为历史记录。

# VF5 / 阶段 3：性能 HOLD 与并行基线变化

## 2026-11-14 原位挂载优化及静态掩码硬门禁 HOLD

2026-11-14 VF5启动优化受阻检查点（本轮实测，未封板）：入场b7de8e528b0e1ff3d9bb166b06174c78fe636b07；安全代码提交c3a7aa49232cf007f55b0dfa4079e44f2d28f868。仅修改office-scene.ts：已加载家具纹理直接挂入现有对应层，保留兄弟层、事件监听、相机位置与layout模式；移除每层加载后的双层销毁、objects.delete和全量sync。原有280×240 Canvas读回与workFurnitureHitArea(alpha>=96)完全保留，不能宣称已消除约24.20ms冷启动成本。

静态掩码候选未入库：同一Edge/Chromium156的隔离无头测试，在--disable-gpu与默认GPU启动参数下分别采集同16张冻结SVG，均经Pixi 175×150资源→280×240 Canvas；共414像素跨alpha96阈值（10/16层，standard-back 121）。例如basic-back(115,77) alpha83/99。差异与图形路径配置相关，未取得GPU因果trace，不扩大到所有浏览器。单套预计算掩码不能据此证明逐像素普适等价；候选代码、真实RGBA与失败集成样本完整移至仓库外rejected-static-candidate/，没有静态数据或候选单测残留。原既有单测完整保留。

安全子项复验：相同当前源码、仅office-scene换回入场版本的外部对照构建，standard/twelve两场景均ready，前景Pixi stage提取RGBA差异0、当前/基线命中掩码差异0；当前容器身份不变、每层1个Sprite/1个pointertap监听器。此为隔离组件集成回归，图片为stage边界提取（非1280×720整页实屏），不含CSS背景，也没有受信任原生指针操作；不冒充线上全量点击验收或VF5性能数据。

完整pnpm check通过42文件337测试及类型/Lint/Web/DSH构建，git diff --check通过，保护路径相对入场零diff，生产dist无外部probe/previewSession。当前工具无历史IAB入口；原生Edge控制授权超时，未将隔离headless结果混入正式性能协议。VF5首屏assetsReady<1500ms与相对+10%门槛、180帧前台预检、36/确认36批、600s长驻均本轮未测/HOLD；Windows200%系统字体、真机无障碍、真实DSH安装态继续HOLD/OPEN。按严格顺序及硬门禁停止于任务1受阻检查点，任务3入座过渡432组和DSH宿主浏览器回归未启动。

新证据 ../commission-evidence/vf5-closure-1114/REPORT.txt、vf5-verdict.json、raster-renderer-comparison.json、inplace-regression.json及SHA256清单；历史目录零写入。结束时关闭5240及全部本轮隔离测试浏览器，删除本轮独立浏览器profile（含测试缓存/SW），不触碰用户原浏览器或存档。后续先审查静态栅格边界；可恢复同IAB协议测量仅原位挂载版本的实际收益，仍不得删功能、改命中阈值或刷样本。本轮不宣告Visual Freeze 1正式封板。


## 2026-11-13 续测：正式首批与唯一确认后继续 HOLD

本轮源码仍为bc39ecef8d24a69d5f5015cfefe1a72506c41767，文档入场HEAD 56f5079；无额外业务diff。外部独立目录 ../commission-evidence/vf-closure-1113/resume-01/，未覆盖父目录历史证据。348个Web/packages/lock受测文件冻结复核一致。浏览器预检180帧p95 8.6ms且无降频后，执行事先写入protocol.json的三版本×两场景×六轮交错正式36与唯一确认36；12,960帧、864次真实伙伴面板开关点击，无缺样/visibility事件/>=250ms帧。使用相同外部生产模式插桩、5ms就绪轮询、唯一HTTP路径/no-store；没有清空OS文件缓存或每样本重启浏览器。诊断100ms探针数据未混入本轮。

| 批次/场景 | current就绪中位ms | 1745653 | c68541d | 对c68541d | current帧p95 | current输入p95 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 首批四人 | 398.20 | 437.35 | 399.25 | -0.26% | 8.6 | 16.6 |
| 首批十二人 | 592.50 | 591.60 | 534.50 | +10.85% | 8.6 | 16.4 |
| 确认四人 | 367.55 | 369.25 | 324.05 | +13.42% | 8.4 | 16.8 |
| 确认十二人 | 467.95 | 473.25 | 444.85 | +5.19% | 8.4 | 16.6 |

首批十二人触发唯一确认；确认四人仍超过+10%门槛，因此assetsReady **HOLD**。两批帧间隔与输入p95相对两个基线都在门槛内，但帧间隔不是纯CPU帧耗时，输入从pointer handler到第二rAF不含物理事件队列。就绪包含活动场景角色、家具、背景decode、字体、render和两rAF，不是GPU fence或全离线包。完整判定及复算入口为resume-01/vf5-verdict.json和summarize.mjs。

热点观察：确认四人命中掩码每次调用平均current 3.235ms / 1745653 5.083ms，每轮总时间中位24.20/39.05ms；其中包含canvas绘制/readback，不应与仅循环微基准混为一谈。四人名牌平均0.0073ms、tickBeforePresence平均0.1247ms，十二人为0.0125/0.1692ms；不足以解释历史秒级异常。current与1745653就绪接近，c68541d还没有这些命中/名牌功能，不能通过删除已封板功能换取性能通过。probe安装后就绪四人中位196.30ms，对照c68541d 157.65ms，属于定位线索，不能将相减直接归因于某一函数。backgroundDecode细分插桩未匹配新entry.ready写法，故不提供跨版本decode耗时结论；完整就绪等待仍有效。保留一个current十二人longtask，不删除不利记录。旧1438.35ms/59ms未复现，无历史因果trace，不能宣称唯一根因已修复。

遵循停止条件：在尚无证据支持进一步安全最小修复时停止VF5，不新增刷绿批次，不启动600秒长驻或最终VF4-C。600秒、200%系统字体、GPU/低端真机、真实DSH等仍未完成；上轮UI与SW/离线同源码本机PASS属于历史实测，本轮未重测。准备Gemini只读审核，要求核查统计/探针/最小修复建议和下一步UI美术顺序，独立裁决尚未取得。5212–5214已关闭，测试标签关闭、viewport和visibility恢复。本轮新报告全部在仓库外，按用户边界不向harness追加报告。

本轮收口再次执行pnpm check：42文件337测试及类型/lint/Web/DSH构建全部通过，包含package-verification.test.ts；git diff --check通过。仅三份指定状态文档有diff，保护路径相对b62b1ab零diff。final-check.log在上述独立目录。本地文档检查点SHA另存该目录checkpoint.json，不在正文自引用。

以下为上一轮记录；“正式未测”的旧描述由上述本次结果覆盖，其余实测范围不扩大。

## 2026-11-13 收口：本次实测与待恢复门禁

实现 bc39ecef8d24a69d5f5015cfefe1a72506c41767；本次授权固定基线 b62b1ab8aa05c3f5cd2929bd72eac3042c27869c。证据唯一新目录：仓库外 ../commission-evidence/vf-closure-1113/。完整逐项判定为 vf5-verdict.json，复算入口 summarize.mjs。历史目录只读，未覆盖。总体 **HOLD**；不是 Visual Freeze 1 放行。

第一步本地通过：升级图标与文本列用flex隔离；手账Tab保留完整单词，空间不足整项换行。390×844英文亮/暗四张修复图及1280英文/中文、390中文三张回归图，DOM无横向溢出。八立绘清单status更新为已接入/本地检查完成/独立复审待定；PROMPTS新增512与maskable共用构图、相同SHA说明，不改图片。

性能诊断：同探针对current-before（基线+UI修复）、1745653、c68541d各四人/十二人三轮交错，共18样本、216真实开关伙伴面板点击。十二人assetsReady中位数739.4/753.0/642.5ms，输入p95 18.4/16.1/16.6ms，帧p95均约8.6ms。诊断探针ready轮询100ms，不能冒充正式精确启动门禁。当前十二人名牌求解平均约0.025ms，tick平均约0.228ms；另一细分样本六家具层掩码共31.4ms。没有历史因果trace，不能声称已证明旧1438.35ms/59ms的唯一根因。

细分样本出现约1000ms rAF间隔，同时document visibility无变化、浏览器visibility capability仍true；完整失败样本detail-throttled.json保留。用户随后明确暂时无法保持前台和稳定负载，要求先做无依赖工作，因此未继续正式性能抽样、未执行600秒长驻，不通过删除样本或放宽阈值解除HOLD。

最小优化：workFurnitureHitArea改为预分配TypedArray循环，alpha>=96阈值/坐标/返回契约不变；8轮交错CPU微基准每轮100次，中位1.6877→0.0810ms，掩码逐字节一致。此为局部CPU证据，不是浏览器放行。sceneBackground保留最多两张最近请求图片，取消首屏alternate预解码，保持decode后替换和过期请求忽略；两项新测试覆盖失败重试、竞态、销毁和LRU。两项目标测试文件40测试通过。两条Map记录不代表所有在途请求、浏览器内部缓存或GPU内存总量已被限制，实际长驻仍待测。

离线/SW本次实测通过（限定本机浏览器）：首装无误报更新，265个预缓存响应逐体SHA一致；当前31,742,299字节。旧→新正常生产构建更新等待、先保存再激活、另一标签接管后提示刷新、刷新清除提示并保留读档均通过。外部服务器注入缺失预缓存资源后安装失败，原active版本及手动档仍可用。独立游戏源断连接后root/query导航成功；真实Vite预览源返回Vary: Origin、Cache-Control: no-store，确认5207无监听后重载、canvas、推进上午→下午、手动读档、首次夜景和首次进阶立绘加载均成功，控制台error为空。测试源的SW/缓存/IndexedDB已清理。

UI-OFFLINE-01当前本机回归 **PASS**：历史独立报告 harness/reviews/gemini-unified-2b47242-report.md 的2×2实验已经定位Vary: Origin与crossorigin请求头导致Cache.match失配；docs/REVIEW_1107_INTEGRATION.md已有ignoreVary修复记录。本轮补上当前构建真实停服证据，无新增SW业务源码diff。旧段落“根因未定”作为历史保留，不覆盖本段。未宣称所有浏览器或真实飞行模式全平台通过；生产SW仍保留旧缓存fallback，不宣称无限发布次数下持久缓存有界。

200%系统字体：尝试通过computer-use启动SystemSettings.exe，应用控制授权超时，无可操作窗口；没有更改系统字体，亦未用CSS zoom替代，保持HOLD。GPU显存、真机软键盘、物理读屏器、低端设备和真实DSH安装继续OPEN/未测。

42文件337测试及类型/lint/Web/DSH构建、git diff --check通过，含package-verification.test.ts。保护路径相对b62b1ab零diff，无生图、Tier2/3接入、规则修改、push或部署。5201–5207全部关闭，五个测试标签关闭、viewport重置、可见性恢复。依用户“新增日志/报告在仓库外”要求，本轮不向harness/build-log新增日志，记录保存在上述独立目录。

恢复顺序：先提供可保持前台和稳定负载的窗口，按protocol.json冻结优化后源码并完成正式对照及600秒长驻；允许系统设置窗口控制后完成200%文本大小并恢复原值；第二步满足门禁后，才进入第三步8立绘/14背景/指针与自然长局最终集成回归。不能直接沿用本轮优化前诊断或历史截图。

以下内容为上一轮历史记录，不覆盖上述本次实测与用户暂缓安排。


2026-11-13。本轮阶段 2 固定实现为 `1745653315e0fc50e50e8fbbfbbad8bf16611190`，本地视觉门禁通过，不等于独立复审或 Visual Freeze 1。用户“允许”已解除 Stage B 解析器最小调整的旧阻塞。

阶段 3 **BLOCKED / HOLD**，阶段 4 未启动。性能确认批越线，且测试期间另一工作流提交了 `6fd5fe67537c03dbe70071094a34c025c181fd54`（高级立绘 WebP 与 PWA 图标）。本轮不回退、不覆盖该提交，也不将旧实现的视觉/性能结果移用于新 HEAD。待用户确定后续固定基线和受控复测窗口。

## 已完成的性能检查

证据均在仓库外 `../commission-checkpoints-20261113/`。`vf5-protocol.json` 在正式采样前写入；`vf5-perf-server.mjs` 将同一 `perf-probe.js` 注入三个独立生产模式测试构建，未改产品源码。唯一 URL 前缀与 `Cache-Control: no-store` 隔离 HTTP 缓存；没有清空 OS 文件缓存。禁用测试构建 SW，使用原 `office-lab` 可丢弃内存存档。当前构建保持 1745653 的产物，测试中工作区变更未触发这三份静态构建重建。

三版本 × 四人/十二人 × 六轮，正反顺序交替；首批 36、唯一确认 36，共 72 样本、12,960 帧、432 次真实开关伙伴面板点击。完整性检查无缺样、帧数不足或 visibility 事件。浏览器 Chrome 157 / IAB，1280×720，DPR 1.0000000447034836，中文、默认亮色/full motion。两次校准（current、040031e）不计正式样本。未宣称 dev 模式、低端移动设备或物理输入等价。

`assetsReady` 覆盖活动场景所有已创建角色的全套部件纹理、全部已创建家具前后层、背景 decode、字体 ready、主动 render 与两次 rAF；不是 GPU fence，也不是整包离线资源已缓存。输入统计为 pointer handler 到第二次 rAF，不含真实设备事件队列。`performance.memory` 仅浏览器 JS 堆，不能代替 GPU 或进程驻留。

| 批次/场景 | 当前 assetsReady 中位数 | c68541d | 040031e | 当前输入 p95 | c68541d 输入 p95 |
| --- | ---: | ---: | ---: | ---: | ---: |
| 首批四人 | 370.70 ms | 348.65 ms | 337.20 ms | 16.2 ms | 16.3 ms |
| 首批十二人 | 504.05 ms | 465.35 ms | 472.30 ms | 16.5 ms | 16.5 ms |
| 确认四人 | 514.50 ms | 429.95 ms | 489.55 ms | 42.8 ms | 39.2 ms |
| 确认十二人 | 1438.35 ms | 633.75 ms | 647.40 ms | 59.0 ms | 29.4 ms |

确认批对 c68541d 的资源就绪为 +19.67% / +126.96%，十二人输入 p95 +100.68%；当前帧 p95 从首批 8.6 ms 变为确认批四人 16.7 / 十二人 24.9 ms。三个版本后半段均变慢，事后主机快照 CPU 67%、空闲物理内存约 6.17 GiB，性能电源方案；该快照不能证明整个批次负载，更不能把异常全部归因于环境。没有足够因果证据支持可靠的最小源码修复，未盲目修改封板 UI 或规则来压低计时，也未继续采样刷出绿线。

统计偏离诚实保留：最初显示的“中位数”取 n=6 的上中位值，四人对 040031e +12.15%，据此启动确认；按两中间值平均复算首批为 +9.93%，而非先前进度消息中的约 10.6%。额外保守确认仍是已执行事实，不删除、不择优。最终口径以 `summarize-vf5.mjs` 和 `vf5-performance-hold.json` 为准，早期摘要文件保留。

历史基线 c68541d 工作树干净。040031e 有先前遗留的 visual-review 开关/观察插桩（四文件、两个新增观察模块），本轮只读复用并保存 `perf-040031e-existing-instrumentation.patch`，不是未经插桩的原始 HEAD；不删改该工作树。相同外部探针已应用于三份构建。

## 基线变化与成本边界

清理开发服务时发现 11:15:47 的源码热更新记录，随后核验 HEAD 为外部提交 6fd5fe6：解析器改为 WebP、八个旧 SVG 移到 legacy、PWA 入口/清单/构建列表变化。冻结核查的十项已知变更见 `vf5-source-drift.json`；该清单仅覆盖阶段 2 原有冻结文件，不是新提交全量文件清单。完整改动以 `git show 6fd5fe6` 为准。外部构建不受热更新影响，72 样本仍属于 1745653，但不能验收新的产品基线。

1745653 的 Stage B SVG 总计 17,181,555 字节，测试目录总字节 current 45,889,155 / c68541d 28,629,814 / 040031e 28,606,055（含构建说明文件；不是网络传输量、纹理解码内存或显存）。这些 Stage B 图未在启动场景加载，不能用它们解释上述启动回退。新 WebP 资产成本不在本轮旧构建测量范围。

## 未完成与恢复条件

- 长会话 10 分钟驻留方案尚未执行；页面停留产生的零散堆快照不算受控长会话测试。
- 完整离线包 assetsReady、SW 首装/等待更新/主动更新/其他标签激活等全分支、UI-OFFLINE-01 根因与修复：OPEN/HOLD，未开始本轮实屏专项，不以代码阅读或旧测试代替。
- 200% **系统**字体缩放：OPEN/HOLD，未改变系统设置，未用 CSS zoom 冒充。
- GPU fence/显存、低端真机、真机软键盘、物理读屏器、真实 DSH 宿主安装：OPEN/HOLD。
- 阶段 4 O4-B：未启动，规则版本和 packages 未改。

恢复前由用户明确固定实现基线，并协调受控空闲测试窗口；新立绘/图标变更须按新基线重新冻结与补验相关视觉、离线、性能门禁。已有不利样本永久保留，不将新批次视作旧确认批的替换。

本轮阶段 3 无业务源码 diff，仅记录失败与基线变化。检查及自启端口/浏览器清理结果由 STATUS 与仓库外日志登记；禁止 push、部署、付费 API。本轮未操作外部工作流的资产生成或提交，不对其执行方式作背书。

阶段3停止检查点验证：在保留6fd5fe6的当前工作区运行 pnpm check，41文件334测试及类型/lint/Web/DSH构建通过；git diff --check通过。仅新增/更新状态文档，无业务源码修复。本轮自启5184、5185、5187、5188、5189端口均关闭，测试浏览器tab关闭、viewport重置、可见性恢复；未终止其他工作流进程。README/workflow/lock/scripts/packages/dialog/partner相对本轮基线零diff；初始7委托文件与README/workflow哈希另行核对。本轮未push、部署、付费API或拷入参考截图。
