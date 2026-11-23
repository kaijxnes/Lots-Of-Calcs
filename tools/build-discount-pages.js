#!/usr/bin/env node
/* "20% off £50" — a page per common discount and price:

       /discount/20-percent-off-50/     sale price 40, you save 10

       node tools/build-discount-pages.js

   Sale price = price × (100 − X) ÷ 100. Prices are whole pounds (or
   dollars) and discounts whole percentages, so every figure is exact to
   the penny. The pages use £ — the site's main audience — and say the
   sums are the same in any currency. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const { SITE } = site;

const BASE = "/discount/";
const PCTS = [5, 10, 15, 20, 25, 30, 33, 35, 40, 45, 50, 60, 70, 75, 80];
const PRICES = [10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 75, 80, 90, 100, 120, 125, 150, 175, 200, 250, 300, 400, 500, 750, 1000];

const slug = (x, y) => `${x}-percent-off-${y}`;
const cents = (v) => Math.round(v * 100) / 100;
const saving = (x, y) => cents(y * x / 100);
const sale = (x, y) => cents(y - saving(x, y));
const g = (v) => "£" + v.toLocaleString("en-GB", { minimumFractionDigits: Number.isInteger(v) ? 0 : 2, maximumFractionDigits: 2 });

function shortcut(x, y) {
  const s = saving(x, y), ten = saving(10, y);
  if (x === 50) return `50% off is half price: ${g(y)} ÷ 2 = ${g(sale(x, y))}.`;
  if (x === 25) return `25% is a quarter. A quarter of ${g(y)} is ${g(s)}, so you pay ${g(sale(x, y))}.`;
  if (x === 75) return `75% off means you pay a quarter: ${g(y)} ÷ 4 = ${g(sale(x, y))}.`;
  if (x === 33) return `33% is just under a third. A third of ${g(y)} is ${g(cents(y / 3))}; 33% exactly is ${g(s)}, so you pay ${g(sale(x, y))}.`;
  if (x === 10) return `10% is a tenth: ${g(y)} ÷ 10 = ${g(s)} off, so you pay ${g(sale(x, y))}.`;
  if (x === 5) return `10% of ${g(y)} is ${g(ten)}; 5% is half that, ${g(s)}. You pay ${g(sale(x, y))}.`;
  if (x === 15) return `10% of ${g(y)} is ${g(ten)} and 5% is ${g(saving(5, y))}, so 15% off saves ${g(s)}. You pay ${g(sale(x, y))}.`;
  if (x % 10 === 0) return `10% of ${g(y)} is ${g(ten)}, so ${x}% is ${x / 10} × ${g(ten)} = ${g(s)} off. You pay ${g(sale(x, y))}.`;
  if (x % 5 === 0) return `10% of ${g(y)} is ${g(ten)} and 5% is ${g(saving(5, y))}, so ${x}% is ${g(s)} off. You pay ${g(sale(x, y))}.`;
  return `1% of ${g(y)} is ${g(saving(1, y))}, so ${x}% is ${g(s)} off. You pay ${g(sale(x, y))}.`;
}

function page(x, y) {
  const s = saving(x, y), p = sale(x, y), url = SITE + `${BASE}${slug(x, y)}/`;
  const mult = Math.round((100 - x)) / 100;
  /* a further 10% off at the till, the usual Black Friday "extra" */
  const extra = cents(p * 0.9), total = cents(y - extra), totalPct = Math.round((1 - extra / y) * 1000) / 10;
  const title = site.fitTitle(`${x}% Off ${g(y)} — Sale Price ${g(p)}, You Save ${g(s)}`, `${x}% Off ${g(y)} = ${g(p)} (Save ${g(s)})`);
  const desc = `${x}% off ${g(y)} is ${g(p)}: you save ${g(s)}. Multiply ${g(y)} by ${mult} to get the sale price. With a quick way to work it out in the shop, and what an extra 10% off makes it.`;
  const q = [
    [`What is ${x}% off ${g(y)}?`, `${g(p)}. ${x}% of ${g(y)} is ${g(s)}, and ${g(y)} − ${g(s)} = ${g(p)}. Or in one step: ${g(y)} × ${mult} = ${g(p)}.`],
    [`How much do I save with ${x}% off ${g(y)}?`, `${g(s)}: ${g(y)} × ${x} ÷ 100.`],
    [`How do I work out ${x}% off in my head?`, shortcut(x, y)],
    [`Is ${x}% off and then 10% off the same as ${x + 10}% off?`, `No — the second discount comes off the already-reduced price. ${x}% off ${g(y)} is ${g(p)}; another 10% off that is ${g(extra)}, a total saving of ${g(total)} or ${totalPct}% — ${x + 10 >= 100 ? "not" : "a little less than"} ${x + 10}% off${x + 10 < 100 ? ` (${g(sale(x + 10, y))})` : ""}.`]
  ];
  const ld = [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], ["Discount Calculator", SITE + BASE], [`${x}% off ${g(y)}`, url]]), site.faqLd(q)];
  const otherPcts = PCTS.map((pc) => [pc === x ? `<strong>${pc}% off</strong>` : `<a href="${BASE}${slug(pc, y)}/">${pc}% off ${g(y)}</a>`, g(sale(pc, y)), g(saving(pc, y))]);
  const otherPrices = site.neighbours(PRICES, y, 5).concat([y]).sort((a, b) => a - b)
    .map((m) => [m === y ? `<strong>${x}% off ${g(m)}</strong>` : `<a href="${BASE}${slug(x, m)}/">${x}% off ${g(m)}</a>`, g(sale(x, m)), g(saving(x, m))]);
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="${BASE}">← Discount calculator</a>
      <h1 class="page-title">${x}% off ${g(y)}</h1>
      <p class="page-subtitle">${x}% off ${g(y)} is <strong>${g(p)}</strong> — you save ${g(s)}.</p>
    </header>

    <main class="tool" id="dp-tool">
      <div class="field-row">
        <div class="field"><label for="dp-price">Original price</label><input type="number" id="dp-price" value="${y}" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="dp-pct">Discount (%)</label><input type="number" id="dp-pct" value="${x}" min="0" max="100" step="any" inputmode="decimal"></div>
      </div>
      <div class="field" style="max-width:260px;"><label for="dp-extra">Extra % off at the till (optional)</label><input type="number" id="dp-extra" value="" min="0" max="100" step="any" inputmode="decimal" placeholder="0"></div>
      <p class="tool-hint" id="dp-error" role="alert" style="color: var(--bad); display: none;"></p>
      <div class="result-box" aria-live="polite">
        <div class="result-grid">
          <div class="result-row highlight"><span class="r-label">Sale price</span><span class="r-value" id="dp-sale">${g(p)}</span></div>
          <div class="result-row"><span class="r-label">You save</span><span class="r-value" id="dp-save">${g(s)}</span></div>
          <div class="result-row"><span class="r-label">Total discount</span><span class="r-value" id="dp-total">${x}%</span></div>
        </div>
      </div>
      <p class="tool-hint" style="margin-top:12px;">The sums are the same in dollars, euros or any currency. For several discounts in a row, or the original price from a sale price, use the <a href="${BASE}">discount calculator</a>.</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">How to work out ${x}% off ${g(y)}</h2>
      <p class="about-text"><strong>Step 1, the saving:</strong> ${g(y)} × ${x} ÷ 100 = <strong>${g(s)}</strong>.</p>
      <p class="about-text"><strong>Step 2, the sale price:</strong> ${g(y)} − ${g(s)} = <strong>${g(p)}</strong>.</p>
      <p class="about-text"><strong>In one go:</strong> with ${x}% off you pay ${100 - x}% of the price, so multiply by ${mult}: ${g(y)} × ${mult} = ${g(p)}.</p>
      <p class="about-text"><strong>In the shop:</strong> ${shortcut(x, y)}</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">Other discounts on ${g(y)}</h2>
