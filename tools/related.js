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

const RELATED = {
  "/basic/": ["/scientific/", "/percent/", "/fractions/", "/decimal-to-fraction/", "/unit-converter/", "/number-to-words/"],
  "/scientific/": ["/basic/", "/fractions/", "/percent/", "/unit-converter/", "/watts-amps-volts/", "/decimal-to-fraction/"],
  "/percent/": ["/discount/", "/vat/", "/margin-markup/", "/growth/", "/fractions/", "/decimal-to-fraction/"],
  "/fractions/": ["/decimal-to-fraction/", "/percent/", "/basic/", "/scientific/", "/weighted-average/", "/number-to-words/"],
  "/decimal-to-fraction/": ["/fractions/", "/percent/", "/basic/", "/number-to-words/", "/roman-numerals/", "/scientific/"],
  "/number-to-words/": ["/roman-numerals/", "/decimal-to-fraction/", "/fractions/", "/basic/", "/birthday/", "/date-diff/"],
  "/margin-markup/": ["/marketplace-fees/", "/vat/", "/discount/", "/percent/", "/growth/", "/cashback/"],
  "/growth/": ["/cagr/", "/percent/", "/ab-test-significance/", "/compound-interest/", "/margin-markup/", "/weighted-average/"],
  "/vat/": ["/salary/", "/margin-markup/", "/discount/", "/percent/", "/marketplace-fees/", "/split-bill/"],
  "/ab-test-significance/": ["/growth/", "/weighted-average/", "/percent/", "/cagr/", "/ai-cost/", "/margin-markup/"],
  "/weighted-average/": ["/grade/", "/percent/", "/ab-test-significance/", "/growth/", "/fractions/", "/basic/"],
  "/ai-cost/": ["/margin-markup/", "/growth/", "/ab-test-significance/", "/percent/", "/running-cost/", "/marketplace-fees/"],
  "/marketplace-fees/": ["/margin-markup/", "/vat/", "/discount/", "/cashback/", "/percent/", "/growth/"],
  "/salary/": ["/vat/", "/savings-goal/", "/loan-repayment/", "/mortgage-overpayment/", "/compound-interest/", "/household-bills/"],
  "/cagr/": ["/compound-interest/", "/growth/", "/fund-fees/", "/savings-goal/", "/percent/", "/weighted-average/"],
  "/compound-interest/": ["/savings-goal/", "/cagr/", "/fund-fees/", "/mortgage-overpayment/", "/loan-repayment/", "/salary/"],
  "/savings-goal/": ["/compound-interest/", "/salary/", "/fund-fees/", "/cagr/", "/debt-snowball-vs-avalanche/", "/household-bills/"],
  "/mortgage-overpayment/": ["/loan-repayment/", "/compound-interest/", "/debt-snowball-vs-avalanche/", "/salary/", "/savings-goal/", "/household-bills/"],
  "/loan-repayment/": ["/car-finance/", "/mortgage-overpayment/", "/debt-snowball-vs-avalanche/", "/compound-interest/", "/salary/", "/cashback/"],
  "/debt-snowball-vs-avalanche/": ["/loan-repayment/", "/mortgage-overpayment/", "/car-finance/", "/savings-goal/", "/cashback/", "/salary/"],
  "/fund-fees/": ["/compound-interest/", "/cagr/", "/savings-goal/", "/salary/", "/mortgage-overpayment/", "/loan-repayment/"],
  "/car-finance/": ["/loan-repayment/", "/fuel-cost/", "/ev-charging-cost/", "/debt-snowball-vs-avalanche/", "/salary/", "/cashback/"],
  "/cashback/": ["/discount/", "/debt-snowball-vs-avalanche/", "/loan-repayment/", "/marketplace-fees/", "/savings-goal/", "/percent/"],
  "/tip/": ["/split-bill/", "/discount/", "/percent/", "/household-bills/", "/vat/", "/basic/"],
  "/discount/": ["/percent/", "/vat/", "/cashback/", "/tip/", "/margin-markup/", "/split-bill/"],
  "/split-bill/": ["/tip/", "/household-bills/", "/discount/", "/percent/", "/vat/", "/fuel-cost/"],
  "/grade/": ["/weighted-average/", "/percent/", "/fractions/", "/basic/", "/date-diff/", "/scientific/"],
  "/unit-converter/": ["/pace/", "/fuel-cost/", "/watts-amps-volts/", "/btu/", "/coverage/", "/scientific/"],
  "/bmi/": ["/pace/", "/unit-converter/", "/weight-on-other-planets/", "/birthday/", "/date-diff/", "/percent/"],
  "/fuel-cost/": ["/ev-charging-cost/", "/car-finance/", "/unit-converter/", "/split-bill/", "/running-cost/", "/pace/"],
  "/ev-charging-cost/": ["/fuel-cost/", "/running-cost/", "/car-finance/", "/watts-amps-volts/", "/unit-converter/", "/household-bills/"],
  "/pace/": ["/unit-converter/", "/bmi/", "/date-diff/", "/fuel-cost/", "/timezone/", "/percent/"],
  "/household-bills/": ["/split-bill/", "/running-cost/", "/salary/", "/savings-goal/", "/tip/", "/percent/"],
  "/running-cost/": ["/ev-charging-cost/", "/watts-amps-volts/", "/household-bills/", "/btu/", "/fuel-cost/", "/unit-converter/"],
  "/coverage/": ["/btu/", "/unit-converter/", "/running-cost/", "/household-bills/", "/discount/", "/percent/"],
  "/btu/": ["/coverage/", "/running-cost/", "/watts-amps-volts/", "/unit-converter/", "/household-bills/", "/ev-charging-cost/"],
  "/watts-amps-volts/": ["/running-cost/", "/ev-charging-cost/", "/btu/", "/unit-converter/", "/scientific/", "/basic/"],
  "/odds-converter/": ["/each-way/", "/accumulator/", "/lay/", "/dutching/", "/full-cover-bets/", "/percent/"],
  "/each-way/": ["/full-cover-bets/", "/odds-converter/", "/accumulator/", "/lay/", "/dutching/", "/percent/"],
  "/lay/": ["/dutching/", "/odds-converter/", "/each-way/", "/accumulator/", "/full-cover-bets/", "/cashback/"],
  "/dutching/": ["/lay/", "/odds-converter/", "/each-way/", "/accumulator/", "/full-cover-bets/", "/weighted-average/"],
  "/accumulator/": ["/full-cover-bets/", "/odds-converter/", "/each-way/", "/lay/", "/dutching/", "/percent/"],
  "/full-cover-bets/": ["/accumulator/", "/each-way/", "/odds-converter/", "/dutching/", "/lay/", "/percent/"],
  "/birthday/": ["/date-diff/", "/timezone/", "/dog-age/", "/cat-age/", "/number-to-words/", "/roman-numerals/"],
  "/date-diff/": ["/birthday/", "/timezone/", "/pace/", "/number-to-words/", "/roman-numerals/", "/percent/"],
  "/timezone/": ["/date-diff/", "/birthday/", "/unit-converter/", "/pace/", "/basic/", "/number-to-words/"],
  "/dog-age/": ["/cat-age/", "/birthday/", "/date-diff/", "/bmi/", "/weight-on-other-planets/", "/unit-converter/"],
  "/cat-age/": ["/dog-age/", "/birthday/", "/date-diff/", "/bmi/", "/weight-on-other-planets/", "/unit-converter/"],
  "/roman-numerals/": ["/number-to-words/", "/decimal-to-fraction/", "/birthday/", "/date-diff/", "/fractions/", "/basic/"],
  "/weight-on-other-planets/": ["/bmi/", "/unit-converter/", "/dog-age/", "/cat-age/", "/scientific/", "/birthday/"]
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
    const re = /<a class="hub-card" href="([^"]+)">\s*<span class="icon">([^<]*)<\/span>\s*<div class="title">([^<]*)<\/div>\s*<div class="desc">([^<]*)<\/div>/g;
    let m;
    while ((m = re.exec(section))) if (!out[m[1]]) out[m[1]] = { icon: m[2], title: m[3], desc: m[4], category: category };
  });
  return out;
}

function cardHtml(href, c) {
  return `      <a class="hub-card" href="${href}">
        <span class="icon">${c.icon}</span>
        <div class="title">${c.title}</div>
        <div class="desc">${c.desc}</div>
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
  const missing = Object.keys(known).filter((href) => !RELATED[href]);
  if (missing.length) console.log("no related list for: " + missing.join(", "));
  console.log("updated " + n + " page(s)");
}

module.exports = { block, RELATED };
if (require.main === module) main();
