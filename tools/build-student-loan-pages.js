#!/usr/bin/env node
/* UK student loan calculator and a page per plan:

       /student-loan-calculator/          when it's repaid or written off, and whether to overpay
       /student-loan-calculator/plan-2/   repayments by salary, interest, write-off

       node tools/build-student-loan-pages.js

   Thresholds and repayment rates are read from the UK tax file (the one the
   salary calculator uses and the monthly check keeps current); interest and
   write-off rules come from data/student-loans/uk.json (GOV.UK). Runs in the
   monthly rebuild. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const related = require("./related.js");
const SL = require("../student-loan.js");
const registry = require("./tax/registry.js");
const { SITE, esc } = site;

const BASE = "/student-loan-calculator/";
const DATA = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/student-loans/uk.json"), "utf8"));
const all = registry.readAll(), gb = registry.currentFiles(all).gb.doc;
const YEAR = gb.taxYear.label, START = Number(String(gb.taxYear.label).slice(0, 4));

/* threshold and rate for each plan, straight from the tax file's charge rules */
function fromTax() {
  const out = {};
  const item = (id) => gb.items.find((x) => x.id === id);
  const read = (c) => ({ pct: c.pct, threshold: c.of.max[1].sub[1] });
  Object.entries(item("gb-student-loan").charge.cases).forEach(([k, c]) => { if (c && c.pct) out[k] = read(c); });
  out.postgrad = read(item("gb-postgrad-loan").charge.cases.yes);
  return out;
}
const TAX = fromTax();
const PLANS = {};
Object.keys(DATA.plans).forEach((k) => { if (!TAX[k]) throw new Error("no threshold for " + k); PLANS[k] = Object.assign({ key: k }, DATA.plans[k], TAX[k]); });
const SLUG = { plan1: "plan-1", plan2: "plan-2", plan4: "plan-4", plan5: "plan-5", postgrad: "postgraduate" };
const g = (v) => "£" + Math.round(v).toLocaleString("en-GB");
const g2 = (v) => "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const interestText = (p) => p.interest.flat !== undefined ? `${p.interest.flat}%` : `${p.interest.low}% to ${p.interest.high}% depending on income`;
const SOURCES = DATA.sources.map((s) => `<a href="${s.url}" rel="noopener">${esc(s.title)}</a>`).join(" and ");

function tool(planKey, ex) {
  return `    <main class="tool" id="sl-tool" data-start="${START}" data-plans='${JSON.stringify(PLANS).replace(/'/g, "&#39;")}'>
      <div class="field-row">
        <div class="field"><label for="sl-plan">Your loan</label><select id="sl-plan">${Object.values(PLANS).map((p) => `<option value="${p.key}"${p.key === planKey ? " selected" : ""}>${esc(p.name)}</option>`).join("")}</select></div>
        <div class="field"><label for="sl-balance">What you owe now (£)</label><input type="number" id="sl-balance" value="${ex.balance}" min="0" step="any" inputmode="decimal"></div>
      </div>
      <div class="field-row">
        <div class="field"><label for="sl-salary">Salary now, before tax (£)</label><input type="number" id="sl-salary" value="${ex.salary}" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="sl-growth">Pay rises, % a year</label><input type="number" id="sl-growth" value="3" min="0" max="20" step="any" inputmode="decimal"></div>
      </div>
      <div class="field-row">
        <div class="field"><label for="sl-first">Year you were first due to repay (April)</label><input type="number" id="sl-first" value="${ex.firstDue}" min="1995" max="2040" step="1" inputmode="numeric"></div>
        <div class="field"><label for="sl-extra">Extra you'd pay a month (£)</label><input type="number" id="sl-extra" value="0" min="0" step="any" inputmode="decimal"></div>
      </div>
      <p class="tool-hint" id="sl-error" role="alert" style="color: var(--bad); display: none;"></p>
      <div class="result-box" aria-live="polite">
        <div class="result-hero"><div class="value" id="sl-monthly">${g2(Math.max(0, ex.salary - PLANS[planKey].threshold) * PLANS[planKey].pct / 100 / 12)}</div><div class="label">a month now, taken through your pay</div></div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row highlight"><span class="r-label">Outcome</span><span class="r-value" id="sl-outcome">—</span></div>
          <div class="result-row"><span class="r-label">You'll repay in total</span><span class="r-value" id="sl-paid">—</span></div>
          <div class="result-row"><span class="r-label">Interest added</span><span class="r-value" id="sl-interest">—</span></div>
          <div class="result-row"><span class="r-label">Written off</span><span class="r-value" id="sl-written">—</span></div>
          <div class="result-row"><span class="r-label">Interest rate at this salary</span><span class="r-value" id="sl-rate">—</span></div>
          <div class="result-row"><span class="r-label">Write-off date</span><span class="r-value" id="sl-writeoff">—</span></div>
        </div>
      </div>
      <p class="about-text" id="sl-verdict" style="margin-top:14px; font-weight:600;"></p>
      <p class="tool-hint">A projection, not a statement: it holds today's thresholds and interest rates steady (both change over time) and grows your salary by the rate you give. Check your real balance in your Student Loans Company account.</p>
    </main>
`;
}

