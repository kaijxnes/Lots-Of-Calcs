#!/usr/bin/env node
/* Builds the three "tax now or tax later" calculators with their examples
   worked out in the HTML, using tax-wrapper.js:

       /isa-vs-pension/        UK: stocks and shares ISA or pension
       /roth-vs-traditional/   US: Roth or traditional 401(k)/IRA
       /tfsa-vs-rrsp/          Canada: TFSA or RRSP

       node tools/build-tax-wrappers.js

   The comparison itself depends only on the visitor's own tax rates; the
   allowances and limits quoted on each page are sourced in PAGES below and
   need checking each new tax year. */
const site = require("./lib/site.js");
const related = require("./related.js");
const TW = require("../tax-wrapper.js");
const { esc, SITE } = site;

const PAGES = [
  {
    path: "isa-vs-pension", symbol: "£", currency: "GBP", free: "ISA", deferred: "pension", taxFree: 25, employerField: true,
    name: "ISA vs Pension Calculator",
    title: "ISA vs Pension Calculator — Which Leaves You More After Tax?",
    h1: "ISA vs pension calculator",
    sub: "The same monthly cost to you, in a stocks and shares ISA or a pension, compared after tax.",
    D: { monthly: 200, years: 25, rate: 5, taxNow: 20, taxLater: 20, employer: 0 },
    nowLabel: "Your income tax rate now (%)", nowHint: "20 basic, 40 higher, 45 additional (Scotland differs)",
    laterLabel: "Tax rate on pension income later (%)", laterHint: "Most retirees pay 20% or less",
    nowRates: [20, 40, 45], laterRates: [0, 20, 40],
    limits: [
      "ISA: up to £20,000 a year in total across your ISAs (2026/27), and withdrawals are tax-free at any time.",
      "Pension: tax relief at your highest rate on contributions up to the £60,000 annual allowance (or your earnings, if lower). You can usually take money out from 55 — 57 from April 2028.",
      "Up to 25% of a pension can be taken tax-free, within the £268,275 lump sum allowance; the rest is taxed as income."
    ],
    extra: "With relief at source, your provider adds basic-rate relief to what you pay and higher-rate taxpayers claim the rest through self assessment; with net pay or salary sacrifice it comes off before tax. Salary sacrifice also saves National Insurance, which makes the pension better still — this calculator leaves that out. Employer contributions only go into a pension, so any you get tip the result that way.",
    sources: [["GOV.UK — Individual Savings Accounts", "https://www.gov.uk/individual-savings-accounts"], ["GOV.UK — Pension schemes rates and allowances", "https://www.gov.uk/government/publications/rates-and-allowances-pension-schemes/pension-schemes-rates"], ["GOV.UK — Tax on your private pension contributions", "https://www.gov.uk/tax-on-your-private-pension/pension-tax-relief"]],
    related: ["/compound-interest/", "/salary/", "/savings-goal/", "/fund-fees/", "/inflation/", "/roth-vs-traditional/"],
    investing: "/investing/"
  },
  {
    path: "roth-vs-traditional", symbol: "$", currency: "USD", free: "Roth", deferred: "traditional account", taxFree: 0, employerField: false,
    name: "Roth vs Traditional Calculator",
    title: "Roth vs Traditional 401(k) & IRA Calculator — Which Is Better for You?",
    h1: "Roth vs traditional calculator",
    sub: "The same paycheck cost in a Roth or a traditional 401(k) or IRA, compared after tax in retirement.",
    D: { monthly: 500, years: 30, rate: 6, taxNow: 22, taxLater: 12, employer: 0 },
    nowLabel: "Your tax rate now (%)", nowHint: "Your federal bracket plus state rate",
    laterLabel: "Your tax rate in retirement (%)", laterHint: "On withdrawals from the traditional account",
    nowRates: [12, 22, 24, 32], laterRates: [10, 12, 22, 24],
    limits: [
      "401(k), 403(b) and 457 plans: up to $24,500 of your own contributions in 2026, Roth and traditional combined, plus an $8,000 catch-up from age 50 ($11,250 at 60 to 63).",
      "IRAs: up to $7,500 in 2026 across Roth and traditional IRAs, plus $1,100 from age 50.",
      "Roth IRA contributions phase out between $153,000 and $168,000 of modified AGI for single filers ($242,000 to $252,000 married filing jointly) in 2026."
    ],
    extra: "This compares the same cost to your paycheck: a traditional contribution is made before tax, so it can be larger — $500 out of take-home at a 22% rate funds about $641 of traditional contributions. If you instead put the same dollar amount into each, the Roth holds more after-tax money. Employer matches go in pre-tax either way, so they don't change the comparison.",
    sources: [["IRS — 401(k) limit increases to $24,500 for 2026, IRA limit increases to $7,500", "https://www.irs.gov/newsroom/401k-limit-increases-to-24500-for-2026-ira-limit-increases-to-7500"], ["IRS Notice 2025-67 — 2026 retirement plan amounts", "https://www.irs.gov/pub/irs-drop/n-25-67.pdf"]],
    related: ["/compound-interest/", "/salary/", "/savings-goal/", "/fund-fees/", "/inflation/", "/tfsa-vs-rrsp/"],
    investing: "/investing/us/"
  },
  {
    path: "tfsa-vs-rrsp", symbol: "$", currency: "CAD", free: "TFSA", deferred: "RRSP", taxFree: 0, employerField: false,
    name: "TFSA vs RRSP Calculator",
    title: "TFSA vs RRSP Calculator — Which Saves You More Tax?",
    h1: "TFSA vs RRSP calculator",
    sub: "The same cost to you in a TFSA or an RRSP (with the refund reinvested), compared after tax.",
    D: { monthly: 500, years: 25, rate: 5, taxNow: 30, taxLater: 20, employer: 0 },
    nowLabel: "Your marginal tax rate now (%)", nowHint: "Federal and provincial combined",
    laterLabel: "Your tax rate on withdrawals (%)", laterHint: "When you draw from the RRSP or RRIF",
    nowRates: [20, 30, 40, 50], laterRates: [20, 30, 40],
    limits: [
      "TFSA: $7,000 of new room in 2026. Unused room carries forward from 2009 (or the year you turned 18), and withdrawals are added back the next year.",
      "RRSP: 18% of the previous year's earned income, up to $33,810 for 2026, less any pension adjustment; unused room carries forward.",
      "RRSP withdrawals are taxed as income; by the end of the year you turn 71 the RRSP has to become a RRIF or an annuity."
    ],
    extra: "The comparison assumes the RRSP refund is invested too — $500 from take-home at a 30% rate funds about $714 of RRSP contributions. If the refund gets spent, the TFSA usually comes out ahead. RRSP withdrawals can also reduce income-tested benefits such as OAS and GIS, which this leaves out.",
    sources: [["CRA — MP, DB, RRSP, DPSP, ALDA, TFSA limits", "https://www.canada.ca/en/revenue-agency/services/tax/registered-plans-administrators/pspa/mp-rrsp-dpsp-tfsa-limits-ympe.html"], ["CRA — Calculate your TFSA contribution room", "https://www.canada.ca/en/revenue-agency/services/tax/individuals/topics/tax-free-savings-account/contributing/calculate-room.html"]],
    related: ["/compound-interest/", "/salary/", "/savings-goal/", "/fund-fees/", "/inflation/", "/roth-vs-traditional/"],
    investing: "/investing/us/"
  }
];

