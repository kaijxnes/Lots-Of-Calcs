#!/usr/bin/env node
/* The tax refund estimator:

       /tax-refund-calculator/

       node tools/build-tax-refund-pages.js

   Compares the Income Tax due on a tax year's pay with the tax PAYE took
   (typed in, or estimated from the months worked and the tax code), using
   the same rules as the tax code checker (tools/lib/tax-code-rules.js) and
   how HMRC settles the difference, quoted from GOV.UK in
   data/uk/tax-refunds.json. The build stops unless a full year on 1257L
   takes exactly the tax due. Runs in the monthly rebuild. */
const site = require("./lib/site.js");
const related = require("./related.js");
const TR = require("../tax-refund.js");
const { RF, R } = require("./lib/tax-code-rules.js")();
const { esc, SITE } = site;

const m0 = (v) => "£" + Math.round(v).toLocaleString("en-GB");
const m2 = (v) => "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
if (Math.abs(TR.taken(R, "1257L", 3000, 12) - TR.due(R, 36000, false)) > 0.01) throw new Error("tax refund: a full year on 1257L should take exactly the tax due");

/* left work after six months on £2,500 a month */
const ex = { monthly: 2500, months: 6 };
ex.taken = TR.taken(R, "1257L", ex.monthly, ex.months); ex.due = TR.due(R, ex.monthly * ex.months, false); ex.refund = ex.taken - ex.due;
const cases = [[2000, 3], [2000, 6], [2500, 6], [3000, 6], [3000, 9], [4000, 6]].map(([mo, n]) => {
  const t = TR.taken(R, "1257L", mo, n), d = TR.due(R, mo * n, false);
  return [m0(mo), String(n), m0(mo * n), m2(t), m2(d), m2(t - d)];
});
const P = "/tax-refund-calculator/", url = SITE + P;
const SRC = RF.sources.map((s) => `<a href="${s.url}" rel="nofollow noopener" target="_blank">${esc(s.title)}</a>`).join(", ");

const tool = `    <main class="tool split" id="tr-tool" data-rules="${esc(JSON.stringify(R))}">
      <div class="field-row">
        <div class="field"><label for="tr-monthly">Monthly pay before tax</label><input type="number" id="tr-monthly" value="${ex.monthly}" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="tr-months">Months paid this tax year</label><input type="number" id="tr-months" value="${ex.months}" min="0" max="12" step="1" inputmode="numeric"></div>
      </div>
      <div class="field-row">
        <div class="field"><label for="tr-more">Other taxable income before 5 April</label><input type="number" id="tr-more" value="0" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="tr-region">Where you pay tax</label><select id="tr-region"><option value="ruk">England, Wales or Northern Ireland</option><option value="scotland">Scotland</option></select></div>
      </div>
      <div class="field-row">
        <div class="field"><label for="tr-paid">Tax taken so far (from your P45 or payslips)</label><input type="number" id="tr-paid" value="" placeholder="Leave blank to estimate" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="tr-code">Your tax code</label><input type="text" id="tr-code" value="1257L" autocomplete="off" spellcheck="false"></div>
      </div>
      <p class="tool-hint" id="tr-code-err" role="alert" style="color: var(--bad); display: none;">That tax code isn't recognised: check it with the <a href="/tax-code-checker/">tax code checker</a>, or type the tax taken instead.</p>
      <p class="tool-hint" style="margin:6px 0 0;">The tax year runs from 6 April to 5 April. Count every job and pension; "other income" is anything still to come before 5 April, such as a new job.</p>
      <div class="result-box split-aside" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="tr-value">${m2(ex.refund)}</div>
          <div class="label" id="tr-label">refund you're likely owed</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row"><span class="r-label">Taxable income for the year</span><span class="r-value" id="tr-income">${m2(ex.monthly * ex.months)}</span></div>
          <div class="result-row"><span class="r-label">Tax due for the year</span><span class="r-value" id="tr-due">${m2(ex.due)}</span></div>
          <div class="result-row highlight"><span class="r-label">Tax taken</span><span class="r-value" id="tr-taken">${m2(ex.taken)} (estimated)</span></div>
        </div>
        <p class="tool-hint" id="tr-next" style="margin:10px 0 0;"></p>
      </div>
    </main>
`;

