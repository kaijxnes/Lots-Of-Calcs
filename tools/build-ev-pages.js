#!/usr/bin/env node
/* "How much does it cost to charge a Tesla Model 3?" — a page per car:

       /ev-charging-cost/tesla-model-3/

       node tools/build-ev-pages.js

   Cars come from data/ev/models.json (EV Database: usable battery, WLTP and
   real-world range and consumption); the home electricity price is the
   Ofgem price cap in data/energy/uk.json, so this runs in the monthly
   rebuild. Home (AC) charging is taken as 90% efficient and rapid (DC) as
   95%, the EV charging calculator's own defaults. Other prices per kWh are
   examples, not quotes. Also writes the calculator's car list. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const { SITE } = site;

const BASE = "/ev-charging-cost/";
const DATA = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/ev/models.json"), "utf8"));
const ENERGY = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/energy/uk.json"), "utf8"));
const CAP = ENERGY.electricity.unitRate, PERIOD = ENERGY.period.short;
const AC = 0.9, DC = 0.95, HOME_KW = 7.4, MILES = 10000;
const EXAMPLES = [7.5, 15, CAP, 50, 79];

const pounds = (p) => "£" + (p / 100).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pence = (p) => (p < 100 ? p.toFixed(1) + "p" : pounds(p));
const r1 = (v) => Math.round(v * 10) / 10;

function figures(c) {
  const fullGrid = c.usableKwh / AC;
  const perMileKwh = c.realWhPerMile / 1000 / AC;
  return {
    fullGrid,
    full: fullGrid * CAP,
    rapid1080: (c.usableKwh * 0.7 / DC) * 79,
    perMile: perMileKwh * CAP,
    year: perMileKwh * CAP * MILES,
    hours: fullGrid / HOME_KW,
    miPerKwh: r1(1000 / c.realWhPerMile)
  };
}
const hm = (h) => `${Math.floor(h)}h ${String(Math.round((h % 1) * 60)).padStart(2, "0")}m`;

function page(c) {
  const f = figures(c), url = SITE + `${BASE}${c.slug}/`;
  const title = site.fitTitle(`${c.name} Charging Cost — ${pounds(f.full)} for a Full Charge at Home`, `${c.name} Charging Cost — ${pounds(f.full)} a Full Charge`);
  const desc = `Charging a ${c.name} (${c.usableKwh} kWh usable) from empty at home costs about ${pounds(f.full)} at the price cap rate of ${CAP}p/kWh — ${pence(f.perMile)} a mile. Cheaper on an EV tariff, dearer at rapid chargers.`;
  const rows = EXAMPLES.map((p) => [p === CAP ? `<strong>${p}p</strong> (price cap, ${PERIOD})` : `${p}p`, pounds(f.fullGrid * p), pounds(c.usableKwh * 0.7 / (p >= 40 ? DC : AC) * p), pence(c.realWhPerMile / 1000 / (p >= 40 ? DC : AC) * p)]);
  const q = [
    [`How much does it cost to charge a ${c.name} at home?`, `About ${pounds(f.full)} from empty to full at the ${PERIOD} price cap rate of ${CAP}p per kWh: ${r1(f.fullGrid)} kWh from the grid to put ${c.usableKwh} kWh into the battery, allowing for 10% lost in charging. On an overnight EV tariff at 7.5p it would be ${pounds(f.fullGrid * 7.5)}.`],
    [`How much does a ${c.name} cost per mile?`, `About ${pence(f.perMile)} a mile charged at home at the price cap rate, using EV Database's real-world estimate of ${c.realWhPerMile} Wh per mile (${f.miPerKwh} miles per kWh). That's ${pounds(f.year)} for ${MILES.toLocaleString("en-GB")} miles a year.`],
    [`How much is a rapid charge for a ${c.name}?`, `Charging from 10% to 80% — the usual rapid-charger stop — puts in ${r1(c.usableKwh * 0.7)} kWh, about ${pounds(f.rapid1080)} at 79p per kWh. Rapid charger prices vary a lot by network and many have membership rates, so check the price on the charger.`],
    [`How long does a ${c.name} take to charge at home?`, `About ${hm(f.hours)} from empty to full on a 7.4 kW home wallbox, or roughly 70% of that for a 10–80% top-up. A three-pin plug at around 2.3 kW takes about three times as long.`],
    [`How far does a ${c.name} go on a full charge?`, `${c.wltpMiles} miles on the official WLTP test, and about ${c.realMiles} miles in mixed real-world driving by EV Database's estimate. Cold weather and motorway speeds cut range most.`]
  ];
  const ld = [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], ["EV Charging Cost Calculator", SITE + BASE], [c.name, url]]), site.faqLd(q)];
  const others = DATA.models.filter((x) => x !== c).map((x) => `<a href="${BASE}${x.slug}/">${x.name}</a>`).join(" ");
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="${BASE}">← EV charging cost calculator</a>
      <h1 class="page-title">${c.name} charging cost</h1>
      <p class="page-subtitle">A full charge at home is about <strong>${pounds(f.full)}</strong> at the ${PERIOD} price cap — ${pence(f.perMile)} a mile.${c.onSale ? "" : " (No longer sold new; figures are for the last model.)"}</p>
    </header>

    <main class="tool">
      <div class="result-box">
        <div class="result-hero"><div class="value">${pounds(f.full)}</div><div class="label">0–100% at home, ${CAP}p per kWh</div></div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row"><span class="r-label">Usable battery</span><span class="r-value">${c.usableKwh} kWh</span></div>
          <div class="result-row highlight"><span class="r-label">Cost per mile at home</span><span class="r-value">${pence(f.perMile)}</span></div>
          <div class="result-row"><span class="r-label">${MILES.toLocaleString("en-GB")} miles a year</span><span class="r-value">${pounds(f.year)}</span></div>
          <div class="result-row"><span class="r-label">Range: WLTP / real-world</span><span class="r-value">${c.wltpMiles} / ${c.realMiles} miles</span></div>
          <div class="result-row"><span class="r-label">0–100% on a 7.4 kW wallbox</span><span class="r-value">${hm(f.hours)}</span></div>
        </div>
      </div>
      <p class="tool-hint" style="margin-top:12px;"><a href="${BASE}?model=${c.slug}">Open the ${c.name} in the calculator</a> to use your own tariff, charge level and charger, and compare with petrol.</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">${c.name} charging cost at different prices</h2>
${site.table(["Price per kWh", "Full charge (0–100%)", "10–80%", "Per mile"], rows, 420)}      <p class="tool-hint" style="margin-top:12px;">Prices other than the price cap are examples: overnight EV tariffs are often well under 10p, while public rapid chargers can be 70p or more. Home charging assumes 10% lost in charging, rapid (50p and up) 5%.</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">How it's worked out</h2>
      <p class="about-text"><strong>The battery:</strong> the ${c.variant} has ${c.usableKwh} kWh of usable capacity. Some energy is lost as heat while charging, so filling it from empty draws about ${r1(f.fullGrid)} kWh from the grid at home.</p>
      <p class="about-text"><strong>The price:</strong> ${r1(f.fullGrid)} kWh × ${CAP}p, the Ofgem price cap unit rate for ${ENERGY.period.label} (${ENERGY.electricity.basis}), is ${pounds(f.full)}. Your tariff may be different; the table shows other prices.</p>
      <p class="about-text"><strong>Per mile:</strong> EV Database estimates ${c.realWhPerMile} Wh a mile in real-world driving, so each mile takes ${(c.realWhPerMile / 1000 / AC).toFixed(3)} kWh from the grid, ${pence(f.perMile)} at ${CAP}p.</p>
      <p class="tool-hint">Battery, range and consumption from <a href="${c.url}" rel="noopener">EV Database</a> (checked ${DATA.lastChecked}); electricity price from <a href="${ENERGY.source.url}" rel="noopener">Ofgem</a>, updated each quarter.</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}    </main>

    <div class="hub-group-title" style="margin-top:28px;">Other cars</div>
    <p class="salary-links">${others}</p>

${site.FOOTER}
  </div>
</body>
</html>
`;
}

/* The calculator's own car list */
function calculatorList() {
  const file = path.join(site.ROOT, "ev-charging-cost.js");
  let s = fs.readFileSync(file, "utf8");
  const a = s.indexOf("const CAR_MODELS = ["), b = s.indexOf("/* end car models */");
  if (a < 0 || b < 0) throw new Error("car list markers missing");
  const list = DATA.models.map((c) => `  { slug: "${c.slug}", name: ${JSON.stringify(c.name + (c.slug === "nissan-leaf" ? " 52 kWh" : ""))}, kwh: ${c.usableKwh}, miPerKwh: ${figures(c).miPerKwh} },`).join("\n");
  s = s.slice(0, a) + `const CAR_MODELS = [\n${list}\n];\n` + s.slice(b);
  fs.writeFileSync(file, s);
}

