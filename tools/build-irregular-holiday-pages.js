#!/usr/bin/env node
/* The irregular hours holiday calculator:

       /irregular-hours-holiday-calculator/

       node tools/build-irregular-holiday-pages.js

   GOV.UK's rules for irregular-hours and part-year workers (12.07% of hours
   worked in each pay period, rounding to the nearest hour, rolled-up
   holiday pay at 12.07% of pay) are quoted in data/uk/holiday-irregular.json;
   the page is built from the same functions it runs (holiday-irregular.js).
   The build stops unless GOV.UK's worked examples come out the same. Runs in
   the monthly rebuild. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const related = require("./related.js");
const IH = require("../holiday-irregular.js");
const { esc, SITE } = site;

const R = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/uk/holiday-irregular.json"), "utf8"));
const m2 = (v) => "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const hrs = (v) => { const r = Math.round(v * 1000) / 1000; return r.toLocaleString("en-GB", { maximumFractionDigits: 3 }) + (r === 1 ? " hour" : " hours"); };
const hrs2 = (v) => { const r = Math.round(v * 100) / 100; return r.toLocaleString("en-GB") + (r === 1 ? " hour" : " hours"); };
const PCT = `${R.pct}%`;

/* the rules must still say what the calculator does, and GOV.UK's own examples must come out the same */
if (!R.rules.accrual.quote.includes(PCT) || !R.rules.rolledUp.quote.includes(PCT) || !R.rules.why.quote.includes(`${R.statutoryWeeks} weeks`)) throw new Error("holiday: 12.07% or 5.6 weeks no longer match GOV.UK's quoted wording in data/uk/holiday-irregular.json");
if (IH.pct(R, R.statutoryWeeks) !== Math.round(R.statutoryWeeks / (R.yearWeeks - R.statutoryWeeks) * 10000) / 100) throw new Error("holiday: 5.6 ÷ 46.4 no longer gives the stored percentage");
R.examples.hours.forEach((e) => { const h = IH.hours(e.hours, R.pct); if (h.exact !== e.exact || h.rounded !== e.holiday) throw new Error(`holiday: GOV.UK's ${e.hours}-hour example gives ${h.exact} → ${h.rounded}, not ${e.exact} → ${e.holiday}`); });
R.examples.rolledUp.forEach((e) => { const v = IH.rolledGovuk(e.pay, R.pct); if (v !== e.govuk) throw new Error(`holiday: GOV.UK's rolled-up example on ${m2(e.pay)} gives ${m2(v)}, not ${m2(e.govuk)}`); });
R.examples.contract.forEach((e) => { const v = IH.pct(R, e.weeks); if (v !== e.pct) throw new Error(`holiday: ${e.weeks} weeks gives ${v}%, not ${e.pct}%`); });
if (!R.rules.contract.quote.includes(`${R.examples.contract[0].pct}`)) throw new Error("holiday: the contract example no longer matches GOV.UK's quoted wording");

const ex = { hours: 30, rate: 13.5, period: "week" }; ex.r = IH.calc(R, ex.hours, ex.rate, true, ex.period, R.statutoryWeeks);
const hana = R.examples.rolledUp[0], hanaExact = IH.rolled(hana.pay, R.pct);
const hourRows = [4, 8, 12, 16, 20, 25, 30, 37.5, 40, 50, 68, 80, 100, 120, 150].map((h) => { const r = IH.hours(h, R.pct); return [String(h).replace(".5", "½"), hrs(r.exact), hrs(r.rounded)]; });
const weekRows = [5.6, 6, 6.4, 7, 8].map((w) => [w + " weeks" + (w === R.statutoryWeeks ? " (the legal minimum)" : ""), (Math.round((R.yearWeeks - w) * 10) / 10) + " weeks", IH.pct(R, w) + "%"]);
const payRows = [100, 250, 400, 600, 1000, 1500, 2000].map((p) => [m2(p), m2(IH.rolled(p, R.pct)), m2(p + IH.rolled(p, R.pct))]);
const SRC = R.sources.map((s) => `<a href="${s.url}" rel="nofollow noopener" target="_blank">${esc(s.title)}</a>`).join(" and ");
const h40 = IH.hours(40, R.pct), h20 = IH.hours(20, R.pct);

