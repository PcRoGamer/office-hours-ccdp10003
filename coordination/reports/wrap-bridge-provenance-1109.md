# BRIDGE_QA | Provenance/expiry/retry defects, isolated repairs and evidence

**Scope:** `agents/v3-lead-systems-bridge-1109` HEAD `8a3f6fce4a83c4c9b0e3143dbc5162a885e7587a` on 9 Nov 2026. Independent isolated Windows worktree `C:\\Users\\Admin\\NightShiftV3-BridgeQA-1109-b7` (never the protected recovery/lead worktrees). This PR is additive and does **not** edit lead-owned runtime.

## Reproduced failures in the LIVE lead branch

1. **Legitimate QUOTA expiration blocks the verified receipt.** `quota.mjs` emits `quota-bonus-resolved` with `outcome:'expired',synthetic:false` on its eight-and-a-half-second deadline or explicit skip. `runtime/score-bridge.js` only admits `file|cool`, so this real player outcome raises `SCENE_EVIDENCE` and makes `scoreIssue` sticky for the rest of the run. The underlying SYSTEMS model *already supports* `expired` as a zero-point result. Reproduced by invoking the current lead bridge at a live model QUOTA stage. A separate authored-scene test advances `createQuotaBoss().update(.05)` until it produces its genuine expiration event, which the included adapter commits as **0** corporate bonus points.
2. **Boss retry restarts the drawn machine but not SYSTEMS.** In `director.js`, `failAttempt` retains completed counter/packet ledger entries and the current SYSTEMS phase, but `retry()` calls `enterBoss(currentBoss)`. Both real `createPrinterMutiny` and `createQuotaBoss` restart physical counters at zero without the missing rehydration fields in `runInfo`. Test: after a legitimate printer phase-one counter, model remains at phase two on timeout, whereas a recreated printer reports zero bolts removed; our guard rejects this mismatch. Identical QUOTA counter mismatch reproduced.

## Implemented additions

- `night-shift-v3/finalization/bridge/provenance-guards.js`: strict `recordQuotaPacketFromScene` for manual FILE/COOL and authored timeout/skip EXPIRY; refuses synthetic, duplicate, wrong-phase, premature p3:b2, or mislabeled manual actions. Delegates all committed events to real SYSTEMS. `assertBossRetrySafe` verifies live scene counter and QUOTA packet history match the immutable scoring ledger, cancels an in-progress drag and returns the **same** scene for retry.
- `qa/v3-wrap-bridge-provenance-contract.test.mjs`: adversarial executable model test, authored-scene 8.5s timeout and actual phase-two pointer drag to COOL, retry mismatch reproducer using real boss scene constructors, all 12 cards/5 promotions/6 boss counters/4 packet outcomes and final ledger verification.

## Executed tests (Windows, isolated checkout, latest lead 8a3f6fc)

```
node qa/v3-lead-bridge-model.test.mjs
PASS real SYSTEMS + schema fixture 1 94 61
PASS real SYSTEMS + schema fixture 73 94 61
PASS real SYSTEMS + schema fixture 1031 94 61

node qa/v3-wrap-bridge-provenance-contract.test.mjs
REPRODUCED: current lead bridge incorrectly rejects expired bonus
PASS: 12 real SYSTEMS card credits, 5 promotions, 6 boss counters, 4 unique packet outcomes
PASS: timeout gives zero points; forged/duplicate/early packets fail closed
PASS: boss retry guard preserves committed counter and packet provenance
PASS: verified immutable dual-score ledger 85 85

node qa/v3-lead-real-score-bridge.browser.cjs
RESULT {"pass":true,"clicks":5,"scoreIssue":null,"mode":"card","credited":["I1"],"errors":[]}
```

Browser: real Chrome 1920×1080, actual five pointer stamps, 8.407 s to I2. **This is an I1 smoke test, not a complete Chrome campaign**. QA contract uses the actual SYSTEMS model and authored QUOTA scene, but not a full pointer-driven boss victory.

## Minimal lead integration (lead-owned files ONLY, lead should apply after review)

