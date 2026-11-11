# VF4-B2 闭环与 VF4-B3 联合验证协议

2026-11-11；起点e96fc5d。用户提供B2固定实现30e35cd独立CONDITIONAL PASS（P0=0/P1=0/P2=2/P3=2），并授权B2本地闭环后直通B3；本轮只作一次本地提交，不再PENDING/回填SHA、不维护raw+LF双哈希。保护/白名单/SVG复用以git diff为准。最终代码定稿后才运行一次完整pnpm check和72+12性能；仅超+10%时允许唯一完整确认72+12。未进行B2中间性能采样。

用户README.md与.github/workflows/pages.yml已按明确指令git stash push -u隔离，stash ID与原字节校验值保存在user-changes.json。提交后恢复原样，不进入本轮提交，不push或部署。此两文件的恢复核对用于保护用户工作，不属于已取消的源码多重哈希仪式。

## B2 闭环

P2-1：coffee lounge-3的透明顶边不应挡住(335,655)。采用实际绘制顶边158.4world，并限制横向候选170～1770；meeting-2/lounge-2旧有效避障保留。新增“生产逻辑判为画内的角色名牌不得无故隐藏”，同时发现560全景Seedance右边界名牌隐藏，最小修正为画内名牌先夹入视口再避让。初版诊断用脸中心，后统一为生产根锚点及在岗高度；原始观察保留。

44配置：四视口×（coffee 4/12人×3槽×r3 + 4人lounge-3其余四roster轮换 + whiteboard12人meeting-2）。各overview/目标zone复验。P2-2的24张旧retest-coffee图片原样归档b2-pre-review-screens，再覆盖B2原路径为实际lounge镜头图。截图前检查目标视角选中、返回全景按钮可见，记录DOM与background一致性及screenshot-manifest，不能仅依赖诊断JSON。

P3-1：B2 browser-cleanup中的visibilityRestored:false原意为恢复隐藏状态，改为visibilityRestoredSuccessfully:true和restoredVisibility:hidden，纳入检查。新B3清理采用相同明确成功语义。P3-2为stash隔离/恢复。

## B3 量化矩阵

四视口1280×720 zh/light、844×390 zh/light、560×800 en/dark、390×844 zh/light。五样本bluewhale/Qwen/Llama/Mistral/GLM，4/12人，motion=still。

修前56配置：四视口×两人数×（sofa三合法lounge槽、server两槽、dining/reading各public-table meeting-1），roster r2；每配置overview和目标镜头。最终240配置：工作室160（四视口×两人数×两roster×idle/working×五槽）+公共80（四视口×两人数×五roster×两场景）。每配置overview、目标镜头、reset；reset背景size/position逐字段精确恢复。新增source修正期间早期final失败也保留并映射后续同配置通过，不删数据。

sofa/server通过真实office采购与assign命令。server只审核外壳，不增加算力。为轮换几何位置，harness按roster排序克隆内容的versions；不更改生产内容。dining/reading通过隔离session view getter将场景设canteen/library并把样本置于在场，仍使用生产public-table与渲染器。不是自然日程达成、不是背景/章节扩产，也不验证公共家具新增业务行为（生产中公共桌面点击没有OfficeEditor动作）。

测量使用真实Pixi worldTransform、纹理、EventBoundary；alpha>=128统计面部贴图家具遮挡，非五官语义分割；alpha>=96作为生产精确命中门槛。实际rendered px、世界坐标、每层bbox/锚点、前后z与透明角/间隙/阴影均记录。画外裁切单列。名牌检查涵盖画内可见性与相交。模拟视口不代表低端移动真机。

修前发现四类旧矩形误中透明区、餐桌/书桌细节漏点、sofa lounge-2/server server-1挡住12人样本。复用已有遮罩，原SVG先保持零diff；按实屏只扩展站位障碍包络。服务器首次向前回退与下一排角色叠身体，过宽水平间隔又推入工位显示器；均保留失败，按96world双角色命中宽度选前方空隙。餐桌细笔画初选(54,-97)实际alpha57，改(52,-90)后复验；这是探针误判而非再修改生产命中门槛。

真实指针使用pointer-events:none定位标记的浏览器force click，落生产canvas；验证角色Dialog标题、工作室家具OfficeEditor、公共家具无业务弹层及透明区无家具误触。编辑器覆盖四视口、两工作室目标、不同入口镜头、采购与交换、cancel/save，逐字段背景和焦点返回。

Windows对汇总JSON间歇占用，改为records/每条独立落盘，最终派生interaction-results/analysis。已落盘重复全部保留；浏览器批处理超时从持久队列继续。原B2与B1性能不改，不以未完成配置充数。

## 开放边界

ai-village、packages、lock、scripts、六封板UI、B1/B2八SVG、harness/vf4b1零diff。lounge-4不可达/未验收，保持排除。其余七角色全姿态、完整动态、VF4-C背景/全员推广、Stage B、完整Visual Freeze 1、VF31-PERF-01完整预算、真实DSH、SW全分支、200%系统字体继续OPEN/HOLD。office/SOURCE.txt原创声明引用的根LICENSE缺失限制保留，不借用角色许可证。

## 最终结果登记

联合967条几何记录，97条历史失败（B2 3、B3修前87、早期final6、探针1）均有复验映射；240最终配置/720条最新记录、3240样本观察通过。469真实点击（320角色，149家具含重复及四条暴露扶手补验）、80编辑器往返（64交换+16采购）通过。

最后覆盖门禁发现lounge-2原实心探针都被角色挡住，保留失败delivery-before-exposed-arm.json，补四视口暴露扶手点击打开OfficeEditor。补验在性能后，仅harness增加探针，源码与正常dist不变；没有再次采样。一次完整check中的测试写死x1642而实际安全值1658，改为安全区间断言后38文件318测试通过；原失败日志保留。

代码定稿时间2026-11-11T02:46:46.5168902Z之后唯一72正式+12预热，对c68541d四格-7.61%/-5.02%/-3.60%/-2.17%，未触发确认批。正常production无探针、端口5181–5186关闭、缓存与浏览器清理完成。联合交付26/26 true，单次本地提交后恢复用户两文件并暂停。
