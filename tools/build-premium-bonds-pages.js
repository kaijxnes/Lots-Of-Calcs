#!/usr/bin/env node
/* The Premium Bonds calculator:

       /premium-bonds-calculator/

       node tools/build-premium-bonds-pages.js

   NS&I's prize fund rate, odds, limits and latest prize counts are in
   data/uk/premium-bonds.json; the page is built from the same simulation the
   calculator runs (premium-bonds.js, fixed seed). The build stops unless the
   prize counts add up to NS&I's totals, the rate they imply matches the
   quoted prize fund rate, and the quoted figures match the stored ones.
   The figures are refreshed from NS&I by tools/fetch-premium-bonds.js (a
   scheduled task on the 5th of each month), which also keeps NS&I's estimate
   for the next draw and a month-by-month history; the page shows the rate,
   odds and prize changes, and when the figures were and will next be
   updated. Runs in the monthly rebuild too; NS&I can change any of it. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const related = require("./related.js");
const PB = require("../premium-bonds.js");
const { esc, SITE } = site;

const R = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/uk/premium-bonds.json"), "utf8"));
const m0 = (v) => "£" + Math.round(v).toLocaleString("en-GB");
const pct = (v, dp = 1) => (Math.round(v * 100 * 10 ** dp) / 10 ** dp).toLocaleString("en-GB") + "%";
const E = R.rules.essentials.quote;
if (!E.includes(`${R.rate}%`) || !E.includes(`${R.odds.toLocaleString("en-GB")} to 1`) || !E.includes(m0(R.min)) || !E.includes(m0(R.max))) throw new Error("premium bonds: the rate, odds or limits no longer match NS&I's quoted wording");
const sumN = R.prizes.reduce((a, p) => a + p.count, 0), sumV = R.prizes.reduce((a, p) => a + p.count * p.value, 0);
if (sumN !== R.totalPrizes || sumV !== R.totalValue) throw new Error(`premium bonds: the prize counts add up to ${sumN} prizes and ${m0(sumV)}, not NS&I's ${R.totalPrizes} and ${m0(R.totalValue)}`);
if (Math.abs(PB.rate(R) * 100 - R.rate) > 0.02) throw new Error(`premium bonds: the prizes imply ${pct(PB.rate(R), 2)}, not the quoted ${R.rate}%`);
const NX = R.next;
if (NX && (NX.prizes.reduce((a, p) => a + p.count, 0) !== NX.totalPrizes || NX.prizes.reduce((a, p) => a + p.count * p.value, 0) !== NX.totalValue)) throw new Error(`premium bonds: NS&I's ${NX.draw} estimate doesn't add up to its totals`);

/* what's changed, and when the figures were and will next be updated */
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const longDate = (y, m, d) => `${d} ${MONTHS[m]} ${y}`;
const [cy, cm, cd] = R.lastChecked.split("-").map(Number);
const nextUpdate = cd < R.updateDay ? longDate(cy, cm - 1, R.updateDay) : cm === 12 ? longDate(cy + 1, 0, R.updateDay) : longDate(cy, cm, R.updateDay);
const signed = (v, f) => (v > 0 ? "+" : v < 0 ? "−" : "±") + f(Math.abs(v));
const n0 = (v) => Math.round(v).toLocaleString("en-GB");
const HIST = R.history || [];
const prevRate = HIST.find((h) => h.rate !== R.rate);
const tracked = (HIST.length ? HIST[HIST.length - 1].draw : R.draw);
const rateNote = R.rateChanged ? `changed from ${R.rateChanged.from}% (we spotted it on ${site.niceDate(R.rateChanged.noticed)})` : prevRate ? `${prevRate.rate}% in the ${esc(prevRate.draw)} draw` : `no change since we started tracking with the ${esc(tracked)} draw`;
const lastMonth = HIST[0];

