# NIGHT SHIFT v3 | Astra-led HD-first rebuild and parallel production handoff

**Date:** Sunday 8 Nov 2026 AEDT
**Target repo:** https://github.com/PcRoGamer/office-hours-ccdp10003
**Integration base branch:** `rebuild/night-shift-v3-hd` (branched from `main` at the working HD/AI arcades).
**Release route:** new `night-shift-v3.html` + `night-shift-v3/**` and `assets/night-shift-v3/**` (or a documented equivalent chosen by LEAD). Existing arcade paths, `index.html`, `main`, and Workday routes are not overwritten.
**Lead:** first eligible Astra chat claims `LEAD`; other independent chats claim distinct lanes under [SWARM.md](coordination/SWARM.md).

## 1. What went wrong and what must change

The previous `feat/first-shift` implementation **actually exists and passed technical browser tests**, but the comparison against **Night Shift HD** exposed serious experiential regressions: weaker and repetitive art staging, generic small characters, oscillator-only beeps instead of an actual music layer, a compromised HUD/layout, less expressive intermissions and an unsatisfying physical ending. The full v3 design had been silently subordinated to an eight-card slice. Read [design/PRIOR_REBUILD_FAILURE_AUDIT.md](design/PRIOR_REBUILD_FAILURE_AUDIT.md), and the real GitHub CI capture references in [design/BASELINE_SOURCES.md](design/BASELINE_SOURCES.md). Never mistake correct ledgers and green pointer tests for an exceptional game.

**New decision:** build **ON Night Shift HD** (art direction and existing playable identity), with the full v3 GDD as creative master. `feat/first-shift` is an **optional donor library** for Planck collision adapters, ledger tests, unique packet math and verified mechanical solutions. It is NOT the gameplay presentation foundation. A clean modular rewrite of HD internals is permitted, but each user-visible replacement must meet or exceed the real HD baseline before acceptance.

## 2. Exact product target

The full [Night Shift v3 GDD](design/NIGHT_SHIFT_GDD_V3.md) owns game content; do not silently substitute First Shift's smaller design. Requirements include:

- **16 authored cards** across Intake, Services, PR, Staff, with **12 selected per normal shift**, curated first play and seeded replay.
- **Five promotions**, **five announced directives** with actual gameplay rule changes; **eight perks** with level-two options and visually distinct same-seed synergies.
- Printer Mutiny after Services: **three genuine telegraph → manipulation → opening → counter cycles**.
- THE QUOTA finale after Staff: three counter phases, physically earned climax, **four unique FILE/COOL decisions** with honest corporate/people score tradeoff; replay.
- A player who knows nothing about the course can understand and enjoy the first action within **15 seconds of CLOCK IN**. Authoring target first human successful run **7–10 min**, not a time fabricated from scripted runner.
- Finch, Mira, Jules, signed help, scams, $40×2 software allocations, dishonest graph framing without falsified numbers, creative promotion trap and gameful rewards that change play.
- **Music that moves with the action**, expressive procedural/animated art, tactile interaction toys and genuine consequences. The research is demonstrated by mechanics and optional sources, not a lecture.
- **Never introduce 3D**. Strictly 2D action game with HD cartoon office identity.

## 3. True fullscreen and 4K

**No margins. No aspect-ratio letterboxing. All screen UI is HUD, not a centered game frame.** Draw an edge-to-edge world filling the canvas and place HUD as viewport-anchored overlays. Change camera/world coverage by aspect ratio; keep targets in an explicit safe interaction rectangle. At 3840×2160 physical 4K, a typical full-screen CSS viewport at DPR2/200%-scaling is 1920×1080 CSS pixels with backing 3840×2160, NOT double physical 4K. Benchmark both sharpness and 4K performance; use adaptive internal budget only with real test evidence. Validate 1920×1080, 2560×1440, 3840×2160, 3440×1440 and 650×800 narrow fallback. Landscape HD is priority; narrow view must not corrupt it.

## 4. Implementation approach

**First deliverable is an HD-faithful modular shell with one physically improved card, a proper HUD, authentic music, and one real polished intermission.** Actually render and compare this against Night Shift HD; if worse, iterate until superior BEFORE granting the shell authority. This is a **quality gate**, not permission to stop at one card. In parallel, departmental and boss agents can build all their modules behind stable interfaces and independent previews. Then integrate the full v3 roster and run.

Implementation paths and interfaces are set in [design/TECHNICAL_INTEGRATION_CONTRACT.md](design/TECHNICAL_INTEGRATION_CONTRACT.md). New independent chats claim lanes in [coordination/SWARM.md](coordination/SWARM.md), create distinct PRs to the rebuild branch, and report actual evidence. The lead does not perform all specialists' work just because others are in flight; it remains responsible for merging, testing and reconciling the game, not maintaining a giant Kanban board.

**Hard gates** in [design/VISUAL_AUDIO_RELEASE_GATES.md](design/VISUAL_AUDIO_RELEASE_GATES.md): fidelity to HD → physical joyful mechanics → v3 systems/card coverage → full human and automated play → verified live URL. Screenshots from browser only, never generated mockups described as gameplay.

## 5. Release truth and deadline

The cached course deadline is **Mon 9 Nov 2026 11:59 pm AEDT**. No automatic course submission. Do not jeopardise the live Night Shift HD while developing the successor. Before any attempt to replace root/main: prove the new build passes complete browser E2E, independent visual QA, real music, full v3 GDD, accurate rubric content and a working public URL with rollback.

When the user chooses a course submission at deadline, compare the **actual completed** options, recommend the strongest validated candidate and report any genuinely incomplete scope. Never rebrand partial as full or fabricate grades/submission receipts.

## 6. Instructions for agents

Read full v3 GDD, course research, genuine GDD conformance failure audit and real old game code. Take one available lane, create a PR with code/tests/screenshots, repeat visual assessment until no major defects, request lead integration. **Do not stop at planning.**

One shared new-chat prompt: [coordination/NEW_CHAT_PROMPT.md](coordination/NEW_CHAT_PROMPT.md).
