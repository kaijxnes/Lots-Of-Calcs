# Michigan — 2026 verification checklist

Generated from `data/tax/us/us-mi.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: undefined
- Rates last checked: not yet
- Verified by a person: **not yet**
- Adds to: `us` (check that one too)

## Check against

- **Start here:** https://www.michigan.gov/treasury/reference/taxpayer-notices/2026/04/15/425-income-tax-rate-for-individuals-and-fiduciaries-in-2026-tax-year
- 4.25% Income Tax Rate for Individuals and Fiduciaries in 2026 Tax Year: https://www.michigan.gov/treasury/reference/taxpayer-notices/2026/04/15/425-income-tax-rate-for-individuals-and-fiduciaries-in-2026-tax-year
- Revenue Administrative Bulletin 2026-1: https://www.michigan.gov/taxes/rep-legal/rab/2026-revenue-administrative-bulletins/revenue-administrative-bulletin-2026-1
- Michigan 2026 Income Tax Withholding Guide (Form 446), Personal Exemption Amount: https://www.michigan.gov/taxes/-/media/Project/Websites/taxes/Forms/SUW/TY2026/446_Withholding-Guide_2026.pdf#page=1
- Michigan Treasury, Withholding Tax Information by Calendar Year (2026 personal exemption): https://www.michigan.gov/taxes/business-taxes/withholding/calendar-year-tax-information
- 2025 Tax Year Income Tax Rate for Individuals and Fiduciaries: https://www.michigan.gov/treasury/reference/taxpayer-notices/2025/05/01/2025-tax-year-income-tax-rate-for-individuals-and-fiduciaries
- Michigan 2024 Book MI-1040CR7 Home Heating Instructions, Table A: https://web.archive.org/web/20250202150154/https://www.michigan.gov/taxes/-/media/Project/Websites/taxes/Forms/IIT/TY2024/BOOK_MI-1040CR-7.pdf#page=11

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in undefined, unless the line says otherwise.

### Michigan income tax (`mi-income-tax`)

> 4.25% after a $5,900 personal exemption each.

- [ ] rate 4.25%
- [ ] factor 5,900
- [ ] Single — factor 1
- [ ] Married filing jointly — factor 2

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 40,000: mi-income-tax 1,449.25; net 32,870.75 — Michigan income tax $1,449.25. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 85,000: mi-income-tax 3,361.75; net 65,265.75 — Michigan income tax $3,361.75. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 150,000 with status = married: mi-income-tax 5,873.50; net 117,311.50 — Michigan income tax $5,873.5. PolicyEngine US 2.62.5 gives the same state figures to the cent.

## Not modelled (confirm the page says so)

- City income taxes (Detroit 2.4%, Grand Rapids 1.5%, and 22 other cities)

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/us/us-mi.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
