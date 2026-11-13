# Art Batch 1 candidate handoff — 2026-11-13

Status: integrated in Art Batch 1 after the other task committed 1745653. Earlier candidate-only notes below are historical; see docs/ART_BATCHES_1113.md for current validation.
User confirmed existing VF4-C / Stage B changes belong to another active task and instructed this task not to integrate overlapping files.

Produced with built-in image_gen: eight Stage B portrait masters and one original app icon master. Runtime exports: eight transparent 512x512 WebP portraits, 192x192 and 512x512 opaque PNG icons, plus a 512x512 maskable candidate. Runtime total: 1,196,303 bytes. All portrait alpha ranges are 0–255.
PROMPTS.md contains exact prompts; manifest.json contains dimensions, bytes, SHA256 and tool parameters. Exact backend model ID and seed are not exposed; no inferred model name is claimed.
Reference images are the repository's existing AI Village portraits. The original source/license remains apps/web/public/art/ai-village/LICENSE.txt. Generated derivatives retain that provenance; no broader trademark or third-party rights claim is made.

Baseline at start: 7303578. Existing pnpm check passed 41 files / 333 tests and Web/DSH builds before candidate exports. This is a baseline result, not candidate integration acceptance.
Protected path git diff was empty at final inspection. git diff --check exited 0 but reported pre-existing/concurrent CRLF warnings. This task did not modify tracked source, shared status documents or existing art.
No browser or server was started. No checkpoint commit, push or deployment was made.

Remaining Batch 1 gates:
- Review character fidelity and framing at actual Actors / PartnerProfile sizes. Masters were visually inspected as candidates only; fine alpha fringes and luminous effects still require light/dark screen checks.
- Select runtime exports, update character resolver and SVG-specific tests only after the other task releases ownership.
- Validate PWA circular/squircle crops and favicon references; icon-maskable currently uses the same central-safe composition, not a separately validated crop.
- Copy accepted files into public, regenerate offline assets, run package verification and full pnpm check.
- Capture 4 viewports x 2 languages x 2 themes, HTTP/image/overflow and touch checks outside repository.
- Update STATUS and build log with verified results, then make local batch checkpoint.
Batches 2–4 have not started. Do not mark any batch accepted based on this candidate package.

