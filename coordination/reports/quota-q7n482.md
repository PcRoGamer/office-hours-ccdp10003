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


## Continuation: save-state recovery, provenance and screenshot state (8 Nov 2026)

A resumed game may pass existing `quotaBonusPacketOutcomes`, `quotaBoltsRemoved` and `quotaPressure` on `context.run`. The boss now hydrates existing packet outcomes, resumes the correct remaining counter phase, skips already resolved optional choices and refuses input after completion. Previously, reconstructing phase I with an already committed packet could re-offer a spent packet or strand a player in a missing bonus state. These paths are now independently regression-tested.

Events now include a unique deterministic `id` based on the run/encounter/event/object, plus `runId`, `encounterId`, `attemptId`, `committed:false` and immutable per-action evidence. **SYSTEMS still owns idempotent commits**; this scene never directly updates shared corporate or people scores. Restored bonus points in `snapshot()` are derived from committed bonus outcomes, not newly emitted credits. The host must validate restore snapshots and ledger IDs across reload and tampering boundaries.

The renderer now exposes an on-screen drag trajectory, pressurised face deformation and background details. Centered header typography was reduced and the phase label shifted upward after inspecting the 650×800 screenshot.

Re-verified in local checkout:
- `node qa/v3-quota.test.mjs`: **15/15 PASS**, including restored phase I and phase III, restored three-bolt CLOCK OUT, stable event IDs and old 0–4-filed full boss routes.
- `python qa/v3-quota.e2e.py`: Chromium mouse-driven mixed FILE/COOL/FILE/COOL full boss, **3 bolts, 4 uniquely resolved packets, exactly +10 Corporate, pressure 0, one boss-complete, zero uncaught JS exceptions**.
- `python qa/v3-quota.browser.py`: actual Chromium 1080p, 3440×1440 ultrawide, 650×800 narrow and DPR2 3840×2160 canvas captures. Each screenshot is taken after the actual `bonus` state starts, instead of a brittle fixed wait. All **4/4** correctly show bonus state and **0** page exceptions.

The browser scripts use in-memory injection of the same exact ES module text because ordinary local URL navigation is restricted here. No ordinary HTTP production-path verification was claimed. The HTML preview remains an actual runnable native ES module entry point. Full HD visual side-by-side acceptance, shared Planck contact physics, AUDIO music, SYSTEMS ledger integration and first-time human playtime remain outstanding release gates. Do not merge this draft as release-ready based on smoke tests alone.

Latest relevant commits: `a281b8f5c94e2e57ccaa8b156e1c26b0cf7831f5` (game logic and visuals), `9e4cc2cb7a41a0fd46bd3560782f1bcfd2f0949c` (recovery tests), `04f2665e325327a2f6cf1e98b7974f12999c3d3a` (portable synchronized browser captures).

## Second visual iteration: document travel and hit effects

Latest code: `0d817d6fc5bdbc65727e6184ee09adbf5cf0ad95`. FILE packets now visibly arc into the corporate engine; COOL packets travel to coolant pipes and generate a brief illustrated vapor reaction. Successful gear strikes animate the counter packet, gear shock ring and bolt-fragment spray. All added effects are bounded to 12 packet animations and 14 impact fragments and do not alter score accounting, pressure arithmetic, collision legitimacy or event uniqueness.

**Real screenshot**: `qa/v3-quota-evidence/quota-e2e-bonus-flight.png` (generated by updated `qa/v3-quota.e2e.py`, not committed PNG). Inspected the 1920×1080 browser frame with visible in-flight paper, approved stamp, warning zone and pressure-swollen cheeks.

**Test refinement**: At phase III the hazard alternates with a deterministic 4.1-second period; a real mouse gesture straddling the 1.05s danger boundary may correctly fail. QA now probes ten independent *actual safe windows* and attempts normal mouse gestures until a valid route succeeds, rather than falsely treating a transient timing miss as an engine regression. The Playwright test still requires and verifies real pointer interaction and no synthetic completion.

**Retest**: 15/15 Node groups PASS, Chromium complete encounter FILE/COOL/FILE/COOL PASS (3 bolts, 4 unique choices, +10, pressure 0, single victory, no JS exceptions). Chromium viewport states at 1080p, ultrawide, narrow and DPR2 passed in the previous run after the recovery patch. The HD comparison PNG stored by PHYSICS was discovered but its binary contents are inaccessible through the current connected GitHub reader; no claim of side-by-side HD acceptance is made.
