#!/usr/bin/env node
/* Payday calendars for other countries, and a hub for all of them:

       /payday-calendar/                 every country and year
       /payday-calendar/us/2027/         US, from the Federal Reserve's holidays
       /payday-calendar/ireland/2027/    Ireland, from its public holiday rules

       node tools/build-payday-pages.js

   The UK's are part of the working days pages (/working-days/2027/payday-calendar/).

   US: the Federal Reserve publishes the days its banks close five years
   ahead (data/holidays/us-federal-reserve.json); a holiday on a Saturday
   leaves banks open the Friday before, one on a Sunday closes them the
   Monday after. Every date is checked against the rules in 5 U.S.C. 6103.
   Ireland: the Workplace Relations Commission's rules
   (data/holidays/ie-public-holidays.json), which must reproduce its own
   list for 2026; a holiday on a weekend has no substitute day.

   Paydays that fall on a weekend or holiday are shown on the working day
   before, as most employers pay. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const { esc, SITE } = site;

const DAY = 86400000;
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const utc = (y, m, d) => Date.UTC(y, m, d);
const iso = (t) => new Date(t).toISOString().slice(0, 10);
const parse = (s) => Date.parse(s + "T00:00:00Z");
const dow = (t) => new Date(t).getUTCDay();
const dm = (t) => `${DAYS[dow(t)].slice(0, 3)} ${new Date(t).getUTCDate()} ${MONTHS[new Date(t).getUTCMonth()].slice(0, 3)}`;
const long = (t) => `${DAYS[dow(t)]} ${new Date(t).getUTCDate()} ${MONTHS[new Date(t).getUTCMonth()]}`;
const nthDow = (y, m, wd, n) => { let t = utc(y, m, 1); while (dow(t) !== wd) t += DAY; return t + (n - 1) * 7 * DAY; };
const lastDow = (y, m, wd) => { let t = utc(y, m + 1, 0); while (dow(t) !== wd) t -= DAY; return t; };
function easter(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  return utc(y, Math.floor((h + l - 7 * m + 114) / 31) - 1, ((h + l - 7 * m + 114) % 31) + 1);
}
const THIS_YEAR = +site.TODAY.slice(0, 4);
const and = (a) => (a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1]);

/* ---------------------------------------------------------------- US */
const US = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/holidays/us-federal-reserve.json"), "utf8"));
const US_RULES = {
  "New Year's Day": (y) => utc(y, 0, 1), "Birthday of Martin Luther King, Jr.": (y) => nthDow(y, 0, 1, 3), "Washington's Birthday": (y) => nthDow(y, 1, 1, 3),
  "Memorial Day": (y) => lastDow(y, 4, 1), "Juneteenth National Independence Day": (y) => utc(y, 5, 19), "Independence Day": (y) => utc(y, 6, 4),
  "Labor Day": (y) => nthDow(y, 8, 1, 1), "Columbus Day": (y) => nthDow(y, 9, 1, 2), "Veterans Day": (y) => utc(y, 10, 11),
  "Thanksgiving Day": (y) => nthDow(y, 10, 4, 4), "Christmas Day": (y) => utc(y, 11, 25)
};
const usYears = Object.keys(US.years).map(Number).sort();
const usHol = {};
usYears.forEach((y) => {
  usHol[y] = US.years[y].map(([name, date, flag]) => {
    const t = parse(date);
    if (!US_RULES[name] || US_RULES[name](y) !== t) throw new Error(`US ${y} ${name}: ${date} doesn't follow 5 U.S.C. 6103`);
    if ((flag === "sat") !== (dow(t) === 6) || (flag === "sun") !== (dow(t) === 0)) throw new Error(`US ${y} ${name}: weekend mark doesn't match ${date}`);
    /* Saturday: banks open the Friday before; Sunday: closed the Monday after */
    const closed = dow(t) === 6 ? null : dow(t) === 0 ? t + DAY : t;
    return { name, t, closed };
  });
  if (usHol[y].length !== 11) throw new Error(`US ${y}: expected 11 holidays`);
});

