#!/usr/bin/env node
/* Working days and UK bank holidays:

       /working-days/                   calculator (working days between two dates)
       /working-days/2027/              bank holidays and working days in each month
       /working-days/2027/january/      one month

       node tools/build-working-days-pages.js

   Bank holidays come from GOV.UK's official list, saved unmodified in
   data/holidays/gov-uk-bank-holidays.json (re-download it from
   https://www.gov.uk/bank-holidays.json and re-run; the monthly check does).
   Pages are made for each full year it covers from last year on, and for
   the years after it up to four years ahead, from the expected dates
   (tools/lib/uk-bank-holiday-rules.js), marked as expected. */
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
const PUBLISHED = yearsInData.filter((y) => HOL["england-and-wales"].filter((h) => h.date.startsWith(y + "-")).length >= 8);

/* Beyond GOV.UK's list (it runs about two years ahead), the expected dates
   from the usual pattern (tools/lib/uk-bank-holiday-rules.js), up to four
   years ahead, marked as expected wherever they're shown. The pattern must
   reproduce every year GOV.UK has published, except years with a one-off
   (a coronation, jubilee or moved May bank holiday, which GOV.UK gives its
   own title); if it doesn't, the build stops. When GOV.UK publishes a year,
   the monthly download replaces the expected dates with the official ones. */
const RULES_UK = require("./lib/uk-bank-holiday-rules.js");
const STANDARD = new Set(["New Year's Day", "2nd January", "Good Friday", "Easter Monday", "Early May bank holiday", "Spring bank holiday", "Summer bank holiday",
  "St Patrick's Day", "Battle of the Boyne (Orangemen's Day)", "St Andrew's Day", "Christmas Day", "Boxing Day"]);
REG.forEach((r) => PUBLISHED.forEach((y) => {
  const key = (h) => h.date + " " + h.title + (h.sub ? " *" : "");
  const gov = inYearOf(r, y), exp = RULES_UK.expected(r, y);
  const g = new Set(gov.map(key)), e = new Set(exp.map(key));
  const differs = [...g].some((k) => !e.has(k)) || [...e].some((k) => !g.has(k));
  if (differs && gov.every((h) => STANDARD.has(h.title))) throw new Error(`bank holiday pattern doesn't match GOV.UK for ${r} ${y}: update tools/lib/uk-bank-holiday-rules.js`);
}));
function inYearOf(r, y) { return HOL[r].filter((h) => h.date.startsWith(y + "-")); }
const LAST_PUBLISHED = PUBLISHED[PUBLISHED.length - 1];
const AHEAD_TO = THIS_YEAR + 4;
for (let y = LAST_PUBLISHED + 1; y <= AHEAD_TO; y++) REG.forEach((r) => {
  HOL[r] = HOL[r].filter((h) => !h.date.startsWith(y + "-")).concat(RULES_UK.expected(r, y).map((h) => ({ ...h, expected: true })));
});
REG.forEach((r) => HOL[r].sort((a, b) => (a.date < b.date ? -1 : 1)));
const isExpected = (y) => y > LAST_PUBLISHED;
const YEARS = [];
for (let y = THIS_YEAR - 1; y <= AHEAD_TO; y++) if (PUBLISHED.includes(y) || isExpected(y)) YEARS.push(y);
const RANGE = [yearsInData[0] + "-01-01", YEARS[YEARS.length - 1] + "-12-31"];
const BASE = "/working-days/";
const mslug = (m) => W.MONTHS[m].toLowerCase();
const short = (d) => W.long(d).replace(/ \d{4}$/, "");
const inYear = (r, y) => HOL[r].filter((h) => h.date.startsWith(y + "-"));
const monthCount = (r, y, m) => W.count(W.first(y, m), W.lastDay(y, m), HOL[r]);
const andList = (a) => (a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1]);
const SRC = 'Bank holidays from <a href="https://www.gov.uk/bank-holidays" rel="noopener">GOV.UK</a>.';
const AHEAD = (y) => `GOV.UK hasn't published the bank holidays for ${y} yet, so these are the expected dates: the usual pattern, which matches every year GOV.UK has published apart from one-offs like a coronation or jubilee. They'll change to GOV.UK's official list as soon as it's out.`;
const src = (y) => (isExpected(y) ? esc(AHEAD(y)) : SRC);
/* a notice at the top of a page for a year GOV.UK hasn't published */
const aheadNote = (y) => (isExpected(y) ? `      <p class="tool-hint" style="margin-top:10px;"><strong>Expected dates.</strong> ${esc(AHEAD(y))}</p>\n` : "");
const holTitle = (h) => esc(h.title) + (h.sub ? " (substitute day)" : "") + (h.expected ? " (expected)" : "");

