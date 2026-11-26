#!/usr/bin/env node
/* Pro rata salary calculator and "£30,000 pro rata 3 days a week" pages:

       /pro-rata-salary-calculator/                          calculator
       /pro-rata-salary-calculator/30000-3-days-a-week/      one salary, one pattern

       node tools/build-pro-rata-pages.js

   Part-time pay in proportion to the hours worked (GOV.UK's rule, quoted in
   data/uk/pro-rata.json) and take-home pay from the UK tax files in force
   through tax-engine.js, using the same functions as the page (pro-rata.js).
   The build stops unless GOV.UK's example (half the hours, £500 of £1,000)
   comes out. Runs in the monthly rebuild, after the salary pages. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const related = require("./related.js");
const TaxEngine = require("../tax-engine.js");
const registry = require("./tax/registry.js");
const PR = require("../pro-rata.js");
const { esc, SITE } = site;

const G = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/uk/pro-rata.json"), "utf8"));
const all = registry.readAll(), current = registry.currentFiles(all);
const CH = { gb: registry.chainFor(current.gb.doc, all), "gb-sct": registry.chainFor(current["gb-sct"].doc, all) };
const YEAR = current.gb.doc.taxYear.label;
const OPTS = TaxEngine.merge(CH.gb).options;
const m = (v) => TaxEngine.money(v, "GBP"), m0 = (v) => TaxEngine.money(v, "GBP", true);
const pc = (v) => `${(Math.round(v * 1000) / 10).toLocaleString("en-GB")}%`;
const FH = 37.5, BASE = "/pro-rata-salary-calculator/";
const SALARIES = [20000, 25000, 30000, 35000, 40000, 45000, 50000, 60000], DAYS = [2, 3, 4];
const url = (s, d) => `${BASE}${s}-${d}-days-a-week/`;
const calc = (s, h, id = "gb", o = {}) => PR.calc(TaxEngine, CH[id], s, FH, h, o);

/* GOV.UK: half the hours of a £1,000 bonus is £500 */
if (Math.round(1000 * PR.hoursOf(FH, "hours", FH / 2) / FH) !== 500 || PR.hoursOf(FH, "days", 3) !== 22.5) throw new Error("pro rata: GOV.UK's half-hours example doesn't come out at £500");

const optionFields = Object.keys(OPTS).map((k) => {
  const o = OPTS[k];
  const field = o.type === "number"
    ? `<input type="number" id="pp-opt-${k}" value="${o.default}"${o.min !== undefined ? ` min="${o.min}"` : ""}${o.max !== undefined ? ` max="${o.max}"` : ""} step="${o.step || "any"}" inputmode="decimal">`
    : `<select id="pp-opt-${k}">${Object.keys(o.choices).map((c) => `<option value="${esc(c)}"${c === o.default ? " selected" : ""}>${esc(o.choices[c])}</option>`).join("")}</select>`;
  return `<div class="field"><label for="pp-opt-${k}">${esc(o.label)}</label>${field}</div>`;
}).join("\n        ");

function tool(salary, days) {
  const h = PR.hoursOf(FH, "days", days), s = calc(salary, h);
  return `    <main class="tool split" id="pp-tool">
      <div class="field-row">
        <div class="field"><label for="pp-salary">Full-time salary (a year)</label><input type="number" id="pp-salary" value="${salary}" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="pp-fullhours">Full-time hours a week</label><input type="number" id="pp-fullhours" value="${FH}" min="1" max="80" step="any" inputmode="decimal"></div>
      </div>
      <div class="field-row">
        <div class="field"><label for="pp-mode">You work</label><select id="pp-mode"><option value="days" selected>Days a week</option><option value="hours">Hours a week</option></select></div>
        <div class="field"><label for="pp-amount" id="pp-amount-label">Days a week you work</label><input type="number" id="pp-amount" value="${days}" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="pp-region">Where you pay tax</label><select id="pp-region"><option value="gb" selected>England, Wales or Northern Ireland</option><option value="gb-sct">Scotland</option></select></div>
      </div>
      <div class="field-row" id="pp-options" style="flex-wrap:wrap;">
        ${optionFields}
      </div>
      <p class="tool-hint" id="pp-error" role="alert" style="color: var(--bad); display: none;"></p>
      <div class="result-box split-aside" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="pp-salary-out">${m0(s.salary)}</div>
          <div class="label" id="pp-label">a year pro rata: ${pc(s.share)} of ${m0(salary)} for ${h.toLocaleString("en-GB")} hours a week</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row"><span class="r-label">Gross a month</span><span class="r-value" id="pp-month">${m(s.salary / 12)}</span></div>
          <div class="result-row highlight"><span class="r-label">Take-home a month</span><span class="r-value" id="pp-net">${m(s.net / 12)}</span></div>
          <div class="result-row"><span class="r-label">Full-time take-home a month</span><span class="r-value" id="pp-full">${m(s.fullNet / 12)}</span></div>
          <div class="result-row"><span class="r-label">Share of full-time take-home</span><span class="r-value" id="pp-netshare">${pc(s.netShare)}</span></div>
          <div class="result-row"><span class="r-label">Hourly rate (same as full-time)</span><span class="r-value" id="pp-hourly">${m(s.hourly)}</span></div>
        </div>
      </div>
      <p class="tool-hint" style="margin:6px 0 0;">A day is a fifth of the full-time week. ${esc(YEAR)} UK tax, tax code 1257L.</p>
    </main>
`;
}

