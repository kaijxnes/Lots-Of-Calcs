#!/usr/bin/env node
/* The State Pension forecast calculator and a page for each number of
   qualifying years:

       /state-pension-forecast-calculator/
       /state-pension-forecast-calculator/20-qualifying-years/   (10 to 34)

       node tools/build-state-pension-forecast-pages.js

   The full rate, 10 and 35 year rules and the Class 3 voluntary rate are
   quoted from GOV.UK and the Pensions Act 2014 in
   data/uk/state-pension-forecast.json; the pages are built from the same
   functions the calculator runs (state-pension-forecast.js). The build stops
   unless each figure is in the quoted wording, the full rate agrees with
   data/uk/rates-2026-27.json and data/uk/state-pension-age.json, and
   hand-checked examples come out. Runs in the monthly rebuild. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const related = require("./related.js");
const SPF = require("../state-pension-forecast.js");
const { esc, SITE } = site;

const J = (f) => JSON.parse(fs.readFileSync(path.join(site.ROOT, f), "utf8"));
const R = J("data/uk/state-pension-forecast.json"), RATES = J("data/uk/rates-2026-27.json"), SPA = J("data/uk/state-pension-age.json");
const m2 = (v) => "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const m0 = (v) => "£" + Math.round(v).toLocaleString("en-GB");
const Q = (k) => R.rules[k].quote;
[["fullRate", m2(R.fullWeekly)], ["eachYear", m2(R.fullWeekly)], ["tenYears", `${R.minYears} qualifying years`], ["thirtyFive", `${R.fullYears} qualifying years`], ["full35", `${R.fullYears} or more qualifying years`],
  ["class3", `${m2(R.class3Weekly)} a week for Class 3`], ["sixYears", `past ${R.payBackYears} years`], ["class3", R.taxYear.replace(/(\d{4})\/(\d\d)/, (_, a, b) => `${a} to 20${b}`)]]
  .forEach(([k, s]) => { if (!Q(k).includes(s)) throw new Error(`state pension forecast: "${s}" isn't in the quoted wording for ${k} (data/uk/state-pension-forecast.json)`); });
if (RATES.pensions.statePensionWeekly !== R.fullWeekly || !SPA.rules.fullRate.quote.includes(m2(R.fullWeekly))) throw new Error("state pension forecast: the full rate differs from data/uk/rates-2026-27.json or state-pension-age.json");
if (R.taxYear !== RATES.taxYear) throw new Error(`state pension forecast: the data is for ${R.taxYear}, the rates file for ${RATES.taxYear}: update the full rate and Class 3 rate`);
/* hand-checked at £241.30 and £18.40: 20 years £137.89; 30 years £206.83; 9 years nothing; 40 years £241.30; each year £6.89 a week, £358.50 a year;
   52 weeks of Class 3 £956.80, back in about 2.7 years; 1 Nov 2026 to State Pension age on 1 June 2050: 24 full tax years */
const c20 = SPF.calc(R, { years: 20 });
if (R.taxYear === "2026/27" && (c20.weekly !== 137.89 || SPF.weekly(R, 30) !== 206.83 || SPF.weekly(R, 9) !== 0 || SPF.weekly(R, 40) !== 241.3 || c20.eachWeekly !== 6.89 || c20.eachYear !== 358.5 || c20.class3Year !== 956.8 || Math.round(c20.payback * 10) !== 27)) throw new Error("state pension forecast: a hand-checked example no longer comes out");
if (SPF.yearsLeft("2026-11-01", "2050-06-01") !== 24 || SPF.yearsLeft("2027-04-05", "2027-04-06") !== 1 || SPF.yearsLeft("2027-04-06", "2028-04-06") !== 1) throw new Error("state pension forecast: tax years left came out wrong");

const BASE = "/state-pension-forecast-calculator/", YEARS = Array.from({ length: R.fullYears - R.minYears }, (_, i) => R.minYears + i);
const yurl = (n) => `${BASE}${n}-qualifying-years/`;
const SRC = R.sources.map((s) => `<a href="${s.url}" rel="nofollow noopener" target="_blank">${esc(s.title)}</a>`).join(", ");
const RULES = { fullWeekly: R.fullWeekly, fullYears: R.fullYears, minYears: R.minYears, class3Weekly: R.class3Weekly, spaTables: { women1995: SPA.tables.women1995, women2011: SPA.tables.women2011, to66: SPA.tables.to66, to67: SPA.tables.to67, to68: SPA.tables.to68 } };
const each = SPF.calc(R, { years: 0 });

