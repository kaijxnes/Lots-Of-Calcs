#!/usr/bin/env node
/* The redundancy and termination pay tax calculator:

       /redundancy-tax-calculator/

       node tools/build-termination-pay-pages.js

   What's taxed, what's tax-free up to £30,000, notice pay (PENP) and how
   PAYE and National Insurance are worked out before and after your P45 are
   quoted from GOV.UK and HMRC's employer guide CWG2 in
   data/uk/termination-pay.json; tax uses the UK tax file in force
   (tools/lib/uk-config.js). The page is built from the same functions it
   runs (termination-pay.js). The build stops unless the figures are in the
   quoted wording and GOV.UK's two worked examples (and hand-checked tax)
   come out. Runs in the monthly rebuild. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const related = require("./related.js");
const UK = require("../uk-calcs.js");
const TP = require("../termination-pay.js");
const { cfg, scot } = require("./lib/uk-config.js")();
const { esc, SITE } = site;

const R = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/uk/termination-pay.json"), "utf8"));
const m2 = (v) => "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const m0 = (v) => "£" + Math.round(v).toLocaleString("en-GB");
const Q = (k) => R.rules[k].quote;
[["taxFree", m0(R.taxFreeLimit)], ["over", m0(R.taxFreeLimit)], ["redundancyNI", m0(R.taxFreeLimit)], ["penpCap", "only pay tax on the amount you actually get"], ["p45", "‘0T’"], ["afterLeavingTax", "code 0T (on a week 1 or month 1 basis)"], ["afterLeavingNI", "weekly earnings period"], ["whenLeavingNI", "regular earnings period"]]
  .forEach(([k, s]) => { if (!Q(k).includes(s)) throw new Error(`termination pay: "${s}" isn't in the quoted wording for ${k} (data/uk/termination-pay.json)`); });
/* GOV.UK's examples: £10,000 statutory + £5,000 severance, 4 weeks' notice not worked at £500: tax and NI on £2,000, £13,000 not taxed;
   the same with £3,000 severance at £1,000 a week: PENP £4,000 is capped, tax and NI on the £3,000, £10,000 not taxed */
const e1 = TP.split(R, { statutory: 10000, severance: 5000, noticePay: 4 * 500 }), e2 = TP.split(R, { statutory: 10000, severance: 3000, noticePay: 4 * 1000 });
["example1", "example2"].forEach((k) => ["£10,000", "4-week"].forEach((s) => { if (!Q(k).includes(s)) throw new Error(`termination pay: "${s}" isn't in GOV.UK's ${k}`); }));
if (!Q("example1").includes("£2,000 of your severance") || !Q("example1").includes("remaining £13,000") || !Q("example2").includes("full £3,000") || !Q("example2").includes("remaining £10,000"))
  throw new Error("termination pay: GOV.UK's worked examples have changed wording");
if (e1.earnings !== 2000 || e1.free !== 13000 || e2.earnings !== 3000 || e2.free !== 10000) throw new Error("termination pay: GOV.UK's worked examples no longer come out");
/* hand-checked for 2026/27: £36,000 salary, leaving in September (month 6), £10,000 statutory + £25,000 severance + £1,500 holiday pay:
   £5,000 over £30,000 + £1,500 = £6,500 taxable, all at 20% = £1,300 for the year and through a cumulative 1257L code;
   NI on £3,000 + £1,500 in the month: £1,189.17 × 8% + £310.83 × 2% = £101.35. After the P45 on 0T month 1: £3,141.67 × 20% + £3,358.33 × 40% = £1,971.67;
   NI weekly: £725.00 × 8% + £533.27 × 2% = £68.67 */
