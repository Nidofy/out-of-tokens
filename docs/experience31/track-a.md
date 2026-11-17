# Track A Progress Log — Living Studio 3.1

- **Worktree**: `D:\Documents\FeiyangChen\devApps\ai-game\out-of-tokens-experience-ui`
- **Branch**: `experience-ui-wave1`
- **Baseline SHA**: `d18241a7aa9c5876367867fe78d9bfdd99d0f0ae`
- **Track B Published SHA Integrated**: `0912342ac296e888f1d2fb7af526069953b20d2f` (includes complete Art-Batch 7 `29ee4781d2d637faf963e13cc652842f62b6b482`, `b204a077`, W3 `ee0c04a`, W2 `bda560c`, W1 `7a9f3df`, merged cleanly into `experience-ui-wave1`)
- **Latest Final Implementation SHA**: `c8cf69f59aee3f66e390a4944c6bb30c69929b44`
- **Contract Version**: `EXPERIENCE_CONTRACT = 1` (H1 Contract v1 frozen + `receipt.assessment` compatible addition + amended 962-command stress fixture acknowledged in `ux-c0.md` §6.4)
- **Historical Holds Preserved**: `VF5 / Visual Freeze HOLD`, physical touch / 200% OS font / real DSH host holds remain unchanged; protected `apps/dsh/**` POST server rotation limitation vs Browser boundary-only policy stays explicit.

---

## Checkpoint History

### 8. W4 / H6 — Complete Art-Batch 7 Approval, I4 Fix (`receipt.assessment`), Browser Perf Matrix & 20-Case Acceptance (2026-11-17)
- **Final Implementation SHA**: `c8cf69f59aee3f66e390a4944c6bb30c69929b44`
- **Track B Released SHA Merged**: `0912342ac296e888f1d2fb7af526069953b20d2f`
- **Evidence**: `../commission-evidence/experience31/w4/c8cf69f59aee3f66e390a4944c6bb30c69929b44/`
- **Closure of Track B Integration Review Items (`I1`, `I2`, `I3`, `I4`)**:
  - **I4 (P1)**: Consumed `receipt.assessment` in `apps/web/src/delivery-feedback-ui.tsx` (`buildDeliveryFeedbackPayload`, `<DeliveryFeedbackModal>`), `apps/web/src/decision-panels.tsx` (`DeliverySummary`), and `apps/web/src/commission-workbench.tsx` (`QualitySealSvg` & historical art subtitle) so multi-phase delivery (e.g., `build-2` `project:incubator:1` phase 0 `quality = 84.96`) and `rework` retain pre-reset score/pass-line/breakdown rather than displaying post-reset `0`, while legacy receipts without `assessment` render neutral copy. Verified by new `I4 regression` test in `apps/sim-cli/experience-ui.test.ts`.
  - **W4 Browser Findings Fixed & Re-Verified**:
    - Caught Settings display toggles (`still` / `dark` / `english`) reverting after `reload()`; fixed in `apps/web/src/alpha-app.tsx` (`localStorage` `oot-display-{theme,motion,locale}`) and re-verified `dataset.motion === "still"` persists across 2x reload in production `4195/`.
    - Caught `15` `document.elementFromPoint` hit failures on `768×1024` where `.scene-left-stack` (`Locations` button at `top: 72px`) overlapped the wrapped 2-row `.ui2-hud` (`height: 96px`); fixed in `apps/web/src/ui2.css` (`@media(max-width:959px)` `top: 116px`), tuned `.ui2-guide-pill` & `.dialog-head button`/`.ui2-bark-close` to `>= 44×44`, centered `outcome-cafe-sign` (`50% 50%`), compacted `.ui2-delivery-dialog`, and re-verified **0 overflow / 0 short controls / 0 `elementFromPoint` hit failures** across `34` `768×1024` audit snapshots + post-I4 `4195/` production sanity pass (`Locations` button `y=116` below `banner.bottom=108`).
