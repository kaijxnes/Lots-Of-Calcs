# New York — 2026 verification checklist

Generated from `data/tax/us/us-ny.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: undefined
- Rates last checked: not yet
- Verified by a person: **not yet**
- Adds to: `us` (check that one too)

## Check against

- **Start here:** https://web.archive.org/web/20260617073750/https://www.tax.ny.gov/pit/inflation-refund-checks.htm
- 2025 NYS inflation refund checks (eligibility based on 2023 returns): https://web.archive.org/web/20260617073750/https://www.tax.ny.gov/pit/inflation-refund-checks.htm
- New York FY2026 Budget Agreement (Senate Bill S3009C): https://legislation.nysenate.gov/pdf/bills/2025/S3009C#page=12
- 2025 Form IT-201-I Instructions: https://www.tax.ny.gov/pdf/current_forms/it/it201i.pdf#page=27
- 2025 NY Form IT-196 Instructions, Line 40 Total itemized deductions worksheet (line 8, multiply by 3%): https://www.tax.ny.gov/pdf/current_forms/it/it196i.pdf#page=19
- 2025 Form IT-201-I Instructions: https://www.tax.ny.gov/pdf/current_forms/it/it201i.pdf#page=15
- 2025 Form IT-201-I Instructions: https://www.tax.ny.gov/pdf/current_forms/it/it201i.pdf#page=11

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in undefined, unless the line says otherwise.

### New York taxable income (`ny-taxable`)

- [ ] Single — less 8,000
- [ ] Married filing jointly — less 16,050

### New York tax at bracket rates (`ny-main-tax`)

- [ ] Single — from 0: 3.9%
- [ ] Single — from 8,500: 4.4%
- [ ] Single — from 11,700: 5.15%
- [ ] Single — from 13,900: 5.4%
- [ ] Single — from 80,650: 5.9%
- [ ] Single — from 215,400: 6.85%
- [ ] Single — from 1,077,550: 9.65%
- [ ] Single — from 5,000,000: 10.3%
- [ ] Single — from 25,000,000: 10.9%
- [ ] Married filing jointly — from 0: 3.9%
- [ ] Married filing jointly — from 17,150: 4.4%
- [ ] Married filing jointly — from 23,600: 5.15%
- [ ] Married filing jointly — from 27,900: 5.4%
- [ ] Married filing jointly — from 161,550: 5.9%
- [ ] Married filing jointly — from 323,200: 6.85%
- [ ] Married filing jointly — from 2,155,350: 9.65%
- [ ] Married filing jointly — from 5,000,000: 10.3%
- [ ] Married filing jointly — from 25,000,000: 10.9%

### Supplemental tax (`ny-supplemental-tax`)

> Above $107,650 of income New York claws back the benefit of the lower brackets, phased in over $50,000; above $25 million all income is taxed at the top rate.

- [ ] applies when over 25,000,000
- [ ] rate 10.9%
- [ ] Single — from 0: 0
- [ ] Single — from 215,400: 567
- [ ] Single — from 1,077,550: 2,614
- [ ] Single — from 5,000,000: 32,786
- [ ] Married filing jointly — from 0: 0
- [ ] Married filing jointly — from 161,550: 333
- [ ] Married filing jointly — from 323,200: 1,140
- [ ] Married filing jointly — from 2,155,350: 4,211
- [ ] Married filing jointly — from 5,000,000: 64,561
- [ ] capped at 1
- [ ] Single — from 8,500: 8,500
- [ ] Single — from 11,700: 11,700
- [ ] Single — from 13,900: 13,900
- [ ] Single — from 80,650: 80,650
- [ ] Single — from 215,400: 215,400
- [ ] Single — from 1,077,550: 1,077,550
- [ ] Single — from 5,000,000: 5,000,000
- [ ] Single — from 25,000,000: 25,000,000
- [ ] Married filing jointly — from 17,150: 17,150
- [ ] Married filing jointly — from 23,600: 23,600
- [ ] Married filing jointly — from 27,900: 27,900
- [ ] Married filing jointly — from 161,550: 161,550
- [ ] Married filing jointly — from 323,200: 323,200
- [ ] Married filing jointly — from 2,155,350: 2,155,350
- [ ] Married filing jointly — from 5,000,000: 5,000,000
- [ ] Married filing jointly — from 25,000,000: 25,000,000
- [ ] at least 107,650
- [ ] factor 50,000
- [ ] Single — from 0: 567
- [ ] Single — from 215,400: 2,047
- [ ] Single — from 1,077,550: 30,172
- [ ] Single — from 5,000,000: 32,500
- [ ] Married filing jointly — from 0: 333
- [ ] Married filing jointly — from 161,550: 807
- [ ] Married filing jointly — from 323,200: 3,071
- [ ] Married filing jointly — from 2,155,350: 60,350
- [ ] Married filing jointly — from 5,000,000: 32,500

### Disability insurance (`ny-sdi`)

> 0.5% of wages, capped at $0.60 a week.

- [ ] rate 0.5%
- [ ] capped at 31.2

### Paid Family Leave (`ny-pfl`)

> 0.432% of wages, capped at $411.91 for 2026.

- [ ] rate 0.432%
- [ ] capped at 411.91

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 40,000: ny-taxable 32,000; ny-income-tax 1,563; ny-sdi 31.2; ny-pfl 172.80; net 32,553 — New york taxable income $32,000. New York State income tax $1,563; Disability insurance $31.2; Paid Family Leave $172.8. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 85,000: ny-taxable 77,000; ny-income-tax 3,993; ny-sdi 31.2; ny-pfl 367.20; net 64,236.10 — New york taxable income $77,000. New York State income tax $3,993; Disability insurance $31.2; Paid Family Leave $367.2. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 150,000 with status = married: ny-taxable 133,950; ny-income-tax 7,182.85; ny-sdi 31.2; ny-pfl 411.91; net 115,559.04 — New york taxable income $133,950. New York State income tax $7,182.85; Disability insurance $31.2; Paid Family Leave $411.91. PolicyEngine US 2.62.5 gives the same state figures to the cent.

## Not modelled (confirm the page says so)

- Household credit (incomes under $32,000)
- Yonkers income tax surcharge
- MCTD mobility tax (self-employment only)

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/us/us-ny.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
