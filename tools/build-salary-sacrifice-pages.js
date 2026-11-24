#!/usr/bin/env node
/* The salary sacrifice calculator:

       /salary-sacrifice-calculator/

       node tools/build-salary-sacrifice-pages.js

   Income tax, National Insurance and student loans come from the UK tax files
   in force (data/tax/gb), run through tax-engine.js as on the salary
   calculator; employer National Insurance from data/uk/rates-2026-27.json; the
   salary sacrifice rules (minimum wage, the £2,000 National Insurance cap from
   April 2029) from data/uk/salary-sacrifice.json, quoted from GOV.UK. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const related = require("./related.js");
const registry = require("./tax/registry.js");
const TaxEngine = require("../tax-engine.js");
const SS = require("../salary-sacrifice.js");
const { esc, SITE } = site;

const all = registry.readAll(), cur = registry.currentFiles(all);
const gb = cur.gb.doc, CH = registry.chainFor(gb, all), SCT = registry.chainFor(cur["gb-sct"].doc, all);
const UK = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/uk/rates-2026-27.json"), "utf8"));
const R = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/uk/salary-sacrifice.json"), "utf8"));
if (UK.taxYear !== gb.taxYear.label) throw new Error(`salary sacrifice: UK rates file is ${UK.taxYear}, tax file ${gb.taxYear.label}`);
const ER = { rate: UK.employerNI.rate, threshold: UK.employerNI.threshold };
const YEAR = gb.taxYear.label;
const NI = gb.items.find((i) => i.id === "gb-ni").charge.brackets;   /* [[0,0],[PT,main],[UEL,upper]] */
const m0 = (v) => "£" + Math.round(v).toLocaleString("en-GB");
const m2 = (v) => TaxEngine.money(v, "GBP");
const run = (salary, amount, loan, pass, ch) => SS.compare(TaxEngine, ch || CH, salary, amount, loan || "none", ER, !!pass);

/* sense checks against the bands themselves: well inside the basic rate band
   the saving is the basic rate plus the main NI rate; just above the higher
   rate threshold, the higher rate plus the upper NI rate */
const B = gb.items.find((i) => i.id === "gb-income-tax").charge.brackets;
const near = (a, b) => Math.abs(a - b) < 0.01;
const ex = run(50000, 2500);
if (!near(ex.tax, 2500 * B[0][1] / 100) || !near(ex.ni, 2500 * NI[1][1] / 100) || !near(ex.cost, 2500 - ex.tax - ex.ni)) throw new Error("salary sacrifice: check at £50,000");
const hi = run(NI[2][0] + 13000, 3000);
if (!near(hi.tax, 3000 * B[1][1] / 100) || !near(hi.ni, 3000 * NI[2][1] / 100)) throw new Error("salary sacrifice: check in the higher rate band");

const rows = [[25000, 5], [35000, 5], [50000, 5], [60000, 5], [80000, 8], [110000, 10]].map(([s, p]) => {
  const r = run(s, s * p / 100);
  return [m0(s), `${p}% (${m0(r.amount)})`, m0(r.tax), m0(r.ni), m0(r.cost), Math.round(r.perPound * 100) + "p"];
});
const trap = run(110000, 10000);
const plan2 = run(40000, 2000, "plan2");
const scot = run(50000, 2500, "none", false, SCT);
const pass = run(50000, 2500, "none", true);
const cap = R.cap2029;
const SRC = (o) => `<a href="${o.source.url}" rel="nofollow noopener" target="_blank">${esc(o.source.title)}</a>`;

