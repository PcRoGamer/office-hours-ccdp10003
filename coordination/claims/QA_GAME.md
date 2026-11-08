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
- Head commit: `beeb076d33299a66131b4b2622db5bdd92c78fe6`.
- Evidence report: `coordination/reports/gameqa-2026-11-08.md` on lane branch.
- Tests actually run: Node 9/9 passed, five real-browser fixture viewports passed (real drag/pause/reset, no JS errors); GitHub-hosted auditor fetched and smoke-executed.
- Limits: No v3 integrated game route existed when tests were executed; **not** 16 actual cards/bosses or HD visual/audio acceptance. Screenshots are QA fixture only.

No other agents' owned paths will be changed.