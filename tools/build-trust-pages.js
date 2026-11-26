#!/usr/bin/env node
/* /how-we-check/: where the figures come from, how they're checked and
   tested, and what each calculator leaves out. The counts (tax files,
   worked tests, places) are read from the data so the page stays true.

       node tools/build-trust-pages.js */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const { esc, SITE } = site;

const files = fs.readdirSync(path.join(site.ROOT, "data/tax")).filter((d) => fs.statSync(path.join(site.ROOT, "data/tax", d)).isDirectory() && d !== "verify")
  .flatMap((d) => fs.readdirSync(path.join(site.ROOT, "data/tax", d)).filter((f) => f.endsWith(".json")).map((f) => JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/tax", d, f), "utf8"))));
const live = files.filter((f) => !f.draft);
const tests = files.reduce((a, f) => a + (f.tests || []).length, 0);
const countries = new Set(live.map((f) => f.country)).size;
const n = (v) => v.toLocaleString("en-GB");

/* what's checked or downloaded each month, with the date it last was: read
   from the data files themselves, so the table can't claim a check that
   didn't happen */
const J = (p) => { try { return JSON.parse(fs.readFileSync(path.join(site.ROOT, p), "utf8")); } catch (e) { return {}; } };
const readme = (p, re) => { try { return (fs.readFileSync(path.join(site.ROOT, p), "utf8").match(re) || [])[1] || null; } catch (e) { return null; } };
const when = (d) => (d ? site.niceDate(d) : "not yet");
const oldest = (ds) => ds.filter(Boolean).sort()[0] || null;
const checkedTax = live.filter((f) => f.lastChecked).length;
const taxDates = live.map((f) => f.lastChecked).filter(Boolean).sort();
const energy = J("data/energy/uk.json"), fuel = J("data/fuel/uk.json"), ecb = J("data/currency/ecb.json");
const a = (url, text) => `<a href="${url}" rel="nofollow noopener" target="_blank">${esc(text)}</a>`;
const CHECKS = [
  ["Income tax and social contributions", `${n(live.length)} tax files`, "Each country's tax authority (GOV.UK and HMRC, the IRS, the CRA and others)",
    taxDates.length ? `${n(checkedTax)} of ${n(live.length)} so far, between ${when(taxDates[0])} and ${when(taxDates[taxDates.length - 1])}; the rest come up in turn` : "not yet", "/tax-rates/"],
  ["UK dividend, capital gains, inheritance tax, employer NI and statutory pay", "", a("https://www.gov.uk/", "GOV.UK"), when(J("data/uk/rates-2026-27.json").lastChecked), "/dividend-tax-calculator/"],
  ["Self Assessment penalties and HMRC interest", "", a("https://www.gov.uk/self-assessment-tax-returns/penalties", "GOV.UK"), when(J("data/uk/self-assessment.json").lastChecked), "/self-assessment-penalty-calculator/"],
  ["Child Benefit and the High Income Child Benefit Charge", "", a("https://www.gov.uk/child-benefit-tax-charge", "GOV.UK"), when(J("data/uk/child-benefit.json").lastChecked), "/child-benefit-tax-charge-calculator/"],
  ["Marriage Allowance", "", a("https://www.gov.uk/marriage-allowance", "GOV.UK"), when(J("data/uk/marriage-allowance.json").lastChecked), "/marriage-allowance-calculator/"],
  ["What tax codes mean", "", a("https://www.gov.uk/tax-codes", "GOV.UK"), when(J("data/uk/tax-codes.json").lastChecked), "/tax-code-checker/"],
  ["How HMRC settles over- and underpaid tax", "", a("https://www.gov.uk/tax-overpayments-and-underpayments", "GOV.UK"), when(J("data/uk/tax-refunds.json").lastChecked), "/tax-refund-calculator/"],
  ["How bonuses are taxed and charged National Insurance", "", a("https://www.gov.uk/expenses-and-benefits-bonuses", "GOV.UK and HMRC"), when(J("data/uk/bonus-tax.json").lastChecked), "/bonus-tax-calculator/"],
  ["Tax codes and National Insurance with more than one job", "", a("https://www.gov.uk/guidance/how-tax-works-if-you-have-more-than-one-job", "GOV.UK"), when(J("data/uk/second-job.json").lastChecked), "/second-job-tax-calculator/"],
  ["Part-time pay (pro rata)", "", a("https://www.gov.uk/part-time-worker-rights", "GOV.UK"), when(J("data/uk/pro-rata.json").lastChecked), "/pro-rata-salary-calculator/"],
  ["Statutory Sick Pay", "", a("https://www.gov.uk/statutory-sick-pay", "GOV.UK"), when(J("data/uk/ssp.json").lastChecked), "/statutory-sick-pay-calculator/"],
  ["Approved mileage rates and Mileage Allowance Relief", "", a("https://www.gov.uk/tax-relief-for-employees/vehicles-you-use-for-work", "GOV.UK"), when(J("data/uk/mileage.json").lastChecked), "/mileage-allowance-calculator/"],
  ["National Minimum Wage and National Living Wage", "", a("https://www.gov.uk/national-minimum-wage-rates", "GOV.UK"), when(J("data/uk/minimum-wage.json").lastChecked), "/minimum-wage-calculator/"],
  ["Salary sacrifice and pension tax relief rules", "", a("https://www.gov.uk/tax-on-your-private-pension/pension-tax-relief", "GOV.UK"), when(oldest([J("data/uk/salary-sacrifice.json").lastChecked, J("data/uk/pension-tax-relief.json").lastChecked])), "/pension-tax-relief-calculator/"],
  ["Stamp duty, LBTT and LTT", "", "GOV.UK, Revenue Scotland and the Welsh Government", when(J("data/property/uk-stamp-duty.json").lastChecked), "/stamp-duty-calculator/"],
  ["Student loan interest and write-off", "", a("https://www.gov.uk/repaying-your-student-loan/what-you-pay", "GOV.UK"), when(J("data/student-loans/uk.json").lastChecked), "/student-loan-calculator/"],
  ["Energy price cap", energy.period ? esc(energy.period.label || "") : "", energy.source ? a(energy.source.url, "Ofgem") : "Ofgem", when(energy.lastChecked), "/heating-cost/"],
  ["Pump prices", fuel.week ? `week of ${when(fuel.week)}` : "", fuel.source ? a(fuel.source.url, "GOV.UK weekly road fuel prices") : "GOV.UK", when(fuel.lastChecked), "/fuel-cost/"],
  ["Exchange rates", ecb.date ? `rates of ${when(ecb.date)}` : "", ecb.source ? a(ecb.source.url, "European Central Bank") : "European Central Bank", ecb.date ? "downloaded with the rates" : "not yet", "/currency/"],
  ["Inflation (CPI, CPIH, RPI, US CPI)", "", "ONS and the US Bureau of Labor Statistics", when(readme("data/inflation/raw/README.md", /downloaded (\d{4}-\d{2}-\d{2})/)), "/inflation/"],
  ["Bank holidays", "", a("https://www.gov.uk/bank-holidays", "GOV.UK"), when(readme("data/holidays/README.md", /downloaded (\d{4}-\d{2}-\d{2})/)), "/working-days/"]
].map(([what, detail, who, date, href]) => [fs.existsSync(path.join(site.ROOT, href, "index.html")) ? `<a href="${href}">${esc(what)}</a>` : esc(what), (detail ? detail + " · " : "") + who, date]);

/* the About page's calculator count follows the homepage's list */
const homeCount = (fs.readFileSync(path.join(site.ROOT, "index.html"), "utf8").match(/"numberOfItems": (\d+)/) || [])[1];
const aboutFile = path.join(site.ROOT, "about", "index.html");
if (homeCount && fs.existsSync(aboutFile)) {
  const before = fs.readFileSync(aboutFile, "utf8"), after = before.replace(/free collection of (<strong>)?\d+ calculators/, (m, b) => `free collection of ${b || ""}${homeCount} calculators`);
  if (after !== before) fs.writeFileSync(aboutFile, after);
}

const url = SITE + "/how-we-check/";
const title = "How We Check Our Figures — Sources, Testing and Updates";
const desc = `Where Lots Of Calcs gets its tax rates and other figures, how they're checked every month against official sources, and the ${n(tests)} worked examples every change has to pass.`;
const q = [
  ["Where do the tax rates come from?", "From the official tax authority wherever it publishes them — GOV.UK and HMRC, the IRS and state revenue departments, the CRA, and each European country's tax office — or, where it doesn't publish a usable figure, from payroll and accounting publications that cite it. Every salary page lists its sources."],
  ["How often are the figures checked?", "Every month. Each tax file is compared with its published sources, changed if a figure has changed, and given a new 'last checked' date. The tax rates page lists that date for every country, state and province."],
  ["What does 'checked by a person' mean?", "It's a separate, stricter mark: a person going through a country's figures line by line against the official source. Pages say plainly when that hasn't happened yet, so you know how much weight to put on them."],
  ["What if a figure doesn't match my payslip?", "Start with the page's assumptions and what it leaves out — a pension contribution, a tax code or a benefit in kind is usually the difference. If a rate itself is wrong, it's corrected in the next monthly update, with the source recorded."]
];
const ld = [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], ["How we check our figures", url]]), site.faqLd(q),
  { "@context": "https://schema.org", "@type": "Organization", name: "Lots Of Calcs", url: SITE + "/", logo: SITE + "/og-image.jpg" }];
