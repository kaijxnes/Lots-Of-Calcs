# Minnesota — 2026 verification checklist

Generated from `data/tax/us/us-mn.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: undefined
- Rates last checked: not yet
- Verified by a person: **not yet**
- Adds to: `us` (check that one too)

## Check against

- **Start here:** https://www.revenue.state.mn.us/sites/default/files/2026-07/m1mt-25.pdf#page=1
- 2025 Minnesota Schedule M1MT form, Line 22: https://www.revenue.state.mn.us/sites/default/files/2026-07/m1mt-25.pdf#page=1
- 2025 Schedule M1CWFC, Minnesota Child and Working Family Credits: https://www.revenue.state.mn.us/sites/default/files/2026-07/m1cwfc-25.pdf#page=1
- 2025 Schedule M1ED, Line 11: https://www.revenue.state.mn.us/sites/default/files/2026-07/m1ed-25.pdf
- 2025 Minnesota Schedule M1MA, Marriage Credit, Line 10: https://www.revenue.state.mn.us/sites/default/files/2026-07/m1ma-25.pdf#page=1
- 2025 Minnesota M1 form instructions: https://www.revenue.state.mn.us/sites/default/files/2026-07/m1-inst-25.pdf#page=4
- Minnesota Department of Revenue, Tax Year 2026 Inflation-Adjusted Amounts, 290.0123 Subd. 1 Standard Deduction: https://www.revenue.state.mn.us/sites/default/files/2025-12/inflation-adjusted-amounts-2026.pdf#page=1

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in undefined, unless the line says otherwise.

### Minnesota standard deduction (`mn-standard-deduction`)

> Reduced by 3% of income over $244,400 and 10% over $337,800, never by more than 80%.

- [ ] Single — amount 15,300
- [ ] Married filing jointly — amount 30,600
- [ ] applies when over 1,107,750
- [ ] rate 80%
- [ ] rate 3%
- [ ] less 244,400
- [ ] capped at 93,400
- [ ] rate 10%
- [ ] less 337,800

### Minnesota income tax (`mn-income-tax`)

- [ ] Single — from 0: 5.35%
- [ ] Single — from 33,310: 6.8%
- [ ] Single — from 109,430: 7.85%
- [ ] Single — from 203,150: 9.85%
- [ ] Married filing jointly — from 0: 5.35%
- [ ] Married filing jointly — from 48,700: 6.8%
- [ ] Married filing jointly — from 193,480: 7.85%
- [ ] Married filing jointly — from 337,930: 9.85%

### Paid Leave (`mn-pfml`)

> Half of the 0.88% premium, from January 2026, on wages up to $185,000.

- [ ] rate 0.44%
- [ ] capped at 185,000

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 40,000: mn-standard-deduction 15,300; mn-taxable 24,700; mn-income-tax 1,321.45; mn-pfml 176; net 32,822.55 — Minnesota standard deduction $15,300, minnesota taxable income $24,700. Minnesota income tax $1,321.45; Paid Leave $176. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 85,000: mn-standard-deduction 15,300; mn-taxable 69,700; mn-income-tax 4,256.60; mn-pfml 374; net 63,996.90 — Minnesota standard deduction $15,300, minnesota taxable income $69,700. Minnesota income tax $4,256.6; Paid Leave $374. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 150,000 with status = married: mn-standard-deduction 30,600; mn-taxable 119,400; mn-income-tax 7,413.05; mn-pfml 660; net 115,111.95 — Minnesota standard deduction $30,600, minnesota taxable income $119,400. Minnesota income tax $7,413.05; Paid Leave $660. PolicyEngine US 2.62.5 gives the same state figures to the cent.

## Not modelled (confirm the page says so)

- Minnesota alternative minimum tax, which can add around 0.3% for married couples on high incomes

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/us/us-mn.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
