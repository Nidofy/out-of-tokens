# Track A Progress Log — Living Studio 3.1

- **Worktree**: `D:\Documents\FeiyangChen\devApps\ai-game\out-of-tokens-experience-ui`
- **Branch**: `experience-ui-wave1`
- **Baseline SHA**: `d18241a7aa9c5876367867fe78d9bfdd99d0f0ae`
- **Track B Published SHA Integrated**: None yet (Track B currently at C0 preparation `663071a` / `9ed787b`, awaiting C0 co-sign and H1 freeze)
- **Contract Version**: `EXPERIENCE_CONTRACT = 1` (Draft 1 co-sign review submitted; H1 freeze pending)
- **Historical Holds Preserved**: `VF5 / Visual Freeze HOLD`, physical touch / 200% OS font / real DSH host holds remain unchanged.

---

## Checkpoint History

### 1. C0 — Design Deliverables & Unified Contract Co-Signature (2026-11-17)
- **Implementation SHA**: `4c5602b1d8d7788e270a90e3106ea3fffee81e8d`
- **Record SHA**: *(recorded in subsequent commit)*
- **Evidence**: `../commission-evidence/experience31/c0/4c5602b1d8d7788e270a90e3106ea3fffee81e8d/`
- **Check Results**: `pnpm check` passed (`tsc -b`, `eslint packages apps`, `45` test files / `393` tests, `oot-web` + `oot-dsh` builds); `git diff --cached --check` passed; protected paths `0 diff` vs `d18241a`.
- **Owned Files Created**:
  - `docs/experience31/ux-c0.md` — 6 Mermaid state diagrams (Save Lifecycle, Two-State Session Switch Barrier, NextPeriodPreview, ActivityPreview, 7 Learning Nodes, Candidate Search/Worker), 5-viewport wireframes (`1280×720`, `768×1024`, `844×390`, `560×800`, `390×844`), SwitchConfirmDialog modal spec, full bilingual reason-code table + unknown fallback, action priority ladder, keyboard/focus/reduced-motion rules, and Track B `663071a` Contract v1 co-sign review.
  - `docs/experience31/art-slots.md` — 8 Art-Batch 7 slot specs (`outcome-tea-menu`, `outcome-cafe-sign`, `outcome-community-web`, `outcome-bookshop-system`, `outcome-bookshop-guide`, `outcome-workshop-display`, `vignette-rest-corner`, `vignette-first-delivery`), 5-viewport dimensions/crops, `object-position`, WCAG AA safe zones, CSS-only dark scrims, `loading="lazy"` + failure/offline fallbacks, and W1 2-sample approval gate.
  - `docs/experience31/track-a.md` — Track A progress ledger.
- **C0 Co-Signature Findings Reported to Track B**:
  1. **Approved**: `abandonPending(confirmed: true): Promise<void>` returning `Promise<void>`; `ActivityPreview.actors: ActorActivity[]` (requesting `Scene | 'expedition' | null`); `SaveEncoder` injection & byte-identical gate; `oot-platform/worker` & `oot-platform/fixtures` subpath isolation; `performance-protocol.md` device/browser sampling agreement.
  2. **Flagged for H1/B-W1a Resolution**: `CheckpointCoordinator.enqueue()` currently throws `BOUNDARY_DRAIN_REQUIRED` if a fast player command runs after `day-end` before the deferred background write finishes; requested FIFO non-coalescing boundary preservation without blocking non-boundary UI commands. Also requested `oot-platform` root re-export of `experience-contract.ts` types, `suggestAssignmentsFromSnapshot` signature in `oot-platform/worker`, 9 named C0 fixtures in `oot-platform/fixtures`, `CapacityExplanation` active workstation efficiency, `FinanceExplanation` recent ledger window summary, and Host lineage-reset signal.
- **Production Code Status**: `0` production files modified prior to H1 freeze; protected paths `0 diff` vs `d18241a`.

---

## Task Board Status

| Task ID | Scope | Status | Verification |
|---|---|---|---|
| A-C0-1 | State diagrams & 5-viewport wireframes (`ux-c0.md`) | Completed | Documented + `pnpm check` / `git diff --check` |
| A-C0-2 | 8 Art-Batch 7 slot specs (`art-slots.md`) | Completed | Documented |
| A-C0-3 | Bilingual reason-code map & Contract v1 co-sign | Completed | Documented + handed off to Track B |
| A-W1-5 | Group chat read vs replied separation (`oot-ui:<lineageId>:threads`) | Next (Pre-H2) | Pending |
| A-W1-6 | First-order live forecast fit & editable sample squad | Next (Pre-H2) | Pending |
| A-W1-1 | Save status UI, alert banner, boundary backup copy, SwitchConfirmDialog, H2 wiring | Partial Next (UI pre-H2; real service at H2) | Pending |
| A-W1-2/3/4 | Advance preview, Activity preview (all slot/overtime commands), 7 learning nodes | Queued for H3 (`B-W1b`) | Pending |
| A-W2-1/2/3/4 | Candidate comparison (Worker <=50ms), remedies, finance, reuse team, EXP-14 complete | Queued for H4 (`B-W2`) | Pending |
| A-W3-1 | Delivery feedback order, 2 duo short chains, Outcome Wall, 8 art slots | Queued for H5 (`B-W3`) | Pending |
| A-W4-1 | 20-case real-browser matrix, `elementFromPoint`, fault recovery, Wave 2 regressions | Queued for H6 (`W4`) | Pending |
