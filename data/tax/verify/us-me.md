# Maine — 2026 verification checklist

Generated from `data/tax/us/us-me.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: undefined
- Rates last checked: not yet
- Verified by a person: **not yet**
- Adds to: `us` (check that one too)
- Provisional items: `Personal exemption of $5,150 is the 2025 amount`

## Check against

- **Start here:** https://www.irs.gov/pub/irs-drop/rp-25-32.pdf#page=18
- IRS Rev. Proc. 2025-32, Section 4.14(3) (2026 federal additional standard deduction for the aged or the blind): https://www.irs.gov/pub/irs-drop/rp-25-32.pdf#page=18
- P.L. 2025, c. 650, Pt. K, § 14 (LD 2212) / 36 M.R.S. § 5124-C(1-C) (Standard deduction amounts for tax year 2026): https://legislature.maine.gov/legis/bills/getPDF.asp?paper=HP1491&item=37&snum=132#page=138
- 2026 Maine Estimated Tax Worksheet, Line 6b - Phaseout of Personal Exemption Deduction Amount Worksheet: https://www.maine.gov/revenue/sites/maine.gov.revenue/files/inline-files/26_1040es_pers_exempt_phaseout_wksht.pdf
- Maine Revenue Services 2026 Legislative Changes Summary, conformity (page 2) and 2026 standard deduction (page 6): https://www.maine.gov/revenue/sites/maine.gov.revenue/files/inline-files/legischange26.pdf#page=6
- Maine Revenue Services 2026 Individual Income Tax Rate Schedule (revised May 20, 2026): https://www.maine.gov/revenue/sites/maine.gov.revenue/files/2026-05/ind_tax_rate_sched_2026_rev.pdf
- Maine Revenue Services 2026 Legislative Changes Summary, standard deduction for tax years beginning on or after January 1, 2027 (page 9): https://www.maine.gov/revenue/sites/maine.gov.revenue/files/inline-files/legischange26.pdf#page=9

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in undefined, unless the line says otherwise.

### Maine taxable income (`me-taxable`)

> The standard deduction phases out above $102,250 ($204,550 married) and the $5,150 personal exemption above $341,000.

- [ ] Single — full amount 15,700
- [ ] Married filing jointly — full amount 31,400
- [ ] Single — reduced above 102,250
- [ ] Married filing jointly — reduced above 204,550
- [ ] Single — factor 15,700
- [ ] Married filing jointly — factor 31,400
- [ ] Single — factor 75,000
- [ ] Married filing jointly — factor 150,000
- [ ] factor 5,150
- [ ] Single — factor 1
- [ ] Married filing jointly — factor 2
- [ ] Single — reduced above 341,000
- [ ] Married filing jointly — reduced above 409,150
- [ ] factor 125,000

### Maine income tax (`me-income-tax`)

> Includes the 2% surcharge on taxable income over $1 million ($1.5 million married) that starts in 2026.

- [ ] Single — from 0: 5.8%
- [ ] Single — from 27,400: 6.75%
- [ ] Single — from 64,850: 7.15%
- [ ] Married filing jointly — from 0: 5.8%
- [ ] Married filing jointly — from 54,850: 6.75%
- [ ] Married filing jointly — from 129,750: 7.15%
- [ ] rate 2%
- [ ] Single — less 1,000,000
- [ ] Married filing jointly — less 1,500,000

### Paid Family and Medical Leave (`me-pfml`)

- [ ] rate 0.5%
- [ ] capped at 184,500

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 40,000: me-taxable 19,150; me-income-tax 1,110.70; me-pfml 200; net 33,009.30 — Maine taxable income $19,150. Maine income tax $1,110.7; Paid Family and Medical Leave $200. PolicyEngine US 2.62.5 differs by $5.8 on income tax — it projects 2026 values where this file uses the published 2025 ones.
- [ ] 85,000: me-taxable 64,150; me-income-tax 4,069.83; me-pfml 425; net 64,132.68 — Maine taxable income $64,150. Maine income tax $4,069.83; Paid Family and Medical Leave $425. PolicyEngine US 2.62.5 differs by $6.75 on income tax — it projects 2026 values where this file uses the published 2025 ones.
- [ ] 150,000 with status = married: me-taxable 108,300; me-income-tax 6,789.18; me-pfml 750; net 115,645.83 — Maine taxable income $108,300. Maine income tax $6,789.18; Paid Family and Medical Leave $750. PolicyEngine US 2.62.5 differs by $13.51 on income tax — it projects 2026 values where this file uses the published 2025 ones.

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/us/us-me.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
