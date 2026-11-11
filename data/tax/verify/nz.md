# New Zealand — 2026-27 verification checklist

Generated from `data/tax/nz/nz.2026-27.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026-27 (2026-04-01 to 2027-03-31)
- Currency: NZD
- Rates last checked: not yet
- Verified by a person: **not yet**
- Provisional items: `Figures are from secondary payroll and calculator sources that agree with each other; not checked against Inland Revenue or ACC directly`

## Check against

- **Start here:** https://www.ird.govt.nz/income-tax/income-tax-for-individuals/tax-codes-and-tax-rates-for-individuals/tax-rates-for-individuals
- Inland Revenue — Tax rates for individuals: https://www.ird.govt.nz/income-tax/income-tax-for-individuals/tax-codes-and-tax-rates-for-individuals/tax-rates-for-individuals
- Inland Revenue — Independent earner tax credit: https://www.ird.govt.nz/income-tax/income-tax-for-individuals/individual-tax-credits/independent-earner-tax-credit-ietc
- ACC — Levy rates: https://www.acc.co.nz/for-business/understanding-levies-if-you-work/
- KiwiSaver and student loan changes (Inland Revenue): https://www.ird.govt.nz/updates/news-folder/2026/taxation-bill-now-in-effect

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in NZD, unless the line says otherwise.

### Independent earner tax credit (`nz-ietc`)

> $520 a year for incomes from $24,000 to $66,000, falling by 13 cents per dollar to nothing at $70,000.

- [ ] applies when under 24,000
- [ ] applies when up to 66,000
- [ ] amount 520
- [ ] rate 13%
- [ ] less 66,000

### Income tax (PAYE) (`nz-income-tax`)

> 10.5% to $15,600, 17.5% to $53,500, 30% to $78,100, 33% to $180,000, 39% above.

- [ ] from 0: 10.5%
- [ ] from 15,600: 17.5%
- [ ] from 53,500: 30%
- [ ] from 78,100: 33%
- [ ] from 180,000: 39%

### ACC earners' levy (`nz-acc`)

> 1.75% of earnings up to $156,641 in 2026–27.

- [ ] rate 1.75%
- [ ] capped at 156,641

### KiwiSaver (`nz-kiwisaver`)

> Your contribution as a percentage of gross pay; the default rose to 3.5% from 1 April 2026. Your employer's contribution goes on top and isn't taken from your pay.

- [ ] 3% (temporary rate) — rate 3%
- [ ] 4% — rate 4%
- [ ] 6% — rate 6%
- [ ] 8% — rate 8%
- [ ] 10% — rate 10%
- [ ] 3.5% (default) — rate 3.5%

### Student loan repayment (`nz-student-loan`)

> 12% of income over $24,128 a year.

- [ ] Yes — rate 12%
- [ ] Yes — less 24,128

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 68,000: nz-ietc 260; nz-income-tax 12,360.50; nz-acc 1,190; net 54,449.50 — Tax 15,600 × 10.5% = 1,638 + 37,900 × 17.5% = 6,632.50 + 14,500 × 30% = 4,350 → 12,620.50, less credit 520 − 13% × 2,000 = 260 → 12,360.50. ACC 1.75% = 1,190.
- [ ] 200,000: nz-acc 2,741.22; nz-income-tax 57,077.50 — ACC capped at 1.75% × 156,641 = 2,741.22.
- [ ] 80,000 with kiwisaver = 3.5, studentLoan = yes: nz-kiwisaver 2,800; nz-student-loan 6,704.64 — KiwiSaver 3.5% x 80,000 = 2,800; student loan 12% x (80,000 - 24,128) = 6,704.64.

## Not modelled (confirm the page says so)

- KiwiSaver contributions (employee default rate 3–4%)
- Student loan repayments (12% above the threshold)
- Secondary tax codes

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/nz/nz.2026-27.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
