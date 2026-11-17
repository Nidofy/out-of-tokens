# Track A Progress Log — Living Studio 3.1

- **Worktree**: `D:\Documents\FeiyangChen\devApps\ai-game\out-of-tokens-experience-ui`
- **Branch**: `experience-ui-wave1`
- **Baseline SHA**: `d18241a7aa9c5876367867fe78d9bfdd99d0f0ae`
- **Track B Published SHA Integrated**: None yet (reviewed Track B C0 rev 2 `424045da` / `d4c0a8eb`; co-sign complete at `a19e2f68`; awaiting frozen H1 SHA / `B-W1a` release)
- **Contract Version**: `EXPERIENCE_CONTRACT = 1` (C0 rev 2 co-signed by Track A; ready for H1 freeze)
- **Historical Holds Preserved**: `VF5 / Visual Freeze HOLD`, physical touch / 200% OS font / real DSH host holds remain unchanged.

---

## Checkpoint History

### 3. C0 Revision 2 Co-Signature & Reason Sync (2026-11-17)
- **Implementation SHA**: `a19e2f68330deeedccf75b7152c27ead33e7e7a3`
- **Reviewed Track B Draft**: `424045da7bfa0ddcff10f190ec5d869be5ab699e` (`d4c0a8eb2f293f07fb5776ba818d3d083eab28d5`)
- **Evidence**: `../commission-evidence/experience31/c0/a19e2f68330deeedccf75b7152c27ead33e7e7a3/`
- **Owned Files Modified**:
  - `docs/experience31/ux-c0.md`: added §4 bilingual codes (`activity-energy`, `activity-mood`, `activity-affinity`, `ACTIVITY_NOT_SUPPORTED`, `SESSION_SWITCHING`, `SWITCH_REQUIRES_CONFIRMATION`, `INVALID_CHECKPOINT_PREFIX`, `LINEAGE_RESET`) and §6.3 C0 rev 2 co-sign explicitly approving `SaveInput.throughCommand?: number` (Worker encoder will delegate to `defaultSaveEncoder` / replay prefix, never `input.state`), FIFO `boundaries[]`, `switchImportedSession`, `HostLineageMap` + `lineageReset`, `ActivityPreview.actors[].relocatesTo` including `'expedition'`, root re-exports, 9 dev fixtures + Vite production isolation, and acknowledging protected `apps/dsh/**` server backup rotation constraint.
  - `apps/web/src/experience-ui-copy.ts`: synced all C0 rev 2 reason codes + `lineageResetNoticeCopy`.
  - `apps/sim-cli/experience-ui.test.ts`: verified C0 rev 2 reason mappings & `lineageResetNoticeCopy`.
- **Checks**: `pnpm check` passed (`tsc -b`, `eslint packages apps`, `46` test files / `399` tests, `oot-web` + `oot-dsh` builds); `git diff --check` passed; `0` diff on protected paths vs `d18241a`.

### 2. W1 Pre-H2 — Independent Frontend Tasks (2026-11-17)
- **Implementation SHA**: `00a55bac9f9d20b914994972e7c8d57021b202a0`
- **Record SHA**: `c94c07a10a391ddd2770af6c5adbb84bdf485862`
- **Evidence**: `../commission-evidence/experience31/w1-pre-h2/00a55bac9f9d20b914994972e7c8d57021b202a0/`
- **Track B Published SHA Integrated**: None yet (awaiting H1 / `B-W1a` release SHA)
- **Owned Files Modified / Created**:
  - `apps/web/src/experience-ui-copy.ts` (new): bilingual UI copy, reason-code mapper + unknown fallback (`状态提示（代码：${code}）`), dynamic `explainLiveTeamFit` / `buildSampleTeamDraft` (zero hardcoded quality intervals), `backupPolicyCopy`, `switchConfirmCopy`, `saveAlertBannerCopy`, `financeNetSolvencyNote`.
  - `apps/web/src/experience-ui-state.ts` (new): `oot-ui:<lineageId>:*` metadata store with LRU cap `8` (`oot-ui:__lineages__`), zero domain-save deletion, `threads` read state, `learning` prefs, `last-team` validation (`filterValidLastTeamMembers`).
  - `apps/web/src/save-status-ui.tsx` (new): `SaveStatusPill`, persistent focusable `SaveAlertBanner`, native `<dialog>` `SwitchConfirmDialog`.
  - `apps/web/src/messenger-drawer.tsx`: `EXP-05` read vs replied separation (drawer open preserves unread dots; clicking thread marks only that thread read without dispatching any domain command; later single reply preserved).
  - `apps/web/src/commission-workbench.tsx`: `A-W1-6` front-card 3-item brief highlights, live forecast fit card vs `job.passQuality`, editable sample squad & `EXP-11` reuse-last-team prefill draft (never auto-accepts or auto-assigns).
  - `apps/web/src/dialog.tsx`: backup copy updated to `"最近 5 个跨日/边界节点"`.
  - `apps/web/src/hud-bar.tsx`: compact `SaveStatusPill` in `.ui2-hud`.
  - `apps/web/src/use-game.ts`: session `lineageId`, slot-lineage persistence, `saveStatus` monotonic revision tracking, `importFile` honesty (`imported-unsaved`), two-state `SwitchConfirmDialog` request/confirm/cancel/export flow (fixture/UI layer ahead of H2 real `CheckpointCoordinator`).
  - `apps/web/src/alpha-app.tsx`, `apps/web/src/ui2.css`: wired read state, `lastTeam`, `SaveAlertBanner`, `SwitchConfirmDialog`, responsive `390×844` 2-row HUD fix & z-index layering.
  - `apps/sim-cli/experience-ui.test.ts` (new, 6 tests).
