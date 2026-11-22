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
      <p class="tool-section-title">Official sources first</p>
      <p class="about-text">Calculators that depend on rules set by someone else — tax, National Insurance, student loans, stamp duty, the energy price cap, statutory pay — use the figures published by the body that sets them: GOV.UK and HMRC, Ofgem, the IRS and state revenue departments, the Canada Revenue Agency, and the tax authorities of each European country covered. Where an official source doesn't publish a figure in usable form, we use payroll and accounting publications that cite it, and say so.</p>
      <p class="about-text">Each salary page lists its sources, what it assumes (for example a single employee with no pension contributions), and what it leaves out. Health and fitness calculators name the formula and the body behind it — the NHS, the CDC, the British Nutrition Foundation — and are estimates, not medical advice.</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">Checked every month</p>
      <p class="about-text">The site covers income tax and social contributions in ${n(live.length)} jurisdictions across ${n(countries)} countries. Every month each one is compared with its published sources. When a rate changes, it's updated with the new source recorded alongside it; when it hasn't, the file gets a new "last checked" date. Next year's rates are prepared as drafts as soon as they're announced and switched on when the tax year starts.</p>
      <p class="about-text">Other figures that move — inflation, the energy price cap, fuel prices, exchange rates, bank holidays — are downloaded from their official publishers each month too. <a href="/tax-rates/">The tax rates page</a> shows when every country, state and province was last checked.</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">Tested before anything goes live</p>
      <p class="about-text">Every tax file carries worked examples: a salary, worked through by hand from the official rules, with the result it must produce. There are ${n(tests)} of them, and every change to the rates or the code has to reproduce all of them exactly before it's published. The same calculation code runs on the pages and in the tests, so what's tested is what you use.</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">Being clear about limits</p>
      <p class="about-text">A calculator is only as good as its assumptions, so each page states them. Tax pages also say whether a person has yet checked the figures line by line against the official source — a stricter mark than the monthly check — and link to the official calculator so you can compare. If something doesn't match your payslip, the assumptions are the first place to look.</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">Frequently asked questions</p>
${site.faqHtml(q)}    </main>

${site.FOOTER}
  </div>
</body>
</html>
`;
site.write("how-we-check", html);
site.sitemapBlock("trust pages", "tools/build-trust-pages.js", [["/how-we-check/", "0.4"]]);
console.log(`built /how-we-check/ (${live.length} jurisdictions, ${tests} tests)`);
