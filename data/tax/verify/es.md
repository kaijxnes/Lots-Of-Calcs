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

### Taxable base (base liquidable) (`es-base`)

> Married couples filing jointly take a further €3,400 off.

- [ ] Married filing jointly — less 3,400

### Income tax — state share (IRPF estatal) (`es-state-tax`)

> The state scale, less the same scale applied to the €5,550 personal minimum.

- [ ] from 0: 9.5%
- [ ] from 12,450: 12%
- [ ] from 20,200: 15%
- [ ] from 35,200: 18.5%
- [ ] from 60,000: 22.5%
- [ ] from 300,000: 24.5%
- [ ] capped at 5,550

### Income tax — regional share (IRPF autonómico) (`es-regional-tax`)

> Each autonomous community sets its own scale for its half of IRPF.

- [ ] Comunidad de Madrid — from 0: 8.5%
- [ ] Comunidad de Madrid — from 13,362.22: 10.7%
- [ ] Comunidad de Madrid — from 19,004.63: 12.8%
- [ ] Comunidad de Madrid — from 35,425.68: 17.4%
- [ ] Comunidad de Madrid — from 57,320.40: 20.5%
- [ ] Comunidad de Madrid — capped at 5,550
- [ ] Catalonia — from 0: 9.5%
- [ ] Catalonia — from 12,500: 12.5%
- [ ] Catalonia — from 22,000: 16%
- [ ] Catalonia — from 33,000: 19%
- [ ] Catalonia — from 53,000: 21.5%
- [ ] Catalonia — from 90,000: 23.5%
- [ ] Catalonia — from 120,000: 24.5%
- [ ] Catalonia — from 175,000: 25.5%
- [ ] Catalonia — capped at 5,550

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 30,000: es-base 26,050; es-state-tax 2,463; es-regional-tax 2,169.58; net 23,417.42 — Social security 6.5% = 1,950. Net earnings 30,000 − 1,950 − 2,000 = 26,050 (no reduction above €19,747.50). State: 1,182.75 + 930 + 877.50 = 2,990.25 on the base, less 527.25 on the €5,550 minimum = 2,463. Madrid: 1,135.79 + 603.74 + 901.81 = 2,641.33, less 471.75 = 2,169.58.
- [ ] 18,000: es-earnings-reduction 7,302; es-base 7,528; es-state-tax 187.91; es-regional-tax 168.13 — Net earnings 14,830 → full €7,302 reduction; base 7,528. State 9.5% × (7,528 − 5,550) = 187.91; Madrid 8.5% × 1,978 = 168.13.
- [ ] 60,000 with region = catalonia: es-state-tax 7,332; es-regional-tax 7,644.25; net 41,123.75 — Base 54,100. State 7,332. Catalonia: 1,187.50 + 1,187.50 + 1,760 + 3,800 + 236.50 = 8,171.50, less 527.25 on the minimum = 7,644.25.
- [ ] 40,000 with status = married: es-base 32,000; es-state-tax 3,355.50; es-regional-tax 2,931.18 — Joint return: base 35,400 − 3,400 = 32,000. State 3,355.50; Madrid 2,931.18.

## Not modelled (confirm the page says so)

- Regions other than Madrid and Catalonia — including Andalusia and Valencia, whose 2026 scales could not be confirmed — and the separate Basque and Navarre systems
- Regional and state deductions (rent, family, donations) and higher regional personal minimums
- The solidarity contribution on pay above the maximum base (a fraction of 1% for the employee)
- Pension plan contributions

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/es/es.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
