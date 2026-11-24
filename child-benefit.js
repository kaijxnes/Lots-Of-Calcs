/* Child Benefit and the High Income Child Benefit Charge. The rates and the
   rule come from GOV.UK (data/uk/child-benefit.json, passed in as `R`); the
   page is built from these same functions (tools/build-child-benefit-pages.js). */
var ChildBenefit = (function () {
  "use strict";
  function benefit(R, children) {
    if (children <= 0) return 0;
    return (R.rates.eldest + (children - 1) * R.rates.additional) * R.rates.weeksInYear;
  }
  /* 1% of the Child Benefit for every £200 of adjusted net income over the
     threshold, all of it from the top of the band */
  function charge(R, income, children) {
    var cb = benefit(R, children), c = R.charge;
    var pct = income > c.threshold ? Math.min(100, Math.floor((income - c.threshold) / c.step)) : 0;
    var amount = Math.floor(cb * pct / 100);
    return { benefit: cb, pct: pct, charge: amount, kept: cb - amount, toThreshold: Math.max(0, income - c.threshold) };
  }
  return { benefit: benefit, charge: charge };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = ChildBenefit;
} else {
  (function () {
    var tool = document.getElementById("cb-tool");
    if (!tool) return;
    var R = JSON.parse(tool.getAttribute("data-rules"));
    var $ = function (id) { return document.getElementById(id); };
    var num = function (id) { var v = parseFloat($(id).value); return isFinite(v) && v >= 0 ? v : 0; };
    var money = function (v, dp) { return "£" + v.toLocaleString("en-GB", { minimumFractionDigits: dp || 0, maximumFractionDigits: dp || 0 }); };
    function calc() {
      var income = Math.max(0, num("cb-income") - num("cb-relief"));
      var kids = Math.round(num("cb-children"));
      var partner = num("cb-partner");
      var r = ChildBenefit.charge(R, income, kids);
      var payer = partner > income ? "partner" : "you";
      var rp = payer === "partner" ? ChildBenefit.charge(R, partner, kids) : r;
      $("cb-charge").textContent = money(rp.charge);
      $("cb-label").textContent = rp.charge ? (payer === "you" ? "charge you pay back a year" : "charge your partner pays a year (the higher income)") : "no charge to pay";
      $("cb-benefit").textContent = money(r.benefit, 2);
      $("cb-ani").textContent = money(payer === "you" ? income : partner);
      $("cb-pct").textContent = rp.pct + "%";
      $("cb-kept").textContent = money(r.benefit - rp.charge);
      $("cb-avoid").textContent = rp.toThreshold ? money(rp.toThreshold) + " more in pension contributions or Gift Aid (gross) from " + (payer === "you" ? "you" : "your partner") + " would bring " + (payer === "you" ? "your" : "their") + " income down to £" + R.charge.threshold.toLocaleString("en-GB") + " and clear the charge." : "";
    }
    ["cb-income", "cb-relief", "cb-children", "cb-partner"].forEach(function (id) { $(id).addEventListener("input", calc); });
    calc();
  })();
}
