#!/usr/bin/env node
/* "How much does a kettle cost to run?" — a page per appliance:

       /running-cost/kettle/

       node tools/build-appliance-pages.js

   Costs use the current Ofgem price cap electricity unit rate from
   data/energy/uk.json (update it each quarter and re-run). The appliance
   figures below are typical examples — a power rating and how long one use
   lasts, or the energy per cycle for appliances rated that way — and every
   page says so and lets the visitor put in their own. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const { esc, SITE } = site;

const ENERGY = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/energy/uk.json"), "utf8"));
const RATE = ENERGY.electricity.unitRate;

/* watts + minutes per use, or kwh per use (cycle); uses a week; note */
const A = [
  { slug: "kettle", name: "Kettle", watts: 3000, minutes: 3, uses: 28, use: "boil", tip: "Only boil the water you need: a full kettle takes about four times as long as a mug's worth." },
  { slug: "electric-shower", name: "Electric shower", watts: 9500, minutes: 8, uses: 7, use: "shower", tip: "Every minute cut from a shower saves about a seventh of its cost; a lower setting cuts it too." },
  { slug: "electric-oven", name: "Electric oven", kwh: 1.5, uses: 4, use: "hour of cooking", tip: "An oven draws full power while heating up, then cycles on and off; batch cooking spreads the heat-up across more food." },
  { slug: "air-fryer", name: "Air fryer", watts: 1500, minutes: 20, uses: 5, use: "20-minute cook", tip: "Air fryers heat a small space quickly, so for small portions they usually cost less than an oven." },
  { slug: "microwave", name: "Microwave", watts: 1200, minutes: 5, uses: 10, use: "5 minutes", tip: "The power on the label is often the cooking output; the plug draw is higher, about 1.2 kW for an 800 W microwave." },
  { slug: "slow-cooker", name: "Slow cooker", watts: 200, minutes: 480, uses: 2, use: "8-hour cook", tip: "Low power over many hours: a whole stew often costs less than an hour of oven cooking." },
  { slug: "toaster", name: "Toaster", watts: 1000, minutes: 3, uses: 7, use: "round of toast", tip: "Toasting both slots at once uses barely more than one." },
  { slug: "induction-hob", name: "Induction hob ring", watts: 2000, minutes: 15, uses: 7, use: "15 minutes", tip: "Induction heats the pan directly, so less energy is lost than with a ceramic ring." },
  { slug: "dishwasher", name: "Dishwasher", kwh: 1.0, uses: 4, use: "cycle", tip: "Eco programmes run longer but heat less water, using less energy per load." },
  { slug: "washing-machine", name: "Washing machine", kwh: 0.8, uses: 4, use: "40°C wash", tip: "Most of the energy goes on heating water: a 30°C wash uses roughly a third less than 40°C." },
  { slug: "tumble-dryer", name: "Tumble dryer", kwh: 4.5, uses: 3, use: "cycle", tip: "This is a vented or condenser dryer; a heat pump dryer uses roughly half to a third as much per load." },
  { slug: "fridge-freezer", name: "Fridge freezer", kwh: 0.7, uses: 7, use: "day", tip: "Running all the time, so the yearly figure on the energy label is the one to check: about 250 kWh for a typical model." },
  { slug: "electric-heater", name: "Electric heater", watts: 2000, minutes: 60, uses: 14, use: "hour", tip: "A 2 kW heater costs the same per hour whether it's a fan, convector or oil-filled; a thermostat cuts how long it actually draws power." },
  { slug: "oil-filled-radiator", name: "Oil-filled radiator", watts: 1500, minutes: 60, uses: 14, use: "hour", tip: "Oil holds heat, so it keeps warming the room for a while after the thermostat switches it off." },
  { slug: "electric-blanket", name: "Electric blanket", watts: 60, minutes: 60, uses: 7, use: "hour", tip: "Warming the bed, not the room, is one of the cheapest ways to keep warm at night." },
  { slug: "heated-airer", name: "Heated airer", watts: 300, minutes: 240, uses: 3, use: "4 hours", tip: "Much cheaper per load than a tumble dryer, though slower." },
  { slug: "dehumidifier", name: "Dehumidifier", watts: 250, minutes: 480, uses: 7, use: "8 hours", tip: "Drying washing indoors with a dehumidifier running costs far less than a tumble dryer." },
  { slug: "immersion-heater", name: "Immersion heater", watts: 3000, minutes: 60, uses: 7, use: "hour", tip: "A timer and a lagged cylinder stop it heating water you don't use." },
  { slug: "tv", name: "TV", watts: 100, minutes: 60, uses: 35, use: "hour", tip: "Bigger and brighter screens use more; standby is now usually under 1 W." },
  { slug: "games-console", name: "Games console", watts: 200, minutes: 60, uses: 14, use: "hour of gaming", tip: "Gaming draws several times more than streaming video; rest mode with downloads on also uses power." },
  { slug: "gaming-pc", name: "Gaming PC", watts: 400, minutes: 60, uses: 14, use: "hour of gaming", tip: "The graphics card is most of the draw under load; at the desktop a gaming PC uses far less." },
  { slug: "laptop", name: "Laptop", watts: 50, minutes: 60, uses: 35, use: "hour", tip: "Laptops use a fraction of a desktop's power." },
  { slug: "wifi-router", name: "Wi-Fi router", watts: 10, minutes: 1440, uses: 7, use: "day", tip: "Small but always on, so it adds up across a year." },
  { slug: "phone-charger", name: "Phone charger", kwh: 0.015, uses: 7, use: "full charge", tip: "A full phone charge costs well under a penny." },
  { slug: "led-light-bulb", name: "LED light bulb", watts: 8, minutes: 60, uses: 35, use: "hour", tip: "An 8 W LED gives about the light of an old 60 W bulb." },
  { slug: "hair-dryer", name: "Hair dryer", watts: 2000, minutes: 10, uses: 5, use: "10-minute dry", tip: "Towel-drying first cuts the time on high heat." },
  { slug: "vacuum-cleaner", name: "Vacuum cleaner", watts: 900, minutes: 30, uses: 2, use: "30 minutes", tip: "Mains vacuums sold in the UK are limited to 900 W." },
  { slug: "iron", name: "Iron", watts: 2400, minutes: 30, uses: 1, use: "30 minutes", tip: "Irons cycle their element on and off, so they draw full power only part of the time." },
  { slug: "fan", name: "Electric fan", watts: 40, minutes: 480, uses: 7, use: "8 hours", tip: "A fan costs a tiny fraction of air conditioning." },
  { slug: "portable-air-conditioner", name: "Portable air conditioner", watts: 1000, minutes: 240, uses: 7, use: "4 hours", tip: "Keeping doors and windows shut and the hose short makes it run less." }
];