function field(id, label, value, hint) {
  return `        <div class="field">
          <label for="tw-${id}">${label}</label>
          <input type="number" id="tw-${id}" value="${value}" step="any" min="0" inputmode="decimal">${hint ? `\n          <p class="tool-hint" style="margin-top:4px;">${hint}</p>` : ""}
        </div>`;
}

function build(P) {
  const m = (v) => P.symbol + Math.round(v).toLocaleString("en-GB");
  const D = P.D;
  const r = TW.compare(Object.assign({ taxFree: P.taxFree }, D));
  const url = SITE + "/" + P.path + "/";
  const winnerText = r.winner === "same" ? "about the same either way" : `${m(Math.abs(r.deferred - r.free))} more in the ${r.winner === "free" ? P.free : P.deferred}`;
  const desc = `Compare a ${P.free} with a ${P.deferred} for the same cost to you. ${m(D.monthly)} a month for ${D.years} years at ${D.rate}%, taxed at ${D.taxNow}% now and ${D.taxLater}% later, leaves ${winnerText}.`;

  const matrix = P.nowRates.map((now) => [`${now}% now`].concat(P.laterRates.map((later) => {
    const x = TW.compare(Object.assign({}, D, { taxNow: now, taxLater: later, employer: 0, taxFree: P.taxFree }));
    if (x.winner === "same") return "Same";
    return (x.winner === "free" ? P.free : P.deferred.replace(/^traditional account$/, "Traditional")) + " +" + m(Math.abs(x.deferred - x.free));
  })));
  const be = r.breakEven;
  const q = [
    [`Is a ${P.free} or a ${P.deferred} better?`,
      `It comes down to your tax rate now against your tax rate when you take the money out. For the same cost to you, the ${P.deferred} wins if you'll pay less tax later than you save now${P.taxFree ? ", and the 25% tax-free part tips it further" : ""}; the ${P.free} wins if you'll pay more. At ${D.taxNow}% now the two break even at about ${be.toFixed(1)}% later. In the example, ${m(D.monthly)} a month for ${D.years} years leaves ${m(r.free)} in the ${P.free} and ${m(r.deferred)} from the ${P.deferred} after tax.`],
    ["Why does the same monthly amount buy a bigger contribution?",
      `Because ${P.deferred} contributions are made before tax. Paying ${m(D.monthly)} from take-home at a ${D.taxNow}% rate funds ${m(r.grossMonthly)} a month of contributions, so the ${P.deferred} grows to ${m(r.pot)} — but ${m(r.deferredTax)} of that is tax when it comes out.`],
    ["What are the limits?", P.limits.join(" ")],
    [`Should I just use both?`, `Many people do: the ${P.deferred} for money taxed at a high rate now, the ${P.free} for flexibility, since ${P.free === "ISA" ? "ISA money can be taken out at any time" : P.free === "TFSA" ? "TFSA withdrawals are tax-free and the room comes back" : "Roth contributions (not earnings) can be taken out at any time"}. If you aren't sure what your tax rate will be later, splitting between them hedges the guess.`]
  ];
  const ld = [
    site.webPage(P.title, desc, url),
    site.breadcrumb([["Home", SITE + "/"], ["Savings & Investing", SITE + "/savings-investing/"], [P.name, url]]),
    { "@context": "https://schema.org", "@type": "WebApplication", name: P.name, url: url, applicationCategory: "FinanceApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: P.currency } },
    site.faqLd(q)
  ];
  return site.head({ title: P.title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="/">← All calculators</a>
      <h1 class="page-title">${esc(P.h1)}</h1>
      <p class="page-subtitle">${esc(P.sub)}</p>
    </header>

    <main class="tool" id="tw-tool" data-symbol="${P.symbol}" data-tax-free="${P.taxFree}" data-free="${esc(P.free)}" data-deferred="${esc(P.deferred)}">
      <div class="field-row">
${field("monthly", `You pay in a month (${P.symbol}, from take-home)`, D.monthly)}
${field("years", "Years until you take it out", D.years)}
      </div>
      <div class="field-row">
${field("rate", "Investment return (% a year)", D.rate, "After fees; an example, not a forecast")}
${P.employerField ? field("employer", `Employer adds to the pension (${P.symbol} a month)`, D.employer) : ""}
      </div>
      <div class="field-row">
${field("taxNow", P.nowLabel, D.taxNow, P.nowHint)}
${field("taxLater", P.laterLabel, D.taxLater, P.laterHint)}
      </div>
      <p class="tool-hint" id="tw-error" role="alert" style="color: var(--bad); display: none;"></p>

      <div class="result-box" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="tw-verdict">${r.winner === "same" ? "About the same" : m(Math.abs(r.deferred - r.free)) + " more"}</div>
          <div class="label" id="tw-verdict-label">${r.winner === "same" ? "either way, after tax" : "after tax in the " + esc(r.winner === "free" ? P.free : P.deferred)}</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row"><span class="r-label">${esc(P.free)}: yours after tax</span><span class="r-value" id="tw-free">${m(r.free)}</span></div>
          <div class="result-row"><span class="r-label">${esc(P.deferred[0].toUpperCase() + P.deferred.slice(1))}: paid in</span><span class="r-value" id="tw-gross">${m(r.grossMonthly + D.employer)} a month</span></div>
          <div class="result-row"><span class="r-label">${esc(P.deferred[0].toUpperCase() + P.deferred.slice(1))}: grows to</span><span class="r-value" id="tw-pot">${m(r.pot)}</span></div>
          <div class="result-row"><span class="r-label">Less tax when it comes out</span><span class="r-value" id="tw-deferred-tax">${m(r.deferredTax)}</span></div>
          <div class="result-row highlight"><span class="r-label">${esc(P.deferred[0].toUpperCase() + P.deferred.slice(1))}: yours after tax</span><span class="r-value" id="tw-deferred">${m(r.deferred)}</span></div>
          <div class="result-row"><span class="r-label">Your own money paid in</span><span class="r-value" id="tw-paid">${m(r.paid)}</span></div>
        </div>
      </div>
      <p class="tool-hint" style="margin-top:12px;">Figures are not adjusted for inflation, and both accounts are assumed to earn the same return after fees.</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">Which wins at different tax rates</p>
      <p class="about-text">${m(D.monthly)} a month for ${D.years} years at ${D.rate}%, by your tax rate now (rows) and when the money comes out (columns)${P.taxFree ? ", with 25% of the pension taken tax-free" : ""}:</p>
${site.table(["Tax rate"].concat(P.laterRates.map((l) => `${l}% later`)), matrix, 460)}      <p class="tool-section-title" style="margin-top:22px;">How it works</p>
      <p class="about-text">${esc(P.extra)}</p>
      <p class="tool-section-title" style="margin-top:22px;">Limits for 2026</p>
${P.limits.map((l) => `      <p class="about-text">${esc(l)}</p>`).join("\n")}
      <p class="tool-hint" style="margin-top:12px;">Sources: ${P.sources.map(([t, u]) => `<a href="${u}" rel="noopener">${esc(t)}</a>`).join("; ")}. See also <a href="${P.investing}">what monthly investing could grow to</a>.</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">Frequently asked questions</p>
${site.faqHtml(q)}    </main>

${related.block("/" + P.path + "/")}
${site.FOOTER}
  </div>
  <script src="/tax-wrapper.js"></script>
</body>
</html>
`;
}

module.exports = { PAGES };
if (require.main === module) {
  PAGES.forEach((P) => {
    site.write(P.path, build(P));
    const r = TW.compare(Object.assign({ taxFree: P.taxFree }, P.D));
    console.log(P.path, "free", Math.round(r.free), "deferred", Math.round(r.deferred), "break-even", r.breakEven.toFixed(1));
  });
}