const hc = { statutory: 10000, severance: 25000, earnings: 1500, salary: 36000, month: 6 };
const h1 = TP.calc(UK, cfg, R, hc), h2 = TP.calc(UK, cfg, R, Object.assign({ afterP45: true }, hc));
if (cfg.year === "2026/27" && (h1.over !== 5000 || h1.year !== 1300 || h1.paye !== 1300 || h1.ni !== 101.35 || h2.paye !== 1971.67 || h2.ni !== 68.67 || h2.back !== 671.67))
  throw new Error("termination pay: a hand-checked example no longer comes out");

const P = "/redundancy-tax-calculator/", u = SITE + P;
const SRC = R.sources.map((s) => `<a href="${s.url}" rel="nofollow noopener" target="_blank">${esc(s.title)}</a>`).join(" and ");
const CFG = { pa: cfg.pa, paTaperFrom: cfg.paTaperFrom, paTaper: cfg.paTaper, basicBand: cfg.basicBand, addlFrom: cfg.addlFrom, rates: cfg.rates, div: cfg.div, niPT: cfg.niPT, niUEL: cfg.niUEL, niMain: cfg.niMain, niUpper: cfg.niUpper };
const CFGS = Object.assign({}, CFG, { edges: scot.edges, rates: scot.rates });
const RULES = { cfg: CFG, cfgS: CFGS, R: { taxFreeLimit: R.taxFreeLimit } };
/* Scotland, hand-checked for 2026/27: the same £6,500 after the P45 on S0T month 1 (bands ÷ 12): £330.58 × 19% + £1,082.42 × 20%
   + £1,178 × 21% + £2,611.50 × 42% + £1,297.50 × 45% = £2,207.38; tax for the year £1,300 (all in the 20% band) */
{ const s = TP.calc(UK, CFGS, R, Object.assign({ afterP45: true }, hc)); if (cfg.year === "2026/27" && (s.paye !== 2207.38 || s.year !== 1300)) throw new Error("termination pay: the Scottish hand-checked example no longer comes out"); }
const MONTHS = ["April", "May", "June", "July", "August", "September", "October", "November", "December", "January", "February", "March"];
const D0 = { statutory: 10000, severance: 5000, weeks: 0, weekly: 700, earnings: 1500, salary: 36000, month: 6 };
const AMOUNTS = [30000, 35000, 40000, 45000, 50000, 60000, 70000, 75000, 80000, 90000, 100000, 125000, 150000, 200000];
const aurl = (n) => `${P}${n}/`;
const rows = [20000, 30000, 40000, 50000, 75000, 100000].map((t) => {
  const a = TP.calc(UK, cfg, R, { statutory: 0, severance: t, salary: 36000, month: 6 }), b = TP.calc(UK, cfg, R, { statutory: 0, severance: t, salary: 60000, month: 6 });
  return [AMOUNTS.includes(t) ? `<a href="${aurl(t)}">${m0(t)}</a>` : m0(t), m0(a.free), m0(a.over), m2(a.year), m2(b.year)];
});
const field = (id, label, value, extra) => `<div class="field"><label for="${id}">${label}</label><input type="number" id="${id}" value="${value}" min="0" step="any" inputmode="decimal"${extra || ""}></div>`;
function tool(D) {
  const def = TP.calc(UK, cfg, R, { statutory: D.statutory, severance: D.severance, noticePay: D.weeks * D.weekly, earnings: D.earnings, salary: D.salary, month: D.month });
  return `    <main class="tool split" id="tp-tool" data-rules="${esc(JSON.stringify(RULES))}">
      <div class="field-row">
        ${field("tp-statutory", "Statutory redundancy pay", D.statutory)}
        ${field("tp-severance", "Enhanced redundancy, severance or settlement pay", D.severance)}
      </div>
      <div class="field-row">
        ${field("tp-earnings", "Holiday pay, unpaid wages, bonus or pay in lieu of notice", D.earnings)}
        ${field("tp-salary", "Your salary a year", D.salary)}
      </div>
      <div class="field-row">
        ${field("tp-weeks", "Weeks of notice you won't work and aren't paid for separately", D.weeks)}
        ${field("tp-weekly", "Your weekly pay", D.weekly)}
      </div>
      <div class="field-row">
        <div class="field"><label for="tp-month">Month you leave</label><select id="tp-month">${MONTHS.map((n, i) => `<option value="${i + 1}"${i + 1 === D.month ? " selected" : ""}>${n}</option>`).join("")}</select></div>
        <div class="field"><label style="margin-top:26px;"><input type="checkbox" id="tp-p45" style="width:auto; margin-right:8px;">Paid after I get my P45</label></div>
      </div>
      <div class="field"><label for="tp-region">Where you live</label><select id="tp-region"><option value="ruk" selected>England, Wales or Northern Ireland</option><option value="scot">Scotland (Scottish Income Tax)</option></select></div>
      <p class="tool-hint" id="tp-error" role="alert" style="color: var(--bad); display: none;"></p>
      <p class="tool-hint" style="margin:6px 0 0;">${esc(cfg.year)} rates, paid monthly with a 1257L tax code (S1257L and S0T in Scotland, with Scottish rates). Leave out employer pension contributions and legal fees paid to your solicitor: they're not taxed. The <a href="/redundancy-pay-calculator/">redundancy pay calculator</a> works out the statutory amount.</p>
      <div class="result-box split-aside" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="tp-net">${m2(def.net)}</div>
          <div class="label">you get after tax and National Insurance</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row"><span class="r-label">Tax-free (up to ${m0(R.taxFreeLimit)})</span><span class="r-value" id="tp-free">${m2(def.free)}</span></div>
          <div class="result-row"><span class="r-label">Taxed as pay (tax and NI)</span><span class="r-value" id="tp-earn">${m2(def.earnings)}</span></div>
          <div class="result-row"><span class="r-label">Over ${m0(R.taxFreeLimit)} (tax, no NI)</span><span class="r-value" id="tp-over">${m2(def.over)}</span></div>
          <div class="result-row highlight"><span class="r-label">Income Tax taken off</span><span class="r-value" id="tp-paye">${m2(def.paye)}</span></div>
          <div class="result-row"><span class="r-label">National Insurance taken off</span><span class="r-value" id="tp-ni">${m2(def.ni)}</span></div>
          <div class="result-row"><span class="r-label">Tax due for the year on it</span><span class="r-value" id="tp-year">${m2(def.year)}</span></div>
        </div>
        <p class="tool-hint" id="tp-note" style="margin:10px 0 0;"></p>
      </div>
    </main>
`;
}
const def = TP.calc(UK, cfg, R, { statutory: D0.statutory, severance: D0.severance, noticePay: 0, earnings: D0.earnings, salary: D0.salary, month: D0.month });
const body = `    <main class="tool">
      <h2 class="tool-section-title">Tax on a redundancy or settlement payment</h2>
${site.table(["Severance pay", "Tax-free", "Taxed", "Tax (£36,000 salary)", "Tax (£60,000 salary)"], rows, 640)}      <p class="tool-hint" style="margin-top:8px;">Income Tax on a one-off payment with no notice pay, paid with your final pay when leaving in September, ${esc(cfg.year)}, with no more income that tax year. No employee National Insurance on the part over ${m0(R.taxFreeLimit)}.</p>
      <h2 class="tool-section-title" style="margin-top:18px;">What's tax-free and what's taxed</h2>
      <p class="about-text"><strong>Taxed as pay</strong> (Income Tax and National Insurance): unpaid wages, holiday pay, bonuses, payments for agreeing to a restrictive covenant, and payments instead of working your notice period, such as pay in lieu of notice (PILON).</p>
      <p class="about-text"><strong>Tax-free up to ${m0(R.taxFreeLimit)}</strong>: you don't usually pay tax on the first combined ${m0(R.taxFreeLimit)} of statutory redundancy pay, enhanced redundancy or severance payments, and non-cash benefits such as company property you keep. You pay tax on anything over ${m0(R.taxFreeLimit)}; your employer pays Class 1A National Insurance on it, not you.</p>
      <p class="about-text"><strong>Not taxed</strong>: employer contributions to a registered pension scheme as part of the payment (up to your Annual Allowance), legal costs for the settlement paid straight to your solicitor, and a payment because an injury, illness or disability means you can't do your job.</p>
      <h2 class="tool-section-title" style="margin-top:18px;">Notice you don't work (PENP)</h2>
      <p class="about-text">If you don't work your full notice, you pay tax and National Insurance on the part of the payment equal to what you'd have earned. Part of severance or enhanced redundancy can count as this <strong>Post-Employment Notice Pay</strong> (PENP), but statutory redundancy pay never does, and if PENP is more than the severance you only pay tax on the severance. GOV.UK's example: ${m0(10000)} statutory redundancy pay and ${m0(5000)} severance, with 4 weeks' notice not worked at ${m0(500)} a week, means tax and National Insurance on ${m0(2000)}, and the other ${m0(13000)} is tax-free.</p>
      <h2 class="tool-section-title" style="margin-top:18px;">How the tax comes off</h2>
      <p class="about-text">Your employer takes the tax and National Insurance off in your final payslip through PAYE. If you're paid after you get your P45, your employer uses an <strong>0T</strong> tax code on a month 1 basis, as though you'd used up your Personal Allowance, so more tax can come off than you owe for the year. National Insurance on a payment after you've left is worked out on a weekly earnings period. If you think you've paid too much tax, or the payment wasn't taxed the right way, contact HMRC. Different rules can apply if you're not UK resident, a seafarer or in the armed forces.</p>
    </main>
`;
const q = [
  [`Is redundancy pay tax-free?`, `The first ${m0(R.taxFreeLimit)} of statutory redundancy pay, enhanced redundancy or severance and non-cash benefits combined is usually tax-free. Anything over ${m0(R.taxFreeLimit)} pays Income Tax but not employee National Insurance. Holiday pay, unpaid wages and pay in lieu of notice are taxed as normal pay.`],
  [`How much tax will I pay on a ${m0(50000)} settlement?`, `With ${m0(50000)} of severance and no notice pay, ${m0(R.taxFreeLimit)} is tax-free and ${m0(20000)} is taxed. On a ${m0(36000)} salary, leaving in September with no more income that year, that's about ${m2(TP.calc(UK, cfg, R, { severance: 50000, salary: 36000, month: 6 }).year)} of Income Tax (${esc(cfg.year)}).`],
  ["Is pay in lieu of notice taxed?", "Yes: payments instead of working your notice are taxed and pay National Insurance like normal wages. If you don't work your notice, part of your severance can also be taxed as Post-Employment Notice Pay."],
  ["Why is so much tax taken off my redundancy pay?", "If it's paid after you've got your P45, your employer uses an 0T tax code on a month 1 basis, as though you'd used your Personal Allowance. That can take off more than you owe for the year; if you think you've paid too much tax, contact HMRC."],
  ["Do I pay National Insurance on redundancy pay?", `Not on statutory redundancy pay or severance, even over ${m0(R.taxFreeLimit)}: your employer pays Class 1A National Insurance on the part over ${m0(R.taxFreeLimit)}. You do pay it on holiday pay, unpaid wages, bonuses and notice pay.`]
];
const title = site.fitTitle(`Redundancy Tax Calculator UK — £30,000 Tax-Free Limit (${cfg.year})`, "Redundancy Tax Calculator UK");
const desc = `Work out the tax on redundancy, severance or settlement pay: the first ${m0(R.taxFreeLimit)} tax-free, notice pay (PENP) and holiday pay taxed, and what PAYE takes off before and after your P45 (${cfg.year}).`;
const app = { "@context": "https://schema.org", "@type": "WebApplication", name: "Redundancy Tax Calculator", url: u, applicationCategory: "FinanceApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } };
const html = site.head({ title, desc, url: u, ld: [site.webPage(title, desc, u, R.lastChecked), site.breadcrumb([["Home", SITE + "/"], ["Personal Finance", SITE + "/personal-finance/"], ["Redundancy Tax Calculator", u]]), app, site.faqLd(q)] }) + `    <header class="site-header">
      <a class="back-link" href="/personal-finance/">← Personal finance calculators</a>
      <h1 class="page-title">Redundancy tax calculator</h1>
      <p class="page-subtitle">The tax on redundancy, severance or settlement pay, with the ${m0(R.taxFreeLimit)} tax-free limit, notice pay and holiday pay.</p>
    </header>

${tool(D0)}
${body}
    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}      <p class="tool-hint" style="margin-top:12px;">A guide, not advice. Rules from ${SRC}; Income Tax and National Insurance from the ${esc(cfg.year)} UK tax file. Last checked ${site.niceDate(R.lastChecked)}.</p>
    </main>

    <div class="hub-group-title" style="margin-top:28px;">Tax on redundancy pay by amount</div>
    <p class="salary-links">${AMOUNTS.map((n) => `<a href="${aurl(n)}">Tax on ${m0(n)}</a>`).join(" ")}</p>

${related.block(P)}
${site.FOOTER}
  </div>
  <script src="/uk-calcs.js"></script>
  <script src="/termination-pay.js"></script>
</body>
</html>
`;
site.write("redundancy-tax-calculator", html);

/* ---------- one page per amount: "tax on £50,000 redundancy" ---------- */
const SALARIES = [25000, 35000, 50000, 70000, 100000];
function amountPage(n) {
  const url = SITE + aurl(n);
  const c = (o) => TP.calc(UK, cfg, R, Object.assign({ statutory: 0, severance: n, earnings: 0, month: 6 }, o));
  const cs = (o) => TP.calc(UK, CFGS, R, Object.assign({ statutory: 0, severance: n, earnings: 0, month: 6 }, o));
  const base = c({ salary: 35000 }), p45 = c({ salary: 35000, afterP45: true }), sc = cs({ salary: 35000 });
  const rows = SALARIES.map((sal) => { const a = c({ salary: sal }), b = c({ salary: sal, afterP45: true }), z = cs({ salary: sal }); return [m0(sal), m2(a.year), m2(a.paye), m2(b.paye), m2(z.year)]; });
  const months = [[1, "April"], [6, "September"], [10, "January"], [12, "March"]].map(([mo, nm]) => { const a = c({ salary: 35000, month: mo }); return [`Leaving in ${nm}`, m2(a.year), m2(a.paye), m2(n - a.year)]; });
  const title = site.fitTitle(`Tax on ${m0(n)} Redundancy Pay — How Much You Keep (${cfg.year})`, `Tax on ${m0(n)} Redundancy Pay (UK)`);
  const desc = n <= R.taxFreeLimit ? `${m0(n)} of redundancy or severance pay is within the ${m0(R.taxFreeLimit)} tax-free limit, so no Income Tax or National Insurance, unless part of it is notice pay or holiday pay (${cfg.year}).` : `On ${m0(n)} of redundancy pay, ${m0(R.taxFreeLimit)} is tax-free and ${m0(n - R.taxFreeLimit)} is taxed: about ${m0(base.year)} of Income Tax on a ${m0(35000)} salary, with no National Insurance (${cfg.year}).`;
  const q = [
    [`How much tax will I pay on ${m0(n)} redundancy pay?`, n <= R.taxFreeLimit ? `None, if it's all statutory redundancy pay, severance or enhanced redundancy: the first ${m0(R.taxFreeLimit)} is tax-free. Any holiday pay, unpaid wages or pay in lieu of notice in it is taxed as normal pay.` : `${m0(R.taxFreeLimit)} is tax-free and ${m0(n - R.taxFreeLimit)} is taxed. On a ${m0(35000)} salary, leaving in September with no more income that tax year, that's about ${m2(base.year)} of Income Tax (${esc(cfg.year)}), so you keep ${m2(n - base.year)}.`],
    [`How much tax is taken off ${m0(n)} redundancy pay?`, n <= R.taxFreeLimit ? "Nothing, as long as it's all within the tax-free limit." : `Paid with your final salary, PAYE takes about ${m2(base.paye)}. If it's paid after your P45, your employer uses an 0T code on a month 1 basis and about ${m2(p45.paye)} comes off. If you think you've paid too much tax, contact HMRC.`],
    [`Do I pay National Insurance on ${m0(n)} redundancy pay?`, `No: there's no employee National Insurance on redundancy or severance pay, even over ${m0(R.taxFreeLimit)}. Your employer pays Class 1A National Insurance on the part over ${m0(R.taxFreeLimit)}.`],
    [`Is ${m0(n)} redundancy pay taxed more in Scotland?`, n <= R.taxFreeLimit ? "No: the tax-free limit is the same across the UK." : `It's taxed at Scottish rates: about ${m2(sc.year)} on a ${m0(35000)} salary, leaving in September (${esc(cfg.year)}).`]
  ];
  const ld = [site.webPage(title, desc, url, R.lastChecked), site.breadcrumb([["Home", SITE + "/"], ["Redundancy Tax Calculator", u], [m0(n), url]]), site.faqLd(q)];
  const others = AMOUNTS.filter((x) => x !== n).map((x) => `<a href="${aurl(x)}">${m0(x)}</a>`).join(" ");
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="${P}">← Redundancy tax calculator</a>
      <h1 class="page-title">Tax on ${m0(n)} redundancy pay</h1>
      <p class="page-subtitle">${n <= R.taxFreeLimit ? `All of it within the <strong>${m0(R.taxFreeLimit)}</strong> tax-free limit.` : `<strong>${m0(R.taxFreeLimit)}</strong> tax-free, <strong>${m0(n - R.taxFreeLimit)}</strong> taxed: about <strong>${m0(base.year)}</strong> of tax on a ${m0(35000)} salary (${esc(cfg.year)}).`}</p>
    </header>

${tool({ statutory: 0, severance: n, weeks: 0, weekly: 700, earnings: 0, salary: 35000, month: 6 })}
    <main class="tool">
      <h2 class="tool-section-title">Tax on ${m0(n)} by salary</h2>
${site.table(["Your salary", "Tax for the year", "Taken off with final pay", "Taken off after your P45 (0T)", "Tax for the year in Scotland"], rows, 680)}      <p class="tool-hint" style="margin-top:8px;">${m0(n)} of redundancy or severance pay with no notice pay or holiday pay in it, leaving in September with no more income that tax year (${esc(cfg.year)}). The tax for the year is what you owe; PAYE can take more. If you think you've paid too much tax, contact HMRC.</p>
      <h2 class="tool-section-title" style="margin-top:18px;">When you leave makes a difference</h2>
${site.table(["", "Tax for the year", "Taken off with final pay", "You keep after the year's tax"], months, 560)}      <p class="tool-hint" style="margin-top:8px;">On a ${m0(35000)} salary. Leaving earlier in the tax year means less salary that year, so more of the payment can fall in the basic rate band.</p>
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
  <script src="/termination-pay.js"></script>
</body>
</html>
`;
}
const urls = [[P, "0.6"]];
AMOUNTS.forEach((n) => { site.write(`redundancy-tax-calculator/${n}`, amountPage(n)); urls.push([aurl(n), "0.5"]); });
site.sitemapBlock("redundancy tax pages", "tools/build-termination-pay-pages.js", urls);
console.log(`built the redundancy tax calculator (${m0(10000)} statutory + ${m0(5000)} severance + ${m0(1500)} holiday pay: ${m2(def.paye)} tax)`);
