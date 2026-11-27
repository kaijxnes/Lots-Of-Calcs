#!/usr/bin/env node
/* Guides: longer explanations that link the calculators on a topic together.

       /guides/                                  the list
       /guides/uk-income-tax/                    bands, allowance taper, NI, worked examples
       /guides/self-assessment-explained/        who files, the deadlines, January bills, penalties
       /guides/tax-changes-2027-28/              what changes on 6 April 2027 (Budget 2026)
       /guides/national-insurance-explained/     classes, rates, employers, State Pension years
       /guides/why-has-my-tax-code-changed/      reasons, reading the code, fixing it, refunds
       /guides/before-the-tax-year-ends/         Marriage Allowance backdating, ISA, pension, claims
       /guides/us-tax-brackets-2027/             IRS 2027 brackets, standard deduction, examples
       /guides/student-loans-explained/          plans, thresholds, repayments, interest, write-off
       /guides/isa-vs-pension-explained/         allowances, relief, access, which leaves more
       /guides/how-mortgage-interest-works/      the repayment formula, tables, overpaying
       /guides/matched-betting-explained/        lay stakes, qualifying bets, free bets
       /guides/your-first-job/                   tax code, tax and NI, pension, minimum wage, holiday
       /guides/universal-credit-explained/       amounts, children, taper, savings, benefit cap
       /guides/retiring/                         State Pension age and amount, pension tax, Winter Fuel

       node tools/build-guides.js

   Every figure is worked out here: the UK tax guide reads the tax files in
   force (data/tax/gb) and runs them through the same engine as the salary
   calculator, so it changes when the rates do and the monthly update
   rebuilds it after the tax pages. The mortgage and betting guides are
   arithmetic only. Each guide also puts a short "read the guide" link on
   the calculators it explains, just above their related calculators. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const registry = require("./tax/registry.js");
const TaxEngine = require("../tax-engine.js");
const icons = require("./lib/icons.js");
const { esc, SITE } = site;

const m0 = (v) => "£" + Math.round(v).toLocaleString("en-GB");
const m2 = (v) => "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = (v) => (Math.round(v * 10) / 10).toLocaleString("en-GB") + "%";
const exists = (u) => fs.existsSync(path.join(site.ROOT, u, "index.html"));

function guidePage(o) {
  const url = SITE + o.path;
  const ld = [site.webPage(o.title, o.desc, url, o.modified),
    site.breadcrumb([["Home", SITE + "/"], ["Guides", SITE + "/guides/"], [o.crumb, url]]),
    { "@context": "https://schema.org", "@type": "Article", headline: o.h1, description: site.clipDesc(o.desc), url,
      mainEntityOfPage: url, dateModified: o.modified || site.TODAY, author: { "@type": "Organization", name: "Lots Of Calcs", url: SITE + "/" },
      publisher: { "@type": "Organization", name: "Lots Of Calcs", url: SITE + "/" } },
    site.faqLd(o.q)];
  const toc = o.sections.map(([id, h]) => `<li><a href="#${id}">${esc(h)}</a></li>`).join("");
  return site.head({ title: o.title, desc: o.desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="/guides/">← Guides</a>
      <h1 class="page-title">${esc(o.h1)}</h1>
      <p class="page-subtitle">${o.sub}</p>
    </header>

    <main class="tool guide">
      <p class="guide-toc-label">In this guide</p>
      <ol class="guide-toc">${toc}</ol>
      <p class="guide-tools">Calculators: ${o.tools.map(([u, t]) => `<a href="${u}">${esc(t)}</a>`).join(" · ")}</p>
    </main>

${o.body}
    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(o.q)}      <p class="tool-hint" style="margin-top:12px;">${o.foot}</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">More guides</h2>
      <div class="hub-grid">
${GUIDES.filter((g) => g.path !== o.path).map((g) => site.card(g.path, "📖", g.crumb, g.blurb)).join("")}      </div>
    </main>

${site.FOOTER}
  </div>
</body>
</html>
`;
}
const section = (id, h, html) => `    <main class="tool" id="${id}">
      <h2 class="tool-section-title">${esc(h)}</h2>
${html}    </main>
`;
const p = (s) => `      <p class="about-text">${s}</p>\n`;

/* ===================================================== UK income tax */
function incomeTax() {
  const all = registry.readAll(), cur = registry.currentFiles(all);
  const gb = cur.gb.doc, sct = cur["gb-sct"].doc;
  const chain = registry.chainFor(gb, all), sChain = registry.chainFor(sct, all);
  const item = (doc, id) => doc.items.find((i) => i.id === id);
  const PA = item(gb, "gb-personal-allowance").value.taper, taper = item(gb, "gb-personal-allowance").value;
  const B = item(gb, "gb-income-tax").charge.brackets, NI = item(gb, "gb-ni").charge.brackets;
  const SB = item(sct, "gb-income-tax").charge.brackets;
  const YEAR = gb.taxYear.label;
  const gone = taper.from + PA / taper.per;
  /* the bands are on taxable income; with the full allowance, pay starts PA higher */
  if (B.length !== 3 || NI.length !== 3) throw new Error("income tax guide: expected three UK bands and three NI bands");
  const higherAt = B[1][0] + PA, addAt = B[2][0];
  if (addAt !== gone) throw new Error("income tax guide: the additional rate no longer starts where the allowance runs out; rewrite the taper text");
  const run = (g, ch) => TaxEngine.compute(ch || chain, g, {});
  const val = (r, id) => r.values[id] || 0;
  const examples = [20000, 30000, 50000, 60000, 80000, 100000, 125140, 150000].map((g) => {
    const r = run(g);
    return [m0(g), m0(val(r, "gb-income-tax")), m0(val(r, "gb-ni")), m0(r.net), m0(r.net / 12), pct((r.totalDeductions / g) * 100)];
  });
  const marg = (g) => (1 - (run(g + 100).net - run(g).net) / 100) * 100;
  const trap = marg(110000), basicM = marg(30000), higherM = marg(60000);
  const e50 = run(50000), e30 = run(30000);
  const t50 = val(e50, "gb-income-tax"), n50 = val(e50, "gb-ni");
  const sRows = SB.map((b, i) => {
    const to = SB[i + 1] ? SB[i + 1][0] : null;
    /* above the taper's start the allowance shrinks, so the top bands meet where it runs out */
    return [esc(b[2]), b[1] + "%", to ? `${m0(b[0] + PA + 1)} to ${m0(Math.min(to + PA, gone))}` : `over ${m0(b[0])}`];
  });
  const s50 = run(50000, sChain);
  const link = (g) => exists(`/salary/${g}-after-tax/`) ? `<a href="/salary/${g}-after-tax/">${m0(g)}</a>` : m0(g);
  const lastChecked = [gb.lastChecked, sct.lastChecked].filter(Boolean).sort()[0] || null;

  const body = section("bands", `Income tax bands for ${YEAR}`, p(`In England, Wales and Northern Ireland, the first <strong>${m0(PA)}</strong> of your income each tax year is tax-free: that's the personal allowance. Income above it is taxed in bands, and each rate applies only to the slice of income inside its band, not to everything you earn. The ${YEAR} tax year runs from 6 April ${gb.taxYear.start.slice(0, 4)} to 5 April ${gb.taxYear.end.slice(0, 4)}.`) +
      site.table(["Band", "Rate", "Income (with the full personal allowance)"], [
        ["Personal allowance", "0%", `up to ${m0(PA)}`],
        [esc(B[0][2]), B[0][1] + "%", `${m0(PA + 1)} to ${m0(higherAt)}`],
        [esc(B[1][2]), B[1][1] + "%", `${m0(higherAt + 1)} to ${m0(addAt)}`],
        [esc(B[2][2]), B[2][1] + "%", `over ${m0(addAt)}`]
      ], 420) +
      p(`So on ${link(50000)} you pay nothing on the first ${m0(PA)} and ${B[0][1]}% on the remaining ${m0(50000 - PA)}: ${m0(t50)} of income tax. Moving into the higher rate band doesn't change the tax on the income below it: only the pounds above ${m0(higherAt)} are taxed at ${B[1][1]}%.`)) +
    section("allowance", "The personal allowance taper and the 60% band", p(`Once your income goes over <strong>${m0(taper.from)}</strong>, the personal allowance shrinks by £1 for every £2 above it, so it's gone completely at <strong>${m0(gone)}</strong>. Each extra £100 in that range costs ${B[1][1]}% tax on the £100 itself and another ${B[1][1]}% on the £50 of allowance it takes away: an effective ${B[1][1] * 1.5}% income tax rate.`) +
      p(`Add National Insurance and someone paid ${m0(110000)} keeps only about ${pct(100 - trap)} of a pay rise: a marginal rate of <strong>${pct(trap)}</strong>, against ${pct(higherM)} at ${m0(60000)} and ${pct(basicM)} at ${m0(30000)}. Pension contributions bring the income used for the taper down, which is why paying more into a pension is popular in this band; the <a href="/pay-rise-calculator/">pay rise calculator</a> shows what a rise is really worth.`)) +
    section("ni", "National Insurance", p(`Employees also pay Class 1 National Insurance on their pay: <strong>${NI[1][1]}%</strong> between ${m0(NI[1][0])} and ${m0(NI[2][0])} a year, and <strong>${NI[2][1]}%</strong> above that. It's worked out on pay before pension contributions (unless they're made by salary sacrifice), and per pay period rather than over the year. On ${m0(50000)} it comes to ${m0(n50)}.`) +
      p(`If you're self-employed you pay Class 4 National Insurance on your profits through Self Assessment instead: the <a href="/self-employed-tax-calculator/">self-employed tax calculator</a> works it out, and the <a href="/payments-on-account-calculator/">payments on account calculator</a> shows when it's due.`)) +
    section("examples", "Take-home pay at different salaries", p(`Income tax and National Insurance on a salary in ${YEAR}, with the standard tax code, no pension and no student loan:`) +
      site.table(["Salary", "Income tax", "National Insurance", "Take-home a year", "A month", "Deducted"], examples, 560) +
      p(`On ${m0(30000)} you take home ${m0(e30.net)} a year, ${m0(e30.net / 12)} a month. For your own salary, with a pension, student loan or another part of the UK, use the <a href="/salary/">salary calculator</a>; the <a href="/tax-rates/">tax rates page</a> lists every band and threshold.`)) +
    section("scotland", "Scotland", p(`If you live in Scotland, income tax on your wages follows the Scottish bands instead (National Insurance and the personal allowance are the same across the UK). There are six rates:`) +
      site.table(["Band", "Rate", "Income (with the full personal allowance)"], sRows, 420) +
      p(`On ${m0(50000)} in Scotland the income tax comes to ${m0(val(s50, "gb-income-tax"))}, against ${m0(t50)} in the rest of the UK. The <a href="/salary/scotland/">Scottish salary calculator</a> works out take-home pay with these bands.`)) +
    section("other", "Other things that change your tax", p(`<strong>Pension contributions</strong> made by salary sacrifice or a net pay arrangement come off your pay before tax (salary sacrifice saves National Insurance too: see the <a href="/salary-sacrifice-calculator/">salary sacrifice calculator</a>); with relief at source, the pension provider adds the basic rate and higher rate taxpayers claim the rest back (the <a href="/pension-tax-relief-calculator/">pension tax relief calculator</a> works it out). <strong>Student loans</strong> take 9% of earnings above your plan's threshold (the <a href="/student-loan-calculator/">student loan calculator</a> shows how long repayments last). <strong>Dividends</strong> have their own rates and allowance: see the <a href="/dividend-tax-calculator/">dividend tax calculator</a>.`) +
      p(`If you or your partner get Child Benefit and either of you earns over ${m0(60000)}, the <a href="/child-benefit-tax-charge-calculator/">High Income Child Benefit Charge</a> takes some or all of it back.`));

  const q = [
    [`What are the UK income tax bands for ${YEAR}?`, `The personal allowance is ${m0(PA)}. Then ${B[0][1]}% basic rate up to ${m0(higherAt)}, ${B[1][1]}% higher rate up to ${m0(addAt)} and ${B[2][1]}% additional rate above that, for England, Wales and Northern Ireland. Scotland has its own six bands.`],
    ["Do I pay the higher rate on all my income?", `No. Each rate applies only to the income inside its band. On ${m0(60000)} you pay ${B[1][1]}% only on the ${m0(60000 - higherAt)} above ${m0(higherAt)}.`],
    ["What is the 60% tax trap?", `Between ${m0(taper.from)} and ${m0(gone)}, the personal allowance is withdrawn by £1 for every £2 of income, so each extra pound is effectively taxed at ${B[1][1] * 1.5}%, or about ${pct(trap)} with National Insurance.`],
    [`How much tax do I pay on ${m0(50000)}?`, `${m0(t50)} income tax and ${m0(n50)} National Insurance in ${YEAR}, leaving ${m0(e50.net)} a year or ${m0(e50.net / 12)} a month (standard tax code, no pension or student loan).`],
    ["How much National Insurance do employees pay?", `${NI[1][1]}% of pay between ${m0(NI[1][0])} and ${m0(NI[2][0])} a year, and ${NI[2][1]}% of pay above ${m0(NI[2][0])}.`]
  ];
  return { path: "/guides/uk-income-tax/", crumb: "UK Income Tax Explained", blurb: "How the bands, the personal allowance and National Insurance work, with take-home pay at different salaries.",
    title: site.fitTitle(`UK Income Tax Explained ${YEAR} — Bands, Allowance & NI`, `UK Income Tax ${YEAR} Explained`), modified: lastChecked,
    desc: `How UK income tax works in ${YEAR}: the ${m0(PA)} personal allowance, the ${B[0][1]}%, ${B[1][1]}% and ${B[2][1]}% bands, the 60% trap from ${m0(taper.from)}, National Insurance and take-home pay at different salaries.`,
    h1: `UK income tax explained (${YEAR})`, sub: `How the bands, the personal allowance and National Insurance turn a salary into take-home pay, with worked figures for the ${YEAR} tax year.`,
    sections: [["bands", "Income tax bands"], ["allowance", "The allowance taper and the 60% band"], ["ni", "National Insurance"], ["examples", "Take-home pay at different salaries"], ["scotland", "Scotland"], ["other", "Other things that change your tax"]],
    tools: [["/salary/", "Salary calculator"], ["/tax-rates/", "Tax rates"], ["/pay-rise-calculator/", "Pay rise"], ["/self-employed-tax-calculator/", "Self-employed tax"]],
    body, q, callouts: ["/salary/", "/pay-rise-calculator/", "/self-employed-tax-calculator/", "/child-benefit-tax-charge-calculator/", "/salary-sacrifice-calculator/", "/pension-tax-relief-calculator/"],
    foot: `Figures worked out from the ${YEAR} rates the <a href="/salary/">salary calculator</a> uses, checked against <a href="${esc(gb.verifyAt)}" rel="nofollow noopener" target="_blank">GOV.UK</a>${lastChecked ? ` (last checked ${site.niceDate(lastChecked)})` : ""}. A guide, not tax advice.` };
}