const P = "/salary-sacrifice-calculator/", url = SITE + P;
const tool = `    <main class="tool split" id="ss-tool" data-employer-ni="${esc(JSON.stringify(ER))}">
      <div class="field"><label for="ss-salary">Salary before sacrifice</label><input type="number" id="ss-salary" value="50000" min="0" step="any" inputmode="decimal"></div>
      <div class="field-row">
        <div class="field"><label for="ss-amount">Pension contribution you sacrifice</label><input type="number" id="ss-amount" value="5" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="ss-unit">As</label><select id="ss-unit"><option value="pct" selected>% of salary</option><option value="gbp">£ a year</option></select></div>
      </div>
      <div class="field-row">
        <div class="field"><label for="ss-where">Where you live</label><select id="ss-where"><option value="gb" selected>England, Wales or Northern Ireland</option><option value="gb-sct">Scotland</option></select></div>
        <div class="field"><label for="ss-loan">Student loan</label><select id="ss-loan"><option value="none" selected>None</option><option value="plan1">Plan 1</option><option value="plan2">Plan 2</option><option value="plan4">Plan 4 (Scotland)</option><option value="plan5">Plan 5</option></select></div>
      </div>
      <div class="field"><label><input type="checkbox" id="ss-pass" style="width:auto; margin-right:8px;">My employer adds its National Insurance saving to my pension</label></div>
      <div class="result-box split-aside" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="ss-cost">${m2(ex.cost / 12)}</div>
          <div class="label" id="ss-into">less take-home pay a month, for ${m2(ex.into / 12)} a month in your pension</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row"><span class="r-label">Take-home a month</span><span class="r-value" id="ss-before">${m2(ex.base / 12)} → ${m2(ex.net / 12)}</span></div>
          <div class="result-row"><span class="r-label">Into your pension a year</span><span class="r-value" id="ss-year">${m0(ex.into)}</span></div>
          <div class="result-row"><span class="r-label">Income tax saved a year</span><span class="r-value" id="ss-tax">${m2(ex.tax)}</span></div>
          <div class="result-row"><span class="r-label">National Insurance saved a year</span><span class="r-value" id="ss-ni">${m2(ex.ni)}</span></div>
          <div class="result-row" id="ss-loanrow" style="display:none"><span class="r-label">Student loan repayments saved</span><span class="r-value" id="ss-loansaved">£0.00</span></div>
          <div class="result-row highlight"><span class="r-label">Cost to you of each £1 in your pension</span><span class="r-value" id="ss-per">${Math.round(ex.perPound * 100)}p</span></div>
          <div class="result-row"><span class="r-label">Better off than a net pay pension by</span><span class="r-value" id="ss-vs">${m2(ex.vsNetPay)}</span></div>
          <div class="result-row"><span class="r-label">Your employer's National Insurance saving</span><span class="r-value" id="ss-er">${m2(ex.erSaving)}</span></div>
        </div>
      </div>
    </main>
`;

const body = `    <main class="tool">
      <h2 class="tool-section-title">How salary sacrifice saves you money</h2>
      <p class="about-text">With salary sacrifice you agree to a lower salary and your employer pays the difference into your pension. Because your pay is lower, you pay less <strong>income tax</strong> and less <strong>National Insurance</strong>, and if you have a student loan, smaller repayments. A pension paid from your pay before tax (a <em>net pay arrangement</em>) saves the income tax but not the National Insurance, so salary sacrifice usually leaves you better off by the National Insurance on the amount: ${NI[1][1]}% for most basic rate taxpayers, ${NI[2][1]}% on pay above ${m0(NI[2][0])}.</p>
      <p class="about-text">On ${m0(50000)}, sacrificing 5% (${m0(2500)} a year) saves ${m0(ex.tax)} of income tax and ${m0(ex.ni)} of National Insurance, so ${m0(2500)} goes into your pension for ${m0(ex.cost)} out of your take-home pay: ${Math.round(ex.perPound * 100)}p for each £1. Your employer saves ${UK.employerNI.rate}% employer National Insurance too, ${m0(ex.erSaving)} here; if they add it to your pension, ${m0(pass.into)} goes in for the same ${m0(pass.cost)}.</p>
      ${site.table(["Salary", "Sacrificed", "Income tax saved", "NI saved", "Cost to you", "Per £1 in pension"], rows, 520)}      <p class="tool-hint" style="margin-top:8px;">${YEAR} rates for England, Wales and Northern Ireland, no student loan, employer's saving not passed on.</p>
      <p class="about-text" style="margin-top:14px;"><strong>Between ${m0(100000)} and ${m0(125140)}</strong> the saving is biggest: sacrificing ${m0(10000)} on ${m0(110000)} gives back ${m0(trap.tax)} of income tax, because it also restores personal allowance, so ${m0(10000)} goes into the pension for ${m0(trap.cost)}. Salary sacrifice also lowers the income used for the <a href="/child-benefit-tax-charge-calculator/">High Income Child Benefit Charge</a>.</p>
      <p class="about-text"><strong>Student loans:</strong> repayments are worked out on your pay after the sacrifice, so on ${m0(40000)} with a Plan 2 loan, sacrificing ${m0(2000)} also cuts repayments by ${m0(plan2.loan)} a year. In <strong>Scotland</strong> the income tax saving follows the Scottish bands: ${m0(scot.tax)} on the same ${m0(2500)} from ${m0(50000)}.</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">Things to know</h2>
      <p class="about-text"><strong>Minimum wage.</strong> A salary sacrifice can't take your cash pay below the National Minimum Wage, so your employer may cap how much you can give up.</p>
      <p class="about-text"><strong>Your lower salary counts elsewhere.</strong> Some things are worked out on your contractual salary, such as mortgage applications, life cover or statutory pay; ask your employer which salary they use.</p>
      <p class="about-text"><strong>From April 2029</strong>, only the first ${m0(cap.cap)} a year of pension contributions through salary sacrifice will be free of National Insurance; anything above will have employee and employer National Insurance taken, like other workplace pension contributions. It will still be free of income tax, and employer contributions stay free of National Insurance. The figures above are for ${YEAR}.</p>
      <p class="about-text">To see your whole payslip with a pension, use the <a href="/salary/">salary calculator</a>; for what a pay rise adds, the <a href="/pay-rise-calculator/">pay rise calculator</a>; and to compare a pension with an ISA, <a href="/isa-vs-pension/">ISA or pension</a>.</p>
    </main>
`;

