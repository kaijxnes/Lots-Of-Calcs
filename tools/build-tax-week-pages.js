#!/usr/bin/env node
/* UK tax week and tax month calendars, one page per tax year, plus a hub.

       /tax-week-calendar/            hub, with the current tax year first
       /tax-week-calendar/2026-27/    weeks 1–53 and months 1–12 for one tax year

   The definitions are the Income Tax (PAYE) Regulations 2003, reg. 2:
   tax week 1 is 6 to 12 April and each following 7 days is the next week,
   except that week 53 is just the last day of the tax year (the last two
   days in a leap year); a tax month runs from the 6th of one month to the
   5th of the next. GOV.UK gives the PAYE payment dates (the 22nd of the
   next tax month, or the 19th if paying by cheque) and the week-53 numbers
   used on the final FPS (53 weekly, 54 fortnightly, 56 four-weekly).

   Pure date arithmetic, so the pages run from two tax years back to four
   ahead and roll forward on their own each year (build-monthly.js runs this). */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const { esc, SITE } = site;

const DAY = 86400000;
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const utc = (y, m, d) => Date.UTC(y, m, d);
const D = (t) => new Date(t);
const dow = (t) => D(t).getUTCDay();
const short = (t) => `${DAYS[dow(t)].slice(0, 3)} ${D(t).getUTCDate()} ${MONTHS[D(t).getUTCMonth()].slice(0, 3)} ${D(t).getUTCFullYear()}`;
const dm = (t) => `${D(t).getUTCDate()} ${MONTHS[D(t).getUTCMonth()]}`;
const dmy = (t) => `${dm(t)} ${D(t).getUTCFullYear()}`;
const long = (t) => `${DAYS[dow(t)]} ${dmy(t)}`;
const and = (a) => (a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1]);

const TODAY = Date.parse(site.TODAY + "T00:00:00Z");
/* the tax year that contains today: it starts on 6 April */
const CURRENT = D(TODAY).getUTCMonth() > 3 || (D(TODAY).getUTCMonth() === 3 && D(TODAY).getUTCDate() >= 6) ? D(TODAY).getUTCFullYear() : D(TODAY).getUTCFullYear() - 1;
const YEARS = []; for (let y = CURRENT - 2; y <= CURRENT + 4; y++) YEARS.push(y);
const label = (y) => `${y}-${String(y + 1).slice(2)}`;          // 2026-27 (URL)
const named = (y) => `${y}/${String(y + 1).slice(2)}`;          // 2026/27 (text)
const BASE = "/tax-week-calendar/";
const purl = (y) => `${BASE}${label(y)}/`;

function taxYear(y) {
  const start = utc(y, 3, 6), end = utc(y + 1, 3, 5);
  const weeks = [];
  for (let n = 1; n <= 52; n++) weeks.push({ n, from: start + (n - 1) * 7 * DAY, to: start + (n * 7 - 1) * DAY });
  weeks.push({ n: 53, from: start + 364 * DAY, to: end });
  const months = [];
  for (let n = 1; n <= 12; n++) {
    const m = (3 + n - 1) % 12, yy = y + (3 + n - 1 >= 12 ? 1 : 0);
    const from = utc(yy, m, 6), to = utc(yy, m + 1, 5);
    const due = utc(D(to).getUTCFullYear(), D(to).getUTCMonth(), 22), post = utc(D(to).getUTCFullYear(), D(to).getUTCMonth(), 19);
    months.push({ n, from, to, due, post, q: Math.ceil(n / 3) });
  }
  const monthOf = (t) => months.find((mo) => t >= mo.from && t <= mo.to).n;
  weeks.forEach((w) => { const a = monthOf(w.from), b = monthOf(w.to); w.months = a === b ? `${a}` : `${a}–${b}`; });
  months.forEach((mo) => { const ws = weeks.filter((w) => w.to >= mo.from && w.from <= mo.to).map((w) => w.n); mo.weeks = `${ws[0]}–${ws[ws.length - 1]}`; });
  const leap = (end - start) / DAY + 1 === 366;
  return { start, end, weeks, months, leap, w53: weeks[52], weekOf: (t) => weeks.find((w) => t >= w.from && t <= w.to).n, monthOf };
}

/* Today's tax week and month, worked out in the visitor's browser so the
   page never goes stale between builds. On a year page it also bolds the
   current rows, if today falls in that tax year. */
