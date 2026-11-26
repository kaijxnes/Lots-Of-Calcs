/* Statutory Sick Pay calculator (/statutory-sick-pay-calculator/): what SSP
   pays for a spell of sickness, from GOV.UK's rules in data/uk/ssp.json
   (passed in as `R`): the weekly rate or 80% of average weekly earnings,
   whichever is lower, paid for each qualifying day (a day you normally
   work) for up to 28 weeks. The page is built from these same functions
   (tools/build-ssp-pages.js). */
var SSP = (function () {
  "use strict";
  /* awe: average weekly earnings; qdays: qualifying days a week (1-7);
     sickDays: qualifying days off sick; usedWeeks: weeks of SSP already
     paid in the same linked period */
  function calc(R, awe, qdays, sickDays, usedWeeks) {
    var weekly = Math.min(R.weeklyRate, Math.max(0, awe) * R.earningsPct / 100);
    var daily = qdays > 0 ? weekly / qdays : 0;
    var left = Math.max(0, R.maxWeeks - (usedWeeks || 0)) * qdays;
    var paidDays = Math.min(Math.max(0, sickDays), left);
    return {
      weekly: weekly, daily: daily, paidDays: paidDays, unpaidDays: Math.max(0, sickDays - paidDays),
      total: Math.round(daily * paidDays * 100) / 100, capped: weekly < R.weeklyRate, daysLeft: Math.max(0, left - paidDays)
    };
  }
  /* average weekly earnings from pay over a number of weeks */
  function awe(pay, weeks) { return weeks > 0 ? pay / weeks : 0; }
  return { calc: calc, awe: awe };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = SSP;
} else {
  (function () {
    var box = document.getElementById("ssp-tool");
    if (!box) return;
    var R = JSON.parse(box.getAttribute("data-rules"));
    var $ = function (id) { return document.getElementById(id); };
    var num = function (id) { var v = Number(String($(id).value).replace(/[\s,£]/g, "")); return isFinite(v) ? v : NaN; };
    var money = function (v) { return "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
    var PER = { week: 1, month: 12 / 52, year: 1 / 52 };
    function run() {
      var err = $("ssp-error"), pay = num("ssp-pay"), per = $("ssp-per").value, q = Math.round(num("ssp-qdays")), sick = Math.round(num("ssp-days")), used = num("ssp-used") || 0;
      var bad = !(pay >= 0) ? "Enter your pay." : !(q >= 1 && q <= 7) ? "Qualifying days are the days you normally work: 1 to 7 a week." : !(sick >= 0) ? "Enter the working days you're off sick." : !(used >= 0 && used <= R.maxWeeks) ? "Weeks already paid must be between 0 and " + R.maxWeeks + "." : "";
      err.textContent = bad; err.style.display = bad ? "block" : "none";
      if (bad) return;
      var awe = pay * PER[per], r = SSP.calc(R, awe, q, sick, used);
      $("ssp-total").textContent = money(r.total);
      $("ssp-label").textContent = "Statutory Sick Pay for " + r.paidDays + " working day" + (r.paidDays === 1 ? "" : "s") + " off sick, before tax";
      $("ssp-weekly").textContent = money(r.weekly) + (r.capped ? " (80% of " + money(awe) + ")" : "");
      $("ssp-daily").textContent = money(r.daily);
      $("ssp-awe").textContent = money(awe);
      $("ssp-left").textContent = r.daysLeft + " day" + (r.daysLeft === 1 ? "" : "s") + " (" + (Math.round(r.daysLeft / q * 10) / 10).toLocaleString("en-GB") + " weeks)";
      $("ssp-note").textContent = r.unpaidDays > 0 ? r.unpaidDays + " of those days are past the " + R.maxWeeks + "-week limit, so SSP doesn't cover them: you may be able to claim Universal Credit or Employment and Support Allowance." : "";
    }
    ["ssp-pay", "ssp-qdays", "ssp-days", "ssp-used"].forEach(function (id) { $(id).addEventListener("input", run); });
    $("ssp-per").addEventListener("change", run);
    run();
  })();
}
