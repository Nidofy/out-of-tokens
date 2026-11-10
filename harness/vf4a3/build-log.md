# VF4-A3 evidence

## VF4-A3.1 correction and closure

- Independent review accepted A3 core and balanced performance, closing VF4A2-PERF-01. VF31-PERF-01 and full Visual Freeze 1 remain open.
- FOCUS-01 fixed in AlphaApp only: entering Actors schedules header focus after render, cancels on route change, and does not steal focus from an open dialog. Original management Dock trigger is preserved.
- CSS-01: explicit light poster subtitle selector defeats management captions. Poster button specificity also preserves impression colors during hover (generic button hover previously erased the poster background).
- CSS-02: desktop Claude strip spans top row, title/art share second row, status spans bottom row. Narrow Claude has 88px left art spanning rows and right strip/title/status. Only poster selectors changed.
- Complete pnpm check passed (check-a31-final.log), 38 files / 307 tests. Final matrix has 12 records, three each at 1280/844/560/390, all assertions true. Uses `:focus` Escape immediately after measuring jump focus, without focusing/clicking any header control. Measures all piece rectangles, transforms, columns, light subtitle colors and control sizes. Additional intermediate observations retained.
- Correction to the historical automation explanation below: body focus on the Studio-to-Actors route was an application defect, not merely an unfocusable automation target. The old verifier failed to check drawer focus. A31 verifier requires explicit final route-focus and one-key Escape assertions for all four viewports.
- A3 startup-* files remain byte-for-byte unchanged; no new performance batch. A3 original source-freeze saved as source-freeze-a3.json; current source-freeze represents A3.1. Updated gallery and visible Claude screenshots are review evidence, not public assets.

## Historical A3 execution record

- Baseline and final full pnpm check passed. Final: 38 files, 307 tests, TypeScript/ESLint/Web/DSH builds passed; check-focus-final.log.
- Four viewport matrix: 1280×720 zh/light, 844×390 zh/light, 560×800 en/dark, 390×844 zh/light. DOM geometry, control heights, focus and text stored per observation. Gallery filters, both profile states, version tabs, Claude transform, Studio entry, Escape/close tested. Core locations/map/S2/journal/settings smoke checks included.
- Recruitment uses existing vf4a2/project-chapter1-save.json in isolated delivery lab only. Four viewport successful command paths tested. Initial 390 recruitment lost focus when button unmounted; retained failed observation and repaired four-viewport retests. No player saves touched.
- A section-level Playwright press was not focusable; repeated Escape on its real header button. No application change was needed for that automation error.
- Pure tests cover all twelve visual contracts, engineering/six-skill deltas, recruitment blocker precedence and equality boundaries.
- Full source/asset whitelist, production probe absence, ports/cache cleanup and balanced sample validation: verify-delivery.mjs / delivery-verification.json.
- Browser snapshots capture actual DOM, not synthetic layouts. Null focusInDialog means no dialog was open. Initial focus failure is explicitly retained; other recorded controls pass height/overflow/focus checks. Visual review is a pilot, not full Visual Freeze 1 certification.
