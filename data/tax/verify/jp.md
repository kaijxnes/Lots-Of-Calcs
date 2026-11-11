# Japan — 2026 verification checklist

Generated from `data/tax/jp/jp.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: JPY
- Rates last checked: not yet
- Verified by a person: **not yet**
- Provisional items: `Tokyo's 2026 health insurance rate of 9.85% comes from a third-party summary; Kyōkai Kenpo's own table confirms only that it fell from 9.91%`, `Resident tax spouse amounts above ¥9 million of income (¥220,000 / ¥110,000) follow from the adjustment-credit gaps rather than a page stating them directly`

## Check against

- **Start here:** https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/2260.htm
- National Tax Agency — income tax rates: https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/2260.htm
- National Tax Agency — 2025 reform of the basic and employment income deductions: https://www.nta.go.jp/users/gensen/2025kiso/index.htm
- Kyōkai Kenpo — 2026 contribution rates by prefecture: https://www.kyoukaikenpo.or.jp/about/business/insurance_rate/rate_prefectures/r08
- MHLW — employment insurance rates FY2026: https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000108634.html
- NTA Tax Answer No.1191 配偶者控除: https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1191.htm
- NTA Tax Answer No.1180 扶養控除: https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1180.htm
- NTA Tax Answer No.1135 小規模企業共済等掛金控除 (iDeCo): https://www.nta.go.jp/taxes/shiraberu/taxanswer/shotoku/1135.htm
- Nerima City — 調整控除 (adjustment credit): https://www.city.nerima.tokyo.jp/kurashi/zei/jyuminzei/zeigakukojo/choseikojo.html
- Nagoya City — 調整控除: https://www.city.nagoya.jp/kurashi/zeikin/1037356/1011880/1011883/1011893.html

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in JPY, unless the line says otherwise.

### Health insurance (`jp-health`)

> Half of Kyōkai Kenpo's Tokyo rate (9.85%), plus half of the 1.62% long-term care rate for those aged 40 to 64.

- [ ] factor 4.925
- [ ] 40 to 64 — plus 0.81
- [ ] factor 0.12
- [ ] factor 12
- [ ] capped at 1,390,000

### Child and childcare support levy (`jp-child-levy`)

> Half of 0.23%, from April 2026 (nine months of the year).

- [ ] factor 0.08625
- [ ] factor 0.12
- [ ] factor 12
- [ ] capped at 1,390,000

### Employees' pension insurance (`jp-pension`)

> Half of 18.3%, on monthly pay up to ¥650,000.

- [ ] factor 9.15
- [ ] factor 0.12
- [ ] factor 12
- [ ] capped at 650,000

### Employment insurance (`jp-employment`)

> 0.5% for general businesses in FY2026.

- [ ] rate 0.5%

### Employment income (after the employment income deduction) (`jp-employment-income`)

> The employment income deduction has a minimum of ¥740,000 for 2026 and 2027.

- [ ] applies when up to 3,600,000
- [ ] at least 740,000
- [ ] rate 30%
- [ ] plus 80,000
- [ ] applies when up to 6,600,000
- [ ] rate 20%
- [ ] plus 440,000
- [ ] applies when up to 8,500,000
- [ ] rate 10%
- [ ] plus 1,100,000
- [ ] less 1,950,000

### Basic deduction (`jp-basic-deduction`)

> ¥1,040,000 for total income up to ¥4.89 million, ¥670,000 up to ¥6.55 million, ¥620,000 up to ¥23.5 million, then tapering away.

- [ ] over 0: 1,040,000
- [ ] over 4,890,000: 670,000
- [ ] over 6,550,000: 620,000
- [ ] over 23,500,000: 480,000
- [ ] over 24,000,000: 320,000
- [ ] over 24,500,000: 160,000
- [ ] over 25,000,000: 0

### iDeCo contributions (`jp-ideco`)

> Fully deductible from income for both income and resident tax (small-enterprise mutual aid premiums deduction). Capped here at ¥276,000, the limit for employees with no workplace pension.

- [ ] capped at 276,000

### Spouse and dependant deductions (income tax) (`jp-family-deductions`)

> Spouse ¥380,000 (¥260,000 or ¥130,000 once your total income passes ¥9 million or ¥9.5 million, none above ¥10 million); ¥380,000 per general dependant and ¥630,000 per dependant aged 19–22.

- [ ] Yes (spouse's income ¥620,000 or less) — over 0: 380,000
- [ ] Yes (spouse's income ¥620,000 or less) — over 9,000,000: 260,000
- [ ] Yes (spouse's income ¥620,000 or less) — over 9,500,000: 130,000
- [ ] Yes (spouse's income ¥620,000 or less) — over 10,000,000: 0
- [ ] factor 380,000
- [ ] factor 630,000

### Income tax (including reconstruction tax) (`jp-income-tax`)

> 5% to ¥1.95 million, then 10%, 20%, 23%, 33%, 40% and 45% above ¥40 million, plus the 2.1% special reconstruction income tax.

- [ ] factor 1.021
- [ ] from 0: 5%
- [ ] from 1,950,000: 10%
- [ ] from 3,300,000: 20%
- [ ] from 6,950,000: 23%
- [ ] from 9,000,000: 33%
- [ ] from 18,000,000: 40%
- [ ] from 40,000,000: 45%

### Spouse and dependant deductions (resident tax) (`jp-family-deductions-resident`)

> Resident tax allows less: spouse ¥330,000 (¥220,000, ¥110,000), ¥330,000 per general dependant and ¥450,000 per dependant aged 19–22.

- [ ] Yes (spouse's income ¥620,000 or less) — over 0: 330,000
- [ ] Yes (spouse's income ¥620,000 or less) — over 9,000,000: 220,000
- [ ] Yes (spouse's income ¥620,000 or less) — over 9,500,000: 110,000
- [ ] Yes (spouse's income ¥620,000 or less) — over 10,000,000: 0
- [ ] factor 330,000
- [ ] factor 450,000

### Gap between income tax and resident tax personal deductions (`jp-personal-deduction-gap`)

> ¥50,000 for the basic deduction, plus ¥50,000 (¥40,000, ¥20,000) for a spouse, ¥50,000 per general dependant and ¥180,000 per dependant aged 19–22; it sets the adjustment credit.

- [ ] amount 50,000
- [ ] Yes (spouse's income ¥620,000 or less) — over 0: 50,000
- [ ] Yes (spouse's income ¥620,000 or less) — over 9,000,000: 40,000
- [ ] Yes (spouse's income ¥620,000 or less) — over 9,500,000: 20,000
- [ ] Yes (spouse's income ¥620,000 or less) — over 10,000,000: 0
- [ ] factor 50,000
- [ ] factor 180,000

### Taxable income (resident tax) (`jp-resident-taxable`)

> Resident tax has its own basic deduction (¥430,000) and no temporary increase to the employment income deduction.

- [ ] applies when up to 3,600,000
- [ ] at least 650,000
- [ ] rate 30%
- [ ] plus 80,000
- [ ] applies when up to 6,600,000
- [ ] rate 20%
- [ ] plus 440,000
- [ ] applies when up to 8,500,000
- [ ] rate 10%
- [ ] plus 1,100,000
- [ ] less 1,950,000
- [ ] less 430,000

### Resident tax (jūminzei) (`jp-resident-tax`)

> 10% of taxable income less the adjustment credit (5% of the gap between income tax and resident tax personal deductions, at least ¥2,500), plus the ¥5,000 per-capita levy (including the forest environment tax). It is charged in the following year; shown here as if the salary were the same both years.

- [ ] rate 10%
- [ ] at least 2,500
- [ ] rate 5%
- [ ] applies when up to 2,000,000
- [ ] at least 50,000
- [ ] less 2,000,000
- [ ] plus 5,000

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 5,000,000: jp-employment-income 3,560,000; jp-taxable 1,786,000; jp-income-tax 91,175; jp-resident-tax 242,100; net 3,933,662.50 — Health 246,250, child levy 4,312.50, pension 457,500, employment 25,000 → 733,062.50. Employment income 5,000,000 − 1,440,000 = 3,560,000; basic deduction 1,040,000; taxable 1,786,000. Tax 5% = 89,300 × 1.021 = 91,175. Resident: 2,396,000 × 10% − 2,500 + 5,000 = 242,100.
- [ ] 15,000,000: jp-pension 713,700; jp-basic-deduction 620,000; jp-income-tax 2,100,574 — Pension capped at 9.15% × 650,000 × 12 = 713,700. Employment income 13,050,000; basic deduction 620,000.
- [ ] 5,000,000 with age = 40to64: jp-income-tax 89,133; net 3,899,204.50 — Adds the long-term care contribution, 0.81% = 40,500.
- [ ] 5,000,000 with spouse = yes: jp-taxable 1,406,000; jp-income-tax 71,776; jp-resident-tax 209,100; net 3,986,061.50 — Separate implementation: family deductions 380,000 (income tax) / 330,000 (resident), gap 100,000, adjustment 2,500.
- [ ] 8,000,000 with dependants = 1, dependants19to22 = 1, ideco = 276000: jp-taxable 2,989,000; jp-income-tax 205,629; jp-resident-tax 348,400; net 6,015,371 — Separate implementation: family deductions 1,010,000 (income tax) / 780,000 (resident), gap 280,000, adjustment 2,500.
- [ ] 3,000,000 with spouse = yes, dependants = 2: jp-taxable 0; jp-income-tax 0; jp-resident-tax 13,000; net 2,547,162.50 — Separate implementation: family deductions 1,140,000 (income tax) / 990,000 (resident), gap 200,000, adjustment 8,000.
- [ ] 12,000,000 with spouse = yes, dependants19to22 = 2: jp-taxable 6,794,000; jp-income-tax 950,857; jp-resident-tax 736,900; net 8,937,193 — Separate implementation: family deductions 1,260,000 (income tax) / 900,000 (resident), gap 410,000, adjustment 2,500.

## Not modelled (confirm the page says so)

- Bonuses (social insurance and withholding work differently on them)
- Furusato nōzei and other deductions
- Corporate health insurance societies, whose rates differ
- The special spouse deduction (spouse earning more than ¥620,000) and the new special deduction for 19–22-year-olds earning over ¥580,000
- Higher iDeCo limits for some workers and the 2027 increase

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/jp/jp.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
