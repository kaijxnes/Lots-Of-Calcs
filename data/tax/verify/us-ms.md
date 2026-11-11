# Mississippi — 2026 verification checklist

Generated from `data/tax/us/us-ms.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: undefined
- Rates last checked: not yet
- Verified by a person: **not yet**
- Adds to: `us` (check that one too)

## Check against

- **Start here:** https://www.dor.ms.gov/sites/default/files/tax-forms/individual/80100251%202.pdf#page=3
- Mississippi Income Tax Instructions 2025: https://www.dor.ms.gov/sites/default/files/tax-forms/individual/80100251%202.pdf#page=3
- Mississippi Income Tax Instructions 2025, Line 61: https://www.dor.ms.gov/sites/default/files/tax-forms/individual/80100251%202.pdf#page=13
- Mississippi Income Tax Instructions 2025: https://www.dor.ms.gov/sites/default/files/tax-forms/individual/80100251%202.pdf#page=5
- Mississippi Income Tax Instructions 2025: https://www.dor.ms.gov/sites/default/files/tax-forms/individual/80100251%202.pdf#page=6
- Miss. Code Ann. § 27-7-5: https://law.justia.com/codes/mississippi/title-27/chapter-7/article-1/section-27-7-5/
- Mississippi Income Tax Instructions 2022: https://www.dor.ms.gov/sites/default/files/tax-forms/individual/80100221.pdf#page=20

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in undefined, unless the line says otherwise.

### Mississippi taxable income (`ms-taxable`)

- [ ] Single — less 2,300
- [ ] Married filing jointly — less 4,600
- [ ] Single — less 6,000
- [ ] Married filing jointly — less 12,000

### Mississippi income tax (`ms-income-tax`)

> 4% on taxable income above $10,000 in 2026.

- [ ] from 0: 0%
- [ ] from 10,000: 4%

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 40,000: ms-taxable 31,700; ms-income-tax 868; net 33,452 — Mississippi taxable income $31,700. Mississippi income tax $868. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 85,000: ms-taxable 76,700; ms-income-tax 2,668; net 65,959.50 — Mississippi taxable income $76,700. Mississippi income tax $2,668. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 150,000 with status = married: ms-taxable 133,400; ms-income-tax 4,936; net 118,249 — Mississippi taxable income $133,400. Mississippi income tax $4,936. PolicyEngine US 2.62.5 gives the same state figures to the cent.

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/us/us-ms.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
