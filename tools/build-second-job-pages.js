#!/usr/bin/env node
/* The second job tax calculator:

       /second-job-tax-calculator/

       node tools/build-second-job-pages.js

   The tax PAYE takes from each job on its own code (1257L, BR, D0, a split
   allowance...) against the tax due on both together, and the National
   Insurance each job takes separately. Uses the tax code checker's rules
   (tools/lib/tax-code-rules.js), the UK tax file's National Insurance
   thresholds, and GOV.UK's guidance quoted in data/uk/second-job.json.
   The build stops unless both of GOV.UK's worked examples come out exactly
   (£22,000 plus £1,800 on BR: £360; £8,000 and £7,000 with the allowance
   split: £486). Runs in the monthly rebuild. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const related = require("./related.js");
const registry = require("./tax/registry.js");
const SJ = require("../second-job.js");
const { R } = require("./lib/tax-code-rules.js")();
const { esc, SITE } = site;

const G = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/uk/second-job.json"), "utf8"));
const gb = registry.currentFiles(registry.readAll()).gb.doc;
const br = gb.items.find((i) => i.id === "gb-ni").charge.brackets;
const N = { pt: br[1][0], uel: br[2][0], main: br[1][1], upper: br[2][1], deferMain: G.deferWeekly.main * 52, deferOther: G.deferWeekly.other * 52 };
if (Math.round(N.uel / 52) !== G.deferWeekly.main || Math.round(N.pt / 52) !== G.deferWeekly.other) throw new Error("second job: GOV.UK's deferment thresholds no longer match the weekly NI thresholds — re-check data/uk/second-job.json");
const m0 = (v) => "£" + Math.round(v).toLocaleString("en-GB");
const m2 = (v) => "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* GOV.UK's two worked examples */
const gov1 = SJ.calc(R, N, 22000, "1257L", 1800, "BR", false);
if (gov1.tax1 !== 1886 || gov1.tax2 !== 360 || gov1.due !== 2246) throw new Error("second job: GOV.UK's £22,000 + £1,800 example doesn't come out at £1,886 + £360");
const govS = SJ.suggest(R, 8000, 7000, false), gov2 = SJ.calc(R, N, 8000, govS.code1, 7000, govS.code2, false);
if (!govS.split || gov2.tax1 !== 0 || gov2.tax2 !== 486 || gov2.due !== 486) throw new Error("second job: GOV.UK's split allowance example doesn't come out at £486");
const gov2BR = SJ.calc(R, N, 8000, "1257L", 7000, "BR", false);

const ex = { pay1: 28000, pay2: 8000 }; ex.r = SJ.calc(R, N, ex.pay1, "1257L", ex.pay2, "BR", false);
const rows = [[20000, 6000], [28000, 8000], [35000, 10000], [55000, 8000], [70000, 15000], [130000, 10000]].map(([a, b]) => {
  const sg = SJ.suggest(R, a, b, false); if (!sg.code2) throw new Error("second job: table row " + a + " + " + b + " spans two bands"); const c = sg.code2, r = SJ.calc(R, N, a, "1257L", b, c, false);
  return [m0(a), m0(b), c, m2(r.tax2), m2(r.ni2), m2(r.net2)];
});
const sct = [[20000, 3000], [35000, 5000], [50000, 10000]].map(([a, b]) => {
  const sg = SJ.suggest(R, a, b, true); if (!sg.code2) throw new Error("second job: Scottish row " + a + " + " + b + " spans two bands"); const c = sg.code2, r = SJ.calc(R, N, a, "S1257L", b, c, true);
  return [m0(a), m0(b), c, m2(r.tax2), m2(r.ni2), m2(r.net2)];
});
const codes = [["BR", R.flat.BR, "Basic rate"], ["D0", R.flat.D0, "Higher rate"], ["D1", R.flat.D1, "Additional rate"], ["SBR", R.flat.SBR, "Scottish basic rate"], ["SD0", R.flat.SD0, "Scottish intermediate rate"], ["SD1", R.flat.SD1, "Scottish higher rate"], ["SD2", R.flat.SD2, "Scottish advanced rate"], ["SD3", R.flat.SD3, "Scottish top rate"]]
  .map(([c, r, n]) => [`<a href="/tax-code-checker/?code=${c}">${c}</a>`, `${r}%`, n]);
