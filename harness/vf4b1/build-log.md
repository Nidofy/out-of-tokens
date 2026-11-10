# VF4-B1 工程与交付门禁

2026-11-10。基线 ec59d18 / A4 实现 3be52f4。用户最终裁决 A4 PASS 已登记，既有 A4 证据不变。B1 等待独立只读复审。

1. 四视口修复前16条实测，发现显示器边缘遮脸、透明区误命中、横屏名牌重叠；只修改允许的两个 scene 文件、两个 front SVG 与 vf2 测试。
2. 定向 vf2 32项通过（check-focused.log）；typecheck-first.log通过；完整 `pnpm check` 38文件313测试通过（check-release.log），包括typecheck/lint/test/Web与DSH构建。无后续应用或测试修改。
3. 浏览器208配置、1,704记录；7,008样本观察；108次真实点击；64次有效OfficeEditor往返；40张最终代表截图。16条before失败、1条编辑器字段顺序误报及复验保留。详见analysis、pointer-click-results、office-roundtrips、corner-audit。
4. 155文件冻结后 `--verify` 原始/LF无差异；三版本visual-review构建日志为040031e/c68541d/current-review-build.log。
5. 新批72正式+12预热；没有确认批、没有额外性能重采。四格对c68541d +0.26%/−0.93%/+5.22%/+2.33%。完整数组、环境和统计在startup-*。旧基线896.6ms不删除。没有将冷缓存或纹理上传纳入本指标。
6. 停止隔离交互服务和三版本性能服务；`pnpm --filter oot-web build` 恢复正常production，见build-production.log；扫描dist无vf-metrics/vf-startup/b1诊断。5181–5186监听为空；验证绝对路径后删除harness/vf4b1/.vite-cache；浏览器reset viewport、close tab、restore hidden。cleanup.json/browser-cleanup.json记录结果。
7. 交付验证器23/23 true：白名单、保护路径、冻结、schema、最终几何、失败复验、208配置、角色槽位职责覆盖、实际点击、Office往返、截图、资产台账、性能平衡/规则/门槛/环境/预热/冻结顺序、完整check、production、端口、缓存、浏览器。
8. 初次交付覆盖检查用浮点精确比较导致误报：Pixi宽1279.999942而浏览器1280；旧结果保存在delivery-before-viewport-normalization.json，按协议0.01px容差修正。编辑器样式仍逐字段精确相等。所有此类修正仅harness，不改变冻结源码。

初始化harness导入解析与EventBoundary初始化、一次Windows文件占用、一次浏览器批次超时都在protocol/handoff说明。未落盘批次按持久队列重试；不隐去重复记录。源raster bbox诊断修正与许可限制亦明确登记。

最多两次本地提交（固定实现/证据、四份文档SHA回填）；不push、不部署、不跨B2/C。未关闭风险见handoff。
