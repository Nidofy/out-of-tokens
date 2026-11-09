# O4-A检查点

目标实现：bdaa11c25bbf8616b0191ca4599b8dc4a711cd2f
UI/美术审阅基线：ee9dd843061b90d8dff88340d65f75100d897dc1。

规则与任务台账：docs/OFFICE_O4_FIRST_LOOP.md。engine0.16.0/content office-2；只完成基础/标准工位的效率/疲劳闭环，不包含完整O4。旧档拒绝、不删除、不迁移。

复现：pnpm check；pnpm dev:web；分别打开/?office-lab=working&animation-time=1和/?office-lab=standard&animation-time=1，推进1槽比较Qwen精力83/85与任务进度8.84/9.73。手机升级用office-lab=initial&locale=en&theme=dark&motion=still，升级保存余额4630。夹具均为隔离内存存档。

最终34文件233测试、类型/lint/Web与DSH构建通过，日志harness/o4a-check-final.log。专项失败夹具记录保留在o4a-effects-v1.log，修正后13通过。实机截图/AX与无error/warn日志harness/o4a/。生产代码与测试都只从状态/显式命令读写，不引入随机或时钟。

边界：冻结条件预算不是未来精力模拟；无新版本完整长局平衡结论。后续O4-B确定性摸鱼/发现提醒，O4-C高阶/恢复/设备，O4-D反事实与满配置美术验收。没有push、部署、消费封存种子或访问玩家存档。
