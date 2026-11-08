# SAFETYNET overflow lane | execution and acceptance report

**Updated:** Sunday 8 November 2026 AEDT.  
**Branch:** `agents/v3-safetynet-atlas-1108` (PR [#13](https://github.com/PcRoGamer/office-hours-ccdp10003/pull/13) into `rebuild/night-shift-v3-hd`).  
**Scope:** supplementary non-regression tooling and independent *actual HD browser baseline*, not a duplicate QA_VISUAL or QA_GAME lane.

## Corrected workstation/browser finding

The earlier statement that the Windows workstation was unavailable **was incomplete and is superseded**. Desktop Commander reports offline, but the locally approved **UniSync host bridge is functioning** with persistent read/run/write access. Confirmed PowerShell, Git, Node and Chrome execution on the actual Windows workstation. An isolated worktree was created at `C:\Users\Admin\AppData\Local\Temp\nightshift-v3-safetynet-20261108\work`. No existing/shared checkout or old release was modified.

Chrome was successfully driven using **Chrome DevTools Protocol with Node's built-in WebSocket**, not Playwright's hanging Windows launch. This demonstrates that the actual original HD release can be exercised and captured even when a particular browser automation connector does not launch.

## Delivered

- `tools/v3-safetynet/audit.mjs`: 14 pinned legacy-route hashes checked through Git clean filters (handles Windows autocrlf), canonical v3 structural scope checks, missing modules/card IDs, Pages local references and JavaScript syntax checks.
- `qa/v3-safetynet.test.mjs`: **7 passing Node unit tests**, including a new Windows CRLF regression and modified-source detection test.
- `qa/v3-safetynet-hd-cdp.mjs`: **independently runnable real-browser proof**. Starts installed Chrome/Chromium, navigates to the *unmodified* `arcade-office-hd.html`, computes actual title-button coordinates, dispatches physical browser mouse input through CDP, verifies the scene-start accessibility announcement, and captures title+action frames in two viewport sizes. No LLM calls or artificial gameplay mockups.
- `qa/v3-safetynet-hd-evidence/**`: four actual browser screenshots and machine-readable `hd-browser-results.json` containing viewport, canvas, interaction response and exceptions.
- `qa/v3-safetynet.browser.py` and `previews/v3-safetynet.html`: real Playwright audit-*viewer* tests and an interactive evidence browser.
- `tools/v3-safetynet/README.md`: standalone reproducible commands.

## Executed results

| Check | Actual result |
|---|---|
| Node unit tests, Windows `node --test qa/v3-safetynet.test.mjs` | **7 passed / 0 failed** |
| Windows source audit, integration mode | **15 pass / 0 fail / 25 pending** (unmerged v3 implementation) |
| Windows CRLF cross-platform regression | Corrected source-gate false positive; now all 14 pinned legacy routes pass |
| **Actual HD Chrome CDP startup** | **PASS** at **1440×900** and **650×800** with real pointer clicks |
| HD canvas fits CSS viewport | **PASS** at both sizes (canvas boxes 1440×900 and 650×800) |
| HD title → action accessibility signal | **PASS** in both sizes: `Welcome to Quota Panic! Six short office disasters. Click, drag and dodge.` |
| Uncaught Chrome JavaScript exceptions | **0** |
| Separate report-viewer Chromium Playwright | **PASS** desktop 1440×900, narrow 390×844, real JSON upload/filter/overflow |
| v3 integrated browser acceptance | **PENDING**: no integrated `night-shift-v3.html` in inspected branch |
| Sound/music, 16 live cards, bosses, 4K and human pacing | **NOT VERIFIED** by this lane |

Actual HD capture links (not generated art):
- [HD title 1440×900](../../qa/v3-safetynet-hd-evidence/hd-title-1440x900.png)
- [HD first action 1440×900](../../qa/v3-safetynet-hd-evidence/hd-action-1440x900.png)
- [HD title 650×800](../../qa/v3-safetynet-hd-evidence/hd-title-650x800.png)
- [HD first action 650×800](../../qa/v3-safetynet-hd-evidence/hd-action-650x800.png)
- [Chrome CDP machine-readable results](../../qa/v3-safetynet-hd-evidence/hd-browser-results.json)

## Visual inspection and actionable quality note

The actual HD title retains its strong screen-printed typography, character/printer silhouettes and split cream/coral composition. Its first action shows the animated conveyor office with paper targets and a HUD. At **650×800**, the game's existing `contain` camera compresses the action into a central horizontal band with substantial low-detail top/bottom space. This is a genuine narrow-view baseline limitation: v3 should **improve** it through responsive staging/world coverage rather than merely copy it.

This baseline cannot establish **HD-versus-v3 superiority** until a real integrated v3 candidate exists. The correct next step is to point the same CDP harness (or independent QA_VISUAL browser harness) at `night-shift-v3.html` once integrated, then compare equivalent states and explicitly verify v3's own input paths.

## Reproduction

```sh
node --test qa/v3-safetynet.test.mjs
node tools/v3-safetynet/audit.mjs --root . --out qa/v3-safetynet-result.json
node qa/v3-safetynet-hd-cdp.mjs
python qa/v3-safetynet.browser.py
```

The CDP script requires locally installed Chrome or Chromium. Set `CHROME_PATH` for a nonstandard installation. It uses an isolated temporary Chrome profile and does not require the workstation's usual browser session.

**Release distinction:** source gate and actual HD baseline are now verified. Full v3 gameplay, both bosses, soundtrack and public release remain pending integration. This report does not authorize publishing over the working HD fallback.

---

## Continuation: independent staged-module test, 8 November 2026 evening AEDT

The previous HD/source safety report is retained above. This continuation goes materially further: it **assembles genuine code from nine specialist branches and actually exercises those specialist modules** in Chrome and Node. It does **not** pretend that the unmerged integration route already exists.

### Reproducible assembly, without interference

`tools/v3-safetynet/assemble.mjs` and `tools/v3-safetynet/rehearsal-sources.json` created a **brand-new detached worktree** on the authenticated Windows host and copied **29 owned production/preview files** from nine existing specialist refs (Intake, Services, PR, Staff claim, Printer, Quota, Systems, Physics, Story). No existing release or other agent-owned source file was updated. Source copies use `git show`, so binary assets keep exact bytes and no `git restore` index lock is needed.

The Staff lane's branch had **no Staff production files** when assembled. The script records that absence rather than inventing T1–T4 modules. The live integration branch still had no `night-shift-v3.html` when rechecked, so the candidate is an **isolated rehearsal, not a deployed/integrated v3 game**.

### Actual real-browser captures and input checks

`qa/v3-safetynet-preview-matrix.mjs` runs Chrome through DevTools Protocol against a local HTTP server serving the real staged preview sources. A real mouse click is dispatched to the Start/CLOCK IN control when present, with captured game frames **after** interaction. The first run revealed a test bug: scene tabs took priority over CLOCK IN, leaving the welcome modal open. I corrected input priority and recaptured Intake in action. A second defect, an occasional Windows `EBUSY` when reading `DevToolsActivePort`, was fixed with a bounded retry and retested.

**Result: 16 of 16 preview/viewport samples passed** the canvas-present/basic-input/uncaught-JS/static-asset/overflow checks, across Intake, Services, PR, Printer, Quota, Systems, Physics and Story at **1440×900 and 650×800**. Each independent preview is **real specialist production code**, not a generated illustration. This automated result is a **startup+basic interaction result only**, not a full clear of each microgame/boss.

Evidence committed to this PR:
- [Full machine-readable 16-sample matrix + screenshot hashes](../../qa/v3-safetynet-preview-evidence/matrix-results.json)
- [Intake/Services/PR desktop](../../qa/v3-safetynet-preview-evidence/desktop-1.jpg) and [portrait](../../qa/v3-safetynet-preview-evidence/portrait-1.jpg)
- [Printer/Quota/Systems desktop](../../qa/v3-safetynet-preview-evidence/desktop-2.jpg) and [portrait](../../qa/v3-safetynet-preview-evidence/portrait-2.jpg)
- [Physics/Story desktop](../../qa/v3-safetynet-preview-evidence/desktop-3.jpg) and [portrait](../../qa/v3-safetynet-preview-evidence/portrait-3.jpg)

**Visual judgement, not a test-count illusion:** Intake shows a recognisable conveyor/Finch scene; PR has a legible, theatrical graph manipulation; the two boss previews have readable, mechanically distinct machine silhouettes; Story presents a genuinely formatted email/workbook. Services has comparatively small characters and a sparse dark stage at gameplay scale; Physics likewise is a sparse toy bench. Those should be reviewed and improved against HD, not accepted merely because they boot. The HD narrow-camera letterboxing problem remains an explicit target to surpass.

### Direct production-module lifecycle and deck integration check

`qa/v3-safetynet-contract-matrix.mjs` dynamically imports the actual staged source modules. It instantiates each definition with an injected SceneContext, calls **all nine required scene methods**, exercises a harmless pointer lifecycle, and verifies deterministic serialisable snapshots. It also executes **128 seeded decks** through the **real SYSTEMS production module**, checking 12 cards, five promotion stages, both bosses and coverage of the full 16-card source roster.

**Result: 15 passed / 0 failed / 4 pending**:
- 12 cards (I1–I4, S1–S4, P1–P4) passed the module interface probe.
- Printer Mutiny B1 and THE QUOTA B2 passed the module interface probe.
- SYSTEMS passed the 128-seed topology check.
- T1–T4 are pending; the Staff files were absent from the staged source refs.
- `--release` deliberately returned **exit code 1** with these four pending, rather than publishing a false green result.

[Exact machine-readable contract result](../../qa/v3-safetynet-preview-evidence/contract-results.json).

### Exact commands from an up-to-date local Git worktree

```sh
node tools/v3-safetynet/assemble.mjs --repo . --out /tmp/nightshift-v3-rehearsal
node qa/v3-safetynet-contract-matrix.mjs --root /tmp/nightshift-v3-rehearsal --out /tmp/v3-contract.json
node qa/v3-safetynet-contract-matrix.mjs --root /tmp/nightshift-v3-rehearsal --release --out /tmp/v3-release-contract.json
node qa/v3-safetynet-preview-matrix.mjs --root /tmp/nightshift-v3-rehearsal --out /tmp/v3-preview-frames
```

Use fresh Windows `%TEMP%` paths for outputs; the assembler refuses existing worktree destinations. No external LLM calls were made.

**The remaining release gate is a full HD-superior integrated v3 gameplay build**. This lane has now replaced untested assertions with reproducible real-browser and real-module evidence, but full boss routes, Staff gameplay, actual audio/music, all perk interactions, human timing and a fresh-public-URL run still require end-to-end integration and acceptance. The incumbent HD stays untouched.
