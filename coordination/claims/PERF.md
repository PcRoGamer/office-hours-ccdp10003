# PERF additional lane claim | Night Shift v3

- **Agent:** GPT-6 independent contributor; claimed 2026-11-08 20:23 AEDT.
- **Why additional:** All 17 listed SWARM lanes had been atomically claimed concurrently before this contributor could take one. No listed lane/claim is overwritten. This is an additional, self-contained performance/regression QA lane for LEAD review, not an alteration to the GDD or other owners' contracts.
- **Isolated branch:** `agents/v3-perf-gpt6-0823`.
- **Exclusive new paths:** `qa/v3-perf*`, `previews/v3-perf*`, `coordination/reports/perf-*`. No existing code or legacy release changes.
- **Deliverable:** deterministic Playwright browser QA for fullscreen viewport coverage and HUD edge positions, DPR/backing-pixel correctness, frame-pacing/performance regressions across 1080p/1440p/4K/ultrawide/narrow; HD-reference evidence; independently executable diagnostics.
- **Dependencies:** existing HD route; v3 route once present. Failures against absent routes must report unavailable, not fabricate pass.
- **Validation:** run actual real-browser captures where tools allow; Node/syntax checks; publish report and draft PR into integration branch.
- **Status:** claimed / implementation in progress. This extra lane should be accepted or rejected by LEAD without cross-lane conflicts.
