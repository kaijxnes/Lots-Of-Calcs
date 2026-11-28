# California — 2026 verification checklist

Generated from `data/tax/us/us-ca.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: undefined
- Rates last checked: 2026-11-28
- Verified by a person: **not yet**
- Adds to: `us` (check that one too)
- Provisional items: `The exemption credit phase-out thresholds ($252,203 / $504,411) are the 2025 figures; FTB publishes the full 2026 exemption amounts in late December`

## Check against

- **Start here:** https://www.ftb.ca.gov/forms/2025/2025-540-p.pdf#page=1
- FTB 2026 California Tax Rate Schedules: https://www.ftb.ca.gov/forms/2026/2026-540-tax-rate-schedules.pdf
- FTB Tax News, October 2026: 2026 indexing (standard deduction $5,900 / $11,800, exemption credit $158 / $316): https://www.ftb.ca.gov/about-ftb/newsroom/tax-news/2026/10.html
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

- [ ] Single — less 5,900
- [ ] Married filing jointly — less 11,800

### California income tax (`ca-income-tax`)

> Less the personal exemption credit of $158 per person, which shrinks by $6 per $2,500 of income above $252,203 ($504,411 married). Includes the 1% Mental Health Services Tax on taxable income over $1 million.

- [ ] Single — from 0: 1%
- [ ] Single — from 11,456: 2%
- [ ] Single — from 27,157: 4%
- [ ] Single — from 42,861: 6%
- [ ] Single — from 59,498: 8%
- [ ] Single — from 75,197: 9.3%
- [ ] Single — from 384,109: 10.3%
- [ ] Single — from 460,927: 11.3%
- [ ] Single — from 768,213: 12.3%
- [ ] Married filing jointly — from 0: 1%
- [ ] Married filing jointly — from 22,912: 2%
- [ ] Married filing jointly — from 54,314: 4%
- [ ] Married filing jointly — from 85,722: 6%
- [ ] Married filing jointly — from 118,996: 8%
- [ ] Married filing jointly — from 150,394: 9.3%
- [ ] Married filing jointly — from 768,218: 10.3%
- [ ] Married filing jointly — from 921,854: 11.3%
- [ ] Married filing jointly — from 1,536,426: 12.3%
- [ ] Single — factor 1
- [ ] Married filing jointly — factor 2
- [ ] full amount 158
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

- [ ] 40,000: ca-taxable 34,100; ca-income-tax 548.30; ca-sdi 520; net 33,251.70 — California taxable income $34,100; tax worked out by hand from FTB's 2026 rate schedule, less the $158 exemption credit; SDI 1.3%.
- [ ] 85,000: ca-taxable 79,100; ca-income-tax 3,515.86; ca-sdi 1,105; net 64,006.64 — California taxable income $79,100; tax worked out by hand from FTB's 2026 rate schedule, less the $158 exemption credit; SDI 1.3%.
- [ ] 150,000 with status = married: ca-taxable 138,200; ca-income-tax 5,330.24; ca-sdi 1,950; net 115,904.76 — California taxable income $138,200; tax worked out by hand from FTB's 2026 rate schedule, less the $316 exemption credit; SDI 1.3%.
- [ ] 300,000: ca-taxable 294,100; ca-income-tax 23,630.86; ca-sdi 3,900; net 187,645.89 — California taxable income $294,100; tax worked out by hand from FTB's 2026 rate schedule, less the $158 exemption credit (reduced above the phase-out threshold); SDI 1.3%.

## Not modelled (confirm the page says so)

- Renter's credit

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/us/us-ca.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
