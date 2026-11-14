#!/usr/bin/env node
/* Working days and UK bank holidays:

       /working-days/                   calculator (working days between two dates)
       /working-days/2027/              bank holidays and working days in each month
       /working-days/2027/january/      one month

       node tools/build-working-days-pages.js

   Bank holidays come from GOV.UK's official list, saved unmodified in
   data/holidays/gov-uk-bank-holidays.json (re-download it from
   https://www.gov.uk/bank-holidays.json and re-run; the monthly check does).
   Pages are made for each full year it covers from last year on. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const related = require("./related.js");
const W = require("../working-days.js");
const { esc, SITE } = site;

const RAW = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/holidays/gov-uk-bank-holidays.json"), "utf8"));
const REG = Object.keys(W.REGIONS);
const HOL = {};
REG.forEach((r) => { HOL[r] = RAW[r].events.map((e) => ({ date: e.date, title: e.title.replace(/’/g, "'"), sub: /substitute/i.test(e.notes || "") })).sort((a, b) => (a.date < b.date ? -1 : 1)); });
const all = REG.flatMap((r) => HOL[r].map((h) => h.date)).sort();
const yearsInData = [...new Set(all.map((d) => +d.slice(0, 4)))];
const THIS_YEAR = +site.TODAY.slice(0, 4);
/* a year is complete when England and Wales has its usual 8 (or more) */
const YEARS = yearsInData.filter((y) => y >= THIS_YEAR - 1 && HOL["england-and-wales"].filter((h) => h.date.startsWith(y + "-")).length >= 8);
const RANGE = [yearsInData[0] + "-01-01", YEARS[YEARS.length - 1] + "-12-31"];
const BASE = "/working-days/";
const mslug = (m) => W.MONTHS[m].toLowerCase();
const short = (d) => W.long(d).replace(/ \d{4}$/, "");
const inYear = (r, y) => HOL[r].filter((h) => h.date.startsWith(y + "-"));
const monthCount = (r, y, m) => W.count(W.first(y, m), W.lastDay(y, m), HOL[r]);
const andList = (a) => (a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1]);
const SRC = 'Bank holidays from <a href="https://www.gov.uk/bank-holidays" rel="noopener">GOV.UK</a>.';
const holTitle = (h) => esc(h.title) + (h.sub ? " (substitute day)" : "");

function tool(from, to, region, fromToday) {
  const r = W.count(from, to, HOL[region]);
  const data = { _range: RANGE };
  REG.forEach((k) => { data[k] = HOL[k].map((h) => ({ date: h.date, title: h.title + (h.sub ? " (substitute day)" : "") })); });
  return `    <main class="tool" id="wd-tool"${fromToday ? ' data-from-today="1"' : ""}>
      <div class="field-row">
        <div class="field"><label for="wd-from">From</label><input type="date" id="wd-from" value="${from}"></div>
        <div class="field"><label for="wd-to">To</label><input type="date" id="wd-to" value="${to}"></div>
      </div>
      <div class="field"><label for="wd-region">Bank holidays in</label><select id="wd-region">${REG.map((k) => `<option value="${k}"${k === region ? " selected" : ""}>${W.REGIONS[k]}</option>`).join("")}</select></div>
      <p class="tool-hint" id="wd-error" role="alert" style="color: var(--bad); display: none;"></p>
      <div class="result-box" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="wd-working">${r.working}</div>
          <div class="label">working days, counting both dates</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row"><span class="r-label">Calendar days</span><span class="r-value" id="wd-calendar">${r.calendar}</span></div>
          <div class="result-row"><span class="r-label">Weekend days</span><span class="r-value" id="wd-weekend">${r.weekend}</span></div>
          <div class="result-row"><span class="r-label">Bank holidays</span><span class="r-value" id="wd-bh" style="text-align:right;">${r.holidays.length ? r.holidays.length + " — " + r.holidays.map((h) => `${esc(h.title)}: ${short(h.date)}`).join("; ") : "None"}</span></div>
          <div class="result-row"><span class="r-label">Working hours</span><span class="r-value" id="wd-hours">${(r.working * 7.5).toLocaleString("en-GB")} hours at 7.5 a day, ${(r.working * 8).toLocaleString("en-GB")} at 8</span></div>
        </div>
      </div>
      <p class="tool-hint" style="margin-top:12px;">Monday to Friday, less bank holidays. ${SRC}</p>
    </main>
  <script type="application/json" id="wd-holidays">${JSON.stringify(data)}</script>
`;
}

