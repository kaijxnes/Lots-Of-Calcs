/* Savings interest tax calculator (/savings-tax-calculator/): the UK tax on
   savings interest after the Personal Allowance, the starting rate for
   savings and the Personal Savings Allowance, from GOV.UK's rules in
   data/uk/savings-tax.json and the bands in the UK tax file (passed in
   together as `R`). Savings interest sits on top of other income, so it
   uses up whatever is left of each band. Scottish taxpayers pay the same
   tax on savings interest as the rest of the UK. The page is built from
   these same functions (tools/build-savings-tax-pages.js). */
var SavingsTax = (function () {
  "use strict";
  /* other: wages, pension and other non-savings income; interest: savings interest; year: key of R.years */
  function calc(R, other, interest, year) {
    other = Math.max(0, other); interest = Math.max(0, interest);
    var rates = R.years[year].rates, total = other + interest;
    var pa = Math.max(0, R.personalAllowance - Math.max(0, total - R.taperFrom) / 2);
    var paOnSavings = Math.min(interest, Math.max(0, pa - other));
    var otherTaxable = Math.max(0, other - pa), savingsTaxable = interest - paOnSavings;
    var taxable = otherTaxable + savingsTaxable;
    var band = taxable > R.higherLimit ? "additional" : taxable > R.basicBand ? "higher" : "basic";
    var starting = Math.max(0, R.startingRate - otherTaxable), psa = R.psa[band];
    var zeroStart = Math.min(savingsTaxable, starting), zeroPsa = Math.min(savingsTaxable - zeroStart, psa);
    /* the rest is taxed at the rate of the band each pound falls in, stacked above other income */
    var from = otherTaxable + zeroStart + zeroPsa, to = otherTaxable + savingsTaxable, tax = 0;
    var edges = [[0, rates[0]], [R.basicBand, rates[1]], [R.higherLimit, rates[2]]];
    for (var i = 0; i < edges.length; i++) {
      var lo = Math.max(from, edges[i][0]), hi = Math.min(to, i + 1 < edges.length ? edges[i + 1][0] : Infinity);
      if (hi > lo) tax += (hi - lo) * edges[i][1] / 100;
    }
    tax = Math.round(tax * 100) / 100;
    return {
      pa: paOnSavings, starting: zeroStart, psa: zeroPsa, psaAllowance: psa, band: band,
      taxed: Math.max(0, savingsTaxable - zeroStart - zeroPsa), tax: tax, kept: interest - tax,
      rate: interest > 0 ? tax / interest : 0
    };
  }
  /* a country's tax on an amount of interest, for the flat and scale systems */
  function abroad(c, interest) {
    if (c.kind === "flat") return Math.max(0, interest - (c.allowanceAmount || 0)) * c.flat / 100;
    if (c.kind === "scale") {
      var t = 0;
      for (var i = 0; i < c.scale.length; i++) {
        var lo = c.scale[i][0], hi = i + 1 < c.scale.length ? c.scale[i + 1][0] : Infinity;
        if (interest > lo) t += (Math.min(interest, hi) - lo) * c.scale[i][1] / 100;
      }
      return t;
    }
    return null;
  }
  return { calc: calc, abroad: abroad };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = SavingsTax;
} else {
  (function () {
    var box = document.getElementById("st-tool");
    if (!box) return;
    var R = JSON.parse(box.getAttribute("data-rules"));
    var $ = function (id) { return document.getElementById(id); };
    var num = function (id) { var v = Number(String($(id).value).replace(/[\s,£]/g, "")); return isFinite(v) ? v : NaN; };
    var money = function (v) { return "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
    var BANDS = { basic: "basic rate", higher: "higher rate", additional: "additional rate" };
    function run() {
      var err = $("st-error"), other = num("st-other"), interest = num("st-interest");
      var bad = !(other >= 0) ? "Enter your other income (0 if none)." : !(interest >= 0) ? "Enter your savings interest for the tax year." : "";
      err.textContent = bad; err.style.display = bad ? "block" : "none";
      if (bad) { ["st-tax", "st-pa", "st-start", "st-psa", "st-taxed", "st-kept"].forEach(function (id) { $(id).textContent = "—"; }); return; }
      var r = SavingsTax.calc(R, other, interest, $("st-year").value);
      $("st-tax").textContent = money(r.tax);
      $("st-label").textContent = r.tax > 0 ? "tax on " + money(interest) + " of interest (" + (Math.round(r.rate * 1000) / 10).toLocaleString("en-GB") + "%)" : "no tax on " + money(interest) + " of interest";
      $("st-pa").textContent = money(r.pa);
      $("st-start").textContent = money(r.starting);
      $("st-psa").textContent = money(r.psa) + " of £" + r.psaAllowance.toLocaleString("en-GB") + " (" + BANDS[r.band] + ")";
      $("st-taxed").textContent = money(r.taxed);
      $("st-kept").textContent = money(r.kept);
    }
    ["st-other", "st-interest"].forEach(function (id) { $(id).addEventListener("input", run); });
    $("st-year").addEventListener("change", run);
    run();
  })();
}
