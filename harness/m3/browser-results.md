# 2026-11-07 M3 browser contract verification

Real IAB, localhost:5181; scripts/dsh-contract-harness.mjs; disposable OS temporary profile. This is not a real DSH installation or a claim about the live village app.

First run reproduced `Failed to execute fetch on Window: Illegal invocation` and renderer fallback under Host CSP. Added failing automated fetch receiver regression: red-fetch-binding.log (1 failed/7 passed). Fixed bound fetch default; Pixi's inspected `pixi.js/unsafe-eval` compatibility module uses static implementations in place of generated Function. CSP did not gain unsafe-eval.

Retest: map AI工坊→iframe opens with no storage warning and drawn workshop; advance morning→afternoon→save and close; reload parent→reopen→afternoon retained. Screenshot host-restored.png. Close→unload adapter→owned launcher/dialog removed→neighbor library button still works. Screenshot host-unloaded.png. Host scope never read the actual user's Profile. Real installation/connection reset acceptance is pending.

Web IndexedDB cross-tab supplement: two IAB tabs on localhost:5180, both start with empty manual-1. A saves; B receives external-change notice and autosave pause. Opening B's save panel refreshes display but does not refresh expected revision. B save is rejected with SAVE_CONFLICT; original timestamp stays unchanged. Explicit load succeeds. Screenshot browser-cas-conflict.png. This tests actual BroadcastChannel + IndexedDB behavior, supplementing automated transaction tests.
