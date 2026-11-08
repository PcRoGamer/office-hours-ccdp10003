# RENDER claim

- **Role:** GPT-6 parallel contributor (RENDER)
- **Claim time:** 2026-11-08 20:18 AEDT (Melbourne)
- **Branch:** `agents/v3-render-gpt6-1108-2018`
- **Status:** claimed/in progress
- **Owned paths:** night-shift-v3/runtime/{viewport,input,hud,renderer}.js; night-shift-v3/styles/**; previews/v3-render*; qa/v3-render*; coordination/reports/render-*
- **Deliverable:** Implement tested playable RENDER workstream on top of Night Shift HD, preserving GDD v3 scope and no-margin viewport, with self-contained preview if integration pending.
- **Dependencies:** HD baseline, design/NIGHT_SHIFT_GDD_V3.md, TECHNICAL_INTEGRATION_CONTRACT.md and VISUAL_AUDIO_RELEASE_GATES.md; other lanes via agreed exports only.
- **Tests:** Playwright/browser render with screenshots at 1080p, 4K and narrow; syntax/smoke tests and comparison to HD. Record actual results and gaps in PR.
- **Coordination:** No shared files modified. Create draft PR into `rebuild/night-shift-v3-hd`.
