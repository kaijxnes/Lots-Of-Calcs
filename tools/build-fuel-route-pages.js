#!/usr/bin/env node
/* Fuel cost for common UK car journeys:

       /fuel-cost/london-to-manchester/   199 miles: petrol and diesel cost by MPG, return, split, EV

       node tools/build-fuel-route-pages.js

   Distances: data/fuel/routes.json (OSRM on OpenStreetMap roads, fetched by
   tools/fetch-route-distances.js). Pump prices: data/fuel/uk.json (GOV.UK
   weekly road fuel prices; the monthly check updates them). Home EV
   charging: the Ofgem price cap rate in data/energy/uk.json. UK gallon =
   4.54609 litres. Runs in the monthly rebuild. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const { SITE, esc } = site;

const BASE = "/fuel-cost/";
const read = (f) => JSON.parse(fs.readFileSync(path.join(site.ROOT, f), "utf8"));
const R = read("data/fuel/routes.json"), F = read("data/fuel/uk.json"), E = read("data/energy/uk.json");
const KM_MILE = 1.609344, GALLON = 4.54609;
const MPGS = [30, 35, 40, 45, 50, 55, 60, 65];
const EXAMPLE = { petrol: 45, diesel: 50, ev: 3.5 };

const miles = (r) => r.km / KM_MILE;
const cost = (mi, mpg, ppl) => mi / mpg * GALLON * ppl / 100;
const evCost = (mi, mpk) => mi / mpk * E.electricity.unitRate / 100;
const gbp = (v) => "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const name = (k) => R.places[k].name;
const slug = (r) => `${r.from}-to-${r.to}`;
const time = (m) => (m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`);
const weekDate = new Date(F.week + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

function page(r) {
  const mi = miles(r), A = name(r.from), B = name(r.to), url = SITE + `${BASE}${slug(r)}/`;
  const p = cost(mi, EXAMPLE.petrol, F.petrol), d = cost(mi, EXAMPLE.diesel, F.diesel), ev = evCost(mi, EXAMPLE.ev);
  const title = site.fitTitle(`${A} to ${B} Fuel Cost — ${gbp(p)} Petrol, ${gbp(d)} Diesel (${Math.round(mi)} Miles)`, `${A} to ${B} Fuel Cost: ${gbp(p)} (${Math.round(mi)} Miles)`);
  const desc = `Driving ${A} to ${B} is about ${Math.round(mi)} miles. At ${EXAMPLE.petrol} mpg and today's average ${F.petrol}p a litre, petrol costs ${gbp(p)} each way (${gbp(p * 2)} return); diesel at ${EXAMPLE.diesel} mpg ${gbp(d)}. By MPG, split and EV.`;
  const rows = MPGS.map((m) => [`${m} mpg`, gbp(cost(mi, m, F.petrol)), gbp(cost(mi, m, F.diesel)), gbp(cost(mi, m, F.petrol) * 2)]);
  const split = [1, 2, 3, 4, 5].map((n) => [n === 1 ? "Just you" : `${n} people`, gbp(p / n), gbp(p * 2 / n)]);
  const q = [
    [`How much does it cost to drive from ${A} to ${B}?`, `About ${gbp(p)} in petrol each way for a car doing ${EXAMPLE.petrol} mpg, at the UK average of ${F.petrol}p a litre (week of ${weekDate}). A return trip is ${gbp(p * 2)}. In a diesel doing ${EXAMPLE.diesel} mpg it's ${gbp(d)} each way.`],
    [`How far is ${A} to ${B} by car?`, `About ${Math.round(mi)} miles (${Math.round(r.km)} km) on the fastest route, roughly ${time(r.minutes)} without traffic or stops.`],
    [`How much would ${A} to ${B} cost in an electric car?`, `About ${gbp(ev)} charged at home at the price cap rate of ${E.electricity.unitRate}p per kWh, for a car doing ${EXAMPLE.ev} miles per kWh. Public rapid chargers cost several times as much per kWh.`],
    ["How is the fuel cost worked out?", `Miles ÷ mpg gives gallons; × ${GALLON} gives litres; × the price per litre gives the cost. ${Math.round(mi)} ÷ ${EXAMPLE.petrol} × ${GALLON} × ${F.petrol}p = ${gbp(p)}.`]
  ];
  const ld = [site.webPage(title, desc, url, F.lastChecked), site.breadcrumb([["Home", SITE + "/"], ["Fuel Cost Calculator", SITE + BASE], [`${A} to ${B}`, url]]), site.faqLd(q)];
  const fromSame = R.routes.filter((x) => x !== r && (x.from === r.from || x.from === r.to || x.to === r.from || x.to === r.to)).slice(0, 14)
    .map((x) => `<a href="${BASE}${slug(x)}/">${esc(name(x.from))} to ${esc(name(x.to))}</a>`);
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="${BASE}">← Fuel cost calculator</a>
      <h1 class="page-title">${esc(A)} to ${esc(B)} fuel cost</h1>
      <p class="page-subtitle">About <strong>${Math.round(mi)} miles</strong> each way: <strong>${gbp(p)}</strong> in petrol at ${EXAMPLE.petrol} mpg, <strong>${gbp(d)}</strong> in diesel at ${EXAMPLE.diesel} mpg.</p>
    </header>

    <main class="tool">
      <div class="result-box">
        <div class="result-grid">
          <div class="result-row"><span class="r-label">Distance</span><span class="r-value">${Math.round(mi)} miles (${Math.round(r.km)} km)</span></div>
          <div class="result-row"><span class="r-label">Driving time, no traffic</span><span class="r-value">${time(r.minutes)}</span></div>
          <div class="result-row highlight"><span class="r-label">Petrol, ${EXAMPLE.petrol} mpg</span><span class="r-value">${gbp(p)}</span></div>
          <div class="result-row"><span class="r-label">Diesel, ${EXAMPLE.diesel} mpg</span><span class="r-value">${gbp(d)}</span></div>
          <div class="result-row"><span class="r-label">Electric, ${EXAMPLE.ev} mi/kWh, home charging</span><span class="r-value">${gbp(ev)}</span></div>
          <div class="result-row"><span class="r-label">Petrol return trip</span><span class="r-value">${gbp(p * 2)}</span></div>
        </div>
      </div>
      <p class="tool-hint" style="margin-top:12px;">Fuel at the UK average of ${F.petrol}p a litre for petrol and ${F.diesel}p for diesel (week of ${weekDate}, <a href="${F.source.url}" rel="noopener">GOV.UK</a>); electricity at the <a href="/ev-charging-cost/">price cap</a> rate of ${E.electricity.unitRate}p/kWh. For your own car and price, use the <a href="${BASE}">fuel cost calculator</a>.</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">${esc(A)} to ${esc(B)} by fuel economy</h2>
${site.table(["Economy", "Petrol, one way", "Diesel, one way", "Petrol, return"], rows, 420)}      <h2 class="tool-section-title" style="margin-top:20px;">Sharing the petrol cost (${EXAMPLE.petrol} mpg)</h2>
${site.table(["People", "One way each", "Return each"], split, 300)}      <p class="tool-hint" style="margin-top:12px;">Distance by the fastest route between city centres (OpenStreetMap data via OSRM). The same each way, give or take a mile or two.</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}    </main>

    <main class="tool">
      <h2 class="tool-section-title">Other journeys</h2>
      <p class="salary-links">${fromSame.join(" ")}</p>
    </main>

${site.FOOTER}
  </div>
</body>
</html>
`;
}

/* Hand check: 200 miles at 40 mpg = 5 gallons = 22.73 litres; at 150p = £34.10 */
if (gbp(cost(200, 40, 150)) !== "£34.10") throw new Error("fuel check");

