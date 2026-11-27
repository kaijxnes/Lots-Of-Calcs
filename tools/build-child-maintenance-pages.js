#!/usr/bin/env node
/* The child maintenance calculator and a page for each yearly income:

       /child-maintenance-calculator/
       /child-maintenance-calculator/30000/   (and other incomes)

       node tools/build-child-maintenance-pages.js

   The rates, percentages, shared care fractions and £3,000 cap are quoted
   from the Child Support Act 1991, the 2012 calculation regulations and
   GOV.UK in data/uk/child-maintenance.json; the pages are built from the
   same functions the calculator runs (child-maintenance.js). The build
   stops unless each stored figure is in the quoted wording and hand-checked
   examples come out. Runs in the monthly rebuild. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const related = require("./related.js");
const CM = require("../child-maintenance.js");
const { esc, SITE } = site;

const R = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/uk/child-maintenance.json"), "utf8"));
const m2 = (v) => "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const m0 = (v) => "£" + Math.round(v).toLocaleString("en-GB");
const Q = (k) => R.rules[k].quote;

/* every stored figure must be in the quoted wording */
const need = [["flat", `flat rate of ${m0(R.flat)}`], ["flat", `${m0(R.reducedFrom)} or less`], ["nil", `below ${m0(R.nilBelow)}`], ["reducedWhen", `less than ${m0(R.basicFrom)} but more than ${m0(R.reducedFrom)}`],
  ["cap", `over ${m0(R.cap)}`], ["basic", `exceeds ${m0(R.band1)}`], ["rates", R.defaults.map((d, i) => `${m0(d)} for ${["1 child", "2 children", "3 or more children"][i]}`).join(", ")],
  ["weekly", `dividing by ${R.daysInYear} and multiplying by 7`], ["sharedCare", `plus an extra ${m0(R.halfExtra)} a week reduction`], ["sharedCare", `cannot go below ${m0(R.flat)} a week`]]
  .concat(R.basicPct.map((p, i) => ["basic", `${p}% where the non-resident parent has ${["one", "two", "three or more"][i]} qualifying child`]))
  .concat(R.abovePct.map((p, i) => ["basic", `${p}% where the non-resident parent has ${["one", "two", "three or more"][i]} qualifying child`]))
  .concat(R.otherPct.map((p, i) => ["basic", `${p}% where the non-resident parent has ${["one", "two", "three or more"][i]} relevant other child`]))
  .concat(R.reducedT.map((row, i) => ["reduced", `${["1 qualifying child", "2 qualifying children", "3 or more qualifying children"][i]} of the non-resident parent 0 ${row[0].toFixed(1)} 1 ${row[1].toFixed(1)} 2 ${row[2].toFixed(1)} 3 or more ${row[3].toFixed(1)}`]))
  .concat(R.shared.map((b, i) => ["sharedFractions", `${b.from}${b.to < 365 ? " to " + b.to : " or more"} ${["One-seventh", "Two-sevenths", "Three-sevenths", "One-half"][i]}`]));
need.forEach(([k, s]) => { if (!Q(k).includes(s)) throw new Error(`child maintenance: "${s}" isn't in the quoted wording for ${k} (data/uk/child-maintenance.json)`); });
/* hand-checked: £30,000 a year is £575.34 a week; 1 child 12% = £69.04; 2 children 16% = £92.05; with 1 other child 12% of £512.05 = £61.45;
   £60,000 = £1,150.68: £96 + 9% of £350.68 = £127.56; £150 a week, 1 child: £7 + 17% of £50 = £15.50;
   shared care: £69.04 less 2/7 = £49.31; less half and £7 = £27.52; £15.50 with 175 nights floors at £7 */
