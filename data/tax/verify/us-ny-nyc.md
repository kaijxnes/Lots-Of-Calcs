# New York City — 2026 verification checklist

Generated from `data/tax/us/us-ny-nyc.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: undefined
- Rates last checked: not yet
- Verified by a person: **not yet**
- Adds to: `us-ny` (check that one too)

## Check against

- **Start here:** https://www.tax.ny.gov/pit/file/tax_tables.htm
- NYC personal income tax rates (NY Department of Taxation): https://www.tax.ny.gov/pit/file/tax_tables.htm
- NYC school tax credit: https://www.tax.ny.gov/pit/credits/nyc_school_tax_credit.htm

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in undefined, unless the line says otherwise.

### New York City income tax (`nyc-income-tax`)

> Charged on New York State taxable income, less the school tax credit ($63, or $125 married, up to $250,000 of income) and the school tax rate reduction credit.

- [ ] Single — from 0: 3.078%
- [ ] Single — from 12,000: 3.762%
- [ ] Single — from 25,000: 3.819%
- [ ] Single — from 50,000: 3.876%
- [ ] Married filing jointly — from 0: 3.078%
- [ ] Married filing jointly — from 21,600: 3.762%
- [ ] Married filing jointly — from 45,000: 3.819%
- [ ] Married filing jointly — from 90,000: 3.876%
- [ ] applies when up to 250,000
- [ ] Single — less 63
- [ ] Married filing jointly — less 125
- [ ] applies when up to 500,000
- [ ] Single — from 0: 0.171%
- [ ] Single — from 12,000: 0.228%
- [ ] Married filing jointly — from 0: 0.171%
- [ ] Married filing jointly — from 21,600: 0.228%

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 40,000: nyc-income-tax 996.63; net 31,556.37 — New York City income tax $996.63. PolicyEngine US 2.62.5 differs.
- [ ] 85,000: nyc-income-tax 2,627.97; net 61,608.13 — New York City income tax $2,627.97. PolicyEngine US 2.62.5 differs.
- [ ] 150,000 with status = married: nyc-income-tax 4,549.11; net 111,009.92 — New York City income tax $4,549.11. PolicyEngine US 2.62.5 gives the same state figures to the cent.

## Not modelled (confirm the page says so)

- Household credit (incomes under $12,500)
- Income tax elimination credit (households with dependants)

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/us/us-ny-nyc.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
