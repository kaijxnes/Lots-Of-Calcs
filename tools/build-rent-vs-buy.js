#!/usr/bin/env node
/* Builds /rent-vs-buy/ with the default case worked out in the HTML, using
   the same simulate() as the page's calculator (rent-vs-buy.js).

       node tools/build-rent-vs-buy.js */
const site = require("./lib/site.js");
const related = require("./related.js");
const RentVsBuy = require("../rent-vs-buy.js");
const { esc, SITE } = site;

const D = {
  price: 300000, depositPct: 10, rate: 4.5, term: 25, buyingCosts: 7000, sellingPct: 2,
  runningPct: 1, growth: 3, rent: 1200, rentRise: 3, investReturn: 5, years: 10
};

const gbp = (v) => (v < 0 ? "−" : "") + "£" + Math.round(Math.abs(v)).toLocaleString("en-GB");
const ahead = (r) => (r.buyer >= r.renter ? `buying by ${gbp(r.buyer - r.renter)}` : `renting by ${gbp(r.renter - r.buyer)}`);

function field(id, label, value, hint) {
  return `        <div class="field">
          <label for="rvb-${id}">${label}</label>
          <input type="number" id="rvb-${id}" value="${value}" step="any" min="0" inputmode="decimal">${hint ? `\n          <p class="tool-hint" style="margin-top:4px;">${hint}</p>` : ""}
        </div>`;
}

