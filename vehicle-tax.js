/* Car tax (VED) calculator (/car-tax-calculator/): the vehicle tax on a car
   from GOV.UK's rate tables (data/uk/vehicle-tax.json, passed in as `R`):
   - registered from 1 April 2017: a first payment by CO2 (higher for
     diesels that don't meet RDE2), then the standard rate, plus the extra
     for a list price over £40,000 (£50,000 electric) in years 2 to 6 — not
     for a zero emission car registered before 1 April 2025;
   - registered 1 March 2001 to 31 March 2017: bands A to M by CO2;
   - registered before 1 March 2001: by engine size.
   The pages are built from these same functions (tools/build-vehicle-tax-pages.js). */
var VehicleTax = (function () {
  "use strict";
  var METHODS = ["year", "yearDD", "monthlyDD", "six", "sixDD"];
  function inRange(r, v) { return v >= r[0] && (r[1] === null || v <= r[1]); }
  function band2001(R, co2) { var c = Math.max(0, Math.round(co2 || 0)); for (var i = 0; i < R.bands2001.length; i++) if (inRange(R.bands2001[i].co2, c)) return R.bands2001[i]; return null; }
  function firstYear(R, fuel, co2) {
    var c = fuel === "electric" ? 0 : Math.max(0, Math.round(co2 || 0));
    for (var i = 0; i < R.firstYear.length; i++) if (inRange(R.firstYear[i].co2, c)) return fuel === "diesel" ? R.firstYear[i].diesel : R.firstYear[i].standard;
    return null;
  }
  /* o: reg ("new" from 1 April 2025, "2017" 1 April 2017 to 31 March 2025, "2001", "pre2001"), fuel ("petrol" |
     "alternative" | "electric" | "diesel" (not RDE2) | "dieselRDE2"), co2, cc, listPrice, method */
  function calc(R, o) {
    var m = METHODS.indexOf(o.method) >= 0 ? o.method : "year";
    if (o.reg === "pre2001") {
      var row = R.pre2001[(o.cc || 0) > 1549 ? 1 : 0];
      return { kind: "pre2001", label: row.cc + "cc", rates: row, payment: row[m], annual: row.year };
    }
    if (o.reg === "2001") {
      var b = band2001(R, o.fuel === "electric" ? 0 : o.co2);
      return b && { kind: "2001", band: b.band, label: "Band " + b.band, rates: b, payment: b[m], annual: b.year };
    }
    var limit = o.fuel === "electric" ? R.expensiveThresholdElectric : R.expensiveThreshold;
    var exempt = o.fuel === "electric" && o.reg === "2017";
    var expensive = !exempt && (o.listPrice || 0) > limit;
    var rates = expensive ? R.expensive : R.standard;
    var first = o.reg === "new" ? firstYear(R, o.fuel, o.co2) : null;
    var later = R.standard.year, supp = R.expensive.year;
    /* years 2 to 6 carry the extra (5 years from the second time it's taxed); from year 7 the standard rate */
    var sixYears = (first !== null ? first : (expensive ? supp : later)) + 5 * (expensive ? supp : later);
    return {
      kind: "2017", label: expensive ? "Standard rate plus the expensive car rate" : "Standard rate", expensive: expensive, exempt: exempt && (o.listPrice || 0) > R.expensiveThreshold,
      first: first, rates: rates, payment: rates[m], annual: rates.year, after: later, sixYears: o.reg === "new" ? sixYears : null, extra: R.expensive.year - R.standard.year
    };
  }
  return { calc: calc, band2001: band2001, firstYear: firstYear, METHODS: METHODS };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = VehicleTax;
} else {
  (function () {
    var box = document.getElementById("vt-tool");
    if (!box) return;
    var R = JSON.parse(box.getAttribute("data-rules"));
    var $ = function (id) { return document.getElementById(id); };
    var num = function (id) { var s = String($(id).value).replace(/[\s,£]/g, ""); return s === "" ? 0 : Number(s); };
    var money = function (v) { return "£" + v.toLocaleString("en-GB", { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 }); };
    var OUT = ["vt-pay", "vt-annual", "vt-first", "vt-after", "vt-six"];
    var LABEL = { year: "12 months", yearDD: "12 months by Direct Debit", monthlyDD: "12 monthly Direct Debits, in total", six: "6 months", sixDD: "6 months by Direct Debit" };
    function run() {
      var reg = $("vt-reg").value, fuel = $("vt-fuel").value, err = $("vt-error");
      $("vt-co2-row").style.display = reg === "pre2001" || fuel === "electric" ? "none" : "";
      $("vt-cc-row").style.display = reg === "pre2001" ? "" : "none";
      $("vt-price-row").style.display = reg === "new" || reg === "2017" ? "" : "none";
      $("vt-fuel-row").style.display = reg === "pre2001" ? "none" : "";
      var bad = ["vt-co2", "vt-cc", "vt-price"].some(function (id) { var v = num(id); return !(v >= 0) || v > 1e8; }) ? "Enter numbers of 0 or more." :
        reg !== "pre2001" && fuel !== "electric" && !(num("vt-co2") > 0) ? "Enter the car's CO2 emissions in g/km (on the V5C registration certificate)." : "";
      err.textContent = bad; err.style.display = bad ? "block" : "none";
      if (bad) { OUT.forEach(function (id) { $(id).textContent = "—"; }); $("vt-label").textContent = "car tax"; $("vt-note").textContent = ""; return; }
      var method = $("vt-method").value;
      var r = VehicleTax.calc(R, { reg: reg, fuel: fuel, co2: num("vt-co2"), cc: num("vt-cc"), listPrice: num("vt-price"), method: method });
      if (!r) return;
      var each = r.payment === null ? "not available (6-month payments aren't offered in this band)" : money(r.payment) + " paying " + LABEL[method];
      if (r.first !== null && r.first !== undefined) {
        /* a new car: the first payment is what you pay now, for 12 months */
        $("vt-pay").textContent = money(r.first);
        $("vt-label").textContent = "first payment, covering 12 months";
      } else {
        $("vt-pay").textContent = r.payment === null ? money(r.annual) : money(r.payment);
        $("vt-label").textContent = (r.payment === null ? "for 12 months (6-month payments aren't offered)" : LABEL[method]) + (r.kind === "2017" ? "" : " · " + r.label);
      }
      $("vt-annual").textContent = money(r.annual) + " a year" + (r.kind === "2017" ? (r.first !== null && r.first !== undefined ? " from the second year" : "") : " · " + r.label);
      $("vt-first").textContent = r.first !== null && r.first !== undefined ? money(r.first) : "—";
      $("vt-after").textContent = r.kind === "2017" ? (r.expensive ? money(r.annual) + " a year in years 2 to 6, then " + money(r.after) : each) : each;
      $("vt-six").textContent = r.sixYears ? money(r.sixYears) : "—";
      $("vt-note").textContent = r.exempt ? "No expensive car rate: a zero emission car registered before 1 April 2025 doesn't pay it." : r.expensive ? "Includes the extra " + money(r.extra) + " a year for a list price over " + money(fuel === "electric" ? R.expensiveThresholdElectric : R.expensiveThreshold) + ", for 5 years from the second time the car is taxed." : "";
    }
    ["vt-co2", "vt-cc", "vt-price"].forEach(function (id) { $(id).addEventListener("input", run); });
    ["vt-reg", "vt-fuel", "vt-method"].forEach(function (id) { $(id).addEventListener("change", run); });
    run();
  })();
}
