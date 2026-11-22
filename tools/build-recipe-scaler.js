#!/usr/bin/env node
/* Recipe scaler: paste the ingredients, change the servings, and every
   quantity is scaled — whole numbers, decimals, fractions (½, 1 1/2) and
   ranges. Pure arithmetic; nothing here goes out of date.

       node tools/build-recipe-scaler.js */
const site = require("./lib/site.js");
const related = require("./related.js");
const { esc, SITE } = site;

const path = "/recipe-scaler/", url = SITE + path;
const title = "Recipe Scaler — Double, Halve or Scale Any Recipe's Ingredients";
const desc = "Paste a recipe's ingredients, change the number of servings, and every quantity is scaled for you — including fractions like ½ and 1 ½. Double, halve or scale a recipe to any size.";
const SAMPLE = "250g plain flour\n2 eggs\n1 1/2 tsp baking powder\n125ml milk\n½ tsp salt\n100g butter, melted";
const q = [
  ["How do I scale a recipe?", "Divide the servings you want by the servings the recipe makes, and multiply every quantity by that. A recipe for 4 made for 6 is × 1.5: 250g flour becomes 375g and 2 eggs become 3."],
  ["How do I halve a recipe with one egg?", "Beat the egg and use half of it — about half the weight. Or keep the whole egg if the recipe is forgiving, such as pancakes."],
  ["Do cooking times change when I scale a recipe?", "Often, but not in proportion. A bigger cake in a bigger tin can take longer; the same cakes in more tins take about the same time. Check it's cooked rather than multiplying the time."],
  ["What about tin sizes?", "When you double a cake, use a tin with about twice the area, or two tins. The area of a round tin goes up with the square of its width, so a 23cm tin holds about a third more than a 20cm one."]
];
const ld = [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], ["Recipe Scaler", url]]),
  { "@context": "https://schema.org", "@type": "WebApplication", name: "Recipe Scaler", url, applicationCategory: "UtilitiesApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } }, site.faqLd(q)];
const html = site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="/">← All calculators</a>
      <h1 class="page-title">Recipe scaler</h1>
      <p class="page-subtitle">Paste the ingredients, set the servings, and every quantity is scaled — fractions included.</p>
    </header>

    <main class="tool" id="rs-tool">
      <div class="field-row">
        <div class="field"><label for="rs-from">Recipe serves</label><input type="number" id="rs-from" value="4" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="rs-to">You want to serve</label><input type="number" id="rs-to" value="6" min="0" step="any" inputmode="decimal"></div>
      </div>
      <div class="field"><label for="rs-in">Ingredients, one per line</label><textarea id="rs-in" rows="8">${esc(SAMPLE)}</textarea></div>
      <p class="salary-links" style="margin-top:8px;"><button type="button" class="btn btn-ghost" data-x="0.5">Halve</button> <button type="button" class="btn btn-ghost" data-x="2">Double</button> <button type="button" class="btn btn-ghost" data-x="3">Triple</button></p>
      <div class="result-box" aria-live="polite">
        <div class="result-hero"><div class="value" id="rs-factor">× 1.5</div><div class="label">scale</div></div>
        <pre id="rs-out" style="white-space:pre-wrap; font:inherit; margin:12px 0 0;"></pre>
      </div>
      <p class="tool-hint" style="margin-top:12px;">The first number on each line is scaled (and a range like "2-3" both ends). Check anything that doesn't scale neatly — eggs, pinches and tin sizes — by eye.</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">Frequently asked questions</p>
${site.faqHtml(q)}    </main>

${related.block(path)}
${site.FOOTER}
  </div>
  <script src="/recipe-scaler.js"></script>
</body>
</html>
`;
site.write("recipe-scaler", html);
console.log("built /recipe-scaler/");
