# VF4-A4 验证协议与原始记录说明

起点 bb2fa10e2598b0dc1eff1dab2051ba0685c9ee75；本地 codex/m1-foundation。所有隔离存档仅在内存中使用。正式生产不包含 A4 fixtures。

## 交互

CUA 浏览器实机，1280×720 zh/light、844×390 zh/light、560×800 en/dark、390×844 zh/light。`interaction-results.json` 保留全部 261 条观察，包括 12 条失败；`delivery-verification.json` 将每条失败对应到后续通过记录，同名使用最后一条。不得只筛选通过记录后宣称无失败。

`browser-methods.txt` 保存实际执行的主要采集函数。每条包含 bodyMetrics/bodyRect/shortControls/focus/focusInDrawer/focusInDialog；S2 附加 section/footer 几何，Office 后期附加 header/toolbar/select 互不遮挡断言。触控测量针对当前显示的交互控件；未显示步骤由切换后记录覆盖，不声称完整 WCAG 认证。

Jobs 的 active/history 空态、搜索无结果、分组数量与非空卡片均有实机文本记录；补充 a4-no-posted 通过现有 accept Command 接下全部五张委托，四视口明确断言 Available (0)/待接单 (0)、专用双语文案与零卡片。S2 覆盖 posted、澄清及等待、夜间、范围选择、accepted/working、waiting、review/deliver/rework、delivered/breached。桌面三栏与窄屏分步、草稿保留/关闭丢弃、非法队伍提示和合法派遣/交付单一 S1 回执均保留。局部反馈关闭后清理及 Escape 恢复入口有记录。

Office 覆盖可读 SVG/option/inventory 标签、交换（含 SVG Enter）、收回、两种预设、采购/撤销、占用锁、取消/保存与触发器恢复。最终 `office-*-save-camera` 同时检查非默认分区和 `.workshop` style 保存前后完全相同；`office-*-studio-cancel-final` 与 `office-*-saved-final` 补验最终源码下 Studio/More 两入口。相机 reducer 及 renderer 未改动。

发现并修复：接单/返工、澄清/范围按钮消失或禁用后焦点丢失；撤销采购移除当前按钮；SVG tabIndex 大小写导致节点实际不可聚焦；横屏 footer 高度与工具面板遮挡；布置关闭恢复焦点。最后一组保存断言原先在异步提交/渲染未稳定时读取，保留三条 false；实现改为 `[arranging]` effect 后渲染帧恢复并重新解析原 Dock 索引，测试等待编辑器消失和目标 `:focus` 出现。不能把全部历史失败笼统归因于自动化工具。

## 夹具

`fixtures.ts` 通过 review server 的 `--fixtures` transform 接入现有 labSession，不写入生产源码。`a4-project` 重放既有 A2 章节存档的 Command 后缀；`a4-breached/night/clarified/scope` 通过现有 Command 构造状态。`a4-rework` 仅在隔离内容副本将 menu workload 设为 1、qualityLines 设为 [99,99,100]，保证返工 UI 可达；不是自然经营或平衡性证据。`fixture-proof.json` 保留状态/重放结果。

## 启动性能

3 版本（040031e、c68541d、current）× dev/preview × standard/twelve × 6 轮；奇数正序、偶数版本与场景逆序。每模式每版本/场景预热一次且排除，合计 12 预热、72 正式、每格 n=6。1280×720、DPR 约 1、前台可见，180 帧 rAF p50<=25ms。沿用 A3 的基线 worktree/现有诊断，不改 main.tsx 或 vf-metrics.ts。各版本独立 cacheDir，Vite API 启动器见 server.mjs/serve-final.mjs，未使用不存在的 CLI cacheDir 参数。

指标是 `observedControlsAndCanvasMs`，不是完整 assetsReady；decodedBody 是网络解码后的传输内容，不是 GPU 纹理或常驻内存。中位数为六条排序后第 3/4 条平均。相对 c68541d 任一格 >10% 才可运行一次等结构确认，最多一次，不筛掉离群值。

**执行偏离与保留数据**：首个冻结版曾完成 72 正式+12预热（相对 c685 为 +1.40%/-1.27%/-7.84%/+4.60%）；随后补验 Studio→Office 保存焦点，修改 alpha-app.tsx，因此该批不再代表最终源码。整批原始样本、预热、汇总及冻结文件原字节复制至 `pre-final-focus/`。再次完整 pnpm check、重新冻结后采集最终 72+12，不合并、不选择较优批，也不是阈值触发的确认批。实际总采样 144 正式+24预热，应由独立复审明确评估这项重新冻结后的额外批次，不能写成整个会话只采了72。最终数据采集函数使用独立数组；一次持久运行时旧闭包暂将新前两轮附在旧数组后，按已归档的72条边界拆开，所有样本均保留，没有重采这两轮。

最终四格相对 c68541d +2.82%/+0.56%/+4.89%/-0.40%，没有确认批。完整数据 `startup-balanced.json`，汇总 `startup-summary.json`；复算 `node harness/vf4a4/summarize-startup.mjs`。冻结后到采样结束没有继续修改应用或测试源码。

## 清理与保护范围

恢复正常 `pnpm --filter oot-web build`，生产 assets 不含 vf-metrics/vf-startup/A4 fixture。停止本轮服务器，5181–5186 无监听，移除本轮专用 `.vite-cache`，重置浏览器 viewport、关闭测试页并隐藏测试浏览器。日志无 EPERM。

packages/lock/public 对 d3e0c87 与 2bd6d40 零 diff；共享 dialog/studio-ui/main/vf-metrics/scenes 及 renderer 对 d3e0c87 零 diff。S3 使用已经封板的 bb2fa10 起点验证零 diff，因为 d3e0c87 在 A3 实现之前；真实文件名为 character-profiles.ts，而非附件的 .tsx。原 A3 harness 与旧失败记录不修改。根 AGENTS 的 build-log 要求在本轮白名单内以本目录 build-log.md 记录，不修改白名单外 harness/build-log.md。