- **Checks & Browser Verification**:
  - `pnpm check` passed after final CSS edit: `tsc -b`, `eslint packages apps`, **46 test files / 399 tests**, `oot-web` + `oot-dsh` builds.
  - `git diff --cached --check` passed; `0 diff` on all protected/Track B paths vs `d18241a`.
  - Real Chromium verification at `http://127.0.0.1:4189` (`0` console errors, no `{ force: true }`, port `4189` server stopped afterward):
    - Caught & fixed `390×844` HUD 3-row wrapping occlusion on Studio Terminal close button; re-verified `390×844` in both `zh-CN` and worst-case `en` (`"Day 1 · Afternoon"`): strictly 2-row HUD, `44×44` SavePill, unoccluded Terminal close click, `0` overflow.
    - Verified `1280×720`, `768×1024`, `844×390`, `560×800`, `390×844` SavePill >= `44×44` & clickability.
    - Verified Messenger read vs replied separation, `menu` Mistral `< 60` risk vs Qwen sample squad & reuse-last-team busy-member check, `Ctrl+Shift+F9` pause banner persistence across `BarkOverlay`, `SwitchConfirmDialog` cancel/confirm recovery, and `?test-fault=storage` error banner.

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
| A-C0-1 | State diagrams & 5-viewport wireframes (`ux-c0.md`) | Completed | `4c5602b` + `pnpm check` / `git diff --check` |
| A-C0-2 | 8 Art-Batch 7 slot specs (`art-slots.md`) | Completed | `4c5602b` |
| A-C0-3 | Bilingual reason-code map & Contract v1 rev 2 co-sign (`SaveInput.throughCommand`) | Completed | `4c5602b` + `a19e2f6` (`pnpm check` 46/399) |
| A-W1-5 | Group chat read vs replied separation (`oot-ui:<lineageId>:threads`) | Completed (Pre-H2; H2 real lineage awaits B-W1a) | `00a55ba` + Vitest + Chromium verified |
| A-W1-6 | First-order live forecast fit & editable sample squad | Completed | `00a55ba` + Vitest + Chromium verified |
| A-W1-1 | Save status UI, alert banner, boundary backup copy, SwitchConfirmDialog, H2 wiring | Pre-H2 UI/Fixture Complete (H2 real service pending `B-W1a`) | `00a55ba` + Chromium fault-fixture verified |
| A-W1-2/3/4 | Advance preview, Activity preview (all slot/overtime commands), 7 learning nodes | Queued for H3 (`B-W1b`) | Pending |
| A-W2-1/2/3/4 | Candidate comparison (Worker <=50ms), remedies, finance, reuse team (prefill UI done; full W2 candidate/EXP-14 pending `B-W2`) | Pre-fill UI in `00a55ba`; W2 core API pending `B-W2` | Pending `B-W2` |
| A-W3-1 | Delivery feedback order, 2 duo short chains, Outcome Wall, 8 art slots | Queued for H5 (`B-W3`) | Pending |
| A-W4-1 | 20-case real-browser matrix, `elementFromPoint`, fault recovery, Wave 2 regressions | Queued for H6 (`W4`) | Pending |
