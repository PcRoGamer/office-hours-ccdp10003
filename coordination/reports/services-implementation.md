# SERVICES lane integration / real QA report
**Role:** SERVICES (S1–S4). **Branch:** `agents/v3-services-n8-7c42`. **Target:** `rebuild/night-shift-v3-hd`.
**Evidence date:** 2026-11-08 AEDT. **Status:** independent playable candidate; NOT HD visual acceptance and NOT an integrated release.

## Owned source and contract
- `night-shift-v3/scenes/services/index.js` exports `definitions`: S1/S2/S3/S4 with `create(context)`, `enter/update/draw/pointerDown/pointerMove/pointerUp/cancelPointer/snapshot/dispose`.
- `previews/v3-services.html` runs all four scenes with a simulated host: fullscreen world, viewport-edge HUD, mouse/touch capture, deterministic events, directive select, pause/retry/mute, QA state probe.
- `qa/v3-services-browser.py` is the real Chromium pointer test, including 1440×900, 650×800 and 3440×1440 screenshots.
- Each success goes through `context.events.emit({type:'card-complete',cardId,outcome,evidence})`; no direct score mutation. One attempt may emit at most one completion/failure. Evidence includes `attemptId` and actual manual result.
- Camera/world follows host viewport width with a 760-unit world height. In preview the canvas fills the entire screen with a separate pinned HUD. No fixed frame or black bars.

## Four authored physical challenges
| ID | Physical action actually implemented | Outcome |
|----|----|----|
| S1 | Grab and drag/flick three chunky folders toward highlighted inbox; bumper provides ricochet; moving/linked targets supported | `filed:[0,1,2]`, `cleanFiles:3`, `bankShotUsed` |
| S2 | Move a large tray under three independently falling mugs; at least two real catches required | `caught`, `spilled`, `allThreeCaught`, `miraWorkstation:functional/disrupted` |
| S3 | Observe changing safe light; pull real protruding sheet to release circle; early attempt triggers toner cloud, no scoring | `safePull`, `priorCoughs`, method |
| S4 | Hold physical socket for 0.85 seconds; release then deliberately drag plug into port; restart pulse and miss feedback | method, errors, directive |

## Executed testing (not simulated claims)
- Command: `node --check night-shift-v3/scenes/services/index.js`: PASS.
- Command: `python qa/v3-services-browser.py` with Chromium 144: **19/19 PASS**.
- Real pointer actions: S1 all 3 folders; S2 3/3 mug catch; S3 safe release; S4 socket hold + deliberate plug; exactly four unique completion events with attempt IDs. Pause freeze verified.
- Real scene screenshots captured at **1440×900**, **650×800**, **3440×1440**. Exported alongside full script in the chat's `night-shift-v3-services-prototype.zip`.
- Browser environment restricted all `localhost` and `file://` navigations (`ERR_BLOCKED_BY_ADMINISTRATOR`). The test fallback injects **the actual HTML and actual module source** into about:blank for real Chromium rendering/pointer tests. This is not an HTTP-module import test. Normal preview still uses a relative ES module import and should be rechecked from GitHub Pages/HTTP by lead.
- Visual defect found on first screenshot: banner text overlapped scene; repositioned/resized notice and delayed finish overlay. Also corrected S1 ricochet landing to register cleanly, then reran 19/19.

## Honest visual comparison and unresolved quality gates
- Real previews establish a fullscreen cohesive dark paper-theatre direction, readable targets, physically performed interactions, readable narrow viewport, distinct animated cast reaction beats.
- **NOT claimed as superior to Night Shift HD yet:** current cast and prop illustrations are procedurally simplified, staging less rich than the HD baseline; S2's first moving cups and S4's electrical impact need an ART/AUDIO integration pass. Preview audio is deliberately minimal interaction-feedback placeholders, not the AUDIO lane's musical system.
- Directive coverage: S1 moving-goalposts and double-entry are physical; S2 fast-or-safe changes tray size, sponsored/collaboration show notices but lack full two-route and helper mechanics; S3 has safe-pull and carbon confirmation, sponsored currently displays real assistance as a visual clue; S4 has double-entry verification, while moving-goalposts/collaboration cues need actual rule changes. **Do not count cosmetic-only adapters toward SYSTEMS directive compatibility.**
- Physics: scene-authored kinematics for props and pointer affordances. PHYSICS lane owns Planck and will integrate any needed bodies/collisions; do not imply Planck in this module.
- Current test harness uses fixed 1440x900 and responsive stress screens, not verified physical 4K GPU timings. No human playtime or pleasure score is claimed.

## Integration steps
1. Import `{ definitions as services }` from `./scenes/services/index.js`. Use each `definition.create(sceneContext)`. Supply viewport with `worldWidth/worldHeight`, `events.emit`, `audio.play` optional, and `options.attemptId`; `run.directive` is accepted.
2. `draw(ctx2d,viewport)` draws world in 1200 logical coordinate center; host viewport maps x=600 to screen centre, y on a 760 unit canvas. HUD is not drawn in scene.
3. Host `pointerDown/Move/Up` passes **world coordinates** and handles capture/cancel. The sample preview is the integration reference. Host listens only to `card-complete` for scored resolution; `card-failed` should rewind the current attempt without logging progress.
4. Do not merge/release without lead-led HD visual comparison, full directive adapter ownership, Planck contacts where appropriate, actual soundtrack, and integrated campaign E2E.

## Files and provenance
Screenshots captured directly in Chromium from the real playable preview; never generated concept art. Preview files and test results are also in the chat-linked prototype ZIP. All changes are lane-owned and do not modify `main`, HD, integration coordinator documents or other agents' files.
