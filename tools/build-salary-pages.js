#!/usr/bin/env node
/* Generate the /salary/<n>-after-tax/ landing pages.

   These pages exist to answer a search query — "25k after tax", "£30,000 after
   tax" — so the headline figures have to be in the HTML as text, not computed by
   script after the page loads. They are baked in at build time from the UK
   entry in the tax registry (data/tax/gb/), using tax-engine.js — the same
   file the page's live calculator runs, so the baked figures and the live ones
   cannot drift apart.

       node tools/build-salary-pages.js                 # rebuild every page
       node tools/build-salary-pages.js 25000 30000     # rebuild some

   Re-run it after any change to the UK tax data. */
const fs = require("fs");
const path = require("path");
const TaxEngine = require("../tax-engine.js");
const registry = require("./tax/registry.js");

const ROOT = registry.ROOT;

// The salaries with pages. Add to this list and re-run to create more; the
// cross-links between pages are generated from it, so they stay consistent.
const SALARIES = [25000, 30000, 40000];

const JURISDICTION = "gb";

// ---------------------------------------------------------------- figures

function compute(gross, chain) {
  const r = TaxEngine.compute(chain, gross);
  const tax = r.charges.find((c) => c.id === "gb-income-tax");
  const ni = r.charges.find((c) => c.id === "gb-ni");
  return {
    gross: gross,
    allowance: r.values["gb-personal-allowance"],
    taxable: r.values["gb-taxable"],
    income_tax: tax.amount,
    tax_rows: tax.rows,
    ni: ni.amount,
    ni_rows: ni.rows,
    deductions: r.totalDeductions,
    net: r.net,
    per_month: r.perMonth,
    per_week: r.perWeek,
    per_day: r.perDay,
    deduction_rate: r.deductionRate,
    marginal: r.marginalRate
  };
}

// ---------------------------------------------------------------- formatting

function money(v) {
  return "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function money0(v) {
  return "£" + v.toLocaleString("en-GB", { maximumFractionDigits: 0 });
}

/* One decimal place, always shown — "16.0", not "16" */
function oneDp(v) {
  return (Math.round(v * 10) / 10).toFixed(1);
}

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function niceDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const months = ["January", "February", "March", "April", "May", "June", "July",
    "August", "September", "October", "November", "December"];
  return d + " " + months[m - 1] + " " + y;
}

// ---------------------------------------------------------------- page

const FOOTER = `    <footer class="site-footer">
      <p class="footer-categories">
        <a href="/general/">General</a>
        <a href="/business-analysis/">Business &amp; Analysis</a>
        <a href="/savings-investing/">Savings &amp; Investing</a>
        <a href="/everyday/">Everyday</a>
        <a href="/home-diy/">Home &amp; DIY</a>
        <a href="/betting-odds/">Betting &amp; Odds</a>
        <a href="/other/">Other</a>
      </p>
      <p>Built with plain HTML, CSS &amp; JavaScript — all calculations run locally in your browser.</p>
      <p><a href="/about/">About this site</a></p>
    </footer>`;

