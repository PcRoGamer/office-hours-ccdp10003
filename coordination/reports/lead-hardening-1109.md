# LEAD | strict score provenance, retries, earned perks, release protection

Date: 2026-11-09 AEDT. Isolated checkout: `C:\Users\Admin\NightShiftV3-Hardening-Lead-1109`.

## Integrated specialist code
- BRIDGE_QA PR #41 merged into this feature branch with original Git history retained: `night-shift-v3/finalization/bridge/provenance-guards.js`, tests and specialist report.
- PERK QA PR #40 merged into this feature branch with original Git history retained: `night-shift-v3/finalization/perks/context-aliases.js`, tests, screenshots and report.
- Lead wiring in `runtime/score-bridge.js`: legitimate authored expired QUOTA choice -> 0 filing credit; PR actions deduplicated by stable original scene gesture, with captured actions reset on new SYSTEMS attempt.
- Lead wiring in `runtime/director.js`: boss retry retains the physically active boss scene after a failed attempt, rejects ledger/scene counter or packet divergence, cancels unfinished pointer.
- Lead wiring in `app.js`: live selected perks get canonical and legacy scene aliases without adding unearned perks. Specialist-authored scenes stay untouched.
- Provenance test changed from deliberate red baseline assertions to real integrated acceptance assertions. The old regression correctly failed after the fix; corrected test passed.
- Protected Pages release workflow now runs the additional adversarial score/provenance and real-scene perk contract tests before publication.

## Executed evidence (not simulated browser victories)
- `node qa/v3-lead-bridge-model.test.mjs`: 3/3 fixture seeds passed.
- `node qa/v3-wrap-bridge-provenance-contract.test.mjs`: PASS integrated QUOTA expiry, PR callback dedupe, attempt reset, 12-card SYSTEMS model, six counters, four packets, frozen ledger 85/85.
- `node --test qa/v3-wrap-perk-1319-real-scenes.test.mjs`: 5/5 PASS real authored Staff/Printer/Quota perk effects.
- `node qa/v3-wrap-game.test.mjs`: 8/8 PASS, 4,096 seeds and all 16 variants reachable (model contract).
- `node qa/v3-wrap-score.test.mjs`: 7/7 PASS ledger tamper/bonus/licences.
- `node qa/v3-wrap-perk-1319-browser.cjs`: PASS real Chrome Staff T2 pointer, baseline crate delta 0, earned Magnet Grip delta 76.15 px, zero page errors.
- `node qa/v3-lead-scored-full.browser.cjs`: PASS authentic 12-card, five-promotion, two-boss physical Chrome campaign, verified Official 83 / People 61, receipt flip, details, replay and zero browser exceptions.
- `node qa/v3-wrap-release.cjs`: PASS 1920x1080, 1366x768, 650x800 and 1920x1080 DPR2, each with pause freeze, no errors or broken assets. HD route SHA unaffected.

## Quality boundary
This integration does not establish that every first-promotion perk has immediate meaningful effects in S1/S2. Specialist PERK QA documented that separate gap. No public deployment or Canvas submission asserted by this report. Night Shift HD and main remain untouched.
