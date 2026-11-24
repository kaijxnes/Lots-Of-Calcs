#!/usr/bin/env node
/* The homepage's "Popular right now" row: what people are about to look for,
   then the everyday regulars.

       node tools/build-popular.js                 for today
       POPULAR_DATE=2027-04-02 node tools/build-popular.js   to preview a date

   Each seasonal link has a window of the year it shows in (the turkey timer
   from mid-October to Christmas Day, salary and tax rates in January and
   around the UK's 6 April tax year, and so on). Of the links in season, the
   headline ones come first, then the ones whose window closes soonest, up to MAX_SEASONAL; the
   regulars fill the rest. A scheduled task runs this every two weeks, and
   the monthly update runs it too, so the row moves with the calendar. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const { esc } = site;

const TODAY = new Date((process.env.POPULAR_DATE || site.TODAY) + "T00:00:00Z");
const MAX_SEASONAL = 4, TOTAL = 9;
const DAY = 86400000;

/* dates that move */
function easter(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(y, month - 1, day));
}
const md = (m, d) => (y) => new Date(Date.UTC(y, m - 1, d));
const shift = (fn, n) => (y) => new Date(fn(y).getTime() + n * DAY);
const nth = (m, weekday, n) => (y) => { const first = new Date(Date.UTC(y, m - 1, 1)); return new Date(Date.UTC(y, m - 1, 1 + ((weekday - first.getUTCDay() + 7) % 7) + (n - 1) * 7)); };
const thanksgiving = nth(11, 4, 4);
const mothersDayUK = shift(easter, -21);
const fathersDay = nth(6, 0, 3);

/* [url, label, from(year), to(year), priority] — the window is inclusive and
   may cross New Year; priority 1 is a headline seasonal link, 2 a lesser one */
const SEASONAL = [
  ["/days-until/christmas/", "Days until Christmas", md(10, 1), md(12, 25), 1],
  ["/turkey-cooking-time/", "Turkey cooking time", md(10, 15), md(12, 25), 1],
  ["/days-until/thanksgiving/", "Days until Thanksgiving", md(11, 1), thanksgiving, 1],
  ["/days-until/black-friday/", "Days until Black Friday", md(11, 1), shift(thanksgiving, 1), 2],
  ["/days-until/halloween/", "Days until Halloween", md(10, 1), md(10, 31), 1],
  ["/days-until/bonfire-night/", "Days until Bonfire Night", md(10, 20), md(11, 5), 2],
  ["/days-until/new-year/", "Days until New Year", md(12, 1), md(12, 31), 2],
  ["/self-employed-tax-calculator/", "Self-employed tax", md(12, 1), md(1, 31), 1],
  ["/dry-january-calculator/", "Dry January savings", md(12, 26), md(1, 31), 2],
  ["/52-week-savings-challenge/", "52-week savings challenge", md(12, 26), md(1, 31), 2],
  ["/christmas-savings-calculator/", "Save for next Christmas", md(12, 26), md(2, 28), 2],
  ["/calorie-calculator/", "Calorie calculator", md(1, 1), md(1, 31), 2],
  ["/salary/", "Salary after tax", md(1, 1), md(1, 31), 1],
  ["/tax-rates/", "This year's tax rates", md(1, 1), md(1, 31), 1],
  ["/days-until/valentines-day/", "Days until Valentine's Day", md(1, 20), md(2, 14), 1],
  ["/heating-cost/", "Heating cost calculator", md(10, 1), md(2, 28), 2],
  ["/isa-vs-pension/", "ISA or pension?", md(2, 15), md(4, 5), 2],
  ["/days-until/mothers-day-uk/", "Days until Mother's Day", shift(mothersDayUK, -28), mothersDayUK, 1],
  ["/days-until/easter/", "Days until Easter", shift(easter, -42), easter, 1],
  ["/salary/", "Salary after tax", md(3, 20), md(4, 30), 1],
  ["/tax-rates/", "This year's tax rates", md(3, 20), md(4, 30), 1],
  ["/pay-rise-calculator/", "Pay rise calculator", md(3, 20), md(4, 30), 2],
  ["/grade/", "Grade calculator", md(5, 1), md(6, 30), 2],
  ["/degree-classification-calculator/", "Degree classification", md(5, 15), md(7, 31), 2],
  ["/days-until/fathers-day/", "Days until Father's Day", shift(fathersDay, -28), fathersDay, 1],
  ["/student-loan-calculator/", "Student loan calculator", md(8, 1), md(9, 30), 2],
  ["/christmas-savings-calculator/", "Christmas savings calculator", md(9, 1), md(11, 30), 2],
];
const REGULARS = [
  ["/salary/", "Salary after tax"], ["/cashback/", "Cashback calculator"], ["/percent/", "Percentages"],
  ["/mortgage-calculator/", "Mortgage calculator"], ["/convert/", "Unit conversions"], ["/tip/", "Tip calculator"],
  ["/loan/", "Loan repayments"], ["/date-diff/", "Days between dates"], ["/vat/", "VAT calculator"]
];

/* In season today? Returns the day its window closes, or null. A window that
   crosses New Year (from 26 Dec to 31 Jan) is tried from last year and this. */
function closes(from, to) {
  const y = TODAY.getUTCFullYear();
  for (const fy of [y - 1, y]) {
    const a = from(fy);
    let b = to(fy);
    if (b < a) b = to(fy + 1);
    if (TODAY >= a && TODAY <= b) return b;
  }
  return null;
}

function pick() {
  const seen = new Set(), out = [];
  SEASONAL.map(([u, t, f, to, pr]) => [u, t, closes(f, to), pr]).filter((x) => x[2]).sort((a, b) => a[3] - b[3] || a[2] - b[2])
    .forEach(([u, t]) => { if (out.length < MAX_SEASONAL && !seen.has(u)) { seen.add(u); out.push([u, t]); } });
  REGULARS.forEach(([u, t]) => { if (out.length < TOTAL && !seen.has(u)) { seen.add(u); out.push([u, t]); } });
  return out;
}

/* every link must be a real page */
[...SEASONAL, ...REGULARS].forEach(([u]) => { if (!fs.existsSync(path.join(site.ROOT, u, "index.html"))) throw new Error("no page at " + u); });

const links = pick();
const file = path.join(site.ROOT, "index.html");
const START = "    <!-- popular: generated by tools/build-popular.js -->\n", END = "    <!-- end popular -->\n";
const html = `    <section class="hub-popular" id="hub-popular" aria-labelledby="hub-popular-label">
      <p class="cat-browse-label" id="hub-popular-label">Popular right now</p>
      <p class="pill-links">${links.map(([u, t]) => `<a href="${u}">${esc(t)}</a>`).join(" ")}</p>
    </section>
`;
let s = fs.readFileSync(file, "utf8");
const OLD = "    <!-- popular: generated by tools/build-countdown-pages.js -->\n";
if (s.includes(OLD)) s = s.replace(OLD, START);
if (s.includes(START)) s = s.slice(0, s.indexOf(START)) + s.slice(s.indexOf(END) + END.length).replace(/^\n/, "");
const at = s.indexOf('    <section class="cat-browse"');
if (at < 0) throw new Error("homepage category section not found");
const next = s.slice(0, at) + START + html + END + "\n" + s.slice(at);
if (process.env.POPULAR_DATE) { console.log(TODAY.toISOString().slice(0, 10) + ": " + links.map((x) => x[1]).join(" · ")); process.exit(0); }
fs.writeFileSync(file, next);
console.log("popular right now: " + links.map((x) => x[1]).join(" · "));
