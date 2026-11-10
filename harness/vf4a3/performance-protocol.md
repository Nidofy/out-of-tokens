# VF4-A3 performance protocol

Frozen sources: source-freeze.json (151 tracked application/package/lock files; raw and LF SHA256). Last UI change fixed recruitment focus. No source changes during sampling.

Exactly 3 versions: 040031e, c68541d, current. Each has dev/preview × standard/twelve × six rounds. Reverse version and scenario ordering on even rounds. 72 formal observations total, every cell n=6. Twelve warmups stored separately. Visible IAB viewport 1280×720, same DPR, each observation waits for 180 rAF frames, p50 <=25ms. Metric is first observed controls+canvas, not assets-ready or input latency.

Reproduction: `node harness/vf4a3/serve-final.mjs build`, then `dev` or `preview`. Stop between modes. Browser functions are recorded in browser-sampling-functions.txt; run warmup then rounds 1–6 per mode. Independent cacheDir for each version. Baseline worktrees are unchanged.

Only current versus c68541d exceeding +10% in any cell permits one confirmation batch. Observed +3.88%, +1.62%, +1.35%, -3.53%: no confirmation permitted or run. Historical VF4A2-PERF-01 remains retained for independent disposition. This does not close full startup/GPU/cold-cache/long-session budgets.
