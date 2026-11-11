# Idaho — 2026 verification checklist

Generated from `data/tax/us/us-id.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: undefined
- Rates last checked: not yet
- Verified by a person: **not yet**
- Adds to: `us` (check that one too)
- Provisional items: `The $4,811 / $9,622 zero-rate band is the 2025 amount`

## Check against

- **Start here:** https://tax.idaho.gov/wp-content/uploads/forms/EIN00046/EIN00046_03-02-2026.pdf#page=4
- Idaho Individual Income Tax Instructions Packet 2025: https://tax.idaho.gov/wp-content/uploads/forms/EIN00046/EIN00046_03-02-2026.pdf#page=4
- House Bill 40 (2025): https://legislature.idaho.gov/sessioninfo/2025/legislation/H0040/
- House Bill 40 (2025) Bill Text: https://legislature.idaho.gov/wp-content/uploads/sessioninfo/2025/legislation/H0040.pdf#page=6
- Idaho Statutes 63-3024B (3): https://legislature.idaho.gov/statutesrules/idstat/title63/t63ch30/sect63-3024b/
- Idaho State Tax Comission - Individual Income Tax Rate Schedule: https://tax.idaho.gov/taxes/income-tax/individual-income/individual-income-tax-rate-schedule/
- IDAPA 35.01.01.075 - Tax on individuals, estates, and trusts: https://adminrules.idaho.gov/rules/current/35/350101.pdf#page=17

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in undefined, unless the line says otherwise.

### Idaho income tax (`id-income-tax`)

> 5.3% above the first $4,811 ($9,622 married), less the $155 grocery credit per person, which is refundable.

- [ ] Single — from 0: 0%
- [ ] Single — from 4,811: 5.3%
- [ ] Married filing jointly — from 0: 0%
- [ ] Married filing jointly — from 9,622: 5.3%
- [ ] factor 155
- [ ] Single — factor 1
- [ ] Married filing jointly — factor 2

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 40,000: id-taxable 23,900; id-income-tax 856.72; net 33,463.28 — Idaho taxable income $23,900. Idaho income tax $856.72. PolicyEngine US 2.62.5 differs by $-4.22 on income tax — it projects 2026 values where this file uses the published 2025 ones.
- [ ] 85,000: id-taxable 68,900; id-income-tax 3,241.72; net 65,385.78 — Idaho taxable income $68,900. Idaho income tax $3,241.72. PolicyEngine US 2.62.5 differs by $-4.22 on income tax — it projects 2026 values where this file uses the published 2025 ones.
- [ ] 150,000 with status = married: id-taxable 117,800; id-income-tax 5,423.43; net 117,761.57 — Idaho taxable income $117,800. Idaho income tax $5,423.43. PolicyEngine US 2.62.5 differs by $1.55 on income tax — it projects 2026 values where this file uses the published 2025 ones.

## Not modelled (confirm the page says so)

- Permanent building fund tax ($10)

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/us/us-id.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
