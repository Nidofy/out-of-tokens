# Stage B version portraits

Eight advanced versions use separately assembled SVG portraits: DeepSeek R1, QwQ,
Llama 3.1, Mistral Large, GPT 4o, Claude Sonnet, Kimi K2 and Gemini Pro. Base,
unknown and mismatched character/version pairs retain the original portrait.
Grok, GLM, MiniMax and Seedance have only a base version in current content;
this asset change does not invent versions or change rules.

`node art/stage-b/generate.mjs` deterministically assembles the existing selected
AI Village PNG parts using their original parent hierarchy, pivot, offset, size
and z order. The advanced stance uses the authored happy face, arms at -12/+12
degrees and head at -2 degrees. Clothing, identity and original files are intact.
This is a derived pose, not a claim of newly illustrated costumes or new motion.

Source: AI Village commit `f4c2ac633d5ad5e9ee0f7c2cd66bd1af9fc90352`, as already
recorded in `art/ai-village-chibi-v1/`. Each source byte hash, output hash, pose
and size is in `apps/web/public/art/stage-b/manifest.json`. The exact MIT text
and DeepSeek/Nidofy notices accompany these selected derivatives in LICENSE.txt.
This does not assert rights over unrelated community images, trademarks or
third-party characters. No external reference screenshot is included.

SVGs embed PNGs so that an HTML image can load them without external SVG image
dependencies. Total SVG bytes: 17,181,555; this is an explicit cold-cache and
offline-package cost to measure in VF5, not decoded texture or GPU memory.
Profile rendering uses the existing 160px presentation and original fallback;
all eight outputs are covered by the generated offline precache manifest.

The seven scene backgrounds remain byte-identical. Their existing source and
generation records are `art/studio-v1/manifest.json`; this work does not expand
that provenance into a new blanket license claim. Current background hashes
and visual evidence are stored outside the repository in
`../commission-checkpoints-20261113/`.
