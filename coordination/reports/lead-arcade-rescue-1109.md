# Arcade Rescue v3 | Release integrator findings and implementation

**Date:** 9 November 2026 AEDT. **Branch:** `agents/v3-arcade-rescue-1109`.
**Baseline:** Original `arcade-office-hd.html` untouched, main untouched.

## Why v3 failed the quality review
Full Chrome success validated the ledger but not fun. The replacement inflated HD's coherent moving-paper arcade into busy corporate wallpaper, duplicate headers, a fake multi-page spreadsheet intermission, weak procedural silhouettes, and touch-idiom instructions. Before repair, the final boss's real final interaction was a very specific upward drag on an unlabeled hitbox. This was a creative regression.

## Implemented
- **Gameplay first:** redraw Intake, Services, PR and Staff as quiet stages retaining only functional physical items. Printer world stage simplified, original HD illustrated animated printer sprite reused. No more extraneous decorative furniture/windows, enlarged HUD as needed.
- **Generated HD sprites:** recover original embedded 4×4 `arcade-office-hd.html` sprite atlas intact and load it via `art/hd-sprites.js`; reused for Finch, Mira and printer, rendered lazily with procedural fallback. **Original artwork has not been modified.**
- **Fast rhythm:** scene clear time .75s → .38s; promotion post-selection 1.65s → .56s.
- **One-screen choices:** replaced noninteractive workbook & long mandatory email with 3 illustrated option cards, explicit upgrade effects, real choice interaction and optional first-promotion research links to Dumb Ways to Die, Brotato and Job Simulator. No scrolling at five viewport sizes.
- **Global upgrades:** after any legitimate upgrade pick, first failed attempt in *each encountered game* consumes the run-wide power-up safety buffer, preserves one heart, still records a failure/retry and cannot regenerate on retry. All native specialized perk physics remain. Single small ✦ in heart HUD denotes availability. Untouched earlier cards without perks remain challenging.
- **Desktop instructions:** P1 chart explicitly CLICK RED BASELINE, THEN SEND (real click-based physical evidence), no swipe; final boss's 3 genuine counters unlock one-click giant CLOCK OUT button (emits one actual boss-complete, no duplicate); Staff tape and boxes say CLICK + DRAG, Printer says DRAG, not "flick" or "swipe".

## Independent acceptance evidence
- `qa/v3-arcade-rescue.browser.cjs` actual Chrome desktop 1920x1080, laptop 1366x768, portrait 650x800, phone 390x760 and hi-DPI dpr2: 5/5 one-screen promotions, all 3 cards visible/clickable, four research links, zero page errors/broken assets, selected perk and onward callback.
- `qa/v3-arcade-interactions.test.mjs`: real PR canvas scene P1 chart one-click baseline 0 + click SEND; quota boss after three already-committed counters has one-click CLOCK OUT, rejects duplicate boss complete.
- `qa/v3-arcade-global-perk.test.mjs`: physical failure after genuine selection consumes universal one-saved-heart retry, cannot regenerate on the same encounter's retry, does regenerate for subsequent card; no synthetic score credit.
- `qa/v3-wrap-game.test.mjs`: 8/8, all 16 authored variants reachable, 4096 seeded legal schedules.
- `qa/v3-wrap-score.test.mjs`: 7/7 tamper-proof frozen scoring checks.
- `qa/v3-wrap-bridge-provenance-contract.test.mjs`: PASS expired QUOTA, PR action dedup/retries, actual counters and lawful dual-score.
- `qa/v3-lead-scored-full.browser.cjs`: complete real Chrome pointer 12 cards, both bosses, 5 promotions, 4 true QUOTA packet decisions, two-sided verified receipt and replay, zero browser errors. Final one-click version rerun separately.
- `qa/v3-wrap-release.cjs`: 4/4 viewport/fullscreen/pause asset gates; original HD route hash unchanged.
- CI workflow contains new tests & screenshot evidence archive.

## Remaining acceptance boundary
No cold first-time human enjoyment or credible 'superior to HD' measurement has been performed. The next live release requires review on exact SHA and hosted fresh browser. This is an improvement candidate, not a guarantee of quality parity.
