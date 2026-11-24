# Luxembourg — 2026 verification checklist

Generated from `data/tax/lu/lu.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: EUR
- Rates last checked: not yet
- Verified by a person: **not yet**
- Provisional items: `The dependency contribution is treated as deductible like the other social contributions`, `The ceiling and allowance from June are worked out from the €2,771.33 minimum wage`

## Check against

- **Start here:** https://impotsdirects.public.lu/fr/baremes.html
- CCSS — taux de cotisation au 01.01.2026 pour salariés: https://ccss.public.lu/dam-assets/publications/2026/ccss-20260116-avis-80-99-fr-de.pdf
- CCSS — paramètres sociaux: https://ccss.public.lu/fr/parametres-sociaux.html
- ACD — Loi concernant l'impôt sur le revenu, texte coordonné en vigueur au 1er janvier 2026 (art. 118–121, 154ter): https://impotsdirects.public.lu/dam-assets/fr/legislation/LIR/texte-coordonn-en-vigueur-au-1er-janvier-2026-ver-08052026.pdf
- ACD — tarif de l'impôt sur le revenu des personnes physiques: https://impotsdirects.public.lu/fr/az/t/tarif_pers.html
- ACD — crédit d'impôt pour salariés 2026: https://impotsdirects.public.lu/fr/az/c/credit-impot-salaries/cis2026.html
- ACD — contribution au fonds pour l'emploi: https://impotsdirects.public.lu/fr/az/f/fond_empl.html
- ACD — minimum forfaitaire pour frais d'obtention et dépenses spéciales: https://impotsdirects.public.lu/fr/az/f/ffo-fds.html

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in EUR, unless the line says otherwise.

### Health and pension insurance (`lu-social`)

> 11.55% (pension 8.50%, health 2.80%, cash sickness benefits 0.25%) of pay up to five times the minimum wage: €13,518.68 a month to May and €13,856.63 from June 2026 (€164,589.81 for the year).

- [ ] rate 11.55%
- [ ] capped at 164,589.81

### Dependency insurance (`lu-dependency`)

> 1.4% of all pay, with no ceiling, after an allowance of a quarter of the minimum wage each month (€675.93 to May, €692.83 from June: €8,229.46 for the year).

- [ ] rate 1.4%
- [ ] less 8,229.46

### Taxable income (`lu-taxable`)

> Pay less social contributions, the €540 minimum allowance for work expenses and the €480 minimum allowance for special expenses.

- [ ] less 540
- [ ] less 480

### Income tax (`lu-income-tax`)

> The tariff: nothing to €13,230, then 8% rising in steps to 39% from €54,090, 40% from €117,450, 41% from €176,160 and 42% above €234,870. Class 2 pays twice the tax on half the income; class 1a applies the tariff to income less a quarter of its shortfall from €79,380, with the rise above €51,804 capped at 39–42%.

- [ ] Class 1 — single — from 0: 0%
- [ ] Class 1 — single — from 13,230: 8%
- [ ] Class 1 — single — from 15,435: 9%
- [ ] Class 1 — single — from 17,640: 10%
- [ ] Class 1 — single — from 19,845: 11%
- [ ] Class 1 — single — from 22,050: 12%
- [ ] Class 1 — single — from 24,255: 14%
- [ ] Class 1 — single — from 26,550: 16%
- [ ] Class 1 — single — from 28,845: 18%
- [ ] Class 1 — single — from 31,140: 20%
- [ ] Class 1 — single — from 33,435: 22%
- [ ] Class 1 — single — from 35,730: 24%
- [ ] Class 1 — single — from 38,025: 26%
- [ ] Class 1 — single — from 40,320: 28%
- [ ] Class 1 — single — from 42,615: 30%
- [ ] Class 1 — single — from 44,910: 32%
- [ ] Class 1 — single — from 47,205: 34%
- [ ] Class 1 — single — from 49,500: 36%
- [ ] Class 1 — single — from 51,795: 38%
- [ ] Class 1 — single — from 54,090: 39%
- [ ] Class 1 — single — from 117,450: 40%
- [ ] Class 1 — single — from 176,160: 41%
- [ ] Class 1 — single — from 234,870: 42%
- [ ] Class 2 — married or civil partners, one income — factor 2
- [ ] Class 2 — married or civil partners, one income — from 0: 0%
- [ ] Class 2 — married or civil partners, one income — from 13,230: 8%
- [ ] Class 2 — married or civil partners, one income — from 15,435: 9%
- [ ] Class 2 — married or civil partners, one income — from 17,640: 10%
- [ ] Class 2 — married or civil partners, one income — from 19,845: 11%
- [ ] Class 2 — married or civil partners, one income — from 22,050: 12%
- [ ] Class 2 — married or civil partners, one income — from 24,255: 14%
- [ ] Class 2 — married or civil partners, one income — from 26,550: 16%
- [ ] Class 2 — married or civil partners, one income — from 28,845: 18%
- [ ] Class 2 — married or civil partners, one income — from 31,140: 20%
- [ ] Class 2 — married or civil partners, one income — from 33,435: 22%
- [ ] Class 2 — married or civil partners, one income — from 35,730: 24%
- [ ] Class 2 — married or civil partners, one income — from 38,025: 26%
- [ ] Class 2 — married or civil partners, one income — from 40,320: 28%
- [ ] Class 2 — married or civil partners, one income — from 42,615: 30%
- [ ] Class 2 — married or civil partners, one income — from 44,910: 32%
- [ ] Class 2 — married or civil partners, one income — from 47,205: 34%
- [ ] Class 2 — married or civil partners, one income — from 49,500: 36%
- [ ] Class 2 — married or civil partners, one income — from 51,795: 38%
- [ ] Class 2 — married or civil partners, one income — from 54,090: 39%
- [ ] Class 2 — married or civil partners, one income — from 117,450: 40%
- [ ] Class 2 — married or civil partners, one income — from 176,160: 41%
- [ ] Class 2 — married or civil partners, one income — from 234,870: 42%
- [ ] Class 1a — widowed, or 64 or over — applies when up to 51,804
- [ ] Class 1a — widowed, or 64 or over — from 0: 0%
- [ ] Class 1a — widowed, or 64 or over — from 13,230: 8%
- [ ] Class 1a — widowed, or 64 or over — from 15,435: 9%
- [ ] Class 1a — widowed, or 64 or over — from 17,640: 10%
- [ ] Class 1a — widowed, or 64 or over — from 19,845: 11%
- [ ] Class 1a — widowed, or 64 or over — from 22,050: 12%
- [ ] Class 1a — widowed, or 64 or over — from 24,255: 14%
- [ ] Class 1a — widowed, or 64 or over — from 26,550: 16%
- [ ] Class 1a — widowed, or 64 or over — from 28,845: 18%
- [ ] Class 1a — widowed, or 64 or over — from 31,140: 20%
- [ ] Class 1a — widowed, or 64 or over — from 33,435: 22%
- [ ] Class 1a — widowed, or 64 or over — from 35,730: 24%
- [ ] Class 1a — widowed, or 64 or over — from 38,025: 26%
- [ ] Class 1a — widowed, or 64 or over — from 40,320: 28%
- [ ] Class 1a — widowed, or 64 or over — from 42,615: 30%
- [ ] Class 1a — widowed, or 64 or over — from 44,910: 32%
- [ ] Class 1a — widowed, or 64 or over — from 47,205: 34%
- [ ] Class 1a — widowed, or 64 or over — from 49,500: 36%
- [ ] Class 1a — widowed, or 64 or over — from 51,795: 38%
- [ ] Class 1a — widowed, or 64 or over — from 54,090: 39%
- [ ] Class 1a — widowed, or 64 or over — from 117,450: 40%
- [ ] Class 1a — widowed, or 64 or over — from 176,160: 41%
- [ ] Class 1a — widowed, or 64 or over — from 234,870: 42%
- [ ] Class 1a — widowed, or 64 or over — factor 1.25
- [ ] Class 1a — widowed, or 64 or over — less 19,845
- [ ] Class 1a — widowed, or 64 or over — amount 5,646.60
- [ ] Class 1a — widowed, or 64 or over — from 51,804: 39%
- [ ] Class 1a — single parent (with the single-parent credit) — applies when up to 51,804
- [ ] Class 1a — single parent (with the single-parent credit) — from 0: 0%
- [ ] Class 1a — single parent (with the single-parent credit) — from 13,230: 8%
- [ ] Class 1a — single parent (with the single-parent credit) — from 15,435: 9%
- [ ] Class 1a — single parent (with the single-parent credit) — from 17,640: 10%
- [ ] Class 1a — single parent (with the single-parent credit) — from 19,845: 11%
- [ ] Class 1a — single parent (with the single-parent credit) — from 22,050: 12%
- [ ] Class 1a — single parent (with the single-parent credit) — from 24,255: 14%
- [ ] Class 1a — single parent (with the single-parent credit) — from 26,550: 16%
- [ ] Class 1a — single parent (with the single-parent credit) — from 28,845: 18%
- [ ] Class 1a — single parent (with the single-parent credit) — from 31,140: 20%
- [ ] Class 1a — single parent (with the single-parent credit) — from 33,435: 22%
- [ ] Class 1a — single parent (with the single-parent credit) — from 35,730: 24%
- [ ] Class 1a — single parent (with the single-parent credit) — from 38,025: 26%
- [ ] Class 1a — single parent (with the single-parent credit) — from 40,320: 28%
- [ ] Class 1a — single parent (with the single-parent credit) — from 42,615: 30%
- [ ] Class 1a — single parent (with the single-parent credit) — from 44,910: 32%
- [ ] Class 1a — single parent (with the single-parent credit) — from 47,205: 34%
- [ ] Class 1a — single parent (with the single-parent credit) — from 49,500: 36%
- [ ] Class 1a — single parent (with the single-parent credit) — from 51,795: 38%
- [ ] Class 1a — single parent (with the single-parent credit) — from 54,090: 39%
- [ ] Class 1a — single parent (with the single-parent credit) — from 117,450: 40%
- [ ] Class 1a — single parent (with the single-parent credit) — from 176,160: 41%
- [ ] Class 1a — single parent (with the single-parent credit) — from 234,870: 42%
- [ ] Class 1a — single parent (with the single-parent credit) — factor 1.25
- [ ] Class 1a — single parent (with the single-parent credit) — less 19,845
- [ ] Class 1a — single parent (with the single-parent credit) — amount 5,646.60
- [ ] Class 1a — single parent (with the single-parent credit) — from 51,804: 39%

### Solidarity surcharge (employment fund) (`lu-solidarity`)

> 7% of the income tax, or 9% when taxable income is over €150,000 (€300,000 in class 2).

- [ ] Class 2 — married or civil partners, one income — applies when over 300,000
- [ ] default — applies when over 150,000
- [ ] factor 0.09
- [ ] factor 0.07

### Employee tax credit (CIS) (`lu-cis`)

> €300 plus 2.9% of pay over €936 up to €600 at €11,266; €600 to €40,000, then down 1.5 cents per euro to nothing at €80,000. Paid even when there is no tax to set it against.

- [ ] applies when under 936
- [ ] applies when up to 11,265
- [ ] less 300
- [ ] less 936
- [ ] factor 0.029
- [ ] applies when up to 40,000
- [ ] less 600
- [ ] less 40,000
- [ ] factor 0.015

### CO2 tax credit (CI-CO2) (`lu-co2`)

> €216 up to €40,000 of pay, then down 0.54 cents per euro to nothing at €80,000.

- [ ] applies when under 936
- [ ] applies when up to 40,000
- [ ] less 216
- [ ] less 40,000
- [ ] factor 0.0054

### Single-parent tax credit (CIM) (`lu-cim`)

> €3,504 for taxable income under €60,000, falling by 6.12 cents per euro to €750 at €105,000 and above. Paid even when there is no tax to set it against; reduced if the child receives maintenance or other allowances above €2,712 a year.

- [ ] Class 1a — single parent (with the single-parent credit) — applies when under 60,000
- [ ] Class 1a — single parent (with the single-parent credit) — less 3,504
- [ ] Class 1a — single parent (with the single-parent credit) — applies when up to 105,000
- [ ] Class 1a — single parent (with the single-parent credit) — less 60,000
- [ ] Class 1a — single parent (with the single-parent credit) — factor 0.0612
- [ ] Class 1a — single parent (with the single-parent credit) — less 750

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 60,000: lu-social 6,930; lu-dependency 724.79; lu-taxable 51,325.21; lu-income-tax 7,818.38; lu-solidarity 547.29; lu-cis -300; lu-co2 -108; net 44,387.55 — Social 11.55% = 6,930; dependency 1.4% × 51,770.54 = 724.79. Taxable 60,000 − 6,930 − 724.79 − 1,020 = 51,325.21. Tax: 7,161.30 to €49,500 + 1,825.21 × 36% (657.08) = 7,818.38; surcharge 7% = 547.29. CIS 600 − 20,000 × 1.5% = 300; CI-CO2 216 − 108 = 108.
- [ ] 35,000: lu-income-tax 1,920.19; lu-solidarity 134.41; lu-cis -600; lu-co2 -216; net 29,344.11 — Social 4,042.50; dependency 374.79; taxable 29,562.71. Tax 1,791 to €28,845 + 717.71 × 18% (129.19) = 1,920.19; surcharge 134.41. Full credits: CIS 600, CI-CO2 216.
- [ ] 120,000: lu-income-tax 28,151.03; lu-solidarity 1,970.57; lu-cis 0; lu-co2 0; net 74,453.61 — Social 13,860; dependency 1,564.79; taxable 103,555.21. Tax 8,623.55 to €54,090 + 49,465.21 × 39% (19,291.43) = 28,151.03 (rounded); surcharge 7% = 1,970.57. No credits above €80,000.
- [ ] 60,000 with taxClass = 2: lu-income-tax 2,599.13; lu-solidarity 181.94; net 49,972.14 — Taxable 51,325.21 as in class 1. Half is 25,662.61: tax 1,102.50 to €24,255 + 1,407.61 × 14% (197.06) = 1,299.56; doubled 2,599.13. Surcharge 7% = 181.94.
- [ ] 60,000 with taxClass = 1a: lu-income-tax 5,467.05; lu-solidarity 382.69; net 46,903.46 — Taxable 51,325.21 ≤ €51,804, so the tariff applies to 1.25 × 51,325.21 − 19,845 = 44,311.51: 4,958.10 to €42,615 + 1,696.51 × 30% (508.95) = 5,467.05. Surcharge 382.69.
- [ ] 60,000 with taxClass = 1a-parent: lu-cim -3,504; net 50,407.46 — As class 1a, plus the €3,504 single-parent credit (taxable income under €60,000).
- [ ] 120,000 with taxClass = 1a: lu-income-tax 25,829.57; net 76,937.57 — Taxable 103,555.21 > €51,804: tax at €51,804 is the tariff on €44,910 (5,646.60), then 39% × 51,751.21 (20,182.97) = 25,829.57. Surcharge 7% = 1,808.07.
- [ ] 120,000 with taxClass = 1a-parent: lu-cim -838.42; net 77,775.99 — Single-parent credit 3,504 − (103,555.21 − 60,000) × 0.0612 = 838.42.

## Not modelled (confirm the page says so)

- Child tax reductions (modération d'impôt pour enfants), given through family allowances
- Reduction of the single-parent credit for maintenance or allowances the child receives above €2,712 a year
- Couples where both partners earn (class 2 with two salaries)
- The temporary tax credit paid from June to December 2026 (crédit d'impôt conjoncture)
- Cross-border workers and non-resident tax
- Travel expense allowance (frais de déplacement) and actual expenses
- Rounding in the official tax tables and any smoothing at the solidarity surcharge threshold
- Benefits in kind and bonuses taxed at special rates

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/lu/lu.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
