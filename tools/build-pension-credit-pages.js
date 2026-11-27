#!/usr/bin/env node
/* The Pension Credit calculator:

       /pension-credit-calculator/

       node tools/build-pension-credit-pages.js

   The guarantee amounts, extra amounts, savings rule and Savings Credit
   maximums are quoted from GOV.UK (and the savings rule from regulation
   15(6) of the State Pension Credit Regulations 2002) in
   data/uk/pension-credit.json; the page is built from the same functions it
   runs (pension-credit.js). The build stops unless every figure is in the
   quoted wording and hand-checked examples come out. Runs in the monthly
   rebuild; the amounts change each April. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const related = require("./related.js");
const PC = require("../pension-credit.js");
const { esc, SITE } = site;

const J = (f) => JSON.parse(fs.readFileSync(path.join(site.ROOT, f), "utf8"));
const R = J("data/uk/pension-credit.json"), F = J("data/uk/state-pension-forecast.json");
const m2 = (v) => "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const m0 = (v) => "£" + Math.round(v).toLocaleString("en-GB");
const Q = (k) => R.rules[k].quote;
[["topUp", `to ${m0(R.single)} if you’re single`], ["topUp", `to ${m2(R.couple)} if you have a partner`], ["severe", `extra ${m2(R.severe)} a week`], ["carer", `extra ${m2(R.carer)} a week`],
  ["child", `${m2(R.child)} a week for each child`], ["child", `${m2(R.childFirstBefore2017)} a week for the first child`], ["disabledChild", `extra ${m2(R.disabledChild.lower)} a week`], ["disabledChild", `extra ${m2(R.disabledChild.higher)} a week`],
  ["savingsCredit", `${m2(R.savingsCredit.single)} Savings Credit`], ["savingsCredit", m2(R.savingsCredit.couple)], ["savings", `${m0(R.capital.disregard)} or less`], ["savings", `every ${m0(R.capital.step)} over`], ["tariff", "excess which is not a complete £500"]]
  .forEach(([k, s]) => { if (!Q(k).includes(s)) throw new Error(`pension credit: "${s}" isn't in the quoted wording for ${k} (data/uk/pension-credit.json)`); });
/* hand-checked: single on £180 a week, no savings: £238 − £180 = £58; with £12,250 savings, £2,250 over = 4½ steps → £5 a week, £53;
   couple on £300 with one carer: £363.25 + £48.15 − £300 = £111.40; full new State Pension alone (£241.30): nothing, £3.30 over;
   with severe disability: £324.05 − £241.30 = £82.75; one child born after April 2017 and one more: £69.98 × 2 */
const c = (o) => PC.calc(R, o);
if (R.taxYear === "2026/27" && (c({ income: 180 }).weekly !== 58 || c({ income: 180, savings: 12250 }).weekly !== 53 || PC.tariff(R, 10001) !== 1 || PC.tariff(R, 11000) !== 2 ||
  c({ couple: true, income: 300, carers: 1 }).weekly !== 111.4 || c({ income: F.fullWeekly }).weekly !== 0 || c({ income: F.fullWeekly }).short !== 3.3 || c({ income: F.fullWeekly, severe: true }).weekly !== 82.75 ||
  c({ income: 0, children: 2 }).parts.children !== 139.96)) throw new Error("pension credit: a hand-checked example no longer comes out");

const P = "/pension-credit-calculator/", u = SITE + P;
const SRC = R.sources.map((s) => `<a href="${s.url}" rel="nofollow noopener" target="_blank">${esc(s.title)}</a>`).join(" and ");
const RULES = { single: R.single, couple: R.couple, severe: R.severe, carer: R.carer, child: R.child, childFirstBefore2017: R.childFirstBefore2017, disabledChild: R.disabledChild, capital: R.capital };
const def = c({ income: 180 });
const tableRows = [150, 175, 200, 225, 250, 300, 350].map((i) => [m0(i), m2(c({ income: i }).weekly), m2(c({ couple: true, income: i }).weekly), m2(c({ income: i, severe: true }).weekly)]);
const savRows = [10000, 10500, 12000, 15000, 20000, 30000].map((s) => [m0(s), PC.tariff(R, s) ? m0(PC.tariff(R, s)) + " a week" : "Nothing", m2(c({ income: 180, savings: s }).weekly)]);

