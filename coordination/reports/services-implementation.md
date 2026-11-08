# SERVICES lane: shipped draft / integration evidence

**Repository:** `PcRoGamer/office-hours-ccdp10003`  
**Integration:** `rebuild/night-shift-v3-hd`  
**Own branch:** `agents/v3-services-n8-7c42`  
**Draft PR:** https://github.com/PcRoGamer/office-hours-ccdp10003/pull/16  
**Date:** 8 November 2026 AEDT  
**State:** Four playable cards with all 16 GDD-eligible directive adapters coded, 53/53 independent Chromium checks; **not yet HD-quality accepted nor integrated into the campaign**.

## Modules and run command

- `night-shift-v3/scenes/services/index.js`: native ES module exports `definitions` and default `definitions`, IDs **S1–S4**, each exposing the agreed `create(context)` scene lifecycle (`enter`, `update`, `draw`, pointer down/move/up/cancel, `snapshot`, `dispose`).
- `previews/v3-services.html`: genuine fullscreen Canvas2D mock-host playground with selectable directives, browser input, pause/restart and viewport-edge HUD.
- `qa/v3-services-browser.py`: **actual Chromium** pointer/viewport QA, generates JSON test outcomes and 1440×900 / 650×800 / 3440×1440 screenshots.
- `qa/v3-services-captures/services-s3-safe.jpg`: **real committed Chromium screenshot**, 1440×900 game-state evidence, not a concept illustration.
- Separate latest chat artifact `night-shift-v3-services-delivered.zip` contains all production files, QA output and 16 actual PNG browser captures for further inspection.

From repo root: `python -m http.server 4173`; open `http://localhost:4173/previews/v3-services.html`. For QA: install Python Playwright + a Chromium binary, then `python qa/v3-services-browser.py`. Test runner currently uses `/usr/bin/chromium`; adapt executable path if using another machine.

## GDD fidelity and causal outcomes

| ID | Real required physical interaction | Recorded outcome |
|---|---|---|
| **S1 / FILE FRENZY!** | Human picks up/flicks **3 folders** into lit target; cartoon bumper can redirect trajectories. | One unique resolution per folder, `cleanFiles:3`, filed IDs and actual chosen route / bumper use. These clean packets are available as systems/boss events. |
| **S2 / SAVE THE COFFEE!** | Player moves tray under 3 falling, swaying mugs, catching **at least 2**; catches are spatially evaluated. | `caught`, `spilled`, `allThreeCaught`; Mira workstation flagged `functional` only after all three saved, otherwise `disrupted`. No imaginary injury. |
| **S3 / UNJAM IT!** | Wait for lit safe interval, drag protruding sheet to illustrated release ring; early pull has toner cough. | `safePull`, `priorCoughs`, route; gesture explicitly trains Printer Mutiny opening. |
| **S4 / FIX THE CABLE!** | **Hold** live socket stable, then **drag** plug into matching port before restart pulse. | Real connect, pulse errors and optional deliberate confirmation; teaches boss alternate cable opening. |

No scene mutates a score directly. Each emits at most one `card-complete` event for a successful human act, with `attemptId`, outcome and manual evidence. Timer failures emit `card-failed` with `manual:false`. Runner must rewind failed attempts instead of committing phantom completed work.

## Full eligible directive matrix (16 card × directive combinations)

| Card | Working GDD-eligible adapters |
|---|---|
| S1 | **DOUBLE ENTRY:** separate carbon copy chute, same original document. **MOVING GOALPOSTS:** inbox relocates between files. **FAST OR SAFE:** simultaneously available smaller/closer fast bin and larger/farther safe bin, with recorded route. |
| S2 | **MOVING GOALPOSTS:** catch tray physically jumps along service rail between resolved mugs; player must release and regrab shifted tray. **FAST OR SAFE:** selectable narrow quicker tray vs broad slower tray. **SPONSORED WORKFLOW:** draggable fake coffee coupon obscures active catch area, separate genuine Mira warning. **MANDATORY COLLABORATION:** optional real Mira action returns one previously spilled mug to a physical trajectory; player still catches it. |
| S3 | **DOUBLE ENTRY:** second manual carbon-seal tap required. **MOVING GOALPOSTS:** release target changes between telegraphed safe windows, not mid-drag. **FAST OR SAFE:** smaller near target or wider distant target. **SPONSORED WORKFLOW:** physical fake toner-ad occlusion must be dragged aside; Mira genuine timing alert remains distinct. **MANDATORY COLLABORATION:** tapping Mira stabilises safe window, while manual paper pull still required. |
| S4 | **DOUBLE ENTRY:** socket verification after plug. **MOVING GOALPOSTS:** port moves on restart pulse. **SPONSORED WORKFLOW:** drag false sponsored port cover aside before connecting real port. **MANDATORY COLLABORATION:** Jules braces the socket, reducing hold requirement but never completing the trace. |

Directive strings normalise from kebab-case, uppercase titles or objects with `id`/`name`/`type` fields, to avoid LEAD/SYSTEMS adapter mismatches. All five appear with tactile state effects, not only textual announcement.

## Tests actually executed

