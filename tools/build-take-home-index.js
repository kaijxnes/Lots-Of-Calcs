#!/usr/bin/env node
/* Take-home pay by country — the same salary after tax in 26 places, ranked:

       /salary-comparison/take-home-pay-by-country/
       /salary-comparison/take-home-pay-by-country.csv   the figures, for reuse

       node tools/build-take-home-index.js

   Each place's figures come from tax-engine.js with its default options (a
   single employee, no pension), as on the salary pages; salaries are
   converted from euros at the ECB reference rate in data/currency/ecb.json.
   Runs in the monthly rebuild after the rates and exchange rates. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const TaxEngine = require("../tax-engine.js");
const registry = require("./tax/registry.js");
const config = require("./salary-pages-config.js");
const { SITE, esc } = site;

const all = registry.readAll(), current = registry.currentFiles(all);
const E = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/currency/ecb.json"), "utf8"));
const PLACES = {};
JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/salary-places.json"), "utf8")).groups.forEach((g) => g.places.forEach((p) => (PLACES[p.id] = p)));
const DATE = new Date(E.date + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const YEAR = site.TODAY.slice(0, 4);

const IDS = ["gb", "gb-sct", "ie", "de", "fr", "es", "it", "nl", "be", "lu", "pt", "at", "fi", "se", "no", "dk", "ch", "ch-zg", "us-tx", "us-ca", "us-ny-nyc", "ca-on", "au", "nz", "jp", "in"];
const NAME = { gb: "UK (England, Wales, NI)", "gb-sct": "UK (Scotland)", ch: "Switzerland (Zurich)", "ch-zg": "Switzerland (Zug)", "us-tx": "US (Texas)", "us-ca": "US (California)", "us-ny-nyc": "US (New York City)", "ca-on": "Canada (Ontario)" };
const LEVELS = [30000, 50000, 100000];
const SYM = { GBP: "£", EUR: "€", USD: "$", CAD: "C$", AUD: "A$", NZD: "NZ$", CHF: "CHF ", JPY: "¥", INR: "₹", SEK: "SEK ", NOK: "NOK ", DKK: "DKK " };
const m0 = (c, v) => (SYM[c] || c + " ") + Math.round(v).toLocaleString("en-GB");
const pct = (v) => (v * 100).toFixed(1) + "%";
const base = "/salary-comparison/take-home-pay-by-country/";

const rows = IDS.map((id) => {
  if (!current[id] || !PLACES[id]) throw new Error("take-home index: no current tax file or salary page for " + id);
  const doc = current[id].doc, cur = PLACES[id].currency, chain = registry.chainFor(doc, all);
  const rate = E.rates[cur] / E.rates.EUR;
  if (!rate) throw new Error("no ECB rate for " + cur);
  const at = LEVELS.map((eur) => { const g = eur * rate, net = TaxEngine.compute(chain, g, {}).net; return { eur, g, net, netEur: net / rate, kept: net / g }; });
  return { id, name: NAME[id] || doc.name, cur, rate, at, year: doc.taxYear.label, checked: doc.lastChecked, href: "/salary/" + (config.placeFor(id, doc) || {}).path + "/" };
});
const by = (i) => rows.slice().sort((a, b) => b.at[i].kept - a.at[i].kept);
const ranked = by(1);
const rankOf = (id, i) => by(i).findIndex((r) => r.id === id) + 1;
const top = ranked[0], bottom = ranked[ranked.length - 1], uk = rows.find((r) => r.id === "gb");
const gap = top.at[1].netEur - bottom.at[1].netEur;
const median = (() => { const v = ranked.map((r) => r.at[1].kept).sort((a, b) => a - b); return (v[12] + v[13]) / 2; })();

/* bar chart: share of €50,000 kept, best first */
function chart() {
  const W = 640, rowH = 22, left = 190, right = 56, H = ranked.length * rowH + 30;
  const lo = 0.5, hi = 1, x = (v) => left + ((v - lo) / (hi - lo)) * (W - left - right);
  const bars = ranked.map((r, i) => {
    const y = 10 + i * rowH, v = r.at[1].kept;
    return `<text x="${left - 8}" y="${y + 14}" text-anchor="end" class="ch-label">${esc(r.name)}</text><rect x="${left}" y="${y + 3}" width="${(x(v) - left).toFixed(1)}" height="${rowH - 7}" rx="3" class="ch-bar${r.id === "gb" || r.id === "gb-sct" ? " ch-hl" : ""}"></rect><text x="${(x(v) + 6).toFixed(1)}" y="${y + 14}" class="ch-val">${pct(v)}</text>`;
  }).join("");
  const ticks = [0.5, 0.6, 0.7, 0.8, 0.9, 1].map((t) => `<line x1="${x(t)}" x2="${x(t)}" y1="6" y2="${H - 20}" class="ch-grid"></line><text x="${x(t)}" y="${H - 6}" text-anchor="middle" class="ch-tick">${t * 100}%</text>`).join("");
  return `<svg class="ch" viewBox="0 0 ${W} ${H}" role="img" aria-label="Share of a €50,000 salary kept after tax, from ${esc(top.name)} (${pct(top.at[1].kept)}) to ${esc(bottom.name)} (${pct(bottom.at[1].kept)})">${ticks}${bars}</svg>`;
}

