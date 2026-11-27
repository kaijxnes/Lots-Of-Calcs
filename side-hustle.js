/* Side hustle tax calculator (/side-hustle-tax-calculator/): the tax on
   income from self-employment, casual work or renting out property on top
   of a job, with the £1,000 trading or property allowance. Rules from
   HMRC's guidance in data/uk/side-hustle.json (`R`):
     - take off either the £1,000 allowance (never more than the income) or
       your actual expenses, whichever is more;
     - the rest is added to your other income and taxed with the UK tax
       file's bands (UKCalcs, `cfg`);
     - trading profits also pay Class 4 National Insurance, from the
       self-employed tax file's brackets (R.class4); property income doesn't;
     - what you must tell HMRC depends on the gross income.
   The page is built from these same functions
   (tools/build-side-hustle-pages.js). */
var SideHustle = (function () {
  "use strict";
  var p2 = function (v) { return Math.round(v * 100) / 100; };
  function bands(amount, br) {
    var t = 0;
    for (var i = 0; i < br.length; i++) { var lo = br[i][0], hi = i + 1 < br.length ? br[i + 1][0] : Infinity; if (amount > lo) t += (Math.min(amount, hi) - lo) * br[i][1] / 100; }
    return t;
  }
  /* o: kind ("trading" | "property"), gross, expenses, salary (other income) */
  function calc(UK, cfg, R, o) {
    var gross = Math.max(0, o.gross || 0), exp = Math.max(0, o.expenses || 0), salary = Math.max(0, o.salary || 0);
    var allow = Math.min(R.allowance, gross), useAllowance = allow >= exp, deduct = useAllowance ? allow : exp;
    var profit = Math.max(0, gross - deduct);
    var tax = p2(UK.incomeTax(cfg, salary + profit, 0).nsTax - UK.incomeTax(cfg, salary, 0).nsTax);
    var ni = o.kind === "trading" ? p2(bands(profit, R.class4)) : 0;
    var tell = gross <= R.contactFrom ? "none" : o.kind === "trading" ? "register" : gross <= R.saFrom ? "contact" : "register";
    return { gross: p2(gross), useAllowance: useAllowance, deduct: p2(deduct), profit: p2(profit), tax: tax, ni: ni, keep: p2(gross - exp - tax - ni), tell: tell, loss: exp > gross };
  }
  return { calc: calc };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = SideHustle;
} else {
  (function () {
    var box = document.getElementById("sh-tool");
    if (!box) return;
    var D = JSON.parse(box.getAttribute("data-rules")), cfg = D.cfg, R = D.R;
    var $ = function (id) { return document.getElementById(id); };
    var num = function (id) { var s = String($(id).value).replace(/[\s,£]/g, ""); return s === "" ? 0 : Number(s); };
    var money = function (v) { return "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
    var TELL = {
      none: "£1,000 or less: you don't need to tell HMRC (unless you want to, for example to claim a loss).",
      contact: "Over £1,000 up to £2,500 of property income: contact HMRC.",
      register: "Over £1,000: register for Self Assessment by 5 October after the tax year ends."
    };
    var OUT = ["sh-keep", "sh-deduct", "sh-profit", "sh-tax", "sh-ni", "sh-tell"];
    function run() {
      var err = $("sh-error"), kind = $("sh-kind").value, gross = num("sh-gross"), exp = num("sh-expenses"), sal = num("sh-salary");
      $("sh-ni-row").style.display = kind === "trading" ? "" : "none";
      var bad = [gross, exp, sal].some(function (v) { return !(v >= 0) || v > 1e8; }) ? "Enter amounts of 0 or more." : "";
      err.textContent = bad; err.style.display = bad ? "block" : "none";
      if (bad) { OUT.forEach(function (id) { $(id).textContent = "—"; }); return; }
      var r = SideHustle.calc(UKCalcs, cfg, R, { kind: kind, gross: gross, expenses: exp, salary: sal });
      $("sh-keep").textContent = money(r.keep);
      $("sh-label").textContent = "you keep a year, after " + (r.useAllowance ? "the £1,000 allowance" : "expenses") + " and tax";
      $("sh-deduct").textContent = money(r.deduct) + (r.useAllowance ? " (the allowance)" : " (your expenses)");
      $("sh-profit").textContent = money(r.profit);
      $("sh-tax").textContent = money(r.tax);
      $("sh-ni").textContent = money(r.ni);
      $("sh-tell").textContent = TELL[r.tell] + (r.loss ? " You've made a loss: claiming expenses on a tax return lets you use it." : "");
    }
    ["sh-gross", "sh-expenses", "sh-salary"].forEach(function (id) { $(id).addEventListener("input", run); });
    $("sh-kind").addEventListener("change", run);
    run();
  })();
}
