# QA_VISUAL | independent Night Shift HD → v3 visual gate

**Lane:** QA_VISUAL (claimed 2026-11-08 20:21 AEDT)  
**Branch:** `agents/v3-qa-visual-1108-7c39`  
**Integration:** `rebuild/night-shift-v3-hd`  
**State:** Tools implemented; visual acceptance **NOT YET VERIFIED**. No integration-route release authorization.

## Implemented (exact owned paths)

- `qa/v3-visual-audit.cjs`: actual Chromium/Playwright screenshots and viewport geometry diagnostics. Covers 1920×1080, 2560×1440, 3840×2160, Windows 4K-equivalent 1920×1080@DPR2, 3440×1440, 650×800 portrait, 1440×900, and 1024×600.
- `qa/v3-visual-selftest.cjs`: exercises 16 browser fixture viewport combinations (8 HD-labelled + 8 V3-labelled) and the comparison review interface. Fixture labels are unmissable and never treated as real gameplay.
- `previews/v3-visual-review.html`: actual PNG screenshot browser, stage and viewport selectors, HD vs candidate views, interactive split overlay, missing-state warnings, backing-canvas/paint diagnostics and responsive image aspect ratio.

## Actual testing performed and evidence boundaries

The isolated local Chromium environment ran the fixture auditor across **16 viewport combinations**, producing **18 actual rendered fixture images** (8 + 8 titles, 2 candidate action states). Result: **0 page exceptions, 0 screenshot geometry failures**. The browser-rendered reviewer was inspected at **1440×900**, overlay slider exercised at **73%**, with **0 page exceptions**.

The reviewer initially introduced *its own* decorative letterbox spacing around screenshot elements. The viewer was changed to reproduce each capture's true aspect ratio instead; missing-scene overlay images are cleared instead of showing stale comparison frames. The reviewer self-test was rerun **PASS** after that fix.

**Critical provenance boundary:** All these locally captured PNGs depict synthetic fixtures, **NOT** Night Shift HD or the new game. They prove the capture/viewer tooling can execute, not that v3 satisfies any gameplay or aesthetic release gate. The committed GitHub source was also independently syntax-parsed with the connected GitHub tooling. The local test harness is an equivalent implementation of the committed capture logic, not a claimed GitHub CI run of the exact PR SHA.

Prior HD *actual game* CI reference (not a new capture by this agent):
- https://github.com/PcRoGamer/office-hours-ccdp10003/actions/runs/42363190010
- Artifact `nightshift-hd-email-excel-screens`, ID `13570517378`.
- https://pcrogamer.github.io/office-hours-ccdp10003/arcade-office-hd.html

## Real-game browser-blocked status

As checked on 2026-11-08 AEDT, `rebuild/night-shift-v3-hd` does **not** yet contain `night-shift-v3.html`, so no real candidate capture is possible. The authorized Windows workstation is offline and this container's Chromium policy blocks URL navigation (`net::ERR_BLOCKED_BY_ADMINISTRATOR`), including loopback, while allowing `page.setContent` fixture rendering. **No real HD/v3 screenshots are claimed in this PR.** Run the harness in a normal machine/GitHub Actions runner once v3 exists.

## Exact reproducible commands

```bash
npm install --no-save playwright@1.58.2
npx playwright install --with-deps chromium
python3 -m http.server 4173 --bind 127.0.0.1
# In a second terminal:
HD_URL=http://127.0.0.1:4173/arcade-office-hd.html \
V3_URL=http://127.0.0.1:4173/night-shift-v3.html \
node qa/v3-visual-audit.cjs
# Review http://127.0.0.1:4173/previews/v3-visual-review.html
# Or validate capture tooling only:
node qa/v3-visual-selftest.cjs
```

Override `CHROME_BIN` if system Chromium is installed outside the Playwright download. Result PNGs/JSON/Markdown go in `qa-artifacts/v3-visual/`. No existing production files, gameplay implementations, scores, or release URLs are altered.

To capture v3 promotion, both bosses and ending, LEAD/QA_GAME can supply a deterministic test-state driver via `V3_VISUAL_DRIVER`, exporting `async function ({page,scene,viewport})`. The driver must enter *real rendered gameplay states* using a test hook or actual inputs. It must not fabricate render images or claim successful human play.

## GDD/visual review requirements before acceptance

- Title: Finch/Mira/QUOTA silhouettes, expressive typography, dense HD-grade staging and animation.
- I1 first action: big tactile prop, readable error feedback, immediate animation and reachable controls.
- Five promotion intermissions: genuine animated perk affordances, no mandatory exposition, full-bleed staging.
- Printer Mutiny and THE QUOTA: physical damage/counter phases, readable telegraphs, mechanical changes and CLOCK OUT finale.
- HUD, camera, safe regions: zero margins, actual viewport-edge pinned hearts/time, 4K DPR/backing clarity, strong portrait composition.
- Ending: truthful two-metric receipt and physical payoff; replay and full 16-card/12-run GDD scope.

**Source-level risk, to validate visually:** HD uses a `1200×760` design space with `contain` outside the selected landscape ratios, and a ~3.3-megapixel high-DPI backing budget. These are *candidate areas for v3 improvement*, not proof of a v3 regression or measured performance defect.

## Integration/dependencies

1. Merge or cherry-pick only QA_VISUAL's paths into rebuild branch; this PR does not alter others' modules.
2. When the new shell exists, run real HD + v3 capture at matched viewport/DPR, then inspect actual PNG pairs in the viewer for title, action, draft, each boss, receipt and portrait.
3. Log failing criteria and re-run screenshot capture after the responsible lane fixes the underlying art/render mechanics.
4. Do not mark v3 visual gate as green until real, source-labelled screenshot pairs beat HD. This includes music/interaction evidence beyond still screenshots.

**Unresolved:** actual candidate route, deterministic scene-state driver, connected browser runner with URL access, manual qualitative verdict. The working HD route remains the release fallback.
