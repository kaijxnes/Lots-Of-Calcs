#!/usr/bin/env node
/* The Gift Aid calculator:

       /gift-aid-calculator/

       node tools/build-gift-aid-pages.js

   The 25p per £1 the charity claims, the 4-times-your-tax limit and what a
   higher rate taxpayer can claim back are quoted from GOV.UK; the extended
   rate bands from the Income Tax Act 2007 s414 and the adjusted net income
   rule from HMRC, all in data/uk/gift-aid.json. Tax uses the UK tax file in
   force (tools/lib/uk-config.js). The page is built from the same functions
   it runs (gift-aid.js). The build stops unless the figures are in the
   quoted wording and GOV.UK's example (and hand-checked cases) come out.
   Runs in the monthly rebuild. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const related = require("./related.js");
const UK = require("../uk-calcs.js");
const GA = require("../gift-aid.js");
const { cfg, scot } = require("./lib/uk-config.js")();
const { esc, SITE } = site;

const R = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/uk/gift-aid.json"), "utf8"));
const m2 = (v) => "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const m0 = (v) => "£" + Math.round(v).toLocaleString("en-GB");
const Q = (k) => R.rules[k].quote;
[["extra", `${R.top}p for every £1`], ["fourTimes", `not more than ${R.maxTimesTax} times`], ["ani", "take £1.25"], ["bands", "the basic rate limit and the higher rate limit"], ["example", "£125 x 20%"], ["payroll", "60p"]]
  .forEach(([k, s]) => { if (!Q(k).includes(s)) throw new Error(`gift aid: "${s}" isn't in the quoted wording for ${k} (data/uk/gift-aid.json)`); });
/* GOV.UK's example: £100 from a 40% taxpayer becomes £125 and they claim back £25.
   Hand-checked for 2026/27: £1,000 on £51,000: £730 of the £1,250 moves from 40% to 20% = £146;
   £8,000 on £110,000: £10,000 grossed up takes adjusted net income to £100,000, so £5,000 of Personal Allowance
   comes back (£2,000 at 40%) and £10,000 moves from 40% to 20% (£2,000) = £4,000; £1,000 on £200,000: 25% of £1,250 = £312.50 */
const c = (d, i) => GA.calc(UK, cfg, R, { donation: d, income: i });
const ex = c(100, 60000);
if (ex.gross !== 125 || ex.back !== 25) throw new Error("gift aid: GOV.UK's worked example no longer comes out");
if (cfg.year === "2026/27" && (c(1000, 51000).back !== 146 || c(8000, 110000).back !== 4000 || c(1000, 200000).back !== 312.5 || c(100, 30000).back !== 0 || c(100, 10000).qualifies))
  throw new Error("gift aid: a hand-checked example no longer comes out");

const P = "/gift-aid-calculator/", u = SITE + P;
const SRC = R.sources.map((s) => `<a href="${s.url}" rel="nofollow noopener" target="_blank">${esc(s.title)}</a>`).join(", ");
const CFG = { pa: cfg.pa, paTaperFrom: cfg.paTaperFrom, paTaper: cfg.paTaper, basicBand: cfg.basicBand, addlFrom: cfg.addlFrom, rates: cfg.rates, div: cfg.div };
const CFGS = Object.assign({}, CFG, { edges: scot.edges, rates: scot.rates });
const RULES = { cfg: CFG, cfgS: CFGS, R: { top: R.top, maxTimesTax: R.maxTimesTax } };
/* Scotland, hand-checked for 2026/27 (s414: the Scottish basic rate limit and the limits above it move up by £125):
   £100 on £60,000 (42% band): £125 × (42% − 20%) = £27.50; on £40,000 (21% band): £125 × 1% = £1.25 */