const P = "/irregular-hours-holiday-calculator/", url = SITE + P;
const tool = `    <main class="tool split" id="ih-tool" data-rules="${esc(JSON.stringify({ pct: R.pct, statutoryWeeks: R.statutoryWeeks, yearWeeks: R.yearWeeks }))}">
      <div class="field-row">
        <div class="field"><label for="ih-hours">Hours worked in the pay period</label><input type="number" id="ih-hours" value="${ex.hours}" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="ih-freq">You're paid</label><select id="ih-freq"><option value="week" selected>Weekly</option><option value="fortnight">Fortnightly</option><option value="four">Every 4 weeks</option><option value="month">Monthly</option></select></div>
      </div>
      <div class="field-row">
        <div class="field"><label for="ih-pay">Your pay before tax</label><input type="number" id="ih-pay" value="${ex.rate}" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="ih-per">Per</label><select id="ih-per"><option value="hour" selected>Hour</option><option value="period">For the pay period</option></select></div>
        <div class="field"><label for="ih-weeks">Weeks of holiday a year in your contract</label><input type="number" id="ih-weeks" value="${R.statutoryWeeks}" min="${R.statutoryWeeks}" max="26" step="any" inputmode="decimal"></div>
      </div>
      <p class="tool-hint" id="ih-error" role="alert" style="color: var(--bad); display: none;"></p>
      <p class="tool-hint" style="margin:6px 0 0;">For leave years starting on or after 1 April 2024. Use your total pay for the period, including overtime and shift premiums.</p>
      <div class="result-box split-aside" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="ih-holiday">${hrs2(ex.r.holiday)}</div>
          <div class="label" id="ih-label">holiday earned for ${hrs(ex.hours)} of work (${hrs2(ex.r.exact)} before rounding)</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row"><span class="r-label">Holiday builds up at</span><span class="r-value" id="ih-pct">${PCT} of hours worked</span></div>
          <div class="result-row highlight"><span class="r-label">Rolled-up holiday pay</span><span class="r-value" id="ih-rolled">${m2(ex.r.rolled)}</span></div>
          <div class="result-row"><span class="r-label">Pay with holiday pay added</span><span class="r-value" id="ih-total">${m2(ex.r.withHoliday)}</span></div>
          <div class="result-row"><span class="r-label">Holiday a year if every pay period is like this</span><span class="r-value" id="ih-year-hours">${hrs2(ex.r.yearHours)}</span></div>
          <div class="result-row"><span class="r-label">Rolled-up holiday pay a year</span><span class="r-value" id="ih-year-pay">${m2(ex.r.yearRolled)}</span></div>
        </div>
        <p class="tool-hint" style="margin:10px 0 0;">Rolled-up holiday pay is only paid if your employer uses it; otherwise you're paid for the hours of holiday when you take them. The yearly figures are before each pay period is rounded.</p>
      </div>
    </main>
`;

const body = `    <main class="tool">
      <h2 class="tool-section-title">How holiday works for irregular hours</h2>
      <p class="about-text">If your hours change from one pay period to the next, or you work only part of the year, you build up holiday as you work: <strong>${PCT} of the hours you work in each pay period</strong>, for leave years starting on or after 1 April 2024. GOV.UK rounds it to the nearest hour: under half an hour rounds down, even to nothing, and half an hour or more rounds up. GOV.UK's example is 30 hours in a week earning 4 hours of holiday (30 × 12.07 ÷ 100 = 3.621), which you can take from the next pay period. If you're paid weekly and work 4 hours a week or less, GOV.UK says it may be appropriate for your employer to round up to the next half hour or hour so you still build up holiday.</p>
${site.table(["Hours worked in the pay period", "Holiday earned", "Rounded to the nearest hour"], hourRows, 520)}      <h2 class="tool-section-title" style="margin-top:18px;">Why it's 12.07%</h2>
      <p class="about-text">Almost all workers are entitled to 5.6 weeks' paid holiday a year, which leaves 46.4 weeks of work (52 minus 5.6). 5.6 ÷ 46.4 is 12.07%, so ${PCT} of the hours you work over 46.4 weeks comes to 5.6 weeks of holiday. That's also the most statutory holiday you can build up in a year. If your contract gives more holiday, the percentage is the weeks of holiday ÷ the weeks left to work × 100: GOV.UK's example is 6 weeks giving 6 ÷ 46 = ${IH.pct(R, 6)}%. Enter your contract's weeks above to use your own percentage.</p>
${site.table(["Holiday a year", "Weeks left to work", "Holiday builds up at"], weekRows, 480)}      <h2 class="tool-section-title" style="margin-top:18px;">Rolled-up holiday pay</h2>
      <p class="about-text">Instead of paying you when you take holiday, your employer can add holiday pay to every payslip: <strong>${PCT} of your total pay for the pay period</strong>, shown as a separate item and paid on top of your normal pay, which must be at least the <a href="/minimum-wage-calculator/">minimum wage</a>. It's only allowed for irregular-hours and part-year workers, and not if your leave year began on or before 31 March 2024. Your pay for the period includes overtime and shift premiums: GOV.UK's example is 20 hours at £11 and 20 hours at £12, £460 in total, giving £55.52 of holiday pay.</p>
${site.table(["Pay for the period", "Rolled-up holiday pay", "Pay with holiday pay"], payRows, 480)}      <p class="tool-hint" style="margin-top:8px;">GOV.UK's worked example rounds the pay ÷ 100 step to the penny before multiplying by 12.07, so on ${m2(hana.pay)} it gets ${m2(hana.govuk)} where 12.07% exactly is ${m2(hanaExact)}. Payslips can differ by a few pence.</p>
      <h2 class="tool-section-title" style="margin-top:18px;">If your employer doesn't roll it up</h2>
      <p class="about-text">You're paid when you take holiday. All of an irregular-hours or part-year worker's leave is paid at the "normal" rate, which includes commission, regular overtime and payments for length of service or qualifications, but not usually bonuses. A week's pay is your average pay over the previous 52 weeks, counting only weeks you were paid; your employer can count back up to 104 weeks to find them.</p>
      <h2 class="tool-section-title" style="margin-top:18px;">Who counts as irregular hours or part-year</h2>
      <p class="about-text">You're an <strong>irregular-hours worker</strong> if your contract makes the paid hours you work in each pay period wholly or mostly variable, as on a zero-hours or casual contract. A fixed rota with no overtime, such as 15 hours one week and 20 the next, isn't irregular. You're a <strong>part-year worker</strong> if your contract has you work only part of the year, with periods of at least a week when you don't work and aren't paid, such as seasonal work, even on fixed hours. Everyone else gets 5.6 weeks a year worked out in days: the <a href="/holiday-entitlement-calculator/">holiday entitlement calculator</a> does that, and the <a href="/pro-rata-salary-calculator/">pro rata calculator</a> covers part-time pay.</p>
    </main>
`;

