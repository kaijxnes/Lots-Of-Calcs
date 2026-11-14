/* Turkey cooking time (/turkey-cooking-time/): how long to roast and
   defrost a turkey, and when to put it in for dinner at a set time.

   UK: Food Standards Scotland's turkey cooking guide (the same bands the
   Food Standards Agency gives), unstuffed in an oven preheated to 180°C:
     under 4.5 kg      45 minutes per kg plus 20
     4.5 to 6.5 kg     40 minutes per kg
     over 6.5 kg       35 minutes per kg
   and defrosting in a fridge at 4°C, about 10 to 12 hours per kg.
   US: USDA Food Safety and Inspection Service timetable for a fresh or
   thawed turkey at 325°F, unstuffed and stuffed; fridge thawing about 24
   hours per 5 pounds; cold water about 30 minutes per pound; let it stand
   20 minutes before carving. The pages (tools/build-turkey-pages.js) use
   this same module. */
var TurkeyTime = (function () {
  "use strict";
  var LB = 0.45359237;

  function ukMinutes(kg) {
    if (kg < 4.5) return 45 * kg + 20;
    if (kg <= 6.5) return 40 * kg;
    return 35 * kg;
  }
  function ukBand(kg) {
    return kg < 4.5 ? "45 minutes per kg plus 20 minutes (under 4.5 kg)" : kg <= 6.5 ? "40 minutes per kg (4.5 to 6.5 kg)" : "35 minutes per kg (over 6.5 kg)";
  }

  /* [from lb, to lb, low hours, high hours] — a weight on a boundary uses the lighter row */
  var US = {
    unstuffed: [[8, 12, 2.75, 3], [12, 14, 3, 3.75], [14, 18, 3.75, 4.25], [18, 20, 4.25, 4.5], [20, 24, 4.5, 5]],
    stuffed: [[8, 12, 3, 3.5], [12, 14, 3.5, 4], [14, 18, 4, 4.25], [18, 20, 4.25, 4.75], [20, 24, 4.75, 5.25]]
  };
  function usRow(lb, stuffed) {
    var t = US[stuffed ? "stuffed" : "unstuffed"];
    if (lb < 8 || lb > 24) return null;
    for (var i = 0; i < t.length; i++) if (lb <= t[i][1]) return t[i];
    return null;
  }

  var REST = 20; /* minutes standing before carving (USDA) */

  function plural(v, w) { return v + " " + w + (v === 1 ? "" : "s"); }
  /* 200 -> "3 hours 20 minutes" */
  function hm(mins) {
    mins = Math.round(mins);
    var h = Math.floor(mins / 60), m = mins - h * 60;
    if (!h) return plural(m, "minute");
    return plural(h, "hour") + (m ? " " + plural(m, "minute") : "");
  }
  var FRAC = { 0: "", 0.25: "¼", 0.5: "½", 0.75: "¾" };
  function hrs(h) { var w = Math.floor(h), f = FRAC[h - w]; return (w ? w : "") + f; }
  /* [2.75, 3] -> "2¾ to 3 hours" */
  function range(row) { return hrs(row[2]) + " to " + hrs(row[3]) + " hours"; }

  /* Fridge defrosting in hours: UK 10-12 per kg; US 24 per 5 lb */
  function ukDefrost(kg) { return [10 * kg, 12 * kg]; }
  function usDefrost(lb) { return 24 * lb / 5; }
  function usColdWater(lb) { return 0.5 * lb; }
  function days(h) {
    if (h < 24) return Math.round(h) + " hours";
    var d = Math.round(h / 24 * 2) / 2;
    return (d % 1 ? Math.floor(d) + "½" : d) + " day" + (d === 1 ? "" : "s");
  }

  /* [50, 60] -> "2 to 2½ days" */
  function daysRange(r) {
    var a = days(r[0]), b = days(r[1]);
    if (a === b) return a;
    var ua = a.replace(/^[\d½]+ /, ""), ub = b.replace(/^[\d½]+ /, "");
    return (ua.replace(/s$/, "") === ub.replace(/s$/, "") ? a.split(" ")[0] : a) + " to " + b;
  }

  return { daysRange: daysRange, LB: LB, ukMinutes: ukMinutes, ukBand: ukBand, US: US, usRow: usRow, REST: REST, hm: hm, hrs: hrs, range: range, ukDefrost: ukDefrost, usDefrost: usDefrost, usColdWater: usColdWater, days: days };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = TurkeyTime;
} else {
  (function () {
    var box = document.getElementById("tk-tool");
    if (!box) return;
    var $ = function (id) { return document.getElementById(id); };
    var T = TurkeyTime;
    function clock(d) { return ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2); }

    function calc() {
      var w = Number($("tk-weight").value), unit = $("tk-unit").value, method = $("tk-method").value, err = $("tk-error");
      var kg = unit === "kg" ? w : w * T.LB, lb = kg / T.LB;
      if (!(w > 0) || kg > 15) { err.textContent = "Enter the turkey's weight (up to 15 kg / 33 lb)."; err.style.display = "block"; return; }
      var cookMins, timeText, note;
      if (method === "uk") {
        cookMins = T.ukMinutes(kg);
        timeText = T.hm(cookMins);
        note = "At 180°C (Gas Mark 4), unstuffed: " + T.ukBand(kg) + ".";
      } else {
        var row = T.usRow(lb, method === "us-stuffed");
        if (!row) { err.textContent = "The USDA timetable covers whole turkeys from 8 to 24 lb (3.6 to 10.9 kg)."; err.style.display = "block"; return; }
        cookMins = row[3] * 60;
        timeText = T.range(row);
        note = "At 325°F (about 160°C), " + (method === "us-stuffed" ? "stuffed" : "unstuffed") + ", for " + row[0] + " to " + row[1] + " lb.";
      }
      err.style.display = "none";
      $("tk-time").textContent = timeText;
      $("tk-note").textContent = note;
      var fridge = method === "uk" ? T.ukDefrost(kg) : null;
      $("tk-defrost").textContent = method === "uk" ? T.daysRange(fridge) + " in the fridge" : T.days(T.usDefrost(lb)) + " in the fridge, or " + T.hm(T.usColdWater(lb) * 60) + " in cold water";
      var serve = $("tk-serve").value;
      if (serve) {
        var p = serve.split(":"), at = new Date(2000, 0, 1, Number(p[0]), Number(p[1]));
        var start = new Date(at.getTime() - (cookMins + T.REST) * 60000);
        $("tk-start").textContent = clock(start) + (start.getDate() !== 1 ? " the day before" : "");
      } else $("tk-start").textContent = "—";
    }

    ["tk-weight", "tk-serve"].forEach(function (id) { $(id).addEventListener("input", calc); });
    $("tk-unit").addEventListener("change", function () {
      var w = Number($("tk-weight").value);
      if (w > 0) $("tk-weight").value = $("tk-unit").value === "kg" ? Math.round(w * T.LB * 10) / 10 : Math.round(w / T.LB);
      $("tk-method").value = $("tk-unit").value === "kg" ? "uk" : "us-unstuffed";
      calc();
    });
    $("tk-method").addEventListener("change", calc);
    calc();
  })();
}
