# Iowa — 2026 verification checklist

Generated from `data/tax/us/us-ia.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: undefined
- Rates last checked: not yet
- Verified by a person: **not yet**
- Adds to: `us` (check that one too)

## Check against

- **Start here:** https://revenue.iowa.gov/taxes/tax-guidance/individual-income-tax/1040-expanded-instructions/iowa-tax
- 2025 IA 1040 Expanded Instructions, Line 5 Iowa Tax: https://revenue.iowa.gov/taxes/tax-guidance/individual-income-tax/1040-expanded-instructions/iowa-tax
- 2025 IA 1040 Expanded Instructions, Exemption Credits: https://revenue.iowa.gov/taxes/tax-guidance/individual-income-tax/1040-expanded-instructions/exemption-credits
- IDR Announces 2025 Individual Income Tax Brackets and Interest Rates: https://revenue.iowa.gov/press-release/2024-10-16/idr-announces-2025-individual-income-tax-brackets-and-interest-rates
- 2021 IA1040 Iowa Income Tax Return, Line 39: https://revenue.iowa.gov/sites/default/files/2022-01/IA1040%2841-001%29.pdf#page=1
- 2021 IA1040 Income Tax Return instructions: https://revenue.iowa.gov/media/2650/download?inline#page=54
- 2022 IA1040 Iowa Income Tax Return, Line 39: https://revenue.iowa.gov/sites/default/files/2023-01/2022IA1040%2841001%29.pdf#page=1

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in undefined, unless the line says otherwise.

### Iowa income tax (`ia-income-tax`)

> 3.8% of federal taxable income, less the $40 personal exemption credit per person.

- [ ] rate 3.8%
- [ ] factor 40
- [ ] Single — factor 1
- [ ] Married filing jointly — factor 2

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 40,000: ia-income-tax 868.20; net 33,451.80 — Iowa income tax $868.2. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 85,000: ia-income-tax 2,578.20; net 66,049.30 — Iowa income tax $2,578.2. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 150,000 with status = married: ia-income-tax 4,396.40; net 118,788.60 — Iowa income tax $4,396.4. PolicyEngine US 2.62.5 gives the same state figures to the cent.

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/us/us-ia.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
