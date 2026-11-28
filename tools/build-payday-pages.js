#!/usr/bin/env node
/* Payday calendars for other countries, and a hub for all of them:

       /payday-calendar/                 every country and year
       /payday-calendar/us/2027/         US, from the Federal Reserve's holidays
       /payday-calendar/ireland/2027/    Ireland, from its public holiday rules
       /payday-calendar/canada/2027/     Canada, from Payments Canada's closure days
       /payday-calendar/australia/2027/  Australia, national public holidays (RBA)
       /payday-calendar/new-zealand/2027/ New Zealand, from Employment New Zealand

       node tools/build-payday-pages.js

   The UK's are part of the working days pages (/working-days/2027/payday-calendar/).

   US: the Federal Reserve publishes the days its banks close five years
   ahead (data/holidays/us-federal-reserve.json); a holiday on a Saturday
   leaves banks open the Friday before, one on a Sunday closes them the
   Monday after. Every date is checked against the rules in 5 U.S.C. 6103.
   Ireland: the Workplace Relations Commission's rules
   (data/holidays/ie-public-holidays.json), which must reproduce its own
   list for 2026; a holiday on a weekend has no substitute day.
   Canada, Australia and New Zealand: rules in data/holidays/ (ca-payments-
   canada, au-national-holidays, nz-public-holidays), each of which must
   reproduce the official lists for the years published (2026 and 2027);
   later years are labelled as expected. A weekend holiday moves to the next
   free weekday where the country does that (observe()).

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
/* Beyond the Federal Reserve's list (five years ahead), the same rules give the
   expected dates; those years are marked as expected. */
const usPublished = usYears[usYears.length - 1];
const usRuleHol = (y) => Object.entries(US_RULES).map(([name, f]) => { const t = f(y); return { name, t, closed: dow(t) === 6 ? null : dow(t) === 0 ? t + DAY : t }; }).sort((a, b) => a.t - b.t);
const AHEAD_YEARS = 10;

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
const ieYears = []; for (let y = THIS_YEAR; y <= THIS_YEAR + AHEAD_YEARS; y++) ieYears.push(y);

/* A holiday on a weekend moves to the next weekday that isn't already a
   holiday, taken in date order (so Christmas on a Saturday and Boxing Day
   on a Sunday become Monday and Tuesday). "shift" marks those that move. */
function observe(list) {
  const out = list.map(([name, t, shift]) => ({ name, t, shift, closed: dow(t) % 6 === 0 ? null : t }));
  const taken = new Set(out.filter((h) => h.closed).map((h) => h.closed));
  out.slice().sort((a, b) => a.t - b.t).forEach((h) => {
    if (h.closed || !h.shift) return;
    let d = h.t + DAY; while (dow(d) % 6 === 0 || taken.has(d)) d += DAY;
    h.closed = d; taken.add(d);
  });
  return out.sort((a, b) => a.t - b.t);
}
const yearsAhead = () => { const a = []; for (let y = THIS_YEAR; y <= THIS_YEAR + AHEAD_YEARS; y++) a.push(y); return a; };
/* the dates a country's own list gives must come out of the rules */
function verify(label, data, fn, mode) {
  Object.entries(data.check).forEach(([y, dates]) => {
    const hol = fn(+y);
    const got = (mode === "both" ? [...new Set(hol.flatMap((h) => [h.t, h.closed].filter(Boolean)))] : hol.map((h) => h.closed).filter(Boolean)).map(iso).sort().join(",");
    if (got !== dates.slice().sort().join(",")) throw new Error(`${label} ${y}: the rules give ${got}, the official list has ${dates.join(",")}`);
  });
  return Math.max(...Object.keys(data.check).map(Number));
}

/* ------------------------------------------------------------ Canada */
const CA = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/holidays/ca-payments-canada.json"), "utf8"));
const caHolidays = (y) => observe([["New Year's Day", utc(y, 0, 1), 1], ["Good Friday", easter(y) - 2 * DAY, 1],
  ["Victoria Day", (() => { let t = utc(y, 4, 24); while (dow(t) !== 1) t -= DAY; return t; })(), 1], ["Canada Day", utc(y, 6, 1), 1],
  ["Labour Day", nthDow(y, 8, 1, 1), 1], ["National Day for Truth and Reconciliation", utc(y, 8, 30), 1], ["Thanksgiving", nthDow(y, 9, 1, 2), 1],
  ["Remembrance Day", utc(y, 10, 11), 1], ["Christmas Day", utc(y, 11, 25), 1], ["Boxing Day", utc(y, 11, 26), 1]]);
