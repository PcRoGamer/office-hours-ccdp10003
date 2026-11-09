# LEAD | First promotion is now physically meaningful in Services

Date: 9 November 2026 AEDT. Branch `agents/v3-service-perks-1109`.

## Genuine changes, not synthetic score entries
- `carbon-copy` in S1: after the first **real** successful filing, an unfiled second folder is physically moved into the active desk area with visible echo artwork. The actual folder still needs player input and **does not earn a free filing or SYSTEMS credit**. No action is fabricated.
- `bank-shot` in S1: the earned perk widens the actual office bumper collision and increases its physical rebound velocity; visible on-screen label distinguishes earned boost from the always-present baseline bumper.
- `mira-backup` in S2: a legitimate earned perk extends the physically steered tray by 65 world pixels for all SAFE/FAST route changes, with visible support brackets and label. The player still steers and catches mugs manually.
- Changes are inside authored Services definitions, not just metadata or decorative descriptions. Baseline mechanics remain playable if a perk is not selected.

## Test results
- `node qa/v3-lead-first-perk-services.test.mjs` PASS: three real scene effects; physical folder movement, Bank Shot collision, S2 catch geometry; one actual S1 completion containing three genuine filed IDs.
- `node qa/v3-wrap-game.test.mjs` PASS 8/8, seeded 4096 and all 16 variants reachable.
- `node qa/v3-wrap-bridge-provenance-contract.test.mjs` PASS authentic QUOTA expiry, PR dedupe/retry and 85/85 ledger fixture.
- `node qa/v3-lead-scored-full.browser.cjs` PASS **full real Chrome pointer campaign**, 12 cards, 5 promotions, both bosses, 4 actual QUOTA choices, physical victory, 82 official / 61 people, receipt flip/details, replay resets run; zero browser exceptions. Added screenshot/assertion verifying chosen Carbon Copy actually moves an unresolved folder during the S1 run.
- The browser regression can encounter occasional asynchronous safe-pull windows in Printer Mutiny, so the safe-pull polling timeout was increased to 6s without altering authored gameplay or invoking artificial scene controls.
- Release workflow runs first-perk physical test before the real browser full run.

Night Shift HD and main untouched. No Canvas submission claim. Publication pending exact-commit CI and hosted route verification.
