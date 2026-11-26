#!/usr/bin/env node
/* Net to gross: the salary you need for a given take-home pay.

       /net-to-gross-salary/                    calculator, any place
       /net-to-gross-salary/3000-a-month/       one UK take-home amount

       node tools/build-net-to-gross-pages.js

   The salary is solved with net-to-gross.js over tax-engine.js, from the
   tax files in force (data/tax/), with the salary calculator's places and
   options; the build stops unless every page's salary takes home at least
   its amount and a pound less doesn't. Re-run when the rates change (the
   monthly rebuild does). */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const related = require("./related.js");
const TaxEngine = require("../tax-engine.js");
const registry = require("./tax/registry.js");
const NG = require("../net-to-gross.js");
const { esc, SITE } = site;

const all = registry.readAll(), current = registry.currentFiles(all);
const chainOf = (id) => registry.chainFor(current[id].doc, all);
const CH = { gb: chainOf("gb"), "gb-sct": chainOf("gb-sct") };
const YEAR = current.gb.doc.taxYear.label;
const CHECKED = (() => { const d = CH.gb.map((x) => x.lastChecked); return d.every(Boolean) ? d.sort()[0] : undefined; })();
const OPTS = TaxEngine.merge(CH.gb).options;
const m = (v) => TaxEngine.money(v, "GBP"), m0 = (v) => TaxEngine.money(v, "GBP", true);
const BASE = "/net-to-gross-salary/";
const AMOUNTS = [1500, 1750, 2000, 2250, 2500, 2750, 3000, 3250, 3500, 3750, 4000, 4500, 5000, 5500, 6000, 7000, 8000, 10000];
const pageUrl = (a) => `${BASE}${a}-a-month/`;
const ENG = "England, Wales and Northern Ireland";

/* solve and check: the salary reaches the take-home, and a pound less doesn't */
function need(id, yearlyNet, options = {}) {
  const ch = CH[id] || chainOf(id), g = NG.solve(TaxEngine, ch, yearlyNet, options);
  const r = TaxEngine.compute(ch, g, options);
  if (g === null || r.net < yearlyNet - 0.005 || (g >= 1 && Number.isInteger(g) && TaxEngine.compute(ch, g - 1, options).net >= yearlyNet - 0.005)) throw new Error(`net to gross: ${id} ${yearlyNet} solved to ${g}`);
  return { gross: g, r };
}

const PLACES = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/salary-places.json"), "utf8")).groups;
const placeOptions = PLACES.map((g) => `<optgroup label="${esc(g.label)}">${g.places.map((x) => {
  const net = Math.round(TaxEngine.compute(chainOf(x.id), x.gross, {}).net / 12);
  return `<option value="${esc(x.id)}" data-currency="${x.currency}" data-net="${net}"${x.id === "gb" ? " selected" : ""}>${esc(x.name)}</option>`;
}).join("")}</optgroup>`).join("");
const optionFields = Object.keys(OPTS).map((k) => {
  const o = OPTS[k];
  const field = o.type === "number"
    ? `<input type="number" id="ng-opt-${k}" value="${o.default}"${o.min !== undefined ? ` min="${o.min}"` : ""}${o.max !== undefined ? ` max="${o.max}"` : ""} step="${o.step || "any"}" inputmode="decimal">`
    : `<select id="ng-opt-${k}">${Object.keys(o.choices).map((c) => `<option value="${esc(c)}"${c === o.default ? " selected" : ""}>${esc(o.choices[c])}</option>`).join("")}</select>`;
  return `<div class="field"><label for="ng-opt-${k}">${esc(o.label)}</label>${field}</div>`;
}).join("\n        ");