/* ---------- paydays ---------- */
const isWorking = (iso, r) => { const d = new Date(W.parse(iso)).getUTCDay(); return d !== 0 && d !== 6 && !HOL[r].some((h) => h.date === iso); };
const step = (iso, by) => W.iso(W.parse(iso) + by * 86400000);
/* the working day on or before / after a date */
const onOrBefore = (iso, r) => { while (!isWorking(iso, r)) iso = step(iso, -1); return iso; };
const onOrAfter = (iso, r) => { while (!isWorking(iso, r)) iso = step(iso, 1); return iso; };
const lastWorking = (y, m, r) => onOrBefore(W.lastDay(y, m), r);
const firstWorking = (y, m, r) => onOrAfter(W.first(y, m), r);
const dayOf = (y, m, d) => W.iso(Date.UTC(y, m, d));
const lastFriday = (y, m) => { let iso = W.lastDay(y, m); while (new Date(W.parse(iso)).getUTCDay() !== 5) iso = step(iso, -1); return iso; };
/* payday rules: the date it's due; paid on the working day before if that isn't one */
const RULES = [
  ["Last working day", (y, m) => W.lastDay(y, m)],
  ["Last Friday", lastFriday],
  ["28th", (y, m) => dayOf(y, m, 28)],
  ["25th", (y, m) => dayOf(y, m, 25)],
  ["20th", (y, m) => dayOf(y, m, 20)],
  ["15th", (y, m) => dayOf(y, m, 15)]
];
const paid = (rule, y, m, r) => onOrBefore(rule[1](y, m), r);
const dm = (iso) => { const d = new Date(W.parse(iso)); return `${W.DAYS[d.getUTCDay()].slice(0, 3)} ${d.getUTCDate()} ${W.MONTHS[d.getUTCMonth()].slice(0, 3)}`; };
const PAY_NOTE = "When payday falls on a weekend or bank holiday, most employers pay on the working day before — but it's set by your contract, so check with your employer. December pay is often earlier still, before Christmas.";