function tool(years, add) {
  const r = SPF.calc(R, { years, add });
  return `    <main class="tool split" id="spf-tool" data-rules="${esc(JSON.stringify(RULES))}">
      <div class="field-row">
        <div class="field"><label for="spf-years">Qualifying years on your record now</label><input type="number" id="spf-years" value="${years}" min="0" max="70" step="1" inputmode="numeric"></div>
        <div class="field"><label for="spf-add">Years you'll add before State Pension age</label><input type="number" id="spf-add" value="${add}" min="0" max="70" step="1" inputmode="numeric"></div>
      </div>
      <div class="field"><label for="spf-dob">Or work out the years left from your date of birth</label><input type="date" id="spf-dob" min="1950-01-01" max="2010-12-31"></div>
      <p class="tool-hint" id="spf-spa" aria-live="polite" style="margin:6px 0 0;"></p>
      <p class="tool-hint" id="spf-error" role="alert" style="color: var(--bad); display: none;"></p>
      <p class="tool-hint" style="margin:6px 0 0;">Your <a href="https://www.gov.uk/check-state-pension" rel="nofollow noopener" target="_blank">State Pension forecast</a> on GOV.UK shows your qualifying years. A year counts if you worked and paid National Insurance, got National Insurance credits (for example if you were unemployed, ill, or a parent or carer), or paid voluntary contributions.</p>
      <div class="result-box split-aside" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="spf-weekly">${m2(r.weekly)}</div>
          <div class="label" id="spf-label">a week in today's money, from ${r.counted} qualifying years</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row"><span class="r-label">A year (52 weeks)</span><span class="r-value" id="spf-year">${m2(r.year)}</span></div>
          <div class="result-row"><span class="r-label">Every 4 weeks</span><span class="r-value" id="spf-four">${m2(r.fourWeeks)}</span></div>
          <div class="result-row"><span class="r-label">Qualifying years at State Pension age</span><span class="r-value" id="spf-total">${r.total}</span></div>
          <div class="result-row"><span class="r-label">Short of the full ${R.fullYears}</span><span class="r-value" id="spf-short">${r.short ? r.short + " years" : "None: the full rate"}</span></div>
          <div class="result-row highlight"><span class="r-label">Each extra year adds</span><span class="r-value" id="spf-each">${r.short ? `${m2(r.eachWeekly)} a week (${m2(r.eachYear)} a year)` : "—"}</span></div>
          <div class="result-row"><span class="r-label">A year of voluntary Class 3 costs</span><span class="r-value" id="spf-cost">${r.short ? `${m2(r.class3Year)}: paid back in about ${(Math.round(r.payback * 10) / 10).toLocaleString("en-GB")} years` : "—"}</span></div>
        </div>
        <p class="tool-hint" id="spf-note" style="margin:10px 0 0;"></p>
      </div>
    </main>
`;
}
const explain = `    <main class="tool">
      <h2 class="tool-section-title">How qualifying years set your State Pension</h2>
      <p class="about-text">The full new State Pension is <strong>${m2(R.fullWeekly)} a week</strong> (${esc(R.taxYear)}). You need <strong>${R.minYears} qualifying years</strong> on your National Insurance record to get any, and ${R.fullYears} for the full rate if your record started after April 2016. In between, the Pensions Act 2014 gives 1/${R.fullYears} of the full rate for each qualifying year: <strong>${m2(each.eachWeekly)} a week</strong>, or ${m2(each.eachYear)} a year.</p>
      <p class="about-text"><strong>Filling gaps:</strong> voluntary Class 3 contributions are ${m2(R.class3Weekly)} a week (${esc(R.taxYear)}), so a full year is ${m2(each.class3Year)}. If it adds a qualifying year that raises your pension, that comes back in about ${(Math.round(each.payback * 10) / 10).toLocaleString("en-GB")} years of State Pension. You can usually only pay for the past ${R.payBackYears} years, with a 5 April deadline each year. Voluntary contributions don't always increase your State Pension, for example if you were contracted out, so check your forecast or ask the Future Pension Centre before paying.</p>
      <p class="about-text"><strong>If your record started before April 2016</strong>, your amount could be different if you were contracted out before 2016 (you'll usually need more than ${R.fullYears} years for the full rate) or paid into the Additional State Pension. Your forecast is the best guide; this calculator shows the rule for records that started after April 2016. The State Pension rises each year by the highest of earnings growth, prices (CPI) or 2.5%, so these figures are in today's money.</p>
    </main>
`;
const head = (title, desc, u, crumbs, q, app) => site.head({ title, desc, url: u, ld: [site.webPage(title, desc, u, R.lastChecked), site.breadcrumb(crumbs)].concat(app ? [app] : []).concat([site.faqLd(q)]) });
const SCRIPT = `  <script src="/state-pension-age.js"></script>
  <script src="/state-pension-forecast.js"></script>`;
