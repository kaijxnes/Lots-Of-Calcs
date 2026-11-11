# Oregon — 2026 verification checklist

Generated from `data/tax/us/us-or.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: undefined
- Rates last checked: not yet
- Verified by a person: **not yet**
- Adds to: `us` (check that one too)
- Provisional items: `Standard deduction ($2,835 / $5,670) and exemption credit ($256) are the 2025 amounts`

## Check against

- **Start here:** https://www.oregon.gov/dor/forms/FormsPubs/publication-or-estimate_101-026_2026.pdf#page=3
- 2026 Publication OR-ESTIMATE, Oregon Estimated Income Tax Instructions, rate charts for 2026 (Charts S and J): https://www.oregon.gov/dor/forms/FormsPubs/publication-or-estimate_101-026_2026.pdf#page=3
- 2026 Oregon Withholding Tax Formulas (150-206-436), annual wages formula: https://www.oregon.gov/dor/forms/FormsPubs/withholding-tax-formulas_206-436_2026.pdf#page=6
- 2026 Oregon Withholding Tax Formulas (150-206-436), federal tax withheld phase-out: https://www.oregon.gov/dor/forms/FormsPubs/withholding-tax-formulas_206-436_2026.pdf#page=7
- 2025 Oregon Income Tax Form OR-40 Instructions: https://www.oregon.gov/dor/forms/FormsPubs/form-or-40-inst_101-040-1_2025.pdf#page=18
- 2025 Oregon Income Tax Form OR-40 Instructions: https://www.oregon.gov/dor/forms/FormsPubs/form-or-40-inst_101-040-1_2025.pdf#page=16
- 2025 Oregon Income Tax Form OR-40 Instructions: https://www.oregon.gov/dor/forms/FormsPubs/form-or-40-inst_101-040-1_2025.pdf#page=17

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in undefined, unless the line says otherwise.

### Federal tax subtraction (`or-federal-tax-subtraction`)

> Federal income tax paid is deductible up to $8,750, phasing out from $125,000 ($250,000 married).

- [ ] Single — from 0: 8,750
- [ ] Single — from 125,000: 7,000
- [ ] Single — from 130,000: 5,250
- [ ] Single — from 135,000: 3,500
- [ ] Single — from 140,000: 1,750
- [ ] Single — from 145,000: 0
- [ ] Married filing jointly — from 0: 8,750
- [ ] Married filing jointly — from 250,000: 7,000
- [ ] Married filing jointly — from 260,000: 5,250
- [ ] Married filing jointly — from 270,000: 3,500
- [ ] Married filing jointly — from 280,000: 1,750
- [ ] Married filing jointly — from 290,000: 0

### Oregon taxable income (`or-taxable`)

- [ ] Single — less 2,835
- [ ] Married filing jointly — less 5,670

### Oregon income tax (`or-income-tax`)

> Less the $256 exemption credit each, for incomes up to $100,000 ($200,000 married).

- [ ] Single — from 0: 4.75%
- [ ] Single — from 4,550: 6.75%
- [ ] Single — from 11,400: 8.75%
- [ ] Single — from 125,000: 9.9%
- [ ] Married filing jointly — from 0: 4.75%
- [ ] Married filing jointly — from 9,100: 6.75%
- [ ] Married filing jointly — from 22,800: 8.75%
- [ ] Married filing jointly — from 250,000: 9.9%
- [ ] Single — applies when up to 100,000
- [ ] Married filing jointly — applies when up to 200,000
- [ ] factor 256
- [ ] Single — factor 1
- [ ] Married filing jointly — factor 2

### Statewide transit tax (`or-transit`)

- [ ] rate 0.1%

### Paid Leave Oregon (`or-pfml`)

> 60% of the 1% contribution, on wages up to the Social Security wage base.

- [ ] rate 0.6%
- [ ] capped at 184,500

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 40,000: or-federal-tax-subtraction 2,620; or-taxable 34,545; or-income-tax 2,447.69; or-transit 40; or-pfml 240; net 31,592.31 — Federal tax subtraction $2,620, oregon taxable income $34,545. Oregon income tax $2,447.69; Statewide transit tax $40; Paid Leave Oregon $240. PolicyEngine US 2.62.5 differs by $11.05 on income tax — it projects 2026 values where this file uses the published 2025 ones.
- [ ] 85,000: or-federal-tax-subtraction 8,750; or-taxable 73,415; or-income-tax 5,848.81; or-transit 85; or-pfml 510; net 62,183.69 — Federal tax subtraction $8,750, oregon taxable income $73,415. Oregon income tax $5,848.81; Statewide transit tax $85; Paid Leave Oregon $510. PolicyEngine US 2.62.5 differs by $11.05 on income tax — it projects 2026 values where this file uses the published 2025 ones.
- [ ] 150,000 with status = married: or-federal-tax-subtraction 8,750; or-taxable 135,580; or-income-tax 10,713.25; or-transit 150; or-pfml 900; net 111,421.75 — Federal tax subtraction $8,750, oregon taxable income $135,580. Oregon income tax $10,713.25; Statewide transit tax $150; Paid Leave Oregon $900. PolicyEngine US 2.62.5 differs by $22.54 on income tax — it projects 2026 values where this file uses the published 2025 ones.

## Not modelled (confirm the page says so)

- Portland-area taxes: Metro Supportive Housing Services (1% over $125,000) and Multnomah County Preschool for All (1.5–3% over $125,000)
- TriMet and Lane transit taxes (employer-paid)
- Kicker credit

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/us/us-or.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