function tool(month, remember) {
  const { gross, r } = need("gb", month * 12);
  const rows = [`<div class="result-row"><span class="r-label">Gross a month</span><span class="r-value">${m(gross / 12)}</span></div>`]
    .concat(r.charges.filter((c) => Math.abs(c.amount) >= 0.005).map((c) => `<div class="result-row"><span class="r-label">${esc(c.label)} (a year)</span><span class="r-value">${m(c.amount)}</span></div>`))
    .concat([`<div class="result-row highlight"><span class="r-label">Take-home a month</span><span class="r-value">${m(r.net / 12)}</span></div>`,
      `<div class="result-row"><span class="r-label">Deductions</span><span class="r-value">${(Math.round(r.deductionRate * 10) / 10).toLocaleString("en-GB")}% of gross</span></div>`]);
  return `    <main class="tool split" id="ng-tool"${remember ? ' data-remember="1"' : ""}>
      <div class="field"><label for="ng-location">Where you're paid</label><select id="ng-location">${placeOptions}</select></div>
      <div class="field-row">
        <div class="field"><label for="ng-net">Take-home pay you want (<span id="ng-currency">GBP</span>)</label><input type="number" id="ng-net" value="${month}" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="ng-per">Every</label><select id="ng-per"><option value="month" selected>Month</option><option value="year">Year</option><option value="week">Week</option></select></div>
      </div>
      <div class="field-row" id="ng-options" style="flex-wrap:wrap;">
        ${optionFields}
      </div>
      <p class="tool-hint" id="ng-error" role="alert" style="color: var(--bad); display: none;"></p>
      <div class="result-box split-aside" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="ng-gross">${m0(gross)}</div>
          <div class="label" id="ng-label">a year before tax to take home ${m0(month)} a month</div>
        </div>
        <hr class="divider">
        <div class="result-grid" id="ng-rows">
          ${rows.join("\n          ")}
        </div>
      </div>
      <p class="tool-hint" style="margin-top:12px;">The UK, every US state, every Canadian province, Western Europe, Australia, New Zealand, India and Japan, for the current tax year: the same rules and options as the <a href="/salary/">salary calculator</a>, which works the other way round.</p>
    </main>
`;
}

const VARIANTS = [
  ["No student loan or pension", {}],
  ["Plan 1 student loan", { studentLoan: "plan1" }],
  ["Plan 2 student loan", { studentLoan: "plan2" }],
  ["Plan 5 student loan", { studentLoan: "plan5" }],
  ["Plan 2 and a postgraduate loan", { studentLoan: "plan2", postgradLoan: "yes" }],
  ["5% pension (relief at source)", { pensionPct: 5, pensionType: "relief" }],
  ["5% pension (salary sacrifice)", { pensionPct: 5, pensionType: "sacrifice" }]
];
const head = (title, desc, url, crumbs, q, app) => site.head({ title, desc, url, ld: [site.webPage(title, desc, url, CHECKED), site.breadcrumb(crumbs)].concat(app ? [app] : []).concat([site.faqLd(q)]) });
const scripts = `  <script src="/tax-engine.js"></script>
  <script src="/net-to-gross.js"></script>`;