function hubBlock() {
  const file = path.join(site.ROOT, "ev-charging-cost/index.html");
  const START = "    <!-- ev model pages: generated by tools/build-ev-pages.js -->\n", END = "    <!-- end ev model pages -->\n";
  let s = fs.readFileSync(file, "utf8");
  if (s.includes(START)) s = s.slice(0, s.indexOf(START)) + s.slice(s.indexOf(END) + END.length).replace(/^\n/, "");
  const rows = DATA.models.map((c) => { const f = figures(c); return [`<a href="${BASE}${c.slug}/">${c.name}</a>`, `${c.usableKwh} kWh`, pounds(f.full), pence(f.perMile)]; });
  const html = `    <main class="tool">
      <h2 class="tool-section-title">Charging cost by car (home, ${CAP}p per kWh)</h2>
${site.table(["Car", "Usable battery", "Full charge", "Per mile"], rows, 400)}      <p class="tool-hint" style="margin-top:12px;">At the Ofgem price cap for ${PERIOD}, allowing 10% charging loss; per mile from EV Database's real-world consumption. Each car has its own page with other prices and charging times.</p>
    </main>

`;
  const at = s.indexOf("    <!-- related calculators: generated by tools/related.js -->");
  if (at < 0) throw new Error("ev: related marker not found");
  s = s.slice(0, at) + START + html + END + "\n" + s.slice(at);
  fs.writeFileSync(file, s);
}

/* Hand check: 60 kWh usable ÷ 0.9 = 66.67 kWh × 26.32p = £17.55 */
{
  const t = DATA.models.find((c) => c.slug === "tesla-model-3");
  if (t.usableKwh !== 60 || Math.abs(t.usableKwh / AC * 26.32 - 1754.67) > 0.01) throw new Error("ev check");
  if (new Set(DATA.models.map((c) => c.slug)).size !== DATA.models.length) throw new Error("duplicate ev slug");
}

const urls = [];
DATA.models.forEach((c) => { site.write(`ev-charging-cost/${c.slug}`, page(c)); urls.push([`${BASE}${c.slug}/`, "0.6"]); });
calculatorList();
hubBlock();
site.prune("ev-charging-cost", /^[a-z0-9-]+$/);
site.sitemapBlock("ev model pages", "tools/build-ev-pages.js", urls);
console.log(`built ${urls.length} EV charging pages at ${CAP}p/kWh (${PERIOD})`);
