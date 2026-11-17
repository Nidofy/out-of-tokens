# Living Studio3.1 fixed-SHA final review packet

- Tested integration: `6e8e84804fc5bfd55d3b181a94b9448d940b4f7c`.
- Accepted audit record: `4608c4a2ede6033d79275054e39184054a9dd0de`.
- Main implementation merge: `acb2dab6d7345ba698e19b0b37a3ec5ee05c7ea3`.
- Main implementation record: `5d4eec857518cafea4d97ab9b6cf84f8656d6997`.
- A implementation `c8cf69f59aee3f66e390a4944c6bb30c69929b44`, B implementation `0912342ac296e888f1d2fb7af526069953b20d2f`.

Decision: scoped technical PASS, local main merge completed; protected Host server rotation exception and historical VF5/Visual Freeze/physical/real-install holds remain. No push/deployment.

Read [final integration report](../../docs/experience31/final-integration.md) for H1–H6, EXP01–14, compatibility, art, raw browser matrix counts, timing scope and limitations. Evidence root: `D:/Documents/FeiyangChen/devApps/ai-game/commission-evidence/experience31/final-integration/6e8e84804fc5bfd55d3b181a94b9448d940b4f7c/`; hashed evidence index `evidence-hashes.json`.

Reproduce from the tested integration worktree or an isolated checkout with offline frozen-lock dependencies:

```powershell
pnpm check
pnpm exec vitest run --config ../commission-evidence/experience31/integration-h5/8d7dcc1fc6aa8e2c1146df7926c8dc0c46c7ca91/audit.config.ts
git diff --check
```

The external audit imports the integration worktree explicitly; keep it on the fixed reviewed code when reproducing. Expected: full52 files/469 tests PASS; original I4 factual-score audit1 PASS. Prior red logs remain under integration-h5. Main worktree additionally ran offline install, build and package verification6 PASS; initial sandbox permission failure retained. Performance repro server/client/bootstrap and exact frozen inputs are archived under transport-probe/ and queue-probe/; use a fresh output directory to avoid overwriting results, visible Chromium,5 warmups then30 fixed samples. Do not reinterpret isolated probes as universal whole-app/Host performance.
