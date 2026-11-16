# Self-employed (Scotland) — 2026/27 verification checklist

Generated from `data/tax/gb/gb-sct-se.2026-27.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026/27 (2026-04-06 to 2027-04-05)
- Currency: undefined
- Rates last checked: 2026-11-16
- Verified by a person: **not yet**
- Adds to: `gb-sct` (check that one too)

## Check against

- **Start here:** https://www.gov.uk/self-employed-national-insurance-rates
- Self-employed National Insurance rates (GOV.UK): https://www.gov.uk/self-employed-national-insurance-rates
- Payments on account (GOV.UK): https://www.gov.uk/understand-self-assessment-bill/payments-on-account

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in undefined, unless the line says otherwise.

### Class 4 National Insurance (`gb-ni`)

> Self-employed National Insurance on profits: 6% between £12,570 and £50,270 and 2% above. Paid through Self Assessment, not PAYE. Class 2 is treated as paid on profits of £7,105 or more, so there's nothing to pay.

- [ ] from 0: 0% (Below the lower profits limit)
- [ ] from 12,570: 6% (Lower to upper profits limit)
- [ ] from 50,270: 2% (Above the upper profits limit)

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 30,000: gb-income-tax 3,451.07; gb-ni 1,045.80; net 25,503.13 — Scottish income tax 3,451.07 (as gb-sct). Class 4 (30,000 − 12,570) × 6% = 1,045.80. Net 25,503.13.

## Not modelled (confirm the page says so)

- Voluntary Class 2 contributions (£3.65 a week) on profits under £7,105
- Higher-rate relief on personal pension contributions, which is claimed through Self Assessment
- Trading allowance, losses, capital allowances and other adjustments to profit
- When the tax is paid: payments on account are worked out separately on the self-employed pages

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/gb/gb-sct-se.2026-27.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
