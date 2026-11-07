# UI / 美术固定源码试玩包

源码 **5b7e5effbe7fe2d3ee4f001dc08cf41a25590287**；分支codex/m1-foundation；engine0.11.0 / contentm5-1。

- ZIP：artifacts/out-of-tokens-5b7e5ef.zip
- 字节：13753442
- SHA256：aedf51e9192dcc240dd7291153ab5404db3e377279a6287c24349fce78fdfdcd
- manifest校验972文件，另含manifest.json自身，共973文件。解压到独立目录后再验全部通过。
- 桌面exe SHA256：1785fc20ca0f9bb04886bb7ee67e9e5f96ceddd5a23e4bc776b116d87bd13148
- Node24：解压进入out-of-tokens-5b7e5ef，执行`node start.mjs`，打开http://localhost:4173。不需要pnpm、不下载模型。
- Windows桌面：desktop/out-of-tokens.exe；需已安装WebView2，离线locked编译通过。这是开发构建，没有安装器/签名/发布渠道；本轮未重新执行原生桌面UI验收。

打包从干净SHA强制重建Web/DSH，再cargo build --offline --locked。Web/DSH build-meta与桌面exe来源/hash均纳入manifest。日志package-build-v1、package-verify-v1、package-extracted-verify-v1、package-runtime-v1；最后独立入口HTTP200，WebP MIME正确。临时qa夹具未入包。ZIP工具将若干依赖许可证的1980年前时间戳归一到1980，内容hash复验无变化。

27张运行时WebP共2474182字节；生产母版留源码仓库。来源/生成prompt规格随包art-provenance携带，UI验收和资产审计随docs携带。18个Rust依赖正文缺口仍是GEM-06 P3，不宣称许可证收集完整。

浏览器证据见browser-results.md。实际playtest-server离线刷新与推进已通过；Vite preview源离线白屏待查UI-OFFLINE-01。旧包使用各自历史验证器，新验证器要求新增构建元数据。

M05-03 P1开放、真人0/10、真实DSH安装共存未验收；三审报告属于9e48510，不批准本UI提交。历史包/日志/worktree不覆盖。
