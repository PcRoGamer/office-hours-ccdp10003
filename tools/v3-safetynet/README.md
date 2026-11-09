# V3 SafetyNet: additive non-regression checker

**Role:** overflow support, not one of the original 17 reserved lanes. Do not replace QA_GAME, QA_VISUAL or RELEASE with this checker.

Use Node.js 20+ from the repository root:

```sh
node --test qa/v3-safetynet.test.mjs
node tools/v3-safetynet/audit.mjs --root . --out /tmp/v3-audit.json
node tools/v3-safetynet/audit.mjs --root . --release --out /tmp/v3-release-audit.json
python -m http.server 4173  # open /previews/v3-safetynet.html, load the JSON
```

`integration` mode tolerates **pending** v3 modules while each lane develops independently. `--release` fails closed on missing v3 scene/entry/boss modules; either mode exits nonzero on missing or byte-changed historical routes, invalid canonical source contract, broken local static assets, root-absolute GitHub Pages URLs or Node syntax failures.

Legacy Git blob hashes were read **directly from `main` on 8 Nov 2026**, not guessed. They intentionally protect 14 established public route files, including `arcade-office-hd.html`, `index.html`, and Workday; modifying a legacy route needs explicit reviewed policy change rather than a silenced check. Other assets are not pinned by this version.

`audit.mjs` scans authored `id: 'I1'` to `id: 'T4'` definitions within each department folder and notices missing boss/system/physics/render/audio/art modules. This is **structural evidence only**; a stub can satisfy it. It cannot prove animations, correct physics, actual 12-card seed selection, timed actions, bonuses, user control, final scoring, or real assets drawn on Canvas. `runtime-evidence` remains **pending by design**, regardless of passing source checks. A release is acceptable only after the main v3 visual/audio/human/Playwright gates, with links to actual screenshots.

Limitations: Regex static references cannot follow dynamic URL assembly, import maps or all CSS variants. Existing main content is used for exact protection, not visual claims. No GitHub Actions workflow changes in this lane (RELEASE owns it). Run on checked-out integration or PR branch and attach JSON+MD reports to your PR/CI evidence.


## Cross-branch integration rehearsal (new)

These commands import **only the exclusive paths** of nine existing specialist branches into a **brand-new detached Git worktree** without changing other worktrees, overwriting files, merging PRs or touching `main`:

```sh
# From an up-to-date local clone / worktree with specialist remote refs fetched:
node tools/v3-safetynet/assemble.mjs --repo . --out /tmp/nightshift-v3-rehearsal
node qa/v3-safetynet-contract-matrix.mjs --root /tmp/nightshift-v3-rehearsal --out /tmp/v3-contract.json
node qa/v3-safetynet-preview-matrix.mjs --root /tmp/nightshift-v3-rehearsal --out /tmp/v3-browser
```

On Windows use an unused path under `%TEMP%` for `--out`. For the assembly, the paths must **not exist**. Branch names and paths are declared in `tools/v3-safetynet/rehearsal-sources.json`; refresh them explicitly if PR head refs change. There is no automatic `git fetch` or network/credential prompt. The assembly script reads local Git refs, runs `git worktree add --detach` and copies branch-owned files byte-for-byte with read-only `git show`. Every pre-existing integrated file is **skipped rather than overwritten**. Inspect `v3-safetynet-assembly.json` to see exactly what was copied.

The `contract-matrix` imports the **actual 12 currently available card factories plus B1/B2**, instantiates each under an injected mock SceneContext, exercises all nine required scene lifecycle/pointer methods, verifies serialisable snapshots, and checks 128 seeded decks across the integrated SYSTEMS model. Missing T1–T4 are reported **PENDING** in rehearsal mode. Use `--release` to fail closed (non-zero exit) if any required card is absent.

The `preview-matrix` opens the **actual independent preview HTML via its own temporary HTTP server**, uses real Chrome DevTools Protocol pointer events, and saves live browser frames for 1440×900 and 650×800. It detects canvas-absent/blocked navigation, uncaught page exceptions, broken static assets and horizontal overflow, and records JSON evidence and SHA-256 screenshot hashes. `--only intake,services` restricts the lanes for faster debugging; each lane is independently testable. This is a **load and basic input gate**, not a test of full scene completion, physically correct bosses, music, story pacing or superior visuals.

### Verified Windows results, 8 November 2026

- Isolated assembly: **29 files copied from nine source refs**, without touching existing routes; Staff branch contained no production scene files.
- Cross-lane contract: **15 passed, 0 failed, 4 pending** (T1–T4); `--release` returned exit code **1** as designed.
- Real Chromium: **16/16** preview/viewport samples passed load, canvas, HTTP assets and uncaught-JS checks across Intake, Services, PR, Printer, Quota, Systems, Physics and Story.
- Real browser contact sheets: `qa/v3-safetynet-preview-evidence/{desktop,portrait}-{1,2,3}.jpg`.
- Visual inspection revealed uneven art/staging across separately authored previews; **HD-v3 integrated superiority remains unverified**.

**Do not interpret any green structural test or preview capture as release authorisation.** The LEAD must still integrate into `night-shift-v3.html`, prove all 16 actual microgames and two complete boss paths, validate musical/audio and physics interactions, and compare actual HD-v3 scene states at matching viewports.

The browser matrix also supports **custom stress viewports**, e.g. `--only printer --viewports 3440x1440,3840x2160`. Its status now requires a canvas rectangle that covers the entire actual CSS viewport (within 2 px), in addition to existing asset/error/overflow checks. This does not prove internal camera staging or GPU performance; inspect the rendered frames.
