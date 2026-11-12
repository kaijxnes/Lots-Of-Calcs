#!/usr/bin/env node
/* Builds /mortgage-calculator/ with the example worked out in the HTML, using
   the same schedule() as the page's calculator (mortgage-calculator.js).

       node tools/build-mortgage-calculator.js */
const site = require("./lib/site.js");
const related = require("./related.js");
const M = require("../mortgage-calculator.js");
const { SITE } = site;

const D = { price: 300000, deposit: 30000, rate: 4.5, years: 25, type: "repayment" };
const loan = D.price - D.deposit;
const gbp = (v, dp) => "£" + v.toLocaleString("en-GB", { minimumFractionDigits: dp === undefined ? 2 : dp, maximumFractionDigits: dp === undefined ? 2 : dp });
const g0 = (v) => gbp(Math.round(v), 0);

function field(id, label, value, hint) {
  return `        <div class="field">
          <label for="mc-${id}">${label}</label>
          <input type="number" id="mc-${id}" value="${value}" step="any" min="0" inputmode="decimal">${hint ? `\n          <p class="tool-hint" style="margin-top:4px;">${hint}</p>` : ""}
        </div>`;
}

function page() {
  const s = M.schedule({ loan, rate: D.rate, years: D.years, type: D.type });
  const io = M.schedule({ loan, rate: D.rate, years: D.years, type: "interest" });
  const url = SITE + "/mortgage-calculator/";
  const title = "Mortgage Calculator — Monthly Repayments, Interest & Balance by Year";
  const desc = `Work out your monthly mortgage repayment, the total interest and what you'll still owe each year, for repayment or interest-only mortgages. A ${g0(loan)} mortgage at ${D.rate}% over ${D.years} years costs ${gbp(s.monthly)} a month.`;

  const yearRows = s.rows.map((r) => `<tr><td>${r.year}</td><td>${g0(r.interest)}</td><td>${g0(r.capital)}</td><td>${g0(r.balance)}</td></tr>`).join("\n");
  const rateRows = [3, 3.5, 4, 4.5, 5, 5.5, 6, 7].map((rate) => {
    const x = M.schedule({ loan, rate, years: D.years, type: "repayment" });
    const diff = x.monthly - s.monthly;
    return [`${rate}%`, gbp(x.monthly), g0(x.interest), Math.abs(diff) < 0.005 ? "—" : (diff < 0 ? "−" : "+") + gbp(Math.abs(diff)) + " a month"];
  });
  const termRows = [15, 20, 25, 30, 35, 40].map((y) => {
    const x = M.schedule({ loan, rate: D.rate, years: y, type: "repayment" });
    return [`${y} years`, gbp(x.monthly), g0(x.interest), g0(x.total)];
  });
  const half = s.rows.find((r) => r.balance <= loan / 2);
  const firstYear = s.rows[0];

  const q = [
    ["How is a mortgage repayment worked out?",
      `With a repayment mortgage, every monthly payment is the same and covers that month's interest plus some of the loan. The payment is set so the loan is paid off exactly at the end of the term: payment = loan × r × (1 + r)ⁿ ÷ ((1 + r)ⁿ − 1), where r is the annual rate divided by 12 and n is the number of months. On ${g0(loan)} at ${D.rate}% over ${D.years} years that is ${gbp(s.monthly)}.`],
    ["Why do I pay mostly interest at the start?",
      `Interest is charged on what you still owe, which is highest at the start. In the first year of the example, ${g0(firstYear.interest)} of the payments is interest and only ${g0(firstYear.capital)} reduces the loan; you don't owe less than half until year ${half ? half.year : "—"}. Overpaying early has the biggest effect for the same reason.`],
    ["What is the difference between repayment and interest-only?",
      `Interest-only payments cover just the interest, so they are lower — ${gbp(io.monthly)} a month in the example against ${gbp(s.monthly)} — but the whole ${g0(loan)} is still owed at the end and has to be repaid from savings, investments or a sale. Over ${D.years} years interest-only costs ${g0(io.interest)} in interest, against ${g0(s.interest)} on repayment.`],
    ["Does a longer term make a mortgage cheaper?",
      `It lowers the monthly payment but raises the total cost. The example over 35 years would cost ${gbp(M.schedule({ loan, rate: D.rate, years: 35, type: "repayment" }).monthly)} a month but ${g0(M.schedule({ loan, rate: D.rate, years: 35, type: "repayment" }).interest)} in interest, against ${g0(s.interest)} over ${D.years} years.`],
    ["Does this include fees, insurance or property tax?",
      "No — it is the loan alone. Arrangement fees can be added to the loan or paid up front; buildings insurance, and in the US property tax, homeowners insurance and any mortgage insurance, are paid on top. The mortgage affordability calculator includes US property tax and insurance."]
  ];

  const ld = [
    site.webPage(title, desc, url),
    site.breadcrumb([["Home", SITE + "/"], ["Savings & Investing", SITE + "/savings-investing/"], ["Mortgage Calculator", url]]),
    { "@context": "https://schema.org", "@type": "WebApplication", name: "Mortgage Calculator", url: url, applicationCategory: "FinanceApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } },
    site.faqLd(q)
  ];

  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="/">← All calculators</a>
      <h1 class="page-title">Mortgage calculator</h1>
      <p class="page-subtitle">Your monthly repayment, the interest over the term and what you still owe each year.</p>
    </header>

    <main class="tool" id="mc-tool">
      <div class="field-row">
        <div class="field">
          <label for="mc-currency">Currency</label>
          <select id="mc-currency">
            <option value="£" selected>£ British Pound</option>
            <option value="$">$ US Dollar</option>
            <option value="€">€ Euro</option>
            <option value="C$">C$ Canadian Dollar</option>
            <option value="A$">A$ Australian Dollar</option>
          </select>
        </div>
        <div class="field">
          <label for="mc-type">Mortgage type</label>
          <select id="mc-type">
            <option value="repayment" selected>Repayment (capital and interest)</option>
            <option value="interest">Interest only</option>
          </select>
        </div>
      </div>
      <div class="field-row">
${field("price", "Property price", D.price)}
${field("deposit", "Deposit", D.deposit)}
      </div>
      <div class="field-row">
${field("rate", "Interest rate (% a year)", D.rate, "An example — use the rate you've been offered")}
${field("years", "Term (years)", D.years)}
      </div>
      <p class="tool-hint" id="mc-error" role="alert" style="color: var(--bad); display: none;"></p>

      <div class="result-box" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="mc-monthly">${gbp(s.monthly)}</div>
          <div class="label" id="mc-label">a month on a ${g0(loan)} mortgage</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row"><span class="r-label">Loan</span><span class="r-value" id="mc-loan">${g0(loan)}</span></div>
          <div class="result-row"><span class="r-label">Loan to value</span><span class="r-value" id="mc-ltv">${Math.round((loan / D.price) * 100)}%</span></div>
          <div class="result-row"><span class="r-label">Total interest</span><span class="r-value" id="mc-interest">${g0(s.interest)}</span></div>
          <div class="result-row highlight"><span class="r-label">Total repaid</span><span class="r-value" id="mc-total">${g0(s.total)}</span></div>
          <div class="result-row"><span class="r-label">Still owed at the end</span><span class="r-value" id="mc-end">${g0(s.balance)}</span></div>
        </div>
      </div>

      <p class="tool-section-title" style="margin-top:22px;">Year by year</p>
      <div class="table-scroll">
        <div style="min-width:420px;">
          <table class="out-table">
            <thead><tr><th>Year</th><th>Interest paid</th><th>Loan repaid</th><th>Still owed</th></tr></thead>
            <tbody id="mc-body">
${yearRows}
            </tbody>
          </table>
        </div>
      </div>
    </main>

    <main class="tool">
      <p class="tool-section-title">How the rate changes the payment</p>
      <p class="about-text">The same ${g0(loan)} over ${D.years} years at different rates:</p>
${site.table(["Rate", "Monthly payment", "Total interest", "Against " + D.rate + "%"], rateRows, 440)}      <p class="tool-section-title" style="margin-top:22px;">And how the term changes it</p>
${site.table(["Term", "Monthly payment", "Total interest", "Total repaid"], termRows, 440)}      <p class="tool-hint" style="margin-top:12px;">Monthly interest is the annual rate divided by 12. Lenders' figures can differ by a few pence or cents depending on how they charge interest. For a particular loan size see <a href="/mortgage/">mortgage payments by amount</a> (<a href="/mortgage/us/">US</a>), and to see what paying extra saves, the <a href="/mortgage-overpayment/">overpayment calculator</a>.</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">Frequently asked questions</p>
${site.faqHtml(q)}    </main>

${related.block("/mortgage-calculator/")}
${site.FOOTER}
  </div>
  <script src="/mortgage-calculator.js"></script>
</body>
</html>
`;
}

site.write("mortgage-calculator", page());
console.log("built /mortgage-calculator/");