/* ----------------------------------------------------------- Ireland */
const IE = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/holidays/ie-public-holidays.json"), "utf8"));
function ieHolidays(y) {
  const feb1 = utc(y, 1, 1);
  const list = [["New Year's Day", utc(y, 0, 1)], ["St Brigid's Day", dow(feb1) === 5 ? feb1 : nthDow(y, 1, 1, 1)], ["St Patrick's Day", utc(y, 2, 17)],
    ["Easter Monday", easter(y) + DAY], ["May bank holiday", nthDow(y, 4, 1, 1)], ["June bank holiday", nthDow(y, 5, 1, 1)], ["August bank holiday", nthDow(y, 7, 1, 1)],
    ["October bank holiday", lastDow(y, 9, 1)], ["Christmas Day", utc(y, 11, 25)], ["St Stephen's Day", utc(y, 11, 26)]];
  /* no substitute day: a weekend holiday closes nothing extra */
  return list.map(([name, t]) => ({ name, t, closed: dow(t) % 6 === 0 ? null : t }));
}
Object.entries(IE.check).forEach(([y, dates]) => {
  const got = ieHolidays(+y).map((h) => iso(h.t)).sort().join(",");
  if (got !== dates.slice().sort().join(",")) throw new Error(`Ireland ${y}: the rules give ${got}, the WRC lists ${dates.join(",")}`);
});
const ieYears = []; for (let y = THIS_YEAR; y <= THIS_YEAR + 4; y++) ieYears.push(y);

/* ---------------------------------------------------------- paydays */
const isWorking = (t, closed) => dow(t) % 6 !== 0 && !closed.has(t);
const onOrBefore = (t, closed) => { while (!isWorking(t, closed)) t -= DAY; return t; };
const lastDay = (y, m) => utc(y, m + 1, 0);
const lastFriday = (y, m) => lastDow(y, m, 5);

const COUNTRIES = {
  us: {
    name: "US", long: "the US", slug: "us", years: usYears, hol: (y) => usHol[y], cur: "$",
    rules: [["Last business day", lastDay], ["15th", (y, m) => utc(y, m, 15)], ["Last Friday", lastFriday], ["25th", (y, m) => utc(y, m, 25)]],
    semi: true, holWord: "bank holidays", dayWord: "business day",
    src: `Bank holidays from the <a href="${US.source.url}" rel="nofollow noopener" target="_blank">Federal Reserve</a> (when a holiday falls on a Saturday, banks open the Friday before; on a Sunday, they close the Monday after).`,
    note: "When payday falls on a weekend or bank holiday, most employers pay on the business day before, but some pay the next one: it's in your employer's pay policy and some states set rules. Direct deposits can't arrive on days the Federal Reserve is closed.",
    extra: 'Paid every other Friday? The <a href="/biweekly-pay-schedule/">biweekly pay schedule calculator</a> lists every payday for your start date.'
  },
  ireland: {
    name: "Ireland", long: "Ireland", slug: "ireland", years: ieYears, hol: ieHolidays, cur: "€",
    rules: [["Last working day", lastDay], ["Last Friday", lastFriday], ["28th", (y, m) => utc(y, m, 28)], ["25th", (y, m) => utc(y, m, 25)], ["20th", (y, m) => utc(y, m, 20)], ["15th", (y, m) => utc(y, m, 15)]],
    holWord: "public holidays", dayWord: "working day",
    src: `Public holidays from the <a href="${IE.source.url}" rel="nofollow noopener" target="_blank">Workplace Relations Commission</a>; one that falls on a weekend has no substitute day.`,
    note: "When payday falls on a weekend or public holiday, most employers pay on the working day before, but it's set by your contract, so check with your employer. December pay is often earlier still, before Christmas.",
    extra: ""
  }
};

