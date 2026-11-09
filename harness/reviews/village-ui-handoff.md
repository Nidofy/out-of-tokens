# AI Village全屏浮窗检查点

目标源码：d285c3b5cd85efc09ef0f0025dd2c14c38a18555
原插件只读参考：f4c2ac633d5ad5e9ee0f7c2cd66bd1af9fc90352（相邻dsh_plugin/packages/ai-village）。

完成范围及逐项台账：docs/VILLAGE_UI_ALIGNMENT.md。原版透明HUD、四入口、浅深玻璃材质及布局；全屏场景与浮层编辑器。核心规则未改，engine0.15.0/content office-1不变。

复现：pnpm check；pnpm dev:web；浏览器打开 /?office-lab=working&animation-time=1。手机用office-lab=initial；英文暗色用locale=en&theme=dark&motion=still。夹具只在DEV启用，使用隔离内存存档。

结果：33文件213测试、类型/lint/构建全部通过。检查日志harness/village-ui-check-final-v3.log；实际截图及冷启动零error/warn证据harness/village-ui/。390、680、1280、1920、2560视口检查已执行，超宽截图只留右侧补片，布局DOM读数另见实施台账。手机补购保存后4820现金/4工位已核验。

边界：未做低端GPU长期帧率测试；未重新进行10局经营或封存种子测试；本轮不推进O4规则。原临时HMR导出切换错误已记录，冷启动验证独立。没有改玩家存档、原插件、推送或部署，临时开发服务已关闭。