const head = (title, desc, u, crumbs, q, app) => site.head({ title, desc, url: u, ld: [site.webPage(title, desc, u, G.lastChecked), site.breadcrumb(crumbs)].concat(app ? [app] : []).concat([site.faqLd(q)]) });
const scripts = `  <script src="/tax-engine.js"></script>
  <script src="/pro-rata.js"></script>`;
const SRC = `<a href="${G.sources[0].url}" rel="nofollow noopener" target="_blank">${esc(G.sources[0].title)}</a>`;

function page(salary, days) {
  const u = SITE + url(salary, days), h = PR.hoursOf(FH, "days", days), s = calc(salary, h), sc = calc(salary, h, "gb-sct");
  const p2 = calc(salary, h, "gb", { studentLoan: "plan2" });
  const others = DAYS.filter((d) => d !== days).map((d) => `<a href="${url(salary, d)}">${m0(salary)} ${d} days a week</a>`)
    .concat(SALARIES.filter((x) => x !== salary).map((x) => `<a href="${url(x, days)}">${m0(x)} ${days} days a week</a>`)).join(" ");
  const rows = [
    ["Gross", m0(s.salary), m(s.salary / 12), m(s.salary / 52)],
    ["Income Tax", m(s.r.byGroup.tax), m(s.r.byGroup.tax / 12), m(s.r.byGroup.tax / 52)],
    ["National Insurance", m(s.r.byGroup.social), m(s.r.byGroup.social / 12), m(s.r.byGroup.social / 52)],
    ["<strong>Take-home</strong>", `<strong>${m(s.net)}</strong>`, `<strong>${m(s.net / 12)}</strong>`, `<strong>${m(s.net / 52)}</strong>`]
  ];
  const title = site.fitTitle(`${m0(salary)} Pro Rata ${days} Days a Week — Salary and Take-Home (${YEAR})`, `${m0(salary)} Pro Rata ${days} Days a Week (${YEAR})`);
  const desc = `${m0(salary)} pro rata for ${days} days a week is ${m0(s.salary)} a year (${m(s.salary / 12)} a month), or ${m(s.net / 12)} a month after tax in ${YEAR}.`;
  const q = [
    [`What is ${m0(salary)} pro rata for ${days} days a week?`, `${m0(s.salary)} a year: ${days} days out of 5 is ${pc(s.share)} of the full-time salary. That's ${m(s.salary / 12)} a month before tax.`],
    [`How much is ${m0(salary)} pro rata ${days} days a week after tax?`, `${m(s.net / 12)} a month (${m(s.net)} a year) in England, Wales and Northern Ireland, and ${m(sc.net / 12)} a month in Scotland, with tax code 1257L and no student loan or pension. With a Plan 2 student loan it's ${m(p2.net / 12)} a month.`],
    [`Why do I take home more than ${pc(s.share)} of the full-time pay?`, `Because the first ${m0(12570)} is tax-free and National Insurance starts at the same point, a smaller salary loses a smaller share to tax. Full-time take-home on ${m0(salary)} is ${m(s.fullNet / 12)} a month; ${days} days a week keeps ${pc(s.netShare)} of it.`],
    ["Is my hourly rate lower if I work part time?", `No. Part-time workers should get the same pay rates as comparable full-time workers, so the hourly rate stays at about ${m(s.hourly)} on a ${FH}-hour week.`]
  ];
  const crumbs = [["Home", SITE + "/"], ["Pro Rata Salary Calculator", SITE + BASE], [`${m0(salary)} ${days} days a week`, u]];
  return head(title, desc, u, crumbs, q) + `    <header class="site-header">
      <a class="back-link" href="${BASE}">← Pro rata salary calculator</a>
      <h1 class="page-title">${m0(salary)} pro rata ${days} days a week</h1>
      <p class="page-subtitle"><strong>${m0(s.salary)}</strong> a year, or <strong>${m(s.net / 12)}</strong> a month after tax (${esc(YEAR)}).</p>
    </header>

${tool(salary, days)}
    <main class="tool">
      <h2 class="tool-section-title">${m0(s.salary)} after tax</h2>
${site.table(["", "A year", "A month", "A week"], rows, 520)}      <p class="tool-hint" style="margin-top:8px;">England, Wales and Northern Ireland, ${esc(YEAR)}, tax code 1257L, no student loan or pension.</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}    </main>

    <div class="hub-group-title" style="margin-top:28px;">Other salaries and days</div>
    <p class="salary-links">${others}</p>

${site.FOOTER}
  </div>
${scripts}
</body>
</html>
`;
}

