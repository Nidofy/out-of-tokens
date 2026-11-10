# Gemini 独立只读复审：VF4-A4

请只读审查固定实现 `A4_IMPLEMENTATION_SHA_PENDING`，起点bb2fa10e2598b0dc1eff1dab2051ba0685c9ee75，分支codex/m1-foundation。随后记录提交仅回填四份文档SHA；不要将浮动HEAD当实现锚点。不要修改代码或证据，不push、部署或启动VF4-B/C。以实际diff与原始数据裁决，允许PASS/CONDITIONAL PASS/FAIL并给出P0–P3、精确路径、复现步骤及最小修复。

先读vf4a4-handoff.md、docs/VF4_CHECKPOINT.md当前节、harness/vf4a4/protocol.md。既有VF4-A3/A3.1独立复审PASS已确认，Actors/S3封板；VF4A2-PERF-01保持CLOSED。A4尚无独立裁决，不把执行者的门禁全绿当最终PASS。

重点：

1. 白名单仅alpha-app、commission-workbench、office-editor、vf1.css、vf2.test及允许文档/harness；零新资源/规则/依赖。packages/lock/public两个保护基线零diff，共享UI/renderer零diff；S3以已通过起点bb2fa10保持零diff（character-profiles.ts实际路径；旧d3基线早于A3）。
2. Jobs数量、三分组、搜索/各空态与纸面字阶；通用路由焦点不抢已打开dialog，Jobs→Studio和Studio→Actors四视口直接一次Escape精确回原Dock。
3. S2 posted（澄清/下一时段/夜间/范围）、accepted/working、waiting、review/返工/交付、delivered/breached；三栏/三步草稿保留、关闭清理、非法与合法试算/派遣、单一S1回执；控件44px与底栏不遮正文/error。检查夹具为隔离内容，不是生产规则变更。
4. Office可读双语slot名仅展示、原ID与Command不变；SVG键盘/交换/仓库/预设/采购撤销/占用锁；More和Studio入口保存/取消后的焦点；非默认镜头分区与.workshop style恢复，尤其渲染提交后的effect时序与Dock索引解析。
5. 261条原始记录均检查schema，12条失败保留并有明确复验，不忽略缺字段；查看截图与几何而非只信checks。另检查a4-no-posted四视口零待接单数量、双语专用空态与零卡片断言。
6. check-release.log完整pnpm check 38/310；151文件raw/LF冻结；最终72正式+12预热每格n6、交替次序、可见/rAF条件与时间在最终冻结之后；复算四格+2.82%/+0.56%/+4.89%/-0.40%，无需确认批。
7. **审查执行偏离**：pre-final-focus保留一个较早冻结版72+12；因后续保存焦点补修失效，重新check/冻结后采最终批。实际总量144+24，没有确认批，不是全程只采72；两批不得混合或择优。请明确评价额外批次与证据链，不能因最终结果好就忽略它。
8. delivery-verification20项、生产dist无探针（需要时在可丢弃检出重建）、5181–5186关闭、缓存删除、浏览器恢复。根AGENTS的build-log在白名单内harness/vf4a4/build-log.md记录；旧A3采样/验证证据零改动。

不得提前关闭：VF31-PERF-01完整冷缓存/assetsReady/GPU/长会话/输入/低端真机预算、完整Visual Freeze 1、VF4-B/C/Stage B版本专属立绘、真实DSH冲突、SW更新全分支、200%字体。输出总体裁决、逐项发现、数据/矩阵完整性与是否允许下一阶段；不自行生产或替换美术资产。
