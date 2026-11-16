#!/usr/bin/env node
/* "How much can I borrow on £40,000?" and "How much house can I afford on
   $75,000?" — a page per salary, from the mortgage affordability calculator's
   own functions (mortgage-affordability.js) and, for UK take-home pay, the
   tax registry:

       /mortgage-affordability/uk/40000/
       /mortgage-affordability/us/75000/

       node tools/build-borrowing-pages.js

   The assumptions are the calculator's own starting figures, and every page
   says they're examples: UK 4 to 4.5 times income, 4.5% over 25 years with a
   3-point stress test; US the 28/36 rule, 6.5% over 30 years, 1.1% property
   tax and $1,800 a year insurance. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const registry = require("./tax/registry.js");
const TaxEngine = require("../tax-engine.js");
const A = require("../mortgage-affordability.js");
const SD = require("../stamp-duty.js");
const links = require("./page-links.js");
const config = require("./salary-pages-config.js");
const { esc, SITE } = site;

const UK = { partner: 0, multiple: 4.5, deposit: 0, debts: 0, rate: 4.5, years: 25, stress: 3 };
const US = { debts: 0, down: 0, rate: 6.5, years: 30, taxPct: 1.1, insurance: 1800, hoa: 0, front: 28, back: 36 };
const SDR = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/property/uk-stamp-duty.json"), "utf8"));
const UK_SALARIES = config.SALARIES.GBP.filter((s) => s >= 18000 && s <= 150000);
const US_SALARIES = config.SALARIES.USD.filter((s) => s <= 250000);
const gbp = (v) => "£" + Math.round(v).toLocaleString("en-GB");
const usd = (v) => "$" + Math.round(v).toLocaleString("en-US");
const r1000 = (v) => Math.round(v / 1000) * 1000;
const chain = registry.loadChain("gb");
const net = (g) => TaxEngine.compute(chain, g).perMonth;
const CHECKED = (() => { const d = [chain].flatMap((c) => c.map((x) => x.lastChecked)); return d.every(Boolean) ? d.sort()[0] : undefined; })();
const BASE = "/mortgage-affordability/";
const ASSUME_UK = `Examples, not quotes: ${UK.rate}% over ${UK.years} years, with the payment also tested ${UK.stress} points higher, as lenders do. Lenders set their own multiples and check your spending, debts and credit record.`;
const ASSUME_US = `Using the 28/36 rule with ${US.rate}% over ${US.years} years, ${US.taxPct}% property tax and ${usd(US.insurance)} a year homeowners insurance — examples, not quotes. Lenders' limits vary, and FHA and VA loans can allow more.`;

/* US: with a down payment that's a share of the price, iterate to the price that fits */
function usFit(income, downPct, debts) {
  let p = A.us({ ...US, income, debts, down: 0 }).price;
  for (let i = 0; i < 80; i++) p = A.us({ ...US, income, debts, down: downPct * p }).price;
  return A.us({ ...US, income, debts, down: downPct * p });
}

