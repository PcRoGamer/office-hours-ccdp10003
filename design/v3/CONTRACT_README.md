# Full-v3 machine-readable core contract

**Design status:** Specification and validation only. Not evidence of a playable implementation.

- [contract.json](contract.json) is a **core implementation model reconstructed from the canonical full [v3 GDD](../NIGHT_SHIFT_GDD_V3.md)**, not an exact byte-for-byte copy of the old offline design package. The full GDD governs richer directives, timings, fairness, look/feel and exceptions.
- [validate_contract.mjs](validate_contract.mjs): run `node design/v3/validate_contract.mjs`; verifies the 16 IDs, 12-card curated run, 3 per department, mandated ordering, eight perks and synergy IDs, 5 directives, 2 three-counter bosses, 4 distinct packet IDs, $80 conserved and two 100-point score-weight sets. This test is a *model check*, not browser QA.
- This is **not** `design/first-shift/contract.json`, which described only 8 cards and 1 boss. Never use the old slice's schema to silently reduce full v3.
- Other agents should use this file for constants/fixtures but always verify mechanical contracts against the full GDD. If a contradiction emerges, fix model JSON through a dedicated, reviewed PR with concrete source evidence, not by editing game rules to match a wrong model.