function monthGrid(y, linkMonths) {
  const rows = W.MONTHS.map((name, m) => [linkMonths ? `<a href="${BASE}${y}/${mslug(m)}/">${name}</a>` : name].concat(REG.map((r) => String(monthCount(r, y, m).working))));
  const tot = REG.map((r) => String(W.count(`${y}-01-01`, `${y}-12-31`, HOL[r]).working));
  rows.push(["<strong>Total</strong>"].concat(tot.map((t) => `<strong>${t}</strong>`)));
  return site.table(["Month", "England &amp; Wales", "Scotland", "N. Ireland"], rows, 440);
}

function holidayTable(y) {
  /* one row per date, ticking the nations it applies to */
  const dates = [...new Set(REG.flatMap((r) => inYear(r, y).map((h) => h.date)))].sort();
  const rows = dates.map((d) => {
    const h = REG.map((r) => inYear(r, y).find((x) => x.date === d));
    const any = h.find(Boolean);
    return [esc(short(d)), holTitle(any)].concat(h.map((x) => (x ? "✓" : "—")));
  });
  return site.table(["Date", "Bank holiday", "Eng &amp; Wales", "Scot", "NI"], rows, 520);
}

function yearPage(y) {
  const url = SITE + `${BASE}${y}/`;
  const ew = W.count(`${y}-01-01`, `${y}-12-31`, HOL["england-and-wales"]);
  const sc = W.count(`${y}-01-01`, `${y}-12-31`, HOL.scotland), ni = W.count(`${y}-01-01`, `${y}-12-31`, HOL["northern-ireland"]);
  const title = `UK Bank Holidays and Working Days in ${y} — ${ew.working} Working Days`;
  const desc = `${y} has ${ew.working} working days in England and Wales, ${sc.working} in Scotland and ${ni.working} in Northern Ireland. Every bank holiday date and the working days in each month.`;
  const q = [
    [`How many working days are there in ${y}?`, `${ew.working} in England and Wales, ${sc.working} in Scotland and ${ni.working} in Northern Ireland: ${ew.calendar - ew.weekend} weekdays, less ${ew.holidays.length}, ${sc.holidays.length} or ${ni.holidays.length} bank holidays falling on weekdays.`],
    [`How many bank holidays are there in ${y}?`, `${inYear("england-and-wales", y).length} in England and Wales, ${inYear("scotland", y).length} in Scotland and ${inYear("northern-ireland", y).length} in Northern Ireland, including substitute days when a holiday falls at a weekend.`],
    [`When are the bank holidays in ${y}?`, `In England and Wales: ${inYear("england-and-wales", y).map((h) => `${h.title} ${short(h.date)}`).join("; ")}.`]
  ];
  const ld = [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], ["Working Days", SITE + BASE], [String(y), url]]), site.faqLd(q)];
  const other = YEARS.filter((x) => x !== y).map((x) => `<a href="${BASE}${x}/">${x}</a>`).join(" ");
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="${BASE}">← Working days calculator</a>
      <h1 class="page-title">Bank holidays and working days in ${y}</h1>
      <p class="page-subtitle">${ew.working} working days in England and Wales, ${sc.working} in Scotland, ${ni.working} in Northern Ireland.</p>
    </header>

    <main class="tool">
      <p class="tool-section-title">Bank holidays in ${y}</p>
${holidayTable(y)}      <p class="tool-hint" style="margin-top:12px;">When a bank holiday falls on a weekend, a substitute weekday is usually given. ${SRC}</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">Working days in each month of ${y}</p>
${monthGrid(y, true)}      <p class="tool-hint" style="margin-top:12px;">Monday to Friday, less bank holidays. Count any dates with the <a href="${BASE}">working days calculator</a>.</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">Frequently asked questions</p>
${site.faqHtml(q)}    </main>

    <div class="hub-group-title" style="margin-top:28px;">Other years</div>
    <p class="salary-links">${other}</p>

${site.FOOTER}
  </div>
