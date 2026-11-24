#!/usr/bin/env node
/* Reference tables on the betting calculators — the answers people look up
   without wanting to type anything in:

       /each-way/      £10 each-way returns at common prices and place terms
       /accumulator/   doubles, trebles and four-folds of common prices
       /lay/           lay stake, liability and result on a £10 qualifying bet
       /dutching/      £100 dutched across common pairs and threes of prices

       node tools/build-betting-tables.js

   Every figure goes through odds-utils.js, the code the calculators run, and
   the lay and dutching formulas are the ones in lay.js and dutching.js. The
   block sits just above each page's FAQ and is replaced on every run. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const { load } = require("./lib/load-script.js");
const { Odds } = load("odds-utils.js", ["Odds"]);

const money = (v) => "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dec2 = (v) => v.toFixed(2);
const frac = (d) => (Math.abs(d - 2) < 1e-9 ? "evens" : Odds.formatFraction(d));
const name = (f) => (f === "1/1" ? "evens" : f);
const D = (f) => Odds.parse(f);
if (Math.abs(D("5/1") - 6) > 1e-12 || Math.abs(Odds.placeOdds(6, 1 / 5) - 2) > 1e-12) throw new Error("odds-utils.js changed: check build-betting-tables.js");

/* ---------------------------------------------------------------- each-way */
function eachWay() {
  const prices = ["2/1", "5/2", "3/1", "4/1", "5/1", "6/1", "8/1", "10/1", "12/1", "16/1", "20/1", "33/1"];
  const rows = prices.map((f) => {
    const d = D(f), p4 = Odds.placeOdds(d, 1 / 4), p5 = Odds.placeOdds(d, 1 / 5);
    return [`<a href="/odds-converter/${f.replace("/", "-")}/">${f}</a>`, money(10 * d + 10 * p4), money(10 * p4), money(10 * d + 10 * p5), money(10 * p5)];
  });
  const x = D("8/1"), xp = Odds.placeOdds(x, 1 / 5);
  return `      <h2 class="tool-section-title">£10 each-way returns at common prices</h2>
${site.table(["Price", "Wins (¼ odds)", "Places only (¼)", "Wins (⅕ odds)", "Places only (⅕)"], rows, 520)}      <p class="tool-hint" style="margin-top:12px;">A £10 each-way bet costs £20: £10 to win and £10 to place. Returns include stakes. If the selection wins, both parts pay; if it only places, the win part is lost and the place part pays at the fraction of the odds in the place terms. For example, at 8/1 with ⅕ terms the place part pays at ${frac(xp)}: £10 × ${dec2(xp)} = ${money(10 * xp)}.</p>
`;
}

/* ------------------------------------------------------------- accumulator */
function accumulator() {
  const prices = ["1/2", "4/6", "4/5", "1/1", "6/4", "2/1", "5/2", "3/1"];
  const rows = prices.map((f) => {
    const d = D(f);
    return [`<a href="/odds-converter/${f === "1/1" ? "evens" : f.replace("/", "-")}/">${name(f)}</a> (${dec2(d)})`].concat([2, 3, 4].map((n) => { const c = Math.pow(d, n); return `${dec2(c)} · ${money(10 * c)}`; }));
  });
  const e = Math.pow(2, 3);
  return `      <h2 class="tool-section-title">Doubles, trebles and four-folds at common prices</h2>
${site.table(["Each leg at", "Double: odds · £10 returns", "Treble: odds · £10 returns", "Four-fold: odds · £10 returns"], rows, 520)}      <p class="tool-hint" style="margin-top:12px;">Decimal odds, with every leg at the same price; the combined odds are the legs' decimal odds multiplied together. Three evens shots make a treble at ${dec2(e)} (${frac(e)}): 2.00 × 2.00 × 2.00 = ${dec2(e)}, so £10 returns ${money(10 * e)}. For legs at different prices, or a void leg, use the calculator above.</p>
`;
}