function paydayPage(y) {
  const url = SITE + `${BASE}${y}/payday-calendar/`;
  const r = "england-and-wales";
  const moved = W.MONTHS.map((n, m) => paid(RULES[3], y, m, r) !== RULES[3][1](y, m)).filter(Boolean).length;
  const title = site.fitTitle(`Payday Calendar ${y} — UK Pay Dates When Payday Falls on a Weekend`, `Payday Calendar ${y} — UK Pay Dates for Weekends & Holidays`);
  const desc = `When you'll be paid in each month of ${y} if payday is the last working day, the last Friday, or the 15th, 20th, 25th or 28th — moved to the working day before for weekends and bank holidays.`;
  const rows = W.MONTHS.map((n, m) => [`<a href="${BASE}${y}/${mslug(m)}/">${n}</a>`].concat(RULES.map((rule) => {
    const due = rule[1](y, m), got = paid(rule, y, m, r);
    return got === due || rule[0] === "Last working day" || rule[0] === "Last Friday" && isWorking(due, r) ? dm(got) : `<strong>${dm(got)}</strong>`;
  })));
  const diffs = [];
  W.MONTHS.forEach((n, m) => ["scotland", "northern-ireland"].forEach((o) => RULES.forEach((rule) => {
    const a = paid(rule, y, m, r), b = paid(rule, y, m, o);
    if (a !== b) diffs.push(`${W.REGIONS[o]}, ${rule[0].toLowerCase()} in ${n}: ${dm(b)} (not ${dm(a)})`);
  })));
  const lw = W.MONTHS.map((n, m) => `${n} ${dm(lastWorking(y, m, r)).replace(/ \w+$/, "")}`);
  const q = [
    [`When is payday in ${y} if I'm paid on the last working day?`, `England and Wales: ${W.MONTHS.map((n, m) => `${n} — ${W.long(lastWorking(y, m, r)).replace(/ \d{4}$/, "")}`).join("; ")}.`],
    [`What if payday falls on a weekend?`, PAY_NOTE],
    [`When is the 25th paid early in ${y}?`, moved ? `${W.MONTHS.filter((n, m) => paid(RULES[3], y, m, r) !== RULES[3][1](y, m)).map((n) => { const m = W.MONTHS.indexOf(n); return `${n} (${W.long(paid(RULES[3], y, m, r)).replace(/ \d{4}$/, "")})`; }).join(", ")} — the 25th falls on a weekend or bank holiday in those months.` : `Never — the 25th is a working day in every month of ${y}.`]
  ];
  const ld = [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], ["Working Days", SITE + BASE], [String(y), SITE + `${BASE}${y}/`], ["Payday calendar", url]]), site.faqLd(q)];
  const other = YEARS.filter((x) => x !== y).map((x) => `<a href="${BASE}${x}/payday-calendar/">Payday calendar ${x}</a>`).join(" ");
  /* other countries' calendars for the same year (tools/build-payday-pages.js) */
  const abroad = [["us", "US"], ["canada", "Canada"], ["australia", "Australia"], ["new-zealand", "New Zealand"], ["ireland", "Ireland"]].filter(([c]) => fs.existsSync(path.join(site.ROOT, "payday-calendar", c, String(y), "index.html")))
    .map(([c, n]) => `<a href="/payday-calendar/${c}/${y}/">${n} ${y}</a>`).concat('<a href="/payday-calendar/">All payday calendars</a>')
    /* the two tax years this calendar year spans (tools/build-tax-week-pages.js) */
    .concat([y - 1, y].map((t) => `${t}-${String(t + 1).slice(2)}`).filter((t) => fs.existsSync(path.join(site.ROOT, "tax-week-calendar", t, "index.html")))
      .map((t) => `<a href="/tax-week-calendar/${t}/">Tax weeks ${t.replace("-", "/")}</a>`)).join(" ");
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="${BASE}${y}/">← Working days in ${y}</a>
      <h1 class="page-title">Payday calendar ${y}</h1>
      <p class="page-subtitle">When you'll be paid each month, with paydays that fall on a weekend or bank holiday moved to the working day before.</p>
${aheadNote(y)}    </header>

    <main class="tool">
      <h2 class="tool-section-title">If you're paid on the…</h2>
${site.table(["Month"].concat(RULES.map((x) => x[0])), rows, 640)}      <p class="tool-hint" style="margin-top:12px;">Bold dates are earlier than usual because the normal day is a weekend or bank holiday. England and Wales bank holidays.${diffs.length ? " In Scotland and Northern Ireland: " + esc(diffs.join("; ")) + "." : " Scotland and Northern Ireland are the same."} ${src(y)}</p>
      <p class="tool-hint">${esc(PAY_NOTE)}</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}    </main>

${XMAS_YEARS.includes(y) ? `    <p class="tool-hint" style="margin-top:18px;">December and January: <a href="${XMAS(y)}">Christmas payday ${y}</a>, with the gap to January's payday.</p>
` : ""}    <div class="hub-group-title" style="margin-top:28px;">Other years</div>
    <p class="salary-links">${other}</p>
    <div class="hub-group-title" style="margin-top:18px;">Other countries and tax weeks</div>
    <p class="salary-links">${abroad}</p>

