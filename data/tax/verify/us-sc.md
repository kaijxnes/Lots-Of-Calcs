# South Carolina — 2026 verification checklist

Generated from `data/tax/us/us-sc.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: undefined
- Rates last checked: not yet
- Verified by a person: **not yet**
- Adds to: `us` (check that one too)

## Check against

- **Start here:** https://www.scstatehouse.gov/sess126_2025-2026/bills/4216.htm
- SC H.4216 Section 1 - Section 12-6-510(C) (2026+): https://www.scstatehouse.gov/sess126_2025-2026/bills/4216.htm
- SC 1040 Instructions 2025: https://dor.sc.gov/sites/dor/files/forms/SC1040Instr_2025.pdf#page=1
- IRS Rev. Proc. 2024-40 § 3.15 (2025 inflation-adjusted values under pre-OBBBA rule): https://www.irs.gov/pub/irs-drop/rp-24-40.pdf#page=12
- SC 1040 tax form instructions (2025): https://dor.sc.gov/sites/dor/files/forms/SC1040Instr_2025.pdf#page=17
- SC 1040 tax form instructions (2025): https://dor.sc.gov/sites/dor/files/forms/SC1040Instr_2025.pdf#page=6
- SC 1040 tax form instructions (2025): https://dor.sc.gov/sites/dor/files/forms/SC1040Instr_2025.pdf#page=12

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in undefined, unless the line says otherwise.

### South Carolina income adjusted deduction (`sc-deduction`)

> New for 2026: $15,000 ($30,000 married), phased out between $40,000 and $95,000 of income ($80,000–$190,000 married).

- [ ] Single — amount 15,000
- [ ] Married filing jointly — amount 30,000
- [ ] Single — factor 15,000
- [ ] Married filing jointly — factor 30,000
- [ ] capped at 1
- [ ] Single — less 40,000
- [ ] Married filing jointly — less 80,000
- [ ] Single — factor 55,000
- [ ] Married filing jointly — factor 110,000

### South Carolina income tax (`sc-income-tax`)

> 1.99% on the first $30,000 and 5.21% above it from 2026.

- [ ] from 0: 1.99%
- [ ] from 30,000: 5.21%

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 40,000: sc-deduction 15,000; sc-taxable 25,000; sc-income-tax 497.50; net 33,822.50 — South carolina income adjusted deduction $15,000, south carolina taxable income $25,000. South Carolina income tax $497.5. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 85,000: sc-deduction 2,730; sc-taxable 82,270; sc-income-tax 3,320.27; net 65,307.23 — South carolina income adjusted deduction $2,730, south carolina taxable income $82,270. South Carolina income tax $3,320.27. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 150,000 with status = married: sc-deduction 10,910; sc-taxable 139,090; sc-income-tax 6,280.59; net 116,904.41 — South carolina income adjusted deduction $10,910, south carolina taxable income $139,090. South Carolina income tax $6,280.59. PolicyEngine US 2.62.5 gives the same state figures to the cent.

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/us/us-sc.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
