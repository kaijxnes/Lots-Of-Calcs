# Portugal — 2026 verification checklist

Generated from `data/tax/pt/pt.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: EUR
- Rates last checked: not yet
- Verified by a person: **not yet**
- Provisional items: `Monthly withholding in 2026 used the earlier rates; the annual return settles the difference`

## Check against

- **Start here:** https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/codigos_tributarios/cirs_rep/Pages/irs68.aspx
- Código do IRS, art. 68.º (taxas) and art. 25.º (dedução específica): https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/codigos_tributarios/cirs_rep/Pages/irs68.aspx
- Lei 73-A/2025 — Orçamento do Estado para 2026: https://diariodarepublica.pt/
- Jornal de Negócios — Redução intercalar das taxas do IRS em 2026 aprovada no Parlamento (9 Oct 2026): https://www.jornaldenegocios.pt/economia/detalhe/reducao-intercalar-das-taxas-do-irs-em-2026-aprovada-no-parlamento
- Código do IRS, art. 12.º-B (IRS Jovem): https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/codigos_tributarios/cirs_rep/Pages/irs12b.aspx
- Código do IRS, art. 78.º-A (dedução relativa aos dependentes): https://info.portaldasfinancas.gov.pt/pt/informacao_fiscal/codigos_tributarios/cirs_rep/Pages/irs78a.aspx
- AT — Folheto IRS Jovem 2025 (rate on all income, applied to the non-exempt part): https://info.portaldasfinancas.gov.pt/pt/apoio_contribuinte/Folhetos_informativos/Documents/Folheto_IRS_jovem_2025.pdf
- Portaria n.º 480-A/2025/1 — IAS 2026 €537.13: https://at.madeira.gov.pt/ficheiros/Portaria_480_A_2025_1%5B1%5D.pdf

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in EUR, unless the line says otherwise.

### Social security (Segurança Social) (`pt-social-security`)

> 11% of pay, with no ceiling.

- [ ] rate 11%

### Taxable income (rendimento coletável) (`pt-taxable`)

> Pay less the specific deduction: €4,587.09 (8.54 × the 2026 social support index), or social security paid if more.

- [ ] at least 4,587.09

### Tax at IRS rates (`pt-tax-before-minimum`)

> Married couples filing jointly apply the rates to half their joint income and double the result.

- [ ] Single — factor 1
- [ ] Married filing jointly — factor 2
- [ ] from 0: 12.2%
- [ ] from 8,342: 15.2%
- [ ] from 12,587: 20.7%
- [ ] from 17,838: 23.6%
- [ ] from 23,089: 30.6%
- [ ] from 29,397: 34.6%
- [ ] from 43,090: 43.1%
- [ ] from 46,566: 44.6%
- [ ] from 86,634: 48%

### IRS Jovem exempt pay (`pt-jovem-exempt`)

> 100% of work income in the first year, 75% in years 2–4, 50% in years 5–7 and 25% in years 8–10, up to 55 × IAS (€29,542.15 in 2026) (CIRS art. 12.º-B).

- [ ] capped at 29,542.15
- [ ] 1st year of work income (100% exempt) — rate 100%
- [ ] 2nd–4th year (75%) — rate 75%
- [ ] 5th–7th year (50%) — rate 50%
- [ ] 8th–10th year (25%) — rate 25%

### Deduction for dependants (`pt-dependants`)

> €600 per dependant, plus €300 for each dependant from the second onward who is 6 or under (CIRS art. 78.º-A).

- [ ] factor 600
- [ ] factor 300
- [ ] less 1

### Income tax (IRS) (`pt-irs`)

> 2026 rates after the October 2026 cut (backdated to January). With IRS Jovem, the rate on all pay applies only to the part that is not exempt. Less the deduction for dependants. Tax may not leave less than the €12,880 subsistence minimum.

- [ ] factor 1
- [ ] less 12,880

### Additional solidarity rate (`pt-solidarity`)

> 2.5% of taxable income between €80,000 and €250,000, 5% above.

- [ ] rate 2.5%
- [ ] capped at 250,000
- [ ] less 80,000
- [ ] rate 5%
- [ ] less 250,000

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 40,000: pt-taxable 35,412.91; pt-irs 8,000.91; net 27,599.09 — Social security 4,400; taxable 35,412.91. Tax: 1,017.72 + 645.24 + 1,086.96 + 1,239.24 + 1,930.25 + 2,081.50 = 8,000.91.
- [ ] 15,000: pt-taxable 10,412.91; pt-irs 1,332.50 — Social security 1,650 is less than €4,587.09, so the fixed deduction applies: taxable 10,412.91. Tax 1,017.72 + 2,070.91 × 15.2% = 314.78 → 1,332.50.
- [ ] 100,000: pt-irs 31,161.35; pt-solidarity 225 — Taxable 89,000 → 31,161.35; solidarity 2.5% × 9,000 = 225.
- [ ] 40,000 with status = married: pt-irs 5,445.38 — Joint: tax on 17,706.46, doubled = 5,445.38.
- [ ] 30,000 with irsJovem = y2to4: pt-jovem-exempt 22,500; pt-irs 1,175.07; net 25,524.93 — Tax on all pay 4,700.27 × non-exempt share 0.2500 less dependants 0; separate implementation.
- [ ] 60,000 with irsJovem = y1: pt-jovem-exempt 29,542.15; pt-irs 7,717.67; net 45,682.33 — Tax on all pay 15,203.30 × non-exempt share 0.5076 less dependants 0; separate implementation.
- [ ] 40,000 with children = 2, childrenUnder7 = 2: pt-jovem-exempt 0; pt-irs 6,500.91; net 29,099.09 — Tax on all pay 8,000.91 × non-exempt share 1.0000 less dependants 1500; separate implementation.
- [ ] 25,000 with irsJovem = y5to7, children = 1: pt-jovem-exempt 12,500; pt-irs 1,078.80; net 21,171.20 — Tax on all pay 3,357.60 × non-exempt share 0.5000 less dependants 600; separate implementation.
- [ ] 50,000 with status = married, children = 3, childrenUnder7 = 1: pt-jovem-exempt 0; pt-irs 5,482.31; net 39,017.69 — Tax on all pay 7,582.31 × non-exempt share 1.0000 less dependants 2100; separate implementation.

## Not modelled (confirm the page says so)

- Non-habitual resident and IFICI regimes
- Personal deductions (general family expenses, health, education, housing)
- The Azores and Madeira regional rates
- The €126 extra for an only child under 3, and shared-custody halves of the dependant deduction
- Other deductions from tax (general family expenses, health, education, housing) still apply to IRS Jovem claimants as usual

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/pt/pt.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