const BASE = "/payday-calendar/";
const purl = (c, y) => `${BASE}${c.slug}/${y}/`;

function countryPage(c, y) {
  const url = SITE + purl(c, y);
  const hol = c.hol(y), closed = new Set(hol.map((h) => h.closed).filter(Boolean));
  const paid = (rule, m) => onOrBefore(rule[1](y, m), closed);
  const rows = MONTHS.map((n, m) => [n].concat(c.rules.map((rule) => {
    const due = rule[1](y, m), got = paid(rule, m);
    const early = got !== due && !(rule[0].startsWith("Last") && (rule[0] === "Last business day" || rule[0] === "Last working day"));
    return early ? `<strong>${dm(got)}</strong>` : dm(got);
  })));
  const fridays = hol.filter((h) => h.closed && dow(h.closed) === 5);
  const holRows = hol.map((h) => {
    const wk = dow(h.t) === 6 ? "Saturday" : "Sunday";
    const status = c.slug === "us"
      ? (h.closed ? (h.closed === h.t ? "Closed" : `Closed ${long(h.closed)}`) : `Open (falls on a ${wk})`)
      : (h.closed ? "Yes" : `Falls on a ${wk}: no substitute day`);
    return [esc(h.name), long(h.t), status];
  });
  const lastW = c.rules[0];
  const early = (i) => MONTHS.filter((n, m) => paid(c.rules[i], m) !== c.rules[i][1](y, m));
  const i15 = c.rules.findIndex((r) => r[0] === "15th"), i25 = c.rules.findIndex((r) => r[0] === "25th");
  const q = [
    [`When is payday in ${y} if I'm paid on the last ${c.dayWord}?`, MONTHS.map((n, m) => `${n} — ${long(paid(lastW, m)).replace(/^\w+ /, "")}`).join("; ") + "."],
    [`What if payday falls on a weekend or ${c.holWord.replace(/s$/, "")}?`, c.note]
  ];
  if (i25 >= 0) { const e = early(i25); q.push([`When is the 25th paid early in ${y}?`, e.length ? `${and(e.map((n) => `${n} (${long(paid(c.rules[i25], MONTHS.indexOf(n))).replace(/^\w+ /, "")})`))}: the 25th falls on a weekend or public holiday in those months.` : `Never: the 25th is a working day in every month of ${y}.`]); }
  if (c.semi) { const e = early(i15); q.push([`When are semi-monthly paydays in ${y}?`, `On the 15th and the last business day of each month, moved earlier for weekends and bank holidays. The 15th is paid early in ${e.length ? and(e) : "no month"} of ${y}.`]); }
  q.push([`Which Fridays are ${c.holWord} in ${y}?`, fridays.length ? `${fridays.map((h) => `${long(h.closed).replace(/^Friday /, "")} (${h.name})`).join(", ")}. A Friday payday then is usually paid on the Thursday.` : `None: no ${c.holWord.replace(/s$/, "")} closes a Friday in ${y}.`]);
  const title = site.fitTitle(`Payday Calendar ${y} (${c.name}) — Pay Dates When Payday Falls on a Weekend`, `Payday Calendar ${y} (${c.name}) — Weekend & Holiday Pay Dates`);
  const desc = `When you'll be paid each month of ${y} in ${c.long} if payday is the ${c.rules.map((r) => r[0].toLowerCase()).join(", ")}: moved to the ${c.dayWord} before for weekends and ${c.holWord}, with ${y}'s ${c.holWord}.`;
  const ld = [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], ["Payday calendars", SITE + BASE], [`${c.name} ${y}`, url]]), site.faqLd(q)];
  const other = c.years.filter((x) => x !== y).map((x) => `<a href="${purl(c, x)}">${c.name} ${x}</a>`).join(" ");
  const others = Object.values(COUNTRIES).filter((o) => o !== c && o.years.includes(y)).map((o) => `<a href="${purl(o, y)}">${o.name} ${y}</a>`).concat(`<a href="/working-days/${y}/payday-calendar/">UK ${y}</a>`).join(" ");
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="${BASE}">← Payday calendars</a>
      <h1 class="page-title">Payday calendar ${y}: ${esc(c.name)}</h1>
      <p class="page-subtitle">When you'll be paid each month in ${esc(c.long)}, with paydays that fall on a weekend or ${c.holWord.replace(/s$/, "")} moved to the ${c.dayWord} before.</p>
    </header>

    <main class="tool">
      <h2 class="tool-section-title">If you're paid on the…</h2>
