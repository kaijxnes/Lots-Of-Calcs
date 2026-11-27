#!/usr/bin/env node
/* The student Maintenance Loan calculator and a page for each household income:

       /student-maintenance-loan-calculator/
       /student-maintenance-loan-calculator/40000/   (and other incomes)

       node tools/build-maintenance-loan-pages.js

   Maximum loans, the £25,000 threshold, the £1-for-every-£X tapers and the
   lowest amounts are quoted from GOV.UK and Student Finance England's
   "how you're assessed and paid" guide in data/uk/maintenance-loan.json; the
   pages are built from the same functions the calculator runs
   (maintenance-loan.js). The build stops unless every stored figure is in
   the quoted wording and the function reproduces SFE's own worked table.
   Runs in the monthly rebuild; update the data for each academic year. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const related = require("./related.js");
const ML = require("../maintenance-loan.js");
const { esc, SITE } = site;

const R = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/uk/maintenance-loan.json"), "utf8"));
const m0 = (v) => "£" + Math.round(v).toLocaleString("en-GB");
const Q = (k) => R.rules[k].quote;
const O = R.options, KEYS = ["away", "london", "home"];
const need = [["residual", m0(R.dependantAllowance)], ["changing", "1 January 2027"]]
  .concat(KEYS.map((k) => ["max", `Up to ${m0(O[k].max)}`]))
  .concat(KEYS.map((k) => ["taper", `£1 for every £${O[k].per.toFixed(2)} of the total income over ${m0(R.threshold)}, until ${O[k].floorPct}% of the full Maintenance Loan remains`]))
  .concat(KEYS.map((k) => ["minimum", `| ${m0(O[k].maxAssessment)} |`]));
need.forEach(([k, s]) => { if (!Q(k).includes(s)) throw new Error(`maintenance loan: "${s}" isn't in the quoted wording for ${k} (data/uk/maintenance-loan.json)`); });
if (!R.examples.every((row) => R.rules.table.quote.includes(row.map(m0).join(" | ")))) throw new Error("maintenance loan: a stored example row isn't in SFE's quoted table");
/* the function must reproduce SFE's worked table exactly, and the lowest amounts must be close to the quoted percentages */
R.examples.forEach(([inc, away, london, home]) => {
  const got = KEYS.map((k) => ML.calc(R, { income: inc, option: k }).loan), want = [away, london, home];
  if (got.join() !== want.join()) throw new Error(`maintenance loan: at ${m0(inc)} the calculator gives ${got.map(m0).join(", ")}, SFE's table ${want.map(m0).join(", ")}`);
});
KEYS.forEach((k) => { const r = ML.calc(R, { income: 1e6, option: k }); if (Math.abs(r.min / O[k].max * 100 - O[k].floorPct) > 0.1) throw new Error(`maintenance loan: the lowest ${k} loan ${m0(r.min)} isn't ${O[k].floorPct}% of ${m0(O[k].max)}`); });

const BASE = "/student-maintenance-loan-calculator/", INCOMES = [25000, 30000, 35000, 40000, 45000, 50000, 55000, 60000, 65000, 70000];
const iurl = (n) => `${BASE}${n}/`;
const SRC = R.sources.map((x) => `<a href="${x.url}" rel="nofollow noopener" target="_blank">${esc(x.title)}</a>`).join(" and ");
const RULES = { year: R.year, threshold: R.threshold, dependantAllowance: R.dependantAllowance, options: O };
const at = (inc, k, o) => ML.calc(R, Object.assign({ income: inc, option: k }, o || {}));

