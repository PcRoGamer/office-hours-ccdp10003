# QUOTA PANIC: NIGHT SHIFT v3 | HD-first rebuild

**This branch is a production starting point, not a claim of finished software.**

**Primary browser baseline:** [Night Shift HD](https://pcrogamer.github.io/office-hours-ccdp10003/arcade-office-hd.html)

**Source:** `arcade-office-hd.html` on `main`, with `arcade-v3.html` and `arcade-office-genai.html` as selective references. **Do NOT use the weaker First Shift presentation as the new base.**

## Read in order
1. [AGENTS.md](AGENTS.md) (every agent)
2. [REBUILD_HANDOFF.md](REBUILD_HANDOFF.md) (objective and scope)
3. [Full canonical NIGHT SHIFT GDD v3](design/NIGHT_SHIFT_GDD_V3.md)
4. [SWARM](coordination/SWARM.md) (parallel role claims)
5. [New-chat starter prompt](coordination/NEW_CHAT_PROMPT.md) (paste into many Astra chats)
6. [Technical integration contract](design/TECHNICAL_INTEGRATION_CONTRACT.md)
7. [Visual/audio/release gates](design/VISUAL_AUDIO_RELEASE_GATES.md)
8. [Source/art baselines](design/BASELINE_SOURCES.md)
9. [Independent First Shift failure analysis](design/PRIOR_REBUILD_FAILURE_AUDIT.md)
10. [Course research](design/CCDP_PROJECT2_GAME_RESEARCH.md) and [rubric evidence](design/CCDP_COURSE_ALIGNMENT.md)
11. [Locked Planck integration reference](design/PLANCK_PHYSICS_REFERENCE.md)

## Current status
- **Approved design:** Night Shift HD base + full v3 GDD, real viewport-anchored HUD, Planck physics, original interactive music and expressive art.
- **Branch:** `rebuild/night-shift-v3-hd`, forked from `main`. Existing Night Shift HD is unchanged.
- **Game implementation:** Not yet created by these documents. The prior First Shift branch is separate and may be used as a donor.
- **Open lanes:** Check `coordination/claims/` **live**. Do not presume nobody else is coding.
- **Release:** new additive `night-shift-v3.html` route only after QA; don't conflate a GitHub file link with a public playable release.
- **Grade:** rubric optimisation is a goal; no score guaranteed.
- **Deadline:** cached CCDP10003 submission due Mon 9 Nov 2026 23:59 AEDT; confirm live Canvas before taking irreversible action.

**Parallelism without collision:** each new chat atomically claims a distinct lane, pushes its own branch, and opens a draft PR into the rebuild branch. LEAD integrates only after real browser, visual, physics, audio and gameplay checks. GitHub is the coordinator, not a promise of background agents.
