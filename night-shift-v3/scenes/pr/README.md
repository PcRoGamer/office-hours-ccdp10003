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
