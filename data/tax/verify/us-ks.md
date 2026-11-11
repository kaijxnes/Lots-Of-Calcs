# Kansas — 2026 verification checklist

Generated from `data/tax/us/us-ks.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: undefined
- Rates last checked: not yet
- Verified by a person: **not yet**
- Adds to: `us` (check that one too)

## Check against

- **Start here:** https://www.ksrevenue.gov/pdf/ip25.pdf#page=2
- 2025 Form K-40 instructions: https://www.ksrevenue.gov/pdf/ip25.pdf#page=2
- 2025 Form K-40 instructions - Line 4, Worksheet: https://www.ksrevenue.gov/pdf/ip25.pdf#page=6
- K.S.A. 2024 HB 2231 79-32,121 (b)(1): https://kslegislature.gov/li/b2025_26/measures/documents/hb2231_01_0000.pdf?#page=1
- 2025 Form K-40 instructions: https://www.ksrevenue.gov/pdf/ip25.pdf#page=3
- 2025 Form K-40 instructions: https://www.ksrevenue.gov/pdf/ip25.pdf#page=34
- 2022 Form K-40 instructions: https://www.ksrevenue.gov/pdf/ip22.pdf#page=6

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in undefined, unless the line says otherwise.

### Kansas taxable income (`ks-taxable`)

> Standard deduction of $3,605 ($8,240 married) and exemption of $9,160 ($18,320 married).

- [ ] Single — less 3,605
- [ ] Married filing jointly — less 8,240
- [ ] Single — less 9,160
- [ ] Married filing jointly — less 18,320

### Kansas income tax (`ks-income-tax`)

- [ ] Single — applies when up to 12,765
- [ ] Married filing jointly — applies when up to 26,560
- [ ] Single — from 0: 5.2%
- [ ] Single — from 23,000: 5.58%
- [ ] Married filing jointly — from 0: 5.2%
- [ ] Married filing jointly — from 46,000: 5.58%

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 40,000: ks-taxable 27,235; ks-income-tax 1,432.31; net 32,887.69 — Kansas taxable income $27,235. Kansas income tax $1,432.31. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 85,000: ks-taxable 72,235; ks-income-tax 3,943.31; net 64,684.19 — Kansas taxable income $72,235. Kansas income tax $3,943.31. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 150,000 with status = married: ks-taxable 123,440; ks-income-tax 6,713.15; net 116,471.85 — Kansas taxable income $123,440. Kansas income tax $6,713.15. PolicyEngine US 2.62.5 gives the same state figures to the cent.

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/us/us-ks.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
