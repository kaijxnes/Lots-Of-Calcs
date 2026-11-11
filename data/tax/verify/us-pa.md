# Pennsylvania — 2026 verification checklist

Generated from `data/tax/us/us-pa.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: undefined
- Rates last checked: not yet
- Verified by a person: **not yet**
- Adds to: `us` (check that one too)

## Check against

- **Start here:** https://www.pa.gov/content/dam/copapwp-pagov/en/revenue/documents/formsandpublications/formsforindividuals/pit/documents/2025/2025_pa-40in.pdf#page=1
- 2025 Pennsylvania Personal Income Tax Return Instructions (PA-40 IN): https://www.pa.gov/content/dam/copapwp-pagov/en/revenue/documents/formsandpublications/formsforindividuals/pit/documents/2025/2025_pa-40in.pdf#page=1
- 2025 Pennsylvania Personal Income Tax Return Instructions (PA-40 IN), PA Schedule SP Eligibility Income Tables: https://www.pa.gov/content/dam/copapwp-pagov/en/revenue/documents/formsandpublications/formsforindividuals/pit/documents/2025/2025_pa-40in.pdf#page=39
- Tax Reform Code of 1971, Article III, Section 302: https://www.legis.state.pa.us/WU01/LI/LI/US/PDF/1971/0/0002..PDF#page=118
- The General Assembly of Pennsylvania House Bill No. 200, Section 302 (3), page 50, line 27: https://www.legis.state.pa.us/CFDOCS/Legis/PN/Public/btCheck.cfm?txtType=PDF&sessYr=2003&sessInd=0&billBody=H&billTyp=B&billNbr=0200&pn=3160#page=50
- PA Form PA-40 Instructions, page 1: https://www.pa.gov/content/dam/copapwp-pagov/en/revenue/documents/formsandpublications/formsforindividuals/pit/documents/2021/2021_pa-40in.pdf#page=1
- 2024 Pennsylvania Personal Income Tax Return Instructions (PA-40 IN): https://www.pa.gov/content/dam/copapwp-pagov/en/revenue/documents/formsandpublications/formsforindividuals/pit/documents/2024/2024_pa-40in.pdf#page=1

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in undefined, unless the line says otherwise.

### Pennsylvania income tax (`pa-income-tax`)

> A flat 3.07% of wages with no standard deduction.

- [ ] rate 3.07%

### Unemployment insurance (`pa-ui`)

- [ ] rate 0.07%

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 40,000: pa-income-tax 1,228; pa-ui 28; net 33,064 — Pennsylvania income tax $1,228; Unemployment insurance $28. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 85,000: pa-income-tax 2,609.50; pa-ui 59.5; net 65,958.50 — Pennsylvania income tax $2,609.5; Unemployment insurance $59.5. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 150,000 with status = married: pa-income-tax 4,605; pa-ui 105; net 118,475 — Pennsylvania income tax $4,605; Unemployment insurance $105. PolicyEngine US 2.62.5 gives the same state figures to the cent.

## Not modelled (confirm the page says so)

- Local earned income taxes (usually about 1%; Philadelphia 3.74%)
- Local services tax (up to $52 a year)
- Tax forgiveness for low incomes

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/us/us-pa.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