const html = site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="/about/">← About this site</a>
      <h1 class="page-title">How we check our figures</h1>
      <p class="page-subtitle">Where the numbers come from, how they're kept current, and how every change is tested before it goes live.</p>
    </header>

    <main class="tool">
      <h2 class="tool-section-title">Official sources first</h2>
      <p class="about-text">Calculators that depend on rules set by someone else — tax, National Insurance, student loans, stamp duty, the energy price cap, statutory pay — use the figures published by the body that sets them: GOV.UK and HMRC, Ofgem, the IRS and state revenue departments, the Canada Revenue Agency, and the tax authorities of each European country covered. Where an official source doesn't publish a figure in usable form, we use payroll and accounting publications that cite it, and say so.</p>
      <p class="about-text">Each salary page lists its sources, what it assumes (for example a single employee with no pension contributions), and what it leaves out. Health and fitness calculators name the formula and the body behind it — the NHS, the CDC, the British Nutrition Foundation — and are estimates, not medical advice.</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">Checked every month</h2>
      <p class="about-text">The site covers income tax and social contributions in ${n(live.length)} jurisdictions across ${n(countries)} countries. Every month each one is compared with its published sources. When a rate changes, it's updated with the new source recorded alongside it; when it hasn't, the file gets a new "last checked" date. Next year's rates are prepared as drafts as soon as they're announced and switched on when the tax year starts.</p>
      <p class="about-text">Other figures that move — inflation, the energy price cap, fuel prices, exchange rates, bank holidays — are downloaded from their official publishers each month too. <a href="/tax-rates/">The tax rates page</a> shows when every country, state and province was last checked.</p>
    </main>

    <main class="tool" id="checked">
      <h2 class="tool-section-title">What's checked, and when</h2>
      <p class="about-text">Everything the calculators rely on that can change, who publishes it, and when it was last checked or downloaded. These dates come from the data files the calculators read, so this table updates itself.</p>