- **Frozen Browser Worker + IndexedDB Benchmark (`4197/?exp-perf=1`, Chrome/152, 16 cores, `visibility: visible`, 5 warmups + 30 samples, pre-final-UI-polish Worker/core baseline)**:
  - `build-2` (`529` cmds, `41,575 B`): `usedSaveWorker: true`, `enqueueMainMs` p95 `2.40 ms` (max `2.80 ms`), `workerPostMs` max `1.00 ms`, `idbWriteMs` p95 `2.20 ms`, `e2eCommitMs` p50 `31.10 ms` / p95 `33.80 ms` / max `40.50 ms` (`<= 1000 ms`).
  - `guide-1` (`419` cmds, `33,549 B`): `usedSaveWorker: true`, `enqueueMainMs` p95 `2.10 ms` (max `2.20 ms`), `workerPostMs` max `1.10 ms`, `idbWriteMs` p95 `1.90 ms`, `e2eCommitMs` p50 `25.00 ms` / p95 `33.50 ms` / max `33.70 ms` (`<= 1000 ms`).
  - `seed21-long` (`962` cmds, `71,401 B`): `usedSaveWorker: true`, `enqueueMainMs` p95 `2.50 ms` (max `2.70 ms`), `workerPostMs` max `1.00 ms`, `idbWriteMs` p95 `1.50 ms`, `e2eCommitMs` p50 `20.80 ms` / p95 `25.30 ms` / max `31.40 ms` (`<= 1000 ms`).
  - Candidate Search Worker (`opening-176` / `controlled-full-roster-256`): `usedSearchWorker: true`, `mainThreadBlockingMs` p95 `0.20 ms` / max `0.20 ms` (`<= 50 ms`), `roundTripMs` p95 `4.50 ms` / `6.10 ms`, `truncated: true` on `256` evals, exact parity with synchronous search.
- **Browser Acceptance Summary (`0` `{ force: true }`, viewport restored `1280×720`, all test servers stopped)**:
  - **20-Case Matrix (`1280×720`, `768×1024`, `844×390`, `560×800`, `390×844` × `zh-CN`/`en` × `light`/`dark`)**: `0` horizontal overflow, `0` `<44×44` interactive targets, real `Tab`/`Esc` focus restoration, 3-col desktop vs 1-col narrow candidates grid.
  - **Complete 8-Slot Art-Batch 7 (`docs/experience31/art-slots.md` §6 — `APPROVE`)**: all 8 slots (`outcome-tea-menu`, `outcome-cafe-sign`, `outcome-community-web`, `outcome-bookshop-system`, `outcome-bookshop-guide`, `outcome-workshop-display`, `vignette-rest-corner`, `vignette-first-delivery`) verified `data-art-state="loaded"` across 5 viewports + Light/Dark + ZH/EN, and verified `[data-art-state="fallback"]` (`0` broken `<img>`, enabled CTAs, `0` console/page errors) on HTTP 404 server `4196/`.
  - **Production Flow, Reduced Motion, Faults & Wave 2 (`4195/` & `4197`)**: real Settings reduced-motion switch (`data-motion="still"` + reload persistence), strict `Result -> Reason -> Cash -> Response` static `DeliveryFeedbackModal` (including `白板双拆解` duo chain & recorded contributors), Journal Outcome Wall (`vignette-first-delivery` + delivered outcome cards), dual-tab `BroadcastChannel` conflict pause/export/cancel/confirm recovery, `Ctrl+Shift+F10` storage write error/retry, and Wave 2 regressions.
- **Final Checks at `c8cf69f5`**:
  - `pnpm check` (`task-1545`): `tsc -b --pretty false`, `eslint packages apps`, **52 test files / 469 tests PASS**, `oot-web` + `oot-dsh` builds PASS, `experience-module-graph.json` `fixtureReachable: false`.
  - `git diff --check`: `0` exit; EXP-14 rule grep across `apps/`: `0` matches (`exit 1`); protected-files diff vs `0912342a`: `0` files.

