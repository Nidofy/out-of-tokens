# Living Studio 3.1 Track A — Art-Batch 7 Eight Art-Slot Specifications

- **Date**: 2026-11-17 (Asia/Shanghai)
- **Owner**: Track A (`apps/web/src` slot layout, cropping, lazy loading, dark scrim, failure fallback); Track B (`art/art-batch-7/**`, `apps/web/public/art/experience/**`, `apps/web/src/experience-art.ts` asset generation & manifest)
- **Baseline**: `d18241a7aa9c5876367867fe78d9bfdd99d0f0ae`
- **Rule**: No duplicate dark-mode artwork; dark adaptation is CSS-owned. No in-image text, letters, numbers, watermarks, or real brand logos. Two W1 sample assets (`outcome-tea-menu` and `vignette-rest-corner`) must pass Track A's 5-viewport visual/DOM crop signoff before Track B generates the remaining six assets.

---

## 1. Global Slot Rules (All 8 Slots)

1. **Asset Entry**: Track A imports paths exclusively from Track B's pure-path `experience-art.ts` whitelist; zero hardcoded filenames in components.
2. **Loading & Startup Budget**: All 8 slots use `loading="lazy" decoding="async"`. None block initial game mount or Pixi scene startup.
3. **Failure / Offline Fallback**: Every `<img>` attaches `onError` setting local state `artFailed = true` (`data-art-failed="true"`). When failed or offline:
   - Hide broken `<img>` icon cleanly (`display: none` or collapsed placeholder frame) and render warm paper/walnut bordered fallback card with existing SVG `<Icon>` + full bilingual DOM text & primary actions.
   - **Zero** functional loss: outcomes, buttons, amounts, and warnings remain 100% readable and clickable.
4. **Dark Theme Handling (`:root[data-theme=dark]`)**:
   - Apply CSS image tone adjustment `filter: brightness(.86) contrast(1.04) saturate(.92)` plus directional scrim overlay (`rgba(20, 15, 12, 0.45)` to `0.78` under any overlaid DOM pill/badge) to protect WCAG AA contrast (`>= 4.5:1` for normal text, `>= 3:1` for large labels) against warm parchment artwork.
5. **Reduced Motion (`prefers-reduced-motion: reduce` / `[data-motion=still]`)**:
   - No parallax, zoom, or fade-in delay on art slots; images and accompanying text appear immediately.
6. **Honesty Constraint**:
   - Before delivery, card art shows a `示意 / Preview` badge (`data-state="preview"`).
   - Never display `outcome-community-web` as a live shipped platform unless its deliverable actually succeeded, never fabricate client use on `fail`/`breached`, and keep `outcome-workshop-display` strictly for empty/generic chronicle states.

---

## 2. Per-Slot Specifications (5 Viewports × Safe Zones × Crop × Fallback)

### 2.1 Outcome Cards (`3:2` Aspect, `768×512` RGB WebP, Target `<= 100 KB` each)

