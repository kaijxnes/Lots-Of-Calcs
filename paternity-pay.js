/* Paternity and shared parental pay calculator (/paternity-pay-calculator/):
   Statutory Paternity Pay (up to 2 weeks) and Statutory Shared Parental
   Pay, each £X a week or 90% of average weekly earnings, whichever is
   lower, and how much shared leave and pay is left after the mother's (or
   adopter's) maternity leave and pay. From GOV.UK's rules in
   data/uk/paternity-pay.json (`R`). The page is built from these same
   functions (tools/build-paternity-pay-pages.js). */
var PaternityPay = (function () {
  "use strict";
  var p2 = function (v) { return Math.round(v * 100) / 100; };
  function weekly(R, awe) { return p2(Math.min(R.weeklyRate, Math.max(0, awe) * R.earningsPct / 100)); }
  /* what's left to share after `leaveTaken` weeks of maternity leave and `payTaken` weeks of maternity pay */
  function shareable(R, leaveTaken, payTaken) {
    return { leave: Math.max(0, Math.min(R.sharedLeaveMax, R.leaveWeeks - Math.max(leaveTaken, R.compulsoryWeeks))), pay: Math.max(0, Math.min(R.sharedPayMax, R.smpWeeks - Math.max(payTaken, R.compulsoryWeeks))) };
  }
  /* mother's SMP: 90% for the first 6 weeks, then the lower of the rate and 90% */
  function smp(R, awe, weeks) {
    var w = Math.max(0, Math.min(R.smpWeeks, weeks)), first = Math.min(w, R.smpHigherWeeks);
    return p2(first * p2(awe * R.earningsPct / 100) + (w - first) * weekly(R, awe));
  }
  /* o: awe (partner's average weekly earnings), paternityWeeks, motherLeave, motherPay, shppWeeks, eligible */
  function calc(R, o) {
    var ok = o.eligible !== false && o.awe >= R.minAverageWeekly, w = weekly(R, o.awe);
    var pw = Math.max(0, Math.min(R.paternityWeeks, Math.round(o.paternityWeeks || 0)));
    var sh = shareable(R, o.motherLeave || 0, o.motherPay || 0), sw = Math.max(0, Math.min(sh.pay, o.shppWeeks || 0));
    return {
      eligible: ok, weekly: ok ? w : 0, paternity: ok ? p2(w * pw) : 0, paternityWeeks: pw, share: sh, shppWeeks: sw,
      shpp: ok ? p2(w * sw) : 0, total: ok ? p2(w * (pw + sw)) : 0, capped: o.awe * R.earningsPct / 100 > R.weeklyRate
    };
  }
  return { weekly: weekly, shareable: shareable, smp: smp, calc: calc };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = PaternityPay;
} else {
  (function () {
    var box = document.getElementById("pp2-tool");
    if (!box) return;
    var R = JSON.parse(box.getAttribute("data-rules"));
    var $ = function (id) { return document.getElementById(id); };
    var num = function (id) { var s = String($(id).value).replace(/[\s,£]/g, ""); return s === "" ? 0 : Number(s); };
    var money = function (v) { return "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
    var plural = function (n, w) { return n + " " + w + (n === 1 ? "" : "s"); };
    var OUT = ["pp2-total", "pp2-weekly", "pp2-pat", "pp2-shpp", "pp2-left"];
    function run() {
      var err = $("pp2-error"), per = +$("pp2-per").value, awe = num("pp2-pay") * per / 52;
      var ids = ["pp2-pay", "pp2-ml", "pp2-mp", "pp2-sw"];
      var bad = !(num("pp2-pay") > 0) ? "Enter your average pay before tax." : ids.some(function (id) { var v = num(id); return !(v >= 0) || v > 1e8; }) ? "Enter amounts of 0 or more." :
        num("pp2-ml") > R.leaveWeeks ? "Maternity leave is up to " + R.leaveWeeks + " weeks." : num("pp2-mp") > R.smpWeeks ? "Maternity pay is paid for up to " + R.smpWeeks + " weeks." : "";
      err.textContent = bad; err.style.display = bad ? "block" : "none";
      if (bad) { OUT.forEach(function (id) { $(id).textContent = "—"; }); $("pp2-label").textContent = "statutory pay before tax"; $("pp2-note").textContent = ""; return; }
      var r = PaternityPay.calc(R, { awe: awe, paternityWeeks: +$("pp2-weeks").value, motherLeave: num("pp2-ml"), motherPay: num("pp2-mp"), shppWeeks: num("pp2-sw"), eligible: $("pp2-26").checked });
      $("pp2-total").textContent = money(r.total);
      $("pp2-label").textContent = r.eligible ? "statutory pay before tax for " + plural(r.paternityWeeks + r.shppWeeks, "week") : "no statutory pay (you can still take the leave)";
      $("pp2-weekly").textContent = r.eligible ? money(r.weekly) + (r.capped ? " (the weekly rate)" : " (90% of earnings)") : "—";
      $("pp2-pat").textContent = money(r.paternity);
      $("pp2-shpp").textContent = money(r.shpp) + (r.shppWeeks < num("pp2-sw") ? " (" + plural(r.share.pay, "week") + " left to share)" : "");
      $("pp2-left").textContent = plural(r.share.leave, "week") + " of leave, " + plural(r.share.pay, "week") + " of pay";
      $("pp2-note").textContent = !r.eligible ? (awe < R.minAverageWeekly ? "Statutory pay needs average earnings of at least £" + R.minAverageWeekly + " a week." : "Statutory pay needs 26 weeks' continuous employment by the 15th week before the due date.") : "";
    }
    ["pp2-pay", "pp2-ml", "pp2-mp", "pp2-sw"].forEach(function (id) { $(id).addEventListener("input", run); });
    ["pp2-per", "pp2-weeks", "pp2-26"].forEach(function (id) { $(id).addEventListener("change", run); });
    run();
  })();
}
