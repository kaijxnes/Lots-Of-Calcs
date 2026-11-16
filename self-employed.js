/* Self-employed tax calculator (/self-employed-tax-calculator/): income tax,
   Class 4 National Insurance and any student loan on a year's profit, the
   Self Assessment bill, and payments on account.

   The rules are the gb-se and gb-sct-se files in data/tax/ (children of the
   UK and Scotland files that swap employee NI for Class 4), evaluated by
   tax-engine.js — the same data the salary calculators use and the monthly
   rates check covers. Payments on account follow GOV.UK: each is half of
   last year's tax and Class 4, due 31 January and 31 July, unless the bill
   was under £1,000. */
var SelfEmployed = (function () {
  "use strict";
  var POA_MIN = 1000;
  /* r: a TaxEngine.compute result */
  function bill(r) {
    var v = r.values;
    var taxNi = (v["gb-income-tax"] || 0) + (v["gb-ni"] || 0);
    var loans = (v["gb-student-loan"] || 0) + (v["gb-postgrad-loan"] || 0);
    var poa = taxNi >= POA_MIN ? taxNi / 2 : 0;
    return { taxNi: taxNi, loans: loans, total: taxNi + loans, poa: poa, firstJanuary: taxNi + loans + poa };
  }
  return { bill: bill, POA_MIN: POA_MIN };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = SelfEmployed;
} else {
  (function () {
    var box = document.getElementById("se-tool");
    if (!box || typeof TaxEngine === "undefined") return;
    var $ = function (id) { return document.getElementById(id); };
    var chains = {};
    function money(v, whole) { return TaxEngine.money(v, "GBP", whole); }

    function calc() {
      var err = $("se-error"), id = $("se-region").value;
      var income = Number($("se-income").value), expenses = Number($("se-expenses").value) || 0;
      if (!(income >= 0) || !(expenses >= 0) || $("se-income").value === "") { err.textContent = "Enter your income and expenses for the year."; err.style.display = "block"; return; }
      var profit = Math.max(0, income - expenses);
      if (profit > 100000000) { err.textContent = "That's beyond what this is useful for."; err.style.display = "block"; return; }
      err.style.display = "none";
      var go = function (chain) {
        var r = TaxEngine.compute(chain, profit, { studentLoan: $("se-loan").value, pensionPct: Number($("se-pension").value) || 0 });
        var b = SelfEmployed.bill(r);
        $("se-net").textContent = money(r.net);
        $("se-month").textContent = money(r.net / 12);
        $("se-profit").textContent = money(profit, true);
        $("se-tax").textContent = money(r.values["gb-income-tax"] || 0);
        $("se-ni").textContent = money(r.values["gb-ni"] || 0);
        $("se-loans").textContent = money(b.loans);
        $("se-pension-out").textContent = money(r.values["gb-pension"] || 0);
        $("se-bill").textContent = money(b.total);
        $("se-poa").textContent = b.poa ? money(b.poa) + " each, 31 January and 31 July" : "None — the bill is under £1,000";
        $("se-first").textContent = money(b.firstJanuary);
      };
      if (chains[id]) return go(chains[id]);
      TaxEngine.load(id).then(function (c) { chains[id] = c; go(c); }).catch(function () {
        err.textContent = "The tax figures couldn't be loaded — check your connection and try again."; err.style.display = "block";
      });
    }
    ["se-income", "se-expenses", "se-pension"].forEach(function (id) { $(id).addEventListener("input", calc); });
    ["se-region", "se-loan"].forEach(function (id) { $(id).addEventListener("change", calc); });
    calc();
  })();
}
