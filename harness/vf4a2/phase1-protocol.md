# VF4-A.1 串行前置协议

1. 先修选中+焦点阴影合并，再完成隔离文件导入与模拟locked地图，最后仅一次24条探针归因。三项门禁结果落盘前不触碰Studio/Journal实现。
2. 用户确认：导入遵循现有内存载入契约，不覆盖手动档；验证LOADED、原手动档保持，再手动保存使槽位更新。非法/不兼容输入在同一顶部notice显示。合法文件来自隔离lab的真实导出，测试文件不含个人数据。
3. 实际Map卡片DOM为`.world-map > button`，没有`.map-card`类；以实际三按钮验证disabled与system-caption。锁定通过harness的Vite transform与`office-lab&vf4a2-locked`模拟，只改变锁定布尔值，无领域Command、产品文件不注入夹具。
4. 当前Vite CLI无cacheDir选项（已核对安装版本cli.js），测试启动器接受`--cacheDir`并传入Vite配置；每版本目录独立置于harness/vf4a2/.vite-cache，保留resolved配置日志。所有dev均用此启动器，不写共享node_modules/.vite。收尾只删除已核实在本证据目录内的临时缓存。
5. 归因版本040031e/当前A.1，dev standard/twelve。四组各一次180帧排除预热；仅一批6轮正反交替共24条正式样本，不追加确认或调参。同步head rAF与原普通异步探针并行；main transform只在原动态导入回调处标记vfMetricsLoadedMs，无产品main变更。记录firstCanvasRafMs、ordinary首帧、探针加载时间、rAF、可见性与模块响应。
6. 同机IAB1280×720、DPR1.0000000447034836、AC/性能电源/120Hz，前台rAF p50≤25ms。读数偏差不自动等于产品退化；只有24条实验证实探针引入系统误差才考虑改非生产探针，否则main/vf-metrics保持0diff。
7. JSON交互统一schema：每条均有data.bodyMetrics（clientWidth/scrollWidth/clientHeight/scrollHeight）、data.bodyRect、data.focusInDialog；无弹窗状态明确记录false，期望值由断言说明，禁止选择性过滤漏检。