/* ===================================================== mortgage interest */
function payment(P, rate, years) { const r = rate / 100 / 12, n = years * 12; return r ? P * r / (1 - Math.pow(1 + r, -n)) : P / n; }
function schedule(P, rate, years, extra) {
  const r = rate / 100 / 12, pay = payment(P, rate, years) + (extra || 0);
  let bal = P, months = 0, interest = 0; const byYear = [];
  let yi = 0, yc = 0;
  while (bal > 0.005 && months < years * 12) {
    const i = bal * r, c = Math.min(bal, pay - i);
    bal -= c; interest += i; yi += i; yc += c; months++;
    if (months % 12 === 0 || bal <= 0.005) { byYear.push({ year: Math.ceil(months / 12), interest: yi, capital: yc, balance: Math.max(0, bal) }); yi = 0; yc = 0; }
  }
  return { pay, months, interest, byYear };
}
function mortgage() {
  const P = 200000, R = 4.5, Y = 25;
  const s = schedule(P, R, Y), pay = s.pay;
  const firstI = P * R / 100 / 12, firstC = pay - firstI;
  const io = P * R / 100 / 12;
  const half = s.byYear.find((y) => y.capital > y.interest);
  const yrs = [1, 5, 10, 15, 20, 25].map((y) => { const r = s.byYear[y - 1]; return [String(y), m0(r.interest), m0(r.capital), m0(r.balance)]; });
  const rates = [3, 4, 4.5, 5, 6].map((rt) => { const x = schedule(P, rt, Y); return [rt + "%", m2(x.pay), m0(x.interest), m0(x.pay * Y * 12)]; });
  const terms = [20, 25, 30, 35].map((t) => { const x = schedule(P, R, t); return [t + " years", m2(x.pay), m0(x.interest)]; });
  const over = schedule(P, R, Y, 100), saved = s.interest - over.interest;
  const oy = Math.floor(over.months / 12), om = over.months % 12;
  const short = Y * 12 - over.months, sy = Math.floor(short / 12), sm = short % 12;
  const ym = (y, m) => [y ? `${y} year${y === 1 ? "" : "s"}` : "", m ? `${m} month${m === 1 ? "" : "s"}` : ""].filter(Boolean).join(" and ");
  if (Math.abs(pay - 1111.66) > 0.01) throw new Error("mortgage guide: payment check " + pay);

  const body = section("formula", "How the monthly payment is worked out", p(`A repayment mortgage is set up so that the same payment every month clears the loan and all its interest by the end of the term. With <em>P</em> the amount borrowed, <em>r</em> the monthly interest rate (the yearly rate ÷ 12) and <em>n</em> the number of monthly payments, the payment is:`) +
      `      <p class="guide-formula">payment = P × r ÷ (1 − (1 + r)<sup>−n</sup>)</p>\n` +
      p(`For ${m0(P)} over ${Y} years at ${R}%: <em>r</em> = ${R}% ÷ 12 = ${(R / 12).toFixed(3)}% a month, <em>n</em> = ${Y * 12} payments, and the payment comes to <strong>${m2(pay)}</strong> a month. Over the whole term you pay back ${m0(pay * Y * 12)}: the ${m0(P)} you borrowed and <strong>${m0(s.interest)}</strong> of interest. The <a href="/mortgage-calculator/">mortgage calculator</a> does this sum for any loan, with a chart of the balance.`)) +
    section("split", "Why early payments are mostly interest", p(`Each month, interest is charged on the balance still owed: in the first month that's ${m0(P)} × ${(R / 12).toFixed(3)}% = <strong>${m2(firstI)}</strong>. The rest of the payment, ${m2(firstC)}, pays off the loan. As the balance falls, so does the interest, and more of each payment goes on the loan itself. On this mortgage, the yearly repayment of the loan doesn't overtake the interest until year ${half.year}.`) +
      site.table(["Year", "Interest paid", "Loan repaid", "Still owed at the end"], yrs, 420)) +
    section("rate", "How much the rate matters", p(`The same ${m0(P)} over ${Y} years at different rates. Each percentage point adds roughly ${m0((schedule(P, 5, Y).pay - schedule(P, 4, Y).pay))} a month here, and tens of thousands over the term:`) +
      site.table(["Rate", "Monthly payment", "Total interest", "Total repaid"], rates, 420) +
      p(`Fixed rates only last for the deal period (often 2 or 5 years); after that the payment is recalculated at the new rate on the balance left. Rerun the numbers at a higher rate before you commit; the <a href="/mortgage-affordability/">mortgage affordability calculator</a> shows how much lenders might let you borrow.`)) +
    section("term", "Longer terms: lower payments, more interest", p(`Stretching the term brings the monthly payment down but means paying interest for longer. ${m0(P)} at ${R}%:`) +
      site.table(["Term", "Monthly payment", "Total interest"], terms, 360)) +
    section("io", "Interest-only mortgages", p(`With an interest-only mortgage you pay just the interest each month, ${m0(P)} × ${R}% ÷ 12 = <strong>${m2(io)}</strong> here, and still owe the whole ${m0(P)} at the end of the term, which you need a plan to repay. Over ${Y} years the interest comes to ${m0(io * Y * 12)}, against ${m0(s.interest)} on a repayment mortgage, because the balance never goes down.`)) +
    section("overpay", "Overpaying", p(`An overpayment goes straight off the balance, so every later month's interest is worked out on a smaller amount. Paying an extra <strong>£100 a month</strong> on this mortgage clears it in ${ym(oy, om)} instead of ${Y} years, ${ym(sy, sm)} early, and saves about <strong>${m0(saved)}</strong> of interest. Many fixed-rate deals let you overpay up to 10% of the balance a year without an early repayment charge; check yours. The <a href="/mortgage-overpayment/">mortgage overpayment calculator</a> works out the saving for your loan.`) +
      p(`Some lenders work interest out daily rather than monthly; the difference is small, and these figures use monthly interest, as most mortgage illustrations do. Buying? The <a href="/stamp-duty-calculator/">stamp duty calculator</a> covers the tax on the purchase, and <a href="/rent-vs-buy/">rent vs buy</a> compares the two.`));

  const q = [
    ["How is mortgage interest calculated?", `On the balance still owed: each month the lender charges the yearly rate ÷ 12 on what you owe. On ${m0(P)} at ${R}% that's ${m2(firstI)} in the first month, falling as the loan is paid off.`],
    [`What is the monthly payment on a ${m0(P)} mortgage?`, `${m2(pay)} a month over ${Y} years at ${R}%, with ${m0(s.interest)} of interest over the term. At 4% it's ${m2(schedule(P, 4, Y).pay)}; at 5%, ${m2(schedule(P, 5, Y).pay)}.`],
    ["Why do I pay so much interest at the start of a mortgage?", "Because the interest is charged on the balance, which is at its highest at the start. As you pay the loan down, less of each payment goes on interest and more on the loan."],
    ["Is it worth overpaying my mortgage?", `It saves interest at your mortgage rate: £100 a month extra on ${m0(P)} at ${R}% saves about ${m0(saved)} and ends the mortgage ${ym(sy, sm)} early. Check your deal's overpayment limit, and weigh it against savings rates and any more expensive debt.`],
    ["How much more does an interest-only mortgage cost?", `On ${m0(P)} at ${R}% over ${Y} years, about ${m0(io * Y * 12)} of interest against ${m0(s.interest)} on a repayment mortgage, and you still owe the ${m0(P)} at the end.`]
  ];
  return { path: "/guides/how-mortgage-interest-works/", crumb: "How Mortgage Interest Works", blurb: "The repayment formula, why early payments are mostly interest, and what the rate, the term and overpaying do.",
    title: site.fitTitle("How Mortgage Interest Works — The Formula, With Examples", "How Mortgage Interest Works"),
    desc: `How mortgage interest is worked out: the monthly payment formula, why early payments are mostly interest, and what the rate, term and overpaying do, with a ${m0(P)} worked example.`,
    h1: "How mortgage interest works", sub: `How a lender turns a loan, a rate and a term into your monthly payment, worked through for a ${m0(P)} mortgage.`,
    sections: [["formula", "The monthly payment formula"], ["split", "Why early payments are mostly interest"], ["rate", "How much the rate matters"], ["term", "Longer terms"], ["io", "Interest-only mortgages"], ["overpay", "Overpaying"]],
    tools: [["/mortgage-calculator/", "Mortgage calculator"], ["/mortgage-overpayment/", "Overpayments"], ["/mortgage-affordability/", "Affordability"], ["/stamp-duty-calculator/", "Stamp duty"]],
    body, q, callouts: ["/mortgage-calculator/", "/mortgage-overpayment/", "/mortgage-affordability/"],
    foot: "Worked out with monthly interest and payments, as the site's mortgage calculators do. Real mortgages can add fees, and rates change at the end of a deal. A guide, not financial advice." };
}

/* ===================================================== matched betting */
function qualifying(stake, back, lay, c) {
  const L = back * stake / (lay - c);
  return { lay: L, liability: L * (lay - 1), win: stake * (back - 1) - L * (lay - 1), lose: -stake + L * (1 - c) };
}
function freeSNR(stake, back, lay, c) {
  const L = (back - 1) * stake / (lay - c);
  return { lay: L, liability: L * (lay - 1), win: stake * (back - 1) - L * (lay - 1), lose: L * (1 - c) };
}
function betting() {
  const c = 0.02;
  const q1 = qualifying(10, 3, 3.1, c), f1 = freeSNR(10, 6, 6.2, c);
  if (Math.abs(q1.lay - 9.74) > 0.005 || Math.abs(q1.win + 0.45) > 0.006) throw new Error("matched betting guide: qualifying check");
  if (Math.abs(f1.win - f1.lose) > 0.01) throw new Error("matched betting guide: free bet check");
  const keep = [[2, 2.04], [3, 3.1], [4, 4.1], [6, 6.2], [8, 8.4], [10, 10.5]].map(([o, l]) => { const f = freeSNR(10, o, l, c); return [o.toFixed(1), String(l), m2(f.lay), m2(f.liability), m2(f.lose), pct(f.lose * 10)]; });
  const p2 = (v) => (v < 0 ? "−" : "") + m2(Math.abs(v));

  const body = section("idea", "The idea", p(`Matched betting uses a bookmaker's free bet offers. You place a bet <strong>for</strong> an outcome at the bookmaker (a <em>back</em> bet) and a bet <strong>against</strong> the same outcome at a betting exchange (a <em>lay</em> bet), with stakes sized so that you end up with about the same amount whichever way the result goes. The two bets together cost a little, the <em>qualifying loss</em>; the free bet they unlock is worth much more.`) +
      p(`A lay bet works the other way round from a normal bet: you're acting as the bookmaker. If the outcome loses, you win the lay stake (less the exchange's commission). If it wins, you pay the backer's winnings, the lay stake × (lay odds − 1): that's your <strong>liability</strong>, and the exchange holds it from your balance until the event is settled.`)) +
    section("qualifying", "Step 1: the qualifying bet", p(`To unlock a typical "bet £10, get a £10 free bet" offer you place £10 of your own money. The lay stake that balances it is:`) +
      `      <p class="guide-formula">lay stake = back odds × back stake ÷ (lay odds − commission)</p>\n` +
      p(`Back £10 at 3.0 and lay at 3.1 with 2% commission: lay stake = 3.0 × £10 ÷ (3.1 − 0.02) = <strong>${m2(q1.lay)}</strong>, with a liability of ${m2(q1.liability)}.`) +
      site.table(["If the outcome…", "Bookmaker", "Exchange", "Overall"], [
        ["wins", `+${m2(20)}`, `−${m2(q1.liability)}`, p2(q1.win)],
        ["loses", `−${m2(10)}`, `+${m2(q1.lay * (1 - c))}`, p2(q1.lose)]
      ], 420) +
      p(`Either way you're down about ${m2(-q1.win)}: the qualifying loss. It comes from the gap between the back and lay odds, and the commission. The closer the two prices, the smaller it is. The <a href="/lay/">lay bet calculator</a> works out the stake for any odds and commission.`)) +
    section("free", "Step 2: the free bet", p(`Most free bets are <em>stake not returned</em> (SNR): if the bet wins you get the winnings but not the £10 stake. So the lay stake is based on the winnings alone:`) +
      `      <p class="guide-formula">lay stake = (back odds − 1) × free bet ÷ (lay odds − commission)</p>\n` +
      p(`A £10 free bet at 6.0, laid at 6.2 with 2% commission: lay stake = 5 × £10 ÷ 6.18 = <strong>${m2(f1.lay)}</strong>. If the outcome wins, the bookmaker pays ${m2(50)} and you pay the exchange ${m2(f1.liability)}: ${m2(f1.win)}. If it loses, you keep the lay stake less commission: ${m2(f1.lose)}. About <strong>${m2(f1.lose)}</strong> either way, ${pct(f1.lose * 10)} of the free bet, against a ${m2(-q1.win)} qualifying loss.`)) +
    section("odds", "Why free bets go on higher odds", p(`With a stake not returned free bet, the share you keep rises with the odds, because the missing stake matters less the bigger the winnings are. A £10 free bet with 2% commission, at typical lay prices a little above the back odds:`) +
      site.table(["Back odds", "Lay odds", "Lay stake", "Liability", "Kept either way", "Share kept"], keep, 520) +
      p(`Higher odds also mean a bigger liability, so you need more money in your exchange account. Qualifying bets are the other way round: closer odds matter more than high ones, since you want the loss to be small. The <a href="/odds-converter/">odds converter</a> turns fractional odds into the decimal odds these formulas use.`)) +
    section("risks", "The risks and the catches", p(`<strong>Mistakes cost real money.</strong> Laying the wrong outcome, the wrong market, or at odds that moved before your lay was matched leaves you exposed. Check every bet before placing it, and place the lay as soon as the back bet is on.`) +
      p(`<strong>Offers have terms.</strong> Minimum odds, which bets count, and when the free bet expires all vary. Bookmakers can also limit the stakes or offers available to accounts that only take promotions.`) +
      p(`<strong>It's still gambling.</strong> The bets are real, and you need enough money in the exchange to cover liabilities. If it stops feeling like arithmetic, stop. You must be 18 or over; free, confidential help is at <a href="https://www.gambleaware.org/" rel="nofollow noopener" target="_blank">GambleAware</a>.`) +
      p(`Other betting maths on the site: <a href="/each-way/">each-way bets</a>, <a href="/dutching/">dutching</a> across several selections and <a href="/accumulator/">accumulators</a>.`));

  const q = [
    ["What is matched betting?", "Using bookmakers' free bet offers by backing an outcome at the bookmaker and laying the same outcome at a betting exchange, with stakes sized so the result doesn't matter. The small loss on the qualifying bet unlocks a free bet worth more."],
    ["How do I work out the lay stake?", `For a normal bet: back odds × back stake ÷ (lay odds − commission). For a stake not returned free bet: (back odds − 1) × free bet ÷ (lay odds − commission). £10 at 3.0 laid at 3.1 with 2% commission needs a ${m2(q1.lay)} lay.`],
    ["What is lay liability?", "What you pay out at the exchange if the outcome you laid wins: lay stake × (lay odds − 1). The exchange holds it from your balance until the event is settled."],
    ["How much is a £10 free bet worth?", `Usually about £7 to £8 once it's laid off. A £10 stake not returned free bet at 6.0, laid at 6.2 with 2% commission, leaves ${m2(f1.lose)} whichever way the result goes.`],
    ["Why is there a qualifying loss?", "The lay odds at the exchange are almost always a little higher than the back odds, and the exchange charges commission on winnings. Together they make the matched bet cost a little."]
  ];
  return { path: "/guides/matched-betting-explained/", crumb: "Matched Betting Explained", blurb: "How back and lay bets cancel out, the lay stake formulas, and what a free bet is really worth.",
    title: site.fitTitle("Matched Betting Explained — Lay Stakes, Free Bets & the Maths", "Matched Betting Explained"),
    desc: `How matched betting works: back and lay bets, the lay stake formulas, the qualifying loss and why a £10 free bet is worth about ${m2(f1.lose)}, with worked examples.`,
    h1: "Matched betting explained", sub: "How a back bet and a lay bet cancel out, how to size the lay stake, and what a free bet is really worth, worked through with real numbers.",
    sections: [["idea", "The idea"], ["qualifying", "The qualifying bet"], ["free", "The free bet"], ["odds", "Why free bets go on higher odds"], ["risks", "The risks and the catches"]],
    tools: [["/lay/", "Lay bet calculator"], ["/each-way/", "Each-way"], ["/dutching/", "Dutching"], ["/odds-converter/", "Odds converter"]],
    body, q, callouts: ["/lay/", "/each-way/", "/dutching/", "/odds-converter/"],
    foot: "Worked out with the same formulas as the lay bet calculator. Odds and commission are examples; exchanges charge different rates. 18+ only. A guide, not betting advice." };
}

