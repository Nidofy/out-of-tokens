# VF31-PERF-01 可归因诊断协议（测量前固定）

目标：定位dev twelve/standard差异落在哪个阶段，先完成本节门禁，再决定是否实施系统弹窗组。不得用重复采样直到通过代替归因。

环境：同机IAB，1280×720，精确DPR须为1.0000000447034836；不改变缩放、电源和刷新率。environment-before.json记录性能电源方案、Intel显示120Hz、另一虚拟显示刷新率不可用、BatteryStatus=2。记录实际rAF间隔及visibility，不将旧审查中的60Hz解释当成已证事实。测量后再读取环境；如改变则标记不可比。

正式采样前的校准补充：IAB隐藏/窗口未在前台时，document.visibilityState仍为visible但rAF约1000ms；仅set visibility(true)不能解决。用户明确回复“已前台”后，180帧p50=8.3ms/p95=8.4ms。正式批次固定浏览器可见且窗口前台；若rAF p50>20ms或visibility非visible，停止该批保留记录并处理环境，不悄悄筛样本。原隐藏校准样本与前台校准样本均排除，不用前台改善抹除历史未记录窗口状态的不利批次。

诊断配置仅在DEV或visual-review且URL含vf-attribution时启用。harness中的Vite transform临时为main/AlphaApp/scene注入同样标记，不落盘修改应用文件，也不改变调度或领域命令。三版本040031e（既有诊断补丁）、6f3a191、c68541d使用相同注入器。此配置不生成离线缓存，禁用SW的visual-review与原诊断路径保持；默认生产仍走原配置。

记录绝对navigation时间：moduleEntry（main首次执行，静态ESM已就绪）、firstHudCommit（AlphaApp首次useLayoutEffect且HUD存在）、sceneImportStart/sceneModuleLoaded、sceneEffectStart、pixiInitStart/End、firstSyncStart/End、firstCanvasRaf（HUD与canvas存在时首个rAF），以及已有vf-startup观察。同步耗时与等待耗时分开。动态导入可能早于HUD完成，允许有符号差值，不把并行阶段错误加总成串行关键路径。

记录资源模块请求的URL/initiator/start/responseEnd/duration、模块数量与最后响应时间、入口前/动态导入阶段分布；PerformanceObserver longtask（不支持则明确记录）、前180帧rAF分布/页面可见性。每个阶段采用首次标记，不因后续纹理sync覆盖。

固定样本：3版本×(dev standard、dev twelve、preview twelve)=9组；每组预热一次到180帧排除。六轮，奇数版本/场景正序、偶数逆序，共54条，写dev-attribution.json；按版本/模式/场景以及奇偶轮中位数汇总。每次导航等180帧后再下一次，避免前页纹理解码/销毁尾部成为不受控间隔。记录冷首条但不计正式统计。

若主要额外时间落在ESM入口前/模块等待，且有新增小模块关键请求证据，可作一次白名单内模块内聚A/B；若落在效果调度边界且组件提交/初始化CPU无持续退化，可保留实现并说明调度归因及限制。若发现真实组件/Pixi退化，先最小修复；超范围无法解决则止于VF3.2，不进入VF4-A。归因仍不明同样保持HOLD，不凭猜测放行。

一次追加机制验证可在同配置中仅以query开关将Scene初始化effect改为layout effect（或仅内联scene-navigation模块），每种机制必须预先选择且注明只供因果对照，不进入产品；原样与干预各六次交替，两场景共24条，记录原始数据与补丁。实验只隔离一个因素，不循环试到通过。

54条采样后选择的唯一追加机制验证：c68541d的Scene初始化useEffect对比useLayoutEffect，query为attr-layout=0/1；不合并scene-navigation（其响应在六个twelve样本中均提前于入口就绪，无法支持其为关键阻塞文件）。4组合各预热一次排除，24条按奇偶正反顺序采样，保留所有样本。此实验改变生命周期仅为隔离等待机制，绝不写入产品源码。

只有归因明确且调整后没有新增运行时退化，才进入VF4-A。该门禁决定写入attribution-gate.md并带量化依据。所有旧不利批次保留。总体Visual Freeze 1、资产扩产、全站CSS仍未放行。

最终源码/CSS/测试定稿后另执行既有启动协议：151文件基础上纳入实际新增/删除的源码，原始及LF SHA256；12预热、三版本040031e/c68541d/vf4a×dev/preview×standard/twelve×六轮，共72条；任一组>10%仅一次72条确认。先归因的54条与最终72条不是同一指标批次，不能混算。源码冻结后不再修改应用/CSS/测试，验证Git blob与冻结哈希一致。
