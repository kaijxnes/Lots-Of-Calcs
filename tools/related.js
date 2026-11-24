#!/usr/bin/env node
/* "Related calculators" at the foot of every calculator page.

       node tools/related.js

   Which pages relate to which is set in RELATED below. Each card's icon,
   title and description are read from the homepage's cards, so a calculator
   is described the same way everywhere. The block sits between marker
   comments, so re-running replaces it rather than adding another; a page's
   older hand-written block is replaced the first time. /salary/ is generated
   by tools/build-tax-pages.js, which calls block() from here.

   The first five listed are shown, followed by a link to the page's own
   category, so one grid covers both "what else might help" and "more like
   this". It replaces the "More <category> calculators" grid pages used to
   carry separately. */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const tags = require("./card-tags.js");

const RELATED = {
  "/degree-classification-calculator/": ["/grade/", "/student-loan-calculator/", "/percent/", "/weighted-average/", "/salary/", "/days-until/"],
  "/protein-calculator/": ["/calorie-calculator/", "/one-rep-max/", "/bmi/", "/body-fat-calculator/", "/cups-to-grams/", "/heart-rate-zones/"],
  "/one-rep-max/": ["/protein-calculator/", "/body-fat-calculator/", "/calorie-calculator/", "/heart-rate-zones/", "/bmi/", "/pace/"],
  "/body-fat-calculator/": ["/bmi/", "/calorie-calculator/", "/protein-calculator/", "/heart-rate-zones/", "/one-rep-max/", "/pace/"],
  "/heart-rate-zones/": ["/calorie-calculator/", "/pace/", "/bmi/", "/body-fat-calculator/", "/one-rep-max/", "/sleep-calculator/"],
  "/speed-distance-time/": ["/fuel-cost/", "/pace/", "/unit-converter/", "/how-long-to-get-to/", "/ev-charging-cost/", "/timezone/"],
  "/square-footage-calculator/": ["/tile-calculator/", "/coverage/", "/concrete-calculator/", "/unit-converter/", "/btu/", "/percent/"],
  "/recipe-scaler/": ["/cups-to-grams/", "/oven-temperature-converter/", "/air-fryer-conversion/", "/split-bill/", "/fractions/", "/unit-converter/"],
  "/tile-calculator/": ["/square-footage-calculator/", "/coverage/", "/concrete-calculator/", "/unit-converter/", "/btu/", "/household-bills/", "/percent/"],
  "/concrete-calculator/": ["/tile-calculator/", "/coverage/", "/unit-converter/", "/btu/", "/watts-amps-volts/", "/household-bills/"],
  "/due-date-calculator/": ["/maternity-pay-calculator/", "/days-from-today/", "/calorie-calculator/", "/bmi/", "/sleep-calculator/", "/date-diff/"],
  "/air-fryer-conversion/": ["/oven-temperature-converter/", "/cups-to-grams/", "/turkey-cooking-time/", "/running-cost/", "/calorie-calculator/", "/unit-converter/"],
  "/oven-temperature-converter/": ["/air-fryer-conversion/", "/cups-to-grams/", "/turkey-cooking-time/", "/unit-converter/", "/calorie-calculator/", "/split-bill/"],
  "/day-of-the-week/": ["/birthday/", "/date-diff/", "/days-from-today/", "/week-number/", "/days-until/", "/working-days/"],
  "/week-number/": ["/days-from-today/", "/working-days/", "/date-diff/", "/day-of-the-week/", "/days-until/", "/biweekly-pay-schedule/"],
  "/days-from-today/": ["/date-diff/", "/working-days/", "/days-until/", "/week-number/", "/birthday/", "/day-of-the-week/"],
  "/hours-calculator/": ["/hourly-to-salary/", "/overtime-calculator/", "/working-days/", "/date-diff/", "/salary/", "/timezone/"],
  "/currency-converter/": ["/vat/", "/percent/", "/tip/", "/split-bill/", "/inflation/", "/fuel-cost/"],
  "/buy-to-let-calculator/": ["/stamp-duty-calculator/", "/mortgage-calculator/", "/capital-gains-tax-calculator/", "/rent-vs-buy/", "/mortgage-affordability/", "/loan-repayment/"],
  "/pension-drawdown-calculator/": ["/isa-vs-pension/", "/fire-calculator/", "/compound-interest/", "/inheritance-tax-calculator/", "/inflation/", "/savings-goal/"],
  "/inheritance-tax-calculator/": ["/capital-gains-tax-calculator/", "/pension-drawdown-calculator/", "/isa-vs-pension/", "/rent-vs-buy/", "/compound-interest/", "/savings-goal/"],
  "/capital-gains-tax-calculator/": ["/dividend-tax-calculator/", "/isa-vs-pension/", "/compound-interest/", "/inheritance-tax-calculator/", "/buy-to-let-calculator/", "/fund-fees/"],
  "/holiday-entitlement-calculator/": ["/working-days/", "/salary/", "/maternity-pay-calculator/", "/redundancy-pay-calculator/", "/days-until/", "/hourly-to-salary/"],
  "/redundancy-pay-calculator/": ["/salary/", "/holiday-entitlement-calculator/", "/emergency-fund-calculator/", "/maternity-pay-calculator/", "/50-30-20-budget/", "/job-offer-comparison/"],
  "/maternity-pay-calculator/": ["/due-date-calculator/", "/salary/", "/holiday-entitlement-calculator/", "/50-30-20-budget/", "/redundancy-pay-calculator/", "/savings-goal/", "/working-days/"],
  "/contractor-calculator/": ["/salary-vs-dividends/", "/dividend-tax-calculator/", "/salary/", "/self-employed-tax-calculator/", "/hourly-to-salary/", "/working-days/"],
  "/salary-vs-dividends/": ["/dividend-tax-calculator/", "/contractor-calculator/", "/salary/", "/self-employed-tax-calculator/", "/vat/", "/pay-rise-calculator/"],
  "/dividend-tax-calculator/": ["/salary-vs-dividends/", "/contractor-calculator/", "/salary/", "/self-employed-tax-calculator/", "/capital-gains-tax-calculator/", "/isa-vs-pension/"],
  "/word-counter/": ["/random-number-generator/", "/number-to-words/", "/basic/", "/percent/", "/grade/", "/roman-numerals/"],
  "/random-number-generator/": ["/basic/", "/percent/", "/word-counter/", "/scientific/", "/fractions/", "/roman-numerals/"],
  "/sleep-calculator/": ["/calorie-calculator/", "/bmi/", "/days-until/", "/birthday/", "/pace/", "/timezone/"],
  "/fire-calculator/": ["/compound-interest/", "/savings-goal/", "/isa-vs-pension/", "/fund-fees/", "/inflation/", "/salary/"],
  "/credit-card-payoff/": ["/debt-snowball-vs-avalanche/", "/loan-repayment/", "/50-30-20-budget/", "/emergency-fund-calculator/", "/salary/", "/savings-goal/"],
  "/wedding-budget/": ["/50-30-20-budget/", "/savings-goal/", "/split-bill/", "/days-until/", "/emergency-fund-calculator/", "/discount/"],
  "/overtime-calculator/": ["/salary/", "/hours-calculator/", "/hourly-to-salary/", "/pay-rise-calculator/", "/job-offer-comparison/", "/working-days/", "/biweekly-pay-schedule/"],
  "/cups-to-grams/": ["/recipe-scaler/", "/oven-temperature-converter/", "/air-fryer-conversion/", "/turkey-cooking-time/", "/unit-converter/", "/calorie-calculator/", "/split-bill/", "/percent/", "/fractions/"],
  "/hourly-to-salary/": ["/salary/", "/hours-calculator/", "/pay-rise-calculator/", "/job-offer-comparison/", "/biweekly-pay-schedule/", "/working-days/", "/50-30-20-budget/"],
  "/beckham-law-calculator/": ["/salary/", "/30-percent-ruling-calculator/", "/job-offer-comparison/", "/pay-rise-calculator/", "/50-30-20-budget/", "/savings-goal/"],
  "/30-percent-ruling-calculator/": ["/salary/", "/beckham-law-calculator/", "/job-offer-comparison/", "/pay-rise-calculator/", "/50-30-20-budget/", "/savings-goal/"],
  "/student-loan-calculator/": ["/salary/", "/50-30-20-budget/", "/pay-rise-calculator/", "/loan-repayment/", "/savings-goal/", "/job-offer-comparison/"],
  "/job-offer-comparison/": ["/salary/", "/pay-rise-calculator/", "/50-30-20-budget/", "/fuel-cost/", "/self-employed-tax-calculator/", "/biweekly-pay-schedule/"],
  "/biweekly-pay-schedule/": ["/salary/", "/50-30-20-budget/", "/pay-rise-calculator/", "/working-days/", "/savings-goal/", "/date-diff/"],
  "/christmas-savings-calculator/": ["/52-week-savings-challenge/", "/savings-goal/", "/50-30-20-budget/", "/days-until/", "/split-bill/", "/discount/"],
  "/emergency-fund-calculator/": ["/50-30-20-budget/", "/savings-goal/", "/52-week-savings-challenge/", "/compound-interest/", "/salary/", "/household-bills/"],
  "/50-30-20-budget/": ["/salary/", "/emergency-fund-calculator/", "/savings-goal/", "/52-week-savings-challenge/", "/pay-rise-calculator/", "/household-bills/"],
  "/52-week-savings-challenge/": ["/savings-goal/", "/christmas-savings-calculator/", "/emergency-fund-calculator/", "/compound-interest/", "/dry-january-calculator/", "/split-bill/", "/inflation/", "/salary/"],
  "/stamp-duty-calculator/": ["/mortgage-calculator/", "/mortgage-affordability/", "/rent-vs-buy/", "/mortgage-overpayment/", "/salary/", "/savings-goal/"],
  "/self-employed-tax-calculator/": ["/payments-on-account-calculator/", "/self-assessment-penalty-calculator/", "/salary/", "/vat/", "/isa-vs-pension/", "/savings-goal/"],
  "/payments-on-account-calculator/": ["/self-employed-tax-calculator/", "/self-assessment-penalty-calculator/", "/salary/", "/dividend-tax-calculator/", "/vat/", "/savings-goal/"],
  "/self-assessment-penalty-calculator/": ["/payments-on-account-calculator/", "/self-employed-tax-calculator/", "/salary/", "/dividend-tax-calculator/", "/vat/", "/emergency-fund-calculator/"],
  "/child-benefit-tax-charge-calculator/": ["/salary/", "/isa-vs-pension/", "/pay-rise-calculator/", "/self-employed-tax-calculator/", "/student-loan-calculator/", "/50-30-20-budget/"],
  "/dry-january-calculator/": ["/calorie-calculator/", "/52-week-savings-challenge/", "/savings-goal/", "/bmi/", "/split-bill/", "/days-until/", "/compound-interest/"],
  "/pay-rise-calculator/": ["/salary/", "/job-offer-comparison/", "/50-30-20-budget/", "/inflation/", "/percent/", "/savings-goal/", "/isa-vs-pension/", "/mortgage-affordability/"],
  "/calorie-calculator/": ["/protein-calculator/", "/dry-january-calculator/", "/bmi/", "/pace/", "/unit-converter/", "/date-diff/", "/percent/", "/days-until/"],
  "/working-days/": ["/date-diff/", "/days-from-today/", "/week-number/", "/days-until/", "/salary/", "/timezone/", "/birthday/", "/percent/"],
  "/heating-cost/": ["/running-cost/", "/btu/", "/household-bills/", "/watts-amps-volts/", "/ev-charging-cost/", "/split-bill/"],
  "/turkey-cooking-time/": ["/oven-temperature-converter/", "/days-until/", "/unit-converter/", "/split-bill/", "/running-cost/", "/tip/", "/timezone/"],
  "/how-long-to-get-to/": ["/weight-on-other-planets/", "/age-on-other-planets/", "/unit-converter/", "/pace/", "/fuel-cost/", "/timezone/"],
  "/days-until/": ["/working-days/", "/days-from-today/", "/turkey-cooking-time/", "/date-diff/", "/birthday/", "/age-on-other-planets/", "/timezone/", "/roman-numerals/", "/number-to-words/"],
  "/age-on-other-planets/": ["/weight-on-other-planets/", "/how-long-to-get-to/", "/birthday/", "/date-diff/", "/dog-age/", "/cat-age/", "/unit-converter/"],
  "/cheque-writer/": ["/number-to-words/", "/roman-numerals/", "/basic/", "/percent/", "/vat/", "/split-bill/"],
  "/tfsa-vs-rrsp/": ["/compound-interest/", "/salary/", "/savings-goal/", "/fund-fees/", "/roth-vs-traditional/", "/isa-vs-pension/"],
  "/roth-vs-traditional/": ["/compound-interest/", "/salary/", "/savings-goal/", "/fund-fees/", "/isa-vs-pension/", "/tfsa-vs-rrsp/"],
  "/isa-vs-pension/": ["/compound-interest/", "/salary/", "/savings-goal/", "/fund-fees/", "/roth-vs-traditional/", "/tfsa-vs-rrsp/"],
  "/mortgage-calculator/": ["/stamp-duty-calculator/", "/mortgage-affordability/", "/mortgage-overpayment/", "/rent-vs-buy/", "/loan-repayment/", "/salary/", "/inflation/"],
  "/basic/": ["/scientific/", "/percent/", "/fractions/", "/decimal-to-fraction/", "/unit-converter/", "/number-to-words/"],
  "/scientific/": ["/basic/", "/fractions/", "/percent/", "/unit-converter/", "/watts-amps-volts/", "/decimal-to-fraction/"],
  "/percent/": ["/discount/", "/vat/", "/margin-markup/", "/growth/", "/fractions/", "/decimal-to-fraction/"],
  "/fractions/": ["/decimal-to-fraction/", "/percent/", "/basic/", "/scientific/", "/weighted-average/", "/number-to-words/"],
  "/decimal-to-fraction/": ["/fractions/", "/percent/", "/basic/", "/number-to-words/", "/roman-numerals/", "/scientific/"],
  "/number-to-words/": ["/cheque-writer/", "/roman-numerals/", "/decimal-to-fraction/", "/fractions/", "/basic/", "/birthday/", "/date-diff/"],
  "/margin-markup/": ["/marketplace-fees/", "/vat/", "/discount/", "/percent/", "/growth/", "/cashback/"],
  "/growth/": ["/cagr/", "/percent/", "/ab-test-significance/", "/compound-interest/", "/margin-markup/", "/weighted-average/"],
  "/vat/": ["/self-employed-tax-calculator/", "/salary/", "/margin-markup/", "/discount/", "/percent/", "/marketplace-fees/", "/split-bill/"],
  "/ab-test-significance/": ["/growth/", "/weighted-average/", "/percent/", "/cagr/", "/ai-cost/", "/margin-markup/"],
  "/weighted-average/": ["/degree-classification-calculator/", "/grade/", "/percent/", "/ab-test-significance/", "/growth/", "/fractions/", "/basic/"],
  "/ai-cost/": ["/margin-markup/", "/growth/", "/ab-test-significance/", "/percent/", "/running-cost/", "/marketplace-fees/"],
  "/marketplace-fees/": ["/margin-markup/", "/vat/", "/discount/", "/cashback/", "/percent/", "/growth/"],
  "/inflation/": ["/pay-rise-calculator/", "/compound-interest/", "/savings-goal/", "/salary/", "/cagr/", "/rent-vs-buy/", "/fund-fees/"],
  "/mortgage-affordability/": ["/stamp-duty-calculator/", "/mortgage-calculator/", "/rent-vs-buy/", "/salary/", "/mortgage-overpayment/", "/loan-repayment/", "/savings-goal/", "/household-bills/"],
  "/rent-vs-buy/": ["/stamp-duty-calculator/", "/mortgage-affordability/", "/mortgage-overpayment/", "/salary/", "/compound-interest/", "/inflation/", "/savings-goal/", "/loan-repayment/"],
  "/salary/": ["/self-employed-tax-calculator/", "/child-benefit-tax-charge-calculator/", "/pay-rise-calculator/", "/job-offer-comparison/", "/student-loan-calculator/", "/50-30-20-budget/", "/vat/", "/savings-goal/", "/loan-repayment/", "/mortgage-overpayment/", "/compound-interest/", "/household-bills/"],
  "/cagr/": ["/compound-interest/", "/inflation/", "/growth/", "/fund-fees/", "/savings-goal/", "/percent/"],
  "/compound-interest/": ["/savings-goal/", "/52-week-savings-challenge/", "/inflation/", "/cagr/", "/fund-fees/", "/mortgage-overpayment/", "/salary/"],
  "/savings-goal/": ["/compound-interest/", "/52-week-savings-challenge/", "/emergency-fund-calculator/", "/salary/", "/inflation/", "/fund-fees/", "/rent-vs-buy/", "/household-bills/"],
  "/mortgage-overpayment/": ["/mortgage-calculator/", "/mortgage-affordability/", "/loan-repayment/", "/rent-vs-buy/", "/compound-interest/", "/salary/", "/debt-snowball-vs-avalanche/", "/household-bills/"],
  "/loan-repayment/": ["/car-finance/", "/mortgage-overpayment/", "/debt-snowball-vs-avalanche/", "/compound-interest/", "/salary/", "/cashback/"],
  "/debt-snowball-vs-avalanche/": ["/loan-repayment/", "/mortgage-overpayment/", "/car-finance/", "/savings-goal/", "/cashback/", "/salary/"],
  "/fund-fees/": ["/compound-interest/", "/cagr/", "/savings-goal/", "/salary/", "/mortgage-overpayment/", "/loan-repayment/"],
  "/car-finance/": ["/loan-repayment/", "/fuel-cost/", "/ev-charging-cost/", "/debt-snowball-vs-avalanche/", "/salary/", "/cashback/"],
  "/cashback/": ["/discount/", "/debt-snowball-vs-avalanche/", "/loan-repayment/", "/marketplace-fees/", "/savings-goal/", "/percent/"],
  "/tip/": ["/split-bill/", "/discount/", "/percent/", "/household-bills/", "/vat/", "/basic/"],
  "/discount/": ["/percent/", "/vat/", "/cashback/", "/tip/", "/margin-markup/", "/split-bill/"],
  "/split-bill/": ["/tip/", "/household-bills/", "/discount/", "/percent/", "/vat/", "/fuel-cost/"],
  "/grade/": ["/degree-classification-calculator/", "/weighted-average/", "/percent/", "/fractions/", "/basic/", "/date-diff/", "/scientific/"],
  "/unit-converter/": ["/pace/", "/fuel-cost/", "/watts-amps-volts/", "/btu/", "/coverage/", "/scientific/"],
  "/bmi/": ["/body-fat-calculator/", "/heart-rate-zones/", "/calorie-calculator/", "/pace/", "/unit-converter/", "/weight-on-other-planets/", "/birthday/", "/date-diff/", "/percent/"],
  "/fuel-cost/": ["/speed-distance-time/", "/ev-charging-cost/", "/car-finance/", "/unit-converter/", "/split-bill/", "/running-cost/", "/pace/"],
  "/ev-charging-cost/": ["/fuel-cost/", "/running-cost/", "/car-finance/", "/watts-amps-volts/", "/unit-converter/", "/household-bills/"],
  "/pace/": ["/heart-rate-zones/", "/speed-distance-time/", "/calorie-calculator/", "/unit-converter/", "/bmi/", "/date-diff/", "/fuel-cost/", "/timezone/", "/percent/"],
  "/household-bills/": ["/split-bill/", "/50-30-20-budget/", "/running-cost/", "/salary/", "/savings-goal/", "/tip/", "/percent/"],
  "/running-cost/": ["/heating-cost/", "/ev-charging-cost/", "/watts-amps-volts/", "/household-bills/", "/btu/", "/fuel-cost/", "/unit-converter/"],
  "/coverage/": ["/square-footage-calculator/", "/tile-calculator/", "/concrete-calculator/", "/btu/", "/unit-converter/", "/running-cost/", "/household-bills/", "/discount/", "/percent/"],
  "/btu/": ["/heating-cost/", "/coverage/", "/running-cost/", "/watts-amps-volts/", "/unit-converter/", "/household-bills/", "/ev-charging-cost/"],
  "/watts-amps-volts/": ["/running-cost/", "/ev-charging-cost/", "/btu/", "/unit-converter/", "/scientific/", "/basic/"],
  "/odds-converter/": ["/each-way/", "/accumulator/", "/lay/", "/dutching/", "/full-cover-bets/", "/percent/"],
  "/each-way/": ["/full-cover-bets/", "/odds-converter/", "/accumulator/", "/lay/", "/dutching/", "/percent/"],
  "/lay/": ["/dutching/", "/odds-converter/", "/each-way/", "/accumulator/", "/full-cover-bets/", "/cashback/"],
  "/dutching/": ["/lay/", "/odds-converter/", "/each-way/", "/accumulator/", "/full-cover-bets/", "/weighted-average/"],
  "/accumulator/": ["/full-cover-bets/", "/odds-converter/", "/each-way/", "/lay/", "/dutching/", "/percent/"],
  "/full-cover-bets/": ["/accumulator/", "/each-way/", "/odds-converter/", "/dutching/", "/lay/", "/percent/"],
  "/birthday/": ["/date-diff/", "/day-of-the-week/", "/days-until/", "/age-on-other-planets/", "/timezone/", "/dog-age/", "/cat-age/", "/number-to-words/", "/roman-numerals/"],
  "/date-diff/": ["/working-days/", "/days-from-today/", "/hours-calculator/", "/days-until/", "/birthday/", "/timezone/", "/pace/", "/number-to-words/", "/roman-numerals/", "/percent/"],
  "/timezone/": ["/date-diff/", "/hours-calculator/", "/birthday/", "/unit-converter/", "/pace/", "/basic/", "/number-to-words/"],
  "/dog-age/": ["/cat-age/", "/birthday/", "/date-diff/", "/bmi/", "/weight-on-other-planets/", "/unit-converter/"],
  "/cat-age/": ["/dog-age/", "/birthday/", "/date-diff/", "/bmi/", "/weight-on-other-planets/", "/unit-converter/"],
  "/roman-numerals/": ["/number-to-words/", "/decimal-to-fraction/", "/birthday/", "/date-diff/", "/fractions/", "/basic/"],
  "/weight-on-other-planets/": ["/age-on-other-planets/", "/how-long-to-get-to/", "/bmi/", "/unit-converter/", "/dog-age/", "/cat-age/", "/scientific/", "/birthday/"]
};

