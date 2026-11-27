#!/usr/bin/env node
/* The Rent a Room calculator:

       /rent-a-room-calculator/

       node tools/build-rent-a-room-pages.js

   The £7,500 limit (£3,750 shared) and HMRC's two methods above it are
   quoted from GOV.UK and helpsheet HS223 in data/uk/rent-a-room.json; tax
   uses the UK tax file in force (tools/lib/uk-config.js). The page is built
   from the same functions it runs (rent-a-room.js). The build stops unless
   the figures are in the quoted wording and HMRC's own worked example (and
   hand-checked tax) come out. Runs in the monthly rebuild. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const related = require("./related.js");
const UK = require("../uk-calcs.js");
const RR = require("../rent-a-room.js");
const { cfg } = require("./lib/uk-config.js")();
const { esc, SITE } = site;

const R = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/uk/rent-a-room.json"), "utf8"));
const m2 = (v) => "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const m0 = (v) => "£" + Math.round(v).toLocaleString("en-GB");
const Q = (k) => R.rules[k].quote;
[["limit", m0(R.limit)], ["limit", m0(R.shared)], ["methods", "Method A"], ["methods", "Method B"], ["example", "£10,600"], ["example", "£9,000"]]
  .forEach(([k, s]) => { if (!Q(k).includes(s)) throw new Error(`rent a room: "${s}" isn't in the quoted wording for ${k} (data/uk/rent-a-room.json)`); });
/* HMRC's example (HS223): £10,600 receipts, £9,000 expenses: Method A taxes £1,600, Method B £3,100, A is better.
   Hand-checked tax for a basic rate taxpayer on £30,000: A 20% × £1,600 = £320, B £620 */
const chris = RR.calc(UK, cfg, R, { receipts: 10600, expenses: 9000, other: 30000 });
if (chris.profitA !== 1600 || chris.taxableB !== 3100 || chris.best !== "A" || (cfg.year === "2026/27" && (chris.taxA !== 320 || chris.taxB !== 620))) throw new Error("rent a room: HMRC's worked example (HS223) no longer comes out");
const low = RR.calc(UK, cfg, R, { receipts: 7500, expenses: 0, other: 30000 }), shared = RR.calc(UK, cfg, R, { receipts: 5000, expenses: 1000, shared: true, other: 30000 });
if (!low.under || low.due !== 0 || shared.under || shared.best !== "B" || shared.taxableB !== 1250) throw new Error("rent a room: the limit no longer comes out right");

