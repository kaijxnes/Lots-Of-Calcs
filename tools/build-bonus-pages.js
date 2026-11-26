#!/usr/bin/env node
/* The bonus tax calculator:

       /bonus-tax-calculator/

       node tools/build-bonus-pages.js

   What a cash bonus adds to take-home pay under PAYE, from the UK and
   Scottish tax files in force (data/tax/gb) through tax-engine.js. How a
   bonus is taxed is quoted from GOV.UK and HMRC in data/uk/bonus-tax.json.
   The page is built from the same functions it runs (bonus.js): Income Tax
   over the tax year, National Insurance and student loans on the pay
   period the bonus is paid in. The build stops unless a bonus spread over
   the year's pay costs exactly what a pay rise of the same size would, and
   unless the bonus month's National Insurance matches GOV.UK's monthly
   thresholds. Runs in the monthly rebuild. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const related = require("./related.js");
const TaxEngine = require("../tax-engine.js");
const registry = require("./tax/registry.js");
const BT = require("../bonus.js");
const { esc, SITE } = site;

const B = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/uk/bonus-tax.json"), "utf8"));
const all = registry.readAll(), current = registry.currentFiles(all);
const CH = { gb: registry.chainFor(current.gb.doc, all), "gb-sct": registry.chainFor(current["gb-sct"].doc, all) };
const YEAR = current.gb.doc.taxYear.label;
const OPTS = TaxEngine.merge(CH.gb).options;
const merged = TaxEngine.merge(CH.gb);
const item = (id) => merged.items.find((i) => i.id === id);
const pa = item("gb-personal-allowance").value, ni = item("gb-ni").charge.brackets;
if (!pa || pa.from !== 100000 || pa.per !== 0.5) throw new Error("bonus: the Personal Allowance taper isn't as expected");
const TAPER = { from: pa.from, to: pa.from + pa.taper / pa.per };
const PT = ni[1][0], UEL = ni[2][0], NI_MAIN = ni[1][1], NI_UPPER = ni[2][1];
const m0 = (v) => TaxEngine.money(v, "GBP", true), m2 = (v) => TaxEngine.money(v, "GBP");
const split = (salary, bonus, region = "gb", periods = 12, options = {}) => BT.split(TaxEngine, CH[region], salary, bonus, periods, options);

/* checks: spread over the year a bonus is just more pay; in one month its NI
   follows the monthly thresholds (yearly / 12, which GOV.UK rounds to the pound) */
{
  const s = split(30000, 5000), a = TaxEngine.compute(CH.gb, 30000, {}), b = TaxEngine.compute(CH.gb, 35000, {});
  if (Math.abs(s.tax + s.evenNi - (b.byGroup.tax + b.byGroup.social - a.byGroup.tax - a.byGroup.social)) > 0.01) throw new Error("bonus: a bonus spread over the year should cost what a pay rise does");
  const month = (p) => Math.max(0, Math.min(p, UEL / 12) - PT / 12) * NI_MAIN / 100 + Math.max(0, p - UEL / 12) * NI_UPPER / 100;
  if (Math.abs(s.ni - (month(2500 + 5000) - month(2500))) > 0.01) throw new Error("bonus: the bonus month's National Insurance doesn't follow the monthly thresholds");
  if (Math.round(PT / 12) !== 1048 || Math.round(UEL / 12) !== 4189) throw new Error("bonus: GOV.UK's monthly NI thresholds (£1,048 and £4,189) no longer match the tax file — re-check data/uk/bonus-tax.json");
}

