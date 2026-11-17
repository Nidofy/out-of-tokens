# W2 service release — 2026-11-17

Registered SHA bda560cbc097d535d8462f92d6ac2a497e9e6cec on experience-core-wave1 (same isolated B worktree). A may merge this fixed SHA; it includes registered W1 baseline 7a9f3df. All ExperienceSession methods now implemented; actual Worker candidate function exported. Contract remains v1, only planned methods activated. No A implementation merged or edited.

Bounded deterministic search: <=256 evaluations, deduplicated stable 0–3 winners, draft/revision/lineage binding, no spending/dispatch, core conditional forecasts. Capacity/duo/finance use core helpers; clarify-only duo never counts as job benefit; finance separates liabilities and last-ten-row cash flow. App-layer migration matrix covers every duo/mode/category/period/lock and capacity/ledger known-correct cases; core has no Web dependency. A still owns deleting its rule copies.

pnpm check 50 files/444 tests PASS; staged diff check PASS. Main/Worker pure output equal, invalid and truncated cases covered. Node fixed-sample profile 5 warmups/30 samples: opening176 evaluations p95 4.7010ms/max4.7171ms; controlled-full-roster256 p95 7.0569ms/max8.4487ms. Browser scheduling/clone/transfer and real Worker tests still open. Evidence ../commission-evidence/experience31/w2/bda560cbc097d535d8462f92d6ac2a497e9e6cec/.

H4 B rule services ready, not integrated acceptance. Remaining six art assets still gated by A's two-sample crop approval; H2/H3 Host/browser/performance gates unchanged. H5 prose and complete asset set pending, H6 pending. Main unchanged, no push/deployment, historical HOLD retained. B continues independent narrative content while A integrates.

Earlier records follow.

# Published B W1 service baseline — 2026-11-17

Release SHA: 7a9f3df6f120fd8fac1c955580cc70f934a6ff03 (experience-core-wave1, D:\Documents\FeiyangChen\devApps\ai-game\out-of-tokens-experience-core).
A may merge this fixed registered SHA for API/real-service integration and sample crop review. This is the common C0 API baseline v1 assembled with A's verbatim art-slots (4c5602b) and ux-c0 final signoff (a19e2f6). No A implementation/UI branch was merged. H1 API freeze published; acknowledgement of amended long performance input remains open. H2/H3 end-to-end acceptance is NOT claimed.

New runtime: GameSession.previewNextPeriod and getExperienceView; deterministic current-slot resource/work/recovery projection without advance/choose/RNG reads; incremental seven-node learning plus receipts keyed by actual job/phase/resource participants and roles; import replay reconstruction. W2 explanation/search methods remain unavailable until next release.

Verification: pnpm check 49 files/436 tests, types/lint/Web/DSH builds PASS; staged diff check PASS. 529/419 unchanged logs: every state checked for preview purity and RNG-read rejection; 983/907 certain facts, 890/726 conditional facts; actual advance outcomes 106/88 settlements and 20/10 event interruptions. 126/98 controlled no-event comparisons, 486 additional role/resource/energy/overtime/bill cases; dedicated blocked checks. Receipt reconstruction, actual participants, phase isolation and canonical exported bytes tested. Core simulation/versions/content/persistence/DSH/historical fixtures remain unchanged in this revision. No weakened historical assertions.

Art-Batch 7 samples: built-in image_gen, model unknown. Menu 768x512 68764 bytes; rest 960x320 27092 bytes; total 95856 bytes. Both masters, runtime copies, prompts/parameters/hash/visual review metadata retained. experienceArt(id) returns null for unpublished assets. Package test verifies PNG/WebP dimensions, bytes/hashes, whitelist and offline copies. B viewed original and compressed images; A five-viewport crop/failure/dark review is pending. Remaining six assets gated on A approval.

Fixed longer input: seed21/962 commands/240 cumulative slots/3 runs (two bankruptcy restarts), explicitly save stress, not successful continuous business play. Commands hash eb98024438e47e62e752d994fc105ecda4ae43793db1062d23ab34976bd870f4. Original legacy bot failure retained; replacement does not alter rules or legacy bot. A acknowledgement of the protocol-input amendment pending. Three inputs have 5 warmups/30 Node samples with canonical bytes; browser/Worker/I-O/queue measurements still OPEN. No persistence hash optimization.

