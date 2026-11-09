# RELEASE lane | protected HD, candidate browser matrix and manual Pages interlock

**Date:** 8 November 2026 AEDT  
**Claim:** [RELEASE](../claims/RELEASE.md)  
**Branch:** `agents/v3-release-nova0811`  
**Integration target:** `rebuild/night-shift-v3-hd`  
**Scope:** Release safety infrastructure only; **does not claim to implement game content**.

## Shipped

- `.github/workflows/night-shift-v3.yml`: Playwright baseline check and v3 browser audit. Runs against PRs into integration and the integration branch. Ordinary pushes and PRs cannot deploy Pages.
- `qa/v3-release.audit.cjs`: protected release hash verification, relative asset-path scan, actual Chromium errors and 404 observation, screenshots/metadata at 1920×1080, 2560×1440, 3840×2160, 3440×1440, 650×800 and 1920×1080@DPR2. Baseline matrix also covers 1440×900, 1920×1080 and 650×800.
- A separately opt-in, acceptance-manifest-gated Pages deployment that packages the entire tracked repository using `git archive HEAD`; it preserves all existing tracked web routes, rather than replacing index with a v3-only output. Post-deployment Chromium verification fails on real public-route problems.
- Source safety: pinned Git blob identifiers of five existing working releases as observed on `main` (index, HD, arcade-v3, generated-art HD variant, earlier Night Shift). Presence is insufficient; any modification fails the source audit.

## Actual test execution (no invented pass)

The first CI execution, [Actions run 42467159646](https://github.com/PcRoGamer/office-hours-ccdp10003/actions/runs/42467159646), executed on the contributor branch and used a real Chromium installed on GitHub-hosted Ubuntu.

- **Protected-incumbent: PASS.** The latest run passed **10 real browser assertions** across three viewport sizes: HTTP 200, no uncaught JavaScript errors, no broken same-origin assets, plus an actual CLOCK IN into live gameplay. Earlier title-only run passed 9 checks.
- **Candidate-smoke: FAIL AS EXPECTED.** Exact failing assertion: `Candidate route exists before browser launch`. The `night-shift-v3.html` owned by LEAD was not present on the RELEASE branch at test time. It would be dishonest to call this full-v3 QA green.
- **Publication: SKIPPED**. No Pages content has been changed.
- Real browser artifact: [HD screenshots / metadata](https://github.com/PcRoGamer/office-hours-ccdp10003/actions/runs/42467159646/artifacts/13611619904) (1920×1080, 1440×900, 650×800). Candidate failure artifact: [candidate status JSON](https://github.com/PcRoGamer/office-hours-ccdp10003/actions/runs/42467159646/artifacts/13612147010).
- **Final browser-retake CI:** [Actions run 42467670052](https://github.com/PcRoGamer/office-hours-ccdp10003/actions/runs/42467670052): incumbent Chromium and five pinned-source-hash checks **PASS**; candidate still **FAIL** because LEAD's candidate route is absent; deployment **SKIPPED**. [Download the real title and first-card screenshots](https://github.com/PcRoGamer/office-hours-ccdp10003/actions/runs/42467670052/artifacts/13612491743).

### Actual screenshot inspection / comparison

Inspected the downloaded real Chromium screenshots, including 1920×1080 and 650×800. At 1920×1080 the HD title displays oversized asymmetric editorial typography and the expressive printer/coworker with a large legible START SHIFT button, clear foreground-background contrast and deliberate diagonals. **Keep that visual quality floor.** At 650×800 HD places its landscape composition in a horizontal band, leaving prominent dark empty regions above and below. This is a known *baseline weakness*, **not permission to use margins in V3**. V3 must fill narrow viewports and rearrange staging while preserving large character and instruction scale. After clicking CLOCK IN in Chromium at 1440×900, the actual first-card screen correctly exposes hearts, countdown and the "STAMP OR GET STAMPED" imperative with visible APPROVE and SPAM papers. The stage has extensive negative space at the sampled instant and should not be presumed the final v3 visual target. **QA screenshot defect/fix cycle:** first capture at 300ms was misleadingly empty because action props had not entered; moved capture to 1800ms after clock-in, reran CI and inspected the corrected real frame. No v3 comparison is possible before its code exists on the tested commit.

## Run locally against an isolated checkout

```sh
python3 -m http.server 4173 --bind 127.0.0.1
# in a second shell, with Node 22:
npm install --no-save playwright@1.58.2
npx playwright install chromium
node qa/v3-release.audit.cjs --source
node qa/v3-release.audit.cjs --incumbent
node qa/v3-release.audit.cjs --candidate
```

Browser evidence lands in `qa-artifacts/v3-release/`. Default local static route is `http://127.0.0.1:4173/`. `TEST_BASE_URL` can point to the actual GitHub Pages project subpath for post-deploy testing. **The candidate command intentionally exits nonzero until the integrated route exists and satisfies its checks.** Source hashes require the same protected baseline as the integration branch.

## Release governance, activation and rollback

**This is not an automatic release workflow.** Publishing requires all of the following:

1. LEAD integrates and independently checks the full 16-card/12-run game, five promotions/directives, eight perks, two completed bosses, sound, all required actual browser viewport outputs, a full human playthrough, absence of HD regressions and accurate scoring.
2. A human reviewer creates `coordination/reports/release-acceptance.json` only after seeing evidence. That manifest records `sourceSha` as the SHA of the **immediately preceding code commit**, `acceptedBy` as the real reviewer, `evidenceUrl` pointing to the real Actions or PR evidence, and verified booleans `full16Cards`, `normalRun12`, `fivePromotions`, `fiveDirectives`, `eightPerks`, `twoCompleteBosses`, `audioChecked`, `viewportMatrixReviewed`, `humanPlaythrough`, `freshBrowserPreviewProof`, and `hdNotRegressed` all true. The *very last commit* must change **only** this manifest. The CLI validates the exact parent and file diff; it is not a magic waiver for tests.
3. On the **integration** branch alone, a human invokes `workflow_dispatch` with `publish_candidate=true` and exact phrase `PUBLISH_NIGHT_SHIFT_V3`. Both browser jobs and manifest gate must pass. Default is **false**.
4. **GitHub caveat:** `workflow_dispatch` workflows generally must exist on the repository's default branch before the Actions UI offers them. Since this lane must not edit `main`, promoting the workflow file alone to `main` later requires explicit owner/LEAD authorisation. This capability dependency is not a reason to release partial work or replace the HD entry. The Pages environment may also require a branch allowlist change by an administrator.

**Rollback:** Keep the previous successful Pages deployment/build available. If a published V3 fails public QA, redeploy the last verified prior Pages artifact via the GitHub Deployments/Actions controls where supported, or restore the previous known-good site tree on an owner-authorised publishing branch. Preserve the SHA and link of both deployments. Do not blindly reset or force-push `main` or the shared integration branch. The existing HD route must remain independently loadable, even when V3 is available.

## Explicit limits

This smoke harness **does not** prove all scenes, bosses, audio, fun, scoring or course rubric. Separate QA_GAME, QA_VISUAL, AUDIO, SYSTEMS and LEAD signoff remain hard release gates. Large 4K Chromium screenshots check geometry/crashes, but an aesthetically inferior game could still pass. No simulated human playtime, Canvas submission, deploy, or public V3 acceptance has been claimed.