const caPublished = verify("Canada", CA, caHolidays);

/* ------------------------------------------------------- New Zealand */
const NZ = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/holidays/nz-public-holidays.json"), "utf8"));
const nzHolidays = (y) => observe([["New Year's Day", utc(y, 0, 1), 1], ["Day after New Year's Day", utc(y, 0, 2), 1], ["Waitangi Day", utc(y, 1, 6), 1],
  ["Good Friday", easter(y) - 2 * DAY, 0], ["Easter Monday", easter(y) + DAY, 0], ["Anzac Day", utc(y, 3, 25), 1], ["King's Birthday", nthDow(y, 5, 1, 1), 0],
  ["Matariki", parse(NZ.matariki[y]), 0], ["Labour Day", nthDow(y, 9, 1, 4), 0], ["Christmas Day", utc(y, 11, 25), 1], ["Boxing Day", utc(y, 11, 26), 1]]);
const nzPublished = verify("New Zealand", NZ, nzHolidays);
const nzYears = yearsAhead().filter((y) => NZ.matariki[y]);

/* --------------------------------------------------------- Australia */
const AU = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/holidays/au-national-holidays.json"), "utf8"));
const auHolidays = (y) => observe([["New Year's Day", utc(y, 0, 1), 1], ["Australia Day", utc(y, 0, 26), 1], ["Good Friday", easter(y) - 2 * DAY, 0],
  ["Easter Monday", easter(y) + DAY, 0], ["Anzac Day", utc(y, 3, 25), 0], ["Christmas Day", utc(y, 11, 25), 1], ["Boxing Day", utc(y, 11, 26), 1]]);
const auPublished = verify("Australia", AU, auHolidays, "both");

/* ---------------------------------------------------------- paydays */
const isWorking = (t, closed) => dow(t) % 6 !== 0 && !closed.has(t);
const onOrBefore = (t, closed) => { while (!isWorking(t, closed)) t -= DAY; return t; };
const lastDay = (y, m) => utc(y, m + 1, 0);
const lastFriday = (y, m) => lastDow(y, m, 5);

