# DELIVERY finalization, 9 November 2026 AEDT

**Branch:** agents/wrap-delivery-1109-g6. **Target:** rebuild/night-shift-v3-hd. **Protected recovery worktree:** untouched.

## Delivered
- qa/v3-wrap-release.cjs: real HTTP plus Chrome smoke, 12 unique first-run cards, first authored I1, pause/resume, viewport, missing assets, JS exceptions, screenshots and JSON record.
- .github/workflows/night-shift-v3-wrap.yml: CI and manual GitHub Pages publication only following verified local/staged browser gates; overlays only the full v3 route and assets onto current main site and byte-verifies main HD and index; rollback restores current main site.

## Executed
- From independent copy of agents/v3-package-mirror-1109: node qa/v3-lead-director.mjs EXIT 0. Simulated contract proves 12 mock card encounters, two mock boss completions, five promotions, unique ledger and pause. Does NOT prove real boss pointer actions.
- RELEASE_FAST=1 node qa/v3-wrap-release.cjs EXIT 0 on actual Chrome 1920x1080: full v3 twelve-card first run, first card I1, pause/resume working, zero JS errors and HTTP failures. Inspected actual title and first-action screenshots. Pixel inspection shows artwork and objectives visible; this does not establish human enjoyment or HD visual superiority.
- node --check qa/v3-wrap-release.cjs EXIT 0. Python PyYAML workflow parse succeeded.
- Multi-layout and portrait-only Windows runs, and earlier LEAD browser integration script, hit 59-60 second host timeouts. These are NOT passes and must be investigated on CI or an uncrowded host.
- Actual public HTTPS check: existing arcade-office-hd.html HTTP 200; new night-shift-v3.html HTTP 404. The v3 URL is NOT deployed or submission-ready.

## Integrate
1. Merge this focused PR into rebuild/night-shift-v3-hd, then integrate package branch agents/v3-package-mirror-1109. Do not edit existing HD/main.
2. Run release CI on integrated SHA; require four viewports, GAME_QA complete campaign, score/ending and course gates. Node: node qa/v3-wrap-release.cjs. For targeted run set RELEASE_LAYOUTS=650x800, or RELEASE_FAST=1.
3. Only after green checks and release approval, manually run night-shift-v3-wrap.yml with mode=publish, candidate_ref=rebuild/night-shift-v3-hd. Workflow builds full main static site, overlays only verified v3, verifies unchanged HD/index bytes, tests staged site, deploys and probes URLs.
4. Rollback: dispatch mode=rollback to restore main site. Never submit to Canvas until hosted URL and actual submission receipt are independently verified.

**Candidate URL (currently 404):** https://pcrogamer.github.io/office-hours-ccdp10003/night-shift-v3.html

**Risks:** GitHub Pages source may need configuration for Actions; workflow hasn't run in GitHub CI yet. Existing HTML release fallback is fully preserved.
