#!/usr/bin/env node
/* The side hustle tax calculator:

       /side-hustle-tax-calculator/

       node tools/build-side-hustle-pages.js

   The £1,000 trading and property allowances and when to tell HMRC are
   quoted from HMRC's guidance in data/uk/side-hustle.json; Income Tax uses
   the UK tax file (tools/lib/uk-config.js) and Class 4 National Insurance
   the self-employed tax file (data/tax/gb/gb-se). The page is built from
   the same functions it runs (side-hustle.js). The build stops unless the
   figures are in the quoted wording and hand-checked examples come out.
   Runs in the monthly rebuild. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const related = require("./related.js");
const UK = require("../uk-calcs.js");
const SH = require("../side-hustle.js");
const registry = require("./tax/registry.js");
const { cfg, scot } = require("./lib/uk-config.js")();
const { esc, SITE } = site;

const R0 = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/uk/side-hustle.json"), "utf8"));
const se = registry.currentFiles(registry.readAll())["gb-se"].doc;
if (se.taxYear.label !== cfg.year) throw new Error(`side hustle: the self-employed tax file is ${se.taxYear.label}, the UK file ${cfg.year}`);
const class4 = se.items.find((i) => i.id === "gb-ni").charge.brackets.map((b) => [b[0], b[1]]);
const R = Object.assign({}, R0, { class4 });
const m2 = (v) => "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const m0 = (v) => "£" + Math.round(v).toLocaleString("en-GB");
const Q = (k) => R.rules[k].quote;
[["both", m0(R.allowance)], ["partial", "not more than the amount of your income"], ["tellTrading", "gross trading income over £1,000"], ["tellProperty", "over £1,000 up to £2,500"], ["tellProperty", "over £2,500"], ["register", "5 October"]]
  .forEach(([k, s]) => { if (!Q(k).includes(s)) throw new Error(`side hustle: "${s}" isn't in HMRC's quoted wording for ${k} (data/uk/side-hustle.json)`); });
/* hand-checked for 2026/27: £3,000 on top of a £30,000 job with £200 expenses: the allowance wins, £2,000 taxed at 20% = £400, no Class 4;
   £10,000 with £3,000 expenses on £45,000: £5,270 at 20% (£1,054) + £1,730 at 40% (£692) = £1,746;
   £20,000 less £2,000, no job: £5,430 × 20% = £1,086 tax, £5,430 × 6% = £325.80 Class 4; £1,800 of rent on £30,000: £800 × 20% = £160, contact HMRC */
const c = (o) => SH.calc(UK, cfg, R, Object.assign({ kind: "trading", expenses: 0, salary: 0 }, o));
const a = c({ gross: 3000, expenses: 200, salary: 30000 }), b = c({ gross: 10000, expenses: 3000, salary: 45000 }), d = c({ gross: 20000, expenses: 2000 }), p = c({ kind: "property", gross: 1800, salary: 30000 });
if (cfg.year === "2026/27" && (!a.useAllowance || a.profit !== 2000 || a.tax !== 400 || a.ni !== 0 || b.useAllowance || b.tax !== 1746 || d.tax !== 1086 || d.ni !== 325.8 || p.tax !== 160 || p.tell !== "contact" || c({ gross: 900 }).profit !== 0))
  throw new Error("side hustle: a hand-checked example no longer comes out");

