# Office Hours | Proofreading and end-to-end QA

**Reviewed:** 6 November 2026  
**Scope:** CCDP10003 Project 2, Full Game Design option, complete playable build.

## Copy corrections applied

| Found | Corrected |
|---|---|
| First report said "before lunch", even though the fictional shift starts at 10:47 pm | "before midnight" |
| Marketing report was called "Advertising Returns" despite only calculating spending | "Campaign Cost Audit" |
| Firewall promised to block advertisements while the code actually delays recurring ones | Explicitly states a 20-second delay per upgrade level and that the first offer remains |
| Emergency coffee claimed an unconditional 40 HP | Describes restoration of **up to** 40 missing HP; purchase disabled at maximum HP |
| Desk coffee could be consumed at full HP while falsely announcing +15 HP | Saved for later when full; accurate restored-health notices |
| Performance Bonus description did not explain its stackable per-level bonus | Specifies 50% additional credits per level for the shift |
| The MDA research note referred to a completed boss fight before it occurred | Now correctly introduces the imminent encounter |
| The spreadsheet submit control advertised only base credits, ignoring combo and upgrade bonuses | Displays the exact prospective payout, calculated with the same formula as game state |

Deliberate office satire, title typography, and narrative voice were preserved. No AI declaration was added.

## Academic source cross-check

- **Ribeiro e Silva & Pinto (2025):** Actual Journal of Workplace Learning article, 37(2), 153–170. Finding is stated as an association/prediction, not a universal causal result. DOI: https://doi.org/10.1108/JWL-09-2024-0193
- **Hunicke, LeBlanc & Zubek (2004):** Correct MDA title and authors, AAAI workshop proceedings. https://aaai.org/papers/ws04-04-001-mda-a-formal-approach-to-game-design-and-game-research/
- **Ian Bogost (2007):** Correct title and procedural-rhetoric interpretation. https://mitpress.mit.edu/9780262026147/persuasive-games/
- **Mark, Gudith & Klocke (2008):** Distinction between faster work under some interruptions and higher reported stress/effort is maintained. DOI: https://doi.org/10.1145/1357054.1357072

## Real-browser E2E checks

- Complete **ignore-ad path**: six reports, B2 → C2 reference drag, wrong-answer recovery, exact prospective credits on all six submission controls, shop/automation, genuine spam decision, both bosses, arcade, save-and-resume, ending and reset.
- Complete **open-ad path**: malware combat and recovery, shop upgrade, six reports, both bosses and choice-responsive ending.
- Firefox and Edge: source-cell drag in both directions, dropping B/C onto D, clickable formula references, D-column green-corner fill-down, Ctrl+D and double-click tests.
- Adversarial: game-over/reset, 1-HP malware escape/reload, mixed ending, no free permanent shielding.
- Audio: boot, typing, reward, calculator and shop cues; mute; buying protection while coffee is unavailable at full health.
- Desktop layout: 1024×768, 1366×768 and 1920×1080; research notes and primary actions checked for visibility.
- Deterministic tests: formula parsing and evaluation, combat state transitions, saved inbox restoration, and 11 new copy/health consistency assertions.
- Each public build is tested again after deployment, including the first-email research sources, B2 → C2 dragging, 21 audit screenshots and 16 gallery images.

## Grading limits

These are automated and screenshot-inspected checks, not an independent human first-play usability test or complete assistive-technology audit. The marker determines the grade. The project is technically testable and research-integrated; no automated result can guarantee 100/100.
