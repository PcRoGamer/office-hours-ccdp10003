# CCDP10003 Project 2 | Independent COURSE lane evidence & regression gate

**Date:** Sunday 8 November 2026 AEDT
**Integration:** `rebuild/night-shift-v3-hd`. **COURSE-owned branch:** `agents/v3-course-gpt6-b291`.
**Scope:** course/rubric compliance and independently executed source/browser auditing, **not** claim that full Night Shift v3 gameplay has been built.
**Executable artifact:** `qa/v3-course-evidence.cjs`, no required external LLM calls. Optional Playwright/Chromium (Windows Edge supported). Actual self-test and source audit run in isolated Windows Git worktree.

## Actual executed checks

1. **Node v24.20.0 `--check`: PASS.**
2. **`node qa/v3-course-evidence.cjs --self-test`: PASS** with marker `V3_COURSE_GATE_SELF_TEST_PASS` after fixing one real boolean-assertion defect in the first run. This failure was observed and corrected, not hidden.
3. **`node qa/v3-course-evidence.cjs`: four specification checks PASS, one source-hierarchy check FAIL, five production criteria PENDING.** Exit code 1 expected while the contradictory inherited course-document hierarchy remains; the tool deliberately doesn't fake success.
4. **`node qa/v3-course-evidence.cjs --url=https://pcrogamer.github.io/office-hours-ccdp10003/arcade-office-hd.html`:** real Playwright 1.58.2 + Windows Edge browser test. HTTP **200**, visible Canvas, **no page exceptions**. Status `SMOKE_ONLY`; no claim of complete gameplay.
5. Opened the incumbent's actual **THE REAL RESEARCH** panel and inspected its visible DOM links. It has **five real external links** (work gamification, interrupted work, MDA, Persuasive Games, workplace gamification ethics), but **not the new directly studied three-game combination** as visible source links in this observed panel. The new v3 game must add accessible Dumb Ways to Die, Brotato and Job Simulator primary citations and a direct comparison while preserving HD's presentation quality. The older gamification framing is an incumbent snapshot, **not** the final v3 research focus.
6. At this branch's design-only head `night-shift-v3.html` is absent, so actual v3 tutorial, direct playable research, production music/visuals, complete campaign, public v3 URL and human engagement are honestly **PENDING**.

**Local actual artifact output:** `C:\Users\Admin\work\nightshift-v3-course-gpt6-b291\qa-artifacts\v3-course\audit.json` and `audit.md`. Generated files intentionally not committed as design-validity evidence for a nonexistent game; rerun script on each integrated candidate.

## High-priority correction for LEAD (found, not fixed across lane ownership)

**Contradictory course source hierarchy:** `design/CCDP_COURSE_ALIGNMENT.md` lines 65–70 still enumerate *old* `design/CCDP_P2_GAME_RESEARCH.md`, `design/FIRST_SHIFT_VERTICAL_SLICE_GDD.md`, `design/first-shift/contract.json`, `CODEX_HANDOFF.md` and long-term `design/NIGHT_SHIFT_GDD_V3_REFERENCE.md`. The top-of-file rebuild notice correctly declares the **full v3** authoritative, but agents who skip the notice could implement the old eight-card/single-boss slice.

**Fix recommendation (LEAD-owned shared docs):** Replace the now-stale hierarchy with (1) authentic course assignment and feedback for **rubric evidence**; (2) `design/CCDP_PROJECT2_GAME_RESEARCH.md` for primary research; (3) `design/NIGHT_SHIFT_GDD_V3.md` and `design/v3/contract.json` for the **full sixteen-card game**; (4) `REBUILD_HANDOFF.md` and `AGENTS.md` for production; (5) built game/code as **observed execution**, not design proof. Don't change source attribution or claim private slides were completely reviewed. The source test will automatically PASS when fixed.

## Four equal 25-point rubric gates to verify IN ACTUAL GAME

