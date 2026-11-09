# Input regression hardening | 9 Nov 2026 AEDT

## Scoped implementation
- `night-shift-v3/finalization/input/pointer-guard.mjs`: additive, non-invasive pointer adapter.
- `qa/v3-wrap-input.test.mjs`: executable regression tests for authored camera transform, second-finger arbitration, pointer cancel, actual window-blur boss pause, disposal and paused/promotion gating.
- `qa/v3-wrap-input.browser.cjs`: real Chromium source-route smoke runner with screenshots for desktop 1920x1080, laptop 1366x768, 650x800 portrait and DPR2.

## Observed tests, no invented passing checks
- Windows Node 24.20.0 `node --test qa/v3-wrap-input.test.mjs`: **5 pass, 0 fail**, both before and after strengthening blur test (final result 5/5, approx. 1041ms).
- Real Chrome smoke `node qa/v3-wrap-input.browser.cjs`: attempted twice on approved Windows host; both tool invocations timed out (60s, then 40s). **Not passed.** Do not infer screenshot availability or page quality. May be Chrome startup, browser launch, or page navigation; command duration alone is insufficient diagnosis. Need inspect `qa/v3-wrap-input-evidence/` before treating any files as proof.
- This adapter is independent and NOT integrated into the PACKAGE app. No claim the full playable campaign has changed.

## Narrow PACKAGE integration contract
In `night-shift-v3/app.js`, import `bindCampaignPointer` from `./finalization/input/pointer-guard.mjs`. Replace the four existing canvas `pointerdown/move/up/cancel` listeners with one binding:
```js
const inputGuard = bindCampaignPointer({
  canvas, getViewport: () => viewport,
  getCamera: () => director.mode === 'card' ? authoredSceneCamera() : null,
  director, onPause: syncUi
});
```
The integration owner must preserve the existing **recover** and **victory/gameover** click-to-retry route separately (the adapter intentionally ignores nonplaying modes). If `director` is replaced during replay, **dispose and rebind** to the new director or pass a stable forwarding wrapper; otherwise stale director pointers result. No direct ledger or game-scoring mutation. This additive change fixes duplicate pointers, lost-capture ghost drags and boss focus-loss pause omission in a controlled way, subject to browser acceptance.

## Next acceptance
Execute `node qa/v3-wrap-input.browser.cjs` in an isolated run without Chrome launch stalls; inspect all eight screenshots and JSON; verify drag/flick/hold against real scenes; then have PACKAGE wire the adapter and run the complete campaign. Existing HD route remains unchanged.

## Follow-up: Chrome completion recovered from Windows evidence
Although host invocations timed out returning the browser process, the **completed** `qa/v3-wrap-input-evidence/results.json` was subsequently read from the isolated worktree. It records all four named viewports **PASS** for HTTP 200, first I1 scene, 12-card deck, correct backing dimensions, and **0** observed page errors: desktop 1920×1080, laptop 1366×768, portrait 650×800, and 1920×1080 DPR2. Real Chrome rendered PNGs exist for title and first card at all four viewport configurations. Two genuine first-card captures and the JSON were pushed at commit `50f6688`:
- [desktop 1920×1080 first card](../../qa/v3-wrap-input-evidence/desktop-first-card.png)
- [portrait 650×800 first card](../../qa/v3-wrap-input-evidence/portrait-first-card.png)
- [machine-readable results](../../qa/v3-wrap-input-evidence/results.json)

**Evidence qualification:** captures are browser-generated, but were not yet inspected visually in this chat; screenshot readability/visual superiority is **not** certified. These checks only prove first-card smoke, not 12-card complete playthrough or integration of the optional adapter. The earlier timeout diagnosis is superseded for the first-card smoke result, not for general full-campaign testing.