| Slot ID | Intrinsic / Format | Surface & Context | `object-fit` & `object-position` | Text / Badge Safe Zone | Dark-Mode Scrim | Image Error / Offline Fallback |
|---|---|---|---|---|---|---|
| `outcome-tea-menu` *(W1 Sample 1)* | `768×512` (`3:2`) WebP `<= 100 KB` | `CommissionWorkbench` preview/delivery card & `JournalHub` Outcome Wall | `cover`; `50% 45%` (keeps tabletop menu sheet & cup centered) | Top-left `12px` pill (`示意 / 已交付`), bottom `24%` strip kept quiet in art for optional DOM caption below/over scrim; main title/cash rendered in sibling DOM block (not overlapping core subject) | `brightness(.86)` + `linear-gradient(180deg, rgba(22,16,12,.18) 0%, rgba(22,16,12,.68) 100%)` | Paper card with `briefcase` SVG icon + DOM header `"奶茶菜单手账页 / Tea menu showcase"` + real quality/cash text |
| `outcome-cafe-sign` | `768×512` (`3:2`) WebP `<= 100 KB` | `CommissionWorkbench` preview/delivery & `JournalHub` Outcome Wall | `cover`; `50% 42%` (preserves wooden chalkboard A-frame top & easel) | Top-left badge safe (`16% × 14%`); all bilingual sign text rendered strictly in sibling DOM (never painted inside image) | Same `3:2` dark filter + subtle top/bottom vignette | Warm card with `sun` / `briefcase` icon + DOM bilingual sign title & outcome status |
| `outcome-community-web` | `768×512` (`3:2`) WebP `<= 100 KB` | `CommissionWorkbench` (`website` / scope routes) & `JournalHub` Outcome Wall | `cover`; `50% 38%` (keeps laptop wireframe + warm desk lamp above lower edge) | Top-right `18% × 14%` reserved for scope pill (`活动页方案 / Scope plan`); never imply full social network shipped | Same `3:2` dark filter + gradient scrim when status chip present | Warm card with `chip` icon + exact delivered scope label in DOM |
| `outcome-bookshop-system` | `768×512` (`3:2`) WebP `<= 100 KB` | `ProjectPanel` / `JournalHub` Outcome Wall (Bookshop System route) | `cover`; `50% 45%` (keeps counter register + shelf in central 60% zone) | Upper-left `18% × 14%` route tag (`系统路线 / System route`); all metrics in DOM below image | Same `3:2` dark filter + edge vignette | Warm card with `book` + `check` icons + phase receipt summary in DOM |
| `outcome-bookshop-guide` | `768×512` (`3:2`) WebP `<= 100 KB` | `ProjectPanel` / `JournalHub` Outcome Wall (Bookshop Service Manual route) | `cover`; `50% 45%` (centers bound notebook + bookmark ribbon) | Upper-left `18% × 14%` route tag (`服务手册 / Service guide`); zero overlaid paragraphs over subject | Same `3:2` dark filter + edge vignette | Warm card with `book` icon + phase receipt summary in DOM |
| `outcome-workshop-display` | `768×512` (`3:2`) WebP `<= 100 KB` | `JournalHub` Outcome Wall empty state / studio display shelf | `cover`; `50% 50%` (balanced pegboard/desk composition, low contrast center) | Entire image low-contrast decorative backdrop; empty-state guidance (`"完成首份委托后，成果卡片将陈列于此"`) in DOM | Same `3:2` dark filter + `rgba(22,16,12,.45)` wash | Text-only warm bordered empty state (`<= 44px` icon + guidance CTA to Jobs) |

### 2.2 Vignette Banners (`3:1` Aspect, `960×320` RGB WebP, Target `<= 150 KB` each)

| Slot ID | Intrinsic / Format | Surface & Context | `object-fit` & `object-position` | Text / Badge Safe Zone | Dark-Mode Scrim | Image Error / Offline Fallback |
|---|---|---|---|---|---|---|
| `vignette-rest-corner` *(W1 Sample 2)* | `960×320` (`3:1`) WebP `<= 150 KB` | `PartnerProfile` night/rest header strip & `AdvancePreviewPopover` night banner (never auto-fullscreen) | `cover`; `68% 50%` (armchair, mug & warm lamp anchored right; left `55%` low-contrast wall/desk space) | **Left `55%` horizontal strip** kept clean & low-contrast for DOM overlay / side-by-side rest cost headline + `"跳过今晚睡眠恢复"` tag (`WCAG AA >= 4.5:1`) | `brightness(.84)` + `linear-gradient(90deg, rgba(22,16,12,.82) 0%, rgba(22,16,12,.52) 55%, rgba(22,16,12,.22) 100%)` | Solid walnut/ivory gradient strip (`min-height: 76px`) with `moon` / `cup` icon + full DOM night recovery copy |
| `vignette-first-delivery` | `960×320` (`3:1`) WebP `<= 150 KB` | `DeliveryFeedbackCard` top header strip (Order: Result → Reason → Cash → Partner response) | `cover`; `66% 48%` (counter/package celebration on right; left `55%` quiet paper background) | **Left `55%`** kept clear for DOM outcome badge (`验收通过` / `未通过`) & title; partner portrait & cash sit cleanly in DOM below banner | `brightness(.84)` + `linear-gradient(90deg, rgba(22,16,12,.84) 0%, rgba(22,16,12,.56) 58%, rgba(22,16,12,.20) 100%)` | Accent top bar (`--poster-color` / `--brass`) with `QualitySealSvg` + full 4-step DOM feedback (`Result -> Reason -> Cash -> Partner`) |