${site.FOOTER}
  </div>
</body>
</html>
`;
}

/* "When do I get paid in December?" — December pay for each rule, the
   January payday after it and the gap between them (the long January),
   with the Christmas and New Year bank holidays. One page per year that
   has the next year's bank holidays too. */
const XMAS = (y) => `${BASE}${y}/christmas-payday/`;
const XMAS_YEARS = YEARS.filter((y) => y >= THIS_YEAR && YEARS.includes(y + 1));
const daysBetween = (a, b) => Math.round((W.parse(b) - W.parse(a)) / 86400000);
function christmasPage(y) {
  const url = SITE + XMAS(y), r = "england-and-wales";
  const rows = RULES.map((rule) => {
    const dec = paid(rule, y, 11, r), jan = paid(rule, y + 1, 0, r), due = rule[1](y, 11);
    return [rule[0], dec === due ? dm(dec) : `<strong>${dm(dec)}</strong>`, dm(jan), `${daysBetween(dec, jan)} days`];
  });
  const lw = paid(RULES[0], y, 11, r), lwJan = paid(RULES[0], y + 1, 0, r), lf = paid(RULES[1], y, 11, r);
  const p25 = paid(RULES[3], y, 11, r);
  const hols = inYear(r, y).filter((h) => h.date >= `${y}-12-20`).concat(HOL[r].filter((h) => h.date.startsWith(`${y + 1}-01-0`)));
  const scotJan = HOL.scotland.filter((h) => h.date.startsWith(`${y + 1}-01-0`) && !hols.some((x) => x.date === h.date));
  const holRows = hols.map((h) => [W.long(h.date), holTitle(h)]).concat(scotJan.map((h) => [W.long(h.date), holTitle(h) + " (Scotland only)"]));
  const longest = rows.reduce((a, b) => (parseInt(b[3]) > parseInt(a[3]) ? b : a));
  const q = [
    [`When do I get paid in December ${y}?`, `If you're paid on the last working day, ${W.long(lw).replace(/ \d{4}$/, "")}; the last Friday, ${W.long(lf).replace(/ \d{4}$/, "")}; the 25th, ${W.long(p25).replace(/ \d{4}$/, "")}${p25 !== RULES[3][1](y, 11) ? ", because Christmas Day is a bank holiday" : ""}. Many employers pay earlier in December, before Christmas, so check your payslip or ask payroll.`],
    [`When is the January ${y + 1} payday?`, `On the last working day it's ${W.long(lwJan)}: ${daysBetween(lw, lwJan)} days after December's. Paid on the ${longest[0].toLowerCase()} rule, the gap is ${longest[3]}.`],
    [`Why does January feel so long?`, `Because December pay usually comes before Christmas and January's at the end of the month, and Christmas spending lands in between. If your December pay comes early, the gap to January's payday is longer still: worth planning the budget for it.`],
    [`Is Christmas Eve a bank holiday?`, `No: Christmas Eve and New Year's Eve aren't bank holidays anywhere in the UK, so they're normal working days for payday. ${andList(holRows.map((h) => h[0].replace(/ \d{4}$/, "")))} are.`]
  ];
  const title = site.fitTitle(`Christmas Payday ${y} — When You'll Be Paid in December and January`, `Christmas Payday ${y} — December & January Pay Dates`);
  const desc = `When December ${y} pay lands for each payday rule, the January ${y + 1} payday after it and the gap between them, with the Christmas and New Year bank holidays.`;
  const ld = [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], ["Working Days", SITE + BASE], [String(y), SITE + `${BASE}${y}/`], ["Christmas payday", url]]), site.faqLd(q)];
  const benefits = fs.existsSync(path.join(site.ROOT, "benefit-payment-dates", String(y), "index.html")) ? ` <a href="/benefit-payment-dates/${y}/">Benefit and pension payment dates ${y}</a>` : "";
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="${BASE}${y}/payday-calendar/">← Payday calendar ${y}</a>
      <h1 class="page-title">Christmas payday ${y}</h1>
      <p class="page-subtitle">When you'll be paid in December ${y}, when January's payday comes, and how long you'll need to make it last.</p>
