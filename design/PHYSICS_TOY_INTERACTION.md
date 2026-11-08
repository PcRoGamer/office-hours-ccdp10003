# Physics-driven office toy: implementation decision (8 Nov 2026)

Status: APPROVED DESIGN DIRECTION; NOT YET IMPLEMENTED OR BENCHMARKED.

## Engine choice

**Introduce a genuine 2D rigid-body physics system for the interactive office props.** First candidate: **Matter.js 0.20.0** (MIT), https://brm.io/matter-js/docs/index.html and https://brm.io/matter-js/docs/classes/MouseConstraint.html . Matter offers rigid bodies, collision events, constraints, friction, restitution, stacking and direct browser integration with the existing Canvas2D renderer. Compare with **Rapier 2D** (Rust/WASM), https://rapier.rs/docs/user_guides/javascript/getting_started_js/ , using the same small physical desk scene if Matter fails a fidelity, stability, latency or FPS test. Planck.js is another established 2D alternative. User-listed Three.js RapierPhysics, JoltPhysics, Cannon-es and Ammo target **3D** rigid bodies and are the wrong default for the existing 2D architecture. No Three.js conversion.

**This is a tactile-gameplay feature, not an excuse for scope expansion.** Keep the eight short, varied microgames, corporate Promotion Trap, characters, research and complete boss. Physics should make work objects enjoyable in their own right. Job Simulator contributes tactile job play, not 3D VR or a requirement to clone its assets.

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

**FIRST: build and run one isolated desk physics spike before wholesale integration.** Use folder, paper, cup, stapler, tray and chute. Demonstrate pick-up, release, momentum, bounce, contact stacking, collision event, a true scored chute and pause/resume/reset. Capture actual video/screenshots, inspect and compare scripted version versus simulation for tactility, clarity, fairness and input feel. If Matter is not the best choice, test Rapier2D in the same scene; choose on observed results, not technology loyalty.

Test actual drag mapping at 1440x900, 1366x768, 1024x600 and 650x800, plus DPR2 and touch. Test variable frame pacing, hidden tab and pause, 50 repeatedly spawned bodies, reset/retry no leaks, score idempotence, physics-assisted perks and all boss collision patterns. Record actual FPS/load measurements, not invented benchmark claims. Maintain all original browser QA.

Physics must be **improving the game**, not converting easy microgames into frustrating simulations. Constrain or omit simulation in an individual game where it damages clarity, precision or pace; there still must be multiple actual physics-driven toys. Never trade away the completed demo or release checks for a physics toy prototype.

The user explicitly requested investigation of physics as the route to Job Simulator-like physical play. Codex should implement it if actual spike confirms that it adds tactile value, then finish the entire First Shift release.
