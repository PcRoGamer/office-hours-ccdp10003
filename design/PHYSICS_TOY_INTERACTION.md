# Physics-driven office toy: implementation decision (8 Nov 2026)

Status: APPROVED DESIGN DIRECTION; NOT YET IMPLEMENTED OR BENCHMARKED.

## Engine choice (Box2D-family preflight, supersedes Matter-first)

**Introduce real 2D rigid-body simulation for the interactive office props.** The first engine spike is **Planck.js v1.5.1** (the actively maintained JavaScript/TypeScript Box2D-style implementation): https://github.com/piqnt/planck.js and https://www.npmjs.com/package/planck . Why first: browser-native JS, familiar Box2D world/bodies/fixtures/joints, broad 2D collision mechanics, clean local bundling and no asynchronous WASM startup dependency for an intentionally small Canvas2D microgame.

**Second candidates, only when measured shortcomings justify them:**
- **box2d-wasm v7.0.0:** https://github.com/Birch-san/box2d-wasm and https://www.npmjs.com/package/box2d-wasm . It exposes **Box2D C++ 2.4.1**, not the current **Box2D 3 C17 API**. Maintainer docs show a WASM payload plus JS bridge, with a notably old published release. Verify availability, bindings, correct fixed-step integration, async load, relative public asset URLs and actual results. Do not assume free multithreading, automatic speedups or "perfect" continuous collision detection.
- **Rapier 2D:** https://rapier.rs/docs/user_guides/javascript/getting_started_js/ . Rust/WASM with modern 2D CCD, sensors and joints. A strong actively developed alternative, but needs correct initialization and bundle asset handling. Compare it when projectile tunnelling, complex joints or stability tests make it worth switching.
- **Matter.js 0.20.0:** https://brm.io/matter-js/docs/index.html . Retain as a lightweight control implementation/backup; not the default if Planck gives better actual physical feel.

**Don't confuse Box2D implementations.** Official current engine documentation at https://box2d.org/documentation/ describes Box2D 3 (C17). `box2d-wasm` maps the older v2.4.1 C++ API. Planck is a JavaScript rewrite influenced by Box2D, NOT current official Box2D 3. A wrapper's upstream age, license, packaging and deployment matter as much as the low-level solver.

**CCD is never a promise of perfect hit registration:** Box2D and Rapier use approximations and have documented motion/tunnelling limits. Design fast projectiles with sensible size/velocity caps and use sweep tests / sensor tolerances where justified. Physics contacts trigger idempotent game intents; they must not duplicate cards, packets, score or licence tokens.

**Do not convert this 2D game into Three.js.** The user-provided Three.js RapierPhysics, JoltPhysics, Cannon-es and Ammo references target 3D. Existing Night Shift HD is Canvas2D, and the First Shift target remains fast, authored 2D microgames.

**Evidence-driven selection, with time-boxed experiment rather than architecture debate:** Build the same *one* real desk toy for Planck first; inspect throwing, sliding, stacking, collisions, joint spring, chutes, target sensor, input latency, runtime stability and performance at realistic object counts. If Planck doesn't meet the creative bar or has real defects, compare a WASM candidate using identical inputs. Report measurements and video screenshots, don't invent results. Select the lightest engine with demonstrably better play feel, physics correctness and integration cost. Never postpone the complete eight-card boss/release for a hypothetical 1000-body stress test.


## Required physics scenes and affordances

1. **S1 File Frenzy:** paper/folder bundles have mass and drag/throw momentum, can ricochet on staplers and moving chutes; bank-shot and magnet perks change real trajectories. Success via true sensor entry plus deterministic rules, not a drag-release coordinate threshold.
2. **S2 Save the Coffee:** cups fall, collide with the tray/desk, bounce, and tip. Catching is physical and readable; failures are funny and fair.
3. **I1 Stamp Good:** a moving springy stamp presses physically interactable paper; satisfying actual contact and rebound. Do not require frustrating high-precision stacking in the opening 15 seconds.
4. **THE QUOTA:** paper/projectile collisions with moving gears, countershots, meaningful ricochets and feedback. Boss phases remain telegraphed and learnable; three bolts require intentional actions.
5. **Optional:** loose spare props in a 2-gesture, timer-free desk moment and physical licensing chips in T4, only if tactile value outweighs complexity. Keep chart correction as a precise drag, not falling geometry.

At least three different office props must be satisfying to manipulate even with score/XP/timer hidden. Showcase little emergent accidents (tipping papers, bouncing a folder, knocking a stapler) *without* manufactured punishment for random physics jitter.

## Technical integration

- Create an isolated reusable adapter e.g. first-shift/physics2d.js; never modify arcade-office-hd.html or historical releases; retain HD art/input/audio Canvas2D.
- Use existing design-coordinate mapping and a tested conversion to simulation units; pointer capture and drag constraints correctly track transformed canvas on desktop, phone viewport and DPR2. Prefer explicit pointer target constraint with calibrated inertia and throw impulse over unadapted built-in mouse picking.
- Fixed 60Hz physics update, bounded catch-up/substeps, render interpolation; pause/help/intermission/background stop physics. Hard reset/teardown world/bodies/joints/collision listeners per challenge and retry; avoid leaks.
- Tunable mass, friction, damping, restitution, gravity and collision layers **per minigame**. Static scenery, dynamic movable props, sensors for scoring. Keep HUD/mail/modal UI non-physical and click-safe.
- Physics contact is **not** permission to issue points twice. Collision events may request gameplay actions; stable unique IDs, verified target state and idempotent ledger commits determine actual scores, inventory and boss packet uniqueness. Synthetic clones cannot farm official points.
- Pin an exact version, self-host built dependency and license in published static site; verify public GitHub Pages subpath and no CDN dependency. Avoid simulated previews being mistaken for real engine runs.
- Preserve user precision-under-distraction gameplay from Project 1.1/1.2; interruptions must be fair and not hijack a drag gesture.
- Physics is not game feel by itself: visible anticipation/squash/rotation, impact sounds, hand/grab affordances, forgiving targets, responsive reactions and fair constraints complete the effect.

## Implementation gate and proof

**FIRST: build and run one isolated Planck.js desk physics spike before wholesale integration.** Use folder, paper, cup, stapler, tray and chute. Demonstrate pick-up, release, momentum, bounce, contact stacking, collision event, a true scored chute and pause/resume/reset. Capture actual video/screenshots, inspect and compare scripted version versus simulation for tactility, clarity, fairness and input feel. If Planck has observed deficiencies, benchmark box2d-wasm or Rapier2D in that SAME scene before switching; select on measurements and on-screen experience, not on assumed native/WASM superiority.

Test actual drag mapping at 1440x900, 1366x768, 1024x600 and 650x800, plus DPR2 and touch. Test variable frame pacing, hidden tab and pause, 50 repeatedly spawned bodies, reset/retry no leaks, score idempotence, physics-assisted perks and all boss collision patterns. Record actual FPS/load measurements, not invented benchmark claims. Maintain all original browser QA.

Physics must be **improving the game**, not converting easy microgames into frustrating simulations. Constrain or omit simulation in an individual game where it damages clarity, precision or pace; there still must be multiple actual physics-driven toys. Never trade away the completed demo or release checks for a physics toy prototype.

The user explicitly requested investigation of physics as the route to Job Simulator-like physical play. Codex should implement it if actual spike confirms that it adds tactile value, then finish the entire First Shift release.
