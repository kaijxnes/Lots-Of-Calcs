# United Kingdom — 2026/27 verification checklist

Generated from `data/tax/gb/gb.2026-27.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026/27 (2026-04-06 to 2027-04-05)
- Currency: GBP
- Rates last checked: 2026-11-10
- Verified by a person: **not yet**

## Check against

- **Start here:** https://www.gov.uk/income-tax-rates
- Income Tax rates and Personal Allowances (GOV.UK): https://www.gov.uk/income-tax-rates
- National Insurance rates and categories (GOV.UK): https://www.gov.uk/national-insurance-rates-letters
- SI 2026/231 reg 5 — 2026-27 NI thresholds: https://www.legislation.gov.uk/uksi/2026/231/regulation/5/made
- Income Tax (Indexation) Order 2021 — allowance and basic rate limit frozen: https://www.legislation.gov.uk/uksi/2021/111/article/3/made
- Repaying your student loan: what you pay (GOV.UK): https://www.gov.uk/repaying-your-student-loan/what-you-pay
- Tax on your private pension contributions: tax relief (GOV.UK): https://www.gov.uk/tax-on-your-private-pension/pension-tax-relief

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in GBP, unless the line says otherwise.

### Personal allowance (`gb-personal-allowance`)

> Withdrawn by £1 for every £2 of income over £100,000, which is what creates the 60% effective band up to £125,140. The £100,000 taper is measured on adjusted net income, which pension contributions reduce.

- [ ] full amount 12,570
- [ ] reduced above 100,000
- [ ] reduction per unit of excess 0.5

### Income tax (`gb-income-tax`)

> Thresholds are on taxable income, i.e. after the personal allowance.

- [ ] from 0: 20% (Basic rate)
- [ ] from 37,700: 40% (Higher rate)
- [ ] from 125,140: 45% (Additional rate)

### National Insurance (`gb-ni`)

> Class 1 employee contributions, charged on gross pay rather than taxable income. Weekly thresholds of £241.73 and £966.73 are £12,570 and £50,270 a year.

- [ ] from 0: 0% (Below the primary threshold)
- [ ] from 12,570: 8% (Primary threshold to upper earnings limit)
- [ ] from 50,270: 2% (Above the upper earnings limit)

### Student loan repayment (`gb-student-loan`)

> 9% of earnings above the plan's yearly threshold: Plan 1 £26,900, Plan 2 £29,385, Plan 4 £33,795, Plan 5 £25,000. Collected through PAYE alongside tax.

- [ ] Plan 1 — rate 9%
- [ ] Plan 1 — less 26,900
- [ ] Plan 2 — rate 9%
- [ ] Plan 2 — less 29,385
- [ ] Plan 4 (Scotland) — rate 9%
- [ ] Plan 4 (Scotland) — less 33,795
- [ ] Plan 5 — rate 9%
- [ ] Plan 5 — less 25,000

### Postgraduate loan repayment (`gb-postgrad-loan`)

> 6% of earnings above £21,000, on top of any undergraduate plan.

- [ ] Yes — rate 6%
- [ ] Yes — less 21,000

### Pension contribution (`gb-pension`)

> With relief at source you pay 80% of the contribution and your pension provider claims the other 20% from HMRC; higher and additional rate taxpayers can claim more back through self assessment, which isn't included here. Net pay and salary sacrifice contributions are taken in full, before tax.

- [ ] Relief at source (most personal and many workplace pensions) — rate 80%

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 30,000: gb-personal-allowance 12,570; gb-income-tax 3,486; gb-ni 1,394.40; net 25,119.60 — Tax (30,000 − 12,570) × 20% = 3,486. NI (30,000 − 12,570) × 8% = 1,394.40.
- [ ] 60,000: gb-income-tax 11,432; gb-ni 3,210.60 — Taxable 47,430: 37,700 × 20% + 9,730 × 40% = 11,432. NI 37,700 × 8% + 9,730 × 2% = 3,210.60.
- [ ] 110,000: gb-personal-allowance 7,570; gb-income-tax 33,432; gb-ni 4,210.60 — Allowance 12,570 − 5,000 = 7,570; taxable 102,430: 7,540 + 64,730 × 40% = 33,432. NI 3,016 + 59,730 × 2% = 4,210.60.
- [ ] 150,000: gb-personal-allowance 0; gb-income-tax 53,703; gb-ni 5,010.60 — No allowance; taxable 150,000: 7,540 + 87,440 × 40% + 24,860 × 45% = 53,703. NI 3,016 + 99,730 × 2% = 5,010.60.
- [ ] 40,000 with studentLoan = plan2: gb-student-loan 955.35; net 31,364.25 — Plan 2: 9% x (40,000 - 29,385) = 955.35; take-home 32,319.60 - 955.35.
- [ ] 30,000 with studentLoan = plan1: gb-student-loan 279 — Plan 1: 9% x (30,000 - 26,900) = 279.
- [ ] 40,000 with studentLoan = plan4, postgradLoan = yes: gb-student-loan 558.45; gb-postgrad-loan 1,140; net 30,621.15 — Plan 4: 9% x (40,000 - 33,795) = 558.45; postgraduate 6% x (40,000 - 21,000) = 1,140.
- [ ] 24,000 with studentLoan = plan5: gb-student-loan 0 — Below the £25,000 Plan 5 threshold: nothing to repay.
- [ ] 40,000 with pensionPct = 5, pensionType = netpay: gb-income-tax 5,086; gb-ni 2,194.40; gb-pension 2,000; net 30,719.60 — Net pay: contribution 2,000 off before tax, taxable 38,000 - 12,570 = 25,430, tax 5,086; NI on 40,000 = 8% x 27,430 = 2,194.40; take-home 40,000 - 5,086 - 2,194.40 - 2,000.
- [ ] 40,000 with pensionPct = 5, pensionType = sacrifice: gb-income-tax 5,086; gb-ni 2,034.40; net 30,879.60 — Salary sacrifice: tax and NI both on 38,000; NI 8% x 25,430 = 2,034.40.
- [ ] 40,000 with pensionPct = 5, pensionType = relief: gb-income-tax 5,486; gb-pension 1,600; net 30,719.60 — Relief at source: tax 20% x 27,430 = 5,486 and NI 2,194.40 on the full salary; you pay 80% of 2,000 = 1,600. Same take-home as net pay for a basic-rate taxpayer.
- [ ] 110,000 with pensionPct = 10, pensionType = netpay: gb-personal-allowance 12,570 — Contribution 11,000 brings adjusted net income to 99,000, under the £100,000 taper, so the full 12,570 allowance stays.
- [ ] 40,000 with pensionPct = 5, pensionType = sacrifice, studentLoan = plan2: gb-student-loan 775.35 — Salary sacrifice also lowers student loan pay: 9% x (38,000 - 29,385) = 775.35.

## Not modelled (confirm the page says so)

- Tax codes other than the standard personal allowance
- Benefits in kind, salary sacrifice and taxable expenses
- Blind person's allowance, marriage allowance and other reliefs
- Extra relief on relief-at-source pensions for higher-rate taxpayers (claimed through self assessment)
- Employer pension contributions, and auto-enrolment's qualifying earnings band (contributions are a percentage of the whole salary)

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/gb/gb.2026-27.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