const START = "    <!-- related calculators: generated by tools/related.js -->\n";
const END = "    <!-- end related calculators -->\n";

const SHOWN = 5;

/* The homepage's cards, keyed by href, each with the category it is listed
   under. Their text is already HTML-escaped. */
function cards() {
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const out = {};
  html.split('<div class="hub-group-title" data-group><span>').slice(1).forEach((section) => {
    const name = section.slice(0, section.indexOf("<"));
    const more = section.match(/<a class="hub-card hub-more" href="([^"]+)"/);
    const category = { name: name, href: more ? more[1] : null };
    const re = /<a class="hub-card" href="([^"]+)">\s*<span class="icon">((?:(?!<\/span>)[\s\S])*)<\/span>\s*<div class="title">([^<]*)<\/div>\s*<div class="desc">([^<]*)<\/div>/g;
    let m;
    while ((m = re.exec(section))) if (!out[m[1]]) out[m[1]] = { icon: m[2], title: m[3], desc: m[4], category: category };
  });
  return out;
}

function cardHtml(href, c) {
  const tag = tags.span(href);
  return `      <a class="hub-card" href="${href}">
        <span class="icon">${/^</.test(c.icon) ? c.icon : require("./lib/icons.js").inner(c.icon)}</span>
        <div class="title">${c.title}</div>
        <div class="desc">${c.desc}</div>${tag ? `\n        ${tag}` : ""}
      </a>
`;
}

