#!/usr/bin/env node
/* The High Income Child Benefit Charge calculator:

       /child-benefit-tax-charge-calculator/

       node tools/build-child-benefit-pages.js

   The Child Benefit rates and the charge's rule are in data/uk/child-benefit.json,
   each quoted from GOV.UK. Child Benefit rates change each April, so the
   monthly check confirms them. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const related = require("./related.js");
const CB = require("../child-benefit.js");
const { esc, SITE } = site;

const R = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/uk/child-benefit.json"), "utf8"));
const C = R.charge, rates = R.rates;
const m0 = (v) => "£" + v.toLocaleString("en-GB", { maximumFractionDigits: 0 });
const m2 = (v) => "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* GOV.UK's rule: 1% per £200 over, so half way through the band is 50%, and
   all of it once the income reaches the top */
const one = CB.benefit(R, 1), two = CB.benefit(R, 2), three = CB.benefit(R, 3);
const mid = CB.charge(R, (C.threshold + C.full) / 2, 2), top = CB.charge(R, C.full, 1), under = CB.charge(R, C.threshold, 2);
if (mid.pct !== 50 || top.pct !== 100 || under.charge !== 0 || CB.charge(R, C.threshold + C.step, 1).pct !== 1) throw new Error("child benefit charge: rule check");
const ex = CB.charge(R, 70000, 2);

const SRC = (k) => `<a href="${R[k].source.url}" rel="nofollow noopener" target="_blank">${esc(R[k].source.title)}</a>`;
const P = "/child-benefit-tax-charge-calculator/", url = SITE + P;

const tool = (income) => { const ex = CB.charge(R, income, 2); return `    <main class="tool split" id="cb-tool" data-rules="${esc(JSON.stringify({ rates, charge: C }))}">
      <div class="field"><label for="cb-income">Your income for the tax year</label><input type="number" id="cb-income" value="${income}" min="0" step="any" inputmode="decimal"><p class="tool-hint" style="margin:6px 0 0;">Salary, profits, savings interest, dividends and rent, before tax. Leave out pension contributions your employer takes from your pay before tax.</p></div>
      <div class="field"><label for="cb-relief">Personal pension contributions and Gift Aid (gross)</label><input type="number" id="cb-relief" value="0" min="0" step="any" inputmode="decimal"><p class="tool-hint" style="margin:6px 0 0;">What goes into the pension or to charity with the basic rate tax relief added: £80 paid in counts as £100.</p></div>
      <div class="field-row">
        <div class="field"><label for="cb-children">Children you get Child Benefit for</label><input type="number" id="cb-children" value="2" min="1" max="12" step="1" inputmode="numeric"></div>
        <div class="field"><label for="cb-partner">Your partner's income (0 if none)</label><input type="number" id="cb-partner" value="0" min="0" step="any" inputmode="decimal"></div>
      </div>
      <div class="result-box split-aside" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="cb-charge">${m0(ex.charge)}</div>
          <div class="label" id="cb-label">charge you pay back a year</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row"><span class="r-label">Child Benefit a year</span><span class="r-value" id="cb-benefit">${m2(ex.benefit)}</span></div>
          <div class="result-row"><span class="r-label">Adjusted net income of the higher earner</span><span class="r-value" id="cb-ani">${m0(income)}</span></div>
          <div class="result-row"><span class="r-label">Share paid back</span><span class="r-value" id="cb-pct">${ex.pct}%</span></div>
          <div class="result-row highlight"><span class="r-label">Child Benefit you keep</span><span class="r-value" id="cb-kept">${m0(ex.kept)}</span></div>
        </div>
        <p class="tool-hint" id="cb-avoid" style="margin:10px 0 0;"></p>
      </div>
    </main>
`; };

const bands = [60000, 62000, 65000, 70000, 75000, 80000].map((inc) => {
  const a = CB.charge(R, inc, 1), b = CB.charge(R, inc, 2), c = CB.charge(R, inc, 3);
  return [m0(inc), a.pct + "%", m0(a.charge), m0(b.charge), m0(c.charge)];
});

const body = `    <main class="tool">
      <h2 class="tool-section-title">How the charge works</h2>
      <p class="about-text">If you or your partner get Child Benefit and either of you has an <strong>adjusted net income over ${m0(C.threshold)}</strong>, the one with the higher income pays some of it back through the High Income Child Benefit Charge: <strong>1% of the Child Benefit for every ${m0(C.step)}</strong> of income over ${m0(C.threshold)}. At ${m0(C.full)} or more, the charge is the whole of it.</p>
      <p class="about-text">Child Benefit is ${m2(rates.eldest)} a week for the eldest or only child and ${m2(rates.additional)} a week for each other child: about ${m0(one)} a year for one child, ${m0(two)} for two and ${m0(three)} for three.</p>
      ${site.table(["Adjusted net income", "Share paid back", "1 child", "2 children", "3 children"], bands, 480)}      <p class="about-text" style="margin-top:14px;"><strong>Adjusted net income</strong> is your taxable income, including savings interest and dividends, less personal pension contributions and Gift Aid donations (both gross). Paying more into a pension is the usual way to bring it back under ${m0(C.threshold)}: with an income of ${m0(70000)}, an extra ${m0(10000)} gross into a pension clears the charge as well as saving higher rate tax. To see what that does to your take-home pay, use the <a href="/salary/">salary calculator</a>, or compare the options with <a href="/isa-vs-pension/">ISA or pension</a>.</p>
      <p class="about-text">The charge is paid through Self Assessment, or, if you register for PAYE by 31 January after the tax year ends, through your tax code. If your income is well over ${m0(C.full)} you can opt out of the payments instead: you still claim Child Benefit, which keeps your National Insurance credits towards your State Pension.</p>
    </main>
`;

