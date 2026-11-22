/* Square footage and speed/distance/time calculators
   (tools/build-measure-pages.js). Exact unit definitions only. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  function on(ids, fn) { ids.forEach(function (id) { var el = $(id); el.addEventListener("input", fn); el.addEventListener("change", fn); }); fn(); }
  function num(id) { var v = parseFloat($(id).value); return isFinite(v) && v > 0 ? v : 0; }
  function f(v, d) { return v.toLocaleString("en-GB", { maximumFractionDigits: d === undefined ? 2 : d }); }

  if ($("ar-tool")) {
    var M = { ft: 0.3048, "in": 0.0254, yd: 0.9144, m: 1, cm: 0.01 };
    on(["ar-shape", "ar-unit", "ar-a", "ar-b", "ar-n", "ar-price"], function () {
      var shape = $("ar-shape").value, unit = $("ar-unit").value, k = M[unit];
      $("ar-al").textContent = shape === "circle" ? "Diameter" : shape === "tri" ? "Base" : "Length";
      $("ar-bl").textContent = shape === "tri" ? "Height" : "Width";
      $("ar-b").closest(".field").hidden = shape === "circle";
      var a = num("ar-a") * k, b = num("ar-b") * k;
      var m2 = (shape === "circle" ? Math.PI * a * a / 4 : shape === "tri" ? a * b / 2 : a * b) * Math.max(1, Math.floor(num("ar-n")));
      var sqft = m2 / (0.3048 * 0.3048);
      $("ar-sqft").textContent = f(sqft) + " sq ft";
      $("ar-sqm").textContent = f(m2) + " m²";
      $("ar-sqyd").textContent = f(sqft / 9) + " sq yd";
      $("ar-acre").textContent = f(sqft / 43560, 4);
      var price = num("ar-price");
      $("ar-cost").textContent = price ? f((unit === "m" || unit === "cm" ? m2 : sqft) * price) : "—";
    });
  }

  if ($("sd-tool")) {
    var DU = { km: 1000, mi: 1609.344, m: 1, nmi: 1852 }, SU = { kmh: 1000 / 3600, mph: 1609.344 / 3600, ms: 1, kn: 1852 / 3600 };
    var SL = { kmh: "km/h", mph: "mph", ms: "m/s", kn: "knots" }, DL = { km: "km", mi: "miles", m: "metres", nmi: "nautical miles" };
    function hms(s) {
      var h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), sec = Math.round(s % 60);
      if (sec === 60) { m++; sec = 0; } if (m === 60) { h++; m = 0; }
      return [h ? h + " hour" + (h === 1 ? "" : "s") : "", m ? m + " minute" + (m === 1 ? "" : "s") : "", sec && h === 0 ? sec + " second" + (sec === 1 ? "" : "s") : ""].filter(Boolean).join(" ") || "0 minutes";
    }
    on(["sd-solve", "sd-d", "sd-du", "sd-s", "sd-su", "sd-h", "sd-m", "sd-sec"], function () {
      var solve = $("sd-solve").value;
      $("sd-drow").querySelector("input").closest(".field").hidden = solve === "dist";
      $("sd-srow").querySelector("input").closest(".field").hidden = solve === "speed";
      $("sd-trow").hidden = solve === "time";
      var d = num("sd-d") * DU[$("sd-du").value], v = num("sd-s") * SU[$("sd-su").value];
      var t = num("sd-h") * 3600 + num("sd-m") * 60 + num("sd-sec");
      if (solve === "time") {
        if (!d || !v) return;
        var s = d / v;
        $("sd-out").textContent = hms(s); $("sd-label").textContent = "journey time";
        $("sd-alt").textContent = f(s / 3600, 3) + " hours";
      } else if (solve === "speed") {
        if (!d || !t) return;
        var ms = d / t, u = $("sd-su").value;
        $("sd-out").textContent = f(ms / SU[u]) + " " + SL[u]; $("sd-label").textContent = "average speed";
        $("sd-alt").textContent = ["kmh", "mph", "ms", "kn"].filter(function (x) { return x !== u; }).map(function (x) { return f(ms / SU[x]) + " " + SL[x]; }).join(" · ");
      } else {
        if (!v || !t) return;
        var m = v * t, du = $("sd-du").value;
        $("sd-out").textContent = f(m / DU[du]) + " " + DL[du]; $("sd-label").textContent = "distance";
        $("sd-alt").textContent = ["km", "mi", "m"].filter(function (x) { return x !== du; }).map(function (x) { return f(m / DU[x]) + " " + DL[x]; }).join(" · ");
      }
    });
  }
})();