function faqs(gross, r, cfg) {
  return [
    [
      `How much is ${money0(gross)} after tax?`,
      `A ${money0(gross)} salary leaves ${money(r.net)} a year after income tax and National Insurance, ` +
      `which is ${money(r.per_month)} a month or about ${money(r.per_week)} a week. Income tax takes ${money(r.income_tax)} and National ` +
      `Insurance takes ${money(r.ni)}, so ${oneDp(r.deduction_rate)}% of the gross never reaches your account. That ` +
      "assumes the standard personal allowance, no pension contributions and no " +
      "student loan — each of those changes the figure."
    ],
    [
      `How much is ${money0(gross)} a year per month after tax?`,
      `${money(r.per_month)} a month. That is the annual take-home of ${money(r.net)} divided by twelve. If you are ` +
      "paid monthly this is roughly what lands in your account, though the first " +
      "month of a new job or a mid-year pay rise can differ while PAYE catches up — " +
      "it works on a cumulative basis across the year rather than treating each " +
      "month separately."
    ],
    [
      `How much income tax do you pay on ${money0(gross)}?`,
      `${money(r.income_tax)}. The first ${money0(cfg.personalAllowance)} is the personal allowance and is not taxed at all. That ` +
      `leaves ${money0(r.taxable)} of taxable income, charged at ${r.tax_rows.length ? r.tax_rows[0].rate : 0}%. Income tax and National ` +
      "Insurance are separate deductions with separate rules, which is why the " +
      "total taken is more than the tax figure alone."
    ],
    [
      "Is this the same in Scotland?",
      "No. Scotland sets its own income tax bands and rates, and they differ from " +
      "England, Wales and Northern Ireland at almost every salary. National " +
      "Insurance is identical UK-wide, so the NI figure above holds, but the income " +
      "tax will not. The figures on this page are for England, Wales and Northern " +
      "Ireland only."
    ],
    [
      "Does this include pension contributions or a student loan?",
      "No, and both will reduce your take-home. A workplace pension is typically " +
      "deducted before tax, so it lowers your taxable pay as well as your net pay. " +
      "A student loan is taken as a percentage of earnings above a threshold that " +
      "depends on which plan you are on. Either can be worth hundreds of pounds a " +
      "year, so treat the figure here as take-home before those are applied."
    ],
    [
      `What is the marginal rate on ${money0(gross)}?`,
      `${Math.round(r.marginal)}% — that is what is taken from the next pound you earn, as opposed to the ` +
      `${oneDp(r.deduction_rate)}% taken from your salary overall. The two differ because the personal ` +
      "allowance is tax-free, which pulls the average down below the rate you are " +
      "actually charged at the top of your income. The marginal rate is the one " +
      "that matters when weighing a pay rise or overtime."
    ]
  ];
}

