# Italy — 2026 verification checklist

Generated from `data/tax/it/it.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: EUR
- Rates last checked: not yet
- Verified by a person: **not yet**
- Provisional items: `Lombardy's regional bands and Milan's 0.8% with a €23,000 exemption come from secondary sources that broadly agree; Lombardy's top rate is given as 1.73% or 1.74%`

## Check against

- **Start here:** https://www.agenziaentrate.gov.it/portale/web/guest/schede/agevolazioni/detrazioni-per-lavoro-dipendente
- TUIR art. 11 (aliquote) and art. 13 (detrazioni), as amended by Legge 199/2025: https://www.normattiva.it/uri-res/N2Ls?urn:nir:stato:decreto.presidente.repubblica:1986-12-22;917
- Legge 30 dicembre 2025 n. 199 (Legge di Bilancio 2026): https://www.gazzettaufficiale.it/
- INPS circolare n. 6 del 30 gennaio 2026 — minimali, massimali, prima fascia: https://www.fiscoetasse.com/files/21228/circolare-n-6-del-30-01-2026.pdf
- MEF — addizionali regionali e comunali: https://www1.finanze.gov.it/finanze/pagina_addizionali/public/addizionali.php

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in EUR, unless the line says otherwise.

### Social security (INPS) (`it-inps`)

> 9.19%, plus 1% on pay above €56,224, on pay up to €122,295 (the ceiling for anyone who started contributing after 1995).

- [ ] rate 9.19%
- [ ] capped at 122,295
- [ ] rate 1%
- [ ] less 56,224

### Employee tax credit (detrazione lavoro dipendente) (`it-employee-credit`)

> €1,955 up to €15,000, tapering to nothing at €50,000; €65 more between €25,000 and €35,000.

- [ ] applies when up to 15,000
- [ ] amount 1,955
- [ ] applies when up to 28,000
- [ ] amount 1,910
- [ ] factor 1,190
- [ ] factor 28,000
- [ ] factor 13,000
- [ ] applies when up to 50,000
- [ ] factor 1,910
- [ ] factor 50,000
- [ ] factor 22,000
- [ ] applies when over 25,000
- [ ] applies when up to 35,000
- [ ] plus 65

### Wage-cost relief credit (`it-cuneo-credit`)

> An extra €1,000 deduction between €20,000 and €32,000, tapering to nothing at €40,000.

- [ ] applies when up to 20,000
- [ ] applies when up to 32,000
- [ ] amount 1,000
- [ ] applies when up to 40,000
- [ ] factor 1,000
- [ ] factor 40,000
- [ ] factor 8,000

### Income tax (IRPEF) (`it-irpef`)

> 23% up to €28,000, 33% to €50,000 (cut from 35% in 2026) and 43% above, less the tax credits.

- [ ] from 0: 23%
- [ ] from 28,000: 33%
- [ ] from 50,000: 43%

### Wage-cost relief payment (`it-cuneo-payment`)

> Below €20,000 the relief is paid as a tax-free sum: 7.1% of income up to €8,500, 5.3% up to €15,000 and 4.8% up to €20,000.

- [ ] applies when up to 20,000
- [ ] over 0: 0.071
- [ ] over 8,500: 0.053
- [ ] over 15,000: 0.048

### Regional surcharge (addizionale regionale) (`it-regional`)

> Lombardy: 1.23% to €15,000, 1.58% to €28,000, 1.72% to €50,000, 1.73% above.

- [ ] Milan (Lombardy) — from 0: 1.23%
- [ ] Milan (Lombardy) — from 15,000: 1.58%
- [ ] Milan (Lombardy) — from 28,000: 1.72%
- [ ] Milan (Lombardy) — from 50,000: 1.73%

### Municipal surcharge (addizionale comunale) (`it-municipal`)

> Milan: 0.8% of all taxable income, with incomes up to €23,000 exempt.

- [ ] Milan (Lombardy) — applies when over 23,000
- [ ] Milan (Lombardy) — rate 0.8%

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 30,000: it-taxable 27,243; it-irpef 3,221.60; it-regional 377.94; it-municipal 217.94; net 23,425.52 — INPS 9.19% = 2,757. Taxable 27,243. Gross tax 23% = 6,265.89. Credit 1,910 + 1,190 × 757/13,000 = 1,979.29, plus 65 = 2,044.29; wage-cost credit 1,000. IRPEF 3,221.60. Lombardy 184.50 + 193.44 = 377.94; Milan 0.8% = 217.94.
- [ ] 18,000: it-irpef 782.73; it-cuneo-payment -784.60; it-municipal 0; net 16,141.91 — Taxable 16,345.80; gross tax 3,759.53; credit 1,910 + 1,190 × 11,654.20/13,000 = 2,976.81; IRPEF 782.73. Tax-free relief 4.8% × 16,345.80 = 784.60. Below Milan's exemption.
- [ ] 80,000: it-inps 7,589.76; it-irpef 23,336.40 — INPS 7,352 + 1% × 23,776 = 7,589.76. Taxable 72,410.24 → 6,440 + 7,260 + 9,636.40 = 23,336.40, no credits.
- [ ] 30,000 with surcharges = none: net 24,021.40 — As the first case without surcharges.

## Not modelled (confirm the page says so)

- Surcharges for regions and cities other than Milan, which typically add 1.5–4% of taxable income (Rome's 2026 regional table could not be confirmed)
- Dependant tax credits and the single allowance for children (assegno unico)
- The supplementary payment (trattamento integrativo) of up to €1,200 for incomes up to €15,000
- Severance pay accrual (TFR), which is not deducted from pay
- Joint filing — Italy taxes each person separately

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/it/it.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
