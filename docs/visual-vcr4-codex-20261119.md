# Track A VC-R4 与 UI 快修独立验收 · 2026-11-19

结论：允许本地合流。VC-R4/P1关闭，UI快修通过；固定443cd699的VF5在实际reduced-still分支通过。整体Visual Freeze仍HOLD。

## 固定范围

- 主线入场78ee332f9259c5547c51dc1e3a52d5e44f94f7a5；候选实现443cd6991edfa0be8377285afd6eed6a26cd0c1d，包含快修f91132de07f6de731753e5a3f3218476da2d4f6a；交付303815b8cee01fd9abdd6042040c5f3be92b170d。
- 候选干净，交付相对实现仅两份文档。基线51c50b6以来所有变化均A源码/测试及A文档；packages、content、art、public/art、DSH、fixtures、受保护导出/配置/锁文件/STATUS零diff，见boundary.json。
- 五份历史/来件清单126+134+35+107+27=429项全部一致。候选完整pnpm check54文件486测试PASS；git diff --check PASS。
- 新证据目录：D:\Documents\FeiyangChen\devApps\ai-game\commission-evidence\visual-vcr4-codex-1119。SHA256SUMS排除可重建dist/cache/perf-builds。

## 功能复验与审查

1. 原缺陷链路4322：委托首次503→Escape→存档出现可见错误回退→Escape后dialogs=0、modal=closed→重开存档显式重试→列表完整恢复。服务日志严格503后200 ?vcr4Retry=1，无整页刷新。静态审查确认同源路径限制、失败不自动重试、并发去重和错误捕获。
2. 390×844的4324：引导关闭后主场景数量0；设置首次503后可退出，重开重试恢复6项设置且横向溢出0。工作看板重看全部后主场景关闭按钮恢复1，跳过全部后引导0。
3. 4325隔离合法pending夹具：通过文件选择器导入、手动保存，导航至首次故障路径，无前置点击连按两次Escape后pending弹窗仍开；重试恢复2项选择，Escape仍不能关闭；选核查后继续正常解除。
4. 4326隔离bankrupt夹具：同样导入保存后首次503，连续两次Escape不移除强制弹窗；重试恢复继承经验重开与读档操作。未真实重开用户游戏。
5. 4327 DEV test-fault=storage：关闭保存提示后关闭按钮0、保存失败胶囊1；存档弹窗保留失败原因与导出入口。该故障只在DEV生效，不把静态包无注入误认为通过。
6. 本轮抽检关键恢复链路；其余直开地图/群聊/布置路径审查共享fallback分支及Gemini矩阵，未冒称Codex逐项重跑。上一轮VC-R1/VC-R3/A3证据仍适用于本轮未修改的对应实现，不冒充本轮再次采样。

### P2：原生Dialog的Tab边界不等于严格页面内焦点循环

390px设置回退从重试Tab至取消，下一次Tab的activeElement成为BODY、:focus为空（浏览器级焦点边界），native Escape仍正常关闭并回终端。没有观察到背景页面控件获焦或软锁，不定为P1，不阻塞本地集成；不认可来件“5次均在dialog内”的更强表述。若要求严格页面内闭环，请Gemini在Dialog统一添加显式首尾Tab/Shift+Tab环绕并分别覆盖可关闭/强制弹窗；不由Codex代改A文件。

## VF5实测

可见IAB，1280×720，DPR约1，zh/light；inGameMotion=full，osPrefersReducedMotion=true，effectiveAnimationBranch=reduced-still。预构建三版本，采样期间无构建、无GC、无后台切页。预检180帧/12输入通过。正式36样本6480帧432输入完整，零>=250ms/visibility变化，全绝对<1500ms、相对两基线<=+10%。正式1批，确认0；旧5af83704结果未继承。

|场景|版本|就绪中位数ms|帧p95 ms|输入p95 ms|
|---|---|---:|---:|---:|
|standard|current|315.60|8.60|16.30|
|standard|1745653|355.00|8.60|16.30|
|standard|c68541d|302.75|8.60|16.30|
|twelve|current|408.90|8.60|16.10|
|twelve|1745653|448.35|8.60|16.10|
|twelve|c68541d|399.10|8.60|16.40|

|长驻十二人|秒|窗口|帧|输入|首/末窗口p95|堆首→末MB|
|---|---:|---:|---:|---:|---|---|
|current|605.742|60|71878|108|8.6/8.6|154.66→145.34|
|c68541d|605.673|60|71907|108|8.6/8.6|149.99→146.91|

两段均零>=250ms/visibility。候选最大窗口p95=16.6ms，中间短暂波动原样保留，首尾均8.6；候选/基线>50ms帧为1/2，堆未持续增长。自动落盘各108输入；结束观察另存各120输入，未覆盖自动落盘。交互间隔受工具延迟浮动，原始时间戳完整。

## 合流与限制

本地合并303815b8到codex/m1-foundation。验收期间主线已有并行Art-Batch 8提交e71cfd7/e888f3a，实际合流父提交为e888f3a833ad7b54a34625f2c873067c4e5408c0；既有美术、chibi-art、包测试及CI修改全部保留，非本轮A改动。仅VF5文档冲突，保留双方历史并加本轮最新结论；A产品文件不手工修改，与固定候选逐字一致验证。实际合流树完整pnpm check通过54文件488测试（比候选多2项既有Art-Batch 8测试），diff --check通过。SHA另记。无push/部署、无正式候选包生成。测试仅隔离origin/夹具，用户存档不动。

DSH用户暂缓、真机触控延期；200%系统字号、真实no-preference全动态、Tier2/3正式接入和整体Visual Freeze仍HOLD。I1–I4/PM-01保持关闭。

测试页关闭、viewport reset；服务PID/端口关闭以cleanup.json为准。DEV首次从上级目录启动触发Corepack版本检查，未改配置，在正确工作目录启动成功；原失败日志保留。