</body>
</html>
`;
}

function monthPage(y, m) {
  const name = W.MONTHS[m];
  const url = SITE + `${BASE}${y}/${mslug(m)}/`;
  const c = {};
  REG.forEach((r) => { c[r] = monthCount(r, y, m); });
  const ew = c["england-and-wales"];
  const same = REG.every((r) => c[r].working === ew.working);
  const title = `How Many Working Days in ${name} ${y}? — ${ew.working}${same ? "" : " in England & Wales"}`;
  const desc = `${name} ${y} has ${ew.working} working days in England and Wales${same ? ", Scotland and Northern Ireland" : `, ${c.scotland.working} in Scotland and ${c["northern-ireland"].working} in Northern Ireland`}: ${ew.calendar} days less ${ew.weekend} weekend days${ew.holidays.length ? ` and ${ew.holidays.length} bank holiday${ew.holidays.length > 1 ? "s" : ""} (${andList(ew.holidays.map((h) => h.title))})` : ", with no bank holidays"}.`;
  const holRows = [...new Set(REG.flatMap((r) => c[r].holidays.map((h) => h.date)))].sort().map((d) => {
    const h = REG.map((r) => c[r].holidays.find((x) => x.date === d));
    return [esc(short(d)), holTitle(h.find(Boolean))].concat(h.map((x) => (x ? "✓" : "—")));
  });
  /* weekend bank holidays aren't days off; note them separately */
  const q = [
    [`How many working days are in ${name} ${y}?`, same ? `${ew.working} in every part of the UK: ${ew.calendar} days less ${ew.weekend} weekend days${ew.holidays.length ? ` and ${ew.holidays.length} bank holiday${ew.holidays.length > 1 ? "s" : ""}` : ""}.` : REG.map((r) => `${W.REGIONS[r]}: ${c[r].working}`).join("; ") + "."],
    [`How many working hours are in ${name} ${y}?`, `${(ew.working * 7.5).toLocaleString("en-GB")} hours on a 7.5-hour day or ${(ew.working * 8).toLocaleString("en-GB")} on an 8-hour day (${ew.working} days, England and Wales).`],
    [`Are there any bank holidays in ${name} ${y}?`, holRows.length ? REG.filter((r) => c[r].holidays.length).map((r) => `${W.REGIONS[r]}: ${c[r].holidays.map((h) => `${h.title} on ${short(h.date)}`).join(", ")}`).join(". ") + "." : `No — there are no weekday bank holidays in ${name} ${y} anywhere in the UK.`]
  ];
  const ld = [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], ["Working Days", SITE + BASE], [String(y), SITE + `${BASE}${y}/`], [name, url]]), site.faqLd(q)];
  const months = W.MONTHS.map((n, i) => (i === m ? `<strong>${n}</strong>` : `<a href="${BASE}${y}/${mslug(i)}/">${n}</a>`)).join(" ");
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="${BASE}${y}/">← Working days in ${y}</a>
      <h1 class="page-title">Working days in ${name} ${y}</h1>
      <p class="page-subtitle">${ew.working} working days${same ? " across the UK" : " in England and Wales"} — ${ew.calendar} days, less ${ew.weekend} at the weekend${ew.holidays.length ? ` and ${ew.holidays.length} bank holiday${ew.holidays.length > 1 ? "s" : ""}` : ""}.</p>
    </header>

    <main class="tool">
${site.table(["", "Working days", "Bank holidays", "Hours (7.5 h day)"], REG.map((r) => [W.REGIONS[r], `<strong>${c[r].working}</strong>`, String(c[r].holidays.length), (c[r].working * 7.5).toLocaleString("en-GB")]), 420)}${holRows.length ? `      <p class="tool-section-title" style="margin-top:22px;">Bank holidays in ${name} ${y}</p>
${site.table(["Date", "Bank holiday", "Eng &amp; Wales", "Scot", "NI"], holRows, 520)}` : ""}      <p class="tool-hint" style="margin-top:12px;">Monday to Friday, less bank holidays. ${SRC}</p>
    </main>

${tool(W.first(y, m), W.lastDay(y, m), "england-and-wales", false)}
    <main class="tool">
      <p class="tool-section-title">Frequently asked questions</p>
${site.faqHtml(q)}    </main>

    <div class="hub-group-title" style="margin-top:28px;">Other months in ${y}</div>
    <p class="salary-links">${months}</p>

${site.FOOTER}
  </div>
  <script src="/working-days.js"></script>
</body>
</html>
`;
}

