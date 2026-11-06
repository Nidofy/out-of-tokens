# M3（b5d1365）Sonnet 独立复审报告 — UI、内容与试玩交付

- 审查者：Sonnet（独立只读审查；不改实现、不 push/部署、不调用付费 API、不安装真实 DSH Profile）
- 日期：2026-11-07（Asia/Shanghai）
- 固定目标 SHA：`b5d1365355cba2d09ae50ecde9ff382bebe1af12`（完整 SHA 已在打包 manifest 中二次核对）
- 游戏工程 SHA：`afe87343cca5eb3460ad4b23f30b10f1346d99ca`；`afe8734→b5d1365` diff 实测 = 3 文件 +3 行（`docs/STATUS.md`、`harness/build-log.md`、`scripts/package-playtest.mjs` 各 1 行，打包父目录修复/记录），与声明一致
- 复审 worktree：`out-of-tokens-review-sonnet-b5d1365`（detached HEAD = b5d1365，`git status` 除本审查产物外干净；主目录与旧 worktree 未触碰）
- 平台/浏览器：Windows（NIDO/enxi1）、Node v24.16.0、corepack pnpm 11.25.0、Chrome 156.0.8078.81 headless（CDP 9222，可丢弃临时 Profile，已删除）
- 种子：未使用任何随机采样种子（全部为确定性 UI 驱动）；9401–9420 未消费；未占用 7001–8000 / 9001–9020 / 9101–9300 / 8101–8520
- 内容版本实测：engine 0.8.0 / content **m2-1**（`content/campaign/m2.json` + manifest `contentVersion:"m2-1"`）；未把 m2-1 当作历史 M0 平衡版本评价

## 1. 工程门禁（独立复跑）

| 命令 | 退出码 | 结果 |
|---|---|---|
| `pnpm install --frozen-lockfile` | 0 | 168 包复用，pnpm 11.25.0（日志 `harness/review-sonnet/install.log`） |
| `pnpm check`（typecheck+lint+test+build 全 workspace） | 0 | **Test Files 15 passed (15)，Tests 114 passed (114)**，生产构建（web/dsh）通过（`check.log`） |

与 STATUS/M3_ACCEPTANCE 宣称的 15 文件 114 测试一致。未重跑历史 verify-m06（按协议仅在 41dd3c4 历史检出运行；本轮不产生新平衡证据）。

## 2. 玩法闭环（真实浏览器，dev 构建 127.0.0.1:5173）

新档全链实测：**读委托 →（概率化）澄清 → 接单 → 组队（岗位×4/云·本地模式）→ 推进时段/事件选择 → 验收交付 → 第14天结算 → 章节反馈 → 破产 → 继承重开**，另覆盖找人/场景切换/剧情/好感成长。要点：

- 澄清：活动报名年龄分组 22→24 WP（揭示"特定交付格式 +2 WP"），按角色显示成功率（DeepSeek 55% / Qwen 59%…，与知识技能联动），失败风险文案明确（"失败不揭示"）
- 派遣预估：单人 31.68T/槽；4 人团队晚间显示 0T/0（与"未加班的夜间为0"标注一致）
- 事件：服务器繁忙（等待/备用队列）、补齐单位、逐字检查（defects -1）、统一语气（quality 6）、抽样复核（×0.7）等均在待决对话框给出代价×效果
- 交付：质量 56.42>55 通过、48.25<55 亦允许交付（低质交付后果走结算规则）；现金/预付款/净偿付资金三数字并列展示（¥5868 现金 / 周结 ¥2300）
- 章节：第14天结算实测（周结+旧债+贷款本息一次性扣除，现金/净资金双降为负），**第0章快照"未达成"如实显示**；点击"确认章节目标"被拒且映射为中文提示（见 M3-SON-05 关于按钮不禁用）
- 危机→破产：危机横幅 1/3→2/3→破产面板（第21天上午），"继承重开"回到第1天 ¥5000/4角色（继承 founderXP 为代码层，`campaign.ts`/`simulation.ts` restart）
- 找人：晚间食堂/图书馆分布正确（Qwen→图书馆其余→食堂）；不在当前场景显示"去食堂或图书馆找找"；召回按钮+ACTOR_ELSEWHERE/WRONG_SCENE 映射正确
- 剧情锁：好感 5(送礼)→8→11(聊天×2) 后解锁好感10剧情"食堂的最后一份包子"，两个选项的效果标注诚实（好感+5/心情+5/RP+0 vs 好感+2/心情-2/RP+2）；重复触发/好感25前置被 STORY_LOCKED 正确拒绝（重复奖励防护 `campaign.ts:82-84`）
- 两轴成长：角色面板"版本与成长"（V3 当前/R1 研发 ¥600+10RP）+"开源训练（微调8槽/对齐4槽）"六技能+对齐（`campaign.ts:99-106` 上限/前置核实；本轮未执行完整 8 槽训练，见 §7）
- 12人20版本：初始 4 人 + 招募面板 8 人（¥350/声望2 → ¥1300/声望19 全部标价）；数据层 m2 版本 8×2+4×1=20 核实

