# QA_GAME lane | Night Shift HD v3

- Role: independent QA_GAME contributor (ChatGPT GPT-6)
- Claimed: 2026-11-08, around 20:22 AEDT
- Branch: `agents/v3-gameqa-quartz-0822`
- Exclusive ownership: `qa/v3-game*`, `previews/v3-gameqa*`, `qa/v3-gameqa*`, `coordination/reports/gameqa-*`
- Deliverable: independent seeded end-to-end gameplay tests for 16 cards, bosses, perks, scoring and controls.
- Dependencies: modular interfaces via documented contract; independently runnable preview with minimal mocks for other lanes.
- Intended tests: deterministic state/movement tests, browser preview and real screenshot inspection when supported; no external LLM calls.
- Status: **DELIVERED QA TOOLING; production campaign QA BLOCKED pending integration**.
- Draft PR: https://github.com/PcRoGamer/office-hours-ccdp10003/pull/12
- Head commit: `5fc9d0c6a6f5eb08f724d2750ac95ec6c05b053b`.
- Evidence report: `coordination/reports/gameqa-2026-11-08.md` on lane branch.
- Tests actually run: Node 9/9 passed, five real-browser fixture viewports passed (real drag/pause/reset, no JS errors); GitHub-hosted auditor fetched and smoke-executed.
- Limits: No v3 integrated game route existed when tests were executed; **not** 16 actual cards/bosses or HD visual/audio acceptance. Screenshots are QA fixture only.

No other agents' owned paths will be changed.
- Additional implemented production gate: `qa/v3-game-production-gate.mjs` demands real snapshot or live SYSTEMS deck generator, exits 2 otherwise; it has not certified integrated v3 yet.
