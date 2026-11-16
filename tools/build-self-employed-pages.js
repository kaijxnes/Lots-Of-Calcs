#!/usr/bin/env node
/* Self-employed tax calculator and a page per profit:

       /self-employed-tax-calculator/          calculator
       /self-employed-tax-calculator/30000/    tax, NI and take-home on £30,000 profit

       node tools/build-self-employed-pages.js

   Every figure comes from data/tax/gb/gb-se.*.json and gb-sct-se.*.json
   (Class 4 NI swapped in for employee NI) through tax-engine.js, so the
   monthly rates check and a new tax year's files update these pages when
   they're rebuilt; the monthly check runs this. */
const site = require("./lib/site.js");
const related = require("./related.js");
const TaxEngine = require("../tax-engine.js");
const registry = require("./tax/registry.js");
const SE = require("../self-employed.js");
const { esc, SITE } = site;

const all = registry.readAll(), current = registry.currentFiles(all);
const chainOf = (id) => registry.chainFor(current[id].doc, all);
const CH = { "gb-se": chainOf("gb-se"), "gb-sct-se": chainOf("gb-sct-se"), gb: chainOf("gb") };
const DOC = current["gb-se"].doc;
const YEAR = DOC.taxYear.label;
const END_YEAR = +DOC.taxYear.end.slice(0, 4);
const DUE = `31 January ${END_YEAR + 1}`; /* return and balancing payment for this tax year */
const OPTS = TaxEngine.merge(CH["gb-se"]).options;
const BASE = "/self-employed-tax-calculator/";
const PROFITS = [10000, 15000, 20000, 25000, 30000, 35000, 40000, 45000, 50000, 55000, 60000, 70000, 80000, 90000, 100000, 120000, 150000];
const UK_SALARY_PAGES = require("./salary-pages-config.js").SALARIES.GBP;
const m = (v) => TaxEngine.money(v, "GBP"), m0 = (v) => TaxEngine.money(v, "GBP", true);
const calc = (id, p) => TaxEngine.compute(CH[id], p, {});
const ENG = "England, Wales and Northern Ireland";
const class4 = DOC.items.find((i) => i.id === "gb-ni").charge.brackets;
const C4 = `${class4[1][1]}% on profits from ${m0(class4[1][0])} to ${m0(class4[2][0])} and ${class4[2][1]}% above`;

const POA_TEXT = `Payments on account are advance payments towards next year's bill: each is half of the tax and Class 4 National Insurance you owed for the year before, due on 31 January and 31 July. You don't make them if that bill was under £1,000, or if more than 80% of your tax was already taken at source (GOV.UK). In your first year of self-employment the first January payment is the whole bill plus the first payment on account for the next year — often a shock, so put money aside as you go.`;

function tool(profit) {
  const r = calc("gb-se", profit), b = SE.bill(r);
  return `    <main class="tool" id="se-tool">
      <div class="field-row">
        <div class="field"><label for="se-income">Income for the year (£)</label><input type="number" id="se-income" value="${profit}" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="se-expenses">Allowable expenses (£)</label><input type="number" id="se-expenses" value="0" min="0" step="any" inputmode="decimal"></div>
      </div>
      <div class="field-row">
        <div class="field"><label for="se-region">Where you live</label><select id="se-region"><option value="gb-se" selected>${ENG}</option><option value="gb-sct-se">Scotland</option></select></div>
        <div class="field"><label for="se-loan">Student loan</label><select id="se-loan">${Object.keys(OPTS.studentLoan.choices).map((k) => `<option value="${k}"${k === "none" ? " selected" : ""}>${esc(OPTS.studentLoan.choices[k])}</option>`).join("")}</select></div>
        <div class="field"><label for="se-pension">Pension (% of profit)</label><input type="number" id="se-pension" value="0" min="0" max="100" step="any" inputmode="decimal"></div>
      </div>
      <p class="tool-hint" id="se-error" role="alert" style="color: var(--bad); display: none;"></p>
      <div class="result-box" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="se-net">${m(r.net)}</div>
          <div class="label">take-home a year</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row highlight"><span class="r-label">A month</span><span class="r-value" id="se-month">${m(r.net / 12)}</span></div>
          <div class="result-row"><span class="r-label">Profit</span><span class="r-value" id="se-profit">${m0(profit)}</span></div>
          <div class="result-row"><span class="r-label">Income tax</span><span class="r-value" id="se-tax">${m(r.values["gb-income-tax"])}</span></div>
          <div class="result-row"><span class="r-label">Class 4 National Insurance</span><span class="r-value" id="se-ni">${m(r.values["gb-ni"])}</span></div>
          <div class="result-row"><span class="r-label">Student loan</span><span class="r-value" id="se-loans">${m(b.loans)}</span></div>
          <div class="result-row"><span class="r-label">Pension (from take-home)</span><span class="r-value" id="se-pension-out">${m(r.values["gb-pension"] || 0)}</span></div>
        </div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row"><span class="r-label">Self Assessment bill</span><span class="r-value" id="se-bill">${m(b.total)}</span></div>
          <div class="result-row"><span class="r-label">Payments on account</span><span class="r-value" id="se-poa" style="text-align:right;">${b.poa ? `${m(b.poa)} each, 31 January and 31 July` : "None — the bill is under £1,000"}</span></div>
          <div class="result-row"><span class="r-label">First 31 January, if it's your first year</span><span class="r-value" id="se-first">${m(b.firstJanuary)}</span></div>
        </div>
      </div>
      <p class="tool-hint" style="margin-top:12px;">${esc(YEAR)} tax year, for a sole trader with no other income. Class 4 NI is ${esc(C4)}; Class 2 is treated as paid on profits of £7,105 or more. Rates from the same checked data as the <a href="/salary/uk/">salary calculator</a> · <a href="/tax-rates/">when they were last checked</a>.</p>
    </main>
`;
}

