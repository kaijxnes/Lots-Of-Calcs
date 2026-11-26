# UK bank holidays (unmodified download)

- `gov-uk-bank-holidays.json` — GOV.UK's official bank holiday list for England and Wales, Scotland and Northern Ireland — https://www.gov.uk/bank-holidays.json — downloaded 2026-11-14.

Used by `tools/build-working-days-pages.js` (the /working-days/ calculator and the year and month pages). Re-download the file unmodified when GOV.UK adds a new year, then re-run the generator.

# Holidays for the other payday calendars

Used by `tools/build-payday-pages.js`. Each file holds the rules' source and the official dates for the years published so far (`check`); the builder stops if its rules don't reproduce them. Later years are shown as expected dates.

- `us-federal-reserve.json` — Federal Reserve holiday schedule.
- `ie-public-holidays.json` — Workplace Relations Commission, Ireland.
- `ca-payments-canada.json` — Payments Canada system closure schedule (Lynx and ACSS), 2026 and 2027.
- `au-national-holidays.json` — RBA public and bank holidays observed in all states and territories, 2026 and 2027.
- `nz-public-holidays.json` — Employment New Zealand and govt.nz observed dates, 2026 and 2027; Matariki dates from MBIE (2022–2052).
