# VF4-B2 工程与交付门禁（2026-11-11）

基线69b8d83，B1实现0a958b8独立PASS已登记三份状态文档；B1证据只读。B2等待独立复审。

1. 修前四视口记录发现白板/咖啡台遮住空闲角色、旧命中框漏支腿/误中透明区、横屏名牌右侧重叠；保留68条before失败。首次站位修正仍有3条显示器边缘遮挡，first-fix保留并再次最小修正。仅两个scene文件及vf2测试变化，16office SVG均0diff。
2. `pnpm check`完整通过，38文件316测试；日志check-release.log，含类型/lint/test/Web与DSH构建。之后无应用/测试/资源修改。
3. 208正式配置、1922记录、8020正式样本观察（包含重复），320会议座位职责组合。最终/补复验零失败；71条历史失败均有明确映射。140真实指针记录含1条探针误选的false与后续通过，64编辑器往返通过；40张最终代表截图及同视角前后对照保留。
4. 151源码/config加全部16office SVG，共167文件最终冻结；原始/LF哈希verify通过。三版本visual-review构建日志040031e/c68541d/current-review-build.log。
5. 首批72正式+12预热：对c68541d四格-2.60%/-3.74%/-4.39%/+12.69%。触发唯一完整确认72+12：+1.48%/+3.74%/-2.34%/+2.44%，均<=10%。实际144正式+24预热，不混合不删高值。两批均冻结后、前台1280×720、rAF p50<=25ms，每格n=6。停止性能采样。
6. 关闭交互及三版本性能服务；`pnpm --filter oot-web build`恢复正常production，build-production.log通过。dist诊断扫描为空；5181–5186无监听；核实绝对路径后删除harness/vf4b2/.vite-cache。浏览器视口reset、测试tab关闭、恢复隐藏，见cleanup.json/browser-cleanup.json。
7. `node harness/vf4b2/verify-delivery.mjs`交付25/25 true。检查白名单/保护、全部SVG复用、167冻结、schema、最终几何/失败复验、208矩阵/320组合、点击/往返/截图/台账、lounge-4排除、性能批平衡/确认规则/门槛/环境/预热/时间顺序、完整check、生产/端口/缓存/浏览器。补充pointerResolved索引后再次派生验证，未改原始数据。
8. 一次文件写入问题、一次标签丢失、两次工具超时按持久队列恢复；已落盘重复保留。首修失败与探针分类误判分别记录，不把它们包装为原实现已通过。源码冻结后仅改文档/证据统计，不重冻、不重采。

最多两次本地提交：实现/证据，随后STATUS、CHECKPOINT、handoff、review prompt四文档SHA回填。最终只读freeze校验及git status；不push、不部署、不跨B3/C。仍开放边界与许可限制详见handoff。
