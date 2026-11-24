#!/usr/bin/env node
/* Take-home pay compared between two countries, e.g. /salary-comparison/uk-vs-ireland/:
   the same salary (converted at the ECB reference rate) after tax in each
   place, at six salary levels, in both currencies.

       node tools/build-comparison-pages.js

   Tax: tax-engine.js with each place's default options, as on the salary
   pages. Currency: data/currency/ecb.json. Runs in the monthly rebuild,
   after the exchange rates are fetched. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const TaxEngine = require("../tax-engine.js");
const registry = require("./tax/registry.js");
const { SITE, esc } = site;

const BASE = "/salary-comparison/";
const all = registry.readAll(), current = registry.currentFiles(all);
const E = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/currency/ecb.json"), "utf8"));
const PLACES = {};
JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/salary-places.json"), "utf8")).groups.forEach((g) => g.places.forEach((p) => (PLACES[p.id] = p)));
const config = require("./salary-pages-config.js");
const LABEL = config.COMPARISON_LABEL, PAIRS = config.COMPARISON_PAIRS;
const LEVELS = { GBP: [25000, 30000, 40000, 50000, 60000, 80000, 100000, 150000], USD: [40000, 50000, 60000, 75000, 100000, 125000, 150000, 200000], EUR: [30000, 40000, 50000, 60000, 75000, 100000, 125000, 150000], CAD: [50000, 60000, 75000, 100000, 125000, 150000, 200000], AUD: [60000, 75000, 90000, 100000, 120000, 150000, 200000], CHF: [50000, 60000, 80000, 100000, 120000, 150000, 200000] };
const SYM = { GBP: "£", EUR: "€", USD: "$", CAD: "C$", AUD: "A$", NZD: "NZ$", CHF: "CHF " };
const DATE = new Date(E.date + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

const chain = (id) => registry.chainFor(current[id].doc, all);
const fx = (a, b) => E.rates[b] / E.rates[a];
const m0 = (c, v) => (SYM[c] || c + " ") + Math.round(v).toLocaleString("en-GB");
const slug = config.comparisonSlug;

function page(a, b) {
  const A = PLACES[a], B = PLACES[b], ca = A.currency, cb = B.currency, x = fx(ca, cb), url = SITE + `${BASE}${slug(a, b)}/`;
  const LA = LABEL[a][0], LB = LABEL[b][0], ta = LABEL[a][1], tb = LABEL[b][1];
  const ka = chain(a), kb = chain(b);
  const rows = LEVELS[ca].map((g) => {
    const na = TaxEngine.compute(ka, g, {}).net, gb2 = g * x, nb = TaxEngine.compute(kb, gb2, {}).net;
    return { g, gb2, na, nb, ra: 1 - na / g, rb: 1 - nb / gb2, diff: nb / x - na };
  });
  const mid = rows[3];
  const better = mid.diff > 0 ? LB : LA;
  const same = ca === cb;
  const title = site.fitTitle(`${LA} vs ${LB} Salary After Tax — ${m0(ca, mid.g)} Take-Home Compared`, `${LA} vs ${LB} Take-Home Pay: ${m0(ca, mid.g)} Compared`);
  const desc = `${m0(ca, mid.g)} takes home ${m0(ca, mid.na)} in ${ta}; the same salary${same ? "" : ` (${m0(cb, mid.gb2)})`} takes home ${m0(cb, mid.nb)} in ${tb}. Tax and take-home compared at ${["", "", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"][LEVELS[ca].length]} salaries${same ? "" : `, converted at the ECB rate for ${DATE}`}.`;
  const tableRows = rows.map((r) => [m0(ca, r.g) + (same ? "" : ` / ${m0(cb, r.gb2)}`), `${m0(ca, r.na)} (${(r.ra * 100).toFixed(1)}%)`, `${m0(cb, r.nb)} (${(r.rb * 100).toFixed(1)}%)`, (r.diff >= 0 ? "+" : "−") + m0(ca, Math.abs(r.diff)) + ` in ${LB}`]);
  const q = [
    [`Is take-home pay higher in ${tb} or ${ta}?`, `On ${m0(ca, mid.g)}${same ? "" : ` (${m0(cb, mid.gb2)})`}, ${better} leaves more after tax: ${m0(ca, mid.na)} in ${ta} against ${m0(cb, mid.nb)} in ${tb}${same ? "" : ` (${m0(ca, mid.nb / x)})`}. The gap changes with salary — see the table.`],
    ["Does this compare living costs?", "No — only tax and social contributions on the same gross salary. Rent, prices and typical salaries differ a lot between countries, and salaries for the same job are rarely the same, so use this alongside what a job actually pays in each place."],
    ["What's included?", "Income tax and employee social contributions (National Insurance, social security, health insurance and so on) for a single employee with each place's default options and no pension contributions, using the current tax year's rates."]
  ];
  const ld = [site.webPage(title, desc, url, current[a].doc.lastChecked), site.breadcrumb([["Home", SITE + "/"], ["Salary Calculator", SITE + "/salary/"], [`${LA} vs ${LB}`, url]]), site.faqLd(q)];
  const others = PAIRS.filter(([p, q2]) => (p === a || q2 === a || p === b || q2 === b) && !(p === a && q2 === b)).map(([p, q2]) => `<a href="${BASE}${slug(p, q2)}/">${esc(LABEL[p][0])} vs ${esc(LABEL[q2][0])}</a>`);
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="/salary/">← Salary calculator</a>
      <h1 class="page-title">${esc(LA)} vs ${esc(LB)}: salary after tax</h1>
      <p class="page-subtitle">The same salary after tax in ${esc(ta)} and ${esc(tb)}${same ? "" : `, converted at the ECB rate for ${DATE} (1 ${ca} = ${x.toLocaleString("en-GB", { maximumSignificantDigits: 4 })} ${cb})`}.</p>
    </header>

    <main class="tool">
      <div class="jo-grid">
        <div class="jo-side"><h2 class="tool-section-title" style="margin-top:0;">${esc(LA)}</h2><div class="result-box"><div class="result-grid">
          <div class="result-row"><span class="r-label">Salary</span><span class="r-value">${m0(ca, mid.g)}</span></div>
          <div class="result-row highlight"><span class="r-label">Take-home</span><span class="r-value">${m0(ca, mid.na)}</span></div>
          <div class="result-row"><span class="r-label">A month</span><span class="r-value">${m0(ca, mid.na / 12)}</span></div>
          <div class="result-row"><span class="r-label">Tax and contributions</span><span class="r-value">${(mid.ra * 100).toFixed(1)}%</span></div>
        </div></div></div>
        <div class="jo-side"><h2 class="tool-section-title" style="margin-top:0;">${esc(LB)}</h2><div class="result-box"><div class="result-grid">
          <div class="result-row"><span class="r-label">Salary</span><span class="r-value">${m0(cb, mid.gb2)}</span></div>
          <div class="result-row highlight"><span class="r-label">Take-home</span><span class="r-value">${m0(cb, mid.nb)}</span></div>
          <div class="result-row"><span class="r-label">A month</span><span class="r-value">${m0(cb, mid.nb / 12)}</span></div>
          <div class="result-row"><span class="r-label">Tax and contributions</span><span class="r-value">${(mid.rb * 100).toFixed(1)}%</span></div>
        </div></div></div>
      </div>
      <p class="tool-hint" style="margin-top:12px;">Single employee, each place's default options, no pension. For your own figures and options, use the <a href="/salary/">salary calculator</a> or compare two real offers with the <a href="/job-offer-comparison/">job offer calculator</a>.</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">At other salaries</h2>
${site.table(["Salary", `Take-home in ${esc(LA)}`, `Take-home in ${esc(LB)}`, "Difference"], tableRows, 560)}      <p class="tool-hint" style="margin-top:12px;">Percentages are the share of salary going on tax and contributions. ${same ? "" : `Differences in ${ca} at the ECB rate for ${DATE}.`}</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}    </main>

    <main class="tool">
      <h2 class="tool-section-title">More comparisons</h2>
      <p class="salary-links">${others.join(" ")} <a href="/salary-comparison/take-home-pay-by-country/">All 26 places ranked</a></p>
    </main>

${site.FOOTER}
  </div>
</body>
</html>
`;
}

const urls = [];
PAIRS.forEach(([a, b]) => { site.write(`salary-comparison/${slug(a, b)}`, page(a, b)); urls.push([`${BASE}${slug(a, b)}/`, "0.5"]); });
site.prune("salary-comparison", /^[a-z-]+-vs-[a-z-]+$/);
site.sitemapBlock("salary comparison pages", "tools/build-comparison-pages.js", urls);
/* links from the salary calculator */
site.hubBlock("/salary/", "salary comparisons", "tools/build-comparison-pages.js", `    <main class="tool">
      <h2 class="tool-section-title">Take-home pay compared between countries</h2>
      <p class="about-text">See all 26 places ranked side by side: <a href="/salary-comparison/take-home-pay-by-country/">take-home pay by country</a>.</p>
      <p class="salary-links">${PAIRS.map(([a, b]) => `<a href="${BASE}${slug(a, b)}/">${esc(LABEL[a][0])} vs ${esc(LABEL[b][0])}</a>`).join(" ")}</p>
    </main>

`);
console.log(`built ${urls.length} salary comparison pages (ECB rates ${E.date})`);