### 7. H5 / W3 — Complete Art-Batch 7 Merge, I1–I3 Fixes, Delivery Feedback, Duo Short Chains & Outcome Wall (2026-11-17)
- **Implementation SHA**: `0cd7f5af2008e46d9ebd6a41de0b993fb13034b3`
- **Track B Released SHA Merged**: `29ee4781d2d637faf963e13cc652842f62b6b482` (`e6ba157`)
- **Evidence**: `../commission-evidence/experience31/h5/0cd7f5af2008e46d9ebd6a41de0b993fb13034b3/`
- **Owned Files Modified / Created**:
  - `apps/web/src/use-game.ts`, `apps/sim-cli/experience-ui.test.ts`: resolved Track B integration items **I1**, **I2** (`executeManualSlotLoad` reads post-drain `'auto'` CAS and always enqueues `'load'` boundary without premature `saved`), and **I3** (`executeManualSlotLoad` catches post-commit `'auto'` read error safely while keeping switched session interactive/exportable), plus added W3 & I1/I2/I3 Vitest regressions (**52 files / 467 tests PASS**).
  - `apps/web/src/experience-adapter.ts`, `apps/web/src/experience-art-slot.tsx`: mapped all commission templates to frozen Art-Batch 7 outcome IDs (`artSlotForJobTemplate`) and tuned 6 new `object-position` values.
  - `apps/web/src/decision-panels.tsx`, `apps/web/src/delivery-feedback-ui.tsx` (new): reordered `DeliverySummary` strictly to `Result -> Reason -> Cash -> Response` and built `DeliveryFeedbackModal` (4 ordered steps, `跳过动画 / Skip`, static `still` / `prefers-reduced-motion`, `Escape` focus return, recorded contributors only).
  - `apps/web/src/commission-workbench.tsx`, `apps/web/src/partner-profile.tsx`, `apps/web/src/journal-hub.tsx`, `apps/web/src/alpha-app.tsx`, `apps/web/src/ui2.css`, `apps/web/src/experience-diagnostics.ts` (new), `apps/web/src/main.tsx`: wired 3-stage `experienceDuoCopy` chains, Journal Studio Outcome Wall (`outcome-workshop-display` empty shelf + `vignette-first-delivery` + factual receipt cards), urgent priority suppression (`save paused/error`, `view.pending`, imminent breach), and opt-in `DEV`/`visual-review` diagnostics (eliminated in production bundle).

### 6. H4 / W2 — Candidate Worker Host, Comparison Cards, Finance/Remedies & EXP-14 Batch 2 Removal (`B-W2`) (2026-11-17)
- **Implementation SHA**: `7f500b9a9982ef6f7f23ace8fa426f7fc2f31c28`
- **Track B Released SHA Merged**: `244018cfae492cf1196299d0fbd967f32c9b805e` (`9697b2f9`)
- **Evidence**: `../commission-evidence/experience31/h4/7f500b9a9982ef6f7f23ace8fa426f7fc2f31c28/`
- **Owned Files Modified / Created**:
  - `apps/web/src/experience-worker.ts`, `apps/web/src/experience-worker-host.ts` (new): dedicated Web Worker entry & client (`createSuggestionClient`) calling `suggestAssignmentsFromSnapshot` from `oot-platform/worker` over readonly `content.ts`, measuring `snapshotCloneMs` + `mainThreadBlockingMs` + `roundTripMs` (`<= 50 ms` budget tracking), enforcing strict `acceptSuggestionResult` (`matchesRevision(result, live) && result.draftKey === currentDraftKey`) stale drop, plus `suggestViaWorkerProtocol` protocol test helper.
  - `apps/web/src/experience-ui-copy.ts`: synced all W2 search, duo-explanation, and finance bill reason codes.
  - `apps/web/src/experience-adapter.ts`: added `stableDraftKey`, `formatFactLine`, `computeCandidateDelta`, and `formatDuoEvaluations` (pure formatters over `DuoExplanation`, filtering missing-partner entries by `teamActorIds`).
  - `apps/web/src/use-game.ts`: exposed `requestSuggestions(jobId, draft)` with clone-time measurement and live identity verification.
  - `apps/web/src/commission-workbench.tsx`, `apps/web/src/ui2.css`: added 3-candidate comparison cards (`省资源 / 稳质量 / 赶交期`, 3-col side-by-side desktop `>= 900px`, stacked `1fr` narrow `< 900px`) with delta vs draft, editable `"填入草稿（可改） / Load draft (editable)"` button (never auto-accepts, assigns, or spends), 0-plan empty state, `Reuse last team` draft prefill, actionable `ui2-remedies-box` remedies, and `explainTeamDuos` wiring.
  - `apps/web/src/journal-hub.tsx`, `apps/web/src/studio-hub.tsx`: wired `FinanceExplanation` (`cash`, `loan`, `unfinishedAdvances`, `netSolvency` explicitly labeled non-profit with `financeNetSolvencyNote`, `recentLedgerSummary` for the last 10 ledger rows labeled cash net not profit, and `bills` breakdown).
  - `apps/web/src/scene-layout.ts`, `apps/web/src/living-adapter.ts`, `apps/web/src/office-scene.ts`, `apps/web/src/partner-profile.tsx`, `apps/web/src/ui2-logic.ts`, `apps/web/src/alpha-app.tsx`: **EXP-14 Batch 2 deleted** (`actorEffectiveContext`, `isActorOverloaded`, `activeStationBonus`, `evaluateTeamDuos`, `findActiveTeamDuos`, `ledgerWindowSummary` removed; UI/Pixi/chatter now consume `CapacityExplanation` from `session.explainActorCapacity`).
  - `apps/sim-cli/{ui2-foundation,office-ui-review,living-ui,experience-ui,experience-suggestions}.test.ts`: updated post-EXP-14 tests (`experience-suggestions.test.ts` lines 1–60 preserved verbatim; lines 62–83 migrated to verify `formatDuoEvaluations`, `reactionFor`, `explainCapacity`, `explainMoney` without deleted rule copies), plus added H4 tests for Candidate Worker parity/stale drop and SaveEncoder Worker parity across `build-2`, `guide-1`, and the `seed21` `962`-command stress trajectory.