function block(page, known) {
  const all = known || cards();
  const links = RELATED[page];
  if (!links) throw new Error("no related calculators listed for " + page);
  if (!all[page]) throw new Error(page + " has no card on the homepage");
  let body = links.slice(0, SHOWN).map((href) => {
    if (!all[href]) throw new Error(page + " lists " + href + ", which has no card on the homepage");
    return cardHtml(href, all[href]);
  }).join("");
  const category = all[page].category;
  if (category.href) {
    body += cardHtml(category.href, { icon: "🗂️", title: "All " + category.name + " calculators", desc: "Every calculator in the category, on one page." });
  }
  return START + `    <div class="hub-group-title" style="margin-top:28px;">Related calculators</div>
    <div class="hub-grid">
${body}    </div>
` + END;
}

/* Puts the block just above the footer, replacing a generated or hand-written one */
function apply(html, page, known) {
  const fresh = block(page, known);
  if (html.includes(START)) {
    return html.slice(0, html.indexOf(START)) + fresh + html.slice(html.indexOf(END) + END.length);
  }
  const handwritten = / *<div class="hub-group-title"[^>]*>(Related calculators|More [^<]* calculators)<\/div>\n *<div class="hub-grid">[\s\S]*?\n    <\/div>\n\n?/;
  html = html.replace(new RegExp(handwritten.source, "g"), "");
  const footer = html.indexOf("    <footer class=\"site-footer\">");
  if (footer < 0) throw new Error(page + " has no footer to put the block above");
  return html.slice(0, footer) + fresh + "\n" + html.slice(footer);
}