const kwhPerUse = (a) => (a.kwh !== undefined ? a.kwh : (a.watts / 1000) * (a.minutes / 60));
function money(p) {
  if (p < 100) return (Math.round(p * 10) / 10).toLocaleString("en-GB") + "p";
  return "£" + (p / 100).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
const lower = (s) => (/^[A-Z]{2}/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1));
const article = (s) => (/^(LED|[aeiou])/i.test(s) ? "an" : "a");
const kwhText = (k) => (Math.round(k * 1000) / 1000).toLocaleString("en-GB") + " kWh";

function page(a) {
  const k = kwhPerUse(a);
  const use = k * RATE;
  const year = use * a.uses * 52;
  const name = lower(a.name);
  const url = SITE + `/running-cost/${a.slug}/`;
  const perHour = a.watts ? (a.watts / 1000) * RATE : null;
  const tcName = a.name.replace(/(^|[ -])([a-z])/g, (m, x, c) => x + c.toUpperCase());
  const title = `How Much Does ${article(a.name)} ${tcName} Cost to Run? — ${money(use)} per ${a.use}`;
  const desc = `A typical ${name} costs about ${money(use)} per ${a.use}${perHour !== null && a.minutes !== 60 ? ` (${money(perHour)} an hour)` : ""} and around ${money(year)} a year at the price cap rate of ${RATE}p per kWh (${ENERGY.period.short}). Work out your own with its wattage.`;
  const rates = [20, 24, RATE, 30, 35].sort((x, y) => x - y);
  const rateRows = rates.map((r) => [`${r}p per kWh${r === RATE ? " (price cap)" : ""}`, money(k * r), money(k * r * a.uses * 52)]);
  const usageRows = [0.5, 1, 2, 3].map((m) => [`${Math.round(a.uses * m * 10) / 10} a week`, money(use * a.uses * m * 52 / 12), money(use * a.uses * m * 52)]);
  const q = [
    [`How much does ${article(a.name)} ${name} cost to run?`, `About ${money(use)} per ${a.use}, using ${kwhText(k)} at the energy price cap rate of ${RATE}p per kWh (${ENERGY.period.label}). Used ${a.uses} times a week, that's around ${money(use * a.uses * 52 / 12)} a month or ${money(year)} a year.`],
    [perHour !== null ? `How much does ${article(a.name)} ${name} cost per hour?` : `How much energy does ${article(a.name)} ${name} use?`, perHour !== null ? `${/^(8|11|18)(\D|$)/.test(String(a.watts)) ? "An" : "A"} ${a.watts.toLocaleString("en-GB")} W ${name} uses ${kwhText(a.watts / 1000)} an hour, which costs ${money(perHour)} at ${RATE}p per kWh. Check the wattage on its label or plug and multiply: kW × hours × price per kWh.` : `About ${kwhText(k)} per ${a.use} for a typical model; the energy label gives the figure for yours.`],
    [`How can I make it cheaper?`, a.tip],
    ["Does this include the standing charge?", `No. The standing charge (${ENERGY.electricity.standingCharge}p a day under the price cap) is paid whatever you use, so it doesn't change with any one appliance. Fixed tariffs and some regions charge a different unit rate — put yours in the calculator.`]
  ];
  const ld = [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], ["Electricity Running Cost", SITE + "/running-cost/"], [`${a.name} running cost`, url]]), site.faqLd(q)];
  const inputs = a.kwh !== undefined
    ? `        <div class="field"><label for="app-kwh">Energy per ${esc(a.use)} (kWh)</label><input type="number" id="app-kwh" value="${a.kwh}" step="any" min="0" inputmode="decimal"></div>`
    : `        <div class="field"><label for="app-watts">Power (watts)</label><input type="number" id="app-watts" value="${a.watts}" step="any" min="0" inputmode="decimal"></div>
        <div class="field"><label for="app-minutes">Minutes per use</label><input type="number" id="app-minutes" value="${a.minutes}" step="any" min="0" inputmode="decimal"></div>`;
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="/running-cost/">← Electricity running cost calculator</a>
      <h1 class="page-title">How much does ${article(a.name)} ${esc(name)} cost to run?</h1>
      <p class="page-subtitle">At the energy price cap rate of ${RATE}p per kWh (${esc(ENERGY.period.label)}).</p>
    </header>

    <main class="tool" id="app-tool" data-mode="${a.kwh !== undefined ? "cycle" : "power"}">
      <div class="field-row">