/* ===================================================== Self Assessment */
function selfAssessment() {
  const SA = require("../self-assessment.js");
  const R = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/uk/self-assessment.json"), "utf8"));
  const D = R.deadlines, f = R.penalties.filing, pay = R.penalties.payment, RATE = R.interest.latePaymentRate;
  const TODAY = new Date(site.TODAY + "T00:00:00Z");
  /* the next 31 January deadline, as on the Self Assessment calculators */
  const Y = TODAY > SA.utc(TODAY.getUTCFullYear(), 0, 31) ? TODAY.getUTCFullYear() + 1 : TODAY.getUTCFullYear();
  const ty = (end) => `${end - 1}/${String(end).slice(2)}`;
  const YEAR = ty(Y - 1), NEXT = ty(Y);
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const on = (md, y) => { const [m, d] = md.split("-").map(Number); return `${d} ${MONTHS[m - 1]} ${y}`; };
  const poa = SA.payments(R, 3000, 0, 1800, false);
  const late = SA.penalties(R, 2000, SA.utc(Y, 0, 31), null, null, SA.utc(Y, 4, 31));
  const src = (o) => `<a href="${o.url}" rel="nofollow noopener" target="_blank">${esc(o.title)}</a>`;

  const body = section("who", "Who needs to send a return", p(`You need to send a Self Assessment tax return for the tax year that ended on 5 April if, for example, you were self-employed and earned more than £1,000, were a partner in a business partnership, have Capital Gains Tax to pay, or have to pay the <a href="/child-benefit-tax-charge-calculator/">High Income Child Benefit Charge</a> and don't pay it through PAYE. Untaxed income such as rent, tips and commission, savings interest, dividends or foreign income can mean a return too. GOV.UK has a checker if you're not sure.`)) +
    section("deadlines", `The deadlines for the ${YEAR} return`, p(`The ${YEAR} tax year ran from 6 April ${Y - 2} to 5 April ${Y - 1}. Each deadline is at ${D.time}:`) +
      site.table(["What", "Deadline"], [
        ["Tell HMRC you need to send a return (if you haven't before)", on(D.register, Y - 1)],
        ["Paper tax return", on(D.paper, Y - 1)],
        ["Online return, to have the bill collected through your tax code", on(D.codingOut, Y - 1)],
        ["<strong>Online tax return</strong>", `<strong>${on(D.online, Y)}</strong>`],
        [`<strong>Pay the tax owed for ${YEAR}</strong> (and the first payment on account for ${NEXT})`, `<strong>${on(D.payment, Y)}</strong>`],
        [`Second payment on account for ${NEXT}`, on(D.secondPayment, Y)]
      ], 420) +
      p(`If you register after 5 October, HMRC gives you a different deadline for the return (3 months from its letter), but the tax is still due by 31 January. The <a href="/days-until/self-assessment-deadline/">Self Assessment countdown</a> shows how long is left.`)) +
    section("january", "What you pay in January", p(`The 31 January bill is usually two things: the <strong>balancing payment</strong> (what's left of last year's bill once your payments on account are taken off) and the <strong>first payment on account</strong> towards this year, which is half of last year's bill. On GOV.UK's example, a ${m0(3000)} bill with ${m0(1800)} already paid on account means ${m0(poa.balancing)} plus ${m0(poa.poa)}: <strong>${m0(poa.january)} by 31 January</strong> and ${m0(poa.july)} by 31 July.`) +
      p(`You don't make payments on account if last year's bill was under ${m0(R.paymentsOnAccount.minBill)}, or if more than 80% of your tax was taken at source. The <a href="/payments-on-account-calculator/">payments on account calculator</a> works out your own figures, and the <a href="/self-employed-tax-calculator/">self-employed tax calculator</a> estimates the bill itself.`)) +
    section("late", "Penalties and interest", p(`Miss the return deadline and there's a <strong>${m0(f.initial)}</strong> penalty straight away. After 3 months, ${m0(f.daily)} a day up to ${m0(f.dailyMax)}; after 6 months, ${f.sixMonthPct}% of the tax due or ${m0(f.sixMonthMin)}, whichever is more; after 12 months, the same again. Paying late adds ${pay.pct}% of the tax unpaid at 30 days, 6 months and 12 months, plus interest at HMRC's late payment rate, ${RATE}% a year at the moment.`) +
      p(`So a return and ${m0(2000)} of tax both still outstanding at the end of May cost about ${m2(late.total)}: ${m2(late.filingTotal)} in filing penalties, ${m2(late.paymentTotal)} in payment penalties and ${m2(late.interest)} interest. The <a href="/self-assessment-penalty-calculator/">Self Assessment penalty calculator</a> works it out for your dates. If you had a reasonable excuse, you can appeal.`)) +
    section("mtd", "Making Tax Digital", p(`Sole traders and landlords already registered for Self Assessment may need to keep digital records and send updates with Making Tax Digital for Income Tax software. GOV.UK says it applies if your self-employment and property income before expenses ${D.mtd.thresholds.map(([y, v], i) => `${i ? (i === D.mtd.thresholds.length - 1 ? "or may be over " : "may be over ") : "was over "}${m0(v)} for ${y}`).join(", ")}. Check GOV.UK for when it starts for you.`)) +
    section("bill", "Working out the bill", p(`The return brings all your income together. For the pieces: <a href="/self-employed-tax-calculator/">self-employed tax and Class 4 National Insurance</a>, the <a href="/dividend-tax-calculator/">dividend tax calculator</a>, the <a href="/capital-gains-tax-calculator/">Capital Gains Tax calculator</a>, and the <a href="/child-benefit-tax-charge-calculator/">Child Benefit charge</a>. Higher rate taxpayers paying into a personal pension claim extra relief on the return: the <a href="/pension-tax-relief-calculator/">pension tax relief calculator</a> shows how much.`));

  const q = [
    [`When is the Self Assessment deadline for ${YEAR}?`, `${on(D.online, Y)} at ${D.time}, for both the online return and paying what you owe. Paper returns were due by ${on(D.paper, Y - 1)}.`],
    ["What happens if I miss the Self Assessment deadline?", `A ${m0(f.initial)} late filing penalty straight away, then daily penalties after 3 months and more at 6 and 12 months. Paying late adds ${pay.pct}% penalties at 30 days, 6 months and 12 months, plus interest at ${RATE}%.`],
    ["Why is my January tax bill so high?", "It usually includes the balancing payment for last year and the first payment on account for this year, half of last year's bill again. In your first year there are no payments on account to take off, so it can be half as much again as the year's tax."],
    ["Can I pay my Self Assessment through my tax code?", `You may be able to, if you file your return online by ${on(D.codingOut, Y - 1)}. After that, you pay it another way.`],
    ["When is the second payment on account due?", `${on(D.secondPayment, Y)}: the second half of your payments on account towards ${NEXT}.`]
  ];
  return { path: "/guides/self-assessment-explained/", crumb: "Self Assessment Explained", blurb: `Who needs a return, the ${YEAR} deadlines, what's due in January, and the penalties for being late.`,
    title: site.fitTitle(`Self Assessment Explained ${Y} — Deadlines, Payments & Penalties`, `Self Assessment Deadlines ${Y} Explained`), modified: R.lastChecked,
    desc: `Self Assessment for the ${YEAR} tax year: who needs to send a return, the deadlines up to ${on(D.online, Y)}, payments on account, and the penalties and interest for being late.`,
    h1: `Self Assessment explained (${YEAR} return)`, sub: `Who needs to send a tax return, every deadline up to <strong>${on(D.online, Y)}</strong>, what you'll pay in January, and what being late costs.`,
    sections: [["who", "Who needs to send a return"], ["deadlines", "The deadlines"], ["january", "What you pay in January"], ["late", "Penalties and interest"], ["mtd", "Making Tax Digital"], ["bill", "Working out the bill"]],
    tools: [["/self-employed-tax-calculator/", "Self-employed tax"], ["/payments-on-account-calculator/", "Payments on account"], ["/self-assessment-penalty-calculator/", "Penalties"], ["/days-until/self-assessment-deadline/", "Countdown"]],
    body, q, callouts: ["/payments-on-account-calculator/", "/self-assessment-penalty-calculator/", "/self-employed-tax-calculator/"],
    foot: `Deadlines and rules from ${src(D.source)}, ${src(D.whoSource)} and the sources on the <a href="/self-assessment-penalty-calculator/">penalty calculator</a> (last checked ${site.niceDate(R.lastChecked)}). A guide, not tax advice.` };
}

/* ===================================================== 2027/28 changes */
/* Every figure is from the Budget 2026 Overview of Tax Legislation and Rates
   (OOTLAR) and its Annex A, DWP's proposed benefit and pension rates for
   2027 to 2028, GOV.UK's minimum wage rates and the Student Loans Company's
   2027 threshold announcement — read 26 November 2026. */
function changes2027() {
  const S = {
    ootlar: { title: "HMRC — Budget 2026: Overview of tax legislation and rates", url: "https://www.gov.uk/government/publications/budget-2026-overview-of-tax-legislation-and-rates-ootlar/budget-2026-overview-of-tax-legislation-and-rates-ootlar" },
    annex: { title: "OOTLAR Annex A: rates and allowances", url: "https://www.gov.uk/government/publications/budget-2026-overview-of-tax-legislation-and-rates-ootlar/annex-a-rates-and-allowances" },
    dwp: { title: "DWP — Proposed benefit and pension rates 2027 to 2028", url: "https://www.gov.uk/government/publications/benefit-and-pension-rates-2027-to-2028/proposed-benefit-and-pension-rates-2027-to-2028" },
    nmw: { title: "GOV.UK — National Minimum Wage and National Living Wage rates", url: "https://www.gov.uk/national-minimum-wage-rates" },
    slc: { title: "Student loans repayment threshold announcement", url: "https://www.gov.uk/government/news/student-loans-repayment-threshold-announcement" }
  };
  const src = (o) => `<a href="${o.url}" rel="nofollow noopener" target="_blank">${esc(o.title)}</a>`;
  const sp = 250.70, spYear = sp * 52;
  /* worked examples, plain arithmetic */
  const save = (interest, psa, oldR, newR) => [Math.max(0, interest - psa) * oldR, Math.max(0, interest - psa) * newR];
  const [s1o, s1n] = save(3000, 500, 0.40, 0.44), [s2o, s2n] = save(2000, 1000, 0.20, 0.24);
  const [l1o, l1n] = [10000 * 0.20, 10000 * 0.24], [l2o, l2n] = [15000 * 0.40, 15000 * 0.44];
  const sale = 2500, [t1o, t1n] = [Math.max(0, sale - 1000) * 0.20, Math.max(0, sale - 3000) * 0.20];
  const rows = [
    ["Personal Allowance", "£12,570", "£12,570"],
    ["Basic rate band / higher rate from", "£37,700 / £50,270", "£37,700 / £50,270"],
    ["Savings income tax (basic / higher / additional)", "20% / 40% / 45%", "<strong>24% / 44% / 49%</strong>"],
    ["Property income tax (basic / higher / additional)", "20% / 40% / 45% (main rates)", "<strong>24% / 44% / 49%</strong>"],
    ["Dividend tax (ordinary / upper / additional)", "10.75% / 35.75% / 39.35%", "10.75% / 35.75% / 39.35%"],
    ["Dividend allowance / Personal Savings Allowance", "£500 / £1,000 (£500 higher rate)", "£500 / £1,000 (£500 higher rate)"],
    ["Trading allowance", "£1,000", "<strong>£3,000</strong>"],
    ["Pension Tax Allowance", "—", "<strong>New</strong>: no tax on income up to £13,037"],
    ["Full new State Pension", "£241.30 a week", "<strong>£250.70 a week</strong>"],
    ["Basic (old) State Pension", "£184.90 a week", "<strong>£192.10 a week</strong>"],
    ["Employee National Insurance", "8% / 2% (£242 to £967 a week)", "8% / 2% (£242 to £967 a week)"],
    ["Class 2 Small Profits Threshold", "£7,105", "<strong>£7,355</strong>"],
    ["Voluntary Class 3 National Insurance", "£18.40 a week", "<strong>£19.05 a week</strong>"],
    ["Child Benefit (eldest / others)", "£27.05 / £17.90 a week", "<strong>£28.00 / £18.55 a week</strong>"],
    ["Marriage Allowance", "£1,260", "£1,260"],
    ["Blind Person's Allowance", "£3,250", "<strong>£3,370</strong>"],
    ["Capital Gains Tax rates / annual exempt amount", "18% / 24%, £3,000", "18% / 24%, £3,000"],
    ["Business Asset Disposal Relief lifetime limit", "£1 million", "<strong>£500,000</strong>"],
    ["Founders' relief (new, 10% CGT)", "—", "<strong>New</strong>: up to £10 million of gains"],
    ["Inheritance Tax nil-rate band / residence band", "£325,000 / £175,000", "£325,000 / £175,000"],
    ["ISA allowance", "£20,000", "£20,000"],
    ["Pension annual allowance", "£60,000", "£60,000"],
    ["Business mileage over 10,000 miles", "25p a mile", "<strong>35p a mile</strong>"],
    ["National Living Wage (21 and over, from 1 April)", "£12.71 an hour", "<strong>£13.21 an hour</strong>"]
  ];
  const body = section("glance", "What changes on 6 April 2027", site.table(["", "2026/27", "2027/28"], rows, 560) +
      p(`Bold figures change. Income tax bands, the Personal Allowance and most National Insurance thresholds stay frozen, so pay rises are taxed more as they push people into higher bands. Rates for England, Wales and Northern Ireland; Scotland sets its own income tax rates and bands, and Scotland and Wales can set their own property income rates.`)) +
    section("savings", "Savings and property income: a new 24% basic rate", p(`From 6 April 2027 savings income (interest) and property income (rent) have their own rates, each 4 points higher than the rates on wages: <strong>24% basic, 44% higher and 49% additional</strong>. The Personal Savings Allowance (£1,000 for basic-rate taxpayers, £500 at the higher rate) and the £5,000 starting rate for savings are unchanged, and interest in an ISA stays tax-free.`) +
      site.table(["Example", "2026/27", "2027/28", "Extra tax"], [
        ["Higher-rate taxpayer, £3,000 of interest", m0(s1o), m0(s1n), m0(s1n - s1o)],
        ["Basic-rate taxpayer, £2,000 of interest", m0(s2o), m0(s2n), m0(s2n - s2o)],
        ["Basic-rate landlord, £10,000 rental profit", m0(l1o), m0(l1n), m0(l1n - l1o)],
        ["Higher-rate landlord, £15,000 rental profit (all in the higher band)", m0(l2o), m0(l2n), m0(l2n - l2o)]
      ], 520) + p(`Savings interest after the Personal Savings Allowance; rental profit after expenses, all taxed in the one band. Work out interest on your own savings with the <a href="/savings/">savings calculator</a>.`)) +
    section("pensions", "Pensioners: the new Pension Tax Allowance", p(`The full new State Pension rises to <strong>£${sp.toFixed(2)} a week</strong> (£${spYear.toLocaleString("en-GB", { minimumFractionDigits: 2 })} a year), which is more than the £12,570 Personal Allowance. So that pensioners whose only income is the State Pension don't get small tax bills, a <strong>Pension Tax Allowance</strong> applies from 2027/28 to 2029/30: it takes 20% of the gap between the full new State Pension and the Personal Allowance off the tax bill, in full for income up to <strong>£13,037</strong>, withdrawn by £1 for every £3 above that and gone at £13,319.`) +
      p(`Also from 6 April 2027, most unused pension pots and pension death benefits count towards the value of an estate for <a href="/inheritance-tax-calculator/">Inheritance Tax</a>.`)) +
    section("selfemployed", "Side income and the self-employed", p(`The <strong>trading allowance</strong> triples from £1,000 to <strong>£3,000</strong>: if your gross income from selling, freelancing or a side business is £3,000 or less, you don't need to declare it or pay tax on it. Someone with ${m0(sale)} of side income and no claimed expenses paid tax on ${m0(sale - 1000)} at 20% (${m0(t1o)}) in 2026/27; in 2027/28 they pay ${m0(t1n)}.`) +
      p(`The Class 2 Small Profits Threshold rises to £7,355 and voluntary Class 2 contributions to £3.80 a week; Class 4 stays at 6% and 2%. Anyone joining Making Tax Digital for Income Tax in April 2027 won't get late-submission penalty points on quarterly updates for 2027/28. Estimate the bill with the <a href="/self-employed-tax-calculator/">self-employed tax calculator</a>.`)) +
    section("gains", "Selling a business or shares", p(`The lifetime limit for <strong>Business Asset Disposal Relief</strong> halves from £1 million to <strong>£500,000</strong> for disposals from 6 April 2027 (the rate stays 18%). A new <strong>Founders' relief</strong> taxes qualifying gains of founders and early investors in high-growth companies at <strong>10%</strong>, up to £10 million over a lifetime. Capital Gains Tax rates (18% and 24%) and the £3,000 annual exempt amount don't change; see the <a href="/capital-gains-tax-calculator/">capital gains tax calculator</a>.`)) +
    section("work", "Pay, benefits and employers", p(`The National Living Wage rises to <strong>£13.21 an hour</strong> from 1 April 2027 (18 to 20: £11.27; under 18 and apprentices: £8.31). Child Benefit goes up to £28.00 a week for the eldest child and £18.55 for others. Employers must put company cars, vans, fuel and medical benefits through payroll from 6 April 2027, so tax on them is taken from pay as it goes instead of through a P11D. The approved mileage rate above 10,000 business miles rises from 25p to 35p.`) +
      p(`Student loan thresholds for 2027/28: Plan 2 stays at £29,385, Plan 5 rises to £26,025 and the postgraduate (Plan 3) threshold stays at £21,000. See what you'll repay with the <a href="/student-loan-calculator/">student loan calculator</a>.`)) +
    section("other", "Bills and later changes", p(`The 0% VAT rate on household electricity and the 5p fuel duty cut both run until 30 June 2027; fuel duty then returns to its pre-2022 level and rises with inflation from 1 July 2027. Energy-saving materials go back to 5% VAT from 1 April 2027, and car tax (VED) rises with RPI inflation from the same date. Further ahead: pay-per-mile Electric Vehicle Excise Duty (3p a mile for electric cars) and the High Value Council Tax Surcharge on homes worth £2 million or more start in April 2028, and the cash ISA limit stays at £20,000.`));
  const q = [
    ["Is the Personal Allowance changing in April 2027?", "No. It stays at £12,570 in 2027/28, with the basic rate band at £37,700 and the additional rate from £125,140. All three are frozen in 2027/28."],
    ["What is the new tax rate on savings interest from April 2027?", "24% for basic-rate taxpayers, 44% for higher-rate and 49% for additional-rate, on interest above the Personal Savings Allowance (£1,000, or £500 for higher-rate taxpayers). ISAs stay tax-free."],
    ["How much is the State Pension from April 2027?", `The full new State Pension is £${sp.toFixed(2)} a week (£${spYear.toLocaleString("en-GB", { minimumFractionDigits: 2 })} a year), up from £241.30. The basic (old) State Pension is £192.10 a week.`],
    ["Will pensioners pay tax on the State Pension in 2027/28?", "Not if the State Pension is their only income: the new Pension Tax Allowance removes the tax on income up to £13,037, tapering away to £13,319."],
    ["What is the trading allowance from April 2027?", "£3,000, up from £1,000. If your total side income is no more than that you don't need to report it to HMRC."],
    ["What is the minimum wage from April 2027?", "£13.21 an hour for workers aged 21 and over, £11.27 for 18 to 20 year olds, and £8.31 for under-18s and apprentices, from 1 April 2027."]
  ];
  return { path: "/guides/tax-changes-2027-28/", crumb: "Tax Changes April 2027", blurb: "What changes in the 2027/28 tax year: new 24% savings and property rates, the Pension Tax Allowance, a £3,000 trading allowance and more.",
    title: site.fitTitle("UK Tax Changes April 2027 — What's New for the 2027/28 Tax Year", "UK Tax Changes April 2027 (2027/28)"), modified: "2026-11-26",
    desc: "Every UK tax change from 6 April 2027: 24% savings and property income tax, the Pension Tax Allowance, £250.70 State Pension, £3,000 trading allowance and £13.21 minimum wage, with examples.",
    h1: "UK tax changes from April 2027", sub: "What's different in the <strong>2027/28 tax year</strong>, which starts on 6 April 2027, from the Budget on 28 October 2026 — with what it means in pounds.",
    sections: [["glance", "At a glance"], ["savings", "Savings and property income"], ["pensions", "Pensioners"], ["selfemployed", "Side income and the self-employed"], ["gains", "Selling a business or shares"], ["work", "Pay, benefits and employers"], ["other", "Bills and later changes"]],
    tools: [["/salary/", "Take-home pay"], ["/savings/", "Savings"], ["/self-employed-tax-calculator/", "Self-employed tax"], ["/capital-gains-tax-calculator/", "Capital gains"], ["/tax-week-calendar/2027-28/", "Tax weeks 2027/28"]],
    body, q, callouts: ["/capital-gains-tax-calculator/", "/inheritance-tax-calculator/", "/isa-vs-pension/"],
    foot: `Figures from ${src(S.ootlar)} and ${src(S.annex)}, ${src(S.dwp)}, ${src(S.nmw)} and ${src(S.slc)}, read 26 November 2026. Measures in Finance Bill 2026-27 still need to pass Parliament. A guide, not tax advice.` };
}

