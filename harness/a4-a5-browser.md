# A4/A5 browser observations · 2026-11-07

- IAB, DEV scene-lab fixture; all 12 original AI Village characters, no useGame/storage.
- At 680×900: two rows of six, work/review differentiated, Office 0/1/3 furnishings rendered. Canteen bowls and library books are in front of actors; all 12 personal activities visible after fixing the fixture's accidental working-job assignment outside workshop.
- At 390×844: four columns, three rows, no horizontal page overflow or name overlap. Three automated bound fixtures cover 390×844, 1280×720, 680×900.
- Three library/workshop switch cycles: no browser error logs. This is interaction validation, not measured FPS/GPU performance.
- Production preview originally could not start on occupied 4173; used isolated 4196 without stopping the existing service or accessing its saves.
- First loaded prior A4 build, then received a waiting-worker notification after final build. Clicked the explicit update control; refreshed successfully.
- Production cache key: oot-alpha-e35602446fff. Stopped the test preview process, confirmed no 4196 LISTEN entry. Browser reload still rendered original characters; clicked Next period: day 1 morning → afternoon. DOM width 390/390; canvas present; browser error log `[]`.
- Viewport override reset after testing. Only test progress on isolated port changed. No deployment or original asset edits.