Evidence: ../commission-evidence/experience31/w1/7a9f3df6f120fd8fac1c955580cc70f934a6ff03/ (check-release.log, preview-*.json, period-matrix.log, long-input.json, node-save-profile.json, save-profile.log).

Remaining: Host server rotation cannot honor checkpoint intent over unchanged protected protocol; performance/UI integration and art crop signoff remain H2/H3 gates. Next independent B work is W2 bounded candidate search and core capacity/duo/finance explanations; H4/H5/H6 not passed. EXP-01/02/03/04 have B services, not completed A integration; EXP-14 first two service replacements available. VF5/Visual Freeze HOLD unchanged. Main untouched; local commits only.

Earlier checkpoints follow.

# Track B revision 2 — 2026-11-17

Implementation: 424045da7bfa0ddcff10f190ec5d869be5ab699e
Worktree: D:\Documents\FeiyangChen\devApps\ai-game\out-of-tokens-experience-core
Branch: experience-core-wave1; main remains d18241a7aa9c5876367867fe78d9bfdd99d0f0ae.
Contract: v1 draft revision 2; review checkpoint, not H1 frozen / B-W1a / B-W1b release.
Evidence: ../commission-evidence/experience31/c0/424045da7bfa0ddcff10f190ec5d869be5ab699e/

A design 4c5602b and external c0-signoff received. B accepts eight art-slot specs and co-signed measurement protocol. No sample image or viewport acceptance fabricated. New SaveInput.throughCommand requires A Worker handling/review before common freeze.

Changes:
- Removed boundary enqueue throw while preserving one active and one latest pending State snapshot. FIFO revision/log-prefix markers retain every boundary; default encoder reconstructs and verifies exact prefix. Exact three-write sequence tested. Prefix bounds and canonical bytes tested.
- Implemented session.previewActivity for deterministic actions including train/align/overtime/expedition/tea/duo/chat-reply/story/respond/clarify. Shared deterministic clarification reservation does not draw RNG. Random settlement/switch commands explicitly unsupported by this activity API. Next-period preview remains pending.
- Implemented validated two-state import helper: lock commands, validate before abandonment, drain normal path / confirmed abnormal path, await submitted writes, switch identity and return saved:false. Failed import preserves queue and lineage. Successful restart changes lineage.
- Added HostLineageMap, exact slot/revision/text identity mapping, unknown-record reset notice and optional persistent storage injection. Host POST unchanged; server backup rotation still unresolved, not passed.
- Expanded nine development scenarios; added required contract fields and Worker suggestion function type (runtime search pending). Vite now rejects fixture imports during production build and records actual module graph; current graph fixtureReachable=false.

Validation: final pnpm check passes type/lint/build and 47 files/427 tests (baseline 393; experience suite 34). Two natural 529/419 trajectories replay original commands, check activity preview purity and command costs, and match final original hashes; this is not the still-missing advance-preview comparison gate. git diff --cached --check passed after EOF whitespace corrections. Protected persistence/DSH/historical fixtures/content/art/Web src paths zero diff. Web vite.config.ts is B-owned and intentionally changed.

Node diagnostic (5 warmups/30 samples each): encoder p95 44.8651/32.2459ms for 529/419 commands; replay max 61.6771/32.8708ms; content hash max 6.9261/5.4834ms. Exact canonical bytes on every sample. Browser longest-task/IndexedDB/queue/Worker transfer NOT measured. No authorized hash-bottleneck condition established, so persistence untouched. Longer planned full-content runBot input failed because legacy policy assumes absent roster actors; failure retained, longer-input gate remains open. Failure/fix summaries and raw profiling failures preserved.

Status: EXP-01/02 partial platform implementation; no EXP closed. H1 pending final contract/throughCommand review/common SHA assembly; H2 pending unchanged Host server rotation conflict plus actual browser/Worker performance and A integration; H3 pending independent next-period derivation, full action coverage guard and controlled gates, learning facts and two images. H4/H5/H6 not started. Remaining B work remains actionable; not claiming all blocked on A. Historical VF5/Visual Freeze HOLD unchanged. Only local commits, no push/deployment.