/* ============================================ National Insurance */
function nationalInsurance() {
  const all = registry.readAll(), cur = registry.currentFiles(all);
  const gb = cur.gb.doc, se = cur["gb-se"].doc;
  const NI = gb.items.find((i) => i.id === "gb-ni").charge.brackets, C4 = se.items.find((i) => i.id === "gb-ni").charge.brackets;
  if (NI.length !== 3 || C4.length !== 3) throw new Error("NI guide: expected three bands");
  const [pt, mainR] = [NI[1][0], NI[1][1]], [uel, upR] = [NI[2][0], NI[2][1]], [lpl, c4R] = [C4[1][0], C4[1][1]], [upl, c4Up] = [C4[2][0], C4[2][1]];
  const seNote = se.items[0].note, c2At = +((/profits of £([\d,]+) or more/.exec(seNote) || [])[1] || "").replace(/,/g, ""), c2Vol = (/\(£([\d.]+) a week\)/.exec(se.notModelled.join(" ")) || [])[1];
  if (!c2At || !c2Vol) throw new Error("NI guide: Class 2 figures not found in the self-employed file");
  const R = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/uk/rates-2026-27.json"), "utf8")), E = R.employerNI, sp = R.pensions.statePensionWeekly;
  const ch = registry.chainFor(gb, all), sch = registry.chainFor(se, all), YEAR = gb.taxYear.label;
  const ni = (g) => TaxEngine.compute(ch, g, {}).values["gb-ni"] || 0, c4 = (g) => TaxEngine.compute(sch, g, {}).values["gb-ni"] || 0;
  const emp = (g) => Math.max(0, g - E.threshold) * E.rate / 100;
  if (Math.abs(ni(40000) - (40000 - pt) * mainR / 100) > 0.01) throw new Error("NI guide: engine and bands disagree");
  const rows = [15000, 20000, 30000, 40000, 50000, 60000, 80000, 100000].map((g) => [m0(g), m0(ni(g)), pct(ni(g) / g * 100), m0(emp(g)), m0(c4(g))]);
  const body = section("what", "What National Insurance is for", p(`National Insurance is a tax on earnings that also builds your right to the <strong>State Pension</strong> and some benefits. Each tax year you pay it (or get credits for, for example while unemployed, ill, or as a parent or carer) counts as a <em>qualifying year</em>. You need 10 qualifying years for any new State Pension and 35 for the full rate, currently <strong>£${sp.toFixed(2)} a week</strong>. Gaps can sometimes be filled with voluntary contributions.`)) +
    section("employees", "Employees: Class 1", p(`If you're employed you pay <strong>${mainR}%</strong> on earnings between ${m0(pt)} and ${m0(uel)} a year, and <strong>${upR}%</strong> on everything above ${m0(uel)}. It's worked out on each payday's earnings, not over the year as Income Tax is, and on gross pay: pension contributions under net pay or relief at source don't reduce it, but <a href="/salary-sacrifice-calculator/">salary sacrifice</a> does. You stop paying it once you reach State Pension age.`) +
      site.table(["Salary", "Your NI", "Share of pay", "Employer's NI", "If self-employed"], rows, 560) +
      p(`${YEAR} figures, paid evenly through the year. "If self-employed" is Class 4 on the same profit. Take-home pay with tax included is on the <a href="/salary/">salary calculator</a>.`)) +
    section("employers", "Employers' National Insurance", p(`Employers pay <strong>${E.rate}%</strong> on each employee's earnings above ${m0(E.threshold)} a year, on top of the salary, with no upper limit. Many can take up to <strong>${m0(E.employmentAllowance)}</strong> a year off the bill through the Employment Allowance (not companies whose only paid employee is the director). It's why salary sacrifice saves employers money too, and why company directors often pay themselves a small salary plus dividends: see <a href="/salary-vs-dividends/">salary vs dividends</a>.`)) +
    section("selfemployed", "Self-employed: Class 2 and Class 4", p(`On profits, the self-employed pay <strong>Class 4</strong>: ${c4R}% between ${m0(lpl)} and ${m0(upl)} and ${c4Up}% above, through Self Assessment. <strong>Class 2</strong> is no longer charged: with profits of ${m0(c2At)} or more it's treated as paid, so the year still counts for your State Pension, and below that you can pay it voluntarily at £${c2Vol} a week to keep the year. The <a href="/self-employed-tax-calculator/">self-employed tax calculator</a> works out both with Income Tax.`)) +
    section("record", "Checking your record", p(`Your National Insurance record and State Pension forecast are in your personal tax account and the HMRC app. They show which years count and whether filling a gap with voluntary Class 3 contributions would raise your State Pension.`));
  const q = [
    [`How much National Insurance do I pay on £30,000?`, `${m0(ni(30000))} a year in ${YEAR} if you're employed: ${mainR}% of the ${m0(30000 - pt)} above ${m0(pt)}. Self-employed, Class 4 on £30,000 of profit is ${m0(c4(30000))}.`],
    ["What is the National Insurance rate?", `${mainR}% on employees' earnings between ${m0(pt)} and ${m0(uel)} a year and ${upR}% above that; ${c4R}% and ${c4Up}% for the self-employed on profits; ${E.rate}% for employers above ${m0(E.threshold)}.`],
    ["How many years of National Insurance do I need for a full State Pension?", `35 qualifying years for the full new State Pension (£${sp.toFixed(2)} a week), and at least 10 to get any. Credits count, as do voluntary contributions.`],
    ["Do I pay National Insurance after State Pension age?", "No: employees stop paying Class 1 National Insurance once they reach State Pension age. Income Tax carries on as normal."],
    ["Does a pension contribution reduce National Insurance?", "Only through salary sacrifice, which lowers your pay before National Insurance is worked out. Contributions taken under net pay or paid through relief at source come off after National Insurance."]
  ];
  return { path: "/guides/national-insurance-explained/", crumb: "National Insurance Explained", blurb: "What National Insurance pays for, the rates for employees, employers and the self-employed, and how many years you need for a full State Pension.",
    title: site.fitTitle(`National Insurance Explained ${YEAR} — Rates, Thresholds & Your State Pension`, `National Insurance Explained (${YEAR})`), modified: gb.lastChecked,
    desc: `How UK National Insurance works in ${YEAR}: ${mainR}% and ${upR}% for employees, ${E.rate}% for employers, Class 2 and Class 4 for the self-employed, and the 35 qualifying years for a full State Pension.`,
    h1: "National Insurance explained", sub: `What it pays for, what you pay in <strong>${YEAR}</strong> as an employee, an employer or self-employed, and how it builds your State Pension.`,
    sections: [["what", "What it's for"], ["employees", "Employees"], ["employers", "Employers"], ["selfemployed", "Self-employed"], ["record", "Your record"]],
    tools: [["/salary/", "Take-home pay"], ["/self-employed-tax-calculator/", "Self-employed tax"], ["/salary-sacrifice-calculator/", "Salary sacrifice"], ["/salary-vs-dividends/", "Salary vs dividends"]],
    body, q, callouts: ["/salary-vs-dividends/", "/contractor-calculator/"],
    foot: `Rates from the ${YEAR} tax files (GOV.UK's <a href="https://www.gov.uk/national-insurance-rates-letters" rel="nofollow noopener" target="_blank">National Insurance rates</a> and <a href="https://www.gov.uk/self-employed-national-insurance-rates" rel="nofollow noopener" target="_blank">self-employed rates</a>), employer figures from <a href="${E.source}" rel="nofollow noopener" target="_blank">rates and thresholds for employers</a>, State Pension years from GOV.UK's <a href="https://www.gov.uk/new-state-pension/what-youll-get" rel="nofollow noopener" target="_blank">new State Pension</a>. A guide, not tax advice.` };
}

/* ================================================== Student loans */
function studentLoans() {
  const all = registry.readAll(), cur = registry.currentFiles(all), gb = cur.gb.doc, YEAR = gb.taxYear.label;
  const SL = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/student-loans/uk.json"), "utf8"));
  const cases = gb.items.find((i) => i.id === "gb-student-loan").charge.cases, pg = gb.items.find((i) => i.id === "gb-postgrad-loan").charge.cases.yes;
  const thr = (c) => c.of.max[1].sub[1], rate = cases.plan2.pct, pgThr = pg.of.max[1].sub[1], pgRate = pg.pct;
  const ch = registry.chainFor(gb, all);
  const repay = (g, plan) => TaxEngine.compute(ch, g, { studentLoan: plan }).values["gb-student-loan"] || 0;
  const plans = ["plan1", "plan2", "plan4", "plan5"];
  const intText = (pl) => pl.interest.flat !== undefined ? `${pl.interest.flat}%` : `${pl.interest.low}% to ${pl.interest.high}%`;
  const planRows = plans.map((k) => [SL.plans[k].name, esc(SL.plans[k].who), m0(thr(cases[k])), `${rate}%`, intText(SL.plans[k]), `${SL.plans[k].writeOffYears} years`])
    .concat([[SL.plans.postgrad.name, esc(SL.plans.postgrad.who), m0(pgThr), `${pgRate}%`, intText(SL.plans.postgrad), `${SL.plans.postgrad.writeOffYears} years`]]);
  const pays = [25000, 30000, 35000, 40000, 50000, 60000];
  const exRows = pays.map((g) => [m0(g)].concat(plans.map((k) => m0(repay(g, k)))));
  const p2 = SL.plans.plan2.interest;
  const body = section("plans", "Which plan you're on", p(`Which plan you have depends on where you lived and when your course started. You repay <strong>${rate}%</strong> of your income above your plan's threshold (${pgRate}% above ${m0(pgThr)} for a Postgraduate Loan, on top of any undergraduate plan), and whatever is left is written off after a set number of years.`) +
      site.table(["Plan", "Who", "Threshold", "Repay", "Interest now", "Written off after"], planRows, 640) +
      p(`${YEAR} thresholds; interest rates as GOV.UK gives them now (they change each September). Write-off counts from the April you were first due to repay.`)) +
    section("repayments", "What you repay", p(`Employees repay through PAYE, so it comes off each payslip alongside tax. Repayments depend only on what you earn, not on how much you owe: someone on ${m0(40000)} with Plan 2 repays ${m0(repay(40000, "plan2"))} a year whether they owe ${m0(20000)} or ${m0(60000)}.`) +
      site.table(["Salary", "Plan 1", "Plan 2", "Plan 4", "Plan 5"], exRows, 480) +
      p(`A year's repayments if paid evenly, from the same tax files as the <a href="/student-loan-calculator/">student loan calculator</a>, which also shows how the balance grows or shrinks over time.`)) +
    section("interest", "Interest and write-off", p(`Interest is added to the balance, not taken from your pay. Plan 2 charges ${p2.low}% on incomes up to ${m0(p2.lower)}, rising to ${p2.high}% at ${m0(p2.upper)} and above. Because repayments are a share of income above a threshold, many Plan 2 and Plan 5 borrowers never clear the balance and have the rest written off after ${SL.plans.plan2.writeOffYears} or ${SL.plans.plan5.writeOffYears} years: for them it works more like a ${rate}% tax on earnings above the threshold than a normal loan.`) +
      p(`That's why paying extra off early only helps if you'd otherwise clear the loan before write-off: usually higher earners or smaller balances. The <a href="/student-loan-calculator/">student loan calculator</a> projects your balance year by year so you can see which applies to you.`));
  const q = [
    [`How much is the Plan 2 student loan threshold?`, `${m0(thr(cases.plan2))} a year in ${YEAR}. You repay ${rate}% of your income above it: ${m0(repay(30000, "plan2"))} a year on ${m0(30000)}.`],
    ["How much will I repay on £40,000?", plans.map((k) => `${SL.plans[k].name} ${m0(repay(40000, k))}`).join(", ") + ` a year in ${YEAR}.`],
    ["When is a student loan written off?", plans.concat(["postgrad"]).map((k) => `${SL.plans[k].name} after ${SL.plans[k].writeOffYears} years`).join("; ") + ", counted from the April after you were first due to repay."],
    ["Should I pay off my student loan early?", "Only if you'd clear it before it's written off anyway: otherwise extra payments reduce a balance that would have been written off. It depends on your plan, balance and expected earnings, which the student loan calculator can project."]
  ];
  return { path: "/guides/student-loans-explained/", crumb: "Student Loans Explained", blurb: "The plans, the thresholds, what you repay at each salary, how interest works and when the loan is written off.",
    title: site.fitTitle(`Student Loans Explained ${YEAR} — Plans, Thresholds, Interest & Write-Off`, `Student Loans Explained (${YEAR})`), modified: SL.lastChecked,
    desc: `How UK student loan repayments work in ${YEAR}: Plan 1, 2, 4 and 5 and Postgraduate thresholds, ${rate}% of income above them, interest rates, write-off dates and what you repay at each salary.`,
    h1: "Student loans explained", sub: `Which plan you're on, what you repay in <strong>${YEAR}</strong>, how the interest works and when the rest is written off.`,
    sections: [["plans", "The plans"], ["repayments", "What you repay"], ["interest", "Interest and write-off"]],
    tools: [["/student-loan-calculator/", "Student loan calculator"], ["/salary/", "Take-home pay"], ["/degree-classification-calculator/", "Degree classification"]],
    body, q, callouts: ["/student-loan-calculator/", "/degree-classification-calculator/"],
    foot: `Thresholds and rates from the ${YEAR} UK tax file; interest and write-off from GOV.UK's <a href="${SL.sources[0].url}" rel="nofollow noopener" target="_blank">${esc(SL.sources[0].title)}</a> and <a href="${SL.sources[1].url}" rel="nofollow noopener" target="_blank">${esc(SL.sources[1].title)}</a> (checked ${site.niceDate(SL.lastChecked)}). A guide, not financial advice.` };
}