function planTable(p) {
  const rows = [20000, 25000, 30000, 35000, 40000, 45000, 50000, 55000, 60000, 70000, 80000, 100000].map((s) => {
    const y = Math.max(0, s - p.threshold) * p.pct / 100;
    return [g(s), g2(y / 12), g(y), `${Math.round(SL.rate(p, s) * 100) / 100}%`];
  });
  return site.table(["Salary", "A month", "A year", "Interest rate"], rows, 340);
}

function calculatorPage() {
  const url = SITE + BASE, p2 = PLANS.plan2;
  const ex = SL.project(p2, { balance: 45000, salary: 30000, growth: 3, firstDue: 2024, start: START, extra: 0 });
  const title = "Student Loan Repayment Calculator (UK) — Plan 1, 2, 4, 5 & Postgraduate";
  const desc = `When will your student loan be repaid or written off, and is overpaying worth it? Plans 1, 2, 4, 5 and Postgraduate, with ${YEAR} thresholds and current interest rates.`;
  const q = [
    ["How much do I repay on my student loan?", `9% of what you earn over your plan's threshold (6% for a Postgraduate Loan), taken through your pay. For ${YEAR} the thresholds are ${Object.values(PLANS).map((p) => `${p.name} ${g(p.threshold)}`).join(", ")}.`],
    ["Will my student loan be written off?", `Many will be. Plan 2 and Plan 4 loans are written off 30 years after the April you were first due to repay, Plan 5 after 40 years and Plan 1 after 25 (for loans from September 2006). On £45,000 of Plan 2 debt and a £30,000 salary rising 3% a year, the calculator shows ${ex.cleared ? "it being repaid" : `about ${g(ex.paid)} repaid and ${g(ex.writtenOff)} written off`}.`],
    ["Is it worth overpaying my student loan?", "Only if you'd clear it before it's written off anyway. If you won't, every extra pound is money you'd never have had to pay. Put an extra monthly amount into the calculator: it compares the total you'd repay with and without it."],
    ["What interest rate is charged?", `${Object.values(PLANS).map((p) => `${p.name}: ${interestText(p)}`).join("; ")} — as GOV.UK lists them now. Interest is added even while you're earning under the threshold.`],
    ["Does the student loan affect my take-home pay?", "Yes — it comes out of your pay alongside tax and National Insurance. The salary calculator shows take-home pay with your plan included."]
  ];
  const ld = [site.webPage(title, desc, url, DATA.lastChecked), site.breadcrumb([["Home", SITE + "/"], ["Student Loan Calculator", url]]),
    { "@context": "https://schema.org", "@type": "WebApplication", name: "Student Loan Repayment Calculator", url, applicationCategory: "FinanceApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } }, site.faqLd(q)];
  const rows = Object.values(PLANS).map((p) => [`<a href="${BASE}${SLUG[p.key]}/">${esc(p.name)}</a>`, esc(p.who), g(p.threshold), `${p.pct}%`, interestText(p), `${p.writeOffYears} years`]);
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="/">← All calculators</a>
      <h1 class="page-title">Student loan repayment calculator</h1>
      <p class="page-subtitle">What you'll repay each month, whether you'll clear it before it's written off, and if paying extra is worth it.</p>
    </header>

${tool("plan2", { balance: 45000, salary: 30000, firstDue: 2024 })}
    <main class="tool">
      <p class="tool-section-title">The plans (${YEAR})</p>
${site.table(["Plan", "Who's on it", "Threshold", "Rate", "Interest", "Written off after"], rows, 640)}      <p class="tool-hint" style="margin-top:12px;">From ${SOURCES}, checked ${DATA.lastChecked}. Write-off is counted from the April you were first due to repay; older Plan 1 and Plan 4 loans (before September 2006 and August 2007) are written off at 65 instead.</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">Frequently asked questions</p>
${site.faqHtml(q)}    </main>

${related.block(BASE)}
${site.FOOTER}
  </div>
  <script src="/student-loan.js"></script>
</body>
</html>
`;
}

function planPage(p) {
  const label = p.key === "postgrad" ? "Postgraduate Loan" : `${p.name} Student Loan`;
  const url = SITE + `${BASE}${SLUG[p.key]}/`;
  const at40 = Math.max(0, 40000 - p.threshold) * p.pct / 100;
  const title = site.fitTitle(`${label} Repayments (${YEAR}) — ${g(p.threshold)} Threshold`, `${label} Repayments (${YEAR})`);
  const desc = `${p.name} student loans: ${p.pct}% of income over ${g(p.threshold)} a year (${YEAR}). On £40,000 that's ${g2(at40 / 12)} a month. Interest ${interestText(p)}; written off after ${p.writeOffYears} years.`;
  const q = [
    [`What is the ${p.name} repayment threshold?`, `${g(p.threshold)} a year for ${YEAR} — about ${g(p.threshold / 12)} a month. You repay ${p.pct}% of anything you earn above it.`],
    [`How much is the ${p.name} repayment on £40,000?`, `${g2(at40 / 12)} a month, or ${g(at40)} a year: ${p.pct}% of £${(40000 - p.threshold).toLocaleString("en-GB")} over the threshold.`],
    [`What interest is charged on ${p.name}?`, `${interestText(p)}${p.interest.flat === undefined ? `: ${p.interest.low}% up to ${g(p.interest.lower)}, rising steadily to ${p.interest.high}% at ${g(p.interest.upper)} and above` : ""}, as GOV.UK lists it now. Rates are reset each September.`],
    [`When is ${p.name} written off?`, `${p.writeOffYears} years after the April you were first due to repay${p.key === "plan1" ? " (for loans first paid from 1 September 2006; earlier ones at 65)" : p.key === "plan4" ? " (for loans first paid from 1 August 2007; earlier ones at 65 or 30 years, whichever comes first)" : ""}. Anything still owed then is cancelled.`],
    [`Who is on ${p.name}?`, `${p.who}.`]
  ];
  const ld = [site.webPage(title, desc, url, DATA.lastChecked), site.breadcrumb([["Home", SITE + "/"], ["Student Loan Calculator", SITE + BASE], [p.name, url]]), site.faqLd(q)];
  const others = Object.values(PLANS).filter((x) => x !== p).map((x) => `<a href="${BASE}${SLUG[x.key]}/">${esc(x.name)}</a>`).join(" ");
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="${BASE}">← Student loan calculator</a>
      <h1 class="page-title">${esc(label.replace(" Student Loan", " student loan").replace(" Loan", " loan"))} repayments</h1>
      <p class="page-subtitle">${p.pct}% of what you earn over <strong>${g(p.threshold)}</strong> a year (${YEAR}). Interest ${interestText(p)}; written off after ${p.writeOffYears} years.</p>
    </header>

${tool(p.key, { balance: p.key === "plan5" ? 50000 : p.key === "postgrad" ? 12000 : p.key === "plan1" ? 15000 : 45000, salary: 35000, firstDue: p.key === "plan1" ? 2012 : p.key === "plan5" ? 2027 : 2022 })}
    <main class="tool">
      <p class="tool-section-title">${esc(p.name)} repayments by salary</p>
${planTable(p)}      <p class="tool-hint" style="margin-top:12px;">${p.pct}% of earnings over ${g(p.threshold)}, before any other plan. From ${SOURCES}, checked ${DATA.lastChecked}.</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">Frequently asked questions</p>
${site.faqHtml(q)}    </main>

    <div class="hub-group-title" style="margin-top:28px;">Other plans</div>
    <p class="salary-links">${others}</p>

${site.FOOTER}
  </div>
  <script src="/student-loan.js"></script>
</body>
</html>
`;
}

/* Hand checks: Plan 2 on £40,000 is 9% × (40,000 − 29,385) = £955.35 a year (as in the tax file's
   own test); Plan 2 interest is 4.1% at £29,385, 6% at £52,885, halfway between at £41,135 */
if (Math.abs(Math.max(0, 40000 - PLANS.plan2.threshold) * 0.09 - 955.35) > 0.001) throw new Error("student loan threshold check");
if (SL.rate(PLANS.plan2, 29385) !== 4.1 || SL.rate(PLANS.plan2, 60000) !== 6 || Math.abs(SL.rate(PLANS.plan2, 41135) - 5.05) > 1e-9) throw new Error("plan 2 interest check");
{ const r = SL.project({ threshold: 0, pct: 100, interest: { flat: 0 }, writeOffYears: 30 }, { balance: 1200, salary: 1200, growth: 0, firstDue: START, start: START, extra: 0 });
  if (!r.cleared || r.months !== 12 || Math.abs(r.paid - 1200) > 1e-6) throw new Error("projection check"); }

const urls = [];
site.write("student-loan-calculator", calculatorPage());
Object.values(PLANS).forEach((p) => { site.write(`student-loan-calculator/${SLUG[p.key]}`, planPage(p)); urls.push([`${BASE}${SLUG[p.key]}/`, "0.6"]); });
site.prune("student-loan-calculator", /^[a-z0-9-]+$/);
site.sitemapBlock("student loan pages", "tools/build-student-loan-pages.js", urls);
console.log(`built ${BASE} and ${urls.length} plan pages (${YEAR})`);
