# Tax registry

Every income tax and payroll rule the site uses, one JSON file per
jurisdiction per tax year. `tax-engine.js` (repo root) evaluates them — in the
browser for live calculators and in node for page generation and tests — so
there is one implementation of the arithmetic.

```
data/tax/
  index.json                 generated: id -> the file currently in force
  gb/gb.2026-27.json         United Kingdom
  gb/gb-sct.2026-27.json     Scotland (child of gb)
  us/us.2026.json            US federal + FICA
  us/us-ca.2026.json         California (child of us)
  us/us-ny-nyc.2026.json     New York City (child of us-ny)
  de/de.2026.json            ...
```

## Everyday tasks

**Check everything** (run before committing any change here):

```
node tools/tax/check.js            # validate, run every worked test, smoke-test every option
node tools/tax/check.js us-ca      # one jurisdiction and its children
node tools/tax/check.js --table    # summary: tax year, verified date, provisional items
node tools/tax/check.js --write    # also regenerate index.json
```

**Correct a rate.** Edit the number in the file, update the affected `tests`
(they will fail until you do — that is the point), run the check.

**A new tax year.** Copy `xx.2026.json` to `xx.2027.json`, change `taxYear`,
update the figures and tests, run `node tools/tax/check.js --write`. The index
switches to the new file once its start date has passed; add `"draft": true`
to keep it out of the index until you are ready. Old years stay in the folder.

**Mark something verified.** When a person has checked a file against the
primary source (the links in `sources` / `verifyAt`), set `lastVerified` to
that date. Pages say "not verified" while it is `null`.

**Rebuild the UK salary pages** after changing UK figures:
`node tools/build-salary-pages.js`.

## File format

```jsonc
{
  "id": "us-ca",                 // unique; also the file name prefix
  "name": "California",
  "appliesTo": "Residents of California",
  "kind": "state",               // country | state | region | city | county
  "country": "US",
  "parent": "us",                // null for a country; children inherit the parent's items
  "standalone": true,            // false if it only makes sense with a child (US federal)
  "currency": "USD", "locale": "en-US",          // roots only
  "taxYear": { "label": "2026", "start": "2026-01-01", "end": "2026-12-31" },
  "options": {                   // choices a visitor can make; "status" is filing status
    "status": { "label": "Filing status", "default": "single",
                "choices": { "single": "Single", "married": "Married filing jointly" } }
  },
  "items": [ ... ],              // the rules, evaluated in order (below)
  "assumptions": [ ... ],        // what the figures assume
  "notModelled": [ ... ],        // what is deliberately left out
  "provisional": [ ... ],        // figures not yet confirmed for this year, and why
  "sources": [ { "title": "...", "url": "..." } ],   // primary sources to verify against
  "obtainedFrom": [ { "title": "...", "url": "...", "note": "..." } ],  // where the numbers actually came from
  "lastVerified": null,          // YYYY-MM-DD once checked against a primary source
  "verifyAt": "https://...",     // the single best page to check against
  "tests": [ { "gross": 75000, "options": {...}, "note": "working", "expect": { "item-id": 1234.56, "net": 50000 } } ]
}
```

### Items

Each item is either a **value** (an intermediate result such as taxable
income) or a **charge** (money taken out of pay). Later items can refer to
earlier ones by id, including the parent's.

```jsonc
{ "id": "ca-taxable", "label": "California taxable income", "show": true, "value": <expr> }
{ "id": "ca-income-tax", "label": "California income tax", "group": "tax", "charge": <expr> }
{ "id": "ca-sdi", "label": "State Disability Insurance", "group": "social", "charge": <expr> }
```

- `group` is `tax` or `social`.
- `show: true` puts a value in the breakdown (e.g. personal allowance).
- A child item with the same id as a parent's replaces it — it must say
  `"replaces": true`. That is how Scotland swaps in its own income tax.
- `"mayBeNegative": true` on a refundable credit lets it pay out.
- `note` explains the rule in plain English; pages can show it.

### Expressions

| Form | Meaning |
|---|---|
| `1234` | a number |
| `"gross"`, `"item-id"` | the salary, or an earlier item's result |
| `{"sum": [a, b]}`, `{"sub": [a, b, c]}`, `{"mul": [...]}`, `{"div": [a, b]}` | arithmetic (`sub` is a − b − c) |
| `{"min": [...]}`, `{"max": [...]}` | smallest / largest |
| `{"pct": 6.2, "of": x}` | a percentage of x |
| `{"brackets": [[0, 10], [12400, 12, "label"]], "of": x}` | progressive tax: each row is `[from, rate %, label?]` |
| `{"lookup": [[0, 3200], [100000, 1600]], "of": x}` | step table: value of the last row reached (`"strict": true` = only above the threshold) |
| `{"taper": amount, "of": x, "from": t, "per": 0.5}` | allowance reduced by 0.5 per unit of x above t |
| `{"taper": amount, "from": t, "step": 2500, "perStep": 6}` | reduced by 6 for each 2,500 (or part) above t; `pctPerStep` reduces by a % of the amount; `"stepMode": "floor"` ignores part steps |
| `{"clamp": x, "min": a, "max": b}` | keep x between a and b |
| `{"if": {"lte": [a, b]}, "then": x, "else": y}` | conditions: `gt`, `gte`, `lt`, `lte` |
| `{"round": x, "to": 100, "mode": "down"}` | round to a unit (`down`, `up`, `nearest`) |
| `{"quadratic": {"of": x, "offset": o, "scale": s, "a": .., "b": .., "c": ..}}` | (a·y + b)·y + c with y = (x − o)/s — Germany's tariff |
| `{"status": {"single": a, "married": b}}` | pick by filing status (works for numbers, bracket tables and lookups) |
| `{"option": "county", "cases": {"marion": a, "default": b}}` | pick by any option |

Unknown keys are an error, so a typo fails the check instead of being ignored.

## Coverage (October 2026)

- **UK**: England/Wales/NI and Scotland, 2026/27.
- **US**: federal and FICA, all 50 states and DC, state payroll programs,
  New York City; Indiana and Maryland county taxes as options. Rules
  transcribed from PolicyEngine US and compared against PolicyEngine's own
  calculator from $30k to $1M (each state's tests record the result).
- **Europe**: Germany, France, Spain (Madrid, Catalonia), Italy, Netherlands,
  Ireland, Portugal, Austria, Norway, Denmark, Sweden.
- **Asia-Pacific**: Australia, New Zealand, India, Japan.

Not yet added: Belgium, Switzerland, Luxembourg, Finland — key 2026 figures
could not be confirmed from reachable sources; see the commit history for
what was missing.

No file has `lastVerified` set: none has yet been checked by a person against
its primary source.