${site.table(["Month"].concat(c.rules.map((r) => r[0])), rows, 560)}      <p class="tool-hint" style="margin-top:12px;">Bold dates are earlier than usual because the normal day is a weekend or ${c.holWord.replace(/s$/, "")}. ${c.src}</p>
      <p class="tool-hint">${esc(c.note)}${c.extra ? " " + c.extra : ""}</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">${esc(c.name)} ${c.holWord} in ${y}</h2>
${site.table(["Holiday", "Date", c.slug === "us" ? "Banks" : "Day off"], holRows, 460)}    </main>

    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}    </main>

    <div class="hub-group-title" style="margin-top:28px;">Other years</div>
    <p class="salary-links">${other}</p>
    <div class="hub-group-title" style="margin-top:18px;">Other countries</div>
    <p class="salary-links">${others}</p>

${site.FOOTER}
  </div>
</body>
</html>
`;
}

function hub() {
  const url = SITE + BASE;
  const ukYears = fs.readdirSync(path.join(site.ROOT, "working-days")).filter((d) => /^\d{4}$/.test(d) && fs.existsSync(path.join(site.ROOT, "working-days", d, "payday-calendar", "index.html"))).map(Number).sort();
  const title = "Payday Calendars — UK, US and Ireland Pay Dates by Year";
  const desc = `When you'll be paid each month when payday falls on a weekend or holiday: payday calendars for the UK (${ukYears[0]}–${ukYears[ukYears.length - 1]}), the US and Ireland.`;
  const ld = [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], ["Payday calendars", url]])];
  const row = (label, years, href) => `      <h2 class="tool-section-title">${label}</h2>
      <p class="salary-links">${years.map((y) => `<a href="${href(y)}">Payday calendar ${y}</a>`).join(" ")}</p>
`;
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="/working-days/">← Working days calculator</a>
      <h1 class="page-title">Payday calendars</h1>
      <p class="page-subtitle">When you'll be paid each month, with paydays that fall on a weekend or holiday moved to the working day before.</p>
    </header>

    <main class="tool">
${row("United Kingdom", ukYears, (y) => `/working-days/${y}/payday-calendar/`)}${Object.values(COUNTRIES).map((c) => row(c.slug === "us" ? "United States" : c.name, c.years, (y) => purl(c, y))).join("")}      <p class="tool-hint" style="margin-top:12px;">UK dates follow GOV.UK's bank holidays (expected dates for years it hasn't published yet); US dates the Federal Reserve's; Ireland's the Workplace Relations Commission's public holidays.</p>
    </main>

${site.FOOTER}
  </div>
</body>
</html>
`;
}

const urls = [[BASE, "0.5"]];
site.write("payday-calendar", hub());
Object.values(COUNTRIES).forEach((c) => c.years.forEach((y) => { site.write(`payday-calendar/${c.slug}/${y}`, countryPage(c, y)); urls.push([purl(c, y), "0.5"]); }));
site.sitemapBlock("payday calendars", "tools/build-payday-pages.js", urls);
console.log(`built the payday calendar hub and ${urls.length - 1} country pages (US ${usYears[0]}–${usYears[usYears.length - 1]}, Ireland ${ieYears[0]}–${ieYears[ieYears.length - 1]})`);
