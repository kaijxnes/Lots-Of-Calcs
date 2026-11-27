#!/usr/bin/env node
/* The day rate calculator and a page for each day rate:

       /day-rate-calculator/
       /day-rate-calculator/400/   (£200 to £1,000 a day)

       node tools/build-day-rate-pages.js

   Converts a contractor day rate to an equivalent salary and back. Holiday
   (5.6 weeks, at most 28 days) comes from data/uk/rates-2026-27.json and the
   minimum employer pension and qualifying earnings band from
   data/uk/employer-cost.json, both checked against GOV.UK there. The pages
   are built from the same functions the calculator runs (day-rate.js), and
   the build stops unless hand-checked examples come out. Runs in the
   monthly rebuild. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const related = require("./related.js");
const DR = require("../day-rate.js");
const { esc, SITE } = site;

const J = (f) => JSON.parse(fs.readFileSync(path.join(site.ROOT, f), "utf8"));
const RATES = J("data/uk/rates-2026-27.json"), EC = J("data/uk/employer-cost.json");
const R = { weekdays: 260, holidayDays: Math.min(RATES.holiday.capDays, Math.round(RATES.holiday.weeks * 5)), pension: EC.pension };
const m0 = (v) => "£" + Math.round(v).toLocaleString("en-GB");
const m2 = (v) => "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
/* hand-checked: 260 − 28 − 10 = 222 days; £400 × 222 = £88,800; salary S over £50,270: S + 3% × £44,030 = S + £1,320.90, so S = £87,479.10;
   £30,000 salary: 3% of £23,760 = £712.80, £30,712.80 ÷ 222 = £138.35 a day; at 7.5 hours £18.45 an hour */
const a = DR.fromRate(R, { rate: 400, other: 10, hours: 7.5 }), b = DR.fromSalary(R, { salary: 30000, other: 10, hours: 7.5 });
if (R.holidayDays !== 28 || a.days !== 222 || a.income !== 88800 || a.salary !== 87479.1 || a.hourly !== 53.33 || b.total !== 30712.8 || b.rate !== 138.35 || b.hourly !== 18.45) throw new Error("day rate: a hand-checked example no longer comes out");

const BASE = "/day-rate-calculator/", RATESET = [200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800, 900, 1000];
const rurl = (n) => `${BASE}${n}/`;
const OTHER = 10, HOURS = 7.5;
const RULES = R;
const head = (title, desc, u, crumbs, q, app) => site.head({ title, desc, url: u, ld: [site.webPage(title, desc, u, RATES.lastChecked), site.breadcrumb(crumbs)].concat(app ? [app] : []).concat([site.faqLd(q)]) });
const SCRIPT = `  <script src="/day-rate.js"></script>`;

