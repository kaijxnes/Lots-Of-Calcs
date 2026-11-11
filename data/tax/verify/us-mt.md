# Montana — 2026 verification checklist

Generated from `data/tax/us/us-mt.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: undefined
- Rates last checked: not yet
- Verified by a person: **not yet**
- Adds to: `us` (check that one too)

## Check against

- **Start here:** https://revenue.mt.gov/taxes/tax-tables-and-deductions/2025
- 2025 Montana Tax Tables and Deductions: https://revenue.mt.gov/taxes/tax-tables-and-deductions/2025
- Montana Code Annotated 2023, TITLE 15, CHAPTER 30, Part 23, 15-30-2337 (11): https://leg.mt.gov/bills/mca/title_0150/chapter_0300/part_0230/section_0370/0150-0300-0230-0370.html
- 2021 Montana Code Annotated, Title 15, Chapter 30, Part 23, 15-30-2337 (11): https://law.justia.com/codes/montana/2021/title-15/chapter-30/part-23/section-15-30-2337/
- 2022 Form of Montana Individual Income Tax Return, Page 10, Line 17: https://revenuefiles.mt.gov/files/Forms/Montana-Individual-Income-Tax-Return-Form-2/2022_Montana_Individual_Income_Tax_Return_Form_2.pdf#page=10
- 2021 Form of Montana Individual Income Tax Return, Page 10, Line 17: https://revenue.mt.gov/files/Forms/Montana-Individual-Income-Tax-Return-Form-2/2021_Montana_Individual_Income_Tax_Return_Form_2.pdf#page=10
- 2023 Form of Montana Individual Income Tax Return, Page 10, Line 17: https://revenuefiles.mt.gov/files/Forms/Montana-Individual-Income-Tax-Return-Form-2/2023_Montana_Individual_Income_Tax_Return_Form_2.pdf#page=10

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in undefined, unless the line says otherwise.

### Montana income tax (`mt-income-tax`)

> Starts from federal taxable income.

- [ ] Single — from 0: 4.7%
- [ ] Single — from 47,500: 5.65%
- [ ] Married filing jointly — from 0: 4.7%
- [ ] Married filing jointly — from 95,000: 5.65%

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 40,000: mt-income-tax 1,123.30; net 33,196.70 — Montana income tax $1,123.3. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 85,000: mt-income-tax 3,441.60; net 65,185.90 — Montana income tax $3,441.6. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 150,000 with status = married: mt-income-tax 5,753.20; net 117,431.80 — Montana income tax $5,753.2. PolicyEngine US 2.62.5 gives the same state figures to the cent.

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/us/us-mt.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
