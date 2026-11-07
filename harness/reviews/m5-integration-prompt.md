# M4/M5 主集成 Prompt

你是唯一主实施/集成线程。固定审查目标 **9e485100dfe22e31a6894022f3664e971c4818b7**，分支codex/m1-foundation，主工程D:\Documents\FeiyangChen\devApps\ai-game\out-of-tokens。游戏引擎0.10.0、内容m5-1。先git status/log/diff、AGENTS.md、docs/STATUS.md、REVIEW_M3_INTEGRATION、M4_SCOPE、M5_RULES、M5_ACCEPTANCE。后续HEAD若只增加Prompt/交接记录，先核对diff，禁止reset主工作区。

你是唯一主实施/集成者，在主分支继续工作，保护用户修改和所有旧worktree。审查者默认只读。只本地提交，不push/部署/付费API/下载模型/修改真实DSH Profile/外发消息。报告固定目标完整SHA、实际HEAD、环境、实际命令/退出码；按P0/P1/P2/P3逐项列文件行、最小复现、预期/实际、影响、证据、建议、置信度。主线程修复不是审查批准；工程通过不是经营/真人/真实宿主通过。

先pnpm install --frozen-lockfile与pnpm check（主线程22文件132测试），全新日志路径，不覆盖harness/m3/check-final-v3.log、历史manifest绑定日志或validation-v3/v4。旧verify-m06只在41dd3c4检出，verify-m05只在a8fb63c检出，不在本版本运行。

固定包artifacts/out-of-tokens-9e48510.zip，6203568字节，SHA256 88bfcf5d3259c1dd8d91ab5504a8a013ab96068257ad462c8e860759c1611259，901文件；主线程独立解压/manifest/本地启动通过。Windows exe为Tauri开发构建，需要WebView2；Web包node start.mjs，需要Node24、不需pnpm。旧b5d1365包原样保留，不代表新修复版。

保留边界：M05-03 P1开放，全分母34/152=22.37%<25%，不能删平局/放宽阈值/用旧四门禁关闭。1–100与3001–4000已见；7001–8000主线程未见正式队列禁止使用。8101–8520以及9001–9020/9101–9300/9401–9420旧审查队列不复用。M2/M5不能借用历史M0平衡结果。真人0/10、公测、真实DSH共存均未验收。M4是KB字符模型、对话包及Windows桌面；MB模型/完整访客包/透明挂机/Steam/微信未做。M5对手为明示规则的合同竞标，不是完整自主经营/挖角；剧情是AI草稿非人工创作验收。请审核这些取舍而非默认批准。

本轮三份报告入口harness/reviews/m5-9e48510-{gemini,opus,sonnet}-report.md。主目录不存在时只读核验相邻review worktree完整HEAD与报告目标、diff，再原字节归档及hash。不把b5d1365旧报告当本轮复审。不等报告齐全才继续独立任务；不新增并行写入集成者。

建立REVIEW_M5_INTEGRATION逐项台账：P0立即红测、最小修复并阻塞依赖；P1相关模块下次集成前修，先失败复现再自动回归；P2明确排期；P3建议。不能复现记录证据，不盲改，也不主动用工具外发消息。保护用户改动/旧档/旧包/旧worktree。规则/内容改变递增版本，旧档明确拒绝。

每个运行检查点：受影响测试、必要全量pnpm check、STATUS/ROADMAP/build-log/逐问题状态；git diff --check显式退出0后本地commit，另记录提交写完整SHA和下一任务。生成新SHA新目录包，核验dist和desktop与source一致；不要覆盖9e48510或b5d1365包。先完成所有授权修复再统一交付Prompt，不以工程完成冒领产品验收。持续开发范围见m5-continuation-prompt.md。
