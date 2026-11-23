# Lausanne — 2026 verification checklist

Generated from `data/tax/ch/ch-vd.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: undefined
- Rates last checked: not yet
- Verified by a person: **not yet**
- Adds to: `ch` (check that one too)
- Provisional items: `Assumes health and accident insurance premiums of at least CHF 5,000 a year, the most a single person can deduct`, `The 5% reduction for 2026 is applied to the cantonal tax only, not Lausanne's`, `Vaud taxable income is not rounded here`

## Check against

- **Start here:** https://swisstaxcalculator.estv.admin.ch/#/home
- ESTV — Feuille cantonale Vaud (Informations fiscales, état février 2026): https://www.estv2.admin.ch/stp/kb/vd-fr.pdf
- Ville de Lausanne — Coefficient, taux et arrêté d'imposition: https://www.lausanne.ch/officiel/administration/finances-et-mobilite/finances/impots/coefficient-taux-arrete-imposition.html

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in undefined, unless the line says otherwise.

### Taxable income (Vaud) (`ch-vd-taxable`)

> Net salary less the professional costs lump sum and CHF 5,000 for health and accident insurance premiums.

- [ ] less 5,000

### Cantonal base tax (Vaud) (`ch-vd-base`)

> Vaud's 2026 tariff: 1% on the first CHF 1,600, rising in steps to 15.5% above CHF 291,700.

- [ ] from 0: 1%
- [ ] from 1,600: 2%
- [ ] from 3,400: 3%
- [ ] from 5,100: 4%
- [ ] from 8,300: 5%
- [ ] from 11,900: 6%
- [ ] from 15,100: 7%
- [ ] from 23,600: 8%
- [ ] from 40,500: 9%
- [ ] from 57,200: 10%
- [ ] from 74,400: 11%
- [ ] from 91,200: 12%
- [ ] from 108,100: 12.5%
- [ ] from 135,000: 13%
- [ ] from 162,000: 13.5%
- [ ] from 192,500: 14%
- [ ] from 223,000: 14.5%
- [ ] from 256,000: 15%
- [ ] from 291,700: 15.5%

### Cantonal tax (Vaud) (`ch-vd-canton`)

> The base tax times the 155% cantonal coefficient, less the 5% reduction for 2026.

- [ ] factor 1.55
- [ ] factor 0.95

### City tax (Lausanne) (`ch-vd-commune`)

> 78.5% of the cantonal base tax, Lausanne's rate for 2026. No church tax in Vaud.

- [ ] factor 0.785

### Removed from the parent

- [ ] `ch-zh-taxable` does not apply here
- [ ] `ch-zh-simple` does not apply here
- [ ] `ch-zh-tax` does not apply here

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 100,000: ch-vd-taxable 85,792; ch-vd-base 7,026.12; ch-vd-canton 10,345.96; ch-vd-commune 5,515.50; net 75,786.79 — Federal and social as in Zurich (AHV 5,300, ALV 1,100, federal 1,951.75). Vaud taxable 93,600 − 2,808 − 5,000 = 85,792; base tax 5,773 to CHF 74,400 + 11,392 × 11% (1,253.12) = 7,026.12. Cantonal 7,026.12 × 1.55 × 0.95 = 10,345.96; Lausanne 7,026.12 × 0.785 = 5,515.50.

## Not modelled (confirm the page says so)

- Pillar 3a contributions and other personal deductions
- Commuting and meal cost deductions
- Vaud's deduction for people on modest incomes
- Family quotient (quotient familial) for couples and parents
- Tax at source (Quellensteuer / impôt à la source) tables
- Other Vaud municipalities

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/ch/ch-vd.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
