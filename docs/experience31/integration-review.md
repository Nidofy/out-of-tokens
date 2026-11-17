# Latest integration review — 2026-11-17

A committed W3/I1–I3 code at **0cd7f5af2008e46d9ebd6a41de0b993fb13034b3** was merged into the independent integration branch at **ecd9115585b12bb060879b7f38873f0a2ce13313**. Full `pnpm check` PASS: **52 files / 468 tests**. A's shared handoff still lists H4, so this records inspection/merge of committed code, not a fabricated A H5/H6 signoff. B development has not merged A; main remains d18241a.

I1 is closed at code/test level (published art path plus truly unknown fallback). I2/I3 are closed at code/test level: `executeManualSlotLoad` enqueues the explicit auto-load boundary using post-drain CAS, and a failed post-switch read binds a new coordinator without writing, returns unsaved/unavailable, and publishes the switched view. A added regressions for both paths. Real-browser fault/matrix acceptance remains separate.

## I4 — P1: phase-reset/rework values replace the actual receipt assessment

Observed against ecd9115 in the real A payload builder, using unchanged natural `commission-natural-build-2.json`: `project:incubator:1`, accepted phase0 quality **84.96**, pass line75, next phase1 quality0, payload outcome passed but displayed quality **0**. `buildDeliveryFeedbackPayload` selects the after-command job and `DeliveryFeedbackModal` uses it for grade/score/pass line/penalty explanation. Core correctly clears the next phase; rework likewise clears defect/hidden penalties. Historical rows must also be audited for current-job substitutions.

Repro is an external evidence-only Vitest audit, not an edit to A tests. Run from integration: `pnpm exec vitest run --config ../commission-evidence/experience31/integration-h5/ecd9115585b12bb060879b7f38873f0a2ce13313/audit.config.ts`. It is **1 failing test** (0 !== 84.96). Raw test/config/log are in that directory, alongside the passing 468-test full check. Initial standalone tsx setup failure (`import.meta.env`) is retained separately. Do not change the expected factual score to accommodate the wrong UI.

B provides the compatible optional `receipt.assessment` in contract.md: quality, passQuality, qualityLines, qualityBreakdown from before delivery/rework. A action: merge the registered B assessment release, consume it for feedback grading/score/reasons and journal historical values, keep missing-assessment copy neutral, add A-owned regression coverage for phase advancement and rework. Do not spread a current job's quality into missing historical facts. B has not edited A UI/adapters/tests. I4 stays OPEN until the A consumer is fixed and reviewed; external regression should then pass unchanged or be extended with an equivalent rendered factual assertion if A intentionally changes payload shape.

Remaining acceptance: six new art crops/fallbacks, reduced motion and full 20-configuration W4 evidence; full UI/Host performance and queue pressure/return-transfer evidence; H3 empty-reload anomaly; protected Host POST cannot encode boundary-only rotation. Existing isolated service measurements remain valid for their recorded SHA only. Final main merge remains gated; historical VF5/Visual Freeze HOLD retained.

Earlier review records follow (historical failures are preserved).

# Integration review for Track A — 2026-11-17

Integration SHA: 9d96abc4e3cb295aa6341669d632a69048a7407d (integration/experience31, D:\Documents\FeiyangChen\devApps\ai-game\out-of-tokens-experience-integration).
Inputs: B 29ee4781d2d637faf963e13cc652842f62b6b482 (record e6ba157), A registered H3 3af807852e9680d77c1cb314d78420407103eeaf. B development branch has NOT merged A. Please fix these in A-owned files and publish a fixed SHA; B has not modified them.

## I1 — release-blocking obsolete asset expectation (observed test failure)

apps/sim-cli/experience-ui.test.ts:316 expects experienceArt('outcome-bookshop-guide') to be null. This slot is now genuinely delivered by the registered full eight-art release. Integrated pnpm check: 52 files, 461 passing / 1 failing test. Preserve unknown-ID fallback coverage using an actually unknown ID, and assert the bookshop-guide path exists. Do not remove the fallback assertion. Full failure log: ../commission-evidence/experience31/integration-h3/precommit/check-1.log.

## I2 — P1: manual auto load falsely claims saved after draining a newer checkpoint

apps/web/src/use-game.ts:404 reads selected auto row BEFORE switchImportedSession drains the current dirty queue. Example: auto text A at storage rev1; current session has accepted a job and queued text B; read('auto') selects A; switch helper drains B at rev2 then imports A; follow-up read gets rev2. Lines422–425 skip enqueue when id==='auto' and publish saved for in-memory A, while disk still contains B. Reload restores the wrong selected state.

Fix intent: every explicit successful manual load, including auto, must enqueue a load boundary on a fresh coordinator using explicitly read CAS. Do not mark saved until that boundary actually commits. Startup auto hydration is a separate path and need not create a boundary. This also follows the approved successful-manual-load rotation rule. B's new contract regression reproduces exact differing disk/session bytes and verifies a load boundary restores the selected text and backs up the drained text; focused 17 checkpoint tests PASS, log auto-load-contract.log. Test is in B apps/sim-cli/experience-checkpoint.test.ts (next registered B release will include it).

## I3 — P1: read failure after commit leaves session/UI/coordinator split

apps/web/src/use-game.ts:407–415: switchImportedSession commits imported state and disposes old coordinator, THEN await storage.read('auto') can reject before setLineageId/setView/bindCoordinator. The run catch displays an error but keeps stale view and disposed coordinatorRef. Subsequent commands can mutate the new session then fail enqueue with COORDINATOR_DISPOSED. Existing importFile already catches this post-switch read failure, but load does not.

Fix intent: on this post-commit read failure, render the switched session, mark unsaved/storage unavailable, and bind a safe new coordinator without writing against an unknown CAS. Preserve export/continued play/confirmed switch behavior; do not retry or silently refresh CAS to overwrite another tab. Add an A-owned controlled storage failure test that allows selected read and fails post-switch auto read. This finding is source-audited, not claimed as a completed real-browser fault test.

## Still-open acceptance

Frozen 5 warmups + 30 samples for three save inputs, queue/clone/replay/hash/I-O/Worker transfer and main-thread <=50ms / local save p95<=1000ms are still absent from the H2 report; Worker existence is not performance evidence. H3-reported empty-app reload anomaly must be revisited in final matrix. H4/H5 UI, six-new-art rendered crops and 20-case W4 remain A work. Host server rotation cannot implement the boundary-only intent over unchanged protected POST; do not claim H2 universal equivalence.

B complete-art release is available now at 29ee478. A may continue unrelated W2/W3 work; these issues block final main merge, not that development.

## Subsequent fixed checkpoints

B regression/profiling release b204a0770e16e8ceea2048a46d8932404a9e04d2 now includes the I2 contract test and reproducible browser harness. Isolated service 5+30 measurements completed (see performance-protocol.md); full UI/Host, return-transfer isolation and 20-case gates remain open. A registered H4 7f500b9 was merged into integration at 7d8843de70a29753729d8ce16bcf438eba201ae4. Full check is 464 pass / 1 fail, same I1 assertion now at line318; I2/I3 remain present in that published load path. None of these are silently waived.
