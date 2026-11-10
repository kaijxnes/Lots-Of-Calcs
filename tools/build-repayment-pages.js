#!/usr/bin/env node
/* Mortgage and loan repayment pages by amount:

       /mortgage/200000/      £200,000 mortgage monthly payments
       /mortgage/us/300000/   $300,000 mortgage payment
       /loan/10000/           £10,000 loan repayments

       node tools/build-repayment-pages.js

   Each page answers "what does borrowing X cost a month" in the HTML itself:
   a grid of monthly payments across common rates and terms, the interest paid
   over the term, and a calculator. Nothing here depends on today's rates —
   the tables cover a spread of them and the calculator's starting rate is
   labelled as an example — so the pages don't go stale when rates move.

   Payments use the standard repayment formula on a monthly rate of the annual
   rate divided by twelve, as the site's loan and overpayment calculators do. */
const site = require("./lib/site.js");
const { esc, card, table, neighbours, SITE } = site;

function range(from, to, step) {
  const out = [];
  for (let v = from; v <= to + 1e-9; v += step) out.push(Math.round(v * 100) / 100);
  return out;
}

const MORTGAGE = {
  GBP: {
    base: "/mortgage/", symbol: "£", country: "UK",
    amounts: range(50000, 500000, 25000).concat([550000, 600000, 650000, 700000, 750000, 800000, 900000, 1000000]),
    terms: [15, 20, 25, 30, 35],
    rates: range(3, 7.5, 0.5),
    example: { rate: 4.5, years: 25 }
  },
  USD: {
    base: "/mortgage/us/", symbol: "$", country: "US",
    amounts: range(100000, 800000, 50000).concat([900000, 1000000]),
    terms: [10, 15, 20, 30],
    rates: range(4, 8, 0.5),
    example: { rate: 6.5, years: 30 }
  }
};

const LOAN = {
  base: "/loan/", symbol: "£",
  amounts: [1000, 2000, 3000, 4000, 5000, 7500, 10000, 12000, 15000, 20000, 25000, 30000, 40000, 50000],
  terms: [1, 2, 3, 4, 5, 7],
  rates: [5, 7, 9, 12, 15, 20, 25, 30],
  example: { rate: 7, years: 3 }
};

// ---------------------------------------------------------------- arithmetic

function payment(amount, annualRate, years) {
  const n = Math.round(years * 12);
  const r = annualRate / 100 / 12;
  if (r === 0) return amount / n;
  const f = Math.pow(1 + r, n);
  return (amount * r * f) / (f - 1);
}

function money(symbol, v, whole) {
  const dp = whole ? 0 : 2;
  return symbol + (Math.round(v * Math.pow(10, dp)) / Math.pow(10, dp)).toLocaleString("en-GB", { minimumFractionDigits: dp, maximumFractionDigits: dp });
}

function pct(r) {
  return (Number.isInteger(r) ? r : r.toFixed(1)) + "%";
}

// ---------------------------------------------------------------- shared blocks

function tool(cfg, amount, withInterestOnly, note) {
  const ex = cfg.example;
  const pay = payment(amount, ex.rate, ex.years);
  const n = ex.years * 12;
  const m = (v) => money(cfg.symbol, v);
  return `    <main class="tool" id="repay-tool" data-symbol="${cfg.symbol}">
      <div class="result-box" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="repay-payment">${m(pay)}</div>
          <div class="label">Monthly repayment</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
${withInterestOnly ? `          <div class="result-row"><span class="r-label">Interest-only, a month</span><span class="r-value" id="repay-interest-only">${m((amount * ex.rate) / 100 / 12)}</span></div>\n` : ""}          <div class="result-row"><span class="r-label">Total interest</span><span class="r-value" id="repay-interest">${m(pay * n - amount)}</span></div>
          <div class="result-row highlight"><span class="r-label">Total repaid</span><span class="r-value" id="repay-total">${m(pay * n)}</span></div>
        </div>
      </div>
      <div class="field-row-3 field-row" style="margin-top:18px;">
        <div class="field">
          <label for="repay-amount">Amount (${cfg.symbol})</label>
          <input type="number" id="repay-amount" value="${amount}" step="any" min="0">
        </div>
        <div class="field">
          <label for="repay-rate">Interest rate (%)</label>
          <input type="number" id="repay-rate" value="${ex.rate}" step="any" min="0">
        </div>
        <div class="field">
          <label for="repay-years">Term (years)</label>
          <input type="number" id="repay-years" value="${ex.years}" step="any" min="0">
        </div>
      </div>
      <p class="tool-hint" id="repay-error" role="alert" style="color: var(--bad); display: none;"></p>
      <p class="tool-hint">${note}</p>
    </main>
`;
}