const niEx = SJ.calc(R, N, 60000, "1257L", 30000, "D0", false);
if (!(niEx.ni1 + niEx.ni2 > niEx.niOne)) throw new Error("second job: the National Insurance example should cost more as two jobs");

const P = "/second-job-tax-calculator/", url = SITE + P;
const SRC = G.sources.map((s) => `<a href="${s.url}" rel="nofollow noopener" target="_blank">${esc(s.title)}</a>`).join(", ");
const tool = `    <main class="tool split" id="sj-tool" data-rules="${esc(JSON.stringify(R))}" data-ni="${esc(JSON.stringify(N))}">
      <div class="field-row">
        <div class="field"><label for="sj-pay1">Main job pay (a year, before tax)</label><input type="number" id="sj-pay1" value="${ex.pay1}" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="sj-code1">Main job tax code</label><input type="text" id="sj-code1" value="1257L" autocomplete="off" spellcheck="false"></div>
      </div>
      <div class="field-row">
        <div class="field"><label for="sj-pay2">Second job pay (a year, before tax)</label><input type="number" id="sj-pay2" value="${ex.pay2}" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="sj-code2">Second job tax code</label><input type="text" id="sj-code2" value="BR" autocomplete="off" spellcheck="false"></div>
      </div>
      <div class="field-row">
        <div class="field"><label for="sj-region">Where you pay tax</label><select id="sj-region"><option value="ruk">England, Wales or Northern Ireland</option><option value="scotland">Scotland</option></select></div>
      </div>
      <p class="tool-hint" id="sj-err" role="alert" style="color: var(--bad); display: none;"></p>
      <p class="tool-hint" id="sj-suggest" style="margin:6px 0 0; display:none;"><span id="sj-suggest-text"></span> <button type="button" class="btn btn-ghost btn-example" id="sj-use">Use these codes</button></p>
      <p class="tool-hint" style="margin:6px 0 0;">Your codes are on your payslips, P60 or in the HMRC app. Paid the same every payday; no student loan or pension.</p>
      <div class="result-box split-aside" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="sj-net2">${m2(ex.r.net2)}</div>
          <div class="label" id="sj-label">a year from your second job after tax and National Insurance (${m2(ex.r.net2 / 12)} a month)</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row"><span class="r-label">Tax on the second job</span><span class="r-value" id="sj-tax2">${m2(ex.r.tax2)}</span></div>
          <div class="result-row"><span class="r-label">National Insurance on it</span><span class="r-value" id="sj-ni2">${m2(ex.r.ni2)}</span></div>
          <div class="result-row"><span class="r-label">Main job after tax and NI</span><span class="r-value" id="sj-net1">${m2(ex.r.net1)}</span></div>
          <div class="result-row"><span class="r-label">Tax due on both jobs</span><span class="r-value" id="sj-due">${m2(ex.r.due)}</span></div>
          <div class="result-row highlight"><span class="r-label">Tax PAYE takes</span><span class="r-value" id="sj-taken">${m2(ex.r.tax1 + ex.r.tax2)}</span></div>
        </div>
        <p class="tool-hint" id="sj-year" style="margin:10px 0 0;"></p>
        <p class="tool-hint" id="sj-ninote" style="margin:6px 0 0;"></p>
      </div>
    </main>
`;

