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

M1.0补查：相邻仓库仍f4c2ac633d5ad5e9ee0f7c2cd66bd1af9fc90352，Pixi8.22.0兼容当前版本。只读研究部件层级和动画协议；本次scene.ts使用原创Graphics/Container/Text程序化场景与4角色，没有复制代码、社区图片或音频。三场景正式资产及8角色纸娃娃复用仍需逐项授权核对。

M1纸娃娃程序复用：邻库dsh_plugin完整SHA f4c2ac633d5ad5e9ee0f7c2cd66bd1af9fc90352，packages/ai-village/LICENSE为MIT，Copyright2026 DeepSeek/Nidofy。逐件复制src/art/paper-doll.ts与types.ts至apps/web/src/art，许可证随Web发布目录PAPER-DOLL-LICENSE.txt。复用层级/pivot/Pose动画，部件由本项目Graphics绘制；无外部人物纹理/图片/声音复制。8角色版本为原创程序配色与配饰，仍需要艺术品质人工验收。