function tool(inc) {
  const r = at(inc, "away");
  return `    <main class="tool split" id="ml-tool" data-rules="${esc(JSON.stringify(RULES))}">
      <div class="field-row">
        <div class="field"><label for="ml-income">Household income before tax (your parents' and yours)</label><input type="number" id="ml-income" value="${inc}" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="ml-option">Where you'll live</label><select id="ml-option">${KEYS.map((k, i) => `<option value="${k}"${i ? "" : " selected"}>${esc(O[k].label)}</option>`).join("")}</select></div>
      </div>
      <div class="field-row">
        <div class="field"><label for="ml-pension">Your parents' pension contributions a year</label><input type="number" id="ml-pension" value="0" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="ml-kids">Other children your parents support</label><input type="number" id="ml-kids" value="0" min="0" max="20" step="1" inputmode="numeric"></div>
      </div>
      <p class="tool-hint" id="ml-error" role="alert" style="color: var(--bad); display: none;"></p>
      <p class="tool-hint" style="margin:6px 0 0;">For full-time students from England, ${esc(R.year)}, a full (not final) year. Students on certain benefits, aged 60 or over, studying abroad, or on a course over 30 weeks and 3 days can get different amounts.</p>
      <div class="result-box split-aside" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="ml-loan">${m0(r.loan)}</div>
          <div class="label" id="ml-label">Maintenance Loan for the year (${esc(R.year)})</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row"><span class="r-label">About a month (÷ 12)</span><span class="r-value" id="ml-month">${m0(r.loan / 12)}</span></div>
          <div class="result-row"><span class="r-label">Household residual income</span><span class="r-value" id="ml-residual">${m0(r.residual)}</span></div>
          <div class="result-row highlight"><span class="r-label">Taken off for household income</span><span class="r-value" id="ml-assess">${r.assessment ? "−" + m0(r.assessment) : "None"}</span></div>
          <div class="result-row"><span class="r-label">Most you can get</span><span class="r-value" id="ml-max">${m0(r.max)}</span></div>
          <div class="result-row"><span class="r-label">Least you can get</span><span class="r-value" id="ml-min">${m0(r.min)} (from about ${m0(r.minFrom)})</span></div>
        </div>
        <p class="tool-hint" id="ml-note" style="margin:10px 0 0;"></p>
      </div>
    </main>
`;
}
const explain = `    <main class="tool">
      <h2 class="tool-section-title">How your Maintenance Loan is worked out</h2>
      <p class="about-text">Student Finance England starts from your household's <strong>residual income</strong>: your parents' income before tax and National Insurance (including a parent's partner), less their pension contributions and ${m0(R.dependantAllowance)} for each other child who depends on them, plus any income of yours. Up to <strong>${m0(R.threshold)}</strong> you get the full loan. Above that it's reduced:</p>
${site.table(["Where you live", "Full loan", "£1 off for every", "Lowest loan", "Lowest from about"], KEYS.map((k) => { const r = at(1e6, k); return [esc(O[k].label), m0(O[k].max), `£${O[k].per.toFixed(2)} over ${m0(R.threshold)}`, `${m0(r.min)} (${O[k].floorPct}%)`, m0(r.minFrom)]; }), 640)}      <p class="tool-hint" style="margin-top:8px;">${esc(R.year)}, full-time students from England not entitled to benefits, a full year. The loan is paid into your bank account at the start of each term, and you pay it back once you've left your course and earn over the repayment threshold. Student finance is changing for courses starting on or after 1 January 2027.</p>
    </main>
`;
const head = (title, desc, u, crumbs, q, app) => site.head({ title, desc, url: u, ld: [site.webPage(title, desc, u, R.lastChecked), site.breadcrumb(crumbs)].concat(app ? [app] : []).concat([site.faqLd(q)]) });
const SCRIPT = `  <script src="/maintenance-loan.js"></script>`;
const foot = `      <p class="tool-hint" style="margin-top:12px;">An estimate: Student Finance England works out the amount when you apply. Figures from ${SRC}. Last checked ${site.niceDate(R.lastChecked)}.</p>`;

function page(n) {
  const u = SITE + iurl(n), r = KEYS.map((k) => at(n, k));
  const kidsRows = [0, 1, 2, 3].map((c) => [c ? `${c} other ${c === 1 ? "child" : "children"}` : "No other children"].concat(KEYS.map((k) => m0(at(n, k, { kids: c }).loan))));
  const title = site.fitTitle(`Maintenance Loan With ${m0(n)} Household Income (${R.year.replace(" to ", "/").replace(/\/20/, "/")})`, `Maintenance Loan on ${m0(n)} Household Income`);
  const desc = `With household income of ${m0(n)}, the ${esc(R.year)} Maintenance Loan is about ${m0(r[0].loan)} living away from home outside London, ${m0(r[1].loan)} in London and ${m0(r[2].loan)} living with parents.`;
  const q = [
    [`How much Maintenance Loan will I get with a household income of ${m0(n)}?`, `In ${esc(R.year)}: ${m0(r[0].loan)} living away from home outside London, ${m0(r[1].loan)} in London, or ${m0(r[2].loan)} living with your parents, for a full year with no other children or pension contributions taken off.`],
    ["Does having brothers or sisters increase the loan?", `Yes: ${m0(R.dependantAllowance)} comes off household income for each other child your parents support. With one, the loan outside London is ${m0(at(n, "away", { kids: 1 }).loan)} instead of ${m0(r[0].loan)}.`],
    ["Do my parents' pension contributions count?", "They're taken off your parents' income, so paying into a pension can increase the loan."],
    ["Is the Maintenance Loan paid monthly?", `No, it's paid into your bank account at the start of each term. ${m0(r[0].loan)} a year is about ${m0(r[0].loan / 12)} a month if you spread it over 12 months.`]
  ];
  const others = INCOMES.filter((x) => x !== n).map((x) => `<a href="${iurl(x)}">${m0(x)}</a>`).join(" ");
  return head(title, desc, u, [["Home", SITE + "/"], ["Student Maintenance Loan Calculator", SITE + BASE], [m0(n), u]], q) + `    <header class="site-header">
      <a class="back-link" href="${BASE}">← Maintenance Loan calculator</a>
      <h1 class="page-title">Maintenance Loan with ${m0(n)} household income</h1>
      <p class="page-subtitle">About <strong>${m0(r[0].loan)}</strong> a year living away from home outside London (${esc(R.year)}).</p>
    </header>

${tool(n)}
    <main class="tool">
      <h2 class="tool-section-title">${m0(n)}: Maintenance Loan by where you live</h2>
${site.table(["Other children your parents support", "Away, outside London", "Away, in London", "With parents"], kidsRows, 620)}      <p class="tool-hint" style="margin-top:8px;">${esc(R.year)}, a full year, no pension contributions taken off. Each other child takes ${m0(R.dependantAllowance)} off household income.</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}${foot}
    </main>

    <div class="hub-group-title" style="margin-top:28px;">Other household incomes</div>
    <p class="salary-links">${others}</p>

${site.FOOTER}
  </div>
${SCRIPT}
</body>
</html>
`;
}