/* Rates down the side, terms across the top */
function grid(cfg, amount, f, highlight) {
  const rows = cfg.rates.map((r) => [pct(r)].concat(cfg.terms.map((t) => {
    const v = esc(f(r, t));
    return highlight && highlight.rate === r && highlight.years === t ? `<strong>${v}</strong>` : v;
  })));
  return table(["Rate"].concat(cfg.terms.map((t) => `${t} ${t === 1 ? "year" : "years"}`)), rows, 120 + cfg.terms.length * 90);
}

function page({ title, desc, url, crumbs, faq, body, script }) {
  const ld = [site.webPage(title, desc, url), site.breadcrumb(crumbs), site.faqLd(faq)];
  return site.head({ title, desc, url, ld }) + body + `    <main class="tool">
      <p class="tool-section-title">Frequently asked questions</p>
${site.faqHtml(faq)}    </main>
` + script + `
${site.FOOTER}
  </div>
  <script src="/repayment-page.js"></script>
</body>
</html>
`;
}

// ---------------------------------------------------------------- mortgage page

function mortgagePage(cfg, amount) {
  const uk = cfg.country === "UK";
  const s = cfg.symbol;
  const a0 = money(s, amount, true);
  const ex = cfg.example;
  const exPay = payment(amount, ex.rate, ex.years);
  const exInterest = exPay * ex.years * 12 - amount;
  const plusOne = payment(amount, ex.rate + 1, ex.years) - exPay;
  const shorter = cfg.terms.filter((t) => t < ex.years).pop();
  const shortPay = payment(amount, ex.rate, shorter);
  const shortInterest = shortPay * shorter * 12 - amount;
  const url = SITE + cfg.base + amount + "/";
  const loc = cfg.base + amount + "/";

  const title = uk ? `${a0} Mortgage Monthly Payments — Repayments by Rate & Term`
    : `${a0} Mortgage Payment — Monthly Payment by Rate & Term`;
  const desc = `Monthly payments on a ${a0} mortgage at rates from ${pct(cfg.rates[0])} to ${pct(cfg.rates[cfg.rates.length - 1])}, over ${cfg.terms[0]} to ${cfg.terms[cfg.terms.length - 1]} years. At ${pct(ex.rate)} over ${ex.years} years it is ${money(s, exPay)} a month.`;

  /* Affordability rules of thumb, stated as such */
  let afford;
  if (uk) {
    const lo = amount / 4.5, hi = amount / 4;
    afford = `<p class="about-text">Most UK lenders will lend up to around 4 to 4.5 times your annual income, sometimes more for higher earners. On that rule of thumb, borrowing ${esc(a0)} usually needs a household income of roughly <strong>${esc(money(s, lo, true))} to ${esc(money(s, hi, true))}</strong> &mdash; and lenders also check your outgoings and how the payment would look if rates rose.</p>
      <p class="about-text">With a 10% deposit, ${esc(a0)} buys a home costing about ${esc(money(s, amount / 0.9, true))}; with 25% down, about ${esc(money(s, amount / 0.75, true))}. The <a href="/salary/uk/">salary after tax pages</a> show what an income leaves you each month.</p>`;
  } else {
    const income = (exPay / 0.28) * 12;
    afford = `<p class="about-text">A common lender guideline keeps housing costs to about 28% of gross monthly income. Principal and interest of ${esc(money(s, exPay))} at ${pct(ex.rate)} over ${ex.years} years would need an income of about <strong>${esc(money(s, income, true))}</strong> a year &mdash; more once property tax, insurance and any HOA fees are added, which this payment doesn't include.</p>
      <p class="about-text">With 20% down, a ${esc(a0)} loan buys a home costing about ${esc(money(s, amount / 0.8, true))}; with 10% down, about ${esc(money(s, amount / 0.9, true))}, though under 20% down usually means paying mortgage insurance too.</p>`;
  }

  const faq = [
    [`What is the monthly payment on a ${a0} mortgage?`,
      `At ${pct(ex.rate)} over ${ex.years} years, ${money(s, exPay)} a month on a repayment basis. It ranges from ${money(s, payment(amount, cfg.rates[0], cfg.terms[cfg.terms.length - 1]))} (${pct(cfg.rates[0])} over ${cfg.terms[cfg.terms.length - 1]} years) to ${money(s, payment(amount, cfg.rates[cfg.rates.length - 1], cfg.terms[0]))} (${pct(cfg.rates[cfg.rates.length - 1])} over ${cfg.terms[0]} years); the table on this page has every combination in between.`],
    [`How much interest will I pay on a ${a0} mortgage?`,
      `At ${pct(ex.rate)} over ${ex.years} years, ${money(s, exInterest)} in interest, on top of the ${a0} borrowed. Over ${shorter} years at the same rate it would be ${money(s, shortInterest)} — ${money(s, exInterest - shortInterest)} less, for ${money(s, shortPay - exPay)} more a month.`],
    [`How much does a 1% rate rise add to a ${a0} mortgage?`,
      `Going from ${pct(ex.rate)} to ${pct(ex.rate + 1)} over ${ex.years} years adds about ${money(s, plusOne)} a month, or ${money(s, plusOne * 12)} a year.`],
    [`What income do I need for a ${a0} mortgage?`,
      uk ? `As a rule of thumb, lenders lend around 4 to 4.5 times income, so roughly ${money(s, amount / 4.5, true)} to ${money(s, amount / 4, true)} a year. Each lender sets its own limits and checks your spending too.`
        : `Using the common guideline that housing costs stay under about 28% of gross income, around ${money(s, (exPay / 0.28) * 12, true)} a year at ${pct(ex.rate)} over ${ex.years} years, before property tax and insurance. Lenders also look at your other debts.`],
    uk ? [`What would an interest-only ${a0} mortgage cost?`,
      `At ${pct(ex.rate)}, ${money(s, (amount * ex.rate) / 100 / 12)} a month — just the interest, so after ${ex.years} years you still owe the full ${a0} and need a plan to repay it, such as savings, investments or selling the property.`]
      : [`Does this payment include taxes and insurance?`,
        `No. It is principal and interest only. A monthly mortgage bill usually also collects property tax and homeowners insurance into escrow, plus mortgage insurance if you put down less than 20%, so expect the total to be higher.`],
    [`Can I pay off a ${a0} mortgage faster?`,
      `Yes — overpaying each month or paying a lump sum cuts the interest and the term. The mortgage overpayment calculator shows how much you'd save; check first whether your deal charges for overpaying more than a set amount.`]
  ];

  const others = neighbours(cfg.amounts, amount, 4).map((x) => card(cfg.base + x + "/", "🏡", `${money(s, x, true)} mortgage`, `${money(s, payment(x, ex.rate, ex.years))} a month at ${pct(ex.rate)} over ${ex.years} years.`)).join("");
  const hubTitle = uk ? "All mortgage amounts" : "All US mortgage amounts";

  const body = `    <header class="site-header">
      <a class="back-link" href="${cfg.base}">← Mortgage payments by amount</a>
      <h1 class="page-title">${esc(a0)} mortgage: monthly payments</h1>
      <p class="page-subtitle">Repayments on ${esc(a0)} at every common rate and term${uk ? ", with the interest-only cost" : " — principal and interest"}.</p>
    </header>

${tool(cfg, amount, uk, `Starts on an example of ${pct(ex.rate)} over ${ex.years} years, not a quoted rate &mdash; put in the rate and term from your own offer.`)}
    <main class="tool">
      <p class="about-text">A <strong>${esc(a0)}</strong> repayment mortgage at ${pct(ex.rate)} over ${ex.years} years costs <strong>${esc(money(s, exPay))}</strong> a month, and ${esc(money(s, exInterest))} in interest over the whole term. Each extra percentage point on the rate adds about ${esc(money(s, plusOne))} a month.</p>
      <p class="tool-section-title" style="margin-top:22px;">Monthly repayments on ${esc(a0)}</p>
${grid(cfg, amount, (r, t) => money(s, payment(amount, r, t)), ex)}      <p class="tool-section-title" style="margin-top:22px;">Total interest over the term</p>
${grid(cfg, amount, (r, t) => money(s, payment(amount, r, t) * t * 12 - amount, true), ex)}      <p class="tool-hint" style="margin-top:12px;">Assumes the same rate for the whole term. In practice ${uk ? "most UK deals fix the rate for two to five years, then move to the lender's variable rate unless you remortgage" : "an adjustable-rate mortgage changes after its fixed period; a fixed-rate loan doesn't"}.</p>
${uk ? `      <p class="tool-section-title" style="margin-top:22px;">Interest-only</p>
${table(["Rate", "Interest-only a month", "Repayment over 25 years"], cfg.rates.map((r) => [pct(r), esc(money(s, (amount * r) / 100 / 12)), esc(money(s, payment(amount, r, 25)))]), 360)}` : ""}    </main>

    <main class="tool">
      <p class="tool-section-title">Can you afford it?</p>
      ${afford}
    </main>

    <main class="tool">
      <p class="tool-section-title">How the payment is worked out</p>
      <p class="about-text">A repayment mortgage charges interest each month on what you still owe, and the fixed monthly payment covers that interest plus a slice of the loan. Early on most of the payment is interest; by the end it is almost all capital. The payment is <strong>P &times; r &times; (1 + r)<sup>n</sup> &divide; ((1 + r)<sup>n</sup> &minus; 1)</strong>, where P is the amount borrowed, r is the annual rate divided by 12 and n is the number of monthly payments.</p>
      <p class="about-text">A longer term lowers the monthly payment but means paying interest for longer, so the total cost rises: compare the ${shorter}- and ${ex.years}-year columns in the interest table above.</p>
    </main>
`;
  const script = `
    <div class="hub-group-title" style="margin-top:28px;">Other mortgage amounts</div>
    <div class="hub-grid">
${others}${card(cfg.base, "📋", hubTitle, "Monthly payments for every amount, on one page.")}${card("/mortgage-overpayment/", "💷", "Mortgage overpayment calculator", "See the interest and years you'd save by overpaying.")}    </div>
`;
  return [loc, page({
    title, desc, url, faq, body, script,
    crumbs: [["Home", SITE + "/"], ["Mortgage payments", SITE + "/mortgage/"]].concat(uk ? [] : [["United States", SITE + cfg.base]]).concat([[`${a0} mortgage`, url]])
  })];
}

