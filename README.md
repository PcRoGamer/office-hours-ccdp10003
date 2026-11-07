# OFFICE HOURS · THE WORKDAY

A six-assignment interactive workplace game about motivation, interruptions, management targets, record keeping, and the rules that define success. **Play the game first; the research is carried by the decisions.**

## 🎮 Play

**Current, intended submission edition:** https://pcrogamer.github.io/office-hours-ccdp10003/

Direct link to the same edition: https://pcrogamer.github.io/office-hours-ccdp10003/workday-final.html

Desktop browser recommended. Click **CLOCK IN** (or **RESUME YOUR SHIFT** when returning); the game opens in AsterOS. Open each assignment notification, complete the work in its office application, file it, and face the escalating challenges. The playthrough includes two boss fights, research notes delivered in context, and an interactive final performance evaluation.

The six distinct assignments are **Sheets** (reconcile expenses), **Writer** (revise a staff notice), **Applicants** (evaluate hiring and privacy evidence), **Writer** again (make an IT licence recommendation), **Slides** (construct a board presentation), and **Case Files** (choose three sources for a dossier). The final dossier deliberately forces you to omit one of four credible but incomplete perspectives. The omitted voice is remembered in your final record.

### Controls and recovery

- Follow the desktop notification's **OPEN** button or the **TASKS** launcher to see the current objective. Existing work is retained in browser local storage.
- For Sheets, type \`=B2*C2\` in the first total cell and press Enter; repeat for the next rows. Spreadsheet arithmetic, source-cell dragging, the calculator and optional formula automation are available.
- For Writer, Applicants, Slides and Case Files, select the highlighted options inside the corresponding app. The document or preview changes immediately, and its **FILE / PRESENT / SEAL** action is enabled when the required decisions are recorded.
- During boss battles, use **ATTACK** and defend against incoming attacks. An interruption popup can be dismissed; its removal restores normal desktop controls.
- Revisit the game to continue the shift. The ending can be replayed by starting a new shift.
- You can mute sound with the in-game speaker control.

## Why this game exists

Office Hours asks whether workplace gamification improves the work or changes what people are encouraged to count. Visible XP, coins and scores are genuinely rewarding, while forced deadlines, advertisement interruptions, and board presentations expose their costs. Later decisions determine which facts reach management and which perspectives disappear. The Director's Cut performance evaluation then lets the player change what the company counts without changing the shift that actually occurred.

The game draws on classroom discussion of game economies, engagement and incentives, as well as independent game-design scholarship (MDA and procedural rhetoric), a workplace-gamification study, and research on interrupted work. In-game source links are placed at the relevant decisions rather than required as a separate essay. Fictional workplace numbers and scoring rules **are not research measurements**.

## Other editions and review material

The current canonical link launches **Workday**, a 2D office-computer experience that replaces repeated spreadsheets with six different office tasks.

- **Original 2D Shift File:** https://pcrogamer.github.io/office-hours-ccdp10003/2d.html
- **Earlier 3D release:** https://pcrogamer.github.io/office-hours-ccdp10003/legacy-3d.html
- **Historical 3D screenshot gallery:** https://pcrogamer.github.io/office-hours-ccdp10003/gallery.html
- **Historical 3D gameplay audit:** https://pcrogamer.github.io/office-hours-ccdp10003/audit/

The gallery and historical audit **do not document the current Workday edition**; they are retained to show development, not to substitute for playing the current game.

## Technical and testing

Workday is a static browser game built on AsterOS, with vanilla JavaScript overlays for the office applications, deterministic saved campaign state, and the existing React-based gameplay. No account is required.

GitHub Actions exercises the Workday first three assignments, all four final evidence choices, old-save compatibility, the final-boss/ending consequence, and the complete original 2D campaign. Screenshots from those automated runs are attached to workflow artifacts.

Automated play demonstrates functionality, **not guaranteed first-time human enjoyment or an awarded university grade**. The user-facing release is served over GitHub Pages; do not submit a repository ZIP or local working directory as the game.

**Academic context:** University of Melbourne, CCDP10003 *Video Games: Remaking Reality*, 2026 Project 2.
