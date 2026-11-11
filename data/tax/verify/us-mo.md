# Missouri — 2026 verification checklist

Generated from `data/tax/us/us-mo.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: undefined
- Rates last checked: not yet
- Verified by a person: **not yet**
- Adds to: `us` (check that one too)

## Check against

- **Start here:** https://dor.mo.gov/forms/MO-1040ES_2026.pdf#page=2
- 2026 Form MO-1040ES, Declaration of Estimated Tax for Individuals, Tax Rate Chart: https://dor.mo.gov/forms/MO-1040ES_2026.pdf#page=2
- 2026 Missouri Withholding Tax Formula: https://dor.mo.gov/forms/Withholding%20Formula_2026.pdf#page=2
- MO Rev Stat § 135.030.3(1), effective 2026-01-01: https://revisor.mo.gov/main/OneSection.aspx?section=135.030&bid=57542
- 2025 MO-1040 Book - Individual Income Tax Long Form: https://dor.mo.gov/forms/MO-1040%20Instructions_2025.pdf#page=26
- 2025 Missouri Withholding Tax Formula: https://dor.mo.gov/forms/Withholding%20Table%20-%20Weekly_2025.pdf#page=2
- Missouri Department of Revenue 2025 Individual Income Tax Year Changes (This reference should be updated once the 2025 tax form comes out): https://dor.mo.gov/taxation/individual/tax-types/income/year-changes/

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in undefined, unless the line says otherwise.

### Federal tax deduction (`mo-federal-tax-deduction`)

> A share of federal income tax is deductible: 35% at incomes up to $25,000, falling to nothing above $125,000, capped at $10,000.

- [ ] capped at 10,000
- [ ] over 0: 0.35
- [ ] over 25,000: 0.25
- [ ] over 50,000: 0.15
- [ ] over 100,000: 0.05
- [ ] over 125,000: 0

### Missouri income tax (`mo-income-tax`)

- [ ] from 0: 0%
- [ ] from 1,348: 2%
- [ ] from 2,696: 2.5%
- [ ] from 4,044: 3%
- [ ] from 5,392: 3.5%
- [ ] from 6,740: 4%
- [ ] from 8,088: 4.5%
- [ ] from 9,436: 4.7%

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 40,000: mo-federal-tax-deduction 655; mo-taxable 23,245; mo-income-tax 911.88; net 33,408.12 — Federal tax deduction $655, missouri taxable income $23,245. Missouri income tax $911.88. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 85,000: mo-federal-tax-deduction 1,480.50; mo-taxable 67,419.50; mo-income-tax 2,988.08; net 65,639.42 — Federal tax deduction $1,480.5, missouri taxable income $67,419.5. Missouri income tax $2,988.08. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 150,000 with status = married: mo-federal-tax-deduction 0; mo-taxable 117,800; mo-income-tax 5,355.97; net 117,829.03 — Federal tax deduction $0, missouri taxable income $117,800. Missouri income tax $5,355.97. PolicyEngine US 2.62.5 gives the same state figures to the cent.

## Not modelled (confirm the page says so)

- Kansas City and St. Louis 1% earnings taxes

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/us/us-mo.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
