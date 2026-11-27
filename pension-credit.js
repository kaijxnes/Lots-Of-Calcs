/* Pension Credit calculator (/pension-credit-calculator/): the Guarantee
   Credit part of Pension Credit, from weekly income, savings and the extra
   amounts. Rules from GOV.UK and the State Pension Credit Regulations 2002
   in data/uk/pension-credit.json (passed in as `R`):
     - the guarantee is the standard amount (single or couple) plus extras
       for severe disability, caring (each carer), and each child, with more
       for a disabled child;
     - savings over £10,000 count as £1 a week of income for each £500, and
       £1 for any part of £500 (regulation 15(6));
     - Guarantee Credit is whatever tops income up to the guarantee.
   The page is built from these same functions
   (tools/build-pension-credit-pages.js). */
var PensionCredit = (function () {
  "use strict";
  var p2 = function (v) { return Math.round(v * 100) / 100; };
  function tariff(R, savings) { var over = Math.max(0, (savings || 0) - R.capital.disregard); return Math.ceil(over / R.capital.step); }
  /* o: couple, income (weekly), savings, severe (bool), carers (0-2), children, firstBefore2017 (bool), dcLower, dcHigher */
  function calc(R, o) {
    var kids = Math.max(0, Math.floor(o.children || 0));
    var childAmt = kids ? (o.firstBefore2017 ? R.childFirstBefore2017 : R.child) + (kids - 1) * R.child : 0;
    var parts = {
      standard: o.couple ? R.couple : R.single,
      severe: o.severe ? R.severe : 0,
      carer: R.carer * Math.min(o.couple ? 2 : 1, Math.max(0, Math.floor(o.carers || 0))),
      children: childAmt,
      disabledChildren: R.disabledChild.lower * Math.max(0, Math.floor(o.dcLower || 0)) + R.disabledChild.higher * Math.max(0, Math.floor(o.dcHigher || 0))
    };
    var guarantee = p2(parts.standard + parts.severe + parts.carer + parts.children + parts.disabledChildren);
    var t = tariff(R, o.savings), income = p2(Math.max(0, o.income || 0) + t), gc = p2(Math.max(0, guarantee - income));
    return { parts: parts, guarantee: guarantee, tariff: t, income: income, weekly: gc, year: p2(gc * 52), month: p2(gc * 52 / 12), gets: gc > 0, short: p2(Math.max(0, income - guarantee)) };
  }
  return { calc: calc, tariff: tariff };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = PensionCredit;
} else {
  (function () {
    var box = document.getElementById("pc-tool");
    if (!box) return;
    var R = JSON.parse(box.getAttribute("data-rules"));
    var $ = function (id) { return document.getElementById(id); };
    var num = function (id) { var s = String($(id).value).replace(/[\s,£]/g, ""); return s === "" ? 0 : Number(s); };
    var money = function (v) { return "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
    var PER = { week: 1, four: 1 / 4, month: 12 / 52, year: 1 / 52 };
    var OUT = ["pc-weekly", "pc-year", "pc-guarantee", "pc-income-out", "pc-tariff"];
    function run() {
      var err = $("pc-error"), couple = $("pc-couple").value === "couple";
      $("pc-carers").max = couple ? 2 : 1;
      var inc = num("pc-income"), sav = num("pc-savings"), kids = num("pc-children"), carers = num("pc-carers"), lo = num("pc-dc-lower"), hi = num("pc-dc-higher");
      var bad = !(inc >= 0) || inc > 1e7 ? "Enter your income, or 0." : !(sav >= 0) || sav > 1e9 ? "Enter your savings, or 0." :
        [kids, carers, lo, hi].some(function (v) { return !(v >= 0) || v > 20 || v % 1; }) ? "Enter whole numbers for children and carers." : lo + hi > kids ? "Disabled children can't be more than the number of children." : "";
      err.textContent = bad; err.style.display = bad ? "block" : "none";
      if (bad) { OUT.forEach(function (id) { $(id).textContent = "—"; }); $("pc-note").textContent = ""; return; }
      var r = PensionCredit.calc(R, { couple: couple, income: inc * PER[$("pc-per").value], savings: sav, severe: $("pc-severe").checked, carers: carers, children: kids, firstBefore2017: $("pc-first").checked, dcLower: lo, dcHigher: hi });
      $("pc-weekly").textContent = money(r.weekly);
      $("pc-label").textContent = r.gets ? "Guarantee Credit a week" : "Guarantee Credit a week: your income is above the guarantee";
      $("pc-year").textContent = money(r.year);
      $("pc-guarantee").textContent = money(r.guarantee) + " a week";
      $("pc-income-out").textContent = money(r.income) + " a week";
      $("pc-tariff").textContent = r.tariff ? money(r.tariff) + " a week" : "None";
      $("pc-note").textContent = r.gets ? "Getting any Pension Credit also opens the door to other help: cold weather payments, help with NHS costs, and a free TV licence if you're 75 or over." :
        "You're " + money(r.short) + " a week over. You might still get Savings Credit if you reached State Pension age before 6 April 2016, or extra for housing costs.";
    }
    ["pc-income", "pc-savings", "pc-children", "pc-carers", "pc-dc-lower", "pc-dc-higher"].forEach(function (id) { $(id).addEventListener("input", run); });
    ["pc-couple", "pc-per", "pc-severe", "pc-first"].forEach(function (id) { $(id).addEventListener("change", run); });
    run();
  })();
}
