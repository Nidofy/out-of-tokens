# M1.0 浏览器宿主工程首切片

本地执行pnpm dev:web，默认127.0.0.1:5173；生产pnpm build、pnpm preview:web。Vite8.3.6、Preact11.2.0、Pixi8.22.0固定锁定。浏览器必须使用localhost或HTTPS以提供WebCrypto。没有发布或部署。

已实现：4位初始角色、原创程序化工作室；委托板/详情/澄清/派遣/返工/交付、事件选择、加班/购额/贷款、危机和重开；DOM键盘操作与Canvas角色查看；团队选择即时保守资源估算，纯预览不写命令。页面只通过GameSession发Command并展示ViewModel，动画时间不进入模拟。

内容公开browser入口使用同一Zod声明；Node读取器单独保留。持久化共享canonical JSON/回放/版本协议，Node crypto与浏览器WebCrypto输出相同。GameSession导入校验完且revision未变才整体替换。IndexedDB三手动、一自动、五备份；单事务轮转和revision比较防覆盖；BroadcastChannel提示其他窗口更新并暂停自动保存；存储不可用可继续并导出文件。

自动测试：Node/WebCrypto字节一致与双向恢复；异步保存快照；pending保存/单次选择；坏档和并发导入原子性；预览不改变状态/命令；fake-indexeddb跨实例CAS、轮转5份与失败事务。真实浏览器跨标签冲突和配额异常还未验收，不把模拟IDB测试当真实浏览器证明。

真实浏览器QA（2026-11-07）：seed1接论文核查，空团队中文错误在弹窗内可见；选择Qwen执行/DeepSeek审查，估算66.24T；busy事件选择等待只影响目标，推进一槽至下午；手存1、推进日结自动保存、刷新恢复第2天、手存回退至第1天下午成功。console error为空。390×844视口初次发现Canvas撑开grid，scrollWidth634/clientWidth375；修复min-width和canvas布局后两者375。证据browser-preview.jpg。尚未做10人乐趣测试、触屏实机或异构浏览器验证。

范围门禁：完整M1需工作室/食堂/图书馆、找人、8角色×2版本、章节和10名测试者，均不能用此首切片冒充。M05-03仍阻塞经营放行；当前可推进独立宿主质量、授权审计和场景接口。外部AI-Village只有只读审计，未复制社区美术。

下一阶段顺序：M0.6开放P1整改→M1.1生活场景/找人及疲劳反馈→M1.2角色版本/成长→M1.3第0章人工试玩。概率澄清/信息隐藏须先给出设计，不让UI泄漏尚未揭示的信息。