/* ================================================== ISAs and pensions */
function isaPension() {
  const PR = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/uk/pension-tax-relief.json"), "utf8"));
  const R = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/uk/rates-2026-27.json"), "utf8")), P = R.pensions, YEAR = R.taxYear;
  const isa = 20000, lisa = 4000, tf = P.taxFreePct;
  /* £100 into a pension vs the same cost into an ISA, taking the pension out at 20% */
  const outRate = (rateNow, rateLater) => { const cost = 100 * (1 - rateNow / 100); const pension = 100 * (tf / 100) + 100 * (1 - tf / 100) * (1 - rateLater / 100); return [cost, pension, cost]; };
  const cases = [["Basic rate now, basic rate in retirement", 20, 20], ["Higher rate now, basic rate in retirement", 40, 20], ["Basic rate now, no tax in retirement", 20, 0], ["Higher rate now, higher rate in retirement", 40, 40]]
    .map(([l, a, b]) => { const [cost, pen, isaV] = outRate(a, b); return [l, m2(cost), m2(pen), m2(isaV)]; });
  const body = section("isa", "ISAs: tax-free, any time", p(`You can put up to <strong>${m0(isa)}</strong> a year (${YEAR}) into ISAs, split across cash, stocks and shares, innovative finance and Lifetime ISAs as you like (at most ${m0(lisa)} into a Lifetime ISA). There's no tax relief going in, but interest, dividends and gains are tax-free and you can take money out whenever you like.`)) +
    section("pension", "Pensions: relief now, tax later", p(`Money paid into a pension gets tax relief: with relief at source you pay ${100 - PR.basicRelief}p and the provider claims ${PR.basicRelief}p from the government, and higher and additional rate taxpayers claim more back. You can get relief on up to ${PR.earningsLimitPct}% of your earnings (${m0(PR.noEarningsGross)} gross if you have none), within the <strong>${m0(PR.annualAllowance)}</strong> annual allowance. Workplace pensions usually add an employer contribution too, which an ISA can't match.`) +
      p(`The catch is access: you usually can't take money out until 55 at the earliest. Then up to <strong>${tf}%</strong> is tax-free (at most ${m0(P.lumpSumAllowance)} over your lifetime) and the rest is taxed as income. From April 2027 most unused pension pots will also count towards your estate for Inheritance Tax.`)) +
    section("compare", "Which leaves more?", p(`The same £100 of pre-tax income, put in either. Into a pension it all goes in; into an ISA you pay tax first. Taking the pension out, ${tf}% is tax-free and the rest is taxed at your rate in retirement. (Growth is the same in both, so it doesn't change which wins.)`) +
      site.table(["", "Cost to you", "Pension, after tax", "ISA"], cases, 520) +
      p(`Because of the ${tf}% tax-free part, a pension usually comes out ahead unless you'd pay more tax in retirement than now, and the gap is widest for higher-rate taxpayers and with an employer contribution. An ISA wins on flexibility: it's yours to spend at any age. Try your own numbers in the <a href="/isa-vs-pension/">ISA vs pension calculator</a>, and see the relief on a contribution with the <a href="/pension-tax-relief-calculator/">pension tax relief calculator</a>.`));
  const q = [
    ["Is a pension better than an ISA?", `For retirement saving, usually yes for the same cost: tax relief going in and ${tf}% tax-free coming out beat an ISA unless you'll pay a higher rate of tax in retirement than now. An ISA is better for money you might need before 55.`],
    [`How much can I put in an ISA in ${YEAR}?`, `${m0(isa)} in total across all your ISAs, of which at most ${m0(lisa)} can go into a Lifetime ISA.`],
    ["How much can I pay into a pension?", `Up to ${PR.earningsLimitPct}% of your earnings with tax relief, within the ${m0(PR.annualAllowance)} annual allowance (lower for very high earners). With no earnings you can still pay in ${m0(PR.noEarningsNet)}, which becomes ${m0(PR.noEarningsGross)} with relief.`],
    ["How much of my pension can I take tax-free?", `Usually ${tf}%, up to ${m0(P.lumpSumAllowance)} in total across your pensions. The rest is taxed as income when you take it.`],
    ["When can I take money out of my pension?", "Usually from 55 at the earliest, depending on your scheme's rules. ISAs can be taken out at any time (a Lifetime ISA has its own rules and a charge for early withdrawal)."]
  ];
  return { path: "/guides/isa-vs-pension-explained/", crumb: "ISA vs Pension Explained", blurb: "How ISAs and pensions are taxed, the allowances, when you can get at the money, and which leaves you more.",
    title: site.fitTitle(`ISA vs Pension Explained ${YEAR} — Tax Relief, Allowances & Which Is Better`, `ISA vs Pension Explained (${YEAR})`), modified: PR.lastChecked,
    desc: `ISAs and pensions compared for ${YEAR}: the ${m0(isa)} ISA allowance, pension tax relief and the ${m0(PR.annualAllowance)} annual allowance, ${tf}% tax-free at 55, and which leaves you more after tax.`,
    h1: "ISA vs pension explained", sub: `How each is taxed, the <strong>${YEAR}</strong> allowances, when you can get at your money, and which comes out ahead.`,
    sections: [["isa", "ISAs"], ["pension", "Pensions"], ["compare", "Which leaves more"]],
    tools: [["/isa-vs-pension/", "ISA vs pension"], ["/pension-tax-relief-calculator/", "Pension tax relief"], ["/salary-sacrifice-calculator/", "Salary sacrifice"], ["/compound-interest/", "Compound interest"]],
    body, q, callouts: ["/compound-interest/", "/pension-drawdown-calculator/"],
    foot: `Pension rules from GOV.UK's <a href="${PR.sources[0].url}" rel="nofollow noopener" target="_blank">pension tax relief</a> and <a href="${P.source}" rel="nofollow noopener" target="_blank">lump sum allowance</a> pages (checked ${site.niceDate(PR.lastChecked)}); ISA limits from GOV.UK's <a href="https://www.gov.uk/individual-savings-accounts" rel="nofollow noopener" target="_blank">Individual Savings Accounts</a>; access age from <a href="https://www.gov.uk/pension-types" rel="nofollow noopener" target="_blank">Pension types</a>. A guide, not financial advice.` };
}

/* ============================================ Why tax codes change */
function taxCodeChanges() {
  const { R } = require("./lib/tax-code-rules.js")();
  const pa = R.personalAllowance, std = pa / 10 + "L";
  const reasons = ["you start a new job", "you get taxable state benefits", "you start to get income from an additional job or pension", "the interest on your savings is more than your Personal Savings Allowance", "your weekly State Pension amount changes", "your employer tells HMRC you have started or stopped getting benefits from your job", "you claim Marriage Allowance", "you claim expenses that you get tax relief on", "you're paying the High Income Child Benefit Charge through your wages or pension", "you need to pay back the Winter Fuel Payment or Pension Age Winter Heating Payment", "you've been on the wrong tax code and owe tax"];
  const body = section("why", "Why HMRC changes your code", p(`HMRC changes your tax code when you need to pay a different amount of tax, usually because your income or circumstances have changed. GOV.UK lists these as the usual reasons:`) +
      `      <ul class="about-list">${reasons.map((r) => `<li>${esc(r.charAt(0).toUpperCase() + r.slice(1))}</li>`).join("")}</ul>\n` +
      p(`Starting a job without a P45 can also put you on an emergency code for a while.`)) +
    section("read", "Reading the new code", p(`The number, times 10, is the tax-free income you get from that job or pension; the letter describes your situation. The standard code is <strong>${std}</strong> (${m0(pa)} tax-free). A lower number usually means HMRC has taken something off your allowance, such as a company benefit, untaxed income or tax owed from an earlier year: a ${m0(1570)} medical insurance benefit turns ${std} into 1100L. M or N at the end means Marriage Allowance; K means the deductions are bigger than the allowance. Type yours into the <a href="/tax-code-checker/">tax code checker</a> for what it means and the tax it takes.`)) +
    section("wrong", "If you think it's wrong", p(`HMRC sets codes from what your employer, pension provider or benefits office tell it, so a wrong code usually means missing or wrong information. Check and update your jobs, pensions, estimated income, company benefits and expenses online or in the HMRC app. If a change is needed, HMRC tells you and your employer within <strong>15 working days</strong>; it should appear on your next or following payslip if you're paid monthly, or your third payslip if weekly. If you've just started a job, wait 35 days for HMRC to get your details before contacting it.`)) +
    section("money", "Getting tax back, or paying what you owe", p(`When your code is corrected, HMRC works out what you've over- or underpaid. Overpaid tax usually comes back through your pay with the new code; if HMRC doesn't have all your details yet, it settles up after the tax year ends and sends a tax calculation letter (P800). Underpaid tax is usually collected through your code over one or more years. The <a href="/tax-refund-calculator/">tax refund calculator</a> estimates which way it'll go.`));
  const q = [
    ["Why has my tax code changed?", "Usually because something HMRC knows about your income has changed: a new or second job or pension, a company benefit starting or stopping, savings interest above your allowance, a State Pension change, claiming Marriage Allowance or expenses, the High Income Child Benefit Charge, or tax owed from an earlier year."],
    ["Why has my tax code gone down?", `HMRC has taken something off your ${m0(pa)} allowance: commonly a company benefit like a car or medical insurance, untaxed income, the High Income Child Benefit Charge, or collecting tax you owe from a previous year. Your tax code notice or the HMRC app shows the breakdown.`],
    ["How long does it take for a new tax code to show on my payslip?", "HMRC tells you and your employer within 15 working days. Paid monthly, it should be on your next or following payslip; paid weekly, your third."],
    ["Will I get a refund if my tax code was wrong?", "If you paid too much, yes: usually through your pay once the code is fixed, or after the tax year ends if HMRC is still missing details."]
  ];
  return { path: "/guides/why-has-my-tax-code-changed/", crumb: "Why Has My Tax Code Changed?", blurb: "The usual reasons HMRC changes your code, how to read the new one, and what to do if it's wrong.",
    title: site.fitTitle("Why Has My Tax Code Changed? Reasons, Fixes and Refunds", "Why Has My Tax Code Changed?"), modified: JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/uk/tax-codes.json"), "utf8")).lastChecked,
    desc: `Why HMRC changes your tax code, how to read the new one (${std}, lower codes, M, N, K, emergency codes), how to correct it, how long it takes, and how over- or underpaid tax is settled.`,
    h1: "Why has my tax code changed?", sub: "The usual reasons HMRC changes your code, what the new one means, and what to do if it's wrong.",
    sections: [["why", "Why it changes"], ["read", "Reading the new code"], ["wrong", "If it's wrong"], ["money", "Refunds and underpayments"]],
    tools: [["/tax-code-checker/", "Tax code checker"], ["/tax-refund-calculator/", "Tax refund"], ["/marriage-allowance-calculator/", "Marriage Allowance"], ["/salary/", "Take-home pay"]],
    body, q, callouts: ["/tax-code-checker/", "/tax-refund-calculator/"],
    foot: `From GOV.UK's <a href="https://www.gov.uk/tax-codes" rel="nofollow noopener" target="_blank">Tax codes</a> guide (why your tax code might change, what it means, if you think it's wrong, if you've paid too much or too little) and <a href="https://www.gov.uk/tax-overpayments-and-underpayments" rel="nofollow noopener" target="_blank">Tax overpayments and underpayments</a>. A guide, not tax advice.` };
}

/* ============================================ Before 5 April */
function taxYearEnd() {
  const J = (f) => JSON.parse(fs.readFileSync(path.join(site.ROOT, f), "utf8"));
  const MA = J("data/uk/marriage-allowance.json"), PR = J("data/uk/pension-tax-relief.json"), R = J("data/uk/rates-2026-27.json"), CB = J("data/uk/child-benefit.json"), MI = J("data/uk/mileage.json");
  const YEAR = R.taxYear, end = `5 April ${Number(YEAR.slice(0, 4)) + 1}`, back = MA.backdateYears.length * MA.maxSaving;
  const nextSA = `31 January ${Number(YEAR.slice(0, 4)) + 1}`, prevYear = `${Number(YEAR.slice(0, 4)) - 1}/${YEAR.slice(2, 4)}`;
  const body = section("marriage", "Claim Marriage Allowance, including the backdated years", p(`If you're married or in a civil partnership and one of you earns less than the Personal Allowance, the lower earner can transfer ${m0(MA.transfer)} of it, cutting the other's tax by up to <strong>${m0(MA.maxSaving)}</strong> a year. GOV.UK lets you backdate a claim to 6 April 2022 (the 2022 to 2023 tax year) for any year you were both eligible: ${esc(MA.backdateYears.join(", "))}, up to <strong>${m0(back)}</strong> on top of this year. Backdating only reaches back a limited number of years, so if you've been eligible since 2022 and haven't claimed, applying before ${end} is the safe way to make sure 2022/23 is included. The <a href="/marriage-allowance-calculator/">Marriage Allowance calculator</a> shows what you'd get.`)) +
    section("isa", "Use this year's ISA allowance", p(`Every tax year you can save up to <strong>${m0(20000)}</strong> in ISAs (at most ${m0(4000)} of it in a Lifetime ISA), and the tax year runs from 6 April to 5 April, so money meant for the ${YEAR} allowance has to go in by ${end}. Interest, dividends and gains inside an ISA are tax-free, and the accounts don't close when the tax year ends.`)) +
    section("pension", "Top up your pension", p(`Pension contributions get tax relief within the <strong>${m0(PR.annualAllowance)}</strong> annual allowance for the tax year, and you might be able to carry over allowance you didn't use in the previous 3 tax years. Contributions also reduce your adjusted net income, which matters in two places:`) +
      `      <ul class="about-list"><li>Between ${m0(100000)} and ${m0(125140)}, where you lose £1 of Personal Allowance for every £2: paying in enough to bring your income back to ${m0(100000)} keeps it. See the <a href="/bonus-tax-calculator/">bonus tax calculator</a> and <a href="/salary-sacrifice-calculator/">salary sacrifice calculator</a>.</li><li>Above ${m0(CB.charge.threshold)}, where the High Income Child Benefit Charge takes back 1% of Child Benefit for every ${m0(CB.charge.step)}: the <a href="/child-benefit-tax-charge-calculator/">Child Benefit charge calculator</a> shows how much a contribution saves.</li></ul>\n` +
      p(`The <a href="/pension-tax-relief-calculator/">pension tax relief calculator</a> works out the relief on a contribution.`)) +
    section("allowances", "Use your other yearly allowances", p(`The capital gains tax-free allowance is <strong>${m0(R.capitalGains.allowance)}</strong> and the dividend allowance <strong>${m0(R.dividends.allowance)}</strong> for ${YEAR}. Both are for the tax year, so if you're selling investments outside an ISA, gains made before ${end} use this year's allowance and gains after it use next year's. The <a href="/capital-gains-tax-calculator/">capital gains tax calculator</a> and <a href="/dividend-tax-calculator/">dividend tax calculator</a> show the tax either side.`)) +
    section("claims", "Claim job expenses and mileage you've paid for", p(`You can claim tax relief on things you had to pay for to do your job, such as business mileage in your own vehicle, uniforms, tools and professional fees, for the current tax year and the 4 previous tax years. HMRC's approved rate for cars is ${MI.years["2026-27"].car[0]}p a mile for the first 10,000 business miles from 6 April 2026 (${MI.years.before.car[0]}p before), and if your employer pays less you can claim relief on the difference: the <a href="/mileage-allowance-calculator/">mileage allowance calculator</a> works it out. If you've been on the wrong tax code, the <a href="/tax-refund-calculator/">tax refund calculator</a> estimates what you're owed.`)) +
    section("sa", "Self Assessment", p(`The online tax return for the ${prevYear} tax year, and any tax owed for it, are due by <strong>${nextSA}</strong>. The <a href="/guides/self-assessment-explained/">Self Assessment guide</a> covers the deadlines, payments on account and penalties.`));
  const q = [
    ["How far back can I claim Marriage Allowance?", `GOV.UK lets you backdate a claim to 6 April 2022 (the 2022 to 2023 tax year) for any year you were eligible, which with this year is up to ${m0(back + MA.maxSaving)}.`],
    [`When is the ISA deadline for ${YEAR}?`, `${end}, the last day of the tax year. You can save up to ${m0(20000)} in ISAs each tax year.`],
    ["Can I use unused pension allowance from previous years?", `You might be able to carry over annual allowance you didn't use in the previous 3 tax years, once you've used all of this year's ${m0(PR.annualAllowance)}.`],
    ["How far back can I claim tax relief on work expenses?", "For the current tax year and the 4 previous tax years, including mileage in your own vehicle."],
    ["When does the tax year end?", `On 5 April. The ${YEAR} tax year ends on ${end} and the next one starts on 6 April.`]
  ];
  return { path: "/guides/before-the-tax-year-ends/", crumb: "Before the Tax Year Ends", blurb: `Things to do before ${end}: Marriage Allowance backdating, ISA and pension allowances, and claims you can still make.`,
    title: site.fitTitle(`Before ${end}: Tax Year End Checklist (${YEAR})`, `Tax Year End Checklist ${YEAR}`), modified: MA.lastChecked,
    desc: `What to do before the tax year ends on ${end}: claim Marriage Allowance back to 2022, use your ${m0(20000)} ISA allowance and pension allowance, the CGT and dividend allowances, and claims for expenses and mileage.`,
    h1: `Before the tax year ends on ${end}`, sub: "The allowances you lose if you don't use them, and the claims to make while you still can.",
    sections: [["marriage", "Marriage Allowance"], ["isa", "ISA allowance"], ["pension", "Pensions"], ["allowances", "CGT and dividends"], ["claims", "Expenses and mileage"], ["sa", "Self Assessment"]],
    tools: [["/marriage-allowance-calculator/", "Marriage Allowance"], ["/pension-tax-relief-calculator/", "Pension tax relief"], ["/isa-vs-pension/", "ISA vs pension"], ["/mileage-allowance-calculator/", "Mileage allowance"]],
    body, q, callouts: ["/marriage-allowance-calculator/", "/mileage-allowance-calculator/"],
    foot: `From GOV.UK's <a href="${MA.source.url}" rel="nofollow noopener" target="_blank">Marriage Allowance</a>, <a href="https://www.gov.uk/individual-savings-accounts" rel="nofollow noopener" target="_blank">ISAs</a>, <a href="https://www.gov.uk/tax-on-your-private-pension/annual-allowance" rel="nofollow noopener" target="_blank">pension annual allowance</a>, <a href="https://www.gov.uk/guidance/adjusted-net-income" rel="nofollow noopener" target="_blank">adjusted net income</a> and <a href="https://www.gov.uk/tax-relief-for-employees" rel="nofollow noopener" target="_blank">job expenses</a> pages, with the allowances from the site's ${YEAR} rates file. A guide, not tax advice.` };
}

