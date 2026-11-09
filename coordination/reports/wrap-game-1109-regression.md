# GAME_QA follow-up: reproducible failure-path regression

**Date:** 2026-11-09 AEDT. **Target:** `rebuild/night-shift-v3-hd`. **Branch:** `agents/wrap-game-1109-regression-b`.
**Isolation:** `C:\Users\Admin\NightShiftV3-GameQA-Integration-1109`, independent read-only checkout of integration commit `e9ffadc` for production source, with QA-only untracked scripts. Protected recovery worktree untouched.

## Actual executed evidence

| Test | Result | What it means |
|---|---|---|
| `node qa/v3-wrap-game.system.test.mjs` | **PASS 7/7** on local integrated candidate | Committed event model: 16 FILE/COOL patterns, 4 licence allocations, strict $80 conservation, frozen ending, idempotency/failed-attempt exclusion. Test methods are modeled input, **not** physical pointer actions. |
| `node qa/v3-wrap-game-intake.browser.cjs` | **PASS**, real Chrome pointer | Five distinct manually stamped approved documents, I1 completion committed, transition to I2, 3 hearts, 0 JS errors. Robust live-moving-form tracking corrects the older snapshot/click race. |
| `node qa/v3-wrap-game-failure-path.test.mjs` | **FAIL as expected**, deterministic production bug | After `card-failed` emitted inside `scene.update`, director erroneously advances to I2 with 2 hearts and no committed I1 event instead of offering retry. |
| Full inherited pointer campaign | **NOT YET VERIFIED** by GAME_QA on this checkout | Live Chrome gate passed real mouse I1, I2, I3, Services and two Printer Mutiny cycles. Third Printer cycle was active at the host 60-second RPC timeout. Earlier full-script attempts failed in Intake/PR; they are **not** passing evidence. Prior LEAD recovery reports one complete local run, not independently reproduced here. |

## Critical integration fix: one line in PACKAGE-owned runtime

In `night-shift-v3/runtime/director.js`, function `update(dt)`:

```js
clock += dt;
scene?.update?.(dt);
if(!['card','printer','quota'].includes(mode) || result?.outcome==='failed') return;
if(result) {
  delay -= dt;
  if(delay <= 0) afterClear();
  return;
}
```

**Why:** `scene.update` may synchronously emit `card-failed`. `fail()` has already put the director in `recover` mode and set failed result, but without a post-update guard the code immediately calls `afterClear` using the default zero delay. This increments the deck index with no completion credit and skips retry. Production reproducible proof is the failing Node assertion:

```text
Expected: mode === 'recover'
Actual:   mode === 'card', currentCardId === 'I2',
          hearts === 2, evidence === []
```

The exact patch was delivered on [PACKAGE PR #24 conversation](https://github.com/PcRoGamer/office-hours-ccdp10003/pull/24). It is not applied by GAME_QA because exclusive ownership belongs to PACKAGE.

## Merge/release checklist

After PACKAGE fixes the runtime, rerun the deterministic failure regression and expect a green pass, then `qa/v3-wrap-game.test.mjs`, `qa/v3-wrap-game.system.test.mjs`, `qa/v3-wrap-game-intake.browser.cjs`, `qa/v3-wrap-game.browser.cjs`, and the original full physical `qa/v3-lead-first-loop.browser.cjs` in an unrestricted Chrome session. Confirm twelve **committed** cards rather than twelve scene transitions, and three manually removed bolts per boss. Do not call a 60-second partial browser progression a victory.

Screenshot note: the existing portrait browser PNG from GAME_QA is fully painted (650×800); a large, transport-truncated preview incorrectly displayed its bottom half as grey. Source file pixel-band variance and an independently reduced 290px preview verified the screenshot itself is not grey.
