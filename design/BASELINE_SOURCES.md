# Night Shift HD baseline, donor code and verified evidence

**Source of truth for game quality:** actual running `main/arcade-office-hd.html` and its screenshot/video comparisons, not descriptions or unrelated image queries.

## Canonical sources
| Reference | Git ref / path | Approved role |
|---|---|---|
| **Night Shift HD** | `main:arcade-office-hd.html` | **Primary playable base / art direction, stage grammar, soundtrack if present, animations, Aster Mail intermissions and Upgrade_Matrix** |
| Night Shift with improved atlas | `main:arcade-office-genai.html` | Optional character pose and atlas study only if coherent at game scale; do not blindly substitute it |
| V3 action systems | `main:arcade-v3.html` | Input/UI flow, alert interruptions, hit effects, known-good arcade transitions |
| Existing Night Shift | `main:arcade-nightshift.html` | Earlier pacing/identity reference |
| First Shift | `feat/first-shift:first-shift/**` | **Donor only**, Planck2D adapter, fixed timestep, event ledger, boss FILE/COOL tests, upgrade mechanics. **Reject its generic beige art and title/intermission replacements.** |
| Workday | `main:index.html`, `release/ccdp10003-final-workday-20261106` | Exact rubric/graph evidence, valid licensed-choice mechanics, not a wholesale desktop transplant |
| Academic source | `design/CCDP_COURSE_ALIGNMENT.md`, `design/CCDP_PROJECT2_GAME_RESEARCH.md` | Real course constraints and properly attributed references |
| **Full game** | `design/NIGHT_SHIFT_GDD_V3.md` | **Binding gameplay/experience scope** for this branch |

## Actual browser evidence
- HD prior browser CI: https://github.com/PcRoGamer/office-hours-ccdp10003/actions/runs/42363190010
- HD CI artifact `nightshift-hd-email-excel-screens` (ID `13570517378`), containing real title, action at 1440/1920/narrow, and email/Excel intermission frames.
- First Shift browser CI: https://github.com/PcRoGamer/office-hours-ccdp10003/actions/runs/42460980521
- First Shift artifact `first-shift-browser-evidence` (ID `13610031303`), containing real action/boss/title/ending frames and automated routes.
- Regression/conformance audit: https://github.com/PcRoGamer/office-hours-ccdp10003/blob/qa/first-shift-independent/coordination/reports/qa-gdd-conformance-2026-11-08.md
- LIVE incumbent: https://pcrogamer.github.io/office-hours-ccdp10003/arcade-office-hd.html

## How to evaluate visual improvement
Capture **actual frame pairs at exactly the same viewport, deviceScaleFactor, aspect/phase and equivalent gameplay state**, then critically score typography/hierarchy, silhouette, expression, staging, hitbox, action readability, background richness, temporal animation quality and reaction timing. Do not privilege a larger canvas or an AI-generated concept image over a smaller but expressive real playable. Test sound from actual play, not a screenshot.

## Safety boundaries
Original `main` routes are backups and must remain unchanged. Branch content contains designs, tests and a new additive route only. Do not merge prior First Shift wholesale or overwrite the HD HTML in place. If donor code has a valid licence, preserve its notices and attribution. A donor is a mechanism, not an excuse to erase art quality.

## Current state label
These documents prepare an implementation; their presence does **not** mean the new Night Shift v3 is built, browser tested or published. Each lane reports its real state independently.
