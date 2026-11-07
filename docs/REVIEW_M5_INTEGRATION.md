# M5 9e48510 审查集成

2026-11-07。目标 9e485100dfe22e31a6894022f3664e971c4818b7；主工程起点 68d59963f1f5a9e3ab2b27599b44365a4fe7bfd0，工作区干净。只读核对 Gemini worktree HEAD 19e852e5d2f27a02c689f84ce91e23896163ca89、Opus HEAD cb7c78068648817dbf24bf0c19f87550966e2cf0；相对目标仅新增 harness 审查证据。报告原字节归档至 harness/reviews。提交前补查发现 Sonnet 新worktree，HEAD 58eba0c1f20fcbe33908c8dac47239b0679db8c5；相对9e48510仅77个harness报告/证据文件，工作区干净。报告目标完整SHA吻合，原字节归档并SHA256对比一致。早先未到状态由本记录更新。

三份报告无新增 P0/P1。M05-03 原 P1 保持开放；34/152、25%门槛不变，7001–8000未使用。主线程修复不代表审查者批准。

| ID | 级别 | 集成处理 |
|---|---|---|
| GEM-01 | P2 | 打包入口强制先从干净 HEAD 构建 Web/DSH，再离线 locked 构建桌面；随后动态导入版本。源变化拒绝。验证器要求各 build-meta 与 sourceCommit 一致，桌面声明必须包含 exe/lock/notices/构建凭据。新包5b7e5ef已从干净SHA强制重建并解压校验972文件，通过。历史包使用历史验证器。 |
| GEM-02 | P2 | 统一辅助岗位有效版本、Tool 不冒用 Planner 加成、过载严格超过有效 context、预览过滤无尽禁用支持角色并传 local mode。补回归；旧过载测试按严格边界更新，首次失败日志保留。 |
| GEM-03 | P2 | 远征位置显式为 expedition；远征费用包含在途补给，不叠加本地饥饿/深夜压力惩罚，不在本地显示。出发20精力及费用不变。首次失败与回归已保留。 |
| GEM-04 PWA | P2 | 初始 waiting 状态监听和被动 controllerchange 提示已补；不自动刷新丢弃进度。两构建/两标签IAB验收已执行：waiting提示、显式刷新、旧标签被动接管提示保留。首次安装不误报更新有自动回归。 |
| GEM-04 Host | P2 | 新只读 auto 对账保留内存，仅服务端 revision 未变或 revision+1且字节匹配才解除 uncertain。其他修改仍拒绝；不盲刷手动槽。已保存 auto 字节去重，关闭等待在途任务。自动回归覆盖非空档、丢响应和外部冲突；原生并发关闭仍待独立验收。 |
| GEM-05 | P3 | GUI 子系统无条件启用；desktop 每个成功命令自动保存。桌面0.11.0已offline/locked重建并绑定exe hash，原生保存UI仍待验。 |
| GEM-06 | P3 | Rust 无独立许可证文件的18包正文补齐待处理，不能将 SPDX 名称视为完整许可证文本。 |
| GEM-07 | P3 | Origin null明确403；iframe ready握手前关闭不等待11秒；ready后仍等待checkpoint。 |
| OP-01 | P2 | 决策采用迟到补救：保留56槽门槛与原条件，此后每槽补判直到passed，不永久失去战役。无奖励补发。红测→回归。 |
| OP-02 | P3 | 保留现有违约公式（追回全部预付款+基础报酬30%），不因UI轮修改经济规则；新版UI已展示倍率与违约基础口径。 |
| OP-03 | P3 | 四个其他结局正常数值可达性仍未量化，计划专项长局策略验证。 |

规则更新 engine 0.11.0；内容仍 m5-1；旧引擎档明确拒绝。示例对话包随引擎更新。所有验证使用已见训练种子1，不消费审查或正式队列。

恢复检查发现 Vitest 默认发现历史 artifacts 中的复制测试，新增显式 apps/packages 测试范围，历史包不改。基线日志与所有失败日志在 harness/ui-art，不覆盖旧日志。UI后续依照用户确认的 AI Village 形式和现代场景规划推进。

Sonnet补集成（目标仍为旧9e48510，不能当新UI批准）：
- SON-M5-01 / P3：文件数量口径采纳。旧包901个manifest受校验文件，另含manifest自身共902；旧绑定记录/包不改，新包统一分别列出两种数量。
- SON-M5-02 / P3：测试装置经验采纳。自定义Windows Chrome profile使用短路径；Sonnet深路径CacheStorage A/B观察作为环境注意，不冒充游戏缺陷或通用125字符硬阈值。新试玩README补说明。
- Sonnet证据位于保留的 .agents/worktrees/out-of-tokens-review-sonnet-9e48510/harness/review-m5-sonnet，未运行其外部浏览器脚本或修改其文件。其旧包离线/桌面冒烟与新UI验证分开。
