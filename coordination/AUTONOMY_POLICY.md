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

## Delegated technical judgment: decide, build, prove

**The user has delegated ordinary engineering and creative judgment to the agents.** Assume the user expects you to pick the best feasible option, not to present incomprehensible implementation choices and wait for a response. The user is the product owner, not an on-call debugger, architect, Git operator or substitute QA engineer.

- **Go with your informed judgment.** Inspect the current implementation and GDD, identify the underlying failure, compare practical alternatives when useful, select the strongest *reversible* approach, implement it and test the outcome. You need not reach certainty before making a low-risk choice. A sensible decision tested in reality is preferable to indefinite deliberation or a question to a nontechnical user.
- **Technical uncertainty is YOUR problem to solve.** Compiler errors, test failures, import contracts, broken dependencies, package choices, browser quirks, coordinate transforms, race conditions, merge conflicts and missing optional tools are not user questions. Reproduce, research/inspect, repair and verify. If the first approach fails, try a mature alternative, a narrower isolated test, or a reversible adapter and continue.
- **Choose instead of forwarding choices.** Do not ask “Should I use X or Y?”, “Which implementation is best?”, “Do you want me to fix the errors?”, “Should I keep debugging?”, “Should I push/open the PR?”, or “Can I continue?”. These are delegated. Record important trade-offs in the PR, in plain language, **after** making and evaluating the decision.
- **Confidence should be proportional to reversibility.** Low-risk/reversible decisions: act immediately. High-impact but reversible design choices: prototype, inspect against Night Shift HD, measure and choose; do not demand a preference vote. Decisions that would irreversibly remove work, incur cost, disclose data, change public production or perform the actual university submission: request explicit approval where not already granted.
- **If a preference is genuinely missing, use established product invariants first.** Night Shift HD visual quality, full v3 content, zero-margin fullscreen with HUD overlay, Canvas2D + Planck.js, original physical comedy, course evidence, current branch ownership, and tested browser performance already settle most apparent choices. Do not manufacture ambiguity by ignoring the available design.
- **Escalate a problem only when all four are true:** (1) it materially prevents useful further work; (2) you have exhausted reasonable authorized investigations and reversible workarounds; (3) neither the GDD nor existing implementation/PRs settle it; and (4) the user genuinely has unique authority or a meaningful product preference that changes the outcome. If any test is false, **make the decision yourself and continue**.
- **When escalation really is unavoidable, translate it.** State the consequence in nontechnical terms, the option you recommend and why, and the *single decision* the user alone must make. Never paste an unexplained stack trace, API error or specialist jargon and expect the user to arbitrate it. Even then, finish other independent work and preserve a ready-to-resume PR.
- **A “blocker” is not an excuse to stop.** If a service/module is unavailable, work with a tested mock or the last known good interface; if a peer owns a fix, leave exact reproduction evidence and advance independent tests, visuals or other tasks within your lane. Report what was achieved and what remains, not “waiting for your instructions”.
- **No premature handoff.** Do not stop at diagnosis, an audit, a half-built preview, a green unit test, or a technical status explanation when more authorized implementation, real browser inspection and improvement can be completed within the active turn. Stop only after meaningful tested work is committed or a true external boundary is reached.

**Decision-loop shorthand:** `Understand the outcome → make the strongest grounded reversible choice → implement → test in reality → fix failures → record evidence → move to the next useful step`. **Autonomy means problem-solving responsibility, not speculative or reckless action.** Never invent a result to avoid admitting a blocker.

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
