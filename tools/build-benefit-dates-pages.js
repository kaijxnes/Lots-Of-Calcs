#!/usr/bin/env node
/* When UK benefits and pensions are paid around bank holidays:

       /benefit-payment-dates/                  the list
       /benefit-payment-dates/2027/             every bank holiday in the year, and what it moves
       /benefit-payment-dates/christmas-2027/   Christmas and New Year, day by day

       node tools/build-benefit-dates-pages.js

   The rules are quoted from GOV.UK in data/uk/benefit-payments.json: a
   payment due on a weekend or bank holiday is usually paid on the working
   day before (Universal Credit always is); 4-weekly benefits are paid on a
   fixed weekday (the State Pension's set by the National Insurance number).
   Bank holidays are GOV.UK's, then the expected dates (tools/lib/uk-holidays.js),
   labelled as such. Pages run from this year to four years ahead. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const { esc, SITE } = site;

const R = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/uk/benefit-payments.json"), "utf8"));
const THIS_YEAR = +site.TODAY.slice(0, 4);
const YEARS = []; for (let y = THIS_YEAR; y <= THIS_YEAR + 4; y++) YEARS.push(y);
const H = require("./lib/uk-holidays.js")(YEARS[YEARS.length - 1] + 1);
const REG = { "england-and-wales": "England and Wales", scotland: "Scotland", "northern-ireland": "Northern Ireland" };

const DAY = 86400000;
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const parse = (s) => Date.parse(s + "T00:00:00Z");
const iso = (t) => new Date(t).toISOString().slice(0, 10);
const dow = (t) => new Date(t).getUTCDay();
const long = (t) => `${DAYS[dow(t)]} ${new Date(t).getUTCDate()} ${MONTHS[new Date(t).getUTCMonth()]}`;
const longY = (t) => `${long(t)} ${new Date(t).getUTCFullYear()}`;
const dm = (t) => `${new Date(t).getUTCDate()} ${MONTHS[new Date(t).getUTCMonth()]}`;
const and = (a) => (a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1]);

const HOL = {}, BYDATE = {};
Object.keys(REG).forEach((r) => { HOL[r] = H.list(r); BYDATE[r] = new Map(HOL[r].map((h) => [h.date, h])); });
const isWorking = (t, r) => dow(t) % 6 !== 0 && !BYDATE[r].has(iso(t));
const before = (t, r) => { let s = t; while (!isWorking(s, r)) s -= DAY; return s; };
const expectedYear = (y) => y > H.lastPublished;
const holName = (h) => esc(h.title) + (h.sub ? " (substitute day)" : "") + (h.expected ? " (expected)" : "");
const SRC = (o) => `<a href="${o.source.url}" rel="nofollow noopener" target="_blank">${esc(o.source.title)}</a>`;
const SOURCES = `${SRC(R.general)}, ${SRC(R.universalCredit)}, ${SRC(R.statePension)} and ${SRC(R.childBenefit)}`;
const AHEAD = (y) => `GOV.UK hasn't published the bank holidays for ${y} yet, so these use the expected dates from the usual pattern; they'll change to the official list when it's out.`;

/* weekday bank holidays in a year: the ones that move a payment */
function holidaysIn(y) {
  const seen = new Map();
  Object.keys(REG).forEach((r) => HOL[r].filter((h) => h.date.startsWith(y + "-")).forEach((h) => {
    const k = h.date + "|" + h.title;
    if (!seen.has(k)) seen.set(k, { ...h, regions: [] });
    seen.get(k).regions.push(r);
  }));
  return [...seen.values()].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}
const where = (rs) => (rs.length === 3 ? "All of the UK" : rs.length === 2 && !rs.includes("scotland") ? "England, Wales and Northern Ireland" : and(rs.map((r) => REG[r])));
/* a date, with its year when it isn't the page's year */
const inY = (t, y) => (new Date(t).getUTCFullYear() === y ? long(t) : longY(t));

/* Universal Credit dates a bank holiday moves (weekends alone always go to
   the Friday): due date -> paid date, England and Wales, plus where the
   other nations differ */
function ucMoves(from, to) {
  const out = [];
  for (let t = from; t <= to; t += DAY) {
    const res = {};
    Object.keys(REG).forEach((r) => { res[r] = before(t, r); });
    const ew = res["england-and-wales"];
    /* only the dates a bank holiday affects somewhere */
    const plain = (r) => { let s = t; while (dow(s) % 6 === 0) s -= DAY; return s; };
    if (Object.keys(REG).every((r) => res[r] === plain(r))) continue;
    const y = new Date(t).getUTCFullYear();
    const diff = Object.keys(REG).filter((r) => r !== "england-and-wales" && res[r] !== ew).map((r) => `${REG[r]}: ${res[r] === t ? "on time" : inY(res[r], y)}`);
    out.push([dm(t) + ` (${DAYS[dow(t)].slice(0, 3)})`, ew === t ? "On time" : inY(ew, y), diff.join("; ")]);
  }
  return out;
}

