#!/usr/bin/env node
/* The pension withdrawal tax calculator and a page for each amount:

       /pension-withdrawal-tax-calculator/
       /pension-withdrawal-tax-calculator/50000/   (and other amounts)

       node tools/build-pension-withdrawal-pages.js

   The 25% tax-free part, lump sum allowance, emergency code rule and refund
   forms are quoted from GOV.UK in data/uk/pension-withdrawal.json; Income Tax
   bands and the Personal Allowance come from the UK tax file in force
   (tools/lib/uk-config.js). The pages are built from the same functions the
   calculator runs (pension-withdrawal.js with uk-calcs.js). The build stops
   unless the figures are in the quoted wording, agree with
   data/uk/rates-2026-27.json and the tax file's year, and hand-checked
   examples come out. Runs in the monthly rebuild. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const related = require("./related.js");
const UK = require("../uk-calcs.js");
const PW = require("../pension-withdrawal.js");
const { cfg, R: RATES } = require("./lib/uk-config.js")();
const { esc, SITE } = site;

const R = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/uk/pension-withdrawal.json"), "utf8"));
const m2 = (v) => "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const m0 = (v) => "£" + Math.round(v).toLocaleString("en-GB");
const pc = (v) => `${(Math.round(v * 1000) / 10).toLocaleString("en-GB")}%`;
const Q = (k) => R.rules[k].quote;
[["taxFree", `${R.taxFreePct}%`], ["taxFree", m0(R.lumpSumAllowance)], ["emergency", "Paid as the first and only payment from the pension"], ["emergency", "emergency tax code on a week 1/month 1 basis"],
  ["emergencyHow", "as if you’re paid that amount every week or month"], ["p55", "P55"], ["p53z", "P53Z"], ["p50z", "P50Z"], ["age", "55"]]
  .forEach(([k, s]) => { if (!Q(k).includes(s)) throw new Error(`pension withdrawal: "${s}" isn't in GOV.UK's quoted wording for ${k} (data/uk/pension-withdrawal.json)`); });
if (RATES.pensions.taxFreePct !== R.taxFreePct || RATES.pensions.lumpSumAllowance !== R.lumpSumAllowance) throw new Error("pension withdrawal: the 25% or lump sum allowance differs from data/uk/rates-2026-27.json");
if (R.taxYear !== cfg.year) throw new Error(`pension withdrawal: data is for ${R.taxYear}, the UK tax file for ${cfg.year}`);
/* hand-checked for 2026/27 (£12,570 allowance, 20% to £37,700, 40% to £125,140, 45%):
   £40,000 from a new pot, no other income: £10,000 tax-free, £17,430 × 20% = £3,486;
   month 1: (£30,000 − £1,047.50) taxed 20% to £3,141.67, 40% to £10,428.33, 45% above = £11,878.88, so £8,392.88 back;
   £20,000 on top of £30,000 of other income: £15,000 × 20% = £3,000; £40,000 over two years: 2 × (£2,430 × 20%) = £972 */
const ck = (o) => PW.calc(UK, cfg, R, Object.assign({ fresh: true, other: 0 }, o));
const a = ck({ amount: 40000 }), b = ck({ amount: 20000, other: 30000 }), s = PW.spread(UK, cfg, R, { amount: 40000, fresh: true, other: 0 }, 2);
if (cfg.year === "2026/27" && (a.free !== 10000 || a.due !== 3486 || a.emergency !== 11878.88 || a.refund !== 8392.88 || b.due !== 3000 || s.due !== 972)) throw new Error("pension withdrawal: a hand-checked example no longer comes out");

const BASE = "/pension-withdrawal-tax-calculator/", AMOUNTS = [10000, 20000, 25000, 30000, 40000, 50000, 60000, 75000, 100000, 150000, 200000];
const aurl = (n) => `${BASE}${n}/`;
const SP = Math.round(RATES.pensions.statePensionWeekly * 52 * 100) / 100;
const SRC = R.sources.map((x) => `<a href="${x.url}" rel="nofollow noopener" target="_blank">${esc(x.title)}</a>`).join(", ");
const CFG = { pa: cfg.pa, paTaperFrom: cfg.paTaperFrom, paTaper: cfg.paTaper, basicBand: cfg.basicBand, addlFrom: cfg.addlFrom, rates: cfg.rates, div: cfg.div };
const RULES = { cfg: CFG, R: { taxFreePct: R.taxFreePct, lumpSumAllowance: R.lumpSumAllowance } };
const OTHERS = [[0, "No other income"], [SP, `Full new State Pension (${m0(SP)})`], [20000, `${m0(20000)} of other income`], [30000, `${m0(30000)} of other income`], [50000, `${m0(50000)} of other income`]];

