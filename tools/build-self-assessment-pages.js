#!/usr/bin/env node
/* Self Assessment calculators:

       /payments-on-account-calculator/          what's due on 31 January and 31 July
       /self-assessment-penalty-calculator/      penalties and interest for filing or paying late

       node tools/build-self-assessment-pages.js

   The rules are in data/uk/self-assessment.json, each quoted from GOV.UK;
   the late payment interest rate follows the Bank of England base rate, so
   the monthly check confirms it. The dates are for the next 31 January
   deadline after the build, so the monthly rebuild rolls them on. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const related = require("./related.js");
const SA = require("../self-assessment.js");
const { esc, SITE } = site;

const R = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/uk/self-assessment.json"), "utf8"));
const TODAY = new Date(site.TODAY + "T00:00:00Z");
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const dm = (d) => `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
const iso = (d) => d.toISOString().slice(0, 10);
const money = (v) => "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const m0 = (v) => "£" + v.toLocaleString("en-GB", { maximumFractionDigits: 0 });

/* the next 31 January deadline, and the tax years around it */
const Y = TODAY > SA.utc(TODAY.getUTCFullYear(), 0, 31) ? TODAY.getUTCFullYear() + 1 : TODAY.getUTCFullYear();
const DUE = SA.utc(Y, 0, 31), JULY = SA.utc(Y, 6, 31);
const ty = (end) => `${end - 1}/${String(end).slice(2)}`;
const YEAR = ty(Y - 1), NEXT = ty(Y);   /* e.g. 2025/26 return, 2026/27 payments on account */

/* GOV.UK's own example must come out right */
const ex = SA.payments(R, 3000, 0, 1800, false);
if (ex.balancing !== 1200 || ex.poa !== 1500 || ex.january !== 2700 || ex.july !== 1500) throw new Error("payments on account: GOV.UK example");
const pe = SA.penalties(R, 4000, SA.utc(2027, 0, 31), SA.utc(2027, 4, 10), SA.utc(2027, 4, 10), null);
if (pe.filingTotal !== 200 || pe.paymentTotal !== 200) throw new Error("penalties: check example");

const SRC = (k) => `<a href="${R[k].source.url}" rel="nofollow noopener" target="_blank">${esc(R[k].source.title)}</a>`;
const RATE = R.interest.latePaymentRate;
const fromDate = new Date(R.interest.from + "T00:00:00Z");

