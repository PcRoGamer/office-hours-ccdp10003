# QA_VISUAL | actual HD/negative-control composition comparison

**Date:** 8 Nov 2026 AEDT  
**Branch:** `agents/v3-qa-visual-1108-7c39`  
**PR:** https://github.com/PcRoGamer/office-hours-ccdp10003/pull/15

## Executed on genuine browser captures

Recovered original HD title PNG and historical First Shift title PNG, both from previously successful GitHub Actions browser jobs. Their screenshot dimensions are **exactly 650×800**. Ran a local Pillow/numpy measurement and generated a real contact sheet displaying unchanged original screenshot pixels side-by-side. Inspected the resulting sheet at full resolution and confirmed its titles, aspect ratios, backgrounds and source labels are correct.

The new standalone `qa/v3-visual-composition.py` allows the same reproducible operation against v3 when the candidate has matching screenshot states. It immediately rejects mismatched viewport sizes and comparing an image to itself. It never declares “v3 better” automatically.

### Pixel observations

| Measure | Night Shift HD portrait title | Historical First Shift portrait title |
| --- | ---: | ---: |
| Source dimensions | 650×800 | 650×800 |
| Uniform outer horizontal rows | **47.25%** (194px top +184px bottom) | 4.13% |
| Rows with little detail in bottom 38% | 63.49% | **92.1%** |

**Important:** a smaller letterbox count does *not* mean better design. First Shift replaces the dramatic HD split, large typography and personality with a smaller framed UI and has little visual action in its lower viewport. This is one of the reasons the earlier First Shift build was rejected. Both examples reveal different mobile composition problems that v3 must improve.

The comparator additionally records edge density, colorfulness, luma contrast and per-eighth vertical texture density. These are **diagnostic dimensions**, not a single quality score or licence to substitute quantitative metrics for inspecting actual characters, animation and gameplay.

### Tests actually run

1. **Real source images:** both original PNGs passed Pillow PNG verification and exact-dimension comparison. Generated the pixel-unaltered contact sheet and metric JSON. Direct visual inspection performed.
2. **Strict input rejection:** deliberately supplied HD 650×800 vs First Shift 1366×768. The program exited nonzero with `ValueError: Strict same-viewport rule` rather than generating an invalid visual ranking.
3. Previous in this same QA continuation: 280 authored-source lifecycle/multi-directive combinations passed without exceptions. The reproducible Node gate `qa/v3-visual-live-source.mjs --selftest` passed 80/80 synthetic loader cases; this is explicitly a fixture, not a gameplay image.
4. QA integrity improvements applied: synthetic test output paths are separate from actual captures, broken/truncated PNGs fail CRC/decompression validation, requested scene state must match captured state, and browser in-memory source fallback is restricted to genuine navigation policy errors rather than concealing 404/connection faults.

### How LEAD/RENDER can use the tool

```bash
python -m pip install Pillow numpy
python qa/v3-visual-composition.py \
  --hd path/to/hd-title-650.png \
  --candidate path/to/v3-title-650.png \
  --candidate-label 'Night Shift v3' \
  --output qa-artifacts/v3-visual/title-portrait
```

Generated files: `title-portrait.png` true original-pixel side-by-side contact sheet, `title-portrait.json` reproducible measurements and reviewer warnings. For historical comparisons, pass `--candidate-label 'FIRST SHIFT (NOT V3)'` to prevent the older work being mistaken for the replacement.

**Release remains held:** this historical comparison is real game evidence but is not a live v3 capture; art superiority, audio, physical enjoyment, 16-card campaign and human pacing still require genuinely integrated testing. No changes to HD fallback or peer-owned gameplay sources.
