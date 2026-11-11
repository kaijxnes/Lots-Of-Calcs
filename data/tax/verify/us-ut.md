# Utah — 2026 verification checklist

Generated from `data/tax/us/us-ut.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: undefined
- Rates last checked: not yet
- Verified by a person: **not yet**
- Adds to: `us` (check that one too)
- Provisional items: `Taxpayer credit phase-out threshold ($18,213 / $36,426) is the 2025 amount`

## Check against

- **Start here:** https://le.utah.gov/~2026/bills/static/SB0060.html
- Utah SB60 (2026) - Income Tax Rate Amendments: https://le.utah.gov/~2026/bills/static/SB0060.html
- Utah SB60 (2026) Enrolled Bill - Section 59-10-104: https://le.utah.gov/Session/2026/bills/enrolled/SB0060.pdf#page=2
- House Bill 106: https://le.utah.gov/~2025/bills/static/HB0106.html
- House Bill 106 (Bill Text): https://le.utah.gov/Session/2025/bills/enrolled/HB0106.pdf#page=4
- 2025 Utah TC-40 Instructions: https://files.tax.utah.gov/tax/forms/2025/tc-40inst.pdf#page=10
- 2025 Utah TC-40 Instructions, Earned Income Tax Credit Worksheet: https://files.tax.utah.gov/tax/forms/2025/tc-40inst.pdf#page=24

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in undefined, unless the line says otherwise.

### Utah income tax (`ut-income-tax`)

> 4.45% of income, less the taxpayer credit (6% of the federal standard deduction, reduced by 1.3% of income over $18,213, or $36,426 married).

- [ ] rate 4.45%
- [ ] rate 6%
- [ ] rate 1.3%
- [ ] Single — less 18,213
- [ ] Married filing jointly — less 36,426

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 40,000: ut-income-tax 1,097.23; net 33,222.77 — Utah income tax $1,097.23. PolicyEngine US 2.62.5 differs by $5.36 on income tax — it projects 2026 values where this file uses the published 2025 ones.
- [ ] 85,000: ut-income-tax 3,684.73; net 64,942.77 — Utah income tax $3,684.73. PolicyEngine US 2.62.5 differs by $5.36 on income tax — it projects 2026 values where this file uses the published 2025 ones.
- [ ] 150,000 with status = married: ut-income-tax 6,219.46; net 116,965.54 — Utah income tax $6,219.46. PolicyEngine US 2.62.5 differs by $10.73 on income tax — it projects 2026 values where this file uses the published 2025 ones.

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/us/us-ut.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
