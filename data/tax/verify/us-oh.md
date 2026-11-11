# Ohio — 2026 verification checklist

Generated from `data/tax/us/us-oh.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: undefined
- Rates last checked: not yet
- Verified by a person: **not yet**
- Adds to: `us` (check that one too)

## Check against

- **Start here:** https://search-prod.lis.state.oh.us/api/v2/general_assembly_136/legislation/hb96/07_EN/pdf/
- House Bill 96 - Joint filing credit MAGI limit ($750k for 2025, $500k for 2026+): https://search-prod.lis.state.oh.us/api/v2/general_assembly_136/legislation/hb96/07_EN/pdf/
- Ohio Income Tax Form 2025 Instructions (Page 18): https://dam.assets.ohio.gov/image/upload/v1767095693/tax.ohio.gov/forms/ohio_individual/individual/2025/it1040-booklet.pdf#page=18
- Ohio Income Tax Form 2025 Instructions (Page 29): https://dam.assets.ohio.gov/image/upload/v1767095693/tax.ohio.gov/forms/ohio_individual/individual/2025/it1040-booklet.pdf#page=29
- Ohio Income Tax Form 2025 Instructions (Page 44): https://dam.assets.ohio.gov/image/upload/v1767095693/tax.ohio.gov/forms/ohio_individual/individual/2025/it1040-booklet.pdf#page=44
- Ohio Income Tax Form 2025 Instructions (Line 44): https://dam.assets.ohio.gov/image/upload/v1767095693/tax.ohio.gov/forms/ohio_individual/individual/2025/it1040-booklet.pdf#page=26
- Ohio Income Tax Form 2025 Instructions (Page 17): https://dam.assets.ohio.gov/image/upload/v1767095693/tax.ohio.gov/forms/ohio_individual/individual/2025/it1040-booklet.pdf#page=17

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in undefined, unless the line says otherwise.

### Ohio taxable income (`oh-taxable`)

> Personal exemption of $2,400, $2,150 or $1,900 each depending on income.

- [ ] Single — factor 1
- [ ] Married filing jointly — factor 2
- [ ] from 0: 2,400
- [ ] from 40,001: 2,150
- [ ] from 80,001: 1,900
- [ ] from 500,000: 0

### Ohio income tax (`oh-income-tax`)

> No tax on the first $26,050; above it $332 plus 2.75% of the excess (the flat rate from 2026). Less the $20 exemption credit each for incomes up to $30,000.

- [ ] applies when up to 26,050
- [ ] from 0: 1.27448%
- [ ] from 26,050: 2.75%
- [ ] applies when up to 30,000
- [ ] Single — factor 1
- [ ] Married filing jointly — factor 2
- [ ] from 0: 2,400
- [ ] from 40,001: 2,150
- [ ] from 80,001: 1,900
- [ ] from 500,000: 0
- [ ] factor 20

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 40,000: oh-taxable 37,600; oh-income-tax 649.63; net 33,670.37 — Ohio taxable income $37,600. Ohio income tax $649.63. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 85,000: oh-taxable 83,100; oh-income-tax 1,900.88; net 66,726.62 — Ohio taxable income $83,100. Ohio income tax $1,900.88. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 150,000 with status = married: oh-taxable 146,200; oh-income-tax 3,636.13; net 119,548.87 — Ohio taxable income $146,200. Ohio income tax $3,636.13. PolicyEngine US 2.62.5 gives the same state figures to the cent.

## Not modelled (confirm the page says so)

- Municipal income taxes (most Ohio cities, typically 1–2.5%)
- School district income taxes
- Joint filing credit (needs both spouses to have income)

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/us/us-oh.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
