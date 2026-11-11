# Nebraska — 2026 verification checklist

Generated from `data/tax/us/us-ne.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: undefined
- Rates last checked: not yet
- Verified by a person: **not yet**
- Adds to: `us` (check that one too)

## Check against

- **Start here:** https://revenue.nebraska.gov/sites/default/files/doc/tax-forms/2025/f_1040N-ES.pdf#page=5
- 2026 Nebraska Individual Estimated Income Tax Payment Vouchers (Form 1040N-ES), Additional Standard Deduction for Elderly and/or Blind: https://revenue.nebraska.gov/sites/default/files/doc/tax-forms/2025/f_1040N-ES.pdf#page=5
- 2026 Nebraska Individual Estimated Income Tax Payment Vouchers (Form 1040N-ES), Income Tax Worksheet line 5: https://revenue.nebraska.gov/sites/default/files/doc/tax-forms/2025/f_1040N-ES.pdf#page=4
- 2026 Nebraska Estimated Income Tax Rate Schedule (Form 1040N-ES), personal exemption credit: https://revenue.nebraska.gov/sites/default/files/doc/tax-forms/2025/f_1040N-ES.pdf#page=6
- 2025 Nebraska Individual Income Tax Booklet, Line 6: https://revenue.nebraska.gov/sites/default/files/doc/tax-forms/2025/f_Individual_Income_Tax_Booklet.pdf#page=13
- 2025 Nebraska Individual Income Tax Booklet, Line 18: https://revenue.nebraska.gov/sites/default/files/doc/tax-forms/2025/f_Individual_Income_Tax_Booklet.pdf#page=14
- 2025 Nebraska Individual Income Tax Booklet, Tax Table: https://revenue.nebraska.gov/sites/default/files/doc/tax-forms/2025/f_Individual_Income_Tax_Booklet.pdf#page=49

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in undefined, unless the line says otherwise.

### Nebraska taxable income (`ne-taxable`)

- [ ] Single — less 8,850
- [ ] Married filing jointly — less 17,700

### Nebraska income tax (`ne-income-tax`)

> Less the $176 personal exemption credit per person.

- [ ] Single — from 0: 2.46%
- [ ] Single — from 4,130: 3.51%
- [ ] Single — from 24,760: 4.55%
- [ ] Married filing jointly — from 0: 2.46%
- [ ] Married filing jointly — from 8,250: 3.51%
- [ ] Married filing jointly — from 49,530: 4.55%
- [ ] factor 176
- [ ] Single — factor 1
- [ ] Married filing jointly — factor 2

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 40,000: ne-taxable 31,150; ne-income-tax 940.46; net 33,379.54 — Nebraska taxable income $31,150. Nebraska income tax $940.46. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 85,000: ne-taxable 76,150; ne-income-tax 2,987.96; net 65,639.54 — Nebraska taxable income $76,150. Nebraska income tax $2,987.96. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 150,000 with status = married: ne-taxable 132,300; ne-income-tax 5,065.91; net 118,119.09 — Nebraska taxable income $132,300. Nebraska income tax $5,065.91. PolicyEngine US 2.62.5 gives the same state figures to the cent.

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/us/us-ne.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