function head(o) {
  return site.head({ title: o.title, desc: o.desc, url: o.url, ld: o.ld }) + `    <header class="site-header">
      <a class="back-link" href="/benefit-payment-dates/">← Benefit payment dates</a>
      <h1 class="page-title">${esc(o.h1)}</h1>
      <p class="page-subtitle">${o.sub}</p>
${o.ahead ? `      <p class="tool-hint" style="margin-top:10px;"><strong>Expected dates.</strong> ${esc(o.ahead)}</p>\n` : ""}    </header>
`;
}
const tail = (q, path_, extra) => `    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}      <p class="tool-hint" style="margin-top:12px;">Payment rules from ${SOURCES}; bank holidays from <a href="https://www.gov.uk/bank-holidays" rel="noopener">GOV.UK</a>. Your payment statement or online account shows your own dates. Last checked ${site.niceDate(R.lastChecked)}.</p>
    </main>

${extra}
${site.FOOTER}
  </div>
</body>
</html>
`;
const npTable = () => site.table(["Last 2 digits of your National Insurance number", "Paid on a"], R.statePension.days, 360);

function yearPage(y) {
  const url = SITE + `/benefit-payment-dates/${y}/`;
  const hols = holidaysIn(y);
  const weekday = hols.filter((h) => dow(parse(h.date)) % 6 !== 0);
  const rows = weekday.map((h) => {
    const t = parse(h.date), r = h.regions[0];
    return [long(t), holName(h), where(h.regions), inY(before(t, r), y)];
  });
  const uc = ucMoves(parse(`${y}-01-01`), parse(`${y}-12-31`));
  const xmas = parse(`${y}-12-25`);
  const xPaid = before(xmas, "england-and-wales");
  const q = [
    [`When are benefits paid early in ${y}?`, `When a payment is due on a bank holiday, it's usually paid on the working day before. In England and Wales in ${y} that's ${and(weekday.filter((h) => h.regions.includes("england-and-wales")).map((h) => `${dm(parse(h.date))} (${h.title.replace(/ \(.*\)$/, "")})`))}.`],
    [`When is Universal Credit paid at Christmas ${y}?`, `A payment due on Christmas Day, ${long(xmas)}, is paid on ${long(xPaid)}${xPaid === xmas ? "" : ", the working day before"}. The <a href="/benefit-payment-dates/christmas-${y}/">Christmas ${y} payment dates</a> page goes day by day.`.replace(/<[^>]+>/g, "")],
    ["What day is my State Pension paid?", `It depends on the last 2 digits of your National Insurance number: 00 to 19 Monday, 20 to 39 Tuesday, 40 to 59 Wednesday, 60 to 79 Thursday, 80 to 99 Friday, usually every 4 weeks. If that day is a bank holiday you might be paid earlier.`],
    ["Is Child Benefit paid early for bank holidays?", "It's usually paid every 4 weeks on a Monday or Tuesday, and GOV.UK says the weekend and bank holiday rule may be different for Child Benefit, so check your payment notice from HMRC."]
  ];
  const title = site.fitTitle(`Benefit Payment Dates ${y} — Bank Holiday Changes for UC & State Pension`, `Benefit Payment Dates ${y} — Bank Holiday Changes`);
  const desc = `When Universal Credit, the State Pension, PIP and other benefits are paid early in ${y} because of bank holidays, with every date that moves and the Christmas changes.`;
  const ld = [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], ["Benefit payment dates", SITE + "/benefit-payment-dates/"], [String(y), url]]), site.faqLd(q)];
  const other = YEARS.filter((x) => x !== y).map((x) => `<a href="/benefit-payment-dates/${x}/">${x}</a>`).concat(YEARS.map((x) => `<a href="/benefit-payment-dates/christmas-${x}/">Christmas ${x}</a>`)).join(" ");
  return head({ url, title, desc, ld, h1: `Benefit payment dates ${y}`, sub: `When Universal Credit, the State Pension and other benefits are paid early in ${y} because a payment falls on a bank holiday.`, ahead: expectedYear(y) ? AHEAD(y) : "" }) + `
    <main class="tool">
      <h2 class="tool-section-title">The rule</h2>
      <p class="about-text">If your payment date is on a weekend or a bank holiday, you'll usually be paid on the <strong>working day before</strong>. Universal Credit is paid on the same date each month; most other benefits are paid every 2 or 4 weeks on the same weekday. Child Benefit may be different.</p>
      <p class="about-text">So a weekend payment arrives on the Friday, and a bank holiday payment on the last working day before it: the Thursday before Good Friday, the Friday before a bank holiday Monday.</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">Bank holidays in ${y} that move payments</h2>
${site.table(["Bank holiday", "Holiday", "Where", "A payment due that day is paid on"], rows, 560)}      <p class="tool-hint" style="margin-top:12px;">Bank holidays that fall on a weekend are left out: their substitute weekday is listed instead.</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">Universal Credit: dates that move in ${y}</h2>
      <p class="about-text">Every Universal Credit payment date a bank holiday moves. A date that's only a weekend is paid on the Friday before, so it isn't listed.</p>
${site.table(["Due on", "Paid on (England and Wales)", "Different in"], uc, 520)}    </main>

    <main class="tool">
      <h2 class="tool-section-title">State Pension and other 4-weekly benefits</h2>
      <p class="about-text">The State Pension, Pension Credit, PIP, Attendance Allowance and Disability Living Allowance are usually paid every 4 weeks on the same weekday, so they only move when that weekday is a bank holiday: see the dates above. Your State Pension day depends on your National Insurance number:</p>
${npTable()}      <h2 class="tool-section-title" style="margin-top:20px;">How often each benefit is paid</h2>
${site.table(["Benefit", "How often"], R.general.frequencies.map(([a, b]) => [esc(a), esc(b)]), 420)}    </main>
` + tail(q, url, `    <div class="hub-group-title" style="margin-top:28px;">Other years</div>
    <p class="salary-links">${other}</p>
    <p class="salary-links"><a href="/working-days/${y}/">Bank holidays and working days ${y}</a> <a href="/working-days/${y}/payday-calendar/">Payday calendar ${y}</a></p>`);
}

