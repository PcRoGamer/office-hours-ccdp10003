# QA_VISUAL | independent multi-branch Night Shift v3 screenshot gate

**Source branch:** `agents/v3-qa-visual-1108-7c39`  
**PR:** https://github.com/PcRoGamer/office-hours-ccdp10003/pull/15  
**Target:** `rebuild/night-shift-v3-hd`  
**Status:** Production QA tooling committed and offline-browser selftested. This report is **NOT** a fabricated integrated-v3 visual approval.

## What changed

Previously, visual QA refused to compare without `night-shift-v3.html` on the integration branch. This had become an unnecessary dependency: scene teams have independently runnable previews.

The new `qa/v3-visual-branch-matrix.py` autonomously clones each contributing workstream in an **isolated temporary directory**, launches its actual browser preview and captures all available authored cards/states at 1080p and 650×800, plus first scenes at 1440p, 4K, 4K equivalent DPR2, 3440×1440, 1440×900 and 1024×600. It records the source commit SHA, module source SHA256 when inlining, JS exceptions, network errors, canvas bounds, backing resolution, image contrast/variance, motion probe and PNG screenshot paths. No existing working tree is reset or modified.

**Chromium restriction solved in code:** when `page.goto` is blocked, a source-preserving bundler inlines the *original* branch HTML/CSS/recursive native ES modules via encoded data-module URLs. No generated concept illustration, fabricated game state or sample game code is substituted. The source hashes make the modified module URL transport traceable.

`previews/v3-visual-branch-matrix.html` displays the captured scenes in a responsive, workstream/viewport-filterable comparison gallery with issue-only filtering, source SHA and strict fixture provenance warning. Real artwork must still be visually judged.

## Six live PR branch preview entry points inspected

| Lane | Source branch | Preview / ready source contract |
| --- | --- | --- |
| Intake I1–I4 | `agents/v3-intake-81d47` | `previews/v3-intake.html`; `window.__intakeDebug.startCard(id)` |
| Services S1–S4 | `agents/v3-services-n8-7c42` | `previews/v3-services.html`; `window.__services.load(n)` |
| PR P1–P4 | `agents/v3-pr-g6-1108c` | `previews/v3-pr.html`; `window.__pr.switchTo(id)` |
| Printer Mutiny | `agents/v3-printer-r8c2` | `previews/v3-printer.html`; real start control and `__printerQA()` |
| THE QUOTA | `agents/v3-quota-q7n482` | `previews/v3-quota.html`; `__QUOTA_SCENE()` |
| Story promotions/ending | `agents/v3-story-k7m29` | `previews/v3-story.html`; `__storyPreview` |

These six authored HTML previews and their imported module sources were fetched from **live GitHub branches**, not inferred from planning documents. All the entrypoint files and expected scene exports exist. The Story source exposes its debug probe through `Object.defineProperty` rather than a literal `window.__storyPreview` declaration.

**A real integration/testing bug was fixed:** attempting to capture Story RECEIPT immediately after PROMOTION wrongly clicked the now-hidden launch button and then repeatedly clicked disabled upgrades. The runner now advances through the five actual `data-pick` choices, waits for each authored promotion transition, then verifies the actual receipt is visible.

The STAFF lane branch `agents/v3-staff-copperfox-2021` still had no standalone preview at this check. It will be added once it exists; this is not a decision to reduce the game's sixteen-card scope.

## Tests actually executed

- `python -m py_compile`: PASS for the runner.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium python qa/v3-visual-branch-matrix.py --selftest`: **PASS**, real headless Chromium at 1920×1080 and 650×800. Tested nested ES module (paint.js importing palette.js), an external CSS stylesheet, actual canvas rendering, screenshot PNGs, module SHA256 provenance, zero JS errors, zero geometry failures.
- The self-test **forces the no-navigation fallback even on capable browsers**, so the exact transport workaround is genuinely exercised.
- Browser-tested multi-scene viewer from an equivalent local implementation at 1440×900: two PNG displays, source/fixture labels, viewport filtering, issue-only filter, no page exceptions. Inspected actual reviewer screenshot. The prototype initially had a test assertion that incorrectly expected zero issue cards even though a deliberate motion-warning fixture existed; adjusted assertion to treat warnings correctly and recaptured.
- Earlier in this lane: 12 authentic existing HD vs historical First Shift browser PNGs inspected and imported; HD portrait title quantified at 47.25% uniform outer scanlines.

These tests establish the QA *instrument* works. They do not establish a v3 candidate's visual parity or full campaign. Current container network cannot clone GitHub branches directly; the normal-source branch runner is designed for any networked workstation/CI runner, while its no-navigation browser engine was tested locally.

## Reproducible commands

```bash
python -m pip install playwright
python -m playwright install chromium
# Run all presently authored department/boss/story previews:
python qa/v3-visual-branch-matrix.py --lane all
# Fast pass at 1080p and portrait for six workstreams:
python qa/v3-visual-branch-matrix.py --lane all --quick
# Or pass a pre-existing isolated checkout, requiring no git network:
python qa/v3-visual-branch-matrix.py --lane services --source services=/absolute/path/to/services/repo
# Inspect:
python -m http.server 4173
# Browser: /previews/v3-visual-branch-matrix.html
```

Default actual-source capture output: `qa-artifacts/v3-visual/branch-matrix/report.json` and matching screenshots. Any missing module, incorrect import, JS exception, missing canvas, load failure or clipped world will be included in the report as a failure, never a false PASS.

## GDD acceptance and integration

LEAD can use this to reject lower-quality visual PRs **before** merging them. It must review actual PNGs/animation against the HD baseline and insist on fixes by the owning artists/renderers. This branch does not replace, merge or overwrite any other lane's source. When the integrated full-screen shell arrives, the original HD-vs-v3 capture suite and two-metric game QA remain required. Do not replace HD as released fallback until an integrated full 16-card/12-run campaign, five promotions/directives, two bosses, audio, image quality and complete browser replay actually pass.

**No decision needed from user.**