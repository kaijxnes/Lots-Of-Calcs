# Arkansas — 2026 verification checklist

Generated from `data/tax/us/us-ar.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: undefined
- Rates last checked: not yet
- Verified by a person: **not yet**
- Adds to: `us` (check that one too)
- Provisional items: `Standard deduction of $2,470 ($4,940 married) is the 2025 amount; the 2026 inflation-adjusted figure was not yet published`

## Check against

- **Start here:** https://arkleg.state.ar.us/Bills/Detail?id=hb1001&ddBienniumSession=2025%2F2026S1
- Arkansas Legislature HB1001 status page (enacted as Act 1, 2026 1st Extraordinary Session): https://arkleg.state.ar.us/Bills/Detail?id=hb1001&ddBienniumSession=2025%2F2026S1
- Arkansas Act 1 of 2026 (HB1001, 1st Extraordinary Session), Section 1 amending A.C.A. § 26-51-201(a)(4): https://www.arkleg.state.ar.us/Home/FTPDocument?path=%2FBills%2F2026S1%2FPublic%2FHB1001.pdf#page=2
- A.C.A. § 26-51-201(a)(5), added by Act 1 of 2026 (1st Extraordinary Session), § 1 (the (a)(1)-(4) tables are indexed under (d)): https://www.arkleg.state.ar.us/Home/FTPDocument?path=%2FACTS%2F2026S1%2FPublic%2FACT1.pdf#page=3
- Arkansas Act 1 of 2026 (1st Extraordinary Session), § 1, amending A.C.A. § 26-51-201(a)(4) and adding (a)(5): https://www.arkleg.state.ar.us/Home/FTPDocument?path=%2FACTS%2F2026S1%2FPublic%2FACT1.pdf#page=1
- A.C.A. § 26-51-201(a)(4)(C), as amended by Act 1 of 2026 (1st Extraordinary Session), § 1: https://www.arkleg.state.ar.us/Home/FTPDocument?path=%2FACTS%2F2026S1%2FPublic%2FACT1.pdf#page=2
- Arkansas 2025 Individual Income Tax Forms and Instructions: https://www.dfa.arkansas.gov/wp-content/uploads/2025_AR1000F_and_AR1000NR_Instructions.pdf#page=14

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in undefined, unless the line says otherwise.

### Arkansas net taxable income (`ar-taxable`)

- [ ] Single — less 2,470
- [ ] Married filing jointly — less 4,940

### Arkansas income tax (`ar-income-tax`)

> Above $94,700 of net income a separate high-income table applies to all income, less a bracket adjustment that runs out by $97,600. The $29 personal credit ($58 married) is taken off.

- [ ] applies when up to 94,700
- [ ] from 0: 0%
- [ ] from 5,600: 2%
- [ ] from 11,200: 3%
- [ ] from 16,000: 3.4%
- [ ] from 26,400: 3.7%
- [ ] from 0: 2%
- [ ] from 4,700: 3.7%
- [ ] over 94,700: 290
- [ ] over 94,800: 280
- [ ] over 94,900: 270
- [ ] over 95,000: 260
- [ ] over 95,100: 250
- [ ] over 95,200: 240
- [ ] over 95,300: 230
- [ ] over 95,400: 220
- [ ] over 95,500: 210
- [ ] over 95,600: 200
- [ ] over 95,700: 190
- [ ] over 95,800: 180
- [ ] over 95,900: 170
- [ ] over 96,000: 160
- [ ] over 96,100: 150
- [ ] over 96,200: 140
- [ ] over 96,300: 130
- [ ] over 96,400: 120
- [ ] over 96,500: 110
- [ ] over 96,600: 100
- [ ] over 96,700: 90
- [ ] over 96,800: 80
- [ ] over 96,900: 70
- [ ] over 97,000: 60
- [ ] over 97,100: 50
- [ ] over 97,200: 40
- [ ] over 97,300: 30
- [ ] over 97,400: 20
- [ ] over 97,500: 10
- [ ] over 97,600: 0
- [ ] factor 29
- [ ] Single — factor 1
- [ ] Married filing jointly — factor 2

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 40,000: ar-taxable 37,530; ar-income-tax 992.41; net 33,327.59 — Arkansas net taxable income $37,530. Arkansas income tax $992.41. PolicyEngine US 2.62.5 differs by $3.41 on income tax — it projects 2026 values where this file uses the published 2025 ones.
- [ ] 85,000: ar-taxable 82,530; ar-income-tax 2,657.41; net 65,970.09 — Arkansas net taxable income $82,530. Arkansas income tax $2,657.41. PolicyEngine US 2.62.5 differs by $3.41 on income tax — it projects 2026 values where this file uses the published 2025 ones.
- [ ] 150,000 with status = married: ar-taxable 145,060; ar-income-tax 5,229.32; net 117,955.68 — Arkansas net taxable income $145,060. Arkansas income tax $5,229.32. PolicyEngine US 2.62.5 differs by $4.07 on income tax — it projects 2026 values where this file uses the published 2025 ones.

## Not modelled (confirm the page says so)

- Arkansas's low-income tax tables, which lower tax below about $17,500 of income ($29,000 married)
- Rounding to the Regular Income Tax Table's $100 rows (a dollar or two either way)

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/us/us-ar.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
