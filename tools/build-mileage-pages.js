#!/usr/bin/env node
/* The mileage allowance calculator:

       /mileage-allowance-calculator/

       node tools/build-mileage-pages.js

   HMRC's approved mileage rates (55p then 25p a mile for cars from 6 April
   2026, 45p before; 24p motorcycles; 20p bicycles) and how Mileage
   Allowance Payments and Mileage Allowance Relief work, quoted from GOV.UK
   in data/uk/mileage.json. Tax rates for the relief come from the UK and
   Scottish tax files in force. The page is built from the same functions it
   runs (mileage.js), and GOV.UK's worked examples must come out (12,000
   miles: £6,000; £60 at 20%: £12) or the build stops. Runs in the monthly
   rebuild. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const related = require("./related.js");
const registry = require("./tax/registry.js");
const MI = require("../mileage.js");
const { esc, SITE } = site;

const R = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/uk/mileage.json"), "utf8"));
const cur = registry.currentFiles(registry.readAll());
const bands = (id) => cur[id].doc.items.find((i) => i.id === "gb-income-tax").charge.brackets;
const RATES = Array.from(new Set(bands("gb").map((b) => b[1]).concat(bands("gb-sct").map((b) => b[1])))).sort((a, b) => a - b);
const m2 = (v) => "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const m0 = (v) => "£" + Math.round(v).toLocaleString("en-GB");
const Y = "2026-27", y = R.years[Y];

if (MI.approved(R, Y, "car", 12000) !== 6000) throw new Error("mileage: GOV.UK's 12,000-mile example doesn't come out at £6,000");
if (Math.round(60 * 20) / 100 !== 12 || MI.calc(R, Y, "bicycle", 300, 0, 20).relief !== 12) throw new Error("mileage: GOV.UK's £60 at 20% example doesn't come out at £12");
if (!R.rules.rates.quote.includes(`first 10,000 miles ${y.car[0]}p ${R.years.before.car[0]}p`)) throw new Error("mileage: the stored car rates no longer match GOV.UK's quoted table");

const ex = { miles: 8000, paid: 30, rate: 20 }; ex.r = MI.calc(R, Y, "car", ex.miles, ex.paid, ex.rate);
const milesRows = [1000, 3000, 5000, 8000, 10000, 12000, 15000, 20000].map((mi) => {
  const a = MI.approved(R, Y, "car", mi), p25 = MI.calc(R, Y, "car", mi, 25, 20);
  return [mi.toLocaleString("en-GB"), m2(a), m2(a * 0.2), m2(a * 0.4), m2(p25.relief)];
});
const SRC = R.sources.map((s) => `<a href="${s.url}" rel="nofollow noopener" target="_blank">${esc(s.title)}</a>`).join(", ");
const rateOptions = RATES.map((r) => `<option value="${r}"${r === 20 ? " selected" : ""}>${r}%</option>`).join("");

const P = "/mileage-allowance-calculator/", url = SITE + P;
const tool = `    <main class="tool split" id="mi-tool" data-rules="${esc(JSON.stringify({ years: R.years, firstMiles: R.firstMiles }))}">
      <div class="field-row">
        <div class="field"><label for="mi-miles">Business miles in the tax year</label><input type="number" id="mi-miles" value="${ex.miles}" min="0" step="1" inputmode="numeric"></div>
        <div class="field"><label for="mi-paid">Your employer pays (pence a mile)</label><input type="number" id="mi-paid" value="${ex.paid}" min="0" step="any" inputmode="decimal"></div>
      </div>
      <div class="field-row">
        <div class="field"><label for="mi-vehicle">Vehicle</label><select id="mi-vehicle"><option value="car" selected>Car or van</option><option value="motorcycle">Motorcycle</option><option value="bicycle">Bicycle</option></select></div>
        <div class="field"><label for="mi-year">Tax year</label><select id="mi-year">${Object.keys(R.years).map((k) => `<option value="${k}"${k === Y ? " selected" : ""}>${esc(R.years[k].label)}</option>`).join("")}</select></div>
        <div class="field"><label for="mi-rate">Your top rate of income tax</label><select id="mi-rate">${rateOptions}</select></div>
      </div>
      <p class="tool-hint" id="mi-error" role="alert" style="color: var(--bad); display: none;"></p>
      <p class="tool-hint" style="margin:6px 0 0;">Business journeys only: not your commute, unless it's to a temporary workplace. Put 0 if your employer pays nothing.</p>
      <div class="result-box split-aside" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="mi-hero">${m2(ex.r.relief)}</div>
          <div class="label" id="mi-label">tax back if you claim Mileage Allowance Relief on ${m2(ex.r.shortfall)}</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row"><span class="r-label">HMRC's approved amount</span><span class="r-value" id="mi-approved">${m2(ex.r.approved)}</span></div>
          <div class="result-row"><span class="r-label">Your employer pays</span><span class="r-value" id="mi-paid-out">${m2(ex.r.paid)}</span></div>
          <div class="result-row highlight"><span class="r-label">You can claim relief on</span><span class="r-value" id="mi-shortfall">${m2(ex.r.shortfall)}</span></div>
          <div class="result-row"><span class="r-label">Tax back</span><span class="r-value" id="mi-relief">${m2(ex.r.relief)}</span></div>
        </div>
        <p class="tool-hint" id="mi-note" style="margin:10px 0 0;"></p>
      </div>
    </main>
`;

const body = `    <main class="tool">
      <h2 class="tool-section-title">HMRC's approved mileage rates</h2>
${site.table(["Vehicle", "2026 to 2027", "Before 6 April 2026"], [["Car or van, first 10,000 miles", `${y.car[0]}p`, `${R.years.before.car[0]}p`], ["Car or van, after 10,000 miles", `${y.car[1]}p`, `${R.years.before.car[1]}p`], ["Motorcycle", `${y.motorcycle}p`, `${R.years.before.motorcycle}p`], ["Bicycle", `${y.bicycle}p`, `${R.years.before.bicycle}p`]], 440)}      <p class="about-text" style="margin-top:14px;">Your employer can pay you up to these rates for business miles in your own vehicle without tax: the "approved amount", business miles times the rate. In GOV.UK's example, 12,000 miles in a car is <strong>${m0(MI.approved(R, Y, "car", 12000))}</strong> (10,000 × ${y.car[0]}p plus 2,000 × ${y.car[1]}p). The rate covers the whole cost of owning and running the vehicle, so you can't claim fuel, electricity, vehicle tax, MOTs or repairs on top. Electrically assisted pedal bikes use the bicycle rate; other electric bikes the motorcycle rate. An employer can also pay up to ${R.passenger}p a mile tax-free for each colleague you carry on a business journey.</p>
      <h2 class="tool-section-title" style="margin-top:18px;">If your employer pays less: Mileage Allowance Relief</h2>
      <p class="about-text">If your employer pays less than the approved amount, or nothing, you can claim tax relief on the difference. The relief is worth your tax rate: GOV.UK's example is a £60 claim at 20%, worth £12. HMRC usually adjusts your tax code for the current year, or refunds or adjusts it for earlier years, and you can claim for the current tax year and the 4 before it, sending your mileage logs. If you fill in a Self Assessment return, claim there instead.</p>
${site.table(["Business miles (car)", "Approved amount", "Relief at 20% if paid nothing", "At 40%", "At 20% if paid 25p"], milesRows, 560)}      <h2 class="tool-section-title" style="margin-top:18px;">If your employer pays more</h2>
      <p class="about-text">Anything over the approved amount is taxable: your employer reports it on a P11D or puts it through payroll. National Insurance works differently: it has one rate for every mile (${y.niCar}p for cars and vans from 6 April 2026, with no drop after 10,000 miles), worked out for each pay period. So on high mileage, pay between ${y.car[1]}p and ${y.niCar}p a mile above 10,000 miles is taxed but free of National Insurance. To see what the miles themselves cost you, try the <a href="/fuel-cost/">fuel cost calculator</a>.</p>
    </main>
`;

const q = [
  ["What is the HMRC mileage rate for 2026/27?", `${y.car[0]}p a mile for the first 10,000 business miles in a car or van and ${y.car[1]}p after that, up from ${R.years.before.car[0]}p before 6 April 2026. Motorcycles are ${y.motorcycle}p and bicycles ${y.bicycle}p a mile.`],
  ["Can I claim mileage if my employer pays 25p a mile?", `Yes: you can claim tax relief on the difference between what they pay and the approved amount. For ${ex.miles.toLocaleString("en-GB")} miles at ${ex.paid}p that's ${m2(ex.r.shortfall)}, worth ${m2(ex.r.relief)} at 20%. At 25p it would be ${m2(MI.calc(R, Y, "car", ex.miles, 25, 20).shortfall)}, worth ${m2(MI.calc(R, Y, "car", ex.miles, 25, 20).relief)}.`],
  ["Can I claim mileage for my commute?", "No. Travelling to and from your normal workplace doesn't count, unless you're going to a temporary place of work."],
  ["How far back can I claim Mileage Allowance Relief?", "For the current tax year and the 4 previous tax years, if you're eligible. HMRC asks for copies of your mileage logs, including the reason for every journey and where it started."],
  ["Can I claim for fuel as well as mileage?", "Not in your own vehicle: the approved mileage rate covers fuel, electricity, vehicle tax, MOTs and repairs. In a company car you can claim relief on fuel or electricity you paid for on business trips."],
  ["Is mileage allowance taxable?", "Not up to the approved amount. Anything your employer pays above it is taxable, and above the National Insurance rate per mile it also counts for National Insurance."]
];
const title = site.fitTitle(`Mileage Allowance Calculator UK — ${y.car[0]}p HMRC Rate and Tax Relief (2026/27)`, "Mileage Allowance Calculator UK");
const desc = `Work out HMRC's approved mileage amount (${y.car[0]}p a mile for cars from April 2026, then ${y.car[1]}p after 10,000 miles) and how much tax relief you can claim if your employer pays less.`;
const ld = [site.webPage(title, desc, url, R.lastChecked), site.breadcrumb([["Home", SITE + "/"], ["Personal Finance", SITE + "/personal-finance/"], ["Mileage Allowance Calculator", url]]),
  { "@context": "https://schema.org", "@type": "WebApplication", name: "Mileage Allowance Calculator", url, applicationCategory: "FinanceApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } }, site.faqLd(q)];

const html = site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="/personal-finance/">← Personal finance calculators</a>
      <h1 class="page-title">Mileage allowance calculator</h1>
      <p class="page-subtitle">HMRC's approved amount for your business miles, and the tax relief you can claim if your employer pays less.</p>
    </header>

${tool}
${body}
    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}      <p class="tool-hint" style="margin-top:12px;">A guide, not advice. Rates and rules from ${SRC}; tax rates from the UK and Scottish tax files. Last checked ${site.niceDate(R.lastChecked)}.</p>
    </main>

${related.block(P)}
${site.FOOTER}
  </div>
  <script src="/mileage.js"></script>
</body>
</html>
`;
site.write("mileage-allowance-calculator", html);
site.sitemapBlock("mileage allowance pages", "tools/build-mileage-pages.js", [[P, "0.6"]]);
console.log(`built the mileage allowance calculator (${ex.miles} miles at ${ex.paid}p: ${m2(ex.r.shortfall)} to claim, ${m2(ex.r.relief)} back)`);
