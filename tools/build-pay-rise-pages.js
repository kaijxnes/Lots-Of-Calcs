#!/usr/bin/env node
/* Pay rise calculator and "5% pay rise on £30,000" pages:

       /pay-rise-calculator/                        calculator
       /pay-rise-calculator/5-percent-on-30000/     one rise on one salary

       node tools/build-pay-rise-pages.js

   Take-home pay is computed with tax-engine.js from the UK files in
   data/tax/ (the tax year in force), so the pages agree with the salary
   calculators; re-run when the UK rates change (the monthly check does). */
const site = require("./lib/site.js");
const related = require("./related.js");
const TaxEngine = require("../tax-engine.js");
const registry = require("./tax/registry.js");
const { esc, SITE } = site;

const all = registry.readAll(), current = registry.currentFiles(all);
const CH = { gb: registry.chainFor(current.gb.doc, all), "gb-sct": registry.chainFor(current["gb-sct"].doc, all) };
const YEAR = current.gb.doc.taxYear.label;
const OPTS = TaxEngine.merge(CH.gb).options;
const BASE = "/pay-rise-calculator/";
const PR = require("./pay-rise-config.js");
const PCTS = PR.PCTS, SALARIES = PR.SALARIES;
/* the shorter list used in the hub's grid */
const GRID = [20000, 25000, 30000, 35000, 40000, 45000, 50000, 55000, 60000, 70000, 80000, 100000];
const m = (v) => TaxEngine.money(v, "GBP"), m0 = (v) => TaxEngine.money(v, "GBP", true);
const slugOf = PR.slug;
const calc = (id, s) => TaxEngine.compute(CH[id], s, {});
const ENG = "England, Wales and Northern Ireland";

function tool(salary, pct) {
  const a = calc("gb", salary), b = calc("gb", salary * (1 + pct / 100)), gross = salary * pct / 100, extra = b.net - a.net;
  return `    <main class="tool" id="pr-tool">
      <div class="field-row">
        <div class="field"><label for="pr-salary">Salary now (£ a year)</label><input type="number" id="pr-salary" value="${salary}" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="pr-rise">Pay rise</label><input type="number" id="pr-rise" value="${pct}" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="pr-type">As</label><select id="pr-type"><option value="pct" selected>%</option><option value="gbp">£ a year</option></select></div>
      </div>
      <div class="field-row">
        <div class="field"><label for="pr-region">Where you live</label><select id="pr-region"><option value="gb" selected>${ENG}</option><option value="gb-sct">Scotland</option></select></div>
        <div class="field"><label for="pr-loan">Student loan</label><select id="pr-loan">${Object.keys(OPTS.studentLoan.choices).map((k) => `<option value="${k}"${k === "none" ? " selected" : ""}>${esc(OPTS.studentLoan.choices[k])}</option>`).join("")}</select></div>
        <div class="field"><label for="pr-pension">Pension (% of pay)</label><input type="number" id="pr-pension" value="0" min="0" max="100" step="any" inputmode="decimal"></div>
      </div>
      <p class="tool-hint" id="pr-error" role="alert" style="color: var(--bad); display: none;"></p>
      <div class="result-box" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="pr-month">${m(extra / 12)}</div>
          <div class="label">more a month after tax</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row"><span class="r-label">New salary</span><span class="r-value" id="pr-new">${m0(salary + gross)} (+${m0(gross)})</span></div>
          <div class="result-row highlight"><span class="r-label">Extra take-home a year</span><span class="r-value" id="pr-year">${m(extra)} of ${m0(gross)}</span></div>
          <div class="result-row"><span class="r-label">You keep</span><span class="r-value" id="pr-keep">${Math.round(extra / gross * 100)}% of the rise</span></div>
          <div class="result-row"><span class="r-label">Take-home a month</span><span class="r-value" id="pr-before">${m(a.net / 12)} → ${m(b.net / 12)}</span></div>
        </div>
      </div>
      <p class="tool-hint" style="margin-top:12px;">${esc(YEAR)} UK tax year: income tax, National Insurance and any student loan, from the same figures as the <a href="/salary/uk/">UK salary calculator</a>. A pension paid by relief at source is taken from take-home pay.</p>
    </main>
`;
}