function page(o) {
  const url = SITE + o.path;
  const ld = [site.webPage(o.title, o.desc, url), site.breadcrumb([["Home", SITE + "/"], ["Personal Finance", SITE + "/personal-finance/"], [o.crumb, url]]),
    { "@context": "https://schema.org", "@type": "WebApplication", name: o.crumb, url, applicationCategory: "FinanceApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } },
    site.faqLd(o.q)];
  return site.head({ title: o.title, desc: o.desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="/personal-finance/">← Personal finance calculators</a>
      <h1 class="page-title">${esc(o.h1)}</h1>
      <p class="page-subtitle">${o.sub}</p>
    </header>

${o.tool}
${o.body}
    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(o.q)}      <p class="tool-hint" style="margin-top:12px;">A guide, not advice: your Self Assessment statement and HMRC online account show what you actually owe. Rules from ${o.sources}. Last checked ${site.niceDate(R.lastChecked)}.</p>
    </main>

${related.block(o.path)}
${site.FOOTER}
  </div>
  <script src="/self-assessment.js"></script>
</body>
</html>
`;
}

/* ---------------------------------------------------------- payments on account */
function poaPage() {
  const p = R.paymentsOnAccount;
  const tool = `    <main class="tool split" id="poa-tool" data-rules="${esc(JSON.stringify({ paymentsOnAccount: p }))}">
      <div class="field"><label for="poa-bill">Income tax and Class 4 NI for ${YEAR}</label><input type="number" id="poa-bill" value="3000" min="0" step="any" inputmode="decimal"></div>
      <div class="field"><label for="poa-paid">Payments on account already made towards ${YEAR}</label><input type="number" id="poa-paid" value="1800" min="0" step="any" inputmode="decimal"><p class="tool-hint" style="margin:6px 0 0;">Usually two payments, each half of your ${ty(Y - 2)} bill. Enter 0 in your first year.</p></div>
      <div class="field"><label for="poa-other">Capital gains tax and student loan for ${YEAR}</label><input type="number" id="poa-other" value="0" min="0" step="any" inputmode="decimal"></div>
      <div class="field"><label><input type="checkbox" id="poa-source" style="width:auto; margin-right:8px;">More than 80% of my tax was paid outside Self Assessment (PAYE, tax on savings)</label></div>
      <div class="result-box split-aside" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="poa-jan">${money(ex.january)}</div>
          <div class="label">to pay by 31 January ${Y}</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row"><span class="r-label">Balancing payment for ${YEAR}</span><span class="r-value" id="poa-bal">${money(ex.balancing)}</span></div>
          <div class="result-row"><span class="r-label">1st payment on account for ${NEXT}</span><span class="r-value" id="poa-first">${money(ex.poa)}</span></div>
          <div class="result-row highlight"><span class="r-label">To pay by 31 July ${Y}</span><span class="r-value" id="poa-july">${money(ex.july)}</span></div>
        </div>
        <p class="tool-hint" id="poa-note" style="margin:10px 0 0;"></p>
      </div>
    </main>
`;
  const body = `    <main class="tool">
      <h2 class="tool-section-title">How it's worked out</h2>
      <p class="about-text">Each payment on account is <strong>half of the income tax and Class 4 National Insurance</strong> on your last return, paid by 31 January and 31 July towards the next year's bill. The <strong>balancing payment</strong> is what's left of the year's bill once the payments on account you've made are taken off; it also takes in any capital gains tax and student loan repayments, which payments on account don't cover.</p>
      <p class="about-text"><strong>GOV.UK's example:</strong> a ${m0(3000)} bill for the year, with two payments on account of ${m0(900)} already made, leaves a balancing payment of ${m0(1200)}. On top comes the first payment on account for the next year, half of ${m0(3000)}: ${m0(1500)}. So ${m0(2700)} is due by 31 January and the second ${m0(1500)} by 31 July.</p>
      <p class="about-text">You don't make payments on account if your bill was under ${m0(p.minBill)}, or if more than 80% of your tax was paid outside Self Assessment, for example through your tax code. To estimate the bill itself, use the <a href="/self-employed-tax-calculator/">self-employed tax calculator</a>; if you're late, the <a href="/self-assessment-penalty-calculator/">Self Assessment penalty calculator</a> works out what it costs.</p>
    </main>
`;
  const q = [
    ["What are payments on account?", `Payments towards your next tax bill, including Class 4 National Insurance if you're self-employed, made in two instalments by 31 January and 31 July. Each is half of the tax you owed the year before.`],
    [`How much is my payment on account?`, `Half of your Self Assessment bill for income tax and Class 4 National Insurance. A ${m0(3000)} bill for ${YEAR} means two payments of ${m0(1500)} towards ${NEXT}, due by 31 January ${Y} and 31 July ${Y}.`],
    ["When don't I have to make payments on account?", `If the tax you owed last year was less than ${m0(p.minBill)}, or if you paid more than 80% of the tax you owed outside Self Assessment, for example through your tax code or because your bank had already taken tax off your savings interest.`],
    ["What is a balancing payment?", "The tax you still owe for the year once your payments on account are taken off. It's due by 31 January after the tax year, and also includes any capital gains tax and student loan repayments, which payments on account don't cover."],
    ["Why is my January bill so big in my first year?", `In your first year there are no payments on account to take off, so on 31 January you pay the whole year's bill and the first payment on account for the next year, half as much again. A ${m0(3000)} first-year bill means ${m0(4500)} by 31 January and ${m0(1500)} in July.`],
    ["What if I earn less this year?", "Payments on account are based on last year, so if you earn less, you may have paid too much and be due a refund once the year's return is in."]
  ];
  return page({ path: "/payments-on-account-calculator/", crumb: "Payments on Account Calculator", q, tool, body, sources: SRC("paymentsOnAccount"),
    title: site.fitTitle("Payments on Account Calculator — What's Due on 31 January and 31 July", "Payments on Account Calculator — 31 January and 31 July"),
    desc: `Work out your Self Assessment payments on account and balancing payment: what to pay by 31 January ${Y} and 31 July ${Y} for the ${YEAR} and ${NEXT} tax years, with GOV.UK's rules.`,
    h1: "Payments on account calculator", sub: `What you pay HMRC by <strong>31 January ${Y}</strong> and <strong>31 July ${Y}</strong>: the balancing payment for ${YEAR} and payments on account towards ${NEXT}.` });
}

/* ---------------------------------------------------------------- penalties */
function penPage() {
  const f = R.penalties.filing;
  const asOf = SA.utc(Y, 4, 31);
  const sample = SA.penalties(R, 2000, DUE, null, null, asOf);
  const tool = `    <main class="tool split" id="pen-tool" data-due="${iso(DUE)}" data-rules="${esc(JSON.stringify({ penalties: R.penalties, interest: R.interest }))}">
      <div class="field"><label for="pen-tax">Tax due for ${YEAR}</label><input type="number" id="pen-tax" value="2000" min="0" step="any" inputmode="decimal"></div>
      <div class="field-row">
        <div class="field"><label for="pen-filed">Return filed on</label><input type="date" id="pen-filed"></div>
        <div class="field"><label for="pen-paid">Tax paid on</label><input type="date" id="pen-paid"></div>
      </div>
      <div class="field"><label for="pen-asof">Leave a date blank if it hasn't happened: it's counted to</label><input type="date" id="pen-asof" value="${iso(asOf)}"></div>
      <div class="result-box split-aside" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="pen-total">${money(sample.total)}</div>
          <div class="label">penalties and interest</div>
        </div>
        <hr class="divider">
        <div class="result-grid" id="pen-filing">${sample.filing.map(([a, b]) => `<div class="result-row"><span class="r-label">${esc(a)}</span><span class="r-value">${money(b)}</span></div>`).join("")}</div>
        <div class="result-grid" id="pen-payment" style="margin-top:8px;">${sample.payment.map(([a, b]) => `<div class="result-row"><span class="r-label">${esc(a)}</span><span class="r-value">${money(b)}</span></div>`).join("")}</div>
        <div class="result-grid" style="margin-top:8px;"><div class="result-row"><span class="r-label">Interest</span><span class="r-value" id="pen-interest">${money(sample.interest)} (${sample.interestDays} days at ${RATE}%)</span></div></div>
      </div>
    </main>
`;
  const body = `    <main class="tool">
      <h2 class="tool-section-title">The penalties, from GOV.UK</h2>
      ${site.table(["Return or tax", "Penalty"], [
        ["Return up to 3 months late", m0(f.initial)],
        ["Return more than 3 months late", `${m0(f.daily)} a day, up to ${m0(f.dailyMax)}`],
        ["Return more than 6 months late", `Another ${f.sixMonthPct}% of the tax due or ${m0(f.sixMonthMin)}, whichever is greater`],
        ["Return more than 12 months late", `Another ${f.twelveMonthPct}% of the tax due or ${m0(f.twelveMonthMin)}, whichever is greater`],
        ["Tax unpaid at 30 days", `${R.penalties.payment.pct}% of the tax unpaid`],
        ["Tax unpaid at 6 months", `Another ${R.penalties.payment.pct}%`],
        ["Tax unpaid at 12 months", `Another ${R.penalties.payment.pct}%`]
      ], 360)}      <p class="tool-hint" style="margin-top:12px;">Interest is charged on tax paid late, at HMRC's late payment rate: ${RATE}% a year from ${dm(fromDate)} (${esc(R.interest.basis)}). The calculator works it out day by day at today's rate; HMRC changes the rate when the base rate moves.</p>
      <p class="about-text" style="margin-top:14px;">For a ${YEAR} return and bill due on 31 January ${Y}, the daily penalties start on 1 May ${Y}, the 6-month penalty after 31 July ${Y} and the 12-month one after 31 January ${Y + 1}. To see what's due on time, use the <a href="/payments-on-account-calculator/">payments on account calculator</a>.</p>
    </main>
`;
  const q = [
    ["What is the penalty for filing a Self Assessment return late?", `${m0(f.initial)} straight away. After 3 months, ${m0(f.daily)} a day up to ${m0(f.dailyMax)}; after 6 months, another ${f.sixMonthPct}% of the tax due or ${m0(f.sixMonthMin)}, whichever is greater; after 12 months, another ${f.twelveMonthPct}% or ${m0(f.twelveMonthMin)}.`],
    ["What is the penalty for paying late?", `${R.penalties.payment.pct}% of the tax unpaid at 30 days, again at 6 months and again at 12 months, plus interest on the amount owed.`],
    ["What interest does HMRC charge on late tax?", `The late payment interest rate: ${RATE}% a year from ${dm(fromDate)}. It's the Bank of England base rate plus 4%, so it changes when the base rate does.`],
    [`How much is the penalty on ${m0(2000)} paid and filed 4 months late?`, `By 31 May ${Y}, a return and ${m0(2000)} of tax both unpaid since 31 January cost ${money(sample.filingTotal)} in late filing penalties (${m0(f.initial)} plus 31 days at ${m0(f.daily)}), ${money(sample.paymentTotal)} in late payment penalties and about ${money(sample.interest)} interest: ${money(sample.total)} in all.`],
    ["Can I appeal a Self Assessment penalty?", "Yes, if you have a reasonable excuse for filing or paying late. Penalties are otherwise due within 30 days of the date on the penalty notice."]
  ];
  return page({ path: "/self-assessment-penalty-calculator/", crumb: "Self Assessment Penalty Calculator", q, tool, body, sources: `${SRC("penalties")} and ${SRC("interest")}`,
    title: site.fitTitle("Self Assessment Penalty Calculator — Late Filing & Payment", "Self Assessment Late Penalty Calculator"),
    desc: `Work out HMRC's penalties and interest for a late Self Assessment return or payment: ${m0(f.initial)} late filing, daily penalties, 5% charges and interest at ${RATE}%.`,
    h1: "Self Assessment penalty calculator", sub: `What it costs to file your ${YEAR} return or pay the tax after <strong>31 January ${Y}</strong>: HMRC's late filing and late payment penalties, and interest.` });
}

const urls = [];
[["payments-on-account-calculator", poaPage()], ["self-assessment-penalty-calculator", penPage()]].forEach(([rel, html]) => { site.write(rel, html); urls.push([`/${rel}/`, "0.6"]); });
site.sitemapBlock("self assessment pages", "tools/build-self-assessment-pages.js", urls);
console.log(`built the payments on account and Self Assessment penalty calculators (deadline ${dm(DUE)})`);
