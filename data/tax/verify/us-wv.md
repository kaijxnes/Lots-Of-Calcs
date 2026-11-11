# West Virginia — 2026 verification checklist

Generated from `data/tax/us/us-wv.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: undefined
- Rates last checked: not yet
- Verified by a person: **not yet**
- Adds to: `us` (check that one too)

## Check against

- **Start here:** https://www.wvlegislature.gov/Bill_Text_HTML/2026_SESSIONS/RS/bills/sb392%20sub1%20enr.pdf#page=6
- West Virginia Senate Bill 392 (2026), §11-21-4j(a): https://www.wvlegislature.gov/Bill_Text_HTML/2026_SESSIONS/RS/bills/sb392%20sub1%20enr.pdf#page=6
- West Virginia Personal Income Tax Forms And Instructions 2025, Family Tax Credit Tables: https://tax.wv.gov/Documents/PIT/2025/it140.PersonalIncomeTaxFormsAndInstructions.2025.pdf#page=14
- West Virginia Personal Income Tax Forms And Instructions 2025: https://tax.wv.gov/Documents/PIT/2025/it140.PersonalIncomeTaxFormsAndInstructions.2025.pdf#page=26
- West Virginia Personal Income Tax Forms And Instructions 2025, Senior Citizens Tax Credit Worksheet: https://tax.wv.gov/Documents/PIT/2025/it140.PersonalIncomeTaxFormsAndInstructions.2025.pdf#page=36
- West Virginia Personal Income Tax Forms And Instructions 2025, Tax Rate Schedules: https://tax.wv.gov/Documents/PIT/2025/it140.PersonalIncomeTaxFormsAndInstructions.2025.pdf#page=37
- West Virginia Personal Income Tax Forms And Instructions 2025, Schedule M Instructions LINE 34: https://tax.wv.gov/Documents/PIT/2025/it140.PersonalIncomeTaxFormsAndInstructions.2025.pdf#page=28

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in undefined, unless the line says otherwise.

### West Virginia taxable income (`wv-taxable`)

- [ ] factor 2,000
- [ ] Single — factor 1
- [ ] Married filing jointly — factor 2

### West Virginia income tax (`wv-income-tax`)

> 2026 rates.

- [ ] from 0: 2.11%
- [ ] from 10,000: 2.81%
- [ ] from 25,000: 3.16%
- [ ] from 40,000: 4.22%
- [ ] from 60,000: 4.58%

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 40,000: wv-taxable 38,000; wv-income-tax 1,043.30; net 33,276.70 — West virginia taxable income $38,000. West Virginia income tax $1,043.3. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 85,000: wv-taxable 83,000; wv-income-tax 3,003.90; net 65,623.60 — West virginia taxable income $83,000. West Virginia income tax $3,003.9. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 150,000 with status = married: wv-taxable 146,000; wv-income-tax 5,889.30; net 117,295.70 — West virginia taxable income $146,000. West Virginia income tax $5,889.3. PolicyEngine US 2.62.5 gives the same state figures to the cent.

## Not modelled (confirm the page says so)

- Low-income family tax credit

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/us/us-wv.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