function page(profit) {
  const url = SITE + `${BASE}${profit}/`;
  const r = calc("gb-se", profit), s = calc("gb-sct-se", profit), e = calc("gb", profit), b = SE.bill(r);
  const title = `${m0(profit)} Self-Employed After Tax — Tax, NI and Take-Home (${YEAR})`;
  const desc = `On ${m0(profit)} of self-employed profit you pay ${m(r.values["gb-income-tax"])} income tax and ${m(r.values["gb-ni"])} Class 4 NI, leaving ${m(r.net)} — ${m(r.net / 12)} a month (${YEAR}). Plus your Self Assessment bill and payments on account.`;
  const salaryLink = UK_SALARY_PAGES.includes(profit) ? ` (see <a href="/salary/${profit}-after-tax/">${m0(profit)} after tax as an employee</a>)` : "";
  const q = [
    [`How much tax do I pay on ${m0(profit)} self-employed?`, `${m(r.values["gb-income-tax"])} income tax and ${m(r.values["gb-ni"])} Class 4 National Insurance on ${m0(profit)} of profit in ${ENG}, ${m(r.totalDeductions)} in all, leaving ${m(r.net)} (${m(r.net / 12)} a month). In Scotland, with its own income tax bands, you'd keep ${m(s.net)}.`],
    ["When do I pay it?", b.poa ? `The ${YEAR} bill (${m(b.total)}) is due by ${DUE}, less any payments on account already made. Because it's over £1,000, you'll also make payments on account of ${m(b.poa)} each towards the next year, on 31 January and 31 July. ${POA_TEXT.split(". ").slice(-2).join(". ")}` : `The ${YEAR} bill (${m(b.total)}) is due by ${DUE}. It's under £1,000, so there are no payments on account.`],
    ["Do I pay more or less than an employee?", `Less National Insurance: Class 4 is ${C4}, against 8% and 2% for employees. On ${m0(profit)} an employee would keep ${m(e.net)}, ${m(r.net - e.net)} less — but employees also get employer pension contributions, sick pay and holiday pay.`],
    ["Do I pay Class 2 National Insurance?", "Not on profits of £7,105 or more: since April 2024 it's treated as paid, so you still build up State Pension entitlement. Below that you can choose to pay voluntary Class 2 (£3.65 a week in 2026/27) to protect your record."],
    ["What are payments on account?", POA_TEXT]
  ];
  const ld = [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], ["Self-Employed Tax Calculator", SITE + BASE], [`${m0(profit)} profit`, url]]), site.faqLd(q)];
  const rows = [
    ["Profit", m0(profit), m0(profit), m0(profit)],
    ["Income tax", m(r.values["gb-income-tax"]), m(s.values["gb-income-tax"]), m(e.values["gb-income-tax"])],
    ["National Insurance", `${m(r.values["gb-ni"])} (Class 4)`, `${m(s.values["gb-ni"])} (Class 4)`, `${m(e.values["gb-ni"])} (Class 1)`],
    ["Take-home a year", `<strong>${m(r.net)}</strong>`, `<strong>${m(s.net)}</strong>`, m(e.net)],
    ["A month", m(r.net / 12), m(s.net / 12), m(e.net / 12)]
  ];
  const others = site.neighbours(PROFITS, profit, 6).filter((x) => x !== profit).map((x) => `<a href="${BASE}${x}/">${m0(x)} profit</a>`).join(" ");
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="${BASE}">← Self-employed tax calculator</a>
      <h1 class="page-title">${m0(profit)} self-employed after tax</h1>
      <p class="page-subtitle">${m(r.net)} a year, ${m(r.net / 12)} a month, after income tax and Class 4 National Insurance (${esc(YEAR)}).</p>
    </header>

${tool(profit)}
    <main class="tool">
      <p class="tool-section-title">${m0(profit)} profit, side by side</p>
