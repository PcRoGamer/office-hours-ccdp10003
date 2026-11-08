# Night Shift v3 | stable parallel implementation contract

**Read before coding any module.** Binding branch `rebuild/night-shift-v3-hd`. The full [NIGHT_SHIFT_GDD_V3.md](NIGHT_SHIFT_GDD_V3.md) owns gameplay requirements. This file owns integration boundaries, **not** an excuse to replace the art with generic modules. Confirm actual HD in browser before declaring visual parity.

## 1. Source layout and exact lane ownership

```text
night-shift-v3.html                      LEAD only, new additive route
night-shift-v3/app.js                    LEAD only, boot and integration
night-shift-v3/runtime/director.js       LEAD only, lifecycle and orchestration
night-shift-v3/runtime/transitions.js    LEAD only, scenes/rounds
night-shift-v3/runtime/{viewport,input,hud,renderer}.js  RENDER only
night-shift-v3/styles/**                 RENDER only
night-shift-v3/art/**                    ART only
assets/night-shift-v3/art/**             ART only
night-shift-v3/audio/**                  AUDIO only
assets/night-shift-v3/audio/**           AUDIO only
night-shift-v3/physics/**                PHYSICS only
assets/night-shift-v3/vendor/**          PHYSICS only
night-shift-v3/systems/**                SYSTEMS only
night-shift-v3/scenes/intake/**          INTAKE only
night-shift-v3/scenes/services/**        SERVICES only
night-shift-v3/scenes/pr/**              PR only
night-shift-v3/scenes/staff/**           STAFF only
night-shift-v3/bosses/printer/**         PRINTER only
night-shift-v3/bosses/quota/**           QUOTA only
night-shift-v3/story/**                  STORY only
qa/v3-<lane>**                          The corresponding lane only
previews/v3-<lane>**                    The corresponding lane only
coordination/reports/<lane>-**           The corresponding lane only
.github/workflows/night-shift-v3.yml     RELEASE only
```

No agent edits another's owned file in its own branch even if the target branch has temporarily diverged. For indispensable integration adaptors, send LEAD an exact patch/repro rather than blindly changing `app.js`.

## 2. Runtime module API

**Use native browser ES modules**, explicit exports, JSDoc typedefs or TypeScript types (without forcing a new build system). Existing HD content can be loaded with a carefully isolated compatibility adapter where appropriate, not pasted into every module. Keep import URLs relative and GitHub Pages subpath safe.

**Shared environment concept, supplied by LEAD/RENDER (mockable by any agent):**
```js
// SceneContext conceptual API. Do not require all services immediately;
// use feature detection and injectable fakes while developing concurrently.
{
  viewport: {
    cssWidth, cssHeight, dpr, worldWidth, worldHeight,
    worldToScreen(x,y), screenToWorld(x,y), safeRect
  },
  canvas, ctx2d, render, input, hud, audio, physics,
  run, deck, effects, ledger, story, events,
  rng, clock, options
}
```

**Scene interface (each card and boss):**
```js
export const definitions = [{
  id: 'I1', department: 'intake', imperative: 'STAMP GOOD!',
  create(context) {
    return {
      enter() {},
      update(dtSeconds) {},       // called only during unpaused action
      draw(ctx2d, viewport) {},  // draws WORLD only; HUD elsewhere
      pointerDown({x,y,id,kind}) {},
      pointerMove({x,y,id,kind}) {},
      pointerUp({x,y,id,kind}) {},
      cancelPointer() {},
      snapshot() { return {}; },  // deterministic QA state
      dispose() {}
    };
  }
}];
```
`ctx.events.emit({type:'card-complete', cardId, outcome, evidence})` is the only card completion path, with immutable unique `cardId` and scored *manual* inputs. World events must not directly mutate final scores. The lead establishes the adapter and can document a minimal adjustment in a PR before integration; missing interfaces are solvable via fakes, not permission to stop.

**Owned objects and effects:** Each card defines its authored visuals, pointer affordances and success/failure states. SYSTEMS provides reversible attempts, scored immutable resolution, 16 IDs, 12-deck construction, perk/directive changes and prevention of duplicate/recursive rewards. PHYSICS exposes stable world/drag/contact with `Planck.js`; a scene may use authored kinematics when physically clearer. No collision may double-award a target.

