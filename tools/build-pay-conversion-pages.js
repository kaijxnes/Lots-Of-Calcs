#!/usr/bin/env node
/* Gross pay conversions, before tax — the "how much is $25 an hour a year"
   searches, which the after-tax salary pages don't answer directly:

       /hourly-to-salary/                         the converter (hourly, daily, weekly, monthly, yearly)
       /hourly-to-salary/25-dollars-an-hour/      $25 an hour = $52,000 a year
       /hourly-to-salary/15-pounds-an-hour/       £15 an hour = £29,250 a year
       /salary-to-hourly/50000-dollars-a-year/    $50,000 a year = $24.04 an hour
       /salary-to-hourly/30000-pounds-a-year/     £30,000 a year = £15.38 an hour

       node tools/build-pay-conversion-pages.js

   A year is 52 weeks (the usual payroll convention), a month is a twelfth of
   the year, a working day 8 hours (7.5 in the UK). The US full-time week is
   40 hours, the UK's 37.5 — every page says so and tabulates other weeks.
   Each page links to the matching after-tax page where there is one. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const related = require("./related.js");
const config = require("./salary-pages-config.js");
const { SITE, esc } = site;

const range = (a, b, s) => { const o = []; for (let v = a; v <= b; v += s) o.push(v); return o; };
const CUR = {
  USD: {
    sym: "$", word: "dollars", locale: "en-US", hours: 40, day: 8, country: "US",
    hourly: range(10, 50, 1).concat(range(55, 100, 5)),
    yearly: range(20000, 100000, 5000).concat([110000, 120000, 125000, 130000, 140000, 150000, 175000, 200000, 250000]),
    weeks: [20, 25, 30, 32, 35, 40, 45, 50, 60],
    afterHour: (r) => config.HOURLY.USD.national.includes(r) ? `/salary/us/${r}-an-hour-after-tax/` : null,
    afterYear: () => "/salary/us/"
  },
  GBP: {
    sym: "£", word: "pounds", locale: "en-GB", hours: 37.5, day: 7.5, country: "UK",
    hourly: range(10, 30, 1).concat([32, 35, 40, 45, 50, 60, 75, 100]),
    yearly: range(15000, 40000, 1000).concat(range(45000, 100000, 5000), [110000, 120000, 125000, 150000, 200000]),
    weeks: [16, 20, 22.5, 25, 30, 35, 37.5, 40, 45, 48],
    afterHour: (r) => config.HOURLY.GBP.rates.includes(r) ? `/salary/${r}-an-hour-after-tax/` : null,
    afterYear: (y) => config.SALARIES.GBP.includes(y) ? `/salary/${y}-after-tax/` : null
  }
};

const H = "/hourly-to-salary/", Y = "/salary-to-hourly/";
const hSlug = (c, r) => `${r}-${CUR[c].word}-an-hour`;
const ySlug = (c, y) => `${y}-${CUR[c].word}-a-year`;

function fmt(c, v, dp) {
  const C = CUR[c];
  const d = dp === undefined ? (Math.round(v * 100) % 100 === 0 ? 0 : 2) : dp;
  return C.sym + v.toLocaleString(C.locale, { minimumFractionDigits: d, maximumFractionDigits: d });
}
const r2 = (v) => Math.round(v * 100) / 100;
const short = (c, y) => CUR[c].sym + (y % 1000 === 0 ? (y / 1000) + "k" : y.toLocaleString(CUR[c].locale));

/* every period from an annual figure */
function periods(c, year, hours) {
  const C = CUR[c], h = hours || C.hours;
  return { year, month: year / 12, biweekly: year / 26, week: year / 52, day: year / 52 / (h / C.day), hour: year / 52 / h };
}

function breakdownRows(c, p) {
  const f = (v) => fmt(c, r2(v), 2);
  return [["A year", fmt(c, r2(p.year))], ["A month", f(p.month)], ...(c === "USD" ? [["Every two weeks", f(p.biweekly)]] : []), ["A week", f(p.week)], [`A day (${CUR[c].day} hours)`, f(p.day)], ["An hour", f(p.hour)]];
}

