#!/usr/bin/env node
/* The Statutory Adoption Pay calculator:

       /adoption-pay-calculator/

       node tools/build-adoption-pay-pages.js

   GOV.UK's rules for Statutory Adoption Pay and Leave are quoted in
   data/uk/adoption-pay.json; the page is built from the same functions it
   runs (adoption-pay.js). The build stops unless the rate, earnings limit
   and weeks are in GOV.UK's quoted wording and agree with
   data/uk/rates-2026-27.json, and hand-checked examples come out. Runs in
   the monthly rebuild; the rate changes each April. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const related = require("./related.js");
const AP = require("../adoption-pay.js");
const { esc, SITE } = site;

const R = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/uk/adoption-pay.json"), "utf8"));
const RATES = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/uk/rates-2026-27.json"), "utf8"));
const m2 = (v) => "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const m0 = (v) => "£" + Math.round(v).toLocaleString("en-GB");
const Q = (k) => R.rules[k].quote;
[["pay", m2(R.weeklyRate)], ["pay", `${R.earningsPct}%`], ["pay", `up to ${R.payWeeks} weeks`], ["pay", `first ${R.higherWeeks} weeks`], ["pay", `next ${R.payWeeks - R.higherWeeks} weeks`], ["eligibility", `£${R.minAverageWeekly} a week`], ["eligibility", `${R.serviceWeeks} weeks`], ["leave", `${R.leaveWeeks} weeks`]]
  .forEach(([k, s]) => { if (!Q(k).includes(s)) throw new Error(`adoption pay: "${s}" isn't in GOV.UK's quoted wording for ${k} (data/uk/adoption-pay.json)`); });
const S = RATES.statutoryPay;
if (S.smpWeekly !== R.weeklyRate || S.lowerEarningsLimit !== R.minAverageWeekly || S.smpWeeks !== R.payWeeks || R.taxYear !== RATES.taxYear) throw new Error("adoption pay: the rate, earnings limit, weeks or tax year differ from data/uk/rates-2026-27.json");
/* hand-checked: £30,000 a year is £576.92 a week; 90% is £519.23 for 6 weeks (£3,115.38) then £194.32 for 33 weeks (£6,412.56) = £9,527.94;
   £150 a week: 90% is £135, under the rate, so £135 for all 39 weeks = £5,265; £120 a week is under £129, so nothing */
const a = AP.calc(R, { awe: 30000 / 52 }), b = AP.calc(R, { awe: 150 }), z = AP.calc(R, { awe: 120 });
if (R.weeklyRate === 194.32 && (a.first !== 519.23 || a.total !== 9527.94 || b.total !== 5265 || b.capped || z.eligible || z.total !== 0)) throw new Error("adoption pay: a hand-checked example no longer comes out");

