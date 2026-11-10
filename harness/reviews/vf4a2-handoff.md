# VF4-A.1 + VF4-A2 固定实现交接

仓库 `D:\Documents\FeiyangChen\devApps\ai-game\out-of-tokens`，分支 `codex/m1-foundation`。

固定实现 `__VF4A2_IMPLEMENTATION_SHA__`。起点记录 `f0edf5529ba1c259947f589fe2f6d40d419646b1`，上一固定实现 `d3e0c87d96bf4fe3baa77ab745163d8baa9ca052`，VF3.1 `c68541da920b346b02c11b8e27540024c8ea30a5`，VF3 `6f3a19122f4508004aeb1ae3bfe0c1387047e9dc`，保护基线 `2bd6d40733d6ffcd575a3bbcef59d89f5887cf9f`，长期040031e。

A.1修复验证通过，A2实现与四视口功能验证完成；304测试，58交互记录，151源码冻结，24归因、72正式+72唯一确认。preview twelve增量首批+19.91%、确认+14.97%：VF4A2-PERF-01 HOLD。16px字级严格规范差异TYPE-01 OPEN。当前实现不是整体视觉冻结，也不是性能预算PASS。

用户授权修订：保留文件导入内存契约，手动保存更新槽位；明确允许Saves onChange先focus dialog的最小白名单扩展。采样72与16组×6冲突按预先登记4/5组平衡解决，未将无回复视为新授权或超过72。详细原始材料在harness/vf4a2，审查清单见vf4a2-gemini-review-prompt.md。

生产无诊断，端口/cache/浏览器清理完成，保护路径0diff。第二提交仅回填此固定SHA；立即暂停，不push、不部署、不进入VF4-B/C。下一步由Gemini给明确逐项裁决及完整Codex返修Prompt。
