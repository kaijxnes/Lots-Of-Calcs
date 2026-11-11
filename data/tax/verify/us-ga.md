# Georgia — 2026 verification checklist

Generated from `data/tax/us/us-ga.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: undefined
- Rates last checked: not yet
- Verified by a person: **not yet**
- Adds to: `us` (check that one too)

## Check against

- **Start here:** https://www.legis.ga.gov/api/legislation/document/20252026/249080#page=3
- Georgia HB463 (2025-2026), Section 2-3 amending O.C.G.A. § 48-7-27(a)(1)(B): https://www.legis.ga.gov/api/legislation/document/20252026/249080#page=3
- Georgia HB463 (2025-2026), Section 2-1 amending O.C.G.A. § 48-7-20(a.1): https://www.legis.ga.gov/api/legislation/document/20252026/249080#page=2
- 2025 IT-511 Individual Income Tax Booklet - page 16 - FORM 500, LINE 11: https://dor.georgia.gov/document/document/2025-it-511-individual-income-tax-booklet/download#page=16
- 2025 IT-511 Individual Income Tax Booklet - page 17 - FORM 500, LINE 14: https://dor.georgia.gov/document/document/2025-it-511-individual-income-tax-booklet/download#page=17
- 2025 IT-511 Individual Income Tax Booklet, Page 9: https://dor.georgia.gov/document/document/2025-it-511-individual-income-tax-booklet/download#page=9
- 2021 IT-511 Individual Income Tax Booklet - page 12 - FORM 500, LINE 11a: https://dor.georgia.gov/document/booklet/2021-it-511-individual-income-tax-booklet/download

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in undefined, unless the line says otherwise.

### Georgia taxable income (`ga-taxable`)

- [ ] Single — less 15,000
- [ ] Married filing jointly — less 30,000

### Georgia income tax (`ga-income-tax`)

- [ ] rate 4.99%

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 40,000: ga-taxable 25,000; ga-income-tax 1,247.50; net 33,072.50 — Georgia taxable income $25,000. Georgia income tax $1,247.5. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 85,000: ga-taxable 70,000; ga-income-tax 3,493; net 65,134.50 — Georgia taxable income $70,000. Georgia income tax $3,493. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 150,000 with status = married: ga-taxable 120,000; ga-income-tax 5,988; net 117,197 — Georgia taxable income $120,000. Georgia income tax $5,988. PolicyEngine US 2.62.5 gives the same state figures to the cent.

## Not modelled (confirm the page says so)

- Low-income credit (incomes under $20,000)

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/us/us-ga.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
