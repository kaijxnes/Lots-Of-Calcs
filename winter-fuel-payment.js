/* Winter Fuel Payment calculator (/winter-fuel-payment-calculator/): whether
   someone gets a Winter Fuel Payment, how much, and whether HMRC takes it
   back because their income is over the limit. Rules for one winter from
   GOV.UK in data/uk/winter-fuel-payment.json (passed in as `R`):
     - born on or before R.bornBy, living in England, Wales or Northern Ireland;
     - the higher amounts if born before R.olderBefore;
     - the amount depends on living alone, with someone else who's eligible
       (and whether either gets Pension Credit, Universal Credit or
       income-related ESA, jointly or not), or in a care home;
     - over R.incomeLimit of your own total income, HMRC takes it back.
   Dates are ISO strings. The page is built from these same functions
   (tools/build-winter-fuel-payment-pages.js). */
var WinterFuel = (function () {
  "use strict";
  /* o: dob, home ("alone" | "with" | "care"), partnerDob, benefit ("none" | "own" | "joint"), income */
  function calc(R, o) {
    if (!o.dob || o.dob > R.bornBy) return { eligible: false };
    var A = R.amounts, older = o.dob < R.olderBefore, i = older ? 1 : 0, amount, joint = false;
    var partnerEligible = o.home === "with" && o.partnerDob && o.partnerDob <= R.bornBy, pOlder = partnerEligible && o.partnerDob < R.olderBefore;
    if (o.home === "care") amount = A.care[i];
    else if (!partnerEligible) amount = A.alone[i];
    else if (o.benefit === "joint") { amount = A.joint[older || pOlder ? 1 : 0]; joint = true; }
    else if (o.benefit === "own") amount = A.single[i];
    else amount = A.together[(older ? "o" : "y") + (pOlder ? "o" : "y")];
    var back = (o.income || 0) > R.incomeLimit;
    return { eligible: true, older: older, amount: amount, joint: joint, back: back, keep: back ? 0 : amount, partnerEligible: !!partnerEligible };
  }
  return { calc: calc };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = WinterFuel;
} else {
  (function () {
    var box = document.getElementById("wf-tool");
    if (!box) return;
    var R = JSON.parse(box.getAttribute("data-rules"));
    var $ = function (id) { return document.getElementById(id); };
    var m0 = function (v) { return "£" + Math.round(v).toLocaleString("en-GB"); };
    function run() {
      var dob = $("wf-dob").value, home = $("wf-home").value, err = $("wf-error");
      $("wf-with-row").style.display = home === "with" ? "" : "none";
      var inc = Number(String($("wf-income").value).replace(/[\s,£]/g, "") || 0);
      var bad = !dob ? "Enter your date of birth." : !(inc >= 0) ? "Enter your total income for the tax year, or 0." : "";
      err.textContent = bad; err.style.display = bad ? "block" : "none";
      if (bad) { ["wf-amount", "wf-keep", "wf-band", "wf-hmrc"].forEach(function (id) { $(id).textContent = "—"; }); $("wf-label").textContent = "Winter Fuel Payment"; $("wf-note").textContent = ""; return; }
      var r = WinterFuel.calc(R, { dob: dob, home: home, partnerDob: $("wf-pdob").value, benefit: $("wf-benefit").value, income: inc });
      if (!r.eligible) {
        $("wf-amount").textContent = "£0"; $("wf-label").textContent = "not eligible for winter " + R.winter;
        ["wf-keep", "wf-band", "wf-hmrc"].forEach(function (id) { $(id).textContent = "—"; });
        $("wf-note").textContent = "You need to be born on or before " + R.bornByText + "."; return;
      }
      $("wf-amount").textContent = m0(r.amount);
      $("wf-label").textContent = (r.joint ? "for your household, paid to one of you" : "Winter Fuel Payment") + ", winter " + R.winter;
      $("wf-band").textContent = r.older ? "Born before " + R.olderBeforeText : "Born " + R.olderBeforeText + " to " + R.bornByText;
      $("wf-hmrc").textContent = r.back ? "Takes it back (income over " + m0(R.incomeLimit) + ")" : "Nothing to pay back";
      $("wf-keep").textContent = m0(r.keep);
      $("wf-note").textContent = home === "with" && !r.partnerEligible ? "The person you live with isn't eligible (or you didn't enter their date of birth), so it's the amount for living alone." : r.back ? "HMRC usually collects it through your tax code, or your Self Assessment tax bill. You can opt out instead." : "";
    }
    ["wf-dob", "wf-pdob", "wf-income"].forEach(function (id) { $(id).addEventListener("input", run); $(id).addEventListener("change", run); });
    ["wf-home", "wf-benefit"].forEach(function (id) { $(id).addEventListener("change", run); });
    run();
  })();
}
