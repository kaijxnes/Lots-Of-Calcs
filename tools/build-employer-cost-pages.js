#!/usr/bin/env node
/* The employer cost calculator and a page for each salary:

       /employer-cost-calculator/
       /employer-cost-calculator/30000/   (and other salaries)

       node tools/build-employer-cost-pages.js

   Employer National Insurance, Employment Allowance and pension minimums
   are quoted from GOV.UK in data/uk/employer-cost.json; the pages are built
   from the same functions the calculator runs (employer-cost.js), and the
   employee's take-home from the UK tax file in force (tax-engine.js). The
   build stops unless each figure is in GOV.UK's quoted wording, agrees with
   data/uk/rates-2026-27.json and the tax file's year, and a hand-checked
   example comes out the same. Runs in the monthly rebuild. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const related = require("./related.js");
const TaxEngine = require("../tax-engine.js");
const registry = require("./tax/registry.js");
const EC = require("../employer-cost.js");
const { esc, SITE } = site;

const R = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/uk/employer-cost.json"), "utf8"));
const RATES = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/uk/rates-2026-27.json"), "utf8"));
const all = registry.readAll(), current = registry.currentFiles(all), CH = registry.chainFor(current.gb.doc, all);
const YEAR = current.gb.doc.taxYear.label;
const m2 = (v) => "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const m0 = (v) => "£" + Math.round(v).toLocaleString("en-GB");
const pc = (v) => `${(Math.round(v * 1000) / 10).toLocaleString("en-GB")}%`;
const Q = (k) => R.rules[k].quote;

/* the figures must still be GOV.UK's, and agree with the other UK files */
const need = [["threshold", m0(R.ni.secondaryThreshold)], ["upper", m0(R.ni.upperSecondaryThreshold)], ["rateA", `${R.ni.rate}%`], ["allowance", m0(R.employmentAllowance)],
  ["pensionBand", m0(R.pension.lower)], ["pensionBand", m0(R.pension.upper)], ["pensionMin", `${R.pension.employerMinPct}% ${R.pension.employeeMinPct}%`], ["autoEnrol", m0(R.pension.autoEnrolFrom)],
  ["levy", `${R.levy.pct}%`], ["levyAllowance", m0(R.levy.allowance)]];
need.forEach(([k, s]) => { if (!Q(k).includes(s)) throw new Error(`employer cost: "${s}" isn't in GOV.UK's quoted wording for ${k} (data/uk/employer-cost.json)`); });
const E = RATES.employerNI;
if (E.rate !== R.ni.rate || E.threshold !== R.ni.secondaryThreshold || E.employmentAllowance !== R.employmentAllowance) throw new Error("employer cost: employer NI figures differ from data/uk/rates-2026-27.json");
if (R.taxYear !== RATES.taxYear || YEAR !== R.taxYear) throw new Error(`employer cost: data/uk/employer-cost.json is for ${R.taxYear}, the UK tax file for ${YEAR}: update it for the new year`);
/* hand-checked: £30,000, 15% of £25,000 = £3,750; 3% of £23,760 = £712.80; £34,462.80 */
const chk = EC.calc(R, { salary: 30000, category: "standard", basis: "qualifying", pensionPct: 3 });
if (R.taxYear === "2026/27" && (chk.ni !== 3750 || chk.pension !== 712.8 || chk.total !== 34462.8)) throw new Error(`employer cost: the £30,000 example gives ${chk.total}, not £34,462.80`);

const BASE = "/employer-cost-calculator/", SALARIES = [15000, 20000, 25000, 30000, 35000, 40000, 45000, 50000, 60000, 70000, 80000, 100000];
const surl = (s) => `${BASE}${s}/`;
const std = (s, extra) => EC.calc(R, Object.assign({ salary: s, category: "standard", basis: "qualifying", pensionPct: R.pension.employerMinPct }, extra || {}));
const net = (s) => TaxEngine.compute(CH, s, {}).net;
const SRC = R.sources.map((s) => `<a href="${s.url}" rel="nofollow noopener" target="_blank">${esc(s.title)}</a>`).join(", ");
const RULES = { ni: R.ni, employmentAllowance: R.employmentAllowance, pension: R.pension };

