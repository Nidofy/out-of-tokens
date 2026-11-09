# VF3 检查点：显式定位与场景核验

2026-11-10；分支 `codex/m1-foundation`。本轮依据用户 `harness/reviews/vf3-user-handoff.txt`，接受 VF2 **有条件通过**，先闭环 VF2-F-01～04，再实施限定 VF3。父提交 `e693642215f6406fa6e945144591ef0a8c736720`，上一固定实现 `61b9c7594dcf288e7cb0f136aec11911cdc7cbb6`。本地工程检查点完成，**等待 Gemini 独立裁决，不代表整体 Visual Freeze 1 完成**。固定 SHA 见后续独立记录 `harness/reviews/vf3-handoff.md`。

## 1. 保留的边界与定调

三屏布局、S2 草稿与固定底栏、S3 160/128/112 方框、现代系统无衬线与 tabular-nums、不透明暖白/深褐纸面、暖木场景、深胡桃 HUD、黄铜细饰、10/12/16/999 圆角和蓝色 3px 双焦点环保持。原版十二角色资产、1920×1080 世界、固定家具槽位、前后遮挡层保持。

`packages/`、`pnpm-lock.yaml`、`apps/web/public/art/ai-village` 相对 VF1.1 的差异为空；engine 0.16.0 / content office-2 不变。没有改变价格、容量、奖励、RNG、Command 或存档契约。未 push、部署、调用付费模型；未启动 VF4、O4-B/O4-C。

## 2. 四项先决修复

| 项目 | 实现与实测结果 | 证据（均在 harness/vf3） |
|---|---|---|
| VF2-F-01 | 仅 global 或 assign/deliver 收据可关窗后进入 S1。角色错误、visit、无跨屏收据的 job/saves 保持局部。global error 优先由活动 job/actor/saves notice 承接；paused 且未关闭的全局错误优先于普通成功及局部反馈，手动关闭或恢复后可替换 | feedback-routing-status.json；receipts.json；storage-warning-after-chat.png |
| VF2-F-02 | sticky top 48px；桌面/手机滚到底时 gap 均 0.4286px；研发按钮仍在可见区域，标题与提示无透字缝隙 | profile-error-feedback.json；s3-error-visible-1280.png / 390.png |
| VF2-F-03 | partnerAvailability 派生 status，优先级 expedition → lifeBusy(work/occupied) → elsewhere。晚上未加班仍提示去图书馆；异地安排加班后提示正在负责委托 | feedback-routing-status.json；overtime-elsewhere-status.png |
| VF2-F-04 | job-tags span、version-tag 加入 12px 覆盖；S1/S2/S3、四个抽屉全部 details 展开并检查实际待接单标签，违规数 0 | text-audit.json（一次误扫背景的尝试明确标为无效，不计 S3 通过） |

存储告警实机使用 `?office-lab=initial&test-fault=storage-events`，打开 Qwen 档案，`Ctrl+Shift+F9` 调用 LabSaves 的真实 onExternalChange 订阅，再点击聊天；告警原文保留。该注入只在显式 DEV/visual-review 的内存夹具中有效，不接触玩家存档；不把它冒称为本轮真实浏览器双标签 IndexedDB 竞争测试。五类错误路由、保留/手动关闭/恢复优先级另有 vf2.test.ts 断言。

## 3. VF-03 的实现

