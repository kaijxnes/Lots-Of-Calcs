/* The calculator on a generated appliance page (/running-cost/<appliance>/).
   Cost = power (kW) x hours x unit price; for appliances rated per cycle the
   page gives kWh per use instead of a wattage. */
(function () {
  var box = document.getElementById("app-tool");
  if (!box) return;
  var $ = function (id) { return document.getElementById(id); };
  var perCycle = box.getAttribute("data-mode") === "cycle";
  function n(id) { var v = Number(String($(id).value).replace(/[\s,]/g, "")); return isFinite(v) && v >= 0 ? v : NaN; }
  function money(p) { return isFinite(p) ? (p < 100 ? (Math.round(p * 10) / 10).toLocaleString("en-GB") + "p" : "£" + (p / 100).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })) : "—"; }
  function calc() {
    var rate = n("app-rate"), uses = n("app-uses");
    var kwh = perCycle ? n("app-kwh") : n("app-watts") / 1000 * n("app-minutes") / 60;
    var use = kwh * rate;
    $("app-use").textContent = money(use);
    $("app-week").textContent = money(use * uses);
    $("app-month").textContent = money(use * uses * 52 / 12);
    $("app-year").textContent = money(use * uses * 52);
    $("app-kwh-out").textContent = isFinite(kwh) ? (Math.round(kwh * 1000) / 1000).toLocaleString("en-GB") + " kWh" : "—";
  }
  ["app-watts", "app-minutes", "app-kwh", "app-uses", "app-rate"].forEach(function (id) { var el = $(id); if (el) el.addEventListener("input", calc); });
})();