const w30 = CM.weekly(R, 30000), w60 = CM.weekly(R, 60000);
const ck = (o) => CM.calc(R, Object.assign({ children: 1, others: 0, nights: 0 }, o)).weekly;
const checks = [[w30, 575.34], [w60, 1150.68], [ck({ income: w30 }), 69.04], [ck({ income: w30, children: 2 }), 92.05], [ck({ income: w30, others: 1 }), 61.45], [ck({ income: w60 }), 127.56],
  [ck({ income: 150 }), 15.5], [ck({ income: w30, nights: 104 }), 49.31], [ck({ income: w30, nights: 175 }), 27.52], [ck({ income: 150, nights: 200 }), 7], [ck({ income: 80 }), 7], [ck({ income: 5 }), 0],
  [ck({ income: 80, benefits: true, nights: 60 }), 0], [ck({ income: 80, nights: 60 }), 7]];
checks.forEach(([got, want], i) => { if (got !== want) throw new Error(`child maintenance: hand-checked example ${i + 1} gives ${got}, not ${want}`); });

const BASE = "/child-maintenance-calculator/", INCOMES = [15000, 20000, 25000, 30000, 35000, 40000, 45000, 50000, 60000, 70000, 80000, 100000];
const iurl = (s) => `${BASE}${s}/`;
const at = (yearly, o) => CM.calc(R, Object.assign({ income: CM.weekly(R, yearly), children: 1, others: 0, nights: 0 }, o || {}));
const SRC = R.sources.map((s) => `<a href="${s.url}" rel="nofollow noopener" target="_blank">${esc(s.title)}</a>`).join(", ");
const RULES = { flat: R.flat, nilBelow: R.nilBelow, reducedFrom: R.reducedFrom, basicFrom: R.basicFrom, cap: R.cap, band1: R.band1, basicPct: R.basicPct, abovePct: R.abovePct, otherPct: R.otherPct, reducedT: R.reducedT, shared: R.shared, halfExtra: R.halfExtra, daysInYear: R.daysInYear };
const KIDS = ["1 child", "2 children", "3 children"];
const NIGHTS = [[0, "None, or fewer than 52 nights"], [52, "52 to 103 nights (about 1 a week)"], [104, "104 to 155 nights (about 2 a week)"], [156, "156 to 174 nights"], [175, "175 nights or more (about half the time)"]];

