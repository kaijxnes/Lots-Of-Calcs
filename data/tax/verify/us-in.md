# Indiana — 2026 verification checklist

Generated from `data/tax/us/us-in.2026.json` by `tools/tax/checklist.js`. Do not edit: change the data file and run `node tools/tax/check.js --write`.

- Tax year: 2026 (2026-01-01 to 2026-12-31)
- Currency: undefined
- Rates last checked: not yet
- Verified by a person: **not yet**
- Adds to: `us` (check that one too)
- Provisional items: `County rates are the latest PolicyEngine holds (set between 2021 and 2025); counties can change them each year`

## Check against

- **Start here:** https://forms.in.gov/Download.aspx?id=16915
- 2025 IT-40 Income Tax Form: https://forms.in.gov/Download.aspx?id=16915
- 2025 Indiana County Income Tax Rates and County Codes: https://forms.in.gov/Download.aspx?id=16925#page=5
- IC 6-3-2-1 Tax rate (a)(3): https://iga.in.gov/laws/2024/ic/titles/6#6-3-2-1
- 2024 IT-40 Income Tax Form: https://forms.in.gov/Download.aspx?id=16379
- IC 6-3.6 LOCAL INCOME TAXES: https://iga.in.gov/laws/2024/ic/titles/6#6-3.6
- IC 6-3.1-21 Earned Income Tax Credit: https://iga.in.gov/laws/2024/ic/titles/6#6-3.1-21

## Figures

Tick each figure once it matches the official source. Amounts are yearly, in undefined, unless the line says otherwise.

### Indiana taxable income (`in-taxable`)

- [ ] factor 1,000
- [ ] Single — factor 1
- [ ] Married filing jointly — factor 2

### Indiana income tax (`in-income-tax`)

- [ ] rate 2.95%

### County income tax (`in-county-tax`)

> Every Indiana county levies its own income tax on the same base; the rate depends on the county you live in on January 1.

- [ ] Adams County — rate 1.6%
- [ ] Allen County — rate 1.59%
- [ ] Bartholomew County — rate 1.75%
- [ ] Benton County — rate 1.79%
- [ ] Blackford County — rate 2.5%
- [ ] Boone County — rate 1.7%
- [ ] Brown County — rate 2.5234%
- [ ] Carroll County — rate 2.2733%
- [ ] Cass County — rate 2.95%
- [ ] Clark County — rate 2%
- [ ] Clay County — rate 2.35%
- [ ] Clinton County — rate 2.65%
- [ ] Crawford County — rate 1.65%
- [ ] Daviess County — rate 1.5%
- [ ] Dearborn County — rate 1.4%
- [ ] Decatur County — rate 2.45%
- [ ] DeKalb County — rate 2.13%
- [ ] Delaware County — rate 1.5%
- [ ] Dubois County — rate 1.2%
- [ ] Elkhart County — rate 2%
- [ ] Fayette County — rate 2.82%
- [ ] Floyd County — rate 1.89%
- [ ] Fountain County — rate 2.1%
- [ ] Franklin County — rate 1.7%
- [ ] Fulton County — rate 2.88%
- [ ] Gibson County — rate 1.3%
- [ ] Grant County — rate 2.55%
- [ ] Greene County — rate 2.15%
- [ ] Hamilton County — rate 1.1%
- [ ] Hancock County — rate 1.94%
- [ ] Harrison County — rate 1%
- [ ] Hendricks County — rate 1.7%
- [ ] Henry County — rate 2.02%
- [ ] Howard County — rate 1.95%
- [ ] Huntington County — rate 1.95%
- [ ] Jackson County — rate 2.1%
- [ ] Jasper County — rate 2.864%
- [ ] Jay County — rate 2.5%
- [ ] Jefferson County — rate 1.03%
- [ ] Jennings County — rate 2.5%
- [ ] Johnson County — rate 1.4%
- [ ] Knox County — rate 1.7%
- [ ] Kosciusko County — rate 1%
- [ ] LaGrange County — rate 1.65%
- [ ] Lake County — rate 1.5%
- [ ] LaPorte County — rate 1.45%
- [ ] Lawrence County — rate 1.75%
- [ ] Madison County — rate 2.25%
- [ ] Marion County — rate 2.02%
- [ ] Marshall County — rate 1.25%
- [ ] Martin County — rate 2.5%
- [ ] Miami County — rate 2.54%
- [ ] Monroe County — rate 2.14%
- [ ] Montgomery County — rate 2.65%
- [ ] Morgan County — rate 2.72%
- [ ] Newton County — rate 1%
- [ ] Noble County — rate 1.75%
- [ ] Ohio County — rate 2%
- [ ] Orange County — rate 1.75%
- [ ] Owen County — rate 2.5%
- [ ] Parke County — rate 2.65%
- [ ] Perry County — rate 1.4%
- [ ] Pike County — rate 1.2%
- [ ] Porter County — rate 0.5%
- [ ] Posey County — rate 1.45%
- [ ] Pulaski County — rate 2.85%
- [ ] Putnam County — rate 2.3%
- [ ] Randolph County — rate 3%
- [ ] Ripley County — rate 2.38%
- [ ] Rush County — rate 2.15%
- [ ] St. Joseph County — rate 1.75%
- [ ] Scott County — rate 2.16%
- [ ] Shelby County — rate 1.6%
- [ ] Spencer County — rate 0.8%
- [ ] Starke County — rate 1.71%
- [ ] Steuben County — rate 1.99%
- [ ] Sullivan County — rate 1.7%
- [ ] Switzerland County — rate 1.45%
- [ ] Tippecanoe County — rate 1.28%
- [ ] Tipton County — rate 2.6%
- [ ] Union County — rate 2%
- [ ] Vanderburgh County — rate 1.25%
- [ ] Vermillion County — rate 1.5%
- [ ] Vigo County — rate 2%
- [ ] Wabash County — rate 2.9%
- [ ] Warren County — rate 2.12%
- [ ] Warrick County — rate 1%
- [ ] Washington County — rate 2%
- [ ] Wayne County — rate 1.25%
- [ ] Wells County — rate 2.1%
- [ ] White County — rate 2.32%
- [ ] Whitley County — rate 1.6829%

## Spot checks

Worked results the data must reproduce (`node tools/tax/check.js` runs them). Compare a few with an official calculator or a real payslip.

- [ ] 40,000: in-taxable 39,000; in-income-tax 1,150.50; in-county-tax 787.80; net 32,381.70 — Indiana taxable income $39,000. Indiana income tax $1,150.5; County income tax $787.8. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 85,000: in-taxable 84,000; in-income-tax 2,478; in-county-tax 1,696.80; net 64,452.70 — Indiana taxable income $84,000. Indiana income tax $2,478; County income tax $1,696.8. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 150,000 with status = married: in-taxable 148,000; in-income-tax 4,366; in-county-tax 2,989.60; net 115,829.40 — Indiana taxable income $148,000. Indiana income tax $4,366; County income tax $2,989.6. PolicyEngine US 2.62.5 gives the same state figures to the cent.
- [ ] 85,000 with status = single, county = hamilton: in-taxable 84,000; in-income-tax 2,478; in-county-tax 924; net 65,225.50 — Indiana taxable income $84,000. Indiana income tax $2,478; County income tax $924. PolicyEngine US 2.62.5 gives the same state figures to the cent.

## Sign off

When every box is ticked, set `"lastVerified": "YYYY-MM-DD"` (today) in `data/tax/us/us-in.2026.json` and run `node tools/tax/check.js --write`. If a figure is wrong, correct it there, fix the affected tests, and run the check before signing off.