${inputs}
      </div>
      <div class="field-row">
        <div class="field"><label for="app-uses">Uses a week</label><input type="number" id="app-uses" value="${a.uses}" step="any" min="0" inputmode="decimal"></div>
        <div class="field"><label for="app-rate">Unit price (p per kWh)</label><input type="number" id="app-rate" value="${RATE}" step="any" min="0" inputmode="decimal"></div>
      </div>
      <div class="result-box" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="app-use">${money(use)}</div>
          <div class="label">per ${esc(a.use)}</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row"><span class="r-label">Energy per ${esc(a.use)}</span><span class="r-value" id="app-kwh-out">${kwhText(k)}</span></div>
          <div class="result-row"><span class="r-label">A week</span><span class="r-value" id="app-week">${money(use * a.uses)}</span></div>
          <div class="result-row"><span class="r-label">A month</span><span class="r-value" id="app-month">${money(use * a.uses * 52 / 12)}</span></div>
          <div class="result-row highlight"><span class="r-label">A year</span><span class="r-value" id="app-year">${money(year)}</span></div>
        </div>
      </div>
      <p class="tool-hint" style="margin-top:12px;">Starts on a typical ${esc(name)}${a.watts ? ` (${a.watts.toLocaleString("en-GB")} W, ${a.minutes} minutes per ${esc(a.use)})` : ""} — change the figures to match yours. The standing charge isn't included.</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">At different electricity prices</p>
${site.table(["Unit price", `Per ${a.use}`, "A year"], rateRows, 360)}      <p class="tool-section-title" style="margin-top:22px;">Used more or less often</p>
${site.table(["Uses", "A month", "A year"], usageRows, 320)}      <p class="tool-hint" style="margin-top:12px;">Price cap rate from <a href="${ENERGY.source.url}" rel="noopener">Ofgem</a>: ${esc(ENERGY.electricity.basis)}, ${esc(ENERGY.period.label)}. For any appliance, use the <a href="/running-cost/">electricity running cost calculator</a>.</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">Frequently asked questions</p>
${site.faqHtml(q)}    </main>

    <div class="hub-group-title" style="margin-top:28px;">Other appliances</div>
    <p class="salary-links">${A.filter((x) => x !== a).map((x) => `<a href="/running-cost/${x.slug}/">${esc(x.name)}</a>`).join(" ")}</p>

${site.FOOTER}
  </div>
  <script src="/appliance-page.js"></script>
</body>
</html>
`;
}

function hubBlock() {
  const file = path.join(site.ROOT, "running-cost/index.html");
  const START = "    <!-- appliance pages: generated by tools/build-appliance-pages.js -->\n";
  const END = "    <!-- end appliance pages -->\n";
  let s = fs.readFileSync(file, "utf8");
  if (s.includes(START)) s = s.slice(0, s.indexOf(START)) + s.slice(s.indexOf(END) + END.length);
  const rows = A.map((a) => { const u = kwhPerUse(a) * RATE; return [`<a href="/running-cost/${a.slug}/">${esc(a.name)}</a>`, `${money(u)} per ${esc(a.use)}`, money(u * a.uses * 52)]; });
  const html = `    <main class="tool">
      <p class="tool-section-title">What common appliances cost to run</p>
      <p class="about-text">Typical figures at the energy price cap rate of ${RATE}p per kWh (${esc(ENERGY.period.label)}); each page has a calculator for your own.</p>
${site.table(["Appliance", "Cost", "A year (typical use)"], rows, 420)}    </main>

`;
  const at = s.indexOf("    <!-- related calculators: generated by tools/related.js -->");
  s = s.slice(0, at) + START + html + END + "\n" + s.slice(at);
  fs.writeFileSync(file, s);
}

const urls = [];
A.forEach((a) => { site.write(`running-cost/${a.slug}`, page(a)); urls.push([`/running-cost/${a.slug}/`, "0.6"]); });
hubBlock();
site.sitemapBlock("appliance pages", "tools/build-appliance-pages.js", urls);
console.log(`built ${A.length} appliance pages at ${RATE}p/kWh (${ENERGY.period.label})`);
