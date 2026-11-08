# Lane QA | independent browser and release acceptance

- **Owner:** initiating ChatGPT conversation (independent QA/integration lane).
- **Claim status:** active in initiating task. **Not a persistent background worker.** Future sessions can continue this work by reading this claim and the QA branch.
- **Work branch:** `qa/first-shift-independent`, branched from `feat/first-shift` after this claim.
- **Exclusive files:** `qa/first-shift-independent*.cjs`, `coordination/reports/qa-*.md`.
- **Goal:** executable external browser smoke; real screenshot captures; verify deploy readiness and report reproducible defects. Never edit GAME-owned paths while Codex is developing.
- **Input:** `coordination/FIRST_SHIFT_SWARM.md`, current First Shift GDD, `CODEX_HANDOFF.md`.
- **Latest evidence:** At time of claim, `feat/first-shift` had no `first-shift.html`, open PRs or First Shift CI. Independent audit must mark not built until verified.
- **Handoff:** Draft PR targeting `feat/first-shift`; outputs go into a unique QA report or CI artifact.
