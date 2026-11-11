# Vermont — 2026 verification checklist

Generated from `data/tax/us/us-vt.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: undefined
- Rates last checked: not yet
- Verified by a person: **not yet**
- Adds to: `us` (check that one too)
- Provisional items: `Brackets, standard deduction ($7,650 / $15,300) and exemption ($5,300) are the 2025 amounts`

## Check against

- **Start here:** https://legislature.vermont.gov/Documents/2026/Docs/ACTS/ACT169/ACT169%20As%20Enacted.pdf#page=9
- 2026 Vt. Acts No. 169 (H.949), Sec. 8 (claim year 2027 renter credit expansion to 12.5%): https://legislature.vermont.gov/Documents/2026/Docs/ACTS/ACT169/ACT169%20As%20Enacted.pdf#page=9
- 2026 Vt. Acts No. 169 (H.949), Sec. 10 (claim year 2028 reversion to 10%): https://legislature.vermont.gov/Documents/2026/Docs/ACTS/ACT169/ACT169%20As%20Enacted.pdf#page=13
- 2025 VERMONT Income Tax Return Form Instructions-Taxable Income Line 4: https://tax.vermont.gov/sites/tax/files/documents/Income-Booklet-2025.pdf#page=11
- 2025 Vermont Income Tax Return Form Line 5: https://tax.vermont.gov/sites/tax/files/documents/IN-111-2025.pdf
- Vermont 2025 Income Tax Rate Schedules: https://tax.vermont.gov/sites/tax/files/documents/RateSched-2025.pdf#page=1
- 2022 Schedule IN-153 Vermont Capital Gains Exclusion Calculation: https://tax.vermont.gov/sites/tax/files/documents/IN-153-2022.pdf#page=2

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in undefined, unless the line says otherwise.

### Vermont taxable income (`vt-taxable`)

- [ ] Single — less 7,650
- [ ] Married filing jointly — less 15,300
- [ ] factor 5,300
- [ ] Single — factor 1
- [ ] Married filing jointly — factor 2

### Vermont income tax (`vt-income-tax`)

- [ ] Single — from 0: 3.35%
- [ ] Single — from 49,400: 6.6%
- [ ] Single — from 119,700: 7.6%
- [ ] Single — from 249,700: 8.75%
- [ ] Married filing jointly — from 0: 3.35%
- [ ] Married filing jointly — from 82,500: 6.6%
- [ ] Married filing jointly — from 199,450: 7.6%
- [ ] Married filing jointly — from 304,000: 8.75%

### Child care contribution (`vt-child-care`)

> Employers may withhold up to 0.11% of wages.

- [ ] rate 0.11%

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 40,000: vt-taxable 27,050; vt-income-tax 906.18; vt-child-care 44; net 33,369.82 — Vermont taxable income $27,050. Vermont income tax $906.18; Child care contribution $44. PolicyEngine US 2.62.5 differs by $8.38 on income tax — it projects 2026 values where this file uses the published 2025 ones.
- [ ] 85,000: vt-taxable 72,050; vt-income-tax 3,149.80; vt-child-care 93.5; net 65,384.20 — Vermont taxable income $72,050. Vermont income tax $3,149.8; Child care contribution $93.5. PolicyEngine US 2.62.5 differs by $52.25 on income tax — it projects 2026 values where this file uses the published 2025 ones.
- [ ] 150,000 with status = married: vt-taxable 124,100; vt-income-tax 5,509.35; vt-child-care 165; net 117,510.65 — Vermont taxable income $124,100. Vermont income tax $5,509.35; Child care contribution $165. PolicyEngine US 2.62.5 differs by $93.12 on income tax — it projects 2026 values where this file uses the published 2025 ones.

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/us/us-vt.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
