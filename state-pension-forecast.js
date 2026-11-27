/* State Pension forecast calculator (/state-pension-forecast-calculator/):
   the new State Pension from the number of National Insurance qualifying
   years, and what filling a gap with voluntary Class 3 contributions costs
   and adds. Rules from GOV.UK and the Pensions Act 2014 in
   data/uk/state-pension-forecast.json (passed in as `R`):
     - fewer than 10 qualifying years: nothing;
     - 10 to 34: 1/35 of the full rate for each year (section 3(2));
     - 35 or more: the full rate.
   This is the rule for records that started after April 2016; earlier
   records (especially contracted-out years) can come out differently, which
   the page says. An optional date of birth fills in the full tax years left
   before State Pension age, using StatePensionAge (state-pension-age.js).
   The pages are built from these same functions
   (tools/build-state-pension-forecast-pages.js). */
var StatePensionForecast = (function () {
  "use strict";
  var p2 = function (v) { return Math.round(v * 100) / 100; };
  function weekly(R, years) {
    var y = Math.max(0, Math.floor(years));
    return y < R.minYears ? 0 : p2(R.fullWeekly * Math.min(y, R.fullYears) / R.fullYears);
  }
  /* o: years (on the record now), add (years still to come) */
  function calc(R, o) {
    var now = Math.max(0, Math.floor(o.years || 0)), add = Math.max(0, Math.floor(o.add || 0)), total = now + add;
    var w = weekly(R, total), each = R.fullWeekly / R.fullYears, cost = p2(R.class3Weekly * 52);
    return {
      now: now, add: add, total: total, counted: Math.min(total, R.fullYears), weekly: w, year: p2(w * 52), fourWeeks: p2(w * 4),
      nowWeekly: weekly(R, now), short: Math.max(0, R.fullYears - total), toMin: Math.max(0, R.minYears - total),
      eachWeekly: p2(each), eachYear: p2(each * 52), class3Year: cost, payback: cost / (each * 52)
    };
  }
  /* full tax years (6 April to 5 April) from the one `today` is in that end before State Pension age */
  function yearsLeft(today, spa) {
    var t = today.split("-").map(Number), start = t[0] - (t[1] < 4 || (t[1] === 4 && t[2] < 6) ? 1 : 0), n = 0;
    while (true) {
      var end = (start + n + 1) + "-04-05";
      if (end >= spa) break;
      n++;
    }
    return n;
  }
  return { calc: calc, weekly: weekly, yearsLeft: yearsLeft };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = StatePensionForecast;
} else {
  (function () {
    var box = document.getElementById("spf-tool");
    if (!box) return;
    var R = JSON.parse(box.getAttribute("data-rules"));
    var $ = function (id) { return document.getElementById(id); };
    var num = function (id) { var s = String($(id).value).replace(/[\s,]/g, ""); return s === "" ? NaN : Number(s); };
    var money = function (v) { return "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
    var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    var nice = function (s) { var p = s.split("-"); return +p[2] + " " + MONTHS[+p[1] - 1] + " " + p[0]; };
    var OUT = ["spf-weekly", "spf-year", "spf-four", "spf-total", "spf-short", "spf-each", "spf-cost"];
    var pad = function (n) { return (n < 10 ? "0" : "") + n; };
    function today() { var d = new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
    function fromBirth() {
      var dob = $("spf-dob").value, out = $("spf-spa");
      if (!dob || typeof StatePensionAge === "undefined") { out.textContent = ""; return; }
      var s = StatePensionAge.calc({ tables: R.spaTables }, dob, "");
      if (!s || s.early || s.needSex || s.date <= today()) { out.textContent = s ? "You've already reached State Pension age: your award letter shows your amount." : "Enter a date of birth."; return; }
      var left = StatePensionForecast.yearsLeft(today(), s.date);
      $("spf-add").value = left;
      out.textContent = "State Pension age on " + nice(s.date) + ": " + left + " full tax " + (left === 1 ? "year" : "years") + " left, counting this one.";
      run();
    }
    function run() {
      var err = $("spf-error"), years = num("spf-years"), add = num("spf-add");
      var bad = !(years >= 0) || years > 70 || years % 1 ? "Enter your qualifying years (a whole number; your State Pension forecast shows them)." :
        !(add >= 0) || add > 70 || add % 1 ? "Enter the years you expect to add, or 0." : "";
      err.textContent = bad; err.style.display = bad ? "block" : "none";
      if (bad) { OUT.forEach(function (id) { $(id).textContent = "—"; }); $("spf-label").textContent = "a week"; $("spf-note").textContent = ""; return; }
      var r = StatePensionForecast.calc(R, { years: years, add: add });
      $("spf-weekly").textContent = money(r.weekly);
      $("spf-label").textContent = "a week in today's money, from " + Math.min(r.total, R.fullYears) + " qualifying " + (r.total === 1 ? "year" : "years");
      $("spf-year").textContent = money(r.year);
      $("spf-four").textContent = money(r.fourWeeks);
      $("spf-total").textContent = r.total + (r.total > R.fullYears ? " (" + R.fullYears + " count)" : "");
      $("spf-short").textContent = r.short ? r.short + (r.short === 1 ? " year" : " years") : "None: the full rate";
      $("spf-each").textContent = r.toMin ? "Nothing until " + R.minYears + " years, then " + money(StatePensionForecast.weekly(R, R.minYears)) + " a week" : r.short ? money(r.eachWeekly) + " a week (" + money(r.eachYear) + " a year)" : "—";
      $("spf-cost").textContent = r.short ? money(r.class3Year) + ": paid back in about " + (Math.round(r.payback * 10) / 10).toLocaleString("en-GB") + " years" : "—";
      $("spf-note").textContent = r.toMin ? "You need " + R.minYears + " qualifying years to get any new State Pension: " + r.toMin + " more." : "";
    }
    ["spf-years", "spf-add"].forEach(function (id) { $(id).addEventListener("input", run); });
    $("spf-dob").addEventListener("change", fromBirth);
    run();
  })();
}
