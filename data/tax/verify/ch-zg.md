# Zug — 2026 verification checklist

Generated from `data/tax/ch/ch-zg.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: undefined
- Rates last checked: not yet
- Verified by a person: **not yet**
- Adds to: `ch` (check that one too)
- Provisional items: `The professional costs lump sum (3% of net salary, CHF 2,000–4,000) is from Zug's 2025 tax return guide, assumed unchanged for 2026`, `Zug taxable income is not rounded here`

## Check against

- **Start here:** https://swisstaxcalculator.estv.admin.ch/#/home
- ESTV — Kantonsblatt Zug (Steuerinformationen, Stand Februar 2026): https://www.estv2.admin.ch/stp/kb/zg-de.pdf
- Kanton Zug — Steuerfüsse der Gemeinden 2023–2026: https://cdn.zg.ch/dam/jcr:24fb8832-3383-4718-9a48-9461bc7501fc/Steuerf%C3%BCsse%202026_effektiv%2021.1.26.pdf
- Kanton Zug — Steuergesetzänderung «Mehrwert für alle» angenommen (30.11.2025): https://zg.ch/de/news/2025/November/steuergesetzaenderung-mehrwert-fuer-alle-angenommen
- Kanton Zug — Wegleitung zur Steuererklärung 2025: https://cdn.zg.ch/dam/jcr:17c572af-908f-43a5-96b0-0fd25983f924/Wegleitung_2025_StKtZug_A4_20251119.pdf

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in undefined, unless the line says otherwise.

### Taxable income (Zug) (`ch-zg-taxable`)

> Net salary less the professional costs lump sum, the CHF 4,600 insurance premiums deduction and the CHF 12,000 personal deduction for a single person.

- [ ] less 4,600
- [ ] less 12,000

### Simple cantonal tax (Zug) (`ch-zg-simple`)

> Zug's single tariff: 0.5% on the first CHF 1,100, rising in steps to 10%, then 9% and 8% on income over CHF 149,900.

- [ ] from 0: 0.5%
- [ ] from 1,100: 1%
- [ ] from 3,300: 2%
- [ ] from 6,100: 3%
- [ ] from 10,100: 3.25%
- [ ] from 15,300: 3.5%
- [ ] from 21,100: 4%
- [ ] from 26,900: 4.5%
- [ ] from 34,900: 5.5%
- [ ] from 46,400: 5.5%
- [ ] from 59,700: 6.5%
- [ ] from 74,700: 8%
- [ ] from 94,800: 10%
- [ ] from 120,100: 9%
- [ ] from 149,900: 8%

### Cantonal and city tax (Zug) (`ch-zg-tax`)

> The simple tax times the 2026 multipliers: 78% for the canton and 52% for the city of Zug (130% in all). No church tax.

- [ ] factor 1.3

### Removed from the parent

- [ ] `ch-zh-taxable` does not apply here
- [ ] `ch-zh-simple` does not apply here
- [ ] `ch-zh-tax` does not apply here

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 100,000: ch-zg-taxable 74,192; ch-zg-simple 3,473.48; ch-zg-tax 4,515.52; ch-federal-tax 1,951.75; net 87,132.73 — Federal and social as in Zurich: AHV 5,300, ALV 1,100, federal tax 1,951.75. Zug taxable 93,600 − 2,808 − 4,600 − 12,000 = 74,192; simple tax 2,531.50 to CHF 59,700 + 14,492 × 6.5% (941.98) = 3,473.48; × 1.30 = 4,515.52.
- [ ] 200,000: ch-federal-tax 10,584.55; ch-zg-simple 11,708.08; ch-zg-tax 15,220.51; net 161,964.74 — AHV 10,600; ALV 1,630.20; net 187,769.80; professional costs capped at 4,000. Federal taxable 181,969.80 → 181,900: 6,140.55 + 404 × 11 = 10,584.55. Zug taxable 187,769.80 − 4,000 − 4,600 − 12,000 = 167,169.80; simple tax 10,326.50 to CHF 149,900 + 17,269.80 × 8% (1,381.58) = 11,708.08; × 1.30 = 15,220.51.

## Not modelled (confirm the page says so)

- Pillar 3a contributions and other personal deductions
- Commuting and meal cost deductions
- Zug's tenant deduction (30% of rent, up to CHF 10,800)
- Church tax
- Tax at source (Quellensteuer) tables
- Other Zug municipalities

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/ch/ch-zg.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