${aheadNote(y)}${aheadNote(y + 1)}    </header>

    <main class="tool">
      <h2 class="tool-section-title">December and January paydays</h2>
${site.table(["If you're paid on the…", `December ${y}`, `January ${y + 1}`, "Gap"], rows, 520)}      <p class="tool-hint" style="margin-top:12px;">Bold dates are earlier than usual because the normal day is a weekend or bank holiday. England and Wales; Scotland's extra 2 January bank holiday doesn't move any of these. ${src(y)}</p>
      <p class="tool-hint">Many employers pay earlier still in December, before Christmas: if yours does, the gap to January is longer than shown. ${esc(PAY_NOTE.replace(/ December pay is often earlier still, before Christmas\.$/, ""))}</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">Bank holidays over Christmas and New Year</h2>
${site.table(["Date", "Bank holiday"], holRows, 360)}      <p class="tool-hint" style="margin-top:12px;">Christmas Eve and New Year's Eve are normal working days.</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}    </main>

    <div class="hub-group-title" style="margin-top:28px;">More dates</div>
    <p class="salary-links"><a href="${BASE}${y}/payday-calendar/">Payday calendar ${y}</a> <a href="${BASE}${y}/december/">Working days in December ${y}</a>${benefits} ${XMAS_YEARS.filter((x) => x !== y).map((x) => `<a href="${XMAS(x)}">Christmas payday ${x}</a>`).join(" ")} <a href="/christmas-savings-calculator/">Christmas savings calculator</a></p>

${site.FOOTER}
  </div>