const COUNTRIES = {
  us: {
    name: "US", long: "the US", slug: "us", years: yearsAhead().filter((y) => y >= usYears[0]), published: usPublished, hol: (y) => usHol[y] || usRuleHol(y), cur: "$",
    rules: [["Last business day", lastDay], ["15th", (y, m) => utc(y, m, 15)], ["Last Friday", lastFriday], ["25th", (y, m) => utc(y, m, 25)]],
    semi: true, holWord: "bank holidays", dayWord: "business day",
    src: `Bank holidays from the <a href="${US.source.url}" rel="nofollow noopener" target="_blank">Federal Reserve</a> (when a holiday falls on a Saturday, banks open the Friday before; on a Sunday, they close the Monday after).`,
    note: "When payday falls on a weekend or bank holiday, most employers pay on the business day before, but some pay the next one: it's in your employer's pay policy and some states set rules. Direct deposits can't arrive on days the Federal Reserve is closed.",
    extra: 'Paid every other Friday? The <a href="/biweekly-pay-schedule/">biweekly pay schedule calculator</a> lists every payday for your start date.'
  },
  canada: {
    name: "Canada", long: "Canada", slug: "canada", years: yearsAhead(), published: caPublished, hol: caHolidays, cur: "$",
    rules: [["Last business day", lastDay], ["15th", (y, m) => utc(y, m, 15)], ["Last Friday", lastFriday], ["25th", (y, m) => utc(y, m, 25)]],
    semi: true, holWord: "bank holidays", dayWord: "business day",
    src: `Bank holidays are the days <a href="${CA.source.url}" rel="nofollow noopener" target="_blank">Payments Canada</a> closes the systems that settle direct deposits; one on a weekend closes them the next weekday.`,
    note: "When payday falls on a weekend or bank holiday, most employers pay on the business day before. Provincial holidays such as Family Day and the August Civic Holiday don't close the payment system, so deposits usually arrive as normal; your employer's pay policy has the final say.",
    extra: 'Paid every other Friday? The <a href="/biweekly-pay-schedule/">biweekly pay schedule calculator</a> lists every payday for your start date.'
  },
  australia: {
    name: "Australia", long: "Australia", slug: "australia", years: yearsAhead(), published: auPublished, hol: auHolidays, cur: "$",
    rules: [["Last business day", lastDay], ["15th", (y, m) => utc(y, m, 15)], ["Last Friday", lastFriday], ["25th", (y, m) => utc(y, m, 25)]],
    holWord: "public holidays", dayWord: "business day",
    src: `National public holidays observed in every state and territory, from the <a href="${AU.source.url}" rel="nofollow noopener" target="_blank">Reserve Bank of Australia</a>. State holidays (King's Birthday, Labour Day, Melbourne Cup and others) can move pay too.`,
    note: "When payday falls on a weekend or public holiday, most employers pay on the business day before; your award, agreement or contract sets it. Many Australians are paid fortnightly, and a state public holiday can also bring pay forward.",
    extra: ""
  },
  "new-zealand": {
    name: "New Zealand", long: "New Zealand", slug: "new-zealand", years: nzYears, published: nzPublished, hol: nzHolidays, cur: "$",
    rules: [["Last working day", lastDay], ["15th", (y, m) => utc(y, m, 15)], ["20th", (y, m) => utc(y, m, 20)], ["Last Friday", lastFriday]],
    holWord: "public holidays", dayWord: "working day",
    src: `National public holidays from <a href="${NZ.source.url}" rel="nofollow noopener" target="_blank">Employment New Zealand</a>, observed on the Monday (or Tuesday) when they fall on a weekend; Matariki from <a href="${NZ.matarikiSource.url}" rel="nofollow noopener" target="_blank">MBIE</a>. Regional anniversary days are left out.`,
    note: "When payday falls on a weekend or public holiday, most employers pay on the working day before; it's set in your employment agreement. Your region's anniversary day can also bring pay forward.",
    extra: ""
  },
  ireland: {
    name: "Ireland", long: "Ireland", slug: "ireland", years: ieYears, hol: ieHolidays, cur: "€", months: true,
    rules: [["Last working day", lastDay], ["Last Friday", lastFriday], ["28th", (y, m) => utc(y, m, 28)], ["25th", (y, m) => utc(y, m, 25)], ["20th", (y, m) => utc(y, m, 20)], ["15th", (y, m) => utc(y, m, 15)]],
    holWord: "public holidays", dayWord: "working day",
    src: `Public holidays from the <a href="${IE.source.url}" rel="nofollow noopener" target="_blank">Workplace Relations Commission</a>; one that falls on a weekend has no substitute day.`,
    note: "When payday falls on a weekend or public holiday, most employers pay on the working day before, but it's set by your contract, so check with your employer. December pay is often earlier still, before Christmas.",
    extra: ""
  }
};

const BASE = "/payday-calendar/";
const purl = (c, y) => `${BASE}${c.slug}/${y}/`;
const murl = (c, y, m) => `${BASE}${c.slug}/${y}/${MONTHS[m].toLowerCase()}/`;

/* One month's paydays for a country with "months: true" (Ireland, where
   monthly pay is common): /payday-calendar/ireland/2026/december/ */
