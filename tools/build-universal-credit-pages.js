#!/usr/bin/env node
/* The Universal Credit calculator:

       /universal-credit-calculator/

       node tools/build-universal-credit-pages.js

   GOV.UK's monthly amounts and the earnings rules (the 55% taper and the
   work allowance) are quoted in data/uk/universal-credit.json; the page is
   built from the same functions it runs (universal-credit.js). The build
   stops unless every stored amount appears in GOV.UK's quoted wording and a
   hand-checked example comes out the same. Runs in the monthly rebuild;
   the amounts change each April. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const related = require("./related.js");
const UC = require("../universal-credit.js");
const { esc, SITE } = site;

const R = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/uk/universal-credit.json"), "utf8"));
const m2 = (v) => "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const m0 = (v) => "£" + v.toLocaleString("en-GB", { maximumFractionDigits: 2 });
const Q = (k) => R.rules[k].quote;

/* every stored figure must still be in GOV.UK's wording */
const must = [
  ["standard", [R.standard.singleUnder25, R.standard.single25, R.standard.coupleUnder25, R.standard.couple25]],
  ["child", [R.child, R.firstChildBefore2017Extra]], ["disabledChild", [R.disabledChild.lower, R.disabledChild.higher]],
  ["health", [R.health.lcwra, R.health.lcwraSevere]], ["carer", [R.carer]], ["childcareMax", [R.childcareMax.one, R.childcareMax.twoOrMore]],
  ["workAllowanceLower", [R.workAllowance.withHousing]], ["workAllowanceHigher", [R.workAllowance.withoutHousing]],
  ["capital", [R.capital.disregard, R.capital.upper, R.capital.perStep, R.capital.step]], ["benefitCapEarnings", [R.benefitCap.earningsThreshold]],
  ["benefitCapAmounts", [R.benefitCap.outsideLondon.family, R.benefitCap.outsideLondon.single, R.benefitCap.london.family, R.benefitCap.london.single]]
];
must.forEach(([k, vals]) => vals.forEach((v) => { if (!Q(k).includes(m2(v)) && !Q(k).includes(m0(v))) throw new Error(`universal credit: ${m2(v)} isn't in GOV.UK's quoted wording for ${k} (data/uk/universal-credit.json)`); }));
if (!Q("taper").includes(`goes down by ${R.taperPct}p`) || !Q("childcare").includes(`${R.childcarePct}%`)) throw new Error("universal credit: the 55p taper or 85% childcare no longer match GOV.UK's quoted wording");
if (!Q("healthRates").includes(R.health.lcwra.toFixed(2)) || !Q("healthRates").includes(R.health.lcwraSevere.toFixed(2))) throw new Error("universal credit: the health amounts don't match DWP's rates table");

/* hand-checked: a couple over 25 with 2 children, £800 of rent, £2,000 take-home:
   666.97 + 2 × 303.94 + 800 = 2,074.85; work allowance 427; 55% of 1,573 = 865.15; UC 1,209.70 */
const fam = { couple: true, over25: true, children: 2, health: "none", housing: 800 };
const famR = UC.calc(R, Object.assign({ earnings: 2000 }, fam));
const want = { max: 2074.85, workAllowance: 427, earnDed: 865.15, uc: 1209.70 };
if (R.taxYear === "2026/27") Object.keys(want).forEach((k) => { if (Math.abs(famR[k] - want[k]) > 0.005) throw new Error(`universal credit: the worked example's ${k} is ${famR[k]}, not ${want[k]}`); });