function tool(amount) {
  const r = ck({ amount }), s2 = PW.spread(UK, cfg, R, { amount, fresh: true, other: 0 }, 2);
  return `    <main class="tool split" id="pw-tool" data-rules="${esc(JSON.stringify(RULES))}">
      <div class="field-row">
        <div class="field"><label for="pw-amount">Amount you're taking out</label><input type="number" id="pw-amount" value="${amount}" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="pw-type">Taking it from</label><select id="pw-type"><option value="fresh" selected>A pot you haven't touched (${R.taxFreePct}% tax-free)</option><option value="taxable">Drawdown, after your tax-free cash (all taxable)</option></select></div>
      </div>
      <div class="field-row">
        <div class="field"><label for="pw-other">Other taxable income this tax year (wages, State Pension, other pensions)</label><input type="number" id="pw-other" value="0" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="pw-used">Lump sum allowance already used</label><input type="number" id="pw-used" value="0" min="0" step="any" inputmode="decimal"></div>
      </div>
      <p class="tool-hint" id="pw-error" role="alert" style="color: var(--bad); display: none;"></p>
      <p class="tool-hint" style="margin:6px 0 0;">England, Wales and Northern Ireland Income Tax rates (${esc(cfg.year)}). If you live in Scotland, Scottish Income Tax rates apply instead.</p>
      <div class="result-box split-aside" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="pw-net">${m2(r.net)}</div>
          <div class="label" id="pw-label">after tax, from ${m2(r.amount)} (${pc(r.rate)} tax)</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row"><span class="r-label">Tax-free</span><span class="r-value" id="pw-free">${m2(r.free)}</span></div>
          <div class="result-row"><span class="r-label">Taxable</span><span class="r-value" id="pw-taxable">${m2(r.taxable)}</span></div>
          <div class="result-row highlight"><span class="r-label">Tax for the year</span><span class="r-value" id="pw-due">${m2(r.due)}</span></div>
          <div class="result-row"><span class="r-label">Taken off a first payment (emergency code)</span><span class="r-value" id="pw-emergency">${m2(r.emergency)}</span></div>
          <div class="result-row"><span class="r-label">So you'd first receive</span><span class="r-value" id="pw-first">${m2(r.firstNet)}</span></div>
          <div class="result-row"><span class="r-label">Overpaid tax</span><span class="r-value" id="pw-refund">${r.refund > 0 ? m2(r.refund) + " to claim back" : "None"}</span></div>
          <div class="result-row"><span class="r-label">Tax if split over 2 tax years</span><span class="r-value" id="pw-spread">${s2.due < r.due ? `${m2(s2.due)} (${m2(r.due - s2.due)} less)` : "No saving"}</span></div>
        </div>
        <p class="tool-hint" id="pw-note" style="margin:10px 0 0;"></p>
      </div>
    </main>
`;
}
const explain = `    <main class="tool">
      <h2 class="tool-section-title">How taking money from a pension is taxed</h2>
      <p class="about-text"><strong>Tax-free part:</strong> you can usually take up to ${R.taxFreePct}% of a pension tax-free, up to ${m0(R.lumpSumAllowance)} in all (the lump sum allowance). If you take a lump sum straight from a pot you haven't touched (an uncrystallised funds pension lump sum), ${R.taxFreePct}% of each payment is tax-free. If you took your tax-free cash first, later withdrawals are all taxable.</p>
      <p class="about-text"><strong>Taxable part:</strong> it's added to your other income for the tax year (6 April to 5 April), including the State Pension, and taxed at your usual rates, so a large withdrawal can push some of it into the ${cfg.rates[1]}% or ${cfg.rates[2]}% band and above ${m0(cfg.paTaperFrom)} reduce your Personal Allowance. Spreading withdrawals over more than one tax year can mean less tax. You can usually take money out from 55, depending on your scheme's rules.</p>
      <p class="about-text"><strong>Emergency tax:</strong> a first, one-off payment is usually taxed on an emergency tax code on a month 1 basis: as if you were paid that much every month, so only a twelfth of the Personal Allowance and of each band applies, and too much tax comes off. You can claim it back from HMRC: form P55 if you took part of your pension, P53Z if you took all of it, or P50Z if you took all of it and have stopped work (or online).</p>
      <p class="about-text"><strong>Paying in afterwards:</strong> taking cash this way can lower your annual allowance for future pension saving (the money purchase annual allowance), so check before you take it if you're still paying in.</p>
    </main>
`;
const head = (title, desc, u, crumbs, q, app) => site.head({ title, desc, url: u, ld: [site.webPage(title, desc, u, R.lastChecked), site.breadcrumb(crumbs)].concat(app ? [app] : []).concat([site.faqLd(q)]) });
const SCRIPT = `  <script src="/uk-calcs.js"></script>
  <script src="/pension-withdrawal.js"></script>`;
