# Australia — 2026-27 verification checklist

Generated from `data/tax/au/au.2026-27.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026-27 (2026-07-01 to 2027-06-30)
- Currency: AUD
- Rates last checked: not yet
- Verified by a person: **not yet**
- Provisional items: `Medicare levy thresholds are the 2025–26 ones ($28,011 / $35,013); the 2026–27 thresholds are usually announced in the following May budget`, `The $1,000 standard deduction is described by the ATO as starting in 2026–27, but no source confirmed the bill had passed`, `Medicare levy surcharge thresholds are the 2025–26 ones`

## Check against

- **Start here:** https://www.ato.gov.au/calculators-and-tools/tax-withheld-calculator
- ATO — Tax rates: Australian residents: https://www.ato.gov.au/tax-rates-and-codes/tax-rates-australian-residents
- ATO — Standard deduction for work-related expenses: https://www.ato.gov.au/individuals-and-families/income-deductions-offsets-and-records/deductions-you-can-claim/work-related-deductions/standard-deduction-for-work-related-expenses
- ATO — Medicare levy reduction for low-income earners: https://www.ato.gov.au/individuals-and-families/medicare-and-private-health-insurance/medicare-levy/medicare-levy-reduction/medicare-levy-reduction-for-low-income-earners
- ATO — Low income tax offset: https://www.ato.gov.au/individuals-and-families/income-deductions-offsets-and-records/tax-offsets/low-and-middle-income-earner-tax-offsets
- Study and training support loans rates and repayment thresholds (ATO): https://www.ato.gov.au/tax-rates-and-codes/study-and-training-support-loans-rates-and-repayment-thresholds

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in AUD, unless the line says otherwise.

### Taxable income (`au-taxable`)

> After the new $1,000 standard deduction for work-related expenses, which applies from 2026–27 unless you claim more in actual expenses.

- [ ] less 1,000

### Income tax (`au-income-tax`)

> Nothing to $18,200, 15% to $45,000 (cut from 16% on 1 July 2026), 30% to $135,000, 37% to $190,000, 45% above. Less the low income tax offset of up to $700.

- [ ] from 0: 0%
- [ ] from 18,200: 15%
- [ ] from 45,000: 30%
- [ ] from 135,000: 37%
- [ ] from 190,000: 45%
- [ ] applies when up to 37,500
- [ ] less 700
- [ ] applies when up to 45,000
- [ ] rate 5%
- [ ] less 37,500
- [ ] less 325
- [ ] rate 1.5%
- [ ] less 45,000

### Medicare levy (`au-medicare`)

> 2% of taxable income, phased in from $28,011 at 10 cents per dollar.

- [ ] rate 2%
- [ ] applies when up to 28,011
- [ ] rate 10%
- [ ] less 28,011

### Medicare levy surcharge (`au-mls`)

> Only without private hospital cover: 1% above $101,000, 1.25% above $118,000, 1.5% above $158,000.

- [ ] No — over 0: 0
- [ ] No — over 101,000: 1
- [ ] No — over 118,000: 1.25
- [ ] No — over 158,000: 1.5

### HELP repayment (`au-help`)

> From 2026-27: nothing on income up to $69,528, then 15% of income above it up to $129,717, then $9,028.35 plus 17% above that; above $186,050, 10% of all income. Worked out on salary, where the ATO uses repayment income.

- [ ] Yes — applies when over 186,050
- [ ] Yes — rate 10%
- [ ] Yes — from 0: 0%
- [ ] Yes — from 69,528: 15%
- [ ] Yes — from 129,717: 17%

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 60,000: au-taxable 59,000; au-income-tax 8,105; au-medicare 1,180; net 50,715 — Taxable 59,000. Tax 26,800 × 15% = 4,020 + 14,000 × 30% = 4,200 → 8,220, less offset 325 − 1.5% × 14,000 = 115 → 8,105. Medicare 2% = 1,180.
- [ ] 30,000: au-income-tax 920; au-medicare 98.9 — Taxable 29,000. Tax 15% × 10,800 = 1,620, less the full 700 offset = 920. Medicare phasing in: 10% × 989 = 98.90.
- [ ] 130,000 with cover = no: au-mls 1,612.50; net 96,587.50 — Taxable 129,000: surcharge 1.25% = 1,612.50.
- [ ] 100,000 with help = yes: au-help 4,570.80 — 15% x (100,000 - 69,528) = 4,570.80.
- [ ] 150,000 with help = yes: au-help 12,476.46 — 9,028.35 + 17% x (150,000 - 129,717) = 9,028.35 + 3,448.11 = 12,476.46.
- [ ] 200,000 with help = yes: au-help 20,000 — Above 186,050: 10% x 200,000 = 20,000.

## Not modelled (confirm the page says so)

- HECS-HELP and other study loan repayments
- Salary sacrifice and concessional super contributions
- Family Medicare thresholds and the senior and pensioner offset
- Actual work-related expenses above $1,000

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/au/au.2026-27.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
