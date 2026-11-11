# Ireland — 2026 verification checklist

Generated from `data/tax/ie/ie.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: EUR
- Rates last checked: not yet
- Verified by a person: **not yet**

## Check against

- **Start here:** https://www.revenue.ie/en/personal-tax-credits-reliefs-and-exemptions/tax-relief-charts/index.aspx
- Revenue — tax rates, bands and reliefs: https://www.revenue.ie/en/personal-tax-credits-reliefs-and-exemptions/tax-relief-charts/index.aspx
- Revenue — Universal Social Charge rates: https://www.revenue.ie/en/jobs-and-pensions/usc/standard-rates-thresholds-usc.aspx
- gov.ie — PRSI rates: https://www.gov.ie/en/department-of-social-protection/publications/prsi-contribution-rates-and-user-guide-for-the-year-2026/
- Tax relief on pension contributions: limits (Revenue): https://www.revenue.ie/en/jobs-and-pensions/pension/relief/tax-relief-limits.aspx

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in EUR, unless the line says otherwise.

### Pay for income tax (`ie-tax-pay`)

> Pension contributions get income tax relief within age-related limits, from 15% of earnings under 30 to 40% at 60 and over, on earnings up to €115,000. USC and PRSI are still charged on the full salary.

- [ ] rate 40%
- [ ] capped at 115,000

### Tax credits (`ie-tax-credits`)

> Personal credit €2,000 (€4,000 married) and employee (PAYE) credit €2,000.

- [ ] Single — amount 2,000
- [ ] Married filing jointly — amount 4,000
- [ ] capped at 2,000
- [ ] rate 20%

### Income tax (`ie-income-tax`)

> 20% up to €44,000 (€53,000 for a married couple with one income), 40% above, less tax credits.

- [ ] Single — from 0: 20%
- [ ] Single — from 44,000: 40%
- [ ] Married filing jointly — from 0: 20%
- [ ] Married filing jointly — from 53,000: 40%

### Universal Social Charge (`ie-usc`)

> 0.5% to €12,012, 2% to €28,700, 3% to €70,044, 8% above. Nothing is due on incomes of €13,000 or less.

- [ ] applies when up to 13,000
- [ ] from 0: 0.5%
- [ ] from 12,012: 2%
- [ ] from 28,700: 3%
- [ ] from 70,044: 8%

### PRSI (`ie-prsi`)

> Class A: 4.2% until September and 4.35% from 1 October 2026, 4.2375% over the year. Nothing below €352 a week, and a tapering PRSI credit up to €424 a week.

- [ ] applies when up to 18,304
- [ ] rate 4.2375%
- [ ] less 624
- [ ] less 18,304
- [ ] factor 6

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 50,000: ie-income-tax 7,200; ie-usc 1,032.82; ie-prsi 2,118.75; net 39,648.43 — Tax 44,000 × 20% = 8,800 + 6,000 × 40% = 2,400 → 11,200, less 4,000 credits = 7,200. USC 60.06 + 16,688 × 2% = 333.76 + 21,300 × 3% = 639.00 → 1,032.82. PRSI 4.2375% = 2,118.75.
- [ ] 20,000: ie-income-tax 0; ie-usc 219.82; ie-prsi 506.17 — Tax 4,000 less 4,000 credits = 0. USC 60.06 + 159.76 = 219.82. PRSI 847.50 less a credit of 624 − 1,696/6 = 341.33 → 506.17.
- [ ] 60,000 with status = married: ie-income-tax 7,400; net 48,724.68 — Tax 10,600 + 7,000 × 40% = 13,400 less 6,000 credits = 7,400.
- [ ] 50,000 with pensionPct = 5: ie-income-tax 6,200; ie-pension 2,500 — 2,500 off before income tax: 20% x 44,000 + 40% x 3,500 = 10,200 less 4,000 credits = 6,200 (500 less than without the pension, relief at 40%). USC and PRSI unchanged.

## Not modelled (confirm the page says so)

- Pension contributions (tax relief at the marginal rate)
- Other tax credits (rent, home carer, single person child carer)
- Benefit-in-kind
- Reduced USC rates for medical card holders and over-70s

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/ie/ie.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
