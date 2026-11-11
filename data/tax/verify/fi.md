# Finland — 2026 verification checklist

Generated from `data/tax/fi/fi.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: EUR
- Rates last checked: 2026-11-11
- Verified by a person: **not yet**

## Check against

- **Start here:** https://vero.fi/syventavat-vero-ohjeet/ohje-hakusivu/49038/
- Vero — Verotettavan tulon laskeminen henkilöverotuksessa 2026 (basic deduction, earned income credit): https://vero.fi/syventavat-vero-ohjeet/ohje-hakusivu/49038/
- Vero — Veroperusteet (health care and daily allowance contributions, Yle tax): https://vero.fi/henkiloasiakkaat/verokortti-ja-veroilmoitus/verokortti/veroprosentti-ja-tuloraja/veroperusteet/
- Veronmaksajat — Valtion tulovero 2026: https://www.veronmaksajat.fi/neuvot/henkiloverotus/tyo-elake-ja-etuudet/ansiotulojen-verot-ja-maksut/valtion-tulovero/
- Veronmaksajat — Ansiotulosta tehtävät vähennykset 2026: https://www.veronmaksajat.fi/neuvot/henkiloverotus/tyo-elake-ja-etuudet/verovahennykset/2026/ansiotulosta-tehtavat-vahennykset-2026/
- Eläketurvakeskus — Lakisääteiset sosiaalivakuutusmaksut Suomessa 2026: https://www.etk.fi/wp-content/uploads/2026/01/lakisaateiset-sosiaalivakuutusmaksut-suomessa-2026-suomi-1.pdf
- Kuntaliitto / Verohallinto — Kuntien veroprosentit 2026 (weighted average 7.57%): https://www.kuntaliitto.fi/sites/default/files/media/file/Kuntien-veroprosentit-2026.pdf

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in EUR, unless the line says otherwise.

### Employee pension contribution (TyEL) (`fi-pension`)

> 7.30% of pay for all employees aged 17 to 64 in 2026.

- [ ] rate 7.3%

### Unemployment insurance contribution (`fi-unemployment`)

> 0.89% of pay.

- [ ] rate 0.89%

### Health insurance daily allowance contribution (`fi-daily-allowance`)

> 0.88% of pay for anyone earning €17,255 or more a year; nothing below that.

- [ ] applies when at least 17,255
- [ ] rate 0.88%

### Net earned income (puhdas ansiotulo) (`fi-net-earned`)

> Pay less the automatic €750 deduction for work expenses and the employee contributions above, which are deductible.

- [ ] capped at 750

### Basic deduction (perusvähennys) (`fi-basic-deduction`)

> Up to €4,265 in municipal taxation, reduced by 18% of income above €4,265 (gone at about €27,960).

- [ ] capped at 4,265
- [ ] rate 18%
- [ ] less 4,265

### State income tax before credits (`fi-state-before`)

- [ ] from 0: 12.64%
- [ ] from 22,000: 19%
- [ ] from 32,600: 30.25%
- [ ] from 40,100: 33.25%
- [ ] from 52,100: 37.5%

### Municipal tax before credits (`fi-municipal-before`)

- [ ] rate 7.57%

### Health care contribution before credits (`fi-health-care-before`)

- [ ] rate 1.1%

### Earned income tax credit (työtulovähennys) (`fi-work-credit`)

> 18% of pay, at most €3,430, reduced by 2% of net earned income between €35,000 and €50,550 (so never below €3,119 once the full credit is reached).

- [ ] capped at 3,430
- [ ] rate 18%
- [ ] rate 2%
- [ ] less 35,000
- [ ] at most 15,550

### Share of municipal tax and health care contribution kept after the credit (`fi-local-share`)

- [ ] amount 1

### Public broadcasting tax (Yle-vero) (`fi-yle-tax`)

> 2.5% of income above €15,150, at most €160.

- [ ] capped at 160
- [ ] rate 2.5%
- [ ] less 15,150

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 20,000: fi-net-earned 17,436; fi-state-tax 0; fi-municipal-tax 105.98; fi-health-care 15.4; fi-yle-tax 57.15; net 18,007.47 — Separate implementation of the Vero rules.
- [ ] 35,000: fi-net-earned 31,075.50; fi-state-tax 1,075.15; fi-municipal-tax 2,352.42; fi-health-care 341.83; fi-yle-tax 160; net 27,896.11 — Separate implementation of the Vero rules.
- [ ] 50,000: fi-net-earned 44,715; fi-state-tax 5,362.34; fi-municipal-tax 3,384.93; fi-health-care 491.87; fi-yle-tax 160; net 36,065.87 — Separate implementation of the Vero rules.
- [ ] 80,000: fi-net-earned 71,994; fi-state-tax 15,394.80; fi-municipal-tax 5,449.95; fi-health-care 791.93; fi-yle-tax 160; net 50,947.32 — Separate implementation of the Vero rules.
- [ ] 120,000: fi-net-earned 108,366; fi-state-tax 29,034.30; fi-municipal-tax 8,203.31; fi-health-care 1,192.03; fi-yle-tax 160; net 70,526.37 — Separate implementation of the Vero rules.

## Not modelled (confirm the page says so)

- Church tax for members (about 1–2%, set by each parish)
- Individual municipal tax rates
- Holiday pay (lomaraha) and other payments taxed with pay
- Travel, union and other deductions beyond the automatic €750
- The higher earned income credit for over-65s and the extra for children

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/fi/fi.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