/* ============================================ US 2027 tax brackets */
function usBrackets2027() {
  const J = (f) => JSON.parse(fs.readFileSync(path.join(site.ROOT, f), "utf8"));
  const f27 = J("data/tax/us/us.2027.json"), f26 = J("data/tax/us/us.2026.json");
  const it = (d, id) => d.items.find((i) => i.id === id);
  const br = (d, s) => it(d, "us-income-tax").charge.brackets.status[s];
  const sd = (d, s) => it(d, "us-standard-deduction").value.status[s];
  const usd = (v) => "$" + Math.round(v).toLocaleString("en-US"), usd2 = (v) => "$" + v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  /* head of household and married filing separately aren't in the tax file: Rev. Proc. 2026-35 Tables 2 and 4 */
  const HOH = [[0, 10], [18250, 12], [69650, 22], [109100, 24], [208300, 32], [264550, 35], [661350, 37]], HOH_SD = 24925;
  const MFS = [[0, 10], [12800, 12], [52025, 22], [109125, 24], [208325, 32], [264550, 35], [396825, 37]];
  const CG = [["Single", 51050, 563200], ["Married filing jointly", 102100, 633600], ["Head of household", 68350, 598400], ["Married filing separately", 51050, 316800]];
  const tax = (b, x) => b.reduce((t, [lo, r], i) => { const hi = i + 1 < b.length ? b[i + 1][0] : Infinity; return x > lo ? t + (Math.min(x, hi) - lo) * r / 100 : t; }, 0);
  if (Math.round(tax(br(f27, "single"), 264550)) !== 60349 || Math.round(tax(br(f27, "married"), 529100)) !== 120698 || Math.round(tax(HOH, 264550)) !== 58480 || Math.round(tax(MFS, 264550)) !== 60349) throw new Error("US 2027 guide: bracket sums don't match Rev. Proc. 2026-35's tables");
  const rows = (b, prev) => b.map(([lo, r], i) => {
    const hi = i + 1 < b.length ? b[i + 1][0] : null, label = hi ? `${usd(lo === 0 ? 0 : lo + 1)} to ${usd(hi)}` : `Over ${usd(lo)}`;
    return [`${r}%`, label].concat(prev ? [prev[i] ? (prev[i][0] === 0 ? "—" : `${usd(prev[i][0])}`) : ""] : []);
  });
  const bands = (s) => rows(br(f27, s)).map((r, i) => r.concat([i === 0 ? "—" : usd(br(f26, s)[i][0])]));
  const v = (d, id) => { const x = it(d, id); return x.value || x.charge; };
  const k401 = v(f27, "us-401k-amount").min[1], ss = it(f27, "us-social-security").charge.of.min[1], ss26 = it(f26, "us-social-security").charge.of.min[1];
  const ctc = it(f27, "us-ctc-max").value.taper.mul[0], actc = it(f27, "us-actc").value.min[1].mul[0];
  const ex = [["Single", "single", 75000], ["Single", "single", 150000], ["Married filing jointly", "married", 150000], ["Married filing jointly", "married", 300000]].map(([n, s, g]) => {
    const ti = Math.max(0, g - sd(f27, s)), t = tax(br(f27, s), ti), t26 = tax(br(f26, s), Math.max(0, g - sd(f26, s)));
    const top = br(f27, s).filter(([lo]) => ti > lo).pop()[1];
    return [`${n}, ${usd(g)}`, usd(ti), usd2(t), `${(Math.round(t / g * 1000) / 10).toFixed(1)}%`, `${top}%`, usd2(t26 - t)];
  });
  const s75 = tax(br(f27, "single"), 75000 - sd(f27, "single"));
  const body = section("brackets", "2027 federal income tax brackets", p(`The IRS sets the 2027 brackets in Revenue Procedure 2026-35. The seven rates stay at 10%, 12%, 22%, 24%, 32%, 35% and 37%; the income levels they start at rise with inflation. They apply to income earned in 2027, so to the tax return you file in 2028, and to withholding from your paychecks from January 2027.`) +
      `      <h3 class="tool-section-title" style="font-size:1rem;margin-top:14px;">Single</h3>\n` + site.table(["Rate", "Taxable income 2027", "2026 starting point"], bands("single"), 520) +
      `      <h3 class="tool-section-title" style="font-size:1rem;margin-top:14px;">Married filing jointly</h3>\n` + site.table(["Rate", "Taxable income 2027", "2026 starting point"], bands("married"), 520) +
      `      <h3 class="tool-section-title" style="font-size:1rem;margin-top:14px;">Head of household</h3>\n` + site.table(["Rate", "Taxable income 2027"], rows(HOH), 420) +
      `      <h3 class="tool-section-title" style="font-size:1rem;margin-top:14px;">Married filing separately</h3>\n` + site.table(["Rate", "Taxable income 2027"], rows(MFS), 420)) +
    section("deduction", "The 2027 standard deduction", site.table(["Filing status", "2027", "2026"], [["Single or married filing separately", usd(sd(f27, "single")), usd(sd(f26, "single"))], ["Married filing jointly", usd(sd(f27, "married")), usd(sd(f26, "married"))], ["Head of household", usd(HOH_SD), ""]], 440) +
      p(`Taxable income is your income less the standard deduction (or your itemized deductions if they're bigger). If you're 65 or older or blind, the standard deduction is $1,700 more for each, or $2,100 if you're also unmarried and not a surviving spouse.`)) +
    section("example", "How much tax you'll pay", p(`Brackets are marginal: each rate applies only to the slice of income inside its band. A single filer earning ${usd(75000)} in wages has ${usd(75000 - sd(f27, "single"))} of taxable income after the ${usd(sd(f27, "single"))} standard deduction: 10% on the first $12,800, 12% up to $52,025 and 22% on the rest, <strong>${usd2(s75)}</strong> in all. That's ${(Math.round(s75 / 75000 * 1000) / 10).toFixed(1)}% of their pay, although their top rate is 22%.`) +
      site.table(["Example (wages only)", "Taxable income", "Federal income tax 2027", "Share of pay", "Top rate", "Less than 2026"], ex, 620) +
      p(`Social Security and Medicare come on top, and most states add their own income tax: the <a href="/salary/">salary calculator</a> works out take-home pay for every state.`)) +
    section("other", "Other 2027 figures", `      <ul class="about-list"><li><strong>401(k):</strong> you can defer up to ${usd(k401)} (from $24,500).</li><li><strong>Child Tax Credit:</strong> up to ${usd(ctc)} a child under 17, of which up to ${usd(actc)} can be refunded.</li><li><strong>Social Security:</strong> 6.2% on wages up to ${usd(ss)} (from ${usd(ss26)}); Medicare 1.45% on all wages, plus 0.9% above $200,000.</li><li><strong>Long-term capital gains and qualified dividends:</strong> 0% up to the amounts below, 15% up to the next, 20% above.</li></ul>\n` +
      site.table(["Filing status", "0% up to", "15% up to"], CG.map(([n, a, b]) => [n, usd(a), usd(b)]), 440));
  const q = [
    ["What are the 2027 tax brackets?", `For single filers: 10% up to $12,800 of taxable income, 12% to $52,025, 22% to $109,125, 24% to $208,325, 32% to $264,550, 35% to $661,375 and 37% above. Married couples filing jointly: 10% to $25,600, 12% to $104,050, 22% to $218,250, 24% to $416,650, 32% to $529,100, 35% to $793,650 and 37% above.`],
    ["What is the 2027 standard deduction?", `${usd(sd(f27, "single"))} for single filers and married filing separately, ${usd(sd(f27, "married"))} for married couples filing jointly and ${usd(HOH_SD)} for heads of household.`],
    [`How much federal tax will I pay on ${usd(75000)} in 2027?`, `As a single filer with only wages and the standard deduction, ${usd2(s75)} of federal income tax, plus Social Security and Medicare of ${usd2(75000 * 0.0765)}.`],
    ["When do the 2027 tax brackets apply?", "To income earned from 1 January to 31 December 2027, reported on the tax return you file in 2028. Paycheck withholding switches to them in January 2027."],
    ["What is the 2027 401(k) contribution limit?", `${usd(k401)} of elective deferrals, up from $24,500 in 2026.`]
  ];
  return { path: "/guides/us-tax-brackets-2027/", crumb: "US Tax Brackets 2027", blurb: "The 2027 federal income tax brackets and standard deduction for every filing status, with worked examples and the other new limits.",
    title: site.fitTitle("2027 Tax Brackets and Standard Deduction (IRS) — Rates, Examples, Changes", "2027 Tax Brackets and Standard Deduction"), modified: f27.lastChecked,
    desc: `The 2027 federal tax brackets for single, married and head of household filers, the ${usd(sd(f27, "single"))} / ${usd(sd(f27, "married"))} standard deduction, how much tax you'll pay, and the 2027 401(k), Child Tax Credit and Social Security figures.`,
    h1: "2027 federal tax brackets", sub: "The IRS's 2027 rates, brackets and standard deduction, what they mean for your tax, and the other limits that change.",
    sections: [["brackets", "Brackets"], ["deduction", "Standard deduction"], ["example", "Worked examples"], ["other", "Other 2027 figures"]],
    tools: [["/salary/", "Take-home pay"], ["/pay-rise-calculator/", "Pay rise"], ["/net-to-gross-salary/", "Net to gross"], ["/roth-vs-traditional/", "Roth vs traditional"]],
    body, q, callouts: ["/salary/", "/pay-rise-calculator/"],
    foot: `From IRS <a href="https://www.irs.gov/pub/irs-drop/rp-26-35.pdf" rel="nofollow noopener" target="_blank">Revenue Procedure 2026-35</a> (Tables 1 to 4, sections .03, .05 and .15), IRS <a href="https://www.irs.gov/pub/irs-drop/n-26-66.pdf" rel="nofollow noopener" target="_blank">Notice 2026-66</a> and the SSA's <a href="https://public-inspection.federalregister.gov/2026-21796.pdf" rel="nofollow noopener" target="_blank">2027 wage base notice</a>. Not tax advice.` };
}

/* ===================================================== build */
/* ============================================ having a baby */
function havingABaby() {
  const J = (f) => JSON.parse(fs.readFileSync(path.join(site.ROOT, f), "utf8"));
  const R = J("data/uk/rates-2026-27.json"), S = R.statutoryPay, PP = J("data/uk/paternity-pay.json"), CB = J("data/uk/child-benefit.json"), UC = J("data/uk/universal-credit.json"), T = J("data/uk/tax-free-childcare.json");
  const Pat = require("../paternity-pay.js"), YEAR = PP.taxYear;
  if (S.smpWeekly !== PP.weeklyRate) throw new Error("having a baby guide: the maternity and paternity rates in the data files differ");
  const awe = 30000 / 52, smp = Pat.smp(PP, awe, PP.smpWeeks), first6 = Math.round(awe * PP.earningsPct / 100 * 100) / 100, sh = Pat.shareable(PP, 22, 22);
  const cbYear = (CB.rates.eldest + CB.rates.additional) * CB.rates.weeksInYear;
  const body = section("maternity", "Maternity pay", p(`Statutory Maternity Pay is paid for up to ${PP.smpWeeks} weeks: <strong>90% of your average weekly earnings for the first 6 weeks</strong>, then <strong>${m2(S.smpWeekly)} a week</strong> or 90%, whichever is lower, for the other 33 (${YEAR}). You need average earnings of at least £${S.lowerEarningsLimit} a week. On ${m0(30000)} a year (${m2(awe)} a week) that's ${m2(first6)} a week for 6 weeks and ${m2(S.smpWeekly)} after: <strong>${m2(smp)}</strong> in all, before tax. Your employer may pay more under a company scheme. The <a href="/maternity-pay-calculator/">maternity pay calculator</a> works it out for your pay.`)) +
    section("paternity", "Paternity pay and leave", p(`Your partner can take up to ${PP.paternityWeeks} weeks of Paternity Leave, together or as two separate weeks, any time from the birth until 52 weeks after it. Statutory Paternity Pay is ${m2(PP.weeklyRate)} a week or ${PP.earningsPct}% of average weekly earnings, whichever is lower, for those weeks: up to ${m2(PP.weeklyRate * PP.paternityWeeks)}. They need 26 weeks with their employer by the 15th week before the due date and average earnings of at least £${PP.minAverageWeekly} a week. Tax and National Insurance come off.`)) +
    section("shared", "Shared Parental Leave and Pay", p(`You can share up to <strong>${PP.sharedLeaveMax} weeks of leave</strong> and <strong>${PP.sharedPayMax} weeks of pay</strong> between you in the first year, by ending maternity leave and pay early. Shared Parental Pay is the same ${m2(PP.weeklyRate)} a week or 90% of earnings, whichever is lower. GOV.UK's example: after 22 weeks of maternity leave and pay, you can share ${sh.leave} weeks of leave and ${sh.pay} weeks of pay. You give your employer 8 weeks' notice. The <a href="/paternity-pay-calculator/">paternity pay calculator</a> shows what's left to share.`)) +
    section("childbenefit", "Child Benefit", p(`Child Benefit is <strong>${m2(CB.rates.eldest)} a week</strong> for the eldest or only child and ${m2(CB.rates.additional)} for each other child: ${m0(cbYear)} a year for two children. If either parent's adjusted net income is over ${m0(CB.charge.threshold)}, the High Income Child Benefit Charge takes back 1% for every ${m0(CB.charge.step)} above it, all of it from ${m0(CB.charge.full)}; the <a href="/child-benefit-tax-charge-calculator/">Child Benefit charge calculator</a> works it out.`)) +
    section("uc", "Universal Credit", p(`If you get Universal Credit, it adds <strong>${m2(UC.child)} a month</strong> for each child (${YEAR}); the 2-child limit ended on 6 April 2026, so that's every child. Having a child also gives you a work allowance, so you can earn ${m0(UC.workAllowance.withoutHousing)} a month (${m0(UC.workAllowance.withHousing)} with help for housing) before it starts to reduce by 55p for each £1. The <a href="/universal-credit-calculator/">Universal Credit calculator</a> estimates it.`)) +
    section("childcare", "Help with childcare", p(`When you go back to work, there are two main ways to get help with childcare costs, and you can't have both. <strong>Tax-Free Childcare</strong> adds £${T.topUpPer} for every £${T.payIn} you pay in, up to ${m0(T.maxYear)} a year per child (${m0(T.maxYearDisabled)} if disabled), if you each earn at least ${m2(T.minEarnQuarter["21+"])} over 3 months and neither has income over ${m0(T.incomeLimit)}. <strong>Universal Credit</strong> pays back up to ${UC.childcarePct}% of costs, up to ${m2(UC.childcareMax.one)} a month for one child, but as part of an award that shrinks as you earn more. The <a href="/childcare-help-calculator/">childcare help calculator</a> shows which gives you more.`));
  const q = [
    ["How much is maternity pay?", `90% of your average weekly earnings for the first 6 weeks, then ${m2(S.smpWeekly)} a week or 90% (whichever is lower) for 33 weeks (${YEAR}). On ${m0(30000)} a year that's ${m2(smp)} in total before tax.`],
    ["How much is paternity pay?", `${m2(PP.weeklyRate)} a week or ${PP.earningsPct}% of average weekly earnings, whichever is lower, for up to ${PP.paternityWeeks} weeks.`],
    ["How much Child Benefit do you get for a baby?", `${m2(CB.rates.eldest)} a week for an eldest or only child and ${m2(CB.rates.additional)} for each other child.`],
    ["Can we share parental leave?", `Yes: up to ${PP.sharedLeaveMax} weeks of leave and ${PP.sharedPayMax} weeks of pay, by ending maternity leave and pay early. After 22 weeks of maternity leave, that's ${sh.leave} weeks of leave and ${sh.pay} of pay to share.`],
    ["Does Universal Credit go up when you have a baby?", `Yes, by ${m2(UC.child)} a month for each child (${YEAR}), and you get a work allowance. The 2-child limit ended on 6 April 2026.`]
  ];
  return { path: "/guides/money-when-you-have-a-baby/", crumb: "Money When You Have a Baby", blurb: `Maternity and paternity pay, shared parental leave, Child Benefit, Universal Credit and childcare help, with ${YEAR} figures.`,
    title: site.fitTitle(`Money When You Have a Baby — Maternity Pay, Child Benefit and More (${YEAR})`, "Money When You Have a Baby"), modified: PP.lastChecked,
    desc: `What you can get when you have a baby in ${YEAR}: maternity pay (90% for 6 weeks, then ${m2(S.smpWeekly)} a week), paternity pay, shared parental leave, Child Benefit, Universal Credit and childcare help.`,
    h1: "Money when you have a baby", sub: `The pay, benefits and childcare help you can get, with ${esc(YEAR)} figures.`,
    sections: [["maternity", "Maternity pay"], ["paternity", "Paternity pay"], ["shared", "Shared parental leave"], ["childbenefit", "Child Benefit"], ["uc", "Universal Credit"], ["childcare", "Childcare"]],
    tools: [["/maternity-pay-calculator/", "Maternity pay"], ["/paternity-pay-calculator/", "Paternity pay"], ["/child-benefit-tax-charge-calculator/", "Child Benefit charge"], ["/childcare-help-calculator/", "Childcare help"], ["/universal-credit-calculator/", "Universal Credit"]],
    body, q, callouts: ["/maternity-pay-calculator/", "/paternity-pay-calculator/", "/childcare-help-calculator/"],
    foot: `From GOV.UK's <a href="${S.source}" rel="nofollow noopener" target="_blank">maternity pay</a>, <a href="${PP.sources[0].url}" rel="nofollow noopener" target="_blank">paternity pay</a>, <a href="${PP.sources[3].url}" rel="nofollow noopener" target="_blank">Shared Parental Leave and Pay</a>, <a href="${CB.rates.source.url}" rel="nofollow noopener" target="_blank">Child Benefit</a>, <a href="${UC.sources[0].url}" rel="nofollow noopener" target="_blank">Universal Credit</a> and <a href="${T.sources[0].url}" rel="nofollow noopener" target="_blank">Tax-Free Childcare</a> pages, as stored in the site's data files. A guide, not advice.` };
}