const ex = { salary: 35000, bonus: 5000 }; ex.s = split(ex.salary, ex.bonus);
const niEx = split(30000, 5000);
const trapEx = split(95000, 10000), trapAmt = BT.trap(trapEx, TAPER.from, TAPER.to);
const SALARIES = [25000, 35000, 45000, 55000, 70000, 90000, 110000, 150000];
const pct = (s) => `${Math.round((1 - s.rate) * 100)}%`;
const rows = SALARIES.map((sal) => { const s = split(sal, 5000); return [m0(sal), m2(s.tax), m2(s.ni), m2(s.keep), pct(s)]; });
const sctRows = SALARIES.slice(0, 6).map((sal) => { const s = split(sal, 5000, "gb-sct"); return [m0(sal), m2(s.tax), m2(s.ni), m2(s.keep), pct(s)]; });
const per1000 = [[30000, "Basic rate"], [60000, "Higher rate"], [110000, "Between £100,000 and £125,140"], [150000, "Additional rate"]].map(([sal, band]) => { const s = split(sal, 1000); return [band, m0(sal), m2(s.keep)]; });

const P = "/bonus-tax-calculator/", url = SITE + P;
const SRC = (i) => `<a href="${B.sources[i].url}" rel="nofollow noopener" target="_blank">${esc(B.sources[i].title)}</a>`;
const optionFields = Object.keys(OPTS).map((k) => {
  const o = OPTS[k];
  const field = o.type === "number"
    ? `<input type="number" id="bt-opt-${k}" value="${o.default}"${o.min !== undefined ? ` min="${o.min}"` : ""}${o.max !== undefined ? ` max="${o.max}"` : ""} step="${o.step || "any"}" inputmode="decimal">`
    : `<select id="bt-opt-${k}">${Object.keys(o.choices).map((c) => `<option value="${esc(c)}"${c === o.default ? " selected" : ""}>${esc(o.choices[c])}</option>`).join("")}</select>`;
  return `<div class="field"><label for="bt-opt-${k}">${esc(o.label)}</label>${field}</div>`;
}).join("\n        ");

const tool = `    <main class="tool split" id="bt-tool" data-taper="${esc(JSON.stringify(TAPER))}">
      <div class="field-row">
        <div class="field"><label for="bt-salary">Salary (a year, before tax)</label><input type="number" id="bt-salary" value="${ex.salary}" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="bt-bonus">Bonus</label><input type="number" id="bt-bonus" value="${ex.bonus}" min="0" step="any" inputmode="decimal"></div>
      </div>
      <div class="field-row">
        <div class="field"><label for="bt-periods">You're paid</label><select id="bt-periods"><option value="12" selected>Monthly</option><option value="13">Every four weeks</option><option value="26">Every two weeks</option><option value="52">Weekly</option></select></div>
        <div class="field"><label for="bt-region">Where you pay tax</label><select id="bt-region"><option value="gb" selected>England, Wales or Northern Ireland</option><option value="gb-sct">Scotland</option></select></div>
      </div>
      <div class="field-row" id="bt-options" style="flex-wrap:wrap;">
        ${optionFields}
      </div>
      <p class="tool-hint" id="bt-error" role="alert" style="color: var(--bad); display: none;"></p>
      <div class="result-box split-aside" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="bt-keep">${m2(ex.s.keep)}</div>
          <div class="label" id="bt-label">of your ${m0(ex.bonus)} bonus is yours (${pct(ex.s)})</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row"><span class="r-label">Income Tax</span><span class="r-value" id="bt-tax">${m2(ex.s.tax)}</span></div>
          <div class="result-row"><span class="r-label">National Insurance</span><span class="r-value" id="bt-ni">${m2(ex.s.ni)}</span></div>
          <div class="result-row" id="bt-loan-row" style="display:none;"><span class="r-label">Student loan</span><span class="r-value" id="bt-loan">£0.00</span></div>
          <div class="result-row" id="bt-pension-row" style="display:none;"><span class="r-label">Pension</span><span class="r-value" id="bt-pension">£0.00</span></div>
          <div class="result-row highlight"><span class="r-label">Taken from the bonus</span><span class="r-value" id="bt-rate">${(Math.round(ex.s.rate * 1000) / 10).toLocaleString("en-GB")}%</span></div>
        </div>
        <p class="tool-hint" id="bt-note" style="margin:10px 0 0; display:none;"></p>
      </div>
      <p class="tool-hint" style="margin:6px 0 0;">Paid as a lump sum with your normal pay in one pay period. The pension percentage is taken from the bonus too, as it is from your salary, if you set one.</p>
    </main>
`;