const body = `    <main class="tool">
      <h2 class="tool-section-title">How tax works with a second job</h2>
      <p class="about-text">You get one Personal Allowance (${m0(R.personalAllowance)}) however many jobs you have, and it usually goes to the job that pays the most. That job's code is usually ${R.personalAllowance / 10}L; the second job gets a code with no allowance, so every pound of it is taxed. GOV.UK lists the usual second job codes as <strong>BR</strong> (all of it at 20%), <strong>D0</strong> (40%) and <strong>D1</strong> (45%), chosen by your total income from all your jobs. There's no extra tax for having two jobs: the code just makes sure the allowance isn't used twice.</p>
${site.table(["Code", "Rate", "Used when the second job is taxed at"], codes, 440)}      <p class="about-text" style="margin-top:14px;">GOV.UK's example: a permanent job paying £22,000 and seasonal work paying £1,800. The main job uses the allowance, so it takes ${m0(gov1.tax1)}; the seasonal employer uses BR and takes 20% of the whole £1,800, ${m0(gov1.tax2)}. That's ${m0(gov1.due)}, exactly the tax due on £23,800.</p>
${site.table(["Main job", "Second job", "Usual code", "Tax on it", "NI on it", "Second job after tax"], rows, 560)}      <p class="tool-hint" style="margin-top:8px;">${esc(R.year)}, England, Wales and Northern Ireland, main job on 1257L.</p>
      <h2 class="tool-section-title" style="margin-top:18px;">When your main job pays less than the allowance</h2>
      <p class="about-text">If your main job pays less than ${m0(R.personalAllowance)}, the rest of the allowance can be moved to the second job: contact HMRC to ask. In GOV.UK's example, jobs paying £8,000 and £7,000 leave ${m0(R.personalAllowance - 8000)} of allowance for job 2, so only £2,430 of it is taxed: <strong>${m0(gov2.due)}</strong> for the year (codes of about ${govS.code1} and ${govS.code2}). Left on BR, job 2 would have ${m2(gov2BR.tax2)} taken and you'd wait until after 5 April for ${m2(-gov2BR.diff)} back. Each job's allowance is spread evenly over the year, so if your pay jumps around you can still pay some tax in a busy week or month.</p>
      <h2 class="tool-section-title" style="margin-top:18px;">National Insurance on two jobs</h2>
      <p class="about-text">National Insurance is worked out on each job separately: each employer takes ${N.main}% of your pay over ${m0(N.pt / 52)} a week from that job, and ${N.upper}% over ${m0(N.uel / 52)}. With two smaller jobs you can pay less than with one job paying the same, because each has its own threshold; if your main job already pays over ${m0(N.uel / 52)} a week, the second job's pay over ${m0(N.pt / 52)} a week is charged ${N.main}% where one bigger job would pay ${N.upper}% on it, so a larger second job can cost more. Jobs paying ${m0(60000)} and ${m0(30000)} take ${m2(niEx.ni1 + niEx.ni2)} in National Insurance, against ${m2(niEx.niOne)} for one job paying ${m0(90000)}. If you earn at least £${G.deferWeekly.main} a week from one job and £${G.deferWeekly.other} from the other, GOV.UK says you may be able to <strong>defer</strong> National Insurance on the second job and pay 2% on its earnings between £${G.deferWeekly.other} and £${G.deferWeekly.main} a week instead.</p>
      <h2 class="tool-section-title" style="margin-top:18px;">In Scotland</h2>
      <p class="about-text">Scottish codes start with S, and the flat-rate codes follow Scotland's bands: SBR is 20%, SD0 the ${R.flat.SD0}% intermediate rate, SD1 ${R.flat.SD1}%, SD2 ${R.flat.SD2}% and SD3 ${R.flat.SD3}%.</p>
${site.table(["Main job", "Second job", "Usual code", "Tax on it", "NI on it", "Second job after tax"], sct, 560)}      <h2 class="tool-section-title" style="margin-top:18px;">Starting a second job</h2>
      <p class="about-text">You won't have a P45 because you're still in your first job, so fill in the new employer's <strong>starter checklist</strong> and say you already have another job; that gets you the right code from your first payday. Check both jobs and their codes in the HMRC app or your personal tax account, and if a code looks wrong the <a href="/tax-code-checker/">tax code checker</a> explains it. HMRC checks your tax across all your jobs after 5 April and sends a P800 if you paid the wrong amount: the <a href="/tax-refund-calculator/">tax refund calculator</a> estimates it.</p>
    </main>
`;