const body = `    <main class="tool">
      <h2 class="tool-section-title">Why people are owed tax back</h2>
      <p class="about-text">PAYE spreads your tax-free Personal Allowance (${m0(R.personalAllowance)}) evenly across the year. If you stop working part way through, you've only used part of it, so you've paid tax on income that turns out to be tax-free. Leave a job paying ${m0(ex.monthly)} a month after ${ex.months} months and PAYE takes about ${m2(ex.taken)}, but the tax due on ${m0(ex.monthly * ex.months)} for the whole year is only ${m2(ex.due)}: <strong>${m2(ex.refund)}</strong> back.</p>
${site.table(["Monthly pay", "Months", "Pay", "Tax taken", "Tax due", "Refund"], cases, 520)}      <p class="about-text" style="margin-top:14px;">Other common reasons: being on the wrong tax code, an emergency code (W1, M1 or X) that taxed each payday on its own, finishing one job and starting another paid in the same month, starting a work pension, or work expenses you haven't claimed relief on. The reverse happens too: two jobs both using the full allowance, or untaxed income, leave you owing tax.</p>
      <h2 class="tool-section-title" style="margin-top:18px;">How you get it back</h2>
      <p class="about-text">After the tax year ends on 5 April, HMRC compares what you earned with what was taken and sends a <strong>tax calculation letter (P800)</strong> if it doesn't match. The letters go out between June and the end of November. If yours says you can claim online, the money arrives within <strong>5 working days</strong>; a cheque takes up to 6 weeks if you ask for one, or comes within 14 days if the letter says it'll be sent. If you owe less than ${m0(R.collectLimit)} and still pay tax through PAYE, HMRC usually collects it through your tax code over the next tax year. GOV.UK's <a href="https://www.gov.uk/claim-tax-refund" rel="nofollow noopener" target="_blank">refund checker</a> shows how to claim sooner in your situation.</p>
    </main>
`;

const q = [
  ["How do I know if I'm owed a tax refund?", `If more tax was taken through PAYE than is due on your whole year's income. It's most likely if you stopped working part way through the tax year, were on an emergency or wrong tax code, or had two jobs end and start in the same month. This estimator compares the two.`],
  ["When will HMRC send my tax refund?", "HMRC sends tax calculation letters (P800s) between June and the end of November after the tax year ends on 5 April. Claimed online, the refund arrives within 5 working days."],
  [`How much tax will I get back if I stop working after ${ex.months} months?`, `On ${m0(ex.monthly)} a month with the standard 1257L code, about ${m2(ex.refund)}: ${m2(ex.taken)} taken against ${m2(ex.due)} due on ${m0(ex.monthly * ex.months)} for the year, if you have no other income before 5 April.`],
  ["What if I've paid too little tax?", `HMRC usually collects underpaid tax of less than ${m0(R.collectLimit)} by changing your tax code, so it comes out of your pay or pension in equal amounts over the next tax year. Otherwise it writes to you about how to pay.`],
  ["Does an emergency tax code mean I'll get a refund?", "Not always. An emergency code taxes each payday as if you were paid that much every week or month, so it overcharges if your pay jumps around or you start part way through the year. If too much was taken, it comes back once HMRC updates your code or at the end of the year."]
];
const title = site.fitTitle("Tax Refund Calculator UK — How Much Tax You're Owed Back", "Tax Refund Calculator UK (PAYE)");
const desc = `Estimate a UK PAYE tax refund: the tax due on your year's pay against what was taken, for leaving a job mid-year, an emergency tax code or a wrong code, and how HMRC pays it back.`;
const ld = [site.webPage(title, desc, url, RF.lastChecked), site.breadcrumb([["Home", SITE + "/"], ["Personal Finance", SITE + "/personal-finance/"], ["Tax Refund Calculator", url]]),
  { "@context": "https://schema.org", "@type": "WebApplication", name: "Tax Refund Calculator", url, applicationCategory: "FinanceApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } }, site.faqLd(q)];

const html = site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="/personal-finance/">← Personal finance calculators</a>
      <h1 class="page-title">Tax refund calculator</h1>
      <p class="page-subtitle">Whether PAYE has taken too much or too little Income Tax this year, and how HMRC settles it.</p>
    </header>

${tool}
${body}
    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}      <p class="tool-hint" style="margin-top:12px;">An estimate, not advice: HMRC's figure decides it. ${esc(R.year)} rates from the UK and Scottish tax files; how refunds work from ${SRC}. Last checked ${site.niceDate(RF.lastChecked)}.</p>
    </main>

${related.block(P)}
${site.FOOTER}
  </div>
  <script src="/tax-code.js"></script>
  <script src="/tax-refund.js"></script>
</body>
</html>
`;
site.write("tax-refund-calculator", html);
site.sitemapBlock("tax refund pages", "tools/build-tax-refund-pages.js", [[P, "0.6"]]);
console.log(`built the tax refund calculator (${ex.months} months on ${m0(ex.monthly)}: ${m2(ex.refund)} back)`);
