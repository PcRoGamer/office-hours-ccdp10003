# Perk/directive QA: physically inert promotions in authored scenes
**Date:** 2026-11-09 AEDT · **Lane:** PERK_DIRECTIVE_QA_1319_FOX
**Branch:** `agents/wrap-perk-1319-fox` · **Base:** `rebuild/night-shift-v3-hd`

## Reproduced live-code discrepancies

The real director stores chosen perks as bare canonical IDs, for example `run.perks['magnet-grip']=1` and `run.perks['mira-backup']=1`. Independently authored game scenes disagree on the lookup contract:

- Staff Support `T1/T2/T3/T4` calls `perkLevel(context, 'perk:magnet-grip')`, so earned Magnet Grip never widens its actual pointer hitboxes. A real `T2` crate clicked 57 world pixels beyond its centre could not be grabbed, despite Magnet Grip being selected.
- Printer Mutiny detects Mira only via `perks['perk:teamwork']`. The actual draft ID is `mira-backup`, so selecting Mira Backup did not enable the physically clickable assist.
- THE QUOTA's Bank Shot drawing checks `perkLevels['perk:bank-shot']` while its actual gameplay logic checks `perkLevels['bank-shot']`. Consequently the guide was hidden after a legitimate Bank Shot selection.

The existing roster test `qa/v3-wrap-game.test.mjs` checks *offered* perk IDs and predicted activation tags, not these physical scene lookups, so it passed despite the mismatch.

## Implemented non-invasive fix

`night-shift-v3/finalization/perks/context-aliases.js` provides:
- `scenePerkLevels(perks,perkLevels)`: frozen, detached numeric scene-only level view with bare and `perk:` aliases for the eight real perks and `perk:teamwork` only when Mira Backup was genuinely selected. No unearned levels, no writes to SYSTEMS, immutable ledger, score, or director.
- `withScenePerkAliases(run)`: inherited run facade with live getters. Later promotions are reflected without caching earlier levels.
- `withPerkCompatibleDefinitions(definitions)`: additive wrapper for frozen authored card and boss definitions; all original data/scene logic remains intact. Null input to future caller fails closed with a clear error.

**IMPORTANT: the adapter is not yet active in the production game until LEAD wires it into the existing two definition arrays.** This is intentionally not an edit to lead-owned source.

## Exact LEAD integration (two call-site edits, read-only recommendation)

In `night-shift-v3/app.js` import:

```js
import {withPerkCompatibleDefinitions} from './finalization/perks/context-aliases.js';
```

Change only the two declaration initialisers:

```js
const ALL_DEFINITIONS=withPerkCompatibleDefinitions([...intake,...services,...publicRelations,...staff]);
const ALL_BOSSES=withPerkCompatibleDefinitions([{...printer[0],id:'printer'},{...quota[0],id:'quota'}]);
```

No edits to the lead's `runtime/director.js`, score bridge, STORY ledger, or existing scene files are needed.

## Executed evidence, not mock-only conclusions

### Local Node, Windows isolated sparse checkout
```text
node --test qa/v3-wrap-perk-1319-real-scenes.test.mjs  5 passed / 0 failed
node qa/v3-wrap-game.test.mjs                      8 groups passed
node qa/v3-wrap-score.test.mjs                     7 passed / 0 failed
node qa/v3-lead-director.mjs                       pass: 12 scenes / 2 bosses / 5 promotions
```
The new test instantiates **actual** Staff T2, Printer Mutiny and Intake definitions, and advances Printer's true telegraph → jam → counter state machine before manually tapping Mira. Baseline behavior is asserted before the adapter result; no fixtures substitute for the affected scene mechanics.

### Real Chrome, real pointer events and actual Staff scene canvas
```text
node qa/v3-wrap-perk-1319-browser.cjs    PASS
viewport                              1200×760
selected perk                         magnet-grip level 1
same pointer drag                     original crate (x=532,y=384) grab at x=589, move +60
unwrapped baseline                    crate x 532 → 532 (delta 0)
adapter-enabled scene                 crate x 532 → 608.15 (delta +76.15)
Chrome page errors                    0
```
The browser harness renders the real Staff T2 scene, not a stock fixture, but is **not** a full integrated director campaign. The two captured Chrome images were visually inspected: the top crate remains at original left position without the adapter and moves to the right with the adapter; both retain the full illustrated office backdrop. Downscaled original Chrome screenshot evidence is committed at `qa/v3-wrap-perk-1319-evidence/{baseline,compatibility}.jpg`. Raw 1200×760 PNGs remain in this independent worktree's sibling evidence directory.

### Discovered boundary / release warning
The first promotion always offers `carbon-copy`, `bank-shot` and `mira-backup`, but neither the current S1 nor S2 Services authored scene reads `run.perks` or `run.perkLevels`. The S1 bumper exists regardless of Bank Shot ownership. Thus this adapter **does not** solve the deeper GDD promise that all three first-promotion choices immediately affect the following two cards. Specifically, future Services gameplay still needs genuine, visually acknowledged perk triggers, with synthetic assistance marked honestly. Do not claim full five-promotion acceptance based on the adapter or roster metadata alone.

## Regression + integration gates
1. Merge this additive adapter and test PR into integration, then LEAD applies the two app.js call-site changes above on its protected branch.
2. Re-run `node --test qa/v3-wrap-perk-1319-real-scenes.test.mjs`, `node qa/v3-wrap-perk-1319-browser.cjs` and existing SYSTEMS/director suites.
3. In integrated real Chrome, pick Mira Backup in Promotion 1, reach Printer Mutiny, and verify the visible Mira assist can be manually activated; pick Magnet Grip in a seeded replay and verify Staff wider hitbox. Keep HD fallback untouched.
4. Separately verify first promotion choices actually change real **S1/S2** interactions. This is outside the narrow ID-compatibility fix and remains an explicit release risk.

**Unverified:** 12-card integrated Chrome run with adapter wired; screenshots at mobile/4K; audio playback; deployment/public URL; subjective fun; Canvas submission. None is claimed.