function monthPage(c, y, m) {
  const url = SITE + murl(c, y, m), N = MONTHS[m];
  const closedIn = (yy) => new Set(c.hol(yy).map((h) => h.closed).filter(Boolean));
  const closed = closedIn(y), paid = (rule) => onOrBefore(rule[1](y, m), closed);
  const isLast = (rule) => rule[0] === "Last business day" || rule[0] === "Last working day";
  const lastW = c.rules[0], first = paid(lastW);
  const rows = c.rules.map((rule) => { const due = rule[1](y, m), got = paid(rule), early = got !== due && !isLast(rule); return [rule[0], dm(due), early ? `<strong>${dm(got)}</strong>` : dm(got)]; });
  const earlyOnes = c.rules.filter((rule) => !isLast(rule) && paid(rule) !== rule[1](y, m));
  const why = (rule) => { const due = rule[1](y, m), h = c.hol(y).find((x) => x.closed === due); return h ? `${long(due)} is ${h.name}` : `${new Date(due).getUTCDate()} ${N} is a ${DAYS[dow(due)]}`; };
  const name = (rule) => rule[0] === "Last Friday" ? "last Friday" : rule[0].replace(/^Last/, "last");
  const hols = c.hol(y).filter((h) => new Date(h.t).getUTCMonth() === m || (h.closed && new Date(h.closed).getUTCMonth() === m));
  const holRows = hols.map((h) => [esc(h.name), long(h.t), h.closed ? (h.closed === h.t ? "Yes" : `Moved to ${long(h.closed)}`) : `Falls on a ${dow(h.t) === 6 ? "Saturday" : "Sunday"}: no substitute day`]);
  const fridays = []; for (let d = utc(y, m, 1); new Date(d).getUTCMonth() === m; d += DAY) if (dow(d) === 5) fridays.push(d);
  const friHol = fridays.filter((d) => closed.has(d));
  const ny = m === 11 ? y + 1 : y, nm = (m + 1) % 12, next = onOrBefore(lastW[1](ny, nm), closedIn(ny)), gap = Math.round((next - first) / DAY);
  const q = [
    [`When is payday in ${N} ${y}?`, `If you're paid on the last ${c.dayWord} of the month, ${long(first)} ${y}; ` + c.rules.slice(1).map((r) => `on the ${name(r)}, ${long(paid(r))}`).join("; ") + ` (${c.name}).`],
    [`Is payday early in ${N} ${y}?`, earlyOnes.length ? `Yes for some pay dates: ${and(earlyOnes.map((r) => `the ${name(r)} is paid on ${long(paid(r))} because ${why(r)}`))}.` : `No: none of the usual pay dates falls on a weekend or ${c.holWord.replace(/s$/, "")} in ${N} ${y}.`],
    [`What if payday falls on a weekend or ${c.holWord.replace(/s$/, "")}?`, c.note],
    [`How long is it from ${N}'s payday to the next one?`, `${gap} days, if you're paid on the last ${c.dayWord}: ${long(first)} to ${long(next)} ${ny}.`]
  ];
  const title = site.fitTitle(`Payday ${N} ${y} (${c.name}) — When You'll Get Paid`, `Payday ${N} ${y} ${c.name}`);
  const desc = `Payday ${N} ${y} in ${c.long}: ${long(first)} if you're paid on the last ${c.dayWord}` + (earlyOnes.length ? `, ${long(paid(earlyOnes[0]))} on the ${name(earlyOnes[0])}` : "") + `, with ${c.holWord} and weekends.`;
  const ld = [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], ["Payday calendars", SITE + BASE], [`${c.name} ${y}`, SITE + purl(c, y)], [N, url]]), site.faqLd(q)];
  const pm = m === 0 ? [y - 1, 11] : [y, m - 1], nmL = [ny, nm];
  const nav = [pm, nmL].filter(([yy]) => c.years.includes(yy)).map(([yy, mm]) => `<a href="${murl(c, yy, mm)}">${MONTHS[mm]} ${yy}</a>`).join(" ");
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="${purl(c, y)}">← ${esc(c.name)} payday calendar ${y}</a>
      <h1 class="page-title">Payday ${N} ${y}: ${esc(c.name)}</h1>
      <p class="page-subtitle">When you'll be paid in ${N} ${y} in ${esc(c.long)}, with paydays that fall on a weekend or ${c.holWord.replace(/s$/, "")} moved to the ${c.dayWord} before.</p>
    </header>

    <main class="tool">
      <div class="result-box" style="margin-bottom:14px;"><div class="result-hero"><div class="value">${long(first)}</div><div class="label">payday in ${N} ${y} if you're paid on the last ${c.dayWord}</div></div></div>
      <h2 class="tool-section-title">If you're paid on the…</h2>
${site.table(["Pay date", "Due", "Paid"], rows, 360)}      <p class="tool-hint" style="margin-top:12px;">Bold dates are earlier than the usual day because it falls on a weekend or ${c.holWord.replace(/s$/, "")}. ${esc(c.note)}</p>
      <p class="about-text">The next payday, on the last ${c.dayWord} of ${MONTHS[nm]}, is ${long(next)} ${ny}: ${gap} days after ${N}'s.</p>
      <h2 class="tool-section-title" style="margin-top:18px;">Paid weekly or fortnightly on a Friday</h2>
      <p class="about-text">${N} ${y} has ${fridays.length} Fridays: ${and(fridays.map((d) => long(d)))}.${friHol.length ? " " + friHol.map((d) => `${long(d)} is a ${c.holWord.replace(/s$/, "")}, so pay usually comes on ${long(onOrBefore(d, closed))}.`).join(" ") : ""} Fortnightly pay comes on every other one, depending on your pay cycle.</p>
    </main>