const single = { couple: false, over25: true, children: 0, health: "none" };
const singleStop = UC.calc(R, single).stopsAt, famStop = famR.stopsAt;
const rowsFor = (o, pays) => pays.map((e) => { const r = UC.calc(R, Object.assign({ earnings: e }, o)); return [m2(e), m2(r.uc), m2(r.total)]; });
const singleRows = rowsFor(single, [0, 200, 400, 600, 700, Math.floor(singleStop)]);
const famRows = rowsFor(fam, [0, 427, 1000, 1500, 2000, 2500, 3000, 3500, 4000]);
const rateRows = [
  ["Single, under 25", m2(R.standard.singleUnder25)], ["Single, 25 or over", m2(R.standard.single25)],
  ["Couple, both under 25", m2(R.standard.coupleUnder25)], ["Couple, either 25 or over", m2(R.standard.couple25)],
  ["Each child", m2(R.child) + ` (${m2(R.child + R.firstChildBefore2017Extra)} for a first child born before 6 April 2017)`],
  ["Disabled child addition", `${m2(R.disabledChild.lower)} or ${m2(R.disabledChild.higher)}`],
  ["Can't work because of health", `${m2(R.health.lcwra)} or ${m2(R.health.lcwraSevere)}`],
  ["Carer", m2(R.carer)],
  ["Childcare", `${R.childcarePct}% of costs, up to ${m2(R.childcareMax.one)} (1 child) or ${m2(R.childcareMax.twoOrMore)} (2 or more)`],
  ["Housing costs", "Rent and some service charges, depending on your circumstances"]
];
const SRC = R.sources.map((s) => `<a href="${s.url}" rel="nofollow noopener" target="_blank">${esc(s.title)}</a>`).join(", ");
const WA_L = m0(R.workAllowance.withHousing), WA_H = m0(R.workAllowance.withoutHousing);
const rules = { standard: R.standard, child: R.child, firstChildBefore2017Extra: R.firstChildBefore2017Extra, disabledChild: R.disabledChild, health: R.health, carer: R.carer, childcarePct: R.childcarePct, childcareMax: R.childcareMax, workAllowance: R.workAllowance, taperPct: R.taperPct, capital: R.capital, benefitCap: R.benefitCap };
const ex = UC.calc(R, Object.assign({ earnings: 1200 }, { couple: false, over25: true, children: 1, health: "none", housing: 650 }));

const P = "/universal-credit-calculator/", url = SITE + P;
const num = (id, label, v, extra) => `<div class="field"><label for="${id}">${label}</label><input type="number" id="${id}" value="${v}" min="0" step="any" inputmode="decimal"${extra || ""}></div>`;
const tool = `    <main class="tool split" id="uc-tool" data-rules="${esc(JSON.stringify(rules))}">
      <div class="field-row">
        <div class="field"><label for="uc-couple">You're</label><select id="uc-couple"><option value="0" selected>Single</option><option value="1">Living with a partner</option></select></div>
        <div class="field"><label for="uc-age">Age</label><select id="uc-age"><option value="1" selected>25 or over (either of you)</option><option value="0">Under 25 (both of you)</option></select></div>
      </div>
      <div class="field-row">
        ${num("uc-earnings", "Take-home pay a month (you and your partner)", 1200)}
        ${num("uc-housing", "Rent Universal Credit helps with, a month", 650)}
      </div>
      <div class="field-row">
        ${num("uc-children", "Children who live with you", 1, ' step="1" inputmode="numeric"')}
        ${num("uc-childcare", "Childcare costs a month", 0)}
      </div>
      <div class="field" id="uc-pre2017-row"><label><input type="checkbox" id="uc-pre2017" style="width:auto; margin-right:8px;"> First child born before 6 April 2017</label></div>
      <div class="field-row">
        <div class="field"><label for="uc-health">Health condition or disability</label><select id="uc-health"><option value="none" selected>None</option><option value="limits">Affects how much I can work (no extra amount)</option><option value="lcwra">Can't work, less severe (${m2(R.health.lcwra)})</option><option value="lcwraSevere">Can't work, severe or reported before 6 April 2026 (${m2(R.health.lcwraSevere)})</option></select></div>
        <div class="field"><label><input type="checkbox" id="uc-carer" style="width:auto; margin-right:8px;"> I care for someone 35 hours a week or more (${m2(R.carer)})</label></div>
      </div>
      <div class="field-row">
        ${num("uc-dis-lower", `Disabled children: lower amount (${m2(R.disabledChild.lower)})`, 0, ' step="1" inputmode="numeric"')}
        ${num("uc-dis-higher", `Higher amount (${m2(R.disabledChild.higher)})`, 0, ' step="1" inputmode="numeric"')}
      </div>
      <div class="field-row">
        ${num("uc-savings", "Savings and investments", 0)}
        ${num("uc-other", "Other benefits or pensions taken off in full, a month", 0)}
      </div>
      <p class="tool-hint" id="uc-error" role="alert" style="color: var(--bad); display: none;"></p>
      <p class="tool-hint" style="margin:6px 0 0;">Use take-home pay after tax, National Insurance and workplace pension, as on your payslip. Self-employed earnings follow different rules.</p>
      <div class="result-box split-aside" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="uc-amount">${m2(ex.uc)}</div>
          <div class="label" id="uc-label">Universal Credit a month (estimate)</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row"><span class="r-label">Before earnings are taken off</span><span class="r-value" id="uc-max">${m2(ex.max)}</span></div>
          <div class="result-row"><span class="r-label">Work allowance</span><span class="r-value" id="uc-wa">${ex.workAllowance ? m2(ex.workAllowance) : "none"}</span></div>
          <div class="result-row"><span class="r-label">${R.taperPct}p for each £1 above it</span><span class="r-value" id="uc-ded">−${m2(ex.earnDed)}</span></div>
          <div class="result-row"><span class="r-label">Savings and other income</span><span class="r-value" id="uc-other-ded">−${m2(ex.tariff + ex.other)}</span></div>
          <div class="result-row highlight"><span class="r-label">Take-home pay plus Universal Credit</span><span class="r-value" id="uc-total">${m2(ex.total)}</span></div>
          <div class="result-row"><span class="r-label">Universal Credit stops at about</span><span class="r-value" id="uc-stops">${m2(ex.stopsAt)} take-home a month</span></div>
        </div>
        <p class="tool-hint" id="uc-note" style="margin:10px 0 0;"></p>
      </div>
    </main>
`;

