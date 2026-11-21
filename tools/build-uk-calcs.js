#!/usr/bin/env node
/* UK tax and employment calculators built on uk-calcs.js:

       /dividend-tax-calculator/        /salary-vs-dividends/        /contractor-calculator/
       /capital-gains-tax-calculator/   /inheritance-tax-calculator/ /maternity-pay-calculator/
       /redundancy-pay-calculator/      /holiday-entitlement-calculator/
       /pension-drawdown-calculator/    /buy-to-let-calculator/

       node tools/build-uk-calcs.js

   Figures: tools/lib/uk-config.js (the UK tax file plus data/uk/). The
   worked examples are computed here with the same code the page runs, so
   the text and the calculator always agree. Runs in the monthly rebuild. */
const site = require("./lib/site.js");
const related = require("./related.js");
const U = require("../uk-calcs.js");
const { cfg, R } = require("./lib/uk-config.js")();
const { SITE, esc } = site;

const g0 = (v) => "£" + Math.round(v).toLocaleString("en-GB");
const g2 = (v) => "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const Y = cfg.year;
const CFG = esc(JSON.stringify(cfg));
const src = (url, title) => `<a href="${url}" rel="noopener">${esc(title)}</a>`;
const f = (id, label, value, extra) => `        <div class="field"><label for="${id}">${label}</label><input type="number" id="${id}" value="${value}" min="0" step="any" inputmode="decimal"${extra || ""}></div>`;
const row = (label, id, value, cls) => `          <div class="result-row${cls ? " " + cls : ""}"><span class="r-label">${label}</span><span class="r-value" id="${id}">${value}</span></div>`;
const pair = (a, b) => `      <div class="field-row">\n${a}\n${b}\n      </div>`;