function ukPage(salary) {
  const url = SITE + `${BASE}uk/${salary}/`;
  const lo = A.uk({ ...UK, income: salary, multiple: 4 }), hi = A.uk({ ...UK, income: salary }), x5 = A.uk({ ...UK, income: salary, multiple: 5 });
  const home = hi.loan / 0.9; // with a 10% deposit
  const share = Math.round(hi.payment / net(salary) * 100);
  const joint = A.uk({ ...UK, income: salary, partner: salary });
  const sdMove = SD.calc(SDR, "england", home, "home").total, sdFtb = SD.calc(SDR, "england", home, "ftb").total;
  const title = site.fitTitle(`How Much Can I Borrow on ${gbp(salary)}? — ${gbp(lo.loan)} to ${gbp(hi.loan)} Mortgage`, `How Much Can I Borrow on ${gbp(salary)}? — Up to ${gbp(hi.loan)}`);
  const desc = `On ${gbp(salary)} most lenders lend ${gbp(lo.loan)}–${gbp(hi.loan)} (4–4.5× income): ${gbp(hi.payment)} a month at ${UK.rate}% over ${UK.years} years, ${share}% of take-home pay.`;
  const rows = [[4, lo], [4.5, hi], [5, x5]].map(([mult, r]) => [`${mult} × income`, gbp(r.loan), gbp(r.loan / 0.9), gbp(r.payment), gbp(r.stressed), `${Math.round(r.payment / net(salary) * 100)}%`]);
  const salaryUrl = links.salaryUk(salary), mort = links.mortgageUkNear(hi.loan), sd = links.stampDutyNear(home), se = links.selfEmployed(salary);
  const q = [
    [`How much can I borrow on ${gbp(salary)}?`, `Most UK lenders lend around 4 to 4.5 times your income, so about ${gbp(lo.loan)} to ${gbp(hi.loan)} on ${gbp(salary)}. Some go to 5 times (${gbp(x5.loan)}) or more for higher earners. Each lender also checks your spending, debts and credit record, so the real figure can be lower.`],
    [`What could I afford on ${gbp(salary)} with a deposit?`, `With a 10% deposit, borrowing ${gbp(hi.loan)} buys a home of about ${gbp(home)}; with a 15% deposit, about ${gbp(hi.loan / 0.85)}. Stamp duty on ${gbp(home)} in England would be ${gbp(sdMove)}, or ${gbp(sdFtb)} for a first-time buyer.`],
    [`What would the mortgage cost a month?`, `${gbp(hi.payment)} a month on ${gbp(hi.loan)} at ${UK.rate}% over ${UK.years} years — ${share}% of the ${gbp(net(salary))} a month a ${gbp(salary)} salary leaves after tax and National Insurance. If rates rose ${UK.stress} points it would be ${gbp(hi.stressed)}.`],
    ["What if I'm buying with someone?", `Lenders add your incomes: with a partner also earning ${gbp(salary)}, 4.5 times your joint income is ${gbp(joint.loan)}.`],
    ["Is this what a lender will offer?", ASSUME_UK]
  ];
  const ld = [site.webPage(title, desc, url, CHECKED), site.breadcrumb([["Home", SITE + "/"], ["Mortgage Affordability", SITE + BASE], [`Borrowing on ${gbp(salary)}`, url]]), site.faqLd(q)];
  const near = site.neighbours(UK_SALARIES, salary, 6).filter((s) => s !== salary).map((s) => `<a href="${BASE}uk/${s}/">${gbp(s)}</a>`).join(" ");
  const more = [
    salaryUrl ? `<a href="${salaryUrl}">${gbp(salary)} after tax</a>` : "",
    mort ? `<a href="${mort.url}">Payments on a ${gbp(mort.value)} mortgage</a>` : "",
    sd ? `<a href="${sd.url}">Stamp duty on ${gbp(sd.value)}</a>` : "",
    se ? `<a href="${se}">${gbp(salary)} self-employed</a>` : "",
    `<a href="/pay-rise-calculator/">What a pay rise adds</a>`
  ].filter(Boolean).join(" ");
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="${BASE}">← Mortgage affordability calculator</a>
      <h1 class="page-title">How much can I borrow on ${gbp(salary)}?</h1>
      <p class="page-subtitle">About ${gbp(lo.loan)} to ${gbp(hi.loan)} at 4 to 4.5 times income — ${gbp(hi.payment)} a month.</p>
    </header>

    <main class="tool">
      <div class="result-box">
        <div class="result-hero">
          <div class="value">${gbp(lo.loan)} – ${gbp(hi.loan)}</div>
          <div class="label">typical mortgage on ${gbp(salary)}</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row highlight"><span class="r-label">Home it buys with a 10% deposit</span><span class="r-value">up to ${gbp(home)}</span></div>
          <div class="result-row"><span class="r-label">Monthly payment (${UK.rate}%, ${UK.years} years)</span><span class="r-value">${gbp(hi.payment)}</span></div>
          <div class="result-row"><span class="r-label">Share of take-home pay</span><span class="r-value">${share}% of ${gbp(net(salary))}</span></div>
          <div class="result-row"><span class="r-label">If rates rose ${UK.stress} points</span><span class="r-value">${gbp(hi.stressed)}</span></div>
          <div class="result-row"><span class="r-label">Stamp duty on ${gbp(home)} (England)</span><span class="r-value">${gbp(sdMove)}; first-time buyer ${gbp(sdFtb)}</span></div>
        </div>
      </div>
      <p class="tool-hint" style="margin-top:12px;">Put in your own deposit, debts, partner's income and rate with the <a href="${BASE}">mortgage affordability calculator</a>.</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">By income multiple</p>
${site.table(["Lender's multiple", "Borrowing", "Home (10% deposit)", "A month", "Stress-tested", "Of take-home"], rows, 600)}      <p class="tool-hint" style="margin-top:12px;">${esc(ASSUME_UK)} Take-home pay is after income tax and National Insurance (${esc(chain[0].taxYear.label)}, England, Wales and Northern Ireland), with no pension or student loan.</p>
      <p class="tool-section-title" style="margin-top:22px;">More on ${gbp(salary)}</p>
      <p class="salary-links">${more}</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">Frequently asked questions</p>
${site.faqHtml(q)}    </main>

    <div class="hub-group-title" style="margin-top:28px;">Other salaries</div>
    <p class="salary-links">${near}</p>

${site.FOOTER}
  </div>
</body>
</html>
`;
}

function usPage(salary) {
  const url = SITE + `${BASE}us/${salary}/`;
  const r20 = usFit(salary, 0.2, 0), r10 = usFit(salary, 0.1, 0);
  const debtRows = [0, 300, 600, 1000].map((d) => { const r = usFit(salary, 0.2, d); return [d ? `${usd(d)} a month` : "None", usd(r.price), usd(r.loan), usd(r.piti)]; });
  const title = site.fitTitle(`How Much House Can I Afford on ${usd(salary)} a Year? — About ${usd(r1000(r20.price))}`, `How Much House Can I Afford on ${usd(salary)}? — About ${usd(r1000(r20.price))}`);
  const desc = `On ${usd(salary)} a year the 28/36 rule puts a home of about ${usd(r20.price)} in reach with 20% down — ${usd(r20.piti)} a month including tax and insurance.`;
  const mort = links.mortgageUsNear(r20.loan);
  const q = [
    [`How much house can I afford on ${usd(salary)} a year?`, `About ${usd(r20.price)} with 20% down (${usd(0.2 * r20.price)}), using the 28/36 rule: housing costs up to 28% of your ${usd(salary / 12)} gross monthly income, ${usd(r20.cap)} a month. With 10% down it's about ${usd(r10.price)}, though that usually means paying mortgage insurance too.`],
    ["What would the monthly payment be?", `${usd(r20.piti)} a month: ${usd(r20.pi)} principal and interest on ${usd(r20.loan)} at ${US.rate}% over ${US.years} years, plus about ${usd(r20.tax)} property tax and ${usd(r20.other)} insurance.`],
    ["How do other debts change it?", `The 36% part of the rule caps all your debt payments, so car loans, student loans and card minimums reduce what you can spend on housing: ${usd(600)} a month of other debts brings the price down to about ${usd(usFit(salary, 0.2, 600).price)}.`],
    ["Is this what a lender will approve?", ASSUME_US]
  ];
  const ld = [site.webPage(title, desc, url, CHECKED), site.breadcrumb([["Home", SITE + "/"], ["Mortgage Affordability", SITE + BASE], [`Afford on ${usd(salary)}`, url]]), site.faqLd(q)];
  const near = site.neighbours(US_SALARIES, salary, 6).filter((s) => s !== salary).map((s) => `<a href="${BASE}us/${s}/">${usd(s)}</a>`).join(" ");
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="${BASE}">← Mortgage affordability calculator</a>
      <h1 class="page-title">How much house can I afford on ${usd(salary)} a year?</h1>
      <p class="page-subtitle">About ${usd(r20.price)} with 20% down, by the 28/36 rule — ${usd(r20.piti)} a month.</p>
    </header>

    <main class="tool">
      <div class="result-box">
        <div class="result-hero">
          <div class="value">${usd(r20.price)}</div>
          <div class="label">home you could afford with 20% down</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row highlight"><span class="r-label">Loan</span><span class="r-value">${usd(r20.loan)}</span></div>
          <div class="result-row"><span class="r-label">Down payment (20%)</span><span class="r-value">${usd(0.2 * r20.price)}</span></div>
          <div class="result-row"><span class="r-label">Monthly payment (PITI)</span><span class="r-value">${usd(r20.piti)}</span></div>
          <div class="result-row"><span class="r-label">With 10% down</span><span class="r-value">about ${usd(r10.price)} (plus mortgage insurance)</span></div>
        </div>
      </div>
      <p class="tool-hint" style="margin-top:12px;">Put in your own down payment, debts, rate, property tax and HOA with the <a href="${BASE}">mortgage affordability calculator</a>.</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">With other monthly debts</p>
