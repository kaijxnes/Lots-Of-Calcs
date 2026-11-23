#!/usr/bin/env node
/* "How much do I need to save a month to have £10,000 by 2030?"

       /savings-goal/10000-by-2030/     £205 a month from December 2026, or less with interest

       node tools/build-savings-goal-pages.js

   "By 2030" means by the end of 2030. Saving starts next month and a
   deposit goes in at the end of each month up to December of that year, so
   the number of months depends on when this is built: it runs in the
   monthly rebuild, and the years roll forward each January.

   Interest follows the savings goal calculator's default, monthly
   compounding at the annual rate ÷ 12:
   monthly = goal × i ÷ ((1 + i)^n − 1), or goal ÷ n with no interest. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const { SITE } = site;

const BASE = "/savings-goal/";
const GOALS = [1000, 2000, 3000, 5000, 10000, 15000, 20000, 25000, 30000, 40000, 50000, 100000];
const now = new Date();
const Y0 = now.getFullYear(), M0 = now.getMonth(); // 0-based month
const YEARS = Array.from({ length: 10 }, (_, i) => Y0 + 1 + i);
const RATES = [0, 2, 3, 4, 5];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const slug = (g, y) => `${g}-by-${y}`;
const m0 = (v) => "£" + Math.round(v).toLocaleString("en-GB");
const m2 = (v) => "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const gN = (g) => "£" + g.toLocaleString("en-GB");
function monthsTo(y, delay) { return (y - Y0) * 12 + (11 - M0) - (delay || 0); }
function monthName(offset) { const t = M0 + 1 + offset; return MONTHS[((t % 12) + 12) % 12] + " " + (Y0 + Math.floor(t / 12)); }
function pmt(goal, n, rate) {
  if (n <= 0) return NaN;
  const i = rate / 100 / 12;
  return i === 0 ? goal / n : goal * i / (Math.pow(1 + i, n) - 1);
}

function page(g, y) {
  const n = monthsTo(y), url = SITE + `${BASE}${slug(g, y)}/`;
  const plain = pmt(g, n, 0), at4 = pmt(g, n, 4);
  const weekly = plain * 12 / 52;
  const start = monthName(0);
  const title = site.fitTitle(`Save ${gN(g)} by ${y} — ${m0(plain)} a Month (or ${m0(at4)} With Interest)`, `Save ${gN(g)} by ${y} — ${m0(plain)} a Month`);
  const desc = `To have ${gN(g)} by the end of ${y}, save ${m2(plain)} a month for ${n} months from ${start} — about ${m2(weekly)} a week. At 4% interest it drops to ${m2(at4)} a month.`;
  const rateRows = RATES.map((r) => { const p = pmt(g, n, r); return [r === 0 ? "No interest" : `${r}%`, `<strong>${m2(p)}</strong>`, m2(p * 12 / 52), m0(p * n), m0(g - p * n)]; });
  const waits = [0, 3, 6, 12, 24].filter((d) => monthsTo(y, d) >= 6);
  const waitRows = waits.map((d) => { const k = monthsTo(y, d); return [d === 0 ? `${monthName(0)} (next month)` : monthName(d), String(k), m2(pmt(g, k, 0)), m2(pmt(g, k, 4))]; });
  const years = Math.floor(n / 12), months = n % 12;
  const calc = `${BASE}?goal=${g}&amp;years=${years}&amp;months=${months}&amp;rate=4`;
  const q = [
    [`How much do I need to save a month to have ${gN(g)} by ${y}?`, `${m2(plain)} a month, starting in ${start} and saving every month until December ${y} — ${n} payments. That's about ${m2(weekly)} a week.`],
    ["How much less do I need to save with interest?", `At 4% a year, compounded monthly, ${m2(at4)} a month gets you there, because the interest makes up ${m0(g - at4 * n)} of the ${gN(g)}. At 2% it's ${m2(pmt(g, n, 2))} and at 5% ${m2(pmt(g, n, 5))}.`],
    ["What if I start later?", waits.length > 1 ? `Every month you wait spreads the same total over fewer payments. Starting in ${monthName(waits[waits.length - 1])} instead of ${start}, you'd need ${m2(pmt(g, monthsTo(y, waits[waits.length - 1]), 0))} a month without interest.` : `With ${n} months to go there's little room to wait: each month's delay adds to every payment after it.`],
    ["What if I already have some saved?", `Take it off the goal first, then divide what's left by the months. With ${m0(g / 4)} already saved, you'd need ${m2(pmt(g * 0.75, n, 0))} a month without interest. The savings goal calculator does this with interest on both.`]
  ];
  const ld = [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], ["Savings Goal Calculator", SITE + BASE], [`${gN(g)} by ${y}`, url]]), site.faqLd(q)];
  const otherYears = YEARS.map((x) => x === y ? `<strong>${y}</strong>` : `<a href="${BASE}${slug(g, x)}/">${x}</a>`).join(" ");
  const otherGoals = GOALS.map((x) => x === g ? `<strong>${gN(x)}</strong>` : `<a href="${BASE}${slug(x, y)}/">${gN(x)}</a>`).join(" ");
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="${BASE}">← Savings goal calculator</a>
      <h1 class="page-title">How much to save a month for ${gN(g)} by ${y}</h1>
      <p class="page-subtitle">Save <strong>${m2(plain)} a month</strong> from ${start} to December ${y} — ${n} months — and you'll have ${gN(g)}. With interest you need less.</p>
    </header>

    <main class="tool">
      <div class="result-box">
        <div class="result-hero"><div class="value">${m2(plain)}</div><div class="label">a month for ${n} months, no interest</div></div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row"><span class="r-label">A week instead</span><span class="r-value">${m2(weekly)}</span></div>
          <div class="result-row"><span class="r-label">First and last deposit</span><span class="r-value">${start} → December ${y}</span></div>
          <div class="result-row highlight"><span class="r-label">At 4% interest</span><span class="r-value">${m2(at4)} a month</span></div>
          <div class="result-row"><span class="r-label">Interest earned at 4%</span><span class="r-value">${m0(g - at4 * n)}</span></div>
        </div>
      </div>
      <p class="tool-hint" style="margin-top:12px;"><a href="${calc}">Open this in the savings goal calculator</a> to add money you've already saved or change the rate.</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">At different interest rates</h2>
${site.table(["Interest rate", "A month", "A week", "You pay in", "Interest"], rateRows, 460)}      <p class="tool-hint" style="margin-top:12px;">Interest compounds monthly at the annual rate ÷ 12, with a deposit at the end of each month. These rates are examples, not offers; savings rates change, and interest outside an ISA can be taxable above your personal savings allowance.</p>
${waitRows.length > 1 ? `      <h2 class="tool-section-title" style="margin-top:20px;">If you start later</h2>
${site.table(["First deposit", "Months", "A month, no interest", "A month at 4%"], waitRows, 420)}` : ""}    </main>

    <main class="tool">
      <h2 class="tool-section-title">How it's worked out</h2>
      <p class="about-text"><strong>Without interest</strong> it's simply the goal divided by the months: ${gN(g)} ÷ ${n} = ${m2(plain)}.</p>
      <p class="about-text"><strong>With interest</strong>, each deposit earns interest for the months left after it goes in, so you need to pay in less. The monthly amount is goal × i ÷ ((1 + i)<sup>n</sup> − 1), where i is the monthly rate (4% ÷ 12 = 0.333%) and n is ${n} months: ${m2(at4)}.</p>
      <p class="about-text">To save in smaller, rising steps instead, the <a href="/52-week-savings-challenge/">52-week savings challenge</a> gets to £1,378 a year from £1 a week; to see what regular saving grows to over longer periods, use the <a href="/compound-interest/">compound interest calculator</a>.</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}    </main>

    <div class="hub-group-title" style="margin-top:28px;">${gN(g)} by another year</div>
    <p class="salary-links">${otherYears}</p>
    <div class="hub-group-title" style="margin-top:18px;">Another amount by ${y}</div>
    <p class="salary-links">${otherGoals}</p>

${site.FOOTER}
  </div>
</body>
</html>
`;
}

function hubBlock() {
  const file = path.join(site.ROOT, "savings-goal/index.html");
  const START = "    <!-- savings goal pages: generated by tools/build-savings-goal-pages.js -->\n", END = "    <!-- end savings goal pages -->\n";
  let s = fs.readFileSync(file, "utf8");
  if (s.includes(START)) s = s.slice(0, s.indexOf(START)) + s.slice(s.indexOf(END) + END.length);
  const html = `    <main class="tool">
      <h2 class="tool-section-title">How much to save a month, by year</h2>
      <p class="tool-hint">Starting in ${monthName(0)} and saving until the end of the year shown.</p>
${GOALS.map((g) => `      <p class="salary-links"><strong>${gN(g)} by:</strong> ${YEARS.map((y) => `<a href="${BASE}${slug(g, y)}/">${y}</a>`).join(" ")}</p>`).join("\n")}
    </main>

`;
  const at = s.indexOf("    <!-- related calculators: generated by tools/related.js -->");
  if (at < 0) throw new Error("savings-goal: related marker not found");
  s = s.slice(0, at) + START + html + END + "\n" + s.slice(at);
  fs.writeFileSync(file, s);
}

/* Hand checks: £12,000 over 12 months is £1,000 a month; at 4% (i = 1/300)
   £10,000 over 12 months is £10,000 × i ÷ ((1+i)^12 − 1) = £818.17 */
if (pmt(12000, 12, 0) !== 1000 || Math.abs(pmt(10000, 12, 4) - 818.17) > 0.01) throw new Error("savings goal check");

const urls = [];
GOALS.forEach((g) => YEARS.forEach((y) => { site.write(`savings-goal/${slug(g, y)}`, page(g, y)); urls.push([`${BASE}${slug(g, y)}/`, "0.5"]); }));
hubBlock();
site.prune("savings-goal", /^\d+-by-\d{4}$/);
site.sitemapBlock("savings goal pages", "tools/build-savings-goal-pages.js", urls);
console.log(`built ${urls.length} savings goal pages, ${YEARS[0]}–${YEARS[YEARS.length - 1]}, starting ${monthName(0)}`);
