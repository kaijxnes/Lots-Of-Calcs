# Rhode Island — 2026 verification checklist

Generated from `data/tax/us/us-ri.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: undefined
- Rates last checked: not yet
- Verified by a person: **not yet**
- Adds to: `us` (check that one too)

## Check against

- **Start here:** https://tax.ri.gov/sites/g/files/xkgbur541/files/2025-11/ADV_2025_22_Inflation_Adjustments.pdf#page=1
- Rhode Island Division of Taxation, ADV 2025-22 - Inflation-adjusted amounts set for Tax Year 2026: https://tax.ri.gov/sites/g/files/xkgbur541/files/2025-11/ADV_2025_22_Inflation_Adjustments.pdf#page=1
- 2026 R.I. H 7127 Substitute A as amended, Article 6, Section 5, § 44-30-2.6(c)(3)(A)(I)(2): https://webserver.rilegislature.gov/BillText/BillText26/HouseText26/H7127Aaa.html#:~:text=High-income%20surtax
- Rhode Island Division of Taxation Advisory ADV 2025-22: https://tax.ri.gov/sites/g/files/xkgbur541/files/2025-11/ADV_2025_22_Inflation_Adjustments.pdf#page=2
- Rhode Island Tax Rate Schedule - 2025: https://tax.ri.gov/sites/g/files/xkgbur541/files/2025-12/2025%201040R%20Instructions%20122025.pdf#page=13
- Rhode Island RI-1040 Instructions 2025: https://tax.ri.gov/sites/g/files/xkgbur541/files/2025-12/2025%201040R%20Instructions%20122025.pdf#page=4
- Rhode Island Tax Rate Schedule and Worksheets 2025 (Standard Deduction Worksheet): https://tax.ri.gov/sites/g/files/xkgbur541/files/2025-10/2025%20Tax%20Rate%20and%20Worksheets_d.pdf

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in undefined, unless the line says otherwise.

### Rhode Island taxable income (`ri-taxable`)

> Standard deduction and $5,250 exemption each, both reduced by 20% for each $7,450 of income over $261,000.

- [ ] Single — full amount 11,200
- [ ] Married filing jointly — full amount 22,400
- [ ] reduced above 261,000
- [ ] for each step of 7,450
- [ ] reduced per step by % 20
- [ ] factor 5,250
- [ ] Single — factor 1
- [ ] Married filing jointly — factor 2

### Rhode Island income tax (`ri-income-tax`)

- [ ] from 0: 3.75%
- [ ] from 82,050: 4.75%
- [ ] from 186,450: 5.99%

### Temporary Disability Insurance (`ri-tdi`)

- [ ] rate 1.1%
- [ ] capped at 100,000

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 40,000: ri-taxable 23,550; ri-income-tax 883.13; ri-tdi 440; net 32,996.88 — Rhode island taxable income $23,550. Rhode Island income tax $883.13; Temporary Disability Insurance $440. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 85,000: ri-taxable 68,550; ri-income-tax 2,570.63; ri-tdi 935; net 65,121.88 — Rhode island taxable income $68,550. Rhode Island income tax $2,570.63; Temporary Disability Insurance $935. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 150,000 with status = married: ri-taxable 117,100; ri-income-tax 4,741.75; ri-tdi 1,100; net 117,343.25 — Rhode island taxable income $117,100. Rhode Island income tax $4,741.75; Temporary Disability Insurance $1,100. PolicyEngine US 2.62.5 gives the same state figures to the cent.

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/us/us-ri.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