</body>
</html>
`;
}

function tool(from, to, region, fromToday) {
  const r = W.count(from, to, HOL[region]);
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
${aheadNote(y)}    </header>

    <main class="tool">
      <h2 class="tool-section-title">Bank holidays in ${y}</h2>
${holidayTable(y)}      <p class="tool-hint" style="margin-top:12px;">When a bank holiday falls on a weekend, a substitute weekday is usually given. ${src(y)}</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">Working days in each month of ${y}</h2>
${monthGrid(y, true)}      <p class="tool-hint" style="margin-top:12px;">Monday to Friday, less bank holidays. Count any dates with the <a href="${BASE}">working days calculator</a>. When you'll be paid each month: <a href="${BASE}${y}/payday-calendar/">payday calendar ${y}</a>.</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
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
  const title = site.fitTitle(`How Many Working Days in ${name} ${y}? — ${ew.working}${same ? "" : " in England & Wales"}`, `How Many Working Days in ${name} ${y}? — ${ew.working}${same ? "" : " (Eng & Wales)"}`);
  const desc = `${name} ${y} has ${ew.working} working days in England and Wales${same ? ", Scotland and Northern Ireland" : `, ${c.scotland.working} in Scotland and ${c["northern-ireland"].working} in Northern Ireland`}: ${ew.calendar} days less ${ew.weekend} weekend days${ew.holidays.length ? ` and ${ew.holidays.length} bank holiday${ew.holidays.length > 1 ? "s" : ""} (${andList(ew.holidays.map((h) => h.title))})` : ", with no bank holidays"}.`;
  const holRows = [...new Set(REG.flatMap((r) => c[r].holidays.map((h) => h.date)))].sort().map((d) => {
    const h = REG.map((r) => c[r].holidays.find((x) => x.date === d));
    return [esc(short(d)), holTitle(h.find(Boolean))].concat(h.map((x) => (x ? "✓" : "—")));
  });
  /* weekend bank holidays aren't days off; note them separately */
  const q = [
    [`How many working days are in ${name} ${y}?`, same ? `${ew.working} in every part of the UK: ${ew.calendar} days less ${ew.weekend} weekend days${ew.holidays.length ? ` and ${ew.holidays.length} bank holiday${ew.holidays.length > 1 ? "s" : ""}` : ""}.` : REG.map((r) => `${W.REGIONS[r]}: ${c[r].working}`).join("; ") + "."],
    [`What is the last working day of ${name} ${y}?`, `${W.long(lastWorking(y, m, "england-and-wales"))} in England and Wales${REG.every((r) => lastWorking(y, m, r) === lastWorking(y, m, "england-and-wales")) ? ", Scotland and Northern Ireland" : `; ${REG.slice(1).map((r) => `${W.REGIONS[r]}: ${W.long(lastWorking(y, m, r))}`).join("; ")}`}. The first working day is ${W.long(firstWorking(y, m, "england-and-wales"))}${firstWorking(y, m, "scotland") !== firstWorking(y, m, "england-and-wales") ? ` (${W.long(firstWorking(y, m, "scotland"))} in Scotland)` : ""}.`],
    [`How many working hours are in ${name} ${y}?`, `${(ew.working * 7.5).toLocaleString("en-GB")} hours on a 7.5-hour day or ${(ew.working * 8).toLocaleString("en-GB")} on an 8-hour day (${ew.working} days, England and Wales).`],
    [`Are there any bank holidays in ${name} ${y}?`, holRows.length ? REG.filter((r) => c[r].holidays.length).map((r) => `${W.REGIONS[r]}: ${c[r].holidays.map((h) => `${h.title} on ${short(h.date)}`).join(", ")}`).join(". ") + "." : `No — there are no weekday bank holidays in ${name} ${y} anywhere in the UK.`]
  ];
  const ld = [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], ["Working Days", SITE + BASE], [String(y), SITE + `${BASE}${y}/`], [name, url]]), site.faqLd(q)];
  const months = W.MONTHS.map((n, i) => (i === m ? `<strong>${n}</strong>` : `<a href="${BASE}${y}/${mslug(i)}/">${n}</a>`)).join(" ");
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="${BASE}${y}/">← Working days in ${y}</a>
      <h1 class="page-title">Working days in ${name} ${y}</h1>
      <p class="page-subtitle">${ew.working} working days${same ? " across the UK" : " in England and Wales"} — ${ew.calendar} days, less ${ew.weekend} at the weekend${ew.holidays.length ? ` and ${ew.holidays.length} bank holiday${ew.holidays.length > 1 ? "s" : ""}` : ""}.</p>
${aheadNote(y)}    </header>

    <main class="tool">
${site.table(["", "Working days", "Bank holidays", "First working day", "Last working day"], REG.map((r) => [W.REGIONS[r], `<strong>${c[r].working}</strong>`, String(c[r].holidays.length), dm(firstWorking(y, m, r)), dm(lastWorking(y, m, r))]), 520)}${holRows.length ? `      <h2 class="tool-section-title" style="margin-top:22px;">Bank holidays in ${name} ${y}</h2>
${site.table(["Date", "Bank holiday", "Eng &amp; Wales", "Scot", "NI"], holRows, 520)}` : ""}      <p class="tool-hint" style="margin-top:12px;">Monday to Friday, less bank holidays: ${(ew.working * 7.5).toLocaleString("en-GB")} hours on a 7.5-hour day. When you'll be paid: <a href="${BASE}${y}/payday-calendar/">payday calendar ${y}</a>${fs.existsSync(path.join(site.ROOT, "benefit-payment-dates", String(y), "index.html")) ? `; benefits and pensions: <a href="/benefit-payment-dates/${y}/">benefit payment dates ${y}</a>` : ""}. ${src(y)}</p>
    </main>

${tool(W.first(y, m), W.lastDay(y, m), "england-and-wales", false)}
    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}    </main>

    <div class="hub-group-title" style="margin-top:28px;">Other months in ${y}</div>
    <p class="salary-links">${months}</p>

${site.FOOTER}
  </div>
  <script src="/bank-holidays.js"></script>
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
  const years = YEARS.map((y) => `<a href="${BASE}${y}/">Bank holidays and working days ${y}</a> <a href="${BASE}${y}/payday-calendar/">Payday calendar ${y}</a>`).join(" ") + ' <a href="/payday-calendar/">Payday calendars for other countries</a> <a href="/tax-week-calendar/">UK tax week calendar</a>';
  const nextY = YEARS.find((y) => y > THIS_YEAR) || THIS_YEAR;
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="/">← All calculators</a>
      <h1 class="page-title">Working days calculator</h1>
      <p class="page-subtitle">Working days between two dates, less weekends and UK bank holidays.</p>
    </header>

${tool(from, to, "england-and-wales", true)}
    <main class="tool">
      <h2 class="tool-section-title">Working days in each month of ${nextY}</h2>
${monthGrid(nextY, true)}      <h2 class="tool-section-title" style="margin-top:22px;">By year</h2>
      <p class="salary-links">${years}</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}    </main>

${related.block(BASE)}
${site.FOOTER}
  </div>
  <script src="/bank-holidays.js"></script>
  <script src="/working-days.js"></script>
</body>
</html>
`;
}

