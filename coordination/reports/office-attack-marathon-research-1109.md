# OFFICE ATTACK / BOSS, RESEARCH & MARATHON INTEGRATION

**Integration:** `agents/office-attack-marathon-video-1109`, 9 November 2026 AEDT. The original `arcade-office-hd.html`, old `night-shift-v3.html`, `main` and their routes remain untouched.

## Feature work

- 18 microgame encounters, 2 authored bosses, 3 difficulty tiers, score, hearts and graded ending.
- DODGE warnings and conservative collision cores, higher-tier STAMP and SHRED require multiple correct decisions, printer and manager boss retries preserve actual earned score and charge real lives.
- Two 3.55/3.95-second animated chapter celebrations display lives, score and incoming speed; player-controlled relaxed breaks are the **default**.
- Title and intermission **MARATHON: ON/OFF** controls optionally auto-continue after each celebration (a short beat after timer); they do **not** interact with gameplay for the player.
- Opening research freezes the break timer and disables auto-continue for that specific break, even when Marathon is ON. Closing the research returns to the break and requires the player's Continue click. Marathon remains selected for later breaks.
- Optional research tabs discuss WarioWare/Dumb Ways precedents, portable/casual short sessions and the scrolling-versus-active-play question, with sources and caution around causal claims. Tj Power's 12 October 2026 YouTube video `IfgSsgpjAnQ` is linked as commentary, not evidence of a clinical benefit.

## Tests executed on Windows Chrome

- `qa/office-attack-smoke.browser.cjs`: desktop, laptop, portrait and high-DPI asset, real stamp interaction and no browser errors, 4/4.
- `qa/office-attack-fullrun.browser.cjs`: 20/20 actual pointer victories, both bosses, animated intermission, manual Continue, all research tabs with links, graded end and replay; PASS on 1440×810, 650×800 and 390×760.
- `OFFICE_ATTACK_AUTO_INTERMISSION=1`: 20/20 with automatically continued chapter celebrations and no fake player actions, PASS.
- `OFFICE_ATTACK_AUTO_INTERMISSION=1 OFFICE_ATTACK_AUTO_RESEARCH=1`: 20/20; research suspends the Marathon timer even when left open for 5+ seconds; Continue required after reading, PASS.
- `OFFICE_ATTACK_BOSS_RETRY=1`: deliberately failed real printer and manager attacks cost one heart each, bosses repeat, proper 20/20 victory with 1 life left, PASS.
- `qa/office-attack-adversarial.browser.cjs`: false stamp, timer expiry, pause/resume, three-life loss and replay reset, PASS.
- `qa/office-attack-dodge-balance.browser.cjs`: 768 idle + 768 reactive deterministic trials; idle winners 113/256, 113/256 and 53/256 by level, reactive winners 256/256 at each level.

## Release acceptance boundary

Machine tests establish correctness, not subjective delight. Public-route verification, exact-SHA GitHub Actions, final Pages deployment and cold human playtesting must not be represented as complete until actually performed. Preserve the HD fallback and do not claim Canvas submission without a Canvas receipt.
