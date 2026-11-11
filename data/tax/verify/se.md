# Sweden — 2026 verification checklist

Generated from `data/tax/se/se.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: SEK
- Rates last checked: not yet
- Verified by a person: **not yet**
- Provisional items: `The earned income tax credit uses the formula from Skatteverket's 2025 technical description; it reproduces the SEK 52,390 2026 maximum quoted by a secondary source, but the 2026 edition was not read directly`

## Check against

- **Start here:** https://app.skatteverket.se/rakna-skatt-client-skut-skatteutrakning/
- Skatteverket — Belopp och procent, inkomstår 2026: https://www.skatteverket.se/privat/skatter/beloppochprocent/2026
- Skatteverket — Teknisk beskrivning SKV 433, 2026 (utgåva 36): https://www.skatteverket.se/download/18.1522bf3f19aea8075ba55c/1766385913260/teknisk-beskrivning-skv-433-2026-utgava-36.pdf
- SCB — Kommunalskatterna 2026: https://www.scb.se/hitta-statistik/statistik-efter-amne/offentlig-ekonomi/finanser-for-den-kommunala-sektorn/kommunalskatterna/pong/statistiknyhet/kommunalskatterna-2026/
- Skatteverket — Belopp och procent, inkomstår 2026: https://www.skatteverket.se/privat/skatter/beloppochprocent/2026
- Skatteverket — Teknisk beskrivning SKV 433, 2026 (public service-avgiften): https://skatteverket.se/download/18.1522bf3f19aea8075ba55c/1766385913260/teknisk-beskrivning-skv-433-2026-utgava-36.pdf
- Svenska kyrkan — kyrkoavgiften (2026 national average 1.05%): https://www.svenskakyrkan.se/kyrkoavgiften

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in SEK, unless the line says otherwise.

### Basic allowance (grundavdrag) (`se-basic-allowance`)

> Depends on income: up to 0.77 × the price base amount (SEK 59,200 in 2026), falling to 0.293 × at high incomes.

- [ ] applies when up to 58,608
- [ ] amount 25,041.60
- [ ] applies when up to 161,024
- [ ] rate 20%
- [ ] less 58,608
- [ ] applies when up to 184,112
- [ ] amount 45,584
- [ ] applies when up to 466,496
- [ ] rate 10%
- [ ] less 184,112
- [ ] amount 17,345.60

### Municipal and regional tax (`se-municipal-tax`)

> The 2026 national average of 32.38%; it ranges from 28.93% to 35.65%.

- [ ] rate 32.38%

### State income tax (`se-state-tax`)

> 20% of taxable income above SEK 643,000.

- [ ] rate 20%
- [ ] less 643,000

### General pension contribution (allmän pensionsavgift) (`se-pension-fee`)

> 7% of income up to 8.07 × the income base amount (SEK 673,038). It is credited back against tax, so on its own it costs nothing.

- [ ] rate 7%
- [ ] capped at 673,038

### Earned income tax credit (jobbskatteavdrag) (`se-work-credit`)

> Rises with pay to a maximum of SEK 52,390 at the average municipal rate, from 8.08 × the price base amount. It no longer phases out at high incomes.

- [ ] applies when up to 53,872
- [ ] applies when up to 191,808
- [ ] factor 53,872
- [ ] rate 38.74%
- [ ] less 53,872
- [ ] applies when up to 478,336
- [ ] factor 107,329.60
- [ ] rate 25.1%
- [ ] less 191,808
- [ ] factor 179,198.40
- [ ] factor 0.32380000000000003

### Burial fee (begravningsavgift) (`se-burial-fee`)

> 0.292% of taxable earned income everywhere except Stockholm (0.07%) and Tranås (0.285%), which set their own (2026).

- [ ] rate 0.292%

### Public service fee (public service-avgift) (`se-public-service-fee`)

> 1% of taxable earned income, at most SEK 1,184 (1% of 1.42 × the SEK 83,400 income base amount) in 2026. Paid by everyone 18 or over.

- [ ] rate 1%
- [ ] capped at 1,184

### Church fee (kyrkoavgift) (`se-church-fee`)

> Church of Sweden members only: the 2026 national average of 1.05%; each parish sets its own.

- [ ] Yes (church fee, national average) — rate 1.05%

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 300,000: se-basic-allowance 34,000; se-taxable 266,000; se-work-credit 32,537.30; se-income-tax 32,593.50; net 244,445.78 — Basic allowance 0.77 × 59,200 − 10% × (300,000 − 184,112) = 34,000 (rounded up). Taxable 266,000; municipal 86,130.80. Credit (1.813 × 59,200 + 25.1% × 108,192 − 34,000) × 32.38% = 32,537.30. Pension fee 21,000, credited back. Tax 86,130.80 − 21,000 − 32,537.30 = 32,593.50. Less the burial fee (0.292%) and public service fee (1%, max 1,184) on taxable income 266,000: 1,961.00.
- [ ] 700,000: se-state-tax 7,920; se-work-credit 52,390.32; se-pension-fee 47,100 — Basic allowance 0.293 × 59,200 → 17,400. Taxable 682,600: municipal 221,025.88, state 20% × 39,600 = 7,920. Credit at its maximum (3.027 × 59,200 − 17,400) × 32.38% = 52,390.32. Pension fee capped: 7% × 673,038 = 47,112.66 → 47,100.
- [ ] 400,000 with : se-burial-fee 1,097.92; se-public-service-fee 1,184; se-church-fee 0 — Taxable 376,000: burial 0.292%, public service 1% capped at 1,184, church 1.05% if a member.
- [ ] 600,000 with church = yes: se-burial-fee 1,701.19; se-public-service-fee 1,184; se-church-fee 6,117.30 — Taxable 582,600: burial 0.292%, public service 1% capped at 1,184, church 1.05% if a member.
- [ ] 80,000 with : se-burial-fee 147.75; se-public-service-fee 506; se-church-fee 0 — Taxable 50,600: burial 0.292%, public service 1% capped at 1,184, church 1.05% if a member.

## Not modelled (confirm the page says so)

- Individual municipal rates
- Deductions for travel and other work expenses
- Individual parish church fees and the Stockholm and Tranås burial fees

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/se/se.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
