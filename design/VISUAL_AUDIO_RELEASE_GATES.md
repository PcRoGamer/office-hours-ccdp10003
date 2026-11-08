# Night Shift v3 | visual, audio, playfeel and release gates

**Measured against:** Night Shift HD real playable baseline. Full v3 GDD is the acceptance target. No checklist-complete but art-regressed release.

## Gate 0: source-lineage and quality floor
- Open `arcade-office-hd.html` in a real browser and inspect its title, playable action, ad interruptions, hit feedback, characters, intermission email and spreadsheet parody, timed transition and audio. Capture real reference frames.
- Bring in `arcade-office-genai.html` only when actual rendered sprite quality/expressiveness improves; an AI-generated illustration alone proves nothing.
- Review First Shift's actual browser screenshots and [prior failure audit](PRIOR_REBUILD_FAILURE_AUDIT.md) for *negative* examples; don't inherit generic beige stage, boxy static emoji characters, forced explanatory writing or beep-only sound.
- New shell begins by matching the HD silhouette, cinematic art treatment, visual contrast, expressive cast, typographic rhythm and animation grammar. Preserve observed features if extraction is more reliable than reproduction.
- Any change harming the reference is rejected until corrected. Keep a current side-by-side comparison with exact source URL, viewport, scene state and screenshot timestamp.

## Gate 1: fullscreen world, HUD overlay and device correctness
- World covers **every pixel** of the browser viewport. Zero permanent sidebars/black bars/letterbox or centered page container. No fake 1200×760 frame.
- HUD overlays world at actual device edges. Hearts left, timer right, tiny imperative and directive context, with pause/mute/disclosure controls. Gameplay remains the dominant composition; the HUD is **not** a desktop UI and not a static page wrapper.
- Camera expands/reframes world by aspect while retaining object sizes and input targets; backgrounds extend coherently. No distortion/stretching. Interaction safe regions avoid overlay collisions, not by shrinking whole game.
- Review real screenshots/input coordinates at **1920×1080**, **2560×1440**, **3840×2160**, **3440×1440** and **650×800 portrait**, plus **1440×900** and **1024×600** for continuity. Check Windows 100%/150%/200% scaling when workstation supports it.
- At physical 4K with Windows 200%, a 1920×1080 CSS viewport × DPR2 yields 3840×2160 backing; avoid double multiplying. When 4K fidelity cannot sustain cadence, document GPU timings and chosen dynamic budget rather than silently reducing resolution.
- Each viewport: no empty margins, blurry text, cut-off action, shrunken tiny prop, inaccessible touch target, incorrect pointer transform, uneven top safe area, or unusable portrait composition. Narrow view is a stress-test, never grounds for degrading primary landscape.

## Gate 2: art, character performance, physical humor
- Every department has its own staging and material accents within one **Corporate Paper Theatre** family, not the same unlived-in ruled-board template. The space should read as a living office and a tactile toy set.
- Finch, Mira, Jules and machines have distinct readable silhouettes at gameplay scale and *specific animated emotions*, not name tags under static heads. Their reactions follow observed state: spill/saved coffee, scam choice, worker help, promotion, boss injuries and victory.
- At least one visible anticipatory motion, meaningful impact/squash/settle, and recoverable comedy failure in each of sixteen cards. Effects strengthen interaction readability; glitter cannot mask bad timing.
- Show occasional unscored physical toy interactions that are intrinsically amusing, without breaking a ~7–10-minute run. Planck contacts feel natural where used; do not force simulation into charts or UI.
- Preview every promotion with a genuine before/after perk effect: it changes a route or physical object, not just a number. The stronger ability is visible in play within a bounded time.

## Gate 3: audio and accessibility
- Original/licensed **engaging and coherent background music** exists and follows at least three musical intensity states: normal work, promotions/breathers, bosses/climax. Percussion and transitions should have musical intention.
- Distinct stamp, file, collision, catch, failed action, scam, help, promotion, machine bolt and physical victory sounds; varied enough to avoid an annoying metronome of identical oscillator beeps. Handle gesture-driven AudioContext unlock/autoplay properly.
- Audio cue timing is coupled to actual input/physics contact; visual cue always exists independently of sound. Mute disables playback; reducing motion suppresses decorative shakes/flashes, not physics, scores or hitbox updates.
- No copyrighted tracks ripped from other games or placeholder stock tunes represented as original. If no composition is available, use original synthesised **musical arrangement**, not a bare one-note beep.

## Gate 4: authorship, gameplay and GDD parity
- Inspect each actual rendered card (all sixteen), special popups, both bosses' every phase, five intermissions, ending, replay in a browser; do not infer from source lists.
- Confirm gameplay structure: first action under 15 seconds, 12 selected cards/16 roster, five real directive shifts, eight perks L1/L2, three same-seed different build strategies, two bosses (Printer Mutiny and THE QUOTA), exact scored packet economy and physical ending.
- Confirm original corporate promotion trap is readable **without a forced explanation**. Genuine help and scams have visual tells. Graph corrections visually show 1240→1280 and 3.2% without changing true numbers. Two $40 licences/worker access and rescue decisions have displayed causal consequences.
- Time actual *human* first-run 7–10-minute aspiration and replay 5–8-minute aspiration with first-time testers when practical. CI's `wallMs` from scripted perfect pointer movement is **not** a human pacing sample. Report samples rather than inventing results.
- At least one full run with sound, one muted, one reduced motion, one pause/retry, one no-perk boss, multiple seeds. Test bad pointer and cancelled gesture paths. Check score ledger recalc from immutable actions.

## Gate 5: independent inspection is mandatory
Every new scene or major visual change must follow **render → physically inspect actual browser screenshot/clip → log failure → modify source → render again**. Screenshots must be from a real game build, **never generated concept art** masquerading as UI. Critique actual hierarchy, gestures, perspective, rhythm, safe areas, material consistency, colour balance, legibility and temporal clarity. Side-by-side references are required for title, first physical card, one promotional break, one boss, receipt and narrow viewport.

For each submission PR include:
1. What code changed, source SHA and exact preview route.
2. At least one actual screenshot at a common HD comparison viewport, and a reproducible local/live preview test.
3. Actual browser assertions/errors; if no browser access, mark unverified and hand off a runnable test without claiming a visual pass.
4. A concrete failed criterion, fix, and re-capture for any visual defects observed.
5. Dependent scene interactions and regression-tested prior features.

**Accept/reject logic:** Green unit/browser tests alone prove mechanics and crash resistance. They cannot certify pleasure, originality, aesthetics or a publishable game. LEAD rejects scene integration that regresses the incumbent or introduces visible placeholder UI as finished art.

## Release gate and fallback
- Real full campaign complete end to end. All above gates pass, real artifact under a distinct `night-shift-v3.html` route, public test from fresh browser, GitHub Pages asset paths verified, rollback instructions and commit hashes recorded.
- Separate current *course requirements* verification from cached assignment notes. Don't claim Canvas submission receipt without observing it.
- **Do not overwrite existing Night Shift HD** to make a new branch look complete. If an independent superior replacement is not ready, HD remains the known playable option; this is transparent fallback, not a silent reduction of the full-game objective.
