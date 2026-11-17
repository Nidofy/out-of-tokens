# Track A W1 Two-Sample Art Crop Review — APPROVE

- **Reviewed Track B SHA**: `7a9f3df6f120fd8fac1c955580cc70f934a6ff03`
- **Review Record Commit (Track A)**: `3af807852e9680d77c1cb314d78420407103eeaf` (`docs/experience31/art-slots.md` §5)
- **Verdict**: **`APPROVE`** (both W1 samples passed all 5 viewports × Light/Dark × ZH/EN + real HTTP 404 failure fallback in Chromium; `0 px` asset rework requested)

## Samples Approved
1. `outcome-tea-menu` (`768×512`, `68,764 B <= 100 KB`, `object-position: 50% 45%`):
   - `1280×720`: `756.86 × 240.00 px`
   - `768×1024`: `424.86 × 240.00 px`
   - `844×390`: `504.86 × 240.00 px`
   - `560×800`: `502.86 × 240.00 px`
   - `390×844`: `333.14 × 222.09 px` (`3:2`)
   - Clean clipboard/daisies/3-cup + teapot centerpiece, zero baked text, readable dark caption below, clean `.ui2-art-fallback` on HTTP 404 (`imgCount: 0`).
2. `vignette-rest-corner` (`960×320`, `27,092 B <= 150 KB`, `object-position: 68% 50%`):
   - `1280×720`: `627.38 × 209.13 px` (`3:1` in Partner Profile) / `261.71 × 124+ px` (Onboarding sidebar)
   - `768×1024`: `261.71 × 124+ px`
   - `844×390`: `249.71 × 132.94 px` (`badgeNoTopClip: true`, `+8px` top inset inside frame)
   - `560×800`: `261.71 × 132.94 px` (`badgeNoTopClip: true`, `+8px` top inset inside frame)
   - `390×844`: `261.71 × 132.94 px` (`badgeNoTopClip: true`, `+8px` top inset inside frame)
   - Warm lamp + olive armchair + window moon sit unclipped on right; left wall scrim holds `"Rest vignette"` / `"Evening & night"` badge, title, and subtitle with clear contrast in both Light and Dark themes, and clean `.ui2-art-fallback` on HTTP 404.

**Green Light for Track B**: Codex is unblocked to generate the remaining **6 Art-Batch 7 assets** (`outcome-cafe-sign`, `outcome-community-web`, `outcome-bookshop-system`, `outcome-bookshop-guide`, `outcome-workshop-display`, `vignette-first-delivery` — note asset sizing targets `<= 100 KB` outcomes, `<= 150 KB` vignettes, total `<= 900 KB`, zero baked text, left quiet scrim zone on vignettes).