- **Checks**:
  - `git grep -n "advancePeriodInfo\|resolveStopReason\|actorEffectiveContext\|isActorOverloaded\|activeStationBonus\|evaluateTeamDuos\|findActiveTeamDuos\|ledgerWindowSummary" apps/` -> **`0` matches** (`exit 1`).
  - `pnpm check` (`task-1134`): `tsc -b --pretty false`, `eslint packages apps`, **52 test files / 464 tests PASS**, `oot-web` (`dist/assets/experience-worker-BAnIXkIv.js` + `save-encoder-worker-DdyG00iU.js`, `fixtureReachable: false`) + `oot-dsh` builds PASS.
  - `git diff --check` clean; protected-path diff vs `244018cfae492cf1196299d0fbd967f32c9b805e` = `0` files.
  - Note: H4 real-browser interactive & `<= 50 ms` Worker timing verification runs in H5/W4 alongside W3 integration.

### 5. H3 — Shared Period/Activity Previews, 7 Learning Nodes, Sample Art Approval & EXP-14 Batch 1 Removal (`B-W1b`) (2026-11-17)
- **Implementation SHA**: `3af807852e9680d77c1cb314d78420407103eeaf`
- **Track B Released SHA Merged**: `7a9f3df6f120fd8fac1c955580cc70f934a6ff03` (`bf196bea`)
- **Evidence**: `../commission-evidence/experience31/h3/3af807852e9680d77c1cb314d78420407103eeaf/`
- **Owned Files Modified / Created**:
  - `apps/web/src/experience-adapter.ts` (new): pure UI formatters over `NextPeriodPreview`, `ActivityPreview`, and stop entries (`formatAdvanceDisplay`, `describeActivityPreview`, `actorStopKindFromPreview`) with zero rule duplication.
  - `apps/web/src/experience-art-slot.tsx` (new) & `apps/web/src/advance-preview-ui.tsx` (new): `<ExperienceArtSlot>` consuming Track B `experienceArt()` whitelist with lazy decoding, focal `object-position`, dark scrims, inline vignette badge, and full text/button fallback; shared `<AdvancePreviewPopover>` consumed by both `HudBar` and `StageHubShell`.
  - `apps/web/src/hud-bar.tsx`, `apps/web/src/stage-hub.tsx`: shared `previewNextPeriod()` toggle (`>= 44×44`), Escape-closes-popover-only (`preventDefault()` + `suppressEscCloseRef` guard keeping `StageHub` open + returning focus).
  - `apps/web/src/partner-profile.tsx`, `apps/web/src/commission-workbench.tsx`, `apps/web/src/messenger-drawer.tsx`, `apps/web/src/bark-overlay.tsx`, `apps/web/src/studio-hub.tsx`, `apps/web/src/journal-hub.tsx`, `apps/web/src/alpha-app.tsx`: wired real `previewActivity(command)` across social chat/gift/meal/study/recall/overtime/fine-tune/align/story/clarify/tea/respond/expedition/0-slot chat-reply; highlighted night recovery skip and 0-slot Messenger separation.
  - `apps/web/src/onboarding.tsx`: upgraded to 7 per-lineage learning nodes (`oot-ui:<lineageId>:learning`) supporting individual skip, skip-all, and reopen-all without mutating domain save facts.
  - `apps/web/src/ui2-logic.ts`, `apps/web/src/living-adapter.ts` + `apps/sim-cli/{ui2-foundation,living-ui,experience-ui}.test.ts`: **EXP-14 Batch 1 deleted** (`advancePeriodInfo`, `resolveStopReason` removed; `pickStageChatter` consumes `previewStops`).
  - `apps/web/src/ui2.css`, `docs/experience31/art-slots.md`: responsive & dark-mode layout fixes + **§5 W1 Two-Sample 5-Viewport Browser Review Verdict — `APPROVE`** for `outcome-tea-menu` and `vignette-rest-corner`.
