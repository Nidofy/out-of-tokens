# Sonnet 5.5：UI、内容与试玩交付独立审查

你是独立审查者，只读审查。项目D:\Documents\FeiyangChen\devApps\ai-game\out-of-tokens。固定目标 **b5d1365355cba2d09ae50ecde9ff382bebe1af12**；游戏工程afe8734，后一提交为打包父目录修复/记录。先核对完整HEAD、status/log/diff，使用独立review worktree，保护主目录和旧worktree，不push/部署/付费API或安装到真实DSH Profile。

读AGENTS.md、GDD-v0.1.md、STATUS、REVIEW_M06_INTEGRATION、M1/M2/M3_ACCEPTANCE、M3_INSTALL、PLAYTEST_M1。旧复审目标41dd3c4c2398e9cd5e706298adc8e935bb509df4，与当前有完整M0.7及M1–M3工程差异；a8fb63c不是这轮复审。三旧报告原文在harness/reviews，按源码核对，不照抄不符的旧文件/API描述。

重点：实际从新档读委托→澄清→组队→资源耗尽/停工→事件→交付→章节反馈；三场景、找人、角色两轴成长、12人20版本、100委托/60事件/60剧情的内容品质与数量真实性；中文/英文完整性、交互可发现性、移动布局、键盘/焦点/屏幕阅读、Pixi失败时可操作降级。检查概率/隐藏标签/工作量估算是否诚实，净偿付/订阅/临购/本地成本和停工名单是否能支持玩家决策。剧情内容锁定、重复奖励、角色位置与时间边界也请检查。

宿主专项：IndexedDB三手动/一自动/五备份，跨标签冲突和显式载入；导入/导出及坏档/旧版本拒绝时现有状态不变；存储禁用/渲染故障；Host iframe打开/保存/关闭/卸载、地图DOM适配兼容边界；PWA首次缓存/离线/更新。真实DSH没有安装，不要把契约页当实际小院验收。只用可丢弃Profile与测试存档。

运行pnpm install --frozen-lockfile、pnpm check（15文件114测试）；pnpm dev:web或node scripts/dsh-contract-harness.mjs。试玩包生成：干净worktree运行node scripts/package-playtest.mjs，再node scripts/verify-playtest.mjs artifacts/out-of-tokens-b5d1365。包内node start.mjs→localhost:4173，保持来源一致。已有包不覆盖。主目录后续文档harness/m3/package-results.md记录211文件哈希、独立启动和服务器停止后的离线刷新/推进；审查时自行验证。

已知复核项：PWA-01(P2)点击更新后有时需手动刷新才消失，勿仅看SW静态文件断言更新可用；WEB-03(P2)BrowserSaves构造拒绝可能在effect接管前留下未处理Promise日志，界面降级仍可用。已有修复HOST-01 fetch绑定有红灯回归、HOST-02 CSP通过静态Pixi兼容模块与自动uniform测试，未放宽unsafe-eval。M05-03 P1依旧开放；真人0/10、M2公测/乐趣、真实DSH共存均未验收。用户明确先工程与试玩包。

如需种子，仅9401–9420。勿占主线程7001–8000、其他审查9001–9020/9101–9300及旧8101–8520。训练1–100已见，重跑记为复现。记录实际所用内容版本，不能把m2-1当历史M0平衡版本。

报告harness/reviews/m3-b5d1365-sonnet-report.md；写完整目标SHA/实际HEAD、平台/浏览器、步骤、命令退出码。每条ID+P0/P1/P2/P3+文件行号+复现步骤+预期/实际+截图/存档证据+影响/建议。无法复现记录原因，不盲改。报告单独本地commit，回交路径+报告commit SHA+目标SHA；只读审查，不改实现，不宣布外部批准。
