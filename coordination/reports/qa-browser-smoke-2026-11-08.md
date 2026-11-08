# Independent browser QA | 8 Nov 2026

**Owner lane:** QA on branch `qa/first-shift-independent`, draft PR #9 targeting `feat/first-shift`.
**Evidence type:** **ACTUAL** Playwright/Edge browser runs via approved UniSync workstation. These are page-load and render smoke results only, NOT full user gameplay or rubric grades.
**Code:** `qa/first-shift-independent.audit.cjs`, syntactically checked with Node.js v24.20.0. Isolated runtime playwright@1.58.2 installed at `C:\Users\Admin\work\first-shift-qa-runtime`. Used Microsoft Edge installed on Windows.

## Results
| URL | Viewports | Actual result |
| --- | --- | --- |
| https://pcrogamer.github.io/office-hours-ccdp10003/first-shift.html | 1440x900 DPR1, 1366x768 DPR1, 1024x600 DPR1, 650x800 DPR1, 1440x900 DPR2 | **BLOCKED, HTTP 404** at all five sizes; no rendered game canvas. This is a release blocker, not a gameplay failure in an implemented game. |
| https://pcrogamer.github.io/office-hours-ccdp10003/arcade-office-hd.html | same five | **SMOKE PASS ONLY**: HTTP 200, visible game canvas, no JS/page exceptions or tracked game asset request failures. Screenshot captured for each viewport. |

One nonessential 404 console message for `https://pcrogamer.github.io/favicon.ico` initially caused a false positive on the incumbent. Reproduced this exact browser favicon request, patched QA script to exclude **only a verified favicon 404**, and reran successfully. This does NOT ignore application asset 404 errors.

**Real saved evidence, local workstation (not committed screenshots):**
- `C:\Users\Admin\work\first-shift-qa-runtime\artifacts\candidate\audit.json` and 5 screenshots
- `C:\Users\Admin\work\first-shift-qa-runtime\artifacts\incumbent-v2\audit.json` and 5 screenshots

No independently deployed First Shift was found on the expected Pages URL at audit time. The gameplay branch contained **specification documents** and the GitHub pull-request list had no GAME implementation PR.

## Next actual QA after Codex pushes the game
1. Fetch latest `feat/first-shift` in an isolated QA worktree; do not reset the GAME/Codex worktree.
2. Run the complete game locally from HTTP; start a real mouse/keyboard/touch run and capture state/screenshots. Run this smoke audit at five viewports. Attach summary logs and actual screenshots to this PR.
3. Verify first action <=15s, visible fair interruptions in two departments, real Planck physics, correct 8 cards, 4 promotions, 6 functional perks and 3 build families, unique ledger entries and physical boss with all 16 packet masks.
4. Check the actual tutorial's clickable sources and why-this-game/why-now, characters, ending and corporate consequences against the CCDP course.
5. Confirm the public Pages URL, correct subpath assets and no missing resources once release is live; this report's current 404 should change to HTTP 200.
6. Never claim complete playtesting from this smoke test alone; maintain a separate full gameplay report when real build is available.

**No original game source files were edited by QA.** Course Canvas submission itself is a separate user/account action and is not asserted here.
