/* Minimum wage checker (/minimum-wage-calculator/): the National Minimum
   Wage or National Living Wage for your age and apprenticeship, and whether
   your pay meets it, from GOV.UK's rates in data/uk/minimum-wage.json
   (passed in as `R`). The rate set is the one in force on the visitor's
   date, so the April rise takes effect without a rebuild. The page is built
   from these same functions (tools/build-minimum-wage-pages.js). */
var MinWage = (function () {
  "use strict";
  /* the rate set in force on a YYYY-MM-DD date */
  function setOn(R, date) {
    var s = null;
    R.rates.forEach(function (r) { if (r.from <= date) s = r; });
    return s || R.rates[0];
  }
  function nextAfter(R, date) {
    for (var i = 0; i < R.rates.length; i++) if (R.rates[i].from > date) return R.rates[i];
    return null;
  }
  /* which band applies: apprentices under 19, or in their first year, get the apprentice rate */
  function band(age, apprentice, firstYear) {
    if (apprentice && (age < 19 || firstYear)) return "apprentice";
    if (age >= 21) return "adult";
    if (age >= 18) return "age18to20";
    return "under18";
  }
  function check(set, age, apprentice, firstYear, hourly) {
    var b = band(age, apprentice, firstYear), min = set[b];
    return { band: b, min: min, ok: hourly >= min - 1e-9, short: Math.max(0, min - hourly) };
  }
  return { setOn: setOn, nextAfter: nextAfter, band: band, check: check };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = MinWage;
} else {
  (function () {
    var box = document.getElementById("mw-tool");
    if (!box) return;
    var R = JSON.parse(box.getAttribute("data-rules"));
    var $ = function (id) { return document.getElementById(id); };
    var num = function (id) { var v = Number(String($(id).value).replace(/[\s,£]/g, "")); return isFinite(v) ? v : NaN; };
    var money = function (v) { return "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
    var NAMES = { adult: "National Living Wage (21 and over)", age18to20: "National Minimum Wage, 18 to 20", under18: "National Minimum Wage, under 18", apprentice: "Apprentice rate" };
    var d = new Date(), today = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
    var sel = $("mw-when");
    /* the choices: rates in force today, and the next set if one is published */
    var cur = MinWage.setOn(R, today), next = MinWage.nextAfter(R, today);
    sel.innerHTML = "";
    [cur, next].forEach(function (s, i) {
      if (!s) return;
      var o = document.createElement("option");
      o.value = s.from; o.textContent = i === 0 ? "Now (" + s.label + " rates)" : "From " + s.label;
      sel.appendChild(o);
    });
    function run() {
      var err = $("mw-error"), age = Math.floor(num("mw-age")), pay = num("mw-pay"), per = $("mw-per").value, hours = num("mw-hours");
      var appr = $("mw-apprentice").value, firstYear = appr === "first";
      $("mw-hours-field").style.display = per === "hour" ? "none" : "";
      var bad = !(age >= 15 && age <= 120) ? "Enter your age (at least school leaving age)." : !(pay >= 0) ? "Enter your pay." : per !== "hour" && !(hours > 0) ? "Enter the hours you work a week." : "";
      err.textContent = bad; err.style.display = bad ? "block" : "none";
      if (bad) return;
      var weeks = { hour: 0, week: 1, month: 12 / 52, year: 1 / 52 }[per];
      var hourly = per === "hour" ? pay : pay * weeks / hours;
      var set = MinWage.setOn(R, sel.value), c = MinWage.check(set, age, appr !== "no", firstYear, hourly);
      $("mw-min").textContent = money(c.min) + " an hour";
      $("mw-label").textContent = NAMES[c.band] + ", " + set.label;
      $("mw-yours").textContent = money(hourly) + " an hour";
      $("mw-status").textContent = c.ok ? "Yes, it meets the minimum" : "No: " + money(c.short) + " an hour short";
      var h = per === "hour" ? (hours > 0 ? hours : 37.5) : hours;
      $("mw-short").textContent = c.ok ? "£0.00" : money(c.short * h) + " a week (" + money(c.short * h * 52) + " a year)";
      $("mw-annual").textContent = money(c.min * h * 52) + " a year on " + h.toLocaleString("en-GB") + " hours a week";
    }
    ["mw-age", "mw-pay", "mw-hours"].forEach(function (id) { $(id).addEventListener("input", run); });
    ["mw-per", "mw-apprentice", "mw-when"].forEach(function (id) { $(id).addEventListener("change", run); });
    run();
  })();
}
