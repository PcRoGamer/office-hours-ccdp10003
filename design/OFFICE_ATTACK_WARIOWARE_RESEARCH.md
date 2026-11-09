# OFFICE ATTACK: WarioWare microgame research and redesign decision

**9 November 2026.** Research before implementation; independently grounded in WarioWare catalogues, recent player discussions and comparable indie microgame games. This document is a design audit, **not** a claim that all ~2,000 microgames received individual user ratings.

## Scope and method

The fan-maintained Super Mario Wiki documents 213 games in the original GBA/GameCube, 223 in Twisted, approximately 192 in Touched, 205 in Smooth Moves, 20 in Snapped, 116 plus 78 in D.I.Y./Showcase, 22 in Game & Wario, 316 in Gold, 222 in Get It Together and 223 in Move It. Numbers include remakes/returning microgames. We reviewed the catalogue family descriptions and game mechanics. A named-microgame popularity census is **not available**. Thus "most loved" cannot honestly mean an objective ranking.

**Evidence hierarchy:** (1) microgame gameplay descriptions from Mario Wiki (what actually happens), (2) repeated fan favourite mentions on Reddit (no causal popularity inference), (3) credible journalist design criticism, (4) itch.io WarioWare-like game rating counts (at game level only), (5) own suitability scoring on browser/mouse, clarity, feedback potential and speed.

## WarioWare catalogues reviewed

