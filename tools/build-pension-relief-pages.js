#!/usr/bin/env node
/* The pension tax relief calculator:

       /pension-tax-relief-calculator/

       node tools/build-pension-relief-pages.js

   The relief follows the income tax bands in the UK and Scottish tax files
   (data/tax/gb), run through tax-engine.js as on the salary calculator; the
   rules around them (20% added at source, the earnings limit, £3,600 with
   no earnings, the annual allowance) are in data/uk/pension-tax-relief.json,
   quoted from GOV.UK. GOV.UK's own worked example must come out right. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const related = require("./related.js");
const registry = require("./tax/registry.js");
const TaxEngine = require("../tax-engine.js");
const PR = require("../pension-relief.js");
const { esc, SITE } = site;

const all = registry.readAll(), cur = registry.currentFiles(all);
const gb = cur.gb.doc, CH = registry.chainFor(gb, all), SCT = registry.chainFor(cur["gb-sct"].doc, all);
const R = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/uk/pension-tax-relief.json"), "utf8"));
const YEAR = gb.taxYear.label;
const PA = gb.items.find((i) => i.id === "gb-personal-allowance").value.taper;
const B = gb.items.find((i) => i.id === "gb-income-tax").charge.brackets;
const SB = cur["gb-sct"].doc.items.find((i) => i.id === "gb-income-tax").charge.brackets;
const higherAt = B[1][0] + PA;
const m0 = (v) => "£" + Math.round(v).toLocaleString("en-GB");
const m2 = (v) => TaxEngine.money(v, "GBP");
const run = (income, paid, type, ch) => PR.relief(TaxEngine, ch || CH, R, income, paid, type || "ras");

/* GOV.UK: earning £10,000 above the higher rate threshold and paying £12,000
   in (£15,000 gross), you claim an extra 20% on £10,000 */
const gx = run(higherAt + 10000, 12000);
if (Math.abs(gx.claim - 10000 * (B[1][1] - R.basicRelief) / 100) > 0.01) throw new Error("pension relief: GOV.UK example");
if (Math.abs(run(30000, 2000).claim) > 0.001 || Math.abs(run(0, R.noEarningsNet).gross - R.noEarningsGross) > 0.01) throw new Error("pension relief: basic checks");

const rows = [25000, 45000, 60000, 80000, 110000, 150000].map((inc) => {
  const r = run(inc, 4000);
  return [m0(inc), m0(r.gross), m0(r.topUp), m0(r.claim), m0(r.relief), m0(r.cost), Math.round(r.rate) + "%"];
});
const sRows = [25000, 40000, 60000, 90000].map((inc) => {
  const r = run(inc, 4000, "ras", SCT);
  return [m0(inc), m0(r.topUp), m0(r.claim), m0(r.relief), Math.round(r.rate) + "%"];
});
const ex = run(60000, 4000), np = run(60000, 5000, "netpay"), trap = run(110000, 8000);
const SRC = R.sources.map((s) => `<a href="${s.url}" rel="nofollow noopener" target="_blank">${esc(s.title)}</a>`).join(" and ");

