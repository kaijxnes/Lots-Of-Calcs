# India — 2026-27 verification checklist

Generated from `data/tax/in/in.2026-27.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026-27 (2026-04-01 to 2027-03-31)
- Currency: INR
- Rates last checked: not yet
- Verified by a person: **not yet**
- Provisional items: `Rates come from secondary sources that agree the 2026 Budget left the new-regime slabs unchanged under the Income Tax Act 2025`

## Check against

- **Start here:** https://incometaxindia.gov.in/Pages/tools/income-tax-calculator.aspx
- Income Tax Department — tax rates for individuals: https://incometaxindia.gov.in/Pages/i-am/individual.aspx
- Income Tax Act, 2025: https://incometaxindia.gov.in/

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in INR, unless the line says otherwise.

### Taxable income (`in-taxable`)

> After the ₹75,000 standard deduction for salaried employees.

- [ ] less 75,000

### Tax at slab rates (`in-slab-tax`)

> New regime slabs. The section 87A rebate removes the tax entirely up to ₹12 lakh of taxable income, and marginal relief caps it at the income above ₹12 lakh just beyond that.

- [ ] applies when up to 1,200,000
- [ ] from 0: 0%
- [ ] from 400,000: 5%
- [ ] from 800,000: 10%
- [ ] from 1,200,000: 15%
- [ ] from 1,600,000: 20%
- [ ] from 2,000,000: 25%
- [ ] from 2,400,000: 30%
- [ ] less 1,200,000

### Surcharge (`in-surcharge`)

> 10% of tax above ₹50 lakh, 15% above ₹1 crore and 25% above ₹2 crore, with marginal relief at each step.

- [ ] applies when over 20,000,000
- [ ] rate 25%
- [ ] amount 6,417,000
- [ ] less 20,000,000
- [ ] applies when over 10,000,000
- [ ] rate 15%
- [ ] amount 2,838,000
- [ ] less 10,000,000
- [ ] applies when over 5,000,000
- [ ] rate 10%
- [ ] amount 1,080,000
- [ ] less 5,000,000

### Health and education cess (`in-cess`)

> 4% of income tax plus surcharge.

- [ ] rate 4%

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 1,000,000: in-income-tax 0; net 1,000,000 — Taxable 9.25 lakh, under ₹12 lakh: no tax after the rebate.
- [ ] 1,300,000: in-income-tax 25,000; in-cess 1,000; net 1,274,000 — Taxable 12.25 lakh. Slab tax 63,750, capped by marginal relief at the ₹25,000 above ₹12 lakh. Cess 1,000.
- [ ] 2,500,000: in-income-tax 307,500; in-cess 12,300 — Taxable 24.25 lakh: 20,000 + 40,000 + 60,000 + 80,000 + 100,000 + 7,500 = 3,07,500. Cess 12,300.
- [ ] 6,000,000: in-income-tax 1,493,250; in-cess 59,730 — Taxable 59.25 lakh: 3,00,000 + 30% × 35.25 lakh = 13,57,500; surcharge 10% = 1,35,750 (marginal relief does not bite); cess 59,730.

## Not modelled (confirm the page says so)

- The old tax regime and its deductions (80C, HRA, home loan interest)
- Employee Provident Fund contributions (12% of basic pay, which depends on how the salary is structured)
- State professional tax (up to ₹2,500 a year)
- Employer NPS contributions

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/in/in.2026-27.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
