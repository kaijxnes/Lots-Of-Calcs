#!/usr/bin/env node
/* Builds /dry-january-calculator/ with the example worked out in the HTML.

       node tools/build-dry-january.js

   Units and calories come from dry-january.js (NHS unit figures). */
const site = require("./lib/site.js");
const related = require("./related.js");
const D = require("../dry-january.js");
const { esc, SITE } = site;

function page() {
  const url = SITE + "/dry-january-calculator/";
  const w = D.week(D.DRINKS.map((d) => ({ key: d.key, per: d.per, price: d.price })));
  const title = "Dry January Calculator — How Much Will I Save Giving Up Alcohol?";
  const desc = `Work out the money, alcohol units and calories you save by not drinking in January — and over a year. Four pints and three glasses of wine a week costs about ${D.pounds(w.money * D.JAN_WEEKS)} in January.`;
  const unitRows = D.DRINKS.map((d) => [esc(d.name), D.n1(D.units(d)), D.n0(D.units(d) * D.KCAL_PER_UNIT)]);
  const q = [
    ["How much will I save doing Dry January?", `Add up what you'd normally spend in a week and multiply by 4.4 (January has 31 days). Four pints at £5.50 and three glasses of wine at £7 is ${D.pounds(w.money)} a week, or about ${D.pounds(w.money * D.JAN_WEEKS)} over January.`],
    ["How many units are in a drink?", "Strength (ABV) × volume in ml ÷ 1,000. A pint of 5.2% lager is about 3 units, a 175ml glass of 12% wine 2.1, and a 25ml single of 40% spirit 1 (NHS)."],
    ["How many units a week is safe?", "The NHS advises men and women not to drink more than 14 units a week on a regular basis, spread over three or more days, with several drink-free days each week."],
    ["How many calories are in alcohol?", "Alcohol has about 7 calories per gram, and a unit is 8g, so each unit is about 56 calories before any sugar in the drink or mixer — a pint of 5.2% lager has at least 165 from the alcohol alone."]
  ];
  const ld = [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], ["Dry January Calculator", url]]),
    { "@context": "https://schema.org", "@type": "WebApplication", name: "Dry January Calculator", url, applicationCategory: "HealthApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } }, site.faqLd(q)];
  const inputs = D.DRINKS.map((d) => `      <div class="field-row">
        <div class="field"><label for="dj-n-${d.key}">${esc(d.name)} — a week</label><input type="number" id="dj-n-${d.key}" value="${d.per}" min="0" step="any" inputmode="decimal"></div>
        <div class="field" style="max-width:130px;"><label for="dj-p-${d.key}">Price (£)</label><input type="number" id="dj-p-${d.key}" value="${d.price}" min="0" step="any" inputmode="decimal"></div>
      </div>`).join("\n");
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="/">← All calculators</a>
      <h1 class="page-title">Dry January calculator</h1>
      <p class="page-subtitle">The money, units and calories you save by not drinking for January.</p>
    </header>

    <main class="tool" id="dj-tool">
${inputs}
      <p class="tool-hint">Prices are examples — put in what you usually pay.</p>
      <div class="result-box" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="dj-jan">${D.pounds(w.money * D.JAN_WEEKS)}</div>
          <div class="label">saved over January (31 days)</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row"><span class="r-label">A normal week</span><span class="r-value" id="dj-week">${D.pounds(w.money)} and ${D.n1(w.units)} units</span></div>
          <div class="result-row"><span class="r-label">Against the guideline</span><span class="r-value" id="dj-limit">${w.units > D.LIMIT ? D.n1(w.units - D.LIMIT) + " units over the NHS's 14 a week" : "Within the NHS's 14 units a week"}</span></div>
          <div class="result-row"><span class="r-label">Cut in January</span><span class="r-value" id="dj-jan-units">${D.n0(w.units * D.JAN_WEEKS)} units, ${D.n0(w.kcal * D.JAN_WEEKS)} calories</span></div>
          <div class="result-row highlight"><span class="r-label">Over a whole year</span><span class="r-value" id="dj-year">${D.pounds(w.money * D.YEAR_WEEKS)}</span></div>
          <div class="result-row"><span class="r-label">Cut over a year</span><span class="r-value" id="dj-year-units" style="text-align:right;">${D.n0(w.units * D.YEAR_WEEKS)} units, ${D.n0(w.kcal * D.YEAR_WEEKS)} calories (about ${D.n1(w.kcal * D.YEAR_WEEKS / 7700)} kg of body fat's worth)</span></div>
        </div>
      </div>
      <p class="tool-hint" style="margin-top:12px;">Calories are from the alcohol alone (about 56 a unit); sugar in the drink and mixers adds more. If you drink heavily, stopping suddenly can be unsafe — talk to your GP first.</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">Units and calories in common drinks</h2>
${site.table(["Drink", "Units", "Calories from alcohol"], unitRows, 420)}      <p class="tool-hint" style="margin-top:12px;">Units are ABV × ml ÷ 1,000, as the NHS works them out; the NHS advises no more than 14 a week. Put the money towards something with the <a href="/savings-goal/">savings goal calculator</a>, or see what the calories mean with the <a href="/calorie-calculator/">calorie calculator</a>.</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}    </main>

${related.block("/dry-january-calculator/")}
${site.FOOTER}
  </div>
  <script src="/dry-january.js"></script>
</body>
</html>
`;
}

/* NHS's own figures: pint of 5.2% about 3 units (2.95), 175ml of 12% 2.1, 25ml of 40% 1 */
const u = (k) => Math.round(D.units(D.DRINKS.find((d) => d.key === k)) * 100) / 100;
if (u("pint-high") !== 2.95 || u("wine-175") !== 2.1 || u("spirit") !== 1 || u("pint-low") !== 2.04) throw new Error("unit check");
site.write("dry-january-calculator", page());
console.log("built /dry-january-calculator/");
