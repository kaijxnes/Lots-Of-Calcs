# Washington — 2026 verification checklist

Generated from `data/tax/us/us-wa.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: undefined
- Rates last checked: not yet
- Verified by a person: **not yet**
- Adds to: `us` (check that one too)

## Check against

- **Start here:** https://lawfilesext.leg.wa.gov/biennium/2025-26/Pdf/Bills/Senate%20Passed%20Legislature/6346-S.PL.pdf#page=60
- ESSB 6346, Sec. 901(2)(e) - Maximum qualifying income: https://lawfilesext.leg.wa.gov/biennium/2025-26/Pdf/Bills/Senate%20Passed%20Legislature/6346-S.PL.pdf#page=60
- WAC 388-478-0015 - Need standards for cash assistance: https://lawfilesext.leg.wa.gov/law/WACArchive/2025/pdf/WAC%20388%20-478%20%20CHAPTER/WAC%20388%20-478%20-0015.pdf
- WSR 25-10-017 - WAC 388-478-0015 update effective July 1, 2025: https://lawfilesext.leg.wa.gov/law/wsrpdf/2025/10/25-10-017.pdf
- ESSB 6346, Sec. 201(1) - Tax Imposed: https://lawfilesext.leg.wa.gov/biennium/2025-26/Pdf/Bills/Senate%20Passed%20Legislature/6346-S.PL.pdf#page=7
- ESSB 6346, Sec. 314 - One million dollar standard deduction: https://lawfilesext.leg.wa.gov/biennium/2025-26/Pdf/Bills/Senate%20Passed%20Legislature/6346-S.PL.pdf#page=14
- RCW 82.87.060(1) Deductions: https://app.leg.wa.gov/RCW/default.aspx?cite=82.87.060

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in undefined, unless the line says otherwise.

### Paid Family and Medical Leave (`wa-pfml`)

> Total premium 1.13% of wages up to the Social Security wage base; employees pay 71.43% of it (the employer pays 28.57%).

- [ ] rate 0.807159%
- [ ] capped at 184,500

### WA Cares long-term care (`wa-cares`)

> 0.58% of all wages. Employees with approved exemptions do not pay it.

- [ ] rate 0.58%

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 40,000: wa-pfml 322.86; wa-cares 232; net 33,765.14 — Paid Family and Medical Leave $322.86; WA Cares long-term care $232. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 85,000: wa-pfml 686.09; wa-cares 493; net 67,448.41 — Paid Family and Medical Leave $686.09; WA Cares long-term care $493. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 150,000 with status = married: wa-pfml 1,210.74; wa-cares 870; net 121,104.26 — Paid Family and Medical Leave $1,210.74; WA Cares long-term care $870. PolicyEngine US 2.62.5 gives the same state figures to the cent.

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/us/us-wa.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