1. In `night-shift-v3/runtime/score-bridge.js`, add
```js
import {recordQuotaPacketFromScene} from '../finalization/bridge/provenance-guards.js';
```
Then replace the entire `if(id==='quota'&&e.type==='quota-bonus-resolved'){...}` block with:
```js
if(id==='quota'&&e.type==='quota-bonus-resolved')recordQuotaPacketFromScene(run,e);
```
No weakening of real FILE/COOL provenance. The engine will record `expired` with zero filed points.
2. In `night-shift-v3/runtime/director.js`, add
```js
import {assertBossRetrySafe} from '../finalization/bridge/provenance-guards.js';
```
Replace only the existing `if(currentBoss)enterBoss(currentBoss);else enterCard();` inside `retry()` with:
```js
if(currentBoss){
  if(scoreRun&&!scoreIssue)try{
    assertBossRetrySafe({run:scoreRun,scene,bossId:currentBoss});
  }catch(e){scoreProblem(e);return false;}
  result=null;delay=0;elapsed=0;attempt++;mode=currentBoss;
  emit({type:'boss-retry-resumed',id:currentBoss,attempt});
}else enterCard();
```
This preserves previously completed physical boss phases and packet outcomes. Do **not** recreate the machine during a retry. Do not call `run.recordBossAction` or fabricate counters during recovery.

## Acceptance / boundaries

- Only additive QA files and independent bridge helper committed here. Lead must apply the two tiny wiring edits before the playable build uses the fix, then rerun the full real Chrome campaign including timeout-at-phase-two recovery.
- No HD/main/worktree changes, no Canvas submission, no public release assertion.
- Baseline source-unit and real I1 browser tests pass. Before lead wiring, the current game still has both reproduced defects; **do not call this a full release pass**.


## Additional verified PR action provenance failure (third defect)

The lead bridge currently maps each `card-action` event to `id + objectId/kind + (++sequence)`. The arbitrary increment means the *same* physical source event repeated twice becomes two separately credited SYSTEMS actions. `captured` also resets only on a changed card ID, not on `run.attemptId`: after a failed PR attempt, the new model attempt is empty but the bridge retains prior successes and can claim the card is complete prematurely, whereupon SYSTEMS correctly rejects it and the receipt becomes unavailable.

Reproduction in `qa/v3-wrap-bridge-provenance-contract.test.mjs`:
- Start authentic 12-card SYSTEMS roster and advance to P1.
- Repeat identical `card-action(kind:'correct-chart-axis')` once; current lead `bridge.count === 2`, even though only one physical source object was identified.
- Call `run.failAttempt`, then one physical action on the new attempt: `bridge.count === 3`, but the new model attempt contains only one action. Current `bridge.commit('P1',{},'success')` fails `insufficient real actions for P1: 1/2`.
- New `identifyPrAction` gives stable identity keyed to P2's unique overlay object, P3's distinct alignment mark, P4's route or one-shot kind. Same event reproduces same key, new real object gives a different key; synthetic events are rejected.

**Minimal additional lead-owned bridge wiring:**
```js
import {identifyPrAction} from '../finalization/bridge/provenance-guards.js';
// In createSceneScoreBridge:
let current='',captured=0,sequence=0,lastAttempt='';
function reset(id){
  const active=run.attemptId;
  if(id!==current||active!==lastAttempt){
    current=id;captured=0;sequence=0;lastAttempt=active;
  }
}
// In the id[0]==='P' card-action observe branch, retain e.correct validation,
// but replace the sequence-suffixed action id with a stable source identity:
action(identifyPrAction(e,id),e.correct?'correct':'wrong');
```
Because the lead's unit fixture currently emits two `kind:'manual-verified'` events with no distinct object IDs, modify that **fixture only** to add `objectId:'fixture-'+j` to each authored correct action. The *real* PR scenes have distinct kinds, overlay IDs or alignment marks. Rerun the fixture and new regression test after wiring. Do not let a test's invented sequence numbers define what constitutes a physical action.

**Updated local test result (lead 8a3f6fc):** PASS plus `REPRODUCED: duplicate PR event credit and stale retry counter`. Three actual scoring bugs remain unresolved in the playable lead-owned code until wiring lands.
