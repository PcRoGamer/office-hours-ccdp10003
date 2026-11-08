# COURSE independent evidence | P1/P4 truthful chart and physical player agency

**Date:** 8 November 2026 AEDT  
**Reviewer lane:** COURSE, not PR source owner  
**Source under test:** `agents/v3-pr-g6-1108c` preview `previews/v3-pr.html` / `night-shift-v3/scenes/pr/index.js`  
**Preview test:** Microsoft Edge + Playwright, real mouse input and Canvas2D rendering at 1440×900, 3840×2160, and 650×800.  
**Toolchain:** Node.js v24.20.0 + Playwright 1.58.2, isolated Windows worktrees; no API or external LLM calls.

## What works in REAL browser input

The executable `qa/v3-course-pr-truth.browser.cjs` served the independent Public Relations preview and used actual transformed pointer coordinates (not synthetic `scene.pointerDown` calls).

**48/48 browser checks passed** (16 per viewport):
- World fills viewport edge to edge; camera maps all target points correctly at 1440×900, true 4K and portrait.
- In P1, physical baseline drag corrects 1,200 → **0**, then SEND resolves exactly once. The original figures remain mathematically unchanged: **1,240 → 1,280**, difference **40**, relative increase **40/1240 × 100 = 3.225806...%**.
- In P4, dragging the same document to HEADLINE or CONTEXT physically succeeds at all sizes, with identical real facts. HEADLINE grants a single-use priority pass for the next Staff card. CONTEXT grants a single-use 0.6-second warning for THE QUOTA. Real mock Mira incident remains an observed fact; it is not invented by scoring.
- Nine actual screenshots and machine-readable `qa/v3-course-pr-evidence/results.json` were recorded. 4K and portrait captures are genuine browser frames, not image generation.
- **These are independent component previews, not integrated 12-card release tests or observed human study outcomes.**

## Quality failure a green mechanical test did NOT catch

The actual P1 rendered screenshot at true 4K and 650×800 showed the **"+40 CLICKS / +3.2% / ZERO BASELINE"** mint ribbon covering the top of **QUARTERLY CLICKS** and obscuring both **1,240** and **1,280** number labels. This violates the CCDP requirement for clarity and actively undermines the visual lesson: the exact values should remain visible after chart correction.

The dedicated `qa/v3-course-pr-visual-overlap.browser.cjs` test instruments **real canvas draw calls** to capture text bounds and banner bounds after physical input, then measures their rectangle intersections. Results on the original PR source: **9 occlusions, 3 at each of three screen sizes**.

For a fully reproducible example at 1440×900, the ribbon is logical y=200–237; the title y=178.5–209.5 and number labels y=222.5–245.5, y=214.5–237.5. Therefore a positive area of all three labels is covered. This is an actual visibility failure, not font preference.

## Tested correction with no ownership violation

An isolated **temporary fixture copy outside the Git worktrees** replaced the existing inline success-banner drawing:

```diff
- rr(ctx,g.x+25,g.chart.y-7,g.w-50,37,9,C.mint,C.ink,3);
- tx(ctx,'+40 CLICKS   /   +3.2%   /   ZERO BASELINE',l.cx,g.chart.y+12,l.portrait?13:19,C.ink);
+ const bannerY=g.chart.y+g.chart.h+27;
+ rr(ctx,g.x+25,bannerY,g.w-50,37,9,C.mint,C.ink,3);
+ tx(ctx,'+40 CLICKS   /   +3.2%   /   ZERO BASELINE',l.cx,bannerY+18,l.portrait?13:19,C.ink);
```

**Retest with this exact isolated fix:** **21/21 visual clarity checks PASS** and **48/48 real-pointer P1/P4 checks PASS** across all three viewports. The mint ribbon moves into the existing free gap between the chart-axis handle and SEND. No numbers, title, or existing gameplay controls overlap.

- [Actual portrait before/after capture](https://github.com/PcRoGamer/office-hours-ccdp10003/blob/agents/v3-course-gpt6-b291/qa/v3-course-pr-evidence/p1-portrait-before-left-after-right.jpg) (left: current PR, right: verified isolated repair)
- [Real 4K fixed browser screenshot](https://github.com/PcRoGamer/office-hours-ccdp10003/blob/agents/v3-course-gpt6-b291/qa/v3-course-pr-evidence/p1-fixed-3840x2160.jpg)
- [Original measured occlusion JSON](https://github.com/PcRoGamer/office-hours-ccdp10003/blob/agents/v3-course-gpt6-b291/qa/v3-course-pr-evidence/overlap-before-results.json)
- [After-fix geometry JSON](https://github.com/PcRoGamer/office-hours-ccdp10003/blob/agents/v3-course-gpt6-b291/qa/v3-course-pr-evidence/overlap-after-results.json)

**Change routed to owner:** [Public Relations PR #17](https://github.com/PcRoGamer/office-hours-ccdp10003/pull/17) in an actionable comment. COURSE has not altered another lane's production source.

## Reproduction

```sh
# In the COURSE worktree, with Playwright installed:
node qa/v3-course-pr-truth.browser.cjs --root=/path/to/PR-source-checkout
node qa/v3-course-pr-visual-overlap.browser.cjs --root=/path/to/PR-source-checkout
```

The first test should remain green. The visual gate intentionally fails on the original implementation and passes after the owning PR applies the documented correction. Do not use green pointer tests as a substitute for seeing the game.

**No course grade, integrated game completion or deployment has been claimed.**
