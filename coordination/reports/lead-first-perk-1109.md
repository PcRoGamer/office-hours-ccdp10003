# LEAD | First promotion has actual physical Services activation

**Date:** 2026-11-09 AEDT. Isolated worktree: `C:\Users\Admin\NightShiftV3-PerksLead-1109`, branch `agents/v3-service-perks-1109`.

## Problem
Specialist PR #40 found all three first-promotion choices absent from the immediately following S1/S2 scenes. This violated the canonical v3 GDD's Promotion Trap. The director had awarded the perks, but the authored Services scenes did not read their levels. No scoring-model adjustment can substitute for gameplay.

## Concrete physical changes
- **Carbon Copy in S1:** after the first legitimate folder is physically delivered, the next unresolved paper is copied into a visible nearer handle with a ghost-outline effect. That original folder still requires its own player drag; confirmed filing count remains exactly 1 until a second real delivery. No automatic filing credit or fake money is created.
- **Bank Shot in S1:** earning the perk widens the usable bumper collision zone and strengthens the actual fling velocity; the bumper label and feedback change. The baseline bumper remains present but has measurably weaker dynamics.
- **Mira Backup in S2:** the actual physical tray becomes 65 world pixels wider, on both SAFE and FAST routes. Two visible golden catch wings and a perk indicator communicate the change. The player must still steer and catch the cups; no automatic success is counted.
- Scene state exposes the activated perk and proxy/collision counters to independent tests; SYSTEMS ledger and score bridge remain unchanged.
- The authentic 12-card Chrome full-run test asserts real first-promotion Carbon Copy activation after a manually filed S1 folder. It waits for the promotion UI to close before interacting and allows a full natural safe-pull period on Printer Mutiny.
- Exact-commit release workflow runs `qa/v3-lead-first-perk-services.test.mjs`.

## Tests performed
- `node qa/v3-lead-first-perk-services.test.mjs`: **PASS** on real authored S1/S2 scene pointer callbacks; Carbon Copy moves an unresolved folder without credit, Bank Shot changes rebound trajectory, Mira Backup changes both route widths.
- `node qa/v3-wrap-game.test.mjs`: **PASS 8/8**, 4,096 seeds, all 16 authored variants reachable.
- `node qa/v3-wrap-bridge-provenance-contract.test.mjs`: **PASS** real SYSTEMS zero-point expiry, PR dedupe, retry counters, source-bound frozen score.
- `node qa/v3-wrap-game-failure-path.test.mjs`: **PASS** failed I1 must offer retry.
- `node qa/v3-wrap-score.test.mjs`: **PASS 7/7** independent immutable ledger tests.
- `node qa/v3-lead-scored-full.browser.cjs`: **PASS** full real Chrome 12-card, five-promotion, two-boss victory, manual S1 Carbon Copy activation, all four boss choices, verified immutable **82 Official / 61 People** receipt, real flip/details/replay, zero JS errors. Score changes with actual timing, as intended.
- The original 1.9s test wall-clock wait for Printer's safe-pull window was intermittently insufficient during Chrome CPU contention; 6s wait prevents false rejection without changing game mechanics.

## Limitations
This does not substitute a general human first-playtest or assert subjective visual superiority. Deployment/hosted Canvas link not yet verified at the time of this report. Night Shift HD and main remain unchanged.
