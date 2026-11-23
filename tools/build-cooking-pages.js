#!/usr/bin/env node
/* Cups to grams by ingredient — the conversion US recipes need:

       /cups-to-grams/                      converter, any ingredient and amount
       /cups-to-grams/all-purpose-flour/    1 cup = 120 g, with every common measure

       node tools/build-cooking-pages.js

   Weights are King Arthur Baking's (data/cooking/ingredients.json). The
   chart gives grams for one stated measure per ingredient; grams per cup
   follow from 1 cup = 16 tablespoons = 48 teaspoons. US cups (236.6 ml). */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const related = require("./related.js");
const { SITE, esc } = site;

const BASE = "/cups-to-grams/";
const DATA = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/cooking/ingredients.json"), "utf8"));

function cupsIn(volume) {
  const m = volume.match(/\(([^)]+)\)/), v = (m ? m[1] : volume).trim();
  const unit = /cup/.test(v) ? 1 : /tablespoon/.test(v) ? 1 / 16 : /teaspoon/.test(v) ? 1 / 48 : NaN;
  const q = v.match(/^(\d+)(?:\s+(\d+)\/(\d+)|\/(\d+))?/);
  if (!q || !isFinite(unit)) throw new Error("can't read volume " + volume);
  const amount = q[4] ? Number(q[1]) / Number(q[4]) : Number(q[1]) + (q[2] ? Number(q[2]) / Number(q[3]) : 0);
  return amount * unit;
}
const ING = DATA.ingredients.map((i) => Object.assign({}, i, { perCup: i.grams / cupsIn(i.volume) }));
const SMALL = (i) => i.perCup / 48 * 3 < 30 && /salt|baking|yeast|vanilla/.test(i.slug); /* measured in spoons */

const g = (v) => (v < 10 ? Math.round(v * 10) / 10 : Math.round(v)).toLocaleString("en-GB") + " g";
const MEASURES = [["⅛ cup", 1 / 8], ["¼ cup", 1 / 4], ["⅓ cup", 1 / 3], ["½ cup", 1 / 2], ["⅔ cup", 2 / 3], ["¾ cup", 3 / 4], ["1 cup", 1], ["1½ cups", 1.5], ["2 cups", 2], ["2½ cups", 2.5], ["3 cups", 3], ["4 cups", 4]];
const SPOONS = [["½ teaspoon", 1 / 96], ["1 teaspoon", 1 / 48], ["2 teaspoons", 2 / 48], ["1 tablespoon", 1 / 16], ["2 tablespoons", 2 / 16], ["3 tablespoons", 3 / 16], ["4 tablespoons", 4 / 16]];
const GRAMS = [25, 50, 100, 125, 150, 200, 250, 300, 400, 500];
function cupsText(c) {
  const fr = [[0, ""], [1 / 8, "⅛"], [1 / 4, "¼"], [1 / 3, "⅓"], [1 / 2, "½"], [2 / 3, "⅔"], [3 / 4, "¾"], [1, ""]];
  const whole = Math.floor(c), rest = c - whole;
  let best = fr[0];
  fr.forEach((f) => { if (Math.abs(f[0] - rest) < Math.abs(best[0] - rest)) best = f; });
  const w = best[0] === 1 ? whole + 1 : whole, s = best[0] === 1 ? "" : best[1];
  const txt = (w ? w : "") + s || "0", near = w + (best[0] === 1 ? 0 : best[0]);
  const dec = (Math.round(c * 100) / 100).toLocaleString("en-GB");
  const plural = w > 1 || (w === 1 && s) ? "s" : "";
  if (Math.abs(near - c) < 0.02) return `${txt} cup${plural}`;
  return `${dec} cups (${c > near ? "a little over" : "just under"} ${txt} cup${plural})`;
}

