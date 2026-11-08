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
