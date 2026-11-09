# VF3 固定检查点交接

实现 SHA：`6f3a19122f4508004aeb1ae3bfe0c1387047e9dc`。父 `e693642215f6406fa6e945144591ef0a8c736720`；上一固定VF2 `61b9c7594dcf288e7cb0f136aec11911cdc7cbb6`。

完整可复制审查Prompt：[vf3-6f3a191-gemini-prompt.md](vf3-6f3a191-gemini-prompt.md)。它明确审查范围、实机/性能证据和末尾完整回交Codex Prompt要求。

291测试通过；VF2四项返修、VF3定位/位置列表/名牌与命中见 [VF3_CHECKPOINT](../../docs/VF3_CHECKPOINT.md)。dev standard不利批次对长期基线+14.82%、复核对VF2+20.20%保留，待独立裁决。原始证据harness/vf3，源码冻结后未改代码/CSS，默认生产已恢复，无诊断指标，端口5181–5186关闭、浏览器视口已reset。

本记录提交不改实现；仅本地，未push/部署。当前暂停，未进入VF4/O4-B/O4-C，未宣称整体Visual Freeze 1冻结。
