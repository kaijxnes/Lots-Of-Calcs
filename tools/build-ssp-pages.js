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
const tool = (ex) => `    <main class="tool split" id="ssp-tool" data-rules="${esc(JSON.stringify({ weeklyRate: R.weeklyRate, earningsPct: R.earningsPct, maxWeeks: R.maxWeeks }))}">
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

${tool(ex)}
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

/* /statutory-sick-pay-calculator/2-weeks/: SSP for one length of time off */
const WEEKS = [1, 2, 3, 4, 6, 8, 10, 12, 16, 20, 24, 28].filter((w) => w <= R.maxWeeks);
const wurl = (w) => `${P}${w}-week${w > 1 ? "s" : ""}/`;
const wk = (w) => `${w} week${w > 1 ? "s" : ""}`;
/* hand-checked: 2 weeks off, 5-day week, full rate: 10 days x £24.65 = £246.50 */
if (R.weeklyRate === 123.25 && SSP.calc(R, 600, 5, 10, 0).total !== 246.5) throw new Error("ssp: the hand-checked 2-week example no longer comes out");
function weeksPage(w) {
  const u = SITE + wurl(w), full = SSP.calc(R, 1000, 5, w * 5, 0);
  const ex2 = { awe: 600, q: 5, days: w * 5 }; ex2.r = SSP.calc(R, ex2.awe, ex2.q, ex2.days, 0);
  const er = [100, 120, 140, Math.round(breakEven * 100) / 100, 400].map((a) => { const r = SSP.calc(R, a, 5, w * 5, 0); return [m2(a), m2(r.weekly), `<strong>${m2(r.total)}</strong>`]; });
  const dr = [5, 4, 3, 2].map((q) => { const r = SSP.calc(R, 1000, q, w * q, 0); return [String(q), String(w * q), m2(r.daily), m2(r.total)]; });
  const left = R.maxWeeks - w;
  const q = [
    [`How much SSP do I get for ${wk(w)} off sick?`, `${m2(full.total)} at the full rate of ${rateText} a week (${esc(R.taxYear)}), before tax and National Insurance. If you earn less than ${m2(breakEven)} a week, it's ${R.earningsPct}% of your average weekly earnings instead.`],
    ["Do I get sick pay from the first day?", "SSP is paid for every full day you're off sick that you'd normally have worked, once you've been ill for at least one full working day. A day you started work and went home sick doesn't count."],
    [`Do I need a fit note for ${wk(w)} off?`, w * 7 > 7 ? "Yes: you must give your employer a fit note if you're off work for more than 7 days in a row, including days you don't normally work." : "Not for 7 days or fewer in a row: a fit note is needed if you're off work for more than 7 days in a row, including days you don't normally work."],
    [`How much SSP is left after ${wk(w)}?`, left > 0 ? `${wk(left)}: SSP lasts up to ${R.maxWeeks} weeks, counted across spells of sickness 8 weeks or less apart.` : `None: ${R.maxWeeks} weeks is the most SSP pays. You may be able to claim Universal Credit or Employment and Support Allowance, and your employer should give you form SSP1.`]
  ];
  const title = site.fitTitle(`Statutory Sick Pay for ${wk(w)} (${R.taxYear}) — How Much SSP`, `SSP for ${wk(w)} (${R.taxYear})`);
  const desc = `How much Statutory Sick Pay you get for ${wk(w)} off sick: ${m2(full.total)} at the full rate of ${rateText} a week, or less if you earn under ${m2(breakEven)} a week (${R.taxYear}).`;
  const ld = [site.webPage(title, desc, u, R.lastChecked), site.breadcrumb([["Home", SITE + "/"], ["Statutory Sick Pay Calculator", url], [wk(w), u]]), site.faqLd(q)];
  return site.head({ title, desc, url: u, ld }) + `    <header class="site-header">
      <a class="back-link" href="${P}">← Statutory Sick Pay calculator</a>
      <h1 class="page-title">Statutory Sick Pay for ${wk(w)}</h1>
      <p class="page-subtitle">How much SSP you'll get for ${wk(w)} off sick, ${esc(R.taxYear)}.</p>
    </header>

${tool(ex2)}
    <main class="tool">
      <h2 class="tool-section-title">SSP for ${wk(w)} by earnings</h2>
${site.table(["Average weekly earnings", "SSP a week", `SSP for ${wk(w)}`], er, 420)}      <p class="about-text" style="margin-top:14px;">SSP is ${rateText} a week or ${R.earningsPct}% of your average weekly earnings, whichever is lower, for up to ${R.maxWeeks} weeks. For ${wk(w)} off at the full rate that's <strong>${m2(full.total)}</strong> before tax and National Insurance, paid through payroll on your usual payday. ${left > 0 ? `That leaves ${wk(left)} of SSP if you're off again within 8 weeks.` : "That's the most SSP pays."} Your employer can pay more under a company sick pay scheme, but not less.</p>
      <h2 class="tool-section-title" style="margin-top:18px;">By the days you work</h2>
${site.table(["Days you work a week", "Days off sick", "SSP a day", `SSP for ${wk(w)}`], dr, 440)}      <p class="tool-hint" style="margin-top:8px;">At the full rate. The weekly amount is shared across the days you normally work, so the total for whole weeks is the same.</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}      <p class="tool-hint" style="margin-top:12px;">A guide, not advice: your employer works out the exact amount. Rules from ${SRC}. Last checked ${site.niceDate(R.lastChecked)}.</p>
    </main>

    <div class="hub-group-title" style="margin-top:28px;">Other lengths of time</div>
    <p class="salary-links">${WEEKS.filter((x) => x !== w).map((x) => `<a href="${wurl(x)}">SSP for ${wk(x)}</a>`).join(" ")}</p>

${related.block(P)}
${site.FOOTER}
  </div>
  <script src="/ssp.js"></script>
</body>
</html>
`;
}
WEEKS.forEach((w) => site.write(wurl(w).replace(/^\/|\/$/g, ""), weeksPage(w)));
site.prune("statutory-sick-pay-calculator", /^\d+-weeks?$/);
site.hubBlock(P, "ssp by weeks", "tools/build-ssp-pages.js", `    <main class="tool">
      <h2 class="tool-section-title">SSP by length of time off</h2>
      <p class="salary-links">${WEEKS.map((w) => `<a href="${wurl(w)}">SSP for ${wk(w)}</a>`).join(" ")}</p>
    </main>
`);
site.sitemapBlock("statutory sick pay pages", "tools/build-ssp-pages.js", [[P, "0.6"]].concat(WEEKS.map((w) => [wurl(w), "0.5"])));
console.log(`built the SSP calculator (${rateText} a week; ${ex.days} days on ${m0(ex.awe)} a week: ${m2(ex.r.total)})`);
