/* Concrete and tile calculators (tools/build-diy-pages.js). Geometry only:
   bag yields, tiles per box and the extra to allow are the visitor's. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  function on(ids, fn) { ids.forEach(function (id) { var el = $(id); el.addEventListener("input", fn); el.addEventListener("change", fn); }); fn(); }
  function num(id) { var v = parseFloat($(id).value); return isFinite(v) && v > 0 ? v : 0; }
  function f(v, d) { return v.toLocaleString("en-GB", { maximumFractionDigits: d === undefined ? 2 : d }); }

  if ($("cc-tool")) {
    var last = $("cc-units").value;
    on(["cc-units", "cc-shape", "cc-l", "cc-w", "cc-d", "cc-hd", "cc-hh", "cc-hn", "cc-extra", "cc-bag"], function () {
      var metric = $("cc-units").value === "metric", hole = $("cc-shape").value === "hole";
      if ($("cc-units").value !== last) {
        /* switching units: convert what's typed so the answer stays the same */
        var k = metric ? 0.3048 : 1 / 0.3048, ki = metric ? 25.4 : 1 / 25.4;
        ["cc-l", "cc-w"].forEach(function (id) { if (num(id)) $(id).value = +(num(id) * k).toFixed(2); });
        ["cc-d", "cc-hd", "cc-hh"].forEach(function (id) { if (num(id)) $(id).value = +(num(id) * ki).toFixed(metric ? 0 : 1); });
        if (num("cc-bag")) $("cc-bag").value = +(metric ? num("cc-bag") * 28.3168 : num("cc-bag") / 28.3168).toFixed(2);
        last = $("cc-units").value;
      }
      $("cc-lu").textContent = $("cc-wu").textContent = metric ? "m" : "ft";
      $("cc-du").textContent = $("cc-hdu").textContent = $("cc-hhu").textContent = metric ? "mm" : "in";
      $("cc-bagu").textContent = metric ? "litres" : "cu ft";
      $("cc-slab").hidden = hole; $("cc-hole").hidden = !hole;
      /* volume in m³ */
      var m3;
      if (hole) {
        var r = num("cc-hd") / 2 / (metric ? 1000 : 39.3701), h = num("cc-hh") / (metric ? 1000 : 39.3701);
        m3 = Math.PI * r * r * h * Math.floor(num("cc-hn"));
      } else {
        m3 = metric ? num("cc-l") * num("cc-w") * num("cc-d") / 1000 : num("cc-l") * num("cc-w") * num("cc-d") / 12 * 0.0283168;
      }
      m3 *= 1 + num("cc-extra") / 100;
      var cuft = m3 * 35.3147;
      $("cc-vol").textContent = metric ? f(m3, 3) + " m³" : f(cuft / 27) + " yd³";
      $("cc-alt").textContent = metric ? f(m3 * 1000, 0) + " litres · " + f(cuft) + " cu ft" : f(cuft) + " cu ft · " + f(m3, 3) + " m³";
      var bag = num("cc-bag");
      $("cc-bags").textContent = bag ? Math.ceil((metric ? m3 * 1000 : cuft) / bag) + " bags" : "Enter what one bag makes";
    });
  }

  if ($("tl-tool")) on(["tl-l", "tl-wd", "tl-area", "tl-w", "tl-h", "tl-extra", "tl-box"], function () {
    var area = num("tl-l") && num("tl-wd") ? num("tl-l") * num("tl-wd") : num("tl-area");
    var w = num("tl-w"), h = num("tl-h");
    if (!w || !h) return;
    var per = 1e6 / (w * h), exact = per * area, extra = num("tl-extra"), need = Math.ceil(exact * (1 + extra / 100) - 1e-9), box = Math.floor(num("tl-box"));
    $("tl-n").textContent = need + " tiles";
    $("tl-label").textContent = (extra ? "including " + f(extra) + "% extra" : "no extra added") + " · " + f(area) + " m²";
    $("tl-per").textContent = f(per);
    $("tl-exact").textContent = f(exact) + " tiles";
    $("tl-boxes").textContent = box ? Math.ceil(need / box) + " boxes (" + Math.ceil(need / box) * box + " tiles)" : "Enter tiles in a box";
  });
})();