${site.table(["Other debts", "Home price", "Loan", "Housing a month"], debtRows, 460)}      <p class="tool-hint" style="margin-top:12px;">${esc(ASSUME_US)}</p>
      <p class="tool-section-title" style="margin-top:22px;">More on ${usd(salary)}</p>
      <p class="salary-links"><a href="/salary/us/">${usd(salary)} after tax in every state</a>${mort ? ` <a href="${mort.url}">Payments on a ${usd(mort.value)} mortgage</a>` : ""} <a href="/pay-rise-calculator/">What a raise adds</a></p>
    </main>

    <main class="tool">
      <p class="tool-section-title">Frequently asked questions</p>
${site.faqHtml(q)}    </main>

    <div class="hub-group-title" style="margin-top:28px;">Other salaries</div>
    <p class="salary-links">${near}</p>

${site.FOOTER}
  </div>
</body>
</html>
`;
}

/* Links from the calculator page, so the pages are reachable */
function hubBlock() {
  const file = path.join(site.ROOT, "mortgage-affordability/index.html");
  const START = "    <!-- borrowing pages: generated by tools/build-borrowing-pages.js -->\n", END = "    <!-- end borrowing pages -->\n";
  let s = fs.readFileSync(file, "utf8");
  if (s.includes(START)) s = s.slice(0, s.indexOf(START)) + s.slice(s.indexOf(END) + END.length);
  const html = `    <main class="tool">
      <p class="tool-section-title">By salary</p>
      <p class="salary-links-title">UK: how much can I borrow on…</p>
      <p class="salary-links">${UK_SALARIES.map((x) => `<a href="${BASE}uk/${x}/">${gbp(x)}</a>`).join(" ")}</p>
      <p class="salary-links-title">US: how much house can I afford on…</p>
      <p class="salary-links">${US_SALARIES.map((x) => `<a href="${BASE}us/${x}/">${usd(x)}</a>`).join(" ")}</p>
    </main>

`;
  const at = s.indexOf("    <!-- related calculators: generated by tools/related.js -->");
  s = s.slice(0, at) + START + html + END + "\n" + s.slice(at);
  fs.writeFileSync(file, s);
}

/* Checks against the calculator page's own worked figures */
if (Math.round(A.uk({ ...UK, income: 30000 }).loan) !== 135000) throw new Error("UK borrowing check");

const urls = [];
UK_SALARIES.forEach((s) => { site.write(`mortgage-affordability/uk/${s}`, ukPage(s)); urls.push([`${BASE}uk/${s}/`, "0.6"]); });
US_SALARIES.forEach((s) => { site.write(`mortgage-affordability/us/${s}`, usPage(s)); urls.push([`${BASE}us/${s}/`, "0.6"]); });
hubBlock();
site.prune("mortgage-affordability/uk", /^\d+$/);
site.prune("mortgage-affordability/us", /^\d+$/);
site.sitemapBlock("borrowing pages", "tools/build-borrowing-pages.js", urls);
console.log(`built ${urls.length} borrowing pages (${UK_SALARIES.length} UK, ${US_SALARIES.length} US)`);
