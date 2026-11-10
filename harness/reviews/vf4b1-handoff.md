# VF4-B1 固定实现交接：代表工作角落

固定实现：`0a958b8259fa2e4e92da38a10fa5b6923de5b97a`。执行完成，暂停待 Gemini 独立只读复审；执行者不自行宣布 B1 独立 PASS。基线 `ec59d18ad41c2dc24d875578ae7851d6e3e0a3f4`，A4 实现 `3be52f46586047722e96f759975d36c0eb9ebaf7`。

## 已接收的前阶段裁决

用户转述的 Gemini A4 裁决为 PASS，P0/P1/P2/P3 均 0。VF4-A1/A2/A3/A3.1/A4 零资源 UI 全阶段 CLOSED / PASS。A4 修补前 `pre-final-focus/` 72+12 与最终 72+12（总计 144 正式+24 预热）的偏离已获独立认可；本轮不改写这些历史产物。用户引用记录 91a444d 在本地对象库不存在，本地记录是 ec59d18；实现 SHA 一致，此差异如实保留。

## 范围与实现

用户已明确确认：四开局为 DeepSeek（内部 bluewhale）、Qwen、Llama、Mistral，加 GLM 压力样本；standard 保持现有单屏，不引入 doubao 或双屏。

先测发现三个实际缺口：粗矩形命中透明空椅／桌脚外侧；显示器与部分面部贴图不透明边缘重叠；844×390 名牌重叠。`before-*` 16 条四视口记录和截图完整保留。

- basic-back、standard-back：**实屏核验通过 · 原样复用**。
- basic-front、standard-front：仅显示器 group `translate(82,-11)` → `translate(98,-11)`，水平 +16 world 单位；其他形状、材质、光照、阴影不改。源生成器未改，台账明确记录“既有生成结果 + 本次手工派生平移”，重新运行旧生成器会覆盖该派生，不能假称生成器已同步。
- office-scene-spec / office-scene：basic/standard 加载一次 alpha 命中遮罩（96/255 阈值，排除透明 padding 与低 alpha 地面阴影），其他六类家具保持旧命中方法；小比例电脑名牌分两行，保留 12px 字号；同排名牌微移避免重叠，底部按实际高度约束。
- vf2.test：新增 alpha 命中／阴影排除与独立副本、同排名牌分离、四视口四槽位镜头 world/screen 往返断言。

应用改动只涉及两个 scene 文件与两个 front SVG；scene.ts 无改动。整个 ai-village、packages、pnpm-lock.yaml 与六个封板 UI 文件全部 0 diff；未更改 slotPoint、角色母版／比例、Camera 算法、领域规则或生产夹具。

## 实屏与量化证据

证据目录 `harness/vf4b1/`，协议 `protocol.md`，资产台账 `corner-audit.json`。四视口为 1280×720 zh/light、844×390 zh/light、560×800 en/dark、390×844 zh/light；浏览器模拟视口，不是真实手机硬件。

208 个配置：每家具／视口 5 角色轮换 × 4 职责偏移共 20 个四人入座配置，另四人／十二人两组空闲与十二人两组入座，共 26；每例包含 overview、work-left、work-right、各样本 locate 和 reset。五位样本 × 四槽位 × worker/planner/tool 的实际覆盖由交付脚本验证。

共 1,704 条记录、7,008 条样本角色观察。最终几何断言全部通过；16 条修复前失败及复验映射保留。真实纹理逐显示像素 alpha 交集确认面部贴图未被 front 遮挡；名牌层级及矩形无交叠。画外裁切单列，隐去名牌为 null，不冒充可见。此指标不是五官语义分割，也不代表完整动态动作认证。

108 次真实浏览器点击：80 次五角色脸／身 + 28 次桌面和透明区；marker 为 pointer-events:none，仅用于定位真实指针，事件落到生产 Canvas，不调用回调、不合成 dispatchEvent。打开的真实档案标题或 OfficeEditor 验证路由。全部通过。