---

## 3. Five-Viewport Rendered Dimensions & Cropping Matrix

| Slot Group | `1280×720` Desktop | `768×1024` Tablet | `844×390` Landscape | `560×800` Narrow | `390×844` Mobile |
|---|---|---|---|---|---|
| **Outcome Cards** (`768×512`, `3:2`) | Grid `repeat(3, minmax(0, 1fr))` in Outcome Wall (`~310×206px`, `1.5:1`); Workbench single card `~360×240px` (`1.5:1`) | Grid `repeat(2, minmax(0, 1fr))` (`~320×213px`, `1.5:1`) | Grid `repeat(2, minmax(0, 1fr))`, height clamped `clamp(112px, 34dvh, 172px)` (`~300×132px`, `2.27:1` center-crop via `50% 45%`) | `1fr` card (`~480×220px`, `aspect-ratio: 16/9`, `max-height: 220px`, focal `50% 45%` keeps center subject unclipped) | `1fr` card (`~334×186px`, `aspect-ratio: 16/9`, `max-height: 188px`, `0px` horizontal overflow) |
| **Vignette Banners** (`960×320`, `3:1`) | Full dialog column width (`~540×180px`, `3:1`, `max-height: 180px`) | Full panel width (`~660×180px`, `3.6:1`, right subject preserved via `68% 50%`) | Compact strip `height: 88px` (`~660×88px`), right lamp/mug stays visible, DOM text stays left-aligned with scrim | Width `~496×165px` (`3:1`), left text readable at `>=13px` | Width `~342×114px` (`>=114px` tall, never collapsed to unreadable strip; text wraps inside left scrim box or renders cleanly below if height < 110px) |

---

## 4. Total Asset Size Budget & W1 Sample Gate

- **Per-Asset Targets**: Outcome cards (`6` assets) `<= 100 KB` each; Vignette banners (`2` assets) `<= 150 KB` each; Total Art-Batch 7 runtime footprint `<= 900 KB` (`apps/web/public/art/experience/*.webp`).
- **W1 Two-Sample Gate (Required before Track B creates the other 6 assets)**:
  1. Track B publishes `outcome-tea-menu` and `vignette-rest-corner` via `experience-art.ts`.
  2. Track A renders both in `CommissionWorkbench` / `PartnerProfile` / `JournalHub` across all **5 viewports × 2 locales × 2 themes**.
  3. Track A verifies in real Chromium: `naturalWidth > 0`, zero unreadable overlaid text, focal subject unclipped (`object-position` verified), dark scrim contrast readable, and failure fallback cleanly preserves layout & buttons.
  4. Track A records explicit **APPROVE** or **REWORK (with exact px crop delta)** in `docs/experience31/art-slots.md`, `docs/experience31/track-a.md`, and `commission-evidence/experience31/handoffs/track-a/`.

---

## 5. W1 Two-Sample 5-Viewport Browser Review Verdict (H3)