function tool(yearly) {
  const r = at(yearly);
  return `    <main class="tool split" id="cm-tool" data-rules="${esc(JSON.stringify(RULES))}">
      <div class="field-row" id="cm-income-row">
        <div class="field"><label for="cm-income">Paying parent's income before tax</label><input type="number" id="cm-income" value="${yearly}" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="cm-per">Per</label><select id="cm-per"><option value="1" selected>Year</option><option value="12">Month</option><option value="52">Week</option></select></div>
        <div class="field"><label for="cm-pension">Pension contributions (same period)</label><input type="number" id="cm-pension" value="0" min="0" step="any" inputmode="decimal"></div>
      </div>
      <div class="field-row">
        <div class="field"><label for="cm-children">Children the maintenance is for</label><input type="number" id="cm-children" value="1" min="1" max="20" step="1" inputmode="numeric"></div>
        <div class="field"><label for="cm-others">Other children living with the paying parent</label><input type="number" id="cm-others" value="0" min="0" max="20" step="1" inputmode="numeric"></div>
        <div class="field"><label for="cm-nights">Nights a year with the paying parent</label><select id="cm-nights">${NIGHTS.map(([v, t], i) => `<option value="${v}"${i ? "" : " selected"}>${t}</option>`).join("")}</select></div>
      </div>
      <div class="field"><label><input type="checkbox" id="cm-benefits" style="width:auto; margin-right:8px;">The paying parent gets benefits (such as Universal Credit with no earnings, or a State Pension)</label></div>
      <p class="tool-hint" id="cm-error" role="alert" style="color: var(--bad); display: none;"></p>
      <p class="tool-hint" style="margin:6px 0 0;">Leave out pension contributions your employer already takes off before tax. Shared care is per child; this assumes the same nights for each.</p>
      <div class="result-box split-aside" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="cm-weekly">${m2(r.weekly)}</div>
          <div class="label" id="cm-label">a week, for 1 child</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row highlight"><span class="r-label">About a month (52 weeks ÷ 12)</span><span class="r-value" id="cm-month">${m2(r.month)}</span></div>
          <div class="result-row"><span class="r-label">A year (52 weeks)</span><span class="r-value" id="cm-year">${m2(r.year)}</span></div>
          <div class="result-row"><span class="r-label">Gross weekly income</span><span class="r-value" id="cm-income-out">${m2(r.income)}</span></div>
          <div class="result-row"><span class="r-label">Rate</span><span class="r-value" id="cm-rate">${{ nil: "Nil rate", flat: "Flat rate", reduced: "Reduced rate", basic: "Basic rate" }[r.rate]}</span></div>
          <div class="result-row"><span class="r-label">Before shared care</span><span class="r-value" id="cm-before">${m2(r.before)}</span></div>
          <div class="result-row"><span class="r-label">Shared care</span><span class="r-value" id="cm-shared">None</span></div>
        </div>
        <p class="tool-hint" id="cm-note" style="margin:10px 0 0;"></p>
      </div>
    </main>
`;
}
const explain = `    <main class="tool">
      <h2 class="tool-section-title">How the Child Maintenance Service works it out</h2>
      <p class="about-text">It starts from the paying parent's yearly <strong>gross income</strong> from HMRC (employment, self-employment and pension income), divides it by ${R.daysInYear} and multiplies by 7 to get a weekly figure. Pension contributions not already taken off through the payroll can be deducted if the paying parent asks. Anything over ${m0(R.cap)} a week is ignored. Then one of these rates applies:</p>
${site.table(["Gross weekly income", "Rate", "Weekly amount"], [
    ["Not known", "Default", `${m0(R.defaults[0])} for 1 child, ${m0(R.defaults[1])} for 2, ${m0(R.defaults[2])} for 3 or more`],
    [`Below ${m0(R.nilBelow)}`, "Nil", "£0"],
    [`${m0(R.nilBelow)} to ${m0(R.reducedFrom)}, or on benefits`, "Flat", m0(R.flat)],
    [`${m2(R.reducedFrom + 0.01)} to ${m2(R.basicFrom - 0.01)}`, "Reduced", `${m0(R.flat)} plus a percentage of income over ${m0(R.reducedFrom)}`],
    [`${m0(R.basicFrom)} to ${m0(R.cap)}`, "Basic", `${R.basicPct.join("%, ")}% of the first ${m0(R.band1)} for 1, 2 or 3+ children, then ${R.abovePct.join("%, ")}%`]
  ], 620)}      <p class="about-text" style="margin-top:12px;"><strong>Other children</strong> who live with the paying parent reduce the income counted at the basic rate by ${R.otherPct[0]}% for one, ${R.otherPct[1]}% for two and ${R.otherPct[2]}% for three or more. At the reduced rate, the percentage is ${R.reducedT[0][0]}% for one child, falling to ${R.reducedT[0][3]}% with three or more other children (${R.reducedT[2][0]}% to ${R.reducedT[2][3]}% for three or more children).</p>
${site.table(["Nights a year with the paying parent", "Taken off for each child"], R.shared.map((b, i) => [`${b.from}${b.to < 365 ? " to " + b.to : " or more"}`, ["One-seventh (14.29%)", "Two-sevenths (28.57%)", "Three-sevenths (42.86%)", `Half, plus ${m0(R.halfExtra)} a week`][i]]), 480)}      <p class="tool-hint" style="margin-top:8px;">Shared care only changes the reduced and basic rates, and can't take the amount below ${m0(R.flat)} a week. If the paying parent gets benefits and a child stays 52 nights or more, nothing is paid for that child. Either parent can ask for extra income, assets or expenses to be taken into account (a variation).</p>
    </main>
`;
const head = (title, desc, u, crumbs, q, app) => site.head({ title, desc, url: u, ld: [site.webPage(title, desc, u, R.lastChecked), site.breadcrumb(crumbs)].concat(app ? [app] : []).concat([site.faqLd(q)]) });
const SCRIPT = `  <script src="/child-maintenance.js"></script>`;
const foot = `      <p class="tool-hint" style="margin-top:12px;">An estimate for England, Wales and Scotland, not legal advice: the Child Maintenance Service makes the decision, and parents can agree any amount between themselves. Rules from ${SRC} (GOV.UK and legislation.gov.uk). Last checked ${site.niceDate(R.lastChecked)}.</p>`;

