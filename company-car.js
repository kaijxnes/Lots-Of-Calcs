/* Company car tax calculator (/company-car-tax-calculator/): the taxable
   benefit of a company car and the tax on it, following HMRC's steps in
   480 Chapter 12 with the appropriate percentages from 480 Appendix 2
   (data/uk/company-car.json, passed in as `R`):
     list price + accessories − capital contributions (up to £5,000)
     × appropriate percentage (by CO2, and electric range for 1–50g/km;
       + 4% for diesels that don't meet Euro 6d, capped at the maximum)
     − the share of the year the car was unavailable
     − payments for private use
   then × the employee's tax rate, and Class 1A NI for the employer. The
   pages are built from these same functions
   (tools/build-company-car-pages.js). */
var CompanyCar = (function () {
  "use strict";
  var p2 = function (v) { return Math.round(v * 100) / 100; };
  /* fuel: "electric" | "petrol" (including hybrids) | "diesel" | "dieselRDE2" */
  function pct(R, year, fuel, co2, range) {
    var rows = R.tables[year]; if (!rows) return null;
    var c = fuel === "electric" ? 0 : Math.max(0, Math.floor(co2 || 0));
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i], hi = r.co2[1] === null ? Infinity : r.co2[1];
      if (c < r.co2[0] || c > hi) continue;
      if (r.range) { var rh = r.range[1] === null ? Infinity : r.range[1], m = Math.max(0, Math.floor(range || 0)); if (m < r.range[0] || m > rh) continue; }
      var p = r.pct;
      if (fuel === "diesel") p = Math.min(R.maxPct, p + R.dieselSupplement);
      return p;
    }
    return null;
  }
  function calc(R, o) {
    var p = pct(R, o.year, o.fuel, o.co2, o.range);
    if (p === null) return null;
    var price = Math.max(0, o.listPrice || 0) + Math.max(0, o.accessories || 0);
    var capital = Math.min(R.capitalMax, Math.max(0, o.capital || 0), price);
    var base = price - capital, step5 = p2(base * p / 100);
    var days = o.daysInYear || 365, unavailable = Math.min(days, Math.max(0, o.unavailable || 0));
    var step6 = p2(step5 * (days - unavailable) / days);
    var benefit = Math.max(0, p2(step6 - Math.max(0, o.privateUse || 0)));
    var tax = p2(benefit * (o.taxRate || 0) / 100);
    return { pct: p, price: price, capital: capital, base: base, step5: step5, step6: step6, benefit: benefit, tax: tax, monthly: p2(tax / 12), class1a: p2(benefit * (o.class1aRate || 0) / 100) };
  }
  return { pct: pct, calc: calc };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = CompanyCar;
} else {
  (function () {
    var box = document.getElementById("cc-tool");
    if (!box) return;
    var R = JSON.parse(box.getAttribute("data-rules"));
    var $ = function (id) { return document.getElementById(id); };
    var num = function (id) { var s = String($(id).value).replace(/[\s,£]/g, ""); return s === "" ? 0 : Number(s); };
    var money = function (v) { return "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
    var OUT = ["cc-tax", "cc-pct", "cc-benefit", "cc-month", "cc-1a"];
    function run() {
      var err = $("cc-error"), fuel = $("cc-fuel").value, co2 = num("cc-co2");
      $("cc-co2-row").style.display = fuel === "electric" ? "none" : "";
      $("cc-range-row").style.display = fuel === "petrol" && co2 >= 1 && co2 <= 50 ? "" : "none";
      var ids = ["cc-price", "cc-acc", "cc-capital", "cc-days", "cc-private", "cc-co2", "cc-range"];
      var bad = !(num("cc-price") > 0) ? "Enter the car's list price." : ids.some(function (id) { var v = num(id); return !(v >= 0) || v > 1e8; }) ? "Enter amounts of 0 or more." :
        num("cc-days") > 366 ? "A year has 365 or 366 days." : fuel !== "electric" && !(co2 >= 1) ? "Enter the car's CO2 figure in g/km (from the V5C registration certificate)." : "";
      err.textContent = bad; err.style.display = bad ? "block" : "none";
      if (bad) { OUT.forEach(function (id) { $(id).textContent = "—"; }); $("cc-label").textContent = "company car tax a year"; return; }
      var r = CompanyCar.calc(R, {
        year: $("cc-year").value, fuel: fuel, co2: co2, range: num("cc-range"), listPrice: num("cc-price"), accessories: num("cc-acc"),
        capital: num("cc-capital"), unavailable: num("cc-days"), privateUse: num("cc-private"), taxRate: +$("cc-rate").value, class1aRate: R.class1aRate
      });
      $("cc-tax").textContent = money(r.tax);
      $("cc-label").textContent = "company car tax a year at " + $("cc-rate").value + "% (" + $("cc-year").value + ")";
      $("cc-pct").textContent = r.pct + "%";
      $("cc-benefit").textContent = money(r.benefit);
      $("cc-month").textContent = money(r.monthly);
      $("cc-1a").textContent = money(r.class1a);
    }
    ["cc-price", "cc-acc", "cc-capital", "cc-days", "cc-private", "cc-co2", "cc-range"].forEach(function (id) { $(id).addEventListener("input", run); });
    ["cc-year", "cc-fuel", "cc-rate"].forEach(function (id) { $(id).addEventListener("change", run); });
    run();
  })();
}
