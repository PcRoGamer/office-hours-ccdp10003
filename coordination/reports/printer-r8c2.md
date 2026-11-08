# PRINTER Mutiny | independent Night Shift HD v3 contribution

**Lane:** PRINTER  
**Branch:** `agents/v3-printer-r8c2`  
**Integration target:** `rebuild/night-shift-v3-hd`  
**Date:** 2026-11-08 AEDT  
**Status:** independently playable and browser-tested; draft integration, not full release approval.

## Actual code

- `night-shift-v3/bosses/printer/index.js`: B1 scene API `definitions[0].create(context)`; telegraph → S3 page pull / optional learned S4 cable pull → visible feeder → manually thrown counter packet → one mechanically detached bolt; exactly **three distinct full cycles**. Misfires respawn packets without losing prior bolts or fake HP.
- `night-shift-v3/bosses/printer/render.js`: procedural Canvas2D printer character with distinct defiant/jammed/alarmed/stunned/surrender faces, feeder rail, three bolts, moving projectile, smoke, squash, paper volleys, particles, original paper-theatre lighting.
- `previews/v3-printer.html`: zero-margin standalone fullscreen live boss with viewport-edge HUD, responsive portrait composition, gesture AudioContext motif/SFX, pause, mute, restart and accessibility.
- `qa/v3-printer.test.mjs`: deterministic Node tests of all five directive wins, 3/3 manual bolts, duplicate complete prevention, miss recovery, safe-time fairness, cancel, cable knowledge, optional Mira, interface.
- `qa/v3-printer-browser.py`: actual Chromium/Playwright mouse gesture and screenshots at 1920×1080, 2560×1440, 3840×2160 physical, 3440×1440, and 650×800. Run desktop locally for broader final signoff.

## Five functioning directive hooks

**MOVING GOALPOSTS:** feeder visibly moves to a new rail position **before** manipulation. **DOUBLE ENTRY:** physical manual verification seal before packet. **FAST OR SAFE:** early narrow feeder vs later wide target. **SPONSORED WORKFLOW:** fake toner ad must physically be dragged aside to access feeder. **MANDATORY COLLABORATION:** optional visible Mira control enlarges/stabilises feeder, but unassisted win remains possible.

First cycle has big static feeder, second adds rail displacement, third changes feeder route plus paperwork interference. S3 is the always-available default; S4 is an optional learned alternate. Safe pull is latched when player grabs, never flipping while being dragged. Completion emitted **once** only after third manually hit feeder; scene never writes score directly.

## Integration

```js
import { definitions } from './bosses/printer/index.js';
const scene=definitions[0].create({
  viewport, canvas, ctx2d, run: { activeDirective:'MOVING_GOALPOSTS', completedCards:['S3'], miraAssist:false },
  events:{emit(event){/* director/ledger handles event */}},
  audio:{play(type,event){/* optional */}}
});
scene.update(dtActiveSeconds);
scene.draw(ctx2d,viewport); // transformed into centered world coordinates
scene.pointerDown({x,y,id,kind}); // same world transform as renderer
// pointerMove, pointerUp, cancelPointer, snapshot, dispose
```

Scene emits `printer-bolt-removed` with bolt index/provenance and a **single** `boss-complete` with evidence `{manualCounters:3,threeBolts:true,misses,directive}`. The director must translate this event to its own one-time result and stop calling `update` during pause, hidden tab, or intermission.

**Run:** `python -m http.server 4173` from root then visit `http://127.0.0.1:4173/previews/v3-printer.html`. Choose `?directive=SPONSORED_WORKFLOW&mira=1&cable=1` etc. Click CLOCK IN, wait for green, drag the jam page down, drag/flick bottom packet into lit feeder, repeat. `Esc` pauses; `M` mutes; `F` optional fullscreen.

## Tests and visual evidence

- **Node:** 12/12 passing, full three-bolt path under all 5 directives.
- **Actual Chromium** 1920×1080 DPR1 MOVING GOALPOSTS: 3/3 actual manual counters, 0 page errors.
- **Actual Chromium** 2560×1440 DPR1 DOUBLE ENTRY: 3/3 actual manual counters, 0 page errors.
- **Actual Chromium** 650×800 DPR1 MANDATORY COLLABORATION: 3/3 actual manual counters, 0 page errors.
- Captured genuine browser poster/telegraph/jam/counter/impact/victory PNGs. Local chat deliverable includes screenshots/ZIP; the browser script regenerates the same files under `qa/v3-printer-evidence/`.

Visual iteration: first desktop capture showed stage-sign/HUD collision, corrected by lowering the sign; initial portrait capture had footer/button overlap and Mira on top of the packet, corrected by moving buttons to the portrait header and Mira to the opposite side. Both re-rendered and inspected at real viewport sizes. No blank letterbox/world margins.

## Remaining release gates

The branch does not change Night Shift HD or any other agent's paths. It is not the final 16-card integrated game. Authored deterministic packet kinematics are used here, with Planck.js contact integration deferred to the PHYSICS and LEAD modules if necessary. Source reviewed against HD palette/paper-theatre grammar; a real HD-to-v3 rendered side-by-side remains pending. Audio lane may replace the local procedural musical sketch. Full hardware 4K/ultrawide and live public deploy are not claimed as accepted.

This contribution is a working independently playable boss, not a plan-only PR.
