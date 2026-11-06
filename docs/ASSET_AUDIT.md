# AI-Village 只读初审
来源：相邻 dsh_plugin/packages/ai-village，2026-11-06。
src/core/roster.ts 确认 bluewhale/qwen/llama/mistral ID 全部存在。
src/art/paper-doll.ts 使用 Pixi Container/Sprite/Texture，部件pivot、层级和纹理驱动。
src/art/animation.ts 提供纯 samplePose 与显式delta Animator；常见动作可程序化实现。
assets/scenes/courtyard/manifest.json 有尺寸、hash及 approvedForRelease 标记；例如desk为721×430，不能假设所有图均符合GDD256像素部件预算。
包LICENSE为MIT，版权2026 DeepSeek/Nidofy；不能据此推定所有社区图片均已授权。
Git SHA只读探测受dubious ownership限制；未修改全局safe.directory，目标快照待核实。

复用清单：ID可采用；动画算法/纸娃娃渲染器可作为M1审计候选，需连同types与协议验证；图片、背景、音频暂不复制，逐资产溯源后才能接入。
本次没有复制任何外部代码或美术。M0不依赖资产审计完成。
2026-11-06补查：以仅命令级safe.directory读取相邻仓库HEAD=f4c2ac633d5ad5e9ee0f7c2cd66bd1af9fc90352；未修改该仓库或全局Git配置。此为补查时HEAD，不追溯声称第一次读取文件时的SHA已核实。
