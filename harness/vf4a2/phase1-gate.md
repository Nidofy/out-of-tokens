# VF4-A.1 前置门禁结果

2026-11-10，phase1-gate.json八项全部true，记录于UTC02:53:50，随后才进入Studio/Journal实现。

- F03三个真实键盘focus-visible：Settings、Map、手机work-steps均保留inset选中阴影和外层3px对比环，outline solid；Map另有绿色border。
- F01/F04真实文件：从lab真实export下载JSON再导入，合法LOADED、损坏BAD_JSON、不兼容INCOMPATIBLE_SAVE均顶部唯一notice。用户明确确认维持只载入内存契约，手动档不被覆盖；之后保存manual-2验证槽位更新。Map用harness模拟locked，3实际`.world-map > button` disabled且caption可见。
- 补测发现不兼容导入后busy禁用input导致焦点落body，稳定帧复现。用户明确授权白名单例外：只在Saves现有文件回调先focus当前dialog，再执行原import。复验三类输入全部保留dialog焦点。两个修复前失败记录/截图保留，不掩盖。
- 24条正式归因（4预热另存）：同步head首Canvas与普通vf-metrics首Canvas在每条中完全相等，差0ms；探针加载完成均早于Canvas。040标准/十二人中位236.4/233.0ms，当前244.45/243.8ms。本批未证实异步探针延迟首帧计时，不修改main/vf-metrics，不追加归因批。
- 启动器把显式--cacheDir写入Vite配置，各版本目录不同，日志零EPERM；不宣称一次未复现就关闭历史波动，完整性能/VF4-B/C仍HOLD。
- 数据schema覆盖每条bodyMetrics/bodyRect/focusInDialog，包括两个已知修复前失败；后续交付验证必须逐条核对而非过滤缺字段。

串行裁决：允许本次已授权的零资源Studio/Journal试点；无资产生产、领域/Command/存档协议改动。
