# Hawaii — 2026 verification checklist

Generated from `data/tax/us/us-hi.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: undefined
- Rates last checked: not yet
- Verified by a person: **not yet**
- Adds to: `us` (check that one too)

## Check against

- **Start here:** https://data.capitol.hawaii.gov/sessions/session2026/bills/SB3125_CD1_.HTM
- S.B. 3125 C.D. 1 (Act 24, SLH 2026) Section 2, amending HRS Section 235-51 (b) - restructured rate schedule with a 13% top bracket for taxable years beginning after December 31, 2026 (effective date in Section 9): https://data.capitol.hawaii.gov/sessions/session2026/bills/SB3125_CD1_.HTM
- S.B. 3125 measure status (Act 24, SLH 2026): https://www.capitol.hawaii.gov/session/measure_indiv.aspx?billtype=SB&billnumber=3125
- 2025 Hawaii N-11 Instructions Alternative Tax: https://files.hawaii.gov/tax/forms/current/n11ins.pdf#page=33
- 2025 Hawaii Form N-311 Instructions: https://files.hawaii.gov/tax/forms/current/n311_i.pdf#page=1
- 2025 Hawaii Tax Form Instruction Booklet line 23: https://files.hawaii.gov/tax/forms/current/n11ins.pdf#page=20
- 2025 Hawaii Tax Rate Schedules for Taxable Years Beginning After December 31, 2024: https://dev1-tax.hawaii.gov/forms/d_25table-on/d_25table-on_p13/

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in undefined, unless the line says otherwise.

### Hawaii taxable income (`hi-taxable`)

> Standard deduction of $8,000 ($16,000 married) under Act 46 (2024), and a $1,144 personal exemption each.

- [ ] Single — less 8,000
- [ ] Married filing jointly — less 16,000
- [ ] factor 1,144
- [ ] Single — factor 1
- [ ] Married filing jointly — factor 2

### Hawaii income tax (`hi-income-tax`)

> Less the refundable food/excise tax credit of up to $220 per person, which runs out at $40,000 of income ($60,000 married).

- [ ] Single — from 0: 1.4%
- [ ] Single — from 9,600: 3.2%
- [ ] Single — from 14,400: 5.5%
- [ ] Single — from 19,200: 6.4%
- [ ] Single — from 24,000: 6.8%
- [ ] Single — from 36,000: 7.2%
- [ ] Single — from 48,000: 7.6%
- [ ] Single — from 125,000: 7.9%
- [ ] Single — from 175,000: 8.25%
- [ ] Single — from 225,000: 9%
- [ ] Single — from 275,000: 10%
- [ ] Single — from 325,000: 11%
- [ ] Married filing jointly — from 0: 1.4%
- [ ] Married filing jointly — from 19,200: 3.2%
- [ ] Married filing jointly — from 28,800: 5.5%
- [ ] Married filing jointly — from 38,400: 6.4%
- [ ] Married filing jointly — from 48,000: 6.8%
- [ ] Married filing jointly — from 72,000: 7.2%
- [ ] Married filing jointly — from 96,000: 7.6%
- [ ] Married filing jointly — from 250,000: 7.9%
- [ ] Married filing jointly — from 350,000: 8.25%
- [ ] Married filing jointly — from 450,000: 9%
- [ ] Married filing jointly — from 550,000: 10%
- [ ] Married filing jointly — from 650,000: 11%
- [ ] Single — from 0: 220
- [ ] Single — from 15,000: 200
- [ ] Single — from 20,000: 170
- [ ] Single — from 25,000: 140
- [ ] Single — from 30,000: 110
- [ ] Single — from 40,000: 0
- [ ] Married filing jointly — from 0: 220
- [ ] Married filing jointly — from 15,000: 200
- [ ] Married filing jointly — from 20,000: 170
- [ ] Married filing jointly — from 25,000: 140
- [ ] Married filing jointly — from 30,000: 110
- [ ] Married filing jointly — from 40,000: 90
- [ ] Married filing jointly — from 50,000: 70
- [ ] Married filing jointly — from 60,000: 0
- [ ] Single — factor 1
- [ ] Married filing jointly — factor 2

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 40,000: hi-taxable 30,856; hi-income-tax 1,325.41; net 32,994.59 — Hawaii taxable income $30,856. Hawaii income tax $1,325.41. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 85,000: hi-taxable 75,856; hi-income-tax 4,656.26; net 63,971.24 — Hawaii taxable income $75,856. Hawaii income tax $4,656.26. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 150,000 with status = married: hi-taxable 131,712; hi-income-tax 7,792.51; net 115,392.49 — Hawaii taxable income $131,712. Hawaii income tax $7,792.51. PolicyEngine US 2.62.5 gives the same state figures to the cent.

## Not modelled (confirm the page says so)

- Temporary Disability Insurance (up to 0.5% of wages, capped weekly — employers may pay it all)

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/us/us-hi.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
