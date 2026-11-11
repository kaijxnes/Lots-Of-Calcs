#!/usr/bin/env node
/* Builds /mortgage-affordability/ with the default cases worked out in the
   HTML, using the same functions the calculator runs (mortgage-affordability.js)
   and, for take-home pay, tax-engine.js on the UK registry.

       node tools/build-affordability.js */
const site = require("./lib/site.js");
const related = require("./related.js");
const registry = require("./tax/registry.js");
const TaxEngine = require("../tax-engine.js");
const A = require("../mortgage-affordability.js");
const { esc, SITE } = site;

const UK = { income: 45000, partner: 0, multiple: 4.5, deposit: 25000, debts: 0, rate: 4.5, years: 25, stress: 3 };
const US = { income: 90000, debts: 400, down: 60000, rate: 6.5, years: 30, taxPct: 1.1, insurance: 1800, hoa: 0, front: 28, back: 36 };

const gbp = (v) => "£" + Math.round(v).toLocaleString("en-GB");
const usd = (v) => "$" + Math.round(v).toLocaleString("en-US");

function field(id, label, value, hint) {
  return `          <div class="field">
            <label for="${id}">${label}</label>
            <input type="number" id="${id}" value="${value}" step="any" min="0" inputmode="decimal">${hint ? `\n            <p class="tool-hint" style="margin-top:4px;">${hint}</p>` : ""}
          </div>`;
}