function christmasPage(y) {
  const url = SITE + `/benefit-payment-dates/christmas-${y}/`;
  const from = parse(`${y}-12-18`), to = parse(`${y + 1}-01-05`);
  const rows = [];
  for (let t = from; t <= to; t += DAY) {
    const ew = before(t, "england-and-wales"), sc = before(t, "scotland");
    const h = BYDATE["england-and-wales"].get(iso(t)) || BYDATE.scotland.get(iso(t));
    rows.push([longY(t).replace(/ \d{4}$/, (m) => (new Date(t).getUTCFullYear() !== y ? m : "")), h ? holName(h) : dow(t) % 6 === 0 ? "Weekend" : "", ew === t ? "On time" : long(ew), sc === ew ? "Same" : long(sc)]);
  }
  const xmas = parse(`${y}-12-25`), box = parse(`${y}-12-26`), ny = parse(`${y + 1}-01-01`);
  const lastBefore = before(xmas, "england-and-wales");
  const xh = HOL["england-and-wales"].filter((h) => h.date >= `${y}-12-20` && h.date <= `${y + 1}-01-04`);
  const q = [
    [`When will I get my benefits at Christmas ${y}?`, `A payment due on Christmas Day (${long(xmas)}) or Boxing Day (${long(box)}) is usually paid on ${long(lastBefore)}. One due on New Year's Day (${longY(ny)}) is paid on ${longY(before(ny, "england-and-wales"))}.`],
    [`Is Universal Credit paid early at Christmas ${y}?`, `Yes, if your payment date falls on a bank holiday or weekend over Christmas: it's paid on the working day before. The table shows the paid date for every day from 18 December to 5 January.`],
    [`What are the bank holidays over Christmas ${y}?`, and(xh.map((h) => `${long(parse(h.date))} (${h.title}${h.sub ? ", substitute day" : ""})`)) + ` in England and Wales. Scotland also has 2 January.`],
    ["Why does my money arrive early at Christmas?", "Because banks don't process payments on bank holidays and weekends, so a payment due then is paid on the last working day before. It's the same money, not an extra payment, so it has to last longer before the next one."]
  ];
  const ahead = expectedYear(y) || expectedYear(y + 1) ? AHEAD(expectedYear(y) ? y : y + 1) : "";
  const title = site.fitTitle(`Christmas ${y} Benefit Payment Dates — Universal Credit, State Pension & More`, `Christmas ${y} Benefit Payment Dates`);
  const desc = `When Universal Credit, the State Pension and other benefits are paid over Christmas ${y} and New Year: every date from 18 December to 5 January, and the day each payment arrives.`;
  const ld = [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], ["Benefit payment dates", SITE + "/benefit-payment-dates/"], [`Christmas ${y}`, url]]), site.faqLd(q)];
  return head({ url, title, desc, ld, h1: `Christmas ${y} benefit payment dates`, sub: `When benefits and pensions due over Christmas ${y} and New Year are paid: on the working day before each bank holiday and weekend.`, ahead }) + `
    <main class="tool">
      <h2 class="tool-section-title">Due on… paid on</h2>
      <p class="about-text">Find the date your payment is due. Universal Credit is due on the same date each month; the State Pension and most other benefits on the same weekday every 2 or 4 weeks.</p>
${site.table(["Due on", "", "Paid on (England, Wales, NI)", "In Scotland"], rows, 520)}      <p class="tool-hint" style="margin-top:12px;">Child Benefit is paid by HMRC and GOV.UK says the rule may be different for it, so check your payment notice. Northern Ireland has the same Christmas bank holidays as England and Wales.</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">Making it last</h2>
      <p class="about-text">An early payment isn't extra money: the next one comes on its usual date. If yours arrives on ${long(lastBefore)}, it has to cover the extra days until your next payment, so it's worth planning for the gap in January.</p>
    </main>
` + tail(q, url, `    <div class="hub-group-title" style="margin-top:28px;">More dates</div>
    <p class="salary-links"><a href="/benefit-payment-dates/${y}/">All of ${y}</a> ${YEARS.filter((x) => x !== y).map((x) => `<a href="/benefit-payment-dates/christmas-${x}/">Christmas ${x}</a>`).join(" ")} <a href="/days-until/christmas/">Days until Christmas</a></p>`);
}