- **Checks & Real Browser Verification**:
  - `pnpm check` (`task-925`): `tsc -b`, `eslint packages apps`, **50 test files / 446 tests PASS**, `oot-web` (`dist/assets/experience-module-graph.json` `fixtureReachable: false`) + `oot-dsh` builds PASS; `git diff --check` clean; `git grep -n "advancePeriodInfo\|resolveStopReason" apps/` = `0` matches.
  - Real Chromium (`http://127.0.0.1:4192/` & HTTP 404 art fault server `http://127.0.0.1:4193/`, servers stopped afterward, `0` console errors, no `{ force: true }`, viewport restored to `1280×720`):
    - Verified `AdvancePreviewPopover` in both HUD and `StageHub` (clock unchanged, `Escape` closes popover without advancing or closing `StageHub`, returns focus to `.stage-hub-preview-btn`), 0-slot Messenger note, Night advance + `page.reload()` persistence, `ActivityPreview` on all Partner actions + fine-tune/align, and 7 learning nodes skip/skip-all/reopen-all.
    - Verified 5 viewports (`1280×720`, `768×1024`, `844×390`, `560×800`, `390×844`) × Light/Dark × ZH/EN (`dockInfoXOverlap = 0` with `+8px` gap on `390×844`; `.scene-left-stack.bottom = 324.29 <= dockBox.top = 330.29` on `844×390`; `.ui2-art-badge.is-inline` `+8px` inside `.ui2-art-frame` with zero clipping/overlap; `outcome-tea-menu` & `vignette-rest-corner` **APPROVED**), plus genuine HTTP 404 image fallback (`data-art-state="fallback"`, `imgCount: 0`, CTAs clickable).

### 4. H2 — Real Save Coordinator, Worker Encoder & Dual-Tab Recovery (`B-W1a`) (2026-11-17)
- **Implementation SHA**: `ec77ea84d7148f930bd1391f3a86e6aa16a72e09`
- **Track B Released SHA Merged**: `7a9f3df6f120fd8fac1c955580cc70f934a6ff03` (`bf196bea`)
- **Evidence**: `../commission-evidence/experience31/h2/ec77ea84d7148f930bd1391f3a86e6aa16a72e09/`
- **Owned Files Modified / Created**:
  - `docs/experience31/ux-c0.md`: added §6.4 acknowledging Track B's amended longer save/replay stress fixture (`experience-long-fixture.ts`: `seed21`, `962` commands, `240` cumulative slots across `3` runs, SHA256 `eb98024438e47e62e752d994fc105ecda4ae43793db1062d23ab34976bd870f4`).
  - `apps/web/src/office-lab.ts`: adapted `LabSaves` to `SaveStorage` (`write` supports `'checkpoint'` vs `'boundary'` atomic `backup-1..5` rotation + `SaveMeta`, preserving 3-arg compatibility).
  - `apps/web/src/save-encoder-worker.ts`, `apps/web/src/save-encoder-host.ts` (new): Web Worker `SaveEncoder` delegating to `defaultSaveEncoder.encode(input)` from `oot-platform/worker` (preserving `SaveInput.throughCommand` prefix replay + canonical save bytes), plus Node/fallback parity helper.
  - `apps/web/src/use-game.ts`: wired real `CheckpointCoordinator` per lineage, non-blocking command enqueue (clearing `busy` without awaiting storage), monotonic `matchesRevision` pill guard, `switchImportedSession` two-state barrier across `load`/`importFile`/`restart`, `HostLineageMap` injection & `LINEAGE_RESET` notice, `visibilitychange === 'hidden'` best-effort `drain()`, and `oot:checkpoint` host handler.
  - `apps/web/src/experience-ui-copy.ts`, `apps/web/src/dialog.tsx`, `apps/web/src/alpha-app.tsx`: honest Host backup wording (`hosted={game.hosted}`) acknowledging protected `apps/dsh/**` server rotation, plus `LINEAGE_RESET` / `SESSION_SWITCHING` / `SWITCH_REQUIRES_CONFIRMATION` feedback copy.
  - `apps/sim-cli/experience-ui.test.ts`: added H2 tests (`LabSaves` 50 checkpoints zero backup pollution + boundary rotation, Worker `SaveEncoder` `throughCommand` byte parity, `CheckpointCoordinator` + `switchImportedSession` normal drain vs paused confirm/cancel).
