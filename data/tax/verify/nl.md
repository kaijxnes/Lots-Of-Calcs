# Netherlands — 2026 verification checklist

Generated from `data/tax/nl/nl.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: EUR
- Rates last checked: not yet
- Verified by a person: **not yet**

## Check against

- **Start here:** https://www.belastingdienst.nl/wps/wcm/connect/nl/voorlopige-aanslag/content/voorlopige-aanslag-tarieven-en-heffingskortingen
- Belastingdienst — tarieven en heffingskortingen 2026: https://www.belastingdienst.nl/wps/wcm/connect/nl/voorlopige-aanslag/content/voorlopige-aanslag-tarieven-en-heffingskortingen
- Belastingdienst — tabel arbeidskorting 2026: https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/inkomstenbelasting/heffingskortingen_boxen_tarieven/heffingskortingen/arbeidskorting/tabel-arbeidskorting-2026
- Deloitte — Pakket Belastingplan 2026, tarieven en heffingskortingen: https://www.deloitte.com/nl/nl/services/tax/blogs/pakket-belastingplan-2026-tarieven-heffingskortingen.html
- Belastingdienst — pensioenpremie: aftrekbaar van het loon: https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/prive/werk_en_inkomen/pensioen_en_andere_uitkeringen/

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in EUR, unless the line says otherwise.

### Tax at Box 1 rates (`nl-box1-tax`)

> 35.75% up to €38,883 and 37.56% up to €78,426 — both including national insurance contributions — then 49.50%.

- [ ] from 0: 35.75%
- [ ] from 38,883: 37.56%
- [ ] from 78,426: 49.5%

### General tax credit (algemene heffingskorting) (`nl-general-credit`)

> €3,115, reduced by 6.398% of income above €29,736.

- [ ] full amount 3,115
- [ ] reduced above 29,736
- [ ] reduction per unit of excess 0.06398

### Labour tax credit (arbeidskorting) (`nl-labour-credit`)

> Builds up to €5,685 at €45,592 of pay, then falls by 6.51% of pay above that, reaching nothing at €132,920.

- [ ] capped at 5,685
- [ ] from 0: 8.324%
- [ ] from 11,965: 31.009%
- [ ] from 25,845: 1.95%
- [ ] from 45,592: 0%
- [ ] rate 6.51%
- [ ] less 45,592

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 50,000: nl-general-credit 1,818.51; nl-labour-credit 5,398.04; nl-income-tax 10,859.67; net 39,140.33 — Box 1: 38,883 × 35.75% = 13,900.67 + 11,117 × 37.56% = 4,175.55 → 18,076.22. General credit 3,115 − 6.398% × 20,264 = 1,818.51. Labour credit 5,685 − 6.51% × 4,408 = 5,398.04. Tax 10,859.67.
- [ ] 20,000: nl-income-tax 547.46 — Box 1 7,150. General credit in full, 3,115. Labour credit 11,965 × 8.324% = 995.97 + 31.009% × 8,035 = 2,491.57 → 3,487.54. Tax 547.46.
- [ ] 90,000: nl-labour-credit 2,794.04; nl-income-tax 31,688.11 — Box 1: 13,900.67 + 39,543 × 37.56% = 14,852.35 + 11,574 × 49.5% = 5,729.13 → 34,482.15. No general credit; labour credit 5,685 − 6.51% × 44,408 = 2,794.04.
- [ ] 50,000 with pensionPct = 6: nl-taxable 47,000; nl-general-credit 2,010.45; nl-labour-credit 5,593.34; nl-income-tax 9,345.63; net 37,654.37 — Taxable wage 47,000.00; box 1, credits and tax recomputed on it.
- [ ] 90,000 with pensionPct = 8: nl-taxable 82,800; nl-general-credit 0; nl-labour-credit 3,262.76; nl-income-tax 27,655.39; net 55,144.61 — Taxable wage 82,800.00; box 1, credits and tax recomputed on it.
- [ ] 30,000 with pensionPct = 4: nl-taxable 28,800; nl-general-credit 3,115; nl-labour-credit 5,357.64; nl-income-tax 1,823.36; net 26,976.64 — Taxable wage 28,800.00; box 1, credits and tax recomputed on it.

## Not modelled (confirm the page says so)

- The franchise and pensionable-salary rules of individual schemes (the percentage here applies to all pay)
- The 30% ruling for incoming employees
- Other credits (income-dependent combination credit for parents) and benefits (toeslagen)
- Box 2 and Box 3 income

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/nl/nl.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
