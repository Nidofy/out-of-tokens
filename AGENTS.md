# Out of Tokens 开发约定

## Mission
AI-Village 世界观的 Q 版 AI 工作室经营游戏。
M0 证明读委托、澄清、组队、执行、验收、经济反馈可玩且可复现。
游戏 Token 不是真实 API Token。

## 恢复入口
新会话、压缩后先读 docs/STATUS.md 并检查 git status / git log。
运行 pnpm check，直接继续首个未阻塞任务。
不依赖聊天记录恢复进度。
按需阅读 ROADMAP、M0_SPEC 和相关日志，不要求每次全文重读。

## 依据
docs/GDD-v0.1.md 为产品基准，禁止静默改写。
docs/M0_RULES_FINAL.md 为当前实施规则；M0_SPEC.md 保留首切片历史。
docs/DECISIONS.md 记录歧义、偏离、理由、测试和修订条件。
docs/STATUS.md 是执行状态，不是愿望清单。

## 分层
oot-core 是零运行时依赖的纯 TypeScript。
禁止 window、document、fetch、Date、Math.random、Node I/O。
时间和随机从显式状态获得。
宿主只派发 Command，只展示 ViewModel / DomainEvent。
包间只能用 workspace 包公开入口，禁止 ../../ 越界实现引用。
内容是可校验声明式数据，不执行脚本。
Zod 和文件读取留在内容/宿主层。
不提前创建 M2–M5 空壳应用。

## 状态
Command 必须先校验；返回新状态、事件或明确错误。
非法命令原状态原样返回，RNG 与账本不变化。
资源不足不得负 Token 或重复收费。
负现金仅允许领域定义的现金流危机。
质量、精力等数值必须钳制合法范围。
存档版本不兼容明确拒绝，禁止猜测迁移。
未决事件及 RNG 游标必须保存。

## 确定性
同引擎/内容版本、种子、命令序列得到一致结果。
分离 board/event/quality RNG 流。
固定迭代顺序与舍入规则。
表现层随机不得影响结算。
更改规则时更新版本及回放证据。

## 工具与测试
Node 24、pnpm workspace、TypeScript strict、ESM。
工程脚本用 Node/TS，避免 Bash-only。
提交前 pnpm check 和 git diff --check。
先实现可玩垂直闭环，再扩大内容数量。
使用可丢弃测试数据，不改用户存档。
可自主运行受影响测试并修复当前任务失败。
只记录实际执行结果，保留失败与修复证据。

## 检查点
每个可运行阶段更新 STATUS、任务台账和 harness/build-log.md。
测试通过后创建本地 checkpoint commit。
另一个记录提交写入目标 SHA，避免自引用 SHA。
固定 SHA 审查包放 harness/reviews/，记录复现命令和风险。
审查等待期间继续无依赖任务，不虚构外部审查结论。
P0 立即修复，P1 在相关集成前修复，P2/P3 入台账。

## 所有权与外部操作
主线程为唯一集成者；Gemini/Opus/Sonnet 默认只读审查。
并行写入需独立 worktree、文件所有权、明确合并负责人。
不删除用户文件，不 reset --hard、clean -fd 或强推。
只允许本地提交，不擅自 push、部署、建远端或付费调用。
不读取或输出 secrets，不提交 node_modules、真实存档。
资产必须记录来源和许可证；M0 不需要任何美术复制。