const foot = `      <p class="tool-hint" style="margin-top:12px;">An estimate in today's money, not advice. Rules from ${SRC} (GOV.UK and legislation.gov.uk). Last checked ${site.niceDate(R.lastChecked)}.</p>`;

function page(n) {
  const u = SITE + yurl(n), w = SPF.weekly(R, n), r = SPF.calc(R, { years: n }), gap = R.fullYears - n;
  const rows = [0, 1, 2, 3, 5, 10].filter((a) => n + a <= R.fullYears).map((a) => { const x = SPF.calc(R, { years: n, add: a }); return [a ? `${n + a} (${a} more)` : `${n}`, m2(x.weekly), m2(x.year), a ? `+${m2(x.year - r.year)}` : "—"]; });
  if (n + 10 < R.fullYears) rows.push([`${R.fullYears} (the full rate)`, m2(R.fullWeekly), m2(R.fullWeekly * 52), `+${m2(p2(R.fullWeekly * 52) - r.year)}`]);
  const title = site.fitTitle(`State Pension With ${n} Qualifying Years — ${m2(w)} a Week`, `State Pension With ${n} Qualifying Years`);
  const desc = `With ${n} qualifying years of National Insurance you'd get about ${m2(w)} a week (${m0(w * 52)} a year) of new State Pension, ${n}/${R.fullYears} of the full ${m2(R.fullWeekly)}. Each extra year adds ${m2(r.eachWeekly)} a week.`;
  const q = [
    [`How much State Pension will I get with ${n} years of National Insurance?`, `About ${m2(w)} a week (${m2(w * 52)} a year): ${n}/${R.fullYears} of the full ${m2(R.fullWeekly)}, in ${esc(R.taxYear)} money. That's the rule if your record started after April 2016; your State Pension forecast shows your own amount.`],
    [`How many more years do I need for the full State Pension?`, `${gap} more ${gap === 1 ? "year" : "years"}, to reach ${R.fullYears}. Each one adds ${m2(r.eachWeekly)} a week, or ${m2(r.eachYear)} a year.`],
    ["Is it worth paying voluntary National Insurance?", `A year of Class 3 costs ${m2(r.class3Year)} (${m2(R.class3Weekly)} a week). If it adds a qualifying year that raises your pension, you get ${m2(r.eachYear)} a year back, so it pays for itself in about ${(Math.round(r.payback * 10) / 10).toLocaleString("en-GB")} years. Check your forecast first: it doesn't always increase your pension.`],
    [n < 15 ? `What if I have fewer than ${R.minYears} years?` : "Will I keep building qualifying years?", n < 15 ? `You need ${R.minYears} qualifying years to get any new State Pension. Years living or working in some other countries may count towards the ${R.minYears}.` : "Yes, while you work and pay National Insurance or get NI credits, until State Pension age. If you keep working after State Pension age you stop paying National Insurance."]
  ];
  const near = YEARS.filter((x) => x !== n).map((x) => `<a href="${yurl(x)}">${x} years</a>`).join(" ");
  return head(title, desc, u, [["Home", SITE + "/"], ["State Pension Forecast Calculator", SITE + BASE], [`${n} qualifying years`, u]], q) + `    <header class="site-header">
      <a class="back-link" href="${BASE}">← State Pension forecast calculator</a>
      <h1 class="page-title">State Pension with ${n} qualifying years</h1>
      <p class="page-subtitle">About <strong>${m2(w)} a week</strong>: ${n}/${R.fullYears} of the full new State Pension (${esc(R.taxYear)}).</p>
    </header>

${tool(n, 0)}
    <main class="tool">
      <h2 class="tool-section-title">From ${n} years to the full rate</h2>
${site.table(["Qualifying years", "A week", "A year", "Extra a year"], rows, 560)}      <p class="tool-hint" style="margin-top:8px;">In ${esc(R.taxYear)} money, for a record that started after April 2016. A year of voluntary Class 3 contributions costs ${m2(r.class3Year)}.</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}${foot}
    </main>

    <div class="hub-group-title" style="margin-top:28px;">Other numbers of years</div>
    <p class="salary-links">${near}</p>

${site.FOOTER}
  </div>
${SCRIPT}
</body>
</html>
`;
}
const p2 = (v) => Math.round(v * 100) / 100;

