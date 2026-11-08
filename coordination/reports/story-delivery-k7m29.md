# STORY lane delivery | Night Shift HD v3

**Owner:** GPT-6 / STORY; branch `agents/v3-story-k7m29`; **target:** `rebuild/night-shift-v3-hd`.

## Implemented
- `night-shift-v3/story/narrative.js`: five distinct authored Aster Mail communications, conditional Finch/Mira world reactions strictly gated by observed card IDs, five announced directive descriptions, canonical eight-perk catalogue, optional source-bearing notes, frozen two-lens receipt copy. Never invents a score or writes to the ledger.
- `night-shift-v3/story/presentation.js`: `createStoryExperience({host,audio,reduceMotion})` with `showPromotion({index,run,offers,directive,onPick,onContinue})`, `showReceipt({run,snapshot,onReplay})`, `hide()`, `dispose()`. Explicit one-click choice (three legal unique offers supplied by SYSTEMS), animated before/after Canvas2D perk mechanism demos, 1.65-second announced rule, optional research disclosure, physical reversible receipt, accessible buttons and reduced-motion path. Events are callback-only; no perks or scores granted here.
- `night-shift-v3/story/story.css`: visual language derived from HD's Aster Mail / Excel workbooks, full-viewport dark office overlay, responsive landscape and 650×800 narrow layout, receipt perforation, readable high-contrast upgrade cells, CSS motion.
- `previews/v3-story.html`: standalone real Canvas2D full-viewport office-theatre background and five interactive promotion stages, mocked run/ledger and real flip/How Counted/replay. All mock data marked as demo.
- `qa/v3-story.test.mjs`: 12 actual Node unit/integrity checks.
- `qa/v3-story.browser.py`: real Chromium/Playwright render plus five-promotion interaction, receipt lens, breakdown, screenshot and page-error audit at 1920×1080, 2560×1440, 3840×2160, 3440×1440, 650×800.

## Exact tests executed (2026-11-08 AEDT)
- `node qa/v3-story.test.mjs` → **12/12 passed**.
- `python qa/v3-story.browser.py` → **5/5 viewport captures** with full-bleed Canvas width equal to CSS viewport; 3 offer targets each; **all five choices**, receipt flip and breakdown **passed**, **0 page errors**.
- Browser runtime in this container blocked localhost/file navigation with `ERR_BLOCKED_BY_ADMINISTRATOR`; browser QA rebundled the **unchanged authored JS/CSS/HTML contents** into a Chromium in-memory document via Playwright `page.set_content`. This is a real rendered browser test, **not** an HTTP-served asset-loading test. External URL module-resolution/Pages checks remain for RELEASE/LEAD.
- Actual screenshot inspection revealed initial mid-entry opacity capture plus a tall narrow mail section. Added animation-settle delay before capture; compacted 650×800 layout to display all 3 upgrade choices and directive within the viewport. Reran complete audit successfully.
- Local screenshot files: `qa/v3-story-evidence/promotion-{1920x1080,2560x1440,3840x2160,3440x1440,650x800}.png`, `receipt-people-1920x1080.png`, `report.json`. Browser image artifacts are provided as downloadable sandbox outputs in the handoff chat, **not committed to GitHub**.

## HD comparison and release status
Inspected real HD source `arcade-office-hd.html` (Aster Mail and workbook CSS/render routines). Preserved split mail/Excel visual grammar, sage-green spreadsheet, heavy ink and editorial type, and added 3-stage before/after perk demonstrations, actual rule announcement and reversible event-based receipt. Screenshot comparison to a locally rendered HD browser frame was not available in this session; **no claim of passed global HD visual release gate**. Scene preview is story-only, not all-16-card game.

## Integration
1. Load `night-shift-v3/story/story.css` as a stylesheet and import `createStoryExperience` from `night-shift-v3/story/presentation.js`.
2. Mount a fixed overlay `<div id="nightshift-story" hidden></div>`; create once with `createStoryExperience({host:document.querySelector('#nightshift-story'),audio})`.
3. Enter promotion only after SYSTEMS freezes the current card batch and sends its **three legal offers** and announced directive. The `onPick({perkId,index,directive})` callback grants via SYSTEMS **exactly once**. `onContinue()` moves to next task; caller keeps gameplay clock paused through the overlay.
4. On victory call `showReceipt({run,snapshot:run.endingSnapshot,onReplay})`; snapshot fields need `officialQuota` and `peopleQuality` (or accepted numeric aliases), optional `components.official`/`components.people`. Do not recompute or mutate. Merge with actual SYSTEMS snapshot adapter only after inspecting its shape.
5. Optional source cards open original DOI/publisher URLs in separate tabs and never gate play.

## Honest limitations
- STORY does not implement SYSTEMS perk effects/directives or boss outcomes, only presents actual supplied values.
- Perk demo art is schematic 2D mechanics illustration, not a replacement for ART lane character work.
- Local Chromium proof exists; HTTP route/Page deployment, sound testing and HD side-by-side comparison remain unverified.
- No existing release/main/other lane paths modified.