function hoursTable(c, rate) {
  return CUR[c].weeks.map((h) => [h === CUR[c].hours ? `<strong>${h} hours</strong>` : `${h} hours`, fmt(c, r2(rate * h)), fmt(c, r2(rate * h * 52 / 12), 2), fmt(c, r2(rate * h * 52))]);
}

function ld(title, desc, url, crumbs, q) {
  return [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], ["Hourly to Salary Converter", SITE + H]].concat(crumbs)), site.faqLd(q)];
}

function tool(c, mode, value) {
  const C = CUR[c];
  return `    <main class="tool" id="pc-tool" data-currency="${c}" data-locale="${C.locale}" data-sym="${C.sym}" data-day="${C.day}">
      <div class="field-row">
        <div class="field"><label for="pc-amount">Pay (${C.sym})</label><input type="number" id="pc-amount" value="${value}" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="pc-per">Per</label><select id="pc-per"><option value="hour"${mode === "hour" ? " selected" : ""}>Hour</option><option value="day">Day</option><option value="week">Week</option><option value="month">Month</option><option value="year"${mode === "year" ? " selected" : ""}>Year</option></select></div>
      </div>
      <div class="field-row">
        <div class="field"><label for="pc-hours">Hours a week</label><input type="number" id="pc-hours" value="${C.hours}" min="1" max="168" step="any" inputmode="decimal"></div>
        <div class="field"><label for="pc-weeks">Paid weeks a year</label><input type="number" id="pc-weeks" value="52" min="1" max="52" step="any" inputmode="decimal"></div>
      </div>
      <p class="tool-hint" id="pc-error" role="alert" style="color: var(--bad); display: none;"></p>
      <div class="result-box" aria-live="polite">
        <div class="result-grid">
          <div class="result-row${mode === "hour" ? " highlight" : ""}"><span class="r-label">A year</span><span class="r-value" data-pc="year"></span></div>
          <div class="result-row"><span class="r-label">A month</span><span class="r-value" data-pc="month"></span></div>
          <div class="result-row"><span class="r-label">Every two weeks</span><span class="r-value" data-pc="biweekly"></span></div>
          <div class="result-row"><span class="r-label">A week</span><span class="r-value" data-pc="week"></span></div>
          <div class="result-row"><span class="r-label">A day (${C.day} hours)</span><span class="r-value" data-pc="day"></span></div>
          <div class="result-row${mode === "year" ? " highlight" : ""}"><span class="r-label">An hour</span><span class="r-value" data-pc="hour"></span></div>
        </div>
      </div>
      <p class="tool-hint" style="margin-top:12px;">Before tax. Set paid weeks below 52 if your holidays are unpaid (50 for two weeks off).</p>
    </main>
`;
}

