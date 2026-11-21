#!/usr/bin/env node
/* "40% margin on £50" — what to sell at for a given margin, and the same
   percentage as a markup, a page per common percentage and cost:

       /margin-markup/40-percent-margin-on-50/   sell at £83.33 (40% margin) or £70 (40% markup)

       node tools/build-margin-pages.js

   Margin is profit as a share of the selling price: price = cost ÷ (1 − m).
   Markup is profit as a share of the cost: price = cost × (1 + k). The page
   shows both, because mixing them up is the commonest pricing mistake. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const { SITE } = site;

const BASE = "/margin-markup/";
const PCTS = [10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 75];
const COSTS = [5, 10, 15, 20, 25, 30, 40, 50, 75, 100, 150, 200, 250, 500, 1000];

const slug = (m, c) => `${m}-percent-margin-on-${c}`;
const c2 = (v) => Math.round(v * 100) / 100;
const byMargin = (m, c) => c2(c / (1 - m / 100));
const byMarkup = (m, c) => c2(c * (1 + m / 100));
const g = (v) => "£" + v.toLocaleString("en-GB", { minimumFractionDigits: Number.isInteger(v) ? 0 : 2, maximumFractionDigits: 2 });
const p1 = (v) => (Math.round(v * 10) / 10).toLocaleString("en-GB", { maximumFractionDigits: 1 }) + "%";
const markupFor = (m) => m / (100 - m) * 100, marginFor = (k) => k / (100 + k) * 100;

function page(m, c) {
  const sell = byMargin(m, c), profit = c2(sell - c), mk = byMarkup(m, c), mkProfit = c2(mk - c), url = SITE + `${BASE}${slug(m, c)}/`;
  const title = site.fitTitle(`${m}% Margin on ${g(c)} — Sell at ${g(sell)} (vs ${g(mk)} at ${m}% Markup)`, `${m}% Margin on ${g(c)}: Sell at ${g(sell)}`);
  const desc = `For a ${m}% profit margin on a cost of ${g(c)}, sell at ${g(sell)} (profit ${g(profit)}). A ${m}% markup gives only ${g(mk)} — a ${p1(marginFor(m))} margin. Formula and table.`;
  const q = [
    [`What price gives a ${m}% margin on ${g(c)}?`, `${g(sell)}: ${g(c)} ÷ (1 − ${m / 100}) = ${g(c)} ÷ ${c2(1 - m / 100)}. Profit ${g(profit)} is ${m}% of ${g(sell)}.`],
    [`What is a ${m}% markup on ${g(c)}?`, `${g(mk)}: ${g(c)} × ${1 + m / 100}. That's a ${g(mkProfit)} profit, which is only a ${p1(marginFor(m))} margin.`],
    [`What markup do I need for a ${m}% margin?`, `${p1(markupFor(m))}. Markup = margin ÷ (1 − margin): ${m / 100} ÷ ${c2(1 - m / 100)} = ${c2(markupFor(m) / 100)}.`],
    ["What's the difference between margin and markup?", "Both measure the same profit. Margin divides it by the selling price; markup divides it by the cost. So a margin is always smaller than the matching markup: 50% markup is a 33.3% margin, and a 50% margin needs a 100% markup."]
  ];
  const ld = [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], ["Margin vs Markup Calculator", SITE + BASE], [`${m}% margin on ${g(c)}`, url]]), site.faqLd(q)];
  const others = PCTS.map((p) => [p === m ? `<strong>${p}%</strong>` : `<a href="${BASE}${slug(p, c)}/">${p}% on ${g(c)}</a>`, g(byMargin(p, c)), g(byMarkup(p, c)), p1(markupFor(p))]);
  const nearby = site.neighbours(COSTS, c, 5).concat([c]).sort((a, b) => a - b)
    .map((x) => [x === c ? `<strong>${g(x)}</strong>` : `<a href="${BASE}${slug(m, x)}/">${g(x)}</a>`, g(byMargin(m, x)), g(c2(byMargin(m, x) - x))]);
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="${BASE}">← Margin vs markup calculator</a>
      <h1 class="page-title">${m}% margin on ${g(c)}</h1>
      <p class="page-subtitle">To make a ${m}% margin on something that costs ${g(c)}, sell it for <strong>${g(sell)}</strong>.</p>
    </header>

    <main class="tool">
      <div class="result-box">
        <div class="result-grid">
          <div class="result-row highlight"><span class="r-label">Price for a ${m}% margin</span><span class="r-value">${g(sell)}</span></div>
          <div class="result-row"><span class="r-label">Profit</span><span class="r-value">${g(profit)}</span></div>
          <div class="result-row"><span class="r-label">The markup that is</span><span class="r-value">${p1(markupFor(m))}</span></div>
        </div>
      </div>
      <p class="tool-section-title" style="margin-top:20px;">Careful: ${m}% markup is different</p>
      <p class="about-text">Adding ${m}% to the cost (a ${m}% <em>markup</em>) gives ${g(mk)} — a profit of ${g(mkProfit)}, which is only a <strong>${p1(marginFor(m))} margin</strong>. If you meant a ${m}% markup, that's your price; if you need ${m}% of the selling price as profit, it's ${g(sell)}.</p>
      <p class="tool-hint">Prices before VAT. Work out any cost and price in the <a href="${BASE}">margin vs markup calculator</a>; the sums are the same in any currency.</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">How to work it out</p>
      <p class="about-text"><strong>Margin:</strong> price = cost ÷ (1 − margin) = ${g(c)} ÷ ${c2(1 - m / 100)} = <strong>${g(sell)}</strong>. Check: ${g(profit)} profit ÷ ${g(sell)} = ${m}%.</p>
      <p class="about-text"><strong>Markup:</strong> price = cost × (1 + markup) = ${g(c)} × ${1 + m / 100} = ${g(mk)}.</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">Other margins on ${g(c)}</p>
${site.table(["Margin", "Sell at", "Same % as markup", "Markup needed"], others, 420)}      <p class="tool-section-title" style="margin-top:20px;">${m}% margin on other costs</p>
${site.table(["Cost", "Sell at", "Profit"], nearby, 300)}    </main>

    <main class="tool">
      <p class="tool-section-title">Frequently asked questions</p>
${site.faqHtml(q)}    </main>

${site.FOOTER}
  </div>
</body>
</html>
`;
}

function hubBlock() {
  const file = path.join(site.ROOT, "margin-markup/index.html");
  const START = "    <!-- margin pages: generated by tools/build-margin-pages.js -->\n", END = "    <!-- end margin pages -->\n";
  let s = fs.readFileSync(file, "utf8");
  if (s.includes(START)) s = s.slice(0, s.indexOf(START)) + s.slice(s.indexOf(END) + END.length).replace(/^\n+/, "");
  const conv = PCTS.map((m) => [`${m}%`, p1(markupFor(m)), p1(marginFor(m))]);
  const html = `    <main class="tool">
      <p class="tool-section-title">Margin and markup conversion</p>
${site.table(["Percentage", "Markup needed for this margin", "Margin this markup gives"], conv, 420)}      <p class="tool-section-title" style="margin-top:20px;">Selling prices for common margins</p>
${PCTS.map((m) => `      <p class="salary-links"><strong>${m}% margin on:</strong> ${COSTS.map((c) => `<a href="${BASE}${slug(m, c)}/">${g(c)}</a>`).join(" ")}</p>`).join("\n")}
    </main>

`;
  const at = s.indexOf("    <!-- related calculators: generated by tools/related.js -->");
  if (at < 0) throw new Error("margin: related marker not found");
  s = s.slice(0, at).replace(/\n{3,}$/, "\n\n") + START + html + END + "\n" + s.slice(at);
  fs.writeFileSync(file, s);
}

/* Hand checks: 40% margin on 50 = 83.33; 25% margin on 75 = 100; 40% markup on 50 = 70; 50% margin = 100% markup */
if (byMargin(40, 50) !== 83.33 || byMargin(25, 75) !== 100 || byMarkup(40, 50) !== 70 || markupFor(50) !== 100) throw new Error("margin check");

const urls = [];
PCTS.forEach((m) => COSTS.forEach((c) => { site.write(`margin-markup/${slug(m, c)}`, page(m, c)); urls.push([`${BASE}${slug(m, c)}/`, "0.4"]); }));
hubBlock();
site.prune("margin-markup", /^\d+-percent-margin-on-\d+$/);
site.sitemapBlock("margin pages", "tools/build-margin-pages.js", urls);
console.log(`built ${urls.length} margin pages`);