const body = `    <main class="tool">
      <h2 class="tool-section-title">How a bonus is taxed</h2>
      <p class="about-text">A cash bonus is pay. GOV.UK tells employers it "counts as earnings", so they add it to your other pay and take Income Tax and National Insurance through PAYE, and HMRC's manual includes Christmas, productivity and completion bonuses. There's no special bonus tax rate: the bonus sits on top of your salary, so it's taxed at your highest rate, and can push part of your pay into the next band.</p>
${site.table(["Salary", "Income Tax", "National Insurance", "You keep", "Share kept"], rows, 520)}      <p class="tool-hint" style="margin-top:8px;">A ${m0(5000)} bonus paid in one month, ${esc(YEAR)}, England, Wales and Northern Ireland, no student loan or pension.</p>
      <h2 class="tool-section-title" style="margin-top:18px;">Why a bonus can cost less National Insurance than a pay rise</h2>
      <p class="about-text">Income Tax is worked out on your pay for the whole tax year, but National Insurance is worked out on each payday on its own: ${NI_MAIN}% between £1,048 and £4,189 a month and ${NI_UPPER}% above that. A bonus pushes that month's pay over £4,189, so much of it is charged only ${NI_UPPER}%. On a ${m0(30000)} salary a ${m0(5000)} bonus paid in one month costs <strong>${m2(niEx.ni)}</strong> in National Insurance; the same ${m0(5000)} spread across the year as a pay rise would cost ${m2(niEx.evenNi)}. Student loan repayments work the same way, per payday, with each plan's threshold split by month or week, so a bonus month takes 9% of everything over that month's threshold.</p>
      <h2 class="tool-section-title" style="margin-top:18px;">Why so much tax came off your bonus payslip</h2>
      <p class="about-text">On a normal tax code, GOV.UK explains, "your tax is worked out based on your total income so far in that tax year". Your tax-free allowance and bands are shared out across the year, so the month with the bonus can show tax at a higher rate than you'll pay overall, particularly early in the tax year; your later payslips even it out, and the calculator shows where you end up by 5 April. On an emergency code (ending W1, M1 or X) "you get taxed as if you're paid that amount every week or month of the year", which can take far too much from a bonus month: the <a href="/tax-code-checker/">tax code checker</a> explains your code and the <a href="/tax-refund-calculator/">tax refund calculator</a> estimates what comes back.</p>
      <h2 class="tool-section-title" style="margin-top:18px;">Bonuses and the 60% band</h2>
      <p class="about-text">Your Personal Allowance "goes down by £1 for every £2 that your adjusted net income is above £100,000", and is gone at ${m0(TAPER.to)}. A bonus that takes you into that band is taxed at an effective 60% there, plus National Insurance. On a ${m0(95000)} salary, ${m0(trapAmt)} of a ${m0(10000)} bonus falls in it and you keep ${m2(trapEx.keep)} (${pct(trapEx)}). Adjusted net income is your taxable income less pension contributions (grossed up), so paying the part over £100,000 into a pension keeps the allowance: some employers let you sacrifice a bonus into your pension, or you can make a personal contribution. The <a href="/salary-sacrifice-calculator/">salary sacrifice calculator</a> and the <a href="/pension-tax-relief-calculator/">pension tax relief calculator</a> show what that's worth.</p>
${site.table(["Your top rate", "Salary", `You keep of ${m0(1000)}`], per1000, 420)}      <h2 class="tool-section-title" style="margin-top:18px;">In Scotland</h2>
      <p class="about-text">Scottish taxpayers pay Scotland's Income Tax rates on the bonus and the same National Insurance as the rest of the UK.</p>
${site.table(["Salary", "Income Tax", "National Insurance", "You keep", "Share kept"], sctRows, 520)}      <p class="tool-hint" style="margin-top:8px;">A ${m0(5000)} bonus paid in one month, ${esc(YEAR)}, Scotland. Christmas bonuses often arrive with December's pay: see the <a href="/working-days/${site.TODAY.slice(0, 4)}/christmas-payday/">Christmas payday dates</a>.</p>
    </main>
`;