// ---------------------------------------------------------------- loan page

function loanPage(cfg, amount) {
  const s = cfg.symbol;
  const a0 = money(s, amount, true);
  const ex = cfg.example;
  const exPay = payment(amount, ex.rate, ex.years);
  const exInterest = exPay * ex.years * 12 - amount;
  const url = SITE + cfg.base + amount + "/";
  const loc = cfg.base + amount + "/";
  const longer = 5;
  const longPay = payment(amount, ex.rate, longer);
  const longInterest = longPay * longer * 12 - amount;
  const high = 20;
  const highPay = payment(amount, high, ex.years);

  const title = `${a0} Loan Repayments — Monthly Cost by APR & Term`;
  const desc = `What a ${a0} loan costs each month at APRs from ${cfg.rates[0]}% to ${cfg.rates[cfg.rates.length - 1]}%, over 1 to 7 years. At ${ex.rate}% over ${ex.years} years it is ${money(s, exPay)} a month.`;

  const faq = [
    [`What are the monthly repayments on a ${a0} loan?`,
      `At ${ex.rate}% APR over ${ex.years} years, ${money(s, exPay)} a month, ${money(s, exPay * ex.years * 12)} in total. At ${high}% APR the same loan costs ${money(s, highPay)} a month. The table on this page covers every common rate and term.`],
    [`How much interest will I pay on ${a0}?`,
      `At ${ex.rate}% over ${ex.years} years, ${money(s, exInterest)}. Stretching it to ${longer} years cuts the monthly payment to ${money(s, longPay)} but raises the interest to ${money(s, longInterest)}.`],
    [`Is a longer loan term better?`,
      `It makes each payment smaller but costs more overall, because you pay interest for longer. Choose the shortest term whose payment you can comfortably afford — and check whether the lender charges for paying off early.`],
    [`What APR will I get on a ${a0} loan?`,
      `It depends on your credit history and the lender. The advertised representative APR only has to be offered to at least 51% of successful applicants, so others can be offered more. Loans of a few thousand pounds often carry higher rates than loans of £7,500 to £25,000.`],
    [`How are these repayments worked out?`,
      `With the standard repayment formula, charging the APR divided by twelve each month on what is still owed. A lender's quote can differ by a little, since APR also includes any fees and lenders round differently.`],
    [`Should I borrow ${a0} or use savings?`,
      `If you have savings earning less than the loan's APR, using them usually costs less overall. Keep an emergency fund first, though — a loan can be cheaper than having nothing to fall back on.`]
  ];

  const others = neighbours(cfg.amounts, amount, 4).map((x) => card(cfg.base + x + "/", "🏦", `${money(s, x, true)} loan`, `${money(s, payment(x, ex.rate, ex.years))} a month at ${ex.rate}% over ${ex.years} years.`)).join("");

  const body = `    <header class="site-header">
      <a class="back-link" href="${cfg.base}">← Loan repayments by amount</a>
      <h1 class="page-title">${esc(a0)} loan repayments</h1>
      <p class="page-subtitle">What borrowing ${esc(a0)} costs a month, and in total, at every common APR and term.</p>
    </header>

${tool(cfg, amount, false, `Starts on an example of ${ex.rate}% over ${ex.years} years &mdash; put in the APR and term you've been offered.`)}
    <main class="tool">
      <p class="about-text">Borrowing <strong>${esc(a0)}</strong> at ${ex.rate}% APR over ${ex.years} years costs <strong>${esc(money(s, exPay))}</strong> a month, ${esc(money(s, exInterest))} in interest overall. At ${high}% APR, a rate more typical for smaller loans or a weaker credit record, the monthly payment would be ${esc(money(s, highPay))}.</p>
      <p class="tool-section-title" style="margin-top:22px;">Monthly repayments on ${esc(a0)}</p>
${grid(cfg, amount, (r, t) => money(s, payment(amount, r, t)), ex)}      <p class="tool-section-title" style="margin-top:22px;">Total interest</p>
${grid(cfg, amount, (r, t) => money(s, payment(amount, r, t) * t * 12 - amount, true), ex)}    </main>

    <main class="tool">
      <p class="tool-section-title">How the repayment is worked out</p>
      <p class="about-text">Each month the lender charges interest on what you still owe, and your fixed payment covers that interest plus part of the loan, so the balance falls faster towards the end. The payment is <strong>P &times; r &times; (1 + r)<sup>n</sup> &divide; ((1 + r)<sup>n</sup> &minus; 1)</strong>, with P the amount borrowed, r the APR divided by 12 and n the number of months.</p>
      <p class="about-text">The <a href="/loan-repayment/">loan repayment calculator</a> shows the balance year by year, and the <a href="/debt-snowball-vs-avalanche/">debt snowball vs avalanche calculator</a> compares ways of paying off several debts.</p>
    </main>
`;
  const script = `
    <div class="hub-group-title" style="margin-top:28px;">Other loan amounts</div>
    <div class="hub-grid">
${others}${card(cfg.base, "📋", "All loan amounts", "Monthly repayments for every amount, on one page.")}${card("/loan-repayment/", "🏦", "Loan repayment calculator", "Any amount, APR and term, with a year-by-year breakdown.")}    </div>
`;
  return [loc, page({
    title, desc, url, faq, body, script,
    crumbs: [["Home", SITE + "/"], ["Loan repayments", SITE + cfg.base], [`${a0} loan`, url]]
  })];
}

// ---------------------------------------------------------------- hubs

function hub({ loc, title, desc, h1, sub, sections, intro }) {
  const url = SITE + loc;
  const ld = [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], [h1, url]])];
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="/">← All calculators</a>
      <h1 class="page-title">${esc(h1)}</h1>
      <p class="page-subtitle">${esc(sub)}</p>
    </header>

    <main class="tool">
      <p class="about-text">${intro}</p>
${sections}    </main>

${site.FOOTER}
  </div>
</body>
</html>
`;
}

