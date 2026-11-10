# VF4-B1 代表工作角落审核协议

基线：ec59d18ad41c2dc24d875578ae7851d6e3e0a3f4（实现3be52f46586047722e96f759975d36c0eb9ebaf7）。用户已确认按DeepSeek/bluewhale、Qwen、Llama、Mistral + GLM，现有单屏standard审核；不引入doubao或双屏。用户提供A4独立PASS，引用91a444d记录在本地不存在；本地实际记录ec59d18，仅如实注明不改历史。

## 先测后修

`before-*`四视口16条保留原始实屏与数据。发现：basic空椅背上方与两种桌脚外侧透明像素被粗矩形误判家具；现有显示器与Llama/Mistral/GLM面部贴图边缘有少量实际不透明像素重叠；844×390单行工作名牌及相邻站姿名牌重叠。

最小修正：basic-front/standard-front仅将原显示器group从translate(82,-11)移到(98,-11)，其他形状、材质、渐变和阴影不动；back原样复用。office-scene/spec为这两类加载一次alpha遮罩（阈值96/255，排除最大alpha .26的地面阴影与透明padding）；其他六类家具仍调用原furnitureHitArea。cam.scale<.6时电脑名牌分行，维持12px字号；同一行微移相邻名牌消除重叠，底部按实际名牌高度裁切。未改slotPoint、角色比例/母版/骨架、Camera计算、领域规则或封板UI。

## 夹具与覆盖

仅审核server通过Vite transform接入harness的b1Session与render-audit；生产源码不包含诊断导入。b1Session克隆内容，在隔离内存中通过真实office/accept/assign Command安排四工位；4人样本以5角色循环取4人，12人样本保留全部角色。夹具将menu列为电脑任务以观察planner电脑姿态，并将mcp购买条件置零再使用真实software命令启用tool；高现金/云额度保证夹具不受经济门禁影响。以上均仅是可达性夹具，不声称自然经营达成或新增生产规则。

四视口：1280×720 zh/light、844×390 zh/light、560×800 en/dark、390×844 zh/light。静止模式固定站立/入座，world1920×1080。每个4人入座批次：5个角色轮换×4个职责偏移，roles为worker/planner/tool/worker；两个家具种类，覆盖5角色×4槽位×全部3种职责。每例记录overview、work-left、work-right、每个当前样本的locate及reset，reset backgroundSize/backgroundPosition要求前后字符串精确一致。另补两组4/12人空闲站姿与12人入座压力场景。画外裁切单独记录inViewportPixels/badgeVisible，不将画外角色写成可见，通过locate核验可达性。

## 测量口径

- 实际生产Pixi renderer的Container/Sprite worldTransform、getBounds与EventBoundary.hitTest；没有另一套模拟renderer。事件边界在首次指针事件前使用同一个app.stage初始化（与Pixi EventSystem行为相同）。
- 面部：face节点的真实纹理alpha>=128像素，在实际显示分辨率逐像素映射；统计zIndex位于角色前方的家具front不透明像素覆盖。面部未遮挡率=1-coveredPixels/facePixels。完整AABB重叠也保留，但不拿透明画布AABB冒充真实遮脸。该量不是五官语义分割或全面可访问性认证。
- 名牌：label层始终在world之后绘制，家具不会盖住名牌；可见名牌按实际屏幕矩形检查其他可见名牌交叠，记录未遮挡率；隐去的画外名牌为null，不记100%。
- world锚点、显示身高、面部/身体/名牌矩形、屏幕命中点与实际命中对象逐条保存。透明家具区后方若有角色，命中该角色是正确结果，不能要求一律null。
- SVG viewBox280×240是逻辑画布；当前浏览器实际source raster为175×150，sprite显示为280×240 world units，hit mask归一化为280×240。早期raster.bbox记录的是pixel index减去逻辑origin，并非world bbox；原始字段不改，台账按实际width/height换算，后续同时记录pixelBBox/worldBBox。该诊断修正不影响此前face alpha采样（后者始终使用texture.width与worldTransform）。
- CSS序列化会舍入数值；world/background映射容差0.01 rendered px；镜头往返样式仍要求精确相等。最初按浮点字符串比较的误报分析保存在analysis-before-css-normalization.json。
- 真实点击使用仅审核页的2px、pointer-events:none标记定位，Playwright force-click发出浏览器真实指针，事件落到下方生产Canvas；无dispatchEvent或直接调用onSelect/onFurniture。打开的真实dialog与实际对象标题用于复核，不把hitTest查询独自称为真实点击。

## 证据完整性与复现

interaction-results保留before、first-fix、final以及部分中断后重试的重复记录。一次Windows临时文件占用导致writeFile UNKNOWN，未丢弃内存记录，保存后从该配置重试；重复记录可定位，未删除不利结果。analyze-interactions独立计算schema/遮挡/命中/层级/锚点/映射门禁；corner-audit从原始数据汇总资产尺寸、字节/hash、来源与许可原文、derived chain及逐样本观察。许可不作推断：office/SOURCE.txt只称repository license，但仓库根没有LICENSE文件；沿用项目原创资产，不虚构第三方再分发许可。ai-village的已有MIT与来源目录保持零diff。

复现：`node harness/vf4b1/server.mjs`（5184），`?office-lab=b1-basic-4-0-0&motion=still`；格式kind/basic|standard、population/4|12、rosterRotation/0..4、roles/0..3|idle。英文深色加locale=en&theme=dark。诊断输出#b1-render-audit，采集函数在browser-functions.txt。`pnpm check`；`node harness/vf4b1/analyze-interactions.mjs`；`node harness/vf4b1/build-corner-audit.mjs`。在可丢弃检出复核，勿覆盖固定原始证据。

## 性能与未闭合边界

本轮Web源码和两个front SVG有变化，不能复用A4性能批；必须完成全部修正后冻结，再采3版本×2模式×2场景×n6=72正式+12预热。前台可见rAF p50<=25ms。任一格相对c68541d>10%才运行唯一一次等结构确认，不择优、不删异常值。指标只代表首控件+Canvas，不是完整assetsReady/纹理上传/常驻内存预算。

VF31-PERF-01完整预算、其他6类家具、其他7位角色全姿态、VF4-C及Stage B专属立绘、完整Visual Freeze 1、真实DSH、SW全分支、200%字体继续OPEN/HOLD。只完成B1，最多两次本地提交后停止，不push、部署或跨入B2/C。

最终执行补记：208配置完成，1704条原始记录（含重试重复）与7008条样本角色观察，108次实际点击，64次有效OfficeEditor往返。一次浏览器工具批次超时后从持久队列恢复；未落盘批次不计完成，改为每配置保存。Office首次JSON.stringify因对象字段顺序误报，原始1条false与对应逐字段精确比较复验保留。交付覆盖首次因Pixi宽1279.99994与1280严格相等误报，旧delivery保存于delivery-before-viewport-normalization.json，按既定0.01px视口容差修正。应用冻结未受这些harness修订影响。

最终性能72正式+12预热，四格对c68541d +0.26%/−0.93%/+5.22%/+2.33%，无确认批；旧基线896.6ms保留。155文件冻结通过，23/23交付门禁通过。两front的派生是生成结果之后的手工平移；scripts/create-office-art.mjs不在白名单且保持原样，重跑旧生成器会覆盖该派生。初始化时根目录oot-platform导入和首次pointer前EventBoundary rootTarget问题已在harness修正，最终数据使用修正后的探针。