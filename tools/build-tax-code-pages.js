#!/usr/bin/env node
/* The UK tax code checker, and a page for each common code:

       /tax-code-checker/            type any code (1257L, S1257L, K475, BR, 1257L M1…)
       /tax-code-checker/1257l/      what one code means, and the tax on it at typical pay

       node tools/build-tax-code-pages.js

   Meanings are GOV.UK's wording (data/uk/tax-codes.json); the bands and
   rates come from the UK and Scottish tax files in force, and the Marriage
   Allowance transfer from data/uk/marriage-allowance.json. The pages are
   built from the same functions the checker runs (tax-code.js), and the
   build stops unless GOV.UK's K475 example gives £31,750 of taxable pay.
   Runs in the monthly rebuild. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const related = require("./related.js");
const registry = require("./tax/registry.js");
const TC = require("../tax-code.js");
const { esc, SITE } = site;

const J = (f) => JSON.parse(fs.readFileSync(path.join(site.ROOT, f), "utf8"));
const D = J("data/uk/tax-codes.json"), MA = J("data/uk/marriage-allowance.json");
const cur = registry.currentFiles(registry.readAll());
const bandsOf = (doc) => doc.items.find((i) => i.id === "gb-income-tax").charge.brackets;
const ruk = bandsOf(cur.gb.doc), sct = bandsOf(cur["gb-sct"].doc);
const pa = cur.gb.doc.items.find((i) => i.id === "gb-personal-allowance").value.taper;
const rate = (b, name) => { const x = b.find((r) => r[2] === name); if (!x) throw new Error("tax codes: no " + name + " band"); return x[1]; };
const R = {
  letters: D.letters, kCap: D.kCap, personalAllowance: pa, transfer: MA.transfer, year: cur.gb.doc.taxYear.label,
  bands: { ruk: ruk.map((r) => [r[0], r[1]]), sct: sct.map((r) => [r[0], r[1]]) },
  flat: { BR: rate(ruk, "Basic rate"), D0: rate(ruk, "Higher rate"), D1: rate(ruk, "Additional rate"),
    CBR: rate(ruk, "Basic rate"), CD0: rate(ruk, "Higher rate"), CD1: rate(ruk, "Additional rate"),
    SBR: rate(sct, "Basic rate"), SD0: rate(sct, "Intermediate rate"), SD1: rate(sct, "Higher rate"), SD2: rate(sct, "Advanced rate"), SD3: rate(sct, "Top rate") }
};
/* GOV.UK's examples */
const k = TC.parse("K475"), kt = TC.annualTax(R, k, 27000);
if (kt.taxable !== 31750) throw new Error("tax codes: GOV.UK's K475 example should give £31,750 taxable");
if (TC.parse("1257L").allowance !== 12570 || !TC.parse("1257L W1").emergency || !TC.parse("S875L M1") || !TC.parse("C663L X")) throw new Error("tax codes: GOV.UK's example codes don't parse");
if (TC.parse("1100L").allowance !== 11000) throw new Error("tax codes: GOV.UK's 1100L example");

const m0 = (v) => "£" + Math.round(v).toLocaleString("en-GB");
const m2 = (v) => "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const CFG = esc(JSON.stringify(R));
const SRC = D.sources.map((s) => `<a href="${s.url}" rel="nofollow noopener" target="_blank">${esc(s.title)}</a>`).join(", ");
const BASE = "/tax-code-checker/";

