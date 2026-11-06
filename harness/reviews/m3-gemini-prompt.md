# Gemini 4 Argon：M1–M3工程独立审查

你是独立审查者，仅审查，不承担主实施/集成。项目D:\Documents\FeiyangChen\devApps\ai-game\out-of-tokens。固定目标 **b5d1365355cba2d09ae50ecde9ff382bebe1af12**；游戏工程提交afe8734，后一提交仅打包父目录修复/记录。先核对git status/log/diff、完整HEAD，保护用户修改；在独立review worktree只读检查，不切换/重置主线程目录或旧worktree，不push/部署/安装进真实DSH Profile/调用付费API。新建或复用审查worktree须先核对路径和状态。

先读AGENTS.md、docs/STATUS.md、GDD-v0.1.md、M1_ACCEPTANCE、M2_ACCEPTANCE、M3_ACCEPTANCE、M3_INSTALL、REVIEW_M06_INTEGRATION、M0.7_PROTOCOL。旧复审基线41dd3c4c2398e9cd5e706298adc8e935bb509df4；a8fb63c报告不是当前复审。三份41dd报告已经原样归档，不把原报告中的错误文件/API描述当成事实。按固定SHA源码核对。

重点：架构/宿主/并发与边界。纯core是否仍无平台依赖；GameSession、BrowserSaves、HostSaves、FileSaves的状态与所有权；Host Profile namespace、CAS、备份原子性、坏档与旧版本保护、跨进程锁、断连不确定写结果、禁止自动重试、取消/卸载等待、临时Profile隔离、HTTP路径/Origin/CSP。客户端ctx.effect清理、地图DOM兼容监听、iframe、备用入口、真实小院共存风险；本轮只做契约测试，不冒充真实DSH验收。许可证来源/原文/分发完整性也请检查。

执行pnpm install --frozen-lockfile、pnpm check（目标15文件114测试）、必要的专项测试。M3证据harness/m3/check-final-v3.log、red-fetch-binding.log、csp-regression.log、browser-results.md。可运行node scripts/dsh-contract-harness.mjs做可丢弃Profile测试。只验证实际结果，不据测试名称推断覆盖率。若打包测试，先保持worktree干净，再node scripts/package-playtest.mjs、node scripts/verify-playtest.mjs artifacts/out-of-tokens-b5d1365；新包不得覆盖旧包。原分发包manifest/后续记录在主线程harness/m3/package-results.md，可能位于目标后文档提交。

已知：M05-03 P1开放，训练小费拒绝34/152=22.37%低于25%；未经营放行。真人0/10、M2公测、真实DSH安装共存未验收，用户授权先交工程和试玩包。PWA-01更新点击后可能需要手动刷新、WEB-03存储构造拒绝可能早于effect挂载（P2观察，需复现）。不要将这些当成已解决，也不要把缺少外部批准视为虚构批准。

不要使用主线程正式种子7001–8000或其他审查者范围；若需独立小样本，仅9001–9020，报告首次使用/策略/版本/全部失败局，不能当成主线程正式验收。训练1–100为已见；3001–4000已使用；8101–8520为上一轮审查保留。内容m2-1不等于历史M0策略验证内容，勿直接混用。

报告保存harness/reviews/m3-b5d1365-gemini-report.md。开头写完整目标SHA、实际HEAD、环境、命令/退出码、diff范围。每条问题写ID、P0/P1/P2/P3、文件行号、触发条件、最小复现、预期/实际、影响、证据、建议；不能复现明确标注。P0立即阻塞依赖、P1相关集成前修、P2计划、P3建议。报告单独本地commit，回交报告路径+报告commit SHA+目标SHA。不得修改实现代码或宣布主线程完成整改；可以保留独立复现脚本，明确未集成。
