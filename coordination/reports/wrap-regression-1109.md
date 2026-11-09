# Independent integration regression lane, 9 Nov 2026 AEDT

Branch: `agents/wrap-regression-1109`. Original six lanes were all claimed. This supplemental lane owns `qa/v3-wrap-regression*` and this report only. Integration is `rebuild/night-shift-v3-hd`. Protected recovery tree and Night Shift HD are unchanged.

## Executed on isolated Windows clone
- `node qa/v3-wrap-game.test.mjs`: PASS, eight assertion groups; 4096 seeded schedules tested; all sixteen authored IDs reachable (existing harness; simulation-based).
- `node qa/v3-wrap-regression.mjs`: PASS, 19 modules parsed/linked, no missing assets/imports, HD fallback entry exists.
- `node qa/v3-wrap-regression.browser.cjs`: PASS on 1920×1080, 1366×768, 650×800, 1920×1080 DPR2 using installed Chrome + Playwright; title-to-first-card pointer, 12 unique-card roster, real canvas screenshot, pause/resume frozen time, replay resets ledger/hearts, no script errors or HTTP 400+.
- `node qa/v3-wrap-game.browser.cjs`: first run 3/4 viewport PASS with desktop `I2 !== I1` assertion; second rerun 4/4 PASS. Existing test hardcodes I1 even though the game's randomized deck may first pick I2. This is a **test harness flake**, not established as a gameplay defect. Independent browser test removes that false assumption.

## Verified scope and limits
These are real Chrome executions, but not a completed 12-card, two-boss human playthrough. Screenshots are generated from live Chrome, with native and canvas backing-buffer captures. This lane did not listen to soundtrack, visually certify HD parity, publish a public URL, or submit to Canvas. IMAGE acceptance remains with POLISH_QA / PACKAGE.

## Integration
Merge this PR as additive QA only, then run `node qa/v3-wrap-regression.mjs && node qa/v3-wrap-regression.browser.cjs` from repo root on an environment with Chrome and playwright-core available at the project's current Windows tooling path. Existing `qa/v3-wrap-game.browser.cjs` must eventually replace its unconditional first-card-I1 assertions with roster-aware assertions (owner: GAME_QA). A fully portable Playwright dependency resolver is still desirable for Linux CI.

No edits to `night-shift-v3.html`, `app.js`, original art/audio/game systems, or HD fallback.