## 3. 决策信息诚实性

- 概率：澄清成功率按人显示；隐藏标签：委托卡"N 待澄清"计数+揭示后 +N WP 即时入账
- 工作量：澄清后 j.work 即含已揭示要求；**接单时 j.work 重算为 workload+全部要求之和**（`simulation.ts:328`）——未揭示要求的成本在接单瞬间进入总工作量显示，玩家可见总数（但未揭示条目的单价仍未知，属设计而非欺骗）
- 净偿付/订阅/临购/本地成本：仪表盘"现金/净偿付资金"双显；资源面板明示 临购0.5元/T 跨日保留、订阅三档（+120T¥120周 / +300T¥420周）按剩余周预付差价（`campaign.ts:76` 代码核实、不退款）、本地电费0.1/算力
- 停工名单：常显"本槽可能停工（无事件上限估计）"行；21天4人局未自然触发（见 M3-SON-06）

## 4. 本地化 / 布局 / 可访问性 / 降级

- 中英切换：整页即时切换（dashboard/章节/委托标题描述/场景导航/角色面板全英文），`document.documentElement.lang` 正确联动
- 英文完整性缺口：见 **M3-SON-04**（60/60 剧情英文文案以未翻译中文句开头）；另有 §5 的原始码泄露
- 移动 390px：`docScrollWidth=clientWidth=390` 无横向溢出，canvas 356px，无超宽按钮（`w1-390.png`）
- 键盘/焦点/读屏：`:focus-visible` 3px 轮廓规则实测存在；`role=status`、场景容器 aria-label、场景导航 aria-pressed、原生 `<dialog>`（内建焦点圈定）、技能用 `<meter>`；深度 Tab 遍历未逐键执行（见 §7）
- 渲染故障（`?test-fault=renderer`）：显示"场景暂不可用，下方操作仍可使用。"，委托对话框/存档面板照常可用（`w-fault-renderer.png`）
- 存储故障（`?test-fault=storage`）：显示"存储不可用，可继续玩并导出进度。"，可推进时段，存档面板降级为仅导入/导出（`w-fault-storage.png`）；但控制台有未处理 Promise 日志 → **WEB-03 复现**（§6）
- 控制台（正常路径）：dev 与 4173 生产包加载 0 error、0 外部主机请求（favicon 已内联 SVG，**WEB-02 修复经实测确认**）

## 5. 新发现问题

### M3-SON-01 (P3) 澄清后同槽接单展示未翻译错误码
- 文件：`apps/web/src/alpha-app.tsx` 第19行 messages 映射表（缺 `STILL_CLARIFYING`）；触发源 `packages/oot-core/src/simulation.ts:325`
- 复现：新档 → 打开含"待澄清"委托 → 澄清一次 → 同槽点击"接单"
- 预期：中文可读提示；实际：**"操作提示：STILL_CLARIFYING"**（英文界面为 "Action: STILL_CLARIFYING"），接单被正确拒绝（下一槽可接）
- 影响：正常流程必经路径上的原始码泄露，玩家不知"为何不能接/何时能接"
- 建议：补映射（如"刚澄清过，需下一时段才能接单"）；顺带为 `Restarted`、`REPLAY_COMMAND:*`（M3-SON-02/03）补齐或走兜底中文模板

### M3-SON-02 (P3) 破产重开后提示为原始事件码
- 文件：`alpha-app.tsx:19/25`（messages 无 `Restarted`）
- 复现：破产 → 点击"继承重开"；实际顶部/对话框显示 **"操作提示：Restarted"**（英文 "Action: Restarted"），游戏本身正确重置
- 影响：低（一次性），与新档引导文案冲突观感

### M3-SON-03 (P3) 篡改 commands 的存档导入泄露内部回放错误码
- 文件：`apps/web/src/use-game.ts:11`（错误直接取 `e.message`）；回放校验 `packages/oot-persistence`
- 复现：从 IDB 导出 auto 档 JSON → 修改 `commands` 末条 → 文件导入
- 实际：**"操作提示：REPLAY_COMMAND:BANKRUPT"**（状态不变 ✓）。对照：直接改 `stateHash` 正确显示映射文案"存档校验失败，当前进度保持不变。"
- 影响：完整性攻击面/异常路径的用户可见文案不统一；建议 REPLAY_* 系列统一映射为校验失败文案

