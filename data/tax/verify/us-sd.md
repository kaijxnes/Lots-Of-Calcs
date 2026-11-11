# South Dakota — 2026 verification checklist

Generated from `data/tax/us/us-sd.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: undefined
- Rates last checked: not yet
- Verified by a person: **not yet**
- Adds to: `us` (check that one too)

## Check against

- **Start here:** https://taxfoundation.org/data/all/state/state-income-tax-rates/
- Tax Foundation — State income tax rates: https://taxfoundation.org/data/all/state/state-income-tax-rates/

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in undefined, unless the line says otherwise.

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 40,000: net 34,320 — No state income tax. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 85,000: net 68,627.50 — No state income tax. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 150,000 with status = married: net 123,185 — No state income tax. PolicyEngine US 2.62.5 gives the same state figures to the cent.

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/us/us-sd.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
