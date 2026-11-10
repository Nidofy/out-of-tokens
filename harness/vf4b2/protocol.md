# VF4-B2 会议与休闲代表角落实屏协议

基线69b8d83b1d2b3b79400da4dd0dd41c75ab39480b，B1固定0a958b8独立PASS已登记。B1 SVG及harness/vf4b1只读，ai-village/packages/lock/六封板UI保护。四开局bluewhale/Qwen/Llama/Mistral+GLM；用户另确认仅审核领域合法lounge-1～3，lounge-4不可达／未验收，等待后续授权，不添加假槽位。

先保存四视口before证据：whiteboard在meeting-2会挡住12人空闲角色；coffee在lounge-2会挡住12人DeepSeek部分面部；coffee粗矩形误命中机器旁透明区；whiteboard实心支腿未被矩形覆盖；横屏会议名牌横移至右边界后仍重叠。仅改office-scene/spec：两目标家具复用B1>=96alpha遮罩；空闲站位绕开实际放置的whiteboard/coffee，保留槽位与镜头算法；名牌有限横移后采用纵向避让，维持12px。第一次空闲避障回退到前方仍被工位显示器边缘盖住几像素，first-fix保留，第二次采用可用横向空隙消除。四SVG暂保持原样，不盲目重绘。

真实labSession+office/accept/assign命令，隔离内存存档。为使五样本支持职责均可达会议席，仅在harness克隆内容中清空computerVersions/computerTemplates；每组两支持岗planner/reviewer与一worker，第四人空闲。5角色循环轮换、两职责顺序、meeting-1/2、4/12人、四视口：160配置；coffee两组roster(0/2)、3合法槽位、4/12人、四视口：48配置；共208正式配置，另补无占用白板真实点击与编辑器。不是生产规则修改或自然经营达成。

每配置overview/meeting/lounge、当前所有样本locate、reset；镜头前后backgroundSize/Position逐字段字符串精确相同。四视口1280×720 zh/light、844×390 zh/light、560×800 en/dark、390×844 zh/light，motion=still。定位和画外裁切单列；模拟viewport不是手机真机认证。

诊断读取真实Pixi worldTransform/getBounds/纹理alpha与EventBoundary.hitTest。B2遍历所有高于角色z的家具back和front，避免把back误当永远在每个角色后。alpha>=128按实际显示像素交集计算面部贴图家具遮挡；不是五官语义分割或所有动态认证。名牌层高于world，并检查可见名牌矩形；画外隐藏名牌null。SVG逻辑280×240，实际源raster175×150；mask280×240，world/pixel bbox分列，空front层bbox为null是合法空层。

真实点击通过pointer-events:none DOM定位标记的浏览器force click，落到生产Canvas；验证实际Dialog标题、S2委托或OfficeEditor，不直接调用回调。透明区后方若有角色，命中角色是正确结果。OfficeEditor四视口×两家具×overview/meeting/lounge/locate×cancel/save=64有效往返，检查样式精确恢复与触发按钮焦点。

窗口浮点映射容差0.01px；原始JSON不改写，schema与失败复验映射单独计算。一次Windows文件写入UNKNOWN后重试保存内存并重采该视口；重复记录保留，不择优。矩阵采用每配置保存进度，防止工具超时丢失未完成批次。

Web源码有改动，必须最终源码及全部office SVG冻结后新采72正式+12预热；三版本040031e/c68541d/current×dev/preview×standard/twelve×n6，同前台1280×720，rAF p50<=25ms。任一格相对c68541d>+10%仅运行一次完整等结构确认，不删异常值。指标仅首控件+Canvas，VF31-PERF-01完整预算仍OPEN。

资产来源沿用office/SOURCE.txt原创声明；根LICENSE缺失限制保留，不借用角色MIT。其余四家具/七角色全姿态/完整动态/VF4-C/StageB/VisualFreeze1/真实DSH/SW全分支/200%字体均OPEN/HOLD。最多两次本地提交后暂停，不push、不部署、不跨B3/C。

## 最终执行登记（2026-11-11）

四目标SVG均已确认“实屏核验通过 · 原样复用”。208正式配置、1922总记录、8020正式样本观察（含重复）、320会议席位职责组合、140指针记录与64编辑器往返，40张最终代表截图。71条历史几何失败（68 before + 3 first-fix）对应复验见delivery-verification.resolved；指针原索引92误选被Qwen覆盖的咖啡柜像素，保留false，改暴露像素后通过，明确索引见pointerResolved。交付25/25 true。

除文件写入重存外，发生一次测试标签丢失、两次浏览器工具超时；从持久队列继续，保留已落盘重复，未完成配置重新执行。正式final记录1771包含3条中断前重复，不声称8020为独立样本。91 before、8 first-fix、4 second-fix与48 coffee同视角补复验共同构成其余记录。

167文件最终冻结后，首批72+12四格对c68541d为-2.60%/-3.74%/-4.39%/+12.69%，触发唯一完整确认72+12，确认+1.48%/+3.74%/-2.34%/+2.44%。实际144正式+24预热；两批单独记录、无异常值删除、无混合择优、无第三批。完整pnpm check为38文件316测试，正常生产构建恢复与清理完毕，详见build-log与交接。
