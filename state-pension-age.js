/* State Pension age calculator (/state-pension-age-calculator/): the date
   someone reaches State Pension age under current law, from the tables in
   DWP's State Pension age timetable (data/uk/state-pension-age.json, passed
   in as `R`). Rows either give a date, or an age in years and months; an age
   that lands on a day the month doesn't have falls on the month's last day,
   as the timetable's notes say (31 July 1960 + 66 years 4 months is
   30 November 2026). Dates are ISO strings (YYYY-MM-DD) handled in UTC. The
   pages are built from these same functions
   (tools/build-state-pension-age-pages.js). */
var StatePensionAge = (function () {
  "use strict";
  var pad = function (n) { return (n < 10 ? "0" : "") + n; };
  var iso = function (y, m, d) { return y + "-" + pad(m) + "-" + pad(d); };
  var parts = function (s) { var p = s.split("-"); return [+p[0], +p[1], +p[2]]; };
  var daysIn = function (y, m) { return new Date(Date.UTC(y, m, 0)).getUTCDate(); };
  /* add years and months to a date; a day past the month's end becomes its last day */
  function addMonths(s, years, months) {
    var p = parts(s), t = p[0] * 12 + (p[1] - 1) + years * 12 + months, y = Math.floor(t / 12), m = t % 12 + 1;
    return iso(y, m, Math.min(p[2], daysIn(y, m)));
  }
  /* whole years, months and days from a to b (a <= b) */
  function between(a, b) {
    var x = parts(a), y = parts(b), n = (y[0] - x[0]) * 12 + (y[1] - x[1]);
    if (addMonths(a, 0, n) > b) n--;
    var c = parts(addMonths(a, 0, n)), dys = Math.round((Date.UTC(y[0], y[1] - 1, y[2]) - Date.UTC(c[0], c[1] - 1, c[2])) / 864e5);
    return { years: Math.floor(n / 12), months: n % 12, days: dys };
  }
  function find(rows, dob) {
    for (var i = 0; i < rows.length; i++) if (dob >= rows[i].from && (rows[i].to === null || dob <= rows[i].to)) return rows[i];
    return null;
  }
  /* sex only matters for people born before 6 December 1953 */
  function calc(R, dob, sex) {
    var T = R.tables, first = T.women1995.rows[0].from, menUntil = T.to66.rows[0].from;
    if (!/^\d{4}-\d\d-\d\d$/.test(dob) || dob < "1900-01-01") return null;
    if (dob < first) return { early: true };
    var row = null, table = null;
    if (dob < menUntil) {
      if (sex === "female") { table = dob < T.women2011.rows[0].from ? T.women1995 : T.women2011; row = find(table.rows, dob); }
      else if (sex === "male") { table = { title: "State Pension age of 65 for men, before the rise to 66" }; row = { years: 65, months: 0 }; }
      else return { needSex: true };
    } else {
      ["to66", "to67", "to68"].some(function (k) { var r = find(T[k].rows, dob); if (r) { row = r; table = T[k]; } return !!r; });
    }
    if (!row) return null;
    var date = row.date || addMonths(dob, row.years, row.months);
    return { date: date, age: between(dob, date), rule: table.title, byAge: !row.date, row: row };
  }
  return { calc: calc, addMonths: addMonths, between: between, iso: iso };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = StatePensionAge;
} else {
  (function () {
    var box = document.getElementById("spa-tool");
    if (!box) return;
    var R = JSON.parse(box.getAttribute("data-rules"));
    var $ = function (id) { return document.getElementById(id); };
    var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    var nice = function (s) { var p = s.split("-"); return +p[2] + " " + MONTHS[+p[1] - 1] + " " + p[0]; };
    var plural = function (n, w) { return n + " " + w + (n === 1 ? "" : "s"); };
    var span = function (a) {
      var out = []; if (a.years) out.push(plural(a.years, "year")); if (a.months) out.push(plural(a.months, "month")); if (a.days) out.push(plural(a.days, "day"));
      return out.length ? out.join(", ") : "today";
    };
    var OUT = ["spa-date", "spa-age", "spa-left", "spa-rule"];
    function today() { var d = new Date(); return StatePensionAge.iso(d.getFullYear(), d.getMonth() + 1, d.getDate()); }
    function run() {
      var err = $("spa-error"), d = +$("spa-day").value, m = +$("spa-month").value, y = +$("spa-year").value;
      var valid = y >= 1900 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= new Date(Date.UTC(y, m, 0)).getUTCDate();
      var dob = valid ? StatePensionAge.iso(y, m, d) : "", now = today();
      var r = valid ? StatePensionAge.calc(R, dob, $("spa-sex").value) : null;
      $("spa-sex-row").style.display = valid && dob < R.tables.to66.rows[0].from ? "" : "none";
      var bad = !valid ? "Enter a real date of birth." : dob > now ? "That date of birth is in the future." :
        r && r.early ? "You reached State Pension age before 2010." : r && r.needSex ? "Choose whether the State Pension age for men or women applies." : !r ? "Enter a date of birth from 1900 on." : "";
      err.textContent = bad; err.style.display = bad ? "block" : "none";
      if (bad) { OUT.forEach(function (id) { $(id).textContent = "—"; }); $("spa-label").textContent = "your State Pension age"; return; }
      $("spa-date").textContent = nice(r.date);
      $("spa-label").textContent = (r.date <= now ? "you reached State Pension age" : "you reach State Pension age") + " at " + span(r.age);
      $("spa-age").textContent = span(r.age);
      $("spa-left").textContent = r.date === now ? "Today" : r.date < now ? "Reached " + span(StatePensionAge.between(r.date, now)) + " ago" : span(StatePensionAge.between(now, r.date));
      $("spa-rule").textContent = r.rule + (d === 29 && m === 2 && r.byAge && r.date.slice(5) !== "02-29" ? ". Born on 29 February: GOV.UK's Check your State Pension age service confirms the exact day." : "");
    }
    ["spa-day", "spa-year"].forEach(function (id) { $(id).addEventListener("input", run); });
    ["spa-month", "spa-sex"].forEach(function (id) { $(id).addEventListener("change", run); });
    run();
  })();
}