function page(s) {
  const u = SITE + iurl(s), w = CM.weekly(R, s), r1 = at(s), r2 = at(s, { children: 2 }), r3 = at(s, { children: 3 });
  const grid = [0, 1, 2, 3].map((o) => [o === 3 ? "3 or more" : String(o)].concat([1, 2, 3].map((c) => { const r = at(s, { children: c, others: o }); return `${m2(r.weekly)} <span class="tool-hint">(${m0(r.month)}/month)</span>`; })));
  const shared = NIGHTS.map(([v, t]) => [t].concat([1, 2, 3].map((c) => m2(at(s, { children: c, nights: v }).weekly))));
  const title = site.fitTitle(`Child Maintenance on ${m0(s)} a Year — 1, 2 or 3 Children`, `Child Maintenance on ${m0(s)} a Year`);
  const desc = `On ${m0(s)} a year (${m2(w)} a week) the Child Maintenance Service rate is about ${m2(r1.weekly)} a week for 1 child, ${m2(r2.weekly)} for 2 and ${m2(r3.weekly)} for 3, before shared care or other children.`;
  const q = [
    [`How much child maintenance do you pay on ${m0(s)}?`, `About ${m2(r1.weekly)} a week (${m2(r1.month)} a month) for 1 child, ${m2(r2.weekly)} for 2 children and ${m2(r3.weekly)} for 3 or more, at the ${r1.rate} rate. ${m0(s)} a year is ${m2(w)} a week (÷ ${R.daysInYear} × 7). That's before any shared care or other children living with you.`],
    [`What if I have another child living with me?`, `One other child takes ${R.otherPct[0]}% off the income counted, so for 1 child it's ${m2(at(s, { others: 1 }).weekly)} a week instead of ${m2(r1.weekly)}.`],
    [`How much less is it if the child stays over?`, `With 104 to 155 nights a year, two-sevenths comes off: ${m2(at(s, { nights: 104 }).weekly)} a week for 1 child. At 175 nights or more it's halved and ${m0(R.halfExtra)} more comes off per child: ${m2(at(s, { nights: 175 }).weekly)}.`],
    ["Does pension come off my income?", "Contributions taken off through the payroll before tax are already left out of the HMRC figure. Others, such as personal pension payments, can be taken off if you ask and give the details."]
  ];
  const others = INCOMES.filter((x) => x !== s).map((x) => `<a href="${iurl(x)}">${m0(x)}</a>`).join(" ");
  return head(title, desc, u, [["Home", SITE + "/"], ["Child Maintenance Calculator", SITE + BASE], [m0(s), u]], q) + `    <header class="site-header">
      <a class="back-link" href="${BASE}">← Child maintenance calculator</a>
      <h1 class="page-title">Child maintenance on ${m0(s)} a year</h1>
      <p class="page-subtitle">About <strong>${m2(r1.weekly)} a week</strong> for 1 child, from a gross weekly income of ${m2(w)}.</p>
    </header>

${tool(s)}
    <main class="tool">
      <h2 class="tool-section-title">${m0(s)}: weekly child maintenance</h2>
${site.table(["Other children living with you", "1 child", "2 children", "3 or more"], grid, 620)}      <p class="tool-hint" style="margin-top:8px;">No shared care. Monthly figures are the weekly amount × 52 ÷ 12.</p>
      <h2 class="tool-section-title" style="margin-top:18px;">With shared care</h2>
${site.table(["Nights a year with the paying parent", "1 child", "2 children", "3 or more"], shared, 620)}      <p class="tool-hint" style="margin-top:8px;">A week, no other children, the same nights for each child.</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}${foot}
    </main>

    <div class="hub-group-title" style="margin-top:28px;">Other incomes</div>
    <p class="salary-links">${others}</p>

${site.FOOTER}
  </div>
${SCRIPT}
</body>
</html>
`;
}