const q = [
  ["What is the High Income Child Benefit Charge?", `A tax charge that takes back some or all of your family's Child Benefit if you or your partner has an adjusted net income over ${m0(C.threshold)}. It's paid by whichever of you has the higher income.`],
  ["How much Child Benefit do I pay back?", `1% of it for every ${m0(C.step)} of adjusted net income over ${m0(C.threshold)}, and all of it at ${m0(C.full)} or more. With two children and an income of ${m0(70000)}, that's ${ex.pct}%: ${m0(ex.charge)} of ${m0(ex.benefit)}.`],
  ["What is the threshold for the Child Benefit charge?", `${m0(C.threshold)} of adjusted net income for each parent, since the 2024 to 2025 tax year. It's paid back in full at ${m0(C.full)}.`],
  ["Does my partner's income count?", `Only to decide who pays. Each income is tested on its own, not added together: if both of you are over ${m0(C.threshold)}, the one with the higher income pays the charge.`],
  ["How can I avoid the High Income Child Benefit Charge?", `Bring your adjusted net income down to ${m0(C.threshold)} or less, usually by paying more into a pension or giving to charity with Gift Aid. Both are taken off your income at their gross amount.`],
  ["Should I still claim Child Benefit if I earn over £80,000?", "It's worth claiming and opting out of the payments: you won't owe the charge, but the claim still gets you National Insurance credits towards your State Pension if you're not working, and gets your child a National Insurance number."]
];

const ld = [site.webPage("High Income Child Benefit Charge Calculator", "", url), site.breadcrumb([["Home", SITE + "/"], ["Personal Finance", SITE + "/personal-finance/"], ["Child Benefit Tax Charge Calculator", url]]),
  { "@context": "https://schema.org", "@type": "WebApplication", name: "Child Benefit Tax Charge Calculator", url, applicationCategory: "FinanceApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } },
  site.faqLd(q)];
const title = site.fitTitle("High Income Child Benefit Charge Calculator — How Much You Pay Back", "Child Benefit Tax Charge Calculator (HICBC)");
const desc = `Work out the High Income Child Benefit Charge: 1% of your Child Benefit for every ${m0(C.step)} over ${m0(C.threshold)}, all of it at ${m0(C.full)}, and the pension contribution that clears it.`;
ld[0].description = desc;

const html = site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="/personal-finance/">← Personal finance calculators</a>
      <h1 class="page-title">Child Benefit tax charge calculator</h1>
      <p class="page-subtitle">How much of your Child Benefit the <strong>High Income Child Benefit Charge</strong> takes back, and what it takes to keep it all.</p>
    </header>

${tool(70000)}
${body}
    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}      <p class="tool-hint" style="margin-top:12px;">A guide, not advice. Rates and rules from ${SRC("rates")} and ${SRC("charge")}. Last checked ${site.niceDate(R.lastChecked)}.</p>
    </main>

${related.block(P)}
${site.FOOTER}
  </div>
  <script src="/child-benefit.js"></script>
