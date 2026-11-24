#!/usr/bin/env node
/* Biweekly pay schedule calculator and a page per year:

       /biweekly-pay-schedule/         paydays for any start date, weekly or biweekly
       /biweekly-pay-schedule/2027/    both Friday cycles: paydays, 3-paycheck months, 26 or 27

       node tools/build-pay-schedule-pages.js

   Years are this year and the next two, so it runs in the monthly rebuild
   and rolls forward each January. Maths: pay-schedule.js, the page's own code. */
const site = require("./lib/site.js");
const related = require("./related.js");
const P = require("../pay-schedule.js");
const { SITE } = site;

const BASE = "/biweekly-pay-schedule/";
const now = new Date();
const Y0 = now.getFullYear();
const YEARS = [Y0, Y0 + 1, Y0 + 2];
const DEFAULT_YEAR = now.getMonth() >= 8 ? Y0 + 1 : Y0;
const FRIDAY = 5;
const list = (ms) => ms.map((i) => P.MONTHS[i]).join(" and ").replace(/ and (?=.* and )/g, ", ");

function cycleInfo(year) {
  return P.cycles(year, FRIDAY).map((first) => {
    const days = P.paydays(first, year, 14);
    return { first, days, three: P.threeMonths(days), months: P.byMonth(days) };
  });
}

function monthTable(c) {
  return site.table(["Month", "Paydays", "Count"], c.months.map((x, i) => [P.MONTHS[i], x.map(P.nice).join(", "), x.length > 2 ? `<strong>${x.length} ★</strong>` : String(x.length)]), 340);
}

function tool(year, payday) {
  const c = cycleInfo(year)[0];
  return `    <main class="tool" id="ps-tool">
      <div class="field-row">
        <div class="field"><label for="ps-payday">Any one of your paydays</label><input type="date" id="ps-payday" value="${payday || ""}"></div>
        <div class="field"><label for="ps-year">Year</label><select id="ps-year">${YEARS.map((y) => `<option value="${y}"${y === year ? " selected" : ""}>${y}</option>`).join("")}</select></div>
      </div>
      <div class="field-row">
        <div class="field"><label for="ps-freq">Paid</label><select id="ps-freq"><option value="14" selected>Every two weeks (biweekly)</option><option value="7">Every week</option></select></div>
        <div class="field"><label for="ps-amount">Paycheck, after tax (optional)</label><input type="number" id="ps-amount" placeholder="e.g. 1800" min="0" step="any" inputmode="decimal"></div>
      </div>
      <div class="field" style="max-width:200px;"><label for="ps-cur">Currency</label><select id="ps-cur"><option value="$" selected>$</option><option value="C$">C$</option><option value="£">£</option><option value="€">€</option></select></div>
      <p class="tool-hint" id="ps-error" role="alert" style="color: var(--bad); display: none;"></p>
      <div class="result-box" aria-live="polite">
        <div class="result-hero"><div class="value" id="ps-count">${c.days.length}</div><div class="label" id="ps-count-label">biweekly paydays in ${year}</div></div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row highlight"><span class="r-label" id="ps-extra-label">Months with three paychecks</span><span class="r-value" id="ps-extra">${c.three.map((i) => P.MONTHS[i]).join(", ")}</span></div>
          <div class="result-row"><span class="r-label">Pay in the year</span><span class="r-value" id="ps-total">Add your paycheck to see it</span></div>
          <div class="result-row"><span class="r-label">Extra paychecks</span><span class="r-value" id="ps-extra-pay">—</span></div>
        </div>
      </div>
      <div class="no-print" style="margin:12px 0;"><button class="btn btn-ghost" id="ps-print" type="button"><svg class="ico" aria-hidden="true"><use href="/icons.svg#printer"></use></svg> Print the schedule</button></div>
      <div class="table-scroll">
        <div style="min-width:340px;">
          <table class="out-table">
            <thead><tr><th>Month</th><th>Paydays</th><th>Count</th></tr></thead>
            <tbody id="ps-months">
${c.months.map((x, i) => `<tr><td>${P.MONTHS[i]}</td><td>${x.map(P.nice).join(", ")}</td><td>${x.length}${x.length > 2 ? " ★" : ""}</td></tr>`).join("\n")}
            </tbody>
          </table>
        </div>
      </div>
      <p class="tool-hint" style="margin-top:12px;">★ marks months with an extra paycheck. If a payday falls on a public holiday, many employers pay the working day before — the dates here are the regular schedule.</p>
    </main>
`;
}

