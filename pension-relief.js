/* Pension tax relief calculator (/pension-tax-relief-calculator/): the
   relief on a personal or workplace pension contribution, using the UK and
   Scottish tax files through tax-engine.js. The page is built from the same
   function (tools/build-pension-relief-pages.js).

   Relief at source: the provider adds the basic rate; anything you'd have
   saved above that (the tax on the slice of income the contribution covers)
   is claimed back through Self Assessment, as GOV.UK describes. Net pay: the
   contribution comes off pay before tax, so the relief is the tax that slice
   would have cost. Relief only goes on contributions up to 100% of earnings,
   or £3,600 gross if that's more. */
var PensionRelief = (function () {
  "use strict";
  function relief(TE, chain, R, income, paid, type) {
    var tax = function (g) { var r = TE.compute(chain, Math.max(0, g), {}); return r.values["gb-income-tax"] || 0; };
    /* the most that gets relief: 100% of earnings, but never less than £3,600 gross */
    var cap = Math.max(income * R.earningsLimitPct / 100, R.noEarningsGross);
    var o = { type: type, paid: paid };
    if (type === "ras") {
      var gross = paid / (1 - R.basicRelief / 100);
      var relievable = Math.min(gross, cap);
      o.gross = gross;
      o.topUp = relievable * R.basicRelief / 100;
      o.overCap = gross > relievable + 0.005;
      if (o.overCap) o.gross = paid + o.topUp;
      var full = tax(income) - tax(income - relievable);
      o.claim = Math.max(0, full - o.topUp);
      o.relief = o.topUp + o.claim;
      o.cost = paid - o.claim;
    } else {
      var g = Math.min(paid, income);
      o.gross = paid;
      o.topUp = 0; o.claim = 0;
      o.overCap = paid > income;
      o.relief = tax(income) - tax(income - g);
      o.cost = paid - o.relief;
    }
    o.rate = o.gross > 0 ? o.relief / o.gross * 100 : 0;
    return o;
  }
  return { relief: relief };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = PensionRelief;
} else {
  (function () {
    var box = document.getElementById("pt-tool");
    if (!box || typeof TaxEngine === "undefined") return;
    var $ = function (id) { return document.getElementById(id); };
    var R = JSON.parse(box.getAttribute("data-rules"));
    var chains = {}, busy = 0;
    var m = function (v, whole) { return TaxEngine.money(v, "GBP", whole); };
    var num = function (id) { var x = parseFloat($(id).value); return isFinite(x) && x >= 0 ? x : 0; };
    function calc() {
      var where = $("pt-where").value, chain = chains[where];
      if (!chain) {
        var mine = ++busy;
        TaxEngine.load(where).then(function (c) { chains[where] = c; if (mine === busy) calc(); });
        return;
      }
      var type = $("pt-type").value;
      $("pt-paid-label").textContent = type === "ras" ? "What you pay in a year (before the top-up)" : "Contribution taken from your pay a year";
      var r = PensionRelief.relief(TaxEngine, chain, R, num("pt-income"), num("pt-paid"), type);
      $("pt-relief").textContent = m(r.relief);
      $("pt-gross").textContent = m(r.gross);
      $("pt-topup-row").style.display = type === "ras" ? "" : "none";
      $("pt-claim-row").style.display = type === "ras" ? "" : "none";
      $("pt-topup").textContent = m(r.topUp);
      $("pt-claim").textContent = m(r.claim);
      $("pt-cost").textContent = m(r.cost);
      $("pt-rate").textContent = Math.round(r.rate * 10) / 10 + "%";
      var notes = [];
      if (r.overCap) notes.push("Relief only goes on contributions up to your earnings for the year (or £" + R.noEarningsGross.toLocaleString("en-GB") + " gross if that is more), so part of this gets none.");
      if (r.gross > R.annualAllowance) notes.push("That's over the £" + R.annualAllowance.toLocaleString("en-GB") + " annual allowance (which counts your employer's contributions too): you may owe tax on the excess unless you can carry forward unused allowance.");
      if (type === "ras" && r.claim > 0) notes.push("Claim the " + m(r.claim) + " through your Self Assessment tax return, or ask HMRC to adjust your tax code.");
      $("pt-note").textContent = notes.join(" ");
    }
    ["pt-income", "pt-paid"].forEach(function (id) { $(id).addEventListener("input", calc); });
    ["pt-where", "pt-type"].forEach(function (id) { $(id).addEventListener("change", calc); });
    calc();
  })();
}