| Criterion | Playable proof expected | Explicit anti-pattern / rejection |
| --- | --- | --- |
| Topics/strategies | First stamper actions/notice/reward within ~15 seconds; two different real interruption-influenced precision scenes; five real changed directives; between-department perk agency and boss reuse; explicit progression/failure/retry | Feature list, academic popups or simulated cutscenes posing as gameplay |
| Critical game culture | In-world, accessible direct primary references to **Dumb Ways to Die** (microgame design), **Brotato** (build synergies) and **Job Simulator** (object toys). Compare one benefit and one limitation, then **demonstrate** how the combined design changes actual play. Papers, Please only credited separately as narrative philosophy | Only workplace gamification articles or mandatory ending essay; naming games without playable implementation; inventing research metrics |
| Inventiveness of communication | HD-or-better expressive original Finch/Mira/Jules and printer/QUOTA, integrated music/stamps/catches/fail sounds, precise physical toy interactions, actual modular boss assembly and emotionally coherent joke/power arc | Static generated image collage, beep-only audio, plain beige board, decorative physics with no real agency |
| Clarity | Zero-margin edge-to-edge world; real HUD pinned to viewport; large target hitboxes 1080p/4K/narrow; legible help/scam tells; visually real $40×2 allocations, actual baseline correction 1240→1280 ~=3.2%; bounded wrong action, pause/replay, two honest scores and directly opened live URL | Clipped tutorial, hidden controls, tiny objects, inaccessible source links, unclear why-now/creator intention, false scores, no public URL |

## Exact non-didactic introduction / research acceptance

- Within the **actual first played interaction**, a subtle authored in-world cue answers **why this game** while allowing immediate stamping. Do not invent the student's biography.
- By the **first real promotion**, the on-screen **why now** motivation is observable without stopping the game for a lengthy explanation, and direct primary research sources/creator or studio and year are **clickable inside the game**. A panel hidden until the final boss is not sufficient.
- A specific in-world mechanic shows one gaming-culture comparison rather than a dissertation. Example: one microgame gets an actual reusable physical perk that changes a different encounter, while a recurring interruption asks for skilled attention.
- Include personal and broader-world relevance succinctly and genuinely, without false autobiographical or empirical assertions. Narrative can remain playful, ambiguous and satirical.
- Your original Project 1.1/1.2 continuity is *real recurring pointer skill under simultaneous onscreen distractions*, rather than simply embedding an office spreadsheet application. This is explicitly mandated in the cached feedback evidence.
- Use the art, tone and character personality of Night Shift HD as baseline. **Don't transplant its old gamification research panel verbatim** into v3 and claim the three new primary-game studies are integrated.

## Exit/CI policy

```sh
node qa/v3-course-evidence.cjs --self-test
node qa/v3-course-evidence.cjs
node qa/v3-course-evidence.cjs --require-game --url=http://127.0.0.1:4173/night-shift-v3.html
```

The non-`require-game` mode can validate specs while code is incomplete. The `--require-game` mode intentionally reports `PENDING` until gameplay is instrumented, and exits nonzero. **This gate is not a substitute** for independent manual browser inspection, interaction and human review. It makes missing source/quality evidence unignorable rather than awarding fake rubric points.

**Genuine blocker:** No new built v3 game existed in this lane's checkout at audit time; cannot claim research is already in a first promotion or that actual classroom-grade criteria are satisfied.

**No other lane-owned code was modified.** Future integrator should check new v3 app and rerun this test with the final URL, then inspect the source panel timing and actual cards.


## New real-browser acceptance checks: first promotion and first playable action

**After initial report:** The COURSE lane implemented two additional independently executable browser audits, each with actual Windows Edge/Playwright execution, not code-only guesses.