const foot = `      <p class="tool-hint" style="margin-top:12px;">An estimate, not financial advice. Rules from GOV.UK: ${SRC}. Income Tax bands from the ${esc(cfg.year)} UK tax file. Last checked ${site.niceDate(R.lastChecked)}.</p>`;

function page(n) {
  const u = SITE + aurl(n), r = ck({ amount: n }), sp = ck({ amount: n, other: SP }), dd = ck({ amount: n, fresh: false });
  const rows = OTHERS.map(([o, label]) => { const x = ck({ amount: n, other: o }); return [label, m2(x.due), pc(x.rate), m2(x.net), m2(x.emergency), x.refund > 0 ? m2(x.refund) : x.refund < 0 ? `owe ${m2(-x.refund)}` : "—"]; });
  const spreads = [1, 2, 3, 4, 5].map((y) => { const x = PW.spread(UK, cfg, R, { amount: n, fresh: true, other: 0 }, y); return [`${y} tax ${y === 1 ? "year" : "years"}`, m2(n / y), m2(x.due), m2(n - x.due)]; });
  const title = site.fitTitle(`Tax on a ${m0(n)} Pension Withdrawal — Emergency Tax and Refund`, `Tax on ${m0(n)} Pension Withdrawal`);
  const desc = `Taking ${m0(n)} from your pension: ${m0(r.free)} tax-free and about ${m0(r.due)} tax for the year with no other income, but around ${m0(r.emergency)} can come off a first payment on an emergency code (${esc(cfg.year)}).`;
  const q = [
    [`How much tax will I pay on a ${m0(n)} pension withdrawal?`, `From a pot you haven't touched, ${m2(r.free)} is tax-free and ${m2(r.taxable)} taxable. With no other income that's ${m2(r.due)} of tax for ${esc(cfg.year)} (${pc(r.rate)}), leaving ${m2(r.net)}. With the full State Pension as well, it's ${m2(sp.due)}.`],
    [`How much emergency tax is taken off ${m0(n)}?`, `About ${m2(r.emergency)} if it's a first payment taxed on an emergency code on a month 1 basis, so you'd receive ${m2(r.firstNet)}. ${r.refund > 0 ? `With no other income, ${m2(r.refund)} of that is too much and can be claimed back from HMRC.` : ""}`],
    ["How do I get emergency tax back on a pension withdrawal?", "Claim it from HMRC online or by post: form P55 if you've taken part of your pension, P53Z if you've taken all of it, or P50Z if you've taken all of it and stopped work."],
    [`Is it better to take ${m0(n)} over more than one tax year?`, `Often. With no other income, taking it over 2 tax years costs ${m2(PW.spread(UK, cfg, R, { amount: n, fresh: true, other: 0 }, 2).due)} in tax instead of ${m2(r.due)}, because each year gets its own Personal Allowance and basic rate band.`],
    [`What if I've already taken my tax-free cash?`, `Then all of it is taxable: ${m2(dd.due)} of tax on ${m0(n)} with no other income.`]
  ];
  const others = AMOUNTS.filter((x) => x !== n).map((x) => `<a href="${aurl(x)}">${m0(x)}</a>`).join(" ");
  return head(title, desc, u, [["Home", SITE + "/"], ["Pension Withdrawal Tax Calculator", SITE + BASE], [m0(n), u]], q) + `    <header class="site-header">
      <a class="back-link" href="${BASE}">← Pension withdrawal tax calculator</a>
      <h1 class="page-title">Tax on a ${m0(n)} pension withdrawal</h1>
      <p class="page-subtitle"><strong>${m0(r.free)}</strong> tax-free, about <strong>${m0(r.due)}</strong> tax with no other income (${esc(cfg.year)}).</p>
    </header>

${tool(n)}
    <main class="tool">
      <h2 class="tool-section-title">${m0(n)} from a pot you haven't touched</h2>
${site.table(["Your other income this tax year", "Tax for the year", "Rate", "You keep", "Emergency tax on a first payment", "Overpaid"], rows, 720)}      <p class="tool-hint" style="margin-top:8px;">${m0(r.free)} of the ${m0(n)} is tax-free. "Overpaid" is what the emergency code takes off beyond the year's tax; where your other income has used your Personal Allowance you could owe more instead.</p>
      <h2 class="tool-section-title" style="margin-top:18px;">Spreading it over tax years</h2>
${site.table(["Taken over", "Each year", "Total tax", "You keep"], spreads, 520)}      <p class="tool-hint" style="margin-top:8px;">Equal parts in each tax year, no other income, at ${esc(cfg.year)} rates.</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}${foot}
    </main>

    <div class="hub-group-title" style="margin-top:28px;">Other amounts</div>
    <p class="salary-links">${others}</p>

${site.FOOTER}
  </div>
${SCRIPT}
</body>
</html>
`;
}