const P = "/adoption-pay-calculator/", u = SITE + P, cross = Math.round(R.weeklyRate / (R.earningsPct / 100) * 100) / 100;
const SRC = R.sources.map((s) => `<a href="${s.url}" rel="nofollow noopener" target="_blank">${esc(s.title)}</a>`).join(", ");
const RULES = { weeklyRate: R.weeklyRate, earningsPct: R.earningsPct, higherWeeks: R.higherWeeks, payWeeks: R.payWeeks, minAverageWeekly: R.minAverageWeekly, leaveWeeks: R.leaveWeeks };
const rows = [10000, 15000, 20000, 25000, 30000, 40000, 50000, 75000].map((s) => { const r = AP.calc(R, { awe: s / 52 }); return [m0(s), r.eligible ? m2(r.first) : "—", r.eligible ? m2(r.rest) : "—", r.eligible ? m2(r.total) : "Not eligible"]; });
const tool = `    <main class="tool split" id="ap-tool" data-rules="${esc(JSON.stringify(RULES))}">
      <div class="field-row">
        <div class="field"><label for="ap-pay">Your average pay before tax</label><input type="number" id="ap-pay" value="30000" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="ap-per">Per</label><select id="ap-per"><option value="1">Year</option><option value="12">Month</option><option value="52">Week</option></select></div>
      </div>
      <div class="field-row">
        <div class="field"><label for="ap-weeks">Weeks of adoption pay you'll take</label><input type="number" id="ap-weeks" value="${R.payWeeks}" min="0" max="${R.payWeeks}" step="1" inputmode="numeric"></div>
        <div class="field"><label style="margin-top:26px;"><input type="checkbox" id="ap-service" checked style="width:auto; margin-right:8px;">Employed by them for ${R.serviceWeeks} weeks by the week you're matched</label></div>
      </div>
      <p class="tool-hint" id="ap-error" role="alert" style="color: var(--bad); display: none;"></p>
      <p class="tool-hint" style="margin:6px 0 0;">${esc(R.taxYear)} rate. Your employer may pay more under a company adoption pay scheme, but can't pay less than this.</p>
      <div class="result-box split-aside" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="ap-total">${m2(a.total)}</div>
          <div class="label">Statutory Adoption Pay in total, before tax</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row"><span class="r-label">First ${R.higherWeeks} weeks</span><span class="r-value" id="ap-first">${m2(a.first)} a week</span></div>
          <div class="result-row highlight"><span class="r-label">Next ${R.payWeeks - R.higherWeeks} weeks</span><span class="r-value" id="ap-rest">${m2(a.rest)} a week</span></div>
          <div class="result-row"><span class="r-label">Unpaid adoption leave</span><span class="r-value" id="ap-unpaid">${a.unpaid} weeks</span></div>
        </div>
        <p class="tool-hint" id="ap-note" style="margin:10px 0 0;"></p>
      </div>
    </main>
`;
const body = `    <main class="tool">
      <h2 class="tool-section-title">Statutory Adoption Pay by salary</h2>
${site.table(["Salary a year", "First 6 weeks (a week)", "Next 33 weeks (a week)", "Total over 39 weeks"], rows, 600)}      <p class="tool-hint" style="margin-top:8px;">Before tax and National Insurance, ${esc(R.taxYear)}, with average weekly earnings of the salary ÷ 52. Above about ${m2(cross)} a week (${m0(cross * 52)} a year), 90% is more than the ${m2(R.weeklyRate)} rate.</p>
      <h2 class="tool-section-title" style="margin-top:18px;">How much adoption pay you get</h2>
      <p class="about-text">Statutory Adoption Pay is paid for up to <strong>${R.payWeeks} weeks</strong>: <strong>${R.earningsPct}% of your average weekly earnings</strong> for the first ${R.higherWeeks} weeks, then <strong>${m2(R.weeklyRate)}</strong> or ${R.earningsPct}% of your average weekly earnings (whichever is lower) for the next ${R.payWeeks - R.higherWeeks} weeks. It's paid like your wages, weekly or monthly, with tax and National Insurance taken off. Adoption leave is ${R.leaveWeeks} weeks (26 weeks of Ordinary and 26 weeks of Additional Adoption Leave), so the last ${R.leaveWeeks - R.payWeeks} weeks are unpaid unless your employer pays more. Only 1 person in a couple can take adoption leave; the other partner could get <a href="/paternity-pay-calculator/">paternity leave</a> instead.</p>
      <p class="about-text"><strong>Who can get it:</strong> you must have been continuously employed by your employer for at least ${R.serviceWeeks} weeks by the week you were matched with a child, earn on average at least £${R.minAverageWeekly} a week before tax, give at least 28 days' notice and give proof of the adoption or surrogacy. For an overseas adoption, the ${R.serviceWeeks} weeks are counted when you start getting adoption pay; in a surrogacy arrangement, by the 15th week before the baby's due. You can't get it for a private adoption, as a special guardian or kinship carer, or if you adopt a stepchild or family member. If you're not eligible, your employer must give you form SAP1 explaining why.</p>
    </main>
`;
const q = [
  ["How much is Statutory Adoption Pay?", `${R.earningsPct}% of your average weekly earnings for the first ${R.higherWeeks} weeks, then ${m2(R.weeklyRate)} or ${R.earningsPct}% (whichever is lower) for the next ${R.payWeeks - R.higherWeeks} weeks (${esc(R.taxYear)}).`],
  [`How much adoption pay on ${m0(30000)} a year?`, `About ${m2(a.first)} a week for the first ${R.higherWeeks} weeks, then ${m2(a.rest)} a week for ${R.payWeeks - R.higherWeeks} weeks: ${m2(a.total)} in total before tax.`],
  ["How long is adoption leave?", `${R.leaveWeeks} weeks, of which up to ${R.payWeeks} weeks are paid. Only 1 person in a couple can take adoption leave.`],
  ["Who can get Statutory Adoption Pay?", `Employees with at least ${R.serviceWeeks} weeks' continuous employment by the week they're matched with a child, who earn on average at least £${R.minAverageWeekly} a week before tax and give the right notice and proof.`],
  ["Is adoption pay the same as maternity pay?", `The amounts are the same: ${R.earningsPct}% for ${R.higherWeeks} weeks, then ${m2(R.weeklyRate)} or ${R.earningsPct}% for ${R.payWeeks - R.higherWeeks} weeks. The maternity pay calculator covers birth mothers.`]
];
const title = site.fitTitle(`Statutory Adoption Pay Calculator (${R.taxYear})`, "Adoption Pay Calculator");
const desc = `Work out Statutory Adoption Pay: ${R.earningsPct}% of earnings for ${R.higherWeeks} weeks, then ${m2(R.weeklyRate)} or ${R.earningsPct}% for ${R.payWeeks - R.higherWeeks} weeks, with eligibility and the total over ${R.payWeeks} weeks (${R.taxYear}).`;
const app = { "@context": "https://schema.org", "@type": "WebApplication", name: "Adoption Pay Calculator", url: u, applicationCategory: "FinanceApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } };
const html = site.head({ title, desc, url: u, ld: [site.webPage(title, desc, u, R.lastChecked), site.breadcrumb([["Home", SITE + "/"], ["Personal Finance", SITE + "/personal-finance/"], ["Adoption Pay Calculator", u]]), app, site.faqLd(q)] }) + `    <header class="site-header">
      <a class="back-link" href="/personal-finance/">← Personal finance calculators</a>
      <h1 class="page-title">Adoption pay calculator</h1>
      <p class="page-subtitle">How much Statutory Adoption Pay you'll get, week by week and in total.</p>
    </header>

${tool}
${body}
    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}      <p class="tool-hint" style="margin-top:12px;">A guide, not advice. Rules from GOV.UK: ${SRC}. Last checked ${site.niceDate(R.lastChecked)}.</p>
    </main>

${related.block(P)}
${site.FOOTER}
  </div>
  <script src="/adoption-pay.js"></script>
</body>
</html>
`;
site.write("adoption-pay-calculator", html);
site.sitemapBlock("adoption pay pages", "tools/build-adoption-pay-pages.js", [[P, "0.6"]]);
console.log(`built the adoption pay calculator (${m0(30000)} a year: ${m2(a.total)})`);