function tool(salary) {
  const r = std(salary);
  return `    <main class="tool split" id="ec-tool" data-rules="${esc(JSON.stringify(RULES))}">
      <div class="field-row">
        <div class="field"><label for="ec-salary">Salary before tax</label><input type="number" id="ec-salary" value="${salary}" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="ec-per">Per</label><select id="ec-per"><option value="1" selected>Year</option><option value="12">Month</option><option value="52">Week</option></select></div>
      </div>
      <div class="field-row">
        <div class="field"><label for="ec-cat">Employee</label><select id="ec-cat"><option value="standard" selected>21 or over (category A)</option><option value="under21">Under 21 (category M)</option><option value="apprentice">Apprentice under 25 (category H)</option></select></div>
        <div class="field"><label for="ec-pct">Employer pension contribution (%)</label><input type="number" id="ec-pct" value="${R.pension.employerMinPct}" min="0" max="100" step="any" inputmode="decimal"></div>
        <div class="field"><label for="ec-basis">Pension worked out on</label><select id="ec-basis"><option value="qualifying" selected>Earnings ${m0(R.pension.lower)} to ${m0(R.pension.upper)} (most schemes)</option><option value="full">The whole salary</option></select></div>
      </div>
      <div class="field-row">
        <div class="field"><label for="ec-other">Other costs a year (benefits, equipment, training)</label><input type="number" id="ec-other" value="0" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label><input type="checkbox" id="ec-ea" style="width:auto; margin-right:8px;">Use Employment Allowance against this employee's NI (up to ${m0(R.employmentAllowance)} a year in total)</label></div>
      </div>
      <p class="tool-hint" id="ec-error" role="alert" style="color: var(--bad); display: none;"></p>
      <div class="result-box split-aside" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="ec-total">${m2(r.total)}</div>
          <div class="label" id="ec-label">total cost a year: ${pc(r.onTop)} on top of the salary</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row"><span class="r-label">A month</span><span class="r-value" id="ec-month">${m2(r.total / 12)}</span></div>
          <div class="result-row"><span class="r-label">Employer National Insurance</span><span class="r-value" id="ec-ni">${m2(r.ni)}</span></div>
          <div class="result-row"><span class="r-label">Employment Allowance</span><span class="r-value" id="ec-ea-out">not used</span></div>
          <div class="result-row"><span class="r-label">Employer pension</span><span class="r-value" id="ec-pension">${m2(r.pension)}</span></div>
          <div class="result-row highlight"><span class="r-label">Cost on top of the salary</span><span class="r-value" id="ec-extra">${m2(r.extra)}</span></div>
        </div>
        <p class="tool-hint" id="ec-note" style="margin:10px 0 0;"></p>
      </div>
    </main>
`;
}
const explain = `    <main class="tool">
      <h2 class="tool-section-title">What an employer pays on top of salary</h2>
      <p class="about-text"><strong>Employer National Insurance</strong> is ${R.ni.rate}% of earnings above ${m0(R.ni.secondaryThreshold)} a year (${esc(R.taxYear)}), with no upper limit. For employees under 21 and apprentices under 25 it's 0% up to ${m0(R.ni.upperSecondaryThreshold)}, and ${R.ni.rate}% above. Benefits in kind such as a company car carry Class 1A National Insurance at ${R.ni.rate}% too.</p>
      <p class="about-text"><strong>Employment Allowance</strong> takes up to ${m0(R.employmentAllowance)} a year off an eligible employer's National Insurance bill, across all its staff. It's not available to public bodies (unless they're a charity), or to a company whose only employee paying secondary Class 1 National Insurance is its sole director.</p>
      <p class="about-text"><strong>Pension:</strong> an employer must automatically enrol workers aged between 22 and State Pension age who earn at least ${m0(R.pension.autoEnrolFrom)} a year. The minimum is ${R.pension.employerMinPct}% from the employer and ${R.pension.employeeMinPct}% from the employee (${R.pension.employerMinPct + R.pension.employeeMinPct}% in total), and in most schemes it's worked out on earnings between ${m0(R.pension.lower)} and ${m0(R.pension.upper)}. Scheme rules can set it higher. The <a href="/salary-sacrifice-calculator/">salary sacrifice calculator</a> shows how paying in by salary sacrifice changes the National Insurance both sides pay.</p>
      <p class="about-text"><strong>Apprenticeship Levy</strong> is ${R.levy.pct}% of the annual pay bill for employers whose pay bill is more than ${m0(R.levy.payBill)}, less an allowance of ${m0(R.levy.allowance)} a year, so most small employers don't pay it.</p>
    </main>
`;
const head = (title, desc, u, crumbs, q, app) => site.head({ title, desc, url: u, ld: [site.webPage(title, desc, u, R.lastChecked), site.breadcrumb(crumbs)].concat(app ? [app] : []).concat([site.faqLd(q)]) });
const SCRIPT = `  <script src="/employer-cost.js"></script>`;

