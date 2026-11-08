# CCDP10003 Project 2 | Game research and rubric implementation contract
Date: 8 November 2026. Applies to Quota Panic: First Shift candidate, not the archived editions.
Official assignment: https://canvas.lms.unimelb.edu.au/courses/239834/assignments/658087
This document is **binding for Codex**, read together with CODEX_HANDOFF.md and AGENTS.md.

## The brief, actually checked
Canvas title: **Project 2: Exploring Gaming Culture**. The brief permits video games as research, alongside books, articles/interviews, filmed discussions, blogs, websites and social media; it asks the student to critically engage with contemporary gaming culture. For the **Full Game Design** format, the output should be a prototype or immersive full-interactive design, **"show and do, don't tell"**, in-game tutorial style. **The design's research reasoning ("why this game", "why now") and sources must be integrated into the in-game tutorial, so the game is one cohesive package.** Criteria are four equally weighted 25-point categories: (1) class topics and game-inspired strategies, (2) critical engagement with relevant gaming culture, (3) inventive communication (visual/aural), (4) clarity. Deadline: Monday 9 November 2026 at 11:59 pm AEDT. **Submission:** full game design via playable URL, NOT MP4/ZIP/RAR/Google Drive as final submission. Latest synced status at time of drafting was unsubmitted; re-check. The full design must be demonstrably developed from the Project 1.1/1.2 office-game proposal, not a new unrelated project.

## Primary research A: Dumb Ways to Die (2013) | microgame grammar, playful communication
- Primary/authoritative game source: Games for Change (game listing, mechanics, release): https://www.gamesforchange.org/games/dumb-ways-to-die/
- Original creative/animation director Julian Frost: https://julianfrost.co.nz/work/dumbwaystodie/ . Frost explicitly states the mobile game was **inspired by WarioWare** and converted scenes into microgames exploiting silly phone interactions.
- Original game-design account (designer): https://tinywideopenspaces.com/home/portfolio/dumbways.html
- Official franchise history: https://www.dumbwaystodie.com/about

**Observed documented design principles:** short legible objective; immediately meaningful tap/drag/tilt actions; expressive failures; 3 lives, escalating speed; surprise/humour; campaign theme communicated through play. The broader game grew from Melbourne's rail safety campaign (2012), demonstrating an entertainment-first approach to a message.
**Design response:** First Shift stages should use one imperative and learnable pointer grammar, react expressively on success/failure and escalate. Office work becomes absurd spectacle. Character design must be original and recognisable, not Dumb Ways beans, borrowed poses, music, sprites, names or microgame scene cloning. We are NOT copying tilt/blow mobile gestures into desktop UI.
**Critical limitation:** A 2014 Australian Council on Children and the Media review warns some dangerous activities may feel trivialised by their comic depiction: https://childrenandmedia.org.au/app-reviews/apps/dumb-ways-to-die . This is an interpretation of the game, not proof that safety behaviour worsened. First Shift must avoid glorifying employee harm or trivialising serious workplace issues; help characters and repair damage visibly. Failures stay comic and recoverable.
**Our deviation:** Unlike standalone random microgames, First Shift carries consequence and build state across stages. The stakes are measuring productive work, not trivialising a safety message.

## Primary research B: Brotato (2023) | roguelite progression, synergistic builds, wave rhythm
- Blobfish creator factsheet: https://blobfishgames.notion.site/Brotato-cb88a14520ba4703ae9aed4ab438427c
- Steam developer storefront: https://store.steampowered.com/app/1942280/Brotato/
- Godot creator showcase: https://godotengine.org/showcase/brotato/

