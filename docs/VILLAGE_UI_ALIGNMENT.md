# AI Village UI 对齐（2026-11-09）

用户要求正式游戏场景铺满屏幕，UI以透明浮层覆盖，并严格采用AI Village插件风格。本次纠正O0–O3中为HUD预留画面空间的实现；经营规则、存档和内容版本不变，仍为engine0.15.0/content office-1。

## 直接依据

只读来源：`D:/Documents/FeiyangChen/devApps/dsh_plugin`，HEAD `f4c2ac633d5ad5e9ee0f7c2cd66bd1af9fc90352`。

- `packages/ai-village/src/client/Hud.tsx`、`Floating.tsx`：全尺寸场景、独立浮层、默认隐藏工具内容。
- `content-style.ts`、`PanelShell.tsx`、`ui-theme.ts`、`src/core/ui-v11-contract.ts`：实际在用样式和材质数值。
- 视觉参照：`art/QA/ui-v11/performance-scenes/ui-v11-expanded.png`。
- 样式/部分矢量图标据MIT来源适配；原许可证已随Web发布在`public/PAPER-DOLL-LICENSE.txt`。邻库没有修改。

## 已完成台账

| 项目 | 实现 |
| --- | --- |
| 全屏场景 | 背景和Pixi实体共用cover矩阵，画布与裁剪区覆盖整个视口；移除顶部255/300、底部180、右侧340的预留。超宽屏以地板底边为基准裁剪顶部，不产生空白边栏。 |
| 原版HUD结构 | 顶部40px透明控件、时间/简短资源信息；底部四个入口288×48px，无底板、边框、阴影和模糊，保留文字与焦点。手机收起额外文字与资源数值。 |
| 浮窗材质 | 原版浅色rgba(255,248,235,.68)、深色rgba(57,51,47,.74)，14px blur、1.08饱和度、16px圆角、12px边距。只模糊面板背后区域，不模糊整张场景。 |
| 按需信息 | 看板/开业手册由左上消息入口打开；视角、更多、存档和设置按需打开。取消常驻大标题、品牌卡、资源大卡、布置按钮和初始提示横条。 |
| 面板导航 | 桌面侧浮窗320px/最大360px高；窄屏底部浮窗最大360px宽/320px高。普通面板打开不改变场景尺寸和镜头。Escape关闭工具浮窗并恢复触发按钮焦点。详情打开时隐藏下层面板，关闭后恢复。 |
| 布置模式 | 原场景常驻，顶部工具和底部家具工具浮在画面上，透视槽位使用同一个镜头矩阵。手机选择家具时显式聚焦该家具，保证选中物品在工具区上方可见；保存/取消后恢复之前的经营镜头。 |
| 原流程 | 购买、预算、锁位、保存/取消与命令流保持。实测手机5000−180=4820、4工位，保存后更多菜单显示结果。 |

本文件取代OFFICE_O0_O3中的旧HUD安全留白方案。O4效率/摸鱼、O5工作台玩法和O6性能队列不在此次UI修正范围。

## 验证与证据

- 基线及最终全量33文件213测试通过；类型/lint/Web与既有DSH构建通过。最终日志`harness/village-ui-check-final-v3.log`。
- 原镜头测试改为验证390×844、680×900、1280×720、1920×1080、2560×1080及五个区域的全视口覆盖、无HUD留白和工作区可达。
- 实际浏览器：桌面开关看板，canvas1280×720、背景1280×720/0,0不变；HUD rgba(0,0,0,0)，看板rgba(255,248,235,.68)、blur(14px) saturate(1.08)。
- 手机390：初始全屏四人场景、更多、视角/Escape返回焦点、布置补购/保存、4工位结果；平板680：英文/深色/减少动态、更多/伙伴/角色详情，scrollWidth=680；深色面板rgba(57,51,47,.74)。
- 超宽2560：scrollWidth=2560、canvas2560×1080、背景2560×1440且y=-360，HUD/dock完全透明。工具的宽幅完整截图有裁切限制，保存右侧补片，不宣称裁切图覆盖完整视口。
- 截图位于`harness/village-ui/`：desktop-scene-final、desktop-board、desktop-arrange、mobile-scene、mobile-arrange、tablet-dark-more、tablet-dark-team、tablet-dark-dialog、ultrawide-right。
- 调整过程中出现一次未使用参数lint错误、一处旧layoutZone引用类型错误，均修复。热更新删除临时slotCamera导出时产生一次模块切换错误；后续正常页面已渲染，新标签冷启动结果独立记录在cold-start.json，不隐去原错误。
- 使用DEV隔离内存会话，没有写入玩家存档。无push、部署或原插件安装变更。

复现：`pnpm dev:web`，打开 `/?office-lab=working&animation-time=1`；手机初始用`office-lab=initial`，英文深色用`locale=en&theme=dark&motion=still`。生产不启用夹具。