function amountTable(cfg, kind) {
  const ex = cfg.example;
  const rows = cfg.amounts.map((a) => {
    const pay = payment(a, ex.rate, ex.years);
    return [`<a href="${cfg.base}${a}/">${esc(money(cfg.symbol, a, true))}</a>`, esc(money(cfg.symbol, pay)), esc(money(cfg.symbol, pay * ex.years * 12 - a, true))];
  });
  return table([kind, `A month at ${pct(ex.rate)}, ${ex.years} years`, "Total interest"], rows, 420);
}

function mortgageHub() {
  const uk = MORTGAGE.GBP, us = MORTGAGE.USD;
  return hub({
    loc: "/mortgage/",
    title: "Mortgage Payments by Amount — Monthly Repayment Tables",
    desc: "Monthly payments on every common mortgage size, from £50,000 to £1 million and $100,000 to $1 million, at a range of rates and terms.",
    h1: "Mortgage payments by amount",
    sub: "Monthly repayments and total interest for each common mortgage size.",
    intro: `Pick an amount for its full table of payments at rates from ${pct(uk.rates[0])} to ${pct(uk.rates[uk.rates.length - 1])} and terms of ${uk.terms[0]} to ${uk.terms[uk.terms.length - 1]} years. The summary below uses example rates, not quoted ones. To see what overpaying would save, use the <a href="/mortgage-overpayment/">mortgage overpayment calculator</a>.`,
    sections: `      <p class="tool-section-title" style="margin-top:22px;">UK mortgages</p>
${amountTable(uk, "Mortgage")}      <p class="tool-section-title" style="margin-top:22px;">US mortgages</p>
${amountTable(us, "Mortgage")}      <p class="tool-hint" style="margin-top:12px;">US payments are principal and interest only, before property tax, insurance and any mortgage insurance.</p>
`
  });
}

