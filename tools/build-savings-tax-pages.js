#!/usr/bin/env node
/* The savings interest tax calculator, with how other countries tax it:

       /savings-tax-calculator/

       node tools/build-savings-tax-pages.js

   UK rules (Personal Allowance, starting rate for savings, Personal Savings
   Allowance, rates for 2026/27 and from April 2027) are quoted from GOV.UK
   in data/uk/savings-tax.json, with the bands from the UK tax file in
   force; the other countries' rules come from the official source in each
   entry. The page is built from the same functions it runs
   (savings-tax.js), and GOV.UK's two worked examples must come out (£16,000
   wages and £200 interest: no tax; a basic-rate taxpayer with £1,300
   interest: £60) or the build stops. Runs in the monthly rebuild. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const related = require("./related.js");
const registry = require("./tax/registry.js");
const ST = require("../savings-tax.js");
const { esc, SITE } = site;

const D = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/uk/savings-tax.json"), "utf8"));
const gb = registry.currentFiles(registry.readAll()).gb.doc;
const br = gb.items.find((i) => i.id === "gb-income-tax").charge.brackets, pa = gb.items.find((i) => i.id === "gb-personal-allowance").value;
const R = { personalAllowance: pa.taper, taperFrom: pa.from, basicBand: br[1][0], higherLimit: br[2][0], startingRate: D.uk.startingRate, psa: D.uk.psa, years: D.uk.years };
if (R.personalAllowance + R.startingRate !== D.uk.startingLimit) throw new Error("savings tax: Personal Allowance + £5,000 no longer matches GOV.UK's £17,570 starting rate limit");
const Y = Object.keys(D.uk.years)[0], Y2 = Object.keys(D.uk.years)[1];
if (ST.calc(R, 16000, 200, Y).tax !== 0 || ST.calc(R, 16000, 200, Y).starting !== 200) throw new Error("savings tax: GOV.UK's £16,000 + £200 example should pay no tax");
if (ST.calc(R, 30000, 1300, Y).tax !== 60) throw new Error("savings tax: GOV.UK's £1,300 basic-rate example should be £60");

const m2 = (v) => "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const m0 = (v) => "£" + Math.round(v).toLocaleString("en-GB");
const ex = { other: 35000, interest: 2000 }; ex.r = ST.calc(R, ex.other, ex.interest, Y);
const exRows = [[0, 3000], [16000, 2000], [25000, 1000], [35000, 2000], [45000, 3000], [60000, 2000], [90000, 5000], [140000, 3000]].map(([o, i]) => {
  const a = ST.calc(R, o, i, Y), b = ST.calc(R, o, i, Y2);
  return [m0(o), m0(i), m2(a.tax), m2(b.tax)];
});
const RU = D.uk.years[Y].rates, RU2 = D.uk.years[Y2].rates;
const SYM = { USD: "$", CAD: "C$", EUR: "€", JPY: "¥" };
const N = 5000;
const world = [["United Kingdom", "Taxed with your other income at 20%, 40% or 45% after the Personal Allowance, starting rate for savings and Personal Savings Allowance", "£1,000 a year for basic-rate taxpayers (£500 higher, £0 additional), plus up to £5,000 starting rate", `${m2(ST.calc(R, 35000, N, Y).tax)} for a basic-rate taxpayer on ${m0(35000)}`]]
  .concat(D.countries.map((c) => {
    const t = ST.abroad(c, N), cur = SYM[c.currency] || "";
    const fmt = (v) => cur + Math.round(v).toLocaleString("en-GB");
    return [esc(c.name), esc(c.summary), esc(c.allowance), t === null ? "At your marginal rate" : fmt(t)];
  }));
const SRC = (u, t) => `<a href="${u}" rel="nofollow noopener" target="_blank">${esc(t)}</a>`;

const P = "/savings-tax-calculator/", url = SITE + P;
const tool = `    <main class="tool split" id="st-tool" data-rules="${esc(JSON.stringify(R))}">
      <div class="field-row">
        <div class="field"><label for="st-other">Other income for the year (wages, pension)</label><input type="number" id="st-other" value="${ex.other}" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="st-interest">Savings interest for the year</label><input type="number" id="st-interest" value="${ex.interest}" min="0" step="any" inputmode="decimal"></div>
      </div>
      <div class="field-row">
        <div class="field"><label for="st-year">Tax year</label><select id="st-year">${Object.keys(D.uk.years).map((k) => `<option value="${k}"${k === Y ? " selected" : ""}>${esc(D.uk.years[k].label)}</option>`).join("")}</select></div>
      </div>
      <p class="tool-hint" id="st-error" role="alert" style="color: var(--bad); display: none;"></p>
      <p class="tool-hint" style="margin:6px 0 0;">Interest from all your accounts outside ISAs, before tax, for the tax year (6 April to 5 April). Joint account interest is split equally between you. Before tax and without dividends.</p>
      <div class="result-box split-aside" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="st-tax">${m2(ex.r.tax)}</div>
          <div class="label" id="st-label">tax on ${m2(ex.interest)} of interest</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row"><span class="r-label">Covered by your Personal Allowance</span><span class="r-value" id="st-pa">${m2(ex.r.pa)}</span></div>
          <div class="result-row"><span class="r-label">Starting rate for savings (0%)</span><span class="r-value" id="st-start">${m2(ex.r.starting)}</span></div>
          <div class="result-row"><span class="r-label">Personal Savings Allowance</span><span class="r-value" id="st-psa">${m2(ex.r.psa)}</span></div>
          <div class="result-row"><span class="r-label">Interest taxed</span><span class="r-value" id="st-taxed">${m2(ex.r.taxed)}</span></div>
          <div class="result-row highlight"><span class="r-label">Interest you keep</span><span class="r-value" id="st-kept">${m2(ex.r.kept)}</span></div>
        </div>
      </div>
    </main>
`;

const body = `    <main class="tool">
      <h2 class="tool-section-title">How UK savings interest is taxed</h2>
      <p class="about-text">Most people pay no tax on their savings interest, because three allowances come first, each for the tax year:</p>
      <ul class="about-list"><li><strong>Personal Allowance:</strong> any of your ${m0(R.personalAllowance)} not used by wages or pension covers interest first.</li><li><strong>Starting rate for savings:</strong> up to ${m0(R.startingRate)} of interest at 0% if your other income is under ${m0(D.uk.startingLimit)}; every £1 of other income above the Personal Allowance cuts it by £1. GOV.UK's example: £16,000 of wages leaves ${m0(Math.max(0, R.startingRate - (16000 - R.personalAllowance)))} of starting rate, so £200 of interest is tax-free.</li><li><strong>Personal Savings Allowance:</strong> ${m0(R.psa.basic)} for basic-rate taxpayers, ${m0(R.psa.higher)} for higher-rate and nothing for additional-rate, with your band worked out on your other income plus all your interest.</li></ul>
      <p class="about-text">Interest above those is taxed at your usual rate: ${RU.join("%, ")}% in ${esc(D.uk.years[Y].label)}, rising to <strong>${RU2.join("%, ")}%</strong> from 6 April 2027. Interest in ISAs isn't taxed at all, and Scottish taxpayers pay the same tax on savings interest as the rest of the UK. Your bank tells HMRC what you earned after the tax year ends, and if there's tax to pay HMRC usually collects it through your tax code.</p>
${site.table(["Other income", "Interest", `Tax ${esc(Y.replace("-", "/"))}`, `Tax ${esc(Y2.replace("-", "/"))}`], exRows, 520)}    </main>

    <main class="tool">
      <h2 class="tool-section-title">How other countries tax savings interest</h2>
      <p class="about-text">Some countries tax interest as ordinary income at your normal rates, as the UK does; others take a flat rate, often withheld by the bank before you're paid. The last column is the tax on ${N.toLocaleString("en-GB")} of interest in the local currency for one person, where the rate doesn't depend on your other income.</p>
${site.table(["Country", "How interest is taxed", "Tax-free amount", `Tax on ${N.toLocaleString("en-GB")} of interest`], world, 760)}      <p class="tool-hint" style="margin-top:8px;">Before any tax-free accounts each country offers. Germany: plus church tax if you pay it. Sources: ${D.countries.map((c) => SRC(c.source.url, c.name)).join(", ")}.</p>
      <p class="about-text" style="margin-top:12px;">To see what your savings will earn before tax, use the <a href="/savings/">savings calculator</a> or the <a href="/compound-interest/">compound interest calculator</a>; for dividends, the <a href="/dividend-tax-calculator/">dividend tax calculator</a>; and for using this year's ISA allowance, the <a href="/guides/before-the-tax-year-ends/">tax year end checklist</a>.</p>
    </main>
`;

const q = [
  ["How much savings interest can I earn tax-free?", `Up to ${m0(R.psa.basic)} a year as a basic-rate taxpayer (${m0(R.psa.higher)} higher-rate, nothing additional-rate), plus up to ${m0(R.startingRate)} more at 0% if your other income is under ${m0(D.uk.startingLimit)}, plus any unused Personal Allowance. ISA interest is always tax-free.`],
  [`How much tax will I pay on ${m0(ex.interest)} of savings interest?`, `With ${m0(ex.other)} of other income you're a basic-rate taxpayer, so the first ${m0(R.psa.basic)} is tax-free and the rest is taxed at ${RU[0]}%: ${m2(ex.r.tax)} in ${esc(D.uk.years[Y].label)}.`],
  ["What is the tax rate on savings interest from April 2027?", `${RU2.join("%, ")}% for basic, higher and additional-rate taxpayers, on interest above your allowances.`],
  ["Do I need to tell HMRC about my savings interest?", "Banks and building societies report the interest they pay to HMRC after the tax year ends. If you're employed or get a pension, HMRC works out any tax and usually collects it through your tax code; if you file Self Assessment, you report it there."],
  ["How is savings interest taxed in other countries?", `It varies: Ireland takes 33% DIRT, Germany 26.375% above a €1,000 allowance, France a 31.4% flat tax, Spain 19% to 30%, Japan 20.315% withheld, while the US and Canada tax it with your other income.`],
  ["Do Scottish taxpayers pay Scottish rates on savings interest?", "No. Scottish Income Tax applies to wages and pensions, but you pay the same tax as the rest of the UK on savings interest and dividends."]
];
const title = site.fitTitle("Savings Interest Tax Calculator UK — Personal Savings Allowance, and Other Countries", "Savings Interest Tax Calculator");
const desc = `Work out the tax on your savings interest: the Personal Savings Allowance, starting rate for savings and rates for ${D.uk.years[Y].label} and from April 2027, plus how the US, Canada, Ireland, Germany, France, Spain and Japan tax interest.`;
const ld = [site.webPage(title, desc, url, D.lastChecked), site.breadcrumb([["Home", SITE + "/"], ["Personal Finance", SITE + "/personal-finance/"], ["Savings Interest Tax Calculator", url]]),
  { "@context": "https://schema.org", "@type": "WebApplication", name: "Savings Interest Tax Calculator", url, applicationCategory: "FinanceApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } }, site.faqLd(q)];

const html = site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="/personal-finance/">← Personal finance calculators</a>
      <h1 class="page-title">Savings interest tax calculator</h1>
      <p class="page-subtitle">How much of your savings interest is tax-free in the UK, the tax on the rest, and how other countries tax it.</p>
    </header>

${tool}
${body}
    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}      <p class="tool-hint" style="margin-top:12px;">A guide, not advice. UK rules from GOV.UK's ${SRC(D.uk.rules.allowances.url, "Tax on savings interest")} and ${SRC(D.uk.rules.scotland.url, "Scottish Income Tax")} pages; 2027/28 rates from ${SRC(D.uk.rules.rates2027.url, "Budget 2026 OOTLAR Annex A")}; bands from the UK tax file. Last checked ${site.niceDate(D.lastChecked)}.</p>
    </main>

${related.block(P)}
${site.FOOTER}
  </div>
  <script src="/savings-tax.js"></script>
</body>
</html>
`;
site.write("savings-tax-calculator", html);
site.sitemapBlock("savings tax pages", "tools/build-savings-tax-pages.js", [[P, "0.6"]]);
console.log(`built the savings tax calculator (${m0(ex.interest)} on ${m0(ex.other)}: ${m2(ex.r.tax)}; ${D.countries.length} other countries)`);
