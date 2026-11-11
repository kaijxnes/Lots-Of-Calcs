# Illinois — 2026 verification checklist

Generated from `data/tax/us/us-il.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: undefined
- Rates last checked: not yet
- Verified by a person: **not yet**
- Adds to: `us` (check that one too)
- Provisional items: `Personal exemption of $2,850 is the 2025 amount`

## Check against

- **Start here:** https://tax.illinois.gov/content/dam/soi/en/web/tax/forms/incometax/documents/currentyear/individual/il-1040-instr.pdf#page=1
- Illinois Department of Revenue 2025 Form IL-1040 Instructions: https://tax.illinois.gov/content/dam/soi/en/web/tax/forms/incometax/documents/currentyear/individual/il-1040-instr.pdf#page=1
- Illinois Department of Revenue 2025 Schedule ICR; Illinois Credits: https://tax.illinois.gov/content/dam/soi/en/web/tax/forms/incometax/documents/currentyear/individual/il-1040-schedule-icr.pdf#page=1
- Illinois Department of Revenue 2025 Form IL-1040 Individual Income Tax Return: https://tax.illinois.gov/content/dam/soi/en/web/tax/forms/incometax/documents/currentyear/individual/il-1040.pdf#page=1
- 2025 Schedule IL-E/EIC - Illinois Exemption and Earned Income Credit: https://tax.illinois.gov/content/dam/soi/en/web/tax/forms/incometax/documents/currentyear/individual/il-1040-schedule-il-e-eic.pdf#page=1
- Illinois Department of Revenue 2025 Form IL-1040 Instructions; Step 4 - Exemptions: https://tax.illinois.gov/content/dam/soi/en/web/tax/forms/incometax/documents/currentyear/individual/il-1040-instr.pdf#page=8
- Income Tax Rates: https://tax.illinois.gov/research/taxrates/income.html

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in undefined, unless the line says otherwise.

### Illinois personal exemption (`il-exemption`)

> $2,850 per person, lost entirely above $250,000 of income ($500,000 married).

- [ ] Single — applies when up to 250,000
- [ ] Married filing jointly — applies when up to 500,000
- [ ] factor 2,850
- [ ] Single — factor 1
- [ ] Married filing jointly — factor 2

### Illinois income tax (`il-income-tax`)

- [ ] rate 4.95%

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 40,000: il-exemption 2,850; il-income-tax 1,838.93; net 32,481.08 — Illinois personal exemption $2,850. Illinois income tax $1,838.93. PolicyEngine US 2.62.5 differs by $3.72 on income tax — it projects 2026 values where this file uses the published 2025 ones.
- [ ] 85,000: il-exemption 2,850; il-income-tax 4,066.43; net 64,561.08 — Illinois personal exemption $2,850. Illinois income tax $4,066.43. PolicyEngine US 2.62.5 differs by $3.72 on income tax — it projects 2026 values where this file uses the published 2025 ones.
- [ ] 150,000 with status = married: il-exemption 5,700; il-income-tax 7,142.85; net 116,042.15 — Illinois personal exemption $5,700. Illinois income tax $7,142.85. PolicyEngine US 2.62.5 differs by $7.43 on income tax — it projects 2026 values where this file uses the published 2025 ones.

## Not modelled (confirm the page says so)

- Use tax that some filers pay on the income tax return

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/us/us-il.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