const why = (a) => {
  const r = Math.round(a.marginalRate);
  return a.gross >= 100000 && a.gross < 125140
    ? `between £100,000 and £125,140 the personal allowance is withdrawn — £1 for every £2 earned — so each extra pound is taxed at an effective ${r}%`
    : `at ${m0(a.gross)} each extra pound loses ${r}p to income tax and National Insurance${a.gross > 50270 ? " (the higher rate)" : ""}`;
};

function page(pct, salary) {
  const url = SITE + `${BASE}${slugOf(pct, salary)}/`;
  const next = salary * (1 + pct / 100), gross = next - salary;
  const a = calc("gb", salary), b = calc("gb", next), extra = b.net - a.net;
  const sa = calc("gb-sct", salary), sb = calc("gb-sct", next);
  const title = `${pct}% Pay Rise on £${salary.toLocaleString("en-GB")} — ${m0(extra / 12)} a Month More After Tax`;
  /* nearby salaries for the links, rather than all sixty */
  const desc = `A ${pct}% pay rise on £${salary.toLocaleString("en-GB")} is ${m0(gross)} a year before tax, taking you to ${m0(next)}. After income tax and National Insurance you keep ${m(extra)} a year — ${m(extra / 12)} a month (${YEAR}, ${ENG}).`;
  const rows = [
    ["Salary", m0(salary), m0(next), "+" + m0(gross)],
    ["Income tax", m(a.byGroup.tax || 0), m(b.byGroup.tax || 0), "+" + m((b.byGroup.tax || 0) - (a.byGroup.tax || 0))],
    ["National Insurance", m(a.byGroup.social || 0), m(b.byGroup.social || 0), "+" + m((b.byGroup.social || 0) - (a.byGroup.social || 0))],
    ["Take-home a year", `<strong>${m(a.net)}</strong>`, `<strong>${m(b.net)}</strong>`, `<strong>+${m(extra)}</strong>`],
    ["Take-home a month", m(a.net / 12), m(b.net / 12), "+" + m(extra / 12)]
  ];
  const riseRows = [1, 2, 3, 4, 5, 6, 7, 8, 10, 15].map((p) => {
    const n = calc("gb", salary * (1 + p / 100)), e = n.net - a.net;
    const cell = PR.has(p, salary) && p !== pct ? `<a href="${BASE}${slugOf(p, salary)}/">${p}%</a>` : p === pct ? `<strong>${p}%</strong>` : `${p}%`;
    return [cell, m0(salary * p / 100), m(e), m(e / 12)];
  });
  const q = [
    [`What is a ${pct}% increase on £${salary.toLocaleString("en-GB")}?`, `${m0(gross)} a year before tax, so your salary goes to ${m0(next)}. After tax and National Insurance that's ${m(extra)} a year, or ${m(extra / 12)} a month, in ${ENG}; ${m((sb.net - sa.net) / 12)} a month in Scotland.`],
    [`Why do I only keep ${Math.round(extra / gross * 100)}% of it?`, `Because a rise is taxed at your highest rates: ${why(a)}. Student loan repayments take another 9% of the rise if you're above the threshold, and a pension contribution set as a percentage of pay goes up with it.`],
    ["Which tax year is this?", `${YEAR}, using the same rates as the salary calculators. A rise in April may fall in the next tax year, which can have different thresholds.`]
  ];
  const ld = [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], ["Pay Rise Calculator", SITE + BASE], [`${pct}% on £${salary.toLocaleString("en-GB")}`, url]]), site.faqLd(q)];
  const others = site.neighbours(SALARIES, salary, 6).filter((s) => s !== salary).map((s) => `<a href="${BASE}${slugOf(pct, s)}/">£${s.toLocaleString("en-GB")}</a>`).join(" ") + ` <a href="${PR.pctUrl(pct)}">All salaries at ${pct}%</a>`;
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="${BASE}">← Pay rise calculator</a>
      <h1 class="page-title">${pct}% pay rise on £${salary.toLocaleString("en-GB")}</h1>
      <p class="page-subtitle">${m0(gross)} more before tax; ${m(extra / 12)} a month more after tax (${esc(YEAR)}).</p>
    </header>

${tool(salary, pct)}
    <main class="tool">
      <p class="tool-section-title">Before and after (${ENG})</p>