function build(gross, chain, cfg, allSalaries) {
  const r = compute(gross, chain);
  const slug = `${gross}-after-tax`;
  const url = `https://lotsofcalcs.com/salary/${slug}/`;
  const title = `${money0(gross)} After Tax — Take-Home Pay ${cfg.taxYear}`;
  const desc = `${money0(gross)} a year is ${money(r.net)} after tax and National Insurance — ${money(r.per_month)} a month. Full ` +
    `breakdown of the deductions for the ${cfg.taxYear} tax year.`;

  const q = faqs(gross, r, cfg);

  const ld = [
    {
      "@context": "https://schema.org", "@type": "WebPage",
      name: title, description: desc, url: url,
      isPartOf: { "@type": "WebSite", name: "Lots Of Calcs", url: "https://lotsofcalcs.com/" }
    },
    {
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://lotsofcalcs.com/" },
        { "@type": "ListItem", position: 2, name: "Salary after tax", item: "https://lotsofcalcs.com/salary/" },
        { "@type": "ListItem", position: 3, name: `${money0(gross)} after tax`, item: url }
      ]
    },
    {
      "@context": "https://schema.org", "@type": "FAQPage",
      mainEntity: q.map(([a, b]) => ({ "@type": "Question", name: a, acceptedAnswer: { "@type": "Answer", text: b } }))
    }
  ];
  const ldJson = JSON.stringify(ld, null, 2).replace(/</g, "\\u003C");

  // ---- band breakdown rows ----
  const row = (x) => `<tr><td>${esc(x.label)}</td><td>${x.rate}%</td><td>${money0(x.amount)}</td><td>${money(x.charged)}</td></tr>`;
  const taxRows = r.tax_rows.map(row).join("");
  const niRows = r.ni_rows.filter((x) => x.rate > 0).map(row).join("");

  // ---- cross-links to sibling salaries ----
  const sib = allSalaries.filter((s) => s !== gross).map((s) => {
    const o = compute(s, chain);
    return "      <a class=\"hub-card\" href=\"/salary/" + s + "-after-tax/\">\n" +
      "        <span class=\"icon\">💷</span>\n" +
      "        <div class=\"title\">" + money0(s) + " after tax</div>\n" +
      "        <div class=\"desc\">" + money0(o.net) + " a year, " + money0(o.per_month) + " a month.</div>\n" +
      "      </a>\n";
  }).join("");

  const faqHtml = q.map(([a, b]) => `      <p class="faq-q">${esc(a)}</p>\n      <p class="about-text">${esc(b)}</p>\n`).join("");

  const ratesLine = `Figures use the <strong>${cfg.taxYear}</strong> tax year, which runs from ${niceDate(cfg.taxYearStart)} to ${niceDate(cfg.taxYearEnd)}, ` +
    `for <strong>${esc(cfg.appliesTo)}</strong>. ` +
    (cfg.lastVerified ? `Rates last checked ${niceDate(cfg.lastVerified)}.`
      : "These rates have not been verified against HMRC directly — check <a href=\"https://www.gov.uk/income-tax-rates\" " +
        "rel=\"nofollow noopener\" target=\"_blank\">gov.uk</a> before relying on them.");

  const firstRate = r.tax_rows.length ? r.tax_rows[0].rate : 0;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<script src="/consent.js"></script>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Lots Of Calcs">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="https://lotsofcalcs.com/og-image.jpg">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="https://lotsofcalcs.com/og-image.jpg">
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="icon" type="image/png" sizes="192x192" href="/favicon-192.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta name="theme-color" content="#1f2233">
<link rel="stylesheet" href="/styles.css">
<script type="application/ld+json">
${ldJson}
</script>
</head>
<body>
  <div class="page">
    <header class="site-header">
      <a class="back-link" href="/">← All calculators</a>
      <h1 class="page-title">${money0(gross)} after tax</h1>
      <p class="page-subtitle">What a ${money0(gross)} salary actually leaves you, in the ${cfg.taxYear} tax year.</p>
    </header>

    <main class="tool">
      <div class="result-box" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="hero-net">${money(r.net)}</div>
          <div class="label">Take-home pay, a year</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row highlight"><span class="r-label">A month</span><span class="r-value" id="out-month">${money(r.per_month)}</span></div>
          <div class="result-row"><span class="r-label">A week</span><span class="r-value" id="out-week">${money(r.per_week)}</span></div>
          <div class="result-row"><span class="r-label">A working day</span><span class="r-value" id="out-day">${money(r.per_day)}</span></div>
        </div>
      </div>

      <p class="about-text" style="margin-top:18px;">A salary of <strong>${money0(gross)}</strong> leaves <strong>${money(r.net)}</strong> a year once income tax and National Insurance are taken off &mdash; <strong>${money(r.per_month)}</strong> a month. The deductions come to ${money(r.deductions)}, or ${oneDp(r.deduction_rate)}% of the gross.</p>

      <p class="tool-section-title" style="margin-top:22px;">Where it goes</p>
      <div class="result-box">
        <div class="result-grid">
          <div class="result-row"><span class="r-label">Gross salary</span><span class="r-value" id="out-gross">${money0(gross)}</span></div>
          <div class="result-row"><span class="r-label">Personal allowance (tax-free)</span><span class="r-value" id="out-allowance">${money(r.allowance)}</span></div>
          <div class="result-row"><span class="r-label">Taxable income</span><span class="r-value" id="out-taxable">${money(r.taxable)}</span></div>
          <div class="result-row"><span class="r-label">− Income tax</span><span class="r-value" id="out-tax">${money(r.income_tax)}</span></div>
          <div class="result-row"><span class="r-label">− National Insurance</span><span class="r-value" id="out-ni">${money(r.ni)}</span></div>
          <div class="result-row highlight"><span class="r-label">Take-home pay</span><span class="r-value" id="out-net">${money(r.net)}</span></div>
        </div>
      </div>

      <p class="tool-section-title" style="margin-top:22px;">Try a different salary</p>
      <div class="field" style="max-width:320px;">
        <label for="salary">Gross annual salary</label>
        <input type="number" id="salary" value="${gross}" step="any" min="0" placeholder="0">
      </div>
      <p class="tool-hint" id="salary-error" role="alert" style="color: var(--bad); display: none;"></p>
      <p class="tool-hint" id="salary-note">Change the figure and everything above updates. The page itself still describes ${money0(gross)}.</p>

      <p class="tool-section-title" style="margin-top:22px;">The bands, line by line</p>
      <div class="table-scroll">
        <div style="min-width:420px;">
          <table class="out-table">
            <thead><tr><th>Band</th><th>Rate</th><th>Amount in band</th><th>Charged</th></tr></thead>
            <tbody>
              <tr><td>Personal allowance</td><td>0%</td><td>${money0(r.allowance)}</td><td>£0.00</td></tr>
              ${taxRows}
              ${niRows}
            </tbody>
          </table>
        </div>
      </div>
      <p class="tool-hint" style="margin-top:12px;">Income tax is charged on taxable income &mdash; your salary after the personal allowance. National Insurance is charged on the gross salary instead, using its own thresholds, which is why the two are listed separately rather than added into one rate.</p>

      <p class="tool-hint" style="margin-top:14px;">${ratesLine}</p>
      <p class="tool-hint">Assumes the standard tax code and personal allowance, no pension contributions, no student loan repayments, no benefits in kind and no other income. A working day is taken as one of 260 in a year. This is an estimate, not a payslip.</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">How ${money0(gross)} after tax is worked out</p>
      <p class="about-text">Two separate deductions come out of a salary, and they work differently enough that adding them into a single percentage would be misleading.</p>
      <p class="about-text"><strong>Income tax</strong> ignores the first ${money0(r.allowance)} entirely &mdash; the personal allowance. On ${money0(gross)} that leaves ${money0(r.taxable)} of taxable income, charged at ${firstRate}%, giving ${money(r.income_tax)}. The allowance is the reason the headline rate overstates what you actually pay: the effective rate across the whole salary is lower than the band rate, because a chunk of your income was never taxed.</p>
      <p class="about-text"><strong>National Insurance</strong> is charged on gross pay rather than taxable income, with its own threshold at ${money0(cfg.niThreshold)}. On this salary it comes to ${money(r.ni)}. It happens to share a threshold with the personal allowance at the moment, which makes the two look like one deduction — they are not, and they have diverged before.</p>
      <p class="about-text">The difference between the two numbers people quote matters here. Your <strong>effective rate</strong> on ${money0(gross)} is ${oneDp(r.deduction_rate)}% &mdash; what is taken across the whole salary. Your <strong>marginal rate</strong> is ${Math.round(r.marginal)}% &mdash; what is taken from the next pound you earn. When you are weighing a pay rise, overtime or a second job, the marginal rate is the number that applies, and it is always the higher of the two.</p>
      <p class="about-text">Monthly pay is shown as a twelfth of the annual figure. Real payslips can differ, particularly in the first months of a new job or after a mid-year rise, because PAYE works cumulatively across the tax year rather than treating each month in isolation. It evens out by the end of the year.</p>
      <p class="about-text">What this leaves out is worth being clear about, because each item is real money. Pension contributions are usually taken before tax, so they reduce both your taxable pay and your take-home. Student loan repayments are a percentage of earnings above a plan-specific threshold. Salary sacrifice, company cars and medical insurance all change the picture. And Scotland sets its own income tax bands, so none of the tax figures here apply there &mdash; though the National Insurance does.</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">Frequently asked questions</p>
