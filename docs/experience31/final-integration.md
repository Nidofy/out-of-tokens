# Living Studio 3.1 final integration audit — 2026-11-17

## Release identity and decision

- Frozen planning/main base: `d18241a7aa9c5876367867fe78d9bfdd99d0f0ae`.
- Registered B implementation: `0912342ac296e888f1d2fb7af526069953b20d2f`; B record `09193fad6f23615f4f7a41e9e82eb69ca3820488`.
- A final implementation: `c8cf69f59aee3f66e390a4944c6bb30c69929b44`; A record/handoff `66849a93724590d9551a02d8be7ab491cc5d5d84`.
- Tested integration: `6e8e84804fc5bfd55d3b181a94b9448d940b4f7c` on `integration/experience31`.
- Decision: scoped Living Studio 3.1 technical integration PASS; eligible for the authorized local main merge. Main merge SHA is recorded separately after the merge. No remote push/deployment.
- This is not universal Host boundary-only rotation acceptance, whole-app performance certification, or Visual Freeze. The approved plan §6.2 keeps the protected DSH protocol unchanged and permits platform-side policy intent; C0 co-sign §6.3 acknowledges the server limitation. Preserve accurate Host copy and this explicit exception rather than claiming Browser equivalence. Historical VF5 / Visual Freeze HOLD, physical touch / 200% OS fonts / real DSH installation remain unchanged.

## Gates and EXP ledger

| Gate | Verified outcome |
|---|---|
| H1 / C0 | PASS: shared v1 API/design co-sign; frozen 529/419/962 inputs, 50ms segment / 1000ms local save p95 budgets unchanged |
| H2 / W1 save | PASS for Browser/Lab and protected Host adapter contract: atomic boundary policy, CAS, lineage, normal drain/confirmed abnormal switch, actual Worker and browser evidence. Host server rotation remains the documented protocol exception |
| H3 / W1 previews | PASS: independent period/activity derivation, 529/419 state checks, controlled cases, complete action coverage, seven learning facts, real A UI, two approved samples |
| H4 / W2 | PASS: <=256 candidates, stable/deduplicated 0–3 results, no automatic spend/dispatch, Worker parity/stale rejection, core explanation migration, remaining art |
| H5 / W3 | PASS: 18 bilingual receipts, two three-stage duo chains, all eight art slots approved, reduced-motion/fallback coverage, I4 pre-reset assessment corrected |
| H6 / W4 | Scoped technical PASS: 52 files / 469 tests, original independent I4 audit, 20 configurations plus targeted fix recheck, protected files/offline graph/old-save checks, supplemental transport/backpressure evidence. Retained holds above are not silently closed |

| EXP | Final status / evidence boundary |
|---|---|
| 01 | Implemented and accepted for Browser/Lab; Host server backup rotation remains explicitly limited |
| 02–03 | CLOSED in scope: all-action occupation/recovery and independent period preview; no RNG lookahead |
| 04 | CLOSED: seven independent learning facts and lineage-scoped skip/review |
| 05 | CLOSED: A read/reply separation, no read reward mutation |
| 06 | CLOSED: bounded candidates, actual forecasts, editable drafts and Worker timing |
| 07–08 | CLOSED: narrative chain, factual contribution/review/outcome, delivery assessment and all art |
| 09 | CLOSED: finance derivation and non-profit labels |
| 10 | CLOSED for frozen 3.1-base opening/529/419 canonical saves, incompatible/tampered rejection; no promise of arbitrary older content or a runnable old-version launch entry |
| 11 | CLOSED: reuse populates draft; core still validates dispatch and resource constraints |
| 12 | Excluded by scope |
| 13 | Cancelled by user; no recruitment/telemetry/funnel work |
| 14 | CLOSED: eight obsolete helper names absent from apps; pure public services own rules |

## Code, regression and compatibility evidence

`../commission-evidence/experience31/final-integration/6e8e84804fc5bfd55d3b181a94b9448d940b4f7c/` contains the full `check-1.log`, original `i4-original-audit.log`, aggregate `audit-summary.json`, probes, raw samples, screenshots and evidence hashes. Full `pnpm check` includes strict types, lint, 52 files / 469 tests and Web/DSH builds. `git diff --check` passes.

The prior external I4 audit was run unchanged against the merged A payload: **1 PASS**, with quality84.96 preserved instead of next-phase0. A's added test also checks rework breakdown and missing-assessment neutral behavior. Source audit confirms the modal uses assessment for grade, score and penalties; delivered/breached workbench summaries use historical assessment. I1–I4 are CLOSED at integrated code/test level. Old failing logs at integration-h3/h4/h5 remain intact.

