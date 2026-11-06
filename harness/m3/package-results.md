# 分发包验证

固定源码SHA：b5d1365355cba2d09ae50ecde9ff382bebe1af12。游戏工程SHA：afe87343cca5eb3460ad4b23f30b10f1346d99ca；后一个提交仅修复打包父目录创建并记录检查点。

包：artifacts/out-of-tokens-b5d1365.zip；863819字节；SHA256：10e49a1c35646a3ecfd91e4264be09a802c4d9786551eaca1c96186d86f490aa。
解压目录manifest.json绑定完整源码SHA和211个文件哈希；verify-playtest全部通过。包包含Web、独立Node24静态启动器、DSH bundle、内容JSON、说明和原许可证。156份依赖许可文件是含构建工具的超集，不声称全部进入运行时。

ZIP已实际解压到artifacts/zip-verification-b5d1365，重新校验全部211文件通过，退出0；证据package-verify.log。

实际运行包内node start.mjs（无需workspace模块），IAB localhost:4173正常呈现。停止该进程后，HTTP探测确认服务器不可达；浏览器刷新仍由缓存打开，推进上午→下午成功。截图packaged-offline-overview.png。此前存在旧SW，点击更新后页面未立即刷新；手动刷新后提示消失，保留P2 PWA-01复核，不声称自动刷新成功。

实际从分发目录动态import dsh/dist/index.js；新建OS临时Profile→apply注册处理器→dispose完成，无workspace运行时导入；测试Profile已移除。未在真实DSH安装，未读取用户存档。所有本轮本地测试服务结束后已停止。

附加观察P2 WEB-03：结束开发服务器时发现先前test-fault=storage触发的STORAGE_UNAVAILABLE未处理Promise日志。界面仍按设计降级、可导入导出，正式包不含test-fault入口；需复核BrowserSaves构造时拒绝到effect挂载之间的时间窗。另一个HostSaves尚未构建时的HMR导出错误属于编辑中间态，最终生产构建/测试已通过，不当作分发缺陷。