- [Series catalogue with per-entry counts](https://www.mariowiki.com/Microgame)
- [Original GBA game descriptions](https://www.mariowiki.com/List_of_WarioWare%2C_Inc.%3A_Mega_Microgame%24%21_microgames)
- [Touched: tap, rub, drag, draw, spin](https://www.mariowiki.com/List_of_WarioWare%3A_Touched%21_microgames)
- [Smooth Moves, movement/timing](https://www.mariowiki.com/List_of_WarioWare%3A_Smooth_Moves_microgames)
- [Gold: compilation with renamed/remade originals](https://www.mariowiki.com/List_of_WarioWare_Gold_microgames)
- [Move It: 223 including form-based gesture games](https://www.mariowiki.com/List_of_WarioWare%3A_Move_It%21_microgames)
- [Get It Together: character-control adaptations](https://www.mariowiki.com/Gallery%3AWarioWare%3A_Get_It_Together%21)

## Actual fan signals (small, nonrepresentative sample)

Recent [September 2026 favourites discussion](https://www.reddit.com/r/Wario/comments/1wqoxwr/whats_your_favorite_warioware_minigame/): named preferences include Wario Dance Company, Party Favor, a difficult driving boss, iconic nose-picking and retro-game themed microgames. [September 2024 favorites thread](https://www.reddit.com/r/Wario/comments/1fiisks/whats_your_favorite_warioware_microgame_of_all_time/): Wario Dance Company appears again, as do Hi, Wire!, fast mashing and phone pickup. [2024/2025 discussion](https://www.reddit.com/r/Wario/comments/1ewo94s/whats_a_your_favorite_microgame/) adds nail timing, Crazy Cars and touch games. The takeaway is that **rhythmic anticipation, immediate physical reaction, memorable surprise and one concrete hand action** recur. This is interpretive; small Reddit samples do not prove popularity rankings.

## WarioWare-like frontier

- [PortaBoy+](https://enchae.itch.io/portaboyplus): browser-playable one-button/one-mouse game, ~4.8/5 across ~415 ratings, short sessions. Shows a compact direct control scheme beats complexity.
- [CHEFWARE](https://retrocrow.itch.io/chefware): mouse-first job-themed microgame collection, ~4.9/5 over ~38 ratings, with boss after a high score. Direct adjacent comparison: **work-themed WarioWare can work without RPG systems**.
- [Spookware](https://papercookies.itch.io/spookware): ~4.7/5 over ~279 ratings, short simple horror challenges and cohesive theme; demonstrates the power of premise-specific microgames and presentation.
- [Dumb Ways to Die](https://www.dumbwaystodie.com/games): publisher lists 82 short varied original minigames; strong one-command, lively punishment principle.
- [Rhythm Heaven Groove review](https://www.gamespot.com/reviews/rhythm-heaven-groove-review-switch-2/): timing and performance reactions feel great, but strict timing without responsive controls is frustrating. Avoid uncalibrated swipe/motion gimmicks.

## Mechanic genome and shortlisted patterns

| Known WarioWare microgame | Physical mechanism | Office adaptation | Confidence in fan preference | Browser/mouse fit | Choice |
|---|---|---|---|---|---|
| Gold Digger / Party Popper / original HD Stamp Rush | One precision click, identifiable target, fast audiovisual pop | **STAMP!** click the verified moving form rather than spam | Gold Digger directly mentioned; HD liked | Excellent | **Build** |
| Up for Grabs / Butterfingers / Basket Case | Catch falling subject, quickly position catcher | **CATCH!** move safety tray under falling worker | Reused mechanics, no rank | Excellent | **Build** |
| Separation Anxiety / Cheap Thrill / original HD File Frenzy | Pick correct item, physical drag to recipient | **SHRED!** drag one spoofed envelope to a live paper shredder, spare payroll | Strong catalog archetype, not popularity proof | Excellent | **Build** |
| Taping a Leak / Party Popper | Clear 2-4 visible faults as timer drains | **PATCH!** tap bright alerts on angry monitor | Easy to understand, no individual fan rank | Excellent | **Build** |
| Stick a Fork in It / Over Easy / nail-driving | Anticipate one precise timing window | **FEED!** click when moving paper aligns with green copier slot | Timing skill repeatedly liked | Excellent | **Build** |
| Crazy Cars / Dodge Balls | Avoid incoming hazards while controlling avatar | **DODGE!** steer animated employee away from hostile screens | Crazy Cars cited directly | Good | **Build** |
| Wario Dance Company | Repeat precise short rhythmic pose pattern | Finger-sprint choreography with mouse? | Multiple positive fan mentions | Poor (motion/pose requires hardware or complex UI) | Reject for desktop |
| Hi, Wire! / Finish Line | Trace complete route with uninterrupted gesture | Draw network cable | Multiple fan mentions | Good, but legibility weak at 3 s | Later candidate, **not build yet** |
| Very Attractive | Drag under force field/hazard | Paperclip magnet rescue | Catalog-backed | Medium; physics overhead | Reject |
| You Break It, You Buy It | Swat pests but avoid surface cracking | Pop corporate intrusions | Catalog-backed | Medium; hard to distinguish harmless/critical under 3 s | Reject |
| Get It Together multi-character adaptations | Move hero with separate attack rules | Switch office character abilities | Mixed; more setup/complexity | Weak | Reject |

No pixel-art or screen assets from Nintendo games are copied. These are original office-themed executions of general game mechanisms. HD atlas is an original asset from this project and is retained.

## Release contract: the actual game, not prior v3

- **Six handcrafted mechanics, three escalating speed tiers, eighteen rapid-fire rounds plus two boss fights.** No level-ups, perks, character builds, skill draft, economy, loot or compulsory scrolling story. Two animated chapter intermissions offer optional research and explicitly player-controlled Continue.
- One big imperative; visible hand-action affordances; 3 lives; each microgame can be failed by actual mistakes and timeout.
- 4.8 s -> 4.05 s -> 3.35 s, with in-game velocity, target-size and hazard increases. No arbitrary tutorial pause.
- Response to action under 70 ms on desktop; immediate win/loss hit-stop, particles, audible rise/fall, and <0.5 sec transition.
- Responsive layout; no decorative objects unrelated to action; generated original HD cast sprites used for prominent characters and machinery.
- Authentic scoring increments only on real click/drag/catch/evade events. Stress tests should include missing input, wrong clicks, expired clock, input while paused, repeated completion, phone portrait and DPR2.
- No assertion of human enjoyment without human tests. Candidate must be playtested; if v3 is still visually better than this direction, preserve HD as fallback.

## What went wrong previously

The previous team optimized rubric coverage, story paperwork and deterministic score fixtures, not the moment of *understand -> attempt -> just miss -> nail it*. 16 microgames created a quality-control multiplication problem, and extra panels competed for attention. This revision intentionally discards those engines, while retaining the strong premise, HD art and meaningful research in this non-play document. The academic context remains optional in the two intermission research tabs (genre, portability, short-form media), with direct links to primary sources and a player-controlled break. See [the current research report](OFFICE_ATTACK_SHORT_PLAY_RESEARCH.md).
