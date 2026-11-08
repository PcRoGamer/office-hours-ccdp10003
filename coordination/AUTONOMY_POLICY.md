# Night Shift v3 | autonomous execution and no-routine-questions policy

**Binding instruction for every agent/chat working on `rebuild/night-shift-v3-hd`.** The user is launching many parallel chats and **does not intend to supervise each one**. Treat their kickoff prompt and this shared repository as authorization to execute the assigned, reversible development work. This document overrides any earlier language that treats routine choices as approval gates.

## Default behavior: execute, don't solicit

1. **No routine clarifying questions.** Resolve architecture details, API differences, wording, implementation options, test coverage, naming, layouts, compatibility, dependency installation, screenshots and integration issues using the canonical GDD, code, peer PRs, available tools and sensible defaults. Do not ask the user to choose between ordinary reasonable options.
2. **No "shall I proceed?", "want me to continue?", "may I fix this?", "should I open a PR?"** These actions are included in the original assignment. Continue directly through implementation, rendering, browser evaluation, failure diagnosis, revision, tests, commit, push and draft PR, all within the active turn.
3. **Use best available capabilities**, not tool limitations as product requirements: discover configured GitHub/UniSync/desktop tools, mature software and browser test harnesses where appropriate. If a useful capability is missing but another authorized route exists, use that route. Do not compensate for poor access with invented screenshots, fabricated measurements or an empty plan.
4. **Work until a concrete handoff exists.** If dependencies are still in flight, create an independently executable component/preview with a narrow documented mock and contract-compliant exports. Run tests; inspect real screenshots; fix problems found. A status-only message, mock screenshot, outline, or half-written PR is not the intended deliverable.
5. **Take ownership of repair.** If a test fails or visual comparison exposes a defect, diagnose and fix it within your lane, retest and document evidence. Do not hand the ordinary repair decision back to the user. If the fix requires another lane's files, make a reproducible failing test/report and communicate through PR comment; do not violate ownership.
6. **Do not silently lower ambition.** Full v3 GDD remains binding: sixteen cards, twelve per run, eight perks, five promotions/directives, both bosses, HD-or-better art/audio, fullscreen zero margins and real HUD. An agent may make local simplifications only if full requirements remain achievable. If it cannot complete every requested feature within the turn, commit the strongest tested partial contribution and explicitly label unmet gates; don't redefine success.
7. **Efficient communication.** Short factual progress updates are fine. Do not block work awaiting a reply to a trivial question. Ask only when a decision cannot be settled from grounded context and materially changes user goals.

## When you really must stop for approval

**Ask only for a genuine authorization boundary**, while completing all other independent work:
- New credentials, accounts, login/consent, private data access, paid API usage, purchases, changes to billing, permissions not already granted.
- Irreversible/destructive operations, removing another agent's commits, modifying existing public game routes, merging to `main` or overwriting a production release, publishing into a user account if not separately authorised, and actual Canvas submission if approval/access is required.
- A true conflict between user objectives or a preference that would radically change the final product and cannot be resolved from the GDD.
- An inaccessible tool where all supported authorized alternatives were checked and no safe path exists. Explain the exact blocker and preserve work as a commit/PR.

**Do not** use external LLM API/CLI calls, spend money, bypass controls, leak credentials, guess approvals, delete other agents' work or force-push to resolve a blocker.

## No fake background autonomy

A ChatGPT chat **does not keep executing after its turn ends**, and multiple chats cannot share hidden thoughts or automatically wake one another. Do not claim to be working continuously or promise a later delivery. Instead, within the current active turn:
- Finish the most valuable concrete lane-owned deliverable that available tools permit.
- Push code/tests/screenshots or an honest blocker report, open or update draft PR, and write exact next actions in the owned claim/PR so a later turn or another agent can resume without asking the user to repeat anything.
- Make continuation **self-describing**: branch name, completed tests, untested assumptions, last successful artifact/commit, next executable commands, dependency/PR and exact quality gate. Do not ask the user "continue?" just because further work exists.

If the user later sends another message in a chat, read its previous PR/claim state and resume execution directly; do not restart analysis from scratch.

## Coordination protocol

- Read [SWARM.md](SWARM.md). Atomic claim file before editing; separate branches and worktrees; PRs target `rebuild/night-shift-v3-hd`.
- Assume other chats may be writing concurrently. Re-fetch before file updates, respect SHA checks and resolve races by refreshing; don't demand the user arbitrate Git conflicts unless major irreversible changes are involved.
- Lead integrates and rejects modules using actual game-quality evidence. Specialists shouldn't wait for the lead to provide a perfect mock: create a compatible preview and work independently.
- Every PR includes actual source changes or executable tests, real verification, the HD comparison and exact unresolved issues.

**Success criteria:** independently useful, tested, reviewable progress with minimal user interruptions and no misleading assertions, repeated until the completed game passes its acceptance gates.
