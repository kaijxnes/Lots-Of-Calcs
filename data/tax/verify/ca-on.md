# Ontario — 2026 verification checklist

Generated from `data/tax/ca/ca-on.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

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

### Ontario non-refundable credits (`ca-on-credits`)

> 5.05% of the basic personal amount ($12,989) and the base CPP and EI contributions.

- [ ] rate 5.05%
- [ ] amount 12,989

### Basic Ontario tax (`ca-on-basic`)

- [ ] from 0: 5.05%
- [ ] from 53,891: 9.15%
- [ ] from 107,785: 11.16%
- [ ] from 150,000: 12.16%
- [ ] from 220,000: 13.16%

### Ontario surtax (`ca-on-surtax`)

> 20% of basic Ontario tax over $5,818, plus 36% of basic Ontario tax over $7,446.

- [ ] rate 20%
- [ ] less 5,818
- [ ] rate 36%
- [ ] less 7,446

### Ontario tax reduction (`ca-on-reduction`)

> Twice the $300 basic reduction, less the tax: removes Ontario tax entirely for low incomes.

- [ ] amount 600

### Ontario Health Premium (`ca-on-health-premium`)

> Up to $900 a year, rising in steps with taxable income over $20,000.

- [ ] over 0: 0
- [ ] over 20,000 — capped at 300
- [ ] over 20,000 — rate 6%
- [ ] over 20,000 — less 20,000
- [ ] over 36,000 — capped at 450
- [ ] over 36,000 — amount 300
- [ ] over 36,000 — rate 6%
- [ ] over 36,000 — less 36,000
- [ ] over 48,000 — capped at 600
- [ ] over 48,000 — amount 450
- [ ] over 48,000 — rate 25%
- [ ] over 48,000 — less 48,000
- [ ] over 72,000 — capped at 750
- [ ] over 72,000 — amount 600
- [ ] over 72,000 — rate 25%
- [ ] over 72,000 — less 72,000
- [ ] over 200,000 — capped at 900
- [ ] over 200,000 — amount 750
- [ ] over 200,000 — rate 25%
- [ ] over 200,000 — less 200,000

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 30,000: ca-taxable 29,735; ca-cpp 1,576.75; ca-ei 489; ca-income-tax 1,397.38; ca-on-income-tax 754.74; net 25,482.14; ca-on-health-premium 300 — Independent implementation of the T4127 annual formulas (steps 1 to 5).
- [ ] 60,000: ca-taxable 59,435; ca-cpp 3,361.75; ca-ei 978; ca-income-tax 5,338.30; ca-on-income-tax 2,382.20; net 47,339.75; ca-on-health-premium 600 — Independent implementation of the T4127 annual formulas (steps 1 to 5).
- [ ] 100,000: ca-taxable 98,873; ca-cpp 4,230.45; ca-ei 1,123.07; ca-income-tax 13,301.60; ca-on-income-tax 5,972.75; net 74,206.13; ca-on-health-premium 750 — Independent implementation of the T4127 annual formulas (steps 1 to 5).
- [ ] 200,000: ca-taxable 198,873; ca-cpp 4,230.45; ca-ei 1,123.07; ca-income-tax 38,876.54; ca-on-income-tax 23,325.67; net 131,278.27; ca-on-health-premium 750 — Independent implementation of the T4127 annual formulas (steps 1 to 5).
- [ ] 300,000: ca-taxable 298,873; ca-cpp 4,230.45; ca-ei 1,123.07; ca-income-tax 69,667.99; ca-on-income-tax 43,525.69; net 180,136.81; ca-on-health-premium 900 — Independent implementation of the T4127 annual formulas (steps 1 to 5).

## Not modelled (confirm the page says so)

- Provincial credits other than the basic personal amount and CPP/EI
- The reduction for dependants (factor Y)
- The Ontario Trillium Benefit and LIFT credit, claimed on the return

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/ca/ca-on.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