function hub() {
  const u = SITE + BASE, ex = calc(30000, 22.5);
  const grid = SALARIES.map((s) => [m0(s)].concat(DAYS.map((d) => { const r = calc(s, PR.hoursOf(FH, "days", d)); return `<a href="${url(s, d)}">${m0(r.salary)}</a> · ${m(r.net / 12)}/mo`; })));
  const title = site.fitTitle("Pro Rata Salary Calculator UK — Part-Time Pay and Take-Home", "Pro Rata Salary Calculator UK");
  const desc = `Work out a pro rata salary for part-time hours or days, and what it comes to after tax. ${m0(30000)} for 3 days a week is ${m0(ex.salary)}, ${m(ex.net / 12)} a month after tax (${YEAR}).`;
  const q = [
    ["How do I work out a pro rata salary?", `Divide your hours by the full-time hours and multiply by the full-time salary. On a ${FH}-hour week, 22.5 hours (3 days) is 60%, so ${m0(30000)} pro rata is ${m0(18000)}. GOV.UK's example: working half the hours of a full-time worker who gets a £1,000 bonus, a part-time worker should get £500.`],
    ["What counts as full time?", "There's no legal number of hours, but GOV.UK says a full-time worker will usually work 35 hours or more a week. Use your employer's full-time hours, often 37.5 or 40."],
    ["Will I pay less tax working part time?", `Yes, as a share of pay. The Personal Allowance and National Insurance threshold don't shrink when you go part time, so more of a smaller salary is tax-free: 3 days a week on ${m0(30000)} keeps ${pc(ex.netShare)} of the full-time take-home for 60% of the hours.`],
    ["Do part-time workers get the same holiday and benefits?", "Yes, in proportion: part-time workers should get the same treatment for pay rates, pensions, holidays and training, with some benefits applied pro rata. The holiday entitlement calculator works out pro rata holiday."]
  ];
  const app = { "@context": "https://schema.org", "@type": "WebApplication", name: "Pro Rata Salary Calculator", url: u, applicationCategory: "FinanceApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } };
  return head(title, desc, u, [["Home", SITE + "/"], ["Personal Finance", SITE + "/personal-finance/"], ["Pro Rata Salary Calculator", u]], q, app) + `    <header class="site-header">
      <a class="back-link" href="/personal-finance/">← Personal finance calculators</a>
      <h1 class="page-title">Pro rata salary calculator</h1>
      <p class="page-subtitle">A part-time salary from the full-time one, and what it comes to after tax.</p>
    </header>

${tool(30000, 3)}
    <main class="tool">
      <h2 class="tool-section-title">Pro rata salary by days a week</h2>
${site.table(["Full-time salary"].concat(DAYS.map((d) => `${d} days a week`)), grid, 560)}      <p class="tool-hint" style="margin-top:8px;">Pro rata salary and take-home a month, ${FH}-hour full-time week, ${esc(YEAR)}, England, Wales and Northern Ireland. Pick one for the full breakdown.</p>
      <h2 class="tool-section-title" style="margin-top:18px;">How pro rata pay works</h2>
      <p class="about-text">Part-time workers shouldn't be treated less favourably than comparable full-time workers just because they work fewer hours. That means the same hourly pay rate, and benefits such as bonuses and holiday in proportion to the hours: GOV.UK's example is a part-time worker on half the hours getting £500 of a £1,000 Christmas bonus. Overtime rates may only start once you've worked more than a full-time worker's normal hours. For holiday, the <a href="/holiday-entitlement-calculator/">holiday entitlement calculator</a> does the pro rata sum; for an hourly rate, the <a href="/hourly-to-salary/">hourly to salary calculator</a>.</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}      <p class="tool-hint" style="margin-top:12px;">Part-time rules from ${SRC}; ${esc(YEAR)} rates from the UK tax files. Last checked ${site.niceDate(G.lastChecked)}.</p>
    </main>

${related.block(BASE)}
${site.FOOTER}
  </div>
${scripts}
</body>
</html>
`;
}

const urls = [[BASE, "0.6"]];
site.write("pro-rata-salary-calculator", hub());
SALARIES.forEach((s) => DAYS.forEach((d) => { site.write(`pro-rata-salary-calculator/${s}-${d}-days-a-week`, page(s, d)); urls.push([url(s, d), "0.5"]); }));
site.prune("pro-rata-salary-calculator", /^\d+-\d-days-a-week$/);
site.sitemapBlock("pro rata pages", "tools/build-pro-rata-pages.js", urls);
const ex = calc(30000, 22.5);
console.log(`built the pro rata salary calculator and ${SALARIES.length * DAYS.length} pages (£30,000 3 days: ${m0(ex.salary)}, ${m(ex.net / 12)} a month)`);
