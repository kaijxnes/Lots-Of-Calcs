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

### Income tax (IRS) (`pt-irs`)

> 2026 rates after the October 2026 cut (backdated to January) to the first six bands. Tax may not leave less than the €12,880 subsistence minimum.

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

## Not modelled (confirm the page says so)

- IRS Jovem (partial exemption for workers under 35)
- Non-habitual resident and IFICI regimes
- Personal deductions (general family expenses, health, education, housing)
- The Azores and Madeira regional rates

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/pt/pt.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