### M3-SON-04 (P2) 60/60 剧情英文文案以未翻译中文句开头
- 文件：`content/campaign/m2.json` → `stories[].textEn`（60 条全部，如 `"食堂的最后一份包子. bluewhale puts work aside…"`）；UI 渲染位置 `alpha-app.tsx` 角色对话框"伙伴故事"区（英文界面实测可见中文句残留）
- 复现：英文界面 → 角色卡 → 伙伴故事列表（或数据层 `node` 审计：60/60 textEn 含 CJK 连续段，各为首句）
- 预期：英文界面纯英文；实际：每条剧情首句为中文（后续正文为英文）；choices 的 labelEn 完整无此问题
- 影响：M2_ACCEPTANCE 自身声明"双语编辑质量待审"；对英文试玩者是每条剧情的可见瑕疵
- 建议：翻译 60 条首句（或统一去掉双语标题句风格）；不影响中文玩家

### M3-SON-05 (P3) 目标未达成时"确认章节目标/招募"按钮仍可点
- 文件：`alpha-app.tsx:41`（章节按钮 disabled 只看 locked/completed）；招募按钮同理
- 复现：第0章"未达成"后按钮仍启用 → 点击 → "本章经营目标尚未完成。"（映射正确、无副作用）；声望0点招募同理（"招募需要声望，且不能重复招募。"）
- 影响：轻微——错误拒绝是诚实且原子的，但可点按钮+报错不如禁用+原因直观
- 建议：把 chapterZero/章节 ready、招募声望条件纳入 disabled 并加 title 说明

### M3-SON-06 (P3-观察) 停工名单 21 天 4 人局未自然出现
- 文件：`packages/oot-core/src/simulation.ts:424-426`（仅统计本槽在岗成员 vs 配额+临购/本地容量）；`preview.ts`
- 实测：4 人云队连跑 21 天 `possibleStops` 恒为"—"（云额度按日累积未耗尽；本地容量 120 未被本地模式团队压测）
- 结论：算法与 UI 标注（"无事件上限估计"）诚实；未复现"名单非空"的正例，构造性验证（配额耗尽/本地超容）本轮未做——不影响发布判断，记录为复核项

### M3-SON-07 (P3-观察) 违约委托从看板消失且玩家侧无声望下降提示（部分证据）
- 文件：`alpha-app.tsx:45`（看板过滤 delivered/breached）；违约逻辑 `simulation.ts`
- 实测：3 阶段"电表读数核对"超期后从看板消失，声望 1→0（对照交付+1）；违约瞬间的 notice 未被采样捕获，无法断言事件文案缺失，仅确认"卡片消失+数值变化"缺乏就地解释
- 建议：主线程在违约槽位采样 DomainEvent 文案；如确无 Breach 提示再立正式问题

### M3-SON-08 (P3-观察) 打包产物文档哈希受检出端行尾配置影响
- 实测：本 worktree 干净重打包 = 211 文件与主目录包**内容一致**，但 `docs/M1_ACCEPTANCE.md`、`docs/M3_ACCEPTANCE.md` 因 CRLF/LF 归一化差异 SHA 不同（归一化后字节相同）
- 影响：跨机器复现 manifest 哈希时文档条目可能不一致；建议打包前统一 LF 或从 git blob 取内容

## 6. 已知复核项状态

| ID | 级别 | 本轮实测状态 |
|---|---|---|
| PWA-01 | P2 | **未自然复现**（需第二版 SW；本轮单一包无版本差）。代码路径核对：`alpha-app.tsx:37` 更新按钮→`ACTIVATE`→`controllerchange` 重载监听存在。主线程 packaged-offline 证据保留，维持 P2 开放合理 |
| WEB-03 | P2 | **复现**：`?test-fault=storage` 加载产生恰好 2 条未处理 Promise 控制台异常（`Error: STORAGE_UNAVAILABLE at Object.open (use-game.ts:7)`）；界面降级/导入导出正常。维持 P2（仅日志噪音，正式包无 test-fault 入口） |
| HOST-01 | P1(已修) | 红灯证据 `harness/m3/red-fetch-binding.log`（1 failed Illegal invocation）留存；修复后 114 测试全过；契约页实测 HostSaves 经 `/out-of-tokens/api/saves` POST 写入成功 |
| HOST-02 | P1(已修) | `csp-regression.log` 1 passed；实测宿主资源响应头 CSP 无 `unsafe-eval`（script-src 'self'），iframe 内 Pixi 画布正常绘制 |
| WEB-01/02 | P3(已修) | 坏 JSON 导入→"JSON格式损坏，当前进度不变。"；控制台 0 error、无外部请求 — 均实测确认修复 |
| M05-03 | P1 | 仍开放；本轮无新平衡证据、未关闭（正确）。真人 0/10、M2 公测、真实 DSH 共存均未验收（如实） |