function hub() {
  const u = SITE + BASE, ex = SPF.calc(R, { years: 20, add: 10 });
  const grid = YEARS.concat([R.fullYears]).map((n) => [n < R.fullYears ? `<a href="${yurl(n)}">${n}</a>` : `${n} or more`, m2(SPF.weekly(R, n)), m2(SPF.weekly(R, n) * 52), `${Math.round(n / R.fullYears * 1000) / 10}%`]);
  const title = site.fitTitle("State Pension Forecast Calculator — Qualifying Years and Voluntary NI", "State Pension Forecast Calculator");
  const desc = `How much new State Pension your National Insurance years give: ${m2(R.fullWeekly)} a week for ${R.fullYears} years, ${m2(each.eachWeekly)} a week for each year from ${R.minYears}, and whether paying voluntary Class 3 to fill a gap is worth it.`;
  const q = [
    ["How much State Pension will I get?", `${m2(R.fullWeekly)} a week with ${R.fullYears} qualifying years (${esc(R.taxYear)}). With fewer, you get 1/${R.fullYears} of that for each year (${m2(each.eachWeekly)} a week), as long as you have at least ${R.minYears}. Records from before April 2016 can differ; your GOV.UK forecast shows yours.`],
    ["How many years of National Insurance do I need for a full State Pension?", `${R.fullYears} qualifying years if your record started after April 2016. If you were contracted out before 2016, you'll usually need more than ${R.fullYears}.`],
    ["What's the minimum for any State Pension?", `${R.minYears} qualifying years on your National Insurance record. With fewer you get no new State Pension, unless years in some other countries count towards the ${R.minYears}.`],
    ["How much does a year of voluntary National Insurance cost?", `${m2(R.class3Weekly)} a week for Class 3 in ${esc(R.taxYear)}, so ${m2(each.class3Year)} for a full year. A year that raises your pension adds ${m2(each.eachYear)} a year, so it pays back in about ${(Math.round(each.payback * 10) / 10).toLocaleString("en-GB")} years.`],
    ["How far back can I pay voluntary National Insurance?", `Usually the past ${R.payBackYears} years, with a deadline of 5 April each year.`]
  ];
  const app = { "@context": "https://schema.org", "@type": "WebApplication", name: "State Pension Forecast Calculator", url: u, applicationCategory: "FinanceApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } };
  return head(title, desc, u, [["Home", SITE + "/"], ["Personal Finance", SITE + "/personal-finance/"], ["State Pension Forecast Calculator", u]], q, app) + `    <header class="site-header">
      <a class="back-link" href="/personal-finance/">← Personal finance calculators</a>
      <h1 class="page-title">State Pension forecast calculator</h1>
      <p class="page-subtitle">Your new State Pension from your National Insurance years, and whether filling a gap pays.</p>
    </header>

${tool(20, 10)}
    <main class="tool">
      <h2 class="tool-section-title">State Pension by qualifying years</h2>
${site.table(["Qualifying years", "A week", "A year", "Of the full rate"], grid, 520)}      <p class="tool-hint" style="margin-top:8px;">${esc(R.taxYear)}, for a record that started after April 2016. Fewer than ${R.minYears} years: no new State Pension. Pick a number for more.</p>
    </main>

${explain}
    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}${foot}
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
site.write("state-pension-forecast-calculator", hub());
YEARS.forEach((n) => { site.write(`state-pension-forecast-calculator/${n}-qualifying-years`, page(n)); urls.push([yurl(n), "0.5"]); });
site.sitemapBlock("state pension forecast pages", "tools/build-state-pension-forecast-pages.js", urls);
console.log(`built the State Pension forecast calculator and ${YEARS.length} pages (20 years: ${m2(c20.weekly)} a week)`);
