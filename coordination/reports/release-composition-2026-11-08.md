# RELEASE lane | Actual 14-scene single-canvas composition, tested and packed

**Execution:** Sunday 8 Nov 2026 AEDT.  
**PR:** https://github.com/PcRoGamer/office-hours-ccdp10003/pull/10  
**Authoring branch:** `agents/v3-release-nova0811`  
**Latest audited build:** https://github.com/PcRoGamer/office-hours-ccdp10003/actions/runs/42475176429

## Implemented, not hypothetical

The RELEASE lane now builds an **ephemeral source-level integration rehearsal** from live independent agent branches, without committing or overwriting another agent's code. All source SHAs are recorded in the ZIP. The following original authored code actually loads into **one Canvas2D surface and one coordinate/input system**:

- Intake: I1–I4
- Services: S1–S4
- Public Relations: P1–P4
- Printer Mutiny boss (B1)
- THE QUOTA boss (B2)
- SYSTEMS engine (seeded run, GDD 16-ID roster).

These are 12 individually authored microgames plus both bosses. **Not a full 12-card/16-roster run.** STAFF T1–T4, LEAD shell, RENDER, ART and AUDIO are still absent from this composed artifact. Honest product state remains **unpublished**.

### New owned implementation

- `qa/v3-release-composition.test.mjs`: actually imports, constructs, enters, ticks, snapshots, cancels and disposes the 14 original scenes using a shared injectable context; asserts event idempotency and no completion awarded without manual actions.
- `previews/v3-release-composition.html`: full-viewport interactive source rehearsal, select any of 14 real modules, drag/click, no fictional score commits. Includes one consistent viewport/input adapter with intact viewport object across live resize.
- `qa/v3-release-composition.browser.cjs`: real Chromium rendering and error/missing-asset checks, 19 clean scene screenshots across 1920×1080 and 650×800, multiple physical-input captures (stamp, printer counter, bonus FILE/COOL), on-the-fly desktop-to-portrait resize.
- `.github/workflows/night-shift-v3.yml`: read-only nine-lane browser + unit matrix, isolated scene composition, published HD fallback QA, manually gated Pages deployment, and a downloadable standalone `playable` source bundle with a README and pinned source SHAs.
- `qa/v3-release-previews.cjs`: expanded to cover PR, both bosses and accessibility.
- `qa/v3-release-offline-bundle.cjs` + `qa/v3-release-offline.test.cjs`: use esbuild on genuine owned modules to emit one self-contained double-click HTML, then validate with real Chromium using a `file://` URL and **no network**.

### Actual testing evidence

Run [42475176429](https://github.com/PcRoGamer/office-hours-ccdp10003/actions/runs/42475176429) yielded:

- **266/266 source composition checks passed; 0 failures; 5 explicit missing-production warnings.**
- **55/55 real Chromium composition checks passed; 19 clean scene captures plus actual pointer tests. I1 accepted exactly one manual moving-paper stamp at desktop and portrait. Printer Mutiny jam pull advanced to the counter phase, then a real packet fling removed exactly one bolt at both sizes. THE QUOTA accepted two separately replayed **FILE** and **COOL** physical packet drags: FILE awarded exactly **+5** Corporate points, COOL **0**, at both sizes. Desktop→portrait live resize did not stale the shared input transform.
- **9/9 independently contributed module preview jobs passed** their own native unit/browser smoke stages.
- **HD fallback browser regression passed**; existing releases remain unchanged.
- **Candidate production route gate FAILED** because `night-shift-v3.html` genuinely does not exist on integration branch; **publish SKIPPED**. This is expected and correct, not a passing release.

**Direct Chromium evidence and reports:** https://github.com/PcRoGamer/office-hours-ccdp10003/actions/runs/42475176429/artifacts/13615331208  
**Portable, independently validated bundle:** https://github.com/PcRoGamer/office-hours-ccdp10003/actions/runs/42475176429/artifacts/13615261433

**Play immediately:** Extract and open **`index.html`** in a desktop browser. The genuine source modules are bundled into a single **135,603-byte HTML file** through esbuild; no webserver, internet or software installation is required to play this independent rehearsal. It passed **10/10 real offline Chromium tests** across 1920×1080 and 650×800, including all 14 module imports, switching to B2, fullscreen canvas, zero HTTP requests, and zero browser exceptions. For unbundled/inspectable source, extract the ZIP then run `python3 -m http.server 4173` from the archive root and open `http://localhost:4173/previews/v3-release-composition.html`. Source SHA manifest is inside the ZIP. Not a finished course release.

## Visual inspection and corrective cycle

Inspected contact sheets made from the **actual CI screenshots**, not generated concept art. First capture had QA toolbar stacked into world staging on all scenes and a translucent warning over foreground art. That damaged the evidence and made the 650×800 capture hard to evaluate. Added clean-capture mode to hide selector/debug HUD **only during screenshot**, fixed a stale viewport object on live resize, reran the genuine browser test. The re-captured real scenes now show distinct Intake paper conveyor, Services tactile devices, PR chart/slide props, animated printer and QUOTA character/body composition without debug overlays.

Specific observations:
- Intake scenes have recognizable paper-toy interactions and readable imperatives. Portrait staging remains visible rather than letterboxed; user interaction should still receive dedicated stress QA.
- Services and PR use different spatial stage grammars, not an identical three-card template. All preview screenshots show visible actual rendered props, not empty canvas.
- Both bosses show large illustrated machines. This capture is of their initial states, **not proof of three completed physical cycles**, which require separate boss-specific QA and end-to-end play.
- The combined staging does not yet include HD-quality promotion/ending animation or original musical score. A source composition pass is **not visual superiority** over the known HD baseline.

## Integration notes for LEAD

1. These modular imports passed with the current original owner source: `night-shift-v3/scenes/intake/index.js`, `services/index.js`, `pr/index.js`, `bosses/printer/index.js`, `bosses/quota/quota.mjs`, `systems/{core,engine,effects}.js`.
2. Use each `definitions` export (`I1…I4`, `S1…S4`, `P1…P4`, `B1`, `B2`) and construct using `create(context)`; pass `viewport`, `events.emit`, `run`, `audio.play`, `options`, `rng` as needed. All 14 support the contract's nine lifecycle methods.
3. **Important scoring adapter reconciliation:** INTAKE emits `card-complete` with an object `outcome`; SERVICES and PR emit the same event with a string outcome (typically `success`). PR separately emits `card-action` with `correct` and `kind`, while Intake logs correct primary actions in `evidence.actions`. Systems uses explicit `run.recordAction({objectId,outcome})` and `run.completeCard()`. LEAD must normalize/dedupe these **real manual actions** into ledger IDs and avoid completing an attempt more than once. Do not trust a success signal without scored action evidence. The harness deliberately keeps score commits disabled.
4. Next complete STAFF T1–T4, LEAD entry+flow, ART/RENDER/AUDIO, full campaigns. Only then run production browser candidate and the gated release decision.

**Gate truth:** Source composition is tested, nine preview lanes work, public V3 remains locked. HD is preserved until complete replayability, both bosses, artistic/audio excellence and public route are demonstrated.