const P = "/premium-bonds-calculator/", u = SITE + P;
const SRC = R.sources.map((s) => `<a href="${s.url}" rel="nofollow noopener" target="_blank">${esc(s.title)}</a>`).join(" and ");
const HOLD = [1000, 5000, 10000, 20000, 25000, 30000, 40000, 50000];
const sims = Object.fromEntries(HOLD.map((h) => [h, PB.simulate(R, h)]));
const rows = HOLD.map((h) => { const r = sims[h]; return [m0(h), (Math.round(r.prizes * 10) / 10).toLocaleString("en-GB"), m0(r.average), `<strong>${m0(r.median)}</strong> (${pct(r.median / h, 2)})`, `${m0(r.low)} to ${m0(r.high)}`, pct(r.none)]; });
const nxCount = (v) => { const x = NX && NX.prizes.find((p) => p.value === v); return x ? x.count : null; };
const prizeRows = R.prizes.slice().sort((a, b) => b.value - a.value).map((p) => [m0(p.value), p.count.toLocaleString("en-GB"), `1 in ${Math.round(R.totalPrizes / p.count).toLocaleString("en-GB")}`].concat(NX ? [nxCount(p.value) === null ? "—" : `${nxCount(p.value).toLocaleString("en-GB")}${nxCount(p.value) !== p.count ? ` (${signed(nxCount(p.value) - p.count, n0)})` : ""}`] : []));
const d = sims[50000], k = sims[1000];
const tool = `    <main class="tool split" id="pb-tool" data-rules="${esc(JSON.stringify({ odds: R.odds, min: R.min, max: R.max, prizes: R.prizes, totalPrizes: R.totalPrizes, totalValue: R.totalValue }))}">
      <div class="field"><label for="pb-holding">Premium Bonds you hold</label><input type="number" id="pb-holding" value="50000" min="${R.min}" max="${R.max}" step="any" inputmode="decimal"></div>
      <p class="tool-hint" id="pb-error" role="alert" style="color: var(--bad); display: none;"></p>
      <p class="tool-hint" style="margin:6px 0 0;">From ${m0(R.min)} to ${m0(R.max)}. Based on ${R.rate}% and odds of ${R.odds.toLocaleString("en-GB")} to 1 a month, with the ${esc(R.draw)} mix of prizes, simulated over 20,000 years. Prizes are tax-free.</p>
      <div class="result-box split-aside" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="pb-median">${m0(d.median)}</div>
          <div class="label" id="pb-label">typical winnings a year (${pct(d.median / 50000, 2)}): half of holders with ${m0(50000)} win less</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row"><span class="r-label">Average a year (the prize fund rate)</span><span class="r-value" id="pb-average">${m0(d.average)} (${pct(PB.rate(R), 2)})</span></div>
          <div class="result-row highlight"><span class="r-label">8 in 10 holders win</span><span class="r-value" id="pb-range">${m0(d.low)} to ${m0(d.high)}</span></div>
          <div class="result-row"><span class="r-label">Prizes a year, on average</span><span class="r-value" id="pb-prizes">${(Math.round(d.prizes * 10) / 10).toLocaleString("en-GB")}</span></div>
          <div class="result-row"><span class="r-label">Chance of no prize all year</span><span class="r-value" id="pb-none">${pct(d.none)}</span></div>
          <div class="result-row"><span class="r-label">Chance of a prize in a month</span><span class="r-value" id="pb-month">${pct(d.anyMonth)}</span></div>
        </div>
      </div>
    </main>
`;
const updRows = [
  ["Prize fund rate", `${R.rate}% a year (variable)`],
  ["Rate change", rateNote.charAt(0).toUpperCase() + rateNote.slice(1)],
  ["Odds", `${R.odds.toLocaleString("en-GB")} to 1 for each £1 Bond, each month${lastMonth && lastMonth.odds !== R.odds ? ` (was ${lastMonth.odds.toLocaleString("en-GB")} to 1)` : ""}`],
  [`${esc(R.draw)} draw`, `${n0(R.totalPrizes)} prizes worth ${m0(R.totalValue)}${lastMonth ? ` (${signed(R.totalPrizes - lastMonth.totalPrizes, n0)} prizes, ${signed(R.totalValue - lastMonth.totalValue, m0)} on ${esc(lastMonth.draw)})` : ""}`]
].concat(NX ? [[`${esc(NX.draw)} draw (NS&amp;I's estimate)`, `${n0(NX.totalPrizes)} prizes worth ${m0(NX.totalValue)} (${signed(NX.totalPrizes - R.totalPrizes, n0)} prizes, ${signed(NX.totalValue - R.totalValue, m0)})`]] : [])
  .concat([["Last updated", site.niceDate(R.lastChecked)], ["Next update", nextUpdate]]);
