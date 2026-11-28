#!/usr/bin/env node
/* Take-home pay for the 2027/28 UK tax year, next to this year's:

       /salary/2027-28/

       node tools/build-salary-2027-pages.js

   Runs the 2026/27 and 2027/28 UK tax files (data/tax/gb, England, Wales
   and Northern Ireland) through tax-engine.js, the salary calculator's own
   engine. The 2027/28 file is still a draft from HMRC's Budget 2026 OOTLAR
   Annex A, so the page says the figures are announced, not yet in force, and
   lists anything still provisional. The text says which figures change and
   which don't by comparing the two files, and the build stops if a
   hand-checked example no longer comes out. Runs in the monthly rebuild
   after build-tax-pages.js (it also puts a link on /salary/, which that
   builder rewrites). Once 2027/28 is the year in force, this page has done
   its job: point it at the next pair of years or retire it. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const related = require("./related.js");
const TaxEngine = require("../tax-engine.js");
const { esc, SITE } = site;

const J = (f) => JSON.parse(fs.readFileSync(path.join(site.ROOT, f), "utf8"));
const A = J("data/tax/gb/gb.2026-27.json"), B = J("data/tax/gb/gb.2027-28.json");
const YA = A.taxYear.label, YB = B.taxYear.label;
const m0 = (v) => "£" + Math.round(v).toLocaleString("en-GB");
const m2 = (v) => "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const item = (doc, id) => doc.items.find((x) => x.id === id);

/* the figures pay depends on, read from each file */
function figures(doc) {
  const pa = item(doc, "gb-personal-allowance").value, it = item(doc, "gb-income-tax").charge.brackets, ni = item(doc, "gb-ni").charge.brackets;
  const plan = (c) => c.of.max[1].sub[1];
  const sl = item(doc, "gb-student-loan").charge.cases, pg = item(doc, "gb-postgrad-loan").charge.cases.yes;
  return {
    pa: pa.taper, taper: pa.from, basic: it[1][0], addl: it[2][0], rates: it.map((b) => b[1]).join("/"),
    niPT: ni[1][0], niUEL: ni[2][0], niRates: ni.slice(1).map((b) => b[1]).join("/"),
    plan1: plan(sl.plan1), plan2: plan(sl.plan2), plan4: plan(sl.plan4), plan5: plan(sl.plan5), pg: plan(pg), slPct: sl.plan2.pct, pgPct: pg.pct
  };
}
const FA = figures(A), FB = figures(B);
[FA, FB].forEach((F) => { if (F.addl !== F.taper + 2 * F.pa) throw new Error("salary 2027/28: the additional rate no longer starts where the Personal Allowance runs out; check the text"); });
const LABELS = { pa: "Personal Allowance", taper: "Personal Allowance taper starts", basic: "Basic rate band", addl: "Additional rate from", rates: "Income tax rates",
  niPT: "National Insurance primary threshold (a year)", niUEL: "National Insurance upper earnings limit (a year)", niRates: "National Insurance rates",
  plan1: "Plan 1 student loan threshold", plan2: "Plan 2 student loan threshold", plan4: "Plan 4 student loan threshold", plan5: "Plan 5 student loan threshold", pg: "Postgraduate loan threshold" };
