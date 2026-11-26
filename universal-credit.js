/* Universal Credit calculator (/universal-credit-calculator/): a monthly
   Universal Credit estimate and how wages change it, from GOV.UK's rules in
   data/uk/universal-credit.json (passed in as `R`): the standard allowance
   plus the extra amounts that apply, less 55p for every £1 of take-home pay
   above the work allowance (if there is one), less income from savings over
   £6,000 and other benefits taken off pound for pound. The page is built
   from these same functions (tools/build-universal-credit-pages.js). */
var UniversalCredit = (function () {
  "use strict";
  var p2 = function (v) { return Math.round(v * 100) / 100; };
  /* o: couple, over25, children, firstBefore2017, disLower, disHigher,
        health ("none" | "limits" | "lcwra" | "lcwraSevere"), carer,
        housing, childcare (costs a month), earnings (take-home a month),
        other (benefits or pensions taken off in full), savings */
  function calc(R, o) {
    var children = Math.max(0, Math.floor(o.children || 0));
    var standard = o.couple ? (o.over25 ? R.standard.couple25 : R.standard.coupleUnder25) : (o.over25 ? R.standard.single25 : R.standard.singleUnder25);
    var childAmt = children * R.child + (children > 0 && o.firstBefore2017 ? R.firstChildBefore2017Extra : 0);
    var disabled = Math.min(children, Math.max(0, o.disLower || 0)) * R.disabledChild.lower + Math.min(children, Math.max(0, o.disHigher || 0)) * R.disabledChild.higher;
    var health = o.health === "lcwra" ? R.health.lcwra : o.health === "lcwraSevere" ? R.health.lcwraSevere : 0;
    /* a single claimant can't have the carer amount on top of the health amount; a couple can (one each) */
    var carerDropped = !!o.carer && health > 0 && !o.couple;
    var carer = o.carer && !carerDropped ? R.carer : 0;
    var housing = Math.max(0, o.housing || 0), earnings = Math.max(0, o.earnings || 0);
    var childcare = earnings > 0 && children > 0 ? Math.min(Math.max(0, o.childcare || 0) * R.childcarePct / 100, children > 1 ? R.childcareMax.twoOrMore : R.childcareMax.one) : 0;
    var max = p2(standard + childAmt + disabled + health + carer + housing + childcare);
    var hasWA = children > 0 || (o.health && o.health !== "none");
    var wa = hasWA ? (housing > 0 ? R.workAllowance.withHousing : R.workAllowance.withoutHousing) : 0;
    var earnDed = p2(Math.max(0, earnings - wa) * R.taperPct / 100);
    var savings = Math.max(0, o.savings || 0), overCapital = savings > R.capital.upper;
    var tariff = savings > R.capital.disregard ? Math.ceil((Math.min(savings, R.capital.upper) - R.capital.disregard) / R.capital.step - 1e-9) * R.capital.perStep : 0;
    tariff = p2(tariff);
    var other = Math.max(0, o.other || 0);
    var uc = overCapital ? 0 : Math.max(0, p2(max - earnDed - tariff - other));
    if (uc < 0.01) uc = 0;
    /* take-home pay at which Universal Credit runs out, with the same circumstances */
    var room = max - tariff - other, stopsAt = overCapital ? 0 : room <= 0 ? 0 : p2(wa + room / (R.taperPct / 100));
    var exempt = health > 0 || carer > 0 || earnings >= R.benefitCap.earningsThreshold;
    return {
      standard: standard, child: p2(childAmt), disabled: p2(disabled), health: health, carer: carer, carerDropped: carerDropped,
      housing: housing, childcare: p2(childcare), max: max, workAllowance: wa, earnDed: earnDed, tariff: tariff, other: other,
      uc: uc, total: p2(earnings + uc), stopsAt: stopsAt, overCapital: overCapital,
      capMayApply: !overCapital && uc > 0 && !exempt,
      cap: { outside: (o.couple || children > 0) ? R.benefitCap.outsideLondon.family : R.benefitCap.outsideLondon.single, london: (o.couple || children > 0) ? R.benefitCap.london.family : R.benefitCap.london.single }
    };
  }
  return { calc: calc };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = UniversalCredit;
} else {
  (function () {
    var box = document.getElementById("uc-tool");
    if (!box) return;
    var R = JSON.parse(box.getAttribute("data-rules"));
    var $ = function (id) { return document.getElementById(id); };
    var num = function (id) { var s = String($(id).value).replace(/[\s,£]/g, ""); return s === "" ? 0 : Number(s); };
    var money = function (v) { return "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
    var OUT = ["uc-amount", "uc-max", "uc-wa", "uc-ded", "uc-other-ded", "uc-total", "uc-stops"];
    function run() {
      var err = $("uc-error"), note = $("uc-note");
      var ids = ["uc-children", "uc-dis-lower", "uc-dis-higher", "uc-housing", "uc-childcare", "uc-earnings", "uc-other", "uc-savings"];
      var bad = ids.some(function (id) { var v = num(id); return !(v >= 0) || v > 1e7; }) ? "Enter amounts of 0 or more." :
        num("uc-children") > 20 ? "Enter the number of children who live with you." :
        num("uc-dis-lower") + num("uc-dis-higher") > num("uc-children") ? "More disabled children than children." : "";
      err.textContent = bad; err.style.display = bad ? "block" : "none";
      if (bad) { OUT.forEach(function (id) { $(id).textContent = "—"; }); $("uc-label").textContent = "Universal Credit a month"; note.textContent = ""; return; }
      var r = UniversalCredit.calc(R, {
        couple: $("uc-couple").value === "1", over25: $("uc-age").value === "1", children: num("uc-children"),
        firstBefore2017: $("uc-pre2017").checked, disLower: num("uc-dis-lower"), disHigher: num("uc-dis-higher"),
        health: $("uc-health").value, carer: $("uc-carer").checked, housing: num("uc-housing"), childcare: num("uc-childcare"),
        earnings: num("uc-earnings"), other: num("uc-other"), savings: num("uc-savings")
      });
      $("uc-pre2017-row").style.display = num("uc-children") > 0 ? "" : "none";
      $("uc-amount").textContent = money(r.uc);
      $("uc-label").textContent = r.overCapital ? "no Universal Credit: savings over £" + R.capital.upper.toLocaleString("en-GB") : "Universal Credit a month (estimate)";
      $("uc-max").textContent = money(r.max);
      $("uc-wa").textContent = r.workAllowance ? money(r.workAllowance) : "none";
      $("uc-ded").textContent = "−" + money(r.earnDed);
      $("uc-other-ded").textContent = "−" + money(r.tariff + r.other);
      $("uc-total").textContent = money(r.total);
      $("uc-stops").textContent = r.overCapital ? "—" : r.stopsAt > 0 ? money(r.stopsAt) + " take-home a month" : "no Universal Credit with these figures";
      var notes = [];
      if (r.carerDropped) notes.push("The carer amount isn't paid on top of the health amount for the same person, so it's left out.");
      if (r.capMayApply) notes.push("The benefit cap may limit this: total benefits, including Child Benefit, can't go over " + money(r.cap.outside) + " a month (" + money(r.cap.london) + " in Greater London) while you earn under £" + R.benefitCap.earningsThreshold + " a month between you, unless an exemption applies.");
      note.textContent = notes.join(" ");
    }
    ["uc-children", "uc-dis-lower", "uc-dis-higher", "uc-housing", "uc-childcare", "uc-earnings", "uc-other", "uc-savings"].forEach(function (id) { $(id).addEventListener("input", run); });
    ["uc-couple", "uc-age", "uc-health", "uc-pre2017", "uc-carer"].forEach(function (id) { $(id).addEventListener("change", run); });
    run();
  })();
}
