# Art batches fixed checkpoint — 2026-11-13

Implementation checkpoints:
- Batch 1: 6fd5fe6 — 8 advanced portraits, PWA icon family.
- Batch 2: 0a252fa — 2 improved day backgrounds, 7 warm night variants, decoded swapping.
- Batch 3: ac7427e — 3 souvenirs, 3 rivals, 1 existing project, 5 event categories.
- Batch 4: 0013800 — 9 upgrade icons, 1 empty-state illustration, 4 prototype layers.

Final implementation reviewed locally: 0013800. This record is documentation only.

Evidence root: ../commission-evidence/art-tools/
- batch1-check.log and art-gen-batch-1: 144 final captures.
- batch2 final check logs and art-gen-batch-2-before / art-gen-batch-2: 112 baseline / 224 final captures.
- batch3-check.log and art-gen-batch-3: 128 final captures.
- batch4-check.log and art-gen-batch-4: 192 final captures; batch4-visual-first-failure.log retains the navigation timeout before full rerun.
All final matrix results.json files report no broken image, HTTP/page error, or document horizontal overflow. Batch 4 also checks upgrade button rectangles >=44px. Matrices cover 1280×720, 844×390, 560×800, 390×844 × zh/en × light/dark. Screenshots use isolated view fixtures and memory saves, not user saves. 688 final captures plus 112 baseline captures.

Final pnpm check: 41 files / 335 tests, typecheck, lint, Web and DSH build passed. git diff --check passed. All Batch 2–4 provenance files rehashed successfully after final export. package-verification.test.ts validates public and dist runtime hashes, offline list membership and per-asset budgets.

Relative to 1745653, ai-village/**, packages/**, README.md, pages.yml, pnpm-lock.yaml, icons.tsx and commission-tracker.tsx have zero diff. Other task's d3a163e performance HOLD record is preserved. No push/deployment. Port 5191 and the harness Node/Playwright processes confirmed absent after closing.

Limits: night geometric registration has 0.42–0.56px median inlier error; generated textures are not identical pixels. Tier 2/3 are archived concept references, with fixed canvas, anchor and front face-safe rectangle; not runtime furniture and not sold. Future integration needs real seated skeleton/alpha hit testing. No independent reviewer, physical device or complete cold-cache/GPU/long-session performance PASS is claimed; VF5 HOLD is unchanged.
