# New Jersey — 2026 verification checklist

Generated from `data/tax/us/us-nj.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: undefined
- Rates last checked: not yet
- Verified by a person: **not yet**
- Adds to: `us` (check that one too)

## Check against

- **Start here:** https://www.nj.gov/treasury/taxation/pdf/current/1040i.pdf#page=8
- 2025 NJ-1040 Instructions (Line 8): https://www.nj.gov/treasury/taxation/pdf/current/1040i.pdf#page=8
- 2025 NJ-1040 Instructions - Tax Rate Schedules: https://www.nj.gov/treasury/taxation/pdf/current/1040i.pdf#page=65
- P.L. 2023, c.75, Section 3(c) - Stay NJ Act: https://pub.njleg.state.nj.us/Bills/2022/PL23/75_.PDF#page=3
- P.L. 2024, c.88 - Stay NJ Amendment: https://pub.njleg.state.nj.us/Bills/2024/PL24/88_.PDF
- NJ Division of Taxation - Stay NJ Program: https://www.nj.gov/treasury/taxation/staynj/index.shtml
- New Jersey Administrative Code 18:35-2.9 (a): https://www.law.cornell.edu/regulations/new-jersey/N-J-A-C-18-35-2-9

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in undefined, unless the line says otherwise.

### New Jersey taxable income (`nj-taxable`)

- [ ] Single — less 1,000
- [ ] Married filing jointly — less 2,000

### New Jersey income tax (`nj-income-tax`)

- [ ] Single — applies when up to 10,000
- [ ] Married filing jointly — applies when up to 20,000
- [ ] Single — from 0: 1.4%
- [ ] Single — from 20,000: 1.75%
- [ ] Single — from 35,000: 3.5%
- [ ] Single — from 40,000: 5.525%
- [ ] Single — from 75,000: 6.37%
- [ ] Single — from 500,000: 8.97%
- [ ] Single — from 1,000,000: 10.75%
- [ ] Married filing jointly — from 0: 1.4%
- [ ] Married filing jointly — from 20,000: 1.75%
- [ ] Married filing jointly — from 50,000: 2.45%
- [ ] Married filing jointly — from 70,000: 3.5%
- [ ] Married filing jointly — from 80,000: 5.525%
- [ ] Married filing jointly — from 150,000: 6.37%
- [ ] Married filing jointly — from 500,000: 8.97%
- [ ] Married filing jointly — from 1,000,000: 10.75%

### Unemployment and workforce (`nj-ui-wf`)

> 0.3825% unemployment plus 0.0425% workforce development, on wages up to $44,800.

- [ ] rate 0.425%
- [ ] capped at 44,800

### Disability and family leave (`nj-tdi-fli`)

> 0.19% temporary disability plus 0.23% family leave insurance, on wages up to $171,100.

- [ ] rate 0.42%
- [ ] capped at 171,100

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 40,000: nj-taxable 39,000; nj-income-tax 682.50; nj-ui-wf 170; nj-tdi-fli 168; net 33,299.50 — New jersey taxable income $39,000. New Jersey income tax $682.5; Unemployment and workforce $170; Disability and family leave $168. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 85,000: nj-taxable 84,000; nj-income-tax 3,224.55; nj-ui-wf 190.40; nj-tdi-fli 357; net 64,855.55 — New jersey taxable income $84,000. New Jersey income tax $3,224.55; Unemployment and workforce $190.4; Disability and family leave $357. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 150,000 with status = married: nj-taxable 148,000; nj-income-tax 5,402; nj-ui-wf 190.40; nj-tdi-fli 630; net 116,962.60 — New jersey taxable income $148,000. New Jersey income tax $5,402; Unemployment and workforce $190.4; Disability and family leave $630. PolicyEngine US 2.62.5 gives the same state figures to the cent.

## Not modelled (confirm the page says so)

- Property tax deduction or credit

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/us/us-nj.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
