# Delaware — 2026 verification checklist

Generated from `data/tax/us/us-de.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: undefined
- Rates last checked: not yet
- Verified by a person: **not yet**
- Adds to: `us` (check that one too)

## Check against

- **Start here:** https://revenuefiles.delaware.gov/2025/PITForms_Instructions/Instructions/PIT-RES_Instructions_2025-01.pdf#page=8
- 2025 Delaware Individual Income Tax Return Instructions: https://revenuefiles.delaware.gov/2025/PITForms_Instructions/Instructions/PIT-RES_Instructions_2025-01.pdf#page=8
- 2025 Delaware Individual Income Tax Return Instructions: https://revenuefiles.delaware.gov/2025/PITForms_Instructions/Instructions/PIT-RES_Instructions_2025-01.pdf#page=3
- Government of Delaware - Tax Rate Changes: https://revenue.delaware.gov/software-developer/tax-rate-changes/
- The Delaware Code - Title 30, Chapter 11, Subch. 1, § 1102, a, 14: https://delcode.delaware.gov/title30/c011/sc01/index.html
- Delaware individual income tax instructions for 2022: https://revenuefiles.delaware.gov/2022/PIT-RES_TY22_2022-02_Instructions.pdf#page=7
- The Delaware Code - Title 30 - Chapter 11 - Subchapter II - § 1108: https://delcode.delaware.gov/title30/c011/sc02/index.html#1108

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in undefined, unless the line says otherwise.

### Delaware taxable income (`de-taxable`)

- [ ] Single — less 3,250
- [ ] Married filing jointly — less 6,500

### Delaware income tax (`de-income-tax`)

> Less the $110 personal credit per person.

- [ ] from 0: 0%
- [ ] from 2,000: 2.2%
- [ ] from 5,000: 3.9%
- [ ] from 10,000: 4.8%
- [ ] from 20,000: 5.2%
- [ ] from 25,000: 5.55%
- [ ] from 60,000: 6.6%
- [ ] factor 110
- [ ] Single — factor 1
- [ ] Married filing jointly — factor 2

### Paid Leave (`de-pfml`)

> Half of the 0.8% premium (medical, parental and caregiver leave), assuming an employer with 25 or more staff.

- [ ] rate 0.4%
- [ ] capped at 184,500

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 40,000: de-taxable 36,750; de-income-tax 1,543.13; de-pfml 160; net 32,616.88 — Delaware taxable income $36,750. Delaware income tax $1,543.13; Paid Leave $160. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 85,000: de-taxable 81,750; de-income-tax 4,269; de-pfml 340; net 64,018.50 — Delaware taxable income $81,750. Delaware income tax $4,269; Paid Leave $340. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 150,000 with status = married: de-taxable 143,500; de-income-tax 8,234.50; de-pfml 600; net 114,350.50 — Delaware taxable income $143,500. Delaware income tax $8,234.5; Paid Leave $600. PolicyEngine US 2.62.5 gives the same state figures to the cent.

## Not modelled (confirm the page says so)

- Wilmington's 1.25% earned income tax

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/us/us-de.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