/* --------------------------------------------------------------------- lay */
function lay() {
  const odds = [1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
  const c = 0.02, back = 10;
  const rows = odds.map((o) => {
    const layStake = (back * o) / (o - c), liability = layStake * (o - 1);
    const result = layStake * (1 - c) - back;
    return [dec2(o), money(layStake), money(liability), (result < 0 ? "−" : "") + money(Math.abs(result))];
  });
  const liab = [2, 3, 5, 10].map((o) => `${money(10 * (o - 1))} at ${dec2(o)}`).join(", ");
  return `      <h2 class="tool-section-title">Lay stake and liability on a £10 qualifying bet</h2>
${site.table(["Back and lay odds", "Lay stake", "Liability", "Result either way"], rows, 440)}      <p class="tool-hint" style="margin-top:12px;">A £10 back bet laid at the same odds on an exchange charging 2% commission on winnings. Lay stake = back stake × back odds ÷ (lay odds − commission); liability = lay stake × (lay odds − 1), the most you can lose on the exchange. The result is the same whichever way it goes: the small qualifying loss is the commission. Liability on a plain £10 lay stake is ${liab}.</p>
`;
}

/* ---------------------------------------------------------------- dutching */
function dutching() {
  const sets = [["1/1", "6/4", "2/1"], ["2/1", "3/1"], ["3/1", "4/1"], ["5/2", "7/2"], ["4/1", "5/1"], ["2/1", "3/1", "5/1"], ["3/1", "4/1", "6/1"], ["4/1", "5/1", "6/1"], ["5/1", "6/1", "8/1"]];
  const total = 100;
  const rows = sets.map((set) => {
    const ds = set.map(D), inv = ds.reduce((a, d) => a + 1 / d, 0);
    const stakes = ds.map((d) => (total / d) / inv), ret = total / inv;
    const profit = ret - total;
    return [set.map(name).join(", "), stakes.map(money).join(" · "), money(ret), (profit < 0 ? "−" : "") + money(Math.abs(profit)), dec2(ret / total)];
  });
  return `      <h2 class="tool-section-title">£100 dutched across common prices</h2>
${site.table(["Selections", "Stakes", "Return if one wins", "Profit if one wins", "Combined decimal odds"], rows, 560)}      <p class="tool-hint" style="margin-top:12px;">Each stake is the total × (1 ÷ its decimal odds) ÷ the sum of 1 ÷ odds across the selections, so every winner returns the same. If none of them wins, the whole £100 is lost. The combined odds are what the group is worth as a single bet. When the selections' implied chances add up to more than 100%, as with evens, 6/4 and 2/1 (50% + 40% + 33.3%), even a winner returns less than the total staked.</p>
`;
}

const PAGES = { "each-way": eachWay, accumulator, lay, dutching };
const START = "    <!-- reference tables: generated by tools/build-betting-tables.js -->\n";
const END = "    <!-- end reference tables -->\n";
/* the FAQ part, a <section> once tools/lib/landmarks.js has run */
const FAQ = /    <(main|section) class="tool">\n      <h2 class="tool-section-title">Frequently asked questions<\/h2>/;

Object.keys(PAGES).forEach((slug) => {
  const file = path.join(site.ROOT, slug, "index.html");
  let s = fs.readFileSync(file, "utf8");
  if (s.includes(START)) s = s.slice(0, s.indexOf(START)) + s.slice(s.indexOf(END) + END.length).replace(/^\n/, "");
  const at = s.search(FAQ);
  if (at < 0) throw new Error(slug + ": FAQ section not found");
  s = s.slice(0, at) + START + `    <main class="tool">\n${PAGES[slug]()}    </main>\n` + END + "\n" + s.slice(at);
  fs.writeFileSync(file, s);
});
console.log(`added reference tables to ${Object.keys(PAGES).length} betting calculators`);
