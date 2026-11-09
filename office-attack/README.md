# QUOTA PANIC: OFFICE ATTACK

A clean-slate office-themed microgame arcade, independent of the discontinued Night Shift v3 roguelite.

**Play:** `night-shift-office-attack.html` through a local HTTP server. The original `arcade-office-hd.html`, `night-shift-v3.html`, and `main` are not modified by this game.

## Design contract

Six physically distinct microgames across three progressively faster rounds, 18 encounters total, three lives, mouse/touch controls. A *one-word imperative* is always visible. No upgrades, no inventory, no intermission screens, no forced research text, no cinematic pauses, and no decorative office items unrelated to the interaction.

| Command | Mechanic | Closest WarioWare archetype |
| --- | --- | --- |
| STAMP! | Click the one authentic form among spam | rapid target discrimination |
| CATCH! | Position the catch-tray beneath a falling worker | *Up for Grabs*, *Basket Case* |
| SHRED! | Drag only the fraudulent paper into the shredder | tactile sorting, *Separation Anxiety* |
| PATCH! | Clear glowing computer faults before expiry | *Taping a Leak* |
| FEED! | Click as the moving feeder passes the green zone | *Gold Digger* precision timing |
| DODGE! | Steer away from incoming popup windows | *Crazy Cars* rapid avoidance |

Game duration: 4.8 s, 4.05 s, 3.35 s per tier, with real speed and target changes. All score credits come from actual player input and condition checks. Timeout and wrong actions cost lives. The run is deterministic with `?seed=1942`.

## Automated verification

```
node qa/office-attack-smoke.browser.cjs
node qa/office-attack-fullrun.browser.cjs
node qa/office-attack-adversarial.browser.cjs
```

The smoke test verifies public-size desktop, laptop, portrait and HiDPI screens, the sprites and a genuine pointer click. The 18-round Playwright campaign performs legitimate input for every mechanic and every speed tier. The adversarial test verifies wrong clicks, countdown expiry, pause/resume, three-heart loss, replay reset and no phantom scoring.

Media includes the original project's HD cast sprite atlas and separate bundled illustrated office-object PNGs. All sounds are synthesized in-browser with original short motifs; no copyrighted music files are used.

For individual WarioWare references, indie analogues, qualitative fan evidence and limitations on popularity rankings, see `design/OFFICE_ATTACK_WARIOWARE_RESEARCH.md`.
