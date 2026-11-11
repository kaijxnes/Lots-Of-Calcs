# Manitoba — 2026 verification checklist

Generated from `data/tax/ca/ca-mb.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

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

### Manitoba basic personal amount (`ca-mb-bpa`)

> $15,780, reduced to nothing as taxable income rises from $200,000 to $400,000.

- [ ] full amount 15,780
- [ ] reduced above 200,000
- [ ] factor 15,780
- [ ] factor 200,000

### Manitoba non-refundable credits (`ca-mb-credits`)

> 10.8% of the basic personal amount (see above) and the base CPP and EI contributions.

- [ ] rate 10.8%

### Basic Manitoba tax (`ca-mb-basic`)

- [ ] from 0: 10.8%
- [ ] from 47,000: 12.75%
- [ ] from 100,000: 17.4%

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 30,000: ca-taxable 29,735; ca-cpp 1,576.75; ca-ei 489; ca-income-tax 1,397.38; ca-mb-income-tax 1,312.66; net 25,224.22 — Independent implementation of the T4127 annual formulas (steps 1 to 5).
- [ ] 60,000: ca-taxable 59,435; ca-cpp 3,361.75; ca-ei 978; ca-income-tax 5,338.30; ca-mb-income-tax 4,549.55; net 45,772.41 — Independent implementation of the T4127 annual formulas (steps 1 to 5).
- [ ] 100,000: ca-taxable 98,873; ca-cpp 4,230.45; ca-ei 1,123.07; ca-income-tax 13,301.60; ca-mb-income-tax 9,484.18; net 71,444.71 — Independent implementation of the T4127 annual formulas (steps 1 to 5).
- [ ] 200,000: ca-taxable 198,873; ca-cpp 4,230.45; ca-ei 1,123.07; ca-income-tax 38,876.54; ca-mb-income-tax 26,831.77; net 128,522.17 — Independent implementation of the T4127 annual formulas (steps 1 to 5).
- [ ] 300,000: ca-taxable 298,873; ca-cpp 4,230.45; ca-ei 1,123.07; ca-income-tax 69,667.99; ca-mb-income-tax 45,074.29; net 179,488.21 — Independent implementation of the T4127 annual formulas (steps 1 to 5).

## Not modelled (confirm the page says so)

- Provincial credits other than the basic personal amount and CPP/EI
- Low-income tax reductions claimed on the return

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/ca/ca-mb.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
