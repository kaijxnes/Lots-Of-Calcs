# North Carolina — 2026 verification checklist

Generated from `data/tax/us/us-nc.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: undefined
- Rates last checked: not yet
- Verified by a person: **not yet**
- Adds to: `us` (check that one too)

## Check against

- **Start here:** https://www.ncdor.gov/2025-d-401-individual-income-tax-instructions/open#page=8
- 2025 North Carolina Individual Income Tax Instructions: https://www.ncdor.gov/2025-d-401-individual-income-tax-instructions/open#page=8
- 2025 North Carolina Tax Rate Schedule: https://www.ncdor.gov/taxes-forms/individual-income-tax/tax-rate-schedules
- 2025 North Carolina Standard Deduction: https://www.ncdor.gov/taxes-forms/individual-income-tax/filing-topics/north-carolina-standard-deduction-or-north-carolina-itemized-deductions
- North Carolina Department of Revenue - Tax Rate Schedules: https://www.ncdor.gov/taxes-forms/tax-rate-schedules
- 2022 North Carolina Form D-400, Line 15: https://www.ncdor.gov/2022-d-400-handwritten-version/open#page=2
- 2023 North Carolina Form D-400, Line 15: https://www.ncdor.gov/2023-d-400-handwritten-version/open#page=2

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in undefined, unless the line says otherwise.

### North Carolina income tax (`nc-income-tax`)

> 3.99% in 2026, after a standard deduction of $12,750 ($25,500 married).

- [ ] rate 3.99%
- [ ] Single — less 12,750
- [ ] Married filing jointly — less 25,500

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 40,000: nc-income-tax 1,087.28; net 33,232.73 — North Carolina income tax $1,087.28. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 85,000: nc-income-tax 2,882.78; net 65,744.73 — North Carolina income tax $2,882.78. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 150,000 with status = married: nc-income-tax 4,967.55; net 118,217.45 — North Carolina income tax $4,967.55. PolicyEngine US 2.62.5 gives the same state figures to the cent.

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/us/us-nc.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
