#!/usr/bin/env node
/* Builds /emergency-fund-calculator/.

       node tools/build-emergency-fund.js

   The maths is emergency-fund.js, the page's own code. The example figures
   are illustrative spending, not averages. */
const site = require("./lib/site.js");
const related = require("./related.js");
const E = require("../emergency-fund.js");
const { SITE } = site;

const BASE = "/emergency-fund-calculator/";
const ITEMS = [
  ["rent", "Rent or mortgage", 900], ["bills", "Council tax, energy, water, broadband, phone", 350], ["food", "Food shopping", 300],
  ["transport", "Getting to work", 120], ["insurance", "Insurance", 40], ["debt", "Minimum debt repayments", 0], ["childcare", "Childcare", 0], ["other", "Other essentials", 50]
];
const total = ITEMS.reduce((a, x) => a + x[2], 0);
const g = (v) => "£" + v.toLocaleString("en-GB");

function page() {
  const url = SITE + BASE;
  const t3 = total * 3, t6 = total * 6, n3 = E.monthsToReach(t3, 0, 250, 0), n6 = E.monthsToReach(t6, 0, 250, 0);
  const title = "Emergency Fund Calculator — How Much to Save and How Long It Takes";
  const desc = `Work out your emergency fund: three to six months of essential spending. On ${g(total)} a month of essentials that's ${g(t3)} to ${g(t6)} — about ${n3} months to build three months' cover saving £250 a month.`;
  const q = [
    ["How much should an emergency fund be?", "Three to six months of essential spending is the usual guide: enough to cover rent or mortgage, bills, food, transport and minimum debt payments if your income stopped or a big bill arrived. Lean towards six months or more if you're self-employed, the only earner, or your income varies."],
    ["What counts as essential spending?", "What you'd still have to pay if you cut back hard: housing, council tax, utilities, food, insurance, transport to work, childcare and minimum debt repayments. Leave out holidays, eating out and subscriptions you'd cancel."],
    ["Where should I keep my emergency fund?", "Somewhere safe and easy to reach without penalty, such as an easy-access savings account or cash ISA, separate from your current account so it doesn't get spent. Not in investments that could fall just when you need the money."],
    ["Should I pay off debt or build an emergency fund first?", "Many people build a small buffer first — even one month of essentials — so an unexpected bill doesn't go on a credit card, then tackle expensive debt, then finish the fund."],
    [`How long does it take to save ${g(t3)}?`, `${n3} months at £250 a month, or ${E.monthsToReach(t3, 0, 500, 0)} months at £500. Add the interest rate on your savings account to see how much sooner it gets there.`]
  ];
  const ld = [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], ["Emergency Fund Calculator", url]]),
    { "@context": "https://schema.org", "@type": "WebApplication", name: "Emergency Fund Calculator", url, applicationCategory: "FinanceApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } }, site.faqLd(q)];
  const fields = ITEMS.map(([k, label, v]) => `        <div class="field"><label for="ef-${k}">${label}</label><input type="number" id="ef-${k}" data-ef-item value="${v || ""}" placeholder="0" min="0" step="any" inputmode="decimal"></div>`);
  const rowsOf2 = []; for (let i = 0; i < fields.length; i += 2) rowsOf2.push(`      <div class="field-row">\n${fields.slice(i, i + 2).join("\n")}\n      </div>`);
  const staticRows = [3, 6, 9, 12].map((c) => `<tr><td>${c} months</td><td>${g(total * c)}</td><td>${E.monthsToReach(total * c, 0, 250, 0)} months</td></tr>`).join("\n");
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="/">← All calculators</a>
      <h1 class="page-title">Emergency fund calculator</h1>
      <p class="page-subtitle">How much to keep for a rainy day — a few months of essential spending — and how long it takes to save it.</p>
    </header>

    <main class="tool" id="ef-tool">
      <p class="tool-section-title">Essential spending a month</p>
${rowsOf2.join("\n")}
      <p class="tool-section-title">Your fund</p>
      <div class="field-row">
        <div class="field"><label for="ef-months">Months of cover</label><select id="ef-months"><option value="3" selected>3 months</option><option value="4">4 months</option><option value="6">6 months</option><option value="9">9 months</option><option value="12">12 months</option></select></div>
        <div class="field"><label for="ef-cur">Currency</label><select id="ef-cur"><option value="£" selected>£</option><option value="$">$</option><option value="€">€</option></select></div>
      </div>
      <div class="field-row">
        <div class="field"><label for="ef-saved">Already saved</label><input type="number" id="ef-saved" value="0" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="ef-monthly">You can save a month</label><input type="number" id="ef-monthly" value="250" min="0" step="any" inputmode="decimal"></div>
      </div>
      <div class="field" style="max-width:280px;"><label for="ef-rate">Savings rate, % a year (optional)</label><input type="number" id="ef-rate" placeholder="e.g. 4" min="0" step="any" inputmode="decimal"></div>
      <div class="result-box" aria-live="polite">
        <div class="result-hero"><div class="value" id="ef-target">${g(t3)}</div><div class="label" id="ef-target-label">3 months of essential spending</div></div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row"><span class="r-label">Essentials</span><span class="r-value" id="ef-total">${g(total)} a month</span></div>
          <div class="result-row"><span class="r-label">Still to save</span><span class="r-value" id="ef-gap">${g(t3)}</span></div>
          <div class="result-row highlight"><span class="r-label">Time to get there</span><span class="r-value" id="ef-when">${n3} months</span></div>
        </div>
      </div>
      <p class="tool-section-title" style="margin-top:20px;">More cover</p>
      <div class="table-scroll">
        <div style="min-width:320px;">
          <table class="out-table">
            <thead><tr><th>Cover</th><th>Fund</th><th>Time to save it</th></tr></thead>
            <tbody id="ef-table">
${staticRows}
            </tbody>
          </table>
        </div>
      </div>
      <p class="tool-hint" style="margin-top:12px;">The figures filled in are an example — replace them with your own. Interest, if you add a rate, is added monthly at the annual rate ÷ 12.</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">How much is enough?</p>
      <p class="about-text"><strong>Three months</strong> of essential spending is the common starting point, and covers most surprise bills and a short gap between jobs. <strong>Six months or more</strong> makes sense if you're self-employed, on a variable income, the only earner in your home, or in work that would take a while to replace.</p>
      <p class="about-text"><strong>Count essentials, not everything.</strong> In an emergency you'd stop eating out and pause subscriptions, so the fund only needs to cover what you couldn't cut. That makes the target smaller and quicker to reach than it first seems.</p>
      <p class="about-text"><strong>Finding the money:</strong> the <a href="/50-30-20-budget/">50/30/20 budget calculator</a> sets aside 20% of take-home pay for savings, and the <a href="/52-week-savings-challenge/">52-week challenge</a> builds £1,378 a year in small steps. To save for a set date instead, use the <a href="/savings-goal/">savings goal calculator</a>.</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">Frequently asked questions</p>
${site.faqHtml(q)}    </main>

${related.block(BASE)}
${site.FOOTER}
  </div>
  <script src="/emergency-fund.js"></script>
</body>
</html>
`;
}

/* Hand checks: £6,000 at £500 a month is 12 months; at 0 a month it never arrives; already saved is 0 months */
if (E.monthsToReach(6000, 0, 500, 0) !== 12 || E.monthsToReach(6000, 0, 0, 0) !== Infinity || E.monthsToReach(6000, 6000, 0, 0) !== 0 || E.monthsToReach(6000, 0, 500, 5) !== 12) throw new Error("emergency fund check");
site.write("emergency-fund-calculator", page());
console.log("built " + BASE);
