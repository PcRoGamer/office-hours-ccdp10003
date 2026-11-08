# SAFETYNET overflow lane | execution and acceptance report

**Run:** 8 November 2026 AEDT, independent container execution.  
**Branch:** `agents/v3-safetynet-atlas-1108` (base: `rebuild/night-shift-v3-hd`).  
**Scope:** release *source* safety verification, not a replacement for QA_GAME, QA_VISUAL or RELEASE.

## Files delivered

- `tools/v3-safetynet/audit.mjs`: zero-dependency Node 20+ source-stage verifier with JSON/Markdown output and two modes, integration and `--release`.
- `qa/v3-safetynet.test.mjs`: six deterministic tests, all passing.
- `qa/v3-safetynet.browser.py`: reproducible Playwright browser QA with actual local screenshots and JSON upload assertions.
- `previews/v3-safetynet.html`: live, responsive evidence viewer, JSON file upload, status filtering, deliberately distinct from a game screenshot.
- `tools/v3-safetynet/README.md`: instructions and limitations.

## Executed checks

1. **Node:** `node --test qa/v3-safetynet.test.mjs` in the isolated container: **6 passed, 0 failed, 0 skipped**. Same byte-for-byte `audit.mjs` and test source uploaded to GitHub verified by comparing Git blob SHAs.
2. **Browser:** Chromium through Playwright at **1440×900** and **390×844** using actual local HTML content. Passed: sample load, real file-input JSON load, summary counts, fail filter and portrait no horizontal document overflow; no JavaScript page exceptions. Initial mobile capture revealed overflowing summary type and truncated rows, fixed with responsive type scaling and stacked mobile cards, then rendered and inspected again.
3. **Live integration branch:** inspected `rebuild/night-shift-v3-hd` through authenticated GitHub. All **14 historically deployed route files** still match the pinned `main` Git blob SHAs, including `arcade-office-hd.html`, `index.html`, `workday-final.html`, and all major arcade routes.
4. **GDD schema:** the existing `design/v3/contract.json` declares 16 unique authored IDs, 12 per shift, five promotions, eight perks, five directives and both three-cycle bosses. This is a **document presence/conformance finding only**, not an implemented-game pass.

## Genuine blockers and exclusions

- At the time of this report the shared integration branch had **no `night-shift-v3.html` nor `night-shift-v3/**` merged yet**. This is *pending integration*, not a failed specialist contribution. All original 17 production lanes were reserved in the shared claim directory, so this is an explicitly supplementary lane.
- Remote Desktop Commander reported the Windows device **offline**; container attempts to navigate network and file URLs were blocked by policy. For browser QA of the viewer, Playwright used `page.set_content` with the exact standalone HTML bytes. The **actual HD game was NOT launched or compared** in this lane; there is no assertion of visual parity.
- The viewer screenshots were captured locally at the stated viewports and inspected. The report viewer is **not gameplay**. Game footage, human timing, music, 16 live cards, bosses and final physical CLOCK OUT remain the responsibility of the original owners.
- This tool uses static source matching and URL extraction. A fake scene definition can still pass a structural scan; the audit intentionally keeps `runtime-evidence` pending forever, even when all source-stage checks pass. Dynamic URL creation and runtime asset failures still require browser E2E.
- No shared release routes, other lanes' code, CI workflows, SWARM, AGENTS, contracts, or `main` were edited.

## Reproduce and integrate

```sh
node --test qa/v3-safetynet.test.mjs
node tools/v3-safetynet/audit.mjs --root . --out /tmp/v3-audit.json
node tools/v3-safetynet/audit.mjs --root . --release --out /tmp/v3-release-audit.json
python -m http.server 4173
# open /previews/v3-safetynet.html and load the JSON file
```

**Integration instructions:** LEAD can merge this additive PR without importing it into the main game runtime. RELEASE may *call* `node tools/v3-safetynet/audit.mjs --release` from its owned workflow once specialist modules are integrated. A source-stage green result never overrides visual, audio, human or Playwright acceptance gates.