function page(s) {
  const u = SITE + surl(s), r = std(s), u21 = std(s, { category: "under21" }), ea = std(s, { allowance: true }), take = net(s);
  const rows = [
    ["Salary", m2(s), m2(s / 12)],
    [`Employer National Insurance (${R.ni.rate}% above ${m0(R.ni.secondaryThreshold)})`, m2(r.ni), m2(r.ni / 12)],
    [`Employer pension (${R.pension.employerMinPct}% of ${m0(r.pensionable)})`, m2(r.pension), m2(r.pension / 12)],
    ["<strong>Total cost</strong>", `<strong>${m2(r.total)}</strong>`, `<strong>${m2(r.total / 12)}</strong>`]
  ];
  const cmp = [
    ["21 or over", m2(r.ni), m2(r.total)], ["Under 21 or apprentice under 25", m2(u21.ni), m2(u21.total)],
    ["21 or over, with Employment Allowance covering the NI", m2(ea.niPaid), m2(ea.total)]
  ];
  const title = site.fitTitle(`Cost of Employing Someone on ${m0(s)} — Employer NI and Pension (${YEAR})`, `Cost of Employing Someone on ${m0(s)}`);
  const desc = `Employing someone on ${m0(s)} costs about ${m0(r.total)} a year in ${YEAR}: ${m2(r.ni)} employer National Insurance and ${m2(r.pension)} minimum pension on top of the salary. They take home about ${m0(take)}.`;
  const q = [
    [`How much does it cost to employ someone on ${m0(s)}?`, `About ${m2(r.total)} a year (${m2(r.total / 12)} a month) in ${YEAR}: the salary, ${m2(r.ni)} of employer National Insurance and ${m2(r.pension)} for the minimum ${R.pension.employerMinPct}% pension contribution. That's ${pc(r.onTop)} on top of the salary.`],
    [`How much employer National Insurance is there on ${m0(s)}?`, `${m2(r.ni)} a year: ${R.ni.rate}% of the ${m0(Math.max(0, s - R.ni.secondaryThreshold))} above ${m0(R.ni.secondaryThreshold)}. For an employee under 21 or an apprentice under 25 it's ${m2(u21.ni)}.`],
    [`How much does the employee take home on ${m0(s)}?`, `About ${m2(take)} a year (${m2(take / 12)} a month) in England, Wales and Northern Ireland, with tax code 1257L, before their own pension contribution or any student loan. The salary calculator has the full breakdown.`],
    ["Does Employment Allowance reduce the cost?", `If the employer is eligible, it takes up to ${m0(R.employmentAllowance)} a year off its National Insurance bill across all staff, which would cover the ${m2(r.ni)} here.`]
  ];
  const salaryPage = fs.existsSync(path.join(site.ROOT, "salary", `${s}-after-tax`, "index.html")) ? `/salary/${s}-after-tax/` : null;
  const others = (salaryPage ? [`<a href="${salaryPage}">${m0(s)} after tax</a>`] : []).concat(SALARIES.filter((x) => x !== s).map((x) => `<a href="${surl(x)}">${m0(x)}</a>`)).join(" ");
  return head(title, desc, u, [["Home", SITE + "/"], ["Employer Cost Calculator", SITE + BASE], [m0(s), u]], q) + `    <header class="site-header">
      <a class="back-link" href="${BASE}">← Employer cost calculator</a>
      <h1 class="page-title">Cost of employing someone on ${m0(s)}</h1>
      <p class="page-subtitle">About <strong>${m0(r.total)}</strong> a year with employer National Insurance and the minimum pension (${esc(YEAR)}).</p>
    </header>

${tool(s)}
    <main class="tool">
      <h2 class="tool-section-title">${m0(s)}: the employer's cost</h2>
${site.table(["", "A year", "A month"], rows, 520)}      <p class="tool-hint" style="margin-top:8px;">An employee aged 21 or over, minimum auto-enrolment pension on earnings between ${m0(R.pension.lower)} and ${m0(R.pension.upper)}, no Employment Allowance. The employee takes home about ${m2(take)} a year (${pc(take / r.total)} of the cost).</p>
      <h2 class="tool-section-title" style="margin-top:18px;">By employee</h2>
${site.table(["Employee", "Employer NI", "Total cost a year"], cmp, 520)}    </main>

    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}      <p class="tool-hint" style="margin-top:12px;">A guide, not advice. Figures from GOV.UK: ${SRC}. Last checked ${site.niceDate(R.lastChecked)}.</p>
    </main>

    <div class="hub-group-title" style="margin-top:28px;">Other salaries</div>
    <p class="salary-links">${others}</p>

${site.FOOTER}
  </div>
${SCRIPT}
</body>
</html>
`;
}