/* ============================================ leaving a job */
function leavingAJob() {
  const J = (f) => JSON.parse(fs.readFileSync(path.join(site.ROOT, f), "utf8"));
  const N = J("data/uk/notice-period.json"), R = J("data/uk/rates-2026-27.json"), RD = R.redundancy, TR = J("data/uk/tax-refunds.json");
  const NP = require("../notice-period.js"), YEAR = R.taxYear;
  const wk = (y) => NP.statutory(N, "employer", { months: y * 12, years: y });
  const body = section("notice", "Notice", p(`If you resign, you must give at least a week's notice once you've been in the job for more than a month, or more if your contract says so. If your employer ends your job, they must give at least the notice in your contract or the statutory minimum, whichever is longer: a week from one month's service, then a week for each complete year from 2 years, up to ${N.employer.maxWeeks} weeks (${wk(5)} weeks after 5 years). Notice usually runs from the start of the day after it's given. The <a href="/notice-period-calculator/">notice period calculator</a> gives your last day.`)) +
    section("pay", "Pay during your notice", p(`You'll usually get your normal pay rate during your notice, and bonuses and commission unless your contract says otherwise. Your employer can ask you not to come in (garden leave) on the same pay and benefits, or pay you in lieu of notice if your contract allows it or you agree; tax and National Insurance come off that payment.`)) +
    section("holiday", "Holiday you haven't taken", p(`During your notice you may be able to take whatever's left of your statutory holiday. Leaving is the only time you can be paid instead of taking statutory leave, and your employer must pay for statutory leave you haven't taken, even if you're dismissed for gross misconduct. If you've taken more than you'd built up, your employer can only take money from your final pay if you agreed to that in writing beforehand. The <a href="/holiday-entitlement-calculator/">holiday entitlement calculator</a> works out what you've built up.`)) +
    section("redundancy", "Redundancy pay", p(`With at least ${RD.minYears} years' service, statutory redundancy pay is half a week's pay for each full year you were under 22, a week's pay for each full year from 22 to 40, and a week and a half for each full year from 41. Weekly pay is capped at <strong>${m0(RD.weekCap)}</strong> and service at ${RD.maxYears} years, so the most is <strong>${m0(RD.maxTotal)}</strong> (for redundancies from 6 April 2026). The <a href="/redundancy-pay-calculator/">redundancy pay calculator</a> works it out. The first £30,000 of redundancy and severance pay combined is usually tax-free, but holiday pay and pay in lieu of notice are taxed as normal pay: the <a href="/redundancy-tax-calculator/">redundancy tax calculator</a> splits it up.`)) +
    section("tax", "Tax after you leave", p(`If you've paid too much or too little tax by the end of the tax year (5 April), HMRC sends a tax calculation letter (P800) or a Simple Assessment letter between June and the end of November. If you're on an emergency tax code, tax is worked out as if you're paid that amount every week or month of the year, and if you've paid too much you can get a refund. The <a href="/tax-refund-calculator/">tax refund calculator</a> estimates what you might be owed.`));
  const q = [
    ["How much notice do I have to give?", "At least a week once you've been in the job for more than a month, or more if your contract says so."],
    ["How much notice does my employer have to give?", `At least your contract's notice or the statutory minimum, whichever is longer: a week from one month's service, then a week per complete year from 2 years, up to ${N.employer.maxWeeks} weeks.`],
    ["Do I get paid for holiday I haven't taken when I leave?", "Yes. Your employer must pay for statutory leave you haven't taken, even if you're dismissed for gross misconduct. You may also be able to take it during your notice."],
    ["How much is statutory redundancy pay?", `It depends on your age and years of service, with weekly pay capped at ${m0(RD.weekCap)} and service at ${RD.maxYears} years: at most ${m0(RD.maxTotal)}. You need at least ${RD.minYears} years' service.`],
    ["Is pay in lieu of notice taxed?", "Yes: tax and National Insurance are deducted from it."]
  ];
  return { path: "/guides/leaving-a-job/", crumb: "Leaving a Job", blurb: "Notice, pay during your notice, holiday you haven't taken, redundancy pay and sorting out your tax.",
    title: site.fitTitle("Leaving a Job — Notice, Holiday Pay, Redundancy and Tax", "Leaving a Job: Money Checklist"), modified: N.lastChecked,
    desc: `Leaving a job in the UK: how much notice to give or get, pay during your notice, being paid for holiday you haven't taken, redundancy pay (up to ${m0(RD.maxTotal)}) and tax refunds.`,
    h1: "Leaving a job: notice, holiday pay and redundancy", sub: "What you're owed and what to check when you leave, from GOV.UK's rules.",
    sections: [["notice", "Notice"], ["pay", "Pay during notice"], ["holiday", "Untaken holiday"], ["redundancy", "Redundancy pay"], ["tax", "Tax"]],
    tools: [["/notice-period-calculator/", "Notice period"], ["/holiday-entitlement-calculator/", "Holiday entitlement"], ["/redundancy-pay-calculator/", "Redundancy pay"], ["/redundancy-tax-calculator/", "Redundancy tax"], ["/tax-refund-calculator/", "Tax refund"]],
    body, q, callouts: ["/notice-period-calculator/", "/redundancy-pay-calculator/"],
    foot: `From GOV.UK's <a href="${N.sources[0].url}" rel="nofollow noopener" target="_blank">notice</a>, <a href="${N.sources[3].url}" rel="nofollow noopener" target="_blank">notice pay</a>, <a href="${N.sources[5].url}" rel="nofollow noopener" target="_blank">holiday when leaving</a>, <a href="${RD.source}" rel="nofollow noopener" target="_blank">redundancy pay</a> and <a href="${TR.sources[0].url}" rel="nofollow noopener" target="_blank">tax refund</a> pages, as stored in the site's data files. A guide, not advice.` };
}

/* ============================================ your first job */
function firstJob() {
  const J = (f) => JSON.parse(fs.readFileSync(path.join(site.ROOT, f), "utf8"));
  const all = registry.readAll(), cur = registry.currentFiles(all), gb = cur.gb.doc, YEAR = gb.taxYear.label, ch = registry.chainFor(gb, all);
  const TC = J("data/uk/tax-codes.json"), MW = J("data/uk/minimum-wage.json"), EC = J("data/uk/employer-cost.json"), R = J("data/uk/rates-2026-27.json"), BT = J("data/uk/bonus-tax.json");
  const PA = gb.items.find((i) => i.id === "gb-personal-allowance").value.taper;
  const today = new Date().toISOString().slice(0, 10), w = MW.rates.filter((r) => r.from <= today).pop();
  const P = EC.pension, run = (g) => TaxEngine.compute(ch, g, {});
  const rows = [18000, 22000, 25000, 30000].map((g) => { const r = run(g), v = r.values; return [m0(g), m0(v["gb-income-tax"] || 0), m0(v["gb-ni"] || 0), m2(r.net / 12)]; });
  const ex = 25000, qe = Math.min(Math.max(0, ex - P.lower), P.upper - P.lower), you = qe * P.employeeMinPct / 100, them = qe * P.employerMinPct / 100;
  const body = section("code", "Your tax code", p(`Your employer uses a tax code to work out how much tax to take. Most people with one job get <strong>${esc(TC.standard)}</strong>: the L means "${esc(TC.letters.L)}" That's ${m0(PA)} you can earn tax-free in the tax year (${esc(YEAR)}). If your employer doesn't have your details yet you might see <strong>0T</strong> ("${esc(TC.letters["0T"])}") or an emergency code ending in W1, M1 or X. Giving your employer a P45 from a previous job helps; the <a href="/tax-code-checker/">tax code checker</a> explains any code.`)) +
    section("pay", "Tax and National Insurance on your pay", p(`Income Tax is 20% of what you earn over ${m0(PA)}, and employee National Insurance comes off too. Here's what that means on a few starting salaries in ${esc(YEAR)}, with tax code ${esc(TC.standard)} and nothing else taken off:`) +
      site.table(["Salary", "Income Tax a year", "National Insurance a year", "Take-home a month"], rows, 560) +
      p(`Tax is usually worked out on your pay so far in the tax year, so your first payslip can look different from later ones, especially if you start part-way through the year. The <a href="/salary/">salary calculator</a> works out any salary and the <a href="/payslip-checker/">payslip checker</a> compares a payslip with what it should be.`)) +
    section("pension", "Workplace pension", p(`Your employer must put you into a workplace pension if you're aged between 22 and State Pension age and earn at least ${m0(P.autoEnrolFrom)} a year. The minimum is <strong>${P.employeeMinPct}% from you and ${P.employerMinPct}% from your employer</strong>, and in most schemes it's worked out on earnings between ${m0(P.lower)} and ${m0(P.upper)}. On ${m0(ex)} that's about ${m0(you)} a year from you and ${m0(them)} from your employer. The <a href="/pension-tax-relief-calculator/">pension tax relief calculator</a> shows the tax relief on what you pay in.`)) +
    section("wage", "The minimum wage", p(`From ${esc(w.label)}: <strong>${m2(w.adult)} an hour</strong> if you're 21 or over (the National Living Wage), ${m2(w.age18to20)} at 18 to 20, ${m2(w.under18)} under 18, and ${m2(w.apprentice)} for apprentices under 19 or in the first year of their apprenticeship. The <a href="/minimum-wage-calculator/">minimum wage checker</a> checks your pay against it.`)) +
    section("holiday", "Holiday", p(`Almost all workers get at least <strong>${R.holiday.weeks} weeks' paid holiday</strong> a year, at most ${R.holiday.capDays} days, and your employer can count bank holidays towards it. Part-time workers get the same number of weeks, so fewer days. The <a href="/holiday-entitlement-calculator/">holiday entitlement calculator</a> works out yours.`)) +
    section("loan", "Student loan repayments", p(`If you have a student loan, repayments come out of your pay through PAYE once you earn over your plan's threshold: 9% of what you earn above it. The <a href="/guides/student-loans-explained/">student loans guide</a> explains the plans and the <a href="/student-loan-calculator/">student loan calculator</a> works out your repayments.`));
  const r25 = run(ex);
  const q = [
    [`How much tax will I pay in my first job?`, `With tax code ${TC.standard} in ${YEAR} you pay no Income Tax on the first ${m0(PA)}. On ${m0(ex)} that's ${m0(r25.values["gb-income-tax"] || 0)} of Income Tax and ${m0(r25.values["gb-ni"] || 0)} of National Insurance a year, leaving about ${m2(r25.net / 12)} a month.`],
    ["What tax code will I get in my first job?", `Usually ${TC.standard}. Until your employer has your details you might be on 0T or an emergency code ending in W1, M1 or X.`],
    ["Will I be put in a workplace pension?", `Yes, if you're aged between 22 and State Pension age and earn at least ${m0(P.autoEnrolFrom)} a year. The minimum is ${P.employeeMinPct}% from you and ${P.employerMinPct}% from your employer.`],
    ["What's the minimum wage for my age?", `From ${w.label}: ${m2(w.adult)} an hour at 21 or over, ${m2(w.age18to20)} at 18 to 20 and ${m2(w.under18)} under 18.`],
    ["How much holiday do I get?", `At least ${R.holiday.weeks} weeks a year, at most ${R.holiday.capDays} days, which can include bank holidays.`]
  ];
  return { path: "/guides/your-first-job/", crumb: "Your First Job", blurb: `Tax codes, tax and NI on your pay, the workplace pension, the minimum wage and holiday, with ${YEAR} figures.`,
    title: site.fitTitle(`Your First Job — Tax Code, Take-Home Pay, Pension and Minimum Wage (${YEAR})`, "Your First Job: Money Guide"), modified: TC.lastChecked || MW.lastChecked,
    desc: `Starting your first job in ${YEAR}: your tax code, how much tax and National Insurance comes off, the workplace pension, the minimum wage (${m2(w.adult)} an hour at 21+) and holiday.`,
    h1: "Your first job: tax, pay and pension", sub: `What comes off your pay and what you're entitled to, with ${esc(YEAR)} figures.`,
    sections: [["code", "Tax code"], ["pay", "Tax and NI"], ["pension", "Workplace pension"], ["wage", "Minimum wage"], ["holiday", "Holiday"], ["loan", "Student loan"]],
    tools: [["/salary/", "Salary"], ["/payslip-checker/", "Payslip checker"], ["/tax-code-checker/", "Tax code checker"], ["/minimum-wage-calculator/", "Minimum wage"], ["/holiday-entitlement-calculator/", "Holiday"]],
    body, q, callouts: ["/payslip-checker/", "/minimum-wage-calculator/"],
    foot: `Figures from the ${esc(YEAR)} UK tax file and GOV.UK's <a href="${TC.sources[0].url}" rel="nofollow noopener" target="_blank">tax codes</a>, <a href="${MW.sources[0].url}" rel="nofollow noopener" target="_blank">minimum wage</a>, <a href="${EC.sources.find((s) => /pension/.test(s.url)) ? EC.sources.find((s) => /pension/.test(s.url)).url : EC.sources[0].url}" rel="nofollow noopener" target="_blank">workplace pensions</a> and <a href="${R.holiday.source}" rel="nofollow noopener" target="_blank">holiday</a> pages, as stored in the site's data files. A guide, not advice.` };
}