function tool(mode, amount) {
  const r = mode === "rate" ? DR.fromRate(R, { rate: amount, other: OTHER, hours: HOURS }) : DR.fromSalary(R, { salary: amount, other: OTHER, hours: HOURS });
  return `    <main class="tool split" id="dr-tool" data-rules="${esc(JSON.stringify(RULES))}">
      <div class="field-row">
        <div class="field"><label for="dr-mode">Work out</label><select id="dr-mode"><option value="rate"${mode === "rate" ? " selected" : ""}>Day rate to salary</option><option value="salary"${mode === "salary" ? " selected" : ""}>Salary to day rate</option></select></div>
        <div class="field"><label for="dr-amount" id="dr-amount-label">${mode === "rate" ? "Day rate" : "Salary a year"}</label><input type="number" id="dr-amount" value="${amount}" min="0" step="any" inputmode="decimal"></div>
      </div>
      <div class="field-row">
        <div class="field"><label for="dr-holiday">Holiday days (incl. bank holidays)</label><input type="number" id="dr-holiday" value="${R.holidayDays}" min="0" max="100" step="any" inputmode="decimal"></div>
        <div class="field"><label for="dr-other">Other unpaid days (gaps, sickness, training)</label><input type="number" id="dr-other" value="${OTHER}" min="0" max="200" step="any" inputmode="decimal"></div>
      </div>
      <div class="field-row">
        <div class="field"><label for="dr-pct">Employer pension in a permanent job (%)</label><input type="number" id="dr-pct" value="${R.pension.employerMinPct}" min="0" max="100" step="any" inputmode="decimal"></div>
        <div class="field"><label for="dr-hours">Hours in a working day</label><input type="number" id="dr-hours" value="${HOURS}" min="1" max="24" step="any" inputmode="decimal"></div>
      </div>
      <p class="tool-hint" id="dr-error" role="alert" style="color: var(--bad); display: none;"></p>
      <p class="tool-hint" style="margin:6px 0 0;">Before tax. ${R.weekdays} weekdays a year, less the holiday an employee would be paid for (${RATES.holiday.weeks} weeks, at most ${R.holidayDays} days) and other days you wouldn't bill. The <a href="/contractor-calculator/">contractor calculator</a> shows take-home inside and outside IR35.</p>
      <div class="result-box split-aside" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="dr-main">${mode === "rate" ? m0(r.salary) : m2(r.rate)}</div>
          <div class="label" id="dr-label">${mode === "rate" ? "equivalent salary a year" : "day rate to match it"}</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row"><span class="r-label">Days you'd bill a year</span><span class="r-value" id="dr-days">${r.days} days</span></div>
          <div class="result-row"><span class="r-label" id="dr-a-label">${mode === "rate" ? "Contract income a year" : "Salary and employer pension"}</span><span class="r-value" id="dr-a">${m0(mode === "rate" ? r.income : r.total)}</span></div>
          <div class="result-row"><span class="r-label" id="dr-b-label">${mode === "rate" ? "Employer pension it covers" : "Of which employer pension"}</span><span class="r-value" id="dr-b">${m0(r.pension)}</span></div>
          <div class="result-row"><span class="r-label" id="dr-c-label">An hour</span><span class="r-value" id="dr-c">${m2(r.hourly)}</span></div>
          <div class="result-row highlight"><span class="r-label">The rough "× ${R.weekdays}" figure</span><span class="r-value" id="dr-simple">${mode === "rate" ? m0(r.simple) : m2(r.simple) + " a day"}</span></div>
        </div>
      </div>
    </main>
`;
}
const explain = `    <main class="tool">
      <h2 class="tool-section-title">Why a day rate isn't rate × ${R.weekdays}</h2>
      <p class="about-text">There are about ${R.weekdays} weekdays in a year, but an employee is paid for ${RATES.holiday.weeks} weeks' holiday (at most ${R.holidayDays} days, which can include bank holidays) and gets at least ${R.pension.employerMinPct}% employer pension on earnings between ${m0(R.pension.lower)} and ${m0(R.pension.upper)} if they're auto-enrolled. A contractor is only paid for the days they bill, and usually has gaps between contracts too. So a fair comparison takes those days off: with ${R.holidayDays} days' holiday and ${OTHER} other unpaid days, you'd bill ${R.weekdays - R.holidayDays - OTHER} days a year.</p>
      <p class="about-text">This compares money before tax. Inside IR35, an umbrella company or the client runs your pay through PAYE, and outside IR35 your own limited company pays corporation tax and you take salary and dividends: the <a href="/contractor-calculator/">contractor calculator</a> shows take-home for both, and the <a href="/salary/">salary calculator</a> what an employee keeps.</p>
    </main>
`;

function page(n) {
  const u = SITE + rurl(n), r = DR.fromRate(R, { rate: n, other: OTHER, hours: HOURS });
  const rows = [[0, "No gaps between contracts"], [10, "10 unpaid days"], [20, "20 unpaid days"], [40, "40 unpaid days (8 weeks)"]].map(([o, l]) => { const x = DR.fromRate(R, { rate: n, other: o, hours: HOURS }); return [l, `${x.days} days`, m0(x.income), m0(x.salary)]; });
  const title = site.fitTitle(`${m0(n)} a Day Is How Much a Year? Day Rate to Salary UK`, `${m0(n)} a Day to Salary`);
  const desc = `${m0(n)} a day is ${m0(r.simple)} a year at ${R.weekdays} days, but about ${m0(r.income)} billing ${r.days} days, the same as a salary of about ${m0(r.salary)} with holiday and employer pension.`;
  const q = [
    [`${m0(n)} a day is how much a year?`, `${m0(r.simple)} if you worked all ${R.weekdays} weekdays. Allowing ${R.holidayDays} days' holiday and ${OTHER} other unpaid days, you'd bill ${r.days} days: ${m0(r.income)} a year.`],
    [`What salary is ${m0(n)} a day equivalent to?`, `About ${m0(r.salary)}: a permanent job paying that, with ${R.pension.employerMinPct}% employer pension and paid holiday, costs about the same as ${m0(n)} a day billed for ${r.days} days. Before tax.`],
    [`${m0(n)} a day is how much an hour?`, `${m2(r.hourly)} an hour over a ${HOURS}-hour day.`],
    [`How much is ${m0(n)} a day after tax?`, "It depends on whether you're inside or outside IR35: the contractor calculator works out take-home both ways."]
  ];
  const others = RATESET.filter((x) => x !== n).map((x) => `<a href="${rurl(x)}">${m0(x)}</a>`).join(" ");
  return head(title, desc, u, [["Home", SITE + "/"], ["Day Rate Calculator", SITE + BASE], [`${m0(n)} a day`, u]], q) + `    <header class="site-header">
      <a class="back-link" href="${BASE}">← Day rate calculator</a>
      <h1 class="page-title">${m0(n)} a day is how much a year?</h1>
      <p class="page-subtitle">About <strong>${m0(r.income)}</strong> billing ${r.days} days, like a salary of about <strong>${m0(r.salary)}</strong>.</p>
    </header>

${tool("rate", n)}
    <main class="tool">
      <h2 class="tool-section-title">${m0(n)} a day with gaps between contracts</h2>
${site.table(["Unpaid days apart from holiday", "Days billed", "Income a year", "Equivalent salary"], rows, 600)}      <p class="tool-hint" style="margin-top:8px;">With ${R.holidayDays} days' holiday and ${R.pension.employerMinPct}% employer pension on qualifying earnings. Before tax.</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}    </main>

    <div class="hub-group-title" style="margin-top:28px;">Other day rates</div>
    <p class="salary-links">${others}</p>

${site.FOOTER}
  </div>
${SCRIPT}
</body>
</html>
`;
}

