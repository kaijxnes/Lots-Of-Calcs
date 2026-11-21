/* The converter on a time-difference page (/timezone/gmt-to-est/): a date
   and a time in the first zone, shown in the second, plus the time now in
   both. Uses the browser's own time zone database (Intl), so daylight
   saving is right for any date. */
(function () {
  var box = document.getElementById("tzp-tool");
  if (!box || !window.Intl) return;
  var $ = function (id) { return document.getElementById(id); };
  var A = box.getAttribute("data-a"), B = box.getAttribute("data-b"), AN = box.getAttribute("data-an"), BN = box.getAttribute("data-bn");
  function offset(tz, d) {
    var p = new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(d);
    var g = {}; p.forEach(function (x) { g[x.type] = Number(x.value); });
    return (Date.UTC(g.year, g.month - 1, g.day, g.hour, g.minute, g.second) - d.getTime()) / 60000;
  }
  function show(d, tz) {
    return new Intl.DateTimeFormat("en-GB", { timeZone: tz, weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true }).format(d);
  }
  var today = new Date();
  $("tzp-date").value = today.toISOString().slice(0, 10);
  function calc() {
    var ds = $("tzp-date").value, ts = $("tzp-time").value;
    if (!ds || !ts) return;
    var y = Number(ds.slice(0, 4)), mo = Number(ds.slice(5, 7)) - 1, da = Number(ds.slice(8, 10)), h = Number(ts.slice(0, 2)), mi = Number(ts.slice(3, 5));
    /* wall time in A → instant: guess with A's offset at that moment, then correct once */
    var guess = Date.UTC(y, mo, da, h, mi) - offset(A, new Date(Date.UTC(y, mo, da, h, mi))) * 60000;
    var inst = Date.UTC(y, mo, da, h, mi) - offset(A, new Date(guess)) * 60000;
    $("tzp-out").textContent = show(new Date(inst), B);
    $("tzp-now").textContent = show(new Date(), A) + " " + AN + " = " + show(new Date(), B) + " " + BN;
  }
  ["tzp-date", "tzp-time"].forEach(function (id) { $(id).addEventListener("input", calc); });
  calc();
})();
