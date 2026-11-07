# Gemini 统一复审 Prompt：审阅集成 + 现代UI美术 + AI Village原版Q角色

你是本轮唯一独立审查者Gemini。请统一完成技术、UI、美术接入和试玩包审核，不再拆分给Opus/Sonnet，不新增并行写入集成者。你的职责是复现、审查和报告；主线程仍是唯一实施/集成者。不要因主线程标注“已完成”而默认批准。

## 1. 固定目标与安全边界

项目：D:\Documents\FeiyangChen\devApps\ai-game\out-of-tokens
分支：codex/m1-foundation
**本轮固定源码：2b47242f236683b540faa6b1885d6267cf98c9f7**
引擎0.11.0，内容m5-1，视觉资源ai-village-chibi-v1。

先git status/log/diff、AGENTS.md、docs/STATUS.md，确认主工程后续若有提交，仅为Prompt/日志/交接记录；逐项核对diff，不能reset已有工作。用全新唯一名称独立review worktree审查固定SHA；保护用户修改和全部旧worktree，不在主工作区安装/写报告/改实现。报告与新证据只写本轮harness目录，日志另命名，保留首次失败。

只本地提交；不push、部署、付费API、模型下载、真实Token彩蛋、修改实际DSH Profile或主动向外发消息。真实Host测试只用可丢弃独立Profile；没有条件就记录未验证。旧verify-m06仅在41dd3c4历史检出运行，旧verify-m05仅a8fb63c；不能覆盖旧manifest绑定日志和validation-v3/v4。

本轮审查的是累计成果，不只最后角色diff：
- 历史审查基线：9e485100dfe22e31a6894022f3664e971c4818b7；对应Gemini/Opus/Sonnet报告已归档。
- 有效审查修复检查点：d5f21bb7bb378aa71bdb76c03f312a9099406171。
- 现代UI/场景检查点：5b7e5effbe7fe2d3ee4f001dc08cf41a25590287。
- 当前：2b47242f236683b540faa6b1885d6267cf98c9f7，直接改用AI Village原版Q角色。
- 1bbebab曾误在新增测试导入失败时提交，已留历史并随后修复；不要把它当通过检查点，也不要忽略失败记录。

## 2. 必读资料和可重复基线

读取：docs/REVIEW_M5_INTEGRATION.md、UI_ART_ACCEPTANCE.md、VILLAGE_CHIBI_ACCEPTANCE.md、ASSET_AUDIT.md、M4_SCOPE.md、M5_RULES.md、M5_ACCEPTANCE.md、M3_INSTALL.md；harness/reviews/m5-9e48510-{gemini,opus,sonnet}-report.md；harness/ui-art/browser-results.md；harness/village-chibi/package-results.md。

Node24；恢复`corepack pnpm install --frozen-lockfile`与`corepack pnpm check`。主线程最终harness/village-chibi/check-final-v1.log为25文件138测试及构建通过。区分工具装置失败与产品缺陷，首次失败照实保留。若嵌套pnpm不在PATH，使用隔离临时shim，不为审查改全局配置。

固定ZIP：主工程artifacts/out-of-tokens-2b47242.zip，88904715字节，SHA256 **a4319d41c30b7d78653f47c56bcb1134e9bf3dcd0208af2abb0f8260e1ca90a6**。
manifest受校验1296文件，另含自身共1297。独立解压到新目录并运行本轮scripts/verify-playtest.mjs；不要对历史包套新验证器。包内Node24运行node start.mjs，不需要pnpm。桌面exe需已有WebView2；本轮主线程只重建，未做原生UI重验。

## 3. 统一审核范围

### A. 上轮发现是否真正修复

逐项复核REVIEW_M5_INTEGRATION，给出“复现仍存在 / 主线程修复独立验证通过 / 无法验证 / 设计决策待评估”。重点：
- 辅助岗位有效属性、本地mode预估、Tool与Planner差异、过载严格边界、无尽禁用角色过滤；界面预估与实际结算一致。
- 第0章56槽后迟到补救保留原条件；远征中位置为expedition、费用包含补给、本地饥饿/压力不重复处罚、返程不重结。
- Host uncertain只读对账：空档/非空档、revision不变、revision+1字节匹配、外部修改拒绝；不能覆盖内存/盲刷手动槽。关闭/断连/重复checkpoint与auto去重竞态。
- desktop逐成功命令保存与GUI子系统；ready前关闭无需等待11秒；Origin null拒绝。
- 打包强制干净SHA重建、动态版本来源、Web/DSH build-meta一致、desktopIncluded必须有exe/lock/notices/hash。回归包含缺exe与伪造build来源。

### B. AI Village原版Q角色（用户本轮明确要求）

用户要求直接采用AI Village角色，初期Q版，不重新设计角色。本轮12人ID与源roster一致；源仓库D:\Documents\FeiyangChen\devApps\dsh_plugin，完整HEAD **f4c2ac633d5ad5e9ee0f7c2cd66bd1af9fc90352**。只读核对，不修改该仓库。

