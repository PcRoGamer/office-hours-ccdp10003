# QA_VISUAL | full GDD source contract and rollout status

**Recorded:** 8 November 2026 (AEDT)  
**PR:** https://github.com/PcRoGamer/office-hours-ccdp10003/pull/15

This is direct, executable **actual-source** evidence gathered via the authenticated GitHub connector. It must not be misrepresented as an integrated browser-game visual pass.

## Actual module tests run

1. **280/280** independent scene/boss combinations using the original authored source fetched from Intake, Services, PR, Printer Mutiny and THE QUOTA branches. Four viewport shapes × five directives × 14 available implemented scene definitions. Stress run: 8,400 actual `update()` calls, offscreen pointer manipulation/cancellation, snapshot serialization and drawing API compatibility. Zero thrown exceptions, zero duplicate completion events.
2. **1,000/1,000** seeded 12-card decks checked by SYSTEMS' real `createDeck()` / `validateDeck()` source. The same 1,000 seeds passed the real five-directive `assignDirectives()` / `validateSchedule()` source.
3. **24/24** complete deterministic simulated campaigns (seeds 0, 1, 2, 42, 2771 and 0xffffffff; FILE versus COOL boss bonus outcome; GIVE versus SAVE two real $40 software licences) advanced through 12 authored deck slots, five promotions and 2 × three-phase bosses. Every simulated completion had frozen numeric scoring and an ending; official and people scores ranged 70–100. These are algorithm-level clear paths, not player-measured playtime.
4. **25/25** five-promotion × five-directive diegetic narrative combinations passed the actual STORY `promotionNarrative()` source. All eight perk IDs and their level-two descriptions, five directive identifiers and eight canonical synergies matched SYSTEMS.
5. Actual ending narrative from STORY's `receiptNarrative()` rendered frozen test scores, two software licences, actual Mira workstation and press-frame consequences.

### Exact material source identities

- SYSTEMS `core.js`: `9229d4853cc27e8cefe850558afdaca88c8651d9`.
- SYSTEMS `engine.js`: `c8bde5b9c744688bcd7186b7e6c9fd784890a382`.
- STORY `narrative.js`: `cf31c6ecc43609f29531ed5b1330d43ef9a27c16`.
- INTAKE `index.js`: `74a545b842f5dfa93838567070b85010d3845540`.
- SERVICES `index.js`: `d5b5084878c2ee2fa75cc4d955fa34f7462b04a5`.
- PR `index.js`: `2c3fe86c16c502d6cec00224c404d5650cf9a212`.
- PRINTER `index.js`: `6599a62a76204f2ec7436cb05a96625765aca824`.
- QUOTA `quota.mjs`: `354fc3e31ef6045b0687cb1a17fbea8b92b1e510`.

## Direct negative finding: not yet a complete playable v3

SYSTEMS correctly declares sixteen required card IDs. The independently available scene branches provide I1-I4, S1-S4 and P1-P4 (twelve modules), plus Printer and QUOTA. The STAFF branch `agents/v3-staff-copperfox-2021` still had **zero own implementation commits**, thus **T1, T2, T3, T4** were unavailable to the integrated browser game at last check. The canonical first run requires **T1, T4 and T3**. This is a real coverage failure, not a request to reduce scope or for the user to choose features.

ART, AUDIO, RENDER and LEAD/LEAD_RECOVERY implementation branches were also not yet supplying an integrated v3 shell at the last inspection. Existing specialist scene/browser tests do not prove whole-game composition.

## Durable QA code delivered

- `qa/v3-visual-live-source.mjs` implements the real-source scene API/stress validator with isolated clones, recursive native ESM source imports, actual module SHA256, full scene roster checks and safe no-op Canvas2D instrumentation. Tested synthetic loader fixture **80/80 PASS** in local Node, the live authored-source version of the same matrix was executed in V8 as described above.
- `qa/v3-visual-composition.py` creates real PNG contact sheets and calibrated view diagnostics from exactly matched source screenshots, warns on letterboxes/empty staging but never declares visual superiority from pixel statistics. Local real original 650×800 HD vs historical First Shift run: HD 47.25% uniform outer rows, historic First Shift 92.1% low-detail lower screen, one genuine pixel-preserving sheet inspected. Deliberate 650×800 vs 1366×768 mismatch correctly exited with error.
- `qa/v3-visual-branch-matrix.py` now checks actual requested scene-state identities, JavaScript and HTTP errors, exposes dirty Git worktree provenance, and permits same-source inline navigation fallback **only** on genuine browser administrator restrictions, not when an asset is missing or a server is down.
- `qa/v3-visual-boss-phases.py` validates PNG CRC and full zlib pixel stream; fixture tests confirmed corrupted/truncated PNGs are rejected and real report directories cannot be overwritten by fixtures.

## Handoff for LEAD

No user decision is required. Integrate the authored specialist modules, finish STAFF scenes and shared ART/RENDER/AUDIO/runtime, run the source/viewport/boss-phase tests on a GitHub Actions runner or normal browser-capable workstation, inspect matched actual HD-versus-v3 screenshots at every critical scene and improve anything worse before approving release. Original Night Shift HD remains the protected fallback. Do **not** label this source/algorithm result “finished game.”
