# Spain — 2026 verification checklist

Generated from `data/tax/es/es.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: EUR
- Rates last checked: not yet
- Verified by a person: **not yet**
- Provisional items: `The Catalan scale (eight bands from 9.5% to 25.5%, Decree-law 5/2025) comes from secondary sources that agree with each other; older tables starting at 10.5% are still in circulation`

## Check against

- **Start here:** https://sede.agenciatributaria.gob.es/Sede/irpf.html
- Ley 35/2006 del IRPF — art. 20 (reducción rendimientos del trabajo), art. 57 (mínimo personal), art. 63 (escala estatal): https://www.boe.es/buscar/act.php?id=BOE-A-2006-20764
- AEAT — Manual IRPF 2025, reducción por obtención de rendimientos del trabajo: https://sede.agenciatributaria.gob.es/Sede/en_gb/ayuda/manuales-videos-folletos/manuales-ayuda-presentacion/irpf-2025/7-cumplimentacion-irpf/7_1-rendimientos-trabajo-personal/7_1_6-reduccion-obtencion-rendimientos-trabajo.html
- Seguridad Social — bases y tipos de cotización 2026 (Orden PJC/297/2026): https://www.seg-social.es/wps/portal/wss/internet/Trabajadores/CotizacionRecaudacionTrabajadores/36537
- Comunidad de Madrid — escala autonómica IRPF: https://www.comunidad.madrid/servicios/impuestos-tributos/irpf
- Agència Tributària de Catalunya — escala autonòmica IRPF: https://atc.gencat.cat/es/tributs/irpf/
- Ley 35/2006 (consolidated, BOE): art. 52 pension limit, arts. 57–58 minimums: https://www.boe.es/buscar/pdf/2006/BOE-A-2006-20764-consolidado.pdf
- Comunidad de Madrid: Decreto Legislativo 1/2010 (consolidated, BOE), arts. 1–2 bis: https://www.boe.es/buscar/pdf/2010/BOCM-m-2010-90068-consolidado.pdf
- AEAT Manual IRPF 2025: Comunidad de Madrid minimums: https://sede.agenciatributaria.gob.es/Sede/ayuda/manuales-videos-folletos/manuales-practicos/irpf-2025/c14-adecuacion-impuesto-circunstancias-personales/minimo-autonomico-personal-familiar/comunidad-madrid-importes-minimo-personal-familiar.html

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in EUR, unless the line says otherwise.

### Social security (Seguridad Social) (`es-social-security`)

> 4.70% common contingencies, 1.55% unemployment, 0.10% training and 0.15% intergenerational equity (MEI), on pay up to the maximum base of €5,101.20 a month.

- [ ] rate 6.5%
- [ ] capped at 61,214.40

### Net earnings (rendimiento neto) (`es-net-earnings`)

> Pay less social security and the general €2,000 allowance for other expenses.

- [ ] less 2,000

### Reduction for employment income (`es-earnings-reduction`)

> €7,302 for net earnings up to €14,852, tapering to nothing at €19,747.50.

- [ ] applies when up to 14,852
- [ ] amount 7,302
- [ ] applies when up to 17,673.52
- [ ] factor 1.75
- [ ] less 14,852
- [ ] applies when under 19,747.50
- [ ] amount 2,364.34
- [ ] factor 1.14
- [ ] less 17,673.52

### Pension plan reduction (`es-pension-reduction`)

> Contributions to a personal pension plan come off the taxable base, up to the lesser of €1,500 and 30% of net earnings (Ley 35/2006 art. 52).

- [ ] capped at 1,500
- [ ] rate 30%

### Taxable base (base liquidable) (`es-base`)

> Net earnings less the reduction for employment income and any pension plan reduction. Married couples filing jointly take a further €3,400 off.

- [ ] Married filing jointly — less 3,400

### Share of the child allowance claimed (`es-child-share`)

> Parents who both claim split it equally; a joint return or a sole claimant takes it all (art. 61).

- [ ] Married filing jointly — amount 1
- [ ] Single, Shared with the other parent (half each) — amount 0.5
- [ ] Single, In full (you are the only parent claiming) — amount 1

### Personal and family minimum (state) (`es-minimum-state`)

> €5,550 for you, plus €2,400, €2,700, €4,000 and €4,500 for the first, second, third and each further child, and €2,800 more for each child under 3 (arts. 57 and 58).

- [ ] amount 5,550
- [ ] factor 2,400
- [ ] capped at 1
- [ ] factor 2,700
- [ ] less 1
- [ ] at most 1
- [ ] factor 4,000
- [ ] less 2
- [ ] factor 4,500
- [ ] less 3
- [ ] factor 2,800

### Personal and family minimum (regional) (`es-minimum-regional`)

> Madrid sets its own: €5,956.65 for you, €2,575.85, €2,897.83, €4,400 and €4,950 for children and €3,005.16 more for each under 3. Catalonia uses the state amounts.

- [ ] Comunidad de Madrid — amount 5,956.65
- [ ] Comunidad de Madrid — factor 2,575.85
- [ ] Comunidad de Madrid — capped at 1
- [ ] Comunidad de Madrid — factor 2,897.83
- [ ] Comunidad de Madrid — less 1
- [ ] Comunidad de Madrid — at most 1
- [ ] Comunidad de Madrid — factor 4,400
- [ ] Comunidad de Madrid — less 2
- [ ] Comunidad de Madrid — factor 4,950
- [ ] Comunidad de Madrid — less 3
- [ ] Comunidad de Madrid — factor 3,005.16

### Income tax — state share (IRPF estatal) (`es-state-tax`)

> The state scale on the base, less the same scale applied to the personal and family minimum.

- [ ] from 0: 9.5%
- [ ] from 12,450: 12%
- [ ] from 20,200: 15%
- [ ] from 35,200: 18.5%
- [ ] from 60,000: 22.5%
- [ ] from 300,000: 24.5%

### Income tax — regional share (IRPF autonómico) (`es-regional-tax`)

> Each autonomous community sets its own scale for its half of IRPF.

- [ ] Comunidad de Madrid — from 0: 8.5%
- [ ] Comunidad de Madrid — from 13,362.22: 10.7%
- [ ] Comunidad de Madrid — from 19,004.63: 12.8%
- [ ] Comunidad de Madrid — from 35,425.68: 17.4%
- [ ] Comunidad de Madrid — from 57,320.40: 20.5%
- [ ] Catalonia — from 0: 9.5%
- [ ] Catalonia — from 12,500: 12.5%
- [ ] Catalonia — from 22,000: 16%
- [ ] Catalonia — from 33,000: 19%
- [ ] Catalonia — from 53,000: 21.5%
- [ ] Catalonia — from 90,000: 23.5%
- [ ] Catalonia — from 120,000: 24.5%
- [ ] Catalonia — from 175,000: 25.5%

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 30,000: es-base 26,050; es-state-tax 2,463; es-regional-tax 2,135.02; net 23,451.98 — Social security 6.5% = 1,950. Net earnings 30,000 − 1,950 − 2,000 = 26,050 (no reduction above €19,747.50). State: 1,182.75 + 930 + 877.50 = 2,990.25 on the base, less 527.25 on the €5,550 minimum = 2,463. Madrid: 1,135.79 + 603.74 + 901.81 = 2,641.33, less 471.75 = 2,169.58. Madrid's half now uses its own €5,956.65 personal minimum (Decreto Legislativo 1/2010 art. 2).
- [ ] 18,000: es-earnings-reduction 7,302; es-base 7,528; es-state-tax 187.91; es-regional-tax 133.56 — Net earnings 14,830 → full €7,302 reduction; base 7,528. State 9.5% × (7,528 − 5,550) = 187.91; Madrid 8.5% × 1,978 = 168.13. Madrid's half now uses its own €5,956.65 personal minimum (Decreto Legislativo 1/2010 art. 2).
- [ ] 60,000 with region = catalonia: es-state-tax 7,332; es-regional-tax 7,644.25; net 41,123.75 — Base 54,100. State 7,332. Catalonia: 1,187.50 + 1,187.50 + 1,760 + 3,800 + 236.50 = 8,171.50, less 527.25 on the minimum = 7,644.25.
- [ ] 40,000 with status = married: es-base 32,000; es-state-tax 3,355.50; es-regional-tax 2,896.62 — Joint return: base 35,400 − 3,400 = 32,000. State 3,355.50; Madrid 2,931.18. Madrid's half now uses its own €5,956.65 personal minimum (Decreto Legislativo 1/2010 art. 2).
- [ ] 35,000 with children = 2, childrenUnder3 = 1: es-base 30,725; es-state-tax 2,789; es-regional-tax 2,373.07; net 27,562.93 — Separate implementation of arts. 52, 57, 58 and 61 and Madrid's art. 2–2 bis.
- [ ] 35,000 with children = 2, childClaim = full: es-base 30,725; es-state-tax 2,679.75; es-regional-tax 2,268.16; net 27,777.09 — Separate implementation of arts. 52, 57, 58 and 61 and Madrid's art. 2–2 bis.
- [ ] 50,000 with status = married, children = 3, region = catalonia: es-base 41,350; es-state-tax 4,053.75; es-regional-tax 4,265.25; net 38,431 — Separate implementation of arts. 52, 57, 58 and 61 and Madrid's art. 2–2 bis.
- [ ] 45,000 with pensionAnnual = 3000: es-base 38,575; es-state-tax 4,459.88; es-regional-tax 3,883.09; net 30,732.04 — Separate implementation of arts. 52, 57, 58 and 61 and Madrid's art. 2–2 bis.
- [ ] 12,000 with pensionAnnual = 1500: es-base 418; es-state-tax 0; es-regional-tax 0; net 9,720 — Separate implementation of arts. 52, 57, 58 and 61 and Madrid's art. 2–2 bis.
- [ ] 70,000 with children = 5, childrenUnder3 = 2, childClaim = full, pensionAnnual = 1000: es-base 63,021.06; es-state-tax 6,160.24; es-regional-tax 5,450; net 53,410.82 — Separate implementation of arts. 52, 57, 58 and 61 and Madrid's art. 2–2 bis.

## Not modelled (confirm the page says so)

- Regions other than Madrid and Catalonia — including Andalusia and Valencia, whose 2026 scales could not be confirmed — and the separate Basque and Navarre systems
- Regional and state deductions (rent, family, donations) and higher regional personal minimums
- The solidarity contribution on pay above the maximum base (a fraction of 1% for the employee)
- Employer pension contributions and the higher €8,500 limit for company plans
- Regional deductions for children (e.g. Madrid's birth and childcare deductions)

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/es/es.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