function hub() {
  const u = SITE + BASE, ex = DR.fromRate(R, { rate: 400, other: OTHER, hours: HOURS });
  const rateRows = RATESET.map((n) => { const x = DR.fromRate(R, { rate: n, other: OTHER, hours: HOURS }); return [`<a href="${rurl(n)}">${m0(n)}</a>`, m0(x.simple), m0(x.income), m0(x.salary)]; });
  const salRows = [30000, 40000, 50000, 60000, 70000, 80000, 100000].map((s) => { const x = DR.fromSalary(R, { salary: s, other: OTHER, hours: HOURS }); return [m0(s), m2(x.simple), m2(x.rate)]; });
  const title = site.fitTitle("Day Rate Calculator UK — Day Rate to Salary and Salary to Day Rate", "Day Rate Calculator UK");
  const desc = `Convert a contractor day rate to an equivalent salary, or a salary to a day rate, allowing for holiday, gaps between contracts and employer pension. ${m0(400)} a day is like about ${m0(ex.salary)} a year.`;
  const q = [
    ["How do I convert a day rate to a salary?", `Multiply the day rate by the days you'd actually bill, not all ${R.weekdays} weekdays: take off the ${R.holidayDays} days' holiday an employee would be paid for and any gaps between contracts. ${m0(400)} a day over ${ex.days} days is ${m0(ex.income)}, like a salary of about ${m0(ex.salary)} once employer pension is allowed for.`],
    ["How do I work out a day rate from a salary?", `Add the employer pension the job would pay to the salary and divide by the days you'd bill. ${m0(60000)} works out at about ${m2(DR.fromSalary(R, { salary: 60000, other: OTHER }).rate)} a day over ${ex.days} days, against ${m2(60000 / R.weekdays)} by simply dividing by ${R.weekdays}.`],
    ["How many days a year does a contractor work?", `There are about ${R.weekdays} weekdays. Taking off ${R.holidayDays} days' holiday leaves ${R.weekdays - R.holidayDays}, and gaps between contracts, sickness and training usually take off more: ${ex.days} days allows ${OTHER}.`],
    ["Is a day rate before or after tax?", "Before. Inside IR35 an umbrella company or client deducts PAYE tax and National Insurance; outside IR35 your company pays corporation tax and you pay tax on what you take out. The contractor calculator works out take-home both ways."]
  ];
  const app = { "@context": "https://schema.org", "@type": "WebApplication", name: "Day Rate Calculator", url: u, applicationCategory: "BusinessApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } };
  return head(title, desc, u, [["Home", SITE + "/"], ["Personal Finance", SITE + "/personal-finance/"], ["Day Rate Calculator", u]], q, app) + `    <header class="site-header">
      <a class="back-link" href="/personal-finance/">← Personal finance calculators</a>
      <h1 class="page-title">Day rate calculator</h1>
      <p class="page-subtitle">A contractor day rate as a salary, or a salary as a day rate, allowing for holiday, gaps and pension.</p>
    </header>

${tool("rate", 400)}
    <main class="tool">
      <h2 class="tool-section-title">Day rate to salary</h2>
${site.table(["Day rate", `× ${R.weekdays} days`, `Billing ${ex.days} days`, "Equivalent salary"], rateRows, 600)}      <h2 class="tool-section-title" style="margin-top:18px;">Salary to day rate</h2>
${site.table(["Salary", `÷ ${R.weekdays} days`, "Day rate to match"], salRows, 480)}      <p class="tool-hint" style="margin-top:8px;">Billing ${ex.days} days (${R.holidayDays} days' holiday and ${OTHER} other unpaid days off ${R.weekdays}), with ${R.pension.employerMinPct}% employer pension on earnings between ${m0(R.pension.lower)} and ${m0(R.pension.upper)}. Before tax.</p>
    </main>

${explain}
    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}      <p class="tool-hint" style="margin-top:12px;">A guide, not advice. Holiday entitlement and pension minimums from GOV.UK, as on the <a href="/how-we-check/">how we check our figures</a> page.</p>
    </main>

${related.block(BASE)}
${site.FOOTER}
  </div>
${SCRIPT}
</body>
</html>
`;
}

const urls = [[BASE, "0.6"]];
site.write("day-rate-calculator", hub());
RATESET.forEach((n) => { site.write(`day-rate-calculator/${n}`, page(n)); urls.push([rurl(n), "0.5"]); });
site.sitemapBlock("day rate pages", "tools/build-day-rate-pages.js", urls);
console.log(`built the day rate calculator and ${RATESET.length} rate pages (${m0(400)} a day: about ${m0(a.salary)} salary)`);