const NOW_SCRIPT = (y) => `    <script>
(function () {
  var n = new Date(), y = n.getFullYear(), m = n.getMonth(), d = n.getDate();
  var ty = (m > 3 || (m === 3 && d >= 6)) ? y : y - 1;
  var day = Math.round((Date.UTC(y, m, d) - Date.UTC(ty, 3, 6)) / 864e5);
  var wk = Math.min(53, Math.floor(day / 7) + 1), mo = ((d >= 6 ? m - 3 : m - 4) + 12) % 12 + 1;
  var label = ty + "/" + String(ty + 1).slice(2), page = ${y === null ? "null" : y};
  var p = document.querySelector(".tw-now");
  if (p) {
    p.innerHTML = "Today is in <strong>tax week " + wk + "</strong> and <strong>tax month " + mo + "</strong> of the ";
    if (page === ty) p.appendChild(document.createTextNode(label + " tax year (bold below)."));
    else {
      var a = document.createElement("a");
      a.setAttribute("href", "${BASE}" + ty + "-" + String(ty + 1).slice(2) + "/");
      a.textContent = label + " tax year";
      p.appendChild(a); p.appendChild(document.createTextNode("."));
    }
    p.hidden = false;
  }
  if (page !== ty) return;
  var t = document.querySelectorAll("table.out-table tbody");
  [[t[0], mo], [t[1], wk]].forEach(function (x) { var r = x[0] && x[0].rows[x[1] - 1]; if (r) r.style.fontWeight = "700"; });
})();
    </script>`;

function yearPage(y) {
  const T = taxYear(y), url = SITE + purl(y), w53 = T.w53;
  const w53days = [];
  for (let t = w53.from; t <= w53.to; t += DAY) w53days.push(DAYS[dow(t)]);
  const w53text = w53.from === w53.to ? long(w53.from) : `${long(w53.from)} and ${long(w53.to)}`;
  const weekRows = T.weeks.map((w) => [String(w.n), short(w.from), short(w.to), w.months]);
  const monthRows = T.months.map((mo) => [String(mo.n), `${dm(mo.from)} – ${dm(mo.to)} ${D(mo.to).getUTCFullYear()}`, mo.weeks, `Q${mo.q}`, dmy(mo.due), dmy(mo.post)]);
  /* a few dates people look up */
  const xmas = utc(y, 11, 25), ny = utc(y + 1, 0, 1), mid = utc(y, 9, 6);
  const q = [
    [`When does tax week 1 start in ${named(y)}?`, `Tax week 1 runs from ${long(T.start)} to ${long(T.weeks[0].to)}. Every tax year starts on 6 April, so week 1 always starts on 6 April whatever day of the week that is.`],
    [`What is week 53 in ${named(y)}?`, `Week 53 is ${w53text}: the ${T.leap ? "two days" : "one day"} left over after 52 full weeks${T.leap ? " (there are two because the tax year includes 29 February)" : ""}. Employees paid weekly on a ${and(w53days)} get a week 53 payment, which goes on the final FPS as week 53 (54 if paid fortnightly, 56 if paid every 4 weeks).`],
    [`What tax week and tax month is Christmas Day ${y}?`, `${long(xmas)} is in tax week ${T.weekOf(xmas)} and tax month ${T.monthOf(xmas)}.`],
    [`What tax week is 1 January ${y + 1}?`, `${long(ny)} is in tax week ${T.weekOf(ny)} and tax month ${T.monthOf(ny)}.`],
    [`When is PAYE due for tax month 1 of ${named(y)}?`, `Tax month 1 runs from 6 April to 5 May ${y}. PAYE for it is due by ${dmy(T.months[0].due)} if you pay electronically, or must reach HMRC by ${dmy(T.months[0].post)} by cheque. Each later month follows the same pattern: the 22nd of the next month.`],
    [`How are tax weeks and tax months defined?`, `By the Income Tax (PAYE) Regulations 2003: tax week 1 is 6 to 12 April and each following 7 days is the next week, with week 53 being just the last day of the tax year (the last two days in a leap year). A tax month runs from the 6th of one month to the 5th of the next, so ${dm(mid)} is always the first day of tax month 7.`]
  ];
  const title = site.fitTitle(`Tax Week Calendar ${named(y)} — UK Tax Weeks 1–53 and Tax Months`, `Tax Week Calendar ${named(y)} — UK Tax Weeks and Months`);
  const desc = `UK tax weeks 1–53 and tax months 1–12 for ${named(y)} (6 April ${y} to 5 April ${y + 1}), with the PAYE due date for each month and when week 53 falls.`;
  const ld = [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], ["Tax week calendar", SITE + BASE], [named(y), url]]), site.faqLd(q)];
  const other = YEARS.filter((x) => x !== y).map((x) => `<a href="${purl(x)}">Tax week calendar ${named(x)}</a>`).join(" ");
  const pay = [y, y + 1].filter((c) => fs.existsSync(path.join(site.ROOT, "working-days", String(c), "payday-calendar", "index.html")))
    .map((c) => `<a href="/working-days/${c}/payday-calendar/">Payday calendar ${c}</a>`).join(" ");
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="${BASE}">← Tax week calendars</a>
      <h1 class="page-title">Tax week calendar ${named(y)}</h1>
      <p class="page-subtitle">UK tax weeks and tax months for the ${named(y)} tax year, which runs from ${long(T.start)} to ${long(T.end)}.</p>
    </header>

    <main class="tool">
      <h2 class="tool-section-title">Tax months and PAYE due dates</h2>
      <p class="tw-now" hidden></p>