const title = site.fitTitle(`Take-Home Pay by Country ${YEAR}: How Much of a €50,000 Salary You Keep`, `Take-Home Pay by Country ${YEAR} — 26 Places Ranked`);
const desc = `The same €50,000 salary after income tax and social contributions in 26 places: ${top.name} keeps the most (${pct(top.at[1].kept)}), ${bottom.name} the least (${pct(bottom.at[1].kept)}). Ranked at €30,000, €50,000 and €100,000, with the data to download.`;
const q = [
  ["Which country lets you keep the most of your salary?", `Of the 26 places here, ${top.name}: a €50,000 salary leaves ${m0(top.cur, top.at[1].net)}${top.cur === "EUR" ? "" : ` (${m0("EUR", top.at[1].netEur)})`}, or ${pct(top.at[1].kept)}, after income tax and employee social contributions. ${bottom.name} leaves the least, ${pct(bottom.at[1].kept)}.`],
  ["How does the UK compare?", `The UK (England, Wales and Northern Ireland) ranks ${rankOf("gb", 1)} of 26 on a €50,000 salary (${m0("GBP", uk.at[1].g)}), keeping ${pct(uk.at[1].kept)}. On €30,000 it ranks ${rankOf("gb", 0)}, and on €100,000, ${rankOf("gb", 2)}.`],
  ["Why do the rankings change with salary?", "Countries tax in different ways: some have a large tax-free allowance and steep top rates, others take a flat share in social contributions from the first euro, and some cap contributions. So a country can be cheap on a modest salary and expensive on a high one, or the other way round."],
  ["Does this account for the cost of living?", "No. It compares only what's taken from the same gross salary. Prices, rents, healthcare and pensions differ a lot: in Switzerland, for example, health insurance is compulsory but paid separately, not from pay. What a given job pays also differs from country to country, so take-home pay is one part of the picture."],
  ["Can I use these figures?", `Yes, with a link to this page. The full table is available as a CSV, and each place's figures come from its own calculator on this site, where the rates and their official sources are listed.`]
];

const table = site.table(["#", "Place", "€50,000 is", "Take-home", "Kept at €30k", "Kept at €50k", "Kept at €100k"], ranked.map((r, i) => [
  String(i + 1), `<a href="${r.href}">${esc(r.name)}</a>`, esc(m0(r.cur, r.at[1].g)), esc(m0(r.cur, r.at[1].net)) + (r.cur === "EUR" ? "" : `<br><span class="tool-hint">${esc(m0("EUR", r.at[1].netEur))}</span>`),
  pct(r.at[0].kept), `<strong>${pct(r.at[1].kept)}</strong>`, pct(r.at[2].kept)]), 640);

const csv = ["place,tax_year,currency,eur_to_currency,gross_30k_eur_local,net_30k_local,kept_30k,gross_50k_eur_local,net_50k_local,kept_50k,gross_100k_eur_local,net_100k_local,kept_100k"]
  .concat(ranked.map((r) => [JSON.stringify(r.name), r.year, r.cur, r.rate.toFixed(4)].concat(...r.at.map((a) => [a.g.toFixed(0), a.net.toFixed(2), a.kept.toFixed(4)])).join(","))).join("\n") + "\n";
const cite = `Lots Of Calcs, "Take-home pay by country ${YEAR}", ${SITE}${base} (figures as of ${site.niceDate(site.TODAY)}).`;

