# Night Shift v3: supplemental runtime-edge QA (9 Nov 2026 AEDT)

## Source / isolation
- Baseline: assembled `rebuild/night-shift-v3-hd`, pulled into clean `C:\Users\Admin\NightShiftV3-Wrap-Edge-1309` via a separate clone. Protected recovery worktree untouched.
- Scope: new independent `qa/v3-wrap-edge-1309.browser.cjs` only; no changes to gameplay/HD.
- The six original finalization lanes were already claimed, so `RUNTIME_EDGE_1309` is a supplemental lane.

## Executed, genuine results
1. `node --test qa/v3-wrap-game.test.mjs qa/v3-wrap-score.test.mjs`: **PASS**. GAME QA reported 8 assertion groups, 4,096 replay seeds, all 16 authored variants reachable. SCORE tests **8/8 pass**, including all 16 bonus masks, $80 token conservation, and adversarial mutation rejection. This is logic evidence, not browser end-to-end proof.
2. `node qa/v3-lead-director.mjs`: **PASS**: 12-card/2-boss director harness, 5 promotion slots, 14 committed synthetic-event fixtures, duplicate-event rejection, pause freeze. Its scene harness is synthetic.
3. `node qa/v3-wrap-game.browser.cjs`: **PASS 4/4** real headless Chrome viewports at 1920×1080, 1366×768, 650×800 and DPR2 1920×1080, including responsive canvas sizes, title start, I1 interaction, pause/restart and zero observed JS errors. Existing test writes screenshot evidence locally.
4. New edge suite: `set EDGE_CASE=tiny&& node qa/v3-wrap-edge-1309.browser.cjs` **PASS**, 320×568 touch-enabled Chrome context. `set EDGE_CASE=portrait-dpr2&& node qa/v3-wrap-edge-1309.browser.cjs` **PASS**, 650×800 DPR2 touch-enabled Chrome context. For each: title → clock in → real I1 Canvas2D frame sampled; no document overflow, canvas focused, pause freezes elapsed, audio mode remains stable through two toggles, restart clears evidence and hearts; no logged JS errors/HTTP >=400.
5. Initial edge run **TIMED OUT** when combining all four viewports in one host call. Found and fixed a **test-only** accessible-name locator failure (`/SOUND/` does not match its dynamic aria-label); updated selector to stable `#sound` and confirmed two browser passes. Per-case `EDGE_CASE` filter prevents a single workstation run from exceeding the host execution limit.
6. The 4K and ultrawide edge cases were **not independently certified** in this lane because the UniSync MCP server returned an initialization conflict during a subsequent run. Both remain runnable in the committed test.

## Run each case
```bat
set EDGE_CASE=tiny&& node qa\v3-wrap-edge-1309.browser.cjs
set EDGE_CASE=portrait-dpr2&& node qa\v3-wrap-edge-1309.browser.cjs
set EDGE_CASE=4k&& node qa\v3-wrap-edge-1309.browser.cjs
set EDGE_CASE=ultrawide&& node qa\v3-wrap-edge-1309.browser.cjs
```
Uses Playwright or playwright-core from PATH/NODE_PATH, optional `PLAYWRIGHT_PATH`, with the existing Windows tool location fallback. Browser evidence is written under `qa/v3-wrap-edge-1309-evidence/` and is not automatically treated as a release artifact.

## Integration
- This PR adds one independent regression script and this report. No runtime wiring or merge conflict with PACKAGE required.
- Run test from repo root in a Windows environment with Chrome/Playwright installed. Compare actual screenshot frames against HD separately.
- This does **not** certify 12 real pointer-played microgames, all boss mechanics, visual/audio superiority, public deployment, or Canvas submission. PACKAGE remains responsible for final release gate.
