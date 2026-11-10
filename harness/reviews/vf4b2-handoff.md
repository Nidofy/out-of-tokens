# VF4-B2 固定实现交接（2026-11-11）

固定实现：`B2_IMPLEMENTATION_SHA_PENDING`；基线：`69b8d83b1d2b3b79400da4dd0dd41c75ab39480b`。本轮实现与门禁完成，**暂停待独立只读复审**，执行者未宣告 B2 独立 PASS。最多两次本地提交，不 push、部署或进入 B3/C。

## 裁决登记与范围

用户提供 Gemini 对 B1 实现 `0a958b8259fa2e4e92da38a10fa5b6923de5b97a`（记录69b8d83、基线ec59d18）的独立 PASS，P0/P1/P2/P3均0，已登记三份状态文档。B1 的16条修复前失败、208配置、108点击、64往返、155文件冻结后72+12及派生链/许可边界获认可；B1 SVG与整个证据目录保持0diff。VF4-A全阶段、VF4-B1与VF4A2-PERF-01保持CLOSED/PASS。

B2审核whiteboard/coffee与DeepSeek/bluewhale、Qwen、Llama、Mistral、GLM，四视口1280×720 zh/light、844×390 zh/light、560×800 en/dark、390×844 zh/light，4/12人。用户明确同意只测领域合法lounge-1～3；lounge-4真实布置命令不可达，**未验收，等待后续授权**。不修改packages来添加槽位。

## 实测问题与最小修正

- `office-scene-spec.ts`：实际放置于meeting-2的白板遮住12人布局的空闲Llama，lounge-2咖啡台遮住空闲DeepSeek部分面部。仅为这两类家具让空闲角色优先移入横向可用间隙；保留slotPoint、座位±72和镜头算法。首修退至家具前方仍有显示器边缘遮挡，保留3条first-fix失败，再以横向间距120world修正。定位沿用同一actorPlacements，世界/屏幕映射一致。
- `office-scene.ts`：两目标家具沿用B1 alpha>=96命中遮罩，解决旧矩形透明角误触、白板支腿漏点。四张SVG没有改动，两个front本来为空层，其bbox=null、命中全false是正常结果。
- 横屏会议名牌在右边界水平夹紧后仍重叠。原12px、双行机制保留；水平位移过大或仍相交时按3px间隔纵向避让，并考虑视口底边。渲染使用返回的x/y。
- `vf2.test.ts`新增3项几何回归；应用改动仅两个scene文件。所有office SVG、角色资源、packages、锁文件、六个VF4-A UI和B1证据均0diff。

资产台账把四层均标记“实屏核验通过 · 原样复用”，记录来源、原始/LF SHA、字节、源raster175×150、逻辑280×240、bbox、锚点、座位、alpha命中、加载成本与光影接触观察。office/SOURCE.txt仅有项目原创声明且引用的根LICENSE缺失，不能推断新许可证，也不借用ai-village许可证。

## 实屏证据与口径

208正式配置（白板160、咖啡48），覆盖overview/meeting/lounge、当前样本逐一locate及reset。白板五人×两席×两职责×两槽×两人数×四视口=320种座位职责组合。每组开始/返回全景背景样式逐字段相同。

`interaction-results.json`共1922条：91条before、8条first-fix、4条second-fix、1771条final（含3条中断前已落盘重复）、48条同视角coffee补复验。正式样本观察8020条，含重复观察，不能当作独立统计样本数。68条before失败及3条first-fix失败均原样保留；`interaction-analysis.json`提供schema/几何检查，`delivery-verification.json.resolved`给出71条失败的明确复验映射。最终/复验零失败，40张最终代表截图及前后同视角截图保留。

真实指针140条：五角色×两家具场景×四视口×face/body=80条，加家具空闲/任务占用实心区、支腿/机器和透明角/间隙/阴影；结果验证真实角色Dialog、OfficeEditor或对应S2标题。生产Canvas接收pointer-events:none定位标记处的真实浏览器点击，不直接调用业务回调。139条通过，另1条保留的探针分类错误：coffee实心点(0,-65)被前景Qwen挡住，正确打开Qwen；换成暴露柜体(-65,-65)后通过。`pointerResolved`提供原索引与复验索引，未把误判改写成通过。

OfficeEditor 64次有效往返：四视口×whiteboard/coffee×overview/meeting/lounge/locate×cancel/save。真实采购第二件、交换两个槽位；预览锚点、保存交换/取消回滚、backgroundSize/backgroundPosition精确恢复、焦点回到触发按钮均通过。

夹具使用真实office/accept/assign命令和隔离内存存档；为让五样本均可到达支持会议席，仅harness克隆内容清空computerVersions/computerTemplates。这是覆盖夹具，不代表自然经营流程。测量取真实Pixi变换、纹理alpha及EventBoundary；面部遮挡率是贴图区域家具alpha交集，非五官语义分割；画外裁切单列。动态、移动真机与200%系统字体不在通过范围。

一次文件写入中断保留内存重存并重采视口；一次测试标签丢失、两次工具超时后从持久队列继续。已落盘重复保留，未完成配置重新执行。初始harness准备和探针选点调整不改变生产代码的结论；工具恢复不计作额外性能批次。

## 工程与性能

完整`pnpm check`通过：38文件316测试、类型/lint/Web/DSH构建（check-release.log）。最终源码151文件加全部16office SVG共167文件，在2026-11-10T16:24:05.545Z冻结，之后无应用/测试/资源修改，原始/LF哈希复验通过。

新批三版本040031e/c68541d/current×dev/preview×standard/twelve×n=6。首批72正式+12预热的preview/twelve越过+10%，按协议执行唯一一次完整72+12确认；共144正式+24预热，所有原始值（含高值）保留，未混批、未选择性重采超标格、未再采第三批。

| 单元 | 首批当前中位ms | 首批对c68541d | 确认当前中位ms | 确认对c68541d |
| --- | ---: | ---: | ---: | ---: |
| dev standard | 166.75 | -2.60% | 185.30 | +1.48% |
| dev twelve | 161.05 | -3.74% | 162.20 | +3.74% |
| preview standard | 143.75 | -4.39% | 152.20 | -2.34% |
| preview twelve | 166.50 | +12.69% | 147.05 | +2.44% |

确认四格均<=+10%。采样均前台可见1280×720、rAF p50<=25ms，冻结后开始；预热独立排除。指标仅首控件+Canvas，非完整assetsReady、冷缓存或GPU纹理预算。原始数组、两个基线比较和统计见startup-*。

交付25/25 true；正常生产dist已恢复且无诊断探针，5181–5186无监听，本轮专用缓存删除，浏览器视口恢复、测试标签关闭、恢复隐藏。active-processes.json仅保留历史PID，实际端口结果见cleanup.json。

## 复核入口与仍开放边界

只读优先检查`git diff 69b8d83...固定实现 --stat`及保护路径，运行`node harness/vf4b2/freeze-source.mjs --verify --read-only`；阅读delivery-verification.json、corner-audit.json、protocol.md、check-release.log、build-log.md。分析器/交付验证器会写本轮派生产物，需要重算时在临时副本执行；无需重跑采样。

继续OPEN/HOLD：VF31-PERF-01完整预算（冷缓存、完整assetsReady、GPU上传、长会话驻留、输入延迟、低端移动真机）、其余sofa/dining/reading/server、其余七角色全姿态、完整动态、VF4-C食堂/图书馆/章节背景与Stage B专属立绘、完整Visual Freeze 1、真实DSH冲突流、SW全分支、200%系统字体，以及lounge-4。B2最终裁决交由独立复审。