const url = SITE + base;
const ld = [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], ["Salary Calculator", SITE + "/salary/"], ["Take-home pay by country", url]]),
  { "@context": "https://schema.org", "@type": "Dataset", name: `Take-home pay by country ${YEAR}`, description: desc, url, license: "https://creativecommons.org/licenses/by/4.0/", creator: { "@type": "Organization", name: "Lots Of Calcs", url: SITE + "/" }, dateModified: site.TODAY, distribution: [{ "@type": "DataDownload", encodingFormat: "text/csv", contentUrl: SITE + "/salary-comparison/take-home-pay-by-country.csv" }] },
  site.faqLd(q)];

const html = site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="/salary/">← Salary calculator</a>
      <h1 class="page-title">Take-home pay by country, ${YEAR}</h1>
      <p class="page-subtitle">How much of the same salary you keep after income tax and social contributions, in 26 places.</p>
    </header>

    <main class="tool">
      <h2 class="tool-section-title">The short version</h2>
      <p class="about-text">On a <strong>€50,000</strong> salary, <strong>${esc(top.name)}</strong> leaves the most: ${pct(top.at[1].kept)}. <strong>${esc(bottom.name)}</strong> leaves the least: ${pct(bottom.at[1].kept)}. That's a difference of <strong>${esc(m0("EUR", gap))} a year</strong> on the same pay. The typical place keeps about ${pct(median)}.</p>
      <p class="about-text">The UK (England, Wales and Northern Ireland) ranks <strong>${rankOf("gb", 1)} of 26</strong>, keeping ${pct(uk.at[1].kept)} of ${esc(m0("GBP", uk.at[1].g))}. Rankings shift with salary: the UK is ${rankOf("gb", 0)} on €30,000 and ${rankOf("gb", 2)} on €100,000.</p>
      <h2 class="tool-section-title" style="margin-top:22px;">Share of a €50,000 salary kept after tax</h2>
      <div class="table-scroll"><div style="min-width:560px;">${chart()}</div></div>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">All 26 places, ranked at €50,000</h2>
${table}      <p class="tool-hint" style="margin-top:12px;">Salaries converted from euros at the European Central Bank's reference rates for ${DATE}. Tap a place for its salary calculator, with every rate and its official source.</p>
      <p class="salary-links" style="margin-top:12px;"><a href="/salary-comparison/take-home-pay-by-country.csv" download>Download the data (CSV)</a></p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">How it's worked out</h2>
      <p class="about-text">For each place: a single employee on the salary shown, with that place's default options, using the current tax year's income tax and employee social contributions (National Insurance, social security, health and unemployment insurance and similar), plus compulsory workplace pension contributions where they're taken from pay, as with Switzerland's occupational pension. Voluntary pension saving isn't included. Nor are costs that aren't taken from pay, which matter most for the places at the top: Switzerland's compulsory health insurance premiums and US health plan premiums are paid separately and would lower their take-home. Employer contributions, benefits and credits for children are left out too; each place's calculator lists what it doesn't model. The figures come from the same calculators as the rest of the site, whose tax files are checked against official sources every month; <a href="/how-we-check/">how we check our figures</a> explains the process.</p>
      <p class="about-text"><strong>To cite this page:</strong> ${esc(cite)}</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}    </main>

    <main class="tool">
      <h2 class="tool-section-title">Compare two places</h2>
      <p class="salary-links">${config.COMPARISON_PAIRS.map(([a, b]) => `<a href="/salary-comparison/${config.comparisonSlug(a, b)}/">${esc(config.COMPARISON_LABEL[a][0])} vs ${esc(config.COMPARISON_LABEL[b][0])}</a>`).join(" ")}</p>
    </main>

${site.FOOTER}
  </div>
</body>
</html>
`;

site.write("salary-comparison/take-home-pay-by-country", html);
fs.writeFileSync(path.join(site.ROOT, "salary-comparison/take-home-pay-by-country.csv"), csv);
site.sitemapBlock("take-home pay by country", "tools/build-take-home-index.js", [[base, "0.7"]]);
console.log(`take-home pay by country: ${rows.length} places; top ${top.name} ${pct(top.at[1].kept)}, bottom ${bottom.name} ${pct(bottom.at[1].kept)}, UK ${rankOf("gb", 1)}`);