- 相机区域由 AlphaApp 管理，与 layoutCamera 一起传入实际渲染器 `office-scene.ts`（`scene.ts` 是重导出）。区域与 focus 仅修改同一世界/背景变换，所有画内角色继续 renderable。
- `actorPlacements` 共用原渲染站位、预订槽位及双会议席 ±72 偏移。S3 同工作室伙伴可显式“定位到场景”；S2 具有预订工位/会议席的委托可定位。点击后关闭档案/工作台/抽屉与位置列表，对准锚点；不派 Command、不写存档、不消耗 RNG。
- S1 局部相机时显示“返回全景”，清除 focus 与区域选择。视角菜单展开时也可点击。打开普通 S2/S3/抽屉不移动相机。
- “伙伴位置”入口显示画外人数，展开后列出画内/画外/食堂/图书馆/远征。工作室在场角色可直接定位；异地角色进入档案，再通过现有“去找伙伴”操作移动。镜头和 HUD 不预留或改变世界坐标。
- 初始窄屏从隐式 work-left/lounge 选区改为统一 overview；画外伙伴由位置入口显式承接。切换实际场景清除过期镜头定位。
- 工具在顶栏下方，避免覆盖近景脚点/名牌；位置列表可滚动、关闭，与其他抽屉互斥。未增加常显十二人的满屏胶囊。

## 4. 接触、遮挡与命中

保留现有电脑坐姿上移 48、到位后隐腿、桌面前挡板、走路插值与支持岗位站在协作白板两侧的表现。这里的“双会议席”是既有白板的两处预订锚点，**没有新增会议椅或假称白板角色具有椅子坐姿**。没有重绘或导出角色资产。

发现并修复两处名牌问题：十二人有工位时下方站姿角色的头与工位名牌相碰；最终保留 idlePoint 原站位，把工位名牌移到前挡板 `workLabelOffset=-32`。横屏双会议席名牌拥挤，在 scale<0.8 时第二席屏幕向下错开22px。Canvas 名牌字号 12px。中间尝试下移后排导致窄屏更靠近底栏，已撤回；保留中间图，不把它当最终效果。

42 次实机点击记录见 `hits.json`：四位开局站姿、十二人站姿全员、十二人在场/GLM 工位/双会议席全员、手机与英文深色/横屏 GLM、Qwen 脸部、占用桌面/白板→对应 S2、空桌→OfficeEditor、透明桌角→无浮层。未发现记录中的角色错配。十二角色逐个由真实 accept/assign 构造电脑预订锚点的断言见 vf3.test.ts。

### 五视口证据索引

| 尺寸 | 主要图片 | 覆盖 |
|---|---|---|
| 1280×720 | initial-1280-standing.png；locate-1280-final.png；preview-locate-1280-final.png | 四人站姿、标准电脑、优化诊断 preview 定位 |
| 1920×1080 | twelve-1920-standing-final.png；twelve-standard-1920.png；locate-1920-glm.png | 十二人逐个实点，GLM 标准电脑、双会议席、空桌；后两张为名牌收尾前对照 |
| 390×844 | twelve-basic-390-glm.png；presence-390-final.png；presence-evening.png | GLM 基础电脑、列表画外定位、十二人异地状态；locate-390.png 为早期同变换 Qwen 标准电脑 |
| 560×800 英文深色 | locate-560-dark-en.png；twelve-standard-560-dark-en.png | 十二人站姿 GLM 与标准电脑，最终顶栏下工具与前挡板名牌 |
| 844×390 | locate-844.png；meeting-844-overview-final.png；twelve-basic-844.png | 四人基础电脑/双会议席，十二人含 GLM，缩小名牌错开 |

`camera-roundtrips.json` 五尺寸均记录定位改变变换、返回恢复原变换、HUD 时段/现金/额度不变；四个 S3 打开前后变换相同，390 通过位置列表定位。`presence-elsewhere-profile.json` 确认异地打开档案有 visit、没有错误的工作室 locate。

证据是代表性实机组合加共享几何断言，不冒称十二角色×五尺寸×全部姿态逐项实点穷举。远征状态分支沿用已有 location 与档案禁用逻辑，本轮没有从第0章实机跑到远征。动作仍是现有程序化动作；精细手指接触、复杂寻路、逐像素 alpha 命中、全平台与全章节布置不在本轮新增实现中。

## 5. 自动化与严格性能时序

