# Kentucky — 2026 verification checklist

Generated from `data/tax/us/us-ky.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: undefined
- Rates last checked: not yet
- Verified by a person: **not yet**
- Adds to: `us` (check that one too)

## Check against

- **Start here:** https://revenue.ky.gov/News/Pages/Kentucky-DOR-Announces-2026-Standard-Deduction.aspx
- Kentucky DOR Announces 2026 Standard Deduction (September 4, 2025): https://revenue.ky.gov/News/Pages/Kentucky-DOR-Announces-2026-Standard-Deduction.aspx
- 2025 Kentucky Individual Income Tax Return - Form 740 - Line 12: https://revenue.ky.gov/Forms/740%20(2025).pdf#page=1
- 2024 Kentucky individual tax credit schedule, ITC: https://revenue.ky.gov/Forms/Schedule%20ITC%20(2025).pdf#page=2
- 2025 Kentucky Form 8863-K: https://revenue.ky.gov/Forms/8863-K%20(2025).pdf#page=1
- 2025 KENTUCKY Standard Deduction Press Release: https://revenue.ky.gov/News/Pages/Kentucky-DOR-Announces-2025-Standard-Deduction.aspx
- 2021 Kentucky Individual Income Tax Return Residents Only - Form 740 - Line 12: https://revenue.ky.gov/Forms/Form%20740-2021.pdf#page=1

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in undefined, unless the line says otherwise.

### Kentucky income tax (`ky-income-tax`)

> 3.5% after the $3,360 standard deduction.

- [ ] rate 3.5%
- [ ] less 3,360

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 40,000: ky-income-tax 1,282.40; net 33,037.60 — Kentucky income tax $1,282.4. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 85,000: ky-income-tax 2,857.40; net 65,770.10 — Kentucky income tax $2,857.4. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 150,000 with status = married: ky-income-tax 5,132.40; net 118,052.60 — Kentucky income tax $5,132.4. PolicyEngine US 2.62.5 gives the same state figures to the cent.

## Not modelled (confirm the page says so)

- Local occupational license taxes (Louisville about 2.2%, Lexington 2.25%, others 1–2.5%)

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/us/us-ky.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
