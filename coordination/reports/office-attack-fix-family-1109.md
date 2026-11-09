# Office Attack | FIX-family microgames | 9 November 2026

## What changed
- Expanded the playable microgame pool from six to ten authored mechanics: STAMP, CATCH, SHRED, FIX, PLUG, CLEAN, SORT, SHUT, FEED, DODGE.
- FIX replaces the old PATCH slot. PLUG, CLEAN, SORT and SHUT are mechanically distinct, with actual pointer/drag input, success/failure paths and visible state changes.
- The existing chapter structure now selects eight microgames per batch, at three speed tiers, with two boss encounters and two intermissions: 26 total encounters.
- Added QA snapshots for the new mechanics and a focused unit suite that exercises correct inputs, incorrect inputs, snap-back behavior, timeouts and completion at all three speeds.
- Mobile composition suppresses the duplicated in-canvas title/hint when the portrait layout already presents the command in the safe header area.
- SHUT popups sit below the command/hint region so the close target no longer covers its own instruction.

## Verification performed on this candidate
- `node --check` for game.js, games.js and the campaign QA runner: PASS.
- Focused unit suite: all five new/changed mechanics PASS at levels 1, 2 and 3.
- Full pointer-driven 26/26 Chrome campaign at 1440x810: PASS, including both bosses, two intermissions, victory and replay; zero JS errors and missing assets.
- Full pointer-driven 26/26 Chrome campaign at 650x800: PASS, including both bosses, intermissions, victory and replay.
- Adversarial Chrome suite: incorrect input, pause freezes timer, resume restarts, timeout/third loss ends shift, replay resets state: PASS.
- Creative HUD smoke at 1440x810, 650x800 and 390x760: PASS; hearts/round/mute and deadline remain separate horizontal strips.
- Screenshot review found and corrected SHUT's overlapping instruction and duplicate portrait command. Follow-up screenshots are required after final boss-art integration.

## Integration / release status
- This is a candidate branch stacked on PR #52 (which is stacked on PR #51). The boss art/fight lane is being integrated separately from PR #54.
- The independent Lane D screenshot/touch QA in PR #56 should be extended to cover PLUG, CLEAN, SORT and SHUT; the local campaign runner already has pointer solvers for those mechanics.
- No merge, Pages deployment, or public release was performed. The protected Pages workflow only permits publication from the integration branch after its full release gate passes. Do not bypass that gate.
