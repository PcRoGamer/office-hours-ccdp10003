# RELEASE peer-branch readiness probe | 2026-11-08 AEDT

**CI evidence:** [Actual test run 42468384330](https://github.com/PcRoGamer/office-hours-ccdp10003/actions/runs/42468384330)  
**Fixture:** Read-only checkout of other agents' own branches, using the RELEASE branch's Playwright harness. 1920×1080 and 650×800 screenshots, HTTP/asset/script/backing/overflow checks and a real pointer/keyboard interaction. No owners' files modified.  
**Commit:** RELEASE harness head `cc6784905357ce3e58482ea353a6883103b36ddb`.

## Findings

| Branch | Native tests | Real Chromium preview | Status |
|---|---|---|---|
| `agents/v3-intake-81d47` | PASS | PASS; CLOCK IN and I3 selector | **Standalone-ready** |
| `agents/v3-services-n8-7c42` | No Node suite in branch | PASS; S1→S2 selector and 2 viewport renders | **Standalone-preview-ready** |
| `agents/v3-systems-g6-0811b` | PASS | PASS; interactive targets and pause | **Standalone-ready** |
| `agents/v3-story-k7m29` | PASS | PASS; 3 perk offers and one manual selection | **Standalone-ready** |
| `agents/v3-physics-261108-soundlab` | FAIL | FAIL; browser exception at both sizes | **Not preview-ready** |

These results **do not** certify full GDD, art quality, musical quality, connected gameplay, course rubric or publication.

## PHYSICS blocking defects, independently reproduced

1. **Native invariant failure:** the author's own `qa/v3-physics.test.mjs:33` asserts that `sim.box({id:'bad',shape:'potato'})` must throw `/Shape/`. The adapter does not throw, producing `AssertionError [ERR_ASSERTION]: Missing expected exception.` The `box` wrapper in `desk-world.js` currently normalizes shape to `box` before validation. Either honor and validate explicit `shape` inputs or update its public contract/tests to disallow them; suppressing the failing assertion without establishing consistent validation is not a fix.
2. **Actual first-frame crash:** both viewport browser runs emit `TypeError: Cannot read properties of undefined (reading 'step')`. In `previews/v3-physics.js`, line 7 declares `sim` undefined; `resize()` (lines 12–15) invokes `reset()` **only if `sim` is already truthy**; line 164 calls `resize(); requestAnimationFrame(frame)`; `frame` line 139 unconditionally calls `sim.step(dt)`. Thus the initial world is never created. Correct initialization before scheduling the first frame (for example, `resize(); reset(); requestAnimationFrame(frame)`, avoiding accidental double reset on subsequent resizes), then rerun the browser at both sizes and inspect rendered physical props.

The error is from **actual Playwright pageerror**, not a guess based on a log label. Its JSON and browser frames are in [the physics artifact](https://github.com/PcRoGamer/office-hours-ccdp10003/actions/runs/42468384330/artifacts/13612875425).

## Observed visual limitations, not release approvals

- INTAKE showed an actively drawn cartoon I3 scene at 1920×1080 and an accessible intake start dialog at 650×800. Real screen graphics are readable; no claim of full-run cohesion.
- SERVICES actually changed to S2 and drew the coffee-catching room at 1920×1080, with S1 playable layout visible in portrait. This is a stronger spatial preview than a static design.
- SYSTEMS is intentionally a **systems-only lab**: the screenshot is a flat light form panel on dark scenery with small numbered buttons. LEAD must replace/demo-stage it using HD production art, not regard standalone technical green as visual acceptance.
- STORY shows a working promotion overlay and selectable perks at 1920×1080 and an independent office scene in portrait. Its source-bearing narrative and full-promotion flow still require integration review.
- PHYSICS screenshots are not valid visual acceptance because the world never initializes.

**Immediate unblock:** PHYSICS owner fixes both genuine errors and opens its own draft PR. LEAD ships a browser-run v3 entry, then imports the passing scene modules surgically. ART/AUDIO/RENDER and both bosses remain critical; do not silently substitute lab previews for the HD visual floor. RELEASE browser gate remains red on complete v3 because no integrated `night-shift-v3.html` is available at this tested commit.

**Evidence links:** [INTAKE artifact](https://github.com/PcRoGamer/office-hours-ccdp10003/actions/runs/42468384330/artifacts/13612363513), [SERVICES artifact](https://github.com/PcRoGamer/office-hours-ccdp10003/actions/runs/42468384330/artifacts/13612940369), [SYSTEMS artifact](https://github.com/PcRoGamer/office-hours-ccdp10003/actions/runs/42468384330/artifacts/13611923586), [STORY artifact](https://github.com/PcRoGamer/office-hours-ccdp10003/actions/runs/42468384330/artifacts/13612701878).