const updates = `    <main class="tool" id="pb-updates">
      <h2 class="tool-section-title">Rate and prizes this month</h2>
      <div class="result-grid" style="max-width:620px;">
${updRows.map(([k, v], i) => `        <div class="result-row${i === 0 ? " highlight" : ""}"><span class="r-label">${k}</span><span class="r-value">${v}</span></div>`).join("\n")}
      </div>
      <p class="tool-hint" style="margin-top:8px;">We check NS&amp;I's Premium Bonds and prize allocation pages on the ${R.updateDay}th of each month, after that month's prize draw. NS&amp;I can change the rate or odds at any time; a change is shown here at the next update.</p>
${HIST.length ? site.table(["Draw", "Prize fund rate", "Odds", "Prizes", "Prize fund"], [[`${esc(R.draw)}`, `${R.rate}%`, `${R.odds.toLocaleString("en-GB")} to 1`, n0(R.totalPrizes), m0(R.totalValue)]].concat(HIST.map((h) => [esc(h.draw), `${h.rate}%`, `${h.odds.toLocaleString("en-GB")} to 1`, n0(h.totalPrizes), m0(h.totalValue)])), 600) : ""}    </main>
`;
const body = `    <main class="tool">
      <h2 class="tool-section-title">Average vs typical winnings</h2>
      <p class="about-text">Premium Bonds don't pay interest. The prize fund rate, <strong>${R.rate}%</strong> (variable), is what all holders win on average, but two £1 million prizes and other large ones a month pull that average up. Most of the prize money goes on £25, £50 and £100 prizes, so most holders win less than ${R.rate}%. On ${m0(50000)}, the average is ${m0(d.average)} a year but a typical holder wins about ${m0(d.median)}. On ${m0(1000)}, ${pct(k.none, 0)} of holders win nothing in a year. Each £1 Bond has a ${R.odds.toLocaleString("en-GB")} to 1 chance in each monthly draw.</p>
${site.table(["Holding", "Prizes a year", "Average", "Typical (median)", "8 in 10 win", "No prize all year"], rows, 680)}      <p class="tool-hint" style="margin-top:8px;">A year of draws at today's rate and prizes, simulated 20,000 times. Prizes are free of Income Tax and Capital Gains Tax.</p>
      <h2 class="tool-section-title" style="margin-top:18px;">Prizes in the ${esc(R.draw)} draw</h2>
${site.table(["Prize", "Number of prizes", "Share of prizes"].concat(NX ? [`${esc(NX.draw)} (estimate)`] : []), prizeRows, 560)}      <p class="tool-hint" style="margin-top:8px;">${R.totalPrizes.toLocaleString("en-GB")} prizes worth ${m0(R.totalValue)} in all. Compare with interest on savings: the <a href="/savings-tax-calculator/">savings interest tax calculator</a> shows what's left of taxable interest, and the <a href="/compound-interest/">compound interest calculator</a> what a fixed rate grows to.</p>
    </main>
`;
const q = [
  ["How much will I win on Premium Bonds?", `On average ${R.rate}% a year, but most holders win less because big prizes pull the average up. With ${m0(50000)} the average is ${m0(d.average)} and a typical year about ${m0(d.median)}; 8 in 10 holders would win between ${m0(d.low)} and ${m0(d.high)}.`],
  ["What are the odds of winning Premium Bonds?", `${R.odds.toLocaleString("en-GB")} to 1 for every £1 Bond in each monthly draw. With ${m0(50000)} that's about ${(Math.round(d.prizes * 10) / 10).toLocaleString("en-GB")} prizes a year.`],
  [`How much do you win with ${m0(1000)} in Premium Bonds?`, `On average ${m0(k.average)} a year, but ${pct(k.none, 0)} of holders with ${m0(1000)} win nothing in a year, since they'd expect about ${(Math.round(k.prizes * 100) / 100).toLocaleString("en-GB")} prizes.`],
  ["Are Premium Bonds prizes taxed?", "No. NS&I says prizes are free from UK Income Tax and Capital Gains Tax."],
  ["How much can I put in Premium Bonds?", `From ${m0(R.min)} up to ${m0(R.max)}. Anyone 16 or over with a UK bank account can buy them.`]
];
const title = site.fitTitle(`Premium Bonds Calculator — Typical Winnings at ${R.rate}%`, "Premium Bonds Calculator");
const desc = `What your Premium Bonds might really win: the ${R.rate}% average and the typical (median) result from simulated draws, odds of ${R.odds.toLocaleString("en-GB")} to 1, and the chance of no prize.`;
const ld = [site.webPage(title, desc, u, R.lastChecked), site.breadcrumb([["Home", SITE + "/"], ["Savings", SITE + "/savings/"], ["Premium Bonds Calculator", u]]),
  { "@context": "https://schema.org", "@type": "WebApplication", name: "Premium Bonds Calculator", url: u, applicationCategory: "FinanceApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } }, site.faqLd(q)];
const html = site.head({ title, desc, url: u, ld }) + `    <header class="site-header">
      <a class="back-link" href="/savings/">← Savings calculators</a>
      <h1 class="page-title">Premium Bonds calculator</h1>
      <p class="page-subtitle">What your Premium Bonds might win in a year: the average, and what a typical holder actually gets.</p>
    </header>

${tool}
${updates}
${body}
    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}      <p class="tool-hint" style="margin-top:12px;">An estimate, not advice: NS&amp;I can change the prize fund rate, odds and prizes at any time. Figures from ${SRC}. Last updated ${site.niceDate(R.lastChecked)}; next update ${nextUpdate}.</p>
    </main>

${related.block(P)}
${site.FOOTER}
  </div>
  <script src="/premium-bonds.js"></script>
</body>
</html>
`;
site.write("premium-bonds-calculator", html);
site.sitemapBlock("premium bonds pages", "tools/build-premium-bonds-pages.js", [[P, "0.6"]]);
console.log(`built the Premium Bonds calculator (${R.rate}%, £50,000: average ${m0(d.average)}, typical ${m0(d.median)})`);
