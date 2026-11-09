# BRIDGE_QA | independent scoring-bridge attack (2026-11-09)

- **Lane:** BRIDGE_QA (unique, not SCORE_ENDING, GAME_QA, INTEGRATION_REGRESSION or PACKAGE).
- **Owner:** parallel GPT-6 finishing agent, current chat.
- **Base:** `rebuild/night-shift-v3-hd` at latest live HEAD.
- **Lead branch under review:** `agents/v3-lead-systems-bridge-1109` (read-only).
- **Owned paths:** `qa/v3-wrap-bridge-*`, `coordination/reports/wrap-bridge-*`. Do not alter core game, director, bridge, other lanes or Windows worktrees.
- **Mission:** independently reproduce ledger/bridge discrepancies, test committed-vs-attempt evidence, failures/retries and source provenance; commit executable regression suite and verified pinpoint fixes for PACKAGE, open PR against integration.
- **Release truth:** tests and observations must be recorded with real commands; claim does not imply completed work or deployment.