读取art/ai-village-chibi-v1/README.md、manifest.json、source-manifests、source-portraits-manifest.json以及scripts/import-village-chibi.mjs。核对12个production manifest、141张实际引用PNG部件、12张头像、原character.json层级/pivot/尺寸/表情，以及MIT原文保留。179条复制记录原字节hash（含审计文件）和166个运行时资源离线覆盖；可运行harness/village-chibi/verify-assets.mjs。检查.git属性保证重新检出后字节不变。

实际看图验证人物身份：DeepSeek蓝鲸/女仆、Qwen蓝紫发原服饰、Llama奶白卷发羊驼特征、Mistral红金羽帽，以及其余8人的原设计；不得只靠文件名宣称视觉一致。检查部件穿帮、头身比例、透明边、桌面遮挡、四表情切换、销毁和重复载入、懒加载失败降级。

当前是原始部件+基础身体动作，未宣称完整移植AI Village行走/工作用餐替换手臂/寻路系统。版本成长使用文字标签，不新加改变造型的配饰。之前重设计12人已移至art/studio-v1/retired-actors，确认运行时不再引用。现代背景继续使用原创15张场景/剧情WebP。

主线程自然初始四人已实看；请重点补晚期12人同屏、场景切换、内存/解码/低端表现。25MB原PNG和多宿主重复使完整ZIP约89MB，评估合理性与后续优化建议，不擅自改画或重压缩替换母版。

### C. UI与实际玩法可用性

验证场景优先HUD、伙伴/委托/工作室/手账抽屉、地图/存档/设置；中文/英文、浅深色、减少动态、键盘焦点返回、原生dialog、390px与桌面布局、触控命中及文字对比度。角色Canvas交互与DOM等价入口均检查。

实际接单→澄清→角色岗位/云端本地→预估→推进→事件→交付/返工；吃饭/学习/找人、成长/研发、SLA、竞标、远征、结局和无尽解锁提示。至少区分自然游玩与定向夹具，不能把修改状态构造的第4章截图当自然长局可达性证据。可用纯测试夹具检查12人布局，但必须标明。

美术七场景为五章工作室+食堂/图书馆，八插图为三远征/五结局；插图不是新增可步行场景。角色经营ID/规则没变，0.11.0旧同引擎存档应继续兼容；0.10.0档仍明确拒绝。

### D. PWA、存储、独立包与宿主边界

真实浏览器测试手动/自动/备份、导入导出、跨标签冲突；两构建waiting更新→提示先保存→显式刷新→另一标签被动接管提示，旧标签未刷新时懒加载仍可用。首次安装不能误报升级。

停止实际包服务器后刷新、角色PNG/JSON/背景加载、推进、读档；区分HTTP缓存与SW缓存，记录实际观测和失败。UI-OFFLINE-01：主线程同构建Vite preview4182源停服刷新白屏，实际start.mjs4173源通过；缓存曾显示activated且JS/美术存在，根因未定，不能凭猜测断言gzip。请做同产物、独立短路径Profile、响应与缓存的最小对照，不清用户缓存掩盖。

当前SW保留旧缓存支持旧标签，评估存储增长和回收策略，不宣称已自动回收。Windows自定义浏览器Profile用短路径；Sonnet深路径CacheStorage故障是环境对照经验，不当通用长度硬阈值。桌面和DSH需区分编译/契约测试/真实安装共存；当前实际Profile未改。

## 4. 既有开放项不得偷偷关闭

- M05-03 P1：训练1–100小费拒绝严格占优34/152=22.37%<25%。原门槛、分母、策略和诊断保留；本轮UI不改经营规则，不套历史M0统计批准M2 Alpha。
- 本轮默认只用已见种子1和确定性定向夹具，不跑新统计批次。7001–8000主线程未见队列封存；1–100/3001–4000已见；8101–8520及9001–9020/9101–9300/9401–9420和此前审查队列不复用。需要新统计时先提出冻结协议，不自行占用队列。
- 真人0/10、M2公测、乐趣、真实DSH安装共存/卸载仍待安排；工程通过不等于这些通过。
- GEM-06：18个Rust包许可证正文缺口；OP-03：其他四结局自然长局可达性；剧情人工编辑/英文校对、廉价单人实际采用、贷款救援和长局脆弱性仍待办。

## 5. 报告格式与交付

输出 **harness/reviews/gemini-unified-2b47242-report.md**，证据放新建harness/review-gemini-unified-2b47242/，本地提交。写完整目标SHA、实际worktree HEAD、主目录diff核对、环境、命令及退出码、包hash、截图/日志索引。

报告先列结论，再分：旧问题逐项状态、新P0/P1/P2/P3、实际UI/资产/包覆盖矩阵、未执行项目、后续优先级。每个缺陷给文件行、最小复现、预期/实际、影响、置信度；P0/P1提供可重复失败与自动回归建议，不直接改主实现。P0阻塞依赖；P1相关模块下次集成前修；P2计划；P3建议。不能复现保留证据，不凭主观猜测升降级。图像能力不足时明确无法目视审核，不能伪造视觉结论。

结论必须分别回答：审阅修复是否通过独立复验、原版Q角色是否正确复用、UI主流程是否可用、新包来源和离线是否可信、哪些风险仍阻塞产品放行。不要把“没有新增P0/P1”写成完整产品批准。不要向其他线程/外部服务主动发消息；只交付报告路径与本地完整提交SHA。
