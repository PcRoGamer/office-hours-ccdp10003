# OFFICE ATTACK | Independent Creative QA (Lane D)

**Date:** 2026-11-09 AEDT
**Ownership:** only `qa/office-attack-creative-visual.browser.cjs`, `qa/office-attack-creative-campaign.browser.cjs` and this report.
**Target:** `rebuild/night-shift-v3-hd`. No production source, original HD/v3 release, public Pages site, or Canvas submission touched.

## What was tested

Real Chrome/Chromium, with genuine mouse and CDP-driven mobile touch gestures; screenshots inspected, not merely DOM assertions. The visual test samples the **full screenshot's pixels using Pillow** to distinguish dark bars from intentional solid-color pastel staging. It also validates stage bounds, horizontal HUD non-overlap, script/network errors, old atlas/icon requests, real mobile dragging, and opt-in Marathon UI.

| Tested source | Size | Browser finding |
| --- | --- | --- |
| Integration `09b32a0` | 1440×810 | No console/network errors; **10 legacy atlas/icon requests** |
| Integration `09b32a0` | 650×800 | **56.5% of screenshot rows** are dark top/bottom bars; 10 legacy asset requests |
| Integration `09b32a0` | 390×760, DPR2 | **72.4% dark bars**, 10 legacy asset requests |
| Pending creative-lead PR #51 checkout | 1440×810, 650×800, 390×760 | **0% dark bars** on all three, nonoverlapping horizontal HUD; old atlas/icons still requested |
| Local `OfficeAttack-CuteArt-1109` worktree (uncommitted A-lane art + PR #51 layout) | same three viewports | **PASS all visual/input checks**; 0% dark bands, 0 legacy requests, 0 JS errors, 0 missing assets; touchscreen drag shredded a spam form |

**Important distinction:** The combined art result is a live **local worktree** observation, not proof that the ART PR was committed/merged. Re-run against the assembled branch after A/B/C and creative-lead changes are integrated.

## Campaign + state evidence

1. The original `qa/office-attack-smoke.browser.cjs` passed 4/4 baseline viewport asset, entry and real-click smokes. This alone did **not** detect bad portrait composition.
2. The original `qa/office-attack-fullrun.browser.cjs` went green for rounds 1–6 on the creative-lead checkout, then falsely timed out waiting for index 6 because it assumed the first intermission occurs *after* the printer boss. The gameplay correctly placed it **after 6 microgames, before the printer boss**.
3. The new lane-owned `qa/office-attack-creative-campaign.browser.cjs` derives batch boundaries from the current queue (`firstBossIndex`, `secondBreakIndex`), and adapts total encounters to the queue length. It performs the genuine mouse/pointer solver, not direct state edits.
4. **Desktop 1440×810, creative-lead checkout:** 20/20 encounters won, both real bosses defeated, 2 genuine intermissions and optional source-bearing research reviewed, score 20, 3 hearts, grade S, end screen and replay reset passed, no JS/network errors.
5. **Mobile 390×760, combined art checkout:** 20/20 encounters won with **Marathon explicitly enabled**. First intermission's research reader prevented advance until manual Continue; the second break auto-advanced after its celebration. Final score 20, 3 hearts, grade S, victory and replay reset passed.
6. **Portrait 650×800, combined art checkout:** 20/20 encounters won after intentionally failing each boss once, confirming both boss retries cost exactly one heart each, reset boss counters, and cannot skip the current encounter. First break pause/resume preserved celebration state. Final score 20, 1 heart, grade B, victory and replay reset passed.
7. **Mobile 390×760, seed 2, touch enabled:** native Chrome touch start/move/end drag took an actual spam form into the shredder; game acknowledged one shredded form, with a correct win transition. No synthetic model/state mutation.

In addition, full campaigns were captured at portrait/mobile from the PR #51 checkout (both breaks, both bosses, research and ending screenshots). The parallel orchestration call timed out before delivering both exit codes, so those runs are not counted as separately verified green. The *explicitly returned* successful combined-art campaigns above provide independently recorded success.

## Evidence generated locally (not committed)

The scripts generate actual screenshots and JSON, including:
- `qa/office-attack-creative-evidence/{desktop-16x9,portrait-650,mobile-390}-{title,game}.png`
- `qa/office-attack-creative-evidence/touch-shred-mobile.png`
- `qa/office-attack-creative-evidence/creative-qa-results.json`
- `qa/office-attack-creative-evidence/mobile-marathon-campaign/{intermission-1,intermission-2,boss-printer,boss-manager,research-1,micro-final}.png`
- `qa/office-attack-creative-evidence/portrait-retry-campaign/{intermission-1,intermission-2,boss-printer,boss-manager,research-1,micro-final}.png`

These are local, generated evidence artifacts **intentionally excluded from this PR** to comply with exclusive file ownership. The test scripts reproduce them without touching game source. The report includes actual pixel percentages and observed outcome state; do not assume filenames alone are proof of a passed run.

### Reproduction (Windows, Chrome, Playwright, Python Pillow)

```powershell
node qa/office-attack-creative-visual.browser.cjs
$env:OFFICE_ATTACK_SITE_ROOT='C:\path\to\creative-lead-or-integrated-checkout'
node qa/office-attack-creative-visual.browser.cjs
$env:OFFICE_ATTACK_VIEWPORT='390x760'
$env:OFFICE_ATTACK_AUTO_INTERMISSION='1'
$env:OFFICE_ATTACK_AUTO_RESEARCH='1'
node qa/office-attack-creative-campaign.browser.cjs
$env:OFFICE_ATTACK_VIEWPORT='650x800'
$env:OFFICE_ATTACK_BOSS_RETRY='1'
$env:OFFICE_ATTACK_AUTO_INTERMISSION='0'
$env:OFFICE_ATTACK_AUTO_RESEARCH='0'
node qa/office-attack-creative-campaign.browser.cjs
```

The fast visual test returns **exit 1 if it reproduces defects** (expected on current unmerged integration), 0 when all gates pass, and 2 for fatal infrastructure errors. The campaign runner returns 0 only after real success, ending bounds and replay checks. To run both scripts and all sizes together, set `OFFICE_ATTACK_CREATIVE_FULLRUN=1` on the visual script; screenshot outputs are kept separate per viewport. Both scripts use the existing `NightShiftV3-Lead-tools/node_modules/playwright-core` fallback if Playwright is not installed in the checkout.

## Integration decisions and residual gates

- **P0 visual:** Merge or reconcile creative-lead PR #51 to eliminate dark bars and move HUD/timer out of the play scene; current integration is visibly deficient on portrait/mobile.
- **P0 art:** Integrate the tested ART implementation that removes the HD atlas and mixed icon PNGs. Local Art+Lead passed, but the actual PR commit still needs review.
- **P0 gameplay:** The current tested queue uses **six** microgame mechanics repeated across three speed tiers. The locked creative target is **8–10 mechanically distinct** games; integrate LANE B implementation and extend the campaign solver's action handlers for added IDs before final signoff. The current campaign runner intentionally fails rather than faking a win on unknown games.
- **P1 boss polish:** LANE C changes need their own integration regression after merge. The existing bosses passed win/lose/retry/timeouts in the 20-round scenarios above; art/animation aesthetics require final human review.
- **P1 final human review:** Inspect fresh integrated screenshots at actual device resolution for one-second legibility, art harmony, contrast, scene composition and joke timing. Automated pixel checks cannot certify that something is fun or visually original.

No claims about Canvas submission, deployment, or completed creative production. This is an independent, reproducible quality gate.
