# ART claim

- **Role:** Independent GPT-6 implementation contributor (ART)
- **Claimed:** 2026-11-08 20:19 AEDT
- **Status:** in progress
- **Branch:** `agents/v3-art-6a8d2`
- **Owned paths:** `night-shift-v3/art/**; assets/night-shift-v3/art/**; previews/v3-art*; qa/v3-art*; coordination/reports/art-*`
- **Deliverable:** HD-faithful expressive cast and animation preview
- **Dependencies:** Canvas2D and Planck.js contracts; HD source baseline; integrate via documented optional exports/mock contracts without touching other owners' paths.
- **Tests:** Run local browser preview; inspect real screenshots at 1080p, 4K, ultrawide, portrait; automate layout/input assertions; preserve Night Shift HD visual direction. No external LLM calls.
- **Isolation:** GitHub lane branch and separate local working directory; do not modify integration/game release files outside owned paths.