const P = "/rent-a-room-calculator/", u = SITE + P;
const SRC = R.sources.map((s) => `<a href="${s.url}" rel="nofollow noopener" target="_blank">${esc(s.title)}</a>`).join(" and ");
const CFG = { pa: cfg.pa, paTaperFrom: cfg.paTaperFrom, paTaper: cfg.paTaper, basicBand: cfg.basicBand, addlFrom: cfg.addlFrom, rates: cfg.rates, div: cfg.div };
const RULES = { cfg: CFG, R: { limit: R.limit, shared: R.shared } };
const def = RR.calc(UK, cfg, R, { receipts: 150 * 52, expenses: 0, other: 30000 });
const weeks = [100, 125, 144, 150, 175, 200, 250].map((w) => { const r = RR.calc(UK, cfg, R, { receipts: w * 52, expenses: 0, other: 30000 }), h = RR.calc(UK, cfg, R, { receipts: w * 52, expenses: 0, other: 60000 }); return [m0(w), m0(w * 52), r.under ? "Tax-free" : m2(r.due), h.under ? "Tax-free" : m2(h.due)]; });
const tool = `    <main class="tool split" id="rr-tool" data-rules="${esc(JSON.stringify(RULES))}">
      <div class="field-row">
        <div class="field"><label for="rr-rent">Rent from your lodger</label><input type="number" id="rr-rent" value="150" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="rr-extra">Paid for meals, cleaning or bills</label><input type="number" id="rr-extra" value="0" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="rr-per">Per</label><select id="rr-per"><option value="week" selected>Week</option><option value="month">Month</option><option value="year">Year</option></select></div>
      </div>
      <div class="field-row">
        <div class="field"><label for="rr-expenses">Expenses a year (for Method A)</label><input type="number" id="rr-expenses" value="0" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="rr-other">Your other income this tax year</label><input type="number" id="rr-other" value="30000" min="0" step="any" inputmode="decimal"></div>
      </div>
      <div class="field"><label><input type="checkbox" id="rr-shared" style="width:auto; margin-right:8px;">Someone else (such as a joint owner) also gets income from letting in this home</label></div>
      <p class="tool-hint" id="rr-error" role="alert" style="color: var(--bad); display: none;"></p>
      <p class="tool-hint" style="margin:6px 0 0;">For a furnished room in your only or main home. Tax at England, Wales and Northern Ireland rates (${esc(cfg.year)}); Scottish rates differ.</p>
      <div class="result-box split-aside" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="rr-due">${m2(def.due)}</div>
          <div class="label" id="rr-label">tax a year, using Method ${def.best}</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row"><span class="r-label">Gross receipts a year</span><span class="r-value" id="rr-receipts">${m2(def.receipts)}</span></div>
          <div class="result-row"><span class="r-label">Rent a Room limit</span><span class="r-value" id="rr-limit">${m2(def.limit)}</span></div>
          <div class="result-row"><span class="r-label">Method A (profit)</span><span class="r-value" id="rr-a">${m2(def.profitA)} taxable, ${m2(def.taxA)} tax</span></div>
          <div class="result-row"><span class="r-label">Method B (over the limit)</span><span class="r-value" id="rr-b">${m2(def.taxableB)} taxable, ${m2(def.taxB)} tax</span></div>
          <div class="result-row highlight"><span class="r-label">You keep a year</span><span class="r-value" id="rr-keep">${m2(def.keep)}</span></div>
        </div>
        <p class="tool-hint" id="rr-note" style="margin:10px 0 0;"></p>
      </div>
    </main>
`;
const body = `    <main class="tool">
      <h2 class="tool-section-title">Tax on a lodger's rent</h2>
${site.table(["Rent a week", "A year", "Tax, basic rate (other income £30,000)", "Tax, higher rate (other income £60,000)"], weeks, 640)}      <p class="tool-hint" style="margin-top:8px;">No expenses claimed, so the lower of Method A and Method B is Method B. ${m0(R.limit)} a year is about ${m2(R.limit / 52)} a week. ${esc(cfg.year)} rates.</p>
      <h2 class="tool-section-title" style="margin-top:18px;">How the Rent a Room Scheme works</h2>
      <p class="about-text">You can earn up to <strong>${m0(R.limit)} a year tax-free</strong> from letting furnished accommodation in your only or main home, whether you own it or rent it, or from running a bed and breakfast or guest house. The limit is halved to <strong>${m0(R.shared)}</strong> if someone else, such as a joint owner, also gets income from letting in the same property. It counts your <strong>gross receipts</strong>: the rent before expenses, plus anything paid for meals, cleaning, laundry or other services.</p>
      <p class="about-text">Under the limit the exemption is automatic and you don't need to do anything. Over it, you fill in a tax return and choose: <strong>Method A</strong> pays tax on your actual profit (receipts less expenses); <strong>Method B</strong> pays tax on the receipts over ${m0(R.limit)}, with no expenses. HMRC uses Method A unless you tell it you want Method B. HMRC's example: receipts of ${m0(10600)} and expenses of ${m0(9000)} mean tax on ${m0(1600)} under Method A or ${m0(3100)} under Method B, so Method A is better.</p>
      <p class="about-text">You can't use the scheme for a home converted into separate flats, unfurnished accommodation, or a room let while you live abroad. If having a lodger means you no longer get a <a href="/council-tax-discount-calculator/">Council Tax single person discount</a>, you must tell your council.</p>
    </main>
`;
const q = [
  ["How much can I earn from a lodger tax-free?", `${m0(R.limit)} a year (about ${m2(R.limit / 52)} a week) under the Rent a Room Scheme, or ${m0(R.shared)} if someone else also gets letting income from the same home.`],
  ["What if I earn more than £7,500 from a lodger?", "You fill in a tax return and pay tax either on your profit after expenses (Method A) or on everything over £7,500 with no expenses (Method B), whichever you choose. HMRC uses Method A unless you tell it otherwise."],
  [`How much tax on ${m0(150)} a week from a lodger?`, `${m0(150 * 52)} a year is ${m0(150 * 52 - R.limit)} over the limit, so with no expenses and other income of ${m0(30000)}, Method B gives ${m2(def.taxB)} of tax (${esc(cfg.year)}).`],
  ["Do bills paid by my lodger count?", "Yes: gross receipts include anything you get for meals, goods and services such as cleaning or laundry, as well as the rent."],
  ["Can I use Rent a Room if I rent my home?", "Yes, as long as it's your only or main home and the room is furnished. You can't use it if the home has been converted into separate flats."]
];
const title = site.fitTitle(`Rent a Room Calculator — £7,500 Tax-Free Lodger Income (${cfg.year})`, "Rent a Room Scheme Calculator");
const desc = `Work out the tax on a lodger's rent: ${m0(R.limit)} a year tax-free under the Rent a Room Scheme, and above it whether paying tax on profit (Method A) or on receipts over the limit (Method B) is cheaper.`;
const app = { "@context": "https://schema.org", "@type": "WebApplication", name: "Rent a Room Calculator", url: u, applicationCategory: "FinanceApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } };
const html = site.head({ title, desc, url: u, ld: [site.webPage(title, desc, u, R.lastChecked), site.breadcrumb([["Home", SITE + "/"], ["Mortgages & Loans", SITE + "/mortgages-loans/"], ["Rent a Room Calculator", u]]), app, site.faqLd(q)] }) + `    <header class="site-header">
      <a class="back-link" href="/mortgages-loans/">← Mortgages and property calculators</a>
      <h1 class="page-title">Rent a Room calculator</h1>
      <p class="page-subtitle">The tax on renting a room to a lodger, with the ${m0(R.limit)} tax-free limit and the cheaper of HMRC's two methods.</p>
    </header>

${tool}
${body}
    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}      <p class="tool-hint" style="margin-top:12px;">A guide, not advice. Rules from ${SRC}. Last checked ${site.niceDate(R.lastChecked)}.</p>
    </main>

${related.block(P)}
${site.FOOTER}
  </div>
  <script src="/uk-calcs.js"></script>
  <script src="/rent-a-room.js"></script>
</body>
</html>
`;
site.write("rent-a-room-calculator", html);
site.sitemapBlock("rent a room pages", "tools/build-rent-a-room-pages.js", [[P, "0.6"]]);
console.log(`built the Rent a Room calculator (${m0(150)} a week, other income ${m0(30000)}: ${m2(def.due)} tax)`);
