#!/usr/bin/env node
/* The payslip checker:

       /payslip-checker/

       node tools/build-payslip-pages.js

   Works out what a payslip should show for one pay period from the tax code
   (tax-code.js with tools/lib/tax-code-rules.js) and the UK or Scottish tax
   file in force (tax-engine.js), and compares it with the figures on the
   visitor's payslip. GOV.UK's wording on how PAYE and National Insurance are
   worked out per period comes from data/uk/bonus-tax.json. The build stops
   unless hand-checked examples come out. Runs in the monthly rebuild. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const related = require("./related.js");
const TE = require("../tax-engine.js");
const TC = require("../tax-code.js");
const PS = require("../payslip.js");
const registry = require("./tax/registry.js");
const { R: TCR } = require("./lib/tax-code-rules.js")();
const { esc, SITE } = site;

const BT = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/uk/bonus-tax.json"), "utf8"));
const all = registry.readAll(), cur = registry.currentFiles(all), CH = registry.chainFor(cur.gb.doc, all), YEAR = cur.gb.doc.taxYear.label;
const m2 = (v) => "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const TOL = 1;
const exp = (gross, code, options, periods) => PS.expected(TE, TC, CH, TCR, { gross, periods: periods || 12, code: TC.parse(code), options: options || {} });
/* hand-checked for 2026/27: £2,500 a month on 1257L: year £30,000, tax 20% × £17,430 = £3,486 → £290.50;
   NI 8% × (£30,000 − £12,570) = £1,394.40 → £116.20; net £2,093.30.
   BR: 20% × £2,500 = £500. 5% net pay pension: £125, tax on £28,500: £3,186 → £265.50 */
const a = exp(2500, "1257L"), b = exp(2500, "BR"), c = exp(2500, "1257L", { pensionPct: 5, pensionType: "netpay" });
if (YEAR === "2026/27" && (a.tax !== 290.5 || a.ni !== 116.2 || a.net !== 2093.3 || b.tax !== 500 || c.pension !== 125 || c.tax !== 265.5)) throw new Error("payslip: a hand-checked example no longer comes out");
const cmp = PS.compare(a, { tax: 290.5, ni: 117, loan: null, pension: null, net: null }, TOL);
if (!cmp.tax.ok || !cmp.ni.ok || PS.compare(a, { tax: 400 }, TOL).tax.ok) throw new Error("payslip: the comparison came out wrong");

const P = "/payslip-checker/", u = SITE + P;
const Q = (k) => BT.rules[k].quote;
const RULES = Object.assign({}, TCR, {
  tolerance: TOL,
  taxWhy: "Tax is usually worked out on your pay so far in the tax year, so a bonus, overtime, a pay rise, a new job, or a new or emergency tax code can make one payday's tax differ. Check the tax code on your payslip.",
  niWhy: "National Insurance is worked out on each payday's pay on its own, so a bigger payday pays more."
});
const SRC = BT.sources.filter((s) => /emergency|how-much-you-pay|rates-and-thresholds/.test(s.url)).map((s) => `<a href="${s.url}" rel="nofollow noopener" target="_blank">${esc(s.title)}</a>`).join(", ");
const ex = [[1500, "1257L"], [2000, "1257L"], [2500, "1257L"], [3000, "1257L"], [4000, "1257L"], [5000, "1257L"], [2500, "BR"], [2500, "0T"], [2500, "1257L M1"], [2500, "S1257L"]];
const rows = ex.map(([g, code]) => { const chain = /^S/.test(code) ? registry.chainFor(cur["gb-sct"].doc, all) : CH, e = PS.expected(TE, TC, chain, TCR, { gross: g, periods: 12, code: TC.parse(code), options: {} }); return [m2(g), code, m2(e.tax), m2(e.ni), `<strong>${m2(e.net)}</strong>`]; });

