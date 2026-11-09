# OFFICE ATTACK | evidence and release boundary

**Integration lane:** `agents/office-microgame-reset-1109`, 9 November 2026 AEDT.

**Objective:** Replace the bloated 16-game roguelite with 6 distinct, legible, challenging office microgames inspired by documented WarioWare mechanisms and the original HD gameplay.

**Source and scope:** Fan-maintained Mario Wiki and small Reddit favorites samples informed mechanism selection; no fabricated definitive ranking. Full research links: `design/OFFICE_ATTACK_WARIOWARE_RESEARCH.md`.

**Actual browser acceptance before PR:**
- Full Chrome 18/18 physical pointer victories, 6 authored mechanics × 3 difficulties, 3/3 hearts intact; zero page errors/broken assets on seed 1942.
- 4/4 real Chrome layout smoke tests: 1920×1080, 1366×768, 650×800 portrait and 1920×1080 DPR2, with actual stamped-form pointer win and all art loaded.
- Wrong form costs one heart; no credit; Escape freezes time; Resume unfreezes time; no-input expires into failure; third loss shows FIRED; replay restores three hearts, empty history and score 0; no upgrade UI.
- Visual review: per-game screenshots from each of the 6 first-tier encounters, source screenshots at `qa/office-attack-evidence/`. The backgrounds are deliberately clean, with illustrated local props and HD character sprites.

**Honest limitations:** This does not prove a first-time human will enjoy the game, and player-popularity data does not provide a representative per-microgame ranking. Stage-level tests, network checks and real-pointer coverage are evidence of functionality, not a human playtest. Night Shift HD remains the fallback.

**Release strategy:** Publish as a *separate* `night-shift-office-attack.html` route via the existing protected workflow after exact-commit CI succeeds. Preserve HD, main index and the prior v3 route. Do not claim Canvas submission without receipt.
