# France — 2026 verification checklist

Generated from `data/tax/fr/fr.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: EUR
- Rates last checked: not yet
- Verified by a person: **not yet**
- Provisional items: `France taxes each year's income the following spring with that year's finance law. This uses the latest scale (indexed 0.9% by the 2026 finance law, applied to 2025 income), which is also the basis for withholding through 2026; the scale for 2026 income will be set by the 2027 finance law.`

## Check against

- **Start here:** https://simulateur-ir-ifi.impots.gouv.fr/calcul_impot/2026/
- Article 197 CGI — barème de l'impôt sur le revenu: https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000048862617
- Impots.gouv — barème et décote: https://www.impots.gouv.fr/particulier/questions/comment-calculer-mon-taux-dimposition-dapres-le-bareme-progressif
- URSSAF — taux de cotisations salariales: https://www.urssaf.fr/accueil/outils-documentation/taux-baremes/taux-cotisations-secteur-prive.html
- Agirc-Arrco — taux de cotisation: https://www.agirc-arrco.fr/entreprises/gerer-les-salaries/calcul-des-cotisations/
- Article 223 sexies CGI — contribution exceptionnelle sur les hauts revenus: https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000025049019

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in EUR, unless the line says otherwise.

### Basic state pension (assurance vieillesse) (`fr-pension-basic`)

> 6.9% of pay up to the social security ceiling (PASS, €48,060 in 2026) plus 0.4% of all pay.

- [ ] rate 6.9%
- [ ] capped at 48,060
- [ ] rate 0.4%

### Complementary pension (Agirc-Arrco) (`fr-pension-complementary`)

> Agirc-Arrco 3.15% plus the 0.86% general balancing contribution up to the PASS, then 8.64% plus 1.08% up to 8 × PASS; and 0.14% (CET) on all pay up to 8 × PASS once pay exceeds the PASS.

- [ ] from 0: 4.01%
- [ ] from 48,060: 9.72%
- [ ] capped at 384,480
- [ ] applies when over 48,060
- [ ] rate 0.14%

### CSG base (`fr-csg-base`)

> 98.25% of pay up to 4 × PASS (a 1.75% allowance for work expenses), and all pay above.

- [ ] rate 98.25%
- [ ] capped at 192,240
- [ ] less 192,240

### CSG and CRDS (`fr-csg-crds`)

> CSG 9.2% (6.8% of it deductible from taxable income) and CRDS 0.5%.

- [ ] rate 9.7%

### Net taxable pay (net imposable) (`fr-net-taxable-pay`)

- [ ] rate 6.8%

### Taxable income (`fr-taxable`)

> After the automatic 10% deduction for work expenses (at least €509, at most €14,555).

- [ ] rate 10%
- [ ] at least 509
- [ ] at most 14,555

### Income tax before the décote (`fr-tax-before-decote`)

> The scale is applied to income per household share (quotient familial): one share for a single person, two for a married couple.

- [ ] Single — factor 1
- [ ] Married filing jointly — factor 2
- [ ] from 0: 0% (Up to €11,600)
- [ ] from 11,600: 11%
- [ ] from 29,579: 30%
- [ ] from 84,577: 41%
- [ ] from 181,917: 45%

### Income tax (impôt sur le revenu) (`fr-income-tax`)

> Less the décote, which reduces small tax bills: €897 (€1,483 for a couple) minus 45.25% of the tax.

- [ ] Single — less 897
- [ ] Married filing jointly — less 1,483
- [ ] rate 45.25%

### High income contribution (CEHR) (`fr-high-income`)

> 3% of income between €250,000 and €500,000 and 4% above (thresholds doubled for couples).

- [ ] rate 3%
- [ ] Single — amount 500,000
- [ ] Married filing jointly — amount 1,000,000
- [ ] Single — less 250,000
- [ ] Married filing jointly — less 500,000
- [ ] rate 4%
- [ ] Single — less 500,000
- [ ] Married filing jointly — less 1,000,000

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 25,000: fr-net-taxable-pay 20,502.25; fr-taxable 18,452.03; fr-income-tax 198; net 19,591.94 — Pension 1,725 + 100 = 1,825; Agirc-Arrco + CEG 4.01% = 1,002.50; CSG base 24,562.50; CSG deductible 1,670.25. Net taxable 20,502.25, less 10% → 18,452.03. Tax 11% × 6,852.03 = 753.72; décote 897 − 341.06 = 555.94 → 198.
- [ ] 70,000: fr-pension-complementary 4,157.77; fr-taxable 51,812.45; fr-income-tax 8,648 — Above the PASS: complementary 4.01% × 48,060 + 9.72% × 21,940 + 0.14% × 70,000 = 4,157.77. Taxable 51,812.45 → 1,977.69 + 6,670.04 = 8,647.73 → 8,648.
- [ ] 60,000 with status = married: fr-income-tax 1,894; net 45,659.94 — Two shares: taxable 44,337.14 → 22,168.57 per share, tax per share 1,384.81 + ... = 947.13 → × 2 = 1,894 after rounding; no décote.
- [ ] 400,000: fr-income-tax 119,800; fr-high-income 2,051.76 — Taxable 318,392.12; high income contribution 3% × 68,392.12 = 2,051.76.

## Not modelled (confirm the page says so)

- Employer-arranged health (mutuelle) and provident contributions, which typically add 1–2% to employee deductions
- Children and additional household shares
- The 2025–2026 minimum 20% tax on incomes over €250,000 (contribution différentielle)
- Tax credits and reductions (home help, donations) and actual work expenses instead of the 10% deduction
- Overtime exemptions and the Alsace-Moselle health contribution

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/fr/fr.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
