# Gemini 独立复审 Prompt：VF31-PERF-01归因 + VF4-A系统弹窗试点

请作为独立审查者审核以下固定实现，给出明确裁决，并在报告末尾提供一份**用户可原样转交Codex执行的完整Prompt**。不能只给结论或“继续推进”的笼统建议。

## 仓库与固定范围

- 本地仓库：`D:\Documents\FeiyangChen\devApps\ai-game\out-of-tokens`，分支`codex/m1-foundation`。
- 本轮固定实现SHA：**`d3e0c87d96bf4fe3baa77ab745163d8baa9ca052`**，父`d00071ae8c06ad7adee7f1682634196f750d1c92`。随后记录提交仅有SHA/审查说明，不作为新的应用实现。
- 上一固定实现VF3.1：`c68541da920b346b02c11b8e27540024c8ea30a5`；VF3：`6f3a19122f4508004aeb1ae3bfe0c1387047e9dc`；长期性能基线`040031e`；保护基线`2bd6d40733d6ffcd575a3bbcef59d89f5887cf9f`。
- 最新用户授权原文：`harness/reviews/vf4a-user-handoff.txt`。请先读它，再读`docs/VF4_CHECKPOINT.md`、`docs/STATUS.md`和`harness/vf4a/attribution-gate.md`。Codex自评不是独立PASS证据。
- 只读审核应用，不替Codex直接改实现、不push/部署/调用付费模型。可在安全独立目录运行必要检查；不要在共享依赖junction的历史worktree中install或递归删除依赖。

## A. 前置归因与门禁顺序（重点）

上一轮裁决为A1/A2/A3 PASS，VF31-PERF-01 OPEN/HOLD。历史dev twelve确认批对040+24.69%、对VF3+24.37%，奇偶双峰约两帧；旧dev standard波动未闭环。必须先判断本轮归因是否充分支持**限定的零资源系统弹窗组**，而不是仅看新的百分比。

检查：

1. `performance-attribution-protocol.md`、`attribution.config.mjs`、`attribution-probe.js`和54条`dev-attribution.json`，三基线dev standard/twelve及preview twelve、模块Entry/HUD提交/场景导入/Pixi初始化/首sync/首canvas、模块数/末响应、longtask、奇偶中位数。判断标记语义、注入位置、并行阶段与观测开销是否正确，是否漏掉真正运行时退化。
2. `effect-experiment.json`24条及其预热/汇总：一次只改Scene effect到layout effect的机制实验，是否能支持等待与CPU成本的区分。此改动未进入生产。scene-navigation没有合并，理由是其响应早于入口、末端是已有模块；请核验，不把“新增一个请求”当自动因果。
3. 前台校准visible但rAF约1000ms，用户保持窗口前台后恢复8.3ms。environment-before/after与排除校准记录均在harness/vf4a。不得从新环境推断旧24.37%全部是遮挡；初期共享junction缓存rename EPERM日志也保留，请评估对正式记录的实际影响与可比性。
4. `attribution-gate.md`在产品改动前给出的限定门禁，是否有过度推断。若归因仍不足，明确指出缺失证据、应维持/收紧的HOLD及下一次最多一项可归因实验，避免无限跑分。

## B. VF4-A实现与UI方向

审查`git diff c68541d d3e0c87 -- apps/web/src apps/sim-cli/vf2.test.ts`。应用只改dialog.tsx/alpha-app.tsx/vf1.css，新增4项逻辑测试。范围是Saves/Settings/Map，不允许重排S2/S3、四个抽屉或生产新资产。

- Saves：固定ID的3手动/1自动/5备份、乱序/部分返回不误配档、零时间戳、空槽禁载入、busy禁用；分组/默认折叠备份/12px时间/44px按钮及文件控件；单一顶部反馈、EXTERNAL_CHANGE暂停告警、更新按钮、DSH只读核对路径保留。
- Settings：中英/深色/减少动态的真实状态、aria-pressed与文字值、选中和蓝色焦点环不同语义；Settings→Saves替换模态的焦点所有权，关闭后回到稳定“更多”入口。
- Map：三场景当前状态/禁用说明、28×32 Portrait map变体；旅行关闭且镜头重置，不新增领域命令。
- Dialog：原生showModal从effect改到layout effect，清理微任务避免恢复焦点到替代模态之外；验证Escape/×/不可取消事件、S2/S3焦点没有回归，背景scene-tools/scene-presence/studio-dock按契约隐藏，模态关闭不复活旧位置列表。
- 设计复用表：20/14/12字级、16/12/10圆角、纸面/边框/间距/滚动/44px、双焦点环、禁用态与页面影响是否准确。保持暖木+暖白/深褐纸面+深胡桃工具+黄铜细饰，不能称整体Visual Freeze 1已冻结。
- 选中态发现与修复：settings-1280/map-1280是中间问题图，最终图是同名前缀加-final；不要用旧图误判当前修复，也不要忽略它揭示的CSS级联风险。

