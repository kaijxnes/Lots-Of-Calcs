# United States (federal) — 2026 verification checklist

Generated from `data/tax/us/us.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: USD
- Rates last checked: not yet
- Verified by a person: **not yet**

## Check against

- **Start here:** https://www.irs.gov/pub/irs-drop/rp-25-32.pdf
- IRS Rev. Proc. 2025-32 — 2026 inflation adjustments (brackets, standard deduction): https://www.irs.gov/pub/irs-drop/rp-25-32.pdf
- SSA — Contribution and benefit base: https://www.ssa.gov/oact/cola/cbb.html
- 26 U.S.C. § 3101 — FICA rates, including the additional Medicare tax: https://www.law.cornell.edu/uscode/text/26/3101
- 401(k) limit increases to $24,500 for 2026 (IRS): https://www.irs.gov/newsroom/401k-limit-increases-to-24500-for-2026-ira-limit-increases-to-7500
- Child Tax Credit (IRS): https://www.irs.gov/credits-deductions/individuals/child-tax-credit

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in USD, unless the line says otherwise.

### 401(k) contribution (`us-401k-amount`)

> Traditional (pre-tax) 401(k) or 403(b) deferrals, up to the 2026 limit of $24,500 (catch-up contributions for 50 and over not included).

- [ ] capped at 24,500
- [ ] rate 85%

### Pre-tax health insurance (`us-health-amount`)

> Your share of employer health, dental and vision premiums paid through a cafeteria (Section 125) plan. Together with the 401(k), capped at 85% of pay, since payroll can't deduct more than is left after taxes.

- [ ] factor 12
- [ ] rate 85%

### Federal standard deduction (`us-standard-deduction`)

- [ ] Single — amount 16,100
- [ ] Married filing jointly — amount 32,200

### Federal income tax (`us-income-tax`)

- [ ] Single — from 0: 10%
- [ ] Single — from 12,400: 12%
- [ ] Single — from 50,400: 22%
- [ ] Single — from 105,700: 24%
- [ ] Single — from 201,775: 32%
- [ ] Single — from 256,225: 35%
- [ ] Single — from 640,600: 37%
- [ ] Married filing jointly — from 0: 10%
- [ ] Married filing jointly — from 24,800: 12%
- [ ] Married filing jointly — from 100,800: 22%
- [ ] Married filing jointly — from 211,400: 24%
- [ ] Married filing jointly — from 403,550: 32%
- [ ] Married filing jointly — from 512,450: 35%
- [ ] Married filing jointly — from 768,700: 37%

### Child Tax Credit available (`us-ctc-max`)

> $2,200 per child under 17, reduced by $50 for each $1,000 (or part) of income over $200,000 ($400,000 married).

- [ ] factor 2,200
- [ ] Single — reduced above 200,000
- [ ] Married filing jointly — reduced above 400,000
- [ ] for each step of 1,000
- [ ] reduced per step by 50

### Refundable Child Tax Credit (`us-actc`)

> Up to $1,700 a child of any credit left over is paid out, limited to 15% of earnings over $2,500.

- [ ] factor 1,700
- [ ] rate 15%
- [ ] less 2,500

### Social Security (`us-social-security`)

> 6.2% of wages up to the 2026 wage base of $184,500.

- [ ] rate 6.2%
- [ ] capped at 184,500

### Medicare (`us-medicare`)

- [ ] rate 1.45%

### Additional Medicare tax (`us-additional-medicare`)

> 0.9% on wages above $200,000 ($250,000 married filing jointly). Employers withhold it from $200,000 whatever the status; the threshold here is the liability.

- [ ] rate 0.9%
- [ ] Single — less 200,000
- [ ] Married filing jointly — less 250,000

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 75,000: us-taxable 58,900; us-income-tax 7,670; us-social-security 4,650; us-medicare 1,087.50; us-additional-medicare 0 — Taxable 58,900: 12,400 × 10% + 38,000 × 12% + 8,500 × 22% = 1,240 + 4,560 + 1,870 = 7,670. SS 4,650. Medicare 1,087.50.
- [ ] 150,000 with status = married: us-income-tax 15,340; us-social-security 9,300 — Taxable 117,800: 24,800 × 10% = 2,480 + 76,000 × 12% = 9,120 + 17,000 × 22% = 3,740 → 15,340.
- [ ] 300,000: us-income-tax 68,134.25; us-social-security 11,439; us-medicare 4,350; us-additional-medicare 900 — Taxable 283,900: 1,240 + 4,560 + 55,300 × 22% = 12,166 + 96,075 × 24% = 23,058 + 54,450 × 32% = 17,424 + 27,675 × 35% = 9,686.25 → 68,134.25. SS capped at 184,500 × 6.2% = 11,439. Additional Medicare 100,000 × 0.9% = 900.
- [ ] 75,000 with children = 2: us-income-tax 7,670; us-child-tax-credit -4,400 — Tax 7,670 (as with no children); credit 2 x 2,200 = 4,400, all used against tax.
- [ ] 25,000 with children = 1: us-income-tax 890; us-actc 1,310; us-child-tax-credit -2,200 — Taxable 8,900, tax 890. Credit 2,200: 890 against tax, the other 1,310 refundable (under 1,700 and under 15% x 22,500 = 3,375).
- [ ] 75,000 with k401Pct = 6: us-income-tax 6,680; us-social-security 4,650; us-401k 4,500 — 401(k) 4,500: taxable 75,000 - 4,500 - 16,100 = 54,400; tax 5,800 + 22% x 4,000 = 6,680. Social Security still on 75,000: 4,650.
- [ ] 75,000 with healthMonthly = 200: us-social-security 4,501.20; us-medicare 1,052.70 — Premiums 2,400 off before everything: Social Security 6.2% x 72,600 = 4,501.20, Medicare 1.45% x 72,600 = 1,052.70.
- [ ] 200,000 with k401Pct = 50: us-401k 24,500 — 50% would be 100,000; capped at the 24,500 limit.
- [ ] 410,000 with status = married, children = 2: us-ctc-max 3,900 — 10,000 over the 400,000 threshold: 10 steps x 50 = 500 off 4,400.

## Not modelled (confirm the page says so)

- Pre-tax 401(k), HSA and health insurance contributions
- Tax credits, including the child tax credit and earned income credit
- Itemized deductions, including state and local taxes (SALT) — high earners in high-tax states may pay less federal tax by itemizing
- The deductions for tips, overtime, car loan interest and seniors introduced for 2025–2028
- Alternative minimum tax
- Head of household, married filing separately and qualifying surviving spouse
- Roth 401(k) (after-tax), HSA and FSA contributions
- State child and dependent credits

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/us/us.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
