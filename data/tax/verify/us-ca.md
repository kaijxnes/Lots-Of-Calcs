# California — 2026 verification checklist

Generated from `data/tax/us/us-ca.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: undefined
- Rates last checked: not yet
- Verified by a person: **not yet**
- Adds to: `us` (check that one too)
- Provisional items: `Tax brackets, the standard deduction ($5,706 / $11,412) and the exemption credit ($153) are the 2025 figures; California publishes the 2026 inflation-adjusted amounts late in the year`

## Check against

- **Start here:** https://www.ftb.ca.gov/forms/2025/2025-540-p.pdf#page=1
- EDD DE 44 California Employer's Guide 2026 — SDI withholding rate 1.3%, no wage limit: https://www.edd.ca.gov/siteassets/files/pdf_pub_ctr/de44.pdf
- 2025 Schedule P (540) Alternative Minimum Tax and Credit Limitations - Residents: https://www.ftb.ca.gov/forms/2025/2025-540-p.pdf#page=1
- 2025 Schedule P (540) Alternative Minimum Tax and Credit Limitations - Residents: https://www.ftb.ca.gov/forms/2025/2025-540-p.pdf#page=2
- 2025 Instructions for Schedule P (540): https://www.ftb.ca.gov/forms/2025/2025-540-p-instructions.html
- 2025 California Earned Income Tax Credit Booklet: https://www.ftb.ca.gov/forms/2025/2025-3514-booklet.html
- 2025 Form 540 California Resident Income Tax Return: https://www.ftb.ca.gov/forms/2025/2025-540.pdf#page=2
- 2025 Form 540 California Resident Income Tax Return: https://www.ftb.ca.gov/forms/2025/2025-540.pdf#page=1

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in undefined, unless the line says otherwise.

### California taxable income (`ca-taxable`)

- [ ] Single — less 5,706
- [ ] Married filing jointly — less 11,412

### California income tax (`ca-income-tax`)

> Less the personal exemption credit of $153 per person, which shrinks by $6 per $2,500 of income above $252,203 ($504,411 married). Includes the 1% Mental Health Services Tax on taxable income over $1 million.

- [ ] Single — from 0: 1%
- [ ] Single — from 11,079: 2%
- [ ] Single — from 26,264: 4%
- [ ] Single — from 41,452: 6%
- [ ] Single — from 57,542: 8%
- [ ] Single — from 72,724: 9.3%
- [ ] Single — from 371,479: 10.3%
- [ ] Single — from 445,771: 11.3%
- [ ] Single — from 742,953: 12.3%
- [ ] Married filing jointly — from 0: 1%
- [ ] Married filing jointly — from 22,158: 2%
- [ ] Married filing jointly — from 52,528: 4%
- [ ] Married filing jointly — from 82,904: 6%
- [ ] Married filing jointly — from 115,084: 8%
- [ ] Married filing jointly — from 145,448: 9.3%
- [ ] Married filing jointly — from 742,958: 10.3%
- [ ] Married filing jointly — from 891,542: 11.3%
- [ ] Married filing jointly — from 1,485,906: 12.3%
- [ ] Single — factor 1
- [ ] Married filing jointly — factor 2
- [ ] full amount 153
- [ ] Single — reduced above 252,203
- [ ] Married filing jointly — reduced above 504,411
- [ ] for each step of 2,500
- [ ] reduced per step by 6
- [ ] rate 1%
- [ ] less 1,000,000

### State Disability Insurance (SDI) (`ca-sdi`)

> 1.3% of all wages — there has been no wage ceiling since 2024.

- [ ] rate 1.3%

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 40,000: ca-taxable 34,294; ca-income-tax 582.69; ca-sdi 520; net 33,217.31 — California taxable income $34,294. California income tax $582.69; State Disability Insurance (SDI) $520. PolicyEngine US 2.62.5 differs by $23.06 on income tax — it projects 2026 values where this file uses the published 2025 ones.
- [ ] 85,000: ca-taxable 79,294; ca-income-tax 3,659.98; ca-sdi 1,105; net 63,862.52 — California taxable income $79,294. California income tax $3,659.98; State Disability Insurance (SDI) $1,105. PolicyEngine US 2.62.5 differs by $96.2 on income tax — it projects 2026 values where this file uses the published 2025 ones.
- [ ] 150,000 with status = married: ca-taxable 138,588; ca-income-tax 5,549.14; ca-sdi 1,950; net 115,685.86 — California taxable income $138,588. California income tax $5,549.14; State Disability Insurance (SDI) $1,950. PolicyEngine US 2.62.5 differs by $146.2 on income tax — it projects 2026 values where this file uses the published 2025 ones.

## Not modelled (confirm the page says so)

- Renter's credit

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/us/us-ca.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
