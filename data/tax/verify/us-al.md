# Alabama — 2026 verification checklist

Generated from `data/tax/us/us-al.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: undefined
- Rates last checked: not yet
- Verified by a person: **not yet**
- Adds to: `us` (check that one too)

## Check against

- **Start here:** https://www.revenue.alabama.gov/wp-content/uploads/2026/01/25f40bk.pdf#page=9
- 2025 Alabama Income Tax Instructions: https://www.revenue.alabama.gov/wp-content/uploads/2026/01/25f40bk.pdf#page=9
- 2025 Alabama Income Tax Instructions: https://www.revenue.alabama.gov/wp-content/uploads/2026/01/25f40bk.pdf#page=10
- 2025 Alabama Income Tax Instructions: https://www.revenue.alabama.gov/wp-content/uploads/2026/01/25f40bk.pdf#page=6
- 2025 Alabama Income Tax Instructions: https://www.revenue.alabama.gov/wp-content/uploads/2026/01/25f40bk.pdf#page=25
- 2024 Schedule A (Form 1040): https://www.revenue.alabama.gov/ultraviewer/viewer/basic_viewer/index.html?form=2025/01/24f40schabdc_blk.pdf#page=20
- 2024 Alabama Income Tax Instructions: https://www.revenue.alabama.gov/wp-content/uploads/2025/01/24f40bk.pdf#page=9

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in undefined, unless the line says otherwise.

### Alabama deduction (`al-deduction`)

> The larger of the standard deduction — which shrinks above $25,500 of income to a floor of $2,500 ($5,000 married) — and itemizing, where Alabama lets employees deduct the Social Security and Medicare tax they pay.

- [ ] Single — amount 2,500
- [ ] Married filing jointly — amount 5,000
- [ ] Single — full amount 3,000
- [ ] Married filing jointly — full amount 8,500
- [ ] reduced above 25,500
- [ ] for each step of 500
- [ ] Single — reduced per step by 25
- [ ] Married filing jointly — reduced per step by 175

### Alabama taxable income (`al-taxable`)

> Alabama lets you deduct the federal income tax you pay, plus a $1,500 personal exemption ($3,000 married).

- [ ] factor 1,500
- [ ] Single — factor 1
- [ ] Married filing jointly — factor 2

### Alabama income tax (`al-income-tax`)

- [ ] Single — from 0: 2%
- [ ] Single — from 500: 4%
- [ ] Single — from 3,000: 5%
- [ ] Married filing jointly — from 0: 2%
- [ ] Married filing jointly — from 1,000: 4%
- [ ] Married filing jointly — from 6,000: 5%

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 40,000: al-deduction 3,060; al-taxable 32,820; al-income-tax 1,601; net 32,719 — Alabama deduction $3,060, alabama taxable income $32,820. Alabama income tax $1,601. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 85,000: al-deduction 6,502.50; al-taxable 67,127.50; al-income-tax 3,316.38; net 65,311.13 — Alabama deduction $6,502.5, alabama taxable income $67,127.5. Alabama income tax $3,316.38. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 150,000 with status = married: al-deduction 11,475; al-taxable 120,185; al-income-tax 5,929.25; net 117,255.75 — Alabama deduction $11,475, alabama taxable income $120,185. Alabama income tax $5,929.25. PolicyEngine US 2.62.5 gives the same state figures to the cent.

## Not modelled (confirm the page says so)

- Local occupational taxes (Birmingham, Bessemer and others charge about 1%)
- Other Alabama itemized deductions (mortgage interest, property tax, charity), which would only add to the FICA deduction

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/us/us-al.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
