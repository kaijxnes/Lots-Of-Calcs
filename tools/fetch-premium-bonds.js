#!/usr/bin/env node
/* Updates data/uk/premium-bonds.json from NS&I:

       node tools/fetch-premium-bonds.js

   Reads the prize fund rate, odds and limits from NS&I's Premium Bonds page,
   waits 10 seconds (NS&I's robots.txt asks for a 10-second crawl delay),
   then reads the monthly prize allocation page: the number of prizes of each
   value in the latest draw, and NS&I's estimate for the next one. When the
   latest draw has moved on a month, the previous month goes into "history"
   (the last 24 months are kept), so the Premium Bonds page can show how the
   rate and prizes have changed. Stops without touching the file if a page
   isn't what it expects or the prize counts don't add up to NS&I's totals.
   Run by the scheduled Premium Bonds update on the 5th of each month, then
   node tools/build-premium-bonds-pages.js. */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const FILE = path.join(__dirname, "..", "data/uk/premium-bonds.json");
const R = JSON.parse(fs.readFileSync(FILE, "utf8"));
const PRODUCT = R.sources[0].url, ALLOC = R.sources[1].url;
const MONTHS = "January|February|March|April|May|June|July|August|September|October|November|December";

function get(url) {
  const html = execFileSync("curl", ["-sS", "--fail", "--max-time", "60", "-A", "Mozilla/5.0", url], { encoding: "utf8", maxBuffer: 20e6 });
  return html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;| /g, " ").replace(/&amp;/g, "&").replace(/&#039;|&rsquo;/g, "’").replace(/&pound;/g, "£").replace(/\s+/g, " ")
    .replace(/What's/g, "What's").trim();
}
function fail(msg) { console.error("premium bonds: " + msg + " (data/uk/premium-bonds.json not changed)"); process.exit(1); }
const n = (s) => Number(String(s).replace(/[£,]/g, ""));
const value = (s) => (/million/.test(s) ? 1e6 * n(s.replace(/million/, "")) : n(s));

/* 1. rate, odds and limits */
const p = get(PRODUCT);
const ess = p.match(/What.s the annual prize fund rate\? [\s\S]*?What.s the maximum you can save\? £[\d,]+/);
if (!ess) fail("couldn't find the 'Essentials at a glance' wording on the Premium Bonds page");
const essentials = ess[0].replace(/^What.s/, "What's");
const rate = Number((essentials.match(/rate\? ([\d.]+)%/) || [])[1]);
const odds = n((essentials.match(/odds of winning\? ([\d,]+) to 1/) || [])[1] || "");
const min = n((essentials.match(/minimum you can pay in\? (£[\d,]+)/) || [])[1] || "");
const max = n((essentials.match(/maximum you can save\? (£[\d,]+)/) || [])[1] || "");
if (!(rate > 0 && rate < 20) || !(odds > 1000) || !(min > 0) || !(max > min)) fail(`odd figures from the Premium Bonds page: rate ${rate}, odds ${odds}, limits ${min}–${max}`);

execFileSync("sleep", ["10"]);

/* 2. the prize allocation table: latest draw and NS&I's estimate for the next */
const a = get(ALLOC);
const head = a.match(new RegExp(`prizes for the ((?:${MONTHS}) \\d{4}) draw, together with the estimated number of prizes of each value for the ((?:${MONTHS}) \\d{4}) draw`));
if (!head) fail("couldn't find the draw months on the prize allocation page");
const [, draw, nextDraw] = head;
const rows = [...a.matchAll(/£(1 million|[\d,]+) ([\d,]+) ([\d,]+)(?= )/g)].map((m) => ({ value: value(m[1]), now: n(m[2]), next: n(m[3]) }))
  .filter((r) => [1e6, 100000, 50000, 25000, 10000, 5000, 1000, 500, 100, 50, 25].includes(r.value));
const tp = a.match(/Total prizes ([\d,]+) ([\d,]+)/), tv = a.match(/Total value £([\d,]+) £([\d,]+)/);
if (rows.length !== 11 || new Set(rows.map((r) => r.value)).size !== 11 || !tp || !tv) fail(`couldn't read the prize table (${rows.length} rows)`);
const col = (k) => rows.map((r) => ({ value: r.value, count: r[k] })).sort((x, y) => y.value - x.value);
const now = { draw, prizes: col("now"), totalPrizes: n(tp[1]), totalValue: n(tv[1]) };
const next = { draw: nextDraw, estimate: true, prizes: col("next"), totalPrizes: n(tp[2]), totalValue: n(tv[2]) };
for (const c of [now, next]) {
  const sn = c.prizes.reduce((s, x) => s + x.count, 0), sv = c.prizes.reduce((s, x) => s + x.count * x.value, 0);
  if (sn !== c.totalPrizes || sv !== c.totalValue) fail(`the ${c.draw} prizes add up to ${sn} prizes and £${sv}, not NS&I's ${c.totalPrizes} and £${c.totalValue}`);
}
const implied = now.totalValue * 12 / (now.totalPrizes * odds) * 100;
if (Math.abs(implied - rate) > 0.05) fail(`the ${draw} prizes imply ${implied.toFixed(2)}%, not the ${rate}% on the Premium Bonds page — NS&I may be part-way through a change`);

/* 3. write it, keeping a month of history each time the draw moves on */
const today = new Date().toISOString().slice(0, 10);
const history = (R.history || []).slice();
const moved = R.draw !== draw;
if (moved && !history.some((h) => h.draw === R.draw)) history.unshift({ draw: R.draw, rate: R.rate, odds: R.odds, totalPrizes: R.totalPrizes, totalValue: R.totalValue, prizes: R.prizes });
const changes = [];
if (R.rate !== rate) changes.push(`rate ${R.rate}% -> ${rate}%`);
if (R.odds !== odds) changes.push(`odds ${R.odds} -> ${odds} to 1`);
if (moved) changes.push(`draw ${R.draw} -> ${draw}`);
if (R.rate !== rate) R.rateChanged = { from: R.rate, to: rate, noticed: today };
Object.assign(R, { draw, rate, odds, min, max, prizes: now.prizes, totalPrizes: now.totalPrizes, totalValue: now.totalValue, next, history: history.slice(0, 24), lastChecked: today });
R.rules.essentials.quote = essentials;
fs.writeFileSync(FILE, JSON.stringify(R, null, 2) + "\n");
console.log(`premium bonds: ${draw} draw, ${rate}%, ${odds.toLocaleString("en-GB")} to 1, ${now.totalPrizes.toLocaleString("en-GB")} prizes; next (${nextDraw}, estimate) ${next.totalPrizes.toLocaleString("en-GB")}. ${changes.length ? "Changed: " + changes.join("; ") : "No change since the last check."}`);
