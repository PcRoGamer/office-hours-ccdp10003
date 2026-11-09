# QA_VISUAL: Boss phase capture and evidence integrity, 8 Nov 2026

**Lane:** QA_VISUAL. **PR:** https://github.com/PcRoGamer/office-hours-ccdp10003/pull/15

## Contribution

New `qa/v3-visual-boss-phases.py` addresses a real gate weakness: title/poster screenshots cannot prove a mechanically authored three-phase fight. This helper executes both boss owners' existing *real-pointer* Playwright tests in isolated temporary checkouts and indexes the resulting captured phase screenshots into the existing visual comparison gallery.

Inputs:
- `agents/v3-printer-r8c2:qa/v3-printer-browser.py`: actual click/drags through three telegraph, jam, counter and bolt cycles with failure recovery, varied directives and real 1080p/portrait/4K/ultrawide captures.
- `agents/v3-quota-q7n482:qa/v3-quota.browser.py` and `qa/v3-quota.e2e.py`: actual FILE/COOL bonus choices, fake ad removal, phase-specific latch, final physical CLOCK OUT, receipt-stage screenshot.

**No bypasses:** scripts must return success and produce newly modified PNG files; previously committed source screenshot assets are explicitly skipped. Each script's exit code and full stdout/stderr are kept as a `.log` file. Every image is PNG-signature checked, assigned source commit SHA and SHA256, and copied into `qa-artifacts/v3-visual/branch-matrix` for per-scene viewing. A failing boss scenario marks the aggregate QA result as failed.

**No shared file writes:** automatic clones live under a private temporary directory. Even when `--source lane=/path` is supplied, the source directory is copied before executing author scripts, because their screenshot tests write artifacts. If a script requires `/usr/bin/chromium` but Playwright installed it elsewhere, the helper generates a disposable copy of the script, adjusting only its browser-executable path. Gameplay code is never changed by the harness.

## Actually executed

- `python -m py_compile qa/v3-visual-boss-phases.py`: PASS.
- `python qa/v3-visual-boss-phases.py --selftest`: **BOSS_PHASE_IMPORTER_SELFTEST_PASS**. Created one new PNG in a temporary mock author test run, rejected one pre-existing PNG as stale evidence, recorded test exit code and verified no user checkout edits. This is clearly labelled a synthetic *pipeline fixture*, not a screenshot of gameplay.
- Read real original boss owner scripts and their branch previews through GitHub, including phases, pointer interaction and source ownership.
- **Not yet executed on actual boss branches** in this sandbox: remote git DNS access is unavailable. No boss-phase visual pass is claimed; the runnable test action is the delivered code, to execute on network-enabled CI or a workstation.

## Run

```bash
python -m pip install playwright
python -m playwright install chromium
python qa/v3-visual-branch-matrix.py --lane all
python qa/v3-visual-boss-phases.py --lane all
python -m http.server 4173
# Open previews/v3-visual-branch-matrix.html to inspect phase images.
```

Outputs all source-labelled PNGs, complete test logs and `report.json`. A browser gate is not a synonym for visual quality: screenshots still need real side-by-side scrutiny against HD, motion/music review, and owner fixes before approving either boss.

No legacy releases, integration branch game files or other agents' owned assets changed. This lane contributes actual executable quality gate infrastructure rather than weakening the 16-card/full-v3 target.