function page(i) {
  const T = i.name.replace(/(^|[\s(-])([a-z])/g, (m, a, b) => a + b.toUpperCase());
  const url = SITE + `${BASE}${i.slug}/`, name = i.name, lower = name.toLowerCase(), cup = i.perCup, small = SMALL(i);
  const also = i.alsoCalled ? ` (${i.alsoCalled})` : "";
  const title = small
    ? site.fitTitle(`${T} in Grams — 1 Teaspoon = ${g(cup / 48)}, 1 Tablespoon = ${g(cup / 16)}`, `${T}: 1 Tsp = ${g(cup / 48)}, 1 Tbsp = ${g(cup / 16)}`)
    : site.fitTitle(`Cups to Grams: ${T} — 1 Cup = ${g(cup)} (Conversion Chart)`, `${T} Cups to Grams — 1 Cup = ${g(cup)} (Chart)`, `${T} Cups to Grams: 1 Cup = ${g(cup)}`);
  const desc = small
    ? `1 teaspoon of ${lower} weighs ${g(cup / 48)} and 1 tablespoon ${g(cup / 16)}, from King Arthur Baking's weight chart. Every common spoon measure in grams.`
    : `1 cup of ${lower}${also} weighs ${g(cup)}; ½ cup is ${g(cup / 2)} and ¼ cup ${g(cup / 4)}. A chart of every common cup and spoon measure in grams, and grams back to cups.`;
  const q = [
    small ? [`How many grams is a teaspoon of ${lower}?`, `${g(cup / 48)}; a tablespoon is ${g(cup / 16)}. These are King Arthur Baking's figures — the chart gives ${i.grams} g for ${i.volume}.`]
      : [`How many grams is 1 cup of ${lower}?`, `${g(cup)}, using King Arthur Baking's weight chart (${i.volume} = ${i.grams} g). A US cup is 236.6 ml.`],
    [`How many grams is ½ cup of ${lower}?`, `${g(cup / 2)}.`],
    [`How many cups is 100 g of ${lower}?`, `${cupsText(100 / cup)}.`],
    ["Why do different charts give different weights?", "A cup measures volume, so the weight depends on how the cup is filled: flour spooned in and levelled weighs less than flour scooped and packed. These figures are for spooning in and levelling off, King Arthur Baking's method. Weighing ingredients is always more reliable than cups."]
  ];
  const ld = [site.webPage(title, desc, url, DATA.lastChecked), site.breadcrumb([["Home", SITE + "/"], ["Cups to Grams", SITE + BASE], [name, url]]), site.faqLd(q)];
  const cupRows = MEASURES.map(([l, c]) => [l, g(cup * c)]);
  const spoonRows = SPOONS.map(([l, c]) => [l, g(cup * c)]);
  const gramRows = GRAMS.map((x) => [`${x} g`, cupsText(x / cup)]);
  const others = ING.filter((x) => x.slug !== i.slug && !SMALL(x)).slice(0, 60).map((x) => `<a href="${BASE}${x.slug}/">${esc(x.name.toLowerCase())}</a>`);
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="${BASE}">← Cups to grams converter</a>
      <h1 class="page-title">${small ? `${esc(name)} in grams` : `Cups to grams: ${esc(lower)}`}</h1>
      <p class="page-subtitle">${small ? `1 teaspoon of ${esc(lower)} is <strong>${g(cup / 48)}</strong>; 1 tablespoon is <strong>${g(cup / 16)}</strong>.` : `1 cup of ${esc(lower)}${esc(also)} is <strong>${g(cup)}</strong>.`}</p>
    </header>

    <main class="tool">
${small ? `      <h2 class="tool-section-title">Spoons to grams</h2>
${site.table(["Measure", "Grams"], spoonRows, 260)}` : `      <h2 class="tool-section-title">Cups to grams</h2>
${site.table(["Measure", "Grams"], cupRows, 260)}      <h2 class="tool-section-title" style="margin-top:20px;">Spoons to grams</h2>
${site.table(["Measure", "Grams"], spoonRows.slice(1), 260)}      <h2 class="tool-section-title" style="margin-top:20px;">Grams to cups</h2>
${site.table(["Weight", "Cups"], gramRows, 260)}`}      <p class="tool-hint" style="margin-top:12px;">US cups and spoons, filled by spooning in and levelling off. From the <a href="${DATA.source.url}" rel="noopener">${esc(DATA.source.title)}</a> (${esc(i.chart)}: ${esc(i.volume)} = ${i.grams} g). Any amount: the <a href="${BASE}">cups to grams converter</a>.</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}    </main>

    <main class="tool">
      <h2 class="tool-section-title">Other ingredients</h2>
      <p class="salary-links">${others.join(" ")}</p>
    </main>

${site.FOOTER}
  </div>
</body>
</html>
`;
}

function hub() {
  const url = SITE + BASE;
  const title = "Cups to Grams Converter — Flour, Sugar, Butter and 40 More Ingredients";
  const desc = "Convert US cups, tablespoons and teaspoons to grams — and grams to cups — for flour, sugar, butter, oats, cocoa and 40 more ingredients, using King Arthur Baking's weights.";
  const flour = ING.find((x) => x.slug === "all-purpose-flour"), sugar = ING.find((x) => x.slug === "granulated-sugar"), butter = ING.find((x) => x.slug === "butter");
  const q = [
    ["How many grams is a cup of flour?", `${g(flour.perCup)} of all-purpose (plain) flour, spooned in and levelled. Scooped straight from the bag it can be 150 g or more, which is why weighing is more reliable.`],
    ["How many grams is a cup of sugar?", `${g(sugar.perCup)} of granulated sugar.`],
    ["How many grams is a cup of butter?", `${g(butter.perCup)} — a US stick of butter is ½ cup, ${g(butter.perCup / 2)}.`],
    ["Is a US cup the same as a UK or metric cup?", "No. A US cup is 236.6 ml; a metric cup (used in Australia and elsewhere) is 250 ml, about 6% more. Old British recipes sometimes used a 284 ml cup. These conversions are for US cups."]
  ];
  const ldx = [site.webPage(title, desc, url, DATA.lastChecked), site.breadcrumb([["Home", SITE + "/"], ["Cups to Grams", url]]),
    { "@context": "https://schema.org", "@type": "WebApplication", name: "Cups to Grams Converter", url, applicationCategory: "UtilitiesApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } }, site.faqLd(q)];
  const options = ING.map((x) => `<option value="${x.perCup}"${x.slug === "all-purpose-flour" ? " selected" : ""}>${esc(x.name)}${x.alsoCalled ? " / " + esc(x.alsoCalled) : ""}</option>`).join("");
  const table = ING.filter((x) => !SMALL(x)).map((x) => [`<a href="${BASE}${x.slug}/">${esc(x.name)}</a>`, g(x.perCup), g(x.perCup / 2), g(x.perCup / 16)]);
  return site.head({ title, desc, url, ld: ldx }) + `    <header class="site-header">
      <a class="back-link" href="/">← All calculators</a>
      <h1 class="page-title">Cups to grams converter</h1>
      <p class="page-subtitle">US cups and spoons to grams, and back, for ${ING.length} baking and cooking ingredients.</p>
    </header>

    <main class="tool" id="cg-tool">
      <div class="field"><label for="cg-ing">Ingredient</label><select id="cg-ing">${options}</select></div>
      <div class="field-row">
        <div class="field"><label for="cg-amount">Amount</label><input type="number" id="cg-amount" value="1" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="cg-unit">Unit</label><select id="cg-unit"><option value="1" selected>Cups</option><option value="0.0625">Tablespoons</option><option value="0.0208333333">Teaspoons</option><option value="g">Grams</option></select></div>
      </div>
      <p class="tool-hint" id="cg-error" role="alert" style="color: var(--bad); display: none;"></p>
      <div class="result-box" aria-live="polite">
        <div class="result-grid">
          <div class="result-row highlight"><span class="r-label">Grams</span><span class="r-value" id="cg-grams">${g(flour.perCup)}</span></div>
          <div class="result-row"><span class="r-label">Cups</span><span class="r-value" id="cg-cups">1</span></div>
          <div class="result-row"><span class="r-label">Tablespoons</span><span class="r-value" id="cg-tbsp">16</span></div>
        </div>
      </div>
      <p class="tool-hint" style="margin-top:12px;">US measures, spooned in and levelled. Weights from the <a href="${DATA.source.url}" rel="noopener">${esc(DATA.source.title)}</a>.</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">One cup in grams</h2>
${site.table(["Ingredient", "1 cup", "½ cup", "1 tablespoon"], table, 420)}      <p class="salary-links" style="margin-top:12px;"><strong>Spoon measures:</strong> ${ING.filter(SMALL).map((x) => `<a href="${BASE}${x.slug}/">${esc(x.name.toLowerCase())}</a>`).join(" ")}</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}    </main>

