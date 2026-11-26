# Belgium — 2026 verification checklist

Generated from `data/tax/be/be.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: EUR
- Rates last checked: 2026-11-26
- Verified by a person: **not yet**
- Provisional items: `The 13.07% employee social security rate comes from secondary sources`, `The 2026 tax bands and €6,070 lump-sum cap come from tax publishers (Practicali, Plutus), not an official page; Plutus gives a different tax-free amount (€11,180) from Wikifin's €11,550`

## Check against

- **Start here:** https://knowledge.plutus.be/belastingen-en-bijdragen/fiscale-kerncijfers/aanslagjaar-2027
- RSZ administrative instructions 2026 — social security contributions (employee shares 7.50 + 3.55 + 1.15 + 0.87 = 13.07%): https://www.socialsecurity.be/employer/instructions/dmfa/nl/latest/instructions/socialsecuritycontributions/contributions.html
- RSZ administrative instructions 2026 — special social security contribution (individual assessment schedule): https://www.socialsecurity.be/employer/instructions/dmfa/nl/latest/instructions/special_contributions/other_specialcontributions/specialsocialsecuritycontribution.html
- Wikifin (FSMA) — belastingvrije som, aanslagjaar 2027: https://www.wikifin.be/nl/belasting-werk-en-inkomen/belastingaangifte/je-beroepsinkomen/je-bent-werknemer
- Practicali — geïndexeerde bedragen aanslagjaar 2027: https://www.practicali.be/blog/geindexeerde-bedragen-aj-2027
- Plutus — fiscale kerncijfers aanslagjaar 2027: https://knowledge.plutus.be/belastingen-en-bijdragen/fiscale-kerncijfers/aanslagjaar-2027
- RSZ — administratieve instructies 2026/1: bijzondere bijdrage voor de sociale zekerheid: https://www.socialsecurity.be/employer/instructions/dmfa/nl/2026-1/instructions/special_contributions/other_specialcontributions/specialsocialsecuritycontribution.html
- Vlaanderen — aanslagvoeten aanvullende personenbelasting per gemeente 2008–2026 (csv): https://assets.vlaanderen.be/raw/upload/v1770295328/repositories-prd/APB_2008_2026_exbo2t.csv

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in EUR, unless the line says otherwise.

### Social security (RSZ/ONSS) (`be-rsz`)

> 13.07% of gross pay, with no ceiling.

- [ ] rate 13.07%

### Professional expenses (lump sum) (`be-expenses`)

> 30% of pay after social security, up to €6,070.

- [ ] rate 30%
- [ ] capped at 6,070

### Income tax (federal and regional) (`be-income-tax`)

> 25% to €16,720, 40% to €29,510, 45% to €51,070 and 50% above, less 25% of the €11,550 tax-free amount (€2,887.50).

- [ ] from 0: 25%
- [ ] from 16,720: 40%
- [ ] from 29,510: 45%
- [ ] from 51,070: 50%
- [ ] less 2,887.50

### Municipal surcharge (`be-municipal`)

> A percentage of the income tax set by each municipality: 7.22% on average in Flanders for 2026.

- [ ] Flemish average (7.22%) — factor 0.0722
- [ ] Antwerp (7%) — factor 0.07
- [ ] Ghent (6.5%) — factor 0.065
- [ ] Leuven (6.7%) — factor 0.067
- [ ] Bruges (6.9%) — factor 0.069

### Special social security contribution (BBSZ) (`be-bbsz`)

> The withholding scale for someone taxed alone: nothing on pay up to €1,945.38 a month, then a set amount plus 4.22%, 1.10%, 3.38% and 1.10% bands, at most €182.82 a quarter (€731.28 a year).

- [ ] from 0: 0
- [ ] from 23,344.56: 0
- [ ] from 26,282.16: 123.96
- [ ] from 44,844: 328.20
- [ ] from 49,200: 475.32
- [ ] from 72,465.84: 731.28
- [ ] from 23,344.56: 23,344.56
- [ ] from 26,282.16: 26,282.16
- [ ] from 44,844: 44,844
- [ ] from 49,200: 49,200
- [ ] from 72,465.84: 72,465.84
- [ ] from 23,344.56: 4.22
- [ ] from 26,282.16: 1.1
- [ ] from 44,844: 3.38
- [ ] from 49,200: 1.1
- [ ] from 72,465.84: 0
- [ ] factor 100

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 50,000: be-rsz 6,535; be-expenses 6,070; be-taxable 37,395; be-income-tax 9,956.75; be-municipal 718.88; be-bbsz 484.12; net 32,305.25 — RSZ 13.07% = 6,535; 30% of 43,465 = 13,039.50, capped at 6,070. Taxable 37,395: 4,180 + 12,790 × 40% (5,116) + 7,885 × 45% (3,548.25) = 12,844.25 − 2,887.50 = 9,956.75. Municipal 7.22% = 718.88. BBSZ: monthly 4,166.67 is in the €4,100–6,038.82 band: 4 × 118.83 + 12 × 1.10% × 66.67 = 475.32 + 8.80 = 484.12.
- [ ] 30,000: be-income-tax 2,608.10; be-municipal 188.30; be-bbsz 164.86; net 23,117.74 — RSZ 3,921; taxable 30,000 − 3,921 − 6,070 = 20,009: 4,180 + 3,289 × 40% = 5,495.60 − 2,887.50 = 2,608.10; municipal 188.30. BBSZ: monthly 2,500 is in the €2,190.18–3,737 band: 4 × 30.99 + 12 × 1.10% × 309.82 = 123.96 + 40.90 = 164.86.
- [ ] 100,000: be-income-tax 31,005.50; be-bbsz 731.28; net 52,954.62 — RSZ 13,070; taxable 80,860: 4,180 + 5,116 + 21,560 × 45% (9,702) + 29,790 × 50% (14,895) = 33,893 − 2,887.50 = 31,005.50; municipal 2,238.60; BBSZ at the €731.28 maximum.
- [ ] 50,000 with municipality = gent: be-municipal 647.19; net 32,376.94 — As the first case with Ghent's 6.5%: 9,956.75 × 6.5% = 647.19.

## Not modelled (confirm the page says so)

- Werkbonus and the low-wage tax credit, which cut tax and contributions on lower salaries
- Tax-free supplements for children and dependants
- Meal vouchers, company cars and other benefits
- Brussels and Walloon municipalities
- The final settlement of the special social security contribution on the tax assessment, which uses household income
- Pension savings, service vouchers and other tax reductions

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/be/be.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
