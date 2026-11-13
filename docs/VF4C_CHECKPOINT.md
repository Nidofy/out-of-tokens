# VF4-C checkpoint — 2026-11-13

## 2026-11-13 续测后的依赖状态

源码保持bc39ece，无额外业务修改；本轮正式性能首批36+唯一确认36已完成，确认四人assetsReady对c68541d为+13.42%，VF5继续HOLD。按用户停止条件，第三步8进阶立绘/14日夜背景/指针/代表性自然长局的最终集成回归仍未启动；不将旧848配置或四批美术截图称为本次最终failures为空。600秒长驻与200%系统字体也未闭合。新结果和Gemini审核交接在仓库外 ../commission-evidence/vf-closure-1113/resume-01/。下一步先独立复核性能差距及安全最小优化，VF5满足后再执行最终四视口×双语×双主题矩阵；不生新大图、不接入Tier2/3，不修改受保护角色资产或规则。

## 2026-11-13 收口实现后的状态

当前实现 bc39ecef8d24a69d5f5015cfefe1a72506c41767（基线b62b1ab）。本次第一步UI/清单修复已通过390英文亮暗及桌面/中文实屏。随后进行了命中掩码等价循环优化和两张背景请求LRU、取消alternate预解码；改变的是资源准备策略，不改图像、相机、骨架、alpha命中阈值或规则。新异步背景测试及完整42文件337测试通过，当前生产离线昼夜与单个进阶立绘实屏通过。

**第三步最终集成态VF4-C回归尚未开始**：用户明确暂时无法提供稳定前台负载，正式VF5性能/600秒长驻暂缓；系统字体控制授权超时，200%字体仍HOLD。严格按先第一步、第二步、再第三步执行，不把8进阶立绘、14日夜背景、指针和代表性自然长局状态的旧证据改称本次最终回归。不能宣称最终failures为空或VF4-C已封板。

本次所有新日志、截图、报告在仓库外 ../commission-evidence/vf-closure-1113/；vf5-verdict.json逐项记录PASS/HOLD与第三步未启动。保护路径零diff，未生成新大图或接入Tier2/3。后续只有在第二步满足门禁后才冻结最终代码并重拍集成矩阵。以下1745653的SVG/背景原样复用及848配置是历史实现记录；当前b62b1ab四批美术已是WebP/日夜背景，勿混用资产代际或验收结论。


Baseline: 73035787a535b3b7c5e488f8619114fd836b2c9b. User explicitly allowed the minimal Stage A to Stage B resolver transition. No rule/version/economy changes.

Implementation: character-profiles.ts selects eight authored advanced images, retaining original images for base/unknown/mismatched versions and preserving return fields. partner-profile.tsx is unchanged. Stage B is a derived pose assembled from original licensed parts, not new costumes. See art/stage-b/README.md and the public manifest for source/output SHA256, pose, source commit and exact MIT notices. Existing canteen/library and five chapter backgrounds remain unchanged; source records are art/studio-v1/manifest.json and external background-reuse-hashes.json.

Scene fixes: public characters use two six-person rows with space for faces/nameplates and the desktop dock. Chapters 1–4 idle characters now avoid installed basic/standard desks; chapter 0 base placement is unchanged. Labels that would cover an actual face search nearby unobstructed positions without shrinking or hiding text. Existing labels otherwise retain their anchor and separation behavior. Original furniture SVGs and AI Village sources remain unchanged.

All evidence is outside the repository at ../commission-checkpoints-20261113/. The final directory is frozen-v6, with 848 configuration screenshots and matching JSON: 112 = four viewports × two languages × two themes × seven scenes; 384 = same 16 display configurations × eight production activities × three fixed phases; 224 = 16 display configurations × seven previously unreviewed characters × basic/standard real-command seating; 128 = 16 display configurations × eight advanced versions. Portrait phone/tablet seating uses the actual Locations→Locate path before sampling. Twenty-eight additional real face pointer clicks opened the corresponding profile. summarize-vf4c.mjs derives vf4c-final-verdict.json; zero final failures. Backgrounds: canteen, library, garage, incubator, office, campus, lab. Viewports: 1280×720, 844×390, 560×800, 390×844. Browser is IAB on this Windows host, not physical mobile hardware.

The harness reuses the production renderer, paper-doll parts and activity function. Scene/chapter/in-presence views and fixed pose phases are isolated rendered-view fixtures; seating is issued through actual accept/assign/office commands in disposable memory sessions. This proves current eight supported poses at sampled phases, not a new continuous walk/approach/sit/leave animation system, natural chapter reachability, or new public-furniture gameplay. Natural chapter/project replay is separately covered by stage 1. Face hit tests are Pixi hit tests; opaque application overlays may cover parts of the world and are not claimed globally absent. Real-pointer checks use explicit locate to expose the target. GPU memory and performance are not inferred from image bytes.

Failure history remains intact: original public rows and first stagger attempt; Qwen behind a later-chapter desk; frozen-v4's 848 screenshots with 806 face/nameplate AABB intersections discovered during the final cross-check; the corrected frozen-v6 batch. A 60-second tool timeout interrupted only the final configuration (719 of 720 saved), then that single missing Seedance case was completed. The first 14 pointer checks accidentally read the dialog heading instead of the character h3; real-pointer-probe-error.json is retained and all 28 checks rerun using the correct selector. No historical failure batch is relabeled as final.

lounge-4 remains unreachable by explicit choice: current public officeSlots(chapter) exposes lounge-1/2/3 only in chapters 0–4. No core edit or synthetic legal path was introduced. Evidence: lounge-reachability.json.

Checks: pnpm check 41 files / 333 tests, typecheck, lint, Web and DSH builds; git diff --check. Resource/output/source hash validation and production precache inclusion are tests. vf4c-v6-freeze.json was verified unchanged during final sampling. Original README.md, workflow, lock, scripts, packages, original character assets, partner-profile and dialog contracts are protected. Stage 2 is a local engineering checkpoint, not an independent review verdict. Stage 3 proceeds under the original user authorization; full VF31-PERF-01, 200% system fonts, SW branches and UI-OFFLINE-01 remain open until measured. Real soft keyboards, physical screen readers and real DSH installs remain OPEN/HOLD. No push, deployment, paid API call, reference screenshot import or player save access.
