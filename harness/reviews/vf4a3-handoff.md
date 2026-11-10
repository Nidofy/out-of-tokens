# VF4-A3 independent review handoff

Fixed implementation: IMPLEMENTATION_SHA_PENDING

Starting implementation ccf3b10339f54cb971070e15682b62bd3498ef21, record 73fe7bed4b3bb5ee058227d57721c9756691f780. Branch codex/m1-foundation. Local commits only; no push/deploy or VF4-B/C.

Delivered: twelve CSS-only recruitment posters, 2 columns at >=560px and 1 below; all/recruited/available filters; Studio recruitment entry; recruited/unrecruited S3 with live recruitment, Claude suspended view, default-open model inspector with engineering metrics, six abilities/deltas and rhythm. Original interaction, training, story and flavor controls retained. Recruitment success keeps the same dialog and now moves focus to the selected version tab.

The domain view intentionally exposes only partial version data. Complete read-only specifications come from the Web host's existing content object; no packages/engine/content schema modifications. Training bonuses are separately labelled against current live abilities. Stage A visual resolution always uses existing portraits.

Validation: 38 files / 307 tests, complete pnpm check; 52 browser observations, four viewports, successful recruitment in each, core S2/map/settings/journal/location smoke checks. One initial recruitment-focus failure retained and resolved. See harness/vf4a3/build-log.md, interaction-results.json and screenshots. Browser test geometry is directly measured; no-dialog focusInDialog is null. Test-only delivery fixture reuses A2's recorded command replay, no real player saves.

Performance: 3 versions × 4 cells × 6 rounds = 72 formal, 12 excluded warmups. Against c68541d: dev standard +3.88%, dev twelve +1.62%, preview standard +1.35%, preview twelve -3.53%; against 040031e: +7.43%, +6.26%, -0.16%, -1.84%. No cell triggers >10%; no confirmation batch. All samples foreground and rAF p50 <=25ms. No inference of full assets-ready, cold cache, GPU, long-session or low-end budgets.

Protection/cleanup: delivery-verification.json all 16 checks true, source freeze raw/LF unchanged (151 files), whitelist intact, protected paths zero diff, production free of probes, ports 5181–5186 closed, dedicated cache removed, browser viewport restored and test tab closed.

Reproduce: pnpm check; node harness/vf4a3/freeze-source.mjs --verify; node harness/vf4a3/verify-delivery.mjs. Sampling protocol and original browser functions are preserved. Do not resample unless separately authorized. Historical VF4A2-PERF-01 remains for reviewer disposition; TYPE-01 accepted as 20/16/14/12 by user. Full VF1, VF4-B/C, cold-cache/GPU/long-session/200%-font/low-end and real DSH limitations are not closed.
