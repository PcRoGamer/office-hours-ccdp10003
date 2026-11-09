# Night Shift v3: LEAD recovery integration

**Branch:** `agents/v3-lead-recovery-1108`
**Target:** `rebuild/night-shift-v3-hd`
**Date:** 2026-11-08 AEDT
**Playable route:** `night-shift-v3.html`

## Recovery and attribution

The original LEAD branch contained no implementation commit or PR, but its Windows worktree had an uncommitted HD-derived shell. I recovered a copy to a new isolated git worktree, preserving the original. GitHub source modules were imported **unmodified** from the PHYSICS, SYSTEMS, INTAKE, SERVICES, PR, PRINTER, QUOTA, STORY and A11Y branches. Source-only snapshots from local STAFF, RENDER, ART and AUDIO worktrees were copied without changing their owners' originals. Review final specialists' PRs against these snapshots before accepting.

## LEAD-owned work

The independent recovered shell now imports **16 authored microgame definitions** and chooses **12**, with five actual promotion drafts/directives and both mechanic-driven boss modules; supports seeded rosters, a full-screen world with viewport-edge HUD, pointer routing and guarded scene completion; correct inverse input/draw transforms for the centered printer boss; on-screen narrow/portrait reframing for authored Intake/Services geometry. HD's original 2048-pixel sprite atlas is loaded from the unchanged `arcade-office-hd.html` route. The temporary oscillator-only soundtrack has been replaced by AUDIO's original four-section composed score and live foley.

## Tests executed in real Chrome

- Original director harness: PASS (12-card topology, five promotions, both bosses, pause and duplicate checks).
- Fullscreen/browser smoke: **three Chrome viewports PASS** at 1920×1080, 650×800 and 1920×1080 DPR2 (3840×2160 physical backing), zero JS and failed requests. WebAudio confirmed context running, with 26, 21 and 149 scheduled notes at respective early snapshot points.
- **Complete physical first-seed test PASS:** 5 manual stamps, 2 real shred actions, 3 scam closings, 3 filed folders, coffee catches, printer unjam; three consecutive real Printer Mutiny telegraph/pull/throw/bolt cycles; physical P1 truthful chart axis, P2 pop-up dismissal, P4 report framing; staff rescue, two separate $40 licence allocations and clock timing; THE QUOTA 3 physical counter phases, 4 FILE/COOL packet choices and giant CLOCK OUT. Exactly **12 unique cards, five promotion breaks, two bosses** completed with **zero uncaught JavaScript errors**. Automated pointer play is not human pacing.
- Real screenshots were captured of title, multiple cards, promotion breaks, all printer cycles, all quota counters, end and portrait. The curated WebP originals in this branch were compressed from those Chrome screenshots; not generated concept art.

## Explicit remaining release gates

This is a **playable integration candidate, not yet an approved HD successor**. The live director currently logs committed scene outcomes but the canonical SYSTEMS immutable scoring/event model and STORY two-lens receipt are not fully connected. No claim of accurate final budget, all eight perk synergies, sound quality, save/reload, human 7–10m pacing, all 16 in-browser cards or visual parity. Portrait uses a fit/reframe rather than ideal scene-specific composition, leaving type smaller than desirable. The visual standard of several cards remains below HD. The final scene still displays the recovered shell's preview ending: that must be replaced with a truthful receipt before release. No Pages publication/Canvas submission performed. HD and existing published routes remain untouched.

## Reproduction

```bash
python -m http.server 4173
# http://localhost:4173/night-shift-v3.html
node qa/v3-lead-director.mjs
node qa/v3-lead-integration.browser.cjs
node qa/v3-lead-first-loop.browser.cjs
```

The integration lead must reconcile each imported specialist snapshot with the owner's final contribution. Next iteration: wire ledger and STORY receipt, inspect result and fix, then multiple-seed human-like visual and gameplay acceptance.