${holRows.length ? `
    <main class="tool">
      <h2 class="tool-section-title">${esc(c.name)} ${c.holWord} in ${N} ${y}</h2>
${site.table(["Holiday", "Date", "Day off"], holRows, 420)}      <p class="tool-hint" style="margin-top:8px;">${c.src}</p>
    </main>
` : ""}
    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}    </main>

    <div class="hub-group-title" style="margin-top:28px;">Other months</div>
    <p class="salary-links">${nav} <a href="${purl(c, y)}">All of ${y}</a></p>

${site.FOOTER}
  </div>
</body>
</html>
`;
}

function countryPage(c, y) {
  const url = SITE + purl(c, y);
  const hol = c.hol(y), closed = new Set(hol.map((h) => h.closed).filter(Boolean));
  const paid = (rule, m) => onOrBefore(rule[1](y, m), closed);
  const rows = MONTHS.map((n, m) => [c.months ? `<a href="${murl(c, y, m)}">${n}</a>` : n].concat(c.rules.map((rule) => {
    const due = rule[1](y, m), got = paid(rule, m);
    const early = got !== due && !(rule[0].startsWith("Last") && (rule[0] === "Last business day" || rule[0] === "Last working day"));
    return early ? `<strong>${dm(got)}</strong>` : dm(got);
  })));
  const fridays = hol.filter((h) => h.closed && dow(h.closed) === 5);
  const holRows = hol.map((h) => {
    const wk = dow(h.t) === 6 ? "Saturday" : "Sunday";
    const status = c.slug === "us"
      ? (h.closed ? (h.closed === h.t ? "Closed" : `Closed ${long(h.closed)}`) : `Open (falls on a ${wk})`)
      : (h.closed ? (h.closed === h.t ? "Yes" : `Moved to ${long(h.closed)}`) : `Falls on a ${wk}: no substitute day`);
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
      <p class="tool-hint">${esc(c.note)}${c.extra ? " " + c.extra : ""}</p>${c.published && y > c.published ? `
      <p class="tool-hint">${y} dates are expected: they follow the usual rules, as the official ${y} list isn't out yet.</p>` : ""}
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
  const title = "Payday Calendars — UK, US, Canada, Australia, NZ and Ireland Pay Dates";
  const desc = `When you'll be paid each month when payday falls on a weekend or holiday: payday calendars for the UK (${ukYears[0]}–${ukYears[ukYears.length - 1]}), the US, Canada, Australia, New Zealand and Ireland.`;
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
      <p class="about-text">UK paydays month by month: <a href="/payday/"><strong>payday dates for every month</strong></a>, from this month to ${ukYears[ukYears.length - 1]}.</p>
${row("United Kingdom", ukYears, (y) => `/working-days/${y}/payday-calendar/`)}${Object.values(COUNTRIES).map((c) => row(c.slug === "us" ? "United States" : c.name, c.years, (y) => purl(c, y))).join("")}      <p class="tool-hint" style="margin-top:12px;">UK dates follow GOV.UK's bank holidays (expected dates for years it hasn't published yet); US dates the Federal Reserve's; Canada's Payments Canada's closure days; Australia's the national public holidays the RBA lists; New Zealand's Employment New Zealand's; Ireland's the Workplace Relations Commission's. Years each country hasn't published yet use the usual rules and are marked as expected.</p>
    </main>

${site.FOOTER}
  </div>
</body>
</html>
`;
}

const urls = [[BASE, "0.5"]];
site.write("payday-calendar", hub());
Object.values(COUNTRIES).forEach((c) => c.years.forEach((y) => {
  site.write(`payday-calendar/${c.slug}/${y}`, countryPage(c, y)); urls.push([purl(c, y), "0.5"]);
  if (c.months) MONTHS.forEach((n, m) => { site.write(`payday-calendar/${c.slug}/${y}/${n.toLowerCase()}`, monthPage(c, y, m)); urls.push([murl(c, y, m), "0.5"]); });
}));
site.sitemapBlock("payday calendars", "tools/build-payday-pages.js", urls);
console.log(`built the payday calendar hub and ${urls.length - 1} country pages (${Object.values(COUNTRIES).map((c) => `${c.name} ${c.years[0]}–${c.years[c.years.length - 1]}`).join(", ")})`);
