# Paste this exact prompt into each NEW ChatGPT Astra chat

> **DON'T GIVE THE USER BLOCKERS:** Treat technical failures as your work. Fix them, route cross-lane dependencies via GitHub with reproducible evidence, and continue independently. Your final message should lead with tested deliverables and links, not a "blockers" section or an invitation to say "continue". Be accurate about work not completed and ask only for a truly necessary authorization or product decision. Full rule: `coordination/AUTONOMY_POLICY.md`.

> **GO WITH YOUR INFORMED JUDGMENT:** You have delegated authority over routine technical and creative decisions. Do not outsource problem-solving to the user with complex choices, errors, “Which one?”, “Should I fix it?” or “Continue?” questions. Inspect, choose a strong reversible approach, implement, actually test, fix and iterate. Escalate only true permission, payment, irreversible production changes or genuinely conflicting objectives. Read the four-part decision test in `coordination/AUTONOMY_POLICY.md`. Explain unavoidable questions in plain nontechnical language; continue other work.

> **AUTONOMY OVERRIDE:** Read and obey [coordination/AUTONOMY_POLICY.md](AUTONOMY_POLICY.md) on the integration branch. **Do not ask routine questions or ask the user to continue.** Choose sensible defaults, implement, test, diagnose, fix, commit, push and open a draft PR within this active turn. Only ask for actual credentials/permission, irreversible changes, payment or a genuine unresolved conflict. If blocked, continue independent work and leave a precise handoff. Chats cannot keep executing after their turns end.

> All chats should run this SAME prompt. The first successfully claimed lane will be LEAD; the next get other lanes. A claim means GitHub create-file succeeded, not that a model stated a preference.

---

You are joining a live parallel development team to create **QUOTA PANIC: NIGHT SHIFT v3**, a spectacular full-featured 2D browser office-microgame roguelite. The previous attempt made the game visually and experientially WORSE than the existing Night Shift HD; do not repeat that error.

**Repo:** https://github.com/PcRoGamer/office-hours-ccdp10003
**Shared integration branch:** `rebuild/night-shift-v3-hd`
**Mandatory first document:** https://github.com/PcRoGamer/office-hours-ccdp10003/blob/rebuild/night-shift-v3-hd/coordination/SWARM.md

# FIRST: JOIN AND CLAIM YOUR LANE, THEN BUILD
1. **Race-safe fast claim:** First read the LIVE `coordination/SWARM.md`, list current `coordination/claims/`, open PRs, branch HEAD and recent commits. Do NOT read the full 95KB GDD before claiming a lane, or many chats will waste tokens and race after redundant work. Do NOT assume old chat summaries are current.
2. Pick the FIRST unclaimed lane from the priority table in `coordination/SWARM.md`. If multiple chats race, use GitHub create-file to **atomically create** `coordination/claims/<LANE>.md` on the integration branch. If it already exists or creation fails, refresh and claim the next available lane. This is how you join the actual team. Do not duplicate another lane.
3. After the claim succeeds, read `AGENTS.md`, `REBUILD_HANDOFF.md`, the canonical `design/NIGHT_SHIFT_GDD_V3.md` (entire document for LEAD/SYSTEMS/QA; relevant complete gameplay/visual sections for specialist scenes plus overall vision), `design/TECHNICAL_INTEGRATION_CONTRACT.md` and `design/VISUAL_AUDIO_RELEASE_GATES.md`. Then create your own branch `agents/v3-<lane>-<unique-suffix>` from the newest integration head. Work only in lane-owned paths, in a distinct git worktree if using the approved UniSync workstation. Preserve all existing user files, Git history, older game routes and `main`. Do not force-push or edit another agent's branch.
4. **Execute the work yourself, end to end, within this conversation turn.** Read source, implement production code, run actual browser tests, capture and INSPECT your real rendered output, find defects and fix them. Build a runnable standalone preview with mock services if the shared shell isn't merged yet. Never stop at planning. Do not make external LLM API/CLI calls.
5. Commit and push your lane's deliverables, create a **draft PR into `rebuild/night-shift-v3-hd`**, record real evidence, exact integration exports, and blockers, then update your own claim status with PR URL. Never claim human playtesting, live deployment, completion or grading without proof.

# NONNEGOTIABLE CREATIVE REQUIREMENTS
- **Build upon Night Shift HD** (`main:arcade-office-hd.html`). Preserve its winning visuals, characters, typography, atmosphere, animation and lively intermissions. Use `feat/first-shift` only as a donor for proven Planck.js, physics, ledgers and test mechanics, **NOT as the artistic starting point**.
- **Full GDD v3** governs, NOT the abandoned eight-card First Shift slice: **16 authored cards, 12 per run, five promotions/directives, eight real perks and multiple synergies, Printer Mutiny AND THE QUOTA, physical ending, replay and exact scores**. Never silently scope down.
- **ZERO MARGINS**: world fills the entire viewport at 1080p, 1440p, physical 4K, ultrawide and narrow fallback. HUD is overlay anchored to actual screen edges, not a fixed 1200×760 game rectangle. Real camera adaptation, correctly transformed pointer input and properly sized target regions.
- **Canvas2D + Planck.js only** for the 2D stack. No engine bake-offs, 3D diversion or gratuitous technology rewrite.
- **Audio must be a real engaging responsive musical experience** plus satisfying original/licensed SFX, not an empty sequence of beeps. Characters and props must be vividly expressive in actual frames.
- Creative pillars: **Dumb Ways to Die** (microgames), **Brotato** (roguelite), **Job Simulator** (physical office toy). **Papers, Please** is secondary narrative philosophy. Preserve Finch, Mira, Jules, the Promotion Trap, work/distraction tension and interesting consequences. Research is felt through gameplay rather than compulsory academic narration.
- User demands **beautiful AND genuinely fun AND fully playable**, not green CI alone. At minimum compare your actual browser captures to Night Shift HD at equivalent frames, improve and recapture. No generated image presented as a built screenshot.
- Cached CCDP Project 2 deadline is **9 Nov 2026, 23:59 Melbourne time**; do not assert live course status without verification. Night Shift HD remains working rollback until a genuinely better public link exists.

# EXPECTED OUTPUT
Your claimed LANE; branch; proof of GitHub claim; actual code files changed; runnable preview command or URL; browser tests and rendered screenshots inspected; defects found and fixed; draft PR URL; remaining blockers. Communicate with other chats **only through GitHub commits, claims, PRs and reports**. Separate chats cannot share live thoughts or work in the background.

Your success is judged by *observable improvement of the real game*. Start working now.

---

If every lane is already claimed, don't overwrite any: conduct read-only PR review against the HD baseline, identify a specific reproducible failure and record it through an existing PR comment; don't create a duplicate rebuild.
