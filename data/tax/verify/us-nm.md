# New Mexico — 2026 verification checklist

Generated from `data/tax/us/us-nm.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: undefined
- Rates last checked: not yet
- Verified by a person: **not yet**
- Adds to: `us` (check that one too)

## Check against

- **Start here:** https://klvg4oyd4j.execute-api.us-west-2.amazonaws.com/prod/PublicFiles/34821a9573ca43e7b06dfad20f5183fd/0558a902-6362-47ca-8e3b-7cca3bc69b9d/2025%20PIT%20Packet_Final.pdf#page=49
- 2025 PIT-ADJ SCHEDULE OF ADDITIONS, DEDUCTIONS, AND EXEMPTIONS: https://klvg4oyd4j.execute-api.us-west-2.amazonaws.com/prod/PublicFiles/34821a9573ca43e7b06dfad20f5183fd/0558a902-6362-47ca-8e3b-7cca3bc69b9d/2025%20PIT%20Packet_Final.pdf#page=49
- 2025 Personal Income Tax Form Packet ADJ-5. LINE 13 EXEMPTION--INCOME OF PERSONS SIXTY-FIVE AND OLDER OR BLIND: https://klvg4oyd4j.execute-api.us-west-2.amazonaws.com/prod/PublicFiles/34821a9573ca43e7b06dfad20f5183fd/0558a902-6362-47ca-8e3b-7cca3bc69b9d/2025%20PIT%20Packet_Final.pdf#page=50
- 2025 Tax Form Instructions PIT-ADJ Page ADJ-3: https://klvg4oyd4j.execute-api.us-west-2.amazonaws.com/prod/PublicFiles/34821a9573ca43e7b06dfad20f5183fd/0558a902-6362-47ca-8e3b-7cca3bc69b9d/2025%20PIT%20Packet_Final.pdf#page=48
- 2025 New Mexico personal income tax form packet Page PIT-1-26: https://klvg4oyd4j.execute-api.us-west-2.amazonaws.com/prod/PublicFiles/34821a9573ca43e7b06dfad20f5183fd/0558a902-6362-47ca-8e3b-7cca3bc69b9d/2025%20PIT%20Packet_Final.pdf#page=32
- 2025 New Mexico personal income tax form packet Page ADJ-7 LINE 25 Exemption for social security income: https://klvg4oyd4j.execute-api.us-west-2.amazonaws.com/prod/PublicFiles/34821a9573ca43e7b06dfad20f5183fd/0558a902-6362-47ca-8e3b-7cca3bc69b9d/2025%20PIT%20Packet_Final.pdf#page=52
- 2025 Tax Form Instructions Page ADJ-5 LINE 18. Medical care expense exemption for persons age 65 years or older: https://klvg4oyd4j.execute-api.us-west-2.amazonaws.com/prod/PublicFiles/34821a9573ca43e7b06dfad20f5183fd/0558a902-6362-47ca-8e3b-7cca3bc69b9d/2025%20PIT%20Packet_Final.pdf#page=51

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in undefined, unless the line says otherwise.

### New Mexico taxable income (`nm-taxable`)

> Federal standard deduction, and a low- and middle-income exemption of up to $2,500 each below $36,667 ($55,000 married).

- [ ] Single — applies when up to 36,667
- [ ] Married filing jointly — applies when up to 55,000
- [ ] factor 2,500
- [ ] Single — factor 0.15
- [ ] Married filing jointly — factor 0.1
- [ ] Single — less 20,000
- [ ] Married filing jointly — less 30,000
- [ ] Single — factor 1
- [ ] Married filing jointly — factor 2

### New Mexico income tax (`nm-income-tax`)

- [ ] Single — from 0: 1.5%
- [ ] Single — from 5,500: 3.2%
- [ ] Single — from 16,500: 4.3%
- [ ] Single — from 33,500: 4.7%
- [ ] Single — from 66,500: 4.9%
- [ ] Single — from 210,000: 5.9%
- [ ] Married filing jointly — from 0: 1.5%
- [ ] Married filing jointly — from 8,000: 3.2%
- [ ] Married filing jointly — from 25,000: 4.3%
- [ ] Married filing jointly — from 50,000: 4.7%
- [ ] Married filing jointly — from 100,000: 4.9%
- [ ] Married filing jointly — from 315,000: 5.9%

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 40,000: nm-taxable 23,900; nm-income-tax 752.70; net 33,567.30 — New mexico taxable income $23,900. New Mexico income tax $752.7. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 85,000: nm-taxable 68,900; nm-income-tax 2,834.10; net 65,793.40 — New mexico taxable income $68,900. New Mexico income tax $2,834.1. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 150,000 with status = married: nm-taxable 117,800; nm-income-tax 4,961.20; net 118,223.80 — New mexico taxable income $117,800. New Mexico income tax $4,961.2. PolicyEngine US 2.62.5 gives the same state figures to the cent.

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/us/us-nm.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
