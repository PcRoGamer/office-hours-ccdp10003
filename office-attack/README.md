# QUOTA PANIC: OFFICE ATTACK

A clean-slate office-themed microgame arcade, independent of the discontinued Night Shift v3 roguelite. Its celebratory chapter breaks include an optional three-topic critical-research reader. **Relaxed breaks are the default**, with a user-selectable **Marathon Mode** for automatic chapter continuation. The player must still perform every microgame action.

**Play:** `night-shift-office-attack.html` through a local HTTP server. The original `arcade-office-hd.html`, `night-shift-v3.html`, and `main` are not modified by this game.

## Design contract

Six physically distinct microgames, each played at three escalating speeds, plus **two mandatory boss fights**: 20 scoring encounters, three shared lives and mouse/touch controls. A single action instruction stays visible throughout each fight. No upgrades, inventory, mandatory reading or decorative non-game props. Two animated 3–5 second intermissions show score, remaining lives and the next speed tier.

| Command | Mechanic | Closest WarioWare archetype |
| --- | --- | --- |
| STAMP! | Stamp one approved form early, then two approved forms among more spam at higher levels | rapid target discrimination |
| CATCH! | Position the catch-tray beneath a falling worker | *Up for Grabs*, *Basket Case* |
| SHRED! | Drag only the fraudulent paper into the shredder | tactile sorting, *Separation Anxiety* |
| FIX! | Pop every glowing computer error before expiry | *Taping a Leak* |
| FEED! | Click as the moving feeder passes the green zone | *Gold Digger* precision timing |
| DODGE! | Follow red warning cues and move out of the falling-mail lane | *Crazy Cars* rapid avoidance |
| PRINTER PANIC! (Boss 1) | Three timing hits in a green feeder zone, each faster | physical timing boss |
| CLOCK OUT! (Final boss) | Close three descending memos and slam the final green button | multi-hit reaction boss |

Game duration: 4.8 s, 4.05 s, 3.65 s per tier, with real speed and target changes. All score credits come from actual player input and condition checks. Timeout and wrong actions cost lives. The run is deterministic with `?seed=1942`.

## Automated verification

```
node qa/office-attack-smoke.browser.cjs
node qa/office-attack-fullrun.browser.cjs
OFFICE_ATTACK_BOSS_RETRY=1 node qa/office-attack-fullrun.browser.cjs
OFFICE_ATTACK_VIEWPORT=650x800 node qa/office-attack-fullrun.browser.cjs
node qa/office-attack-dodge-balance.browser.cjs
node qa/office-attack-adversarial.browser.cjs
```

The smoke test verifies public-size desktop, laptop, portrait and HiDPI screens, the sprites and a genuine pointer click. The 20-encounter Playwright campaign performs legitimate pointer input for every regular game, both bosses and each speed tier. Its adversarial variant fails and retries both bosses, verifies the hearts penalty and checks an interrupted intermission. It also checks the graded victory screen and clean replay. The Dodge evaluator simulates 256 seeds at each tier with both idle and reacting controllers (1,536 trials in total). These are functional balance indicators, not a claim of measured human enjoyment. The adversarial test verifies wrong clicks, countdown expiry, pause/resume, three-heart loss, replay reset and no phantom scoring. The full campaign test additionally validates that each 3–5-second intermission holds indefinitely until Continue, every research topic is browseable with clickable citations, Escape closes research without resuming, and the research panel fits small viewports. Marathon runs automatically after each celebration but never while the research panel is open; once viewed, a break requires an intentional Continue.

Media includes the original project's HD cast sprite atlas and separate bundled illustrated office-object PNGs. All sounds are synthesized in-browser with original short motifs; no copyrighted music files are used.

For microgame precedents and favourites see `design/OFFICE_ATTACK_WARIOWARE_RESEARCH.md`. For the current genre/portable/short-video research argument, sources, epistemic limits and in-game presentation see `design/OFFICE_ATTACK_SHORT_PLAY_RESEARCH.md`.