- **Checks & Browser Verification**:
  - `pnpm check` passed: `tsc -b`, `eslint packages apps`, **50 test files / 445 tests**, `oot-web` (built `save-encoder-worker-*.js` + `experience-module-graph.json` with `fixtureReachable: false`) + `oot-dsh` builds.
  - `git diff --check` passed; `git diff --name-only 7a9f3df6..HEAD` touches strictly Track A owned files (`0` protected/Track B edits).
  - Real Chromium verification on built `vite preview` (`http://127.0.0.1:4191/`, server stopped afterward, `0` console errors, no `{ force: true }`):
    - Verified end-to-end accept/assign (`menu` + `qwen`) -> advance -> Messenger read/reply -> `已保存` -> `边界备份 1..5` stay `空` across normal checkpoints -> page reload (`agent-tab-5`) restores exact period/cash/job/Messenger-read state. (Note: an earlier initial tab `agent-tab-2` rendered empty `#app` on Step 75 reload, whereas fresh `agent-tab-5` mounted cleanly and passed two consecutive reloads cleanly; tracked in H3/W4 re-check.)
    - Verified dual-tab `BroadcastChannel` conflict: Tab B advance pauses Tab A -> persistent `SaveAlertBanner` (`保存暂停`) + Export (`out-of-tokens-alpha.json`) -> `SwitchConfirmDialog` Cancel preserves Tab A -> Export & Confirm recovers Tab A cleanly to Tab B's evening state.

### 3. C0 Revision 2 Co-Signature & Reason Sync (2026-11-17)
- **Implementation SHA**: `a19e2f68330deeedccf75b7152c27ead33e7e7a3`
- **Record SHA**: `cdfc726ef94510f1ca9da0904969e3ce06e62e16`
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
| A-W1-5 | Group chat read vs replied separation (`oot-ui:<lineageId>:threads`) | Completed | `00a55ba` + `ec77ea8` (live `session.lineageId` reload verified) |
| A-W1-6 | First-order live forecast fit & editable sample squad | Completed | `00a55ba` + Vitest + Chromium verified |
| A-W1-1 | Save status UI, alert banner, boundary backup copy, SwitchConfirmDialog, H2 wiring | Completed (`B-W1a` integrated) | `ec77ea8` + Vitest (50/445) + Chromium dual-tab/reload verified |
| A-W1-2/3/4 | Advance preview, Activity preview (all slot/overtime commands), 7 learning nodes, 2-sample art gate | Completed (`3af8078` + `art-slots.md` §5 `APPROVE`) | Vitest (50/446) + 5-viewport Chromium + 404 art fallback |
| A-W2-1/2/3/4 | Candidate comparison (Worker host, 3 cards, delta, 0-plan), remedies, finance, reuse team, EXP-14 Batch 2 removal | Completed (`7f500b9` + W4 browser `<=50ms` `0.20ms` verified) | Vitest (52/469) + 0 EXP-14 copies + Chromium perf |
| A-W3-1 | Delivery feedback order (`I4` assessment fixed), 2 duo short chains, Outcome Wall, all 8 Art-Batch 7 slots | Completed (`0cd7f5a` + `c8cf69f` + `art-slots.md` §6 `APPROVE`) | Vitest (`I1–I4`) + 5-viewport Chromium + 404 fallback |
| A-W4-1 | 20-case real-browser matrix, `elementFromPoint`, frozen 3-input perf matrix, fault recovery, Wave 2 regressions | Completed (`c8cf69f`, host rotation conflict & `VF5 HOLD` retained) | Chrome/152 (`0` overflow/`<44px`/`hitFailures`), all servers stopped |
