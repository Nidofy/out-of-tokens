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
