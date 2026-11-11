# North Dakota — 2026 verification checklist

Generated from `data/tax/us/us-nd.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: undefined
- Rates last checked: not yet
- Verified by a person: **not yet**
- Adds to: `us` (check that one too)

## Check against

- **Start here:** https://www.tax.nd.gov/sites/www/files/documents/forms/individual/2025-iit/28709-form-nd-1es-2026.pdf#page=2
- 2026 North Dakota Form ND-1ES tax rate schedules: https://www.tax.nd.gov/sites/www/files/documents/forms/individual/2025-iit/28709-form-nd-1es-2026.pdf#page=2
- 2025 North Dakota income tax instructions: https://www.tax.nd.gov/sites/www/files/documents/forms/individual/2025-iit/2025-individual-income-tax-booklet.pdf#page=29
- 2021 North Dakota income tax instructions: https://www.tax.nd.gov/sites/www/files/documents/forms/individual/2021-iit/individual-income-tax-booklet-2021.pdf#page=34
- 2022 North Dakota income tax instructions: https://www.tax.nd.gov/sites/www/files/documents/forms/individual/2022-iit/2022-individual-income-tax-booklet.pdf#page=34
- 2023 North Dakota income tax instructions: https://www.tax.nd.gov/sites/www/files/documents/forms/individual/2023-iit/2023-individual-income-tax-booklet.pdf#page=30
- 2024 North Dakota income tax instructions: https://www.tax.nd.gov/sites/www/files/documents/forms/individual/2024-iit/2024-individual-income-tax-booklet.pdf#page=29

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in undefined, unless the line says otherwise.

### North Dakota income tax (`nd-income-tax`)

> Starts from federal taxable income; nothing on the first $49,575 ($82,800 married).

- [ ] Single — from 0: 0%
- [ ] Single — from 49,575: 1.95%
- [ ] Single — from 250,400: 2.5%
- [ ] Married filing jointly — from 0: 0%
- [ ] Married filing jointly — from 82,800: 1.95%
- [ ] Married filing jointly — from 304,850: 2.5%

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 40,000: nd-income-tax 0; net 34,320 — North Dakota income tax $0. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 85,000: nd-income-tax 376.84; net 68,250.66 — North Dakota income tax $376.84. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 150,000 with status = married: nd-income-tax 682.50; net 122,502.50 — North Dakota income tax $682.5. PolicyEngine US 2.62.5 gives the same state figures to the cent.

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/us/us-nd.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
