# District of Columbia — 2026 verification checklist

Generated from `data/tax/us/us-dc.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: undefined
- Rates last checked: not yet
- Verified by a person: **not yet**
- Adds to: `us` (check that one too)
- Provisional items: `Standard deduction of $15,000 ($30,000 married) is the 2025 amount; DC had not set its 2026 figure`

## Check against

- **Start here:** https://otr.cfo.dc.gov/sites/default/files/dc/sites/otr/publication/attachments/2025_D40_Book_082026_v1.pdf#page=20
- 2025 DC Form D-40 Booklet, Tax Rate Schedule: https://otr.cfo.dc.gov/sites/default/files/dc/sites/otr/publication/attachments/2025_D40_Book_082026_v1.pdf#page=20
- 2025 DC D-40 Booklet, Standard Deduction (p.13): https://otr.cfo.dc.gov/sites/default/files/dc/sites/otr/publication/attachments/2025_D40_Book_082026_v1.pdf#page=13
- 2021 Form D-40 Booklet: https://otr.cfo.dc.gov/sites/default/files/dc/sites/otr/publication/attachments/52926_D-40_12.21.21_Final_Rev011122.pdf#page=19
- 2022 Form D-40 Booklet: https://otr.cfo.dc.gov/sites/default/files/dc/sites/otr/publication/attachments/2022_D-40_Booklet_Final_blk_01_23_23_Ordc.pdf#page=18
- 2023 Form D-40 Booklet: https://otr.cfo.dc.gov/sites/default/files/dc/sites/otr/publication/attachments/2023_D40_Book_Final_012324.pdf#page=17
- 2024 DC Form D-40 Booklet, Tax Rate Schedule: https://otr.cfo.dc.gov/sites/default/files/dc/sites/otr/publication/attachments/2024_D40_Booklet_011525.pdf#page=17

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in undefined, unless the line says otherwise.

### DC taxable income (`dc-taxable`)

- [ ] Single — less 15,000
- [ ] Married filing jointly — less 30,000

### DC income tax (`dc-income-tax`)

- [ ] from 0: 4%
- [ ] from 10,000: 6%
- [ ] from 40,000: 6.5%
- [ ] from 60,000: 8.5%
- [ ] from 250,000: 9.25%
- [ ] from 500,000: 9.75%
- [ ] from 1,000,000: 10.75%

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 40,000: dc-taxable 25,000; dc-income-tax 1,300; net 33,020 — Dc taxable income $25,000. DC income tax $1,300. PolicyEngine US 2.62.5 differs by $18 on income tax — it projects 2026 values where this file uses the published 2025 ones.
- [ ] 85,000: dc-taxable 70,000; dc-income-tax 4,350; net 64,277.50 — Dc taxable income $70,000. DC income tax $4,350. PolicyEngine US 2.62.5 differs by $25.5 on income tax — it projects 2026 values where this file uses the published 2025 ones.
- [ ] 150,000 with status = married: dc-taxable 120,000; dc-income-tax 8,600; net 114,585 — Dc taxable income $120,000. DC income tax $8,600. PolicyEngine US 2.62.5 differs by $55.25 on income tax — it projects 2026 values where this file uses the published 2025 ones.

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/us/us-dc.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
