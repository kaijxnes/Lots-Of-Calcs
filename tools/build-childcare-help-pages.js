#!/usr/bin/env node
/* Tax-Free Childcare vs Universal Credit childcare:

       /childcare-help-calculator/

       node tools/build-childcare-help-pages.js

   Tax-Free Childcare rules are quoted from GOV.UK in
   data/uk/tax-free-childcare.json; the Universal Credit side comes from
   data/uk/universal-credit.json through universal-credit.js. The page is
   built from the same functions it runs (childcare-help.js). The build
   stops unless the stored figures are in GOV.UK's quoted wording and
   hand-checked examples come out the same. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const related = require("./related.js");
const CH = require("../childcare-help.js");
const { esc, SITE } = site;

const T = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/uk/tax-free-childcare.json"), "utf8"));
const U = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/uk/universal-credit.json"), "utf8"));
const m2 = (v) => "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const m0 = (v) => "£" + v.toLocaleString("en-GB", { maximumFractionDigits: 2 });
const Q = (k) => T.rules[k].quote;
[[`£${T.payIn} you pay`, "topUp"], [`by £${T.topUpPer}`, "topUp"], [m0(T.maxYear), "topUp"], [m0(T.maxYearDisabled), "topUp"], [m0(T.maxQuarter), "topUp"], [m0(T.maxQuarterDisabled), "topUp"], [m2(T.minEarnQuarter["21+"]), "income"], [m0(T.incomeLimit), "limit"]]
  .forEach(([s, k]) => { if (!Q(k).includes(s)) throw new Error(`childcare help: "${s}" isn't in GOV.UK's quoted wording for ${k} (data/uk/tax-free-childcare.json)`); });
/* hand-checked: £800 a month for one child: Tax-Free Childcare £160 (20%), Universal Credit 85% = £680;
   a couple over 25 with £800 rent and £4,500 take-home only gets £210.76 of it (2026/27) */
const ex = (e, cost, kids) => CH.calc(T, U, { couple: true, over25: true, children: kids, health: "none", housing: 800, childcare: cost, earnings: e, tfcEligible: true });
const a = ex(2500, 800, 1), b = ex(4500, 800, 1);
if (a.tfc !== 160 || (U.taxYear === "2026/27" && (a.ucGain !== 680 || b.ucGain !== 210.76))) throw new Error(`childcare help: the hand-checked examples give ${a.tfc}, ${a.ucGain}, ${b.ucGain}`);

