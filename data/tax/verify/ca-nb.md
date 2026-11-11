# New Brunswick — 2026 verification checklist

Generated from `data/tax/ca/ca-nb.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: undefined
- Rates last checked: 2026-11-11
- Verified by a person: **not yet**
- Adds to: `ca` (check that one too)

## Check against

- **Start here:** https://www.canada.ca/en/revenue-agency/services/tax/individuals/tax-rates-brackets/current-year.html
- CRA Payroll Deductions Formulas (T4127), 122nd edition, effective January 1, 2026: https://www.canada.ca/content/dam/cra-arc/formspubs/pub/t4127-jan/t4127-01-26e.pdf
- CRA Payroll Deductions Formulas (T4127), 123rd edition, effective July 1, 2026: https://www.canada.ca/content/dam/cra-arc/formspubs/pub/t4127-jul/t4127-jul-26e.pdf
- CRA: Current year tax rates and income brackets (2026): https://www.canada.ca/en/revenue-agency/services/tax/individuals/tax-rates-brackets/current-year.html

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in undefined, unless the line says otherwise.

### New Brunswick non-refundable credits (`ca-nb-credits`)

> 9.4% of the basic personal amount ($13,664) and the base CPP and EI contributions.

- [ ] rate 9.4%
- [ ] amount 13,664

### Basic New Brunswick tax (`ca-nb-basic`)

- [ ] from 0: 9.4%
- [ ] from 52,333: 14%
- [ ] from 104,666: 16%
- [ ] from 193,861: 19.5%

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 30,000: ca-taxable 29,735; ca-cpp 1,576.75; ca-ei 489; ca-income-tax 1,397.38; ca-nb-income-tax 1,341.40; net 25,195.47 — Independent implementation of the T4127 annual formulas (steps 1 to 5).
- [ ] 60,000: ca-taxable 59,435; ca-cpp 3,361.75; ca-ei 978; ca-income-tax 5,338.30; ca-nb-income-tax 4,274.34; net 46,047.62 — Independent implementation of the T4127 annual formulas (steps 1 to 5).
- [ ] 100,000: ca-taxable 98,873; ca-cpp 4,230.45; ca-ei 1,123.07; ca-income-tax 13,301.60; ca-nb-income-tax 9,714.09; net 71,214.79 — Independent implementation of the T4127 annual formulas (steps 1 to 5).
- [ ] 200,000: ca-taxable 198,873; ca-cpp 4,230.45; ca-ei 1,123.07; ca-income-tax 38,876.54; ca-nb-income-tax 25,773.65; net 129,580.29 — Independent implementation of the T4127 annual formulas (steps 1 to 5).
- [ ] 300,000: ca-taxable 298,873; ca-cpp 4,230.45; ca-ei 1,123.07; ca-income-tax 69,667.99; ca-nb-income-tax 45,273.65; net 179,288.84 — Independent implementation of the T4127 annual formulas (steps 1 to 5).

## Not modelled (confirm the page says so)

- Provincial credits other than the basic personal amount and CPP/EI
- Low-income tax reductions claimed on the return

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/ca/ca-nb.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