const q = [
  ["How much does salary sacrifice save?", `The income tax and National Insurance on the amount, plus any student loan repayment. On ${m0(50000)}, sacrificing ${m0(2500)} saves ${m0(ex.tax)} tax and ${m0(ex.ni)} National Insurance, so it costs ${m0(ex.cost)} out of your take-home pay.`],
  ["Is salary sacrifice better than a normal workplace pension?", `Usually, by the National Insurance on the contribution: ${NI[1][1]}% for basic rate taxpayers and ${NI[2][1]}% for higher rate in ${YEAR}. A net pay pension gives the same income tax relief but not the National Insurance saving.`],
  ["What is the salary sacrifice change in 2029?", `From April 2029, only the first ${m0(cap.cap)} a year of employee pension contributions through salary sacrifice will be free of National Insurance. The rest will still be free of income tax.`],
  ["Does salary sacrifice reduce my student loan repayments?", `Yes: repayments are worked out on your pay after the sacrifice. On ${m0(40000)} with a Plan 2 loan, sacrificing ${m0(2000)} cuts repayments by ${m0(plan2.loan)} a year.`],
  ["Can salary sacrifice get me out of the 60% tax trap?", `It brings your income down, so it can restore your personal allowance. Sacrificing ${m0(10000)} on ${m0(110000)} costs ${m0(trap.cost)} in take-home pay for ${m0(10000)} in your pension.`],
  ["Does my employer save money too?", `Yes, ${UK.employerNI.rate}% employer National Insurance on the amount sacrificed (on pay above ${m0(ER.threshold)} a year). Some employers add some or all of it to your pension.`]
];

const ld = [site.webPage("Salary Sacrifice Calculator", "", url, gb.lastChecked), site.breadcrumb([["Home", SITE + "/"], ["Personal Finance", SITE + "/personal-finance/"], ["Salary Sacrifice Calculator", url]]),
  { "@context": "https://schema.org", "@type": "WebApplication", name: "Salary Sacrifice Calculator", url, applicationCategory: "FinanceApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } },
  site.faqLd(q)];
const title = site.fitTitle(`Salary Sacrifice Calculator ${YEAR} — Pension Tax & NI Savings`, `Salary Sacrifice Calculator ${YEAR}`);
const desc = `Work out what a pension salary sacrifice saves in income tax, National Insurance and student loan in ${YEAR}, what it costs from your take-home pay, and how it compares with a net pay pension.`;
ld[0].description = desc;

const html = site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="/personal-finance/">← Personal finance calculators</a>
      <h1 class="page-title">Salary sacrifice calculator</h1>
      <p class="page-subtitle">What paying into your pension through <strong>salary sacrifice</strong> costs you after the income tax, National Insurance and student loan it saves, for the ${YEAR} tax year.</p>
    </header>

${tool}
${body}
    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}      <p class="tool-hint" style="margin-top:12px;">A guide, not advice. ${YEAR} income tax, National Insurance and student loan rates as on the <a href="/salary/">salary calculator</a> (last checked ${site.niceDate(gb.lastChecked)}); employer National Insurance from <a href="${UK.employerNI.source}" rel="nofollow noopener" target="_blank">GOV.UK</a>; rules from ${SRC(R.minimumWage)} and ${SRC(cap)}.</p>
    </main>

${related.block(P)}
${site.FOOTER}
  </div>
  <script src="/tax-engine.js"></script>
  <script src="/salary-sacrifice.js"></script>
</body>
</html>
`;
site.write("salary-sacrifice-calculator", html);
site.sitemapBlock("salary sacrifice pages", "tools/build-salary-sacrifice-pages.js", [[P, "0.6"]]);
console.log(`built the salary sacrifice calculator (${YEAR}; £2,500 on £50,000 costs ${m0(ex.cost)})`);