const tool = `    <main class="tool split" id="pc-tool" data-rules="${esc(JSON.stringify(RULES))}">
      <div class="field-row">
        <div class="field"><label for="pc-couple">You're</label><select id="pc-couple"><option value="single" selected>Single</option><option value="couple">A couple (income together)</option></select></div>
        <div class="field"><label for="pc-income">Income (State Pension, other pensions, earnings, most benefits)</label><input type="number" id="pc-income" value="180" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="pc-per">Per</label><select id="pc-per"><option value="week" selected>Week</option><option value="four">4 weeks</option><option value="month">Month</option><option value="year">Year</option></select></div>
      </div>
      <div class="field-row">
        <div class="field"><label for="pc-savings">Savings and investments</label><input type="number" id="pc-savings" value="0" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="pc-carers">How many of you get Carer's Allowance</label><input type="number" id="pc-carers" value="0" min="0" max="1" step="1" inputmode="numeric"></div>
        <div class="field"><label for="pc-children">Children you're responsible for</label><input type="number" id="pc-children" value="0" min="0" max="20" step="1" inputmode="numeric"></div>
      </div>
      <div class="field"><label><input type="checkbox" id="pc-severe" style="width:auto; margin-right:8px;">Severe disability: you get Attendance Allowance, PIP daily living, the middle or highest DLA care rate (or similar)</label></div>
      <div class="field-row">
        <div class="field"><label><input type="checkbox" id="pc-first" style="width:auto; margin-right:8px;">First child born before 6 April 2017</label></div>
        <div class="field"><label for="pc-dc-lower">Disabled children (lower rate)</label><input type="number" id="pc-dc-lower" value="0" min="0" max="20" step="1" inputmode="numeric"></div>
        <div class="field"><label for="pc-dc-higher">Disabled children (higher rate)</label><input type="number" id="pc-dc-higher" value="0" min="0" max="20" step="1" inputmode="numeric"></div>
      </div>
      <p class="tool-hint" id="pc-error" role="alert" style="color: var(--bad); display: none;"></p>
      <p class="tool-hint" style="margin:6px 0 0;">Don't count Attendance Allowance, PIP, DLA, Child Benefit, Housing Benefit, Council Tax Reduction or the Winter Fuel Payment as income. A pension you haven't claimed yet still counts. England, Scotland and Wales; ${esc(R.taxYear)} rates.</p>
      <div class="result-box split-aside" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="pc-weekly">${m2(def.weekly)}</div>
          <div class="label" id="pc-label">Guarantee Credit a week</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row highlight"><span class="r-label">A year (52 weeks)</span><span class="r-value" id="pc-year">${m2(def.year)}</span></div>
          <div class="result-row"><span class="r-label">Your guarantee</span><span class="r-value" id="pc-guarantee">${m2(def.guarantee)} a week</span></div>
          <div class="result-row"><span class="r-label">Your income, with savings</span><span class="r-value" id="pc-income-out">${m2(def.income)} a week</span></div>
          <div class="result-row"><span class="r-label">Income counted from savings</span><span class="r-value" id="pc-tariff">None</span></div>
        </div>
        <p class="tool-hint" id="pc-note" style="margin:10px 0 0;"></p>
      </div>
    </main>
`;
const body = `    <main class="tool">
      <h2 class="tool-section-title">Pension Credit by weekly income</h2>
${site.table(["Income a week", "Single", "Couple", "Single, severe disability"], tableRows, 560)}      <p class="tool-hint" style="margin-top:8px;">Guarantee Credit a week, ${esc(R.taxYear)}, with no savings over ${m0(R.capital.disregard)}, carers or children. The full new State Pension is ${m2(F.fullWeekly)} a week, so on its own it's ${m2(F.fullWeekly - R.single)} above the single guarantee.</p>
      <h2 class="tool-section-title" style="margin-top:18px;">How savings count</h2>
${site.table(["Savings", "Counted as income", "Pension Credit on £180 a week"], savRows, 520)}      <p class="tool-hint" style="margin-top:8px;">Each ${m0(R.capital.step)} over ${m0(R.capital.disregard)}, and any part of ${m0(R.capital.step)}, counts as £1 a week of income.</p>
      <h2 class="tool-section-title" style="margin-top:18px;">How Pension Credit works</h2>
      <p class="about-text">If you've reached State Pension age and live in England, Scotland or Wales, Pension Credit's <strong>Guarantee Credit</strong> tops your weekly income up to <strong>${m2(R.single)}</strong> if you're single or <strong>${m2(R.couple)}</strong> for a couple. The amount you're topped up to rises by ${m2(R.severe)} a week if you have a severe disability, ${m2(R.carer)} for each of you who gets Carer's Allowance, and ${m2(R.child)} a week for each child you're responsible for (${m2(R.childFirstBefore2017)} for a first child born before 6 April 2017), plus ${m2(R.disabledChild.lower)} or ${m2(R.disabledChild.higher)} for a disabled child. There can be extra for housing costs such as ground rent and service charges.</p>
      <p class="about-text">If you reached State Pension age before 6 April 2016 and saved for retirement, you might also get <strong>Savings Credit</strong>: up to ${m2(R.savingsCredit.single)} a week if you're single or ${m2(R.savingsCredit.couple)} for a couple, even without Guarantee Credit. This calculator doesn't work that part out.</p>
      <p class="about-text"><strong>Why it's worth claiming even a small amount:</strong> getting Pension Credit means you automatically get cold weather payments, and you can apply for a free TV licence if you're 75 or over and get help with NHS costs (with Guarantee Credit), as well as Council Tax Reduction, Housing Benefit and help through the Warm Home Discount. Claims can only be backdated 3 months. For couples, the severe disability rules are more involved: the Pension Service can confirm what you'd get.</p>
    </main>
`;
const q = [
  ["How much is Pension Credit?", `It tops your weekly income up to ${m2(R.single)} if you're single or ${m2(R.couple)} for a couple (${R.taxYear}), more with a severe disability, as a carer or with children. On ${m0(180)} a week, a single person would get ${m2(def.weekly)} a week.`],
  ["Can I get Pension Credit with the full State Pension?", `Not on its own: the full new State Pension is ${m2(F.fullWeekly)} a week, above the ${m2(R.single)} single guarantee. With a severe disability addition (${m2(R.severe)}) or as a carer, you could.`],
  ["How do savings affect Pension Credit?", `Savings of ${m0(R.capital.disregard)} or less don't affect it. Above that, each ${m0(R.capital.step)} (or part of ${m0(R.capital.step)}) counts as £1 a week of income: ${m0(11000)} counts as £2 a week.`],
  ["What counts as income for Pension Credit?", "Your State Pension, other pensions, earnings, and most benefits such as Carer's Allowance. Attendance Allowance, PIP, DLA, Child Benefit, Housing Benefit, Council Tax Reduction and the Winter Fuel Payment don't count."],
  ["What else do you get with Pension Credit?", "Cold weather payments automatically, and you can apply for a free TV licence if you're 75 or over and get help with NHS costs. It can also help you get Housing Benefit, Council Tax Reduction and the Warm Home Discount."]
];
const title = site.fitTitle(`Pension Credit Calculator ${R.taxYear} — How Much Will I Get?`, "Pension Credit Calculator");
const desc = `Work out your Pension Credit: income topped up to ${m2(R.single)} a week single or ${m2(R.couple)} for a couple, with extra for disability, caring and children, and how savings over ${m0(R.capital.disregard)} count.`;
const app = { "@context": "https://schema.org", "@type": "WebApplication", name: "Pension Credit Calculator", url: u, applicationCategory: "FinanceApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } };
const html = site.head({ title, desc, url: u, ld: [site.webPage(title, desc, u, R.lastChecked), site.breadcrumb([["Home", SITE + "/"], ["Personal Finance", SITE + "/personal-finance/"], ["Pension Credit Calculator", u]]), app, site.faqLd(q)] }) + `    <header class="site-header">
      <a class="back-link" href="/personal-finance/">← Personal finance calculators</a>
      <h1 class="page-title">Pension Credit calculator</h1>
      <p class="page-subtitle">How much Pension Credit you could get, and why even a little is worth claiming.</p>
    </header>

${tool}
${body}
    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}      <p class="tool-hint" style="margin-top:12px;">An estimate, not advice: the Pension Service decides. Rules from GOV.UK: ${SRC}. Last checked ${site.niceDate(R.lastChecked)}.</p>
    </main>

${related.block(P)}
${site.FOOTER}
  </div>
  <script src="/pension-credit.js"></script>
</body>
</html>
`;
site.write("pension-credit-calculator", html);
site.sitemapBlock("pension credit pages", "tools/build-pension-credit-pages.js", [[P, "0.6"]]);
console.log(`built the Pension Credit calculator (single ${m2(R.single)}, couple ${m2(R.couple)}; £180 a week single: ${m2(def.weekly)})`);