/* the common codes, each with a page */
const CODES = [
  ["1257L", "1257l", "The standard tax code for one job or pension"],
  ["1257L M1", "1257l-emergency", "Emergency tax codes: W1, M1 and X"],
  ["BR", "br", "All income taxed at the basic rate"],
  ["0T", "0t", "No tax-free allowance on this income"],
  ["D0", "d0", "All income taxed at the higher rate"],
  ["D1", "d1", "All income taxed at the additional rate"],
  ["NT", "nt", "No tax taken"],
  [`${(pa + MA.transfer) / 10}M`, `${(pa + MA.transfer) / 10}m`, "Receiving Marriage Allowance"],
  [`${(pa - MA.transfer) / 10}N`, `${(pa - MA.transfer) / 10}n`, "Transferring Marriage Allowance"],
  ["K475", "k-codes", "K codes: more untaxed income than allowance"],
  ["S1257L", "s1257l", "The standard code in Scotland"],
  ["SBR", "sbr", "Scotland: all income at the basic rate"],
  ["SD0", "sd0", "Scotland: all income at the intermediate rate"],
  ["SD1", "sd1", "Scotland: all income at the higher rate"],
  ["SD2", "sd2", "Scotland: all income at the advanced rate"],
  ["SD3", "sd3", "Scotland: all income at the top rate"],
  ["S0T", "s0t", "Scotland: no tax-free allowance"],
  ["C1257L", "c1257l", "The standard code in Wales"],
  ["CBR", "cbr", "Wales: all income at the basic rate"],
  ["C0T", "c0t", "Wales: no tax-free allowance"]
];
const url = (slug) => `${BASE}${slug}/`;

function toolHtml(code, pay) {
  return `    <main class="tool split" id="tc-tool" data-rules="${CFG}">
      <div class="field-row">
        <div class="field"><label for="tc-code">Your tax code</label><input type="text" id="tc-code" value="${esc(code)}" autocomplete="off" autocapitalize="characters" spellcheck="false"></div>
        <div class="field"><label for="tc-pay">Yearly pay from this job or pension</label><input type="number" id="tc-pay" value="${pay}" min="0" step="any" inputmode="decimal"></div>
      </div>
      <p class="tool-hint" style="margin:6px 0 0;">On your payslip, P45, P60, the HMRC app or a tax code notice. Type it with any letters and spaces as shown.</p>
      <p class="tool-hint" id="tc-error" role="alert" style="color: var(--bad); display: none;"></p>
      <ul class="about-list" id="tc-lines" aria-live="polite" style="margin-top:12px;"></ul>
      <div class="result-box split-aside" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="tc-tax">—</div>
          <div class="label" id="tc-label">Income Tax a year</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row"><span class="r-label">Tax-free from this job</span><span class="r-value" id="tc-free">—</span></div>
          <div class="result-row highlight"><span class="r-label">About a month</span><span class="r-value" id="tc-month">—</span></div>
        </div>
        <p class="tool-hint" style="margin:10px 0 0;">${esc(R.year)} rates, if you're paid the same every month for the whole tax year. National Insurance and student loans aren't included: the <a href="/salary/">salary calculator</a> has the full take-home.</p>
      </div>
    </main>
`;
}
const shell = (o) => site.head({ title: o.title, desc: o.desc, url: SITE + o.path, ld: o.ld }) + `    <header class="site-header">
      <a class="back-link" href="${o.back[0]}">← ${esc(o.back[1])}</a>
      <h1 class="page-title">${esc(o.h1)}</h1>
      <p class="page-subtitle">${o.sub}</p>
    </header>

${o.body}
    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(o.q)}      <p class="tool-hint" style="margin-top:12px;">A guide, not advice. Meanings from ${SRC}; ${esc(R.year)} rates and bands from the UK and Scottish tax files. Last checked ${site.niceDate(D.lastChecked)}.</p>
    </main>

${o.foot || ""}${site.FOOTER}
  </div>
  <script src="/tax-code.js"></script>
</body>
</html>
`;