function amountPage(month) {
  const url = SITE + pageUrl(month), e = need("gb", month * 12), s = need("gb-sct", month * 12);
  const v = VARIANTS.map(([label, o]) => [label, m0(need("gb", month * 12, o).gross), m0(need("gb-sct", month * 12, o).gross)]);
  const p2 = need("gb", month * 12, { studentLoan: "plan2" }), pen = need("gb", month * 12, { pensionPct: 5, pensionType: "relief" });
  const tax = e.r.byGroup.tax, ni = e.r.byGroup.social;
  const breakdown = [["Gross pay", m0(e.gross), m(e.gross / 12), m(e.gross / 52)], ["Income Tax", m(tax), m(tax / 12), m(tax / 52)], ["National Insurance", m(ni), m(ni / 12), m(ni / 52)], ["<strong>Take-home</strong>", `<strong>${m(e.r.net)}</strong>`, `<strong>${m(e.r.net / 12)}</strong>`, `<strong>${m(e.r.net / 52)}</strong>`]];
  const i = AMOUNTS.indexOf(month), near = AMOUNTS.filter((a, j) => a !== month && Math.abs(j - i) <= 3);
  const title = site.fitTitle(`What Salary Do I Need to Take Home ${m0(month)} a Month? (${YEAR})`, `Salary to Take Home ${m0(month)} a Month (${YEAR})`);
  const desc = `To take home ${m0(month)} a month in ${YEAR} you need a salary of ${m0(e.gross)} in England, Wales and Northern Ireland, or ${m0(s.gross)} in Scotland. With a student loan or pension, and the breakdown.`;
  const q = [
    [`What salary do I need to take home ${m0(month)} a month?`, `${m0(e.gross)} a year (${m(e.gross / 12)} a month before tax) in England, Wales and Northern Ireland, and ${m0(s.gross)} in Scotland, for the ${YEAR} tax year with no student loan or pension.`],
    [`How much is ${m0(month)} a month after tax a year?`, `${m0(month * 12)} a year after tax, which takes a gross salary of ${m0(e.gross)}: ${m(tax)} goes in Income Tax and ${m(ni)} in National Insurance.`],
    [`What if I have a student loan?`, `With a Plan 2 loan you need ${m0(p2.gross)} to take home ${m0(month)} a month, ${m0(p2.gross - e.gross)} more, because repayments are 9% of pay over the threshold. The table above shows the other plans.`],
    [`Does paying into a pension change the salary I need?`, `Yes: paying 5% of your salary into a pension through relief at source means you need ${m0(pen.gross)} to keep ${m0(month)} a month in your pocket. The contribution goes into your pension, so you're not losing it.`]
  ];
  const crumbs = [["Home", SITE + "/"], ["Net to Gross Salary", SITE + BASE], [`${m0(month)} a month`, url]];
  return head(title, desc, url, crumbs, q) + `    <header class="site-header">
      <a class="back-link" href="${BASE}">← Net to gross salary calculator</a>
      <h1 class="page-title">What salary do I need to take home ${m0(month)} a month?</h1>
      <p class="page-subtitle"><strong>${m0(e.gross)}</strong> a year in England, Wales and Northern Ireland, or <strong>${m0(s.gross)}</strong> in Scotland (${esc(YEAR)}).</p>
    </header>

${tool(month, false)}
    <main class="tool">
      <h2 class="tool-section-title">Salary needed with a student loan or pension</h2>
${site.table(["", ENG, "Scotland"], v, 520)}      <p class="tool-hint" style="margin-top:8px;">The salary that takes home at least ${m0(month)} a month, ${esc(YEAR)}. Pension contributions are counted as a deduction, so you need more salary to keep the same take-home.</p>
      <h2 class="tool-section-title" style="margin-top:18px;">Where ${m0(e.gross)} goes</h2>
${site.table(["", "A year", "A month", "A week"], breakdown, 520)}      <p class="tool-hint" style="margin-top:8px;">${ENG}, ${esc(YEAR)}, tax code 1257L.</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}    </main>

    <div class="hub-group-title" style="margin-top:28px;">Other take-home amounts</div>
    <p class="salary-links">${near.map((a) => `<a href="${pageUrl(a)}">${m0(a)} a month</a>`).join(" ")} <a href="${BASE}">All amounts</a></p>

${site.FOOTER}
  </div>
${scripts}
</body>
</html>
`;
}