**Documented mechanics:** top-down arena roguelite; auto-firing with optional manual aim; waves of about 20–90 seconds; between-wave shop with collected material; up to six concurrent weapons; traits/items creating varied builds; fast runs; player-facing accessibility sliders.
**Design response:** each two-microgame department concludes with a deliberate upgrade choice. Perks persist and combine; each must alter play across challenge types or the final boss. New directives escalate player pressure with visible rules, not hidden input changes. Boss should test chosen build, not reset abilities. Clear fail/retry rhythm and repeatable seeded runs. **Do not claim an arcade microgame is literally a Brotato survival wave or import auto-shooting just to be faithful.**
**Critical limitation:** Some critics praise Brotato's accessibility and build choices while noting limited enemy/arena variety and combat depth: https://www.metacritic.com/game/brotato/ . The relevant risk for First Shift is a static backdrop and passive bonuses. Countermeasure: eight visibly different interactions, meaningful perk activation, tactile deliberate input, changing office consequences.
**Our deviation:** Brotato upgrades arena combat; First Shift upgrades mixed office microgames, with care/production tradeoffs and two score perspectives.

## Authoritative creative formula | not a workplace-gamification thesis
**Dumb Ways to Die = MICROGAMES. Brotato = ROGUELITE. Quota Panic = A JOB AS A TOY.** This is the user-approved conceptual frame and outranks older wording that casts the game principally as an employer-gamification critique.

**Research question:** *How can the interaction grammar of microgames and the progression grammar of roguelites transform ordinary office tasks into compelling playful experiences?*

- **Dumb Ways to Die contributes moment-to-moment design:** one brief imperative; playful physical gestures, surprising variety, readable stakes, expressive comedy.
- **Brotato contributes run-scale design:** upgrade decisions, coherent builds, increasing demands, replayability, trade-offs, player mastery.
- **Quota Panic contributes a distinctive play space:** an office as a tactile toybox. Stamp, fling, catch, juggle, route and operate ridiculous machines; office jobs are funny playable objects, not an essay topic. Corporate satire is the flavour and source of changing rules, not a mandatory lecture.
- **Our creative synthesis** is not generic gamification. The two game mechanisms meet inside one materially interactive office environment where upgrades carry between different microgames. Research is evidenced by this execution and explained in a few well-designed in-game cues.

**Critical engagement:** identify the affordances and limits of the two source games and show a deliberate response. DWTD excels at instant play but its disconnected microgames give limited long-run build strategy; Brotato excels at builds but its primarily repeated arena combat does not provide the variety of bespoke interactions. Quota Panic attempts to retain variety **and** strategic continuity, accepting a higher design burden of shared perk effects. Discuss this honestly as a design proposition rather than a proven superiority claim.

**Secondary interpretation, never the compulsory premise:** the game can playfully reference productivity culture, metrics and corporate absurdity. Optional post-play two-score receipt can provoke questions about what performance measures capture or omit. This is not the primary game-culture research question, and the ending must not moralise or punish the player for enjoying optimisation. Supporting work on gamification is optional background, subordinate to researched game-design mechanics; no need to foreground a workplace-ethics argument in tutorial or campaign.

### Secondary sources, if needed for optional context
- Butler, N. & Spoelstra, S. (2024), *Redemption Through Play? Exploring the Ethics of Workplace Gamification*, Journal of Business Ethics, DOI https://doi.org/10.1007/s10551-023-05584-w .
- *Game on! Antecedents and consequents of gamification in the workplace* (2024), Journal of Workplace Learning, DOI https://doi.org/10.1108/JWL-09-2024-0193 .
- Deterding et al. (2011), *From Game Design Elements to Gamefulness*, DOI https://doi.org/10.1145/2181037.2181040 .
These are contextual sources only; do not let them displace video-game design research.

## Required actual in-game research, not a citation-only menu
Design an interactive **in-game tutorial** under 30 seconds, not a skippable unexplained research essay. Demonstrate and immediately let the player do an action. Source URLs must be visible/accessible in the game and on the final source ledger. Player should know the *why* from playing, not from later reading.
**Proposed editorial language, subject to editing for legibility (no invented personal autobiography):**
- Title/first action, one brief in-world cue while actually stamping: **"WHY THIS GAME? What if doing a ridiculous office job felt as fun as playing a game?"** Direct links labelled **Microgame research: Dumb Ways to Die (2013) ↗** and **Roguelite research: Brotato (2023) ↗** should be accessible in the same natural tutorial flow (not a compulsory interrupt).
- After the first two microgames, at the FIRST actual upgrade decision: **"WHY NOW? Tiny challenges are fun. What if each one made you better at the next?"** Show actual perk choice and preview how it changes a later office toy; use a short, optional comparison of Dumb Ways to Die's microgame approach and Brotato's persistent builds. Do not stop play for a lecture.
- Early short in-world note tied to a **playable** decision: "FAST or SAFE? Different tools, different tricks." Let the player physically try it. Corporate humour is welcome; presenting an ethical verdict is not required.
- Final score reveal: celebrate the actual play, acquired build and funny office consequences; two arithmetically honest scores can still show different dimensions of the run, but avoid a sermon. Source credits show explicit game-design comparisons; context about productivity metrics is optional.

