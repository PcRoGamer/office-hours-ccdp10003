# Office Hours: Spreadsheet Play Rework (6 November 2026)

## Actual gameplay change

The original six report sheets all reduced to one operation per row, then a drag-down. Its built-in evaluator already supported ranges, nested arithmetic, SUM, AVERAGE, MAX and ROUND, but the jobs never needed those operations. A single purchased upgrade also completed all reports.

The branch `work/deeper-spreadsheets-20261106` changes the **real workbook**, not a supplementary quiz or a post-report dialog.

| Report | Player's thinking task | Core mechanics |
|---|---|---|
| 1: Reimbursements | Learn the interface | Multiply; source drag; ordinary fill-down |
| 2: Supply Reconciliation | Handling fee versus returned credit | Multiply, percentage handling fee, subtract, SUM(D2:D3)-D4 |
| 3: Headcount | Transfers in and transfers out have opposite effects | Add, subtract, DIVIDE to find staff per shift, then total only the headcount cells |
| 4: IT renewals | Percentage discount versus fixed setup charge | E3/E4 adjustment cells, ROUND, cross-row sum, followed by licence policy |
| 5: Campaign audit | Billed fee, percentage surcharge and refund are different | E3 adjustment, grouped arithmetic, SUM, followed by marketing policy |
| 6: Board pack | Tax, rebate and discount depend on different rules | E2/E3/E4 ledger, ROUND, compound formulas, final reconciled total |

Reports 2–6 have four answer rows, contain different operations, and require real cell-reference formulas. Entering the correct number alone cannot satisfy the advanced validation. Percent adjustment values live in an E-column reference strip within the workbook. The player uses real `=...` formulas and can reference earlier D cells.

### Automation

Formula Auto-Pilot remains a worthwhile early purchase, but in advanced reports it fills **only the first clerical row** and leaves the other three rows and later policy decisions to the player. Reusing source-cell drag no longer supplies the correct operation automatically; it inserts the first reference and prompts the player to choose an operation.

### Acceptance targets

- First report unchanged and completable using source drag and D-handle fill.
- Advanced formulas use native real spreadsheet evaluation, not separately graded multiple-choice questions.
- Wrong operation is visually rejected and can be corrected.
- Plain numeric answers cannot pass advanced tasks.
- `ROUND`, `SUM`, percentages, cross-row D references and E adjustment references work.
- Auto-Pilot cannot clear advanced reports automatically.
- Existing policy consequences, inbox, bosses, fullscreen and saving remain functional.
- All six reports can still be completed without purchasing any upgrade.

### Academic interpretation

The growing complexity reinforces the course's temporal-design and game-economy strategies: first the game makes menial work rewarding, then automation removes the boring labour, but interpretation becomes harder. Reports 4–5 distinguish **accurate arithmetic** from **judgment about what to count and who benefits**, which expresses the argument through mechanics rather than an afterword.

**Status: Published and browser-verified on the production main branch (6 November 2026).** GitHub Actions verified all six report worksheets, both boss fights in a continuous shift, the B2→C2/D2→D4 tutorial gestures, formula-operator selection, numeric-answer rejection, and the public GitHub Pages bundle. Original browser screenshots are available in [the release gallery](../gallery.html). These tests do not guarantee an academic mark or replace first-time human usability testing.

**Source maintenance note:** The canonical published release includes `assets/index-DeepWorkbook-20261106.js` and `assets/deep-workbook.css`. The separate local Vite/React source checkout on the Windows laptop was not synchronised because its remote-computer connector reached a usage limit. **Do not rebuild and republish the laptop's older source without first porting these workbook changes.** The source-level porting requirements are recorded below and can be implemented when direct source access is restored.

### Port these changes to the editable source before the next Vite rebuild

- `src/gameData.js`: the revised `JOBS` dataset, four-row advanced reports, `solutions`, `rowNotes`, `extraCols` and `autoRows`.
- `src/sheetLogic.js` (or the existing module that defines the formula evaluator): E-column cell references for per-row adjustment values, and advanced expected-result checks using formula-derived values and actual cell-reference expressions.
- `src/Spreadsheet.jsx`: reference-only advanced source dragging, formula-operator strip, E-column adjustment ledger, mixed-operation guidance, advanced Auto-Pilot limited to routine entries, and four-row formatting.
- `src/MissionGuide.jsx`: instructions that adapt to audit reasoning rather than always teaching drag-fill.
- Workbook CSS: compact 4-row layout, visible row notes, sticky ribbon/formula input and the E ledger. Preserve the first report's original B/C drag and D-handle behaviour.

The branch `work/deeper-spreadsheets-20261106` preserves the incremental development history; `qa/deep-workbook.test.cjs`, `qa/deep-drag.test.cjs` and `qa/deep-campaign.test.cjs` are the release acceptance tests.