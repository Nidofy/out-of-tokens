# Codex + Astra：M1–M3整合与持续开发

你是唯一主实施/集成线程。项目D:\Documents\FeiyangChen\devApps\ai-game\out-of-tokens，分支codex/m1-foundation。固定本轮审查/试玩包源码 **b5d1365355cba2d09ae50ecde9ff382bebe1af12**；游戏代码afe8734；之后为Prompt/验证/交接文档时先核对diff，不reset已有工作。先git status/log/diff、AGENTS.md、docs/STATUS.md。保护用户修改和所有旧worktree，只本地commit，不push/部署/真实API付费/修改实际DSH Profile。

恢复pnpm install --frozen-lockfile、pnpm check，当前15文件114测试。最终工程日志harness/m3/check-final-v3.log；首次失败日志均保留。旧verify-m06只在41dd3c4历史检出跑，旧verify-m05只在a8fb63c历史检出。新日志另命名，不能覆盖旧manifest绑定日志和validation-v3/v4。

已交付M1/M2/M3工程检查点：三场景、找人、8人两版本/成长，扩展12人20版本、100双语委托、60事件/60剧情、章节0–2、21软件/5级硬件、SLA、需求谜题、订阅、PWA；DSH独立Host存档CAS/五备份、工坊DOM入口、生命周期/取消/断连结果不确定对账、iframe CSP与可卸载入口。实际IAB验证Host临时契约、Web跨标签和离线试玩包；不等于真实DSH安装共存。用户明确目前没有测试者，先工程与试玩包；真人0/10/M2公测/乐趣仍待安排，不能伪造。

试玩包artifacts/out-of-tokens-b5d1365.zip（863819字节，SHA256 10e49a1c35646a3ecfd91e4264be09a802c4d9786551eaca1c96186d86f490aa），manifest211文件。包内node start.mjs→http://localhost:4173，需要Node24、不需要pnpm。包目录固定版本，更新生成新目录，不覆盖历史包。详见harness/m3/package-results.md和docs/M3_INSTALL.md。纸娃娃MIT代码与atomic-write逐件来源/许可已记录，无外部图片和真实模型调用。

读取harness/reviews/m3-b5d1365-{gemini,opus,sonnet}-report.md；主目录没有则只读核对相邻review worktree完整HEAD与报告目标后归档。报告未到则继续独立任务。41dd3c4旧报告已集成；旧a8fb63c更不能当本轮复审。逐项建立REVIEW_M3_INTEGRATION：P0立即复现修复并阻塞依赖；P1相关模块下次集成前修；P2计划；P3建议。P0/P1先保留失败复现+自动回归再最小改代码；不能复现保留证据回审查者，不盲改，不主动用工具向外发送消息。

首个开放经营P1仍M05-03。M0.7已按前轮Opus建议书面调整指标，协议docs/M0.7_PROTOCOL；训练1–100中能量门控加班收入+5.8656%通过，旧现金比+35.9%诊断保留，小费拒绝严格占优34/152=22.37%未达25%。不要用旧四门禁关闭，不任意涨价/改分母/静默放宽。先研究可解释事件反事实和休息反馈；冻结规则/阈值/策略后才使用主线程未见7001–8000。1–100/3001–4000已见。8101–8520旧审查保留，本轮9001–9020 Gemini、9101–9300 Opus、9401–9420 Sonnet，不占用。内容/规则更改递增版本，旧档明确拒绝；M2 Alpha不能套用历史M0统计结论。

并行意义是主线程继续未阻塞任务，不新增并行写入集成者。P2待办：PWA-01更新按钮需手动刷新观察、WEB-03存储拒绝早于effect的未处理Promise；贷款救援、廉价单人实际采用、长局策略与统计脆弱性；剧情编辑/英文校对/移动可访问性；真实DSH可丢弃Profile安装卸载验收。先复现，不因猜测改动。M4小模型/M5渠道化仅在本轮质量与GDD取舍明确后推进；不自动下载模型/使用真实Token彩蛋/付费API。

每个可运行检查点运行受影响测试和必要全量pnpm check，更新STATUS/ROADMAP/build-log/逐问题状态；git diff --check显式确认退出0后本地commit，再以另一记录提交写完整SHA/下一任务。主线程修复不等于审查者批准；工程完成不等于经营、人测或真实宿主验收。无需等待三份报告齐全才推进可独立任务。
