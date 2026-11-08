# PHYSICS lane | Planck toy bench evidence | 8 Nov 2026 AEDT

**Branch:** `agents/v3-physics-261108-soundlab`  
**PR base:** `rebuild/night-shift-v3-hd`  
**Status:** independently playable and tested PHYSICS module; NOT a complete GDD game, not authorized to replace Night Shift HD.

## Real implemented code

`night-shift-v3/physics/desk-world.js`: Planck 1.5.1 world factory, 60px/metre conversion, 60Hz fixed steps with max six catch-up steps, dynamic/static/kinematic fixtures, CCD flags, damping/friction/restitution, stable IDs, idempotent contact lifecycle emitted *after* stepping, sensors, physical MouseJoint grab/drag, bounded measured flick velocity, pause safety, snapshots, safe removal and disposal. Scene completion and scores remain with SYSTEMS/scene owners. Load unchanged MIT Planck vendor first.

`previews/v3-physics.html` + `previews/v3-physics.js`: live, fullscreen Canvas2D office desk with five physics forms, two reactive bumpers, an APPROVED sensor chute, physical impacts, night-city scenery, active industrial machine, screenshot-ready HUD overlay, pointer input, pause and replay. No other lane or old release edited.

## Actual tests

- **Node 24 + real vendored Planck:** `node qa/v3-physics.test.mjs` passed **11/11** assertions. Covered gravity, fixture count, unique IDs, pause, catch-up cap, contact lifecycle, physically grabbed body, static/sensor exclusion, sensor callback, snapshots, remove/dispose.
- **Chromium + Playwright:** `python -u qa/v3-physics.browser.py` passed **5/5 viewport checks** at 1920×1080, 2560×1440, 3840×2160, 3440×1440, 650×800, zero page errors; full viewport dimensions and physics ticks verified. Actual pointer drag into chute and pause-freeze were exercised at 1920×1080. Other viewports received real screenshots and startup assertions. Each viewport uses a fresh browser to avoid unrelated graphics-resource stalls.
- **Actual screenshots:** `qa/v3-physics-evidence/desk-1920x1080.png`, `desk-2560x1440.png`, `desk-3840x2160.png`, `desk-3440x1440.png`, `desk-650x800.png`, plus `browser-results.json`.
- **Actual HD reference:** `qa/v3-physics-evidence/hd-reference-1920x1080.png` from `arcade-office-hd.html` at the same 1920×1080 viewport (HTTP 200, no page exceptions). HD's character performance and cinematic title remain stronger than this *physics-only* preview. This is NOT evidence of full-game HD visual parity.

## Defect → fix → retest

1. Preview first opened with undefined simulator and an empty world; fixed first-resize initialization. Browser then rendered and accepted physical pointer input.
2. Browser QA initially connected to another process on port 4173; fixed with dynamically selected local port.
3. Initial contact assertion wrongly treated a legitimate bounce/re-contact as duplicate contact; corrected to require begin/end alternation and re-ran all 11 tests.
4. Shared browser instance caused memory stalls across giant resolutions; isolated each Chromium context and got five green viewport captures.

## Integration steps

1. Include `assets/night-shift-v3/vendor/planck-1.5.1.min.js` as a classic script before the ES module.
2. `import {createPhysics} from './night-shift-v3/physics/desk-world.js';`
3. Call `createPhysics({planck:window.planck, gravity:{x:0,y:930}, onEvent})` or `create(sceneContext)` with event emitter; pass world coordinates from RENDER's `screenToWorld`, not copied DOM pointer math.
4. Create bodies with unique IDs and design-pixel shapes. Drive `step(dt,{paused})` only from LEAD's gameplay clock. Use `grab/move/release` for pointer gestures; `dispose()` before scene exit.
5. Process contact facts idempotently inside scene logic, then commit score via SYSTEMS' ledger. Planck never awards hearts, points or upgrades.

## GDD checklist and remaining gates

- [x] Real grab, drag, flick and collision physics; bumpers / chute; tactile preview
- [x] Fixed-step deterministic snapshot, pause and disposal, browser gestures
- [x] Responsive edge-to-edge independent world preview with overlaid HUD
- [ ] Not owned or implemented here: full 16 cards/12 deck, 5 directives, 8 perks, 2 bosses, narrative, full music, human-run pacing and verified public release
- [ ] LEAD, RENDER and ART must integrate these mechanics without degrading Night Shift HD's visual and experiential quality
- [ ] No measured 4K GPU timing, Windows 200% DPR2 benchmark, human playtest, or full v3 game QA is claimed

**Preview:** from repository root run `python -m http.server 4173` and open `/previews/v3-physics.html`. Choose another port if occupied. **Unit test:** `node qa/v3-physics.test.mjs`. **Browser test:** `python qa/v3-physics.browser.py`.