**Inputs:** viewport `screenToWorld` is authoritative, same transform for rendering and hit tests, pointer capture/cancel/release safe, no canvas coordinate arithmetic copied into each card. All tap/drag/sweep/flick have feedback with distinct hit/miss. Perk activation requires a visible causal event, not a hidden number.

**Time:** use a single gameplay clock advancing by clamped `dtSeconds` *only* when playing; no timer advances on pause, tab hidden, intermission, failure animation, accessible practice interruption. Fixed timestep for Planck, frame interpolation for visual smoothness. No `setInterval` game rules in a scene.

**State:** seeded RNG via `context.rng`, no scattered `Math.random()` in rules; events include `attemptId`, `objectId`, `synthetic` provenance. Replays reset runs; score lens from immutable ledger only. The full GDD named mechanics/author timings are the source of truth, not the eight-card First Shift code.

## 3. Viewport/camera/HUD architecture: zero margins

The **world canvas CSS occupies `position: fixed; inset:0; width:100vw; height:100dvh`** (with visualViewport handling for browser chrome and safe area). Its backing size maps real CSS viewport × DPR (subject to a **measured** 4K performance budget), not `1200x760` hardcode. `worldHeight` may remain a convenient ~760 logical camera units while `worldWidth = worldHeight × cssWidth / cssHeight`; aspect ratio reveals/reframes/crops world scenery, never creates black sidebars. Explicit art-background tiling or extension fills every pixel.

The HUD is **overlaid as actual viewport-anchored 2D controls**. Hearts left, countdown right, imperative at top safe center, directive small contextual icon and unobtrusive pause/mute. It is not a website app toolbar, static rectangular playfield or a centred 1200×760 simulation. Icons and touch targets remain comfortably reachable at high DPI; keep critical 2D objects inside computed `safeRect`. At narrow portrait, adapt arrangement/camera and overlap-free HUD, not a postage-stamp landscape canvas with an empty lower half.

At full-screen 4K physical panel: typical CSS viewport at 200% Windows scaling ~1920×1080 at DPR2, backing 3840×2160. Do not multiply by DPR *twice*. For 4K, inspect visual acuity and GPU load before limiting quality. Test 1080p, 1440p, 4K, ultrawide, 650×800 fallback. No hard-coded white/black bars.

## 4. Independent agent previews

Each lane creates `previews/v3-<lane>.html` (or lane-namespaced test harness) **only in its own PR**, showing actual component interaction with mock renderer/services. Content must be runnable with `python -m http.server 4173` or equivalent, not a static mockup. Screenshots and test logs must be from the real preview; never generative stand-ins. No lane should depend on LEAD having merged every previous PR to make progress.

A PR must describe exports, dependencies, tested interactions, 16:9/4K visual evidence or explicit limitations, quality comparison with HD, and exact integration directions. The LEAD evaluates source conflicts and staged merged builds before importing each PR.

## 5. Canonical invariants to unit/integration test

- Every authored card has its own imperative, mechanic, failure feedback, perk/directive hooks and consequence. Card schema and exact 16 IDs are in v3 GDD.
- Deck: 12 distinct cards, 3 from each department, guarantees/ordering/curated first run, seeded replay.
- Five promotion drafts, three legal offers, eight real perk IDs and L2 cap; five directives transform physical tactics.
- Two bosses: PRINTER MUTINY 3 telegraph/jam/feeder/counter cycles; THE QUOTA 3 counter phases and 4 unique FILE/COOL packets, actual physical closure.
- Ledger: only committed manual input outcomes, exact $80 conserved, no duplicate boss packet reward, real worker outcomes and score consistency.
- Two metrics from same frozen event set. Scripted optimal 40-second run does not establish 7–10-minute *human* authored pacing.
- Human-visible actual audio and animation. Mute and reduced motion don't break mechanics.
- Preserve all existing releases and sources. Main only changes after user-authorized final integration.

## 6. Architecture evolves on evidence

If an interface is insufficient, the submitting lane proposes a narrow compatible extension via PR; LEAD records approval in integration notes and updates this contract with a SHA-checked edit. Do NOT silently mutate the contract independently in six branches or add technology for its own sake. No huge new framework required.
