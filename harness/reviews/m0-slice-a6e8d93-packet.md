# M0 首个可玩切片审查包

基准：7752322ba162edfe4e31d787a270e7663416f8a2。
目标：a6e8d93b8fcbd33bddd47d29de97c99d9fb75e1b。
外部审查状态：尚未收到 Gemini / Opus / Sonnet 报告。

## 改动与GDD对应
- packages/oot-core：§3时钟、§4资源与账本、§5四角色占用、§6委托状态、§7质量/返工、§8未决事件、§12危机简化。
- packages/oot-content 与 content：Zod范围/唯一性验证，4初始版本、3手工委托、2原型事件。
- packages/oot-persistence：§16.7日志存档/版本拒绝/内容指纹/状态hash重放。
- apps/sim-cli：可交互CLI、临时文件rename存档、五策略机器人、CSV/JSON与诊断回放。
- docs与harness：实施口径、任务台账、真实验证记录。

## 真实验证
原始日志：harness/m0-slice-check.log、harness/m0-slice-batch.log；数据：harness/results。
pnpm install --frozen-lockfile成功。
pnpm check：typecheck/lint/build通过；Vitest 4文件、16测试通过，571ms。
CLI冒烟启动真实Node进程：无效输入反馈、完整命令序列、save/load、独立replay通过。
pnpm sim:batch 5 60：25局诊断完整结束（破产时提前终止）；value/random/no-clarify/clear-only破产率100%，greedy80%。
pnpm sim:replay harness/results/value-replay.json：REPLAY_OK f9209084616923a0e3eee4d8a0e5e85fbc30f7313b913a58f36c0ddb57fc5962，slot68。
git diff --check通过。

## 复现
在独立目录执行 git worktree add --detach <审查目录> a6e8d93b8fcbd33bddd47d29de97c99d9fb75e1b。
进入目录后 pnpm install --frozen-lockfile；pnpm check；pnpm sim:play。
批量：pnpm sim:batch 5 60（覆盖工作树harness/results，审查时请使用独立worktree）。
回放：pnpm sim:replay harness/results/value-replay.json。

## 已知限制与争议
本提交是M0.1/M0.2首切片，绝非M0完整验收。D001–D016记录所有简化。
未实现30模板/20事件、多轮/长期/SLA、隐藏需求类型/工作量下调、概率澄清、加班/深度/协同、贷款/债务螺旋/继承。
busy卡是全队降载演练，未按版本特性/部署方式筛选；不是正式服务器繁忙卡。
bot固定单队，全员派遣使参与率不具验收意义；operatingMargin含周费和旧债，不能替代项目利润率。
第14天支付欠费后现金为负；60天诊断不满足正式平衡指标。不得修改统计定义或硬编码胜率伪造达标。
当前Xorshift32加混合派生，偏离GDD建议算法；审核分流和舍入是否足够稳定。
未核实逐资产授权，M1未开始；未复制外部素材。

## 请求审查的问题
Gemini：失败回滚、未决事件只结算一次、账单触发边界、资源收费/审查/Planner顺序、save版本与hash保护是否有可复现漏洞。
Opus：工资/周费/旧债/产出规模的冲突，澄清和组队是否产生真实取舍；请用固定种子指出最小数值反例。
Sonnet：CLI错误路径、存档I/O与包边界回归；暂无Web/UI。
按REVIEW_PROTOCOL格式回交固定SHA报告。下一独立任务B01改善机器人和利润归因，不等待报告停工。