const q = [
  ["What is 12.07% holiday pay?", `Irregular-hours and part-year workers build up holiday at ${PCT} of the hours they work in each pay period. If their employer uses rolled-up holiday pay, they get ${PCT} of their pay for the period on top, instead of being paid when they take the holiday.`],
  ["How many hours of holiday do I get for 40 hours of work?", `${hrs(h40.exact)}, which rounds to ${hrs(h40.rounded)}. For 20 hours it's ${hrs(h20.exact)}, rounding to ${hrs(h20.rounded)}.`],
  ["Why is it 12.07% and not 12.5%?", "You're entitled to 5.6 weeks of holiday out of 52, which leaves 46.4 weeks of work. Holiday builds up while you work, so it's 5.6 ÷ 46.4, which is 12.07%."],
  ["How is the holiday rounded?", "To the nearest hour in each pay period: less than half an hour rounds down, even to zero, and half an hour or more rounds up. GOV.UK says that if you're paid weekly and work 4 hours a week or less, your employer may round up to the next half hour or hour."],
  ["Can my employer pay rolled-up holiday pay?", "Only if you're an irregular-hours or part-year worker and your leave year started on or after 1 April 2024. It must be shown separately on each payslip and paid on top of your normal pay."],
  ["What if my contract gives more than 5.6 weeks?", `Work out your own percentage: weeks of holiday ÷ the weeks left to work × 100. GOV.UK's example is 6 weeks: 6 ÷ 46 = ${IH.pct(R, 6)}%.`]
];
const title = site.fitTitle("Irregular Hours Holiday Calculator — 12.07% Holiday and Rolled-Up Holiday Pay", "Irregular Hours Holiday Calculator");
const desc = `Work out the holiday you build up on irregular hours or part-year work: ${PCT} of the hours you work each pay period, rounded to the nearest hour, and ${PCT} rolled-up holiday pay.`;
const ld = [site.webPage(title, desc, url, R.lastChecked), site.breadcrumb([["Home", SITE + "/"], ["Personal Finance", SITE + "/personal-finance/"], ["Irregular Hours Holiday Calculator", url]]),
  { "@context": "https://schema.org", "@type": "WebApplication", name: "Irregular Hours Holiday Calculator", url, applicationCategory: "FinanceApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } }, site.faqLd(q)];

const html = site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="/personal-finance/">← Personal finance calculators</a>
      <h1 class="page-title">Irregular hours holiday calculator</h1>
      <p class="page-subtitle">The holiday you build up on irregular hours or part-year work (${PCT} of the hours you work), and rolled-up holiday pay.</p>
    </header>

${tool}
${body}
    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}      <p class="tool-hint" style="margin-top:12px;">A guide, not advice: check your contract, and your employer works out the exact amount. Rules from ${SRC}. Last checked ${site.niceDate(R.lastChecked)}.</p>
    </main>

${related.block(P)}
${site.FOOTER}
  </div>
  <script src="/holiday-irregular.js"></script>
</body>
</html>
`;
site.write("irregular-hours-holiday-calculator", html);
site.sitemapBlock("irregular hours holiday pages", "tools/build-irregular-holiday-pages.js", [[P, "0.6"]]);
console.log(`built the irregular hours holiday calculator (${ex.hours} hours at ${m2(ex.rate)}: ${hrs(ex.r.holiday)} of holiday, ${m2(ex.r.rolled)} rolled-up)`);
