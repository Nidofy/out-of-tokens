# 交给 Gemini：修复视觉收尾独立复验发现

请在现有 `out-of-tokens-visual-closure-1118` / `gemini/visual-closure-1118` 上，从干净文档提交 `d389b34ab85352e3ee1a15c57eb8ab689d1e96d2` 连续返修。Codex未合流A1/A2，未改你的实现。先读主仓 `docs/visual-review-codex-20261118.md` 与独立证据 `../commission-evidence/visual-review-codex-1118/`。本轮不用从主线重建而丢掉735b0aec；如需同步主线，仅同步Codex登记的文档提交。

## 1. 首先修复 VC-R1（P1）

`office-scene-spec.ts` 的 `syncWorkstationTarget` 在stand过程中重复同步相同休息/新工位目标，会直接落到idle或approach，丢弃旧station/起身进度。相机sync、resize、view/capacity更新都可能触发。

复现（在你的工作树运行）：

```powershell
pnpm exec tsx ../commission-evidence/visual-review-codex-1118/trajectory-audit.ts
```

现版本按预期失败：stand100ms后重复同步，相同休息目标及换工位目标均跳47.231世界像素。真实createWorkshop证据 `tier/stand-before.json` 与 `stand-after.json`：GLM depth620，stand/.5脚底573变idle/620。

使同步对未变目标保持幂等；stand/depart应保留旧工位、当前arrived和路线，直到退出完成。处理途中更新目的地、回原工位、连续view/camera同步，不能靠跳过所有sync或删除起身动画掩盖。补充有实际行为价值的测试：重复目标、不同目标、每帧sync、镜头/resize同步；用前后相邻帧的实际世界脚底和scale连续性断言，不能只比较单帧锚点公式。修复后独立提交实现SHA。

## 2. 修复 VF5（VC-R2）

735b0aec已由Codex在可见IAB上完成正式36+唯一确认36，全部完整180帧/12真实点击，无>=250ms帧或visibility变化。确认相对c68541d：四人帧p95 +94.19%、四人输入p95 +34.05%、十二人输入p95 +60.53%；就绪绝对值通过。原始资源/spans、全部样本、协议和汇总位于独立 `vf5/`。

**该SHA已用完两批，不得跑第三批，不得删除失败，600s长驻未启动。** 系统reduced=true已显式记录；这次结果不能继续写成仅有宿主2Hz阻塞。先做有因果依据的受控诊断，找出冻结版本在相同输入路径上的相对成本；A1的b63d8825归因变体不等于A2冻结实现。允许分析，不能刷样本或放宽门槛。

保留全部角色/家具、完整scene assetsReady、alpha>=96惰性掩码、相机和监听器身份、键盘焦点圈定、scrim阻断、Bark交互。提交实质修复的新SHA后预登记正式协议；只有正式或唯一确认全部通过，才顺序运行当前/c685十二人各>=600s长驻。记录OS减少动态、游戏内设置、固定时间参数、实际分支与可见性；no-preference环境不可达时单独HOLD，不能用强制分支当正式全动态验收。

## 3. 修正 Tier 证据（VC-R3）并保留资源

旧tier-probe停止ticker后，tick(350)不递增生产elapsed，work-phase标签未真实覆盖不同相位。Codex仓外修正版显式设置elapsed为0/.35/.7，重新1152组结果仍零眼口ROI相交。参考独立 `tier/probe-amendments.json`、`tier/independent-summary.json` 和对应源码，但不要把仓外探针放进生产。

补证真实动画时钟/姿态发生变化；对完整进出轨迹新增重复sync及镜头扰动。单帧feetErr=0不能证明连续性，单角色badge测试不能称为多人全部通过，固定脸框ROI不能称语义眼口逐像素分割。

Codex美术裁决：现有Tier2/3原型包络作为沙箱参考可接受；GLM 2px发梢接触非阻塞，不要求PNG羽化/重画。你不改资产；不把原型接入商店/规则。先修时序再重新评价。

## 4. 回归、边界、交回

Codex本轮已通过基础桌/角色原生点击、布局工位1→4保存刷新、桌面/390px面板焦点与Escape返回、scrim阻断、Bark关闭、相机共同变换抽检。你的修复若触及相关代码须针对性回归，禁止force/event-dispatch代替真实点击。不要重开I1–I4、PM-01或EXP-12/13/真人试玩。

仍按A前端/UI/Pixi与相应测试所有权；packages、content、art、public/art、DSH、fixtures、指定内容/美术入口、构建配置/锁文件保持保护。Codex负责验收合流，不代改A文件。DSH安装暂缓、真机触控延期、200%系统字号待验收；不push、不发布、不重打正式安装包。

独立运行pnpm check、git diff --check并给出保护路径零diff、固定实现SHA/文档SHA、原始失败与修复证据及SHA256清单。明确标记新SHA已消耗的正式/确认批次；不能只交一个PASS摘要。关闭本轮服务、恢复视口。交回Codex复验后再决定是否合流。
