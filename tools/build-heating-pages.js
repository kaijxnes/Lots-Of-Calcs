#!/usr/bin/env node
/* "How much does a 2kW heater cost to run?" — the heating cost calculator
   (electric heater against gas central heating) and a page per heater size:

       /heating-cost/              calculator
       /heating-cost/2kw-heater/   a 2 kW heater

       node tools/build-heating-pages.js

   Rates are the Ofgem price cap figures in data/energy/uk.json (update each
   quarter and re-run). The sums are in heating-cost.js, which the calculator
   also runs. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const related = require("./related.js");
const H = require("../heating-cost.js");
const { esc, SITE } = site;

const ENERGY = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/energy/uk.json"), "utf8"));
const ER = ENERGY.electricity.unitRate, GR = ENERGY.gas.unitRate;
const EFF = 0.9;
const BASE = "/heating-cost/";
const WATTS = [400, 500, 600, 750, 800, 1000, 1200, 1500, 1800, 2000, 2200, 2500, 3000];
const m = H.money;
const kw = (w) => (w / 1000).toLocaleString("en-GB");
const slugOf = (w) => (w < 1000 ? `${w}w-heater` : `${String(w / 1000).replace(".", "-")}kw-heater`);
const sizeName = (w) => (w < 1000 ? `${w}W` : `${kw(w)}kW`);
const gasHeat = GR / EFF;
const ratio = (Math.round(ER / gasHeat * 10) / 10).toLocaleString("en-GB");

const RATES_NOTE = `Price cap rates from <a href="${ENERGY.source.url}" rel="noopener">Ofgem</a> for ${esc(ENERGY.period.label)}: electricity ${ER}p and gas ${GR}p per kWh (${esc(ENERGY.gas.basis.replace(/; includes 5% VAT/, ""))}; gas includes 5% VAT, and ${esc(ENERGY.electricity.basis.split("; ")[1] || "")}). Standing charges aren't included, as you pay them whatever you use.`;
const EFF_NOTE = "A gas boiler loses some heat up the flue: new gas boilers fitted in England must be at least 92% efficient (ErP, under Boiler Plus), and older ones are often less, so 90% is used here — change it to match yours.";

function tool(watts) {
  const hours = 4, daysWeek = 7, week = hours * daysWeek;
  const hourE = H.electric(H.kwh(watts, 1), ER), hourG = H.gas(H.kwh(watts, 1), GR, EFF);
  return `    <main class="tool" id="hc-tool">
      <div class="field-row">
        <div class="field"><label for="hc-watts">Heater power (watts)</label><input type="number" id="hc-watts" value="${watts}" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="hc-hours">Hours a day</label><input type="number" id="hc-hours" value="${hours}" min="0" max="24" step="any" inputmode="decimal"></div>
        <div class="field"><label for="hc-days">Days a week</label><input type="number" id="hc-days" value="${daysWeek}" min="0" max="7" step="1" inputmode="numeric"></div>
      </div>
      <div class="field-row">
        <div class="field"><label for="hc-elec">Electricity (p per kWh)</label><input type="number" id="hc-elec" value="${ER}" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="hc-gas">Gas (p per kWh)</label><input type="number" id="hc-gas" value="${GR}" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="hc-eff">Boiler efficiency (%)</label><input type="number" id="hc-eff" value="${EFF * 100}" min="1" max="100" step="any" inputmode="decimal"></div>
      </div>
      <p class="tool-hint" id="hc-error" role="alert" style="color: var(--bad); display: none;"></p>
      <div class="result-box" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="hc-hour">${m(hourE)}</div>
          <div class="label">an hour for the electric heater, on full power</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row"><span class="r-label">A day</span><span class="r-value" id="hc-day">${m(hourE * hours)}</span></div>
          <div class="result-row"><span class="r-label">A month</span><span class="r-value" id="hc-month">${m(hourE * week * H.WEEKS_MONTH)}</span></div>
          <div class="result-row"><span class="r-label">October to March (26 weeks)</span><span class="r-value" id="hc-winter">${m(hourE * week * H.WINTER_WEEKS)}</span></div>
        </div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row"><span class="r-label">Same heat from a gas boiler, an hour</span><span class="r-value" id="hc-gas-hour">${m(hourG)}</span></div>
          <div class="result-row"><span class="r-label">Same heat from gas, a month</span><span class="r-value" id="hc-gas-month">${m(hourG * week * H.WEEKS_MONTH)}</span></div>
          <div class="result-row highlight"><span class="r-label">Electric heat costs, per kWh, against gas</span><span class="r-value" id="hc-ratio">${ratio}×</span></div>
        </div>
      </div>
      <p class="tool-hint" style="margin-top:12px;">A heater with a thermostat draws full power only part of the time once the room is warm, so these are the most it would cost. ${RATES_NOTE}</p>
    </main>
`;
}

function sizeTable(hi) {
  return site.table(["Heater", "An hour", "4 hours a day, a month", "Same heat from gas, an hour"], WATTS.map((w) => {
    const e = H.electric(H.kwh(w, 1), ER), g = H.gas(H.kwh(w, 1), GR, EFF);
    return [w === hi ? `<strong>${sizeName(w)}</strong>` : `<a href="${BASE}${slugOf(w)}/">${sizeName(w)}</a>`, m(e), m(e * 28 * H.WEEKS_MONTH), m(g)];
  }), 480);
}

function sizePage(w) {
  const url = SITE + `${BASE}${slugOf(w)}/`;
  const e = H.electric(H.kwh(w, 1), ER), g = H.gas(H.kwh(w, 1), GR, EFF);
  const title = `How Much Does a ${sizeName(w)} Heater Cost to Run? — ${m(e)} an Hour`;
  const desc = `A ${sizeName(w)} electric heater costs ${m(e)} an hour on full power at the price cap rate of ${ER}p per kWh (${ENERGY.period.short}) — ${m(e * 4)} for 4 hours a day, about ${m(e * 28 * H.WEEKS_MONTH)} a month. The same heat from gas costs about ${m(g)}.`;
  const hoursRows = [1, 2, 3, 4, 6, 8, 12].map((h) => [`${h} hour${h === 1 ? "" : "s"} a day`, m(e * h), m(e * h * 7), m(e * h * 7 * H.WEEKS_MONTH), m(e * h * 7 * H.WINTER_WEEKS)]);
  const q = [
    [`How much does a ${sizeName(w)} heater cost per hour?`, `${m(e)} on full power: it uses ${kw(w)} kWh an hour, and electricity costs ${ER}p per kWh under the energy price cap (${ENERGY.period.label}). On a thermostat it draws full power only part of the time once the room is warm, so it usually costs less.`],
    [`How much does it cost to run a ${sizeName(w)} heater all day?`, `${m(e * 8)} for 8 hours, ${m(e * 12)} for 12 hours or ${m(e * 24)} for a full 24 hours on full power.`],
    [`Is a ${sizeName(w)} electric heater cheaper than central heating?`, `Per unit of heat, no: electricity costs ${ER}p per kWh and gas ${GR}p, so even allowing for boiler losses (${m(gasHeat)} per kWh of heat at 90% efficiency) electric heat costs about ${ratio} times as much. But a heater warms one room, while central heating warms the whole house — heating just the room you're in for a few hours can still cost less overall.`],
    ["Does the type of heater matter?", "Not for the cost per hour: every electric heater — fan, convector, oil-filled, halogen or panel — turns 1 kWh of electricity into 1 kWh of heat. What changes is how quickly it warms you and how well it holds the heat; a thermostat and timer make the biggest difference to the bill."]
  ];
  const ld = [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], ["Heating Cost", SITE + BASE], [`${sizeName(w)} heater`, url]]), site.faqLd(q)];
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="${BASE}">← Heating cost calculator</a>
      <h1 class="page-title">How much does a ${sizeName(w)} heater cost to run?</h1>
      <p class="page-subtitle">${m(e)} an hour on full power, at the price cap rate of ${ER}p per kWh (${esc(ENERGY.period.label)}).</p>
    </header>

${tool(w)}
    <main class="tool">
      <p class="tool-section-title">${sizeName(w)} heater: cost by hours used</p>
${site.table(["Use", "A day", "A week", "A month", "Oct–Mar"], hoursRows, 480)}      <p class="tool-section-title" style="margin-top:22px;">Other heater sizes</p>
${sizeTable(w)}      <p class="tool-hint" style="margin-top:12px;">${EFF_NOTE}</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">Frequently asked questions</p>
${site.faqHtml(q)}    </main>

${site.FOOTER}
  </div>
  <script src="/heating-cost.js"></script>
</body>
</html>
`;
}

function hub() {
  const url = SITE + BASE;
  const e2 = H.electric(2, ER);
  const title = "Heating Cost Calculator — Electric Heater vs Gas Central Heating";
  const desc = `What an electric heater costs to run per hour, day and month, and what the same heat costs from a gas boiler. A 2kW heater costs ${m(e2)} an hour at the price cap rate of ${ER}p per kWh (${ENERGY.period.short}); gas is ${GR}p.`;
  const q = [
    ["Is it cheaper to use an electric heater or the central heating?", `Per unit of heat, gas is cheaper: ${GR}p per kWh against ${ER}p for electricity, or about ${m(gasHeat)} per kWh of heat once a 90%-efficient boiler's losses are counted — electric heat costs about ${ratio} times as much. An electric heater can still work out cheaper if it lets you leave the central heating off and warm only the room you're in.`],
    ["How much does a 2kW heater cost per hour?", `${m(e2)} on full power at ${ER}p per kWh. A 1kW heater costs ${m(H.electric(1, ER))} an hour and a 3kW heater ${m(H.electric(3, ER))}.`],
    ["How do I work out what a heater costs?", "Multiply the power in kW by the hours it runs and the price per kWh: a 2 kW heater for 3 hours at 26p uses 6 kWh and costs £1.56. The power is on the label or in the manual."],
    ["What efficiency is my boiler?", EFF_NOTE]
  ];
  const ld = [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], ["Heating Cost", url]]),
    { "@context": "https://schema.org", "@type": "WebApplication", name: "Heating Cost Calculator", url, applicationCategory: "UtilitiesApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } }, site.faqLd(q)];
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="/">← All calculators</a>
      <h1 class="page-title">Heating cost calculator</h1>
      <p class="page-subtitle">What an electric heater costs to run, and the same heat from gas central heating.</p>
    </header>

${tool(2000)}
    <main class="tool">
      <p class="tool-section-title">Heater running costs by size</p>
${sizeTable()}      <p class="tool-hint" style="margin-top:12px;">On full power at ${ER}p per kWh; a month is 4 hours a day, 7 days a week. ${EFF_NOTE} For other appliances, see the <a href="/running-cost/">electricity running cost calculator</a>: <a href="/running-cost/oil-filled-radiator/">oil-filled radiator</a>, <a href="/running-cost/electric-blanket/">electric blanket</a>, <a href="/running-cost/heated-airer/">heated airer</a>.</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">Frequently asked questions</p>
${site.faqHtml(q)}    </main>

${related.block(BASE)}
${site.FOOTER}
  </div>
  <script src="/heating-cost.js"></script>
</body>
</html>
`;
}

const urls = [];
site.write("heating-cost", hub());
WATTS.forEach((w) => { site.write(`heating-cost/${slugOf(w)}`, sizePage(w)); urls.push([`${BASE}${slugOf(w)}/`, "0.6"]); });
site.sitemapBlock("heating pages", "tools/build-heating-pages.js", urls);
console.log(`built ${urls.length + 1} heating pages at ${ER}p electricity, ${GR}p gas (${ENERGY.period.short})`);
