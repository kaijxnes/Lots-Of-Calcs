#!/usr/bin/env node
/* The Lifetime ISA calculator:

       /lifetime-isa-calculator/

       node tools/build-lifetime-isa-pages.js

   GOV.UK's Lifetime ISA rules are quoted in data/uk/lifetime-isa.json; the
   page is built from the same functions it runs (lifetime-isa.js). The build
   stops unless the stored figures are in the quoted wording and hand-checked
   examples come out. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const related = require("./related.js");
const LI = require("../lifetime-isa.js");
const { esc, SITE } = site;

const R = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/uk/lifetime-isa.json"), "utf8"));
const m2 = (v) => "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const m0 = (v) => "£" + Math.round(v).toLocaleString("en-GB");
const Q = (k) => R.rules[k].quote;
[["limits", m0(R.yearlyMax)], ["limits", `${R.bonusPct}% bonus`], ["limits", m0(R.bonusMax)], ["limits", `until you’re ${R.payInUntil}`], ["limits", `before you’re ${R.openBefore}`], ["limits", m0(R.isaAllowance)],
  ["withdraw", `charge of ${R.chargePct}%`], ["homePrice", m0(R.homeMaxPrice)], ["homePrice", `${R.homeOverChargePct}% withdrawal charge`], ["sixty", `${R.withdrawFrom} or over`], ["open", `${R.openFrom} or over`]]
  .forEach(([k, s]) => { if (!Q(k).includes(s)) throw new Error(`lifetime isa: "${s}" isn't in GOV.UK's quoted wording for ${k} (data/uk/lifetime-isa.json)`); });
/* hand-checked: £4,000 + £1,000 bonus, no growth = £5,000; a 25% charge leaves £3,750, £250 less than paid in.
   From 30 to 60 at £4,000 a year, paying in stops at 50: £80,000 in, £20,000 bonus */
const a = LI.calc(R, { age: 25, yearly: 4000, growth: 0, goal: "home", years: 1 }), b = LI.calc(R, { age: 30, yearly: 4000, growth: 0, goal: "sixty" });
if (a.value !== 5000 || a.afterEarly !== 3750 || a.earlyLoss !== 250 || b.paid !== 80000 || b.bonus !== 20000) throw new Error("lifetime isa: a hand-checked example no longer comes out");