OfficeEditor 64 次有效往返：四视口 × 两家具 × 四入口镜头 × 保存／取消；预览交换 work-1/work-4，退出背景 size/position 逐字段精确恢复，焦点回 More。原始文件另保留 1 条 JSON 字段顺序导致的比较误报及复验。

40 张最终代表截图覆盖四视口、两家具、4 人 overview 和 12 人 overview/work-left/work-right/GLM locate；另有修复前及初次修复截图。典型入口：`screen-standard-12-844-work-left.png`、`screen-basic-12-390-locate.png`。

## 工程、性能与清理

`pnpm check` 完整通过：38 文件、313 测试；日志 `check-release.log`。155 文件最终冻结（151 源码／配置 + 四层 SVG）原始/LF 哈希匹配。冻结后没有 Web 源码或 public 变更。

本轮不能复用 A4 性能，因为源码和两个 SVG 发生变化。最终冻结后完整采集三版本 × dev/preview × standard/twelve × n6 = **72 正式 + 12 预热**，没有确认批；版本和场景正反交替，异常值不删除（含旧基线 896.6ms）。四格相对 c68541d 中位数：dev standard **+0.26%**、dev twelve **−0.93%**、preview standard **+5.22%**、preview twelve **+2.33%**。均 <=+10%，不触发唯一确认批。只测 observedControlsAndCanvasMs，不是完整 assetsReady。全部前台 visible，1280×720，rAF p50 <=25ms。

正常 production 构建已恢复，dist 零诊断探针；5181–5186 无监听，本轮专用缓存已删，浏览器视口恢复且测试页关闭。`delivery-verification.json` **23/23 true**。构建与清理细节见 `build-log.md`。

## 证据修订与限制

- 一次文件临时占用及一次浏览器批次超时；已保存记录保留，未保存批次不计完成，按持久队列重试；部分重复记录保留，不择优。
- SVG 逻辑画布 280×240，浏览器源 raster 175×150，hit mask 280×240。早期 raster.bbox 不是 world bbox；台账按实际尺寸换算，后续显式记录 pixelBBox/worldBBox。面部采样从始至终使用真实 texture/worldTransform。
- CSS 浮点字符串比较误报在 `analysis-before-css-normalization.json`；Pixi screen 1279.99994 与 1280 精确比较误报在 `delivery-before-viewport-normalization.json`。映射／视口按 0.01px 容差；编辑器恢复仍逐字段精确比较。
- 初始化 harness 时曾修正根目录包导入解析和首次指针前 EventBoundary rootTarget 未设置；未改应用领域代码，最终采集使用已修正隔离 harness。
- 家具 SOURCE.txt 声明项目原创并引用 repository license，但根目录无 LICENSE；台账保留原文，不能推定额外再分发许可，也不能借用 ai-village 的 MIT 来覆盖家具。
- 主光与接触阴影保留既有资产，通过实屏目视检查，无无证据重绘。源 SVG、派生、固定 SHA、bbox、命中方法与加载成本均在台账。

## 继续开放

VF4A2-PERF-01 保持 CLOSED（A3 n6 等样本闭合，历史小样本保留）。VF31-PERF-01 完整性能预算（冷缓存、完整 assetsReady、GPU 纹理上传、长会话内存驻留、输入延迟、低端移动真机）保持 OPEN。

其他六类家具 whiteboard/coffee/sofa/dining/reading/server、其余七角色全姿态、完整走近／入座／离开动态、VF4-C 食堂／图书馆／章节背景、Stage B 版本专属立绘、完整 Visual Freeze 1、真实 DSH 端到端冲突流、SW 更新全分支、200% 系统字体保持 OPEN / HOLD。B1 单批证据不替代这些认证。

只做本地固定实现提交和四份文档 SHA 回填提交；完成即暂停，不 push、不部署、不进入 B2/C。

复核请在可丢弃检出中运行 `node harness/vf4b1/freeze-source.mjs --verify --read-only`、分析／台账／交付脚本及必要实屏复验；生成脚本会覆盖对应输出，不应直接改固定证据。完整操作入口和诊断口径见 protocol。独立复审应检查来源、实际覆盖、前后同视角、生产无探针和保护路径，不只读取执行者汇总。
