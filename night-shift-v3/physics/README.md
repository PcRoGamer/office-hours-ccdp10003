# Night Shift v3 physics (PHYSICS lane)

Uses the **vendored, MIT-licensed Planck.js 1.5.1** (existing `feat/first-shift` blob; unchanged). No fallback engine. Browser uses a global `<script>` before native ES modules; Node can inject `planck` explicitly. Coordinates are **world units in design pixels**; the renderer is responsible for viewport/world mapping. Gravity and velocities are specified in pixels/second units. The adapter converts to Planck metres internally at 60 px/m.

```js
import {createPhysics} from './night-shift-v3/physics/desk-world.js';
const sim=createPhysics({planck:window.planck,gravity:{x:0,y:880},onEvent:evt=>console.log(evt)});
const file=sim.box({id:'file-a',x:200,y:220,width:100,height:60,type:'dynamic',bullet:true});
const bin=sim.box({id:'bin',x:600,y:560,width:130,height:70,sensor:true});
sim.step(activeDt,{paused:isPaused});  // call once per active frame
sim.grab(x,y);sim.move(x,y,elapsedPointerSeconds);sim.release();
sim.dispose();
```

**Contacts are facts, not score mutations.** Dispatch events after the fixed-step loop (`contact-begin`/`contact-end`, stable IDs, relative speed, tick, sensor); the scene/ledger owns idempotent resolution and attempts. `grab` uses Planck mouse joints, preserving collisions while held; `release` blends the measured last 55 ms of pointer travel into physical launch velocity, bounded to 1650 design px/s. Never call `world.step()` separately from this adapter. Use `context.viewport.screenToWorld()` for pointer coordinates before calling `grab/move`.

Guaranteed: unique IDs, cumulative clamp / ≤6 substeps per frame, pause freezing, no double-begin while a contact persists, safe pointer cancel, remove/dispose idempotency, CCD via `bullet`, snapshot for QA. Limitations: the physical floor/walls should be authored by each scene with static fixtures; joints should be discarded on navigation via `dispose`; the bridge's `create(context)` works without future RENDER/SYSTEMS modules. Scores and audio are intentionally not coupled here.

**Standalone preview:** `python -m http.server 4173`, then open `/previews/v3-physics.html`. Pointer drag/flick any folder into the APPROVED chute, use orange bumpers for bank shots, pause with Space, reset with R. Preview renders a world to every viewport pixel, with HUD outside its physics transformations. No `main`/HD/other lanes are edited.

**Unit test**: `node qa/v3-physics.test.mjs`. **Browser smoke**: `python qa/v3-physics.browser.py` with Python Playwright + Chromium installed. It records real snapshots in `qa/v3-physics-evidence/` (generated, not committed unless manually audited). The CI prerequisites are the vendored Planck asset and an available browser; do not treat a missing browser as a passing test.
