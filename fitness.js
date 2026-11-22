/* Fitness calculators (tools/build-fitness-pages.js). The formulas' figures
   come from the page's data attributes, written from the generator. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  function on(ids, fn) { ids.forEach(function (id) { var el = $(id); el.addEventListener("input", fn); el.addEventListener("change", fn); }); fn(); }
  function num(id) { var v = parseFloat($(id).value); return isFinite(v) && v > 0 ? v : 0; }
  function f(v, d) { return v.toLocaleString("en-GB", { maximumFractionDigits: d === undefined ? 1 : d }); }

  var hz = $("hr-zones");
  if (hz) {
    var H = JSON.parse(hz.getAttribute("data-hr"));
    on(["hz-age"], function () {
      var age = num("hz-age"); if (!age) return;
      var max = H.base - age, z = function (p) { return Math.round(max * p[0] / 100) + "–" + Math.round(max * p[1] / 100) + " bpm"; };
      $("hz-max").textContent = max + " bpm"; $("hz-mod").textContent = z(H.moderate); $("hz-vig").textContent = z(H.vigorous);
    });
  }

  var bf = $("bf-tool");
  if (bf) {
    var N = JSON.parse(bf.getAttribute("data-navy"));
    var lastU = $("bf-unit").value;
    on(["bf-sex", "bf-unit", "bf-h", "bf-neck", "bf-waist", "bf-hip", "bf-wt"], function () {
      var u = $("bf-unit").value;
      if (u !== lastU) { ["bf-h", "bf-neck", "bf-waist", "bf-hip"].forEach(function (id) { if (num(id)) $(id).value = +(u === "in" ? num(id) / 2.54 : num(id) * 2.54).toFixed(1); }); lastU = u; }
      var k = u === "cm" ? 1 / 2.54 : 1, female = $("bf-sex").value === "f";
      $("bf-hip").closest(".field").hidden = !female;
      var h = num("bf-h") * k, neck = num("bf-neck") * k, waist = num("bf-waist") * k, hip = num("bf-hip") * k, pct;
      if (!h || !neck || !waist) return;
      if (female) { if (!hip || waist + hip - neck <= 0) return; pct = N.women[0] * Math.log10(waist + hip - neck) - N.women[1] * Math.log10(h) - N.women[2]; }
      else { if (waist - neck <= 0) { $("bf-pct").textContent = "—"; return; } pct = N.men[0] * Math.log10(waist - neck) - N.men[1] * Math.log10(h) + N.men[2]; }
      $("bf-pct").textContent = pct > 0 && pct < 75 ? f(pct) + "%" : "Check the measurements";
      var wt = num("bf-wt");
      $("bf-fat").textContent = wt && pct > 0 ? f(wt * pct / 100) + " kg" : "—";
      $("bf-lean").textContent = wt && pct > 0 ? f(wt * (1 - pct / 100)) + " kg" : "—";
    });
  }

  if ($("orm-tool")) on(["orm-w", "orm-r"], function () {
    var w = num("orm-w"), r = Math.floor(num("orm-r"));
    if (!w || !r || r > 36) return;
    var e = r === 1 ? w : w * (1 + r / 30), b = w * 36 / (37 - r);
    $("orm-1").textContent = f(e); $("orm-b").textContent = f(b); $("orm-avg").textContent = f((e + b) / 2);
    var rows = [100, 95, 90, 85, 80, 75, 70, 65, 60].map(function (p) {
      var reps = p === 100 ? 1 : Math.round(30 * (100 / p - 1));
      return "<tr><td>" + p + "%</td><td>" + f(e * p / 100) + "</td><td>" + reps + "</td></tr>";
    });
    $("orm-table").innerHTML = rows.join("");
  });

  var pr = $("pr-tool");
  if (pr) {
    var P = JSON.parse(pr.getAttribute("data-p"));
    on(["pr-kg", "pr-who"], function () {
      var kg = num("pr-kg"), who = $("pr-who").value; if (!kg) return;
      var base = kg * P.perKg;
      if (who === "older") { $("pr-g").textContent = f(kg * P.older[0]) + "–" + f(kg * P.older[1]) + " g"; $("pr-label").textContent = "protein a day (British Heart Foundation, over 65)"; return; }
      var extra = who === "preg" ? P.pregnancy : who === "bf1" ? P.lactation[0] : who === "bf2" ? P.lactation[1] : 0;
      $("pr-g").textContent = f(base + extra) + " g";
      $("pr-label").textContent = "protein a day" + (extra ? " (" + f(base) + " g + " + extra + " g)" : "");
    });
  }
})();