/* ============================================ Universal Credit explained */
function universalCredit() {
  const J = (f) => JSON.parse(fs.readFileSync(path.join(site.ROOT, f), "utf8"));
  const U = J("data/uk/universal-credit.json"), CA = J("data/uk/carers-allowance.json"), YEAR = U.taxYear, Q = (k) => U.rules[k].quote;
  const S = U.standard, WA = U.workAllowance, cap = U.capital;
  /* worked example: single parent 25+, one child, no help with housing, £1,200 a month take-home */
  const maxEx = S.single25 + U.child, earn = 1200, cut = (earn - WA.withoutHousing) * U.taperPct / 100, ucEx = Math.max(0, maxEx - cut);
  const body = section("what", "What Universal Credit is", p(`Universal Credit is a monthly payment for people on a low income or out of work. It's made up of a <strong>standard allowance</strong> plus extra amounts for children, disability, caring and housing, then reduced as you earn more. ${esc(Q("noHoursLimit"))}`) +
      site.table(["Your situation", "Standard allowance a month"], [["Single, under 25", m2(S.singleUnder25)], ["Single, 25 or over", m2(S.single25)], ["Couple, both under 25", m2(S.coupleUnder25) + " (for you both)"], ["Couple, either 25 or over", m2(S.couple25) + " (for you both)"]], 480)) +
    section("extras", "Extra amounts", p(`<strong>Children:</strong> ${m2(U.child)} a month for each child (${m2(U.child + U.firstChildBefore2017Extra)} for a first child born before 6 April 2017). The 2-child limit ended on 6 April 2026. A disabled child adds ${m2(U.disabledChild.lower)} or ${m2(U.disabledChild.higher)}.`) +
      p(`<strong>Health:</strong> ${m2(U.health.lcwra)} a month if you have limited capability for work and work-related activity (${m2(U.health.lcwraSevere)} for the most severe conditions). <strong>Caring:</strong> ${m2(U.carer)} a month if you care for a severely disabled person for at least 35 hours a week. <strong>Childcare:</strong> up to ${U.childcarePct}% of your costs if you work, up to ${m2(U.childcareMax.one)} a month for one child and ${m2(U.childcareMax.twoOrMore)} for two or more.`)) +
    section("work", "Working and Universal Credit", p(`${esc(Q("taper"))} If you're responsible for a child, or have limited capability for work, you also get a <strong>work allowance</strong>: you can earn ${m0(WA.withoutHousing)} a month before it starts to reduce, or ${m0(WA.withHousing)} if you get help with housing costs. It's based on your take-home pay, after tax, National Insurance and pension contributions.`) +
      p(`For example, a single parent aged 25 or over with one child and no help with housing gets up to ${m2(maxEx)} a month. Taking home ${m0(earn)} a month, ${m2(cut)} comes off (55% of the ${m0(earn - WA.withoutHousing)} over the work allowance), leaving <strong>${m2(ucEx)}</strong> of Universal Credit, so ${m2(earn + ucEx)} a month in all. The <a href="/universal-credit-calculator/">Universal Credit calculator</a> works out yours.`)) +
    section("savings", "Savings", p(`You can't get Universal Credit with more than ${m0(cap.upper)} in money, savings and investments. Between ${m0(cap.disregard)} and ${m0(cap.upper)}, your payment is reduced by ${m2(cap.perStep)} for every ${m0(cap.step)} (or part of ${m0(cap.step)}) above ${m0(cap.disregard)}: ${m2(Math.ceil((10000 - cap.disregard) / cap.step) * cap.perStep)} a month with ${m0(10000)}.`)) +
    section("other", "Other benefits and the benefit cap", p(`Other benefits such as Carer's Allowance reduce Universal Credit by the same amount: Carer's Allowance is ${m2(CA.weekly)} a week. The <strong>benefit cap</strong> limits the total of most benefits to ${m2(U.benefitCap.outsideLondon.family)} a month for a couple or single parent outside Greater London (${m2(U.benefitCap.london.family)} in London) and ${m2(U.benefitCap.outsideLondon.single)} for a single adult (${m2(U.benefitCap.london.single)} in London). It doesn't apply if you and your partner earn ${m0(U.benefitCap.earningsThreshold)} or more a month between you after tax and National Insurance.`));
  const q = [
    ["How much is Universal Credit?", `The standard allowance is ${m2(S.single25)} a month for a single person aged 25 or over and ${m2(S.couple25)} for a couple where either is 25 or over (${YEAR}), plus extra for children, disability, caring, childcare and housing.`],
    ["How much can I earn on Universal Credit?", `There's no limit on hours. For every £1 you take home, Universal Credit goes down by 55p, after a work allowance of ${m0(WA.withoutHousing)} a month (${m0(WA.withHousing)} with housing help) if you're responsible for a child or have limited capability for work.`],
    ["How much is Universal Credit for a child?", `${m2(U.child)} a month for each child, for every child since the 2-child limit ended on 6 April 2026.`],
    ["Can I have savings on Universal Credit?", `Up to ${m0(cap.upper)}. Above ${m0(cap.disregard)}, your payment goes down by ${m2(cap.perStep)} a month for every ${m0(cap.step)}.`],
    ["Does Carer's Allowance affect Universal Credit?", `Yes: Universal Credit is reduced by the same amount as your Carer's Allowance (${m2(CA.weekly)} a week), though you may get the carer element of ${m2(U.carer)} a month.`]
  ];
  return { path: "/guides/universal-credit-explained/", crumb: "Universal Credit Explained", blurb: `How Universal Credit is worked out: the amounts, children, the 55% taper and work allowance, savings and the benefit cap (${YEAR}).`,
    title: site.fitTitle(`Universal Credit Explained — Amounts, Earnings and Savings (${YEAR})`, "Universal Credit Explained"), modified: U.lastChecked,
    desc: `How Universal Credit works in ${YEAR}: standard allowances from ${m2(S.singleUnder25)} a month, ${m2(U.child)} per child, the 55% taper and work allowance, the ${m0(cap.upper)} savings limit and the benefit cap.`,
    h1: "Universal Credit explained", sub: `What you can get, how earnings and savings change it, with ${esc(YEAR)} amounts.`,
    sections: [["what", "What it is"], ["extras", "Extra amounts"], ["work", "Working"], ["savings", "Savings"], ["other", "Other benefits and the cap"]],
    tools: [["/universal-credit-calculator/", "Universal Credit"], ["/childcare-help-calculator/", "Childcare help"], ["/carers-allowance-calculator/", "Carer's Allowance"], ["/benefit-payment-dates/", "Payment dates"]],
    body, q, callouts: ["/universal-credit-calculator/", "/carers-allowance-calculator/"],
    foot: `From GOV.UK's <a href="${U.sources[0].url}" rel="nofollow noopener" target="_blank">Universal Credit</a> guide and DWP's benefit rates, and GOV.UK's <a href="${CA.sources[0].url}" rel="nofollow noopener" target="_blank">Carer's Allowance</a> page, as stored in the site's data files. A guide, not advice: the DWP decides what you get.` };
}

/* ============================================ retiring */
function retiring() {
  const J = (f) => JSON.parse(fs.readFileSync(path.join(site.ROOT, f), "utf8"));
  const F = J("data/uk/state-pension-forecast.json"), A = J("data/uk/state-pension-age.json"), W = J("data/uk/pension-withdrawal.json"), WF = J("data/uk/winter-fuel-payment.json");
  const UKC = require("../uk-calcs.js"), PW = require("../pension-withdrawal.js"), { cfg } = require("./lib/uk-config.js")(), YEAR = cfg.year;
  const QA = (k) => A.rules[k].quote, QW = (k) => W.rules[k].quote;
  const each = F.fullWeekly / F.fullYears, cost = F.class3Weekly * 52;
  const one = PW.calc(UKC, cfg, W, { amount: 40000, fresh: true, other: 0 }), two = PW.spread(UKC, cfg, W, { amount: 40000, fresh: true, other: 0 }, 2);
  const sp = Math.round(F.fullWeekly * 52 * 100) / 100, withSp = PW.calc(UKC, cfg, W, { amount: 10000, fresh: true, other: sp });
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const nice = (s) => { const x = s.split("-"); return `${+x[2]} ${MONTHS[+x[1] - 1]} ${x[0]}`; };
  const body = section("age", "When you can get your State Pension", p(`Your State Pension age depends on your date of birth. ${esc(QA("already67"))} ${esc(QA("to68"))} ${esc(QA("mayChange"))} ${esc(QA("claim"))} The <a href="/state-pension-age-calculator/">State Pension age calculator</a> gives your exact date.`)) +
    section("amount", "How much State Pension you'll get", p(`The full new State Pension is <strong>${m2(F.fullWeekly)} a week</strong> (${m0(sp)} a year, ${esc(F.taxYear)}). You need ${F.minYears} qualifying years of National Insurance to get any and ${F.fullYears} for the full amount if your record started after April 2016; each year in between is worth 1/${F.fullYears} of it, ${m2(each)} a week. ${esc(QA("triple"))}`) +
      p(`If you have gaps, a year of voluntary Class 3 contributions costs ${m2(cost)} (${m2(F.class3Weekly)} a week) and, if it adds a qualifying year that raises your pension, it's back in about ${(Math.round(cost / (each * 52) * 10) / 10).toLocaleString("en-GB")} years. You can usually pay for the past ${F.payBackYears} years. The <a href="/state-pension-forecast-calculator/">State Pension forecast calculator</a> works out yours.`)) +
    section("pot", "Taking money from your pension", p(`${esc(QW("taxFree"))} ${esc(QW("age"))} The rest is taxed as income in the tax year you take it, so spreading it out can save tax: taking ${m0(40000)} from a pot you haven't touched, with no other income, costs ${m2(one.due)} in tax in one tax year (${esc(YEAR)}) but ${m2(two.due)} over two.`) +
      p(`A first payment is usually taxed on an emergency code on a month 1 basis, so far more can come off at first: ${m2(one.emergency)} on that ${m0(40000)}. You can claim it back from HMRC (forms P55, P53Z or P50Z). The <a href="/pension-withdrawal-tax-calculator/">pension withdrawal tax calculator</a> works it out, and the <a href="/pension-drawdown-calculator/">pension drawdown calculator</a> shows how long a pot lasts.`)) +
    section("tax", "Tax in retirement", p(`${esc(QW("spTaxable"))} ${esc(QW("spNotTaxed"))} ${esc(QW("spCode"))} With the full State Pension, ${m0(10000)} from a private pension pot you haven't touched costs ${m2(withSp.due)} in tax (${esc(YEAR)}). ${esc(F.rules.workAfter.quote.replace(/^If you do, /, "If you keep working after State Pension age, "))}.`)) +
    section("winter", "Winter Fuel Payment", p(`For winter ${esc(WF.winter)}, you can get a Winter Fuel Payment if you were born on or before ${nice(WF.bornBy)} and live in England, Wales or Northern Ireland: ${m0(WF.amounts.alone[0])} living alone, or ${m0(WF.amounts.alone[1])} if you were born before ${nice(WF.olderBefore)} (different amounts if you live with someone else who gets it, or in a care home). If your own income is over ${m0(WF.incomeLimit)}, HMRC takes it back. The <a href="/winter-fuel-payment-calculator/">Winter Fuel Payment calculator</a> checks yours.`));
  const q = [
    ["How much is the full State Pension?", `${m2(F.fullWeekly)} a week (${m0(sp)} a year) in ${F.taxYear}, with ${F.fullYears} qualifying years of National Insurance.`],
    ["How many years do I need for a State Pension?", `${F.minYears} qualifying years to get any new State Pension and ${F.fullYears} for the full amount if your record started after April 2016. Each year is worth ${m2(each)} a week.`],
    ["How much of my pension can I take tax-free?", `Usually ${W.taxFreePct}%, up to ${m0(W.lumpSumAllowance)} in all. The rest is taxed as income.`],
    ["Is the State Pension taxed?", "It's taxable income but paid without tax taken off. If you also have a private pension or wages, your tax code usually collects the tax on your State Pension."],
    ["Do I still pay National Insurance after State Pension age?", "No: if you keep working after State Pension age you stop paying National Insurance."]
  ];
  return { path: "/guides/retiring/", crumb: "Retiring", blurb: `State Pension age and amount, filling gaps, taking money from your pension, tax in retirement and the Winter Fuel Payment.`,
    title: site.fitTitle(`Retiring in the UK — State Pension, Pension Tax and Winter Fuel (${YEAR})`, "Retiring: Money Guide"), modified: F.lastChecked,
    desc: `Money when you retire: your State Pension age, the ${m2(F.fullWeekly)} a week full State Pension and qualifying years, taking pension money tax-efficiently, emergency tax, and the Winter Fuel Payment.`,
    h1: "Retiring: State Pension, pension tax and more", sub: `When you can get your State Pension, how much, and how to take your pension without paying more tax than you need to.`,
    sections: [["age", "State Pension age"], ["amount", "How much"], ["pot", "Your pension pot"], ["tax", "Tax in retirement"], ["winter", "Winter Fuel Payment"]],
    tools: [["/state-pension-age-calculator/", "State Pension age"], ["/state-pension-forecast-calculator/", "State Pension forecast"], ["/pension-withdrawal-tax-calculator/", "Pension withdrawal tax"], ["/pension-drawdown-calculator/", "Pension drawdown"], ["/winter-fuel-payment-calculator/", "Winter Fuel Payment"]],
    body, q, callouts: ["/state-pension-forecast-calculator/", "/pension-withdrawal-tax-calculator/", "/state-pension-age-calculator/"],
    foot: `From GOV.UK's <a href="${F.sources[0].url}" rel="nofollow noopener" target="_blank">new State Pension</a>, <a href="${A.sources[0].url}" rel="nofollow noopener" target="_blank">State Pension age timetable</a>, <a href="${W.sources[0].url}" rel="nofollow noopener" target="_blank">tax on your pension</a> and <a href="${WF.sources[0].url}" rel="nofollow noopener" target="_blank">Winter Fuel Payment</a> pages and the Pensions Act 2014, as stored in the site's data files; tax worked out with the ${esc(YEAR)} UK tax file. A guide, not advice.` };
}

const GUIDES = [incomeTax(), nationalInsurance(), taxCodeChanges(), taxYearEnd(), firstJob(), havingABaby(), leavingAJob(), retiring(), universalCredit(), usBrackets2027(), selfAssessment(), studentLoans(), isaPension(), changes2027(), mortgage(), betting()];
GUIDES.forEach((g) => g.tools.concat(g.callouts.map((u) => [u])).forEach(([u]) => { if (!exists(u)) throw new Error(g.path + ": no page at " + u); }));

const urls = [];
GUIDES.forEach((g) => { site.write(g.path.replace(/^\/|\/$/g, ""), guidePage(g)); urls.push([g.path, "0.6"]); });

const hubUrl = SITE + "/guides/";
const hubDesc = "Plain-English guides to UK income tax, National Insurance, Self Assessment, student loans, ISAs and pensions, the April 2027 tax changes, how mortgage interest works and the maths of matched betting, with worked examples and links to the calculators.";
site.write("guides", site.head({ title: "Guides — Tax, Mortgages and Betting Maths Explained", desc: hubDesc, url: hubUrl,
  ld: [site.webPage("Guides", hubDesc, hubUrl), site.breadcrumb([["Home", SITE + "/"], ["Guides", hubUrl]]),
    { "@context": "https://schema.org", "@type": "ItemList", numberOfItems: GUIDES.length, itemListElement: GUIDES.map((g, i) => ({ "@type": "ListItem", position: i + 1, name: g.h1, url: SITE + g.path })) }] }) + `    <header class="site-header">
      <a class="back-link" href="/">← All calculators</a>
      <h1 class="page-title">Guides</h1>
      <p class="page-subtitle">How the sums behind the calculators work, with worked examples.</p>
    </header>

    <main class="tool">
      <div class="hub-grid">
${GUIDES.map((g) => site.card(g.path, "📖", g.h1, g.blurb)).join("")}      </div>
    </main>

${site.FOOTER}
  </div>
</body>
</html>
`);
urls.unshift(["/guides/", "0.5"]);

/* the "read the guide" link on each calculator a guide explains (one block
   per page, so a page two guides explain links to both) */
const callouts = new Map();
GUIDES.forEach((g) => g.callouts.forEach((u) => { if (!callouts.has(u)) callouts.set(u, []); callouts.get(u).push(g); }));
callouts.forEach((gs, u) => {
  site.hubBlock(u, "guide link", "tools/build-guides.js", gs.map((g) => `    <p class="guide-callout">${icons.svg("book-open")}<span><a href="${g.path}">${esc(g.h1)}</a>: ${esc(g.blurb.charAt(0).toLowerCase() + g.blurb.slice(1))}</span></p>
`).join(""));
});

site.sitemapBlock("guides", "tools/build-guides.js", urls);
console.log(`built ${GUIDES.length} guides and the guide list; linked from ${callouts.size} calculators`);
