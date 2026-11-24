#!/usr/bin/env node
/* "What does 7/2 mean?" — a page per common fractional price:

       /odds-converter/7-2/     4.50 decimal, +350 American, 22.2% implied

       node tools/build-odds-pages.js

   Every conversion goes through odds-utils.js, the code the live odds
   converter and betting calculators run, so the pages can't drift from them.
   Fractional n/d: decimal = n/d + 1, implied probability = d / (n + d).
   Each-way place part = stake × (1 + (decimal − 1) × place terms). */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const { load } = require("./lib/load-script.js");
const { SITE } = site;
const { Odds } = load("odds-utils.js", ["Odds"]);

const BASE = "/odds-converter/";
/* The ladder of prices UK bookmakers use, shortest to longest */
const LADDER = ["1/10", "1/8", "1/7", "1/6", "1/5", "2/9", "1/4", "2/7", "1/3", "4/11", "2/5", "4/9", "1/2", "8/15", "4/7", "8/13", "4/6", "8/11", "4/5", "5/6", "10/11", "1/1",
  "11/10", "6/5", "5/4", "11/8", "6/4", "13/8", "7/4", "15/8", "2/1", "9/4", "5/2", "11/4", "3/1", "10/3", "7/2", "4/1", "9/2", "5/1", "11/2", "6/1", "13/2", "7/1", "15/2", "8/1",
  "9/1", "10/1", "11/1", "12/1", "14/1", "16/1", "18/1", "20/1", "25/1", "28/1", "33/1", "40/1", "50/1", "66/1", "80/1", "100/1"];
const STAKES = [1, 2, 5, 10, 20, 50, 100];
const SAFER = '18+. Odds are a price, not a prediction — the bookmaker\'s margin is built in. If gambling stops being fun, <a href="https://www.gambleaware.org/" rel="noopener">GambleAware</a> offers free, confidential help.';

const slug = (f) => (f === "1/1" ? "evens" : f.replace("/", "-"));
const name = (f) => (f === "1/1" ? "Evens" : f);
const parts = (f) => f.split("/").map(Number);
const trim = (v, dp) => String(Number(v.toFixed(dp)));
const money = (v) => "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const decStr = (d) => d.toFixed(2);
function american(d) { const a = Odds.decimalToAmerican(d); return (a > 0 ? "+" : "") + trim(a, 1); }

const ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
function words(n) { if (n === 100) return "a hundred"; if (n < 20) return ONES[n]; return TENS[Math.floor(n / 10)] + (n % 10 ? "-" + ONES[n % 10] : ""); }
const spoken = (f) => { const [n, d] = parts(f); return f === "1/1" ? "evens" : `${words(n)} to ${words(d)}${n < d ? " on" : ""}`; };

function facts(f) {
  const [n, d] = parts(f);
  const dec = Odds.parse(f);
  return { n, d, dec, us: american(dec), prob: (d / (n + d)) * 100, onFor: n < d ? "odds-on" : n === d ? "evens" : "odds-against" };
}

function page(f, i) {
  const x = facts(f), nm = name(f), nml = f === "1/1" ? "evens" : f, url = SITE + `${BASE}${slug(f)}/`;
  const ten = 10 * (x.dec - 1);
  const to = f === "1/1" ? "1 to 1" : `${x.n} to ${x.d}`;
  const title = site.fitTitle(`${nm} Odds (${to}) — ${decStr(x.dec)} Decimal, ${x.us} American, ${trim(x.prob, 1)}% Chance`, `${nm} Odds (${to}) — ${decStr(x.dec)} Decimal, ${x.us}, ${trim(x.prob, 1)}%`, `${nm} Odds — ${decStr(x.dec)} Decimal, ${x.us} American, ${trim(x.prob, 1)}% Chance`, `${nm} Odds — ${decStr(x.dec)} Decimal, ${x.us}, ${trim(x.prob, 1)}% Implied`, `${nm} Odds in Decimal and American`);
  const what = f === "1/1"
    ? "Evens (1/1) means you win the same as you stake: £10 on at evens makes £10 profit and returns £20."
    : `${f} means you win £${x.n} for every £${x.d} you stake${x.n < x.d ? " — less than your stake, which is what odds-on means" : ""}. £10 at ${f} makes ${money(ten)} profit and returns ${money(ten + 10)} with your stake.`;
  const desc = `${nm} is ${decStr(x.dec)} in decimal odds, ${x.us} American and a ${trim(x.prob, 1)}% implied chance. £10 at ${nml} makes ${money(ten)} profit and returns ${money(ten + 10)}.`;
  const ew = x.dec >= 2;
  const q = [
    [`What does ${nm} (${to}) mean in betting?`, what + ` It's said "${spoken(f)}".`],
    [`What is ${nm} in decimal odds?`, `${decStr(x.dec)}: divide ${x.n} by ${x.d} and add 1 for your stake. Decimal odds are the total return for each £1 staked.`],
    [`What is ${nm} in American odds?`, x.dec >= 2 ? `${x.us}: the profit on a 100 stake.` : `${x.us}: the stake needed to win 100 profit.`],
    [`What chance of winning does ${nm} imply?`, `${trim(x.prob, 1)}% — ${x.d} ÷ (${x.n} + ${x.d}). That's the chance the price corresponds to, including the bookmaker's margin, so the real chance is usually a little lower.`]
  ];
  if (ew) q.push([`How much does a £10 each-way bet at ${nml} pay?`, `£20 in total (£10 to win, £10 to place). If it wins at 1/4 place terms it returns ${money(10 * x.dec + 10 * Odds.placeOdds(x.dec, 1 / 4))}; if it only places, ${money(10 * Odds.placeOdds(x.dec, 1 / 4))}.`]);
  const ld = [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], ["Odds Converter", SITE + BASE], [`${nm} odds`, url]]), site.faqLd(q)];

  const conv = [["Fractional", f === "1/1" ? "1/1 (evens)" : f], ["Decimal", decStr(x.dec)], ["American (moneyline)", x.us], ["Implied probability", trim(x.prob, 2) + "%"], ["Type", x.onFor]];
  const stakeRows = STAKES.map((s) => [money(s), money(s * (x.dec - 1)), money(s * x.dec)]);
  const ewRows = ew ? [[1 / 4, "1/4"], [1 / 5, "1/5"]].map(([t, l]) => { const p = Odds.placeOdds(x.dec, t); return [l, money(10 * p), money(10 * x.dec + 10 * p), money(10 * p - 10)]; }) : [];
  const near = site.neighbours(LADDER, f, 5).map((g) => `<a href="${BASE}${slug(g)}/">${name(g)}</a>`).join(" ");

  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="${BASE}">← Odds converter</a>
      <h1 class="page-title">${nm} odds (${to}) explained</h1>
      <p class="page-subtitle">${what}</p>
    </header>

    <main class="tool" id="op-tool" data-dec="${x.dec}">