function hub() {
  const url = SITE + BASE;
  const xmas = `${THIS_YEAR}-12-24`;
  const from = site.TODAY <= xmas ? site.TODAY : `${THIS_YEAR + 1}-01-01`;
  const to = site.TODAY <= xmas ? xmas : `${THIS_YEAR + 1}-12-24`;
  const r = W.count(from, to, HOL["england-and-wales"]);
  const title = "Working Days Calculator — UK Working Days Between Two Dates";
  const desc = "Count the working days between any two dates, less weekends and the UK bank holidays for England and Wales, Scotland or Northern Ireland — plus working days in every month and the bank holiday dates.";
  const q = [
    ["How do I count working days between two dates?", "Count the weekdays (Monday to Friday) between them, then take off any bank holidays that fall on a weekday. The calculator does this for England and Wales, Scotland or Northern Ireland, counting both the first and last date."],
    ["How many working days until Christmas?", `From ${W.long(from)} to Christmas Eve, ${W.long(to)}, there are ${r.working} working days in England and Wales (counting both days). The calculator starts from today when you open it.`],
    ["Are bank holidays the same across the UK?", "No. Scotland has 2 January and St Andrew's Day, and its summer bank holiday is at the start of August rather than the end; Northern Ireland adds St Patrick's Day and the Battle of the Boyne (Orangemen's Day)."],
    ["How many working days are there in a year?", YEARS.filter((y) => y >= THIS_YEAR).map((y) => `${y}: ${W.count(`${y}-01-01`, `${y}-12-31`, HOL["england-and-wales"]).working}`).join(", ") + " in England and Wales — usually between 250 and 254."]
  ];
  const ld = [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], ["Working Days", url]]),
    { "@context": "https://schema.org", "@type": "WebApplication", name: "Working Days Calculator", url, applicationCategory: "BusinessApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } }, site.faqLd(q)];
  const years = YEARS.map((y) => `<a href="${BASE}${y}/">Bank holidays and working days ${y}</a>`).join(" ");
  const nextY = YEARS.find((y) => y > THIS_YEAR) || THIS_YEAR;
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="/">← All calculators</a>
      <h1 class="page-title">Working days calculator</h1>
      <p class="page-subtitle">Working days between two dates, less weekends and UK bank holidays.</p>
    </header>

${tool(from, to, "england-and-wales", true)}
    <main class="tool">
      <p class="tool-section-title">Working days in each month of ${nextY}</p>
${monthGrid(nextY, true)}      <p class="tool-section-title" style="margin-top:22px;">By year</p>
      <p class="salary-links">${years}</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">Frequently asked questions</p>
${site.faqHtml(q)}    </main>

${related.block(BASE)}
${site.FOOTER}
  </div>
  <script src="/working-days.js"></script>
</body>
</html>
`;
}

/* Checks against GOV.UK's published 2027 list and a hand count:
   January 2027 in England and Wales = 21 weekdays less New Year's Day = 20;
   Scotland also loses its 2nd January substitute (Monday 4 January) = 19. */
const chk = [[monthCount("england-and-wales", 2027, 0).working, 20], [monthCount("scotland", 2027, 0).working, 19], [W.count("2027-12-01", "2027-12-31", HOL["england-and-wales"]).working, 21]];
chk.forEach(([got, want], i) => { if (got !== want) throw new Error(`working days check ${i}: ${got} != ${want}`); });

const urls = [];
site.write("working-days", hub());
YEARS.forEach((y) => {
  site.write(`working-days/${y}`, yearPage(y)); urls.push([`${BASE}${y}/`, "0.6"]);
  W.MONTHS.forEach((n, m) => { site.write(`working-days/${y}/${mslug(m)}`, monthPage(y, m)); urls.push([`${BASE}${y}/${mslug(m)}/`, "0.5"]); });
});
site.sitemapBlock("working days pages", "tools/build-working-days-pages.js", urls);
console.log(`built ${urls.length + 1} working days pages for ${YEARS.join(", ")} (bank holidays to ${RANGE[1]})`);