const P = "/pension-tax-relief-calculator/", url = SITE + P;
const tool = `    <main class="tool split" id="pt-tool" data-rules="${esc(JSON.stringify(R))}">
      <div class="field"><label for="pt-income">Your taxable income for the year</label><input type="number" id="pt-income" value="60000" min="0" step="any" inputmode="decimal"><p class="tool-hint" style="margin:6px 0 0;">Salary, profits, rent and other income before tax. With a net pay pension, enter it before the contribution comes off.</p></div>
      <div class="field-row">
        <div class="field"><label for="pt-type">Pension type</label><select id="pt-type"><option value="ras" selected>Relief at source (personal pensions, SIPPs, many workplace)</option><option value="netpay">Net pay (taken from pay before tax)</option></select></div>
        <div class="field"><label for="pt-where">Where you live</label><select id="pt-where"><option value="gb" selected>England, Wales or Northern Ireland</option><option value="gb-sct">Scotland</option></select></div>
      </div>
      <div class="field"><label for="pt-paid" id="pt-paid-label">What you pay in a year (before the top-up)</label><input type="number" id="pt-paid" value="4000" min="0" step="any" inputmode="decimal"></div>
      <div class="result-box split-aside" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="pt-relief">${m2(ex.relief)}</div>
          <div class="label">tax relief a year</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row"><span class="r-label">Going into your pension</span><span class="r-value" id="pt-gross">${m2(ex.gross)}</span></div>
          <div class="result-row" id="pt-topup-row"><span class="r-label">Added by your provider (basic rate)</span><span class="r-value" id="pt-topup">${m2(ex.topUp)}</span></div>
          <div class="result-row" id="pt-claim-row"><span class="r-label">Extra to claim back from HMRC</span><span class="r-value" id="pt-claim">${m2(ex.claim)}</span></div>
          <div class="result-row highlight"><span class="r-label">Real cost to you</span><span class="r-value" id="pt-cost">${m2(ex.cost)}</span></div>
          <div class="result-row"><span class="r-label">Relief as a share of the contribution</span><span class="r-value" id="pt-rate">${Math.round(ex.rate * 10) / 10}%</span></div>
        </div>
        <p class="tool-hint" id="pt-note" style="margin:10px 0 0;"></p>
      </div>
    </main>
`;

const body = `    <main class="tool">
      <h2 class="tool-section-title">How pension tax relief works</h2>
      <p class="about-text">Money you pay into a pension gets tax relief at your highest rate of income tax, on contributions up to 100% of your earnings for the year (or ${m0(R.noEarningsGross)} gross, if that's more). How you get it depends on the scheme:</p>
      <p class="about-text"><strong>Relief at source</strong> (personal pensions, SIPPs and many workplace schemes): you pay in from your take-home pay and the provider adds basic rate relief, so £80 becomes £100. If you pay ${B[1][1]}% or ${B[2][1]}% tax, you claim the rest through Self Assessment: an extra ${B[1][1] - R.basicRelief}% on the slice of income taxed at ${B[1][1]}% and ${B[2][1] - R.basicRelief}% on any taxed at ${B[2][1]}%.</p>
      <p class="about-text"><strong>Net pay</strong> (many workplace schemes): the contribution comes out of your pay before income tax, so you get all the relief straight away. On ${m0(60000)}, ${m0(5000)} through net pay saves ${m0(np.relief)} of tax.</p>
      <p class="about-text">On ${m0(60000)}, paying ${m0(4000)} into a relief at source pension puts ${m0(ex.gross)} in: the provider adds ${m0(ex.topUp)}, and you claim ${m0(ex.claim)} back, so it costs you ${m0(ex.cost)}. With ${m0(4000)} paid in at each income (${YEAR}, England, Wales and Northern Ireland):</p>
      ${site.table(["Income", "Into pension", "Provider adds", "You claim", "Total relief", "Cost to you", "Relief"], rows, 560)}      <p class="about-text" style="margin-top:14px;"><strong>Between ${m0(100000)} and ${m0(125140)}</strong>, pension contributions also win back personal allowance, so the relief is bigger: on ${m0(110000)}, ${m0(8000)} paid in (${m0(trap.gross)} gross) brings ${m0(trap.relief)} of relief, ${Math.round(trap.rate)}%.</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">Scotland</h2>
      <p class="about-text">Relief at source providers add 20% for everyone, including starter rate taxpayers paying ${SB[0][1]}%, who keep the difference. Above that you claim the gap between your rate and 20% (${SB[2][1] - R.basicRelief}% at the ${esc(SB[2][2].toLowerCase())}, ${SB[3][1] - R.basicRelief}% at the ${esc(SB[3][2].toLowerCase())}). ${m0(4000)} paid in, ${YEAR}:</p>
      ${site.table(["Income", "Provider adds", "You claim", "Total relief", "Relief"], sRows, 420)}    </main>

    <main class="tool">
      <h2 class="tool-section-title">Limits</h2>
      <p class="about-text">The <strong>annual allowance</strong> is ${m0(R.annualAllowance)} a year in total, including your employer's contributions; above it you may owe tax, though you can carry forward unused allowance from the previous three years. It's lower if you've flexibly taken money from a pension, or with threshold income over ${m0(R.taper.thresholdIncome)} and adjusted income over ${m0(R.taper.adjustedIncome)}.</p>
      <p class="about-text">If your employer offers <a href="/salary-sacrifice-calculator/">salary sacrifice</a>, it saves National Insurance as well as tax. To weigh a pension against an ISA, see <a href="/isa-vs-pension/">ISA or pension</a>; for taking money out, the <a href="/pension-drawdown-calculator/">pension drawdown calculator</a>.</p>
    </main>
`;