- `node --check night-shift-v3/scenes/services/index.js`: **PASS**.
- `python qa/v3-services-browser.py`: **53 of 53 PASS**, tested in actual Chromium 144 using pointer down/move/up and timestamped screenshot capture.
- Includes all four normal card completions, duplicate-event guard, `attemptId` assertions, timer pause freeze, all five directive families, 16-adapter representative route cases, sponsor obstructions, real Mira/Jules helper agency, regrip requirement, moving port, fake manual-provenance protection, readable vs structured directive IDs, no-page-error assertions and responsive world aspect.
- Actual browser captures at 1440×900, 650×800, 3440×1440; visual inspection caught (and subsequent retests corrected) a feedback/banner overlap, S1 bounce landing registration and a printer banner hiding behind the printer console.
- Testing environment blocked *all* loopback/file:// browser navigation with `ERR_BLOCKED_BY_ADMINISTRATOR`. To still test the real code, browser harness injects exact preview HTML plus the real ES module source **into actual Chromium about:blank**. This is not an HTTP import test. **LEAD must verify native ES module import from a valid HTTP/GitHub Pages URL** on merge.

## Verified art qualities vs HD release gate

Working preview has edge-to-edge office world, large prop silhouettes, readable goals, viewport-anchored HUD and character reactions. However **do not claim the quality surpasses Night Shift HD yet**: the preview's procedural cast is simpler than HD expressive sprites and should be replaced/adapted through ART. The preview's short procedural cue tones are not the AUDIO lane musical score; it is a test harness. Office objects use authored Canvas2D kinematics; any Planck.js contact adapters belong with the claimed PHYSICS lane. No physical 4K GPU timing measurements and no first-time human pleasure/playtime observation have been performed.

## LEAD integration instructions

1. `import {definitions as services} from './scenes/services/index.js'` from the Night Shift runtime; get four `id`-based definitions.
2. Provide `context.viewport.worldWidth/worldHeight`, screenToWorld coordinates, `events.emit` and `options.attemptId`. Audio and RNG are feature-detected. The source uses a centred 1200-reference coordinate plane and world height 760; stage extends to viewport aspect with no black margins. Draw **world only**; host draws HUD separately.
3. Call `scene.update(dt)` only on active, unpaused gameplay; host freezes scene on pause and hidden-tab. Pass pointer events in **world coordinates** with capture/cancel guaranteed. Listen for real `card-complete` vs `card-failed` and commit ledger only once through SYSTEMS.
4. Use S2's actual workstation flag in Staff/PR consequences. Give Printer boss S3 safe-pull and S4 cable-route evidence, and supply S1 clean packets in boss.
5. Run native HTTP module smoke, cross-check actor art with HD at same viewport/state, wire music+FX+Planck and run integrated progression/replay before promotion from draft. Do not overwrite legacy paths or count the full v3 GDD complete from this departmental PR.

**Bottom line:** production-ready *behavioral proposal* with independent browser evidence and full eligible adapter coverage; visual/media/integration acceptance remains the responsibility of the combined rebuild.


## Post-PR #16 regression and game-feel iteration (same agent branch, 8 November 2026)

**Actual fixes shipped:** 
1. **S3 fair hold-to-release:** the safe indicator is now latched on page grab. A legitimately green-started gesture remains valid through a light-cycle transition; an unsafe red-started gesture cannot be laundered by waiting for green. On cancelled pointer, latch resets. UI explicitly reads “SAFE • KEEP PULLING” while a valid gesture is active. This closes a real reproducible fairness defect.
2. **S4 truly continuous stabilisation:** releasing/cancelling early clears socket hold charge. Three 0.4-second taps can no longer replace one 0.85-second uninterrupted hold. Jules still reduces the genuine time requirement.
3. **S4 moving port directive now acts before an error:** the live port telegraphs a position shift while the player is planning a trace, not solely on the failure/restart pulse; the port cannot move while a drag is active. The relocated port can be connected successfully on the first attempt.
4. **S2 terminal freeze:** pointerDown after card-failed/card-complete cannot mutate the caught/spilled/goal state.
5. **Visible text collision fixed:** measured memo text width determines banner footprint/font, and the moving-port helper label is placed below gameplay action instead of inside the feedback banner.

**New tests actually executed locally:**
- Original independent Chromium card/directive test: **53/53 PASS** after changes.
- New real Chromium pointer-and-clock regression file `qa/v3-services-regressions.py`: **21/21 PASS**, including S3 safe-window timing both ways, cancelled pointer, repeated short S4 holds, visible moving-port completion without failure, frozen S2 input, console cleanliness.
- Portable repository regression file `qa/v3-services-timing.test.mjs`: **9/9 PASS** with `node --test qa/v3-services-timing.test.mjs`. This file lives on the GitHub branch and exercises actual scene FSM exports.
- Native ES-module loader verified **inside Chromium** via `await import('data:text/javascript;base64,...')` yielding `S1,S2,S3,S4`. Local web-server HTTP navigation still returns `ERR_BLOCKED_BY_ADMINISTRATOR`, so this proves actual browser ESM syntax but not network URL resolution.
- **74/74 actual browser checks total**, plus 9 Node tests. No known regressions in existing 53.
- New real Chromium screenshots: `qa/v3-services-s3-latched-safe.png`, `qa/v3-services-s4-moving-port.png`, `qa/v3-services-s4-moving-success.png` are included in the chat archive for inspection. Source/control tests and these real rendered frames were inspected. HD visual comparison is **not** falsely marked passed.

**Integration effect:** no API signature changes. Existing `definitions`/scene contract, event names, directive handling and owned path restrictions remain stable. Old releases, `main` and the shared integration branch remain untouched.
