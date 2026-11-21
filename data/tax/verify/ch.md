# Switzerland (Zurich) — 2026 verification checklist

Generated from `data/tax/ch/ch.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: CHF
- Rates last checked: not yet
- Verified by a person: **not yet**
- Provisional items: `Zurich taxable income is assumed to be rounded down to CHF 100, as federal taxable income is`, `The unemployment insurance rate comes from AHV/IV leaflet 2.08 dated 1 January 2025, the current edition`

## Check against

- **Start here:** https://swisstaxcalculator.estv.admin.ch/#/home
- Kanton Basel-Landschaft — Tarife für die direkte Bundessteuer, gültig ab 2026: https://bl-api.webcloud7.ch/politik-und-behorden/direktionen/finanz-und-kirchendirektion/steuerverwaltung/steuerzahlungen/tarife-1/tarife-pdf/tarife-direkte-bundessteuer-2026.pdf/@@download/file/Tarife%20Direkte%20Bundessteuer%202026.pdf
- ESTV — Kreisschreiben 2-220-D-2026 (federal deductions): https://www.estv.admin.ch/dam/de/sd-web/sqbIsYvx0tZg/2-220-D-2026-de.pdf
- ESTV — Kantonsblatt Zürich (Steuerinformationen): https://www.estv2.admin.ch/stp/kb/zh-de.pdf
- Kanton Zürich — aktuelle Gemeindesteuerfüsse: https://www.zh.ch/de/steuern-finanzen/steuern/steuerstatistiken/aktuelle-gemeinde-steuerfuesse.html
- Stadt Zürich — Steuerberechnung: https://www.stadt-zuerich.ch/de/lebenslagen/steuern/natuerliche-personen/steuerberechnung.html
- AHV/IV — Merkblatt 2.01 Beiträge an die AHV, IV und EO: https://www.ahv-iv.ch/p/2.01.d
- AHV/IV — Merkblatt 2.08 Beiträge an die Arbeitslosenversicherung: https://www.ahv-iv.ch/p/2.08.d
- BSV — Beträge berufliche Vorsorge 2026: https://www.bsv.admin.ch/dam/de/sd-web/sAgdISSXenMT/d_Betr%C3%A4ge%202026.pdf

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in CHF, unless the line says otherwise.

### AHV/IV/EO (old age, disability, loss of earnings) (`ch-ahv`)

> 5.3% of all salary, with no ceiling (the employer pays another 5.3%).

- [ ] rate 5.3%

### Unemployment insurance (ALV) (`ch-alv`)

> 1.1% of salary up to CHF 148,200; nothing on salary above that.

- [ ] rate 1.1%
- [ ] capped at 148,200

### Coordinated salary (BVG) (`ch-coordinated`)

> Salary up to CHF 90,720 less the CHF 26,460 coordination deduction, at least CHF 3,780; nothing below the CHF 22,680 entry threshold.

- [ ] applies when under 22,680
- [ ] capped at 90,720
- [ ] less 26,460
- [ ] at least 3,780
- [ ] at most 64,260

### Occupational pension (BVG) (`ch-bvg`)

> Your share of the pension fund contribution, if you enter one. The rate depends on your age and your employer's fund, so it is 0 unless you set it.

- [ ] factor 100

### Other professional costs (lump sum) (`ch-prof-costs`)

> 3% of net salary, at least CHF 2,000 and at most CHF 4,000 — the same for federal and Zurich tax.

- [ ] rate 3%
- [ ] at least 2,000
- [ ] at most 4,000

### Taxable income (federal) (`ch-fed-taxable`)

> Net salary less the professional costs lump sum and the CHF 1,800 insurance premiums deduction, rounded down to CHF 100.

- [ ] less 1,800

### Federal income tax (direkte Bundessteuer) (`ch-federal-tax`)

> 2026 single tariff: nothing up to CHF 15,200, then a set amount plus a rate per CHF 100 in each band, rising to 13.2%; from CHF 794,000 a flat 11.5% of all taxable income.

- [ ] applies when at least 794,000
- [ ] rate 11.5%
- [ ] from 0: 0
- [ ] from 15,200: 0
- [ ] from 33,200: 138.60
- [ ] from 43,500: 229.20
- [ ] from 58,000: 612
- [ ] from 76,200: 1,152.50
- [ ] from 82,100: 1,502.95
- [ ] from 108,900: 3,271.75
- [ ] from 141,500: 6,140.55
- [ ] from 185,100: 10,936.55
- [ ] from 15,200: 15,200
- [ ] from 33,200: 33,200
- [ ] from 43,500: 43,500
- [ ] from 58,000: 58,000
- [ ] from 76,200: 76,200
- [ ] from 82,100: 82,100
- [ ] from 108,900: 108,900
- [ ] from 141,500: 141,500
- [ ] from 185,100: 185,100
- [ ] from 15,200: 0.77
- [ ] from 33,200: 0.88
- [ ] from 43,500: 2.64
- [ ] from 58,000: 2.97
- [ ] from 76,200: 5.94
- [ ] from 82,100: 6.6
- [ ] from 108,900: 8.8
- [ ] from 141,500: 11
- [ ] from 185,100: 13.2
- [ ] factor 100

### Taxable income (Zurich) (`ch-zh-taxable`)

> Net salary less the professional costs lump sum and the CHF 2,900 insurance premiums deduction, rounded down to CHF 100.

- [ ] less 2,900

### Simple state tax (einfache Staatssteuer) (`ch-zh-simple`)

> Zurich's 2026 single tariff: nothing on the first CHF 7,000, then 2% rising in steps to 13% above CHF 266,700.

- [ ] from 0: 0%
- [ ] from 7,000: 2%
- [ ] from 12,000: 3%
- [ ] from 16,800: 4%
- [ ] from 24,800: 5%
- [ ] from 34,500: 6%
- [ ] from 45,700: 7%
- [ ] from 58,800: 8%
- [ ] from 76,400: 9%
- [ ] from 110,400: 10%
- [ ] from 144,100: 11%
- [ ] from 197,400: 12%
- [ ] from 266,700: 13%

### Cantonal and city tax (Zurich) (`ch-zh-tax`)

> The simple state tax times the 2026 multipliers: 95% for the canton and 119% for the city of Zurich (214% in all). No church tax.

- [ ] factor 2.14

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 100,000: ch-ahv 5,300; ch-alv 1,100; ch-prof-costs 2,808; ch-fed-taxable 88,900; ch-federal-tax 1,951.75; ch-zh-taxable 87,800; ch-zh-simple 5,072; ch-zh-tax 10,854.08; net 80,794.17 — AHV 5,300 + ALV 1,100. Net salary 93,600; professional costs 3% = 2,808. Federal taxable 93,600 − 2,808 − 1,800 = 88,992 → 88,900: 1,502.95 + 68 × 6.60 = 1,951.75. Zurich taxable 87,892 → 87,800; simple tax 100 + 144 + 320 + 485 + 672 + 917 + 1,408 + 11,400 × 9% (1,026) = 5,072; × 2.14 = 10,854.08.
- [ ] 60,000: ch-prof-costs 2,000; ch-federal-tax 461.52; ch-zh-simple 2,106; net 51,191.64 — AHV 3,180 + ALV 660; net 56,160; 3% = 1,684.80 so the CHF 2,000 minimum applies. Federal taxable 52,360 → 52,300: 229.20 + 88 × 2.64 = 461.52. Zurich taxable 51,260 → 51,200; simple tax 100 + 144 + 320 + 485 + 672 + 5,500 × 7% = 2,106; × 2.14 = 4,506.84.
- [ ] 150,000: ch-alv 1,630.20; ch-prof-costs 4,000; ch-federal-tax 5,533.35; ch-zh-tax 20,150.24; net 114,736.21 — ALV capped: 1.1% × 148,200 = 1,630.20. Net 140,419.80; professional costs capped at 4,000. Federal taxable 134,619.80 → 134,600: 3,271.75 + 257 × 8.80 = 5,533.35. Zurich taxable 133,519.80 → 133,500; simple tax 7,066 + 23,100 × 10% = 9,416; × 2.14 = 20,150.24.
- [ ] 100,000 with bvgPct = 5: ch-bvg 3,213; ch-federal-tax 1,747.15; ch-zh-tax 10,257.02; net 78,382.83 — Coordinated salary 90,720 − 26,460 = 64,260; 5% = 3,213. Net salary 90,387; 3% = 2,711.61. Federal taxable 85,875.39 → 85,800: 1,502.95 + 37 × 6.60 = 1,747.15. Zurich taxable 84,775.39 → 84,700: simple tax 4,046 + 8,300 × 9% = 4,793; × 2.14 = 10,257.02.

## Not modelled (confirm the page says so)

- Pillar 3a contributions and other personal deductions
- Commuting and meal cost deductions
- Non-occupational accident insurance (NBU), which depends on the employer's insurer
- Daily sickness benefit insurance
- Zurich's personal tax and church tax
- Tax at source (Quellensteuer) tables
- Other cantons and municipalities

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/ch/ch.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
