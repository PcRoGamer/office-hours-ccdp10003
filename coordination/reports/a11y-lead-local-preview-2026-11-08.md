# QA_A11Y | Real Windows Chromium inspection of local LEAD v3 preview

**Date:** Sunday 8 November 2026, 22:30 AEDT.  
**Source:** read-only inspection of LEAD's **uncommitted Windows worktree**. This was a locally runnable I1-first-card preview, not an integrated/published full v3 release. No LEAD or Night Shift HD files were modified.  
**Actual route:** `http://127.0.0.1:<ephemeral-port>/night-shift-v3.html`, served by Python from the existing LEAD worktree and tested with Windows Chromium Playwright.

## Verified interactions

| CSS viewport | PASS | FAIL | REVIEW | UNAVAILABLE |
| --- | ---: | ---: | ---: | ---: |
| 1440×900, DPR 1 | 10 | 0 | 4 | 0 |
| 650×800, DPR 1 | 10 | 0 | 4 | 0 |
| **Total** | **20** | **0** | **8** | **0** |

The actual v3 preview served HTTP 200 and fetched its local runtime and the HD source asset without page errors. Its world canvas fills the viewport, has an accessible name and touch-scroll prevention. Keyboard focus includes the CLOCK IN button; activating it enters **`mode=card`**. The authored `good` target was clicked at its actual world-to-CSS-transformed coordinate and removed once. Escape pauses and freezes the gameplay clock. These are tested input behaviors, not claims about story/progression.

**Unverified (REVIEW, not PASS):** actual mute/audio output, cancelled-drag state not exposed in the snapshot, reduced-motion visual quality, and high-contrast icon/shape cues. The local preview exposes only the first I1 card, so 16-card coverage, boss fights, full progression, actual music quality, and overall superiority to HD are not certified.

## Real-browser artifacts in this PR

- `qa/v3-a11y-lead-local-real-browser-results.json` includes each check, viewport, and its result.
- `qa/v3-a11y-lead-real-title-1440.webp` shows the live rendered preview title.
- `qa/v3-a11y-lead-real-play-1440.webp` shows the live first-card action.
- `qa/v3-a11y-lead-real-play-narrow.webp` shows the 650×800 playable first card.

**Visual observation:** the preview has large readable approval/rejection sheets dominating the central stage, a character on the left and a machine on the right. The HD baseline stages moving forms more laterally along conveyors. This is a meaningful scene-level comparison, not an overall visual pass. Narrow targets were actually reached through the recorded viewport transform.

**Exact source digests at inspection:**
- `night-shift-v3.html`: `81da23bed3bb724da458e659314a554b0d9c5b162470d34a7dd8ee5d19a9d3cd`
- `night-shift-v3/app.js`: `4387a914051131161ff0db166a303359567562e818f72fb6eadf1d976e3a4fa4`
- `night-shift-v3/runtime/director.js`: `469c5ef3426e992d5599a54066a3ee0ca61fc53f03c7076bd6effc211e1c1e79`
- `night-shift-v3/runtime/transitions.js`: `b7403dc16686772ba6c47c4b568cca9cfc1937c3da70682be492c63442a0929d`

**Audit harness improvements:** recognises the real `#clock-in` button, `snapshot().mode='card'`, boolean `paused`, and source-provided `targets[]` and `viewport` for safe verifiable pointer action. It does not invent world positions or overwrite the LEAD implementation.
