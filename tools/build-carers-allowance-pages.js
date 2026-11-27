#!/usr/bin/env node
/* The Carer's Allowance earnings calculator:

       /carers-allowance-calculator/

       node tools/build-carers-allowance-pages.js

   The weekly rate, earnings limit and the rules for counting earnings are
   quoted from GOV.UK and the Computation of Earnings Regulations 1996 in
   data/uk/carers-allowance.json; tax and National Insurance estimates use
   the UK tax file in force (tools/lib/uk-config.js), and the hours table the
   minimum wage in force (data/uk/minimum-wage.json). The build stops unless
   the figures are in the quoted wording and hand-checked examples come out.
   Runs in the monthly rebuild. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const related = require("./related.js");
const UK = require("../uk-calcs.js");
const CA = require("../carers-allowance.js");
const { cfg } = require("./lib/uk-config.js")();
const { esc, SITE } = site;

const J = (f) => JSON.parse(fs.readFileSync(path.join(site.ROOT, f), "utf8"));
const R = J("data/uk/carers-allowance.json"), MW = J("data/uk/minimum-wage.json");
const m2 = (v) => "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const m0 = (v) => "£" + Math.round(v).toLocaleString("en-GB");
const Q = (k) => R.rules[k].quote;
[["rate", m2(R.weekly)], ["rate", `${R.hours} hours`], ["limit", `${m0(R.limit)} or less a week`], ["net", "one half of any sum"], ["care", "50% of his net earnings"], ["weekly", "multiplying the amount of that payment by 12 and dividing the product by 52"]]
  .forEach(([k, s]) => { if (!Q(k).includes(s)) throw new Error(`carer's allowance: "${s}" isn't in the quoted wording for ${k} (data/uk/carers-allowance.json)`); });
/* hand-checked: £880 a month = £203.08 a week, under the tax and NI thresholds, so within £204;
   £900 a month = £207.69, over by £3.69; with £40 a month pension (£9.23 a week, half £4.62) it's £203.08 again, within;
   £300 a week with £150 of care costs: NI 8% of (£300 − £241.73) ≈ £4.66, tax 20% of (£300 − £241.73) ≈ £11.65, net ≈ £283.69; care capped at half (£141.85), counted ≈ £141.85 */
const c1 = CA.calc(UK, cfg, R, { gross: 880, per: "month" }), c2 = CA.calc(UK, cfg, R, { gross: 900, per: "month" }), c3 = CA.calc(UK, cfg, R, { gross: 900, per: "month", pension: 40 });
const c4 = CA.calc(UK, cfg, R, { gross: 300, per: "week", care: 150 });
if (cfg.year === "2026/27" && (c1.counted !== 203.08 || !c1.ok || c2.counted !== 207.69 || c2.ok || c3.counted !== 203.08 || !c3.ok || Math.abs(c4.counted - 141.85) > 0.02 || Math.abs(c4.careOff - c4.counted) > 0.011)) throw new Error("carer's allowance: a hand-checked example no longer comes out");

const today = new Date().toISOString().slice(0, 10);
const wage = MW.rates.filter((r) => r.from <= today).pop();
const P = "/carers-allowance-calculator/", u = SITE + P;
const SRC = R.sources.map((x) => `<a href="${x.url}" rel="nofollow noopener" target="_blank">${esc(x.title)}</a>`).join(", ");
const CFG = { pa: cfg.pa, paTaperFrom: cfg.paTaperFrom, paTaper: cfg.paTaper, basicBand: cfg.basicBand, addlFrom: cfg.addlFrom, rates: cfg.rates, div: cfg.div, niPT: cfg.niPT, niUEL: cfg.niUEL, niMain: cfg.niMain, niUpper: cfg.niUpper };
const RULES = { cfg: CFG, R: { limit: R.limit, pensionShare: R.pensionShare, careMaxShare: R.careMaxShare } };
const maxW = CA.maxGross(UK, cfg, R, { per: "week" });
const hourRates = [[wage.adult, `National Living Wage (21 and over), ${m2(wage.adult)}`], [wage.age18to20, `18 to 20 minimum wage, ${m2(wage.age18to20)}`], [14, m2(14)], [15, m2(15)], [18, m2(18)], [20, m2(20)]];
const hoursRows = hourRates.map(([rate, label]) => [label, `${(Math.floor(maxW / rate * 10) / 10).toLocaleString("en-GB")} hours`, m2(Math.floor(maxW / rate * 10) / 10 * rate)]);
const monthRows = [700, 800, 850, 880, 884, 900, 1000].map((m) => { const r = CA.calc(UK, cfg, R, { gross: m, per: "month" }); return [m0(m), m2(r.counted), r.ok ? "Within the limit" : `Over by ${m2(-r.room)}`]; });
const head = (title, desc, q, app) => site.head({ title, desc, url: u, ld: [site.webPage(title, desc, u, R.lastChecked), site.breadcrumb([["Home", SITE + "/"], ["Personal Finance", SITE + "/personal-finance/"], ["Carer's Allowance Calculator", u]]), app, site.faqLd(q)] });

