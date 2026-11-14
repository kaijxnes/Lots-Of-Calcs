/* Working days (/working-days/): weekdays between two dates, less the UK
   bank holidays for England and Wales, Scotland or Northern Ireland.

   Bank holidays are GOV.UK's official list (https://www.gov.uk/bank-holidays.json,
   saved in data/holidays/). The generator (tools/build-working-days-pages.js)
   writes them into the calculator page as JSON (#wd-holidays); the year and
   month pages are counted with this same module. Dates are "YYYY-MM-DD"
   strings and are handled in UTC so no time zone shifts a day. */
var WorkingDays = (function () {
  "use strict";
  var REGIONS = { "england-and-wales": "England and Wales", "scotland": "Scotland", "northern-ireland": "Northern Ireland" };
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  function parse(s) { var p = s.split("-"); return Date.UTC(+p[0], +p[1] - 1, +p[2]); }
  function iso(t) { return new Date(t).toISOString().slice(0, 10); }

  /* holidays: [{date, title}] for one region. Counts both end dates. */
  function count(from, to, holidays) {
    var a = parse(from), b = parse(to);
    if (b < a) { var x = a; a = b; b = x; }
    var hol = {};
    holidays.forEach(function (h) { hol[h.date] = h; });
    var r = { calendar: 0, weekend: 0, holidays: [], working: 0 };
    for (var t = a; t <= b; t += 86400000) {
      r.calendar++;
      var dow = new Date(t).getUTCDay();
      if (dow === 0 || dow === 6) { r.weekend++; continue; }
      var h = hol[iso(t)];
      if (h) { r.holidays.push(h); continue; }
      r.working++;
    }
    return r;
  }

  /* "Monday 25 December 2028" */
  function long(s) { var d = new Date(parse(s)); return DAYS[d.getUTCDay()] + " " + d.getUTCDate() + " " + MONTHS[d.getUTCMonth()] + " " + d.getUTCFullYear(); }
  function lastDay(y, m) { return iso(Date.UTC(y, m + 1, 0)); }
  function first(y, m) { return iso(Date.UTC(y, m, 1)); }

  return { REGIONS: REGIONS, MONTHS: MONTHS, DAYS: DAYS, count: count, long: long, lastDay: lastDay, first: first, parse: parse, iso: iso };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = WorkingDays;
} else {
  (function () {
    var box = document.getElementById("wd-tool");
    var data = document.getElementById("wd-holidays");
    if (!box || !data) return;
    var HOL = JSON.parse(data.textContent);
    var W = WorkingDays;
    var $ = function (id) { return document.getElementById(id); };
    var span = HOL._range;

    function calc() {
      var from = $("wd-from").value, to = $("wd-to").value, region = $("wd-region").value, err = $("wd-error");
      if (!from || !to) { err.textContent = "Pick both dates."; err.style.display = "block"; return; }
      var lo = from < to ? from : to, hi = from < to ? to : from;
      if (lo < span[0] || hi > span[1]) { err.textContent = "Bank holidays are known from " + W.long(span[0]) + " to " + W.long(span[1]) + "; outside that, only weekends are taken off."; err.style.display = "block"; }
      else err.style.display = "none";
      var r = W.count(from, to, HOL[region]);
      $("wd-working").textContent = r.working.toLocaleString("en-GB");
      $("wd-calendar").textContent = r.calendar.toLocaleString("en-GB");
      $("wd-weekend").textContent = r.weekend.toLocaleString("en-GB");
      $("wd-bh").textContent = r.holidays.length ? r.holidays.length + " — " + r.holidays.map(function (h) { return h.title + ": " + W.long(h.date).replace(/ \d{4}$/, ""); }).join("; ") : "None";
      $("wd-hours").textContent = (r.working * 7.5).toLocaleString("en-GB") + " hours at 7.5 a day, " + (r.working * 8).toLocaleString("en-GB") + " at 8";
    }

    if (box.getAttribute("data-from-today") === "1") {
      var d = new Date(), t = d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
      $("wd-from").value = t;
      if ($("wd-to").value < t) $("wd-to").value = d.getFullYear() + (t > d.getFullYear() + "-12-24" ? 1 : 0) + "-12-24";
    }
    ["wd-from", "wd-to", "wd-region"].forEach(function (id) { $(id).addEventListener("input", calc); $(id).addEventListener("change", calc); });
    calc();
  })();
}
