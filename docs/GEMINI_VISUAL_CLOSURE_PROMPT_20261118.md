# 交给 Gemini：Living Studio 3.1 后续视觉收尾

2026-11-18 最新用户决定：维持 Gemini 修复、Codex 验收合流；DSH安装验证暂缓。先读 `docs/visual-independent-20261118.md` 的本轮补验和环境限制。Codex未改A源码，也未代为发送此任务；由用户将本文件交给Gemini执行。

请连续执行下面的前端任务，完成后交回固定实现SHA、证据目录与精确PASS/HOLD范围。不要修改Codex负责的规则、存档、叙事和美术资源。不要把本地功能合流误写成Visual Freeze通过。

## 恢复与所有权

仓库 `D:\Documents\FeiyangChen\devApps\ai-game\out-of-tokens`，目标分支 `codex/m1-foundation`。先读AGENTS.md、docs/STATUS.md、docs/experience31/closure-20261118.md、docs/visual-closure-20261118.md、docs/VF5_CHECKPOINT.md。确认最新主线已包含PM-01的B `6f27926` 与A `3ec1908`，再从最新主线建独立工作树，不回退到旧bb97135。若主线尚未包含，向合流负责人报告并等待登记，不自行反向合流。

你拥有前端UI/布局/CSS/Pixi场景/Worker接入和相应前端测试。Codex拥有packages规则与持久化、content、art、public/art资源、内容和资源入口、DSH及最终合流。共享文档按本轮登记修改。只本地提交，禁止push/部署；不改用户存档；不重开I1–I4和PM-01；不恢复EXP-12/EXP-13/真人试玩。

## A1：VF5性能归因及最小修复（优先）

最新独立证据：`D:\Documents\FeiyangChen\devApps\ai-game\commission-evidence\closure-1117\vf5`。

- 当前固定实现3ec1908；正式36样本四人input p95=18.4ms，对1745653/c68541d为+13.58%/+16.46%。
- 唯一确认36样本输入已通过，但十二人assetsReady中位数414.05ms，对c68541d的359.30ms为+15.24%，超过10%。
- 72样本都180帧/12指针，帧p95均8.4ms，没有>=250ms帧或visibility变化。绝对就绪<1500ms通过，VF5整体HOLD。
- 不删除不利样本；不再对相同实现跑第三批求绿；600秒长驻尚未开始。

先利用profile.js、perf-server.mjs和原始resource/spans做受控因果对照：区分角色纹理与解码、场景sync、额外3.1 UI成本。必要时使用独立变体、保证同一实际资产和ready定义；不能因某项耗时高就声称它是回归原因。找到可证实原因后提交最小前端补丁，保留现有alpha>=96精确命中、懒掩码、布局/相机/监听器身份。不要删家具、减少角色、把完整assetsReady改成只等canvas，或放宽10%/1500ms门槛。修复后新SHA才能按预先固定协议开新批；全部通过再做当前/c685十二人各600秒长驻。

环境补充：旧72样本没有保存系统减少动态媒体查询值，不能证明系统层完整动态已核实。本轮游戏内motion=full但系统reduced=true。新采样须记录两者、animation-time、实际动画分支和可见性，并让三个版本环境一致；不能以本轮受控强制动画探针代替正式全动态性能测试，也不能据此删除旧失败或重开同SHA第三批。

## A2：Tier2/3真实动态校准（与A1分开提交）

资源仍是 `art/art-batch-4/prototypes` 参考，不接商店、不增加规则。独立诊断在 `commission-evidence/closure-1117/tier`：有效文件 `capture/extended-1008-v2.json`、`summary-v2.json`；无v2的1008文件因参数滞留无效，仅作失败留档。

- 12角色×2Tier×3depth，静态arrived1的72组face相交均0。
- 入座.61仍45/72组相交，GLM Tier3 depth620为223/5602；截图眼口可见，不把发梢相交一概判为遮眼。
- 固定层序下横向Gemini Tier3 depth620 offset32 arrived0为2248/5590，实际面部被前层屏幕挡住。
- 这是沙箱姿态诊断，不是正式office轨迹。现有目标/zone变化直接重置arrived，不存在独立起身状态机。

请用真实scene、共享相机和动态zIndex建立完整“走近→入座→工作→起身→离开”证据，覆盖12角色、两Tier、三深度、关键工作phase、减少动态开关，验证feet、层级、腿、点击热区和名牌。先确定状态机/分层合同；如需要修图，交Codex精确角色/相位/像素包络及保持不变的锚点、尺寸、风格要求，不能自行改PNG或通过删屏幕掩盖问题。正式运行时接入仍须规则范围明确授权；本任务默认只校准原型。

## A3：镜头与可访问性剩余证据

沿用已通过的16配置镜头证据，不无理由重跑全部旧项。Codex本轮已补齐基础桌透明/实色代表点的真实原生点击、布局保存/退出/刷新恢复，以及原生减少动态模式共同变换；证据见 `commission-evidence/visual-independent-1118`。受控完整动画诊断113次变换零超阈值，但真实系统完整动态环境尚未核实。你的补丁若触及相关代码，做针对性回归并补齐真实环境动画证据。禁止用event dispatch或force click替代原生命中。所有临时端口独立、结束停止服务并恢复视口。

真机触摸已由用户明确延期（无设备），不可标PASS。Windows200%系统字号尚未验证（最新直接启动设置未暴露可操作窗口，未改设置），不以CSS zoom代替。真实DSH当前V0.2.2-rc.1拒绝候选0.2.1-rc.5；用户已明确暂缓安装验证，不属于你这批改动，Codex也暂不推进。

## 交回要求

每阶段实际运行pnpm check、git diff --check，保存原始失败与修复记录；提交A范围明确的实现SHA及独立文档SHA。交回文件清单、受保护路径零diff证明、新旧性能原始样本、视觉/命中截图、仍HOLD项。不要要求Codex代改A文件；若确实需要Codex应用补丁，必须在track-a明确确认具体补丁/文件/验证。Codex只在独立复验后本地合流。
