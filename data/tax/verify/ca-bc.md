# British Columbia — 2026 verification checklist

Generated from `data/tax/ca/ca-bc.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

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

### British Columbia non-refundable credits (`ca-bc-credits`)

> 5.6% of the basic personal amount ($13,216) and the base CPP and EI contributions.

- [ ] rate 5.6%
- [ ] amount 13,216

### Basic British Columbia tax (`ca-bc-basic`)

- [ ] from 0: 5.6%
- [ ] from 50,363: 7.7%
- [ ] from 100,728: 10.5%
- [ ] from 115,648: 12.29%
- [ ] from 140,430: 14.7%
- [ ] from 190,405: 16.8%
- [ ] from 265,545: 20.5%

### BC tax reduction (`ca-bc-reduction`)

> Up to $690, reduced by 3.56% of taxable income over $25,570 (gone by $44,952).

- [ ] amount 690
- [ ] rate 3.56%
- [ ] less 25,570

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 30,000: ca-taxable 29,735; ca-cpp 1,576.75; ca-ei 489; ca-income-tax 1,397.38; ca-bc-income-tax 282.50; net 26,254.38 — Independent implementation of the T4127 annual formulas (steps 1 to 5).
- [ ] 60,000: ca-taxable 59,435; ca-cpp 3,361.75; ca-ei 978; ca-income-tax 5,338.30; ca-bc-income-tax 2,567.39; net 47,754.57 — Independent implementation of the T4127 annual formulas (steps 1 to 5).
- [ ] 100,000: ca-taxable 98,873; ca-cpp 4,230.45; ca-ei 1,123.07; ca-income-tax 13,301.60; ca-bc-income-tax 5,555.52; net 75,373.36 — Independent implementation of the T4127 annual formulas (steps 1 to 5).
- [ ] 200,000: ca-taxable 198,873; ca-cpp 4,230.45; ca-ei 1,123.07; ca-income-tax 38,876.54; ca-bc-income-tax 19,079.61; net 136,274.32 — Independent implementation of the T4127 annual formulas (steps 1 to 5).
- [ ] 300,000: ca-taxable 298,873; ca-cpp 4,230.45; ca-ei 1,123.07; ca-income-tax 69,667.99; ca-bc-income-tax 37,112.75; net 187,449.74 — Independent implementation of the T4127 annual formulas (steps 1 to 5).

## Not modelled (confirm the page says so)

- Provincial credits other than the basic personal amount and CPP/EI

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/ca/ca-bc.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