function usMortgageHub() {
  const us = MORTGAGE.USD;
  return hub({
    loc: us.base,
    title: "US Mortgage Payment by Loan Amount — Monthly Payment Tables",
    desc: "Monthly principal and interest on every common US mortgage amount from $100,000 to $1 million, at rates from 4% to 8% over 10 to 30 years.",
    h1: "US mortgage payments by amount",
    sub: "Principal and interest on each common loan amount.",
    intro: `Each page has payments at rates from ${pct(us.rates[0])} to ${pct(us.rates[us.rates.length - 1])} over ${us.terms.join(", ")} years. The summary below uses an example rate, not a quoted one; payments exclude property tax, homeowners insurance and mortgage insurance.`,
    sections: amountTable(us, "Loan amount")
  });
}

function loanHub() {
  return hub({
    loc: LOAN.base,
    title: "Loan Repayments by Amount — Monthly Cost Tables",
    desc: "Monthly repayments and total interest on personal loans from £1,000 to £50,000, at APRs from 5% to 30% over 1 to 7 years.",
    h1: "Loan repayments by amount",
    sub: "Monthly cost and total interest for each common loan size.",
    intro: `Pick an amount for its full table of repayments at APRs from ${LOAN.rates[0]}% to ${LOAN.rates[LOAN.rates.length - 1]}% over 1 to 7 years. The summary below uses an example rate. For any amount, APR and term, use the <a href="/loan-repayment/">loan repayment calculator</a>.`,
    sections: amountTable(LOAN, "Loan")
  });
}

