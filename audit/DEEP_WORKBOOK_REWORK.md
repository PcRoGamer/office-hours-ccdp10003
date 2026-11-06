# Office Hours: Spreadsheet Play Rework (6 November 2026)

## Actual gameplay change

The original six report sheets all reduced to one operation per row, then a drag-down. Its built-in evaluator already supported ranges, nested arithmetic, SUM, AVERAGE, MAX and ROUND, but the jobs never needed those operations. A single purchased upgrade also completed all reports.

The branch `work/deeper-spreadsheets-20261106` changes the **real workbook**, not a supplementary quiz or a post-report dialog.

| Report | Player's thinking task | Core mechanics |
|---|---|---|
| 1: Reimbursements | Learn the interface | Multiply; source drag; ordinary fill-down |
| 2: Supply Reconciliation | Handling fee versus returned credit | Multiply, percentage handling fee, subtract, SUM(D2:D3)-D4 |
| 3: Headcount | Transfers in and transfers out have opposite effects | Add, subtract, SUM(D2:D4) |
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

**Status:** Experimental branch. Await browser integration tests and real screenshot review. The live main branch is unchanged until verification.