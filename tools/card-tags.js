/* Country tags on calculator cards: a small "UK", "US" or "Canada" label on
   calculators that only apply in one country, so nobody elsewhere mistakes
   them for theirs. Calculators that work anywhere, or cover several
   countries (salary, inflation, mortgage affordability), have none.

   Applied by tools/related.js to the cards on every page (homepage,
   category hubs and related blocks); add a calculator here when it's
   country-specific and re-run node tools/related.js. */
const TAGS = {
  "/stamp-duty-calculator/": "UK",
  "/self-employed-tax-calculator/": "UK",
  "/payments-on-account-calculator/": "UK",
  "/self-assessment-penalty-calculator/": "UK",
  "/child-benefit-tax-charge-calculator/": "UK",
  "/marriage-allowance-calculator/": "UK",
  "/tax-code-checker/": "UK",
  "/salary-sacrifice-calculator/": "UK",
  "/pension-tax-relief-calculator/": "UK",
  "/isa-vs-pension/": "UK",
  "/heating-cost/": "UK",
  "/running-cost/": "UK",
  "/working-days/": "UK",
  "/dry-january-calculator/": "UK",
  "/student-loan-calculator/": "UK",
  "/degree-classification-calculator/": "UK",
  "/pension-drawdown-calculator/": "UK",
  "/buy-to-let-calculator/": "UK",
  "/inheritance-tax-calculator/": "UK",
  "/capital-gains-tax-calculator/": "UK",
  "/holiday-entitlement-calculator/": "UK",
  "/redundancy-pay-calculator/": "UK",
  "/maternity-pay-calculator/": "UK",
  "/contractor-calculator/": "UK",
  "/salary-vs-dividends/": "UK",
  "/dividend-tax-calculator/": "UK",
  "/roth-vs-traditional/": "US",
  "/tfsa-vs-rrsp/": "Canada",
  "/30-percent-ruling-calculator/": "NL",
  "/beckham-law-calculator/": "Spain"
};
const NAMES = { UK: "United Kingdom", US: "United States", Canada: "Canada", NL: "Netherlands", Spain: "Spain" };
const span = (href) => (TAGS[href] ? `<span class="card-tag" title="For ${/^(United|Netherlands)/.test(NAMES[TAGS[href]]) ? "the " : ""}${NAMES[TAGS[href]]}">${TAGS[href]}</span>` : "");

/* Rewrites every hub card in an HTML string to carry its tag (or none) */
function apply(html) {
  return html.replace(/(<a class="hub-card" href="([^"]+)">)([\s\S]*?)(\n?\s*<\/a>)/g, (m, open, href, body, close) => {
    const clean = body.replace(/\s*<span class="card-tag"[^>]*>[^<]*<\/span>/g, "");
    const tag = span(href);
    return open + clean + (tag ? `\n        ${tag}` : "") + close;
  });
}

module.exports = { TAGS, span, apply };