function hub() {
  const u = SITE + BASE, ex = ck({ amount: 40000 });
  const grid = AMOUNTS.map((n) => { const x = ck({ amount: n }), y = ck({ amount: n, other: SP }); return [`<a href="${aurl(n)}">${m0(n)}</a>`, m2(x.free), m2(x.due), m2(y.due), m2(x.emergency)]; });
  const title = site.fitTitle(`Pension Withdrawal Tax Calculator UK ${cfg.year} — Emergency Tax`, "Pension Withdrawal Tax Calculator UK");
  const desc = `Work out the tax on taking money from your pension: ${R.taxFreePct}% tax-free, the rest taxed with your other income, the emergency tax on a first payment and the refund to claim (${esc(cfg.year)}).`;
  const q = [
    ["How much tax do I pay when I take money out of my pension?", `Usually ${R.taxFreePct}% is tax-free and the rest is added to your income for the tax year and taxed at your normal rates. Taking ${m0(40000)} from an untouched pot with no other income: ${m2(ex.free)} tax-free and ${m2(ex.due)} of tax (${esc(cfg.year)}).`],
    ["Why was so much emergency tax taken from my pension?", `A first payment is usually taxed on an emergency code on a month 1 basis, as if you were paid that amount every month. On ${m0(40000)} that takes off about ${m2(ex.emergency)}, ${m2(ex.refund)} more than the year's tax with no other income.`],
    ["How do I claim back emergency tax on a pension?", "Online, or by post with form P55 if you took part of your pension, P53Z if you took all of it, or P50Z if you took all of it and stopped work."],
    ["How much can I take from my pension tax-free?", `Usually ${R.taxFreePct}%, up to the lump sum allowance of ${m0(R.lumpSumAllowance)} across all your pensions, unless you have a protected allowance.`],
    ["Can I avoid paying higher rate tax on a pension withdrawal?", `Spreading withdrawals over more than one tax year can keep more of each one in your Personal Allowance and the ${cfg.rates[0]}% band. ${m0(40000)} over 2 tax years with no other income costs ${m2(PW.spread(UK, cfg, R, { amount: 40000, fresh: true, other: 0 }, 2).due)} instead of ${m2(ex.due)}.`]
  ];
  const app = { "@context": "https://schema.org", "@type": "WebApplication", name: "Pension Withdrawal Tax Calculator", url: u, applicationCategory: "FinanceApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } };
  return head(title, desc, u, [["Home", SITE + "/"], ["Investing & Pensions", SITE + "/investing-pensions/"], ["Pension Withdrawal Tax Calculator", u]], q, app) + `    <header class="site-header">
      <a class="back-link" href="/investing-pensions/">← Investing and pensions calculators</a>
      <h1 class="page-title">Pension withdrawal tax calculator</h1>
      <p class="page-subtitle">The tax on taking money from your pension, the emergency tax on a first payment, and what to claim back.</p>
    </header>

${tool(40000)}
    <main class="tool">
      <h2 class="tool-section-title">Tax on pension withdrawals by amount</h2>
${site.table(["Taking out", "Tax-free", "Tax, no other income", "Tax, with full State Pension", "Emergency tax on a first payment"], grid, 680)}      <p class="tool-hint" style="margin-top:8px;">From a pot you haven't touched, ${esc(cfg.year)}. The full new State Pension is ${m2(SP)} a year. Pick an amount for more.</p>
    </main>

${explain}
    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}${foot}
    </main>

${related.block(BASE)}
${site.FOOTER}
  </div>
${SCRIPT}
</body>
</html>
`;
}

const urls = [[BASE, "0.6"]];
site.write("pension-withdrawal-tax-calculator", hub());
AMOUNTS.forEach((n) => { site.write(`pension-withdrawal-tax-calculator/${n}`, page(n)); urls.push([aurl(n), "0.5"]); });
site.sitemapBlock("pension withdrawal tax pages", "tools/build-pension-withdrawal-pages.js", urls);
console.log(`built the pension withdrawal tax calculator and ${AMOUNTS.length} amount pages (${m0(40000)}: ${m2(ex0())} tax)`);
function ex0() { return ck({ amount: 40000 }).due; }
