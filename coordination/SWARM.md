# Night Shift HD v3 | parallel GitHub swarm

**NO USER-AS-DEBUGGER:** If a lane is blocked, the agent owns resolution or routes the reproducible fix to the relevant PR and continues useful parallel work. Do not send the user lists of blockers or ask them to tell you to proceed. Keep technical failures and unresolved gates visible in GitHub; report only factual completed results and truly necessary user decisions. See [autonomy policy](AUTONOMY_POLICY.md#no-blocker-dumps-to-the-user-own-route-resolve).

**DECISION AUTHORITY:** Agent-owned engineering judgment is delegated. If you can determine the best next action by inspecting/researching/testing, take it. Never interrupt the user for unexplained technical choices, errors, integration difficulties or whether to keep working. Follow [the four-part escalation test](AUTONOMY_POLICY.md#delegated-technical-judgment-decide-build-prove), continue all reversible work and make an actionable PR.

**AUTONOMY CONTRACT:** Read [AUTONOMY_POLICY.md](AUTONOMY_POLICY.md). The user is not managing seventeen conversations by answering routine questions. Claim your role, implement, test, fix defects and open a PR without asking permission or waiting for “continue.” Only authentic authorization boundaries warrant a question; chats cannot run after the turn completes. Write actionable handoffs.

**Integration target:** `rebuild/night-shift-v3-hd`, branched from `main`, fully distinct from `feat/first-shift`.
**Read first:** `AGENTS.md`, `REBUILD_HANDOFF.md`, `design/NIGHT_SHIFT_GDD_V3.md`, `design/TECHNICAL_INTEGRATION_CONTRACT.md`, `design/VISUAL_AUDIO_RELEASE_GATES.md`.
**Deadline:** cached Canvas CCDP10003 Monday 9 November 2026 23:59 AEDT, live verification required.
**Primary baseline:** `main:arcade-office-hd.html`. Avoid overwriting existing releases. **Never silently revert full v3 to the eight-card slice**.
**Engine:** Planck.js for physical 2D; Canvas2D for rendering; ZERO world margins, viewport-pinned overlay HUD.

## Atomic claiming protocol for many new chats

**Every fresh chat uses the same bootstrap prompt and chooses the first unclaimed lane in the priority list below.** GitHub's atomic create-file resolves races; no two agents should start on the same lane.

1. Read this LIVE file and fetch `rebuild/night-shift-v3-hd` HEAD, `coordination/claims/` directory, open PRs and recent commits. Do not rely on a pasted snapshot or assume another chat is still active.
2. Choose the **first unclaimed lane** below, unless it is clearly blocked and a lower lane can produce more immediate useful work; in that case justify your choice in the claim. If `coordination/claims/<LANE>.md` already exists, it is claimed even if you didn't see it in an earlier listing.
3. **Create** `coordination/claims/<LANE>.md` on the SHARED integration branch with GitHub's create-file API; NEVER update/write an existing claim to take it over. Body: chat role, timestamp, planned branch, unique owned paths, deliverable, dependencies and intended test. If the create fails because another chat raced you, refresh and claim a different lane.
4. After claim, create a unique branch `agents/v3-<lane>-<unique-suffix>` from the NEW latest integration branch HEAD. If using the Windows workstation, use a **new isolated git worktree**. Never `reset --hard`, `clean`, force push, overwrite a shared user's checkout, delete files or change main.
5. Implement/test the lane. Use its exact owned paths, self-contained browser preview and test. Do not edit other owners' files, `REBUILD_HANDOFF.md`, `AGENTS.md`, `SWARM.md` or `main`. If a shared contract needs changing, submit an interface proposal in your own report/PR for LEAD review.
6. Commit/push artifacts to lane branch and open **draft PR targeting `rebuild/night-shift-v3-hd`** (not main). Include run commands, actual test outputs, screenshots/recordings where possible, limitations, integration steps, commit SHA and a human-readable GDD checklist. A plan-only PR does not count as completed work.
7. Upon completion, update ONLY your owned claim with `done`, PR URL, evidence, and remaining blockers using SHA-checked update. Do not claim 24/7 wakefulness, background persistence or cross-chat communication; GitHub commits are the shared memory. The user can launch more chats or resume one if needed.

**Do not create a GitHub Projects board or new workflow service as a prerequisite.** Issues were disabled at last check. Claims + reviewable PRs + existing Actions suffice.

## Independent role inventory and exclusive paths

**Priority = initial claim order.** Domain-specific roles are disjoint by directory. A single chat picks ONE lane, not all of them.

| Order / lane ID | Responsibility and concrete deliverable | **Owned code/tests (only)** |
| --- | --- | --- |
| **01 LEAD** | Astra integration lead: boot an **HD-faithful** additive v3 route; real title/first-card/intermission quality gate; wire modules, review PRs and run complete integrated release. Cannot silently claim other lanes. | `night-shift-v3.html`, `night-shift-v3/app.js`, `night-shift-v3/runtime/{director,transitions}.js`, `previews/v3-lead*`, `qa/v3-lead*`, `coordination/reports/lead-*` |
| **02 RENDER** | Fullscreen responsive camera and world, real viewport-edge overlay HUD/input, 4K/ultrawide/narrow fidelity, retain HD title/body composition through a renderer adaptor. | `night-shift-v3/runtime/{viewport,input,hud,renderer}.js`, `night-shift-v3/styles/**`, `previews/v3-render*`, `qa/v3-render*`, `coordination/reports/render-*` |
| **03 ART** | Expressive *HD-or-better* original 2D cast art, paper-theatre props, animation states, machine pieces, material/VFX and actually inspected character preview. | `night-shift-v3/art/**`, `assets/night-shift-v3/art/**`, `previews/v3-art*`, `qa/v3-art*`, `coordination/reports/art-*` |
| **04 AUDIO** | Licensed/original responsive musical score normal/promotion/boss, detailed SFX, precise event triggering, mute/accessibility, actual audio play QA. | `night-shift-v3/audio/**`, `assets/night-shift-v3/audio/**`, `previews/v3-audio*`, `qa/v3-audio*`, `coordination/reports/audio-*` |
| **05 PHYSICS** | Planck.js only, tested world/contacts/drag/flick, physically convincing office toy props, fixed timestep, deterministic/CCD, browser playable desk demo. | `night-shift-v3/physics/**`, `assets/night-shift-v3/vendor/**`, `previews/v3-physics*`, `qa/v3-physics*`, `coordination/reports/physics-*` |
| **06 SYSTEMS** | Full 16-card/12-run seeded deck, five directives, five legal upgrade drafts, eight perks L1/L2, 8 synergies, immutable ledger, honest 2-metric scoring and tests. | `night-shift-v3/systems/**`, `previews/v3-systems*`, `qa/v3-systems*`, `coordination/reports/systems-*` |
| **07 INTAKE** | I1-I4 physically joyful early onboarding, spam vs real Mira help, fast readable stamp/shred/popups/copy. A real independent playable preview. | `night-shift-v3/scenes/intake/**`, `previews/v3-intake*`, `qa/v3-intake*`, `coordination/reports/intake-*` |
| **08 SERVICES** | S1-S4 filing/catching coffee/printer unjam/cable, real Mira consequences and learned mechanics for Printer Mutiny. | `night-shift-v3/scenes/services/**`, `previews/v3-services*`, `qa/v3-services*`, `coordination/reports/services-*` |
| **09 PR** | P1-P4 truthful graph/chart, pop-up cover/real help, slide hold, actual headline/context causality. | `night-shift-v3/scenes/pr/**`, `previews/v3-pr*`, `qa/v3-pr*`, `coordination/reports/pr-*` |
| **10 STAFF** | T1-T4 rescue/exit/clock/licences, two real $40 tokens, actual visible assistance and causal outcomes. | `night-shift-v3/scenes/staff/**`, `previews/v3-staff*`, `qa/v3-staff*`, `coordination/reports/staff-*` |
| **11 PRINTER** | Printer Mutiny boss three actual telegraph → jam/page-pull → feeder-counter cycles; animation/sfx hooks, all routes, no HP spam. | `night-shift-v3/bosses/printer/**`, `previews/v3-printer*`, `qa/v3-printer*`, `coordination/reports/printer-*` |
| **12 QUOTA** | THE QUOTA real three counter phases, 4 unique FILE/COOL packets, directives, visible module assembly/destruction and giant physical CLOCK OUT. | `night-shift-v3/bosses/quota/**`, `previews/v3-quota*`, `qa/v3-quota*`, `coordination/reports/quota-*` |
| **13 STORY** | Diegetic Night Shift HD-inspired email/workbook promotion breaks, lore/state reactions, source-bearing optional context, *not* academic interruption; valid two-metric ending. | `night-shift-v3/story/**`, `previews/v3-story*`, `qa/v3-story*`, `coordination/reports/story-*` |
| **14 QA_VISUAL** | Independent *real rendered* comparisons HD vs new (title/card/draft/boss/ending), 1080p/1440p/4K/ultrawide/portrait, screenshot defect-fix cycles. | `qa/v3-visual*`, `previews/v3-visual*`, `coordination/reports/visual-*` |
| **15 QA_GAME** | Independent real Playwright complete run, seeds, perks, all 16 cards, both bosses, fair input, score masks, pause/replay and state probes. | `qa/v3-game*`, `previews/v3-game*`, `coordination/reports/gameqa-*` |
| **16 COURSE** | CCDP assessment evidence across 4 rubric dimensions, prior instructor feedback, verified links/research and real gameplay evidence, with zero didactic hostage-taking. | `qa/v3-course*`, `coordination/reports/course-*` |
| **17 RELEASE** | One GitHub Actions workflow, Pages relative assets and deploy strategy, fresh-browser public URL QA, unchanged legacy routes, rollback/report; never falsely claim published. | `.github/workflows/night-shift-v3.yml`, `qa/v3-release*`, `coordination/reports/release-*` |

If a lane's directory doesn't exist, create it **inside that lane's own branch**. Other agents can import/inspect it but not preemptively populate it. Prefix report and QA files with lane-specific strings to avoid collisions.

## Real-time collaboration and integration semantics

- The shared source of truth is the GitHub integration branch and its claims. **ChatGPT sessions do not talk directly or remain active after a turn**, and an old claim does not imply a process is running. Agents are still responsible for producing a complete, reviewable PR in their turn.
- LEAD is responsible for triage, checkout of independently verifiable PRs, interface compatibility, real browser visual acceptance, cherry-pick/merge after testing and keeping builds runnable. It must not automatically accept modules that merely pass tests but regress HD.
- Independent agents may run full feature demos with mock services before shell integration. They must provide clear `create(context)` exports per technical contract rather than fork the whole game.
- If merging would conflict, use source-level surgical reconciliation, never blanket overwrites. A lane's test failures are not a reason to overwrite another lane; record cause and delegate to owner.
- The source GDD and the project handoff can be amended only by LEAD with the user's clearly stated approval for a major scope change; no one may unilaterally trim the v3 card roster or drop a boss to claim success.

## Communication template for a delivered PR

```markdown
Lane: <LANE>
Branch: agents/v3-<lane>-<unique>
Preview URL / command:
Owned paths changed:
Exact GDD criteria satisfied:
Real tests run and results:
Actual screenshots/recordings (viewport+state):
Quality comparison against HD (specific wins/losses):
Dependencies / integration instructions:
Known defects, stop conditions and proposed fix:
PR URL and commit SHA:
```

**Success is a better game**, not the number of PRs, the number of Markdown files or the number of agents claiming jobs.
