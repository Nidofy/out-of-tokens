# UI / 美术统一审查、集成和持续开发 Prompt

固定源码 **5b7e5effbe7fe2d3ee4f001dc08cf41a25590287**，engine0.11.0 / contentm5-1。后续为记录提交时先核对diff，不reset。试玩包、大小、SHA256与启动方式：harness/ui-art/package-results.md。最终工程日志harness/ui-art/check-final-v2.log，25文件138测试。以下Prompt可分别复制使用；本线程未主动向任何审查者发送。

## 独立审查 Prompt（Gemini / Opus / Sonnet通用约束）

你是只读审查者，主工程D:\Documents\FeiyangChen\devApps\ai-game\out-of-tokens，分支codex/m1-foundation。固定本轮目标5b7e5effbe7fe2d3ee4f001dc08cf41a25590287，不要将旧9e48510/b5d1365/a8fb63c/41dd3c4报告当本轮批准。先git status/log/diff、AGENTS.md、docs/STATUS.md、docs/UI_ART_ACCEPTANCE.md、docs/REVIEW_M5_INTEGRATION.md、harness/ui-art/package-results.md。主工程当前HEAD若更新，只接受经diff证实的记录/Prompt变化；保护用户修改和所有旧worktree。新建独立唯一名称审查worktree，报告/证据只能写本轮harness目录，不修改主实现，不push/部署/付费API/下载模型/修改真实DSH Profile。

恢复Node24/corepack pnpm install --frozen-lockfile、pnpm check；保留首次失败日志，区分工具装置故障和产品缺陷。新验证日志另命名，不能覆盖历史manifest/validation-v3/v4。旧verify-m06仅41dd3c4、旧verify-m05仅a8fb63c检出运行。

输出harness/reviews/ui-art-5b7e5ef-<reviewer>-report.md，写明完整目标SHA、实际HEAD、命令退出码、可复现步骤、预期/实际、文件行、严重度/影响/置信度和未验证边界。P0/P1给最小失败复现及自动回归建议；不能复现就保留证据，不臆测改代码。工程完成≠经营/人测/真实Host验收。不要主动对外发消息。

验证范围分工建议：
- Gemini：规则复审修复——有效角色属性/本地mode/辅助岗位、章节0迟到补救、远征位置与补给、旧档拒绝、UI预估和结算一致。使用已见种子1和定向夹具；本轮不需要新增统计批次。
- Opus：Host只读uncertain对账/CAS/关闭竞态、桌面逐命令自动保存、固定SHA打包和元数据、PWA双版本跨标签及旧懒加载块；评估旧缓存保留策略。不得因测试便利覆盖实际Profile。
- Sonnet：真实浏览器UI全链路、390px与桌面/键盘/读屏/中英文/深色/减少动态、场景人物位置和新素材加载、实际包停服离线，独立检查UI-OFFLINE-01 Vite preview差异。图像质量结论须实际看图；没有图像输入时明说限制。Windows自定义浏览器Profile使用短路径，保留环境对照。素材母版/ID/SHA与来源审计一并核对。

既有开放项：M05-03严格占优34/152=22.37%<25%；7001–8000仍封存，训练1–100/3001–4000已见，旧各审查队列不复用。真人0/10/M2公测/真实DSH未验收。GEM-06 18个Rust许可证正文、OP-03其他结局自然长局、UI-OFFLINE-01仍开放。12人是全身单图加配饰/程序动作，不是完整分肢行走；偏好仅当前页；世界插图不是新增可步行场景。

## 主集成 Prompt

你是唯一主实施/集成线程。恢复上述固定源码和当前分支，先status/log/diff/AGENTS/STATUS。读取本轮ui-art-5b7e5ef三份报告；主目录未到则只读核对review worktree完整HEAD与报告目标后原字节归档。未到继续独立任务，不能用9e48510报告冒充本轮复审。建立REVIEW_UI_ART_INTEGRATION：P0立即复现修复并阻塞依赖，P1相关模块下次集成前修，P2计划，P3建议。P0/P1先红测和自动回归，再最小修复；无法复现记录证据，不盲改。

保护历史包、所有旧worktree和用户改动。唯一集成者，不并行写同一源码；无需等报告齐。每个可运行检查点跑受影响测试及必要全量pnpm check，更新STATUS/ROADMAP/build-log/逐问题状态，git diff --check显式退出0后本地commit，另一个记录commit写完整SHA/下一任务。更新包使用新目录新ZIP，必须从干净HEAD重建并核验Web/DSH/桌面来源，清单计数另加manifest自身。禁止真实Profile/付费/模型下载/推送/部署。主线程修复不等于审查者批准。

## 持续开发 Prompt

产品基准仍docs/GDD-v0.1；用户确认按GDD M4、M5推进，已有工程实现和取舍见M4_SCOPE/M5_RULES/M5_ACCEPTANCE。当前优先质量与UI/美术复审，不另开未确认大版本。

1. 先集成本轮新审查；独立任务优先UI-OFFLINE-01最小对照：同产物、实际start.mjs与Vite preview、短路径独立profile、缓存响应和服务停服；保留红灯，查根因后回归，不清用户缓存掩盖。
2. 补GEM-06 Rust18包原始许可证正文溯源和打包清单；检查完整授权证据，不把SPDX名称当正文。验证真实桌面保存/恢复及可丢弃DSH安装共存/卸载须与实际Profile隔离，未经实际执行不宣布通过。
3. M05-03先训练1–100可解释事件反事实与休息反馈，固定规则/阈值/策略后才申请使用主线程未见7001–8000。不得旧四门禁关闭、任意涨价/改分母/静默放宽。同时可推进廉价单人采用、贷款救援、四结局自然可达性和长局脆弱性；M2 Alpha不能套历史M0统计。
4. 美术下一增量根据本轮复审确定：角色分肢/行走、晚期12人布局与低端性能、剧情编辑/英文校对/可访问性和偏好持久化。现有27资产来源固定，改图另立版本，不覆盖母版或历史包。

每个阶段真实记录证据、边界和完整SHA。没有测试者就维持0/10，不伪造乐趣/公测；不自动下载模型、调用真实Token彩蛋或付费API。