const isMoney = (k) => !/rates$/i.test(k), show = (k, v) => isMoney(k) ? m0(v) : v.replace(/\//g, "% / ") + "%";
const changed = Object.keys(LABELS).filter((k) => FA[k] !== FB[k]);
const provisional = (B.provisional || []).map((s) => /[.!?]$/.test(s) ? s : s + ".");
const provisionalPlans = ["plan1", "plan4"].filter((k) => provisional.some((p) => p.includes(LABELS[k].split(" ").slice(0, 2).join(" "))));

const calc = (doc, gross, o) => TaxEngine.compute([doc], gross, o || {});
/* hand-checked: £40,000 in 2027/28 is £5,486 income tax (27,430 x 20%) and £2,194.40 NI (27,430 x 8%), £32,319.60 a year;
   on Plan 5, 9% x (40,000 - 26,025) = £1,257.75, against 9% x (40,000 - 25,000) = £1,350 in 2026/27: £92.25 more take-home */
{
  const x = calc(B, 40000), p5a = calc(A, 40000, { studentLoan: "plan5" }), p5b = calc(B, 40000, { studentLoan: "plan5" });
  if (FB.pa === 12570 && FB.basic === 37700 && FB.niPT === 12570 && FB.plan5 === 26025 && FA.plan5 === 25000 &&
      (Math.round(x.net * 100) !== 3231960 || Math.round((p5b.net - p5a.net) * 100) !== 9225)) throw new Error("salary 2027/28: a hand-checked example no longer comes out");
}

const P = "/salary/2027-28/", u = SITE + P;
const SALARIES = [15000, 20000, 25000, 30000, 35000, 40000, 45000, 50000, 60000, 75000, 100000, 125000, 150000];
const rows = SALARIES.map((s) => { const a = calc(A, s), b = calc(B, s), d = b.net - a.net; return [m0(s), m2(a.net), m2(b.net), m2(b.net / 12), Math.abs(d) < 0.005 ? "Same" : (d > 0 ? "+" : "−") + m2(Math.abs(d))]; });
const P5 = [25000, 27000, 30000, 35000, 40000, 50000, 60000];
const p5rows = P5.map((s) => { const a = calc(A, s, { studentLoan: "plan5" }), b = calc(B, s, { studentLoan: "plan5" }); const la = a.byGroup.loan || 0, lb = b.byGroup.loan || 0; return [m0(s), m2(la), m2(lb), la - lb > 0.004 ? "+" + m2(la - lb) : "—", la - lb > 0.004 ? "+" + m2((la - lb) / 12) : "—"]; });
const figRows = Object.keys(LABELS).map((k) => { const ch = FA[k] !== FB[k], v = show(k, FB[k]) + (provisionalPlans.includes(k) ? " (not yet announced: this year's figure)" : ""); return [LABELS[k], show(k, FA[k]), ch ? `<strong>${esc(v)}</strong>` : esc(v)]; });
const ex = calc(B, 35000), exP5 = { a: calc(A, 40000, { studentLoan: "plan5" }), b: calc(B, 40000, { studentLoan: "plan5" }) };
const exP5diff = exP5.b.net - exP5.a.net;
const changeText = changed.length ? changed.map((k) => `the ${LABELS[k]} (${show(k, FA[k])} to ${show(k, FB[k])})`).join(", ") : "nothing";
const SRC = [B.sources[0], B.sources[1]].map((s) => `<a href="${s.url}" rel="nofollow noopener" target="_blank">${esc(s.title)}</a>`).join(" and ");
const RULES = { a: A, b: B };

const tool = `    <main class="tool split" id="s27-tool" data-rules="${esc(JSON.stringify(RULES))}">
      <div class="field"><label for="s27-salary">Salary a year, before tax</label><input type="number" id="s27-salary" value="35000" min="0" step="any" inputmode="decimal"></div>
      <div class="field-row">
        <div class="field"><label for="s27-loan">Student loan</label><select id="s27-loan"><option value="none">None</option><option value="plan1">Plan 1</option><option value="plan2">Plan 2</option><option value="plan4">Plan 4 (Scotland)</option><option value="plan5">Plan 5</option></select></div>
        <div class="field"><label style="margin-top:26px;"><input type="checkbox" id="s27-pg" style="width:auto; margin-right:8px;">Postgraduate loan</label></div>
      </div>
      <p class="tool-hint" id="s27-error" role="alert" style="color: var(--bad); display: none;"></p>
      <p class="tool-hint" style="margin:6px 0 0;">England, Wales and Northern Ireland, one job, no pension. ${esc(YB)} figures are from the Budget and start on 6 April 2027. For pensions, salary sacrifice and other options, use the <a href="/salary/">salary calculator</a>.</p>
      <div class="result-box split-aside" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="s27-net">${m2(ex.net)}</div>
          <div class="label">take-home pay in ${esc(YB)}</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row"><span class="r-label">A month</span><span class="r-value" id="s27-month">${m2(ex.net / 12)}</span></div>
          <div class="result-row highlight"><span class="r-label">Change from ${esc(YA)}</span><span class="r-value" id="s27-diff">£0.00 a year</span></div>
        </div>
        <table class="out-table" style="margin-top:10px; width:100%;"><thead><tr><th></th><th>${esc(YA)}</th><th>${esc(YB)}</th></tr></thead><tbody>
          <tr><td>Income tax</td><td id="s27-tax-a">—</td><td id="s27-tax-b">—</td></tr>
          <tr><td>National Insurance</td><td id="s27-ni-a">—</td><td id="s27-ni-b">—</td></tr>
          <tr><td>Student loans</td><td id="s27-loan-a">—</td><td id="s27-loan-b">—</td></tr>
          <tr><td>Take-home</td><td id="s27-net-a">—</td><td id="s27-net-b">—</td></tr>
        </tbody></table>
        <p class="tool-hint" id="s27-note" style="margin:10px 0 0;"></p>
      </div>
    </main>
`;
const body = `    <main class="tool">
      <h2 class="tool-section-title">Take-home pay in ${esc(YB)} by salary</h2>
${site.table(["Salary", YA, YB, `${YB} a month`, "Change"], rows, 600)}      <p class="tool-hint" style="margin-top:8px;">Income tax and employee National Insurance, England, Wales and Northern Ireland, no student loan or pension.</p>
      <h2 class="tool-section-title" style="margin-top:18px;">What changes on 6 April 2027</h2>
      <p class="about-text">For pay, the Budget changed ${esc(changeText)}. ${changed.length === 1 ? "Everything else" : "The rest"} stays as it is: the Personal Allowance of ${m0(FB.pa)}, the ${m0(FB.basic)} basic rate band, the additional rate from ${m0(FB.addl)}, and the National Insurance thresholds (${m0(FB.niPT)} and ${m0(FB.niUEL)} a year) and rates (${FB.niRates.replace("/", "% and ")}%). So unless you're on a Plan 5 student loan, you'll take home the same from the same salary, and with the thresholds frozen a pay rise is taxed as it would be now.</p>
${site.table(["", YA, YB], figRows, 600)}${provisional.length ? `      <p class="tool-hint" style="margin-top:8px;">${provisional.map(esc).join(" ")}</p>\n` : ""}      <h2 class="tool-section-title" style="margin-top:18px;">Plan 5 student loans</h2>
      <p class="about-text">Plan 5 repayments are ${FB.slPct}% of what you earn over the threshold, which rises from ${m0(FA.plan5)} to ${m0(FB.plan5)}. That's ${m2((FB.plan5 - FA.plan5) * FB.slPct / 100)} a year less to repay for anyone earning over ${m0(FB.plan5)}: on ${m0(40000)}, ${m2(exP5.b.byGroup.loan)} instead of ${m2(exP5.a.byGroup.loan)}, so ${m2(exP5diff)} more take-home.</p>
${site.table(["Salary", `Repaid in ${YA}`, `Repaid in ${YB}`, "Extra take-home a year", "A month"], p5rows, 600)}      <p class="about-text" style="margin-top:14px;"><strong>Scotland</strong> sets its own income tax rates and bands, and its ${esc(YB)} rates haven't been published yet, so this page covers England, Wales and Northern Ireland. National Insurance is the same across the UK.</p>
    </main>
`;
const q = [
  [`Will my take-home pay change in ${YB}?`, `Not unless you have a Plan 5 student loan. The Personal Allowance (${m0(FB.pa)}), income tax bands and National Insurance thresholds stay the same from 6 April 2027, so the same salary takes home the same. On ${m0(35000)} that's ${m2(ex.net)} a year in England, Wales and Northern Ireland.`],
  [`What is the Personal Allowance for ${YB}?`, `${m0(FB.pa)}, the same as ${YA}. It's reduced by £1 for every £2 of income over ${m0(FB.taper)}.`],
  [`What are the income tax bands for ${YB}?`, `20% on the first ${m0(FB.basic)} above the Personal Allowance, 40% above that and 45% over ${m0(FB.addl)}: the same as ${YA} (England, Wales and Northern Ireland).`],
  [`What is the Plan 5 student loan threshold for ${YB}?`, `${m0(FB.plan5)}, up from ${m0(FA.plan5)}. On ${m0(40000)} that's ${m2(exP5diff)} a year less to repay.`],
  [`Are the ${YB} figures final?`, `They're the rates announced at the Budget, for the tax year starting 6 April 2027.${provisional.length ? " " + provisional.join(" ") : ""}`]
];
const title = site.fitTitle(`Take-Home Pay ${YB} — UK Salary After Tax From April 2027`, `Take-Home Pay ${YB} Calculator`);
const desc = `Work out your ${YB} take-home pay and compare it with ${YA}: the Personal Allowance, tax bands and NI thresholds stay frozen, and the Plan 5 student loan threshold rises to ${m0(FB.plan5)}.`;
const app = { "@context": "https://schema.org", "@type": "WebApplication", name: `Take-Home Pay ${YB} Calculator`, url: u, applicationCategory: "FinanceApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } };
const html = site.head({ title, desc, url: u, ld: [site.webPage(title, desc, u, B.lastChecked), site.breadcrumb([["Home", SITE + "/"], ["Salary After Tax", SITE + "/salary/"], [`${YB}`, u]]), app, site.faqLd(q)] }) + `    <header class="site-header">
      <a class="back-link" href="/salary/">← Salary calculator</a>
      <h1 class="page-title">Take-home pay ${esc(YB)}</h1>
      <p class="page-subtitle">Your pay after tax from 6 April 2027, next to this year's.</p>
    </header>

${tool}
${body}
    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}      <p class="tool-hint" style="margin-top:12px;">A guide, not advice. ${esc(YB)} figures from ${SRC}, in the site's ${esc(YB)} UK tax file; ${esc(YA)} from the tax file in force. Worked out with the same engine as the <a href="/salary/">salary calculator</a>. The ${esc(YB)} file was last checked ${site.niceDate(B.lastChecked)}.</p>
    </main>

${related.block("/salary/")}
${site.FOOTER}
  </div>
  <script src="/tax-engine.js"></script>
  <script src="/salary-2027.js"></script>
</body>
</html>
`;
site.write("salary/2027-28", html);
site.hubBlock("/salary/", "next tax year link", "tools/build-salary-2027-pages.js", `    <p class="guide-callout"><a href="${P}">Take-home pay ${esc(YB)}</a>: your pay after tax from 6 April 2027, next to this year's${changed.length ? ` (only the ${esc(changed.map((k) => LABELS[k]).join(", "))} changes)` : ""}.</p>
`);
site.sitemapBlock("salary 2027-28 page", "tools/build-salary-2027-pages.js", [[P, "0.6"]]);
console.log(`built the ${YB} take-home pay page (${m0(35000)}: ${m2(ex.net)}; changes: ${changed.join(", ") || "none"})`);
