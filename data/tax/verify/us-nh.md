# New Hampshire — 2026 verification checklist

Generated from `data/tax/us/us-nh.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: undefined
- Rates last checked: not yet
- Verified by a person: **not yet**
- Adds to: `us` (check that one too)

## Check against

- **Start here:** https://www.revenue.nh.gov/sites/g/files/ehbemt736/files/documents/2025-001-technical-information-release-repeal.pdf
- TECHNICAL INFORMATION RELEASE TIR 2025-001 I&D Tax Repealed Effective January 1, 2025: https://www.revenue.nh.gov/sites/g/files/ehbemt736/files/documents/2025-001-technical-information-release-repeal.pdf
- New Hampshire Statutes - TITLE V - CHAPTER 77 - Section 77:1: https://gc.nh.gov/rsa/html/V/77/77-mrg.htm
- 2020 New Hampshire DP-10 Form: https://www.revenue.nh.gov/sites/g/files/ehbemt736/files/documents/dp-10-2020-print.pdf#page=4
- 2021 New Hampshire DP-10 Form: https://www.revenue.nh.gov/sites/g/files/ehbemt736/files/documents/dp-10-2021-print.pdf#page=4
- 2022 New Hampshire DP-10 Form Instructions Line 10: https://www.revenue.nh.gov/sites/g/files/ehbemt736/files/documents/dp-10-instructions-2022.pdf#page=4
- 2023 New Hampshire DP-10 Form Instructions Line 10: https://www.revenue.nh.gov/sites/g/files/ehbemt736/files/documents/dp-10-instructions-2023.pdf#page=7

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in undefined, unless the line says otherwise.

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 40,000: net 34,320 — No state income tax. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 85,000: net 68,627.50 — No state income tax. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 150,000 with status = married: net 123,185 — No state income tax. PolicyEngine US 2.62.5 gives the same state figures to the cent.

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/us/us-nh.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