${related.block(BASE)}
${site.FOOTER}
  </div>
  <script>
  (function () {
    var $ = function (id) { return document.getElementById(id); };
    function fmt(v, dp) { return (Math.round(v * Math.pow(10, dp)) / Math.pow(10, dp)).toLocaleString("en-GB"); }
    function calc() {
      var per = Number($("cg-ing").value), amt = Number($("cg-amount").value), unit = $("cg-unit").value, err = $("cg-error");
      if (!(amt >= 0) || $("cg-amount").value === "") { err.textContent = "Enter an amount."; err.style.display = "block"; return; }
      err.style.display = "none";
      var cups = unit === "g" ? amt / per : amt * Number(unit), grams = cups * per;
      $("cg-grams").textContent = fmt(grams, grams < 10 ? 1 : 0) + " g";
      $("cg-cups").textContent = fmt(cups, 2);
      $("cg-tbsp").textContent = fmt(cups * 16, 1);
    }
    ["cg-ing", "cg-unit"].forEach(function (id) { $(id).addEventListener("change", calc); });
    $("cg-amount").addEventListener("input", calc);
    calc();
  })();
  </script>
</body>
</html>
`;
}

/* Hand checks: flour 120 g a cup; butter 8 tbsp = 113 g so 226 g a cup; cornstarch ¼ cup 28 g so 112 g a cup */
const by = (s) => ING.find((x) => x.slug === s).perCup;
if (by("all-purpose-flour") !== 120 || by("butter") !== 226 || by("cornstarch") !== 112 || Math.abs(by("salt") - 288) > 1e-9) throw new Error("cooking check");

const urls = [];
site.write("cups-to-grams", hub());
ING.forEach((i) => { site.write(`cups-to-grams/${i.slug}`, page(i)); urls.push([`${BASE}${i.slug}/`, "0.5"]); });
site.prune("cups-to-grams", /^[a-z0-9-]+$/);
site.sitemapBlock("cups to grams pages", "tools/build-cooking-pages.js", urls);
console.log(`built ${urls.length + 1} cups to grams pages`);