**Alternative UI:** Aster Mail may carry these notes between rounds, but only if first-time completion requires naturally noticing a small portion of the explanation; an optional sources drawer alone cannot satisfy "research reasoning into your in-game tutorial". Keep direct links with legible labels and author/year or studio/year.

## Before/after distinction table to test in actual gameplay
| Borrowed study mechanism | First Shift implementation | Critical transformation | Proof |
|---|---|---|---|
| Dumb Ways short comic prompt | I1 and I3 actions, first <15 sec | One interconnected work shift | measured first input + screenshots |
| Dumb Ways escalating speed/failure | clear timers + repeated character gags | recovery, care consequences instead of morbid punishment | time/fail/retry recordings |
| Brotato shop/wave loop | perk draft after two challenges | upgrade affects at least next two cards or boss | assertion + visual recording |
| Brotato build differentiation | Throughput / Precision / Care families | choices affect what the company measures and worker help | three complete differently built runs |
| Brotato legible action amidst chaos | directive modifies arena | human-readable announced rule with fair counterplay | directive E2E |
| Two games' replay appeal | seed + repeatable choices | same shift receives two non-falsified scoring interpretations | replay, 16 boss masks, ledger tests |

## Non-negotiable rubric gates
1. **Class/game strategy 25:** show 2+ real gameplay manifestations each of microgame interaction, repeatable game loop, item economy, feedback, risk/reward, mastery; include actual class-specific vocabulary only where source-backed.
2. **Gaming culture 25:** actual two primary games with citations, explicit comparison of their different design traditions, an original synthesis and considered limitations/counterarguments; modern game-design culture is the focus. Workplace metrics or gamification may appear as secondary interpretation only. No invented findings. Detective/courtroom quiz is forbidden.
3. **Inventive communication 25:** vivid original artwork, sound, expressive characters, text integrated into interaction, meaningful physical boss and ending; no slides-with-buttons.
4. **Clarity 25:** a stranger understands objective without reading the GDD; tiny in-context primer and UI credits; every source link accessible; meaningful clear fail/success and the two metrics correctly described.
5. **Project continuity:** retain characters/theme/mechanics from previously proposed AsterOS office-survival project (office, emails, upgrades, ads, deadlines, productivity incentives, coworker choices, quota boss). In-game title, opening and source notes should make evolution evident.
6. **Source rights:** cite games for criticism/inspiration, but never embed copyright music, their sprites, copied art or unlicensed gameplay footage. Cite creator primary sources and the official game pages directly.
7. **Academic honesty:** no claims of interview, own playtest, inherited personal motivation or student voice unless evidenced/approved. No required AI declaration. Full game URL format for Canvas, not a ZIP upload.

## Codex acceptance checklist
- During first 15 seconds, at least one genuine input and feedback, plus a concise research *why* visible during tutorial flow.
- By first promotion the user has encountered **both named research games** in an unobtrusive source cue, not just generic design theory.
- Two studies materially change mechanics (cross-microgame builds, short funny prompts); two credible limitations actively addressed.
- Final scores honestly capture the original ledger; a player can explain the design synthesis (microgames + roguelite progression + office toy) after play, no essay required.
- Sources tested as clickable links from real on-screen UI at 1024x600 and 650x800; no instructional overlay prevents play.
- Existing original game passes QA and candidate game visually assessed independently; unmodified public release until promotion gate.
