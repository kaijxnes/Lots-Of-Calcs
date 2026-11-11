# Norway — 2026 verification checklist

Generated from `data/tax/no/no.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: NOK
- Rates last checked: not yet
- Verified by a person: **not yet**
- Provisional items: `Union dues maximum NOK 8,700 is the government's 2026 proposal; the enacted figure was not confirmed separately`

## Check against

- **Start here:** https://www.skatteetaten.no/en/calculator/
- Regjeringen — Skattesatser 2026: https://www.regjeringen.no/no/tema/okonomi-og-budsjett/skatter-og-avgifter/skatte-og-avgiftssatser/skattesatser-2026/id3121978/
- Skatteetaten — Forskuddsutskrivingen 2026: https://www.skatteetaten.no/en/rettskilder/type/uttalelser/uttalelser/forskuddsutskrivingen-2026/
- Regjeringen — Endringer i lover og forskrifter fra 1. januar 2026: https://www.regjeringen.no/no/aktuelt/endringer-i-lover-og-forskrifter-fra-1.-januar-2026-fra-finansdepartementet/id3144251/
- Skatteetaten — Finnmarksfradraget 2026 (NOK 45,000): https://www.skatteetaten.no/satser/finnmarksfradraget/?year=2026
- Regjeringen — Skattesatser 2026: https://www.regjeringen.no/no/tema/okonomi-og-budsjett/skatter-og-avgifter/skattesatser-2026/id3121978/
- Regjeringen — Så mykje kan du spare ved å bu og arbeide i Finnmark og Nord-Troms i 2026: https://www.regjeringen.no/nn/tema/kommuner-og-regioner/regional--og-distriktspolitikk/nordomradepolitikk/sa-mykje-kan-du-spare-ved-a-bu-og-arbeide-i-finnmark-og-nord-troms-i-2026/id3084477/

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in NOK, unless the line says otherwise.

### National insurance (trygdeavgift) (`no-national-insurance`)

> 7.6% of pay.

- [ ] rate 7.6%

### Ordinary income (alminnelig inntekt) after allowances (`no-ordinary-income`)

> Pay less the minimum deduction (46%, at most NOK 95,700), the NOK 114,540 personal allowance, union dues up to NOK 8,700, and in Finnmark and Nord-Troms the NOK 45,000 special deduction.

- [ ] capped at 95,700
- [ ] rate 46%
- [ ] less 114,540
- [ ] Finnmark and Nord-Troms (innsatssonen) — less 45,000
- [ ] capped at 8,700

### Tax on ordinary income (`no-income-tax`)

> 22%, or 18.5% for residents of Finnmark and Nord-Troms.

- [ ] Rest of Norway — rate 22%
- [ ] Finnmark and Nord-Troms (innsatssonen) — rate 18.5%

### Bracket tax (trinnskatt) (`no-bracket-tax`)

> On gross pay: 1.7% from NOK 226,100, 4.0% from 318,300, 13.7% from 725,050, 16.8% from 980,100 and 17.8% from 1,467,200.

- [ ] from 0: 0%
- [ ] from 226,100: 1.7%
- [ ] from 318,300: 4%
- [ ] from 725,050: 13.7%
- [ ] from 980,100: 16.8%
- [ ] from 1,467,200: 17.8%

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 600,000: no-ordinary-income 389,760; no-income-tax 85,747.20; no-bracket-tax 12,835.40; net 455,817.40 — National insurance 45,600. Ordinary income 600,000 − 95,700 − 114,540 = 389,760 × 22% = 85,747.20. Bracket tax 92,200 × 1.7% = 1,567.40 + 281,700 × 4% = 11,268 → 12,835.40.
- [ ] 1,000,000: no-bracket-tax 56,122.45; net 694,130.35 — Bracket tax 1,567.40 + 406,750 × 4% = 16,270 + 255,050 × 13.7% = 34,941.85 + 19,900 × 16.8% = 3,343.20 → 56,122.45.
- [ ] 600,000 with zone = finnmark: no-ordinary-income 344,760; no-income-tax 63,780.60; net 477,784 — Separate implementation: zone rate and deduction, union dues capped at 8,700.
- [ ] 500,000 with unionDues = 6000: no-ordinary-income 283,760; no-income-tax 62,427.20; net 384,737.40 — Separate implementation: zone rate and deduction, union dues capped at 8,700.
- [ ] 800,000 with zone = finnmark, unionDues = 12000: no-ordinary-income 536,060; no-income-tax 99,171.10; net 599,923.35 — Separate implementation: zone rate and deduction, union dues capped at 8,700.

## Not modelled (confirm the page says so)

- The Finnmark and Nord-Troms reduction in employer's contribution and other zone benefits (the lower tax rate and special deduction are included)
- The low-income limit and phase-in for national insurance (only affects very small incomes)
- Interest deductions, union dues, pension savings and other deductions
- Wealth tax

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/no/no.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