function hourPage(c, rate) {
  const C = CUR[c], p = periods(c, rate * C.hours * 52), url = SITE + H + hSlug(c, rate) + "/";
  const yr = fmt(c, r2(p.year)), after = C.afterHour(rate);
  const unpaid = fmt(c, r2(rate * C.hours * 50)), part = fmt(c, r2(rate * (c === "USD" ? 20 : 22.5) * 52)), ot = fmt(c, r2(rate * 1.5), 2);
  const title = site.fitTitle(`${fmt(c, rate)} an Hour Is How Much a Year? ${yr} (${C.country}, Before Tax)`, `${fmt(c, rate)} an Hour Is How Much a Year? ${yr}`);
  const desc = `${fmt(c, rate)} an hour is ${yr} a year before tax, working ${C.hours} hours a week — ${fmt(c, r2(p.month), 2)} a month and ${fmt(c, r2(p.week), 2)} a week. With part-time hours, unpaid holiday and overtime worked out.`;
  const q = [
    [`${fmt(c, rate)} an hour is how much a year?`, `${yr} before tax: ${fmt(c, rate)} × ${C.hours} hours × 52 weeks.`],
    [`${fmt(c, rate)} an hour is how much a month?`, `${fmt(c, r2(p.month), 2)} before tax — a year's pay of ${yr} divided by 12. Months aren't all the same length, so a monthly figure is an average.`],
    [`${fmt(c, rate)} an hour is how much a week?`, `${fmt(c, r2(p.week), 2)} for ${C.hours} hours.${c === "USD" ? ` Every two weeks that's ${fmt(c, r2(p.biweekly), 2)}.` : ""}`],
    [`What if my holiday is unpaid?`, `With two weeks off unpaid you're paid for 50 weeks: ${unpaid} a year.`],
    [`What's ${fmt(c, rate)} an hour part-time?`, `At ${c === "USD" ? 20 : 22.5} hours a week, ${part} a year. The table above has other weekly hours.`],
    [`What is time and a half on ${fmt(c, rate)} an hour?`, `${ot} an hour (${fmt(c, rate)} × 1.5); double time is ${fmt(c, r2(rate * 2), 2)}.`]
  ];
  const nb = site.neighbours(C.hourly, rate, 5).concat([rate]).sort((a, b) => a - b)
    .map((r) => [r === rate ? `<strong>${fmt(c, r)} an hour</strong>` : `<a href="${H}${hSlug(c, r)}/">${fmt(c, r)} an hour</a>`, fmt(c, r2(r * C.hours * 52))]);
  return site.head({ title, desc, url, ld: ld(title, desc, url, [[`${fmt(c, rate)} an hour`, url]], q) }) + `    <header class="site-header">
      <a class="back-link" href="${H}">← Hourly to salary converter</a>
      <h1 class="page-title">${fmt(c, rate)} an hour is how much a year?</h1>
      <p class="page-subtitle">${fmt(c, rate)} an hour is <strong>${yr} a year</strong> before tax, at ${C.hours} hours a week for 52 weeks.</p>
    </header>

    <main class="tool">
      <p class="tool-section-title">${fmt(c, rate)} an hour at ${C.hours} hours a week</p>
${site.table(["Per", "Before tax"], breakdownRows(c, p), 260)}${after ? `      <p class="about-text" style="margin-top:12px;"><strong>After tax:</strong> see <a href="${after}">${fmt(c, rate)} an hour after tax</a>${c === "USD" ? " in every state" : ""}.</p>\n` : `      <p class="about-text" style="margin-top:12px;"><strong>After tax:</strong> put ${yr} into the <a href="/salary/">salary calculator</a>.</p>\n`}    </main>

${tool(c, "hour", rate)}
    <main class="tool">
      <p class="tool-section-title">${fmt(c, rate)} an hour by hours worked</p>
${site.table(["Hours a week", "A week", "A month", "A year"], hoursTable(c, rate), 420)}      <p class="tool-section-title" style="margin-top:20px;">How it's worked out</p>
      <p class="about-text">Hourly rate × hours a week × 52 weeks: ${fmt(c, rate)} × ${C.hours} × 52 = <strong>${yr}</strong>. A quick check: ${c === "USD" ? `at 40 hours a week, double the hourly rate and add three zeros (${fmt(c, rate)} → about ${fmt(c, rate * 2000)}).` : `at 37.5 hours a week, multiply the hourly rate by 1,950.`}</p>
      <p class="tool-section-title" style="margin-top:20px;">Nearby hourly rates</p>
${site.table(["Hourly", "A year"], nb, 260)}    </main>

    <main class="tool">
      <p class="tool-section-title">Frequently asked questions</p>
${site.faqHtml(q)}    </main>

${site.FOOTER}
  </div>
  <script src="/pay-convert.js"></script>
</body>
</html>
`;
}

function yearPage(c, year) {
  const C = CUR[c], p = periods(c, year), url = SITE + Y + ySlug(c, year) + "/";
  const hr = fmt(c, r2(p.hour), 2), after = C.afterYear(year), rounded = Math.round(p.hour);
  const title = site.fitTitle(`${short(c, year)} a Year Is How Much an Hour? ${hr} (${C.country}, Before Tax)`, `${short(c, year)} a Year Is How Much an Hour? ${hr}`);
  const desc = `${fmt(c, year)} a year is ${hr} an hour before tax at ${C.hours} hours a week — ${fmt(c, r2(p.month), 2)} a month, ${fmt(c, r2(p.week), 2)} a week and ${fmt(c, r2(p.day), 2)} a day.`;
  const q = [
    [`${short(c, year)} a year is how much an hour?`, `${hr} before tax: ${fmt(c, year)} ÷ 52 weeks ÷ ${C.hours} hours.`],
    [`${short(c, year)} a year is how much a month?`, `${fmt(c, r2(p.month), 2)} before tax (${fmt(c, year)} ÷ 12).`],
    [`${short(c, year)} a year is how much a week?`, `${fmt(c, r2(p.week), 2)} (${fmt(c, year)} ÷ 52)${c === "USD" ? `, or ${fmt(c, r2(p.biweekly), 2)} every two weeks` : ""}.`],
    [`Is ${short(c, year)} a year a good salary?`, c === "USD" ? `It's ${hr} an hour full-time. Whether it's good depends on where you live — take-home pay varies by state, which the after-tax pages show.` : `It's ${hr} an hour full-time. For what you'd take home, see the after-tax figure${after ? "" : " in the salary calculator"}.`]
  ];
  const nb = site.neighbours(C.yearly, year, 5).concat([year]).sort((a, b) => a - b)
    .map((y) => [y === year ? `<strong>${fmt(c, y)} a year</strong>` : `<a href="${Y}${ySlug(c, y)}/">${fmt(c, y)} a year</a>`, fmt(c, r2(y / 52 / C.hours), 2)]);
  const hoursRows = C.weeks.map((h) => [h === C.hours ? `<strong>${h} hours</strong>` : `${h} hours`, fmt(c, r2(year / 52 / h), 2)]);
  const hourLink = C.hourly.includes(rounded) ? ` It's close to <a href="${H}${hSlug(c, rounded)}/">${fmt(c, rounded)} an hour</a>.` : "";
  return site.head({ title, desc, url, ld: ld(title, desc, url, [[`${short(c, year)} a year to hourly`, url]], q) }) + `    <header class="site-header">
      <a class="back-link" href="${H}">← Hourly to salary converter</a>
      <h1 class="page-title">${short(c, year)} a year is how much an hour?</h1>
      <p class="page-subtitle">${fmt(c, year)} a year is <strong>${hr} an hour</strong> before tax, at ${C.hours} hours a week for 52 weeks.</p>
    </header>

    <main class="tool">
      <p class="tool-section-title">${fmt(c, year)} a year broken down</p>
${site.table(["Per", "Before tax"], breakdownRows(c, p), 260)}      <p class="about-text" style="margin-top:12px;"><strong>After tax:</strong> ${after ? `see <a href="${after}">${fmt(c, year)} after tax</a>.` : c === "USD" ? `pick your state on the <a href="/salary/us/">US salary after tax</a> pages.` : `use the <a href="/salary/">salary calculator</a>.`}${hourLink}</p>
    </main>

${tool(c, "year", year)}
    <main class="tool">
      <p class="tool-section-title">${fmt(c, year)} a year by hours worked</p>
${site.table(["Hours a week", "An hour"], hoursRows, 260)}      <p class="tool-section-title" style="margin-top:20px;">How it's worked out</p>
      <p class="about-text">Salary ÷ 52 weeks ÷ hours a week: ${fmt(c, year)} ÷ 52 ÷ ${C.hours} = <strong>${hr}</strong>. ${c === "USD" ? `A quick check at 40 hours: halve the salary and drop three zeros (${fmt(c, year)} → about ${fmt(c, year / 2000, 2)}).` : `At 37.5 hours a week that's the salary divided by 1,950.`}</p>
      <p class="tool-section-title" style="margin-top:20px;">Nearby salaries</p>
${site.table(["Salary", "An hour"], nb, 260)}    </main>

    <main class="tool">
      <p class="tool-section-title">Frequently asked questions</p>
${site.faqHtml(q)}    </main>

${site.FOOTER}
  </div>
  <script src="/pay-convert.js"></script>
</body>
</html>
`;
}

function hub() {
  const url = SITE + H;
  const title = "Hourly to Salary Converter — Hourly, Weekly, Monthly and Yearly Pay";
  const desc = "Convert hourly pay to a yearly salary and back, before tax — with weekly, biweekly, monthly and daily figures, your own hours and unpaid weeks. US and UK tables.";
  const q = [
    ["How do I convert an hourly wage to a yearly salary?", "Multiply the hourly rate by the hours you work a week, then by 52. At 40 hours a week that's the hourly rate × 2,080; at 37.5 hours it's × 1,950."],
    ["How do I convert a salary to an hourly rate?", "Divide the yearly salary by 52, then by your weekly hours. At 40 hours a week, divide by 2,080: $50,000 is $24.04 an hour."],
    ["How many working hours are in a year?", "2,080 at 40 hours a week for 52 weeks, or 1,950 at 37.5 hours. Paid holiday is included, because you're paid for it; if it's unpaid, use fewer weeks."],
    ["Is this before or after tax?", "Before tax. For take-home pay, use the salary calculator or the after-tax pages linked from each rate."]
  ];
  const links = (c) => `      <p class="salary-links"><strong>${CUR[c].sym} an hour → a year:</strong> ${CUR[c].hourly.map((r) => `<a href="${H}${hSlug(c, r)}/">${fmt(c, r)}</a>`).join(" ")}</p>
      <p class="salary-links"><strong>${CUR[c].sym} a year → an hour:</strong> ${CUR[c].yearly.map((y) => `<a href="${Y}${ySlug(c, y)}/">${short(c, y)}</a>`).join(" ")}</p>`;
  const ldx = [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], ["Hourly to Salary Converter", url]]),
    { "@context": "https://schema.org", "@type": "WebApplication", name: "Hourly to Salary Converter", url, applicationCategory: "FinanceApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } }, site.faqLd(q)];
  return site.head({ title, desc, url, ld: ldx }) + `    <header class="site-header">
      <a class="back-link" href="/">← All calculators</a>
      <h1 class="page-title">Hourly to salary converter</h1>
      <p class="page-subtitle">Hourly, daily, weekly, monthly and yearly pay, before tax — enter any one and see the rest.</p>
    </header>

${tool("USD", "hour", 25).replace('id="pc-tool" data-currency="USD"', 'id="pc-tool" data-switch="1" data-currency="USD"').replace('<label for="pc-amount">Pay ($)</label>', '<label for="pc-amount">Pay</label>').replace('<div class="field"><label for="pc-per">', '<div class="field"><label for="pc-cur">Currency</label><select id="pc-cur"><option value="USD" data-sym="$" data-locale="en-US" data-hours="40" data-day="8">$ (40-hour week)</option><option value="GBP" data-sym="£" data-locale="en-GB" data-hours="37.5" data-day="7.5">£ (37.5-hour week)</option><option value="EUR" data-sym="€" data-locale="en-IE" data-hours="40" data-day="8">€ (40-hour week)</option></select></div>\n        <div class="field"><label for="pc-per">')}
    <main class="tool">
      <p class="tool-section-title">Hourly rates and salaries worked out</p>
${links("USD")}
${links("GBP")}
    </main>

    <main class="tool">
      <p class="tool-section-title">Frequently asked questions</p>
${site.faqHtml(q)}    </main>

${related.block(H)}
${site.FOOTER}
  </div>
  <script src="/pay-convert.js"></script>
</body>
</html>
`;
}

/* Hand checks: $25 × 40 × 52 = 52,000; £15 × 37.5 × 52 = 29,250; $50,000 ÷ 2,080 = 24.04 */
if (25 * 40 * 52 !== 52000 || 15 * 37.5 * 52 !== 29250 || r2(50000 / 2080) !== 24.04) throw new Error("pay conversion check");

const urls = [[H, "0.8"]];
site.write("hourly-to-salary", hub());
Object.keys(CUR).forEach((c) => {
  CUR[c].hourly.forEach((r) => { site.write(`hourly-to-salary/${hSlug(c, r)}`, hourPage(c, r)); urls.push([`${H}${hSlug(c, r)}/`, "0.5"]); });
  CUR[c].yearly.forEach((y) => { site.write(`salary-to-hourly/${ySlug(c, y)}`, yearPage(c, y)); urls.push([`${Y}${ySlug(c, y)}/`, "0.5"]); });
});
site.prune("hourly-to-salary", /^\d+-(dollars|pounds)-an-hour$/);
site.prune("salary-to-hourly", /^\d+-(dollars|pounds)-a-year$/);
site.sitemapBlock("pay conversion pages", "tools/build-pay-conversion-pages.js", urls.filter((u) => u[0] !== H));
console.log(`built ${urls.length} pay conversion pages`);