if (cfg.year === "2026/27" && (GA.calc(UK, CFGS, R, { donation: 100, income: 60000 }).back !== 27.5 || GA.calc(UK, CFGS, R, { donation: 100, income: 40000 }).back !== 1.25)) throw new Error("gift aid: the Scottish hand-checked examples no longer come out");
const def = c(100, 60000);
const rows = [30000, 60000, 110000, 150000].map((i) => { const a = c(100, i), b = c(1000, i); return [m0(i), m2(a.back), m2(a.cost), m2(b.back), m2(b.cost)]; });
function tool(D, I) {
  const def = c(D, I);
  return `    <main class="tool split" id="ga-tool" data-rules="${esc(JSON.stringify(RULES))}">
      <div class="field-row">
        <div class="field"><label for="ga-donation">Donations this tax year</label><input type="number" id="ga-donation" value="${D}" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="ga-income">Your taxable income a year</label><input type="number" id="ga-income" value="${I}" min="0" step="any" inputmode="decimal"></div>
      </div>
      <div class="field"><label for="ga-region">Where you live</label><select id="ga-region"><option value="ruk" selected>England, Wales or Northern Ireland</option><option value="scot">Scotland (Scottish Income Tax)</option></select></div>
      <p class="tool-hint" id="ga-error" role="alert" style="color: var(--bad); display: none;"></p>
      <p class="tool-hint" style="margin:6px 0 0;">What you actually give, before Gift Aid. ${esc(cfg.year)} rates. In Scotland the Scottish rate bands above the basic rate are extended by the grossed-up gift instead, so a 42% or 45% taxpayer gets more back.</p>
      <div class="result-box split-aside" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="ga-gross">${m2(def.gross)}</div>
          <div class="label">the charity gets with Gift Aid</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row"><span class="r-label">Gift Aid the charity claims</span><span class="r-value" id="ga-extra">${m2(def.extra)}</span></div>
          <div class="result-row highlight"><span class="r-label">You can claim back</span><span class="r-value" id="ga-back">${m2(def.back)}</span></div>
          <div class="result-row"><span class="r-label">Real cost to you</span><span class="r-value" id="ga-cost">${m2(def.cost)}</span></div>
        </div>
        <p class="tool-hint" id="ga-note" style="margin:10px 0 0;"></p>
      </div>
    </main>
`;
}
const AMOUNTS = [10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000, 10000];
const aurl = (n) => `${P}${n}/`;
const body = `    <main class="tool">
      <h2 class="tool-section-title">What you can claim back</h2>
${site.table(["Taxable income", "Back on £100", "Real cost of £100", "Back on £1,000", "Real cost of £1,000"], rows, 620)}      <p class="tool-hint" style="margin-top:8px;">${esc(cfg.year)} rates, England, Wales and Northern Ireland. The charity gets ${m0(125)} or ${m0(1250)} either way.</p>
      <h2 class="tool-section-title" style="margin-top:18px;">How Gift Aid works</h2>
      <p class="about-text">When you tick the Gift Aid box, the charity or community amateur sports club claims an extra <strong>${R.top}p for every £1</strong> you give, from the basic rate tax you've paid. It doesn't cost you anything extra. A declaration can cover your current and future donations and all donations made in the last 4 years.</p>
      <p class="about-text"><strong>Higher and additional rate taxpayers</strong> can claim back the difference between the tax they paid on the donation and what the charity got back, on a Self Assessment tax return or by asking HMRC to change their tax code. It works by extending your basic rate band (and higher rate limit) by the grossed-up gift, so less of your income is taxed at 40% or 45%. GOV.UK's example: you give ${m0(100)}, the charity gets ${m0(125)}, and as a 40% taxpayer you claim back ${m2(25)} (${m0(125)} × 20%).</p>
      <p class="about-text"><strong>Over ${m0(100000)}:</strong> the grossed-up gift also comes off your adjusted net income, so it can win back Personal Allowance you'd lose, and lower a High Income Child Benefit Charge.</p>
      <p class="about-text"><strong>Paying enough tax:</strong> donations qualify as long as they're not more than ${R.maxTimesTax} times the tax you've paid in the tax year (on income or capital gains). If the charity gets back more tax than you've paid, HMRC may ask you to pay the difference. Through Payroll Giving, donations come out of your pay before Income Tax instead: £1 to charity costs 80p for a basic rate taxpayer, 60p at the higher rate and 55p at the additional rate.</p>
    </main>
`;
const q = [
  ["How much does Gift Aid add?", `${R.top}p for every £1 you give, so a ${m0(100)} donation is worth ${m0(125)} to the charity. It doesn't cost you anything extra.`],
  ["Can higher rate taxpayers claim Gift Aid back?", `Yes: you can claim back the difference between the higher rate and the basic rate on the grossed-up gift. On ${m0(100)} at 40% that's ${m2(25)}, so the gift really costs you ${m0(75)}. Claim on your Self Assessment tax return or ask HMRC to change your tax code.`],
  [`How much can I claim back on ${m0(1000)}?`, `At 40%, ${m2(c(1000, 60000).back)} (20% of the ${m0(1250)} the charity gets); at 45%, ${m2(c(1000, 200000).back)}. Basic rate taxpayers don't get anything extra back: the charity gets the relief.`],
  ["Can I use Gift Aid if I don't pay tax?", `No: you should only make a Gift Aid declaration if you've paid enough tax to cover what the charity reclaims. Donations qualify if they're not more than ${R.maxTimesTax} times the tax you paid that tax year.`],
  ["Does Gift Aid help with the £100,000 Personal Allowance trap?", `Yes: the grossed-up gift comes off your adjusted net income. With ${m0(110000)} of income, giving ${m0(8000)} (${m0(10000)} with Gift Aid) brings it back to ${m0(100000)}, and you can claim back ${m2(c(8000, 110000).back)} (${esc(cfg.year)}).`]
];
const title = site.fitTitle(`Gift Aid Calculator — What You Can Claim Back (${cfg.year})`, "Gift Aid Calculator UK");
const desc = `Work out what a charity gets with Gift Aid (25p per £1) and how much a higher or additional rate taxpayer can claim back, including Personal Allowance over £100,000 (${cfg.year}).`;
const app = { "@context": "https://schema.org", "@type": "WebApplication", name: "Gift Aid Calculator", url: u, applicationCategory: "FinanceApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } };
const html = site.head({ title, desc, url: u, ld: [site.webPage(title, desc, u, R.lastChecked), site.breadcrumb([["Home", SITE + "/"], ["Personal Finance", SITE + "/personal-finance/"], ["Gift Aid Calculator", u]]), app, site.faqLd(q)] }) + `    <header class="site-header">
      <a class="back-link" href="/personal-finance/">← Personal finance calculators</a>
      <h1 class="page-title">Gift Aid calculator</h1>
      <p class="page-subtitle">What a charity gets with Gift Aid, and how much higher rate taxpayers can claim back.</p>
    </header>

${tool(100, 60000)}
${body}
    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}      <p class="tool-hint" style="margin-top:12px;">A guide, not advice. Rules from ${SRC}; Income Tax from the ${esc(cfg.year)} UK tax file. Last checked ${site.niceDate(R.lastChecked)}.</p>
    </main>

    <div class="hub-group-title" style="margin-top:28px;">Gift Aid by amount</div>
    <p class="salary-links">${AMOUNTS.map((n) => `<a href="${aurl(n)}">Gift Aid on ${m0(n)}</a>`).join(" ")}</p>

${related.block(P)}
${site.FOOTER}
  </div>
  <script src="/uk-calcs.js"></script>
  <script src="/gift-aid.js"></script>
</body>
</html>
`;
site.write("gift-aid-calculator", html);

/* ---------- one page per amount: "Gift Aid on £1,000" ---------- */
const PAYERS = [["Basic rate (20%)", "England, Wales or NI", 30000, cfg], ["Higher rate (40%)", "England, Wales or NI", 60000, cfg], ["Additional rate (45%)", "England, Wales or NI", 150000, cfg],
  ["Intermediate rate (21%)", "Scotland", 40000, CFGS], ["Higher rate (42%)", "Scotland", 60000, CFGS], ["Advanced rate (45%)", "Scotland", 90000, CFGS], ["Top rate (48%)", "Scotland", 150000, CFGS]];
function amountPage(n) {
  const url = SITE + aurl(n), gross = n * (1 + R.top / 100);
  const res = PAYERS.map(([rate, where, inc, conf]) => [rate, where, inc, GA.calc(UK, conf, R, { donation: n, income: inc })]);
  const rows = res.map(([rate, where, inc, r]) => [rate, where, m0(inc), m2(r.back), m2(r.cost)]);
  const hi = res[1][3], ad = res[2][3];
  const title = site.fitTitle(`Gift Aid on ${m0(n)} — What the Charity Gets and What You Claim Back`, `Gift Aid on ${m0(n)} — Charity Gets ${m2(gross)}`);
  const desc = `Gift Aid on a ${m0(n)} donation: the charity gets ${m2(gross)}. A 40% taxpayer can claim back ${m2(hi.back)} and a 45% taxpayer ${m2(ad.back)}, so the gift really costs ${m2(hi.cost)} or ${m2(ad.cost)} (${cfg.year}).`;
  const q = [
    [`How much is Gift Aid on ${m0(n)}?`, `${m2(gross - n)}: the charity claims ${R.top}p for every £1, so your ${m0(n)} is worth ${m2(gross)} to it. It doesn't cost you anything extra.`],
    [`How much can I claim back on a ${m0(n)} donation?`, `A higher rate (40%) taxpayer can claim back ${m2(hi.back)} and an additional rate (45%) taxpayer ${m2(ad.back)}, on a Self Assessment tax return or by asking HMRC to change their tax code. Basic rate taxpayers don't get anything back: the charity gets the relief.`],
    [`What does a ${m0(n)} donation really cost a higher rate taxpayer?`, `${m2(hi.cost)} after claiming back ${m2(hi.back)} (${esc(cfg.year)}), for a gift worth ${m2(gross)} to the charity.`],
    ["Do I pay enough tax for Gift Aid?", `Your donations qualify as long as they're not more than ${R.maxTimesTax} times the tax you've paid in the tax year. For ${m0(n)}, that means paying at least ${m2(n / R.maxTimesTax)} of Income Tax or Capital Gains Tax.`]
  ];
  const ld = [site.webPage(title, desc, url, R.lastChecked), site.breadcrumb([["Home", SITE + "/"], ["Gift Aid Calculator", u], [m0(n), url]]), site.faqLd(q)];
  const others = AMOUNTS.filter((x) => x !== n).map((x) => `<a href="${aurl(x)}">${m0(x)}</a>`).join(" ");
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="${P}">← Gift Aid calculator</a>
      <h1 class="page-title">Gift Aid on ${m0(n)}</h1>
      <p class="page-subtitle">The charity gets <strong>${m2(gross)}</strong>; a higher rate taxpayer can claim back <strong>${m2(hi.back)}</strong> (${esc(cfg.year)}).</p>
    </header>

${tool(n, 60000)}
    <main class="tool">
      <h2 class="tool-section-title">What you can claim back on ${m0(n)}</h2>
${site.table(["Your top rate", "Where", "Example income", "You claim back", "Real cost to you"], rows, 640)}      <p class="tool-hint" style="margin-top:8px;">The charity gets ${m2(gross)} in every case. Worked out with the basic rate limit and the limits above it extended by the grossed-up gift (in Scotland, the Scottish basic rate limit and those above it), ${esc(cfg.year)} rates. Above ${m0(cfg.paTaperFrom)} of income the gift can also win back Personal Allowance, so you can get more back than shown.</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}      <p class="tool-hint" style="margin-top:12px;">A guide, not advice. Rules from ${SRC}; Income Tax from the ${esc(cfg.year)} UK and Scottish tax files. Last checked ${site.niceDate(R.lastChecked)}.</p>
    </main>

    <div class="hub-group-title" style="margin-top:28px;">Other amounts</div>
    <p class="salary-links">${others}</p>

${related.block(P)}
${site.FOOTER}
  </div>
  <script src="/uk-calcs.js"></script>
  <script src="/gift-aid.js"></script>
</body>
</html>
`;
}
const urls = [[P, "0.6"]];
AMOUNTS.forEach((n) => { site.write(`gift-aid-calculator/${n}`, amountPage(n)); urls.push([aurl(n), "0.5"]); });
site.sitemapBlock("gift aid pages", "tools/build-gift-aid-pages.js", urls);
console.log(`built the Gift Aid calculator (${m0(100)} at 40%: ${m2(def.back)} back)`);