${site.table(["", "Self-employed (Eng, Wales, NI)", "Self-employed (Scotland)", "Employee (Eng, Wales, NI)"], rows, 560)}      <p class="tool-hint" style="margin-top:12px;">The employee column is the same figure as a salary${salaryLink}.</p>
      <p class="tool-section-title" style="margin-top:22px;">Paying the bill</p>
      <p class="about-text">The ${esc(YEAR)} tax year ends on 5 April ${END_YEAR}; the return and the bill of <strong>${m(b.total)}</strong> are due by <strong>${DUE}</strong>. ${b.poa ? `As it's over £1,000 you'll also pay <strong>${m(b.poa)}</strong> on account on 31 January and again on 31 July, towards the following year. In your first year that makes <strong>${m(b.firstJanuary)}</strong> due on ${DUE}.` : "As it's under £1,000, there are no payments on account."}</p>
      <p class="tool-hint">${esc(POA_TEXT)}</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">Frequently asked questions</p>
${site.faqHtml(q)}    </main>

    <div class="hub-group-title" style="margin-top:28px;">Other profits</div>
    <p class="salary-links">${others}</p>

${site.FOOTER}
  </div>
  <script src="/tax-engine.js"></script>
  <script src="/self-employed.js"></script>
</body>
</html>
`;
}

function hub() {
  const url = SITE + BASE;
  const ex = calc("gb-se", 30000);
  const title = `Self-Employed Tax Calculator — Take-Home Pay, NI and Payments on Account (${YEAR})`;
  const desc = `Work out income tax, Class 4 National Insurance and take-home pay on your self-employed profit, your Self Assessment bill and payments on account (${YEAR}). On £30,000 profit you keep ${m(ex.net)}.`;
  const rows = PROFITS.map((p) => { const r = calc("gb-se", p), b = SE.bill(r); return [`<a href="${BASE}${p}/">${m0(p)}</a>`, m(r.values["gb-income-tax"]), m(r.values["gb-ni"]), m0(r.net), b.poa ? m0(b.poa) : "—"]; });
  const q = [
    ["How much tax do I pay when self-employed?", `Income tax at the same rates as everyone else (in ${ENG}: 20% from £12,571, 40% from £50,271, 45% over £125,140, with the personal allowance tapering from £100,000), plus Class 4 National Insurance at ${C4}. Both are worked out on your profit — income minus allowable expenses.`],
    ["When is the Self Assessment deadline?", `For the ${YEAR} tax year, the online return and the bill are due by ${DUE}. Payments on account for the next year are due on 31 January and 31 July.`],
    ["What are payments on account?", POA_TEXT],
    ["How much should I put aside for tax?", "Look at the effective rate for your profit in the table: at £30,000 it's about 15%, at £60,000 about 23%. Putting aside 25–30% of each payment you receive covers most people, plus the first payment on account."],
    ["Are these figures up to date?", `They use the ${YEAR} rates from the same data files as the salary calculators, which are checked against GOV.UK every month; the "last checked" date is on the tax rates page.`]
  ];
  const ld = [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], ["Self-Employed Tax Calculator", url]]),
    { "@context": "https://schema.org", "@type": "WebApplication", name: "Self-Employed Tax Calculator", url, applicationCategory: "FinanceApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } }, site.faqLd(q)];
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="/">← All calculators</a>
      <h1 class="page-title">Self-employed tax calculator</h1>
      <p class="page-subtitle">Income tax, Class 4 National Insurance and take-home pay on your profit — and what's due when.</p>
    </header>

${tool(30000)}
    <main class="tool">
      <p class="tool-section-title">Tax and take-home by profit (${esc(YEAR)})</p>
${site.table(["Profit", "Income tax", "Class 4 NI", "Take-home", "Each payment on account"], rows, 520)}      <p class="tool-hint" style="margin-top:12px;">${ENG}, no student loan or pension. Pick a profit for the full breakdown, Scotland and the employee comparison.</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">Frequently asked questions</p>
${site.faqHtml(q)}    </main>

${related.block(BASE)}
${site.FOOTER}
  </div>
  <script src="/tax-engine.js"></script>
  <script src="/self-employed.js"></script>
</body>
</html>
`;
}

/* Check against the data file's own hand-worked test at £30,000 */
{
  const r = calc("gb-se", 30000), b = SE.bill(r);
  if (Math.abs(r.net - 25468.2) > 0.005 || Math.abs(b.poa - 2265.9) > 0.005) throw new Error(`self-employed check: net ${r.net}, poa ${b.poa}`);
}

const urls = [];
site.write("self-employed-tax-calculator", hub());
PROFITS.forEach((p) => { site.write(`self-employed-tax-calculator/${p}`, page(p)); urls.push([`${BASE}${p}/`, "0.6"]); });
site.prune("self-employed-tax-calculator", /^\d+$/);
site.sitemapBlock("self-employed pages", "tools/build-self-employed-pages.js", urls);
console.log(`built ${urls.length + 1} self-employed pages (${YEAR})`);
