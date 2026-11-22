/* The time and date tools (tools/build-time-pages.js): hours between two
   times, a weekly timesheet, dates from today, ISO week numbers and the day
   of the week. Each widget runs only if its box is on the page. Dates are the
   visitor's own local dates, so "today" is right wherever they are. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var DAY = 86400000;
  function on(ids, fn) { ids.forEach(function (id) { var el = $(id); if (el) { el.addEventListener("input", fn); el.addEventListener("change", fn); } }); fn(); }
  function mins(v) { if (!v) return null; var p = v.split(":"); return Number(p[0]) * 60 + Number(p[1]); }
  function hm(m) { var h = Math.floor(m / 60), r = m % 60; return h + " hour" + (h === 1 ? "" : "s") + (r ? " " + r + " minute" + (r === 1 ? "" : "s") : ""); }
  function dec(m) { return (Math.round(m / 60 * 100) / 100).toLocaleString("en-GB"); }
  function money(v) { return v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function num(id) { var v = parseFloat($(id).value); return isFinite(v) && v >= 0 ? v : 0; }
  /* local midnight, so day arithmetic isn't thrown by clock changes */
  function day(y, m, d) { return new Date(y, m, d, 12); }
  function parseDate(v) { if (!v) return null; var p = v.split("-"); return day(+p[0], +p[1] - 1, +p[2]); }
  function today() { var n = new Date(); return day(n.getFullYear(), n.getMonth(), n.getDate()); }
  function long(d) { return DAYS[d.getDay()] + " " + d.getDate() + " " + MONTHS[d.getMonth()] + " " + d.getFullYear(); }
  function isoStr(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function diffDays(a, b) { return Math.round((b - a) / DAY); }
  function isoWeek(d) {
    var t = day(d.getFullYear(), d.getMonth(), d.getDate() + 3 - ((d.getDay() + 6) % 7));
    var jan4 = day(t.getFullYear(), 0, 4);
    return { year: t.getFullYear(), week: 1 + Math.round((diffDays(jan4, t) - 3 + ((jan4.getDay() + 6) % 7)) / 7) };
  }

  /* hours between two times */
  if ($("hr-tool")) on(["hr-start", "hr-end", "hr-break", "hr-rate"], function () {
    var a = mins($("hr-start").value), b = mins($("hr-end").value);
    if (a === null || b === null) return;
    var span = (b - a + 1440) % 1440 || 1440, worked = Math.max(0, span - num("hr-break")), rate = num("hr-rate");
    $("hr-total").textContent = hm(worked);
    $("hr-decimal").textContent = dec(worked);
    $("hr-span").textContent = hm(span) + (b <= a ? " (into the next day)" : "");
    $("hr-week").textContent = hm(worked * 5);
    $("hr-pay").textContent = rate ? money(worked / 60 * rate) : "—";
  });

  /* weekly timesheet */
  if ($("ts-tool")) {
    var ids = ["ts-rate"];
    for (var i = 0; i < 7; i++) ids.push("ts-s" + i, "ts-e" + i, "ts-b" + i);
    on(ids, function () {
      var total = 0;
      for (var i = 0; i < 7; i++) {
        var a = mins($("ts-s" + i).value), b = mins($("ts-e" + i).value);
        if (a === null || b === null) { $("ts-t" + i).textContent = "—"; continue; }
        var w = Math.max(0, ((b - a + 1440) % 1440 || 1440) - num("ts-b" + i));
        total += w;
        $("ts-t" + i).textContent = Math.floor(w / 60) + ":" + String(w % 60).padStart(2, "0");
      }
      var rate = num("ts-rate");
      $("ts-total").textContent = hm(total);
      $("ts-decimal").textContent = dec(total);
      $("ts-pay").textContent = rate ? money(total / 60 * rate) : "—";
    });
  }

  /* dates from today */
  if ($("df-tool")) {
    on(["df-n", "df-unit", "df-dir", "df-start"], function () {
      var start = parseDate($("df-start").value) || today(), n = Math.floor(num("df-n")), unit = $("df-unit").value, dir = Number($("df-dir").value);
      var d;
      if (unit === "days" || unit === "weeks") d = day(start.getFullYear(), start.getMonth(), start.getDate() + dir * n * (unit === "weeks" ? 7 : 1));
      else {
        var months = dir * n * (unit === "years" ? 12 : 1), y = start.getFullYear(), m = start.getMonth() + months;
        var last = new Date(y, m + 1, 0).getDate();
        d = day(y, m, Math.min(start.getDate(), last));
      }
      var fromToday = !$("df-start").value;
      $("df-date").textContent = long(d);
      $("df-label").textContent = n + " " + (n === 1 ? unit.slice(0, -1) : unit) + (dir > 0 ? (fromToday ? " from today" : " after " + long(start)) : (fromToday ? " ago" : " before " + long(start)));
      var gap = Math.abs(diffDays(start, d));
      $("df-detail").textContent = (fromToday ? "Today is " + long(start) + ". " : "") + gap + " day" + (gap === 1 ? "" : "s") + (gap >= 7 ? " (" + Math.floor(gap / 7) + " weeks" + (gap % 7 ? " and " + (gap % 7) + " days" : "") + ")" : "") + (dir > 0 ? " later" : " earlier") + ".";
    });
  }

  /* week numbers */
  if ($("wk-tool")) {
    var now = isoWeek(today());
    $("wk-now").textContent = "Week " + now.week;
    $("wk-now-label").textContent = "this week, " + now.year + " (ISO 8601)";
    if (!$("wk-date").value) $("wk-date").value = isoStr(today());
    on(["wk-date"], function () {
      var d = parseDate($("wk-date").value);
      if (!d) return;
      var w = isoWeek(d), mon = day(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7)), sun = day(mon.getFullYear(), mon.getMonth(), mon.getDate() + 6);
      $("wk-num").textContent = "Week " + w.week + " of " + w.year;
      $("wk-range").textContent = long(mon) + " to " + long(sun);
      $("wk-day").textContent = DAYS[d.getDay()];
    });
  }

  /* day of the week */
  if ($("dw-tool")) on(["dw-date"], function () {
    var d = parseDate($("dw-date").value);
    if (!d) return;
    var t = today(), gap = diffDays(t, d), doy = diffDays(day(d.getFullYear(), 0, 1), d) + 1;
    var leap = new Date(d.getFullYear(), 1, 29).getDate() === 29;
    $("dw-day").textContent = DAYS[d.getDay()];
    $("dw-label").textContent = d.getDate() + " " + MONTHS[d.getMonth()] + " " + d.getFullYear();
    $("dw-week").textContent = "Week " + isoWeek(d).week + " of " + isoWeek(d).year;
    $("dw-doy").textContent = "Day " + doy + " of " + (leap ? 366 : 365);
    $("dw-from").textContent = gap === 0 ? "Today" : Math.abs(gap).toLocaleString("en-GB") + " day" + (Math.abs(gap) === 1 ? "" : "s") + (gap > 0 ? " from now" : " ago");
  });
})();
