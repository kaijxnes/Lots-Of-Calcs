# Massachusetts — 2026 verification checklist

Generated from `data/tax/us/us-ma.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: undefined
- Rates last checked: not yet
- Verified by a person: **not yet**
- Adds to: `us` (check that one too)
- Provisional items: `Surtax threshold of $1,083,150 is the 2025 amount`

## Check against

- **Start here:** https://www.mass.gov/doc/2025-form-1-instructions/download#page=3
- Form 1 2025 Massachusetts Resident Income Tax - 4% Surtax: https://www.mass.gov/doc/2025-form-1-instructions/download#page=3
- Massachusetts Chapter 62F Taxpayer Refunds: https://www.mass.gov/audit/audit-of-the-determination-of-whether-net-state-tax-revenues-exceeded-allowable-state-tax-revenues-0
- § 5 Exempt income of individuals; exemption of stock bonus, pension or profit-sharing trust: https://malegislature.gov/Laws/GeneralLaws/PartI/TitleIX/Chapter62/Section5
- Form 1 2023 Massachusetts Resident Income Tax (No Tax Status and Limited Income Credit worksheets): https://www.mass.gov/doc/2023-form-1-instructions/download#page=12
- Form 1 2024 Massachusetts Resident Income Tax (No Tax Status and Limited Income Credit worksheets): https://www.mass.gov/doc/2024-form-1-instructions/download#page=12
- Filing Status on Massachusetts Personal Income Tax: https://www.mass.gov/info-details/filing-status-on-massachusetts-personal-income-tax

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in undefined, unless the line says otherwise.

### Massachusetts taxable income (`ma-taxable`)

> After the $4,400 exemption ($8,800 married) and the deduction for up to $2,000 of Social Security and Medicare contributions.

- [ ] Single — less 4,400
- [ ] Married filing jointly — less 8,800
- [ ] capped at 2,000

### Massachusetts income tax (`ma-income-tax`)

> 5%, plus the 4% surtax on income over $1,083,150.

- [ ] rate 5%
- [ ] rate 4%
- [ ] less 1,083,150

### Paid Family and Medical Leave (`ma-pfml`)

> The employee share: all of the 0.18% family leave premium and 40% of the 0.70% medical leave premium.

- [ ] rate 0.46%
- [ ] capped at 184,500

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 40,000: ma-taxable 33,600; ma-income-tax 1,680; ma-pfml 184; net 32,456 — Massachusetts taxable income $33,600. Massachusetts income tax $1,680; Paid Family and Medical Leave $184. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 85,000: ma-taxable 78,600; ma-income-tax 3,930; ma-pfml 391; net 64,306.50 — Massachusetts taxable income $78,600. Massachusetts income tax $3,930; Paid Family and Medical Leave $391. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 150,000 with status = married: ma-taxable 139,200; ma-income-tax 6,960; ma-pfml 690; net 115,535 — Massachusetts taxable income $139,200. Massachusetts income tax $6,960; Paid Family and Medical Leave $690. PolicyEngine US 2.62.5 gives the same state figures to the cent.

## Not modelled (confirm the page says so)

- No-tax status and limited income credit for very low incomes

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/us/us-ma.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
