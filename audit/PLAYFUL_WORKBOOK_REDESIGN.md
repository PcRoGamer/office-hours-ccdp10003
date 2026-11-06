# Office Hours: playful workbook prototype

## Why this replaces the rejected overhaul
The advanced workbook version forced four rows, E-column adjustment ledgers, nested percentage formulas, ROUND/SUM syntax, and a toolbar with eight technical controls. It was mathematically more demanding but unnecessarily frustrating. The original release was restored to the public site before this prototype was developed.

## New rule
**One short decision at a time.** Select an answer cell, read a human situation, choose one of four large options: ADD, TAKE AWAY, TIMES, or SHARE. The answer appears as a real evaluated spreadsheet formula, with immediate feedback. Mistakes are harmless and quickly reversible. Typing formulas, dragging references, and using the calculator remain possible, but are never prerequisites for the later challenges.

All six reports still have only THREE rows; no fifth column or hidden adjustment ledger.

| Job | Operations and new thinking step |
|---|---|
| 1: Reimbursements | Preserve simple B2→C2 and D2→D4 drag as the familiar tutorial |
| 2: Invoice Check | Box price (×), handling charge (+), returned goods (−) |
| 3: People Count | New hires (+), departures (−), people per shift (÷) |
| 4: Licence Review | Seats × price, rebate (−), installation fee (+), then the existing policy decision |
| 5: Engagement Audit | Charged fees (+), refunded spend (−), clicks per credit (÷), then the existing policy decision |
| 6: Final Board Check | Consultant bill (×), office surcharge (+), remaining budget (−) |

The clues describe real situations without requiring knowledge of spreadsheet jargon. The answer controls are visible only on reports 2–6 and disappear when the mandatory policy decision appears.

**Auto-Pilot:** all three rows in the tutorial, but only the routine first row afterward. It does not choose how to treat a return, a departure, an average or a worker-impact policy.

**Marker-facing argument:** automated work becomes attractive but does not remove interpretation. What counts as a charge, refund, headcount or engagement metric is a rule-based decision with consequences. This better supports practical game-design, the game economy and agency/feedback criteria without creating an uninviting math worksheet.

## Release gate
The public site must not be changed until clean Chrome-browser screenshot review, six individual report tests, both drag regressions and an entire shift through both boss fights pass. The original stable release is still available on the public main branch.

## Source-edit limitation
This is an experimental change to the deployed JavaScript bundle because the original laptop source checkout is currently inaccessible through Desktop Commander. Do not overwrite this candidate with an old Vite build. When computer access returns, port the dataset, operation picker, evaluation and Auto-Pilot rules into React source before long-term maintenance.
