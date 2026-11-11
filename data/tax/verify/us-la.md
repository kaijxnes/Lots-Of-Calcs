# Louisiana — 2026 verification checklist

Generated from `data/tax/us/us-la.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: undefined
- Rates last checked: not yet
- Verified by a person: **not yet**
- Adds to: `us` (check that one too)

## Check against

- **Start here:** https://www.bls.gov/news.release/archives/cpi_01132026.htm
- Consumer Price Index News Release - 2025 M12 Results: https://www.bls.gov/news.release/archives/cpi_01132026.htm
- Louisiana Department of Revenue, Revenue Information Bulletin 26-019 (September 28, 2026), Inflation Adjustment to Standard Deduction and Retirement Income Exemption: https://dam.ldr.la.gov/lawspolicies/RIB%2026-019.pdf#page=1
- 2025 Louisiana Resident Income Tax Return Instructions, School Readiness Credit: https://dam.ldr.la.gov/taxforms/IT540i%20WEB(2025)D11.pdf#page=16
- 2025 Louisiana Resident Income Tax Return Instructions, Line 8: https://dam.ldr.la.gov/taxforms/IT540i%20WEB(2025)D11.pdf#page=3
- 2025 Louisiana Resident Income Tax Return Instructions, What's New - Line 8: https://dam.ldr.la.gov/taxforms/IT540i%20WEB(2025)D11.pdf#page=1
- R.S. 47:6104 (A): https://legis.la.gov/Legis/Law.aspx?d=453233

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in undefined, unless the line says otherwise.

### Louisiana income tax (`la-income-tax`)

> Flat 3% since 2025, after a standard deduction of $12,838 ($25,676 married).

- [ ] rate 3%
- [ ] Single — less 12,838
- [ ] Married filing jointly — less 25,676

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 40,000: la-income-tax 814.86; net 33,505.14 — Louisiana income tax $814.86. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 85,000: la-income-tax 2,164.86; net 66,462.64 — Louisiana income tax $2,164.86. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 150,000 with status = married: la-income-tax 3,729.72; net 119,455.28 — Louisiana income tax $3,729.72. PolicyEngine US 2.62.5 gives the same state figures to the cent.

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/us/us-la.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