function shell(o) {
  const url = SITE + o.path;
  const ld = [site.webPage(o.title, o.desc, url, R.lastChecked), site.breadcrumb([["Home", SITE + "/"], [o.name, url]]),
    { "@context": "https://schema.org", "@type": "WebApplication", name: o.name, url, applicationCategory: "FinanceApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } }, site.faqLd(o.q)];
  return site.head({ title: o.title, desc: o.desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="/">← All calculators</a>
      <h1 class="page-title">${esc(o.h1)}</h1>
      <p class="page-subtitle">${o.sub}</p>
    </header>

    <main class="tool uk-tool" id="${o.id}" data-cfg="${CFG}">
${o.form}
      <p class="error-msg" id="${o.id}-error" style="display:none;"></p>
      <div class="result-box" aria-live="polite">
        <div class="result-grid">
${o.results}
        </div>
      </div>
      <p class="tool-hint" style="margin-top:12px;">${o.hint} ${Y} figures from GOV.UK (${o.sources}), checked ${R.lastChecked}. A guide, not tax advice.</p>
    </main>

${o.more || ""}    <main class="tool">
      <p class="tool-section-title">Frequently asked questions</p>
${site.faqHtml(o.q)}    </main>

${related.block(o.path)}
${site.FOOTER}
  </div>
  <script src="/uk-calcs.js"></script>
  <script src="/uk-calcs-ui.js"></script>
</body>
</html>
`;
}

/* ---------- dividend tax ---------- */
function dividends() {
  const sal = 30000, div = 20000, r = U.incomeTax(cfg, sal, div);
  const d = cfg.div;
  const table = [10000, 20000, 30000, 50000, 75000].map((dv) => { const x = U.incomeTax(cfg, sal, dv); return [g0(dv), g0(x.divTax), g0(dv - x.divTax)]; });
  return shell({ path: "/dividend-tax-calculator/", id: "dv", name: "Dividend Tax Calculator",
    title: `Dividend Tax Calculator ${Y} — UK Rates ${d.basic}%, ${d.higher}% and ${d.additional}%`,
    desc: `Work out UK dividend tax for ${Y}: a £${d.allowance} allowance, then ${d.basic}%, ${d.higher}% or ${d.additional}% depending on your other income. With a ${g0(sal)} salary, ${g0(div)} of dividends costs ${g0(r.divTax)} in tax.`,
    h1: "Dividend tax calculator", sub: `UK tax on dividends for ${Y}, on top of your salary or other income.`,
    form: pair(f("dv-other", "Salary and other income (before tax)", sal), f("dv-div", "Dividends", div)),
    results: [row("Dividend tax", "dv-tax", g0(r.divTax), "highlight"), row("Dividends after tax", "dv-keep", g0(div - r.divTax)), row("Tax on your other income", "dv-ns", g0(r.nsTax)), row("Effective rate on dividends", "dv-rate", (r.divTax / div * 100).toFixed(1) + "%")].join("\n"),
    hint: "England, Wales and Northern Ireland income tax bands (dividends are taxed the same in Scotland, but Scottish wages use different bands). Income tax only — no National Insurance is due on dividends.",
    sources: src(d.source, "tax on dividends"),
    more: `    <main class="tool">
      <p class="tool-section-title">How dividends are taxed (${Y})</p>
      <p class="about-text">Dividends are added on top of your other income. The first £${d.allowance} is tax-free (the dividend allowance), but it still uses up part of your tax band. The rest is taxed at <strong>${d.basic}%</strong> in the basic rate band, <strong>${d.higher}%</strong> in the higher rate band and <strong>${d.additional}%</strong> above £125,140. Any personal allowance your salary doesn't use covers dividends first.</p>
      <p class="tool-section-title" style="margin-top:20px;">Tax on dividends with a ${g0(sal)} salary</p>
${site.table(["Dividends", "Dividend tax", "You keep"], table, 300)}    </main>

`,
    q: [
      ["How much tax do I pay on dividends?", `For ${Y}: nothing on the first £${d.allowance}, then ${d.basic}% on dividends that fall in the basic rate band, ${d.higher}% in the higher rate band and ${d.additional}% in the additional rate band. Where they fall depends on your other income, because dividends are counted last.`],
      [`Did dividend tax go up in April 2026?`, `Yes: the basic and higher dividend rates rose by 2 percentage points from 6 April 2026, from 8.75% and 33.75% to ${d.basic}% and ${d.higher}%. The additional rate stayed at ${d.additional}%.`],
      ["Do I pay National Insurance on dividends?", "No. Dividends are subject to income tax only, which is why company directors often take a small salary and the rest as dividends."],
      ["Do I need to tell HMRC about dividends?", "Dividends within the £500 allowance need no action. Above it, HMRC can usually collect tax on up to £10,000 through your tax code; above £10,000 you need to file a Self Assessment tax return."]
    ] });
}

/* ---------- salary vs dividends ---------- */
function salaryVsDividends() {
  const profit = 60000, opts = [["£" + cfg.er.threshold.toLocaleString("en-GB") + " (secondary threshold)", cfg.er.threshold], ["£" + cfg.niPT.toLocaleString("en-GB") + " (primary threshold)", cfg.niPT], ["All as salary", null]];
  const rows = opts.map(([l, s]) => { const salary = s === null ? solveAllSalary(profit) : s; const r = U.director(cfg, profit, salary, false); return [l, g0(r.salary), g0(r.div), g0(r.totalTax), `<strong>${g0(r.net)}</strong>`]; });
  const best = U.director(cfg, profit, cfg.niPT, false);
  return shell({ path: "/salary-vs-dividends/", id: "sd", name: "Salary vs Dividends Calculator",
    title: `Salary vs Dividends Calculator ${Y} — Best Director's Pay Split`,
    desc: `For UK limited company directors: compare a small salary plus dividends with taking everything as salary, after corporation tax, National Insurance and dividend tax (${Y} rates). On ${g0(profit)} of profit, a ${g0(cfg.niPT)} salary leaves ${g0(best.net)}.`,
    h1: "Salary vs dividends calculator", sub: `The most tax-efficient way to pay yourself from your own limited company, on ${Y} rates.`,
    form: pair(f("sd-profit", "Company profit before your salary", profit), f("sd-salary", "Salary to compare", cfg.niPT)) + `
      <div class="field"><label><input type="checkbox" id="sd-ea"> The company can claim the Employment Allowance (not if you're the only employee and a sole director)</label></div>`,
    results: [row("Salary", "sd-sal", g0(best.salary)), row("Employer National Insurance", "sd-erni", g0(best.erNI)), row("Corporation tax", "sd-ct", g0(best.ct)), row("Dividends", "sd-div", g0(best.div)), row("Income tax on salary", "sd-it", g0(best.incomeTax)), row("Dividend tax", "sd-dt", g0(best.divTax)), row("Employee National Insurance", "sd-eeni", g0(best.eeNI)), row("You take home", "sd-net", g0(best.net), "highlight")].join("\n"),
    hint: "All profit paid out in the year; no other income, pension contributions or student loan. England, Wales and NI income tax bands.",
    sources: [src(R.corporationTax.source, "corporation tax"), src(R.employerNI.source, "employer rates"), src(R.dividends.source, "dividend tax")].join(", "),
    more: `    <main class="tool">
      <p class="tool-section-title">Common salary choices compared</p>
      <div class="table-scroll"><div style="min-width:520px;"><table class="out-table"><thead><tr><th>Salary</th><th>Salary paid</th><th>Dividends</th><th>All taxes</th><th>Take-home</th></tr></thead><tbody id="sd-table">
${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("\n")}
      </tbody></table></div></div>
      <p class="about-text" style="margin-top:12px;">A salary up to the National Insurance primary threshold (${g0(cfg.niPT)}) costs no employee NI or income tax and counts towards your State Pension; above the secondary threshold (${g0(cfg.er.threshold)}) the company pays ${cfg.er.rate}% employer NI on it, but that and the salary reduce corporation tax. Which wins depends on your profit and whether you can claim the Employment Allowance — the calculator compares them for your figures.</p>
    </main>

`,
    q: [
      ["What is the most tax-efficient salary for a director?", `Usually a salary at or near the personal allowance and NI primary threshold (${g0(cfg.niPT)} for ${Y}), with the rest as dividends. If your company can't claim the Employment Allowance, a salary of ${g0(cfg.er.threshold)} (the secondary threshold) avoids employer NI but loses some corporation tax relief — compare both above.`],
      ["Why are dividends taxed less than salary?", `They aren't free of tax: the company pays corporation tax (${cfg.ct.small}% to ${cfg.ct.main}%) on profits first, then you pay dividend tax. But there's no National Insurance on dividends, which usually makes them cheaper than salary overall.`],
      ["Can I claim the Employment Allowance as a one-person company?", "No — if your company's only employee paid above the secondary threshold is you as the sole director, it can't claim the Employment Allowance. With another employee on the payroll, it usually can."],
      ["What corporation tax rate will my company pay?", `${cfg.ct.small}% on profits up to £${cfg.ct.lower.toLocaleString("en-GB")}, ${cfg.ct.main}% on profits over £${cfg.ct.upper.toLocaleString("en-GB")}, and in between the main rate less marginal relief — an effective rate that rises gradually.`]
    ] });
}
function solveAllSalary(profit) {
  /* the salary that, with employer NI, uses up all the profit */
  let lo = 0, hi = profit;
  for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (m + U.employerNI(cfg, m, false) > profit) hi = m; else lo = m; }
  return lo;
}

/* ---------- contractor ---------- */
function contractor() {
  const rate = 500, days = 220, exp = 2000, inc = rate * days;
  const inside = insideIR35(inc, 0), outside = U.director(cfg, inc - exp, cfg.niPT, false);
  return shell({ path: "/contractor-calculator/", id: "ct", name: "Contractor Calculator",
    title: `Contractor Calculator ${Y} — Day Rate Take-Home Inside vs Outside IR35`,
    desc: `Turn a contractor day rate into take-home pay inside IR35 (PAYE, via an umbrella or the client) and outside IR35 (your own limited company). £${rate} a day for ${days} days: ${g0(inside.net)} inside, ${g0(outside.net)} outside.`,
    h1: "Contractor take-home calculator", sub: `Your day rate after tax, inside and outside IR35, on ${Y} rates.`,
    form: pair(f("ct-rate", "Day rate", rate), f("ct-days", "Days worked a year", days)) + "\n" + pair(f("ct-fee", "Umbrella fee a year (inside IR35)", 0), f("ct-exp", "Company expenses a year (outside IR35)", exp)),
    results: [row("Contract income", "ct-inc", g0(inc)), row("Inside IR35: take-home", "ct-in", g0(inside.net), "highlight"), row("Inside IR35: a month", "ct-in-m", g2(inside.net / 12)), row("Outside IR35: take-home", "ct-out", g0(outside.net), "highlight"), row("Outside IR35: a month", "ct-out-m", g2(outside.net / 12)), row("Difference a year", "ct-diff", g0(outside.net - inside.net))].join("\n"),
    hint: `Inside IR35: the rate pays your salary plus employer NI (${cfg.er.rate}% above ${g0(cfg.er.threshold)}); then income tax and employee NI. Outside: a limited company paying you a ${g0(cfg.niPT)} salary and the rest as dividends after corporation tax, no Employment Allowance. No pension, apprenticeship levy or student loan.`,
    sources: [src(R.employerNI.source, "employer rates"), src(R.corporationTax.source, "corporation tax"), src(R.dividends.source, "dividend tax")].join(", "),
    q: [
      ["What is IR35?", "The UK off-payroll working rules. If you'd be an employee were it not for your limited company, you're 'inside IR35' and taxed much like an employee. For medium and large clients, and all public sector clients, the client decides your status; for small private sector clients, your own company decides."],
      ["Why is take-home lower inside IR35?", `Inside IR35 the whole rate is treated as employment income: employer National Insurance (${cfg.er.rate}%) comes out of it, then income tax and employee NI. Outside IR35 you can pay yourself mostly in dividends, which carry no National Insurance.`],
      ["How many days a year do contractors work?", "Often around 220 to 230 once holidays, bank holidays and gaps between contracts are allowed for — use your own figure; it makes a big difference."]
    ] });
}
function insideIR35(income, fee) {
  const pot = Math.max(0, income - fee), e = cfg.er;
  const salary = pot > e.threshold ? (pot + e.threshold * e.rate / 100) / (1 + e.rate / 100) : pot;
  const it = U.incomeTax(cfg, salary, 0).total, ni = U.employeeNI(cfg, salary);
  return { salary, net: salary - it - ni };
}

/* ---------- CGT ---------- */
function cgt() {
  const gain = 20000, income = 40000, taxable = Math.max(0, income - U.allowance(cfg, income)), r = U.cgt(cfg, gain, taxable, false), c = cfg.cgt;
  return shell({ path: "/capital-gains-tax-calculator/", id: "cg", name: "Capital Gains Tax Calculator",
    title: `Capital Gains Tax Calculator ${Y} — UK CGT at ${c.basic}% and ${c.higher}%`,
    desc: `Work out UK capital gains tax for ${Y}: a £${c.allowance.toLocaleString("en-GB")} tax-free allowance, then ${c.basic}% within the basic rate band and ${c.higher}% above. A ${g0(gain)} gain on a ${g0(income)} income costs ${g0(r.tax)}.`,
    h1: "Capital gains tax calculator", sub: `UK capital gains tax on shares, property and other assets, ${Y} rates.`,
    form: pair(f("cg-gain", "Gain (sale price less cost and allowable costs)", gain), f("cg-income", "Your other income this tax year", income)) + `
      <div class="field"><label><input type="checkbox" id="cg-badr"> Business Asset Disposal Relief applies</label></div>`,
    results: [row("Taxable gain", "cg-taxable", g0(r.chargeable)), row(`Taxed at ${c.basic}%`, "cg-basic", g0(r.inBasic)), row(`Taxed at ${c.higher}%`, "cg-higher", g0(r.chargeable - r.inBasic)), row("Capital gains tax", "cg-tax", g0(r.tax), "highlight")].join("\n"),
    hint: `After the £${c.allowance.toLocaleString("en-GB")} allowance; gains use up whatever is left of your basic rate band first. Losses from the same year come off the gain first. Main homes are usually exempt (Private Residence Relief).`,
    sources: src(c.source, "Capital Gains Tax rates"),
    q: [
      [`What are the capital gains tax rates for ${Y}?`, `${c.basic}% on gains that fall within your basic rate band and ${c.higher}% above it, after the £${c.allowance.toLocaleString("en-GB")} tax-free allowance. The same rates apply to residential property and other assets. Business Asset Disposal Relief is ${c.badr}% from 6 April 2026.`],
      ["How do I work out my gain?", "Sale price minus what you paid, minus allowable costs such as buying and selling fees, stamp duty and the cost of improvements (not repairs or maintenance)."],
      ["Do I pay capital gains tax on my home?", "Usually not on your main home, thanks to Private Residence Relief, as long as it's been your main home throughout. Second homes and buy-to-lets are taxed."]
    ] });
}

/* ---------- IHT ---------- */
function iht() {
  const ex = { estate: 750000, home: 400000, transferNRB: 0, transferRNRB: 0 }, r = U.iht(cfg, ex), t = cfg.iht;
  return shell({ path: "/inheritance-tax-calculator/", id: "ih", name: "Inheritance Tax Calculator",
    title: `Inheritance Tax Calculator ${Y} — UK IHT With the Home Allowance`,
    desc: `Work out UK inheritance tax: the £${t.nilRateBand.toLocaleString("en-GB")} threshold, the £${t.residenceNilRateBand.toLocaleString("en-GB")} residence allowance when a home goes to children or grandchildren, transferred allowances and the 36% charity rate. A ${g0(ex.estate)} estate with a ${g0(ex.home)} home: ${g0(r.tax)}.`,
    h1: "Inheritance tax calculator", sub: "Estimate UK inheritance tax on an estate, including the residence nil-rate band and a spouse's unused allowances.",
    form: pair(f("ih-estate", "Estate value (after debts)", ex.estate), f("ih-home", "Home left to children or grandchildren", ex.home)) + "\n" + pair(f("ih-tnrb", "Spouse's unused threshold transferred (%)", 0, ' max="100"'), f("ih-trnrb", "Spouse's unused residence band transferred (%)", 0, ' max="100"')) + "\n" + f("ih-charity", "Left to charity", 0),
    results: [row("Tax-free threshold", "ih-nrb", g0(r.nrb)), row("Residence nil-rate band", "ih-rnrb", g0(r.rnrb)), row("Taxable", "ih-taxable", g0(r.taxable)), row("Rate", "ih-rate", r.rate + "%"), row("Inheritance tax", "ih-tax", g0(r.tax), "highlight")].join("\n"),
    hint: `Everything left to a spouse or civil partner is exempt, so this is for an estate passing to others. The residence band shrinks by £1 for every £2 the estate is over £${(t.taperThreshold / 1e6)} million. The 36% rate applies when 10% or more of the estate (after the thresholds) goes to charity — a simplified test. Gifts in the 7 years before death aren't included.`,
    sources: src(t.source, "Inheritance Tax"),
    q: [
      ["How much is the inheritance tax threshold?", `£${t.nilRateBand.toLocaleString("en-GB")}. It can rise to £${(t.nilRateBand + t.residenceNilRateBand).toLocaleString("en-GB")} if you leave your home to your children or grandchildren, and a married couple or civil partners can pass on unused allowances — up to £${(2 * (t.nilRateBand + t.residenceNilRateBand)).toLocaleString("en-GB")} between them.`],
      ["What is the inheritance tax rate?", `${t.rate}% on the part of the estate above the threshold, or ${t.charityRate}% if 10% or more of the estate goes to charity.`],
      ["Who pays inheritance tax?", "It's paid out of the estate by the executors, usually before the estate is shared out, so beneficiaries normally don't pay it directly."]
    ] });
}

/* ---------- maternity ---------- */
function maternity() {
  const awe = 600, r = U.smp(cfg, awe), s = cfg.sp;
  return shell({ path: "/maternity-pay-calculator/", id: "mp", name: "Maternity Pay Calculator",
    title: `Maternity Pay Calculator ${Y} — Statutory Maternity Pay (SMP)`,
    desc: `Work out Statutory Maternity Pay: 90% of your average weekly earnings for 6 weeks, then £${s.smpWeekly} a week (or 90% if lower) for 33 weeks. On ${g0(awe)} a week, SMP totals ${g0(r.total)} over ${s.smpWeeks} weeks.`,
    h1: "Maternity pay calculator", sub: "Statutory Maternity Pay week by week, from your average weekly earnings.",
    form: pair(f("mp-awe", "Average weekly earnings (before tax)", awe), `        <div class="field"><label for="mp-salary">Or annual salary</label><input type="number" id="mp-salary" placeholder="e.g. 31200" min="0" step="any" inputmode="decimal"></div>`),
    results: [row("Weeks 1–6 (90%)", "mp-first", g2(r.first) + " a week"), row("Weeks 7–39", "mp-rest", g2(r.rest) + " a week"), row("Total SMP", "mp-total", g2(r.total), "highlight"), row("Eligible?", "mp-elig", r.eligible ? "Yes, if you meet the service conditions" : "No")].join("\n"),
    hint: `Before tax and National Insurance, which come off SMP as they do from pay. To qualify you must earn on average at least £${s.lowerEarningsLimit} a week and have worked for your employer continuously for at least 26 weeks into the 15th week before the baby is due. Your employer may pay more (enhanced maternity pay).`,
    sources: src(s.source, "Maternity pay"),
    q: [
      ["How much is Statutory Maternity Pay?", `90% of your average weekly earnings (before tax) for the first 6 weeks, then £${s.smpWeekly} or 90% of your average weekly earnings, whichever is lower, for the next 33 weeks.`],
      ["How are average weekly earnings worked out?", "From your pay in the 8 weeks (if paid weekly) or 2 months (if paid monthly) up to the last payday before the 15th week before the baby is due. Entering an annual salary here divides it by 52 as an estimate."],
      ["Is maternity pay taxed?", "Yes — tax and National Insurance are deducted from SMP in the usual way."],
      ["What about paternity pay?", `Statutory Paternity Pay is £${s.sppWeekly} a week or 90% of average weekly earnings, whichever is lower.`]
    ] });
}

/* ---------- redundancy ---------- */
function redundancy() {
  const age = 45, years = 10, weekly = 700, r = U.redundancy(cfg, age, years, weekly), d = cfg.red;
  return shell({ path: "/redundancy-pay-calculator/", id: "rd", name: "Redundancy Pay Calculator",
    title: `Redundancy Pay Calculator ${Y} — UK Statutory Redundancy Pay`,
    desc: `Work out UK statutory redundancy pay from your age, years of service and weekly pay (capped at £${d.weekCap}). Aged ${age} with ${years} years' service on ${g0(weekly)} a week: ${g0(r.total)}. Maximum £${d.maxTotal.toLocaleString("en-GB")}.`,
    h1: "Redundancy pay calculator", sub: "Statutory redundancy pay in England, Scotland and Wales, by age, service and weekly pay.",
    form: pair(f("rd-age", "Your age now", age, ' step="1"'), f("rd-years", "Full years worked for this employer", years, ' step="1"')) + "\n" + f("rd-weekly", "Weekly pay before tax", weekly),
    results: [row("Weeks' pay due", "rd-weeks", String(r.weeks)), row("Week's pay used", "rd-week", g2(r.weekPay)), row("Statutory redundancy pay", "rd-total", g0(r.total), "highlight")].join("\n"),
    hint: `Half a week's pay for each full year you were under 22, a week's pay for each year aged 22 to 40, and a week and a half for each year aged 41 or older; the last ${d.maxYears} years count, weekly pay is capped at £${d.weekCap} and the total at £${d.maxTotal.toLocaleString("en-GB")} (redundancies from ${new Date(d.from).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}). You need ${d.minYears} years' service. Your contract may give more.`,
    sources: src(d.source, "Redundancy pay"),
    q: [
      ["How much statutory redundancy pay will I get?", `It depends on your age, length of service and weekly pay: half a week's pay for each full year under 22, one week for each year from 22 to 40, and one and a half weeks for each year from 41. Weekly pay is capped at £${d.weekCap}, service at ${d.maxYears} years, and the total at £${d.maxTotal.toLocaleString("en-GB")}.`],
      ["Do I qualify for redundancy pay?", `You need to be an employee with at least ${d.minYears} years' continuous service with the employer.`],
      ["Is redundancy pay taxed?", "Statutory and contractual redundancy pay are usually tax-free up to a limit, but pay in lieu of notice and holiday pay are taxed as earnings. HMRC's guidance on termination payments has the details."]
    ] });
}

/* ---------- holiday ---------- */
function holiday() {
  const h = cfg.hol, r = U.holiday(cfg, 5);
  const table = [1, 2, 2.5, 3, 4, 4.5, 5, 6].map((d) => [d + (d === 1 ? " day" : " days"), (Math.round(U.holiday(cfg, d).full * 10) / 10) + " days"]);
  return shell({ path: "/holiday-entitlement-calculator/", id: "hl", name: "Holiday Entitlement Calculator",
    title: "Holiday Entitlement Calculator — UK Statutory Leave for Part-Time and Irregular Hours",
    desc: `Work out UK statutory holiday: 5.6 weeks a year, up to 28 days — ${(Math.round(U.holiday(cfg, 3).full * 10) / 10)} days for a 3-day week. Part-year starters and leavers pro rata, and the ${h.irregularPct}% accrual for irregular hours.`,
    h1: "Holiday entitlement calculator", sub: "Your statutory paid holiday in the UK, for full-time, part-time, part-year and irregular-hours work.",
    form: pair(f("hl-days", "Days worked a week", 5, ' max="7"'), f("hl-months", "Months of the leave year you'll work", 12, ' max="12"')) + "\n" + f("hl-hours", "Irregular hours: hours worked in the pay period", "", ' placeholder="e.g. 80"'),
    results: [row("Full-year entitlement", "hl-full", (Math.round(r.full * 10) / 10) + " days"), row("For the months you work", "hl-due", (Math.round(r.due * 10) / 10) + " days", "highlight"), row("Irregular hours: holiday earned", "hl-irr", "—")].join("\n"),
    hint: `5.6 weeks a year, capped at ${h.capDays} days; bank holidays can be included in it. Irregular-hours and part-year workers earn ${h.irregularPct}% of the hours they work in each pay period (leave years from April 2024). Your contract may give more.`,
    sources: src(h.source, "Holiday entitlement"),
    more: `    <main class="tool">
      <p class="tool-section-title">Statutory holiday by days worked</p>
${site.table(["Days a week", "Holiday a year"], table, 260)}    </main>

`,
    q: [
      ["How much holiday am I entitled to?", `Almost all workers get 5.6 weeks' paid holiday a year. Working 5 days a week that's 28 days; it's capped at ${h.capDays} days even if you work 6 days a week.`],
      ["How much holiday do part-time workers get?", "5.6 times the days you work a week: 16.8 days for a 3-day week, 22.4 days for 4 days. It's the same 5.6 weeks off as full-time staff."],
      ["How is holiday worked out for irregular hours?", `For leave years starting on or after 1 April 2024, irregular-hours and part-year workers build up holiday at ${h.irregularPct}% of the hours they actually work in each pay period.`],
      ["Are bank holidays included?", "They can be: employers can count bank holidays as part of the 5.6 weeks. There's no legal right to bank holidays off on top."]
    ] });
}

/* ---------- pension drawdown ---------- */
function drawdown() {
  const pot = 250000, p = cfg.pen, lump = Math.min(pot * p.taxFreePct / 100, p.lumpSumAllowance), yearly = 15000, growth = 4, r = U.drawdown(pot - lump, yearly, growth);
  return shell({ path: "/pension-drawdown-calculator/", id: "pd", name: "Pension Drawdown Calculator",
    title: "Pension Drawdown Calculator — How Long Will My Pension Pot Last?",
    desc: `How long a pension pot lasts with drawdown, after taking the ${p.taxFreePct}% tax-free lump sum (up to £${p.lumpSumAllowance.toLocaleString("en-GB")}). ${g0(pot)}, ${g0(lump)} taken tax-free, then ${g0(yearly)} a year growing at ${growth}%: about ${Math.round(r.years)} years.`,
    h1: "Pension drawdown calculator", sub: "How long your pension pot lasts, with or without the tax-free lump sum.",
    form: pair(f("pd-pot", "Pension pot", pot), f("pd-yearly", "Taking out a year (before tax)", yearly)) + "\n" + pair(f("pd-growth", "Growth a year (%)", growth), `        <div class="field"><label for="pd-lump">Tax-free lump sum</label><select id="pd-lump"><option value="1" selected>Take the ${p.taxFreePct}% up front</option><option value="0">Don't take it</option></select></div>`),
    results: [row("Tax-free lump sum", "pd-lumpout", g0(lump)), row("Left for drawdown", "pd-left", g0(pot - lump)), row("Lasts about", "pd-years", Math.round(r.years) + " years", "highlight")].join("\n"),
    hint: `Withdrawals are taken at the start of each year and are taxable income. The full new State Pension is £${p.statePensionWeekly.toFixed(2)} a week (${g0(p.statePensionWeekly * 52)} a year) from State Pension age, which reduces what the pot needs to cover. Growth isn't guaranteed; try a cautious figure.`,
    sources: [src(p.source, "lump sum allowance"), src("https://www.gov.uk/new-state-pension/what-youll-get", "new State Pension")].join(", "),
    q: [
      ["How much can I take tax-free from my pension?", `Usually up to ${p.taxFreePct}% of each pension pot, up to a lifetime maximum of £${p.lumpSumAllowance.toLocaleString("en-GB")}. The rest is taxed as income when you take it.`],
      ["How long will my pension last?", "It depends on how much you take out and how the investments grow. Taking out less than the pot grows by makes it last indefinitely; the calculator shows the years for your figures."],
      ["Should I buy an annuity instead?", "An annuity pays a guaranteed income for life however long you live, but you give up the pot. Drawdown keeps the pot invested and flexible, but can run out. Many people mix the two; free guidance is available from Pension Wise."]
    ] });
}

/* ---------- buy to let ---------- */
function btl() {
  const price = 250000, rent = 1200, interest = 7000, costs = 3000, other = 40000, r = btlTax(price, rent, interest, costs, other);
  return shell({ path: "/buy-to-let-calculator/", id: "bl", name: "Buy-to-Let Calculator",
    title: "Buy-to-Let Calculator — Rental Yield, Profit and Landlord Tax",
    desc: `Rental yield and profit on a buy-to-let after costs, mortgage interest and income tax — with the ${cfg.ll.financeCostCredit}% mortgage interest tax credit. £${rent.toLocaleString("en-GB")} a month on a ${g0(price)} property: ${r.gross.toFixed(1)}% gross yield, ${g0(r.afterTax)} a year after tax.`,
    h1: "Buy-to-let calculator", sub: "Gross and net rental yield, and what a rental property makes after tax.",
    form: pair(f("bl-price", "Property price", price), f("bl-rent", "Rent a month", rent)) + "\n" + pair(f("bl-interest", "Mortgage interest a year", interest), f("bl-costs", "Other costs a year (agent, repairs, insurance)", costs)) + "\n" + f("bl-other", "Your other income (salary etc.)", other),
    results: [row("Gross yield", "bl-gross", r.gross.toFixed(2) + "%"), row("Net yield (before mortgage)", "bl-net", r.net.toFixed(2) + "%"), row("Profit before tax", "bl-profit", g0(r.profit)), row("Extra income tax", "bl-tax", g0(r.tax)), row("Profit after tax", "bl-after", g0(r.afterTax), "highlight")].join("\n"),
    hint: `Individual landlords can't deduct mortgage interest from rental income; instead it gets a tax reduction at ${cfg.ll.financeCostCredit}%. Tax is the extra income tax your rental profit adds on top of your other income (England, Wales and NI bands). Doesn't include buying costs — see the <a href="/stamp-duty-calculator/">stamp duty calculator</a> for the higher rates on additional homes.`,
    sources: src(cfg.ll.source, "landlords' finance costs"),
    q: [
      ["What is a good rental yield?", "Gross yield is the year's rent as a percentage of the price. Yields vary a lot by area; what matters is whether the rent covers the mortgage, costs, voids and tax with a margin."],
      ["Can landlords deduct mortgage interest?", `Not from rental income for individual landlords. Instead you get a tax reduction of ${cfg.ll.financeCostCredit}% of the interest, which leaves higher-rate taxpayers paying more tax than before the rules changed.`],
      ["Is buy-to-let better in a limited company?", "Companies can deduct mortgage interest in full and pay corporation tax rather than income tax, but taking money out costs dividend tax, and mortgages and accounts cost more. It tends to suit higher-rate taxpayers building a portfolio; take advice."]
    ] });
}
function btlTax(price, rentM, interest, costs, other) {
  const rent = rentM * 12, pre = rent - costs, profit = pre - interest;
  const tax = Math.max(0, U.incomeTax(cfg, other + Math.max(0, pre), 0).total - U.incomeTax(cfg, other, 0).total - Math.min(interest, Math.max(0, pre)) * cfg.ll.financeCostCredit / 100);
  return { gross: rent / price * 100, net: pre / price * 100, profit, tax, afterTax: profit - tax };
}

const PAGES = [["dividend-tax-calculator", dividends], ["salary-vs-dividends", salaryVsDividends], ["contractor-calculator", contractor], ["capital-gains-tax-calculator", cgt], ["inheritance-tax-calculator", iht], ["maternity-pay-calculator", maternity], ["redundancy-pay-calculator", redundancy], ["holiday-entitlement-calculator", holiday], ["pension-drawdown-calculator", drawdown], ["buy-to-let-calculator", btl]];
PAGES.forEach(([dir, fn]) => site.write(dir, fn()));
console.log(`built ${PAGES.length} UK calculators on ${Y} rates`);