const q = [
  ["How much tax relief do I get on pension contributions?", `Relief at your highest rate of income tax. Relief at source pensions add ${R.basicRelief}% (so £80 becomes £100), and higher and additional rate taxpayers claim the rest through Self Assessment. On ${m0(60000)}, ${m0(4000)} paid in gets ${m0(ex.relief)} of relief.`],
  ["How do I claim higher rate pension tax relief?", "Through your Self Assessment tax return, or if you don't file one, by contacting HMRC (who may adjust your tax code). It's only needed for relief at source pensions; net pay pensions give it through payroll."],
  ["How much extra can I claim as a higher rate taxpayer?", `${B[1][1] - R.basicRelief}% of the gross contribution, up to the amount of income you paid ${B[1][1]}% tax on. Earning ${m0(higherAt + 10000)}, you can claim the extra on up to ${m0(10000)} of contributions.`],
  ["What if I don't pay income tax?", `With a relief at source pension you still get ${R.basicRelief}% added, on up to ${m0(R.noEarningsGross)} gross a year (${m0(R.noEarningsNet)} paid in). A net pay pension gives no relief if you don't pay income tax.`],
  ["What is the pension annual allowance?", `${m0(R.annualAllowance)} a year across all your pensions, including employer contributions, with unused allowance carried forward from the previous three years. It's tapered for very high incomes.`],
  ["Is pension tax relief different in Scotland?", "Providers add 20%, even for starter rate taxpayers. Intermediate, higher, advanced and top rate taxpayers claim the difference between their rate and 20% through Self Assessment."]
];

const ld = [site.webPage("Pension Tax Relief Calculator", "", url, gb.lastChecked), site.breadcrumb([["Home", SITE + "/"], ["Investing & Pensions", SITE + "/investing-pensions/"], ["Pension Tax Relief Calculator", url]]),
  { "@context": "https://schema.org", "@type": "WebApplication", name: "Pension Tax Relief Calculator", url, applicationCategory: "FinanceApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } },
  site.faqLd(q)];
const title = site.fitTitle(`Pension Tax Relief Calculator ${YEAR} — Higher Rate Relief`, `Pension Tax Relief Calculator ${YEAR}`);
const desc = `Work out the tax relief on pension contributions in ${YEAR}: the 20% your provider adds, the extra higher and additional rate taxpayers claim back, net pay schemes and Scotland.`;
ld[0].description = desc;

const html = site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="/investing-pensions/">← Investing &amp; pensions calculators</a>
      <h1 class="page-title">Pension tax relief calculator</h1>
      <p class="page-subtitle">The tax relief on what you pay into a pension in ${YEAR}: what your provider adds, what you can <strong>claim back</strong> as a higher rate taxpayer, and what it really costs you.</p>
    </header>

${tool}
${body}
    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}      <p class="tool-hint" style="margin-top:12px;">A guide, not advice. ${YEAR} income tax bands as on the <a href="/salary/">salary calculator</a> (last checked ${site.niceDate(gb.lastChecked)}); rules from ${SRC}.</p>
    </main>

${related.block(P)}
${site.FOOTER}
  </div>
  <script src="/tax-engine.js"></script>
  <script src="/pension-relief.js"></script>
</body>
</html>
`;
site.write("pension-tax-relief-calculator", html);
site.sitemapBlock("pension relief pages", "tools/build-pension-relief-pages.js", [[P, "0.6"]]);
console.log(`built the pension tax relief calculator (${YEAR}; £4,000 on £60,000 gets ${m0(ex.relief)})`);