// ---------------------------------------------------------------- links from the calculators

/* A short "by amount" link list on the mortgage overpayment and loan
   repayment calculators, so the generated pages are reachable from the site */
function linkBlock(file, html) {
  const fs = require("fs");
  const path = require("path");
  const START = "    <!-- repayment links: generated by tools/build-repayment-pages.js -->\n";
  const END = "    <!-- end repayment links -->\n";
  const full = path.join(site.ROOT, file);
  let s = fs.readFileSync(full, "utf8");
  if (s.includes(START)) s = s.slice(0, s.indexOf(START)) + s.slice(s.indexOf(END) + END.length);
  const at = s.indexOf("    <!-- related calculators: generated by tools/related.js -->");
  if (at < 0) throw new Error(file + " has no related block to put the links above");
  s = s.slice(0, at) + START + html + END + "\n" + s.slice(at);
  fs.writeFileSync(full, s);
}

function amountLinks(cfg, label, few) {
  return few.map((a) => `<a href="${cfg.base}${a}/">${esc(money(cfg.symbol, a, true))} ${label}</a>`).join(" ");
}

// ---------------------------------------------------------------- main

function main() {
  const urls = [["/mortgage/", "0.7"], ["/mortgage/us/", "0.6"], ["/loan/", "0.7"]];
  const put = ([loc, html]) => {
    site.write(loc.replace(/^\/|\/$/g, ""), html);
    urls.push([loc, "0.6"]);
  };
  MORTGAGE.GBP.amounts.forEach((a) => put(mortgagePage(MORTGAGE.GBP, a)));
  MORTGAGE.USD.amounts.forEach((a) => put(mortgagePage(MORTGAGE.USD, a)));
  LOAN.amounts.forEach((a) => put(loanPage(LOAN, a)));
  site.write("mortgage", mortgageHub());
  site.write("mortgage/us", usMortgageHub());
  site.write("loan", loanHub());

  const amount = /^\d+$/;
  const pruned = site.prune("mortgage", amount) + site.prune("mortgage/us", amount) + site.prune("loan", amount);

  linkBlock("mortgage-overpayment/index.html", `    <main class="tool">
      <p class="tool-section-title">Monthly payments by mortgage size</p>
      <p class="salary-links">${amountLinks(MORTGAGE.GBP, "mortgage", [100000, 150000, 200000, 250000, 300000, 400000, 500000])} <a href="/mortgage/">All amounts</a></p>
    </main>
`);
  linkBlock("loan-repayment/index.html", `    <main class="tool">
      <p class="tool-section-title">Repayments by loan size</p>
      <p class="salary-links">${amountLinks(LOAN, "loan", [3000, 5000, 10000, 15000, 20000, 25000])} <a href="/loan/">All amounts</a></p>
    </main>
`);

  site.sitemapBlock("repayment pages", "tools/build-repayment-pages.js", urls);
  console.log(`built ${urls.length} mortgage and loan pages and hubs; ${site.changed.size} changed, ${pruned} removed`);
}

main();
