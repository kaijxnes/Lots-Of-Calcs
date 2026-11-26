/* Mileage allowance calculator (/mileage-allowance-calculator/): HMRC's
   approved amount for business miles in your own vehicle, what your
   employer's mileage allowance leaves you to claim tax relief on (or what
   is taxable if it pays more), from the rates in data/uk/mileage.json
   (passed in as `R`). The page is built from these same functions
   (tools/build-mileage-pages.js). */
var Mileage = (function () {
  "use strict";
  /* pounds for `miles` business miles in a tax year */
  function approved(R, year, vehicle, miles) {
    var y = R.years[year], m = Math.max(0, miles);
    if (vehicle === "car") return (Math.min(m, R.firstMiles) * y.car[0] + Math.max(0, m - R.firstMiles) * y.car[1]) / 100;
    return m * y[vehicle] / 100;
  }
  /* National Insurance has one rate for every mile */
  function niFree(R, year, vehicle, miles) {
    var y = R.years[year];
    return Math.max(0, miles) * (vehicle === "car" ? y.niCar : y[vehicle]) / 100;
  }
  /* paidPence: what the employer pays a mile; taxRate: your top rate of income tax, % */
  function calc(R, year, vehicle, miles, paidPence, taxRate) {
    var a = approved(R, year, vehicle, miles), paid = Math.max(0, miles) * Math.max(0, paidPence) / 100;
    var shortfall = Math.max(0, a - paid), excess = Math.max(0, paid - a);
    return {
      approved: a, paid: paid, shortfall: shortfall, relief: Math.round(shortfall * taxRate) / 100,
      excess: excess, niExcess: Math.max(0, paid - niFree(R, year, vehicle, miles))
    };
  }
  return { approved: approved, niFree: niFree, calc: calc };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = Mileage;
} else {
  (function () {
    var box = document.getElementById("mi-tool");
    if (!box) return;
    var R = JSON.parse(box.getAttribute("data-rules"));
    var $ = function (id) { return document.getElementById(id); };
    var num = function (id) { var v = Number(String($(id).value).replace(/[\s,£p]/g, "")); return isFinite(v) ? v : NaN; };
    var money = function (v) { return "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
    function run() {
      var err = $("mi-error"), year = $("mi-year").value, veh = $("mi-vehicle").value, miles = num("mi-miles"), paid = num("mi-paid"), rate = Number($("mi-rate").value);
      var bad = !(miles >= 0) ? "Enter your business miles for the year." : !(paid >= 0) ? "Enter what your employer pays a mile (0 if nothing)." : "";
      err.textContent = bad; err.style.display = bad ? "block" : "none";
      if (bad) return;
      var r = Mileage.calc(R, year, veh, miles, paid, rate);
      $("mi-approved").textContent = money(r.approved);
      $("mi-paid-out").textContent = money(r.paid);
      if (r.excess > 0.004) {
        $("mi-hero").textContent = money(r.excess);
        $("mi-label").textContent = "of your mileage allowance is taxable: it's more than HMRC's approved amount";
        $("mi-shortfall").textContent = "£0.00";
        $("mi-relief").textContent = "£0.00";
      } else {
        $("mi-hero").textContent = money(r.relief);
        $("mi-label").textContent = r.shortfall > 0.004 ? "tax back if you claim Mileage Allowance Relief on " + money(r.shortfall) : "nothing to claim: your employer pays the approved amount";
        $("mi-shortfall").textContent = money(r.shortfall);
        $("mi-relief").textContent = money(r.relief);
      }
      $("mi-note").textContent = r.excess > 0.004 && r.niExcess < 0.005 ? "National Insurance uses one rate for every mile, so none is due on it." : r.niExcess > 0.004 ? money(r.niExcess) + " of it also counts for National Insurance." : "";
    }
    ["mi-miles", "mi-paid"].forEach(function (id) { $(id).addEventListener("input", run); });
    ["mi-year", "mi-vehicle", "mi-rate"].forEach(function (id) { $(id).addEventListener("change", run); });
    run();
  })();
}
