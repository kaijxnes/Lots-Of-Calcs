# Denmark — 2026 verification checklist

Generated from `data/tax/dk/dk.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: DKK
- Rates last checked: not yet
- Verified by a person: **not yet**
- Provisional items: `The national average municipal rate is given as 24.94%–25.43% by different sources; 25.05% is used`, `ATP amount is from a single secondary source`

## Check against

- **Start here:** https://skat.dk/borger/skatteberegning
- Skatteministeriet — satser og beløbsgrænser: https://skm.dk/tal-og-metode/satser/tidsserier/centrale-skattesatser-i-skattelovgivningen-2026
- Den juridiske vejledning C.A.4.3.7 — beskæftigelsesfradrag: https://tax.dk/jv/ca/C_A_4_3_7.htm
- skat.dk — AM-bidrag: https://skat.dk/borger/am-bidrag
- RSM — Satser og beløbsgrænser 2025/2026: https://www.rsm.global/denmark/sites/default/files/media/ePublikationer/Satser%20og%20bel%C3%B8bsgr%C3%A6nser%2020252026%20-%20RSM%20-%20NET_0.pdf
- Ligningsloven § 9 J (beskæftigelsesfradrag basis = AM-bidrag basis): https://danskelove.dk/ligningsloven/9j
- Arbejdsmarkedsbidragsloven § 2 (pension contributions in the AM-bidrag basis): https://danskelove.dk/arbejdsmarkedsbidragsloven/2
- Juridisk Vejledning C.A.10.2.1.3.1.1 (contribution deducted before A-skat): https://tax.dk/jv/ca/C_A_10_2_1_3_1_1.htm

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in DKK, unless the line says otherwise.

### ATP pension contribution (`dk-atp`)

> DKK 99.48 a month for full-time employees.

- [ ] capped at 1,193.76

### Labour market contribution (AM-bidrag) (`dk-am`)

> 8% of pay after ATP.

- [ ] rate 8%

### Pension contribution after AM-bidrag (`dk-pension-net`)

> AM-bidrag is still paid on the contribution (it stays in the AM-bidrag base, AMBL §2 stk. 1 nr. 4); the rest comes off personal income before tax.

- [ ] factor 0.92

### Employment deduction (beskæftigelsesfradrag) (`dk-employment-deduction`)

> 12.75% of pay, at most DKK 63,300. Pension contributions to employer schemes count towards it (LL §9 J refers to the AM-bidrag base).

- [ ] capped at 63,300
- [ ] rate 12.75%

### Job deduction (jobfradrag) (`dk-job-deduction`)

> 4.5% of income above DKK 235,200, at most DKK 3,100.

- [ ] capped at 3,100
- [ ] rate 4.5%
- [ ] less 235,200

### Municipal tax (kommuneskat) (`dk-municipal`)

> The national average rate, on taxable income above the DKK 54,100 personal allowance. Rates range from about 23.4% to 26.3%.

- [ ] National average — rate 25.05%
- [ ] less 54,100

### Church tax (kirkeskat) (`dk-church`)

> Members of the Church of Denmark only; about 0.87% on average.

- [ ] Yes — rate 0.87%
- [ ] less 54,100

### State tax (bundskat, mellemskat, topskat) (`dk-state`)

> Bottom tax 12.01% above the allowance; middle tax 7.5% above DKK 641,200; top tax 7.5% above DKK 777,900; top-top tax 5% above DKK 2,592,700 (the new 2026 structure).

- [ ] rate 12.01%
- [ ] less 54,100
- [ ] rate 7.5%
- [ ] less 641,200
- [ ] less 777,900
- [ ] rate 5%
- [ ] less 2,592,700

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 600,000: dk-am 47,904.50; dk-taxable 484,501.74; dk-municipal 107,815.64; dk-state 59,665.89; net 383,420.22 — AM 8% × 598,806.24 = 47,904.50; personal income 550,901.74. Employment deduction capped at 63,300; job deduction capped at 3,100; taxable 484,501.74. Municipal 25.05% × 430,401.74 = 107,815.64. Bottom tax 12.01% × 496,801.74 = 59,665.89.
- [ ] 900,000: dk-state 110,416.25; net 539,531.85 — Personal income 826,901.74: middle tax 7.5% × 185,701.74 = 13,927.63 and top tax 7.5% × 49,001.74 = 3,675.13, on top of bottom tax 92,813.49.
- [ ] 600,000 with church = yes: dk-church 3,744.50 — Church tax 0.87% × 430,401.74 = 3,744.50.
- [ ] 600,000 with pensionPct = 5: dk-am 47,904.50; dk-taxable 456,901.74; dk-municipal 100,901.84; dk-state 56,351.13; net 366,048.78 — Contribution 30,000; 92% of it comes off personal income; AM-bidrag and the deductions are unchanged.
- [ ] 400,000 with pensionPct = 8: dk-am 31,904.50; dk-taxable 283,513.95; dk-municipal 57,468.19; dk-state 34,031.75; net 245,961.80 — Contribution 32,000; 92% of it comes off personal income; AM-bidrag and the deductions are unchanged.
- [ ] 900,000 with pensionPct = 10: dk-am 71,904.50; dk-taxable 677,701.74; dk-municipal 156,212.24; dk-state 90,586.84; net 497,302.67 — Contribution 90,000; 92% of it comes off personal income; AM-bidrag and the deductions are unchanged.

## Not modelled (confirm the page says so)

- Individual municipal tax rates
- Senior and single-parent employment deductions
- Interest, union dues, commuting and other deductions
- Private (non-employer) pension savings and the employer's share of contributions

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/dk/dk.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
