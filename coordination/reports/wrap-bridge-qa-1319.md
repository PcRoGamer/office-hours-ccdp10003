# BRIDGE_QA 1319 | independent scoring provenance / retry regression

**Owner:** independent BRIDGE_QA lane. **Date:** 9 November 2026 AEDT.
**Target integration:** `rebuild/night-shift-v3-hd`. **Lead bridge evaluated:** `agents/v3-lead-systems-bridge-1109` as fetched into the dedicated clone `C:\Users\Admin\NightShiftV3-BridgeQA-1319`.
**Safety:** no changes to `main`, Night Shift HD, PACKAGE-owned files, protected lead worktree or Canvas. No external LLM calls.

## Implemented

- `qa/v3-wrap-bridge-provenance.test.mjs`: independent Node test using **real** `night-shift-v3/systems/engine.js`, the actual lead `score-bridge.js` fetched by Git ref until merged, and `verifyFinalLedger`. Exercises action-level provenance, retries and both real SYSTEMS boss-phase state machines. Its setup advances the real model using schema-valid fixtures, **NOT** browser mouse actions.
- `qa/v3-wrap-bridge-patch-check.mjs`: exact-anchor, fail-on-source-drift *shadow patch*. Writes an ephemeral patched copy under OS temp, executes the same adversarial suite and deletes it. Does not write the production bridge. The tested edit is specified in this script and should be ported by PACKAGE.

## Reproduced bugs (baseline = exact lead bridge, not a rewritten toy)

**Command:** `node --test qa/v3-wrap-bridge-provenance.test.mjs`
**Observed:** exit 1, **1 passed, 5 failed**, 6 tests.

1. **Duplicate PR gesture scores twice:** two `card-action` events with identical authored `kind` produce different synthetic sequence-suffixed object IDs. A purported two-action P1 completes with just one unique gesture. Test reports `Missing expected exception`.
2. **Missing provenance accepted:** two PR events with no explicit `synthetic:false` pass; the current code only excludes exactly `synthetic:true`. Again P1 credits despite ambiguous provenance.
3. **Action count survives failed attempt:** `run.failAttempt()` renews the SYSTEMS attempt ID, but bridge `captured` remains at 2 after one previous and one new action. Expected 1.
4. **Printer retry diverges:** after manual phase-one counter and damage in phase two, a recreated boss scene replays bolt one while the SYSTEMS run has advanced to phase two; the bridge throws `SCENE_EVIDENCE: wrong printer bolt order`.
5. **QUOTA retry diverges:** old manually resolved phase-one packet/bolt are replayed by a restarted scene, while SYSTEMS is on phase two. The bridge rejects the already-committed packet, disallowing legitimate retry.

These are model/bridge correctness defects proven using actual shipped SYSTEMS implementation and lead bridge source, not evidence that any real player's run already hit each path.

## Verified minimal shadow fix

**Command:** `node qa/v3-wrap-bridge-patch-check.mjs`
**Observed:** exit 0, **6 passed, 0 failed**. This script applies six fail-on-drift replacements in a temporary copy of the lead bridge:

- Reset PR action capture/dedupe when **`run.attemptId` changes**, not just card ID.
- Require `synthetic === false` for scored scene observations.
- Use event-derived stable PR identity (`objectId`, else authored `kind` plus `mark` where available), deduplicating equivalent outcomes instead of minting an incrementing ID for every delivered event.
- In printer/QUOTA boss observation, treat evidence for **previously committed phases** as a no-op. Never re-award packet or bolt; keep current/future phase checks strict.
- Reject malformed QUOTA packet identity even during replay.

The shadow implementation completed a true `verifyFinalLedger` for a model run with a QUOTA replay. It is not a rendered Chrome playthrough.

## Unmodified baseline regression

**Command:** `node --test qa/v3-wrap-score.test.mjs qa/v3-wrap-game.test.mjs`
**Observed:** exit 0; 8/8 scoring cases pass and all 8 GAME_QA assertion groups pass. The GAME_QA file itself confirms its director cases use synthetic test scenes. The bridge defects are *not* addressed by those baseline tests.

## Exact PACKAGE integration actions

1. Inspect `qa/v3-wrap-bridge-patch-check.mjs` and port its six anchored replacements into the **lead-owned** `night-shift-v3/runtime/score-bridge.js`, reconciling any newer changes first. The shadow script will error if anchors drift. Do **not** copy a whole older bridge over newer work.
2. After the lead bridge is in integration, run `node --test qa/v3-wrap-bridge-provenance.test.mjs` on the integrated source; require **6/6**. Before integration, fetch the lead branch locally so the test can load the exact bridge ref. Run `node qa/v3-wrap-bridge-patch-check.mjs` for independent 6/6 proof.
3. Re-run LEAD model and actual Chrome full campaign after wiring. Test a human-style failure in printer or QUOTA after at least one already-removed bolt, then retry and verify exactly six committed boss counters and four packet dispositions. Real pointer test still required.
4. Other known high-priority director edge: catch of `scoreBridge.commit` currently logs `scoreIssue` but proceeds to append `encounter-cleared` and ledger entry. This requires PACKAGE-owned fail-closed handling and a dedicated director regression. Also see PR #30 for failed-card `afterClear()` skip. Neither issue was counted as fixed by this patch.

**Status:** QA contribution implemented and tested; production fix remains PACKAGE-owned until merged. No screenshot, audio, public deployment or Canvas submission is claimed.
