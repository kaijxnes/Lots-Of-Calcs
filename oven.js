/* Oven temperature and air fryer converters (tools/build-oven-pages.js).
   The gas mark chart and fan offset come from the page (data attributes),
   which takes them from data/cooking/oven.json. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  function on(ids, fn) { ids.forEach(function (id) { var el = $(id); el.addEventListener("input", fn); el.addEventListener("change", fn); }); fn(); }
  var toF = function (c) { return c * 9 / 5 + 32; }, toC = function (f) { return (f - 32) * 5 / 9; };
  var r0 = Math.round;

  var ov = $("ov-tool");
  if (ov) {
    var GAS = JSON.parse(ov.getAttribute("data-gas")), FAN = Number(ov.getAttribute("data-fan"));
    var gasFor = function (c) {
      if (c < GAS[0].c - 5 || c > GAS[GAS.length - 1].c + 5) return null;
      return GAS.reduce(function (a, g) { return Math.abs(g.c - c) < Math.abs(a.c - c) ? g : a; });
    };
    on(["ov-temp", "ov-unit"], function () {
      var v = parseFloat($("ov-temp").value), unit = $("ov-unit").value, c;
      if (!isFinite(v)) return;
      if (unit === "c") c = v;
      else if (unit === "fan") c = v + FAN;
      else if (unit === "f") c = toC(v);
      else {
        var row = GAS.filter(function (g) { return g.mark === Math.round(v); })[0];
        if (!row) { $("ov-gas").textContent = "Gas marks run from 1 to 9"; return; }
        c = row.c;
      }
      var cr = r0(c), g = gasFor(cr);
      $("ov-c").textContent = cr + "°C";
      $("ov-fan").textContent = r0(c - FAN) + "°C";
      $("ov-f").textContent = r0(toF(c)) + "°F";
      $("ov-gas").textContent = g ? (g.c === cr ? "Gas mark " : "About gas mark ") + g.mark : cr < GAS[0].c ? "Below gas mark 1" : "Above gas mark 9";
      $("ov-chart").textContent = g ? "Gas " + g.mark + " · " + g.c + "°C · " + g.fan + "°C fan · " + g.f + "°F (" + g.word.toLowerCase() + ")" : "—";
    });
  }

  var af = $("af-tool");
  if (af) {
    var LESS = Number(af.getAttribute("data-less")), PCT = af.getAttribute("data-pct").split(",").map(Number), FROZEN = Number(af.getAttribute("data-frozen"));
    on(["af-temp", "af-unit", "af-time", "af-food"], function () {
      var v = parseFloat($("af-temp").value), t = parseFloat($("af-time").value), unit = $("af-unit").value, frozen = $("af-food").value === "frozen";
      if (!isFinite(v)) return;
      var c = unit === "f" ? toC(v) : v, out = frozen ? c : c - LESS;
      /* Fahrenheit to the nearest 5°F, as recipes give it */
      var f5 = Math.round(toF(out) / 5) * 5;
      $("af-out-temp").textContent = unit === "f" ? f5 + "°F (" + r0(out) + "°C)" : r0(out) + "°C (" + f5 + "°F)";
      if (!isFinite(t) || t <= 0) { $("af-out-time").textContent = "—"; return; }
      $("af-out-time").textContent = frozen ? "about " + r0(t * FROZEN / 100) + " minutes" : Math.floor(t * (1 - PCT[1] / 100)) + "–" + r0(t * (1 - PCT[0] / 100)) + " minutes";
    });
  }
})();
