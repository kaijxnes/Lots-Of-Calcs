/* Premium Bonds calculator (/premium-bonds-calculator/): what a holding
   of Premium Bonds might win in a year. The average is the prize fund rate,
   but a few huge prizes pull it up, so most holders win less: the typical
   (median) result comes from simulating many years of draws with NS&I's
   latest mix of prizes (data/uk/premium-bonds.json, passed in as `R`).
   Each £1 Bond has a 1 in R.odds chance a month, so the number of prizes in
   a year is Poisson with mean holding × 12 / odds, and each prize is drawn
   from the published counts of each value. A fixed seed makes the same
   inputs give the same answer, so the built pages and the calculator agree.
   The pages are built from these same functions
   (tools/build-premium-bonds-pages.js). */
var PremiumBonds = (function () {
  "use strict";
  function rng(seed) {
    var a = seed >>> 0;
    return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  /* the average a year, as a rate: the month's prize money over the eligible £1 Bonds */
  function rate(R) { return R.totalValue * 12 / (R.totalPrizes * R.odds); }
  function simulate(R, holding, sims, seed) {
    var h = Math.max(0, Math.min(R.max, Math.floor(holding))), lambda = h * 12 / R.odds, rand = rng(seed || 20261127), n = sims || 20000;
    var cum = [], acc = 0;
    R.prizes.slice().sort(function (a, b) { return a.value - b.value; }).forEach(function (p) { acc += p.count / R.totalPrizes; cum.push([acc, p.value]); });
    var out = new Array(n), L = Math.exp(-lambda);
    for (var i = 0; i < n; i++) {
      var k = 0, prod = rand();
      while (prod > L) { k++; prod *= rand(); }
      var won = 0;
      for (var j = 0; j < k; j++) { var u = rand(), c = 0; while (c < cum.length - 1 && u > cum[c][0]) c++; won += cum[c][1]; }
      out[i] = won;
    }
    out.sort(function (a, b) { return a - b; });
    var q = function (p) { return out[Math.min(n - 1, Math.floor(p * n))]; }, none = 0;
    for (var z = 0; z < n && out[z] === 0; z++) none++;
    return { holding: h, prizes: lambda, average: h * rate(R), median: q(0.5), low: q(0.1), high: q(0.9), none: none / n, anyMonth: 1 - Math.pow(1 - 1 / R.odds, h) };
  }
  return { simulate: simulate, rate: rate };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = PremiumBonds;
} else {
  (function () {
    var box = document.getElementById("pb-tool");
    if (!box) return;
    var R = JSON.parse(box.getAttribute("data-rules"));
    var $ = function (id) { return document.getElementById(id); };
    var money = function (v) { return "£" + Math.round(v).toLocaleString("en-GB"); };
    var pct = function (v, dp) { return (Math.round(v * Math.pow(10, dp || 1) * 100) / Math.pow(10, dp || 1)).toLocaleString("en-GB") + "%"; };
    var OUT = ["pb-median", "pb-average", "pb-range", "pb-prizes", "pb-none", "pb-month"];
    var timer = null;
    function run() {
      var err = $("pb-error"), h = Number(String($("pb-holding").value).replace(/[\s,£]/g, ""));
      var bad = !(h >= R.min) ? "Enter a holding of at least £" + R.min + "." : h > R.max ? "You can hold up to £" + R.max.toLocaleString("en-GB") + " of Premium Bonds." : "";
      err.textContent = bad; err.style.display = bad ? "block" : "none";
      if (bad) { OUT.forEach(function (id) { $(id).textContent = "—"; }); $("pb-label").textContent = "typical winnings a year"; return; }
      var r = PremiumBonds.simulate(R, h);
      $("pb-median").textContent = money(r.median);
      $("pb-label").textContent = "typical winnings a year (" + pct(r.median / r.holding, 2) + "): half of holders with " + money(r.holding) + " win less";
      $("pb-average").textContent = money(r.average) + " (" + pct(PremiumBonds.rate(R), 2) + ")";
      $("pb-range").textContent = money(r.low) + " to " + money(r.high);
      $("pb-prizes").textContent = (Math.round(r.prizes * 10) / 10).toLocaleString("en-GB");
      $("pb-none").textContent = pct(r.none);
      $("pb-month").textContent = pct(r.anyMonth);
    }
    $("pb-holding").addEventListener("input", function () { clearTimeout(timer); timer = setTimeout(run, 150); });
    run();
  })();
}
