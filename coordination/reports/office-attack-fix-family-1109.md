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
- Full pointer-driven 26/26 Chrome campaign at 650x800 with both deliberate boss failures: PASS after genuine same-boss retries; exactly one heart lost per boss, final 1 heart, intermission pause/resume, victory and replay.
- Adversarial Chrome suite: incorrect input, pause freezes timer, resume restarts, timeout/third loss ends shift, replay resets state: PASS.
- Independent screenshot-pixel visual gate at 1440x810, 650x800 and 390x760: PASS; 0% dark top/bottom bands, 0 old HD atlas/icon requests, zero JS/network errors, horizontal non-overlapping hearts/round/mute, and a visible horizontal deadline footer. Real mobile CDP touch drag shredded a spam form (seed 17).
- 390x760 Marathon + research campaign: PASS 26/26; opening research held the first break beyond its celebration and required manual Continue, while the second break auto-advanced after 3.79 seconds. Inspected the ten-game phone contact sheet and real screenshots of both breaks, research, bosses and ending; corrected the duplicate portrait command and SHUT instruction overlap.

## Integration / release status
- This is a candidate branch stacked on PR #52 (which is stacked on PR #51). The boss art/fight lane is being integrated separately from PR #54.
- The independent Lane D screenshot/touch QA in PR #56 was copied and extended here to cover all ten mechanics, the horizontal timer, mobile touch and all 26 encounters.
- No merge, Pages deployment, or public release was performed. The protected Pages workflow only permits publication from the integration branch after its full release gate passes. Do not bypass that gate.
