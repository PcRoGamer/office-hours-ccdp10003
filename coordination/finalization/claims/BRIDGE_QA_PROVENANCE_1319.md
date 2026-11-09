# BRIDGE_QA_PROVENANCE_1319 | independent systems-bridge adversarial QA

- Date: 2026-11-09 AEDT.
- Agent lane: BRIDGE_QA (the original GAME_QA and SCORE_ENDING lanes are claimed).
- Source under test: lead branch `agents/v3-lead-systems-bridge-1109`, merged comparison against `rebuild/night-shift-v3-hd`.
- Dedicated branch: `agents/wrap-bridge-provenance-1109-b7`.
- Exclusive writable paths: `qa/v3-wrap-bridge-provenance-*` and `coordination/reports/wrap-bridge-provenance-*`.
- Objective: reproduce and fix scoring-bridge provenance/retry/double-count discrepancies; execute focused adversarial tests and open a PR to integration branch. The lead owns `night-shift-v3.html`, `night-shift-v3/app.js`, `night-shift-v3/runtime/director.js`, and `night-shift-v3/runtime/score-bridge.js`; any necessary lead change must be documented as a narrow tested patch, not applied to their branch.
- Safety: do not edit main, Night Shift HD, protected Windows worktrees or other claims; no external LLM calls.
- Status: **DELIVERED FOR LEAD REVIEW**, PR [#41](https://github.com/PcRoGamer/office-hours-ccdp10003/pull/41). Not merged or wired into lead-owned source yet. Independent Windows Node provenance suite PASS; authored timed QUOTA event + pointer COOL PASS; real Chrome I1 smoke PASS; GitHub Actions gate PASS, release skipped. Three reproduced lead bugs documented (expired bonus, boss replay, PR duplicate/stale retry). Overlap with parallel PR #38 explicitly coordinated on lead PR #42. No persistent agent process is running.
