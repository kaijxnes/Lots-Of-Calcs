# India — 2026-27 verification checklist

Generated from `data/tax/in/in.2026-27.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026-27 (2026-04-01 to 2027-03-31)
- Currency: INR
- Rates last checked: not yet
- Verified by a person: **not yet**
- Provisional items: `Rates come from secondary sources that agree the 2026 Budget left the new-regime slabs unchanged under the Income Tax Act 2025`, `Professional tax thresholds for Maharashtra and Karnataka come from payroll references, not the state notifications`

## Check against

- **Start here:** https://incometaxindia.gov.in/Pages/tools/income-tax-calculator.aspx
- Income Tax Department — tax rates for individuals: https://incometaxindia.gov.in/Pages/i-am/individual.aspx
- Income Tax Act, 2025: https://incometaxindia.gov.in/
- EPFO — contribution rates (12% employee share, ₹15,000 wage ceiling): https://www.epfindia.gov.in/site_en/Contribution_Rate.php
- Constitution of India, Article 276(2) — professions tax limited to ₹2,500 a year: https://www.indiacode.nic.in/handle/123456789/15240

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

### Employees' Provident Fund (EPF) (`in-epf`)

> The employee's 12% share, either on the statutory ₹15,000-a-month wage ceiling or on full basic pay, taken here as half of salary (the minimum the 2025 labour codes allow wages to be). No tax relief under the new regime.

- [ ] 12% of the ₹15,000 wage ceiling (₹1,800 a month) — capped at 21,600
- [ ] 12% of the ₹15,000 wage ceiling (₹1,800 a month) — rate 12%
- [ ] 12% of the ₹15,000 wage ceiling (₹1,800 a month) — rate 50%
- [ ] 12% of basic pay (taken as 50% of salary) — rate 12%
- [ ] 12% of basic pay (taken as 50% of salary) — rate 50%

### Professional tax (`in-professional-tax`)

> ₹2,500 a year — ₹200 a month and ₹300 in one month — the maximum the Constitution allows (Article 276). Maharashtra charges it on pay over ₹10,000 a month, Karnataka on pay of ₹25,000 a month or more.

- [ ] Maharashtra — applies when over 120,000
- [ ] Maharashtra — amount 2,500
- [ ] Karnataka — applies when at least 300,000
- [ ] Karnataka — amount 2,500

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 1,000,000: in-income-tax 0; net 1,000,000 — Taxable 9.25 lakh, under ₹12 lakh: no tax after the rebate.
- [ ] 1,300,000: in-income-tax 25,000; in-cess 1,000; net 1,274,000 — Taxable 12.25 lakh. Slab tax 63,750, capped by marginal relief at the ₹25,000 above ₹12 lakh. Cess 1,000.
- [ ] 2,500,000: in-income-tax 307,500; in-cess 12,300 — Taxable 24.25 lakh: 20,000 + 40,000 + 60,000 + 80,000 + 100,000 + 7,500 = 3,07,500. Cess 12,300.
- [ ] 6,000,000: in-income-tax 1,493,250; in-cess 59,730 — Taxable 59.25 lakh: 3,00,000 + 30% × 35.25 lakh = 13,57,500; surcharge 10% = 1,35,750 (marginal relief does not bite); cess 59,730.
- [ ] 1,200,000 with epf = ceiling: in-epf 21,600; in-professional-tax 0; net 1,178,400 — EPF 12% of half of salary (capped at 21,600 for the ceiling option); professional tax ₹2,500 above the state threshold; income tax unchanged under the new regime.
- [ ] 1,200,000 with epf = basic, profTax = mh: in-epf 72,000; in-professional-tax 2,500; net 1,125,500 — EPF 12% of half of salary (capped at 21,600 for the ceiling option); professional tax ₹2,500 above the state threshold; income tax unchanged under the new regime.
- [ ] 250,000 with profTax = ka: in-epf 0; in-professional-tax 0; net 250,000 — EPF 12% of half of salary (capped at 21,600 for the ceiling option); professional tax ₹2,500 above the state threshold; income tax unchanged under the new regime.
- [ ] 2,400,000 with epf = basic, profTax = ka: in-epf 144,000; in-professional-tax 2,500; net 1,961,000 — EPF 12% of half of salary (capped at 21,600 for the ceiling option); professional tax ₹2,500 above the state threshold; income tax unchanged under the new regime.

## Not modelled (confirm the page says so)

- The old tax regime and its deductions (80C, HRA, home loan interest)
- Employer NPS contributions
- Professional tax in states other than Maharashtra and Karnataka, and Maharashtra's lower slabs below ₹10,000 a month and exemptions for women
- Voluntary PF contributions above 12%

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/in/in.2026-27.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