const body = `    <main class="tool">
      <h2 class="tool-section-title">How your wages affect Universal Credit</h2>
      <p class="about-text">For every £1 you earn, your Universal Credit goes down by <strong>${R.taperPct}p</strong>, so each extra £1 of take-home pay leaves you ${100 - R.taperPct}p better off. It's worked out on your take-home pay, after tax, National Insurance and workplace pension, over each monthly assessment period. There's no limit to the hours you can work and still get it. If you or your partner are responsible for a child, or have a health condition or disability that affects your ability to work, you get a <strong>work allowance</strong>: you can earn <strong>${WA_H} a month</strong> before your payment starts to reduce, or <strong>${WA_L}</strong> if you get help with housing costs (or live in temporary accommodation arranged by the council). Statutory pay, such as Statutory Sick Pay or Maternity Pay, counts as earnings.</p>
      <h3 class="tool-section-title" style="margin-top:14px;">Single, 25 or over, no children, no help with rent</h3>
${site.table(["Take-home pay a month", "Universal Credit", "Total"], singleRows, 440)}      <p class="tool-hint" style="margin-top:6px;">No work allowance, so ${R.taperPct}p comes off from the first £1: Universal Credit stops at about ${m2(singleStop)} a month.</p>
      <h3 class="tool-section-title" style="margin-top:14px;">Couple, 25 or over, 2 children, £800 of rent</h3>
${site.table(["Take-home pay a month", "Universal Credit", "Total"], famRows, 440)}      <p class="tool-hint" style="margin-top:6px;">The first ${WA_L} is the work allowance; after that ${R.taperPct}p comes off for each £1. Universal Credit stops at about ${m2(famStop)} a month.</p>
      <h2 class="tool-section-title" style="margin-top:18px;">What Universal Credit pays a month (${esc(R.taxYear)})</h2>
      <p class="about-text">You get one standard allowance for your household, plus extra amounts that apply to you. Since 6 April 2026 there's an amount for every child: the 2-child limit has ended. The health amount is for people who can't work because of a health condition or disability; there are different rules if you reported a health condition before 6 April 2026. A single person can't get the carer amount as well as the health amount. Childcare is paid back at ${R.childcarePct}% when you're working (both of you, if you're a couple, unless one of you can't work because of a disability or health condition).</p>
${site.table(["Amount", "A month"], rateRows, 560)}      <h2 class="tool-section-title" style="margin-top:18px;">What else reduces it</h2>
      <p class="about-text"><strong>Savings:</strong> nothing comes off for the first ${m0(R.capital.disregard)}; then ${m2(R.capital.perStep)} a month for every ${m0(R.capital.step)} (or part of ${m0(R.capital.step)}) up to ${m0(R.capital.upper)}. With more than ${m0(R.capital.upper)} you can't get Universal Credit. <strong>Other benefits</strong> such as Carer's Allowance, New Style JSA or ESA, Maternity Allowance and the State Pension are taken off pound for pound. <strong>The benefit cap</strong> limits total benefits, including Child Benefit, to ${m0(R.benefitCap.outsideLondon.family)} a month for a couple or single parent (${m0(R.benefitCap.outsideLondon.single)} single, no children) outside Greater London, and ${m0(R.benefitCap.london.family)} (${m0(R.benefitCap.london.single)}) inside it. It doesn't apply if you earn ${m0(R.benefitCap.earningsThreshold)} or more a month between you, get the health or carer amount, or someone in the household gets a disability benefit such as PIP or DLA. Payments can also be reduced to repay an advance, an overpayment or debts.</p>
      <p class="about-text">This is an estimate for employed earnings. Paid weekly, every 2 weeks or every 4 weeks, some months have an extra payday, and Universal Credit is lower that month. For your own figures, your online account shows each month's statement; for after-tax pay, try the <a href="/salary/">salary calculator</a>.</p>
    </main>
`;