function page() {
  const r = RentVsBuy.simulate(D);
  const url = SITE + "/rent-vs-buy/";
  const title = "Rent vs Buy Calculator — Is It Cheaper to Rent or Buy a Home?";
  const desc = "Compare renting with buying over the years you'd stay: mortgage, deposit, buying and selling costs, upkeep, house price growth, rent rises and what your money could earn instead — with the break-even year.";

  const stays = [2, 3, 5, 7, 10, 15, 20, 25].map((y) => [y, RentVsBuy.simulate(Object.assign({}, D, { years: y }))]);
  const stayRows = stays.map(([y, x]) => [`${y} years`, gbp(x.buyer), gbp(x.renter), x.buyer >= x.renter ? `Buying, by ${gbp(x.buyer - x.renter)}` : `Renting, by ${gbp(x.renter - x.buyer)}`]);
  const growthRows = [0, 2, 3, 5].map((g) => {
    const x = RentVsBuy.simulate(Object.assign({}, D, { growth: g }));
    return [`${g}% a year`, x.buyer >= x.renter ? `Buying, by ${gbp(x.buyer - x.renter)}` : `Renting, by ${gbp(x.renter - x.buyer)}`, x.breakEven ? `Year ${x.breakEven}` : "Not within 10 years"];
  });
  const yearRows = r.rows.map((row) => `<tr><td>${row.year}</td><td>${gbp(row.value)}</td><td>${gbp(row.balance)}</td><td>${gbp(row.buyer)}</td><td>${gbp(row.renter)}</td><td>${gbp(row.buyer - row.renter)}</td></tr>`).join("\n");
  const two = stays.find(([y]) => y === 2)[1];
  const g0 = RentVsBuy.simulate(Object.assign({}, D, { growth: 0 }));

  const q = [
    ["Is it cheaper to rent or buy?",
      `It depends mostly on how long you stay, how fast prices and rents rise, and what your savings could earn instead. With the example figures on this page — a £300,000 home, 10% deposit and £1,200 a month rent — after 10 years you'd be better off ${ahead(r)}, but after 2 years better off ${ahead(two)}: the costs of buying and selling take a few years to earn back.`],
    ["What is the break-even point?",
      "The first year in which, if you sold, you'd be better off for having bought than you would be from renting and investing the difference. Before it, the costs of buying and selling outweigh the equity you've built; after it, buying is ahead. The calculator shows it for your figures."],
    ["What does the comparison include?",
      "For buying: the deposit, buying costs such as stamp duty and legal fees, mortgage payments, running costs (maintenance, insurance and service charges, as a percentage of the home's value) and the cost of selling at the end. For renting: the rent, rising each year. Whichever is cheaper each month has the difference invested, and the renter invests the deposit and buying costs from day one."],
    ["Why does the investment return matter so much?",
      "Because the money a renter doesn't put into a deposit can grow elsewhere. If it could earn more than the home's price rises after costs, renting looks better; if it would sit in a low-interest account, buying usually wins. Try the example with 2% and 7% returns to see how much it moves."],
    ["What if house prices don't rise?",
      `Then the buyer relies only on paying down the mortgage. With 0% price growth and the other example figures, after 10 years it's ${ahead(g0)}. The table above shows the result at different growth rates.`],
    ["Does it include stamp duty?",
      "Put stamp duty and fees in the buying costs box. Stamp duty depends on the price, where you buy and whether you're a first-time buyer, and the rates change, so check the current rates on GOV.UK (or Revenue Scotland and the Welsh Revenue Authority) for your purchase."]
  ];

  const ld = [
    site.webPage(title, desc, url),
    site.breadcrumb([["Home", SITE + "/"], ["Savings & Investing", SITE + "/savings-investing/"], ["Rent vs Buy Calculator", url]]),
    { "@context": "https://schema.org", "@type": "WebApplication", name: "Rent vs Buy Calculator", url: url, applicationCategory: "FinanceApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } },
    site.faqLd(q)
  ];

  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="/">← All calculators</a>
      <h1 class="page-title">Rent vs buy calculator</h1>
      <p class="page-subtitle">What you'd be worth after the years you stay, renting or buying.</p>
    </header>

    <main class="tool" id="rvb-tool">
      <div class="field" style="max-width:280px;">
        <label for="currency">Currency</label>
        <select id="currency">
          <option value="£" selected>£ British Pound</option>
          <option value="$">$ US Dollar</option>
          <option value="€">€ Euro</option>
          <option value="A$">A$ Australian Dollar</option>
          <option value="C$">C$ Canadian Dollar</option>
        </select>
      </div>
      <p class="tool-section-title">Buying</p>
      <div class="field-row">
${field("price", "Home price", D.price)}
${field("depositPct", "Deposit (%)", D.depositPct)}
      </div>
      <div class="field-row">
${field("rate", "Mortgage rate (%)", D.rate)}
${field("term", "Mortgage term (years)", D.term)}
      </div>
      <div class="field-row">
${field("buyingCosts", "Buying costs", D.buyingCosts, "Stamp duty, legal fees, survey")}
${field("sellingPct", "Selling costs (% of price)", D.sellingPct, "Estate agent and legal fees")}
      </div>
      <div class="field-row">
${field("runningPct", "Running costs (% of value a year)", D.runningPct, "Maintenance, insurance, service charge")}
${field("growth", "House prices rise (% a year)", D.growth)}
      </div>
      <p class="tool-section-title">Renting</p>
      <div class="field-row">
${field("rent", "Rent a month", D.rent)}
${field("rentRise", "Rent rises (% a year)", D.rentRise)}
      </div>
      <p class="tool-section-title">Both</p>
      <div class="field-row">
${field("investReturn", "Savings could earn (% a year)", D.investReturn)}
${field("years", "Years you'd stay", D.years)}
      </div>
      <p class="tool-hint" id="rvb-error" role="alert" style="color: var(--bad); display: none;"></p>

      <div class="result-box" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="rvb-verdict">${gbp(Math.abs(r.buyer - r.renter))}</div>
          <div class="label" id="rvb-verdict-label">${r.buyer >= r.renter ? "better off buying" : "better off renting"} after ${D.years} years</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row"><span class="r-label">Worth if you buy</span><span class="r-value" id="rvb-buyer">${gbp(r.buyer)}</span></div>
          <div class="result-row"><span class="r-label">Worth if you rent</span><span class="r-value" id="rvb-renter">${gbp(r.renter)}</span></div>
          <div class="result-row"><span class="r-label">Mortgage payment a month</span><span class="r-value" id="rvb-payment">${gbp(r.payment)}</span></div>
          <div class="result-row highlight"><span class="r-label">Buying pulls ahead</span><span class="r-value" id="rvb-breakeven">${r.breakEven ? "Year " + r.breakEven : "Not within " + D.years + " years"}</span></div>
        </div>
      </div>

      <p class="tool-section-title" style="margin-top:22px;">Year by year</p>
      <div class="table-scroll">
        <div style="min-width:560px;">
          <table class="out-table">
            <thead><tr><th>Year</th><th>Home value</th><th>Mortgage left</th><th>Worth if you buy</th><th>Worth if you rent</th><th>Buying ahead by</th></tr></thead>
            <tbody id="rvb-body">
${yearRows}
            </tbody>
          </table>
        </div>
      </div>
      <p class="tool-hint" style="margin-top:12px;">&ldquo;Worth&rdquo; is what you'd have if you stopped that year: for a buyer, the home's value less the mortgage and the cost of selling, plus anything invested; for a renter, their investments. Before tax on investment gains, in today's prices not adjusted for inflation.</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">How the comparison works</p>
      <p class="about-text">Comparing rent with a mortgage payment on its own misleads in both directions: part of each mortgage payment is building equity rather than being spent, but buying also ties up a deposit, costs thousands to get in and out of, and comes with repairs a landlord would otherwise pay for.</p>
      <p class="about-text">So the calculator follows two people from the same starting point. The buyer puts down the deposit and pays the buying costs; the renter invests that same money instead. Each month, whichever of them has the lower housing costs invests the difference. At the end, the buyer sells (paying selling costs) and both count what they have.</p>
      <p class="about-text"><strong>The example:</strong> a £300,000 home with a 10% deposit and a 4.5% mortgage over 25 years costs ${gbp(r.payment)} a month in repayments, against £1,200 a month in rent. With prices and rents rising 3% a year and savings earning 5%, after 10 years the buyer is worth ${gbp(r.buyer)} and the renter ${gbp(r.renter)} &mdash; ${ahead(r)}${r.breakEven ? `, with buying pulling ahead in year ${r.breakEven}` : ""}.</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">How long you stay changes the answer</p>
      <p class="about-text">The same example, stopping after different numbers of years:</p>
${site.table(["Stay", "Worth if you buy", "Worth if you rent", "Better off"], stayRows, 480)}      <p class="tool-section-title" style="margin-top:22px;">And so do house prices</p>
${site.table(["House prices rise", "After 10 years", "Buying pulls ahead"], growthRows, 400)}    </main>

    <main class="tool">
      <p class="tool-section-title">Frequently asked questions</p>
${site.faqHtml(q)}    </main>

${related.block("/rent-vs-buy/")}
${site.FOOTER}
  </div>
  <script src="/rent-vs-buy.js"></script>
</body>
</html>
`;
}

site.write("rent-vs-buy", page());
const r = RentVsBuy.simulate(D);
console.log("rent-vs-buy: buyer", gbp(r.buyer), "renter", gbp(r.renter), "break-even", r.breakEven, "payment", gbp(r.payment));