const PAYS = [15000, 20000, 25000, 30000, 40000, 50000, 60000, 80000];
function codePage([code, slug, short]) {
  const p = TC.parse(code), path0 = url(slug);
  const isEm = slug === "1257l-emergency", isK = slug === "k-codes";
  const lines = TC.explain(R, p);
  const rows = PAYS.map((pay) => { const t = TC.annualTax(R, p, pay); return [m0(pay), m0(t.tax) + (t.capped ? "*" : ""), m2(t.tax / 12)]; });
  const name = isEm ? "1257L W1, M1 and X" : isK ? "K codes (K475 and others)" : code;
  const h1 = isEm ? "Emergency tax codes: 1257L W1, M1 and X" : isK ? "K tax codes: what a K in your tax code means" : `Tax code ${code}: what it means`;
  const t30 = TC.annualTax(R, p, 30000);
  const q = [
    [`What does tax code ${isEm ? "1257L M1" : isK ? "K475" : code} mean?`, lines.join(" ")],
    [`How much tax will I pay on ${m0(30000)} with ${isEm ? "an emergency code" : isK ? "tax code K475" : "tax code " + code}?`, `About ${m0(t30.tax)} a year (${m2(t30.tax / 12)} a month) in Income Tax at ${R.year} rates${isEm ? ", if you're paid the same each month: on an emergency code each payday is taxed on its own, so a pay that varies can mean paying too much or too little" : ""}${t30.capped ? ", the most a K code can take being half your pay" : ""}. National Insurance comes on top.`]
  ];
  if (isEm) q.push(["How do I get off an emergency tax code?", "Give your new employer your P45 from your last job (ask your old employer for one if you didn't get it). HMRC usually updates your code once it has the details from both employers, which can take up to 35 days from when you start. If you've paid too much, the refund normally comes through your pay."]);
  if (isK) q.push(["Why do I have a K tax code?", `Because things HMRC needs to tax through your pay add up to more than your Personal Allowance: company benefits such as a car, the State Pension, taxable benefits, savings interest over your allowance, or tax owed from an earlier year. The number times 10 is added to your taxable pay: K475 adds ${m0(4750)}.`]);
  if (p.kind === "flat") q.push([`Is ${code} the right code for my main job?`, `Usually not. ${code} is meant for a second job or pension, with your tax-free allowance used against your main one. If it's on your only or main job, you're probably paying too much: check your details with HMRC online or in the HMRC app.`]);
  if (p.kind === "allowance" && p.letter === "L" && p.region === "ruk") q.push(["Is 1257L an emergency tax code?", "Not on its own. It's only an emergency code if it's followed by W1, M1 or X (or your payslip says NONCUM)."]);
  const title = site.fitTitle(`${isEm ? "Emergency Tax Code 1257L W1 / M1 / X" : isK ? "K Tax Code Meaning (K475 and Others)" : "Tax Code " + code + " Meaning"} — What It Means and the Tax You'll Pay`, `${isEm ? "1257L W1 / M1 Emergency Tax Code" : isK ? "K Tax Codes Explained" : "Tax Code " + code + " Explained"}`);
  const desc = `${short}. What ${isEm ? "an emergency tax code" : isK ? "a K tax code" : "tax code " + code} means, in GOV.UK's words, and the Income Tax it takes at ${m0(20000)} to ${m0(80000)} a year.`;
  const ld = [site.webPage(title, desc, SITE + path0, D.lastChecked), site.breadcrumb([["Home", SITE + "/"], ["Tax Code Checker", SITE + BASE], [name, SITE + path0]]), site.faqLd(q)];
  const others = CODES.filter((c) => c[1] !== slug).map(([c, s]) => `<a href="${url(s)}">${esc(s === "1257l-emergency" ? "1257L W1 / M1" : s === "k-codes" ? "K codes" : c)}</a>`).join(" ");
  const body = toolHtml(isEm ? "1257L M1" : code, 30000) + `
    <main class="tool">
      <h2 class="tool-section-title">${esc(isEm ? "What W1, M1 and X mean" : isK ? "How K codes work" : "What " + code + " means")}</h2>
      <ul class="about-list">${lines.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
      <h2 class="tool-section-title" style="margin-top:18px;">Income Tax on ${esc(isEm ? "1257L M1" : code)} in ${esc(R.year)}</h2>
${site.table(["Yearly pay", "Tax a year", "A month"], rows, 340)}      <p class="tool-hint" style="margin-top:12px;">If you're paid the same every month for the whole year, through this one job or pension.${rows.some((r) => r[1].endsWith("*")) ? " * The most a K code can take each payday is half your pay." : ""}</p>
    </main>
`;
  return shell({ path: path0, title, desc, ld, q, h1, sub: `${esc(short)}. Type your own code and pay into the checker to see what it means for you.`, back: [BASE, "Tax code checker"],
    body, foot: `    <div class="hub-group-title" style="margin-top:28px;">Other tax codes</div>\n    <p class="salary-links">${others}</p>\n\n` });
}