/* ---------------------------------------------------------------- calculator */
function calculatorPage() {
  const url = SITE + BASE, cs = cycleInfo(DEFAULT_YEAR);
  const title = "Biweekly Pay Schedule Calculator — Every Payday & 3-Paycheck Months";
  const desc = `Every payday in ${DEFAULT_YEAR} from any one of your paydays, which months have three paychecks, and whether it's a 27-paycheck year. Biweekly or weekly, with a printable schedule.`;
  const span = Array.from({ length: 12 }, (_, k) => Y0 + k);
  const rows27 = span.map((y) => {
    const [a, b] = cycleInfo(y);
    return [String(y), a.days.length === 27 ? `<strong>27</strong> (from ${P.nice(a.first)})` : "26", b.days.length === 27 ? `<strong>27</strong> (from ${P.nice(b.first)})` : "26"];
  });
  const q = [
    [`Which months have three paychecks in ${DEFAULT_YEAR}?`, `It depends on your pay cycle. Paid on Fridays starting ${P.niceLong(cs[0].first)}, it's ${list(cs[0].three)}; starting ${P.niceLong(cs[1].first)}, it's ${list(cs[1].three)}. Enter any of your paydays above for your own dates.`],
    ["How many paychecks are there in a year if I'm paid biweekly?", "Usually 26. A year has 52 weeks and one day (two in a leap year), so every 11 years or so the extra days add up and one biweekly cycle gets 27 paydays. The table below shows which years."],
    ["Is biweekly the same as twice a month?", "No. Biweekly is every two weeks — 26 paychecks a year, two most months and three in two of them. Twice a month (semi-monthly) is 24 paychecks on fixed dates, often the 15th and the last day of the month, so each paycheck is a bit larger."],
    ["How should I budget with biweekly pay?", "Plan your monthly bills around two paychecks. The months with a third paycheck then give you an extra one to save, pay down debt or cover yearly costs, and the 50/30/20 budget calculator shows how to split the rest."]
  ];
  const ld = [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], ["Biweekly Pay Schedule", url]]),
    { "@context": "https://schema.org", "@type": "WebApplication", name: "Biweekly Pay Schedule Calculator", url, applicationCategory: "FinanceApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } }, site.faqLd(q)];
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link no-print" href="/">← All calculators</a>
      <h1 class="page-title">Biweekly pay schedule</h1>
      <p class="page-subtitle">Enter one payday and see every payday in the year, the months with three paychecks, and whether you'll get 26 or 27.</p>
    </header>

${tool(DEFAULT_YEAR, "")}
    <main class="tool">
      <h2 class="tool-section-title">Biweekly pay schedules by year</h2>
      <p class="salary-links">${YEARS.map((y) => `<a href="${BASE}${y}/">${y} pay schedule</a>`).join(" ")}</p>
      <h2 class="tool-section-title" style="margin-top:18px;">Which years have 27 Friday paydays?</h2>
${site.table(["Year", "First cycle", "Second cycle"], rows27, 340)}      <p class="tool-hint" style="margin-top:12px;">Friday paydays, the two cycles being the first and second Friday of January. If your employer pays a fixed salary over 26 paychecks, a 27-paycheck year either adds an extra paycheck or spreads the salary thinner — ask your payroll team which.</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}    </main>

${related.block(BASE)}
${site.FOOTER}
  </div>
  <script src="/pay-schedule.js"></script>
