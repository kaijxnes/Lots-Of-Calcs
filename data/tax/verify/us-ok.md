# Oklahoma — 2026 verification checklist

Generated from `data/tax/us/us-ok.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: undefined
- Rates last checked: not yet
- Verified by a person: **not yet**
- Adds to: `us` (check that one too)

## Check against

- **Start here:** https://oklahoma.gov/content/dam/ok/en/tax/documents/forms/individuals/current/511-Pkt.pdf#page=10
- 2025 Form 511 instructions: https://oklahoma.gov/content/dam/ok/en/tax/documents/forms/individuals/current/511-Pkt.pdf#page=10
- 2025 Form 511 instructions: https://oklahoma.gov/content/dam/ok/en/tax/documents/forms/individuals/current/511-Pkt.pdf#page=9
- 2025 Form 511 instructions: https://oklahoma.gov/content/dam/ok/en/tax/documents/forms/individuals/current/511-Pkt.pdf#page=27
- Oklahoma House Bill 2764: https://www.oklegislature.gov/cf_pdf/2025-26%20ENR/hB/HB2764%20ENR.PDF#page=11
- 2021 Form 511 instructions: https://oklahoma.gov/content/dam/ok/en/tax/documents/forms/individuals/past-year/2021/511-Pkt-2021.pdf
- 2022 Form 511 instructions: https://oklahoma.gov/content/dam/ok/en/tax/documents/forms/individuals/past-year/2022/511-Pkt-2022.pdf

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in undefined, unless the line says otherwise.

### Oklahoma taxable income (`ok-taxable`)

- [ ] Single — less 6,350
- [ ] Married filing jointly — less 12,700
- [ ] factor 1,000
- [ ] Single — factor 1
- [ ] Married filing jointly — factor 2

### Oklahoma income tax (`ok-income-tax`)

> 2026 rates, with the top rate cut to 4.5%.

- [ ] Single — from 0: 0%
- [ ] Single — from 3,750: 2.5%
- [ ] Single — from 4,900: 3.5%
- [ ] Single — from 7,200: 4.5%
- [ ] Married filing jointly — from 0: 0%
- [ ] Married filing jointly — from 7,500: 2.5%
- [ ] Married filing jointly — from 9,800: 3.5%
- [ ] Married filing jointly — from 14,400: 4.5%

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 40,000: ok-taxable 32,650; ok-income-tax 1,254.50; net 33,065.50 — Oklahoma taxable income $32,650. Oklahoma income tax $1,254.5. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 85,000: ok-taxable 77,650; ok-income-tax 3,279.50; net 65,348 — Oklahoma taxable income $77,650. Oklahoma income tax $3,279.5. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 150,000 with status = married: ok-taxable 135,300; ok-income-tax 5,659; net 117,526 — Oklahoma taxable income $135,300. Oklahoma income tax $5,659. PolicyEngine US 2.62.5 gives the same state figures to the cent.

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/us/us-ok.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
