/* Day rate calculator (/day-rate-calculator/): what a contractor day rate is
   worth as a yearly salary, and the day rate that matches a salary.

   A contractor is only paid for the days they bill. In a year of 52 weeks
   of 5 days (260 days), an employee is paid for holiday (5.6 weeks, at most
   28 days) and gets an employer pension; a contractor isn't, and also has
   gaps between contracts. So:
     billable days = 260 − holiday days − other unpaid days
     contract income = day rate × billable days
     equivalent salary = the salary whose salary + employer pension equals
       the contract income, with the pension on qualifying earnings
       (R.pension.lower to R.pension.upper), as most schemes do.
   This compares money before tax; the contractor calculator shows take-home.
   Figures (`R`) come from data/uk/rates-2026-27.json and
   data/uk/employer-cost.json. The pages are built from these same functions
   (tools/build-day-rate-pages.js). */
var DayRate = (function () {
  "use strict";
  var p2 = function (v) { return Math.round(v * 100) / 100; };
  function pension(R, salary, pct) { return pct / 100 * Math.min(Math.max(0, salary - R.pension.lower), R.pension.upper - R.pension.lower); }
  function days(R, o) { return Math.max(0, R.weekdays - (o.holiday === undefined ? R.holidayDays : o.holiday) - (o.other || 0)); }
  /* salary + pension(salary) = income, solved by bisection (it only rises) */
  function salaryFor(R, income, pct) {
    var lo = 0, hi = Math.max(0, income);
    for (var i = 0; i < 60; i++) { var mid = (lo + hi) / 2; if (mid + pension(R, mid, pct) < income) lo = mid; else hi = mid; }
    return p2(hi);
  }
  /* o: rate (a day), holiday, other (unpaid days), pct (employer pension %), hours (a day) */
  function fromRate(R, o) {
    var d = days(R, o), income = p2((o.rate || 0) * d), pct = o.pct === undefined ? R.pension.employerMinPct : o.pct, s = salaryFor(R, income, pct);
    return { days: d, income: income, salary: s, pension: p2(income - s), month: p2(s / 12), hourly: o.hours ? p2((o.rate || 0) / o.hours) : 0, simple: p2((o.rate || 0) * R.weekdays) };
  }
  /* o: salary, holiday, other, pct, hours */
  function fromSalary(R, o) {
    var d = days(R, o), pct = o.pct === undefined ? R.pension.employerMinPct : o.pct, s = Math.max(0, o.salary || 0), total = s + pension(R, s, pct);
    var rate = d ? p2(total / d) : 0;
    return { days: d, total: p2(total), pension: p2(total - s), rate: rate, hourly: o.hours ? p2(rate / o.hours) : 0, simple: p2(s / R.weekdays) };
  }
  return { fromRate: fromRate, fromSalary: fromSalary, days: days };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = DayRate;
} else {
  (function () {
    var box = document.getElementById("dr-tool");
    if (!box) return;
    var R = JSON.parse(box.getAttribute("data-rules"));
    var $ = function (id) { return document.getElementById(id); };
    var num = function (id) { var s = String($(id).value).replace(/[\s,£%]/g, ""); return s === "" ? 0 : Number(s); };
    var m0 = function (v) { return "£" + Math.round(v).toLocaleString("en-GB"); };
    var m2 = function (v) { return "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
    var OUT = ["dr-main", "dr-a", "dr-b", "dr-c", "dr-days", "dr-simple"];
    function run() {
      var mode = $("dr-mode").value, err = $("dr-error"), amt = num("dr-amount"), hol = num("dr-holiday"), other = num("dr-other"), pct = num("dr-pct"), hours = num("dr-hours");
      $("dr-amount-label").textContent = mode === "rate" ? "Day rate" : "Salary a year";
      var bad = !(amt > 0) || amt > 1e7 ? "Enter " + (mode === "rate" ? "a day rate." : "a salary.") : !(hol >= 0) || !(other >= 0) || hol + other >= R.weekdays ? "Enter holiday and other unpaid days that leave some working days." : !(pct >= 0) || pct > 100 ? "Enter an employer pension percentage, or 0." : !(hours > 0) || hours > 24 ? "Enter the hours in a working day." : "";
      err.textContent = bad; err.style.display = bad ? "block" : "none";
      if (bad) { OUT.forEach(function (id) { $(id).textContent = "—"; }); return; }
      var o = { holiday: hol, other: other, pct: pct, hours: hours };
      if (mode === "rate") {
        o.rate = amt; var r = DayRate.fromRate(R, o);
        $("dr-main").textContent = m0(r.salary); $("dr-label").textContent = "equivalent salary a year";
        $("dr-a-label").textContent = "Contract income a year"; $("dr-a").textContent = m0(r.income);
        $("dr-b-label").textContent = "Employer pension it covers"; $("dr-b").textContent = m0(r.pension);
        $("dr-c-label").textContent = "An hour"; $("dr-c").textContent = m2(r.hourly);
        $("dr-simple").textContent = m0(r.simple);
      } else {
        o.salary = amt; var s = DayRate.fromSalary(R, o);
        $("dr-main").textContent = m2(s.rate); $("dr-label").textContent = "day rate to match it";
        $("dr-a-label").textContent = "Salary and employer pension"; $("dr-a").textContent = m0(s.total);
        $("dr-b-label").textContent = "Of which employer pension"; $("dr-b").textContent = m0(s.pension);
        $("dr-c-label").textContent = "An hour"; $("dr-c").textContent = m2(s.hourly);
        $("dr-simple").textContent = m2(s.simple) + " a day";
      }
      $("dr-days").textContent = DayRate.days(R, o) + " days";
    }
    ["dr-amount", "dr-holiday", "dr-other", "dr-pct", "dr-hours"].forEach(function (id) { $(id).addEventListener("input", run); });
    $("dr-mode").addEventListener("change", function () { $("dr-amount").value = $("dr-mode").value === "rate" ? 400 : 60000; run(); });
    run();
  })();
}
