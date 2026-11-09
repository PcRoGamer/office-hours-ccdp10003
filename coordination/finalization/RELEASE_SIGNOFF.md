# QUOTA PANIC: NIGHT SHIFT v3 | Playable demo release sign-off
**Date:** Monday 9 November 2026, AEDT. **State:** PUBLIC PLAYABLE CANDIDATE VERIFIED. **Academic Canvas submission:** NOT performed; no receipt claimed.

## Public routes
- **V3 playable:** https://pcrogamer.github.io/office-hours-ccdp10003/night-shift-v3.html — HTTP 200 and public Chrome checked.
- **HD fallback:** https://pcrogamer.github.io/office-hours-ccdp10003/arcade-office-hd.html — HTTP 200, unchanged by protected staging checks.
- V3 module: https://pcrogamer.github.io/office-hours-ccdp10003/night-shift-v3/app.js — HTTP 200.
- Public v3 HTML SHA-256: aaf545b4e1da0a08701b4945f2168924b9353272777591a121eb5718637ecf56.
- Public HD HTML SHA-256: be168435f0cd0768e88fb77f5cb9697d885e5b1ffc5f8b7e673a1d5fcb16b4ad.
- Protected publish workflow: https://github.com/PcRoGamer/office-hours-ccdp10003/actions/runs/42553924624 (gate success; release success). Stages main as-is and adds only the verified v3 route/assets, comparing index and HD files byte-for-byte. Manual rollback mode exists.

## Real acceptance evidence
- Fresh isolated Windows Chrome test exercised **12 genuine pointer-controlled microgames**, all **5 promotions**, Printer Mutiny's **3 physical counters**, THE QUOTA's **3 phases and 4 FILE/COOL decisions**, and **physical CLOCK OUT**. Reached victory with **14 distinct committed encounter credits**, **zero JS errors**, scoreIssue null and verifiedScoreReady true; rendered a frozen verified animated Official QUOTA receipt displaying **83/100** for this seeded run. Test: node qa/v3-lead-scored-full.browser.cjs against the reconciled source.
- Correct failure/retry behavior was RED in GAME_QA before PR #35, PASS after production fix; no skipped retry or ghost card credit.
- Real Chrome I1 test: five distinct approved manual stamps, one genuinely committed credit, no SYSTEMS score issue.
- Node: strict bridge model three seeds PASS, SCORE 7/7 real SYSTEMS tests PASS (256 seeded model runs and adversarial mutations), GAME 8/8 groups PASS (4096 seeded rosters).
- **Public URL** Chrome release gate PASS on **1920x1080**, **1366x768**, **650x800 portrait**, and **1920x1080 DPR2**: real I1, twelve unique cards, pointer start, frozen pause, zero JS exceptions, zero failed asset responses, no horizontal overflow. Command: RELEASE_PUBLIC_URL=https://pcrogamer.github.io/office-hours-ccdp10003/night-shift-v3.html node qa/v3-wrap-release.cjs.
- Public HTTP checks: v3, v3 app module, and HD fallback all returned 200.

## First Shift GDD demo fit
V3 exceeds the eight-card/four-promotion/one-boss First Shift concept in **authored game content** (16 microgames; 12 per run), **promotions** (5), and **bosses** (2). The animated promotion includes three selectable upgrade choices and a live research source link. Physical CLOCK OUT yields a verified corporate-versus-people thermal receipt. These are implementation observations, not teacher grading or controlled subjective human preference testing.

## Remaining distinct actions
1. **Canvas submission not performed.** The student needs to submit the public URL at https://canvas.lms.unimelb.edu.au/courses/239834/assignments/658087 by **Monday 9 November 2026, 23:59 AEDT**, then verify the Canvas receipt.
2. Human first-time playtesting and final rubric/creative judgment are still subjective; don't claim audio fidelity or HD preference from bot tests. Optional polish contributions should not destabilize this verified build before submission.
3. Any release follow-up must be independently tested and deliberately republished through the protected Pages workflow, retaining HD and main as fallback.
