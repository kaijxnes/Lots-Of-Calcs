# Germany — 2026 verification checklist

Generated from `data/tax/de/de.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: EUR
- Rates last checked: not yet
- Verified by a person: **not yet**

## Check against

- **Start here:** https://www.bmf-steuerrechner.de/
- § 32a EStG — Einkommensteuertarif: https://www.gesetze-im-internet.de/estg/__32a.html
- § 9a EStG — Pauschbeträge für Werbungskosten: https://www.gesetze-im-internet.de/estg/__9a.html
- Solidaritätszuschlaggesetz 1995 § 3, § 4: https://www.gesetze-im-internet.de/solzg_1995/
- Deutsche Rentenversicherung — Sozialversicherungs-Rechengrößen 2026: https://www.deutsche-rentenversicherung.de/DRV/DE/Ueber-uns-und-Presse/Presse/Meldungen/2025/250910-sv-rechengroessen-vo-2026.html
- vdek — Neuerungen im Gesundheitswesen 2026 (contribution rates): https://www.vdek.com/politik/was-aendert-sich/gesundheitswesen-2026.html
- Beitragszuschlag für Kinderlose (Techniker Krankenkasse): https://www.tk.de/tk/pflege/ueber-die-tk-pflegeversicherung/beitragszuschlag-kinderlose/346234

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in EUR, unless the line says otherwise.

### Pension insurance (Rentenversicherung) (`de-pension`)

> Half of 18.6%, on earnings up to €101,400.

- [ ] rate 9.3%
- [ ] capped at 101,400

### Unemployment insurance (Arbeitslosenversicherung) (`de-unemployment`)

> Half of 2.6%, on earnings up to €101,400.

- [ ] rate 1.3%
- [ ] capped at 101,400

### Health insurance (Krankenversicherung) (`de-health`)

> Half of the 14.6% general rate plus half of the 2.9% average additional contribution, on earnings up to €69,750. Each fund sets its own additional contribution.

- [ ] rate 8.75%
- [ ] capped at 69,750

### Long-term care insurance (Pflegeversicherung) (`de-care`)

> Employee share of long-term care insurance: 1.8%, plus 0.6% for employees aged 23 or over with no children, less 0.25% for each child under 25 from the second to the fifth. Saxony splits the contribution differently and isn't modelled.

- [ ] rate 1.8%
- [ ] applies when under 1
- [ ] plus 0.6
- [ ] factor 0.25
- [ ] less 1
- [ ] at most 4
- [ ] capped at 69,750

### Deductible insurance contributions (`de-insurance-deduction`)

> Pension contributions in full, plus basic health (96%, excluding the share for sick pay) and care contributions — or up to €1,900 of all three if that is more.

- [ ] rate 96%
- [ ] capped at 1,900

### Taxable income (zu versteuerndes Einkommen) (`de-taxable`)

> After the €1,230 employee allowance for work expenses, the €36 (€72 married) special expenses allowance, and insurance contributions.

- [ ] less 1,230
- [ ] Single — less 36
- [ ] Married filing jointly — less 72

### Income for the tariff (`de-taxable-split`)

> Married couples are taxed under income splitting: the tariff is applied to half the joint income and the result doubled.

- [ ] Married filing jointly — factor 2

### Income tax (Einkommensteuer) (`de-income-tax`)

> § 32a EStG 2026: nothing up to €12,348, rising through two progressive zones to 42% from €69,879 and 45% from €277,826.

- [ ] Single — factor 1
- [ ] Married filing jointly — factor 2
- [ ] applies when up to 12,348
- [ ] applies when up to 17,799
- [ ] formula (a·y + b)·y + c, y = (x − 12,348) / 10,000: a = 914.51, b = 1,400, c = 0
- [ ] applies when up to 69,878
- [ ] formula (a·y + b)·y + c, y = (x − 17,799) / 10,000: a = 173.10, b = 2,397, c = 1,034.87
- [ ] applies when up to 277,825
- [ ] rate 42%
- [ ] less 11,135.63
- [ ] rate 45%
- [ ] less 19,470.38

### Solidarity surcharge (`de-solidarity`)

> 5.5% of income tax, but only once the tax exceeds €20,350 (€40,700 married), phased in at 11.9% of the excess.

- [ ] Single — applies when up to 20,350
- [ ] Married filing jointly — applies when up to 40,700
- [ ] rate 5.5%
- [ ] rate 11.9%
- [ ] Single — less 20,350
- [ ] Married filing jointly — less 40,700

### Church tax (Kirchensteuer) (`de-church`)

> Only for members of a church that levies it: 8% of income tax in Bavaria and Baden-Württemberg, 9% elsewhere.

- [ ] 8% (Bavaria, Baden-Württemberg) — rate 8%
- [ ] 9% (other states) — rate 9%

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 30,000: de-taxable 22,704; de-income-tax 2,252; de-solidarity 0; net 21,223 — Contributions: pension 2,790, unemployment 390, health 2,625, care 720. Deductible: 2,790 + 0.96 × 2,625 + 720 = 6,030. Taxable 30,000 − 1,230 − 36 − 6,030 = 22,704; z = 0.4905 → (173.10z + 2,397)z + 1,034.87 = 2,252 (rounded down).
- [ ] 100,000: de-taxable 81,901; de-income-tax 23,262; de-solidarity 346.52 — Pension 9,300, unemployment 1,300, health 8.75% of 69,750 = 6,103.13, care 1,674. Taxable 81,901 → 0.42 × 81,901 − 11,135.63 = 23,262. Soli: min(5.5% = 1,279.41, 11.9% × 2,912 = 346.53) → 346.52 after rounding down.
- [ ] 100,000 with status = married: de-income-tax 15,012; de-solidarity 0; net 66,610.88 — Taxable 81,865 (the special expenses allowance doubles). Split: tariff on 40,932 = 7,506, doubled = 15,012. Below the €40,700 surcharge limit.
- [ ] 60,000 with church = 9: de-income-tax 9,399; de-church 845.91; net 36,705.09 — Taxable 46,674, income tax 9,399; church tax 9% = 845.91.
- [ ] 50,000 with children = 1: de-care 900 — One child: no childless surcharge, care 1.8% x 50,000 = 900.
- [ ] 50,000 with children = 3: de-care 650 — Three children: 1.8% - 2 x 0.25% = 1.3%, 650.
- [ ] 50,000 with children = 7: de-care 400 — The reduction stops at the fifth child: 1.8% - 4 x 0.25% = 0.8%, 400.

## Not modelled (confirm the page says so)

- Children: child allowances, child benefit (Kindergeld) and the lower care rate for parents
- Private health insurance (an option above the €77,400 compulsory insurance threshold)
- Saxony's different split of care insurance between employer and employee
- Work expenses above the €1,230 allowance (commuting, home office) and other deductions
- The church tax deduction and church tax caps
- Company pension contributions and capital gains
- Child allowances (Kinderfreibetrag) in the solidarity surcharge and church tax, and child benefit (Kindergeld)

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/de/de.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
