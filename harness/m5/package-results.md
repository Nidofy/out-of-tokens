# M4/M5 新试玩包

源码9e485100dfe22e31a6894022f3664e971c4818b7；0.10.0/m5-1。独立目录artifacts/out-of-tokens-9e48510；ZIP6203568字节，SHA256 88bfcf5d3259c1dd8d91ab5504a8a013ab96068257ad462c8e860759c1611259。

manifest901文件，包括Web/DSH/Windows开发构建/原始许可证/说明/示例对话包。独立解压至artifacts/verify-9e48510，verify-playtest退出0；包内node start.mjs本地HTTP首页200，服务器已停止。新包PWA离线停服重载未在本轮重测，不能套用旧b5d1365证据。

Windows exe SHA256 c070de24be8cb3c1981b4493a90ba30398b12b6dc50346efc1bbeffd162a1e46；本机离线cargo build --locked通过。WebView2原生窗口computer-use实测首屏/Pixi、英文、manual-1保存、Ctrl+R刷新后载入通过。仅Windows，未做全平台、卸载安装器或Steam验证。

Cargo锁427项，258本地来源可用并复制Cargo.toml和许可证，169其他平台/未用项如实列sourceAvailable=false；对cargo tree --target x86_64-pc-windows-msvc实际依赖核查，缺失来源0。原始文件mtime早于1980的ZIP条目时间被压缩工具截为1980，字节hash验证仍通过。

旧包与旧manifest未修改。游戏Token不对应真实API费用；无模型下载、外部请求或真实DSH安装。M05-03、真人0/10及真实DSH/完整GDD验收边界见M5_ACCEPTANCE。