function checkerPage() {
  const q = [
    ["What is the most common UK tax code?", `${D.standard}, for people with one job or pension and no untaxed income, unpaid tax or taxable benefits. It means you can earn ${m0(pa)} tax-free in the tax year.`],
    ["What do the numbers in my tax code mean?", `Multiply them by 10 for the income you can earn tax-free from that job or pension: 1257L means ${m0(12570)}, 1100L means ${m0(11000)}. A K code works the other way: K475 adds ${m0(4750)} to your taxable pay.`],
    ["What do the letters in my tax code mean?", `L is the standard allowance; M and N mean you've received or transferred Marriage Allowance; T means other calculations; K means untaxed income bigger than your allowance; BR, D0 and D1 tax everything at one rate (usually a second job); 0T gives no allowance; NT means no tax. S at the start means Scottish rates and C means Welsh rates.`],
    ["How do I know if I'm on an emergency tax code?", "If your code ends in W1, M1 or X (or your payslip shows NONCUM). 1257L on its own isn't an emergency code."],
    ["What should I do if my tax code is wrong?", "Check and update your details (jobs, benefits, expenses, estimated income) with HMRC online or in the HMRC app. HMRC then sends you and your employer a new code within 15 working days, and any tax you've overpaid is usually refunded through your pay."]
  ];
  const title = site.fitTitle("Tax Code Checker — What Your UK Tax Code Means (1257L, BR, 0T, K, M1)", "UK Tax Code Checker — What Your Code Means");
  const desc = `Type your UK tax code to see what it means and how much Income Tax it takes: 1257L, S and C codes, BR, D0, 0T, K codes, Marriage Allowance M and N, and emergency W1, M1 and X.`;
  const ld = [site.webPage(title, desc, SITE + BASE, D.lastChecked), site.breadcrumb([["Home", SITE + "/"], ["Personal Finance", SITE + "/personal-finance/"], ["Tax Code Checker", SITE + BASE]]),
    { "@context": "https://schema.org", "@type": "WebApplication", name: "Tax Code Checker", url: SITE + BASE, applicationCategory: "FinanceApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } }, site.faqLd(q)];
  const body = toolHtml(D.standard, 30000) + `
    <main class="tool">
      <h2 class="tool-section-title">Common tax codes</h2>
${site.table(["Code", "What it means"], CODES.map(([c, s, short]) => [`<a href="${url(s)}">${esc(s === "1257l-emergency" ? "1257L W1 / M1 / X" : s === "k-codes" ? "K codes" : c)}</a>`, esc(short)]), 380)}      <p class="about-text" style="margin-top:14px;">A tax code tells your employer or pension provider how much tax-free income to give you from that job or pension. The numbers, times 10, are the tax-free amount; the letters describe your situation. You get a separate code for each job or pension, so a second job is often on BR, with your allowance used on your main one.</p>
    </main>
`;
  return shell({ path: BASE, title, desc, ld, q, h1: "Tax code checker", sub: `What your UK tax code means and how much Income Tax it takes, in HMRC's own words.`, back: ["/personal-finance/", "Personal finance calculators"], body, foot: related.block(BASE) + "\n" });
}

const urls = [[BASE, "0.6"]];
site.write("tax-code-checker", checkerPage());
CODES.forEach((c) => { site.write(`tax-code-checker/${c[1]}`, codePage(c)); urls.push([url(c[1]), "0.5"]); });
site.prune("tax-code-checker", /^[a-z0-9-]+$/);
site.sitemapBlock("tax code pages", "tools/build-tax-code-pages.js", urls);
console.log(`built the tax code checker and ${CODES.length} code pages (${R.year}; K475 on £27,000 = £${kt.taxable.toLocaleString("en-GB")} taxable)`);
