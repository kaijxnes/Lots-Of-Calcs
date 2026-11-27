/* Statutory Adoption Pay calculator (/adoption-pay-calculator/): up to 39
   weeks of pay, 90% of average weekly earnings for the first 6 weeks, then
   the weekly rate or 90% (whichever is lower) for the next 33. You need
   26 weeks' continuous employment and average earnings of at least the
   limit. From GOV.UK's rules in data/uk/adoption-pay.json (`R`). The page
   is built from these same functions (tools/build-adoption-pay-pages.js). */
var AdoptionPay = (function () {
  "use strict";
  var p2 = function (v) { return Math.round(v * 100) / 100; };
  /* o: awe (average weekly earnings before tax), weeks (of pay taken, up to 39), service (26 weeks' employment, default true) */
  function calc(R, o) {
    var awe = Math.max(0, o.awe || 0), weeks = Math.max(0, Math.min(R.payWeeks, Math.round(o.weeks == null ? R.payWeeks : o.weeks)));
    var ok = o.service !== false && awe >= R.minAverageWeekly;
    var first = p2(awe * R.earningsPct / 100), rest = p2(Math.min(R.weeklyRate, first)), hi = Math.min(weeks, R.higherWeeks);
    var total = ok ? p2(first * hi + rest * (weeks - hi)) : 0;
    return { eligible: ok, lowPay: awe < R.minAverageWeekly, first: ok ? first : 0, rest: ok ? rest : 0, weeks: weeks, total: total, unpaid: R.leaveWeeks - R.payWeeks, capped: first > R.weeklyRate };
  }
  return { calc: calc };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = AdoptionPay;
} else {
  (function () {
    var box = document.getElementById("ap-tool");
    if (!box) return;
    var R = JSON.parse(box.getAttribute("data-rules"));
    var $ = function (id) { return document.getElementById(id); };
    var num = function (id) { var s = String($(id).value).replace(/[\s,£]/g, ""); return s === "" ? 0 : Number(s); };
    var money = function (v) { return "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
    var OUT = ["ap-total", "ap-first", "ap-rest", "ap-unpaid"];
    function run() {
      var err = $("ap-error"), pay = num("ap-pay"), per = Number($("ap-per").value), weeks = num("ap-weeks");
      var bad = !(pay >= 0) || pay > 1e8 ? "Enter your pay before tax." : !(weeks >= 0 && weeks <= R.payWeeks) ? "Enter between 0 and " + R.payWeeks + " weeks." : "";
      err.textContent = bad; err.style.display = bad ? "block" : "none";
      if (bad) { OUT.forEach(function (id) { $(id).textContent = "—"; }); $("ap-note").textContent = ""; return; }
      var awe = pay * per / 52, r = AdoptionPay.calc(R, { awe: awe, weeks: weeks, service: $("ap-service").checked });
      $("ap-total").textContent = money(r.total);
      $("ap-first").textContent = money(r.first) + " a week";
      $("ap-rest").textContent = money(r.rest) + " a week";
      $("ap-unpaid").textContent = r.unpaid + " weeks";
      $("ap-note").textContent = !r.eligible ? (r.lowPay ? "Average earnings of " + money(awe) + " a week are under £" + R.minAverageWeekly + ", so you can't get Statutory Adoption Pay. Your employer must give you form SAP1 explaining why." : "You need 26 weeks' continuous employment with your employer by the week you're matched with a child. Your employer must give you form SAP1 explaining why you can't get it.") :
        r.capped ? "After 6 weeks you get the £" + R.weeklyRate.toFixed(2) + " weekly rate, as 90% of your earnings is more. Tax and National Insurance are taken off." : "You get 90% of your earnings for all " + r.weeks + " weeks, as it's less than the £" + R.weeklyRate.toFixed(2) + " weekly rate. Tax and National Insurance are taken off.";
    }
    ["ap-pay", "ap-weeks"].forEach(function (id) { $(id).addEventListener("input", run); });
    ["ap-per", "ap-service"].forEach(function (id) { $(id).addEventListener("change", run); });
    run();
  })();
}