const q = [
  ["How much does Universal Credit go down when I earn?", `${R.taperPct}p for every £1 of take-home pay, after any work allowance. So an extra £100 of take-home pay reduces Universal Credit by £${R.taperPct} and leaves you £${100 - R.taperPct} better off.`],
  ["What is the Universal Credit work allowance?", `If you or your partner are responsible for a child or have a health condition or disability that affects your ability to work, you can earn ${WA_H} a month before Universal Credit reduces, or ${WA_L} if you get help with housing costs (${esc(R.taxYear)}).`],
  ["How much can I earn before Universal Credit stops?", `It depends on your household. A single person over 25 with no children and no help with rent gets nothing from about ${m2(singleStop)} a month of take-home pay; a couple over 25 with 2 children and £800 of rent, from about ${m2(famStop)}.`],
  ["Is Universal Credit based on gross or net pay?", "Take-home pay: earnings after Income Tax, National Insurance and workplace pension contributions. Statutory pay such as Statutory Sick Pay counts as earnings."],
  ["Does the 2-child limit still apply?", "No. It ended on 6 April 2026, and Universal Credit now pays the child amount for every child. The benefit cap still applies."],
  ["Do savings affect Universal Credit?", `Savings over ${m0(R.capital.disregard)} reduce it by ${m2(R.capital.perStep)} a month for every ${m0(R.capital.step)} or part of ${m0(R.capital.step)}, up to ${m0(R.capital.upper)}. Above ${m0(R.capital.upper)} you can't get Universal Credit.`]
];
const title = site.fitTitle(`Universal Credit Calculator ${R.taxYear} — How Your Wages Affect Your Payment`, `Universal Credit Calculator ${R.taxYear}`);
const desc = `Estimate Universal Credit and see how wages change it: ${R.taperPct}p off for every £1 of take-home pay after the ${WA_L} or ${WA_H} work allowance, with ${esc(R.taxYear)} amounts for children, rent and childcare.`;
const ld = [site.webPage(title, desc, url, R.lastChecked), site.breadcrumb([["Home", SITE + "/"], ["Personal Finance", SITE + "/personal-finance/"], ["Universal Credit Calculator", url]]),
  { "@context": "https://schema.org", "@type": "WebApplication", name: "Universal Credit Calculator", url, applicationCategory: "FinanceApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } }, site.faqLd(q)];

const html = site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="/personal-finance/">← Personal finance calculators</a>
      <h1 class="page-title">Universal Credit calculator</h1>
      <p class="page-subtitle">An estimate of your monthly Universal Credit, and how much you keep as your wages go up (${esc(R.taxYear)}).</p>
    </header>

${tool}
${body}
    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}      <p class="tool-hint" style="margin-top:12px;">An estimate, not advice: DWP works out your actual payment, and a benefits calculator or adviser can check everything you're entitled to. Rules from GOV.UK: ${SRC}. Last checked ${site.niceDate(R.lastChecked)}.</p>
    </main>

${related.block(P)}
${site.FOOTER}
  </div>
  <script src="/universal-credit.js"></script>
</body>
</html>
`;
site.write("universal-credit-calculator", html);
site.sitemapBlock("universal credit pages", "tools/build-universal-credit-pages.js", [[P, "0.6"]]);
console.log(`built the Universal Credit calculator (${esc(R.taxYear)}; couple, 2 children, £800 rent, £2,000 take-home: ${m2(famR.uc)})`);
