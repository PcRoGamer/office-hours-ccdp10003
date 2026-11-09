# Office Attack creative-lead rebuild | 9 November 2026

## Scope and changed files
- `office-attack/game.js`: DOM-based animated URGENT panic timer instead of blocking game canvas; color-bleed backdrop removes dark letterbox bands; two chapter breaks at true batch boundaries; batch sizes derived from the current authored roster (up to eight distinct games per chapter); full portrait staging, countdown state and paper confetti.
- `office-attack/style.css`: protected top HUD and bottom stamp-timer dock; responsive widths; deadline danger pulse/wobble/success/fail feedback; consistent pastel chapter and ending art; responsive original bean-worker drawings.
- `night-shift-office-attack.html`: semantic timer/HUD, native bean characters instead of legacy icon art on title/chapters/end, confetti sheet and future-proofed campaign copy.
- `qa/office-attack-fullrun.browser.cjs`: assert intermissions after first and second six-game batches (before Printer Panic and before fastest batch).
- `qa/office-attack-creative-lead-smoke.cjs`: Chrome assertions for 1440x810, 650x800 and 390x760; no HUD/timer overlap; no dark letterbox colour; active timer state; no page errors or HTTP failures.

## Browser results
- Full 20/20 real-pointer run at 1440x810 with Marathon: PASS. Two bosses, two timed chapter transitions, score 20/20, 3 hearts, replay reset, no JS errors or failed assets.
- Full 20/20 real-pointer run at 390x760 with Marathon and research: PASS. First research break holds until manual Continue; second resumes automatically; two bosses and replay PASS; no JS errors or failed assets.
- Full 20/20 real-pointer run at 650x800 in relaxed/manual break mode: PASS. Both research panels and manual Continue validated.
- Dedicated visual-layout smoke: PASS all three viewports, 0px HUD-vs-canvas overlap and 0px canvas-vs-timer overlap; all sampled canvas edges pastel, not black.
- `git diff --check`: PASS.
- Screenshots were taken and visually examined from real Windows Chrome. Desktop rendering puts a full-width timer beneath the playing field; portrait retains the hit-coordinates and features an enlarged instruction and reacting bean worker.

## Integration notes / residual gaps
1. This lane owns layout and presentation, not `office-attack/art.js`, `office-attack/games.js` or `office-attack/bosses.js`.
2. Existing in-game HD cast atlas and unrelated icon art remain. These **must be replaced by ART lane** with one coherent rounded office-worker system before the creative direction can be called delivered.
3. The FIX family beyond the current FIX/PATCH implementation remains for MICROGAME lane. Batch scheduling dynamically supports the new 8-game selection and changes in pool size without losing intermissions.
4. Do not merge art and UI branches blindly: preserve the new `#deadline-ui`, `#stage` safe area and `FIRST_BREAK / SECOND_BREAK` logic. Merge and rerun full campaigns against actual final artwork.
5. No change to main, original v3, HD or existing live published link. This PR is a tested integration candidate, **not Canvas submission**.