`check-baseline.log` 基线通过；`check-final.log`：**38 文件291测试**，类型、lint、Web/DSH构建全部通过。新夹具初稿错误放入五人队伍，被真实 core 拒绝 INVALID_TEAM；改为合法三人队伍并加入夹具测试，失败保存在 fixture-initial-failure.json，preview-verification.json 中同一旧 dev URL 的历史日志也原样保留。没有吞错后继续伪造截图。

所有应用代码/CSS/测试定稿后，于 UTC `2026-11-09T16:28:30.958Z`（北京时间11月10日00:28）写入 source-freeze.json。此后采样前后150文件原始哈希一致；source-freeze-verified.json 另给 LF 规范化哈希供新 Git 检出复验。**性能后未修改任何源码/CSS**，只补文档、证据与恢复 ignored 构建产物。

同机 IAB，1280×720，精确 DPR `1.0000000447034836`，缓存预热后 standard/twelve，dev + `vite build --mode visual-review`，三版本顺序每轮正反交替；两批各72条/组内6次，12条预热排除。源码/锁依赖相同；040031e worktree 沿用上一轮的诊断开关/指标补丁，61b9c75 在新 `../vf3-vf2-baseline` 固定检出，未更改旧 junction 或安装依赖。

| 模式/场景 | 首批对040031e / 对VF2 | 复核对040031e / 对VF2 |
|---|---|---|
| dev standard | +14.82% / -1.69% | +6.85% / **+20.20%** |
| dev twelve | -3.16% / -2.33% | +3.10% / -4.01% |
| preview standard | -1.21% / -2.50% | -14.08% / -4.78% |
| preview twelve | -7.26% / -1.89% | -10.28% / -4.30% |

原始记录 startup-balanced / startup-confirmation / startup-warmup-excluded.json；`node harness/vf3/summarize-startup.mjs` 可重算。两批不利结果都保留，不以复核覆盖首批。补充 dev-standard-diagnostic.json 三版本180帧观察：p50约8.3ms、p95约8.4–8.5ms、over50均0；VF2/VF3资源数均104，decodedBody相差36,720字节，后者是资源载荷而非GPU纹理内存。单次补充启动173.6/155/153.1ms表明波动，不能用这一次较好样本推翻不利批次或断言根因。

结论：**优化构建本次抽检未见增量回退；dev standard 风险开放**。下一轮若需关闭风险，应固定浏览器/刷新率/电源状态，记录主线程长任务与组件提交/模块解析时间，预先确定统计协议，不能反复采样直到得到通过值。完整输入延迟、全部素材就绪、内存和低端机预算留VF5。

采样后 `pnpm --filter oot-web build` 恢复默认生产产物；production-restored.json 无 vf-metrics/vf-startup。cleanup.json 记录5181–5186无监听，浏览器视口reset、临时标签关闭。对照worktree保留，不递归删除。

## 6. 后续执行门禁

1. Gemini 对固定实现只读复审：先裁决四项VF2返修，再裁决定位/返回/离屏、名牌与命中；分别列已验证/仅源码推断/未复现。重点复核 dev standard 两批不利数据。
2. 若发现P0/P1或本轮验收阻断：仅做VF3.1，按对象给最小修复、测试、实机证据和停止条件。若改源码/CSS，必须重新冻结并执行同协议性能采样。
3. 若通过：冻结本轮 S1 定位与位置入口规范，列出VF4允许推广的组件/资产清单、原资产不得变动的范围和逐屏验收矩阵；仍需新的用户执行交接才开始批量生产。
4. VF4后才进入VF5完整性能/离线/输入/可访问性矩阵；Visual Freeze 1整体放行之后再讨论O4-B/O4-C。当前不能用291测试或截图代替这些未完成门禁。

本轮停止于两个本地提交，等待用户带回独立审查。交接Prompt必须要求Gemini末尾给出完整可复制的“交接回Codex的执行Prompt”。
