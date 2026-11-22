# Basel — 2026 verification checklist

Generated from `data/tax/ch/ch-bs.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: undefined
- Rates last checked: not yet
- Verified by a person: **not yet**
- Adds to: `ch` (check that one too)
- Provisional items: `The amounts are those indexed from 2025, which the Basel-Stadt government decided to keep for 2026 (no cold-progression adjustment)`

## Check against

- **Start here:** https://swisstaxcalculator.estv.admin.ch/#/home
- ESTV — Kantonsblatt Basel-Stadt (Steuerinformationen, Stand Februar 2026): https://www.estv2.admin.ch/stp/kb/bs-de.pdf
- Basel-Stadt Regierungsrat — Kein Ausgleich der kalten Progression ab Steuerperiode 2026: https://www.bs.ch/api/government-resolutions/document/1781aa56efd544d1b99204dcce7f031d-332/3/Dokument

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in undefined, unless the line says otherwise.

### Taxable income (Basel-Stadt) (`ch-bs-taxable`)

> Net salary less the CHF 4,200 professional costs lump sum, the CHF 4,200 insurance premiums lump sum and the CHF 19,500 social deduction for a single person, rounded down to CHF 100.

- [ ] less 4,200
- [ ] less 19,500

### Cantonal income tax (Basel-Stadt) (`ch-bs-tax`)

> Tariff A: 21% up to CHF 212,500, 27.25% up to CHF 316,300 and 28.25% above, charged at 100%. The city of Basel levies no income tax of its own. No church tax.

- [ ] from 0: 21%
- [ ] from 212,500: 27.25%
- [ ] from 316,300: 28.25%

### Removed from the parent

- [ ] `ch-zh-taxable` does not apply here
- [ ] `ch-zh-simple` does not apply here
- [ ] `ch-zh-tax` does not apply here

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 100,000: ch-bs-taxable 65,700; ch-bs-tax 13,797; net 77,851.25 — Federal and social as in Zurich (AHV 5,300, ALV 1,100, federal tax 1,951.75). Basel taxable 93,600 − 4,200 − 4,200 − 19,500 = 65,700; tax 21% = 13,797.
- [ ] 300,000: ch-federal-tax 23,014.55; ch-bs-tax 56,070; net 203,385.25 — AHV 15,900; ALV 1,630.20; net 282,469.80. Federal taxable 276,669.80 → 276,600: 10,936.55 + 915 × 13.20 = 23,014.55. Basel taxable 254,569.80 → 254,500: 212,500 × 21% (44,625) + 42,000 × 27.25% (11,445) = 56,070.

## Not modelled (confirm the page says so)

- Pillar 3a contributions and other personal deductions
- Commuting and meal cost deductions
- Actual professional costs above the lump sum
- Church tax
- Tax at source (Quellensteuer) tables
- Riehen and Bettingen, which add their own communal tax

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/ch/ch-bs.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
