# Arizona — 2026 verification checklist

Generated from `data/tax/us/us-az.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: undefined
- Rates last checked: not yet
- Verified by a person: **not yet**
- Adds to: `us` (check that one too)

## Check against

- **Start here:** https://www.irs.gov/pub/irs-drop/rp-25-32.pdf#page=18
- Rev. Proc. 2025-32, sec. 4.14(1) (2026 federal standard deduction): https://www.irs.gov/pub/irs-drop/rp-25-32.pdf#page=18
- Laws 2026, ch. 140 (HB 4168), secs. 16 and 35(A): https://www.azleg.gov/legtext/57leg/2R/laws/0140.htm
- Arizona HB 4168 (2026), Sec. 16 amending 43-1041(I)(2)(a)-(b): https://www.azleg.gov/legtext/57leg/2R/bills/HB4168H.pdf#page=30
- 2025 Arizona Form 140 Resident Personal Income Tax Instructions: https://azdor.gov/sites/default/files/document/FORMS_INDIVIDUAL_2025_140i.pdf#page=23
- 2025 Arizona Form 140 Resident Personal Income Tax Instructions: https://azdor.gov/sites/default/files/document/FORMS_INDIVIDUAL_2025_140i.pdf#page=21
- 2025 Arizona Form 140 Resident Personal Income Tax Instructions: https://azdor.gov/sites/default/files/document/FORMS_INDIVIDUAL_2025_140i.pdf#page=20

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in undefined, unless the line says otherwise.

### Arizona taxable income (`az-taxable`)

> Arizona's standard deduction matches the federal one.

- [ ] Single — less 16,100
- [ ] Married filing jointly — less 32,200

### Arizona income tax (`az-income-tax`)

- [ ] rate 2.5%

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 40,000: az-taxable 23,900; az-income-tax 597.50; net 33,722.50 — Arizona taxable income $23,900. Arizona income tax $597.5. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 85,000: az-taxable 68,900; az-income-tax 1,722.50; net 66,905 — Arizona taxable income $68,900. Arizona income tax $1,722.5. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 150,000 with status = married: az-taxable 117,800; az-income-tax 2,945; net 120,240 — Arizona taxable income $117,800. Arizona income tax $2,945. PolicyEngine US 2.62.5 gives the same state figures to the cent.

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/us/us-az.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
