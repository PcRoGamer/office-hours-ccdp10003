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


## Native-resolution follow-up, 2026-11-08 AEDT

An earlier 4K capture exposed a hidden internal canvas cap (a physical 3840×2160 viewport yielded 3771×2121). Corrected `previews/v3-printer.html` so the backing canvas matches actual CSS viewport × devicePixelRatio, and added an explicit native-resolution assertion to `qa/v3-printer-browser.py`. Re-rendered and inspected genuine 4K-DPR2 counter frame.

```json
{"viewport":"3840x2160","css":[1920,1080],"dpr":2,"directive":"FAST_OR_SAFE","screenshots":4,"bolts":1,"manualHits":1,"pageErrors":[],"backing":[3840,2160]}
```

**Native 4K resolution assertion PASSED**; one first-cycle manual counter PASSED, with no page exceptions. Not yet a verified full three-counter 4K fight. Final unit suite after fix: **12/12 passed**, plus `python -m py_compile qa/v3-printer-browser.py`. The reference 650×800 and physical 4K browser counter captures were actually inspected. Browser navigation to loopback and local file URLs was blocked by the isolated test environment; test harness uses browser `set_content` populated from the actual module and preview sources. Standard `python -m http.server 4173` remains the intended user-facing browser route on normal hosts.


## Continuation QA and design refinement | 8 Nov 2026, after first draft PR

**Source verified:** Original PR #19 branch files and local tested files match Git blob SHAs for boss, renderer, preview and browser harness. The Node test file differs only in a blank line preceding the 17th test; test logic is the same.

### Bugs and gameplay defects actually fixed

1. **Moving Goalposts previously teleported its feeder position between cycles.** It now smoothly travels along its existing illustrated rail during the 1.65-second telegraph lull, remains fixed through jam and counter, and is tested at mid-rail and at rest. No target relocates beneath a grabbed packet.
2. **Mira's visible HOLD label was not clickable.** The face and label now activate the same one-use, genuinely wider counter opportunity, with no double application.
3. **Pausing or hiding the tab during a drag could retain a captured pointer.** The standalone preview now calls `cancelPointer()` on pause/blur, restoring the packet without a lost attempt.
4. **Incoming sheets were decorative parry targets.** Clicking one now visibly registers a manual parry, changes the hint and earns +15 world units of feeder width per sheet (capped at three sheets per cycle). The next counter is easier; parry is optional and zero-parry wins remain possible. The Fast or Safe adapter retains this earned modifier when its width changes.

### Final executed checks

`node --test qa/v3-printer.test.mjs`: **17/17 pass, zero failures** (five full directive victories, five bug/regression cases and one real parry-benefit test). `python -m py_compile qa/v3-printer-browser.py`: pass.

Real headless Chromium/Playwright used actual pointer-down/move/up events and untouched authored Canvas2D boss/render source in an in-memory HTML module assembly. The isolated browser policy refuses localhost and external URL navigation; the served Pages route **has not** been independently HTTP verified. Every viewport below completed **all three manual bolt-removal cycles**, emitted no page errors and matched the expected canvas backing size:

| CSS viewport and backing | Directive | Manual counters | Canvas backing | Browser errors |
| --- | --- | ---: | --- | ---: |
| 1920×1080 @ DPR1 | Moving Goalposts | 3/3 | 1920×1080 | 0 |
| 650×800 @ DPR1 | Mandatory Collaboration | 3/3 | 650×800 | 0 |
| 2560×1440 @ DPR1 | Double Entry | 3/3 | 2560×1440 | 0 |
| 3440×1440 @ DPR1 | Sponsored Workflow | 3/3 | 3440×1440 | 0 |
| 1920×1080 CSS @ DPR2 | Fast or Safe | 3/3 | **3840×2160 native** | 0 |

The desktop browser test additionally toggles Escape pause and confirms zero gameplay clock advancement, cancels an active packet drag with Escape and verifies respawn, then clicks real victory replay and verifies a clean next run. Re-run filters: `V3_PRINTER_FILTER=3840x2160 python qa/v3-printer-browser.py`, and likewise for each other viewport. Five separate scoped runs were used after the combined multi-viewport run reached the sandbox timeout. Original captured JPEGs checked into `qa/v3-printer-evidence/` are real earlier-browser render frames, not concept images; the above browser passes were repeated against the refined version. Final telegraph/portrait/4K PNG recaptures were inspected locally and retain the same screenshot reproduction command.

**Remaining global release checks, not claimed as complete:** direct Night Shift HD visual/audio side-by-side, deployment HTTP route and relative asset check, connected Planck collision service when available, shared AUDIO's orchestration, and end-to-end campaign integration. The completed PRINTER module is still independently playable with authored kinematics and existing event service hook. Never count this PR as global v3 release validation.
