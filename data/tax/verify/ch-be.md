# Bern — 2026 verification checklist

Generated from `data/tax/ch/ch-be.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: undefined
- Rates last checked: not yet
- Verified by a person: **not yet**
- Adds to: `ch` (check that one too)
- Provisional items: `Assumes a single person living alone in their own household (the CHF 2,400 deduction)`, `Bern taxable income is not rounded here`

## Check against

- **Start here:** https://swisstaxcalculator.estv.admin.ch/#/home
- ESTV — Kantonsblatt Bern (Steuerinformationen, Stand Februar 2026): https://www.estv2.admin.ch/stp/kb/be-de.pdf
- Finanzverwaltung des Kantons Bern — Steueranlagen der Gemeinden 2026: https://www.fin.be.ch/content/dam/fin/dokumente/de/finanzverwaltung/finanzausgleich/publikationen/fv-stat-steueranlage_2026_1.pdf

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in undefined, unless the line says otherwise.

### Taxable income (Bern) (`ch-be-taxable`)

> Net salary less the professional costs lump sum, the CHF 2,450 insurance premiums deduction, the CHF 5,300 general deduction and CHF 2,400 for someone living alone in their own household.

- [ ] less 2,450
- [ ] less 5,300
- [ ] less 2,400

### Simple tax (Bern) (`ch-be-simple`)

> Bern's 2026 tariff for single people: 1.95% on the first CHF 3,300, rising in steps to 6.5% on income above CHF 470,600.

- [ ] from 0: 1.95%
- [ ] from 3,300: 2.9%
- [ ] from 6,600: 3.6%
- [ ] from 16,400: 4.15%
- [ ] from 32,500: 4.45%
- [ ] from 59,400: 5%
- [ ] from 86,300: 5.6%
- [ ] from 113,200: 5.75%
- [ ] from 140,100: 5.9%
- [ ] from 167,000: 6.05%
- [ ] from 193,900: 6.15%
- [ ] from 231,600: 6.3%
- [ ] from 318,500: 6.4%
- [ ] from 470,600: 6.5%

### Cantonal and city tax (Bern) (`ch-be-tax`)

> The simple tax times the 2026 multipliers: 2.975 for the canton and 1.54 for the city of Bern (4.515 in all). No church tax.

- [ ] factor 4.515

### Removed from the parent

- [ ] `ch-zh-taxable` does not apply here
- [ ] `ch-zh-simple` does not apply here
- [ ] `ch-zh-tax` does not apply here

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 100,000: ch-be-taxable 80,642; ch-be-simple 3,440.15; ch-be-tax 15,532.28; net 76,115.97 — Federal and social as in Zurich (AHV 5,300, ALV 1,100, federal 1,951.75). Bern taxable 93,600 − 2,808 − 2,450 − 5,300 − 2,400 = 80,642; simple tax 2,378.05 to CHF 59,400 + 21,242 × 5% (1,062.10) = 3,440.15; × 4.515 = 15,532.28.

## Not modelled (confirm the page says so)

- Pillar 3a contributions and other personal deductions
- Commuting and meal cost deductions
- The deduction for small and middle incomes (up to CHF 1,100 for single people, phasing out above CHF 16,700)
- Church tax
- Tax at source (Quellensteuer) tables
- Other Bern municipalities

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/ch/ch-be.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
