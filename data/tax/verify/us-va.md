# Virginia — 2026 verification checklist

Generated from `data/tax/us/us-va.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: undefined
- Rates last checked: not yet
- Verified by a person: **not yet**
- Adds to: `us` (check that one too)

## Check against

- **Start here:** https://budget.lis.virginia.gov/amendment/2026/2/HB30/Introduced/CR/4-14/1c
- House Bill 30 (2026 Appropriation Act, Special Session I, Chapter 1), Item 4-14: https://budget.lis.virginia.gov/amendment/2026/2/HB30/Introduced/CR/4-14/1c
- Virginia Department of Taxation 2026 Legislative Summary - standard deduction: https://www.tax.virginia.gov/sites/default/files/inline-files/2026-legislative-summary.pdf#page=9
- Virginia 2025 Form 760 Resident Individual Income Tax Instructions: https://www.tax.virginia.gov/sites/default/files/vatax-pdf/2025-760-instructions.pdf#page=41
- Virginia 2025 Form 760 Resident Individual Income Tax Instructions: https://www.tax.virginia.gov/sites/default/files/vatax-pdf/2025-760-instructions.pdf#page=17
- House Bill 1600 (2025 Appropriations Act): https://legiscan.com/VA/text/HB1600/id/3262750/Virginia-2025-HB1600-Chaptered.pdf#page=780
- Virginia 2025 Form 760 Resident Individual Income Tax Instructions: https://www.tax.virginia.gov/sites/default/files/vatax-pdf/2025-760-instructions.pdf#page=15

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in undefined, unless the line says otherwise.

### Virginia taxable income (`va-taxable`)

- [ ] Single — less 8,750
- [ ] Married filing jointly — less 17,500
- [ ] factor 930
- [ ] Single — factor 1
- [ ] Married filing jointly — factor 2

### Virginia income tax (`va-income-tax`)

- [ ] from 0: 2%
- [ ] from 3,000: 3%
- [ ] from 5,000: 5%
- [ ] from 17,000: 5.75%

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 40,000: va-taxable 30,320; va-income-tax 1,485.90; net 32,834.10 — Virginia taxable income $30,320. Virginia income tax $1,485.9. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 85,000: va-taxable 75,320; va-income-tax 4,073.40; net 64,554.10 — Virginia taxable income $75,320. Virginia income tax $4,073.4. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 150,000 with status = married: va-taxable 130,640; va-income-tax 7,254.30; net 115,930.70 — Virginia taxable income $130,640. Virginia income tax $7,254.3. PolicyEngine US 2.62.5 gives the same state figures to the cent.

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/us/us-va.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
