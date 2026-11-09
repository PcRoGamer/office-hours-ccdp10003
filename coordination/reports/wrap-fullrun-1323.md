# FULL_RUN_QA_1323 | physically exercised 12-card scored Chrome campaign

**Date:** 9 November 2026 AEDT. **Owned source:** `qa/v3-wrap-fullrun-1323.browser.cjs`. **Isolated Windows test checkout:** `C:\Users\Admin\NightShiftV3-Fullrun-1323`. **GitHub source under test:** `agents/v3-lead-systems-bridge-1109` at `60d6584`. This report does not claim public release, Canvas submission, or any change to protected worktrees.

## Independently reproduced RELEASE-BLOCKING defect

Without a runtime patch, a genuine real-pointer Chrome test completes 12 cards, five promotions, both bosses, and a verified SYSTEMS victory, but the two-sided receipt fails to appear:

```
FULLRUN_1323_SCORE_DIAGNOSTIC {"mode":"victory","verifiedScoreReady":true,"scoreIssue":null,"diag":{"hostHidden":true,"childCount":0,"display":"none","screenReader":"The machine was defeated, but its scoring evidence was incomplete."},"errors":["Final score blocked by invalid player evidence: ReferenceError: reduceMotion is not defined at syncUi (.../night-shift-v3/app.js:246:28)"]}
locator.waitFor: Timeout 4000ms exceeded
#score-receipt .ns-receipt
```

**Pinpointed one-line change for PACKAGE/LEAD (not applied to their branch by this agent):**

```diff
--- a/night-shift-v3/app.js
+++ b/night-shift-v3/app.js
@@
         receiptHandle=presentVerifiedClockout({host:ui.receipt,runSnapshot,audio,
-          onReplay:runStart,reduceMotion});
+          onReplay:runStart,reduceMotion:reducedMotion});
```

The browser declares `const reducedMotion=matchMedia(...).matches` (with trailing `d`), but mistakenly passes undeclared `reduceMotion`. This is a JavaScript ReferenceError **before** receipt construction, not ledger mismatch. This exact one-line change was applied **only to an isolated disposable test copy**, and verified in actual Chrome.

## Delivered improvements in QA-owned path

The test is a complete real Playwright pointer campaign based on the lead's current physical scene paths, extended to (a) wait for a genuinely safe QUOTA phase-3 4.1s sweep and attempt manual drags without synthetic events, (b) record and assert visible receipt DOM, (c) tap the **Flip Receipt** button and assert both official and people sides, (d) reveal component breakdown, (e) tap **Replay Shift** and assert new I1, changed deck, zero inherited committed evidence, no inherited victory. It fails conspicuously when the receipt cannot mount. No lead-owned gameplay source is in this PR.

## Actual commands and test outcomes

Executed in the disposable Windows checkout, Google Chrome headless, Playwright Core installed at `C:\Users\Admin\NightShiftV3-Lead-tools\node_modules\playwright-core`:

| Command | Actual result |
| --- | --- |
| `node qa/v3-lead-bridge-model.test.mjs` | PASS, fixtures for seeds 1, 73, 1031, scores 94/61; *model-only* |
| `node qa/v3-wrap-score.test.mjs` | PASS 7/7, including 16 packet combinations, $80 conservation, mutation failures and clean-action credit |
| `node qa/v3-lead-real-score-bridge.browser.cjs` | PASS, five manual approved-stamp hits into genuine SYSTEMS I1, zero browser errors |
| `node qa/v3-lead-scored-full.browser.cjs` on **unpatched** 60d6584 | FAIL after reaching victory: receipt `ReferenceError: reduceMotion is not defined`; test cannot honestly pass |
| `node qa/v3-wrap-fullrun-1323.browser.cjs` on unpatched 60d6584 | FAIL, same error; diagnostic recorded host hidden and zero children |
| `node qa/v3-wrap-fullrun-1323.browser.cjs` after the **isolated one-line patch** | **PASS**: twelve committed cards `I1,I2,I3,S1,S2,S3,P1,P2,P4,T1,T4,T3`; five promotion selections; full Printer Mutiny 3 cycles; full QUOTA 3 counters and four FILE/COOL outcomes; physical CLOCK OUT; victory; 83/100 Official Quota; 61/100 People & Quality; detail breakdown; receipt replay; new I1 with different deck and 0 evidence; 0 console/page errors |

An earlier diagnostic run intermittently failed the original **test driver's** overly short third-phase routing loop. Replaced it with a bounded clock-aware safe-window loop; the final run used **one physical safe drag** and advanced correctly. This is a QA harness repair, not a gameplay modification.

## Original captured Chrome images committed alongside this report

- [Actual 1920x1080 official receipt](wrap-fullrun-1323-evidence/1080p-real-full-campaign-ending.png)
- [Actual 1920x1080 people receipt after physical flip](wrap-fullrun-1323-evidence/1080p-real-people-score-1323.png)
- [Actual physical QUOTA third bolt state](wrap-fullrun-1323-evidence/1080p-real-quota-bolt-3.png)

## Precise integration order

1. PACKAGE/LEAD applies the **one-line** `reducedMotion` identifier correction to the lead-owned `night-shift-v3/app.js` and merges the live scoring bridge into integration.
2. Merge this QA-only PR, then run `node qa/v3-wrap-fullrun-1323.browser.cjs` against the actual assembled branch. The script intentionally remains RED on an unpatched scoring integration.
3. Separately finish public link, viewport/audio comparison, and 16-card seeded campaign/retries. This report proves one 12-card run and replay, **not** independent human fun, published URL or all release gates.

No edits to main, Night Shift HD, protected Windows recovery worktrees or Canvas.
