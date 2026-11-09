# Office Attack | Unified artwork candidate | 9 November 2026

## Original art system
- Replaces `office-attack/art.js` entirely. No imported HD atlas, icon PNGs, or external network assets.
- Draws office workers, hostile manager, expressive printer, white/red/green document cards, envelopes, monitor, shredder, catch folder, phone, timer clock and completion ticks as original smooth Canvas 2D illustrations.
- Uses bezier silhouettes, fully filled shapes, slight same-colour shading, rounded edges, soft highlights, tiny limbs, expressive faces, open mouths, panic eyes, and subtle animated poses; virtually no hard outlines.
- Keeps the original public export contract (`sprite`, `drawIcon`, `paper`, `rr`, `ink`, `confetti`, `vignette`, `HD`, `iconsReady`) for compatibility with the existing gameplay and QA.
- Raises command contrast on the lighter backgrounds; important for instant microgame recognition.
- This is not the prior 3D icon set with adjusted colours. Every primary game object is freshly illustrated.

## Executed regression & visual review
- Real Windows Chrome visual smoke: 1440x810, 650x800, 390x760 all pass HUD/timer separation, pastel edges and page-error checks.
- 1440x810 full 20/20 pointer-driven victory passes all six mechanics at all three speeds, both bosses, both intermissions, Marathon, replay, zero 404s and zero JS errors.
- Personally inspected rendered screenshots for STAMP, CATCH, SHRED, FIX, FEED, DODGE, Printer Panic and Manager Clock Out. Changed command contrast where lavender/blue made the heading low-contrast.
- No modifications to HD, main, original v3 or public release.

## Merge decision
This is an independent candidate on top of the creative-lead safe-area/UI branch. The ART helper may produce a stronger illustration implementation; compare rendered scenes before selecting. Do not mix incompatible art systems. Retain a single renderer for the final release. The FIX-family mechanics still require the MICROGAMES lane.