function page() {
  const chain = registry.loadChain("gb");
  const net = (g) => (g > 0 ? TaxEngine.compute(chain, g).perMonth : 0);
  const u = A.uk(UK);
  const ukNet = net(UK.income);
  const s = A.us(US);
  const url = SITE + "/mortgage-affordability/";
  const title = "Mortgage Affordability Calculator — How Much Can I Borrow?";
  const desc = "How much you could borrow for a mortgage and what home it buys: UK income multiples with your payment against take-home pay, and US 28/36 lender guidelines including property tax and insurance.";

  const ukRows = [25000, 30000, 35000, 40000, 45000, 50000, 60000, 70000, 80000, 100000].map((g) => {
    const r = A.uk({ ...UK, income: g, deposit: 0 });
    const lo = A.uk({ ...UK, income: g, multiple: 4, deposit: 0 });
    return [gbp(g), `${gbp(lo.loan)} – ${gbp(r.loan)}`, gbp(r.payment), Math.round((r.payment / net(g)) * 100) + "%"];
  });
  const usRows = [50000, 60000, 75000, 90000, 100000, 125000, 150000, 200000].map((g) => {
    // 20% down: the down payment depends on the price it buys, so iterate to the fixed point
    let p = A.us({ ...US, income: g, debts: 0, down: 0 }).price;
    for (let i = 0; i < 60; i++) p = A.us({ ...US, income: g, debts: 0, down: 0.2 * p }).price;
    return [usd(g), usd(p), usd(A.us({ ...US, income: g, debts: 0, down: 0.2 * p }).piti)];
  });

  const q = [
    ["How much can I borrow for a mortgage in the UK?",
      `Most lenders lend around 4 to 4.5 times your yearly income before tax, or your combined income for a joint mortgage, and some go to 5 or 5.5 times for higher earners or certain professions. On a £45,000 salary that is roughly £180,000 to £202,500. Lenders then check your spending, debts and whether you could still pay if rates rose, so the real figure can be lower.`],
    ["How much mortgage can I get on £30,000?",
      `About £120,000 to £135,000 at 4 to 4.5 times income. With a 10% deposit that buys a home of up to about £150,000. At 4.5% over 25 years, £135,000 costs about ${gbp(A.payment(135000, 4.5, 25))} a month.`],
    ["What is the 28/36 rule?",
      "A guideline US lenders use: housing costs (mortgage principal and interest, property tax, homeowners insurance and any HOA fee) should be no more than 28% of your gross monthly income, and all your debt payments including housing no more than 36%. Many lenders allow more, especially for FHA and VA loans, but the rule is a sensible ceiling for a budget."],
    ["How much house can I afford on $100,000 a year?",
      `Using the 28/36 rule with 20% down at 6.5% over 30 years, 1.1% property tax and $1,800 a year insurance, about ${usRows.find((r) => r[0] === usd(100000))[1]} with no other debts. Other monthly debts, a higher rate or higher property tax all lower it.`],
    ["Why does the calculator show the payment as a share of take-home pay?",
      "Because income multiples are based on pay before tax, but you pay the mortgage out of what reaches your account. The take-home figure comes from this site's UK tax calculator, so a payment that looks fine as a multiple can be checked against what you'd actually have left."],
    ["What is a stress test?",
      "Lenders check that you could still afford the mortgage if interest rates rose, usually by testing the payment at a higher rate than the one you're offered. The calculator shows the payment 3 percentage points above your rate so you can see the cushion you'd need."]
  ];

  const ld = [
    site.webPage(title, desc, url),
    site.breadcrumb([["Home", SITE + "/"], ["Savings & Investing", SITE + "/savings-investing/"], ["Mortgage Affordability Calculator", url]]),
    { "@context": "https://schema.org", "@type": "WebApplication", name: "Mortgage Affordability Calculator", url: url, applicationCategory: "FinanceApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } },
    site.faqLd(q)
  ];

  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="/">← All calculators</a>
      <h1 class="page-title">Mortgage affordability calculator</h1>
      <p class="page-subtitle">How much you could borrow, what home it buys, and what it costs each month.</p>
    </header>

    <main class="tool" id="afford-tool">
      <div class="tabs" role="tablist">
        <button class="tab active" data-tab="uk">UK</button>
        <button class="tab" data-tab="us">US</button>
      </div>

      <div class="tab-panel active" data-panel="uk">
        <div class="field-row">
${field("uk-income", "Your salary (£ a year)", UK.income)}
${field("uk-partner", "Partner's salary (£ a year)", UK.partner, "Leave at 0 for a single mortgage")}
        </div>
        <div class="field-row">
${field("uk-multiple", "Income multiple", UK.multiple, "Usually 4 to 4.5")}
${field("uk-deposit", "Deposit (£)", UK.deposit)}
        </div>
        <div class="field-row">
${field("uk-debts", "Other monthly commitments (£)", UK.debts, "Loans, car finance, credit cards")}
${field("uk-rate", "Mortgage rate (%)", UK.rate)}
        </div>
        <div class="field" style="max-width:280px;">
          <label for="uk-years">Term (years)</label>
          <input type="number" id="uk-years" value="${UK.years}" step="1" min="1" inputmode="decimal">
        </div>
        <div class="result-box" aria-live="polite">
          <div class="result-hero">
            <div class="value" id="uk-price">${gbp(u.price)}</div>
            <div class="label">Home you could buy</div>
          </div>
          <hr class="divider">
          <div class="result-grid">
            <div class="result-row"><span class="r-label">You could borrow</span><span class="r-value" id="uk-loan">${gbp(u.loan)}</span></div>
            <div class="result-row"><span class="r-label">Loan to value</span><span class="r-value" id="uk-ltv">${Math.round(u.ltv)}%</span></div>
            <div class="result-row highlight"><span class="r-label">Monthly repayment</span><span class="r-value" id="uk-payment">${gbp(u.payment)}</span></div>
            <div class="result-row"><span class="r-label">Of your take-home pay</span><span class="r-value" id="uk-share">${Math.round((u.payment / ukNet) * 100)}% of ${gbp(ukNet)}</span></div>
            <div class="result-row"><span class="r-label">If rates rose 3 points</span><span class="r-value" id="uk-stressed">${gbp(u.stressed)}</span></div>
          </div>
        </div>
      </div>

      <div class="tab-panel" data-panel="us">
        <div class="field-row">
${field("us-income", "Gross income ($ a year)", US.income, "Household, before tax")}
${field("us-debts", "Other monthly debts ($)", US.debts, "Car, student loan, card minimums")}
        </div>
        <div class="field-row">
${field("us-down", "Down payment ($)", US.down)}
${field("us-rate", "Mortgage rate (%)", US.rate)}
        </div>
        <div class="field-row">
${field("us-years", "Term (years)", US.years)}
${field("us-taxpct", "Property tax (% of value a year)", US.taxPct, "Varies widely by state and county")}
        </div>
        <div class="field-row">
${field("us-insurance", "Homeowners insurance ($ a year)", US.insurance)}
${field("us-hoa", "HOA fees ($ a month)", US.hoa)}
        </div>
        <div class="result-box" aria-live="polite">
          <div class="result-hero">
            <div class="value" id="us-price">${usd(s.price)}</div>
            <div class="label">Home you could afford (28/36 rule)</div>
          </div>
          <hr class="divider">
          <div class="result-grid">
            <div class="result-row"><span class="r-label">Loan</span><span class="r-value" id="us-loan">${usd(s.loan)}</span></div>
            <div class="result-row"><span class="r-label">Loan to value</span><span class="r-value" id="us-ltv">${Math.round(s.ltv)}%</span></div>
            <div class="result-row highlight"><span class="r-label">Monthly housing cost</span><span class="r-value" id="us-piti">${usd(s.piti)}</span></div>
            <div class="result-row"><span class="r-label">Principal and interest</span><span class="r-value" id="us-pi">${usd(s.pi)}</span></div>
            <div class="result-row"><span class="r-label">Property tax</span><span class="r-value" id="us-tax">${usd(s.tax)}</span></div>
            <div class="result-row"><span class="r-label">Insurance and HOA</span><span class="r-value" id="us-other">${usd(s.other)}</span></div>
          </div>
        </div>
      </div>
      <p class="tool-hint" style="margin-top:12px;">Rules of thumb, not a lender's decision: each lender sets its own limits and checks your credit history and spending.</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">How much can I borrow on my salary? (UK)</p>
      <p class="about-text">At 4 to 4.5 times a single salary, with the repayment at 4.5% over 25 years on the higher figure and its share of take-home pay after income tax and National Insurance:</p>
${site.table(["Salary", "Borrowing (4x – 4.5x)", "Repayment a month", "Of take-home pay"], ukRows, 480)}      <p class="tool-hint" style="margin-top:12px;">Take-home pay from the <a href="/salary/uk/">UK salary calculator</a> for 2026/27, with no pension or student loan. Add your deposit to the borrowing for the price of home it buys.</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">How much house can I afford? (US)</p>
      <p class="about-text">The home price that fits the 28/36 rule with 20% down, at 6.5% over 30 years, 1.1% property tax and $1,800 a year insurance, with no other debts:</p>
${site.table(["Household income", "Home price", "Monthly housing cost"], usRows, 400)}    </main>

    <main class="tool">
      <p class="tool-section-title">How lenders decide</p>
      <p class="about-text"><strong>In the UK</strong>, lenders start from a multiple of income &mdash; usually 4 to 4.5 times, and up to 5 or 5.5 times for some higher earners &mdash; then run an affordability check on your spending, debts and dependants, and test whether you could still pay at a higher rate. The deposit sets your loan to value (LTV): the bigger the deposit, the lower the LTV and usually the better the rate, with steps at 60%, 75%, 85% and 90%.</p>
      <p class="about-text"><strong>In the US</strong>, lenders look at your debt-to-income ratio. The traditional guideline keeps housing costs to 28% of gross monthly income and all debts to 36%; many loan programmes allow higher. Putting down less than 20% usually means paying private mortgage insurance on top.</p>
      <p class="about-text">For the cost of a particular loan size, see <a href="/mortgage/">mortgage payments by amount</a>; to compare buying with carrying on renting, the <a href="/rent-vs-buy/">rent vs buy calculator</a>.</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">Frequently asked questions</p>
${site.faqHtml(q)}    </main>

${related.block("/mortgage-affordability/")}
${site.FOOTER}
  </div>
  <script src="/tax-engine.js"></script>
  <script src="/mortgage-affordability.js"></script>
</body>
</html>
`;
}

site.write("mortgage-affordability", page());
console.log("built /mortgage-affordability/");