Next: finalize C0 with A's throughCommand review, complete fixed longer performance input, implement independent current-slot preview and learning projection; provide two art samples after W1 service gates. Host cannot implement checkpoint-no-rotation over the existing three-field server protocol: requires an explicitly compatible capability or approved scope change, never silently claim equivalent semantics.

Previous checkpoint follows for history.

# Track B — Living Studio 3.1

2026-11-17; preparation checkpoint, NOT an H1/H2 release.

- Worktree: D:\Documents\FeiyangChen\devApps\ai-game\out-of-tokens-experience-core
- Branch: experience-core-wave1
- Baseline/main: d18241a7aa9c5876367867fe78d9bfdd99d0f0ae
- Implementation: 663071a756532a47cecaa47f71d59b8b90bd4a1f
- Contract: draft 1; no Gemini signoff; no common frozen baseline. A must not merge this as B-W1a.
- Evidence: ../commission-evidence/experience31/c0/663071a756532a47cecaa47f71d59b8b90bd4a1f/

Implemented: optional BrowserSaves checkpoint/boundary policy and atomic lineage meta; detached session snapshots, session command lock and successful-import identity handling; injectable canonical SaveEncoder; serial saving prototype with pause/retry/awaited abandonment and explicit boundary backpressure. Public proposal types, independent fixtures and DOM-free Worker encoder subpaths compile. No production UI wiring.

Validation: offline frozen install succeeded. check-1 passed 46 files/400 tests; check-2 passed 46/402; final check-3 passed 46/404 (11 new checkpoint tests), typecheck/lint/Web and DSH builds. git diff --check passed (Git printed CRLF normalization warnings). Protected paths compared with d18241a have zero diff: persistence, DSH, historical fixtures, content, art, all Web files. Existing natural-trace tests still pass; new preview per-state gates are NOT implemented. No tests failed; initial worktree creation hit sandbox permission denial and succeeded with authorized escalation. CIM CPU lookup denied; Node os.cpus provided device identity. No browser/performance/art acceptance performed.

## Handoff status

| Gate | Status | Remaining |
|---|---|---|
| H1/C0 | INCOMPLETE | B runtime preview/search/explanation contracts and field/reason fixtures need completion/refinement; A design/wireframes/art slots and signoff absent; browser performance agreement absent |
| H2/B-W1a | NOT RELEASED | Host checkpoint/rotation compatibility, Host lineage map, restart handling, full switch orchestration, boundary scheduling design and measured performance; A Browser/Host/Lab integration |
| H3/B-W1b | NOT STARTED | Independent advance/activity previews and 529/419 per-state comparisons, learning facts, A rule migration, two art samples |
| H4 | NOT STARTED | Candidate search/explanations and six assets after A crop confirmation |
| H5 | NOT STARTED | 18 bilingual receipts, two duo chains, evidence projections and eight-asset manifest |
| H6 | NOT STARTED | Integration branch, old saves/full regression/offline resources, A 20-case browser verification, main merge |

EXP-01 partially implemented in platform only. EXP-02/03/04/06/07/08/09/10/11/14 pending; EXP-05 owned by A; EXP-12 excluded; EXP-13 cancelled. No EXP closed by this checkpoint.

Important limitations: default encoder still performs synchronous replay; deferred scheduling is not a <=50 ms performance result. Browser policy defaults to legacy boundary for old callers; new coordinator passes explicit policy. Host wire protocol unchanged and server rotation remains unresolved. Pending or executing boundary requires drain before further enqueue, not yet accepted H2 interaction. Fixture export isolation test is narrower than production dependency-graph verification. Worker test invokes the pure entry in Node, not an actual Worker host.

Next B work: resolve boundary scheduling and Host policy compatibility without touching DSH; finish C0 API/fixture/condition coverage and actual measurement inputs; obtain A's design/signoff to freeze common SHA, then proceed in mandated W1 order. These B items remain actionable; this checkpoint does NOT claim that all remaining work is blocked on A.

Only local commits. Main unchanged. No push/deployment, no A file changes, no fabricated signoff. Historical VF5 / Visual Freeze HOLD remains.