${site.table(["", "Now", `After ${pct}%`, "Change"], rows, 460)}      <p class="tool-hint" style="margin-top:12px;">Take-home on £${salary.toLocaleString("en-GB")} line by line: <a href="/salary/${salary}-after-tax/">£${salary.toLocaleString("en-GB")} after tax</a>. In Scotland, take-home goes from ${m(sa.net / 12)} to ${m(sb.net / 12)} a month (+${m((sb.net - sa.net) / 12)}). No student loan or pension. See the full breakdown on the <a href="/salary/uk/">UK salary calculator</a>.</p>
      <p class="tool-section-title" style="margin-top:22px;">Other rises on £${salary.toLocaleString("en-GB")}</p>
${site.table(["Rise", "Before tax", "After tax, a year", "A month"], riseRows, 420)}    </main>

    <main class="tool">
      <p class="tool-section-title">Frequently asked questions</p>
${site.faqHtml(q)}    </main>

    <div class="hub-group-title" style="margin-top:28px;">A ${pct}% rise on other salaries</div>
    <p class="salary-links">${others}</p>

${site.FOOTER}
  </div>
  <script src="/tax-engine.js"></script>
  <script src="/pay-rise.js"></script>
</body>
</html>
`;
}

function hub() {
  const url = SITE + BASE;
  const title = "Pay Rise Calculator — How Much More Will I Take Home After Tax?";
  const ex = calc("gb", 30000), ex2 = calc("gb", 31500);
  const desc = `See what a pay rise adds to your take-home pay after income tax, National Insurance and student loan (${YEAR}). A 5% rise on £30,000 is ${m0(1500)} before tax and ${m((ex2.net - ex.net) / 12)} a month after it.`;
  const grid = GRID.map((s) => [`£${s.toLocaleString("en-GB")}`].concat(PCTS.map((p) => { const e = calc("gb", s * (1 + p / 100)).net - calc("gb", s).net; return `<a href="${BASE}${slugOf(p, s)}/">${m0(e / 12)}</a>`; })));
  const q = [
    ["How much of a pay rise do I keep?", "Most of a rise is taxed at your top rates: on a basic-rate salary in England, Wales and Northern Ireland you keep about 72p of each extra pound (20% income tax, 8% National Insurance), and on a higher-rate salary about 58p (40% and 2%). Student loan repayments take another 9% above the threshold."],
    ["What is the 60% tax trap?", "Between £100,000 and £125,140 you lose £1 of personal allowance for every £2 earned, so a rise in that band is taxed at an effective 60% plus National Insurance. Paying more into a pension can bring your income back under £100,000."],
    ["How do I work out a percentage pay rise?", "Multiply your salary by the percentage and divide by 100: 4% of £35,000 is £1,400. The calculator also takes a rise in pounds and shows it as a percentage."],
    ["Does it include my pension?", "Put in your pension contribution as a percentage of pay — it rises with your salary. Employer contributions aren't part of take-home pay."]
  ];
  const ld = [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], ["Pay Rise Calculator", url]]),
    { "@context": "https://schema.org", "@type": "WebApplication", name: "Pay Rise Calculator", url, applicationCategory: "FinanceApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } }, site.faqLd(q)];
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="/">← All calculators</a>
      <h1 class="page-title">Pay rise calculator</h1>
      <p class="page-subtitle">What a pay rise adds to your take-home pay, after tax, National Insurance and student loan.</p>
    </header>

${tool(30000, 5)}
    <main class="tool">
      <p class="tool-section-title">Extra take-home a month, by salary and rise</p>
${site.table(["Salary"].concat(PCTS.map((p) => `<a href="${PR.pctUrl(p)}">${p}%</a>`)), grid, 520)}      <p class="tool-hint" style="margin-top:12px;">${esc(YEAR)}, ${ENG}, no student loan or pension. Pick a figure for the full breakdown, or a percentage for every salary from £15,000 to £200,000.</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">Frequently asked questions</p>
${site.faqHtml(q)}    </main>

${related.block(BASE)}
${site.FOOTER}
  </div>
  <script src="/tax-engine.js"></script>
  <script src="/pay-rise.js"></script>
</body>
</html>
`;
}

