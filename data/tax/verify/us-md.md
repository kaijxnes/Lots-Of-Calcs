# Maryland — 2026 verification checklist

Generated from `data/tax/us/us-md.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: undefined
- Rates last checked: not yet
- Verified by a person: **not yet**
- Adds to: `us` (check that one too)
- Provisional items: `Standard deduction of $3,350 / $6,700 is the 2025 amount`, `County rates are the latest PolicyEngine holds; counties can change them each year`

## Check against

- **Start here:** https://www.marylandcomptroller.gov/content/dam/mdcomp/tax/instructions/2025/resident-booklet.pdf#page=22
- Maryland 2025 Resident Tax Forms and Instructions - Capital Gains Surtax: https://www.marylandcomptroller.gov/content/dam/mdcomp/tax/instructions/2025/resident-booklet.pdf#page=22
- Maryland House Bill 352 - Budget Reconciliation and Financing Act of 2025: https://mgaleg.maryland.gov/2025RS/Chapters_noln/CH_604_hb0352e.pdf#page=163
- Maryland 2025 Resident Tax Forms and Instructions - Senior Tax Credit: https://www.marylandcomptroller.gov/content/dam/mdcomp/tax/instructions/2025/resident-booklet.pdf#page=24
- Maryland 2025 Resident Tax Forms and Instructions - Itemized Deductions: https://www.marylandcomptroller.gov/content/dam/mdcomp/tax/instructions/2025/resident-booklet.pdf#page=20
- Maryland House Bill 352 - Budget Reconciliation and Financing Act of 2025: https://mgaleg.maryland.gov/2025RS/Chapters_noln/CH_604_hb0352e.pdf#page=167
- Maryland 2025 Resident Tax Forms and Instructions - Standard Deduction: https://www.marylandcomptroller.gov/content/dam/mdcomp/tax/instructions/2025/resident-booklet.pdf#page=21

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in undefined, unless the line says otherwise.

### Maryland taxable income (`md-taxable`)

> Standard deduction of $3,350 ($6,700 married) and a $3,200 exemption each, which shrinks above $100,000 of income ($150,000 married).

- [ ] Single — less 3,350
- [ ] Married filing jointly — less 6,700
- [ ] Single — factor 1
- [ ] Married filing jointly — factor 2
- [ ] Single — over 0: 3,200
- [ ] Single — over 100,000: 1,600
- [ ] Single — over 125,000: 800
- [ ] Single — over 150,000: 0
- [ ] Married filing jointly — over 0: 3,200
- [ ] Married filing jointly — over 150,000: 1,600
- [ ] Married filing jointly — over 175,000: 800
- [ ] Married filing jointly — over 200,000: 0

### Maryland income tax (`md-income-tax`)

- [ ] Single — from 0: 2%
- [ ] Single — from 1,000: 3%
- [ ] Single — from 2,000: 4%
- [ ] Single — from 3,000: 4.75%
- [ ] Single — from 100,000: 5%
- [ ] Single — from 125,000: 5.25%
- [ ] Single — from 150,000: 5.5%
- [ ] Single — from 250,000: 5.75%
- [ ] Single — from 500,000: 6.25%
- [ ] Single — from 1,000,000: 6.5%
- [ ] Married filing jointly — from 0: 2%
- [ ] Married filing jointly — from 1,000: 3%
- [ ] Married filing jointly — from 2,000: 4%
- [ ] Married filing jointly — from 3,000: 4.75%
- [ ] Married filing jointly — from 150,000: 5%
- [ ] Married filing jointly — from 175,000: 5.25%
- [ ] Married filing jointly — from 225,000: 5.5%
- [ ] Married filing jointly — from 300,000: 5.75%
- [ ] Married filing jointly — from 600,000: 6.25%
- [ ] Married filing jointly — from 1,200,000: 6.5%

### County income tax (`md-county-tax`)

> Every Maryland county (and Baltimore City) levies its own tax on Maryland taxable income, from 2.25% to 3.3%.

- [ ] Allegany County — rate 3.03%
- [ ] Baltimore City — rate 3.2%
- [ ] Baltimore County — rate 3.2%
- [ ] Calvert County — rate 3.2%
- [ ] Caroline County — rate 3.2%
- [ ] Carroll County — rate 3.03%
- [ ] Cecil County — rate 2.74%
- [ ] Charles County — rate 3.03%
- [ ] Dorchester County — rate 3.3%
- [ ] Garrett County — rate 2.65%
- [ ] Harford County — rate 3.06%
- [ ] Howard County — rate 3.2%
- [ ] Kent County — rate 3.2%
- [ ] Montgomery County — rate 3.2%
- [ ] Prince George's County — rate 3.2%
- [ ] Queen Anne's County — rate 3.2%
- [ ] Somerset County — rate 3.2%
- [ ] St Mary's County — rate 3.2%
- [ ] Talbot County — rate 2.4%
- [ ] Washington County — rate 2.95%
- [ ] Wicomico County — rate 3.2%
- [ ] Worcester County — rate 2.25%
- [ ] Anne Arundel County, Single — from 0: 2.7%
- [ ] Anne Arundel County, Single — from 50,000: 2.94%
- [ ] Anne Arundel County, Single — from 400,000: 3.2%
- [ ] Anne Arundel County, Married filing jointly — from 0: 2.7%
- [ ] Anne Arundel County, Married filing jointly — from 75,000: 2.94%
- [ ] Anne Arundel County, Married filing jointly — from 480,000: 3.2%
- [ ] Frederick County, Single — from 0: 0.0225
- [ ] Frederick County, Single — from 25,000: 0.0275
- [ ] Frederick County, Single — from 50,000: 0.0296
- [ ] Frederick County, Single — from 150,000: 0.032
- [ ] Frederick County, Married filing jointly — from 0: 0.0225
- [ ] Frederick County, Married filing jointly — from 25,000: 0.0275
- [ ] Frederick County, Married filing jointly — from 100,000: 0.0296
- [ ] Frederick County, Married filing jointly — from 250,000: 0.032

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 40,000: md-taxable 33,450; md-income-tax 1,536.38; md-county-tax 1,070.40; net 31,713.23 — Maryland taxable income $33,450. Maryland income tax $1,536.38; County income tax $1,070.4. PolicyEngine US 2.62.5 differs by $2.38 on income tax — it projects 2026 values where this file uses the published 2025 ones.
- [ ] 85,000: md-taxable 78,450; md-income-tax 3,673.88; md-county-tax 2,510.40; net 62,443.23 — Maryland taxable income $78,450. Maryland income tax $3,673.88; County income tax $2,510.4. PolicyEngine US 2.62.5 differs by $2.38 on income tax — it projects 2026 values where this file uses the published 2025 ones.
- [ ] 150,000 with status = married: md-taxable 136,900; md-income-tax 6,450.25; md-county-tax 4,380.80; net 112,353.95 — Maryland taxable income $136,900. Maryland income tax $6,450.25; County income tax $4,380.8. PolicyEngine US 2.62.5 differs by $7.13 on income tax — it projects 2026 values where this file uses the published 2025 ones.
- [ ] 85,000 with status = single, county = frederick-county: md-taxable 78,450; md-income-tax 3,673.88; md-county-tax 2,322.12; net 62,631.51 — Maryland taxable income $78,450. Maryland income tax $3,673.88; County income tax $2,322.12. PolicyEngine US 2.62.5 differs by $2.38 on income tax — it projects 2026 values where this file uses the published 2025 ones.
- [ ] 85,000 with status = single, county = anne-arundel-county: md-taxable 78,450; md-income-tax 3,673.88; md-county-tax 2,186.43; net 62,767.20 — Maryland taxable income $78,450. Maryland income tax $3,673.88; County income tax $2,186.43. PolicyEngine US 2.62.5 differs by $2.38 on income tax — it projects 2026 values where this file uses the published 2025 ones.

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/us/us-md.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
