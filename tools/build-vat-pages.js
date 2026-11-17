#!/usr/bin/env node
/* "VAT on £100" — a page per amount, with VAT added and taken out:

       /vat/100/     £100 plus VAT is £120; £100 including VAT is £83.33 + £16.67

       node tools/build-vat-pages.js

   UK rates from GOV.UK (https://www.gov.uk/vat-rates): standard 20% (most
   goods and services), reduced 5% (e.g. home energy, children's car seats)
   and zero 0% (e.g. most food, children's clothes). Adding VAT multiplies by
   1 + rate; removing it divides by 1 + rate. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const { esc, SITE } = site;

const BASE = "/vat/";
const AMOUNTS = [1, 5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90, 100, 120, 125, 150, 175, 200, 250, 300, 350, 400, 450, 500, 600, 700, 750, 800, 900, 1000, 1200, 1250, 1500, 2000, 2500, 3000, 4000, 5000, 7500, 10000, 15000, 20000, 25000, 50000, 100000];
const SRC = '<a href="https://www.gov.uk/vat-rates" rel="noopener">GOV.UK VAT rates</a>';
const r2 = (v) => Math.round(v * 100) / 100;
const m = (v) => "£" + r2(v).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const m0 = (v) => (Number.isInteger(v) ? "£" + v.toLocaleString("en-GB") : m(v));
const add = (a, rate) => ({ vat: r2(a * rate / 100), gross: r2(a * (1 + rate / 100)) });
const remove = (a, rate) => { const net = r2(a / (1 + rate / 100)); return { net, vat: r2(a - net) }; };

function page(a) {
  const url = SITE + `${BASE}${a}/`;
  const ad = add(a, 20), rm = remove(a, 20), ad5 = add(a, 5), rm5 = remove(a, 5);
  const title = site.fitTitle(`VAT on ${m0(a)} — ${m(ad.gross)} Including VAT, ${m(rm.net)} Excluding VAT`, `VAT on ${m0(a)} — ${m(ad.gross)} Inc VAT, ${m(rm.net)} Ex VAT`, `VAT on ${m0(a)} — ${m(ad.gross)} Including VAT (20%)`);
  const desc = `${m0(a)} plus 20% VAT is ${m(ad.gross)} (${m(ad.vat)} VAT). If ${m0(a)} already includes VAT, it's ${m(rm.net)} before VAT plus ${m(rm.vat)} VAT. With 5% VAT too.`;
  const q = [
    [`What is ${m0(a)} plus VAT?`, `${m(ad.gross)} at the standard 20% rate: ${m0(a)} × 1.2. The VAT is ${m(ad.vat)}. At the reduced 5% rate it's ${m(ad5.gross)}.`],
    [`How much VAT is in ${m0(a)}?`, `If ${m0(a)} includes VAT at 20%, the VAT is ${m(rm.vat)} and the price before VAT is ${m(rm.net)}: divide by 1.2 to take VAT off. At 5% the VAT is ${m(rm5.vat)}.`],
    ["Why isn't the VAT in a price just 20% of it?", `Because the 20% is added to the price before VAT, so it's a sixth (20/120) of the VAT-inclusive total. Taking 20% off ${m0(a)} would give ${m(a * 0.8)}, which is ${m(rm.net - a * 0.8)} too little.`],
    ["Which VAT rate applies?", "The standard rate of 20% covers most goods and services; the reduced rate of 5% applies to some, such as home energy and children's car seats; and zero-rated items, such as most food and children's clothes, have none (GOV.UK)."]
  ];
  const ld = [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], ["VAT Calculator", SITE + BASE], [`VAT on ${m0(a)}`, url]]), site.faqLd(q)];
  const rows = [20, 5, 0].map((r) => { const x = add(a, r), y = remove(a, r); return [`${r}%${r === 20 ? " (standard)" : r === 5 ? " (reduced)" : " (zero)"}`, m(x.vat), m(x.gross), m(y.net), m(y.vat)]; });
  const near = site.neighbours(AMOUNTS, a, 6).filter((x) => x !== a).map((x) => `<a href="${BASE}${x}/">VAT on ${m0(x)}</a>`).join(" ");
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="${BASE}">← VAT calculator</a>
      <h1 class="page-title">VAT on ${m0(a)}</h1>
      <p class="page-subtitle">${m0(a)} plus VAT is ${m(ad.gross)}; ${m0(a)} including VAT is ${m(rm.net)} plus ${m(rm.vat)} VAT.</p>
    </header>

    <main class="tool" id="vp-tool">
      <div class="field-row">
        <div class="field"><label for="vp-amount">Amount (£)</label><input type="number" id="vp-amount" value="${a}" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="vp-rate">VAT rate</label><select id="vp-rate"><option value="20" selected>20% standard</option><option value="5">5% reduced</option><option value="0">0% zero</option></select></div>
      </div>
      <p class="tool-hint" id="vp-error" role="alert" style="color: var(--bad); display: none;"></p>
      <div class="result-box" aria-live="polite">
        <p class="tool-section-title" style="margin-top:0;">Add VAT</p>
        <div class="result-grid">
          <div class="result-row"><span class="r-label">VAT</span><span class="r-value" id="vp-add-vat">${m(ad.vat)}</span></div>
          <div class="result-row highlight"><span class="r-label">Including VAT</span><span class="r-value" id="vp-add-total">${m(ad.gross)}</span></div>
        </div>
        <hr class="divider">
        <p class="tool-section-title" style="margin-top:0;">Remove VAT (the amount already includes it)</p>
        <div class="result-grid">
          <div class="result-row highlight"><span class="r-label">Excluding VAT</span><span class="r-value" id="vp-rem-net">${m(rm.net)}</span></div>
          <div class="result-row"><span class="r-label">VAT in it</span><span class="r-value" id="vp-rem-vat">${m(rm.vat)}</span></div>
        </div>
      </div>
      <p class="tool-hint" style="margin-top:12px;">For another rate or currency, use the <a href="${BASE}">VAT calculator</a>.</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">${m0(a)} at each UK VAT rate</p>
${site.table(["Rate", "VAT added", `${m0(a)} + VAT`, "Ex VAT, if VAT included", "VAT included"], rows, 560)}      <p class="tool-hint" style="margin-top:12px;">To add VAT, multiply by 1.2 (or 1.05 at 5%); to remove it, divide by 1.2 (or 1.05). Rates from ${SRC}. Pennies are rounded to the nearest 1p.</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">Frequently asked questions</p>
${site.faqHtml(q)}    </main>

    <div class="hub-group-title" style="margin-top:28px;">Other amounts</div>
    <p class="salary-links">${near}</p>

${site.FOOTER}
  </div>
  <script src="/vat-page.js"></script>
</body>
</html>
`;
}

/* A list on the calculator page so every amount page is reachable */
function hubBlock() {
  const file = path.join(site.ROOT, "vat/index.html");
  const START = "    <!-- vat amount pages: generated by tools/build-vat-pages.js -->\n", END = "    <!-- end vat amount pages -->\n";
  let s = fs.readFileSync(file, "utf8");
  if (s.includes(START)) s = s.slice(0, s.indexOf(START)) + s.slice(s.indexOf(END) + END.length);
  const html = `    <main class="tool">
      <p class="tool-section-title">VAT on common amounts</p>
      <p class="salary-links">${AMOUNTS.map((a) => `<a href="${BASE}${a}/">${m0(a)}</a>`).join(" ")}</p>
    </main>

`;
  const at = s.indexOf("    <!-- related calculators: generated by tools/related.js -->");
  s = s.slice(0, at) + START + html + END + "\n" + s.slice(at);
  fs.writeFileSync(file, s);
}

/* Hand checks: £100 + 20% = £120; £120 inclusive = £100 + £20; £100 inclusive = £83.33 + £16.67 */
if (add(100, 20).gross !== 120 || remove(120, 20).net !== 100 || remove(100, 20).net !== 83.33 || remove(100, 20).vat !== 16.67) throw new Error("VAT check");

const urls = [];
AMOUNTS.forEach((a) => { site.write(`vat/${a}`, page(a)); urls.push([`${BASE}${a}/`, "0.5"]); });
hubBlock();
site.prune("vat", /^\d+$/);
site.sitemapBlock("vat amount pages", "tools/build-vat-pages.js", urls);
console.log(`built ${urls.length} VAT amount pages`);