${faqHtml}    </main>

    <div class="hub-group-title" style="margin-top:28px;">Other salaries</div>
    <div class="hub-grid">
${sib}      <a class="hub-card" href="/vat/">
        <span class="icon">🧾</span>
        <div class="title">Tax / VAT Calculator</div>
        <div class="desc">Add or remove VAT, plus a custom income tax band split.</div>
      </a>
    </div>

${FOOTER}
  </div>
  <script src="/tax-engine.js"></script>
  <script src="/salary-after-tax.js"></script>
</body>
</html>
`;
}

function main() {
  const chain = registry.loadChain(JURISDICTION);
  const doc = chain[chain.length - 1];
  const ni = doc.items.find((it) => it.id === "gb-ni");
  const cfg = {
    taxYear: doc.taxYear.label,
    taxYearStart: doc.taxYear.start,
    taxYearEnd: doc.taxYear.end,
    appliesTo: doc.appliesTo,
    lastVerified: doc.lastVerified,
    // The full allowance is what applies on a salary with no taper
    personalAllowance: TaxEngine.compute(chain, 0).values["gb-personal-allowance"],
    niThreshold: ni.charge.brackets[1][0]
  };
  const args = process.argv.slice(2).map(Number);
  const wanted = args.length ? args : SALARIES;

  wanted.forEach((gross) => {
    if (SALARIES.indexOf(gross) === -1) {
      console.log(`!! ${gross} is not in SALARIES; add it there so cross-links include it`);
    }
    const dir = path.join(ROOT, "salary", `${gross}-after-tax`);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "index.html"), build(gross, chain, cfg, SALARIES));
    const r = compute(gross, chain);
    console.log(`built /salary/${gross}-after-tax/  net ${money(r.net)}  (${money(r.per_month)}/mo)`);
  });
}

main();