const tool = `    <main class="tool split" id="ps-tool" data-rules="${esc(JSON.stringify(RULES))}">
      <div class="field-row">
        <div class="field"><label for="ps-gross">Gross pay this pay period</label><input type="number" id="ps-gross" value="2500" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="ps-per">Paid</label><select id="ps-per"><option value="12" selected>Monthly</option><option value="52">Weekly</option><option value="26">Every 2 weeks</option><option value="13">Every 4 weeks</option></select></div>
        <div class="field"><label for="ps-code">Tax code</label><input type="text" id="ps-code" value="1257L" autocomplete="off" spellcheck="false"></div>
      </div>
      <div class="field-row">
        <div class="field"><label for="ps-pct">Pension (% of pay)</label><input type="number" id="ps-pct" value="0" min="0" max="100" step="any" inputmode="decimal"></div>
        <div class="field"><label for="ps-ptype">Pension type</label><select id="ps-ptype"><option value="relief" selected>Relief at source</option><option value="netpay">Net pay (taken before tax)</option><option value="sacrifice">Salary sacrifice</option></select></div>
        <div class="field"><label for="ps-loan">Student loan</label><select id="ps-loan"><option value="none" selected>None</option><option value="plan1">Plan 1</option><option value="plan2">Plan 2</option><option value="plan4">Plan 4</option><option value="plan5">Plan 5</option></select></div>
        <div class="field"><label for="ps-pg">Postgraduate loan</label><select id="ps-pg"><option value="no" selected>No</option><option value="yes">Yes</option></select></div>
      </div>
      <div class="hub-group-title" style="margin:14px 0 6px;">From your payslip (optional)</div>
      <div class="field-row">
        <div class="field"><label for="ps-s-tax">Tax</label><input type="number" id="ps-s-tax" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="ps-s-ni">National Insurance</label><input type="number" id="ps-s-ni" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="ps-s-loan">Student loan</label><input type="number" id="ps-s-loan" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="ps-s-pension">Pension</label><input type="number" id="ps-s-pension" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="ps-s-net">Net pay</label><input type="number" id="ps-s-net" min="0" step="any" inputmode="decimal"></div>
      </div>
      <p class="tool-hint" id="ps-error" role="alert" style="color: var(--bad); display: none;"></p>
      <p class="tool-hint" style="margin:6px 0 0;">For regular pay that's the same each payday, ${esc(YEAR)} rates. A code starting with S uses Scottish rates. Figures within ${m2(TOL)} are just rounding.</p>
      <div class="result-box split-aside" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="ps-net">${m2(a.net)}</div>
          <div class="label" id="ps-label">take-home this pay period</div>
        </div>
        <p id="ps-verdict" style="margin:8px 0 0; font-weight:600;"></p>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row"><span class="r-label">Income Tax</span><span class="r-value"><span id="ps-tax">${m2(a.tax)}</span><span id="ps-tax-d"></span></span></div>
          <div class="result-row"><span class="r-label">National Insurance</span><span class="r-value"><span id="ps-ni">${m2(a.ni)}</span><span id="ps-ni-d"></span></span></div>
          <div class="result-row"><span class="r-label">Student loan</span><span class="r-value"><span id="ps-loan-out">${m2(a.loan)}</span><span id="ps-loan-d"></span></span></div>
          <div class="result-row"><span class="r-label">Pension</span><span class="r-value"><span id="ps-pension">${m2(a.pension)}</span><span id="ps-pension-d"></span></span></div>
          <div class="result-row highlight"><span class="r-label">Net pay</span><span class="r-value"><span id="ps-net-row">${m2(a.net)}</span><span id="ps-net-d"></span></span></div>
        </div>
      </div>
    </main>
`;
const body = `    <main class="tool">
      <h2 class="tool-section-title">What a monthly payslip should show (${esc(YEAR)})</h2>
${site.table(["Gross a month", "Tax code", "Income Tax", "National Insurance", "Net pay"], rows, 600)}      <p class="tool-hint" style="margin-top:8px;">Regular monthly pay, no pension or student loan. On BR every pound is taxed at the basic rate; on 0T there's no tax-free allowance; 1257L M1 (an emergency code) gives the same as 1257L when pay is the same every month.</p>
      <h2 class="tool-section-title" style="margin-top:18px;">Why your payslip might be different</h2>
      <p class="about-text"><strong>Income Tax:</strong> GOV.UK: "${esc(Q("cumulative"))}" So the first payday in a new job, a month with a bonus or overtime, or a changed tax code can take more or less tax than a normal month. If your tax code looks wrong, the <a href="/tax-code-checker/">tax code checker</a> explains it.</p>
      <p class="about-text"><strong>National Insurance</strong> is worked out on each payday's pay on its own, not the year so far: for ${esc(YEAR)}, ${esc(Q("niPeriod"))}. So a bigger payday pays more, and it isn't evened out later.</p>
      <p class="about-text"><strong>Student loans</strong> are also worked out on each payday's pay, for example: ${esc(Q("loanPeriod"))}.</p>
    </main>
`;
const q = [
  ["How do I check my payslip is right?", "Enter your gross pay, pay period and tax code (all on your payslip), plus any pension and student loan, and the checker works out the tax, National Insurance and net pay you should see. Then enter your payslip's figures to compare them line by line."],
  [`How much tax should I pay on ${m2(2500)} a month?`, `On tax code 1257L in ${esc(YEAR)}, about ${m2(a.tax)} Income Tax and ${m2(a.ni)} National Insurance, leaving ${m2(a.net)}, if you're paid the same every month and have no pension or student loan.`],
  ["Why is my tax different this month?", "Tax is usually worked out on your pay so far in the tax year, so a bonus, overtime, a pay rise, starting a new job or a new tax code can change one month's tax. On an emergency code it's worked out on that payday's pay only."],
  ["Why is my National Insurance higher this month?", "National Insurance is worked out on each payday's pay on its own, so a payday with a bonus or overtime pays more, and it isn't evened out over the year."],
  ["What does M1 or W1 on my tax code mean?", "It's an emergency tax code: tax is worked out on what you're paid in that week or month only, as if you were paid that amount every week or month of the year."]
];
const title = site.fitTitle(`Payslip Checker UK ${YEAR} — Is My Tax and NI Right?`, "Payslip Checker UK");
const desc = `Check your payslip: enter your pay, tax code, pension and student loan to see the Income Tax, National Insurance and net pay you should get, and compare them with yours (${YEAR}).`;
const app = { "@context": "https://schema.org", "@type": "WebApplication", name: "Payslip Checker", url: u, applicationCategory: "FinanceApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } };
const html = site.head({ title, desc, url: u, ld: [site.webPage(title, desc, u, BT.lastChecked), site.breadcrumb([["Home", SITE + "/"], ["Personal Finance", SITE + "/personal-finance/"], ["Payslip Checker", u]]), app, site.faqLd(q)] }) + `    <header class="site-header">
      <a class="back-link" href="/personal-finance/">← Personal finance calculators</a>
      <h1 class="page-title">Payslip checker</h1>
      <p class="page-subtitle">What your payslip should show for tax, National Insurance and take-home, and whether yours matches.</p>
    </header>

${tool}
${body}
    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}      <p class="tool-hint" style="margin-top:12px;">A guide, not advice. Rates from the ${esc(YEAR)} UK and Scottish tax files; how PAYE works per payday from GOV.UK: ${SRC}. If you think your tax is wrong, contact HMRC or your employer's payroll.</p>
    </main>

${related.block(P)}
${site.FOOTER}
  </div>
  <script src="/tax-engine.js"></script>
  <script src="/tax-code.js"></script>
  <script src="/payslip.js"></script>
</body>
</html>
`;
site.write("payslip-checker", html);
site.sitemapBlock("payslip checker pages", "tools/build-payslip-pages.js", [[P, "0.6"]]);
console.log(`built the payslip checker (${m2(2500)} a month on 1257L: tax ${m2(a.tax)}, NI ${m2(a.ni)}, net ${m2(a.net)})`);
