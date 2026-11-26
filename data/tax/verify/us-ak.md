# Alaska — 2026 verification checklist

Generated from `data/tax/us/us-ak.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: undefined
- Rates last checked: 2026-11-25
- Verified by a person: **not yet**
- Adds to: `us` (check that one too)

## Check against

- **Start here:** https://labor.alaska.gov/estax/2026-experience-rates.html
- Alaska Department of Labor — 2026 unemployment insurance tax rates (employee rate 0.50%, taxable wage base $54,200): https://labor.alaska.gov/estax/2026-experience-rates.html
- Alaska ES Tax FAQs — wage base and employee rate by year: https://dol.alaska.gov/estax/faq/WagesDeductions.htm
- Tax Foundation — State income tax rates: https://taxfoundation.org/data/all/state/state-income-tax-rates/

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in undefined, unless the line says otherwise.

### Unemployment insurance (employee) (`ak-ui`)

> 0.5% of wages up to the taxable wage base ($54,200 in 2026), at most $271 a year. Alaska is one of the few states where employees pay unemployment insurance.

- [ ] rate 0.5%
- [ ] capped at 54,200

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 40,000: ak-ui 200; net 34,120 — No state income tax. PolicyEngine US 2.62.5 gives the same state figures to the cent. Unemployment insurance 0.5% × 40,000 = 200.00.
- [ ] 85,000: ak-ui 271; net 68,356.50 — No state income tax. PolicyEngine US 2.62.5 gives the same state figures to the cent. Unemployment insurance 0.5% × 54,200 = 271.00.
- [ ] 150,000 with status = married: ak-ui 271; net 122,914 — No state income tax. PolicyEngine US 2.62.5 gives the same state figures to the cent. Unemployment insurance 0.5% × 54,200 = 271.00.

## Not modelled (confirm the page says so)

- Employee unemployment insurance contributions (Alaska is one of three states that charge employees)

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/us/us-ak.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
