# Scotland — 2026/27 verification checklist

Generated from `data/tax/gb/gb-sct.2026-27.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026/27 (2026-04-06 to 2027-04-05)
- Currency: undefined
- Rates last checked: 2026-11-10
- Verified by a person: **not yet**
- Adds to: `gb` (check that one too)

## Check against

- **Start here:** https://www.gov.scot/publications/scottish-income-tax-rates-and-bands/pages/2026-to-2027/
- Scottish Income Tax 2026 to 2027 — rates and bands (gov.scot): https://www.gov.scot/publications/scottish-income-tax-rates-and-bands/pages/2026-to-2027/
- Scottish Rate Resolution 2026-27 (S6M-20844): https://www.parliament.scot/chamber-and-committees/votes-and-motions/S6M-20844
- Income Tax in Scotland (GOV.UK): https://www.gov.uk/scottish-income-tax

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in undefined, unless the line says otherwise.

### Scottish income tax (`gb-income-tax`)

> Replaces the rest-of-UK bands. Thresholds are on taxable income: with the full £12,570 allowance the bands start at £12,571, £16,538, £29,527, £43,663, £75,001 and £125,141 of gross pay. The personal allowance and National Insurance are set UK-wide and are unchanged.

- [ ] from 0: 19% (Starter rate)
- [ ] from 3,967: 20% (Basic rate)
- [ ] from 16,956: 21% (Intermediate rate)
- [ ] from 31,092: 42% (Higher rate)
- [ ] from 62,430: 45% (Advanced rate)
- [ ] from 125,140: 48% (Top rate)

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 30,000: gb-income-tax 3,451.07; gb-ni 1,394.40 — Taxable 17,430: 3,967 × 19% = 753.73; 12,989 × 20% = 2,597.80; 474 × 21% = 99.54 → 3,451.07. NI as rest of UK.
- [ ] 80,000: gb-income-tax 21,732.05 — Taxable 67,430: 753.73 + 2,597.80 + 14,136 × 21% = 2,968.56; 31,338 × 42% = 13,161.96; 5,000 × 45% = 2,250 → 21,732.05.
- [ ] 150,000: gb-personal-allowance 0; gb-income-tax 59,634.35 — No allowance; taxable 150,000: 753.73 + 2,597.80 + 2,968.56 + 13,161.96 + 62,710 × 45% = 28,219.50 + 24,860 × 48% = 11,932.80 → 59,634.35.

## Not modelled (confirm the page says so)

- Pension contributions (workplace or salary sacrifice)
- Student loan and postgraduate loan repayments
- Tax codes other than the standard personal allowance
- Benefits in kind, salary sacrifice and taxable expenses

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/gb/gb-sct.2026-27.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