/* Checks against GOV.UK's published 2027 list and a hand count:
   January 2027 in England and Wales = 21 weekdays less New Year's Day = 20;
   Scotland also loses its 2nd January substitute (Monday 4 January) = 19. */
const chk = [[monthCount("england-and-wales", 2027, 0).working, 20], [monthCount("scotland", 2027, 0).working, 19], [W.count("2027-12-01", "2027-12-31", HOL["england-and-wales"]).working, 21]];
/* last working day of December 2027 (27 and 28 are substitute days; 31st is a Friday) and of April 2027 */
chk.push([lastWorking(2027, 11, "england-and-wales"), "2027-12-31"], [paid(RULES[3], 2027, 11, "england-and-wales"), "2027-12-24"], [paid(RULES[3], 2026, 11, "england-and-wales"), "2026-12-24"]);
chk.forEach(([got, want], i) => { if (got !== want) throw new Error(`working days check ${i}: ${got} != ${want}`); });

/* The bank holidays for the calculator, as one small file every page shares
   (and the browser caches) rather than a copy inside each page */
function holidaysScript() {
  const data = { _range: RANGE };
  REG.forEach((k) => { data[k] = HOL[k].map((h) => ({ date: h.date, title: h.title + (h.sub ? " (substitute day)" : "") + (h.expected ? " (expected)" : "") })); });
  return `/* UK bank holidays from GOV.UK (https://www.gov.uk/bank-holidays.json), then
   the expected dates for the years after it (tools/lib/uk-bank-holiday-rules.js).
   Generated by tools/build-working-days-pages.js — don't edit by hand. */
var UK_BANK_HOLIDAYS = ${JSON.stringify(data)};
`;
}
fs.writeFileSync(path.join(site.ROOT, "bank-holidays.js"), holidaysScript());

const urls = [];
site.write("working-days", hub());
YEARS.forEach((y) => {
  site.write(`working-days/${y}`, yearPage(y)); urls.push([`${BASE}${y}/`, "0.6"]);
  site.write(`working-days/${y}/payday-calendar`, paydayPage(y)); urls.push([`${BASE}${y}/payday-calendar/`, "0.6"]);
  if (XMAS_YEARS.includes(y)) { site.write(`working-days/${y}/christmas-payday`, christmasPage(y)); urls.push([XMAS(y), "0.6"]); }
  W.MONTHS.forEach((n, m) => { site.write(`working-days/${y}/${mslug(m)}`, monthPage(y, m)); urls.push([`${BASE}${y}/${mslug(m)}/`, "0.5"]); });
});
site.sitemapBlock("working days pages", "tools/build-working-days-pages.js", urls);
console.log(`built ${urls.length + 1} working days pages for ${YEARS.join(", ")} (bank holidays to ${RANGE[1]})`);