function hubPage() {
  const url = SITE + BASE;
  const grid = AMOUNTS.map((a) => [`<a href="${pageUrl(a)}">${m0(a)}</a>`, m0(need("gb", a * 12).gross), m0(need("gb-sct", a * 12).gross), m0(need("gb", a * 12, { studentLoan: "plan2" }).gross)]);
  const e3 = need("gb", 36000), e2 = need("gb", 24000);
  const tx = (() => { const ch = chainOf("us-tx"); return NG.solve(TaxEngine, ch, 5000 * 12, {}); })();
  const title = site.fitTitle("Net to Gross Salary Calculator — What Salary Do I Need to Take Home?", "Net to Gross Salary Calculator");
  const desc = `Work out the salary you need for the take-home pay you want, after tax, National Insurance, student loan and pension. ${m0(3000)} a month in the UK takes ${m0(e3.gross)}; also every US state, Canada, Europe, Australia, India and Japan.`;
  const q = [
    ["How do I work out the gross salary for a take-home pay?", "Tax isn't a flat percentage, so you can't just add a fixed amount back on: the calculator finds the lowest salary whose take-home, after every deduction, is at least the amount you want. The salary calculator does the same sum the other way."],
    [`What salary do I need to take home ${m0(2000)} a month?`, `${m0(e2.gross)} a year in England, Wales and Northern Ireland for ${esc(YEAR)}, with no student loan or pension.`],
    [`What salary do I need to take home ${m0(3000)} a month?`, `${m0(e3.gross)} a year in England, Wales and Northern Ireland for ${esc(YEAR)}, or ${m0(need("gb-sct", 36000).gross)} in Scotland.`],
    ["Why does each extra pound of take-home cost more salary as I earn more?", `Because more of each extra pound goes in tax. Basic-rate taxpayers keep about 72p of each extra pound and higher-rate taxpayers about 58p, so to take home an extra ${m0(100)} a month you need about ${m0(139)} more a month on the basic rate and ${m0(173)} on the higher rate.`],
    ["Does it work outside the UK?", `Yes: pick where you're paid. To take home $5,000 a month in Texas, single, you need about ${TaxEngine.money(tx, "USD", true)} a year.`]
  ];
  const app = { "@context": "https://schema.org", "@type": "WebApplication", name: "Net to Gross Salary Calculator", url, applicationCategory: "FinanceApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } };
  return head(title, desc, url, [["Home", SITE + "/"], ["Personal Finance", SITE + "/personal-finance/"], ["Net to Gross Salary", url]], q, app) + `    <header class="site-header">
      <a class="back-link" href="/personal-finance/">← Personal finance calculators</a>
      <h1 class="page-title">Net to gross salary calculator</h1>
      <p class="page-subtitle">The salary you need to take home the amount you want, after tax and every other deduction.</p>
    </header>

${tool(3000, true)}
    <main class="tool">
      <h2 class="tool-section-title">UK: salary needed for each take-home amount</h2>
${site.table(["Take-home a month", ENG, "Scotland", `${ENG}, Plan 2 loan`], grid, 560)}      <p class="tool-hint" style="margin-top:8px;">${esc(YEAR)}, tax code 1257L, no pension. Pick an amount for the breakdown and other student loan plans.</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}      <p class="tool-hint" style="margin-top:12px;">Rates from the tax files for the year in force, checked every month (<a href="/tax-rates/">when each was last checked</a>).</p>
    </main>

${related.block(BASE)}
${site.FOOTER}
  </div>
${scripts}
</body>
</html>
`;
}

/* the FAQ's rule of thumb must hold: £100 more a month take-home costs about £139 (basic) and £173 (higher) */
{
  const extra = (s) => (need("gb", TaxEngine.compute(CH.gb, s, {}).net + 1200).gross - s) / 12;
  const b = Math.round(extra(30000)), h = Math.round(extra(70000));
  if (Math.abs(b - 139) > 1 || Math.abs(h - 173) > 1) throw new Error(`net to gross: the FAQ's £139 and £173 are now £${b} and £${h}`);
}

const urls = [[BASE, "0.6"]];
site.write("net-to-gross-salary", hubPage());
AMOUNTS.forEach((a) => { site.write(`net-to-gross-salary/${a}-a-month`, amountPage(a)); urls.push([pageUrl(a), "0.5"]); });
site.prune("net-to-gross-salary", /^\d+-a-month$/);
site.sitemapBlock("net to gross pages", "tools/build-net-to-gross-pages.js", urls);
console.log(`built the net to gross calculator and ${AMOUNTS.length} take-home pages (${m0(3000)} a month: ${m0(need("gb", 36000).gross)})`);