function main() {
  const known = cards();
  let n = 0;
  Object.keys(RELATED).filter((p) => p !== "/salary/").forEach((page) => {
    const file = path.join(ROOT, page, "index.html");
    const html = fs.readFileSync(file, "utf8");
    const next = apply(html, page, known);
    if (next !== html) {
      fs.writeFileSync(file, next);
      n++;
    }
  });
  /* country tags on the homepage's and category hubs' own cards */
  let tagged = 0;
  ["index.html"].concat(fs.readdirSync(ROOT, { withFileTypes: true }).filter((d) => d.isDirectory() && fs.existsSync(path.join(ROOT, d.name, "index.html"))).map((d) => path.join(d.name, "index.html"))).forEach((rel) => {
    const file = path.join(ROOT, rel);
    const html = fs.readFileSync(file, "utf8");
    if (!html.includes('class="hub-card"')) return;
    const next = tags.apply(html);
    if (next !== html) { fs.writeFileSync(file, next); tagged++; }
  });
  if (tagged) console.log("country tags updated on " + tagged + " page(s)");
  /* the homepage's category tiles: each count from its hub's own list */
  const home = path.join(ROOT, "index.html");
  const homeHtml = fs.readFileSync(home, "utf8");
  const counted = homeHtml.replace(/(<a class="cat-tile" href="\/([^"/]+)\/">[\s\S]*?<span class="cat-tile-count">)(\d+)( calculators?<\/span>)/g, (m, a, dir, n, b) => {
    const hub = path.join(ROOT, dir, "index.html");
    const k = fs.existsSync(hub) && (fs.readFileSync(hub, "utf8").match(/"numberOfItems": (\d+)/) || [])[1];
    return k ? a + k + b : m;
  });
  if (counted !== homeHtml) { fs.writeFileSync(home, counted); console.log("category tile counts updated"); }
  const missing = Object.keys(known).filter((href) => !RELATED[href]);
  if (missing.length) console.log("no related list for: " + missing.join(", "));
  console.log("updated " + n + " page(s)");
  /* the 404 page lists every calculator on the homepage */
  require("./build-404.js").build();
}

module.exports = { block, RELATED };
if (require.main === module) main();
