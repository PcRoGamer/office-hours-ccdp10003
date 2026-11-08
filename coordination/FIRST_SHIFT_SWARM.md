# QUOTA PANIC: FIRST SHIFT | shared multi-chat coordination

**Canonical home:** https://github.com/PcRoGamer/office-hours-ccdp10003/tree/feat/first-shift
**Last preflight:** 2026-11-08 (AEDT). This file is a coordination protocol, NOT evidence that game implementation has started.
**Release deadline:** Monday 9 Nov 2026, 11:59 pm AEDT, per Canvas CCDP10003 Project 2. Check current live Canvas independently.
**Release target:** one tested public playable browser URL. GitHub source/branch URL is not a submission.
**Golden specifications:** `AGENTS.md`, `CODEX_HANDOFF.md`, `design/COURSE_ALIGNMENT_PREFLIGHT.md`, `design/FIRST_SHIFT_VERTICAL_SLICE_GDD.md`, `design/CCDP_P2_GAME_RESEARCH.md`, `design/PHYSICS_TOY_INTERACTION.md`, `design/first-shift/contract.json`.

## Status truth boundary
- **Codex:** assigned *lead gameplay implementation*. As of the last GitHub check, `feat/first-shift` contained specs and no `first-shift.html` implementation or First Shift CI. Codex may have unpublished local work. Do NOT assert no work is happening; check the latest branch, PRs and Actions every time.
- **This ChatGPT thread:** owns *independent QA and integration assessment*, on `qa/first-shift-independent`. It does NOT claim to be reading another chat's live state. Its QA work must arrive as a separate PR into `feat/first-shift`, not an unexplained edit of Codex-owned files.
- **Additional chats:** may act as genuine collaborators through GitHub and the approved UniSync host, but must be given disjoint lanes below. Each independently runs to completion within its turn. ChatGPT chats do not automatically message each other or stay active in the background.
- **GitHub Issues:** repository has issues disabled; PRs, namespaced claim files and independent reports substitute for a Kanban board. No paid services, webhook server, GitHub Projects migration or extra infrastructure required.

## Lanes and exclusive ownership
| Lane ID | Owner | Allowed changes | Deliverable |
| --- | --- | --- | --- |
| `GAME` | Existing Codex implementation agent | `first-shift.html`, `first-shift/**`, `assets/first-shift/**`, `.github/workflows/first-shift.yml` and game-owned application code | Complete game, test evidence, public release |
| `QA` | This ChatGPT thread | `qa/first-shift-independent*.cjs`, `coordination/reports/qa-*.md` on a dedicated QA branch; review existing scripts | Executable external browser smoke, bug reports, integration review |
| `COURSE` | Additional chat, if started | `coordination/reports/course-*.md`, optional `qa/course-*.cjs` on its own branch | Rubric/previous-feedback fact check, exact in-game evaluation evidence |
| `VISUAL` | Additional chat, if started | `coordination/reports/visual-*.md`, `coordination/screenshots/visual/**` on its own branch | Actual browser scene inspection, measured UI defects, art/sound/interaction review |
| `RELEASE` | Additional chat, if started | `coordination/reports/release-*.md`, optional `qa/release-*.cjs` on its own branch | Public URL, asset integrity, CI/deployment and submission-readiness audit |

**Never modify another lane's owned files without explicit coordination.** Read/review anything. Recommend gameplay changes as a patch in a separate branch or a PR review rather than touching GAME paths while Codex owns them. If another chat finds a critical fix, write a reproducible issue + minimal diff in its own branch, then request GAME to integrate. The QA agent cannot merge gameplay to main or submit the coursework by implication. Preserve all incumbent routes and `main`.

## Claiming work without races
1. Read latest `feat/first-shift` and open PR list. Read `coordination/FIRST_SHIFT_SWARM.md`.
2. Pick ONE lane and check `coordination/claims/<LANE>.md`. If present with active owner, choose another lane; do not hijack it.
3. Commit a **new** `coordination/claims/<LANE>.md` directly to `feat/first-shift` using GitHub create-file. Atomic creation failure means someone got there first; re-read and take another lane. Claim only if you will actually execute.
4. Create work branch `agent/<lane>-<descriptive-suffix>` FROM the latest `feat/first-shift`, implement within lane paths. Do not work in shared Windows checkout or on feature branch simultaneously with Codex. For remote computer use an isolated `git worktree` with a unique directory and no reset/clean/discard of pre-existing files.
5. Commit working artifacts to your branch. Open **draft PR targeting `feat/first-shift`**, not `main`, with commands run, real output, screenshots and blockers. For read-only findings, use your unique report file and PR; avoid generic commentary with no artifact.
6. Once completed, make a final update to the *claim file* with state `done`, PR number, evidence, remaining blocker. Do not rewrite this hub as a high-frequency status counter; let PRs and reports convey progress.

**Critical concurrency safety:** GitHub connector writes use exact current blob SHA, avoiding accidental lost updates. Never force push/rebase or auto-merge another agent's branch. New agents must check PRs first, because another chat can start between tool calls. Do not manufacture or assert active collaborators.

## Minimal coordination rhythm
- **GAME** writes actual code and supplies a runnable preview and state/QA interface if feasible.
- **QA** independently tests feature head once code exists; reproduces defects and sends actionable PR feedback.
- **COURSE** tests source credits, tutorial "why this / why now / why it matters", rubric (25 each), direct microgame design references and original mouse-distraction signature.
- **VISUAL** captures actual 1440x900 / 650x800 scenes, flags concrete visual failures, avoids AI generated stand-in screenshots.
- **RELEASE** independently verifies Pages deployment source, asset paths, public URL and fallback.
- **Integrator:** GAME lead makes the final gameplay integration decision; QA checks any regression. Human user approves actual Canvas submission or any irreversible account action if needed.

## Exit conditions
First Shift is DONE only with an actual complete browser playthrough, all eight cards, four promotions, six perks/three builds, the complete three-stage THE QUOTA boss, real Planck.js physical interactions, source-bearing natural tutorial, readable/consistent characters, reproducible QA and a verified public playable URL. Claim files/docs/tests alone never satisfy this.

### Fast commands
```sh
git fetch origin
git ls-remote --heads origin
git log -5 --oneline origin/feat/first-shift
node qa/first-shift-independent.audit.cjs
```
Use tests only after the corresponding artifact exists, and record actual results. Lack of candidate game is a release blocker, not a passing test.