const P = "/childcare-help-calculator/", u = SITE + P;
const SRC = T.sources.map((s) => `<a href="${s.url}" rel="nofollow noopener" target="_blank">${esc(s.title)}</a>`).concat([`<a href="${U.sources[0].url}" rel="nofollow noopener" target="_blank">${esc(U.sources[0].title)}</a>`]).join(", ");
const rules = { tfc: T, uc: { standard: U.standard, child: U.child, firstChildBefore2017Extra: U.firstChildBefore2017Extra, disabledChild: U.disabledChild, health: U.health, carer: U.carer, childcarePct: U.childcarePct, childcareMax: U.childcareMax, workAllowance: U.workAllowance, taperPct: U.taperPct, capital: U.capital, benefitCap: U.benefitCap } };
const def = ex(2500, 800, 1);
const tool = `    <main class="tool split" id="ch-tool" data-rules="${esc(JSON.stringify(rules))}">
      <div class="field-row">
        <div class="field"><label for="ch-couple">You're</label><select id="ch-couple"><option value="1" selected>A couple</option><option value="0">Single</option></select></div>
        <div class="field"><label for="ch-age">Age</label><select id="ch-age"><option value="1" selected>25 or over (either of you)</option><option value="0">Under 25 (both of you)</option></select></div>
      </div>
      <div class="field-row">
        <div class="field"><label for="ch-children">Children in childcare</label><input type="number" id="ch-children" value="1" min="1" step="1" inputmode="numeric"></div>
        <div class="field"><label for="ch-disabled">Of them, disabled (higher Tax-Free Childcare limit)</label><input type="number" id="ch-disabled" value="0" min="0" step="1" inputmode="numeric"></div>
        <div class="field"><label for="ch-cost">Childcare costs a month</label><input type="number" id="ch-cost" value="800" min="0" step="any" inputmode="decimal"></div>
      </div>
      <div class="field-row">
        <div class="field"><label for="ch-earn">Take-home pay a month (both of you)</label><input type="number" id="ch-earn" value="2500" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="ch-housing">Rent Universal Credit would help with, a month</label><input type="number" id="ch-housing" value="800" min="0" step="any" inputmode="decimal"></div>
      </div>
      <div class="field"><label><input type="checkbox" id="ch-eligible" checked style="width:auto; margin-right:8px;">You (and your partner) each expect to earn at least ${m2(T.minEarnQuarter["21+"])} over the next 3 months, and neither of you has adjusted net income over ${m0(T.incomeLimit)}</label></div>
      <p class="tool-hint" id="ch-error" role="alert" style="color: var(--bad); display: none;"></p>
      <p class="tool-hint" style="margin:6px 0 0;">Universal Credit uses the ${esc(U.taxYear)} amounts with no extra health or carer amounts and no savings; the <a href="/universal-credit-calculator/">Universal Credit calculator</a> covers those.</p>
      <div class="result-box split-aside" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="ch-best">${def.better === "tfc" ? "Tax-Free Childcare" : "Universal Credit"}</div>
          <div class="label" id="ch-label">about ${m2(def.diff)} a month more help</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row highlight"><span class="r-label">Tax-Free Childcare top-up a month</span><span class="r-value" id="ch-tfc">${m2(def.tfc)}</span></div>
          <div class="result-row highlight"><span class="r-label">Extra Universal Credit for childcare</span><span class="r-value" id="ch-uc">${m2(def.ucGain)}</span></div>
          <div class="result-row"><span class="r-label">Universal Credit with childcare</span><span class="r-value" id="ch-ucwith">${m2(def.ucWith)}</span></div>
          <div class="result-row"><span class="r-label">Universal Credit without it</span><span class="r-value" id="ch-ucwithout">${m2(def.ucWithout)}</span></div>
        </div>
        <p class="tool-hint" style="margin:10px 0 0;">You can't get Tax-Free Childcare while you claim Universal Credit. If you switch, wait for a decision on Tax-Free Childcare before cancelling Universal Credit.</p>
      </div>
    </main>
`;
const costs = [300, 600, 900, 1200, 1500];
const grid = (earn, kids) => costs.map((c) => { const r = ex(earn, c, kids); return [m0(c), m2(r.tfc), m2(r.ucGain), r.better === "tfc" ? "Tax-Free Childcare" : r.better === "uc" ? "Universal Credit" : "Same"]; });
const body = `    <main class="tool">
      <h2 class="tool-section-title">How the two compare</h2>
      <p class="about-text"><strong>Tax-Free Childcare</strong> adds £${T.topUpPer} for every £${T.payIn} you pay into a childcare account: 20% of the cost, up to ${m0(T.maxQuarter)} every 3 months per child (${m0(T.maxYear)} a year), or ${m0(T.maxQuarterDisabled)} (${m0(T.maxYearDisabled)} a year) for a disabled child. You usually need to be working, each earn at least ${m2(T.minEarnQuarter["21+"])} over 3 months if you're 21 or over, and neither of you can have adjusted net income over ${m0(T.incomeLimit)}. Children qualify until the September after they turn 11 (16 if disabled), and the provider must be signed up.</p>
      <p class="about-text"><strong>Universal Credit</strong> pays back up to ${U.childcarePct}% of childcare costs if you're working (both of you, if you're a couple, unless one can't work because of a disability or health condition), up to ${m2(U.childcareMax.one)} a month for one child or ${m2(U.childcareMax.twoOrMore)} for two or more. But it's part of your Universal Credit award, which goes down by ${U.taperPct}p for each £1 you earn above any work allowance, so on higher earnings only part of it gets through, and above a certain income none of it does. You can't get both at once.</p>
      <h3 class="tool-section-title" style="margin-top:14px;">Couple over 25, one child, £800 rent, £2,500 take-home a month</h3>
${site.table(["Childcare a month", "Tax-Free Childcare", "Extra Universal Credit", "More help"], grid(2500, 1), 560)}      <h3 class="tool-section-title" style="margin-top:14px;">The same family on £4,500 take-home a month</h3>
${site.table(["Childcare a month", "Tax-Free Childcare", "Extra Universal Credit", "More help"], grid(4500, 1), 560)}      <p class="tool-hint" style="margin-top:8px;">A month, ${esc(U.taxYear)} Universal Credit amounts. GOV.UK's childcare calculator works out which kind of support is best for you.</p>
    </main>
`;
const q = [
  ["Can I get Tax-Free Childcare and Universal Credit at the same time?", "No. If you claim Universal Credit you can't get Tax-Free Childcare at the same time. If you switch, wait for a decision on your Tax-Free Childcare application before cancelling Universal Credit."],
  ["Which is better, Tax-Free Childcare or Universal Credit?", `Universal Credit pays back up to ${U.childcarePct}% of costs and Tax-Free Childcare 20%, so Universal Credit usually gives more while you still get a decent Universal Credit award. As earnings rise, the ${U.taperPct}% taper eats into it, and at higher incomes Tax-Free Childcare can be worth more.`],
  ["How much is Tax-Free Childcare?", `£${T.topUpPer} for every £${T.payIn} you pay in, up to ${m0(T.maxYear)} a year per child (${m0(T.maxYearDisabled)} if the child is disabled). On ${m0(800)} a month of childcare that's ${m2(CH.tfc(T, 800, 1, 0))} a month.`],
  ["How much childcare does Universal Credit pay?", `Up to ${U.childcarePct}% of costs, to a maximum of ${m2(U.childcareMax.one)} a month for one child and ${m2(U.childcareMax.twoOrMore)} for two or more (${esc(U.taxYear)}). You pay the provider first and claim it back.`],
  ["Who can get Tax-Free Childcare?", `Working parents who each expect to earn at least ${m2(T.minEarnQuarter["21+"])} over the next 3 months (if 21 or over), with neither earning over ${m0(T.incomeLimit)} adjusted net income, for children up to the September after they turn 11 (16 if disabled).`]
];
const title = site.fitTitle("Tax-Free Childcare vs Universal Credit Calculator — Which Gives More?", "Tax-Free Childcare vs Universal Credit");
const desc = `Compare Tax-Free Childcare (20% top-up, up to ${m0(T.maxYear)} a year per child) with Universal Credit childcare (${U.childcarePct}% of costs, reduced as earnings rise) and see which gives your family more.`;
const ld = [site.webPage(title, desc, u, T.lastChecked), site.breadcrumb([["Home", SITE + "/"], ["Personal Finance", SITE + "/personal-finance/"], ["Childcare Help Calculator", u]]),
  { "@context": "https://schema.org", "@type": "WebApplication", name: "Tax-Free Childcare vs Universal Credit Calculator", url: u, applicationCategory: "FinanceApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } }, site.faqLd(q)];
const html = site.head({ title, desc, url: u, ld }) + `    <header class="site-header">
      <a class="back-link" href="/personal-finance/">← Personal finance calculators</a>
      <h1 class="page-title">Tax-Free Childcare vs Universal Credit</h1>
      <p class="page-subtitle">Which childcare help is worth more to your family, since you can't get both.</p>
    </header>

${tool}
${body}
    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}      <p class="tool-hint" style="margin-top:12px;">An estimate, not advice. Rules from GOV.UK: ${SRC}. Last checked ${site.niceDate(T.lastChecked)}.</p>
    </main>

${related.block(P)}
${site.FOOTER}
  </div>
  <script src="/universal-credit.js"></script>
  <script src="/childcare-help.js"></script>
</body>
</html>
`;
site.write("childcare-help-calculator", html);
site.sitemapBlock("childcare help pages", "tools/build-childcare-help-pages.js", [[P, "0.6"]]);
console.log(`built the childcare help calculator (£800 a month: Tax-Free Childcare ${m2(a.tfc)}, Universal Credit ${m2(a.ucGain)})`);
