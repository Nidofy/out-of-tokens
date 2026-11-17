# C0 revision 2 update (2026-11-17; not frozen)

A review received from design SHA 4c5602b1d8d7788e270a90e3106ea3fffee81e8d and external c0-signoff.md. A approved Promise abandonment, per-actor activities and measurement protocol; B accepts A art-slot specifications as production input, not as sample acceptance.

Current runtime additions: GameSession.previewActivity(Command), prepareImport, switchImportedSession; HostLineageMap, HostSaves optional third constructor argument for a persistent map. StoredSave.lineageReset flags unknown Host identity. Successful restart regenerates lineage. A must drain/replace the coordinator around restart; old coordinator correctly rejects the new lineage.

Boundary backpressure is replaced: one active snapshot and one latest pending snapshot remain; FIFO boundary markers retain only revision/command-count integers. Encode each boundary prefix before the latest checkpoint. SaveInput.throughCommand?:number tells the encoder to replay that exact prefix and canonically save it; it must NOT encode input.state when this field is present. defaultSaveEncoder validates bounds and retains replay/hash validation. This adds CPU work in the encoder, never in enqueue. A Worker encoder must handle this field; request A review before H1 freeze. No additional retained snapshot queue and no boundary-triggered throw during normal enqueue.

switchImportedSession locks commands, fully validates import before abandoning anything, drains normal state or requires confirmed:true for abnormal state, awaits submitted writes, commits identity atomically, disposes old coordinator, returns saved:false and unlocks. Caller reads a fresh CAS token explicitly, creates a new coordinator and enqueues import/load boundary. Failure/cancellation does not silently reset identity or discard pending data. Export and confirmation UI stays A-owned.

Activity preview covers deterministic actions (campaign including expedition/tea/duo/chat-reply/train/align, overtime, respond, and other non-settlement commands). Clarify shares deterministic reservation validation with execution but never draws clarification RNG or previews hidden results. advance/choose/deliver/restart return ACTIVITY_NOT_SUPPORTED; they are settlement/switch boundaries, not activity previews. Dedicated next-period preview remains pending. Amounts are signed cash/research costs; actor gains/losses are certain state deltas. Returned relocatesTo includes expedition. CapacityExplanation.activeEfficiency and FinanceExplanation.recentLedgerSummary fields are in the draft; their runtime explanation methods remain W2 work.

All nine named C0 fixtures now use experienceFixture(name, content), returning developmentOnly:true, WorkerSnapshot, SaveStatus and optional suggested Command. They are controlled layout/test states, not replayable saves and never production data. Older night-rest/pending-choice fixture calls remain compatible. Production Vite rejects the fixtures import and emits assets/experience-module-graph.json from actual module IDs. Worker exports SuggestAssignmentsFromSnapshot as a type only; no runtime suggestion function yet.

Host POST remains byte-compatible {id,text,expectedRevision}; lastWritePolicy records intent, but the unchanged server still rotates on every auto write. Do not claim Host boundary semantics pass. Inject new HostLineageMap(localStorage, endpoint-specific-key) for durable preferences; default is safe in-memory mapping. Unknown/legacy/rotated Host record gets a fresh UUID plus lineageReset rather than guessing identity; Browser backups preserve actual metadata.

The earlier proposal below is historical where superseded by this update.

# C0 contract proposal — NOT FROZEN

Baseline d18241a; contract draft 1. Neither H1 nor B-W1a is released.

Compiled proposal: packages/oot-platform/src/experience-contract.ts. Runtime checkpoint contracts: checkpoint-contract.ts. The proposal deliberately does not assert that GameSession implements ExperienceSession: previews, explanations, candidate search and learning/receipt projection remain to implement. A must not call these methods yet. No throwing placeholder implementation is installed into GameSession.

Available runtime APIs: GameSession.workerSnapshot(), checkpointSnapshot(), lockCommands(), importSave(text, optionalSlotLineage); CheckpointCoordinator; defaultSaveEncoder; BrowserSaves.write(id,text,expectedRevision,policy,meta). worker subpath exposes encoding and revision matching only; suggestAssignmentsFromSnapshot remains pending. fixtures subpath supplies two explicit development layouts, not domain evidence. Root index never imports fixtures.

Identity: contract/contentVersion/revision/lineageId must all match before accepting an asynchronous result. draftKey additionally binds candidate results to a specific editable draft. workerSnapshot owns detached State; A transports it and must not interpret it or synthesize State from GameView. UUID belongs to platform, never domain RNG or save bytes. Slot loads pass stored meta.lineageId; absent legacy identity and file imports get fresh UUID. Failed imports preserve identity.

Units: absolute slots are integer simulation slots; nextSlot means current slot settlement plus one. Monetary facts use cash, quota/capacity remain distinct units. Assignment station efficiency is a ratio. Positive activity cash/research fields represent cost. Activity actors[] is proposed instead of a single aggregate because tea/duo/overtime can affect several actors. This is a draft change requiring A review.

Certainty proposal: deterministic scheduling membership is certain; amounts affected by random events require no-event-interference, resource-conditioned execution requires resources-available, quality projection requires no-new-defects and personal-condition-unchanged. Preconditions are nonempty typed arrays. Final per-field matrix and controlled fixtures still required before H1; no blanket conditional escape.

Saving integration:
1. After successful domain command capture/enqueue, do not await storage to release ordinary busy. Encoder starts in a later task, but default encoder still runs replay on the main thread; this is NOT a performance pass.
2. Maximum one executing and one pending snapshot. Pending ordinary snapshots coalesce. A pending boundary currently requires drain before another enqueue (BOUNDARY_DRAIN_REQUIRED). Boundary/backpressure behavior is a C0 design issue, not H2 acceptance.
3. Normal switch: lockCommands(); await drain(); require saved/idle, then import/load; dispose old coordinator, create new coordinator with explicitly loaded CAS revision, enqueue boundary, finally unlock. A failed import keeps old coordinator/session. Do not update expectedRevision to evade conflicts.
4. Abnormal switch: A provides export and explicit confirmation. await abandonPending(true), then successful import/load/restart; dispose old coordinator. Cancellation calls neither abandon nor import. abandonPending returns Promise<void>, unlike the planning pseudocode's void, so submitted I/O settles before switching.
5. On unavailable storage, successful import may continue in memory; enqueue produces exportable error, never saved. Automatic retry only retries encoding/writing, not commands. Paused conflicts require explicit recovery.
6. Newlineage/restart handling, fully orchestrated switch helper, Host lineage mapping and Host checkpoint rotation capability remain open. Host transport body remains unchanged. Its server-managed rotation cannot be claimed to honor Browser policy; A must not claim equivalent backups until resolved. Lab adapts optional policy/meta in its own files.

Browser writes default to legacy boundary behavior for existing callers. New coordinator always supplies explicit policy. Only day-end/restart/import/load map to boundary. Backups atomically copy complete prior records including meta; checkpoint never rotates. A updates its save-screen copy at integration.

Awaited A deliverables: state diagrams, five viewport wireframes, reason mappings, eight art slots with safety/crop/focus/dark/failure specifications, and recorded contract review. No A signature has been supplied. No common frozen SHA exists.