const tool = `    <main class="tool split" id="ca-tool" data-rules="${esc(JSON.stringify(RULES))}">
      <div class="field-row">
        <div class="field"><label for="ca-gross">Your pay before tax</label><input type="number" id="ca-gross" value="880" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="ca-per">Paid</label><select id="ca-per"><option value="week">Weekly</option><option value="four">Every 4 weeks</option><option value="month" selected>Monthly</option></select></div>
      </div>
      <div class="field-row">
        <div class="field"><label for="ca-pension">Your pension contributions (same period)</label><input type="number" id="ca-pension" value="0" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="ca-care">Care costs while you work (same period)</label><input type="number" id="ca-care" value="0" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="ca-taxni">Tax and NI on your payslip (optional)</label><input type="number" id="ca-taxni" value="" min="0" step="any" inputmode="decimal" placeholder="Estimated"></div>
      </div>
      <p class="tool-hint" id="ca-error" role="alert" style="color: var(--bad); display: none;"></p>
      <p class="tool-hint" style="margin:6px 0 0;">Care costs count if you pay someone who isn't a close relative to look after the person you care for, or a child under 16, while you're at work. Tax and National Insurance are estimated for ${esc(cfg.year)} with no other income unless you enter them.</p>
      <div class="result-box split-aside" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="ca-counted">${m2(c1.counted)}</div>
          <div class="label" id="ca-label">counted earnings a week (the limit is ${m2(R.limit)})</div>
        </div>
        <p id="ca-verdict" style="margin:8px 0 0; font-weight:600; color: var(--good);">Within the limit: your earnings don't stop Carer's Allowance.</p>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row"><span class="r-label">Pay a week</span><span class="r-value" id="ca-gross">${m2(c1.gross)}</span></div>
          <div class="result-row"><span class="r-label">Tax and National Insurance</span><span class="r-value" id="ca-taxni">${c1.taxni ? "−" + m2(c1.taxni) : "None"} (estimate)</span></div>
          <div class="result-row"><span class="r-label">Half your pension contributions</span><span class="r-value" id="ca-pension-out">—</span></div>
          <div class="result-row"><span class="r-label">Care costs (up to half)</span><span class="r-value" id="ca-care-out">—</span></div>
          <div class="result-row highlight"><span class="r-label">Room left under the limit</span><span class="r-value" id="ca-room">${m2(c1.room)} a week</span></div>
          <div class="result-row"><span class="r-label">Most you could earn before tax</span><span class="r-value" id="ca-max">${m2(maxW)} a week</span></div>
        </div>
      </div>
    </main>
`;
const body = `    <main class="tool">
      <h2 class="tool-section-title">How many hours can you work on Carer's Allowance?</h2>
${site.table(["Hourly pay", "Most hours a week", "Pay a week"], hoursRows, 520)}      <p class="tool-hint" style="margin-top:8px;">With no pension contributions or care costs: up to ${m2(maxW)} a week before tax stays within the ${m2(R.limit)} limit. Minimum wage rates from ${esc(wage.label)}. You also need to spend at least ${R.hours} hours a week caring.</p>
      <h2 class="tool-section-title" style="margin-top:18px;">Monthly pay and the limit</h2>
${site.table(["Paid a month", "Counted a week", ""], monthRows, 480)}      <p class="tool-hint" style="margin-top:8px;">Monthly pay is turned into a weekly amount by multiplying by 12 and dividing by 52, so ${m0(884)} a month is exactly ${m2(204)} a week. No pension contributions or care costs.</p>
      <h2 class="tool-section-title" style="margin-top:18px;">How earnings are counted</h2>
      <p class="about-text">Carer's Allowance is <strong>${m2(R.weekly)} a week</strong> if you care for someone at least ${R.hours} hours a week and they get a qualifying disability benefit. You can work too, as long as your earnings are <strong>${m2(R.limit)} or less a week</strong> after tax, National Insurance and expenses. The limit is a cliff edge: a penny over and you get no Carer's Allowance for that week.</p>
      <p class="about-text">From your pay, the Carer's Allowance Unit takes off Income Tax, National Insurance and <strong>half of your pension contributions</strong>. If you pay someone who isn't a close relative to look after the person you care for, or a child under 16, while you work, those costs come off too, up to <strong>half of your earnings</strong> after tax, NI and pension. Paying more into a pension or paying for care can bring you back under the limit.</p>
      <p class="about-text">Carer's Allowance is taxable if your income is over the Personal Allowance, you get National Insurance credits for each week you're paid it, and Universal Credit is reduced by the same amount. In Scotland you apply for Carer Support Payment instead.</p>
    </main>
`;
const q = [
  ["What's the Carer's Allowance earnings limit?", `${m2(R.limit)} a week after tax, National Insurance and expenses such as half of your pension contributions. That's about ${m0(884)} a month before tax if you have no pension or care costs.`],
  ["How many hours can I work and get Carer's Allowance?", `It depends on your pay: at the ${m2(wage.adult)} National Living Wage, about ${(Math.floor(maxW / wage.adult * 10) / 10).toLocaleString("en-GB")} hours a week stays within the limit. There's no limit on hours worked itself, but you must also care for at least ${R.hours} hours a week.`],
  ["Do pension contributions count for Carer's Allowance?", `Half of what you pay into a pension is taken off your earnings. Paying ${m2(9.23)} a week into a pension takes ${m2(4.62)} off your counted earnings.`],
  ["What happens if I earn over the Carer's Allowance limit?", `You don't get Carer's Allowance for any week your counted earnings are over ${m2(R.limit)}, even by a penny. You must report changes to your income.`],
  ["How much is Carer's Allowance?", `${m2(R.weekly)} a week. It's taxable if your income is over the Personal Allowance, and you get National Insurance credits for each week you're paid it.`]
];
const title = site.fitTitle(`Carer's Allowance Calculator — ${m0(R.limit)} Earnings Limit Checker`, "Carer's Allowance Earnings Limit Calculator");
const desc = `Check if your earnings are within the ${m2(R.limit)} a week Carer's Allowance limit after tax, NI, half your pension and care costs, and how many hours you can work.`;
const app = { "@context": "https://schema.org", "@type": "WebApplication", name: "Carer's Allowance Calculator", url: u, applicationCategory: "FinanceApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } };
const html = head(title, desc, q, app) + `    <header class="site-header">
      <a class="back-link" href="/personal-finance/">← Personal finance calculators</a>
      <h1 class="page-title">Carer's Allowance earnings calculator</h1>
      <p class="page-subtitle">Are your earnings within the ${m2(R.limit)} a week limit, and how much more could you earn?</p>
    </header>

${tool}
${body}
    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}      <p class="tool-hint" style="margin-top:12px;">A guide for England and Wales, not advice: the Carer's Allowance Unit decides. Rules from ${SRC}. Last checked ${site.niceDate(R.lastChecked)}.</p>
    </main>

${related.block(P)}
${site.FOOTER}
  </div>
  <script src="/uk-calcs.js"></script>
  <script src="/carers-allowance.js"></script>
</body>
</html>
`;
site.write("carers-allowance-calculator", html);
site.sitemapBlock("carers allowance pages", "tools/build-carers-allowance-pages.js", [[P, "0.6"]]);
console.log(`built the Carer's Allowance calculator (most before tax ${m2(maxW)} a week; ${m0(880)} a month counts ${m2(c1.counted)})`);
