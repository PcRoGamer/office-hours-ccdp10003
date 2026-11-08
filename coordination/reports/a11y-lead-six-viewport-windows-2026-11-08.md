# QA_A11Y | Six-viewport Windows browser validation and input QA

**Observed:** 2026-11-08 approximately 22:31–22:53 AEDT.
**Contributor branch:** `agents/v3-qa-a11y-g6-62f91`; PR #18 into `rebuild/night-shift-v3-hd`.
**Test source:** locally HTTP-served **uncommitted LEAD working tree** at `C:\Users\Admin\NightShiftV3-Lead-hd0818`. Tested exact route `night-shift-v3.html` in real Windows Chromium Playwright. This is not the published or integrated full v3.

## Tested evidence

| CSS viewport and DPR | PASS | FAIL | REVIEW | UNAVAILABLE |
|---|---:|---:|---:|---:|
| 1440 x 900 @1 | 12 | 0 | 4 | 0 |
| 650 x 800 @1 | 12 | 0 | 4 | 0 |
| 1920 x 1080 @1 | 12 | 0 | 4 | 0 |
| 1920 x 1080 @2 (4K canvas backing) | 12 | 0 | 4 | 0 |
| 1024 x 600 @1 | 12 | 0 | 4 | 0 |
| 3440 x 1440 @1 (ultrawide) | 12 | 0 | 4 | 0 |
| **Total** | **72** | **0** | **24** | **0** |

Raw full per-check evidence: `qa/v3-a11y-lead-6-viewport-results.json`. Captured actual browser frames: `qa/v3-a11y-lead-6view-*.webp` (title, action, tapped paper, narrow, compact, ultrawide, DPR2). Metadata in JSON includes SHA-256 digests of all four inspected LEAD source files. All HTTP requests returned successful statuses, no page JS exceptions observed.

**PASSED on each view:** browser document, edge-to-edge Canvas2D surface and correctly sized backing, accessible canvas label, touch scroll prevention, keyboard focus, Enter to CLOCK IN, accessible M mute control actually toggling `aria-label`, Escape pause freezing game clock, trusted Chromium pointerdown + pointercancel delivered without a lost heart or score alteration at a neutral corner, click/tap of a verified good form and confirmed target removal, no page errors.

**REVIEW on each view, not silently upgraded:** actual audible mute/music, pointer-drag cancellation state (not exposed by app snapshot, despite proper event lifecycle), reduced-motion suppression (preview reads media preference but no evidenced effect from this lane), high-contrast/shape-only cues. Mere Canvas DOM attributes cannot prove these.

## Reproduced test defect, corrected within QA-owned files

Initial 1920 x 1080 tests falsely marked an approved form as unclickable. Root cause: the LEAD fallback scene exports snapshot target coordinates **after** `viewport.worldToScreen`, while our earlier QA script applied world-to-CSS transformation again. At 1440 x 900 the double-transform still landed within a wide hitbox, disguising the error. At 1920 it missed.

Fix: accept explicit target coordinate space, and treat LEAD's *verified one-card fallback signature* (`hdAtlas=hd-original-2048`, `deck=['I1']`, incomplete campaign) as CSS-pixel targets. Unknown future integrated scenes stay REVIEW rather than guessed. Re-run all 6 configurations: reliable approved-form removal at each tested size. No LEAD code was modified.

Second QA improvement: original cancellation probe used the centre of the stage, which could hit a sponsored document. Now the test uses a neutral corner, observes actual native CDP touch start/cancel, and checks there was no heart or ledger change.

Third QA improvement: keyboard M now proves the visible accessible mute control changes; sound playback remains REVIEW rather than being inferred from an ARIA label.

## Fixture regression and negative gates

Current modified audit passed **four individually/sharded real Chromium fixture viewports**: 56 PASS, 0 FAIL, 8 REVIEW. Strict audit intentionally returned a nonzero exit on REVIEW, and an absent HTTP route returned a nonzero exit with UNAVAILABLE. Both negative-gate cases tested on 1440 x 900. Python syntax checked. The one-shot multi-viewport self-test exceeded the connector's per-call runtime, so do not cite that invocation as a pass; the individual runs and JSON are independently verified.

## Scope and handoff

The LEAD route remains a polished **single I1 fallback plus promotion preview** rather than a complete 16-card, 12-card-per-run, five-directive/two-boss campaign. The integration branch itself did not yet expose `night-shift-v3.html` at the check performed, so no integrated full-v3 pass or public-release claim is made. This is useful real-browser **component QA evidence**.

Merge this independent QA tool only after reviewing source. To repeat against candidate, serve its checkout using `python -m http.server 4173`, then run `python qa/v3-a11y-audit.py --url http://127.0.0.1:4173/night-shift-v3.html --out qa-artifacts/retest`. If the new main runtime exposes different target semantics, set `qaTargets[].coordinate` to `css` explicitly, or publish target coordinate space. Do not reintroduce the double-transform. Do not change existing HD routes or merge an incomplete v3 as the release.