function hub() {
  const u = SITE + BASE, ex = at(30000);
  const grid = INCOMES.map((s) => [`<a href="${iurl(s)}">${m0(s)}</a>`, m2(CM.weekly(R, s))].concat([1, 2, 3].map((c) => m2(at(s, { children: c }).weekly))));
  const title = site.fitTitle("Child Maintenance Calculator UK — CMS Weekly Amount", "Child Maintenance Calculator UK");
  const desc = `Work out child maintenance the way the Child Maintenance Service does: ${R.basicPct.join("%, ")}% of gross income for 1, 2 or 3 children, with other children and shared care. ${m0(30000)} a year is about ${m2(ex.weekly)} a week for 1 child.`;
  const q = [
    ["How is child maintenance calculated?", `From the paying parent's gross income: yearly income ÷ ${R.daysInYear} × 7 gives a weekly figure. From ${m0(R.basicFrom)} a week, it's ${R.basicPct[0]}% for 1 child, ${R.basicPct[1]}% for 2 and ${R.basicPct[2]}% for 3 or more on the first ${m0(R.band1)}, then ${R.abovePct.join("%, ")}% above, up to ${m0(R.cap)} a week. Other children and shared care reduce it.`],
    [`How much child maintenance do you pay on ${m0(30000)}?`, `About ${m2(ex.weekly)} a week (${m2(ex.month)} a month) for 1 child, ${m2(at(30000, { children: 2 }).weekly)} for 2 and ${m2(at(30000, { children: 3 }).weekly)} for 3, with no shared care or other children.`],
    ["What's the minimum child maintenance?", `${m0(R.flat)} a week: the flat rate, paid on gross income of ${m0(R.nilBelow)} to ${m0(R.reducedFrom)} a week or on most benefits. Below ${m0(R.nilBelow)} a week it's nil.`],
    ["How does shared care reduce child maintenance?", `From 52 nights a year, one-seventh comes off for each child; two-sevenths from 104 nights, three-sevenths from 156, and half plus ${m0(R.halfExtra)} a week from 175. It can't go below ${m0(R.flat)} a week.`],
    ["Is child maintenance based on gross or net income?", `Gross: income before tax and National Insurance, as HMRC has it. Pension contributions can be taken off, and anything over ${m0(R.cap)} a week is ignored (the receiving parent can apply to the courts for more).`]
  ];
  const app = { "@context": "https://schema.org", "@type": "WebApplication", name: "Child Maintenance Calculator", url: u, applicationCategory: "FinanceApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } };
  return head(title, desc, u, [["Home", SITE + "/"], ["Personal Finance", SITE + "/personal-finance/"], ["Child Maintenance Calculator", u]], q, app) + `    <header class="site-header">
      <a class="back-link" href="/personal-finance/">← Personal finance calculators</a>
      <h1 class="page-title">Child maintenance calculator</h1>
      <p class="page-subtitle">The weekly amount the Child Maintenance Service would work out, with other children and shared care.</p>
    </header>

${tool(30000)}
    <main class="tool">
      <h2 class="tool-section-title">Child maintenance by income</h2>
${site.table(["Income a year", "Gross a week", "1 child", "2 children", "3 or more"], grid, 620)}      <p class="tool-hint" style="margin-top:8px;">A week, no shared care or other children. Pick an income for more.</p>
    </main>

${explain}
    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}${foot}
    </main>

${related.block(BASE)}
${site.FOOTER}
  </div>
${SCRIPT}
</body>
</html>
`;
}

const urls = [[BASE, "0.6"]];
site.write("child-maintenance-calculator", hub());
INCOMES.forEach((s) => { site.write(`child-maintenance-calculator/${s}`, page(s)); urls.push([iurl(s), "0.5"]); });
site.sitemapBlock("child maintenance pages", "tools/build-child-maintenance-pages.js", urls);
console.log(`built the child maintenance calculator and ${INCOMES.length} income pages (${m0(30000)}, 1 child: ${m2(at(30000).weekly)} a week)`);