${site.table(["Month", "Dates", "Tax weeks", "Quarter", "PAYE due", "By cheque"], monthRows, 600)}      <p class="tool-hint" style="margin-top:12px;">PAYE is due by the 22nd of the next tax month if you pay electronically, or must reach HMRC by the 19th if you send a cheque. If you pay quarterly, PAYE is due by the 22nd after the quarter ends (22 July, 22 October, 22 January and 22 April).</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">Tax weeks 1 to 53</h2>
${site.table(["Week", "Starts", "Ends", "Tax month"], weekRows, 480)}      <p class="tool-hint" style="margin-top:12px;">Week 53 is ${esc(w53text)}. ${T.leap ? "It has two days because the tax year includes 29 February. " : ""}If your weekly payday is a ${and(w53days)}, you'll have 53 paydays this tax year.</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}      <p class="tool-hint">Definitions from the <a href="https://www.legislation.gov.uk/uksi/2003/2682/regulation/2" rel="nofollow noopener" target="_blank">Income Tax (PAYE) Regulations 2003, regulation 2</a>; payment dates from GOV.UK's <a href="https://www.gov.uk/pay-paye-tax" rel="nofollow noopener" target="_blank">Pay employers' PAYE</a> and <a href="https://www.gov.uk/payroll-annual-reporting" rel="nofollow noopener" target="_blank">Payroll: annual reporting</a>.</p>
    </main>

    <div class="hub-group-title" style="margin-top:28px;">Other tax years</div>
    <p class="salary-links">${other}</p>
    <div class="hub-group-title" style="margin-top:18px;">Related</div>
    <p class="salary-links">${pay} <a href="/salary/">Take-home pay calculator</a> <a href="/week-number/">Week number</a></p>
${NOW_SCRIPT(y)}
${site.FOOTER}
  </div>
</body>
</html>
`;
}

function hub() {
  const url = SITE + BASE;
  const title = "UK Tax Week Calendar — Tax Weeks and Tax Months by Tax Year";
  const desc = `UK tax weeks 1–53 and tax months 1–12 for every tax year from ${named(YEARS[0])} to ${named(YEARS[YEARS.length - 1])}, with PAYE due dates and when week 53 falls.`;
  const ld = [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], ["Tax week calendar", url]])];
  const rows = YEARS.map((y) => { const t = taxYear(y); return [`<a href="${purl(y)}">${named(y)}</a>`, `${dmy(t.start)} – ${dmy(t.end)}`, t.w53.from === t.w53.to ? short(t.w53.from) : `${short(t.w53.from)} – ${short(t.w53.to)}`]; });
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="/working-days/">← Working days calculator</a>
      <h1 class="page-title">UK tax week calendar</h1>
      <p class="page-subtitle">Tax weeks and tax months for payroll: the tax year starts on 6 April, tax week 1 is 6 to 12 April and tax month 1 is 6 April to 5 May.</p>
    </header>

    <main class="tool">
      <h2 class="tool-section-title">This week</h2>
      <p class="tw-now">Tax week 1 starts on 6 April each year and tax month 1 runs from 6 April to 5 May.</p>
      <h2 class="tool-section-title" style="margin-top:18px;">Calendars by tax year</h2>
${site.table(["Tax year", "Runs", "Week 53"], rows, 460)}      <p class="tool-hint" style="margin-top:12px;">Week 53 is the day (two days in a leap year) left after 52 full weeks. Employees paid weekly on that day of the week get 53 paydays in the year. Definitions from the <a href="https://www.legislation.gov.uk/uksi/2003/2682/regulation/2" rel="nofollow noopener" target="_blank">Income Tax (PAYE) Regulations 2003</a>.</p>
    </main>
${NOW_SCRIPT(null)}
${site.FOOTER}
  </div>
</body>
</html>
`;
}

const urls = [[BASE, "0.5"]];
site.write("tax-week-calendar", hub());
YEARS.forEach((y) => { site.write(`tax-week-calendar/${label(y)}`, yearPage(y)); urls.push([purl(y), "0.5"]); });
site.sitemapBlock("tax week calendars", "tools/build-tax-week-pages.js", urls);
console.log(`built the tax week calendar hub and ${YEARS.length} tax years (${named(YEARS[0])}–${named(YEARS[YEARS.length - 1])})`);