const q = [
  ["How much tax will I pay on a second job?", `Usually 20% of all of it (code BR) if your total income is in the basic rate band, 40% (D0) in the higher rate band, or 45% (D1) above ${m0(125140)}, because your Personal Allowance is used by your main job. With ${m0(ex.pay1)} and ${m0(ex.pay2)}, the second job takes ${m2(ex.r.tax2)} in tax and ${m2(ex.r.ni2)} in National Insurance.`],
  ["Why is my second job taxed so much?", "Because your tax-free allowance is used by your main job, so the second job has none and every pound is taxed. If it's on an emergency code or the wrong flat-rate code it can take more than you owe; over the year you should pay the same tax as on one job paying both amounts."],
  ["Do I pay more tax with two jobs?", "No. Income Tax depends on your total income, so two jobs paying £25,000 and £10,000 cost the same tax as one job paying £35,000. National Insurance is different: it's worked out per job, so two jobs can cost less (or, if your main job is over the upper earnings limit, more) than one."],
  ["What tax code should my second job have?", "Usually BR, D0 or D1, depending on your total income from all your jobs (SBR, SD0 to SD3 in Scotland). If your main job pays less than the Personal Allowance, HMRC can split the allowance and give the second job a code ending in L."],
  ["Do I pay National Insurance on both jobs?", `Yes, separately on each, if you earn over £${G.deferWeekly.other} a week from that job. If one job pays at least £${G.deferWeekly.main} a week you may be able to defer National Insurance on the other.`],
  ["Can I split my Personal Allowance between two jobs?", `If your main job pays less than ${m0(R.personalAllowance)}, contact HMRC to check whether the rest can go to your second job. With jobs paying £8,000 and £7,000 that cuts the tax taken from the second job to ${m0(gov2.due)} for the year.`]
];
const title = site.fitTitle("Second Job Tax Calculator UK — BR, D0 and Take-Home Pay", "Second Job Tax Calculator UK");
const desc = `How much tax and National Insurance a second job takes on BR, D0 or a split allowance, what you take home from it, and whether PAYE takes the right tax across both jobs. ${esc(R.year)} rates.`;
const ld = [site.webPage(title, desc, url, G.lastChecked), site.breadcrumb([["Home", SITE + "/"], ["Personal Finance", SITE + "/personal-finance/"], ["Second Job Tax Calculator", url]]),
  { "@context": "https://schema.org", "@type": "WebApplication", name: "Second Job Tax Calculator", url, applicationCategory: "FinanceApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } }, site.faqLd(q)];

const html = site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="/personal-finance/">← Personal finance calculators</a>
      <h1 class="page-title">Second job tax calculator</h1>
      <p class="page-subtitle">What a second job takes in tax and National Insurance, what you keep, and whether your codes take the right tax.</p>
    </header>

${tool}
${body}
    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}      <p class="tool-hint" style="margin-top:12px;">An estimate, not advice: HMRC's figure decides it. ${esc(R.year)} rates from the UK and Scottish tax files; how tax works with more than one job from ${SRC}. Last checked ${site.niceDate(G.lastChecked)}.</p>
    </main>

${related.block(P)}
${site.FOOTER}
  </div>
  <script src="/tax-code.js"></script>
  <script src="/tax-refund.js"></script>
  <script src="/second-job.js"></script>
</body>
</html>
`;
site.write("second-job-tax-calculator", html);
site.sitemapBlock("second job tax pages", "tools/build-second-job-pages.js", [[P, "0.6"]]);
console.log(`built the second job tax calculator (${m0(ex.pay1)} + ${m0(ex.pay2)} on BR: ${m2(ex.r.net2)} kept; GOV.UK examples ${m0(gov1.tax2)} and ${m0(gov2.due)})`);
