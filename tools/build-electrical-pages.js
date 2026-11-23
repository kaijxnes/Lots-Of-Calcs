#!/usr/bin/env node
/* "How many amps is 3000 watts?" and back again:

       /watts-amps-volts/3000-watts-to-amps/   13.04 A at 230 V, 25 A at 120 V
       /watts-amps-volts/13-amps-to-watts/     2,990 W at 230 V

       node tools/build-electrical-pages.js

   Single-phase with a power factor of 1 (kettles, heaters, most resistive
   loads): amps = watts ÷ volts. Shown at the UK's 230 V, 240 V (the old UK
   figure many appliances still quote) and the US's 120 V and 240 V. */
const site = require("./lib/site.js");
const { SITE } = site;

const BASE = "/watts-amps-volts/";
const WATTS = [100, 200, 300, 400, 500, 600, 700, 750, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 2000, 2200, 2400, 2500, 2800, 3000, 3500, 4000, 4500, 5000, 6000, 7000, 7200, 7400, 8000, 9000, 10000, 11000, 12000, 15000];
const AMPS = [1, 2, 3, 5, 6, 10, 13, 15, 16, 20, 25, 30, 32, 40, 45, 50, 60, 63, 80, 100];
const VOLTS = [[230, "UK and Europe"], [240, "UK (older figure), US 240 V circuits"], [120, "US and Canada"], [12, "car and leisure batteries"]];

const wSlug = (w) => `${w}-watts-to-amps`, aSlug = (a) => `${a}-amps-to-watts`;
const n = (v, dp) => v.toLocaleString("en-GB", { maximumFractionDigits: dp === undefined ? 2 : dp });
const kw = (w) => (w >= 1000 ? `${n(w / 1000)} kW` : `${w} W`);

function plugNote(w) {
  const a230 = w / 230;
  if (a230 <= 3) return `In the UK that's within a 3 A plug fuse.`;
  if (a230 <= 5) return `In the UK it needs a 5 A plug fuse.`;
  if (a230 <= 13) return `In the UK it needs a 13 A plug fuse — a standard plug can supply up to 13 A, about 3 kW.`;
  if (a230 <= 32) return `That's more than a UK 13 A plug can supply, so an appliance this powerful is wired to its own circuit (an electric shower or a 7 kW EV charger, for example).`;
  return `That's well beyond a single domestic socket circuit; at this size an electrician should size the cable and protection.`;
}

function ld(title, desc, url, crumb, q) {
  return [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], ["Watts, Amps and Volts Calculator", SITE + BASE], [crumb, url]]), site.faqLd(q)];
}

function wattPage(w) {
  const url = SITE + `${BASE}${wSlug(w)}/`, a230 = w / 230, a120 = w / 120;
  const title = site.fitTitle(`${n(w, 0)} Watts to Amps — ${n(a230)} A at 230 V, ${n(a120)} A at 120 V`, `${n(w, 0)} Watts to Amps: ${n(a230)} A (230 V)`);
  const desc = `${n(w, 0)} watts is ${n(a230)} amps at 230 V (UK and Europe), ${n(w / 240)} A at 240 V and ${n(a120)} A at 120 V (US). Amps = watts ÷ volts. ${plugNote(w)}`;
  const q = [
    [`How many amps is ${n(w, 0)} watts?`, `${n(a230)} A on a 230 V supply (UK and Europe) and ${n(a120)} A on 120 V (US and Canada). Divide the watts by the volts.`],
    [`How many amps is ${n(w, 0)} watts in the UK?`, `${n(a230)} A at the standard 230 V. Some appliances still quote 240 V, which gives ${n(w / 240)} A. ${plugNote(w)}`],
    [`Does this apply to every appliance?`, "It's exact for heaters, kettles, toasters and other resistive loads. Motors, compressors and some electronics draw a little more current than this for the same watts (their power factor is below 1), and many draw extra when they start."]
  ];
  const rows = VOLTS.map(([v, where]) => [`${v} V`, where, `${n(w / v)} A`]);
  const near = site.neighbours(WATTS, w, 5).concat([w]).sort((a, b) => a - b).map((x) => [x === w ? `<strong>${kw(x)}</strong>` : `<a href="${BASE}${wSlug(x)}/">${kw(x)}</a>`, `${n(x / 230)} A`, `${n(x / 120)} A`]);
  return site.head({ title, desc, url, ld: ld(title, desc, url, `${n(w, 0)} watts to amps`, q) }) + `    <header class="site-header">
      <a class="back-link" href="${BASE}">← Watts, amps and volts calculator</a>
      <h1 class="page-title">${n(w, 0)} watts to amps</h1>
      <p class="page-subtitle">${n(w, 0)} W is <strong>${n(a230)} A</strong> at 230 V (UK) and <strong>${n(a120)} A</strong> at 120 V (US).</p>
    </header>

    <main class="tool">
      <h2 class="tool-section-title">${kw(w)} at different voltages</h2>
${site.table(["Voltage", "Used for", "Current"], rows, 360)}      <p class="about-text" style="margin-top:12px;"><strong>Formula:</strong> amps = watts ÷ volts, so ${n(w, 0)} ÷ 230 = ${n(a230)} A. ${plugNote(w)}</p>
      <p class="tool-hint">Single-phase, power factor 1. For three-phase, DC or a power factor, use the <a href="${BASE}">watts, amps and volts calculator</a>.</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">Nearby powers</h2>
${site.table(["Power", "At 230 V", "At 120 V"], near, 300)}    </main>

    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}    </main>

${site.FOOTER}
  </div>
</body>
</html>
`;
}

