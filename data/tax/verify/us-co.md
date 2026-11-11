# Colorado — 2026 verification checklist

Generated from `data/tax/us/us-co.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: undefined
- Rates last checked: not yet
- Verified by a person: **not yet**
- Adds to: `us` (check that one too)

## Check against

- **Start here:** https://tax.colorado.gov/sites/tax/files/documents/Book104_2025.pdf#page=11
- 2025 Colorado Individual Tax Filing Guide 104 Book, Line 12: https://tax.colorado.gov/sites/tax/files/documents/Book104_2025.pdf#page=11
- HB25-1274 SECTION 18 (Session Laws of Colorado 2025, Chapter 402): https://leg.colorado.gov/bills/hb25-1274
- 2025 Colorado Individual Tax Filing Guide 104 Book, Additions Line 4: https://tax.colorado.gov/sites/tax/files/documents/Book104_2025.pdf#page=9
- 2025 Colorado Individual Tax Filing Guide 104 Book, Section C: https://tax.colorado.gov/sites/tax/files/documents/Book104_2025.pdf#page=27
- Colorado Legislation, C.R.S. 39-22-104 (1.5), (1.7) (a), (b): https://law.justia.com/codes/colorado/2022/title-39/article-22/part-1/section-39-22-104/
- Colorado Constitution, Article 10, Taxpayer's Bill of Rights (TABOR): https://law.justia.com/constitution/colorado/cnart10.html

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in undefined, unless the line says otherwise.

### Colorado taxable income (`co-taxable`)

> Starts from federal taxable income. Above $300,000 of income, all but $1,000 ($2,000 married) of the federal standard deduction is added back.

- [ ] applies when at least 300,000
- [ ] Single — less 1,000
- [ ] Married filing jointly — less 2,000

### Colorado income tax (`co-income-tax`)

- [ ] rate 4.4%

### FAMLI paid leave (`co-famli`)

> Half of the 0.88% premium, on wages up to the Social Security wage base.

- [ ] rate 0.44%
- [ ] capped at 184,500

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 40,000: co-taxable 23,900; co-income-tax 1,051.60; co-famli 176; net 33,092.40 — Colorado taxable income $23,900. Colorado income tax $1,051.6; FAMLI paid leave $176. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 85,000: co-taxable 68,900; co-income-tax 3,031.60; co-famli 374; net 65,221.90 — Colorado taxable income $68,900. Colorado income tax $3,031.6; FAMLI paid leave $374. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 150,000 with status = married: co-taxable 117,800; co-income-tax 5,183.20; co-famli 660; net 117,341.80 — Colorado taxable income $117,800. Colorado income tax $5,183.2; FAMLI paid leave $660. PolicyEngine US 2.62.5 gives the same state figures to the cent.

## Not modelled (confirm the page says so)

- Local occupational privilege taxes (Denver, Aurora, Glendale, Greenwood Village, Sheridan) of a few dollars a month
- TABOR refunds

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/us/us-co.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
