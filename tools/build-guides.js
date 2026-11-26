#!/usr/bin/env node
/* Guides: longer explanations that link the calculators on a topic together.

       /guides/                                  the list
       /guides/uk-income-tax/                    bands, allowance taper, NI, worked examples
       /guides/self-assessment-explained/        who files, the deadlines, January bills, penalties
       /guides/tax-changes-2027-28/              what changes on 6 April 2027 (Budget 2026)
       /guides/how-mortgage-interest-works/      the repayment formula, tables, overpaying
       /guides/matched-betting-explained/        lay stakes, qualifying bets, free bets

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

/* ===================================================== build */
const GUIDES = [incomeTax(), selfAssessment(), changes2027(), mortgage(), betting()];
GUIDES.forEach((g) => g.tools.concat(g.callouts.map((u) => [u])).forEach(([u]) => { if (!exists(u)) throw new Error(g.path + ": no page at " + u); }));

const urls = [];
GUIDES.forEach((g) => { site.write(g.path.replace(/^\/|\/$/g, ""), guidePage(g)); urls.push([g.path, "0.6"]); });

const hubUrl = SITE + "/guides/";
const hubDesc = "Plain-English guides to UK income tax, Self Assessment, the April 2027 tax changes, how mortgage interest works and the maths of matched betting, with worked examples and links to the calculators.";
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