${site.table(["Figures", "Source", "Last checked"], CHECKS, 520)}    </main>

    <main class="tool">
      <h2 class="tool-section-title">Tested before anything goes live</h2>
      <p class="about-text">Every tax file carries worked examples: a salary, worked through by hand from the official rules, with the result it must produce. There are ${n(tests)} of them, and every change to the rates or the code has to reproduce all of them exactly before it's published. The same calculation code runs on the pages and in the tests, so what's tested is what you use.</p>
      <p class="about-text">Where a publisher gives its own worked example, the calculator has to reproduce it before a page is built: GOV.UK's payments on account example, its higher rate pension relief example, and the Child Benefit charge's 1% for every £200, among others. If a rule changes so that an example no longer comes out, the page isn't published until it's fixed.</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">Being clear about limits</h2>
      <p class="about-text">A calculator is only as good as its assumptions, so each page states them. Tax pages also say whether a person has yet checked the figures line by line against the official source — a stricter mark than the monthly check — and link to the official calculator so you can compare. If something doesn't match your payslip, the assumptions are the first place to look.</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}    </main>

${site.FOOTER}
  </div>
</body>
</html>
`;
site.write("how-we-check", html);
site.sitemapBlock("trust pages", "tools/build-trust-pages.js", [["/how-we-check/", "0.4"]]);
console.log(`built /how-we-check/ (${live.length} jurisdictions, ${tests} tests)`);
