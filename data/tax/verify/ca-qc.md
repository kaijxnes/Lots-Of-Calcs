# Quebec — 2026 verification checklist

Generated from `data/tax/ca/ca-qc.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: undefined
- Rates last checked: 2026-11-11
- Verified by a person: **not yet**
- Adds to: `ca` (check that one too)

## Check against

- **Start here:** https://www.revenuquebec.ca/documents/en/formulaires/tp/TP-1015.F-V(2026-01).pdf
- Revenu Quebec: Formulas to Calculate Source Deductions and Contributions (TP-1015.F-V), 2026: https://www.revenuquebec.ca/documents/en/formulaires/tp/TP-1015.F-V(2026-01).pdf
- CRA Payroll Deductions Formulas (T4127), 122nd edition: federal formulas for Quebec employees: https://www.canada.ca/content/dam/cra-arc/formspubs/pub/t4127-jan/t4127-01-26e.pdf

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in undefined, unless the line says otherwise.

### Quebec Pension Plan (QPP) (`ca-cpp`)

> 6.30% (5.30% base plus 1% first additional) of earnings above $3,500, up to $74,600: at most $4,479.30 in 2026.

- [ ] rate 6.3%

### Second additional QPP (QPP2) (`ca-cpp2`)

> 4% of earnings between $74,600 and $85,000: at most $416.

- [ ] rate 4%

### Employment Insurance (EI) (`ca-ei`)

> Quebec's reduced rate of 1.30% of insurable earnings up to $68,900 (at most $895.70), because QPIP pays parental benefits.

- [ ] rate 1.3%
- [ ] capped at 68,900

### Base QPP contribution (`ca-cpp-base`)

- [ ] rate 5.3%

### Contributions that earn a federal tax credit (`ca-contributions-credit`)

> Base QPP, EI and QPIP premiums.

- [ ] rate 0.43%
- [ ] capped at 103,000

### Federal income tax (`ca-income-tax`)

> Basic federal tax less the 16.5% Quebec abatement.

- [ ] factor 0.835

### Quebec Parental Insurance Plan (QPIP) (`ca-qc-qpip`)

> 0.430% of insurable earnings up to $103,000: at most $442.90.

- [ ] rate 0.43%
- [ ] capped at 103,000

### Quebec taxable income (`ca-qc-taxable`)

> Salary less the deduction for workers (6%, up to $1,450) and the enhanced QPP contributions.

- [ ] rate 6%
- [ ] capped at 1,450

### Quebec income tax (`ca-qc-income-tax`)

> 14% to $54,345, 19% to $108,680, 24% to $132,245 and 25.75% above, less 14% of the $18,952 basic personal amount.

- [ ] from 0: 14%
- [ ] from 54,345: 19%
- [ ] from 108,680: 24%
- [ ] from 132,245: 25.75%
- [ ] rate 14%
- [ ] amount 18,952

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 30,000: ca-taxable 29,735; ca-cpp 1,669.50; ca-ei 390; ca-qc-qpip 129; ca-income-tax 1,152.46; ca-qc-taxable 28,285; ca-qc-income-tax 1,306.62; net 25,352.42 — Independent implementation of T4127 (federal, Quebec variants) and TP-1015.F-V steps 1 and 2.
- [ ] 60,000: ca-taxable 59,435; ca-cpp 3,559.50; ca-ei 780; ca-qc-qpip 258; ca-income-tax 4,427.35; ca-qc-taxable 57,985; ca-qc-income-tax 5,646.62; net 45,328.53 — Independent implementation of T4127 (federal, Quebec variants) and TP-1015.F-V steps 1 and 2.
- [ ] 100,000: ca-taxable 98,873; ca-cpp 4,479.30; ca-ei 895.70; ca-qc-qpip 430; ca-income-tax 11,054.06; ca-qc-taxable 97,423; ca-qc-income-tax 13,139.84; net 69,585.10 — Independent implementation of T4127 (federal, Quebec variants) and TP-1015.F-V steps 1 and 2.
- [ ] 200,000: ca-taxable 198,873; ca-cpp 4,479.30; ca-ei 895.70; ca-qc-qpip 442.90; ca-income-tax 32,407.63; ca-qc-taxable 197,423; ca-qc-income-tax 37,717.61; net 123,640.87 — Independent implementation of T4127 (federal, Quebec variants) and TP-1015.F-V steps 1 and 2.
- [ ] 300,000: ca-taxable 298,873; ca-cpp 4,479.30; ca-ei 895.70; ca-qc-qpip 442.90; ca-income-tax 58,118.48; ca-qc-taxable 297,423; ca-qc-income-tax 63,467.61; net 172,180.01 — Independent implementation of T4127 (federal, Quebec variants) and TP-1015.F-V steps 1 and 2.

## Not modelled (confirm the page says so)

- Quebec credits other than the basic personal amount
- The Quebec work premium and solidarity tax credit
- The Health Services Fund, which only employers pay

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/ca/ca-qc.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