const P = "/side-hustle-tax-calculator/", u = SITE + P;
const SRC = R.sources.map((s) => `<a href="${s.url}" rel="nofollow noopener" target="_blank">${esc(s.title)}</a>`).join("");
const CFG = { pa: cfg.pa, paTaperFrom: cfg.paTaperFrom, paTaper: cfg.paTaper, basicBand: cfg.basicBand, addlFrom: cfg.addlFrom, rates: cfg.rates, div: cfg.div };
const CFGS = Object.assign({}, CFG, { edges: scot.edges, rates: scot.rates });
const RULES = { cfg: CFG, cfgS: CFGS, R: { allowance: R.allowance, contactFrom: R.contactFrom, saFrom: R.saFrom, class4 } };
/* Scotland, hand-checked for 2026/27: £3,000 less the £1,000 allowance on a £30,000 job is £2,000 in the 21% intermediate band = £420 */
if (cfg.year === "2026/27" && SH.calc(UK, CFGS, R, { kind: "trading", gross: 3000, expenses: 200, salary: 30000 }).tax !== 420) throw new Error("side hustle: the Scottish hand-checked example no longer comes out");
const rows = [500, 1000, 2000, 3000, 5000, 10000, 20000].map((g) => { const x = c({ gross: g, salary: 30000 }), y = c({ gross: g, salary: 60000 }); return [m0(g), m2(x.tax + x.ni), m2(x.keep), m2(y.tax + y.ni), m2(y.keep)]; });
function tool(G, E, S) {
  const a = c({ gross: G, expenses: E, salary: S });
  return `    <main class="tool split" id="sh-tool" data-rules="${esc(JSON.stringify(RULES))}">
      <div class="field-row">
        <div class="field"><label for="sh-kind">Income from</label><select id="sh-kind"><option value="trading" selected>Selling, freelancing or casual work (trading)</option><option value="property">Renting out property or land</option></select></div>
        <div class="field"><label for="sh-gross">Gross income a year (before expenses)</label><input type="number" id="sh-gross" value="${G}" min="0" step="any" inputmode="decimal"></div>
      </div>
      <div class="field-row">
        <div class="field"><label for="sh-expenses">Expenses a year</label><input type="number" id="sh-expenses" value="${E}" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="sh-salary">Your salary or other income</label><input type="number" id="sh-salary" value="${S}" min="0" step="any" inputmode="decimal"></div>
      </div>
      <div class="field"><label for="sh-region">Where you live</label><select id="sh-region"><option value="ruk" selected>England, Wales or Northern Ireland</option><option value="scot">Scotland (Scottish Income Tax)</option></select></div>
      <p class="tool-hint" id="sh-error" role="alert" style="color: var(--bad); display: none;"></p>
      <p class="tool-hint" style="margin:6px 0 0;">Income Tax at ${esc(cfg.year)} rates, with Scottish rates if you live in Scotland; National Insurance is the same everywhere. A room let in your own home goes in the <a href="/rent-a-room-calculator/">Rent a Room calculator</a> instead.</p>
      <div class="result-box split-aside" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="sh-keep">${m2(a.keep)}</div>
          <div class="label" id="sh-label">you keep a year, after the £1,000 allowance and tax</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row"><span class="r-label">Taken off before tax</span><span class="r-value" id="sh-deduct">${m2(a.deduct)} (the allowance)</span></div>
          <div class="result-row"><span class="r-label">Taxable profit</span><span class="r-value" id="sh-profit">${m2(a.profit)}</span></div>
          <div class="result-row highlight"><span class="r-label">Extra Income Tax</span><span class="r-value" id="sh-tax">${m2(a.tax)}</span></div>
          <div class="result-row" id="sh-ni-row"><span class="r-label">Class 4 National Insurance</span><span class="r-value" id="sh-ni">${m2(a.ni)}</span></div>
        </div>
        <p class="tool-hint" id="sh-tell" style="margin:10px 0 0;"></p>
      </div>
    </main>
`;
}
const AMOUNTS = [1000, 2000, 3000, 5000, 7500, 10000, 15000, 20000, 30000, 50000];
const aurl = (n) => `${P}${n}/`;
const body = `    <main class="tool">
      <h2 class="tool-section-title">Tax on side income on top of a job</h2>
${site.table(["Side income a year", "Tax and NI (£30,000 job)", "You keep", "Tax and NI (£60,000 job)", "You keep"], rows, 680)}      <p class="tool-hint" style="margin-top:8px;">Trading income with no expenses, using the £1,000 trading allowance, ${esc(cfg.year)}. Class 4 National Insurance is ${class4[1][1]}% on profits over ${m0(class4[1][0])}, so it only starts on bigger side incomes.</p>
      <h2 class="tool-section-title" style="margin-top:18px;">The £1,000 trading and property allowances</h2>
      <p class="about-text">You can earn up to <strong>${m0(R.allowance)} a year tax-free</strong> from trading (self-employment, casual work such as babysitting or gardening, or hiring out personal equipment) and another ${m0(R.allowance)} from property or land. Above that you can take off either the ${m0(R.allowance)} allowance or your actual expenses, whichever is more, but not both. If you own a property jointly, you each get the property allowance against your share of the rent.</p>
      <p class="about-text"><strong>Telling HMRC:</strong> with gross trading income over ${m0(R.contactFrom)}, register for Self Assessment by 5 October after the end of the tax year. With property income over ${m0(R.contactFrom)} up to ${m0(R.saFrom)}, contact HMRC; over ${m0(R.saFrom)}, register for Self Assessment. You can't use the allowances for income from your employer, from a company or partnership you or someone connected to you controls, or for a room let under the Rent a Room Scheme.</p>
    </main>
`;
const q = [
  ["How much can I earn from a side hustle before paying tax?", `${m0(R.allowance)} a year of gross trading income is tax-free under the trading allowance, and another ${m0(R.allowance)} from property. Above that, tax is on the income less the allowance or your expenses.`],
  [`How much tax on ${m0(3000)} of side income?`, `With a ${m0(30000)} job and no expenses, ${m2(c({ gross: 3000, salary: 30000 }).tax)} of Income Tax: 20% of the ${m0(2000)} left after the ${m0(R.allowance)} allowance (${esc(cfg.year)}). No Class 4 National Insurance until profits pass ${m0(class4[1][0])}.`],
  ["Do I need to tell HMRC about selling online?", `If it's trading and your gross income is over ${m0(R.contactFrom)} a year, you must register for Self Assessment by 5 October after the tax year. At ${m0(R.contactFrom)} or less you don't need to tell HMRC.`],
  ["Can I claim expenses and the trading allowance?", "No: you take off one or the other. If your expenses are more than £1,000, claiming them is better."],
  ["Do I pay National Insurance on side income?", `On trading profits, Class 4 National Insurance at ${class4[1][1]}% on profits over ${m0(class4[1][0])} and ${class4[2][1]}% over ${m0(class4[2][0])}. Not on property income.`]
];
const title = site.fitTitle(`Side Hustle Tax Calculator UK — £1,000 Trading Allowance (${cfg.year})`, "Side Hustle Tax Calculator UK");
const desc = `Work out the tax on side income on top of a job: the £1,000 trading or property allowance or your expenses, the extra Income Tax and Class 4 NI, and whether to tell HMRC (${cfg.year}).`;
const app = { "@context": "https://schema.org", "@type": "WebApplication", name: "Side Hustle Tax Calculator", url: u, applicationCategory: "FinanceApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } };
const html = site.head({ title, desc, url: u, ld: [site.webPage(title, desc, u, R.lastChecked), site.breadcrumb([["Home", SITE + "/"], ["Personal Finance", SITE + "/personal-finance/"], ["Side Hustle Tax Calculator", u]]), app, site.faqLd(q)] }) + `    <header class="site-header">
      <a class="back-link" href="/personal-finance/">← Personal finance calculators</a>
      <h1 class="page-title">Side hustle tax calculator</h1>
      <p class="page-subtitle">The tax on income from selling, freelancing or renting on top of a job, with the ${m0(R.allowance)} allowance.</p>
    </header>

${tool(3000, 200, 30000)}
${body}
    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}      <p class="tool-hint" style="margin-top:12px;">A guide, not advice. Rules from HMRC: ${SRC}; Income Tax from the ${esc(cfg.year)} UK tax file and Class 4 from the self-employed tax file. Last checked ${site.niceDate(R.lastChecked)}.</p>
    </main>

    <div class="hub-group-title" style="margin-top:28px;">Tax on side income by amount</div>
    <p class="salary-links">${AMOUNTS.map((n) => `<a href="${aurl(n)}">Tax on ${m0(n)}</a>`).join(" ")}</p>

${related.block(P)}
${site.FOOTER}
  </div>
  <script src="/uk-calcs.js"></script>
  <script src="/side-hustle.js"></script>
</body>
</html>
`;
site.write("side-hustle-tax-calculator", html);

/* ---------- one page per amount: "tax on £5,000 side income" ---------- */
const JOBS = [[0, "No other job"], [20000, `${m0(20000)} job`], [30000, `${m0(30000)} job`], [50000, `${m0(50000)} job`], [80000, `${m0(80000)} job`]];
const CS = (o) => SH.calc(UK, CFGS, R, Object.assign({ kind: "trading", expenses: 0, salary: 0 }, o));
function amountPage(n) {
  const url = SITE + aurl(n);
  const rows = JOBS.map(([sal, label]) => { const t = c({ gross: n, salary: sal }), sc = CS({ gross: n, salary: sal }), pr = c({ kind: "property", gross: n, salary: sal }); return [label, m2(t.tax), m2(t.ni), m2(t.keep), m2(sc.tax + sc.ni), m2(pr.tax)]; });
  const b = c({ gross: n, salary: 30000 }), e = c({ gross: n, expenses: Math.round(n * 0.3), salary: 30000 });
  const tellT = n > R.contactFrom ? `register for Self Assessment by 5 October after the tax year ends` : `you don't need to tell HMRC`;
  const title = site.fitTitle(`Tax on ${m0(n)} Side Hustle Income — How Much You Keep (${cfg.year})`, `Tax on ${m0(n)} Side Income (UK)`);
  const desc = `Tax on ${m0(n)} of side hustle income: with a ${m0(30000)} job, ${m2(b.tax)} of Income Tax${b.ni ? ` and ${m2(b.ni)} Class 4 NI` : ""} after the ${m0(R.allowance)} trading allowance, so you keep ${m2(b.keep)} (${cfg.year}).`;
  const q = [
    [`How much tax do I pay on ${m0(n)} of side income?`, `With a ${m0(30000)} job and no expenses, ${m2(b.tax)} of Income Tax${b.ni ? ` and ${m2(b.ni)} of Class 4 National Insurance` : ""} after the ${m0(R.allowance)} trading allowance, so you keep ${m2(b.keep)} (${esc(cfg.year)}). With no other job, ${m2(c({ gross: n }).tax + c({ gross: n }).ni)}.`],
    [`Do I need to tell HMRC about ${m0(n)} of side income?`, `For trading income of ${m0(n)}, ${tellT}.${n > R.contactFrom && n <= R.saFrom ? ` For property income over ${m0(R.contactFrom)} up to ${m0(R.saFrom)}, contact HMRC.` : ""}`],
    [`Should I claim expenses or the ${m0(R.allowance)} allowance on ${m0(n)}?`, `Whichever is more: you can't have both. With ${m0(Math.round(n * 0.3))} of expenses on ${m0(n)}, claiming them leaves ${m2(e.profit)} taxable and ${m2(e.tax + e.ni)} of tax and NI on a ${m0(30000)} job.`],
    [`Is ${m0(n)} of rental income taxed the same way?`, `Property income gets its own ${m0(R.allowance)} allowance and doesn't pay Class 4 National Insurance: ${m2(c({ kind: "property", gross: n, salary: 30000 }).tax)} of Income Tax on a ${m0(30000)} job. A room let in your own home can use the Rent a Room Scheme instead.`]
  ];
  const ld = [site.webPage(title, desc, url, R.lastChecked), site.breadcrumb([["Home", SITE + "/"], ["Side Hustle Tax Calculator", u], [m0(n), url]]), site.faqLd(q)];
  const others = AMOUNTS.filter((x) => x !== n).map((x) => `<a href="${aurl(x)}">${m0(x)}</a>`).join(" ");
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="${P}">← Side hustle tax calculator</a>
      <h1 class="page-title">Tax on ${m0(n)} of side hustle income</h1>
      <p class="page-subtitle">With a ${m0(30000)} job: <strong>${m2(b.tax + b.ni)}</strong> of tax and NI, so you keep <strong>${m2(b.keep)}</strong> (${esc(cfg.year)}).</p>
    </header>

${tool(n, 0, 30000)}
    <main class="tool">
      <h2 class="tool-section-title">Tax on ${m0(n)} by your other income</h2>
${site.table(["Other income", "Income Tax", "Class 4 NI", "You keep", "Tax and NI in Scotland", "Tax if it's rent"], rows, 720)}      <p class="tool-hint" style="margin-top:8px;">Trading income with no expenses, using the ${m0(R.allowance)} trading allowance (property: the ${m0(R.allowance)} property allowance, no Class 4), ${esc(cfg.year)}. Class 4 National Insurance is ${class4[1][1]}% on profits over ${m0(class4[1][0])}.</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}      <p class="tool-hint" style="margin-top:12px;">A guide, not advice. Rules from HMRC: ${SRC}; Income Tax from the ${esc(cfg.year)} UK and Scottish tax files, Class 4 from the self-employed tax file. Last checked ${site.niceDate(R.lastChecked)}.</p>
    </main>

    <div class="hub-group-title" style="margin-top:28px;">Other amounts</div>
    <p class="salary-links">${others}</p>

${related.block(P)}
${site.FOOTER}
  </div>
  <script src="/uk-calcs.js"></script>
  <script src="/side-hustle.js"></script>
</body>
</html>
`;
}
const urls = [[P, "0.6"]];
AMOUNTS.forEach((n) => { site.write(`side-hustle-tax-calculator/${n}`, amountPage(n)); urls.push([aurl(n), "0.5"]); });
site.sitemapBlock("side hustle pages", "tools/build-side-hustle-pages.js", urls);
console.log(`built the side hustle tax calculator (${m0(3000)} on a ${m0(30000)} job: ${m2(a.tax)} tax)`);