</body>
</html>
`;
site.write("child-benefit-tax-charge-calculator", html);

/* /child-benefit-tax-charge-calculator/70000/: the charge at one income */
const INCOMES = [62000, 64000, 65000, 66000, 68000, 70000, 72000, 74000, 75000, 76000, 78000, 80000, 85000, 90000, 100000];
const iurl = (n) => `${P}${n}/`;
const relief = J("data/uk/pension-tax-relief.json").basicRelief;
function J(f) { return JSON.parse(fs.readFileSync(path.join(site.ROOT, f), "utf8")); }
function incomePage(n) {
  const u = SITE + iurl(n), c2 = CB.charge(R, n, 2), over = Math.max(0, n - C.threshold);
  const kids = [1, 2, 3, 4].map((k) => { const c = CB.charge(R, n, k); return [`${k} child${k > 1 ? "ren" : ""}`, m2(c.benefit), `${c.pct}%`, `<strong>${m0(c.charge)}</strong>`, m2(c.kept)]; });
  const net = over * (100 - relief) / 100;
  const all = n >= C.full;
  const q = [
    [`How much Child Benefit do I pay back on ${m0(n)}?`, all ? `All of it: at ${m0(C.full)} or more the charge is the whole of your Child Benefit, ${m0(CB.charge(R, n, 1).charge)} a year for one child and ${m0(c2.charge)} for two.` : `${c2.pct}% of it: ${m0(CB.charge(R, n, 1).charge)} a year for one child, ${m0(c2.charge)} for two and ${m0(CB.charge(R, n, 3).charge)} for three. It's 1% for every ${m0(C.step)} of adjusted net income over ${m0(C.threshold)}.`],
    [`How do I avoid the Child Benefit charge on ${m0(n)}?`, `Bring your adjusted net income down to ${m0(C.threshold)}: ${m0(over)} of personal pension contributions or Gift Aid donations, counted gross. Into a relief at source pension that's ${m0(net)} paid in, as the provider adds basic rate relief.`],
    ["Does my partner's income count?", `Only to decide who pays. Each income is tested on its own, not added together: if both of you are over ${m0(C.threshold)}, the one with the higher income pays the charge.`]
  ];
  if (all) q.push(["Should I still claim Child Benefit?", "It's worth claiming and opting out of the payments: you won't owe the charge, but the claim still gets you National Insurance credits towards your State Pension if you're not working, and gets your child a National Insurance number."]);
  const title = site.fitTitle(`Child Benefit Charge on ${m0(n)} — How Much You Pay Back`, `Child Benefit Charge on ${m0(n)}`);
  const desc = `The High Income Child Benefit Charge on an adjusted net income of ${m0(n)}: ${c2.pct}% of your Child Benefit, ${m0(c2.charge)} a year with two children, and the ${m0(over)} pension contribution that clears it.`;
  const ld = [site.webPage(title, desc, u, R.lastChecked), site.breadcrumb([["Home", SITE + "/"], ["Child Benefit Tax Charge Calculator", url], [m0(n), u]]), site.faqLd(q)];
  const near = INCOMES.filter((x) => x !== n).map((x) => `<a href="${iurl(x)}">Charge on ${m0(x)}</a>`).join(" ");
  return site.head({ title, desc, url: u, ld }) + `    <header class="site-header">
      <a class="back-link" href="${P}">← Child Benefit tax charge calculator</a>
      <h1 class="page-title">Child Benefit charge on ${m0(n)}</h1>
      <p class="page-subtitle">How much of your Child Benefit the High Income Child Benefit Charge takes back on an adjusted net income of ${m0(n)}.</p>
    </header>

${tool(n)}
    <main class="tool">
      <h2 class="tool-section-title">The charge on ${m0(n)}</h2>
${site.table(["Children", "Child Benefit a year", "Share paid back", "Charge", "You keep"], kids, 520)}      <p class="about-text" style="margin-top:14px;">${m0(n)} is ${m0(over)} over the ${m0(C.threshold)} threshold, so the charge is ${all ? `the whole of your Child Benefit: at ${m0(C.full)} or more you pay it all back` : `${c2.pct}% of your Child Benefit (1% for every ${m0(C.step)} over)`}. It's paid by whichever parent has the higher adjusted net income, through Self Assessment or your tax code.</p>
      <p class="about-text"><strong>To keep it all</strong>, bring your adjusted net income down to ${m0(C.threshold)} with ${m0(over)} of personal pension contributions or Gift Aid, both counted gross. Into a relief at source pension that's ${m0(net)} paid in, as the provider adds basic rate relief${n > 50270 ? ", and as a higher rate taxpayer you can claim more relief back on your tax return. The <a href=\"/pension-tax-relief-calculator/\">pension tax relief calculator</a> works it out" : ""}.${all && n > C.full ? ` If your income stays well over ${m0(C.full)}, you can opt out of the payments instead and keep claiming, which keeps your National Insurance credits.` : ""}</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}      <p class="tool-hint" style="margin-top:12px;">A guide, not advice. Rates and rules from ${SRC("rates")} and ${SRC("charge")}. Last checked ${site.niceDate(R.lastChecked)}.</p>
    </main>

    <div class="hub-group-title" style="margin-top:28px;">Other incomes</div>
    <p class="salary-links">${near}</p>

${related.block(P)}
${site.FOOTER}
  </div>
  <script src="/child-benefit.js"></script>
</body>
</html>
`;
}
INCOMES.forEach((n) => site.write(`child-benefit-tax-charge-calculator/${n}`, incomePage(n)));
site.prune("child-benefit-tax-charge-calculator", /^\d+$/);
site.hubBlock(P, "charge by income", "tools/build-child-benefit-pages.js", `    <main class="tool">
      <h2 class="tool-section-title">The charge by income</h2>
      <p class="salary-links">${INCOMES.map((n) => `<a href="${iurl(n)}">Charge on ${m0(n)}</a>`).join(" ")}</p>
    </main>
`);
site.sitemapBlock("child benefit pages", "tools/build-child-benefit-pages.js", [[P, "0.6"]].concat(INCOMES.map((n) => [iurl(n), "0.5"])));
console.log(`built the Child Benefit tax charge calculator (${m2(rates.eldest)} / ${m2(rates.additional)} a week; ${m0(C.threshold)} to ${m0(C.full)})`);