Against d18241a: persistence, DSH, historical fixtures, content.ts and living-art.ts have zero diff. A final delta against registered B has zero package/content/art/B-entry changes. Existing replay/hash tests pass. Baseline archive compatibility evidence remains at `w4-preflight/244018cfae492cf1196299d0fbd967f32c9b805e/`: three saves byte-identical on re-export, nine corrupt/version/hash variants reject while preserving identity. No domain version, save schema, reward or old-asset changes. Production `experience-module-graph.json` reports `fixtureReachable:false`; full package verification checks offline/public/dist asset bytes.

## A browser and art evidence reviewed

A archives: `w4/c8cf69f59aee3f66e390a4944c6bb30c69929b44/` and `h5/0cd7f5af2008e46d9ebd6a41de0b993fb13034b3/`. Reviewed handoff, final source, raw JSON/JSONL, full check, module graph and representative post-I4 screenshot. A owns/reports the interactive full-loop/reload/dual-tab pause/export/cancel/confirm/write-error retry and reduced-motion/fallback checks; B does not claim to have repeated all UI actions.

Raw matrix: first pass329 snapshots across the required20 configurations plus4 incidental507x927 configurations. Zero overflow or short-control findings; 15 hit failures occurred across the four768x1024 locale/theme combinations. Recheck34 snapshots include30 at768x1024 covering all four combinations, three incidental507x927 and one1280x720; zero hit/overflow/short-control findings. Report the recheck precisely, not as34 samples all at768x1024. A checker uses43.5px floating-point tolerance for44px controls. Post-I4 screenshots are retained. Initial failures are not erased.

Art-Batch7: all8 approved by A, no bitmap rework, cafe-sign focal position adjusted by A. Runtime bytes total458174 (<900000); each image within frozen budget. Eight PNG masters/eight WebP assets, prompts, hashes, source/license/model-unknown records and explicit sample approval retained in `art/art-batch-7/`. HTTP404 fault screenshots show usable text/CTA fallback; package tests independently verify offline assets.

## Performance scope and supplemental measurements

A's Chrome152 archive has5 warmups+30 samples for529/419/962 saves and176/256 candidate cases. Save p95 <=33.8ms; candidate blocking p95/max0.2ms, round-trip p95 4.5/6.1ms, exact parity. It reports4 LongTasks, max103ms, without timestamps: this cannot establish a whole-page <50ms longest-task result or attribute those tasks to recorded save intervals. Its report identifies a pre-final-UI-polish Worker/core baseline; do not relabel every A measurement as a final-SHA run.

B supplement runs the **final tested integration SHA**, Core Ultra9 285H / Windows / visible in-app Chrome157, with the unchanged actual A Worker entry/host and native IndexedDB. The external bootstrap only adds request/response timestamps around that entry; no A production files changed. Exactly5 warmups+30 samples per input/policy, canonical encoded/disk equality every sample. These are isolated service measurements, complementing A's full-page evidence, not replacing VF5.

| Input | Checkpoint p95 ms | Boundary p95 ms | Return transfer p95 ms |
|---|---:|---:|---:|
| 529 | 34.8 | 52.9 | ~0.10 |
| 419 | 25.3 | 38.9 | ~0.10 |
| 962 | 20.8 | 30.2 | ~0.10 |

Maximum measured synchronous capture/constructor/enqueue/postMessage segment3.3ms. One77ms LongTask is retained and does not overlap any of the180 recorded save intervals. Copy, queue wait, Worker encode, outbound transfer, return transfer, I/O, independent replay/state-hash/content-hash samples are retained separately. Return timing includes serialization and dispatch scheduling; sub-resolution cross-context rounding down to-0.000244ms is retained raw and reported as approximately zero, not a negative physical duration. No persistence optimization was justified or made.

Controlled queue probe: first actual storage write held while50 legal natural-trace commands enqueue with actual DayEnd boundaries at prefixes16/31/47; then released.5 warmups+30 recorded runs; every run writes prefixes1/16/31/47/50 in order, at most1 concurrent write, actual Worker required, all canonical auto and backup bytes equal. Maximum command1.3ms / enqueue2.9ms; latest enqueue-to-commit p95 53.7ms; release-to-commit p95 37.9ms. Artificial hold p95 735.2ms is reported separately, not hidden as normal storage latency.

Initial transport bootstrap hung at the first warmup because dynamic import installed onmessage late; no recorded samples existed. Original script and failure note retained, fixed by forwarding buffered pre-import messages to the unchanged entry. One abandoned disposable DB was then removed; remaining test DBs0. Both local servers4219/4220 stopped. No player database touched. No resampling based on performance outcome.

## Remaining explicit limitations

Protected Host server still rotates on every auto write; Browser/Lab boundary-only semantics are not claimed for it. Real DSH install/authentication, physical touch,200% OS fonts and historical VF5/Visual Freeze remain HOLD/OPEN. No universal unload durability or arbitrary-old-version compatibility claim. No new rule/content/save protocol change or remote action. These limits persist in the final release record.
