# Integration integrity contribution, 9 November 2026

## Source inspected
- Current shared `rebuild/night-shift-v3-hd` code: `night-shift-v3/app.js`, `night-shift-v3/runtime/director.js`, `night-shift-v3/runtime/transitions.js`.
- Existing `qa/v3-lead-director.mjs` succeeds only on scripted automatic completion and lacks adversarial timeout/repair tests.
- All six finalization lanes were claimed before this agent joined. This supplemental lane uses unique non-overlapping QA paths.

## Deliverable
`qa/v3-wrap-integrity-director.mjs`: executable director test using all twelve actual ID slots, real `createDirector`, and controlled player-pointer scene doubles. Covers frozen pause, ignored input while paused, timeout's one-heart consequence, safe retry, duplicate success dispatch, five promotions, printer boss timeout/retry, two boss completion events, fourteen unique immutable ledger entries and replay reset.

## Verification truth
- GitHub content write and isolated branch commits confirmed.
- **Not locally executed.** In this session GitHub was available but the connected UniSync workstation host actions were not exposed; isolated container DNS could not resolve github.com, so a repository clone and real Chrome run were unavailable. This is not a passed test claim, and no screenshot/audio verdict exists.
- Existing GitHub release workflow executes `qa/v3-lead-director.mjs`, not this new test. PACKAGE or DELIVERY can wire `node qa/v3-wrap-integrity-director.mjs` into the CI gate after verifying it, without changing protected source here.

## Integration
1. Run `node qa/v3-wrap-integrity-director.mjs` from repository root on Node 22, as with existing director tests.
2. If PASS, add that exact command following the existing director test in `.github/workflows/night-shift-v3-wrap.yml` (DELIVERY-owned).
3. Review any failed assertion as a gameplay defect before release. Keep protected HD route unchanged.