const P = "/lifetime-isa-calculator/", u = SITE + P;
const SRC = R.sources.map((s) => `<a href="${s.url}" rel="nofollow noopener" target="_blank">${esc(s.title)}</a>`).join(", ");
const def = LI.calc(R, { age: 25, balance: 0, yearly: 4000, growth: 4, goal: "home", years: 5, price: 250000 });
const yearRows = [1, 2, 3, 5, 10].map((y) => { const r = LI.calc(R, { age: 25, yearly: 4000, growth: 4, goal: "home", years: y }); return [`${y} ${y === 1 ? "year" : "years"}`, m0(r.paid), m0(r.bonus), m0(r.value)]; });
const payRows = [1000, 2000, 3000, 4000].map((c) => { const r = LI.calc(R, { age: 25, yearly: c, growth: 0, goal: "home", years: 1 }); return [m0(c), m0(r.bonus), m0(r.value), m0(r.afterEarly) + ` (${m0(r.earlyLoss)} less)`]; });
const tool = `    <main class="tool split" id="li-tool" data-rules="${esc(JSON.stringify({ yearlyMax: R.yearlyMax, bonusPct: R.bonusPct, bonusMax: R.bonusMax, payInUntil: R.payInUntil, openFrom: R.openFrom, openBefore: R.openBefore, withdrawFrom: R.withdrawFrom, chargePct: R.chargePct, homeMaxPrice: R.homeMaxPrice, homeOverChargePct: R.homeOverChargePct }))}">
      <div class="field-row">
        <div class="field"><label for="li-age">Your age now</label><input type="number" id="li-age" value="25" min="18" max="100" step="1" inputmode="numeric"></div>
        <div class="field"><label for="li-goal">Saving for</label><select id="li-goal"><option value="home" selected>A first home</option><option value="sixty">Later life (age ${R.withdrawFrom})</option></select></div>
      </div>
      <div class="field-row">
        <div class="field"><label for="li-yearly">Paying in a year (up to ${m0(R.yearlyMax)})</label><input type="number" id="li-yearly" value="4000" min="0" max="${R.yearlyMax}" step="any" inputmode="decimal"></div>
        <div class="field"><label for="li-balance">Already in your Lifetime ISA</label><input type="number" id="li-balance" value="0" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="li-growth">Growth or interest a year (%)</label><input type="number" id="li-growth" value="4" step="any" inputmode="decimal"></div>
      </div>
      <div class="field-row" id="li-home-row">
        <div class="field"><label for="li-years">Years until you buy</label><input type="number" id="li-years" value="5" min="1" max="40" step="1" inputmode="numeric"></div>
        <div class="field"><label for="li-price">Home price</label><input type="number" id="li-price" value="250000" min="0" step="any" inputmode="decimal"></div>
      </div>
      <p class="tool-hint" id="li-error" role="alert" style="color: var(--bad); display: none;"></p>
      <p class="tool-hint" style="margin:6px 0 0;">Payments go in at the start of each year with the bonus; growth isn't guaranteed, and in a cash Lifetime ISA it's the interest rate.</p>
      <div class="result-box split-aside" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="li-value">${m2(def.value)}</div>
          <div class="label" id="li-label">after 5 years, for your first home</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row"><span class="r-label">You paid in</span><span class="r-value" id="li-paid">${m2(def.paid)}</span></div>
          <div class="result-row highlight"><span class="r-label">Government bonus</span><span class="r-value" id="li-bonus">${m2(def.bonus)}</span></div>
          <div class="result-row"><span class="r-label">Growth</span><span class="r-value" id="li-growth">${m2(def.growth)}</span></div>
          <div class="result-row"><span class="r-label">Home price charge</span><span class="r-value" id="li-home">No charge</span></div>
          <div class="result-row"><span class="r-label">If you took it out for anything else</span><span class="r-value" id="li-early">${m2(def.afterEarly)}</span></div>
        </div>
        <p class="tool-hint" id="li-note" style="margin:10px 0 0;"></p>
      </div>
    </main>
`;
const body = `    <main class="tool">
      <h2 class="tool-section-title">How a Lifetime ISA works</h2>
      <p class="about-text">You can open one from ${R.openFrom} until you're ${R.openBefore}, and pay in up to <strong>${m0(R.yearlyMax)} a year</strong> until you're ${R.payInUntil}. The government adds a <strong>${R.bonusPct}% bonus</strong>, up to ${m0(R.bonusMax)} a year. The ${m0(R.yearlyMax)} counts towards your ${m0(R.isaAllowance)} yearly ISA allowance (${esc(R.taxYear)}). It can hold cash, stocks and shares, or both. From ${R.payInUntil} you can't pay in or get the bonus, but the account stays open.</p>
${site.table(["Saving £4,000 a year for", "You pay in", "Bonus", "Value at 4% a year"], yearRows, 520)}      <h2 class="tool-section-title" style="margin-top:18px;">Taking money out</h2>
      <p class="about-text">You can take it out without a charge to buy your first home, from age ${R.withdrawFrom}, or if you're terminally ill with less than 12 months to live. For a home, you must buy at least 12 months after your first payment, with a mortgage and a conveyancer or solicitor; if the property costs more than <strong>${m0(R.homeMaxPrice)}</strong>, there's a ${R.homeOverChargePct}% withdrawal charge. For anything else there's a <strong>${R.chargePct}% charge on the whole amount, bonus included</strong>, which takes back more than the bonus: pay in ${m0(4000)}, get ${m0(1000)} of bonus, and taking the ${m0(5000)} out leaves ${m0(3750)}, ${m0(250)} less than you put in.</p>
${site.table(["Paying in", "Bonus", "In the account", "If you took it out early"], payRows, 520)}      <p class="tool-hint" style="margin-top:8px;">One year, before any growth. The <a href="/isa-vs-pension/">ISA vs pension calculator</a> compares saving for later life in a pension instead, and the <a href="/stamp-duty-calculator/">stamp duty calculator</a> covers first-time buyer relief.</p>
    </main>
`;
const q = [
  ["How much is the Lifetime ISA bonus?", `${R.bonusPct}% of what you pay in, up to ${m0(R.bonusMax)} a year on the maximum ${m0(R.yearlyMax)}. Paying in until you're ${R.payInUntil}, that's up to ${m0(R.bonusMax * (R.payInUntil - 18))} if you start at 18.`],
  ["What's the Lifetime ISA withdrawal penalty?", `${R.chargePct}% of the amount you take out, including the bonus, unless it's for a first home, you're ${R.withdrawFrom} or over, or you're terminally ill. On ${m0(4000)} paid in plus ${m0(1000)} bonus, you'd get back ${m0(3750)}.`],
  ["What's the house price limit for a Lifetime ISA?", `${m0(R.homeMaxPrice)}. GOV.UK says that above it you'll pay a ${R.homeOverChargePct}% withdrawal charge; at ${m0(R.homeMaxPrice)} or under there's no charge.`],
  ["Who can open a Lifetime ISA?", `UK residents (and some crown servants and armed forces members abroad) aged ${R.openFrom} or over but under ${R.openBefore}. You can keep paying in until ${R.payInUntil}.`],
  ["When can I use my Lifetime ISA to buy a house?", "At least 12 months after your first payment into it, buying your first home with a mortgage and a conveyancer or solicitor, who receives the money from the ISA provider."]
];
const title = site.fitTitle("Lifetime ISA Calculator — 25% Bonus, Growth and Withdrawal Charge", "Lifetime ISA Calculator UK");
const desc = `Work out what a Lifetime ISA grows to with the ${R.bonusPct}% government bonus (up to ${m0(R.bonusMax)} a year) for a first home or age ${R.withdrawFrom}, and what the ${R.chargePct}% withdrawal charge would cost.`;
const ld = [site.webPage(title, desc, u, R.lastChecked), site.breadcrumb([["Home", SITE + "/"], ["Savings", SITE + "/savings/"], ["Lifetime ISA Calculator", u]]),
  { "@context": "https://schema.org", "@type": "WebApplication", name: "Lifetime ISA Calculator", url: u, applicationCategory: "FinanceApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } }, site.faqLd(q)];
const html = site.head({ title, desc, url: u, ld }) + `    <header class="site-header">
      <a class="back-link" href="/savings/">← Savings calculators</a>
      <h1 class="page-title">Lifetime ISA calculator</h1>
      <p class="page-subtitle">What a Lifetime ISA grows to with the ${R.bonusPct}% bonus, and what taking money out early would cost.</p>
    </header>

${tool}
${body}
    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}      <p class="tool-hint" style="margin-top:12px;">A guide, not financial advice: growth isn't guaranteed. Rules from GOV.UK: ${SRC}. Last checked ${site.niceDate(R.lastChecked)}.</p>
    </main>

${related.block(P)}
${site.FOOTER}
  </div>
  <script src="/lifetime-isa.js"></script>
</body>
</html>
`;
site.write("lifetime-isa-calculator", html);
site.sitemapBlock("lifetime isa pages", "tools/build-lifetime-isa-pages.js", [[P, "0.6"]]);
console.log(`built the Lifetime ISA calculator (5 years at £4,000 and 4%: ${m2(def.value)})`);