function ampPage(a) {
  const url = SITE + `${BASE}${aSlug(a)}/`, w230 = a * 230, w120 = a * 120;
  const title = site.fitTitle(`${a} Amps to Watts — ${n(w230, 0)} W at 230 V, ${n(w120, 0)} W at 120 V`, `${a} Amps to Watts: ${n(w230, 0)} W (230 V)`);
  const desc = `${a} amps is ${n(w230, 0)} watts at 230 V (UK and Europe), ${n(a * 240, 0)} W at 240 V and ${n(w120, 0)} W at 120 V (US). Watts = amps × volts.`;
  const q = [
    [`How many watts is ${a} amps?`, `${n(w230, 0)} W at 230 V and ${n(w120, 0)} W at 120 V. Multiply the amps by the volts.`],
    [`How many watts can a ${a} amp circuit or fuse take?`, `Up to ${n(w230, 0)} W at 230 V in theory. For appliances that run for hours (heaters, chargers) it's sensible to stay well under the limit — US practice, for example, keeps continuous loads to 80% of a breaker's rating, ${n(w120 * 0.8, 0)} W at 120 V.`]
  ];
  const rows = VOLTS.map(([v, where]) => [`${v} V`, where, `${n(a * v, 0)} W`]);
  const near = site.neighbours(AMPS, a, 5).concat([a]).sort((x, y) => x - y).map((x) => [x === a ? `<strong>${x} A</strong>` : `<a href="${BASE}${aSlug(x)}/">${x} A</a>`, `${n(x * 230, 0)} W`, `${n(x * 120, 0)} W`]);
  return site.head({ title, desc, url, ld: ld(title, desc, url, `${a} amps to watts`, q) }) + `    <header class="site-header">
      <a class="back-link" href="${BASE}">← Watts, amps and volts calculator</a>
      <h1 class="page-title">${a} amps to watts</h1>
      <p class="page-subtitle">${a} A is <strong>${n(w230, 0)} W</strong> at 230 V (UK) and <strong>${n(w120, 0)} W</strong> at 120 V (US).</p>
    </header>

    <main class="tool">
      <h2 class="tool-section-title">${a} amps at different voltages</h2>
${site.table(["Voltage", "Used for", "Power"], rows, 360)}      <p class="about-text" style="margin-top:12px;"><strong>Formula:</strong> watts = amps × volts, so ${a} × 230 = ${n(w230, 0)} W.</p>
      <p class="tool-hint">Single-phase, power factor 1. For three-phase or DC, use the <a href="${BASE}">watts, amps and volts calculator</a>.</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">Nearby currents</h2>
${site.table(["Current", "At 230 V", "At 120 V"], near, 300)}    </main>

    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}    </main>

${site.FOOTER}
  </div>
</body>
</html>
`;
}

/* Hand checks: 3000 W ÷ 230 V = 13.04 A; 1500 W ÷ 120 V = 12.5 A; 13 A × 230 V = 2990 W */
if (n(3000 / 230) !== "13.04" || 1500 / 120 !== 12.5 || 13 * 230 !== 2990) throw new Error("electrical check");

const urls = [];
WATTS.forEach((w) => { site.write(`watts-amps-volts/${wSlug(w)}`, wattPage(w)); urls.push([`${BASE}${wSlug(w)}/`, "0.4"]); });
AMPS.forEach((a) => { site.write(`watts-amps-volts/${aSlug(a)}`, ampPage(a)); urls.push([`${BASE}${aSlug(a)}/`, "0.4"]); });
site.hubBlock(BASE, "electrical pages", "tools/build-electrical-pages.js", `    <main class="tool">
      <h2 class="tool-section-title">Common conversions</h2>
      <p class="salary-links"><strong>Watts to amps:</strong> ${WATTS.map((w) => `<a href="${BASE}${wSlug(w)}/">${kw(w)}</a>`).join(" ")}</p>
      <p class="salary-links"><strong>Amps to watts:</strong> ${AMPS.map((a) => `<a href="${BASE}${aSlug(a)}/">${a} A</a>`).join(" ")}</p>
    </main>

`);
site.prune("watts-amps-volts", /^\d+-(watts-to-amps|amps-to-watts)$/);
site.sitemapBlock("electrical pages", "tools/build-electrical-pages.js", urls);
console.log(`built ${urls.length} electrical pages`);
