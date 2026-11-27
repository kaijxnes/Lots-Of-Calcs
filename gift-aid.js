/* Gift Aid calculator (/gift-aid-calculator/): what a charity gets from a
   Gift Aid donation and what a higher or additional rate taxpayer can claim
   back. Rules in data/uk/gift-aid.json (`R`):
     - the charity claims 25p for every £1 you give (R.top), so a gift is
       grossed up by a quarter;
     - your basic rate limit and higher rate limit are extended by the
       grossed-up gift (Income Tax Act 2007 s414), so less of your income is
       taxed at 40% or 45%;
     - your adjusted net income is reduced by the grossed-up gift, which can
       restore Personal Allowance lost over £100,000;
     - donations qualify if they're not more than 4 times the tax you paid
       in the tax year (R.maxTimesTax).
   Income Tax from the UK tax file's bands (UKCalcs, `cfg`, England, Wales
   and Northern Ireland). The page is built from these same functions
   (tools/build-gift-aid-pages.js). */
var GiftAid = (function () {
  "use strict";
  var p2 = function (v) { return Math.round(v * 100) / 100; };
  /* o: donation (what you give in the tax year), income (taxable income) */
  function calc(UK, cfg, R, o) {
    var d = Math.max(0, o.donation || 0), income = Math.max(0, o.income || 0), gross = d * (1 + R.top / 100);
    var wide = {};
    Object.keys(cfg).forEach(function (k) { wide[k] = cfg[k]; });
    wide.basicBand = cfg.basicBand + gross; wide.addlFrom = cfg.addlFrom + gross; wide.paTaperFrom = cfg.paTaperFrom + gross;
    var before = UK.incomeTax(cfg, income, 0).nsTax, after = UK.incomeTax(wide, income, 0).nsTax, back = p2(before - after);
    return { donation: p2(d), gross: p2(gross), extra: p2(gross - d), back: back, cost: p2(d - back), tax: p2(before), qualifies: d <= R.maxTimesTax * before + 1e-9, maxDonation: p2(R.maxTimesTax * before) };
  }
  return { calc: calc };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = GiftAid;
} else {
  (function () {
    var box = document.getElementById("ga-tool");
    if (!box) return;
    var D = JSON.parse(box.getAttribute("data-rules")), cfg = D.cfg, R = D.R;
    var $ = function (id) { return document.getElementById(id); };
    var num = function (id) { var s = String($(id).value).replace(/[\s,£]/g, ""); return s === "" ? 0 : Number(s); };
    var money = function (v) { return "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
    var OUT = ["ga-gross", "ga-extra", "ga-back", "ga-cost"];
    function run() {
      var err = $("ga-error"), d = num("ga-donation"), inc = num("ga-income");
      var bad = [d, inc].some(function (v) { return !(v >= 0) || v > 1e9; }) ? "Enter amounts of 0 or more." : "";
      err.textContent = bad; err.style.display = bad ? "block" : "none";
      if (bad) { OUT.forEach(function (id) { $(id).textContent = "—"; }); $("ga-note").textContent = ""; return; }
      var r = GiftAid.calc(UKCalcs, cfg, R, { donation: d, income: inc });
      $("ga-gross").textContent = money(r.gross);
      $("ga-extra").textContent = money(r.extra);
      $("ga-back").textContent = money(r.back);
      $("ga-cost").textContent = money(r.cost);
      $("ga-note").textContent = !r.qualifies ? "This is more than 4 times the Income Tax you pay (" + money(r.tax) + "), so it doesn't all qualify unless you've paid other tax, such as Capital Gains Tax. If the charity gets back more tax than you've paid, HMRC may ask you to pay the difference." :
        r.back > 0 ? "Claim the " + money(r.back) + " back on your Self Assessment tax return, or ask HMRC to change your tax code." : "As a basic rate taxpayer there's nothing extra to claim back: the charity gets the tax relief.";
    }
    ["ga-donation", "ga-income"].forEach(function (id) { $(id).addEventListener("input", run); });
    run();
  })();
}