### First promotion / source discoverability (against STORY PR #14)
- Test: `qa/v3-course-story-research.test.cjs`, real opened first promotion in `previews/v3-story.html`, revealed optional source disclosure, checked visible anchor labels and URLs, and captured two real screenshots locally.
- **Result: `GDD_RESEARCH_FAIL`** on four explicit checks: primary citations for Dumb Ways to Die, Brotato, Job Simulator, and in-promotion WHY NOW rationale. The only visible first-promotion link was Deterding et al. (2011); this is a meaningful secondary source, not a substitute for the three game-design studies.
- Actual JS page errors: **zero**; the panel *works*, but research integration is insufficient. Test findings and compatible fix were sent directly to [STORY PR #14](https://github.com/PcRoGamer/office-hours-ccdp10003/pull/14). No STORY-owned files modified.
- Run with Playwright installed: `node qa/v3-course-story-research.test.cjs --url=http://127.0.0.1:4173/previews/v3-story.html` after starting HTTP server in the STORY worktree. Output `qa-artifacts/v3-course-story/evidence.json` plus two actual PNG captures.

### First real pointer action / viewport-filling scene (against INTAKE PR #20)
- Test: `qa/v3-course-first-action.browser.cjs`, using its own ephemeral real HTTP server. It clicks CLOCK IN, waits for I1's first authored approved form, transforms the actual authored world to screen coordinates using the preview camera and performs **real mouse input**, then checks `snapshot().progress` increased. It also asserts zero-margin full-screen canvas geometry and absence of page exceptions.
- **Result: `FIRST_ACTION_SMOKE_PASS_ONLY`**, **32/32 actual browser checks PASS**, across **1440×900, 1920×1080, 3840×2160, and 650×800**. First target remained onscreen and was stamped successfully in all viewports. Scripted interaction was under 15 seconds, but this is explicitly NOT a human comprehension/time-to-action sample.
- Real screenshots and JSON evidence were committed in `qa/v3-course-first-action-evidence/`, including a native physical 4K screenshot. I also directly inspected the desktop and narrow rendered images. The full-screen office world and gameplay area are actually rendered, not inferred from canvas bounds alone. First Stamp shows animated conveyor/office scene; this is not a completed integrated campaign.
- Reproduce: `NODE_PATH=<installed-playwright-node_modules> node qa/v3-course-first-action.browser.cjs --root=<intake-branch-working-copy>`. Self-hosted ephemeral HTTP requires no persistent server. The debug API currently exposes forms' X but omits Y; test uses documented I1 authored alternating Y lanes (331/446), and INTAKE was informed that adding Y to snapshots would improve future robustness.
- PR findings/evidence posted to [INTAKE PR #20](https://github.com/PcRoGamer/office-hours-ccdp10003/pull/20) and [COURSE PR #11](https://github.com/PcRoGamer/office-hours-ccdp10003/pull/11).

**Quality boundary:** The four-viewpoint check establishes first action and actual no-letterbox canvas on a standalone Intake preview only. It does NOT establish real 7–10 minute human pacing, global integrated cards, HD-or-better art quality, music, two bosses, or a course grade. The separate STORY research fail remains a recorded course-alignment defect; do not silently conflate these results into a green full-game release.


### Cross-department distraction continuity: Services S3 (actual browser input)
- Added `qa/v3-course-services-distraction.browser.cjs`, a self-contained real HTTP+Playwright Edge test for the sponsored-workflow printer-unjam scene in the independent SERVICES branch. Tests the real S3 game state, viewport coverage, visible sponsored ad, onscreen drag target, physical pointer drag and state change `adVisible=true → false`.
- **Actual execution: `SERVICES_S3_SPONSORED_POINTER_SMOKE_PASS`; 14/14 checks passed**, both **1440×900** and **650×800**, zero page errors. The fake TONER PREMIUM+ card visibly moved away, revealing the underlying printer feeder. I inspected real before/after browser images rather than code alone.
- Screenshots and exact JSON are committed to `qa/v3-course-services-evidence/` with native browser pixels. Test is deterministic and does not require a persistent web server. No SERVICES-owned gameplay files modified.
- Together with the first actual Intake stamp and Intake's independently tested source-code notice/popup implementation, this demonstrates that distracting office notices have mechanics in **at least two different departments**. **Caveat:** the cross-department scripted campaign, the actual I1 double-notice encounter during successful stamp streak, and carrying the same promoted directive across stages still need to be observed in the integrated v3 release; two separate component previews do not alone prove run continuity.
- Run `NODE_PATH=<installed-playwright> node qa/v3-course-services-distraction.browser.cjs --root=<SERVICES worktree>`. Results and screenshots are preserved under the COURSE PR, independently of the SERVICES agent's existing tests. This verifies a real playable distraction, not just the word “ad” in source.
