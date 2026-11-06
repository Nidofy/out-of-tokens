# 架构
oot-core（零依赖）定义 Content 接口及 State/Command/Event，纯函数复制状态后事务执行。
oot-content 读取声明式 JSON，Zod 校验范围、唯一性、引用，再将数据注入内核。
oot-persistence 负责带版本的命令日志、稳定快照与恢复校验；文件写入由 CLI 完成。
sim-cli 负责交互、文件 I/O、机器人及报告。未来 platform 包在第二个宿主出现时建立。
M1 才建 web/render/ui：Vite + Preact + PixiJS；版本届时核实，不安装无用依赖。
存档以初始种子和合法 Command 日志重放验证状态，避免接受任意伪造状态。
