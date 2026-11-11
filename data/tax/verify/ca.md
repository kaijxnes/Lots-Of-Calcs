# Canada (federal) — 2026 verification checklist

Generated from `data/tax/ca/ca.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: CAD
- Rates last checked: 2026-11-11
- Verified by a person: **not yet**

## Check against

- **Start here:** https://www.canada.ca/content/dam/cra-arc/formspubs/pub/t4127-jan/t4127-01-26e.pdf
- CRA Payroll Deductions Formulas (T4127), 122nd edition, effective January 1, 2026: https://www.canada.ca/content/dam/cra-arc/formspubs/pub/t4127-jan/t4127-01-26e.pdf
- CRA Payroll Deductions Formulas (T4127), 123rd edition, effective July 1, 2026: https://www.canada.ca/content/dam/cra-arc/formspubs/pub/t4127-jul/t4127-jul-26e.pdf
- CRA: Current year tax rates and income brackets (2026): https://www.canada.ca/en/revenue-agency/services/tax/individuals/tax-rates-brackets/current-year.html
- CRA: CPP contribution rates, maximums and exemptions: https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll/payroll-deductions-contributions/canada-pension-plan-cpp/cpp-contribution-rates-maximums-exemptions.html

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in CAD, unless the line says otherwise.

### Pensionable earnings above the basic exemption (`ca-cpp-earnings`)

> CPP is paid on earnings between the $3,500 basic exemption and the 2026 YMPE of $74,600, so on at most $71,100.

- [ ] less 3,500
- [ ] at most 71,100

### Earnings between the YMPE and YAMPE (`ca-cpp2-earnings`)

- [ ] less 74,600
- [ ] at most 10,400

### Canada Pension Plan (CPP) (`ca-cpp`)

> 5.95% (4.95% base plus 1% first additional) of earnings above $3,500, up to $74,600: at most $4,230.45 in 2026.

- [ ] rate 5.95%

### Second additional CPP (CPP2) (`ca-cpp2`)

> 4% of earnings between $74,600 and $85,000: at most $416 in 2026.

- [ ] rate 4%

### Employment Insurance (EI) (`ca-ei`)

> 1.63% of insurable earnings up to $68,900: at most $1,123.07 in 2026.

- [ ] rate 1.63%
- [ ] capped at 68,900

### Base CPP contribution (`ca-cpp-base`)

> The 4.95% base part of CPP earns a tax credit; the enhanced parts are deducted from income instead.

- [ ] rate 4.95%

### Federal basic personal amount (`ca-bpa`)

> $16,452, falling to $14,829 as taxable income rises from $181,440 to $258,482.

- [ ] at least 14,829
- [ ] full amount 16,452
- [ ] reduced above 181,440
- [ ] factor 1,623
- [ ] factor 77,042

### Federal non-refundable credits (`ca-federal-credits`)

> 14% of the basic personal amount, the base CPP and EI contributions and the Canada employment amount ($1,501).

- [ ] rate 14%
- [ ] capped at 1,501

### Basic federal tax (`ca-federal-basic`)

- [ ] from 0: 14%
- [ ] from 58,523: 20.5%
- [ ] from 117,045: 26%
- [ ] from 181,440: 29%
- [ ] from 258,482: 33%

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 30,000: ca-cpp 1,576.75; ca-cpp2 0; ca-ei 489; ca-taxable 29,735; ca-bpa 16,452; ca-income-tax 1,397.38 — Federal part only: independent implementation of T4127 steps 1 to 3.
- [ ] 60,000: ca-cpp 3,361.75; ca-cpp2 0; ca-ei 978; ca-taxable 59,435; ca-bpa 16,452; ca-income-tax 5,338.30 — Federal part only: independent implementation of T4127 steps 1 to 3.
- [ ] 80,000: ca-cpp 4,230.45; ca-cpp2 216; ca-ei 1,123.07; ca-taxable 79,073; ca-bpa 16,452; ca-income-tax 9,242.60 — Federal part only: independent implementation of T4127 steps 1 to 3.
- [ ] 220,000: ca-cpp 4,230.45; ca-cpp2 416; ca-ei 1,123.07; ca-taxable 218,873; ca-bpa 15,663.42; ca-income-tax 44,735.53 — Federal part only: independent implementation of T4127 steps 1 to 3.
- [ ] 300,000: ca-cpp 4,230.45; ca-cpp2 416; ca-ei 1,123.07; ca-taxable 298,873; ca-bpa 14,829; ca-income-tax 69,667.99 — Federal part only: independent implementation of T4127 steps 1 to 3.

## Not modelled (confirm the page says so)

- RRSP, pension plan and union dues deductions
- Credits other than the basic personal amount, CPP/EI and the Canada employment amount (e.g. spouse, dependants, tuition, medical)
- The Canada Workers Benefit and other refundable credits and benefits
- Provincial low-income tax reductions that are claimed on the return rather than through payroll

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/ca/ca.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
