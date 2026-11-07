# AI Village 原版 Q 角色试玩包

固定源码 **2b47242f236683b540faa6b1885d6267cf98c9f7**；codex/m1-foundation；engine0.11.0/contentm5-1，视觉资源ai-village-chibi-v1。只本地生成。

- ZIP：artifacts/out-of-tokens-2b47242.zip
- 字节：88904715
- SHA256：a4319d41c30b7d78653f47c56bcb1134e9bf3dcd0208af2abb0f8260e1ca90a6
- manifest校验1296文件，另含manifest.json自身，共1297文件；独立解压复验全部通过。
- 桌面exe SHA256：958b5f263edf8f31f3fbd9c2eed58afbc4596fc0421239d5d8c799bf479af35c
- 解压进入out-of-tokens-2b47242，Node24执行`node start.mjs`，访问http://localhost:4173；不需要pnpm或模型下载。
- Windows桌面入口desktop/out-of-tokens.exe，需已有WebView2；离线locked开发构建，不是签名安装器。本轮未做原生桌面UI重验。

构建来自干净固定SHA，Web/DSH build-meta及桌面hash均通过验证。最终独立入口HTTP200，原PNG MIME正确；临时窄屏夹具未分发。打包/解压/运行日志同目录package-*.log。Zip时间戳归一警告不改变文件内容。

完整包同时含Web、DSH资源与嵌入美术的桌面应用；原始PNG角色资源约25MB，本轮优先保真复用，完整ZIP约89MB。历史5b7e5ef/9e48510/b5d1365包均保留，旧12张新设计角色只在源码生产档案保留，当前运行时全部切换原AI Village角色。

本轮统一由Gemini复审：harness/reviews/gemini-unified-2b47242-prompt.md。M05-03、真人0/10、真实DSH、UI-OFFLINE-01及既有P3未关闭。