function hub() {
  const url = SITE + "/benefit-payment-dates/";
  const title = "Benefit Payment Dates — Bank Holidays, Christmas & State Pension Days";
  const desc = "When UK benefits and pensions are paid early because of bank holidays and weekends: every year's changes, Christmas day by day, and your State Pension payment day.";
  const ld = [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], ["Benefit payment dates", url]])];
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="/">← All calculators</a>
      <h1 class="page-title">Benefit payment dates</h1>
      <p class="page-subtitle">When Universal Credit, the State Pension and other benefits are paid early because the usual day is a weekend or bank holiday.</p>
    </header>

    <main class="tool">
      <h2 class="tool-section-title">Christmas and New Year</h2>
      <p class="salary-links">${YEARS.map((y) => `<a href="/benefit-payment-dates/christmas-${y}/">Christmas ${y}</a>`).join(" ")}</p>
      <h2 class="tool-section-title" style="margin-top:20px;">Every bank holiday, by year</h2>
      <p class="salary-links">${YEARS.map((y) => `<a href="/benefit-payment-dates/${y}/">${y}</a>`).join(" ")}</p>
      <p class="about-text" style="margin-top:14px;">The rule: if your payment date is on a weekend or a bank holiday, you'll usually be paid on the working day before. Your State Pension day depends on the last 2 digits of your National Insurance number:</p>
${npTable()}      <p class="tool-hint" style="margin-top:12px;">Rules from ${SOURCES}.</p>
    </main>

${site.FOOTER}
  </div>
</body>
</html>
`;
}

/* checks: the rule on a known week (Christmas 2026: Friday 25 and the
   Monday 28 substitute for Boxing Day, so the 25th-28th are all paid on
   Thursday 24 December in England and Wales) */
if (YEARS.includes(2026)) ["2026-12-25", "2026-12-26", "2026-12-27", "2026-12-28"].forEach((d) => {
  if (iso(before(parse(d), "england-and-wales")) !== "2026-12-24") throw new Error("benefit dates check: " + d);
});

const urls = [["/benefit-payment-dates/", "0.5"]];
site.write("benefit-payment-dates", hub());
YEARS.forEach((y) => {
  site.write(`benefit-payment-dates/${y}`, yearPage(y)); urls.push([`/benefit-payment-dates/${y}/`, "0.5"]);
  site.write(`benefit-payment-dates/christmas-${y}`, christmasPage(y)); urls.push([`/benefit-payment-dates/christmas-${y}/`, "0.6"]);
});
site.sitemapBlock("benefit payment dates", "tools/build-benefit-dates-pages.js", urls);
console.log(`built benefit payment dates for ${YEARS.join(", ")} and their Christmases (GOV.UK bank holidays to ${H.lastPublished}, expected after)`);
