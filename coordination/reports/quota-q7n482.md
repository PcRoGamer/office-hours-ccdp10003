# QUOTA lane handoff | 8 November 2026 AEDT

**Claim:** `coordination/claims/QUOTA.md` created atomically at `26f9a53eacf2fa6c6f18b5eb5c1ecee54ad2f52a`.  **Branch:** `agents/v3-quota-q7n482`.  **Target:** `rebuild/night-shift-v3-hd`.  **Ownership:** `night-shift-v3/bosses/quota/**`, `previews/v3-quota*`, `qa/v3-quota*`, `coordination/reports/quota-*`.

## Runnable preview

From repository root: `python -m http.server 4173` then open `http://localhost:4173/previews/v3-quota.html`. Uses native ES module import, no bundler. Mouse or touch drag. The preview has a lane-local test HUD, preview-only muted/unmuted event chirps, five directive selectors, restart/pause controls and a live event/ledger summary. Preview HUD is not authoritative for final integration; RENDER must supply the production HUD and AUDIO the proper score. No external assets are required for this preview.

Integration: `import { definitions, createQuotaBoss, BONUS_IDS } from './night-shift-v3/bosses/quota/quota.mjs'`. `definitions[0]` is `id:'B2'`, `create(context)` returns `enter/update/draw/pointerDown/pointerMove/pointerUp/cancelPointer/snapshot/dispose`, plus optional `activateAssist` / `scan` / `useTimeBank`. Scene's draw targets the provided viewport world dimensions; host owns actual screen/world transform, HUD and paused time. Emit-only events `quota-bonus-resolved`, `boss-phase-complete`, `boss-assist`, `boss-complete`, `time-bank-spent`. **SYSTEMS must commit unique IDs to its immutable ledger; scene does not write final global scores.** Each event has run/phase/attempt metadata and action-provenance flags.

## Exact content present

- Three real counters, not a generic HP bar: (I) wait for stamp rebound and pull jam strip, then throw; (II) distinguish/move spoofed help popup and throw; (III) time safe routing with alternating swept lane, pull final latch, and throw. A manual counter on the short gear opening is required to pop each bolt. An unsuccessful throw returns a packet for a second attempt. Three bolts produce a separate physically dragged `CLOCK OUT` finish and one completion event.
- Exactly four unique optional packet IDs: `quota:p1:b1`, `quota:p2:b1`, `quota:p3:b1`, `quota:p3:b2`. Drag every paper to `FILE +5` (adds true Corporate +5, pressure +1 capped 2) or `COOL` (0 bonus, pressure -1 floor 0, +0.75 s for next valid counter). Skip/timeout is separately recorded as `expired`. Never a bonus fifth packet. These are separate from mandatory counter packets.
- At pressure 2 a prominently telegraphed actual timed gate blocks immediate counters, not just a scarier colour. The gear window remains reachable afterward; Safety Net can deploy a visible protection action. Selected directive changes: DOUBLE ENTRY shows a real manual verification seal, MOVING GOALPOSTS relocates port on visible rail, FAST OR SAFE creates narrow immediate vs wide delayed target, SPONSORED WORKFLOW requires clearing an additional fake interruption, MANDATORY COLLABORATION offers Jules' optional action while solo remains possible.
- Preview paths demonstrate Magnet Grip radius, Bank Shot alternate bumper, Mira assistance, Jules saved licence, Context warning extension, Focus scan, Safety Net gate protection and Time Bank extension hook. Other cross-perk synergies and staff/shop balance remain integration dependencies.

## Tests actually executed

- `node qa/v3-quota.test.mjs`: 11/11 test groups passed, including five full outcome routes for 0/4 through 4/4 filing, all five directives, idempotent bonus ledger, zero perks, missed counter and timer invariants.
- `python qa/v3-quota.e2e.py`: Chromium 1920×1080 native mouse events completed three counters plus four bonus drags plus final CLOCK OUT. In the mixed sequence `[FILE, COOL, FILE, COOL]`, observed 3/3 bolts, 4 unique outcomes, exactly +10 corporate points, pressure 0, one boss-complete, 0 page exceptions. Automation's ~14s pointer-perfect wall/active time is **not** a first-time human playtime claim.
- `python qa/v3-quota.browser.py`: actual Chromium canvas screenshots at 1920×1080 DPR1, 3440×1440 DPR1, 650×800 DPR1 and 1920×1080 DPR2 (3840×2160 canvas backing). Fullscreen canvas exactly matched viewport in every configuration; 0 page errors.
- Playwright in this restricted test environment blocked `http://127.0.0.1` and `file://` navigation (`ERR_BLOCKED_BY_ADMINISTRATOR`); the QA scripts instead use `page.set_content()` plus inline *the same file's exact module text* to exercise Chromium. Preview itself is normal HTTP ES modules for other environments. No public browser URL was claimed.

## Visual inspection / actual defects and revisions

Inspected actual screenshots, not generated art. First narrow build overlapped BONUS headline and an instructional caption with FILE and COOL chutes, making targets harder to scan. Moved instruction below work area, removed duplicate caption, relocated SKIP text, and re-rendered 650×800, confirmed no overlap. Phase II screen additionally showed that the spoof ad did not visually track the pointer; fixed draw to use live drag coordinates and retested. Current screenshots live in local `qa/v3-quota-evidence/` and can be re-generated via the checked-in QA scripts. Screenshot examples: `quota-narrow-bonus.png`, `quota-e2e-ads.png`, `quota-e2e-complete.png`.

## Unresolved and quality decisions

**Not yet the HD artistic acceptance floor:** this standalone procedural robot has dramatic composition and correct real gestures, but HD's character performance and authored audio may exceed it. LEAD/ART/AUDIO should review side by side in their integrated shell. This PR does not claim score composition, final receipt, licensed full soundtrack, actual Planck contact impulses or public Pages QA. Integration should use PHYSICS's Planck.js body/contact adapter for packet trajectories if it improves feel, preserving manual ID semantics; current self-contained preview uses authored pointer/kinematic delivery, not a fake claim of Planck integration. Time Bank and staff/perk inputs require the director's authoritative ledger validation before release. Boss timings are designed for human interaction but only automated pointer-perfect timings were measured, so 75–110s first-human-clear target needs human playtesting.

**Merge/accept only** after running the actual HD side-by-side boss screenshots, completing all director/SYSTEMS ledger integration and audio/physics review, checking a full campaign, and verifying the five required viewport sizes. Keep HD public fallback untouched.
