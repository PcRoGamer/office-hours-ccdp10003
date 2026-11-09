# SCORE_ENDING finalization | verified scoring and receipt integration

**Owner:** finalization lane 02 SCORE_ENDING, claimed atomically on `rebuild/night-shift-v3-hd` 9 Nov 2026. **Isolated Windows worktree:** `C:\Users\Admin\NightShiftV3-Wrap-Score-1109`. Protected recovery worktree not modified.

## Product changes
- `night-shift-v3/finalization/scoring/ledger.js`: independently reconstructs both official and People & Quality scores from **committed** SYSTEMS v3 player events. Verifies all 12 unique authored cards and their actual timings; five promotion picks and directives; three physically-countered bolts **per** boss with preceding manual input; four uniquely identified FILE/COOL/EXPIRED outcomes; exactly two separately decided $40 staff licences, conserving $80; P4's actual frame choice; action deduplication; never counts uncommitted or synthetic assist gestures. Validates **every score component** against SYSTEMS' frozen ending snapshot. Returns a deeply frozen read-only slip. Missing/mutated evidence raises a named error rather than fabricating results.
- `night-shift-v3/finalization/scoring/receipt.js`: wraps STORY's existing animated cast, physically completed CLOCK OUT scene and thermal-paper two-sided receipt, but opens **only after** verification. Adds event provenance to the paper and a small targeted portrait legibility correction. Uses STORY's existing art and source citation rather than creating a detached second slideshow.
- `qa/v3-wrap-score.test.mjs`: full logical runs from the **real** `night-shift-v3/systems/engine.js`; intentional mutation/retry and score comparisons. No substitute fixture engine.
- `qa/v3-wrap-score-fixture.html` and `qa/v3-wrap-score.browser.py`: actual Chrome rendering, score flipping, breakdown, replay, viewport overflow, page errors and screenshots. Test label clearly distinguishes a real SYSTEMS + STORY **receipt composition** from full production gameplay.

## Tests actually executed (9 Nov, isolated Windows host)
1. `$env:NIGHTSHIFT_SYSTEMS_ROOT='C:\Users\Admin\NightShiftV3-Lead-Recovery-1108\night-shift-v3\systems'; node --test qa/v3-wrap-score.test.mjs`: **7/7 PASS**, including 256 complete real seeded model runs covering all 16 authored variants, 16 packet masks, four $80 licence splits, uncommitted events, and eight adversarial mutations. Tests do not assert true 12-card pointer play.
2. `python qa/v3-wrap-score.browser.py` with Python Playwright and `C:\Program Files\Google\Chrome\Application\chrome.exe`: **4 viewports PASS** (1920×1080, 1366×768, 650×800, and 1920×1080 DPR2), all zero JS exceptions, zero horizontal document overflow, successful real clicks on flip/details/replay. Resulting tested fixture printed official **89** and People & Quality **76** from the actual engine ledger, not from hardcoded numbers. Eight screen captures at `qa/v3-wrap-score-evidence/`.
3. I visually inspected the actual desktop and 650×800 browser screenshots. The initial portrait image revealed an overly narrow paper next to a tall illustration. I added a **receipt-only** 521–800px CSS override in `receipt.js` to stack a compact illustration over a wider paper. **The corrected 650×800 portrait layout was then rerun in actual Chrome (2026-11-09): PASS.** Re-run command: `$env:NS_SCORE_PORTRAIT_ONLY='1'; python qa/v3-wrap-score.browser.py`. Observed 89 Corporate / 76 People from real SYSTEMS model, 0 horizontal overflow, 0 page errors, working flip/details/replay. Inspected the new frame: wider, centered legible thermal receipt stacked below a compact cast scene; evidence overwritten at `qa/v3-wrap-score-evidence/receipt-650x800-dpr1.png`. The original four-viewport pass preceded the CSS edit; the post-edit rerun specifically verifies the changed 650px case.

## Integration instructions for PACKAGE
1. Merge this PR after the assembled candidate from `agents/v3-package-mirror-1109` is available on the integration branch. All paths owned by SCORE_ENDING are additive; **do not** replace `night-shift-v3/app.js`, the legacy HD route or STORY files.
2. Source the real committed SYSTEMS snapshot (`NightShiftRun.snapshot`) from the production action/gesture pipeline. `runtime/director.js` in the mirror currently records **encounter-complete summaries**, not SYSTEMS' full eventLedger. That is insufficient for verified scoring. PACKAGE needs to instrument real scene action, notice, worker, licence, frame, quota counter and FILE/COOL events into the SYSTEMS state machine, with attempt commitment and retry semantics. **Do not create placeholder action IDs just to satisfy the scorer.**
3. On a genuine user-completed QUOTA physical CLOCK OUT **and** SYSTEMS status `victory`, invoke:
```js
import {presentVerifiedClockout} from './finalization/scoring/receipt.js';
presentVerifiedClockout({
  host: document.querySelector('#score-receipt-host'),
  runSnapshot: systemsRun.snapshot,
  audio,
  onReplay: () => restartActualRun()
});
```
  Use the existing DOM root or create a real top-level host for the receipt. The adapter validates every event and original SYSTEMS score before showing anything. It automatically imports STORY's presentation and CSS. A missing ledger intentionally throws and is a production gate failure, not a valid score.
4. Run the logical, Chrome and production playthrough gates. Only the production route can establish real 12-card pointer gameplay, two bosses, audio, human quality and public URL. This lane claims none of those.
5. Do not overwrite HD/main routes or publish untested candidate. Final Canvas submission requires the actual URL and an independent receipt.

## Falsifiable boundary
These files improve factual scoring, source integrity, receipt legibility and reproducible browser QA. The assembled lead candidate still needs an authoritative SYSTEMS-to-scene action bridge and actual public deployment; the source-only commit itself is not proof of full release readiness.

## Browser-verified narrative correction (post-fix)

Actual visual review of the flipped 650×800 People & Quality receipt exposed a substantive contradiction: a People score of 76 was displaying the corporate `EMPLOYEE OF THE DAY` title derived from the Corporate score of 89, plus a corporate-oriented congratulatory line. The SCORE_ENDING-only adapter now observes STORY's legitimate receipt flip/re-render and replaces that *People-lens-only* prose with audited support, licence allocation and safely handled notice facts, while leaving the official award intact on the corporate side. STORY-owned files remain untouched. The updated Python Chrome QA explicitly asserts `PEOPLE & QUALITY · NOT A COMPANY AWARD`, the grounded `$40 of $80` message, >=4 breakdown rows, preserved event provenance and replay. **PASS on 650×800, DPR1, zero errors/overflow**, and the resulting real frame was visually inspected. The four-viewport matrix was previously green before the portrait CSS adjustment; no unsupported claim of post-edit full matrix retest is made.
