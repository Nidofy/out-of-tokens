# VF4-B1 Gemini 独立只读复审

请仅复审固定实现 `B1_IMPLEMENTATION_SHA_PENDING`，基线 ec59d18ad41c2dc24d875578ae7851d6e3e0a3f4。不要修改、提交、push 或部署；不要启动 B2/C。完整交接见 `vf4b1-handoff.md`，原始证据在 `harness/vf4b1/`。

前置 A4 用户裁决 PASS，VF4-A 全阶段 CLOSED/PASS，144+24 历史偏离获认可。用户批准四开局 DeepSeek/bluewhale、Qwen、Llama、Mistral + GLM，现有单屏 standard；不要求不存在的 doubao 或双屏。

请独立确认并给出 PASS / CONDITIONAL PASS / FAIL 与 P0/P1/P2/P3：

1. 先测后修：before 四视口 16 条失败与同视角 final 的遮脸、透明命中、横屏名牌修正是否真实；back 是否原样复用；front 是否只有显示器 +16world x；未盲目重绘。
2. 白名单：应用只改 office-scene/spec、basic-front/standard-front，测试仅 vf2；ai-village、packages、lock、六个封板 UI 严格 0 diff。生成器未改的派生链限制是否记录清楚。
3. 台账：来源/许可证原文与根 LICENSE 缺失限制、字节/SHA、280×240逻辑与175×150源纹理、bbox、slotPoint、前后层、alpha命中与加载成本正确。不要把 SOURCE 声明当作新许可证。
4. 208 配置／1,704记录／7,008样本观察：五角色四槽位三职责、空闲、4/12人、四视口与 overview/work-left/work-right/locate/reset 是否覆盖；画外对象不冒充可见；face alpha 与实际绘制层级一致，名牌无重叠。看代表截图与实际尺寸，不只看布尔值。
5. 108 次真实指针点击及64次OfficeEditor保存/取消恢复：不能仅把hitTest查询当真实点击；核对dialog标题、透明区、逐字段背景样式和More焦点。
6. 155文件冻结先于性能，pnpm check 38/313，生产无探针，清理端口/缓存/视口/标签页。23/23门禁是否由原始证据计算；历史失败、字段顺序/CSS/Pixi浮点误报及中断重试未删除。
7. 性能新批72+12、三版本四格n6、环境可见，异常值保留；相对c68541d +0.26%/−0.93%/+5.22%/+2.33%，未触发确认，未复用A4批。不得将首控件+Canvas冒充完整assetsReady。
8. VF4A2-PERF-01 CLOSED；VF31-PERF-01、其余六家具、七角色全姿态、完整动态、VF4-C/Stage B、Visual Freeze 1、真实DSH、SW全分支、200%字体仍OPEN/HOLD。只交B1，不自动跨阶段。

必要重跑请使用可丢弃检出，保留固定原始证据；先读 protocol.md 和 scripts。请报告具体文件、行号、复现和影响；将 harness 口径问题、产品缺陷和既有开放风险分别说明。
