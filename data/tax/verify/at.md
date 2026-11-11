# Austria — 2026 verification checklist

Generated from `data/tax/at/at.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: EUR
- Rates last checked: not yet
- Verified by a person: **not yet**
- Provisional items: `The unemployment insurance reduction thresholds (€2,225 / €2,427 / €2,630 a month) come from a single secondary source`, `Special-payment tax bands (§ 67 EStG) were not re-checked for 2026`

## Check against

- **Start here:** https://onlinerechner.haude.at/BMF-Brutto-Netto-Rechner/
- BMF — Übersicht Steuerabsetzbeträge 2026: https://www.bmf.gv.at/themen/steuern/arbeitnehmerveranlagung/steuertarif-steuerabsetzbetraege/uebersicht-steuerabsetzbetraege.html
- WKO — Einkommensteuer 2026, aktuelle Werte: https://www.wko.at/steuern/einkommen-koerperschaftsteuer-2026
- USP — Höchstbeitragsgrundlage: https://www.usp.gv.at/services/suchen-und-finden/lexikon/hoechstbeitragsgrundlage.html
- § 67 EStG 1988 — sonstige Bezüge: https://www.ris.bka.gv.at/NormDokument.wxe?Abfrage=Bundesnormen&Gesetzesnummer=10004570&Paragraf=67

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in EUR, unless the line says otherwise.

### Social insurance on monthly pay (`at-social-regular`)

> 18.07% (health 3.87%, pension 10.25%, unemployment 2.95%, chamber 0.5%, housing 0.5%) of each of the 12 monthly payments up to €6,930. Unemployment insurance is lower on monthly pay up to €2,630.

- [ ] over 0: 15.12
- [ ] over 2,225: 16.12
- [ ] over 2,427: 17.12
- [ ] over 2,630: 18.07
- [ ] factor 14
- [ ] factor 100
- [ ] capped at 6,930
- [ ] factor 12

### Social insurance on the 13th and 14th salaries (`at-social-special`)

> The same rates less the chamber and housing contributions, on up to €13,860.

- [ ] over 0: 15.12
- [ ] over 2,225: 16.12
- [ ] over 2,427: 17.12
- [ ] over 2,630: 18.07
- [ ] factor 14
- [ ] less 1
- [ ] factor 100
- [ ] factor 2
- [ ] capped at 13,860

### Taxable regular pay (`at-taxable`)

> Twelve monthly payments less social insurance and the €132 allowance for work expenses.

- [ ] factor 14
- [ ] factor 12
- [ ] less 132

### Income tax on monthly pay (Lohnsteuer) (`at-income-tax`)

> 2026 tariff: nothing to €13,539, then 20%, 30%, 40%, 48% and 50%, and 55% above €1 million. Less the €496 commuter tax credit (Verkehrsabsetzbetrag) and its €804 supplement for lower incomes.

- [ ] from 0: 0%
- [ ] from 13,539: 20%
- [ ] from 21,992: 30%
- [ ] from 36,458: 40%
- [ ] from 70,365: 48%
- [ ] from 104,859: 50%
- [ ] from 1,000,000: 55%
- [ ] less 496
- [ ] applies when up to 19,761
- [ ] plus 804
- [ ] factor 804
- [ ] factor 30,259
- [ ] factor 10,498

### Income tax on the 13th and 14th salaries (`at-income-tax-special`)

> Taxed separately: the first €620 free, then 6% up to €25,000, 27% to €50,000, 35.75% to €83,333.

- [ ] from 0: 0%
- [ ] from 620: 6%
- [ ] from 25,000: 27%
- [ ] from 50,000: 35.75%
- [ ] from 83,333: 50%
- [ ] factor 14
- [ ] factor 2

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 50,000: at-social-regular 7,744.29; at-social-special 1,219.29; at-taxable 34,980.86; at-income-tax 5,091.26; at-income-tax-special 318.21; net 35,626.96 — Monthly 3,571.43. Social insurance 18.07% × 3,571.43 × 12 = 7,744.29; on the special payments 17.07% × 7,142.86 = 1,219.29. Taxable 42,857.14 − 7,744.29 − 132 = 34,980.86. Tariff 8,453 × 20% = 1,690.60 + 12,988.86 × 30% = 3,896.66 → 5,587.26, less the 496 credit (no supplement above €30,259) = 5,091.26. Special payments: 7,142.86 − 1,219.29 = 5,923.57; 6% × 5,303.57 = 318.21.
- [ ] 30,000: at-social-regular 3,888; at-income-tax 479.12; at-income-tax-special 183.63; net 24,844.10 — Monthly 2,142.86 is under €2,225, so no unemployment insurance: 15.12% × 12 months = 3,888; special 14.12% × 4,285.71 = 605.14. Taxable 21,694.29 → 20% × 8,155.29 = 1,631.06, less 496 and a supplement of 804 × 8,564.71/10,498 = 655.94 → 479.12. Special payments 6% × 3,060.57 = 183.63.

## Not modelled (confirm the page says so)

- Family bonus (Familienbonus Plus) and other credits for children or sole earners
- Commuter allowance and the higher commuter credit
- Refund of social insurance for very low incomes (negative tax)
- The €2,100 exemption limit for small special payments

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/at/at.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
