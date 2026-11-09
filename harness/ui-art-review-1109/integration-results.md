# 1109 工作树集成复审证据

基线0c41339，2026-11-09。原目录jpg均为旧基线，不能冒充本轮验收截图。

- 修复前完整 pnpm check：34文件233测试通过，工具输出已观察。
- 修复后 pnpm check：35文件234测试通过，typecheck/lint/Web与DSH构建退出0；日志 check-integration.log。
- 最后新增679px以下收起资源HUD规则后再运行 pnpm check：35文件234测试通过、退出0，结果见 check-final.log；git diff --check通过。
- 实浏览器隔离DEV场景：127.0.0.1:5181，office-lab=standard&animation-time=1。1280×720修复前Qwen脸被屏幕遮挡，修复后完整露出。标准桌恢复单屏。
- 390×844中文：检查首屏、经营抽屉、进入布置与库存/槽选择器。全景裁掉部分角色，列为C阶段构图任务；不能宣称手机全员可见。
- 560×800英文深色减动：检查首屏、委托抽屉、Tea shop menu派遣弹窗、关闭焦点回到原委托按钮；弹窗x=17..543，宽526、高640，页面scrollWidth=560。
- 560原HUD最后按钮right=559.47，虽未横溢但失去12px安全边，现金增长后可能越界；679以下收起资源按钮，资源仍经经营/更多访问。
- 最终560复验：所有可见HUD按钮高44px，最后按钮right=548，页面scrollWidth=560；恢复12px安全边。integration-560-en-dark.png为最终截图，integration-standard-1280.png为最终中文标准单屏工位截图。
- 本轮所查页面console error/warn为空；未验证全部场景无警告。
- 默认环境写审查日志、修改文件及Vite缓存报EPERM；文件修复/生成/日志使用授权提升执行，服务以 --configLoader runner 启动成功。不是应用崩溃。

没有运行真实手机、全章满配置、全角色坐姿、200%字体、屏幕阅读器或GPU性能验收；仍按UI_ART_DIRECTION_1109计划开放。