## 7. 未验证/未执行项（如实声明）

- 训练/对齐完整 8/4 槽执行（UI 入口+代码规则已核，时间未跑满）
- 停工名单非空正例（见 M3-SON-06）、SLA 事故响应面板自然触发（需第2章 retainer 缺陷路径）
- 逐键 Tab 遍历与屏幕阅读器实机朗读（focus-visible/aria/原生 dialog/meter 结构级核查通过）
- PWA 更新按钮自然触发（PWA-01，见 §6）；触屏/异构浏览器
- 真实 DSH 安装/共存/卸载（无真实宿主；契约页≠小院验收，与 M3_INSTALL 口径一致）

## 8. 宿主与试玩包专项（全部实测）

- **Web 存档**：单库 `out-of-tokens-alpha` 单 store `slots`；3 手动+1 自动+5 备份在 UI/IDB 双确认；自动档轮转备份时间戳链（06:48:02→06:48:10）可见
- **跨标签 CAS**：tab2 写 manual-1 → tab1 即时显示"另一窗口更新了存档，自动保存已暂停。"；tab1 过期保存被拒"存档已被更新，请载入后再保存。"且**时间戳未被覆盖**；显式载入成功解除暂停（修正：首轮脚本目标匹配歧义跑错标签，已用精确 URL 匹配重测，结论以重测为准）
- **导入/导出**：坏 JSON/旧 schemaVersion 拒绝且当前进度不变；stateHash 篡改拒绝；commands 篡改状态不变但见 M3-SON-03
- **Host 契约页（localhost:5181，可丢弃 Profile）**：地图"AI 工坊"→iframe(`/out-of-tokens/web/?dsh=1`) 打开无存储告警；iframe 内推进（Host 模式逐命令保存）→"保存并关闭"→父页刷新→角落启动器重开→**恢复到第1天·下午**；卸载→面板/启动器移除、邻接图书馆按钮仍可用；全程控制台 0 error
- **试玩包（干净 worktree 生成）**：`package-playtest.mjs` 退出 0 → **211 文件**；`verify-playtest.mjs` 退出 0（sourceCommit=b5d1365、businessApproved:false、humanTesters:0）；与主目录包 211 文件集合一致、内容一致（2 文档 CRLF 差异见 M3-SON-08）；主目录 zip 实测 **863819 字节 / SHA256 10e49a1c35646a3ecfd91e4264be09a802c4d9786551eaca1c96186d86f490aa** 与 package-results.md 完全一致
- **PWA/离线**：4173 首载 SW activated、缓存 `oot-alpha-4f301ee59c6c`（18 URL）；**停止服务器后刷新页面由缓存打开、离线推进时段成功、离线手动保存 manual-1 成功**（`pkg-offline.png`）——独立复现 package-results.md 第10行的离线主张
- 观察项：Web 模式自动档仅 DayEnd 落盘（Host 模式逐命令），Web 玩家中途关页丢失当日时段——已有"导出"建议文案，属设计边界，提示 M3 文档已写明，不另立问题

## 9. 证据索引（本 worktree `harness/review-sonnet/`）

`install.log`、`check.log`（114/114）、`dev-web.log`、`audit-content.mjs`（内容审计）、`expr-*.js`（各阶段驱动脚本）、`cdp-*.mjs`（CDP 工具）、`browser/w1-*.png`（开局/交付/重开/英文/390px）、`browser/w-fault-*.png`、`browser/pkg-online.png`、`browser/pkg-offline.png`、`browser/host-open.png`、`browser/host-restored.png`、`browser/host-unloaded.png`；自生成包 `artifacts/out-of-tokens-b5d1365/`（未提交，gitignore 内）

## 10. 结论

- **P0=0，P1=0（新增）；新增 P2×1（M3-SON-04 双语剧情首句）、P3×5 + 观察×2**
- 工程检查点（install/check/打包/校验）**成立**；M3 宿主契约切片（iframe 生命周期、逐命令保存、CSP、卸载隔离）**成立**；试玩包（211 文件、离线可玩、来源一致）**成立**且与主目录交付物字节级吻合
- 三项已知问题状态：WEB-01/02 已修复实测；WEB-03 复现维持 P2；PWA-01 未自然复现维持 P2；HOST-01/02 修复经红灯证据+实测确认；M05-03 P1 仍开放（正确未关闭）
- M1 10 人真人（0/10）、M2 公测/乐趣、真实 DSH 共存、双语编辑质量**均未验收**——项目文档未冒领，本报告同样不宣布任何外部批准

报告本地提交见下方 commit（仅本文件与审查产物目录中脚本/日志；不改任何实现、内容、旧报告与 manifest）。
