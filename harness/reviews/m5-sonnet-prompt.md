# M4/M5 sonnet 独立审查 Prompt

固定审查目标 **9e485100dfe22e31a6894022f3664e971c4818b7**，分支codex/m1-foundation，主工程D:\Documents\FeiyangChen\devApps\ai-game\out-of-tokens。游戏引擎0.10.0、内容m5-1。先git status/log/diff、AGENTS.md、docs/STATUS.md、REVIEW_M3_INTEGRATION、M4_SCOPE、M5_RULES、M5_ACCEPTANCE。后续HEAD若只增加Prompt/交接记录，先核对diff，禁止reset主工作区。

你是独立只读审查者，不是主实施者。只在新建独立worktree中审查，存在同名目录则选新名，保护所有旧worktree；不要修改主线程实现。只可本地提交自己的harness证据和报告，不push/部署/付费API/下载模型/真实DSH Profile/外发消息。报告固定目标完整SHA、实际HEAD、环境、实际命令/退出码；按P0/P1/P2/P3逐项列文件行、最小复现、预期/实际、影响、证据、建议、置信度。主线程修复不是审查批准；工程通过不是经营/真人/真实宿主通过。

先pnpm install --frozen-lockfile与pnpm check（主线程22文件132测试），全新日志路径，不覆盖harness/m3/check-final-v3.log、历史manifest绑定日志或validation-v3/v4。旧verify-m06只在41dd3c4检出，verify-m05只在a8fb63c检出，不在本版本运行。

固定包artifacts/out-of-tokens-9e48510.zip，6203568字节，SHA256 88bfcf5d3259c1dd8d91ab5504a8a013ab96068257ad462c8e860759c1611259，901文件；主线程独立解压/manifest/本地启动通过。Windows exe为Tauri开发构建，需要WebView2；Web包node start.mjs，需要Node24、不需pnpm。旧b5d1365包原样保留，不代表新修复版。

保留边界：M05-03 P1开放，全分母34/152=22.37%<25%，不能删平局/放宽阈值/用旧四门禁关闭。1–100与3001–4000已见；7001–8000主线程未见正式队列禁止使用。8101–8520以及9001–9020/9101–9300/9401–9420旧审查队列不复用。M2/M5不能借用历史M0平衡结果。真人0/10、公测、真实DSH共存均未验收。M4是KB字符模型、对话包及Windows桌面；MB模型/完整访客包/透明挂机/Steam/微信未做。M5对手为明示规则的合同竞标，不是完整自主经营/挖角；剧情是AI草稿非人工创作验收。请审核这些取舍而非默认批准。

你的重点：浏览器、桌面试玩与内容体验。独占新种子队列：9901–9920（可不用）；主线程未消费。

真实UI走读：读取委托→澄清→接单→派遣→交付→食堂/图书馆外卖→存档/刷新/恢复；M5章节/竞标/远征/结局/无尽入口和错误提示是否诚实。分别核验Host与桌面，不把临时契约等同真实DSH。测试英文60剧情首句、移动390px、键盘/读屏、Worker开关/超时回退、对话包合法/坏JSON/超大/HTML/重复ID/旧版本、卸载包不影响经营存档。确认新包901文件、启动、PWA服务停止后离线；主线程本轮未完成新包离线实测，请不要引用旧包证据冒充本轮。真实人类仍0/10。

报告写harness/reviews/m5-9e48510-sonnet-report.md；证据harness/review-m5-sonnet/。无法复现保留命令和观察，明确证据不足，不猜测改实现。完成后向用户提供本地完整报告路径和提交SHA，不主动向其他线程或外部服务发消息。
