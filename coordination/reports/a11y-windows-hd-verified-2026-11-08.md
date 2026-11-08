# QA_A11Y | Real Windows browser verification of Night Shift HD

**Date:** 8 November 2026 AEDT, approximately 21:55–22:12.  
**Repository:** `PcRoGamer/office-hours-ccdp10003`, independent branch `agents/v3-qa-a11y-g6-62f91`.  
**Actual URL:** locally HTTP-served `http://127.0.0.1:<ephemeral-port>/arcade-office-hd.html` from the isolated branch checkout, *not* an injected fixture.  
**Access:** UniSync Windows host bridge v2.1.1 with confirmed persistent read/run/write grants. The earlier "Windows workstation is offline" assertion was false because it relied on a different connector.

## What happened

The original A11Y audit was run on real Windows Chromium. It loaded Night Shift HD (HTTP 200), entered play, captured title/action/pause frames, verified viewport fill and pause/clock invariants, but reported 4 page errors in 4 configurations. Root cause was **our test harness** dispatching an untrusted synthetic `pointerdown` to game code that properly called `setPointerCapture`. A synthetic event has no active browser pointer, so this test caused the exception itself. There was no evidence for an HD game regression.

Fixed the harness to use real Chromium CDP `Input.dispatchTouchEvent` start/cancel and retested four configurations. Also increased the gameplay capture delay so initial action frames are not mistaken for fully staged action. A distinct Playwright capture after ~2 seconds verified the animated papers had entered the action scene. No HD source file was edited.

## Verified browser configurations and results

| Actual CSS viewport / DPR | Pass | Fail | Manual review | Unavailable |
| --- | ---: | ---: | ---: | ---: |
| 1440 × 900, DPR 1 (final timing retest) | 9 | 0 | 5 | 0 |
| 650 × 800, DPR 1 | 9 | 0 | 5 | 0 |
| 1920 × 1080, DPR 1 | 9 | 0 | 5 | 0 |
| 1920 × 1080, DPR 2, 3840 × 2160 backing | 9 | 0 | 5 | 0 |
| **TOTAL** | **36** | **0** | **20** | **0** |

These are independent real browser interaction probes, *not* a complete human gameplay pass or proof that v3 exceeds HD.

Passed on all four: HTTP document, screen-filling canvas, backing dimensions, readable canvas name, touch-scroll prevention, keyboard focus, authored Clock In world coordinate opening playable state, Escape pause/freezing game clock, and no uncaught page errors.

**Still REVIEW (not pass):** `M` mute / actual audio output (HD snapshot does not expose muted state), cancelled-gesture state (authentic touch events delivered but no snapshot `dragging`), authored safe input target (no `qaTargets` in HD), visually reduced shaking, and shape/icon high-contrast verification. Do not silently turn these into passes.

## Windows-only regression found and fixed

The first post-fix `python qa/v3-a11y-selftest.py` invocation exposed a Windows `UnicodeEncodeError`: the fixture has an accessible Unicode arrow, while the audit's Markdown writer implicitly used cp1252. Updated the audit's JSON and Markdown writers to explicit UTF-8. The **repeated actual Windows self-test passed**: four Chromium fixture viewports, nine asserted checks per viewport, plus strict/unavailable-route rejection. This confirms Windows can generate evidence without failing on legitimate accessible labels.

## Committed real Chromium evidence

- `qa/v3-a11y-hd-real-browser-results.json`: per-check raw results, four configurations and provenance.
- `qa/v3-a11y-hd-real-title-1440.webp`: title, 1440×900 actual Windows Chromium HTTP capture.
- `qa/v3-a11y-hd-real-play-1440.webp`: running action, 1440×900; capture delayed after Clock In for proper staging.
- `qa/v3-a11y-hd-real-play-narrow.webp`: 650×800 action test.
- `qa/v3-a11y-hd-real-play-4k-backing.webp`: actual 1920×1080 CSS with DPR 2 (3840×2160 canvas backing).

Reproduce: `python -m http.server 4173` from repository root, then in another shell run `python qa/v3-a11y-audit.py --url http://127.0.0.1:4173/arcade-office-hd.html --start-world 220,605 --out qa-artifacts/hd-a11y-real`.

## Integration status / remaining gate

These are source-and-browser-grounded HD baseline checks. The new v3 integrated route has **not** been verified by this lane because the shared integration branch has not yet provided a complete tested runnable candidate at this checkpoint. When LEAD publishes one, repeat against `night-shift-v3.html`, collect the same four viewport frames and fail honestly on missing capabilities. Existing releases remain untouched. No game quality, full-campaign, audio, accessibility, or public release pass is asserted.