- **Reviewed Track B Baseline**: `7a9f3df6f120fd8fac1c955580cc70f934a6ff03` (`art/art-batch-7/manifest.json`)
- **Samples Reviewed**:
  - `outcome-tea-menu` (`768×512`, `68,764 B <= 100 KB`, `sha256: 5fa39c0ba38150bb3507e2f52fecaa3bd6ca66096de4682cdce26999b20638c`, `object-position: 50% 45%`)
  - `vignette-rest-corner` (`960×320`, `27,092 B <= 150 KB`, `sha256: 58d3213405597fdc41528c54dc8570aafa93424f5ce22c3b3cb9ec417cfafc96`, `object-position: 68% 50%`)
- **Real Chromium Measured Render Sizes & Inspection (`http://127.0.0.1:4192/`, HTTP 200, `data-art-state="loaded"`, zero `{ force: true }`, zero console errors)**:
  - **`1280×720`**:
    - `outcome-tea-menu` (WorkBrief Light+ZH): `756.86 × 240.00 px` — clipboard menu, daisies, 3 sample cups, and porcelain teacup unclipped; zero baked text; caption card below image cleanly separated.
    - `vignette-rest-corner` (Partner Profile Qwen Dark+EN): `627.38 × 209.13 px` (`3:1`) — left dark gradient scrim holds `"Evening & night"` badge + headline + subtitle clearly; lamp, emerald armchair, and window moon sit unclipped on right. (Onboarding sidebar Light+ZH: `261.71 × 104+ px`.)
  - **`768×1024` (Dark+ZH)**:
    - `outcome-tea-menu`: `424.86 × 240.00 px` — dark tone filter + bottom gradient scrim readable; menu clipboard & cup framed cleanly.
    - `vignette-rest-corner`: `261.71 × 104+ px` — clean readability.
  - **`844×390` (Dark+ZH & Dark+EN)**:
    - `outcome-tea-menu`: `504.86 × 240.00 px` — framed cleanly in landscape modal.
    - `vignette-rest-corner` (Dark+EN rebuilt): `249.71 × 132.94 px`, `.ui2-art-badge.is-inline` `+8.00 px` inside frame top (`badgeNoTopClip: true`); `.scene-left-stack` `bottom = 324.29 <= dockBox.top = 330.29`.
  - **`560×800` (Dark+EN rebuilt)**:
    - `outcome-tea-menu`: `502.86 × 240.00 px` — dark scrim legible; menu centerpiece intact.
    - `vignette-rest-corner`: `261.71 × 132.94 px`, `.ui2-art-badge.is-inline` `+8.00 px` inside frame (`badgeNoTopClip: true`), zero text/badge overlap, right armchair visible.
  - **`390×844` (Dark+EN & Light+ZH rebuilt)**:
    - `outcome-tea-menu`: `333.14 × 222.09 px` (`3:2` ratio, caption clean underneath).
    - `vignette-rest-corner`: `261.71 × 132.94 px`, `.ui2-art-badge.is-inline` `+8.00 px` inside frame (`badgeNoTopClip: true`), zero overlap with bottom dock (`+8.00 px` horizontal gap).
- **Failure / Offline Fallback Verified (`http://127.0.0.1:4193/`, real HTTP `404` on `/art/experience/*.webp` & `/sw.js`)**:
  - Both `vignette-rest-corner` and `outcome-tea-menu` transitioned cleanly to `data-art-state="fallback"`, `imgCount: 0`, full `.ui2-art-fallback` copy rendered, and action buttons (`看伙伴精力与作息` / `跳过本条` / `接取委托`) remained enabled and clickable.
- **Verdict**: **APPROVE** (`outcome-tea-menu` = `APPROVE`, `vignette-rest-corner` = `APPROVE`, `0 px` asset rework requested). Track B is cleared to produce the remaining **6 Art-Batch 7 assets** matching the same typography-free composition, left low-contrast scrim safe zone (vignette), and file size limits (`<= 100 KB` outcomes, `<= 150 KB` vignettes, total `<= 900 KB`).
