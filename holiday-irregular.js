/* Irregular hours holiday calculator (/irregular-hours-holiday-calculator/):
   the holiday irregular-hours and part-year workers build up in each pay
   period (12.07% of the hours worked, rounded to the nearest hour), and
   rolled-up holiday pay (12.07% of the pay for the period), from GOV.UK's
   rules in data/uk/holiday-irregular.json (passed in as `R`). A contract
   that gives more than 5.6 weeks a year uses a bigger percentage: weeks of
   holiday ÷ the weeks left to work × 100. The page is built from these same
   functions (tools/build-irregular-holiday-pages.js). */
var IrregularHoliday = (function () {
  "use strict";
  /* the accrual percentage for a year's holiday in weeks; 5.6 weeks gives 12.07 */
  function pct(R, weeks) {
    if (!(weeks > 0) || Math.abs(weeks - R.statutoryWeeks) < 1e-9) return R.pct;
    return Math.round(weeks / (R.yearWeeks - weeks) * 10000) / 100;
  }
  /* holiday hours for the hours worked in a pay period: the exact figure and
     GOV.UK's rounding (under half an hour rounds down, half an hour or more up) */
  function hours(worked, p) {
    var exact = Math.round(worked / 100 * p * 1e6) / 1e6;
    return { exact: exact, rounded: Math.floor(exact + 0.5) };
  }
  /* rolled-up holiday pay: the percentage of the period's pay, to the penny
     (worked in whole pence and hundredths of a percent, so no float drift) */
  function rolled(pay, p) {
    var pence = Math.round(pay * 100), pc = Math.round(p * 100);
    return Math.floor((pence * pc + 5000) / 10000) / 100;
  }
  /* GOV.UK's worked examples round pay ÷ 100 to the penny before multiplying,
     which can come out a few pence different; kept to check them against */
  function rolledGovuk(pay, p) {
    var pounds = Math.round(pay), pc = Math.round(p * 100);
    return Math.floor((pounds * pc + 50) / 100) / 100;
  }
  var PERIODS = { week: 52, fortnight: 26, four: 13, month: 12 };
  function calc(R, worked, pay, perHour, period, weeks) {
    var p = pct(R, weeks), h = hours(worked, p), total = perHour ? worked * pay : pay;
    total = Math.round(total * 100) / 100;
    var hp = rolled(total, p), n = PERIODS[period] || 52;
    return {
      pct: p, exact: h.exact, holiday: h.rounded, pay: total, rolled: hp, withHoliday: total + hp,
      yearHours: h.exact * n, yearRolled: hp * n, hourly: worked > 0 ? total / worked : 0, periods: n
    };
  }
  return { pct: pct, hours: hours, rolled: rolled, rolledGovuk: rolledGovuk, calc: calc, PERIODS: PERIODS };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = IrregularHoliday;
} else {
  (function () {
    var box = document.getElementById("ih-tool");
    if (!box) return;
    var R = JSON.parse(box.getAttribute("data-rules"));
    var $ = function (id) { return document.getElementById(id); };
    var num = function (id) { var s = String($(id).value).replace(/[\s,£]/g, ""); return s === "" ? NaN : Number(s); };
    var money = function (v) { return "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
    var hrs = function (v) { var r = Math.round(v * 100) / 100; return r.toLocaleString("en-GB") + (r === 1 ? " hour" : " hours"); };
    var OUT = ["ih-holiday", "ih-pct", "ih-rolled", "ih-total", "ih-year-hours", "ih-year-pay"];
    function run() {
      var err = $("ih-error"), worked = num("ih-hours"), pay = num("ih-pay"), weeks = num("ih-weeks");
      var bad = !(worked >= 0) ? "Enter the hours you worked in the pay period." :
        worked > 744 ? "That's more hours than there are in a month." :
        !(pay >= 0) ? "Enter your pay (0 if you only want the holiday hours)." :
        !(weeks >= R.statutoryWeeks) ? "Your contract can't give less than " + R.statutoryWeeks + " weeks of holiday a year." :
        weeks > 26 ? "Enter the weeks of holiday a year in your contract." : "";
      err.textContent = bad; err.style.display = bad ? "block" : "none";
      if (bad) { OUT.forEach(function (id) { $(id).textContent = "—"; }); $("ih-label").textContent = "holiday earned this pay period"; return; }
      var r = IrregularHoliday.calc(R, worked, pay, $("ih-per").value === "hour", $("ih-freq").value, weeks);
      $("ih-holiday").textContent = hrs(r.holiday);
      $("ih-label").textContent = "holiday earned for " + hrs(worked) + " of work (" + hrs(r.exact) + " before rounding)";
      $("ih-pct").textContent = r.pct.toLocaleString("en-GB") + "% of hours worked";
      $("ih-rolled").textContent = money(r.rolled);
      $("ih-total").textContent = money(r.withHoliday);
      $("ih-year-hours").textContent = hrs(r.yearHours);
      $("ih-year-pay").textContent = money(r.yearRolled);
    }
    ["ih-hours", "ih-pay", "ih-weeks"].forEach(function (id) { $(id).addEventListener("input", run); });
    ["ih-per", "ih-freq"].forEach(function (id) { $(id).addEventListener("change", run); });
    run();
  })();
}
