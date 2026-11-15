/* Dry January calculator (/dry-january-calculator/): the money, alcohol
   units and calories saved by not drinking for January, or for a year.

   Units are the NHS's: ABV × volume in ml ÷ 1,000, with its standard
   drinks (a pint of 3.6% is 2 units, a 175ml glass of 12% wine 2.1, a 25ml
   single of 40% spirit 1). The NHS advises no more than 14 units a week.
   One unit is 8g of alcohol, and alcohol has about 7 calories per gram
   (NHS), so 56 calories a unit — from the alcohol alone, before any sugar
   in the drink or mixer. Prices are whatever the visitor pays. */
var DryJanuary = (function () {
  "use strict";
  var DRINKS = [
    { key: "pint-low", name: "Pint of beer, lager or cider (3.6%)", ml: 568, abv: 3.6, per: 0, price: 5 },
    { key: "pint-high", name: "Pint of stronger beer, lager or cider (5.2%)", ml: 568, abv: 5.2, per: 4, price: 5.5 },
    { key: "can", name: "Can (440ml, 5.5%)", ml: 440, abv: 5.5, per: 0, price: 2 },
    { key: "bottle", name: "Bottle of beer (330ml, 5%)", ml: 330, abv: 5, per: 0, price: 2 },
    { key: "wine-175", name: "Standard glass of wine (175ml, 12%)", ml: 175, abv: 12, per: 3, price: 7 },
    { key: "wine-250", name: "Large glass of wine (250ml, 12%)", ml: 250, abv: 12, per: 0, price: 9 },
    { key: "wine-bottle", name: "Bottle of wine (750ml, 13.5%)", ml: 750, abv: 13.5, per: 0, price: 9 },
    { key: "spirit", name: "Single spirit (25ml, 40%)", ml: 25, abv: 40, per: 0, price: 5 }
  ];
  var KCAL_PER_UNIT = 8 * 7, LIMIT = 14, JAN_WEEKS = 31 / 7, YEAR_WEEKS = 52;

  function units(d) { return d.abv * d.ml / 1000; }
  /* rows: [{key, per, price}] -> weekly totals */
  function week(rows) {
    var u = 0, money = 0;
    rows.forEach(function (r) {
      var d = null;
      for (var i = 0; i < DRINKS.length; i++) if (DRINKS[i].key === r.key) d = DRINKS[i];
      if (!d || !(r.per > 0)) return;
      u += units(d) * r.per;
      money += (r.price > 0 ? r.price : 0) * r.per;
    });
    return { units: u, money: money, kcal: u * KCAL_PER_UNIT };
  }
  function pounds(v) { return "£" + v.toLocaleString("en-GB", { minimumFractionDigits: v < 100 ? 2 : 0, maximumFractionDigits: v < 100 ? 2 : 0 }); }
  function n0(v) { return Math.round(v).toLocaleString("en-GB"); }
  function n1(v) { return (Math.round(v * 10) / 10).toLocaleString("en-GB"); }

  return { DRINKS: DRINKS, KCAL_PER_UNIT: KCAL_PER_UNIT, LIMIT: LIMIT, JAN_WEEKS: JAN_WEEKS, YEAR_WEEKS: YEAR_WEEKS, units: units, week: week, pounds: pounds, n0: n0, n1: n1 };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = DryJanuary;
} else {
  (function () {
    var box = document.getElementById("dj-tool");
    if (!box) return;
    var D = DryJanuary;
    var $ = function (id) { return document.getElementById(id); };
    function calc() {
      var rows = D.DRINKS.map(function (d) { return { key: d.key, per: Number($("dj-n-" + d.key).value), price: Number($("dj-p-" + d.key).value) }; });
      var w = D.week(rows);
      $("dj-jan").textContent = D.pounds(w.money * D.JAN_WEEKS);
      $("dj-week").textContent = D.pounds(w.money) + " and " + D.n1(w.units) + " units";
      $("dj-limit").textContent = w.units > D.LIMIT ? D.n1(w.units - D.LIMIT) + " units over the NHS's 14 a week" : "Within the NHS's 14 units a week";
      $("dj-jan-units").textContent = D.n0(w.units * D.JAN_WEEKS) + " units, " + D.n0(w.kcal * D.JAN_WEEKS) + " calories";
      $("dj-year").textContent = D.pounds(w.money * D.YEAR_WEEKS);
      $("dj-year-units").textContent = D.n0(w.units * D.YEAR_WEEKS) + " units, " + D.n0(w.kcal * D.YEAR_WEEKS) + " calories (about " + D.n1(w.kcal * D.YEAR_WEEKS / 7700) + " kg of body fat's worth)";
    }
    D.DRINKS.forEach(function (d) { ["dj-n-", "dj-p-"].forEach(function (p) { $(p + d.key).addEventListener("input", calc); }); });
    calc();
  })();
}