const q = [
  ["How much tax will I pay on my bonus?", `It's taxed as pay at your highest Income Tax rate, plus National Insurance. On a ${m0(ex.salary)} salary in England a ${m0(ex.bonus)} bonus paid in one month costs ${m2(ex.s.tax)} in Income Tax and ${m2(ex.s.ni)} in National Insurance, so you keep ${m2(ex.s.keep)}.`],
  ["Is a bonus taxed at a higher rate than salary?", "No. A bonus counts as earnings and is added to your pay, so it's taxed at the same rates. It can look that way because it comes on top of your salary, at your highest rate, and because PAYE in the bonus month can take more than you'll owe by the end of the tax year."],
  ["Do I pay National Insurance on a bonus?", `Yes, Class 1 National Insurance, worked out on the pay period it's paid in. Above £4,189 in a month the rate is ${NI_UPPER}% rather than ${NI_MAIN}%, so a bonus paid in one month usually costs less National Insurance than the same amount as a pay rise.`],
  ["Why was my bonus taxed at 40%?", "If your salary and bonus together go over the higher rate threshold, the part above it is taxed at 40%. Even if your yearly pay doesn't, PAYE works on your pay so far in the tax year, so a big bonus month can be taxed at 40% for that month and the following months even it out. On an emergency code (W1, M1 or X) the bonus month is taxed as if you were paid that much every month."],
  ["How much of a £1,000 bonus will I keep?", `In England, Wales and Northern Ireland about ${per1000.map((r) => `${r[2]} as a ${r[0].toLowerCase()} taxpayer`).slice(0, 2).join(" and ")}, before any student loan or pension.`],
  ["Can I put my bonus into my pension to save tax?", "If your employer offers bonus sacrifice, the bonus goes into your pension before Income Tax and National Insurance. Pension contributions also reduce adjusted net income, which keeps your Personal Allowance if the bonus would take you over £100,000."]
];
const title = site.fitTitle("Bonus Tax Calculator UK — How Much of Your Bonus You Keep", "Bonus Tax Calculator UK");
const desc = `Work out the Income Tax, National Insurance and student loan on a UK bonus and how much you keep, with the ${esc(YEAR)} rates for England, Wales, Northern Ireland and Scotland.`;
const ld = [site.webPage(title, desc, url, B.lastChecked), site.breadcrumb([["Home", SITE + "/"], ["Personal Finance", SITE + "/personal-finance/"], ["Bonus Tax Calculator", url]]),
  { "@context": "https://schema.org", "@type": "WebApplication", name: "Bonus Tax Calculator", url, applicationCategory: "FinanceApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } }, site.faqLd(q)];

const html = site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="/personal-finance/">← Personal finance calculators</a>
      <h1 class="page-title">Bonus tax calculator</h1>
      <p class="page-subtitle">How much of a bonus you keep after Income Tax, National Insurance and student loan.</p>
    </header>

${tool}
${body}
    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}      <p class="tool-hint" style="margin-top:12px;">An estimate, not advice. ${esc(YEAR)} rates from the UK and Scottish tax files; National Insurance and student loan thresholds per pay period are the yearly ones split by the number of paydays, which payroll rounds, so a payslip can differ by pennies. How bonuses are taxed from ${B.sources.map((_, i) => SRC(i)).join(", ")}. Last checked ${site.niceDate(B.lastChecked)}.</p>
    </main>

${related.block(P)}
${site.FOOTER}
  </div>
  <script src="/tax-engine.js"></script>
  <script src="/bonus.js"></script>
</body>
</html>
`;
site.write("bonus-tax-calculator", html);
site.sitemapBlock("bonus tax pages", "tools/build-bonus-pages.js", [[P, "0.6"]]);
console.log(`built the bonus tax calculator (${m0(ex.bonus)} on ${m0(ex.salary)}: keep ${m2(ex.s.keep)}; NI in one month ${m2(niEx.ni)} vs ${m2(niEx.evenNi)} spread)`);
