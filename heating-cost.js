/* Heating cost (/heating-cost/): what an electric heater costs to run, and
   what the same heat would cost from a gas boiler.

   The unit rates are the Ofgem price cap figures written into the page
   (data-elec, data-gas) by tools/build-heating-pages.js from
   data/energy/uk.json. An electric heater turns all the electricity it uses
   into heat; a gas boiler loses some up the flue, so gas heat costs the
   gas unit rate divided by the boiler's efficiency. */
var HeatingCost = (function () {
  "use strict";
  /* pence -> "52.6p" or "£1.23" */
  function money(p) {
    if (p < 100) return (Math.round(p * 10) / 10).toLocaleString("en-GB") + "p";
    return "£" + (p / 100).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  /* kWh of heat for a heater of this many watts over these hours */
  function kwh(watts, hours) { return watts / 1000 * hours; }
  /* pence for that heat: electric at the unit rate; gas at rate / efficiency */
  function electric(heat, rate) { return heat * rate; }
  function gas(heat, rate, eff) { return heat * rate / eff; }
  return { money: money, kwh: kwh, electric: electric, gas: gas, WEEKS_MONTH: 52 / 12, WINTER_WEEKS: 26 };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = HeatingCost;
} else {
  (function () {
    var box = document.getElementById("hc-tool");
    if (!box) return;
    var $ = function (id) { return document.getElementById(id); };
    var H = HeatingCost;
    function num(id) { return Number($(id).value); }

    function calc() {
      var w = num("hc-watts"), hours = num("hc-hours"), daysWeek = num("hc-days"), er = num("hc-elec"), gr = num("hc-gas"), eff = num("hc-eff") / 100;
      var err = $("hc-error");
      if (!(w > 0) || !(hours >= 0) || hours > 24 || !(daysWeek >= 0) || daysWeek > 7 || !(er >= 0) || !(gr >= 0) || !(eff > 0) || eff > 1) {
        err.textContent = "Check the figures: power above zero, up to 24 hours a day, up to 7 days a week, efficiency between 1 and 100%.";
        err.style.display = "block";
        return;
      }
      err.style.display = "none";
      var hourE = H.electric(H.kwh(w, 1), er), hourG = H.gas(H.kwh(w, 1), gr, eff);
      var week = hours * daysWeek;
      $("hc-hour").textContent = H.money(hourE);
      $("hc-day").textContent = H.money(hourE * hours);
      $("hc-month").textContent = H.money(hourE * week * H.WEEKS_MONTH);
      $("hc-winter").textContent = H.money(hourE * week * H.WINTER_WEEKS);
      $("hc-gas-hour").textContent = H.money(hourG);
      $("hc-gas-month").textContent = H.money(hourG * week * H.WEEKS_MONTH);
      $("hc-ratio").textContent = gr > 0 ? (Math.round(er / (gr / eff) * 10) / 10).toLocaleString("en-GB") + "×" : "—";
    }

    ["hc-watts", "hc-hours", "hc-days", "hc-elec", "hc-gas", "hc-eff"].forEach(function (id) { $(id).addEventListener("input", calc); });
    calc();
  })();
}