/* /pay-rise-calculator/3-percent/: one rise across every salary */
function pctPage(pct) {
  const url = SITE + PR.pctUrl(pct);
  const ex = calc("gb", 30000), exN = calc("gb", 30000 * (1 + pct / 100));
  const title = `${pct}% Pay Rise Calculator — What Is a ${pct}% Increase on My Salary Worth?`;
  const desc = `What a ${pct}% pay rise adds after tax on every salary from £15,000 to £200,000 (${YEAR}). On £30,000 a ${pct}% increase is ${m0(30000 * pct / 100)} before tax and ${m(( exN.net - ex.net) / 12)} a month after it.`;
  const rows = SALARIES.map((s) => {
    const a = calc("gb", s), b = calc("gb", s * (1 + pct / 100)), sa = calc("gb-sct", s), sb = calc("gb-sct", s * (1 + pct / 100));
    return [`<a href="${BASE}${slugOf(pct, s)}/">£${s.toLocaleString("en-GB")}</a>`, m0(s * pct / 100), m0((b.net - a.net) / 12), m0((sb.net - sa.net) / 12), `${Math.round((b.net - a.net) / (s * pct / 100) * 100)}%`];
  });
  const q = [
    [`How do I work out a ${pct}% pay rise?`, `Multiply your salary by ${pct / 100}: ${pct}% of £30,000 is ${m0(30000 * pct / 100)}, so the new salary is ${m0(30000 * (1 + pct / 100))}. After tax and National Insurance, the extra take-home pay is less — ${m(exN.net - ex.net)} a year on £30,000.`],
    [`Why is a ${pct}% rise worth less after tax?`, "The extra pay is taxed at your highest rates — 28% for most basic-rate taxpayers in England, Wales and Northern Ireland (20% income tax and 8% National Insurance), 42% for higher-rate, and an effective 60% plus NI between £100,000 and £125,140, where the personal allowance is withdrawn."],
    [`Is a ${pct}% pay rise good?`, "It depends on inflation: if prices have risen faster than your pay, a rise can still leave you worse off in real terms. The inflation calculator shows how prices have changed."]
  ];
  const ld = [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], ["Pay Rise Calculator", SITE + BASE], [`${pct}% pay rise`, url]]), site.faqLd(q)];
  const others = PCTS.filter((x) => x !== pct).map((x) => `<a href="${PR.pctUrl(x)}">${x}% pay rise</a>`).join(" ");
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="${BASE}">← Pay rise calculator</a>
      <h1 class="page-title">What is a ${pct}% pay rise worth?</h1>
      <p class="page-subtitle">A ${pct}% increase on every salary from £15,000 to £200,000, after tax (${esc(YEAR)}).</p>
    </header>

${tool(30000, pct)}
    <main class="tool">
      <p class="tool-section-title">A ${pct}% rise on each salary</p>
${site.table(["Salary", "Rise before tax", "Extra a month (Eng, Wales, NI)", "Extra a month (Scotland)", "You keep"], rows, 560)}      <p class="tool-hint" style="margin-top:12px;">After income tax and National Insurance, with no student loan or pension. Pick a salary for the full before-and-after breakdown.</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">Frequently asked questions</p>
${site.faqHtml(q).replace("The inflation calculator", 'The <a href="/inflation/">inflation calculator</a>')}    </main>

    <div class="hub-group-title" style="margin-top:28px;">Other pay rises</div>
    <p class="salary-links">${others}</p>

${site.FOOTER}
  </div>
  <script src="/tax-engine.js"></script>
  <script src="/pay-rise.js"></script>
</body>
</html>
`;
}

const urls = [];
site.write("pay-rise-calculator", hub());
PCTS.forEach((p) => { site.write(`pay-rise-calculator/${p}-percent`, pctPage(p)); urls.push([PR.pctUrl(p), "0.6"]); });
PCTS.forEach((p) => SALARIES.forEach((s) => { site.write(`pay-rise-calculator/${slugOf(p, s)}`, page(p, s)); urls.push([`${BASE}${slugOf(p, s)}/`, "0.5"]); }));
site.prune("pay-rise-calculator", /^\d+-percent-on-\d+$/);
site.sitemapBlock("pay rise pages", "tools/build-pay-rise-pages.js", urls);
console.log(`built ${urls.length + 1} pay rise pages (${YEAR})`);
