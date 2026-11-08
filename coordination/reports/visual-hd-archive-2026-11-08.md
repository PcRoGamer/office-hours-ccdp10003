# QA_VISUAL: authentic Night Shift HD browser evidence and verified portrait issues

8 November 2026 (AEDT). Owned by QA_VISUAL only.
Draft PR: https://github.com/PcRoGamer/office-hours-ccdp10003/pull/15

## Source provenance

Recovered and extracted both **real GitHub Actions browser screenshot ZIPs**. Original source PNG bytes retained. These are historical browser captures, NOT generated images, not freshly captured live v3. First Shift is a negative control, NOT the v3 candidate.

- HD run: https://github.com/PcRoGamer/office-hours-ccdp10003/actions/runs/42363190010 ; artifact 13570517378, nightshift-hd-email-excel-screens. Title at 1440px and 650px, action and intermission.
- First Shift run: https://github.com/PcRoGamer/office-hours-ccdp10003/actions/runs/42460980521 ; artifact 13610031303, first-shift-browser-evidence. Title at 1366px/650px, I1 at 1366px/650px, upgrades, printer and ending.

## Quantified baseline issues in original archived PNGs

Pixels measured using the new qa/v3-visual-archive.py (Pillow). Uniform outer bands mean nearly constant horizontal row colors; low-detail rows have RGB spatial standard deviation below 9. These are diagnostic heuristics, NOT artistic quality scores.

| Actual browser frame | Screenshot | Uniform outer scanlines | Low-detail rows in final 38% |
| --- | --- | --- | --- |
| Night Shift HD title 650×800 | 650×800 | **47.25%** (194px top, 184px bottom) | 63.5% |
| First Shift title 650×800 | 650×800 | 4.1% | **92.1%** |
| First Shift I1 650×800 | 650×800 | 4.1% | **100.0%** |
| HD title 1440×900 DPR2 | 2880×1800 | 1.4% | 0% |
| HD intermission 1440×900 DPR2 | 2880×1800 | 15.4% | 32.2% |

**Visible findings from actual screenshot inspection:** HD's portrait title is letterboxed into the middle of a tall screen. First Shift I1's portrait has large inactive lower space; playable props occupy a comparatively small upper stage. Desktop HD's huge cream/coral title, red theatrical paper-machine composition and playful silhouette are clearly stronger than First Shift's beige bordered card and small static characters. HD Aster Mail + workbook intermission has a clear live-office fiction and readable perk cells. None of these observations establishes how new v3 looks.

## New executable QA code and browser tests

- qa/v3-visual-archive.py: reads real GitHub Actions ZIP PNGs, copies 12 original screenshots with source metadata and outputs report.json/report.md and sampled layout metrics. Re-run: python -m pip install Pillow ; python qa/v3-visual-archive.py --hd hd-artifact.zip --donor firstshift-artifact.zip
- qa/v3-visual-archive-selftest.cjs: opens the real archived screenshot report in Chromium, confirms comparison is labelled First Shift donor (NOT v3), tests equal 650x800 title pair and 73% overlay, checks unequal/missing action screenshots cannot be overlaid. Re-run: CHROME_BIN=/usr/bin/chromium node qa/v3-visual-archive-selftest.cjs
- previews/v3-visual-review.html: renders archive or new capture report; handles image pixel provenance, matched-only overlay, dynamic labels, full-height portrait comparison. Original visual reviewer screenshot cropped its title after Playwright scrolled to the slider; fixed with fullPage:true and recaptured.

**Actually executed:** importer read 12 authentic PNGs (5 HD, 7 historic donor). Chromium viewer archive self-test returned REAL_BROWSER_ARCHIVE_VIEWER_PASS [5,7], with zero browser exceptions and correctly disabled unsafe overlay. Existing fixture harness remains independent: 16 viewport fixture runs, 18 fixture PNGs, zero geometry failures. The reviewer screenshot now shows real archived frames and visibly labels NOT V3.

To examine: serve repository directory with python -m http.server 4173 then open previews/v3-visual-review.html?report=../qa-artifacts/v3-visual/real-archive/report.json .

## Next visual release gate

Once LEAD's actual night-shift-v3.html exists, run qa/v3-visual-audit.cjs at matching HD and v3 viewport, DPR, state, and time, inspect actual frames for title/action/draft/printer/quota/ending, correct failures in responsible scene owners, recapture, verify audio and dynamics separately. This real v3 candidate gate is NOT yet satisfied. No release fallback has been changed. No user decision is required.
