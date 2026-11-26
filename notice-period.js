/* Notice period calculator (/notice-period-calculator/): the statutory
   minimum notice an employer must give (a week from 1 month's service, then
   a week per complete year from 2 years, up to 12 weeks) or an employee
   must give (a week after more than a month), the longer of that and the
   contract, and the last day of notice, counting from the day after notice
   is given. From GOV.UK's rules in data/uk/notice-period.json (`R`). Dates
   are ISO strings (YYYY-MM-DD) handled in UTC. The page is built from these
   same functions (tools/build-notice-period-pages.js). */
var NoticePeriod = (function () {
  "use strict";
  var pad = function (n) { return (n < 10 ? "0" : "") + n; };
  var iso = function (d) { return d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate()); };
  var date = function (s) { var p = s.split("-"); return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])); };
  function addDays(s, n) { var d = date(s); d.setUTCDate(d.getUTCDate() + n); return iso(d); }
  function addMonths(s, n) {
    var p = s.split("-"), t = +p[0] * 12 + (+p[1] - 1) + n, y = Math.floor(t / 12), m = t % 12 + 1;
    return y + "-" + pad(m) + "-" + pad(Math.min(+p[2], new Date(Date.UTC(y, m, 0)).getUTCDate()));
  }
  /* complete months and years of service from start to the day notice is given */
  function service(start, on) {
    var a = start.split("-"), b = on.split("-"), months = (+b[0] - +a[0]) * 12 + (+b[1] - +a[1]);
    if (addMonths(start, months) > on) months--;
    return { months: Math.max(0, months), years: Math.max(0, Math.floor(months / 12)) };
  }
  /* statutory minimum in weeks: who = "employer" | "employee" */
  function statutory(R, who, sv) {
    if (who === "employee") return sv.months >= R.employee.minMonths ? R.employee.weeks : 0;
    if (sv.months < R.employer.minMonths) return 0;
    if (sv.years < R.employer.oneWeekUntilYears) return 1;
    return Math.min(R.employer.maxWeeks, sv.years);
  }
  /* contract: { n, unit: "weeks" | "months" } (n = 0 for none) */
  function calc(R, o) {
    if (!(o.start <= o.given)) return null;
    var sv = service(o.start, o.given), weeks = statutory(R, o.who, sv);
    var statEnd = weeks ? addDays(o.given, weeks * 7) : null;
    var c = o.contract && o.contract.n > 0 ? o.contract : null;
    var contractEnd = c ? (c.unit === "months" ? addMonths(o.given, c.n) : addDays(o.given, Math.round(c.n * 7))) : null;
    var useContract = !!contractEnd && (!statEnd || contractEnd > statEnd), end = useContract ? contractEnd : statEnd;
    var days = end ? Math.round((date(end) - date(o.given)) / 864e5) : 0;
    return {
      service: sv, statWeeks: weeks, statEnd: statEnd, contractEnd: contractEnd, useContract: useContract,
      first: end ? addDays(o.given, 1) : null, end: end, days: days, pay: o.weeklyPay > 0 ? Math.round(o.weeklyPay * days / 7 * 100) / 100 : 0
    };
  }
  return { calc: calc, statutory: statutory, service: service, addDays: addDays, addMonths: addMonths };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = NoticePeriod;
} else {
  (function () {
    var box = document.getElementById("np-tool");
    if (!box) return;
    var R = JSON.parse(box.getAttribute("data-rules"));
    var $ = function (id) { return document.getElementById(id); };
    var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var nice = function (s) { var p = s.split("-"), d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])); return DAYS[d.getUTCDay()] + " " + +p[2] + " " + MONTHS[+p[1] - 1] + " " + p[0]; };
    var plural = function (n, w) { return n + " " + w + (n === 1 ? "" : "s"); };
    var money = function (v) { return "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
    var OUT = ["np-end", "np-stat", "np-contract", "np-service", "np-pay-out"];
    var today = function () { var d = new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); };
    if (!$("np-given").value) $("np-given").value = today();
    function run() {
      var err = $("np-error"), start = $("np-start").value, given = $("np-given").value, who = $("np-who").value;
      var n = Number($("np-cn").value || 0), weekly = Number(String($("np-pay").value).replace(/[\s,£]/g, "") || 0);
      var ok = /^\d{4}-\d\d-\d\d$/.test(start) && /^\d{4}-\d\d-\d\d$/.test(given);
      var bad = !ok ? "Enter the date you started and the date notice is given." : start > given ? "The start date is after the notice date." :
        !(n >= 0) || n > 120 ? "Enter the notice in your contract (0 if it doesn't say)." : !(weekly >= 0) ? "Enter weekly pay as 0 or more." : "";
      err.textContent = bad; err.style.display = bad ? "block" : "none";
      if (bad) { OUT.forEach(function (id) { $(id).textContent = "—"; }); $("np-label").textContent = "last day of notice"; return; }
      var r = NoticePeriod.calc(R, { who: who, start: start, given: given, contract: { n: n, unit: $("np-cu").value }, weeklyPay: weekly });
      $("np-end").textContent = r.end ? nice(r.end) : "No minimum";
      $("np-label").textContent = r.end ? "last day of notice: " + plural(r.days, "day") + " from " + nice(r.first) + (r.useContract ? " (your contract)" : " (the legal minimum)") :
        (who === "employer" ? "no statutory notice in the first month" : "no statutory notice in the first month: check your contract");
      $("np-stat").textContent = r.statWeeks ? plural(r.statWeeks, "week") + " (to " + nice(r.statEnd) + ")" : "none";
      $("np-contract").textContent = r.contractEnd ? nice(r.contractEnd) : "not given";
      $("np-service").textContent = r.service.years ? plural(r.service.years, "year") + (r.service.months % 12 ? ", " + plural(r.service.months % 12, "month") : "") : plural(r.service.months, "complete month");
      $("np-pay-out").textContent = r.pay ? money(r.pay) : "—";
      $("np-who-note").textContent = who === "employer" ? "Your employer must give you at least the statutory notice or your contract's, whichever is longer." : "You must give at least a week once you've worked there more than a month, or more if your contract says so.";
    }
    ["np-start", "np-given", "np-cn", "np-pay"].forEach(function (id) { $(id).addEventListener("input", run); });
    ["np-who", "np-cu"].forEach(function (id) { $(id).addEventListener("change", run); });
    run();
  })();
}