${site.table(["Format", nm], conv.map(([a, b]) => [a, `<strong>${b}</strong>`]), 260)}
      <h2 class="tool-section-title" style="margin-top:20px;">Your stake at ${nml}</h2>
      <div class="field-row">
        <div class="field"><label for="op-stake">Stake</label><input type="number" id="op-stake" value="10" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="op-cur">Currency</label><select id="op-cur"><option value="£" selected>£</option><option value="$">$</option><option value="€">€</option></select></div>
      </div>
      <p class="tool-hint" id="op-error" role="alert" style="color: var(--bad); display: none;"></p>
      <div class="result-box" aria-live="polite">
        <div class="result-grid">
          <div class="result-row"><span class="r-label">Profit if it wins</span><span class="r-value" id="op-profit">${money(ten)}</span></div>
          <div class="result-row highlight"><span class="r-label">Total return (stake back)</span><span class="r-value" id="op-return">${money(ten + 10)}</span></div>
        </div>
      </div>
      <p class="tool-hint" style="margin-top:12px;">To convert any other price, use the <a href="${BASE}">odds converter</a>.</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">Returns at ${nml}</h2>
${site.table(["Stake", "Profit", "Total return"], stakeRows, 260)}${ew ? `      <h2 class="tool-section-title" style="margin-top:20px;">£10 each-way at ${nml} (£20 total)</h2>
${site.table(["Terms", "Places: return", "Wins: return", "Places: profit"], ewRows, 290)}      <p class="tool-hint" style="margin-top:12px;">The place part pays a fraction of the win odds: at 1/4 terms, ${nm} places at ${decStr(Odds.placeOdds(x.dec, 1 / 4))}. If it wins, both parts pay. More in the <a href="/each-way/">each-way calculator</a>.</p>
` : ""}    </main>

    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}      <p class="tool-hint" style="margin-top:12px;">${SAFER}</p>
    </main>

    <div class="hub-group-title" style="margin-top:28px;">${i > 0 ? "Shorter and longer prices" : "Longer prices"}</div>
    <p class="salary-links">${near}</p>

${site.FOOTER}
  </div>
  <script src="/odds-page.js"></script>
</body>
</html>
`;
}

function hubBlock() {
  const file = path.join(site.ROOT, "odds-converter/index.html");
  const START = "    <!-- odds pages: generated by tools/build-odds-pages.js -->\n", END = "    <!-- end odds pages -->\n";
  let s = fs.readFileSync(file, "utf8");
  if (s.includes(START)) s = s.slice(0, s.indexOf(START)) + s.slice(s.indexOf(END) + END.length).replace(/^\n/, "");
  const link = (f) => `<a href="${BASE}${slug(f)}/">${name(f)}</a>`;
  const on = LADDER.filter((f) => facts(f).dec < 2), against = LADDER.filter((f) => facts(f).dec >= 2);
  const html = `    <main class="tool">
      <h2 class="tool-section-title">Common odds explained</h2>
      <p class="tool-hint">Each price in decimal, American and implied probability, with returns and each-way payouts.</p>
      <h2 class="tool-section-title" style="margin-top:16px;">Odds-on and evens</h2>
      <p class="salary-links">${on.map(link).join(" ")}</p>
      <h2 class="tool-section-title" style="margin-top:16px;">Odds-against</h2>
      <p class="salary-links">${against.map(link).join(" ")}</p>
    </main>

`;
  const at = s.indexOf("    <!-- related calculators: generated by tools/related.js -->");
  s = s.slice(0, at) + START + html + END + "\n" + s.slice(at);
  fs.writeFileSync(file, s);
}

/* Hand checks: 7/2 is 4.50, +350, 22.22%; 4/6 is 1.67, -150, 60%; £10 e/w at 10/1, 1/5 terms, placed returns £30 */
{
  const a = facts("7/2"), b = facts("4/6");
  if (a.dec !== 4.5 || a.us !== "+350" || Math.abs(a.prob - 22.222) > 0.01 || b.us !== "-150" || Math.abs(b.prob - 60) > 1e-9) throw new Error("odds check");
  if (Math.abs(10 * Odds.placeOdds(11, 1 / 5) - 30) > 1e-9) throw new Error("each-way check");
}

const urls = [];
LADDER.forEach((f, i) => { site.write(`odds-converter/${slug(f)}`, page(f, i)); urls.push([`${BASE}${slug(f)}/`, "0.5"]); });
hubBlock();
site.prune("odds-converter", /^(evens|\d+-\d+)$/);
site.sitemapBlock("odds pages", "tools/build-odds-pages.js", urls);
console.log(`built ${urls.length} odds pages`);
