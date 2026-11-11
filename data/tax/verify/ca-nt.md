# Northwest Territories — 2026 verification checklist

Generated from `data/tax/ca/ca-nt.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

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

### Northwest Territories non-refundable credits (`ca-nt-credits`)

> 5.9% of the basic personal amount ($18,198) and the base CPP and EI contributions.

- [ ] rate 5.9%
- [ ] amount 18,198

### Basic Northwest Territories tax (`ca-nt-basic`)

- [ ] from 0: 5.9%
- [ ] from 53,003: 8.6%
- [ ] from 106,009: 12.2%
- [ ] from 172,346: 14.05%

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 30,000: ca-taxable 29,735; ca-cpp 1,576.75; ca-ei 489; ca-income-tax 1,397.38; ca-nt-income-tax 574.44; net 25,962.44 — Independent implementation of the T4127 annual formulas (steps 1 to 5).
- [ ] 60,000: ca-taxable 59,435; ca-cpp 3,361.75; ca-ei 978; ca-income-tax 5,338.30; ca-nt-income-tax 2,383.94; net 47,938.02 — Independent implementation of the T4127 annual formulas (steps 1 to 5).
- [ ] 100,000: ca-taxable 98,873; ca-cpp 4,230.45; ca-ei 1,123.07; ca-income-tax 13,301.60; ca-nt-income-tax 5,724.41; net 75,204.48 — Independent implementation of the T4127 annual formulas (steps 1 to 5).
- [ ] 200,000: ca-taxable 198,873; ca-cpp 4,230.45; ca-ei 1,123.07; ca-income-tax 38,876.54; ca-nt-income-tax 18,158.26; net 137,195.68 — Independent implementation of the T4127 annual formulas (steps 1 to 5).
- [ ] 300,000: ca-taxable 298,873; ca-cpp 4,230.45; ca-ei 1,123.07; ca-income-tax 69,667.99; ca-nt-income-tax 32,208.26; net 192,354.23 — Independent implementation of the T4127 annual formulas (steps 1 to 5).

## Not modelled (confirm the page says so)

- Provincial credits other than the basic personal amount and CPP/EI

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/ca/ca-nt.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