function hub() {
  const u = SITE + BASE, ex = KEYS.map((k) => at(40000, k));
  const grid = INCOMES.map((n) => [`<a href="${iurl(n)}">${m0(n)}</a>`].concat(KEYS.map((k) => m0(at(n, k).loan))));
  const title = site.fitTitle(`Student Maintenance Loan Calculator ${R.year.replace(" to ", "/").replace(/\/20/, "/")} — England`, "Student Maintenance Loan Calculator");
  const desc = `How much Maintenance Loan you'll get in ${esc(R.year)} from your household income: up to ${m0(O.away.max)} away from home, ${m0(O.london.max)} in London and ${m0(O.home.max)} living with parents, reduced above ${m0(R.threshold)}.`;
  const q = [
    ["How much Maintenance Loan can I get?", `In ${esc(R.year)}, up to ${m0(O.home.max)} living with your parents, ${m0(O.away.max)} living away from home outside London, and ${m0(O.london.max)} in London. With household income over ${m0(R.threshold)} you get less, down to ${m0(at(1e6, "home").min)}, ${m0(at(1e6, "away").min)} and ${m0(at(1e6, "london").min)}.`],
    ["How is household income worked out for student finance?", `It's your parents' income before tax and National Insurance (including a parent's partner), less pension contributions and ${m0(R.dependantAllowance)} for each other child who depends on them, plus any income of yours.`],
    [`How much Maintenance Loan with ${m0(40000)} household income?`, `${m0(ex[0].loan)} living away from home outside London, ${m0(ex[1].loan)} in London and ${m0(ex[2].loan)} living with your parents (${esc(R.year)}).`],
    ["At what household income do you get the minimum Maintenance Loan?", `About ${m0(at(1e6, "away").minFrom)} living away from home outside London, ${m0(at(1e6, "london").minFrom)} in London and ${m0(at(1e6, "home").minFrom)} living with parents.`]
  ];
  const app = { "@context": "https://schema.org", "@type": "WebApplication", name: "Student Maintenance Loan Calculator", url: u, applicationCategory: "FinanceApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } };
  return head(title, desc, u, [["Home", SITE + "/"], ["Personal Finance", SITE + "/personal-finance/"], ["Student Maintenance Loan Calculator", u]], q, app) + `    <header class="site-header">
      <a class="back-link" href="/personal-finance/">← Personal finance calculators</a>
      <h1 class="page-title">Student Maintenance Loan calculator</h1>
      <p class="page-subtitle">How much Maintenance Loan you'll get from your household income (England, ${esc(R.year)}).</p>
    </header>

${tool(40000)}
    <main class="tool">
      <h2 class="tool-section-title">Maintenance Loan by household income</h2>
${site.table(["Household income", "Away, outside London", "Away, in London", "With parents"], grid, 560)}      <p class="tool-hint" style="margin-top:8px;">${esc(R.year)}, a full year, no other children or pension contributions taken off. Pick an income for more.</p>
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
site.write("student-maintenance-loan-calculator", hub());
INCOMES.forEach((n) => { site.write(`student-maintenance-loan-calculator/${n}`, page(n)); urls.push([iurl(n), "0.5"]); });
site.sitemapBlock("maintenance loan pages", "tools/build-maintenance-loan-pages.js", urls);
console.log(`built the Maintenance Loan calculator and ${INCOMES.length} income pages (${m0(40000)}: ${m0(at(40000, "away").loan)} away from home)`);