${site.table(["Discount", "You pay", "You save"], otherPcts, 300)}      <h2 class="tool-section-title" style="margin-top:20px;">${x}% off other prices</h2>
${site.table(["Price", "You pay", "You save"], otherPrices, 300)}    </main>

    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}    </main>

${site.FOOTER}
  </div>
  <script src="/discount-page.js"></script>
</body>
</html>
`;
}

function hubBlock() {
  const file = path.join(site.ROOT, "discount/index.html");
  const START = "    <!-- discount pages: generated by tools/build-discount-pages.js -->\n", END = "    <!-- end discount pages -->\n";
  let s = fs.readFileSync(file, "utf8");
  if (s.includes(START)) s = s.slice(0, s.indexOf(START)) + s.slice(s.indexOf(END) + END.length).replace(/^\n+/, "");
  const html = `    <main class="tool">
      <h2 class="tool-section-title">Common discounts worked out</h2>
${PCTS.map((x) => `      <p class="salary-links"><strong>${x}% off:</strong> ${PRICES.map((y) => `<a href="${BASE}${slug(x, y)}/">£${y}</a>`).join(" ")}</p>`).join("\n")}
    </main>

`;
  const at = s.indexOf("    <!-- related calculators: generated by tools/related.js -->");
  if (at < 0) throw new Error("discount: related marker not found");
  s = s.slice(0, at).replace(/\n{3,}$/, "\n\n") + START + html + END + "\n" + s.slice(at);
  fs.writeFileSync(file, s);
}

/* Hand checks: 20% off 50 = 40; 15% off 75 = 63.75; 33% off 120 = 80.40; 35% off 45 = 29.25 */
if (sale(20, 50) !== 40 || sale(15, 75) !== 63.75 || sale(33, 120) !== 80.4 || sale(35, 45) !== 29.25) throw new Error("discount check");

const urls = [];
PCTS.forEach((x) => PRICES.forEach((y) => { site.write(`discount/${slug(x, y)}`, page(x, y)); urls.push([`${BASE}${slug(x, y)}/`, "0.4"]); }));
hubBlock();
site.prune("discount", /^\d+-percent-off-\d+$/);
site.sitemapBlock("discount pages", "tools/build-discount-pages.js", urls);
console.log(`built ${urls.length} discount pages`);