const urls = [];
R.routes.forEach((r) => { site.write(`fuel-cost/${slug(r)}`, page(r)); urls.push([`${BASE}${slug(r)}/`, "0.5"]); });
const byFrom = {};
R.routes.forEach((r) => (byFrom[r.from] = byFrom[r.from] || []).push(r));
site.hubBlock(BASE, "fuel route pages", "tools/build-fuel-route-pages.js", `    <main class="tool">
      <h2 class="tool-section-title">Fuel cost of common UK journeys</h2>
      <p class="about-text">At ${EXAMPLE.petrol} mpg and the UK average of ${F.petrol}p a litre for petrol (week of ${weekDate}).</p>
${Object.keys(byFrom).map((f) => `      <p class="salary-links"><strong>From ${esc(name(f))}:</strong> ${byFrom[f].map((r) => `<a href="${BASE}${slug(r)}/">${esc(name(r.to))} ${gbp(cost(miles(r), EXAMPLE.petrol, F.petrol))}</a>`).join(" ")}</p>`).join("\n")}
    </main>

`);
site.prune("fuel-cost", /^[a-z]+-to-[a-z]+$/);
site.sitemapBlock("fuel route pages", "tools/build-fuel-route-pages.js", urls);
console.log(`built ${urls.length} fuel route pages at ${F.petrol}p petrol, ${F.diesel}p diesel (week of ${F.week})`);
