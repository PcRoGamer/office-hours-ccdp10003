# v3 Public Relations scenes

- `index.js`: `definitions` with P1, P2, P3, P4 in the shared scene API.
- `drawing.js`: original Canvas2D theatre primitives and expressive Finch paper mascot.
- `../../../../previews/v3-pr.html`: independent interactive edge-to-edge preview.
- `../../../../qa/v3-pr.test.mjs`: deterministic Node scene tests.
- `../../../../qa/v3-pr.browser.py`: real Chromium viewport and mouse-input test.

From repository root:

```bash
node --test qa/v3-pr.test.mjs
python -m http.server 4173
# open http://localhost:4173/previews/v3-pr.html
python qa/v3-pr.browser.py
```

Public Relations P1 and P4 are mandatory per v3 GDD; P2 or P3 is drafted by SYSTEMS. P4's one-use `effect` is evidence for SYSTEMS to commit, not a direct mutation. Pass pointer data in world coordinates (`screenToWorld`). Only `card-complete` finalises a card; no scene awards corporate score directly.

Scenarios: baseline 1200→0 stamp, 2 ads plus signed help, 3 moving focus locks, truth-preserving framed route. Optional injected `audio.play` receives `hit`, `miss`, `card-win`, `card-fail`.


## 8 November review repairs

The authoritative Corporate pace/scoring references are **P1 14,000ms; P2 12,000ms; P3 12,000ms; P4 14,000ms**. Each `definitions[].authoredReferenceMs` and emitted completion evidence use those values. The separate `seconds` property remains a longer *playable shutter*, **not** a scoring baseline. This prevents inflated pace points.

P1 SEND now requires a zero axis at the moment of submission, even after a player corrects the chart and drags the baseline back up. The Y-axis tick labels reflect the actual current baseline; bars are centered for better legibility. A correct axis action is not farmable with repeated drags.

Run `node --test qa/v3-pr.test.mjs` for the canonical-contract, axis-reversal, P2 help-recovery and invalid-time-step tests. Run `python qa/v3-pr.regression-browser.py` for the fast 1920×1080 and 650×800 real Chromium/ES-module gameplay checks. The existing `qa/v3-pr.browser.py` remains the full viewport/playthrough suite. Both browser scripts load the **unmodified native ES module graph** via data-URL imports when Chromium administrator policy blocks localhost navigation: this still tests actual exports/imports, not a flattened JS facsimile.

### Physical directive adapter (P4)

`context.run.activeDirective`, `context.run.directive`, `context.effects.activeDirective`, `context.effects.directive` or `context.options.directive` may provide a string ID or an `{id}` object. Without it the original fair standalone card remains unchanged.

With **`moving-goalposts`**, P4's HEADLINE and CONTEXT exits visibly trade places along a continuous 0.7-second rail at 1.6 seconds of unpaused action. The motion freezes during active report dragging. Hit-testing uses the same moving geometry as rendering, and final completion evidence retains the *chosen framing*, not the original left/right position. A synthetic `directive-shift` event is emitted once for animation/audio notification, never for scoring. Both benefits remain valid, with the exact same recorded report facts. Unit tests check simultaneous label/effect/hitbox correctness and drag freeze; real mouse-driven Chromium tests run at 1920×1080 and 650×800.

### First-run Sponsored Workflow and P2 physical cover

When `sponsored-workflow` is active, P1 stages a **signed ASTER IT zero-scale hint** and a visibly labelled **paid cosmetic advert**. Real help must be manually opened for its visual zero-axis guide; the fake can be flung off the graph. The fake tap records a mistake, opening the real tip records a genuine action, and neither automates the baseline or SEND stamp. Desktop and 650×800 preview pointer tests use real Chromium.

P2's thrown hostile overlay can now **physically cross the projector beam during its drag** to become improvised cover. The projectile earns a visible, bounded **+0.8 s shutter extension** (`state.graceSeconds`, max 1.6 s) and emits one `popup-cover` event, not an extra scored action. The real active time `state.time` continues untouched, and completion `authoredReferenceMs` remains 12,000ms. A screenshot defect (the flying ad obscuring its reward text) was fixed by compositing the impact toast over the projectile. Unit tests verify conservation, no double credit and honest clock; native Chromium pointer QA verifies the actual collision at 1920×1080 and 650×800.
