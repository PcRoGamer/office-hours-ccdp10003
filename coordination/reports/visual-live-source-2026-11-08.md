# QA_VISUAL | live authored-source contracts, 8 November 2026

Branch: `agents/v3-qa-visual-1108-7c39`  
Draft PR: https://github.com/PcRoGamer/office-hours-ccdp10003/pull/15  
Owned new test: `qa/v3-visual-live-source.mjs`

## Why this exists

The integrated `night-shift-v3.html` was not present at last inspection. Rather than treating that as a reason to stop, the QA lane executed the actual specialist scene modules directly from their live GitHub branches. These are not simulations of the scene logic: the **original source text was loaded, evaluated, and its real scene lifecycle methods were exercised**. Only the drawing surface was a mock Canvas2D, so this is explicitly a *logic/render-call smoke test*, not genuine browser screenshot or aesthetic evidence.

## Executed against live GitHub source

| Authored source branch | Source module blob SHA | Scenes | Case passes |
|---|---|---|---|
| `agents/v3-intake-81d47` | `74a545b842f5dfa93838567070b85010d3845540` | I1, I2, I3, I4 | 80/80 |
| `agents/v3-services-n8-7c42` | `d5b5084878c2ee2fa75cc4d955fa34f7462b04a5` | S1, S2, S3, S4 | 80/80 |
| `agents/v3-pr-g6-1108c` | `2c3fe86c16c502d6cec00224c404d5650cf9a212` | P1, P2, P3, P4 | 80/80 |
| `agents/v3-printer-r8c2` | `6599a62a76204f2ec7436cb05a96625765aca824` | B1, Printer Mutiny | 20/20 |
| `agents/v3-quota-q7n482` | `354fc3e31ef6045b0687cb1a17fbea8b92b1e510` | B2, THE QUOTA | 20/20 |
| **Total** | | **14 independently available authored scenes** | **280/280** |

The follow-up stress pass applied **30 real update ticks per case (8,400 updates)**, offscreen pointer-down/move/up, pointer cancellation, at least five `draw()` calls per case, snapshot serialization, duplicate completion protection and scene disposal. The live V8 source checks found **zero exceptions, zero duplicate completion events, zero missing draw paths**.

The drawing proxy recorded approximately 720,625 2D drawing API calls across those stress cases (counts are method calls, not quality scores). The PR and other lane modules were not copied into the user's workstation or changed. The test keeps source hashes and source branch names for reproducibility.

**Test matrix:** 1920×1080, 650×800, 3440×1440, 3840×2160, crossed with five directives: FAST OR SAFE, MOVING GOALPOSTS, SPONSORED WORKFLOW, MANDATORY COLLABORATION, DOUBLE ENTRY. These are API and lifecycle smoke tests only; successful offstage pointer movement is not evidence that a card is winnable, physically satisfying or correctly scored.

## Reproducible implementation

Committed `qa/v3-visual-live-source.mjs` tests live agent modules in isolated shallow clones, using Node's native ESM loader with recursively rewritten **original** relative imports carried by data URLs. It refuses out-of-tree imports, records SHA256 module contents, verifies exact card rosters, freezes run state to detect unauthorized mutations, validates scene lifecycle, draw path and finite snapshots, and writes one JSON result per lane. It provides a separate `--selftest` output so fixtures cannot replace real evidence.

Commands:
```bash
node qa/v3-visual-live-source.mjs --selftest
node qa/v3-visual-live-source.mjs --lane all
node qa/v3-visual-live-source.mjs --lane pr --source pr=/path/to/PR-agent-checkout
```

**Actual Node local fixture test:** 80/80 PASS, nested ESM imported via original-text data URLs, PNG-independent drawing API exercised. The exact committed source was also independently V8 syntax-parsed after stripping Node-specific imports, PASS.

**Actual-code multi-branch test:** 280/280 V8 direct-source smoke cases PASS, as above. This was a standalone live-source execution using the connected GitHub content, not the Node script's full `--lane all` run; the current isolated container cannot clone GitHub over DNS. We do not claim that unexecuted command has passed.

## What this does NOT prove

- No real browser screenshots of the new integrated v3; no HD-vs-v3 artistic superiority verdict.
- No satisfactory full 16-card/12-card run or real human playtime.
- No genuine pointer-completion stress for every card; source owners' existing browser E2E tests still provide that evidence.
- No music or animation quality verdict.
- Four STAFF microgames are still missing from the available module branches at this inspection. This source gate does not redefine the required sixteen authored cards as twelve.

These limitations are **release gate facts, not questions for the user**. QA_VISUAL should continue independently reviewing any real source as it becomes available, and LEAD owns the actual whole-game integration. HD stays the protected fallback.
