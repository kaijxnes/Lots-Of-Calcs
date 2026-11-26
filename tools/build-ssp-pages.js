#!/usr/bin/env node
/* The Statutory Sick Pay calculator:

       /statutory-sick-pay-calculator/

       node tools/build-ssp-pages.js

   GOV.UK's SSP rules (the weekly rate, 80% of average weekly earnings if
   lower, qualifying days, 28 weeks) are quoted in data/uk/ssp.json; the
   page is built from the same functions it runs (ssp.js). The build stops
   unless the quoted weekly rate matches the stored one. Runs in the
   monthly rebuild; the rate changes each April. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const related = require("./related.js");
const SSP = require("../ssp.js");
const { esc, SITE } = site;

const R = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/uk/ssp.json"), "utf8"));
const m2 = (v) => "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const m0 = (v) => "£" + Math.round(v).toLocaleString("en-GB");
const rateText = m2(R.weeklyRate);
if (!R.rules.rate.quote.includes(rateText) || !R.rules.rate.quote.includes(`${R.earningsPct}%`) || !R.rules.rate.quote.includes(`${R.maxWeeks} weeks`)) throw new Error("ssp: the weekly rate, 80% or 28 weeks no longer match GOV.UK's quoted wording in data/uk/ssp.json");

const breakEven = R.weeklyRate / (R.earningsPct / 100);
const ex = { awe: 600, q: 5, days: 10 }; ex.r = SSP.calc(R, ex.awe, ex.q, ex.days, 0);
const low = SSP.calc(R, 120, 5, 5, 0);
const earnRows = [100, 120, 140, Math.round(breakEven * 100) / 100, 200, 400, 800].map((a) => { const r = SSP.calc(R, a, 5, 5, 0); return [m2(a), m2(r.weekly), r.capped ? `80% of earnings` : `the flat rate`]; });
const dayRows = [7, 6, 5, 4, 3, 2, 1].map((q) => { const r = SSP.calc(R, 1000, q, q, 0); return [String(q), m2(r.daily), String(R.maxWeeks * q)]; });
const SRC = R.sources.map((s) => `<a href="${s.url}" rel="nofollow noopener" target="_blank">${esc(s.title)}</a>`).join(" and ");

const P = "/statutory-sick-pay-calculator/", url = SITE + P;
const tool = `    <main class="tool split" id="ssp-tool" data-rules="${esc(JSON.stringify({ weeklyRate: R.weeklyRate, earningsPct: R.earningsPct, maxWeeks: R.maxWeeks }))}">
      <div class="field-row">
        <div class="field"><label for="ssp-pay">Your normal pay before tax</label><input type="number" id="ssp-pay" value="${ex.awe}" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="ssp-per">Per</label><select id="ssp-per"><option value="week" selected>Week</option><option value="month">Month</option><option value="year">Year</option></select></div>
      </div>
      <div class="field-row">
        <div class="field"><label for="ssp-qdays">Days you normally work a week</label><input type="number" id="ssp-qdays" value="${ex.q}" min="1" max="7" step="1" inputmode="numeric"></div>
        <div class="field"><label for="ssp-days">Working days off sick</label><input type="number" id="ssp-days" value="${ex.days}" min="0" step="1" inputmode="numeric"></div>
        <div class="field"><label for="ssp-used">Weeks of SSP already paid (linked sickness)</label><input type="number" id="ssp-used" value="0" min="0" max="${R.maxWeeks}" step="any" inputmode="decimal"></div>
      </div>
      <p class="tool-hint" id="ssp-error" role="alert" style="color: var(--bad); display: none;"></p>
      <p class="tool-hint" style="margin:6px 0 0;">Your employer averages your pay over the 8 weeks before you went off sick. Count only days you'd normally have worked.</p>
      <div class="result-box split-aside" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="ssp-total">${m2(ex.r.total)}</div>
          <div class="label" id="ssp-label">Statutory Sick Pay for ${ex.r.paidDays} working days off sick, before tax</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row highlight"><span class="r-label">SSP a week</span><span class="r-value" id="ssp-weekly">${m2(ex.r.weekly)}</span></div>
          <div class="result-row"><span class="r-label">For each day off</span><span class="r-value" id="ssp-daily">${m2(ex.r.daily)}</span></div>
          <div class="result-row"><span class="r-label">Average weekly earnings</span><span class="r-value" id="ssp-awe">${m2(ex.awe)}</span></div>
          <div class="result-row"><span class="r-label">SSP left after this</span><span class="r-value" id="ssp-left">${ex.r.daysLeft} days (${ex.r.daysLeft / ex.q} weeks)</span></div>
        </div>
        <p class="tool-hint" id="ssp-note" style="margin:10px 0 0;"></p>
      </div>
    </main>
`;

const body = `    <main class="tool">
      <h2 class="tool-section-title">How much Statutory Sick Pay is</h2>
      <p class="about-text">SSP is <strong>${rateText} a week</strong> or <strong>${R.earningsPct}% of your average weekly earnings</strong>, whichever is lower, for up to <strong>${R.maxWeeks} weeks</strong> (${esc(R.taxYear)}). On average earnings of ${m2(breakEven)} a week or more you get the full ${rateText}; below that, ${R.earningsPct}% of your pay. It's paid for every full day you're off sick that you'd normally have worked, through payroll on your usual payday, with tax and National Insurance taken off. Your employer can pay more under a company sick pay scheme, but not less.</p>
${site.table(["Average weekly earnings", "SSP a week", "Based on"], earnRows, 440)}      <h2 class="tool-section-title" style="margin-top:18px;">SSP for each day off</h2>
      <p class="about-text">The weekly amount is shared across your "qualifying days", the days you normally work. Working five days a week, each day off sick pays a fifth of the weekly SSP; working three, a third. Over ${R.maxWeeks} weeks that's ${R.maxWeeks} times your qualifying days.</p>
${site.table(["Days you work a week", "SSP a day (full rate)", "Days SSP lasts"], dayRows, 440)}      <p class="tool-hint" style="margin-top:8px;">Payroll software may round the daily amount slightly differently, so a payslip can differ by a penny or two.</p>
      <h2 class="tool-section-title" style="margin-top:18px;">Who gets it and how long for</h2>
      <p class="about-text">You need to be an employee who has done some work for your employer and been ill for at least one full working day; if you work even a minute before going home sick, that day doesn't count. Tell your employer by their deadline, or within 7 days, and give a fit note if you're off more than 7 days in a row, counting days you don't work. Spells of sickness 8 weeks or less apart are linked, and the ${R.maxWeeks} weeks count across them. You can get SSP from each job if you have more than one. When SSP runs out you may be able to claim Universal Credit or Employment and Support Allowance. If you're on maternity pay, the <a href="/maternity-pay-calculator/">maternity pay calculator</a> covers that instead.</p>
    </main>
`;

const q = [
  ["How much is Statutory Sick Pay?", `${rateText} a week, or ${R.earningsPct}% of your average weekly earnings if that's lower, for up to ${R.maxWeeks} weeks in ${esc(R.taxYear)}. Tax and National Insurance come off it like normal pay.`],
  ["Do I get sick pay from the first day?", "SSP is paid for every full day you're off sick that you'd normally have worked, once you've been ill for at least one full working day. A day you started work and went home sick doesn't count."],
  [`How much SSP do I get if I earn ${m2(120)} a week?`, `${m2(low.weekly)} a week: ${R.earningsPct}% of ${m2(120)}, because that's less than ${rateText}. Working five days a week that's ${m2(low.daily)} for each day off.`],
  ["How is SSP worked out for each day?", `The weekly amount is divided by the number of days you normally work. On five days a week at the full rate, each day off pays ${m2(R.weeklyRate / 5)}.`],
  ["What happens after 28 weeks of SSP?", "SSP stops. You may be able to claim Universal Credit or Employment and Support Allowance, and your employer should give you form SSP1."],
  ["Can my employer pay less than SSP?", "No. Your employer can pay more through a company (occupational) sick pay scheme in your contract, but never less than the statutory amount."]
];
const title = site.fitTitle(`Statutory Sick Pay Calculator ${R.taxYear} — How Much SSP You'll Get`, `SSP Calculator ${R.taxYear}`);
const desc = `Work out your Statutory Sick Pay: ${rateText} a week or ${R.earningsPct}% of your earnings, whichever is lower, for each day you'd normally work, for up to ${R.maxWeeks} weeks (${R.taxYear}).`;
const ld = [site.webPage(title, desc, url, R.lastChecked), site.breadcrumb([["Home", SITE + "/"], ["Personal Finance", SITE + "/personal-finance/"], ["Statutory Sick Pay Calculator", url]]),
  { "@context": "https://schema.org", "@type": "WebApplication", name: "Statutory Sick Pay Calculator", url, applicationCategory: "FinanceApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } }, site.faqLd(q)];

const html = site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="/personal-finance/">← Personal finance calculators</a>
      <h1 class="page-title">Statutory Sick Pay calculator</h1>
      <p class="page-subtitle">How much SSP you'll get for time off sick: ${rateText} a week or ${R.earningsPct}% of your pay, whichever is lower.</p>
    </header>

${tool}
${body}
    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}      <p class="tool-hint" style="margin-top:12px;">A guide, not advice: your employer works out the exact amount. Rules from ${SRC}. Last checked ${site.niceDate(R.lastChecked)}.</p>
    </main>

${related.block(P)}
${site.FOOTER}
  </div>
  <script src="/ssp.js"></script>
</body>
</html>
`;
site.write("statutory-sick-pay-calculator", html);
site.sitemapBlock("statutory sick pay pages", "tools/build-ssp-pages.js", [[P, "0.6"]]);
console.log(`built the SSP calculator (${rateText} a week; ${ex.days} days on ${m0(ex.awe)} a week: ${m2(ex.r.total)})`);