function hub() {
  const u = SITE + BASE, ex = std(30000);
  const grid = SALARIES.map((s) => { const r = std(s), u21 = std(s, { category: "under21" }); return [`<a href="${surl(s)}">${m0(s)}</a>`, m2(r.ni), m2(r.pension), m2(r.total), m2(u21.total)]; });
  const title = site.fitTitle(`Employer Cost Calculator UK ${YEAR} — Employer NI and Pension`, `Employer Cost Calculator ${YEAR}`);
  const desc = `What an employee really costs: salary plus ${R.ni.rate}% employer National Insurance above ${m0(R.ni.secondaryThreshold)} and the minimum pension. ${m0(30000)} costs about ${m0(ex.total)} a year (${YEAR}).`;
  const q = [
    ["How much does an employee cost on top of their salary?", `Employer National Insurance at ${R.ni.rate}% of pay above ${m0(R.ni.secondaryThreshold)} a year, and at least ${R.pension.employerMinPct}% pension on earnings between ${m0(R.pension.lower)} and ${m0(R.pension.upper)} for workers who are auto-enrolled. On ${m0(30000)} that's ${m2(ex.extra)}, or ${pc(ex.onTop)} on top.`],
    ["What is the employer National Insurance rate?", `${R.ni.rate}% on earnings above the secondary threshold of ${m0(R.ni.secondaryThreshold)} a year (${esc(R.taxYear)}). For under-21s and apprentices under 25 it's 0% up to ${m0(R.ni.upperSecondaryThreshold)}.`],
    ["What is Employment Allowance?", `It reduces an eligible employer's annual National Insurance bill by up to ${m0(R.employmentAllowance)}. Companies whose only employee paying secondary Class 1 National Insurance is the sole director can't claim it.`],
    ["What's the minimum employer pension contribution?", `${R.pension.employerMinPct}% from the employer and ${R.pension.employeeMinPct}% from the employee, usually on earnings between ${m0(R.pension.lower)} and ${m0(R.pension.upper)}, for workers aged 22 to State Pension age earning at least ${m0(R.pension.autoEnrolFrom)}.`]
  ];
  const app = { "@context": "https://schema.org", "@type": "WebApplication", name: "Employer Cost Calculator", url: u, applicationCategory: "BusinessApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } };
  return head(title, desc, u, [["Home", SITE + "/"], ["Personal Finance", SITE + "/personal-finance/"], ["Employer Cost Calculator", u]], q, app) + `    <header class="site-header">
      <a class="back-link" href="/personal-finance/">← Personal finance calculators</a>
      <h1 class="page-title">Employer cost calculator</h1>
      <p class="page-subtitle">What an employee costs: salary plus employer National Insurance and pension (${esc(YEAR)}).</p>
    </header>

${tool(30000)}
    <main class="tool">
      <h2 class="tool-section-title">Cost of employing someone by salary</h2>
${site.table(["Salary", "Employer NI", "Minimum pension", "Total cost", "Under 21 or apprentice"], grid, 620)}      <p class="tool-hint" style="margin-top:8px;">A year, ${esc(R.taxYear)}, minimum auto-enrolment pension, no Employment Allowance. Pick a salary for the breakdown and the employee's take-home.</p>
    </main>

${explain}
    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}      <p class="tool-hint" style="margin-top:12px;">A guide, not advice. Figures from GOV.UK: ${SRC}. Last checked ${site.niceDate(R.lastChecked)}.</p>
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
site.write("employer-cost-calculator", hub());
SALARIES.forEach((s) => { site.write(`employer-cost-calculator/${s}`, page(s)); urls.push([surl(s), "0.5"]); });
site.sitemapBlock("employer cost pages", "tools/build-employer-cost-pages.js", urls);
console.log(`built the employer cost calculator and ${SALARIES.length} salary pages (${m0(30000)}: ${m2(chk.total)})`);