## C. 实机、自动化与性能证据复核

`harness/vf4a/interaction-results.json`共31条观察及对应PNG；1280×720、390×844、560×800英文深色、844×390。核对Saves保存/载入/全局告警/滚动/文件控件焦点，Settings三类切换及转Saves，Map旅行和头像。回归390布置取消镜头同值、位置Escape触发器焦点、Qwen局部错误关闭重开清除。

本轮只验证文件控件尺寸和可达性，未做真实文件导入/导出回环；真实DSH/更新提示全分支、Map全部锁定状态、S2完整矩阵、逐显示帧零闪烁、200%字体/低端真机均未声称完成。判断哪些必须成为本检查点阻断，哪些可列后续，不能把缺测默认为PASS。

自动化最终check-final.log：38文件303测试，类型/lint/Web/DSH构建通过。delivery-verification初检false源于把DOMRect当scrollWidth对象，初检保留、脚本修正后PASS；原始交互数据没有改。不要把单元逻辑测试当作浏览器行为测试。

正式性能：source-freeze.json于UTC02:01:02.946冻结151文件原始/LF哈希，后续source-freeze-verified.json零变化；implementation-verification验证固定Git blob。performance-protocol、startup-warmup-excluded（12组180帧）、startup-balanced（72）、startup-confirmation（唯一一次72）、startup-summary及脚本可复算。

| 模式/场景 | 首批对040 / c685 | 确认对040 / c685 |
|---|---:|---:|
| dev standard | +16.85% / −2.56% | +6.81% / +7.45% |
| dev twelve | −11.24% / −3.54% | +2.10% / −4.08% |
| preview standard | −10.80% / −8.65% | −8.41% / +1.58% |
| preview twelve | −10.07% / +1.71% | +4.78% / +1.71% |

首批dev standard越10%触发唯一确认，不能只引用确认批关闭风险。这是首HUD+Canvas rAF指标，未涵盖全部纹理/GPU/输入或冷缓存。阶段诊断与正式批协议不同，不能直接混合统计。请分别裁决“试点增量性能”和“历史/完整门禁”，VF4-B/C仍HOLD。

## D. 保护与复现

核对固定实现保护路径0diff：

```powershell
git diff 2bd6d40733d6ffcd575a3bbcef59d89f5887cf9f d3e0c87d96bf4fe3baa77ab745163d8baa9ca052 -- packages pnpm-lock.yaml apps/web/public/art/ai-village
git diff d00071a d3e0c87 -- apps/web/public
git diff d00071a d3e0c87 --check
```

engine0.16.0/content office-2；禁止改变RNG、经济、Command和存档格式。PNG仅harness证据，产品资产无diff。清洁证据cleanup/browser-cleanup：默认生产无vf-metrics/vf-startup/vf-attribution，端口5181–5186无监听，浏览器恢复；基线worktree/junction保留。

复现应用：在安全的固定SHA检出运行`pnpm check`，`pnpm --filter oot-web exec vite --host 127.0.0.1 --port 5181 --strictPort`。使用`?office-lab=initial&motion=still`（中浅色）、增加`locale=en&theme=dark`（英文深色）。全局告警额外`test-fault=storage-events`，打开Saves后Ctrl+Shift+F9。测试结束清理自己的服务和标签，不读写真实玩家档。

## 报告格式与必须交回Codex的Prompt

请按以下顺序输出：

1. 总裁决 PASS / CONDITIONAL PASS / FAIL；A归因门禁、B系统弹窗、C增量性能、D保护范围分别裁决；明确是否接受本轮进入VF4-A、是否继续阻断VF4-B/C。不要自动放行全站/资产/新玩法。
2. Findings按P0–P3排序，每项包含稳定问题ID、固定SHA文件/行号、触发条件、期望/实际、证据、最小修复建议与验收条件；无问题也说明审查覆盖和未验证项，勿虚构实测。
3. UI定调表：已接受/需返修/留后续，明确系统弹窗试点与整体Visual Freeze 1的边界。
4. 最后用独立代码块给出**完整“交接回Codex的执行Prompt”**，必须包含仓库/分支/本轮固定SHA/保护基线、逐项裁决、优先级与依赖顺序、可修改文件白名单、禁止范围、修复任务与可复现验收、性能停止条件/采样上限、需保留的风险、是否只修到VF4-A.1或允许哪一个具体下一检查点、两次本地提交和暂停规则、下一轮Gemini审查Prompt产出要求。若无修复也应明确仅记录通过并等待用户下一批授权，不能空泛地说“按建议推进”。

保持禁止push/部署/付费模型、禁止未获授权资产生产。最终执行权在用户与Codex，审查报告不自行扩大授权。
