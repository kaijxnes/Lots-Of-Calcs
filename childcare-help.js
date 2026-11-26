/* Childcare help calculator (/childcare-help-calculator/): Tax-Free
   Childcare against Universal Credit's childcare amount, since you can't
   get both. Tax-Free Childcare adds £2 for every £8 paid in (20% of the
   cost) up to £2,000 a year per child (£4,000 if disabled); Universal
   Credit pays back 85% of costs up to a monthly cap, but only adds to the
   payment as far as the rest of the award allows, so the gain is
   worked out as Universal Credit with childcare minus without
   (universal-credit.js). Rules: data/uk/tax-free-childcare.json (`T`) and
   data/uk/universal-credit.json (`U`). The page is built from these same
   functions (tools/build-childcare-help-pages.js). */
var ChildcareHelp = (function () {
  "use strict";
  var p2 = function (v) { return Math.round(v * 100) / 100; };
  var UC = typeof module !== "undefined" && module.exports ? require("./universal-credit.js") : (typeof UniversalCredit !== "undefined" ? UniversalCredit : null);
  /* Tax-Free Childcare top-up a month on `cost` a month, shared evenly across `children`, `disabled` of them disabled */
  function tfc(T, cost, children, disabled) {
    if (!(children > 0)) return 0;
    var cap = ((children - Math.min(disabled, children)) * T.maxYear + Math.min(disabled, children) * T.maxYearDisabled) / 12;
    return p2(Math.min(cost * T.topUpPer / (T.payIn + T.topUpPer), cap));
  }
  /* o: as UniversalCredit.calc, plus childcare (costs a month), disabledForTfc, tfcEligible */
  function calc(T, U, o) {
    var t = o.tfcEligible ? tfc(T, Math.max(0, o.childcare || 0), o.children, o.disabledForTfc || 0) : 0;
    var withCC = UC.calc(U, o), without = UC.calc(U, Object.assign({}, o, { childcare: 0 }));
    var gain = p2(withCC.uc - without.uc);
    return { tfc: t, ucGain: gain, ucWith: withCC.uc, ucWithout: without.uc, ucChildcare: withCC.childcare, better: t > gain ? "tfc" : gain > t ? "uc" : "same", diff: p2(Math.abs(t - gain)) };
  }
  return { tfc: tfc, calc: calc };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = ChildcareHelp;
} else {
  (function () {
    var box = document.getElementById("ch-tool");
    if (!box) return;
    var D = JSON.parse(box.getAttribute("data-rules")), T = D.tfc, U = D.uc;
    var $ = function (id) { return document.getElementById(id); };
    var num = function (id) { var s = String($(id).value).replace(/[\s,£]/g, ""); return s === "" ? 0 : Number(s); };
    var money = function (v) { return "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
    var OUT = ["ch-best", "ch-tfc", "ch-uc", "ch-ucwith", "ch-ucwithout"];
    function run() {
      var err = $("ch-error"), ids = ["ch-children", "ch-disabled", "ch-cost", "ch-earn", "ch-housing"];
      var bad = ids.some(function (id) { var v = num(id); return !(v >= 0) || v > 1e7; }) ? "Enter amounts of 0 or more." :
        !(num("ch-children") >= 1) || num("ch-children") > 20 ? "Enter how many children you pay childcare for." :
        num("ch-disabled") > num("ch-children") ? "More disabled children than children." : !(num("ch-cost") > 0) ? "Enter your childcare costs a month." : "";
      err.textContent = bad; err.style.display = bad ? "block" : "none";
      if (bad) { OUT.forEach(function (id) { $(id).textContent = "—"; }); $("ch-label").textContent = "better for you"; return; }
      var r = ChildcareHelp.calc(T, U, {
        couple: $("ch-couple").value === "1", over25: $("ch-age").value === "1", children: num("ch-children"), disabledForTfc: num("ch-disabled"),
        health: "none", housing: num("ch-housing"), childcare: num("ch-cost"), earnings: num("ch-earn"), tfcEligible: $("ch-eligible").checked
      });
      $("ch-best").textContent = r.better === "tfc" ? "Tax-Free Childcare" : r.better === "uc" ? "Universal Credit" : "About the same";
      $("ch-label").textContent = r.better === "same" ? "both come to " + money(r.tfc) + " a month" : "about " + money(r.diff) + " a month more help";
      $("ch-tfc").textContent = $("ch-eligible").checked ? money(r.tfc) : "not eligible";
      $("ch-uc").textContent = money(r.ucGain);
      $("ch-ucwith").textContent = money(r.ucWith);
      $("ch-ucwithout").textContent = money(r.ucWithout);
    }
    ["ch-children", "ch-disabled", "ch-cost", "ch-earn", "ch-housing"].forEach(function (id) { $(id).addEventListener("input", run); });
    ["ch-couple", "ch-age", "ch-eligible"].forEach(function (id) { $(id).addEventListener("change", run); });
    run();
  })();
}