</body>
</html>
`;
}

/* ---------------------------------------------------------------- year pages */
function yearPage(y) {
  const url = SITE + `${BASE}${y}/`, [a, b] = cycleInfo(y);
  const title = site.fitTitle(`Biweekly Pay Schedule ${y} — Paydays & 3-Paycheck Months`, `${y} Biweekly Pay Schedule — 3-Paycheck Months`);
  const desc = `${y} biweekly paydays on Fridays: from ${P.nice(a.first)} the three-paycheck months are ${list(a.three)} (${a.days.length} paydays); from ${P.nice(b.first)}, ${list(b.three)} (${b.days.length}).`;
  const q = [
    [`What months have 3 paychecks in ${y}?`, `Paid every other Friday from ${P.niceLong(a.first)}: ${list(a.three)}. From ${P.niceLong(b.first)}: ${list(b.three)}.`],
    [`How many pay periods are in ${y}?`, `${a.days.length} for the cycle starting ${P.nice(a.first)} and ${b.days.length} for the one starting ${P.nice(b.first)}. ${a.days.length === 27 || b.days.length === 27 ? `So ${y} is a 27-paycheck year for one of the Friday cycles.` : `Neither Friday cycle gets a 27th paycheck in ${y}.`}`],
    ["What if I'm not paid on Fridays?", "Put any one of your paydays into the biweekly pay schedule calculator and it lists every payday in the year, whatever the weekday."]
  ];
  const ld = [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], ["Biweekly Pay Schedule", SITE + BASE], [String(y), url]]), site.faqLd(q)];
  const others = YEARS.map((x) => x === y ? `<strong>${x}</strong>` : `<a href="${BASE}${x}/">${x}</a>`).join(" ");
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link no-print" href="${BASE}">← Biweekly pay schedule calculator</a>
      <h1 class="page-title">Biweekly pay schedule ${y}</h1>
      <p class="page-subtitle">Every Friday payday in ${y} for both biweekly cycles, with the months that bring a third paycheck.</p>
    </header>

    <main class="tool">
      <h2 class="tool-section-title">Paid every other Friday from ${P.niceLong(a.first)}</h2>
      <p class="about-text"><strong>${a.days.length} paydays.</strong> Three-paycheck months: <strong>${list(a.three)}</strong>.</p>
${monthTable(a)}    </main>

    <main class="tool">
      <h2 class="tool-section-title">Paid every other Friday from ${P.niceLong(b.first)}</h2>
      <p class="about-text"><strong>${b.days.length} paydays.</strong> Three-paycheck months: <strong>${list(b.three)}</strong>.</p>
${monthTable(b)}      <p class="tool-hint no-print" style="margin-top:12px;">Paid on another day, or want the total for your paycheck? Use the <a href="${BASE}?payday=${a.first}">biweekly pay schedule calculator</a>. If a payday falls on a public holiday, many employers pay the working day before.</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}    </main>

    <div class="hub-group-title no-print" style="margin-top:28px;">Other years</div>
    <p class="salary-links no-print">${others}</p>

${site.FOOTER}
  </div>
</body>
</html>
`;
}

/* Hand checks: 2027 starts on a Friday, so Fridays from 1 Jan give 27 paydays
   (1 Jan + 26 × 14 = 31 Dec) and three-paycheck months of January, July and December;
   from 8 Jan, 26 paydays with April and October */
{
  const [a, b] = cycleInfo(2027);
  if (a.first !== "2027-01-01" || a.days.length !== 27 || a.three.join() !== "0,6,11" || b.days.length !== 26 || b.three.join() !== "3,9") throw new Error("pay schedule check " + a.three + " / " + b.three);
}

const urls = [];
site.write("biweekly-pay-schedule", calculatorPage());
YEARS.forEach((y) => { site.write(`biweekly-pay-schedule/${y}`, yearPage(y)); urls.push([`${BASE}${y}/`, "0.6"]); });
site.prune("biweekly-pay-schedule", /^\d{4}$/);
site.sitemapBlock("pay schedule pages", "tools/build-pay-schedule-pages.js", urls);
console.log(`built ${BASE} and ${YEARS.join(", ")}`);
