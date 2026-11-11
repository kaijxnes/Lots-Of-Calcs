# Wisconsin — 2026 verification checklist

Generated from `data/tax/us/us-wi.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: undefined
- Rates last checked: not yet
- Verified by a person: **not yet**
- Adds to: `us` (check that one too)

## Check against

- **Start here:** https://www.revenue.wi.gov/TaxForms2026/2026-Form1-ES-Inst.pdf#page=2
- 2026 Form 1-ES instructions, 2026 Standard Deduction schedules: https://www.revenue.wi.gov/TaxForms2026/2026-Form1-ES-Inst.pdf#page=2
- 2026 Form 1-ES instructions: https://www.revenue.wi.gov/TaxForms2026/2026-Form1-ES-Inst.pdf#page=3
- 2025 Wisconsin Schedule H instructions, Table B: https://www.revenue.wi.gov/TaxForms2025/2025-ScheduleH-inst.pdf#page=26
- 2025 Wisconsin Schedule H, Line 12b: https://www.revenue.wi.gov/TaxForms2025/2025-ScheduleH.pdf#page=2
- 2025 Wisconsin Form 1, Schedule 1: https://www.revenue.wi.gov/TaxForms2025/2025-Form1.pdf#page=4
- 2025 Form 1 instructions - Homeowner's School Property Tax Credit Table: https://www.revenue.wi.gov/TaxForms2025/2025-Form1-inst.pdf#page=20

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in undefined, unless the line says otherwise.

### Wisconsin standard deduction (`wi-standard-deduction`)

> A sliding deduction that shrinks by 12% of income over $20,120 (19.778% over $29,040 married).

- [ ] Single — amount 13,960
- [ ] Married filing jointly — amount 25,840
- [ ] Single — factor 0.12
- [ ] Married filing jointly — factor 0.19778
- [ ] Single — less 20,120
- [ ] Married filing jointly — less 29,040

### Wisconsin taxable income (`wi-taxable`)

- [ ] factor 700
- [ ] Single — factor 1
- [ ] Married filing jointly — factor 2

### Wisconsin income tax (`wi-income-tax`)

- [ ] Single — from 0: 3.5%
- [ ] Single — from 15,110: 4.4%
- [ ] Single — from 51,950: 5.3%
- [ ] Single — from 332,720: 7.65%
- [ ] Married filing jointly — from 0: 3.5%
- [ ] Married filing jointly — from 20,150: 4.4%
- [ ] Married filing jointly — from 69,260: 5.3%
- [ ] Married filing jointly — from 443,630: 7.65%

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 40,000: wi-standard-deduction 11,574.40; wi-taxable 27,725.60; wi-income-tax 1,083.94; net 33,236.06 — Wisconsin standard deduction $11,574.4, wisconsin taxable income $27,725.6. Wisconsin income tax $1,083.94. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 85,000: wi-standard-deduction 6,174.40; wi-taxable 78,125.60; wi-income-tax 3,537.12; net 65,090.38 — Wisconsin standard deduction $6,174.4, wisconsin taxable income $78,125.6. Wisconsin income tax $3,537.12. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 150,000 with status = married: wi-standard-deduction 1,916.53; wi-taxable 146,683.47; wi-income-tax 6,969.53; net 116,215.47 — Wisconsin standard deduction $1,916.53, wisconsin taxable income $146,683.47. Wisconsin income tax $6,969.53. PolicyEngine US 2.62.5 gives the same state figures to the cent.

## Not modelled (confirm the page says so)

- Married couple credit (needs both spouses to have earnings)

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/us/us-wi.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
