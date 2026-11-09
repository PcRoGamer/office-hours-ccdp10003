# GAME_QA | finalization evidence | 9 November 2026 AEDT

## Work completed in isolated Windows worktree

- Worktree: `C:\Users\Admin\NightShiftV3-GameQA-1109`.
- Production source tested: locally committed assembled candidate `ce159b67041492feeeee590632123bda252b3b97`, mirrored on `agents/v3-package-mirror-1109`.
- GitHub feature branch: `agents/wrap-game-1109-qa4`.
- Existing recovery worktree `C:\Users\Admin\NightShiftV3-Lead-Recovery-1108` and HD fallback not edited.

## Executed test results

1. `node qa/v3-wrap-game.test.mjs` **PASS (8/8 groups)**; Node v24.20.0. 4096 replay seeds. 16 of 16 original scene exports and both boss exports present. All authored cards reachable; observed 96 distinct twelve-card decks and 120 valid five-directive schedules. Five promotion choices, visible activation contracts, malformed-roster rejection, director's 12-card/2-boss progression, pause, failed attempt, union break and duplicate-credit guards.
2. `node qa/v3-wrap-game.system.test.mjs` **PASS (7/7 groups)**. Exercised the **actual** deterministic SYSTEMS event-sourced engine on twelve-card modeled campaigns, each with two 3-counter bosses and five upgrades; all 16 FILE/COOL binary patterns, all four two-licence allocations, four expiries, immutability, and failed-attempt discard. All $80 distributions conserve $80. The authored 'manual actions' in this unit test are method calls and must **not** be described as real browser gestures.
3. `node qa/v3-wrap-game.browser.cjs` **PASS (4/4 viewports)** on real Google Chrome 156 and Playwright Core. Desktop 1920×1080, laptop 1366×768, portrait 650×800, 1920×1080 DPR2. Page loaded local ESM, no HTTP errors or JavaScript errors; twelve unique cards present in each run, actual desktop pointer stamp completed against moving I1 object; pause froze gameplay time, replay reset committed encounters/hearts and yielded a different seed roster where applicable. Screenshot names `qa/v3-wrap-game-evidence/{desktop,laptop,portrait,retina}-{title,I1}.png`, matching `*-canvas-title.png` and `*-canvas-I1.png` and `result.json` in isolated worktree.
4. `node qa/v3-lead-director.mjs` **PASS** against same copy: 12 cards, 5 promotions, both boss definitions, 14 unique encounter commits, no double credit, pause frozen.

**Browser test debugging:** An initial desktop stamp assertion failed because the harness captured a rapidly moving form before expensive screenshots and used its stale x coordinate after pause/resume. Corrected by sampling live form position immediately before each pointer gesture. Re-ran all four viewports: PASS. A preview of high-resolution screenshots appeared grey below a horizontal boundary because the host's base64 stdout was truncated during transfer. Inspected the saved PNG with pixel sampling and re-encoded a low-byte thumbnail: the underlying browser screenshot is painted normally. **Do not attribute this preview artifact to the game renderer or Chrome.**

## Real-play acceptance boundary

The browser smoke above is **not** a new verified whole-campaign run. The existing authored LEAD real-pointer script `qa/v3-lead-first-loop.browser.cjs` was produced and previously executed by PACKAGE/LEAD, with `12/12` cards, `3/3` printer cycles, `3/3` quota phases, `4/4` boss packets and real CLOCK OUT as reported in `coordination/claims/LEAD_RECOVERY.md`. GAME_QA did not reproduce that full pointer result yet; do not count unit-modeled progress as physical success.

### Mandatory release integration

1. Merge PACKAGE candidate PR #24 into `rebuild/night-shift-v3-hd`; its scene files are not present on the original base branch.
2. Merge GAME_QA PR #25, which adds only `qa/v3-wrap-game*` and this report; no runtime edits.
3. Run `node qa/v3-wrap-game.test.mjs`, `node qa/v3-wrap-game.system.test.mjs`, `node qa/v3-wrap-game.browser.cjs`, `node qa/v3-lead-first-loop.browser.cjs` on the integrated source. The last command is a **full real-pointer** acceptance gate, not a fixture.
4. Inspect actual saved PNGs visually at all resolutions and the full ending; compare against HD. Keep the public release gate closed if gameplay/ending/source/visual/audio conditions have not passed.

### Confirmed source-level integration gap owned by SCORE_ENDING / PACKAGE

`night-shift-v3/runtime/director.js` stores one `{id,attemptId,outcome,evidence}` encounter summary at a time. It does not currently route physical scene events into `NightShiftRun`'s committed action ledger or use `readScores` for the actual receipt. The sophisticated SYSTEMS scoring engine **works in model tests** but its existence is not equivalent to runtime wiring. The release must not claim honest scores merely because this test passed.
