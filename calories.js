/* Calorie calculator (/calorie-calculator/): calories a day to stay the
   same weight and to lose weight, and how long a goal would take.

   - Resting energy: the Mifflin-St Jeor equation (Mifflin et al., American
     Journal of Clinical Nutrition 51:241, 1990):
       10 × kg + 6.25 × cm − 5 × age + 5 (men), − 161 (women)
   - Activity: multiplied by a physical activity level (PAL) from the
     FAO/WHO/UNU 2004 report on human energy requirements (Table 5.3):
     sedentary or light 1.40–1.69, active or moderately active 1.70–1.99,
     vigorous 2.00–2.40. The middle of each band is used.
   - Losing weight: the NHS advises cutting around 600 calories a day and
     aiming to lose 0.5 to 1 kg (1 to 2 lb) a week. Time to a goal uses the
     usual rule of thumb of about 7,700 calories per kg of body fat, which
     tends to be optimistic over long periods.
   The pages (tools/build-calorie-pages.js) use this same module. */
var Calories = (function () {
  "use strict";
  var LB = 0.45359237, IN = 2.54;
  var KCAL_PER_KG = 7700, DEFICIT = 600;
  var LEVELS = [
    { key: "low", pal: 1.4, name: "Mostly sitting", note: "desk job, little or no exercise (bottom of the sedentary band)" },
    { key: "light", pal: 1.55, name: "Sedentary or light activity", note: "some walking, light exercise now and then (PAL 1.40–1.69)" },
    { key: "active", pal: 1.85, name: "Active or moderately active", note: "on your feet a lot, or an hour of exercise most days (PAL 1.70–1.99)" },
    { key: "vigorous", pal: 2.2, name: "Vigorously active", note: "heavy manual work or hard training most days (PAL 2.00–2.40)" }
  ];

  function bmr(sex, kg, cm, age) { return 10 * kg + 6.25 * cm - 5 * age + (sex === "m" ? 5 : -161); }
  function level(key) { for (var i = 0; i < LEVELS.length; i++) if (LEVELS[i].key === key) return LEVELS[i]; return LEVELS[1]; }
  function maintain(sex, kg, cm, age, key) { return bmr(sex, kg, cm, age) * level(key).pal; }
  /* nearest 10 kcal, as calorie targets are usually given */
  function r10(v) { return Math.round(v / 10) * 10; }

  /* weeks to lose kg at a daily deficit */
  function weeks(kg, deficit) { return kg * KCAL_PER_KG / (deficit || DEFICIT) / 7; }
  /* NHS range: 0.5 to 1 kg a week */
  function nhsWeeks(kg) { return [kg / 1, kg / 0.5]; }
  function bmi(kg, cm) { return kg / Math.pow(cm / 100, 2); }
  function healthy(cm) { var m2 = Math.pow(cm / 100, 2); return [18.5 * m2, 24.9 * m2]; }

  function stone(kg) {
    var lb = kg / LB, st = Math.floor(lb / 14), p = Math.round(lb - st * 14);
    if (p === 14) { st++; p = 0; }
    return st + "st " + p + "lb";
  }
  function n0(v) { return Math.round(v).toLocaleString("en-GB"); }
  function n1(v) { return (Math.round(v * 10) / 10).toLocaleString("en-GB"); }
  /* 18.3 -> "18 weeks (about 4 months)" */
  function span(w) {
    var wk = Math.round(w);
    if (w < 10) return plural(Math.max(1, wk), "week");
    var months = Math.round(w * 7 / 30.44);
    return plural(wk, "week") + " (about " + (months >= 24 ? n1(w / 52.18) + " years" : plural(months, "month")) + ")";
  }
  function plural(v, w) { return v + " " + w + (v === 1 ? "" : "s"); }

  return { LB: LB, IN: IN, KCAL_PER_KG: KCAL_PER_KG, DEFICIT: DEFICIT, LEVELS: LEVELS, bmr: bmr, level: level, maintain: maintain, r10: r10, weeks: weeks, nhsWeeks: nhsWeeks, bmi: bmi, healthy: healthy, stone: stone, n0: n0, n1: n1, span: span };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = Calories;
} else {
  (function () {
    var box = document.getElementById("cal-tool");
    if (!box) return;
    var $ = function (id) { return document.getElementById(id); };
    var C = Calories;
    function num(id) { var v = $(id).value; return v === "" ? NaN : Number(v); }

    function unitsShown() {
      var imp = $("cal-units").value === "imperial";
      ["cal-metric-h", "cal-metric-w", "cal-metric-g"].forEach(function (id) { $(id).style.display = imp ? "none" : ""; });
      ["cal-imp-h", "cal-imp-w", "cal-imp-g"].forEach(function (id) { $(id).style.display = imp ? "" : "none"; });
    }
    function read() {
      var imp = $("cal-units").value === "imperial";
      var cm = imp ? (num("cal-ft") * 12 + (num("cal-in") || 0)) * C.IN : num("cal-cm");
      var kg = imp ? (num("cal-st") * 14 + (num("cal-lb") || 0)) * C.LB : num("cal-kg");
      var goal = imp ? ($("cal-gst").value === "" ? NaN : (num("cal-gst") * 14 + (num("cal-glb") || 0)) * C.LB) : num("cal-goal");
      return { sex: $("cal-sex").value, age: num("cal-age"), cm: cm, kg: kg, goal: goal, act: $("cal-act").value };
    }
    function calc() {
      unitsShown();
      var v = read(), err = $("cal-error");
      if (!(v.age >= 18 && v.age <= 100) || !(v.cm >= 120 && v.cm <= 230) || !(v.kg >= 30 && v.kg <= 300)) {
        err.textContent = "Enter an age from 18 to 100, a height and a weight. (These equations are for adults.)";
        err.style.display = "block";
        return;
      }
      err.style.display = "none";
      var keep = C.maintain(v.sex, v.kg, v.cm, v.age, v.act), lose = keep - C.DEFICIT;
      $("cal-keep").textContent = C.n0(C.r10(keep));
      $("cal-lose").textContent = C.n0(C.r10(lose)) + " kcal a day";
      $("cal-bmr").textContent = C.n0(C.r10(C.bmr(v.sex, v.kg, v.cm, v.age))) + " kcal a day";
      var b = C.bmi(v.kg, v.cm), h = C.healthy(v.cm);
      $("cal-bmi").textContent = C.n1(b) + " — healthy weight for your height is " + C.n1(h[0]) + "–" + C.n1(h[1]) + " kg (" + C.stone(h[0]) + " to " + C.stone(h[1]) + ")";
      var warn = $("cal-warn");
      if (lose <= 800) { warn.textContent = "That target is a very low calorie diet (800 kcal or less). The NHS and NICE advise these only with medical supervision — speak to your GP."; warn.style.display = "block"; }
      else warn.style.display = "none";
      var g = v.goal;
      if (g > 0 && g < v.kg) {
        var drop = v.kg - g, w = C.weeks(drop), nhs = C.nhsWeeks(drop);
        var end = new Date(Date.now() + w * 7 * 86400000);
        $("cal-time").textContent = C.span(w) + ", around " + end.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
        $("cal-nhs").textContent = Math.round(nhs[0]) + " to " + Math.round(nhs[1]) + " weeks at 0.5–1 kg a week";
        $("cal-drop").textContent = C.n1(drop) + " kg (" + C.n1(drop / C.LB) + " lb)" + (g < h[0] ? " — below the healthy range for your height" : "");
      } else {
        $("cal-time").textContent = "—";
        $("cal-nhs").textContent = "—";
        $("cal-drop").textContent = g >= v.kg ? "Your goal is not below your current weight" : "Enter a goal weight";
      }
    }
    ["cal-age", "cal-cm", "cal-ft", "cal-in", "cal-kg", "cal-st", "cal-lb", "cal-goal", "cal-gst", "cal-glb"].forEach(function (id) { $(id).addEventListener("input", calc); });
    /* switching units carries the figures across */
    function setSt(kg, st, lb) { if (!(kg > 0)) { $(st).value = ""; $(lb).value = ""; return; } var t = kg / C.LB, s = Math.floor(t / 14), p = Math.round(t - s * 14); if (p === 14) { s++; p = 0; } $(st).value = s; $(lb).value = p; }
    $("cal-units").addEventListener("change", function () {
      if ($("cal-units").value === "imperial") {
        var inches = num("cal-cm") / C.IN, ft = Math.floor(inches / 12), i = Math.round(inches - ft * 12);
        if (i === 12) { ft++; i = 0; }
        if (inches > 0) { $("cal-ft").value = ft; $("cal-in").value = i; }
        setSt(num("cal-kg"), "cal-st", "cal-lb"); setSt(num("cal-goal"), "cal-gst", "cal-glb");
      } else {
        var cm = (num("cal-ft") * 12 + (num("cal-in") || 0)) * C.IN;
        if (cm > 0) $("cal-cm").value = Math.round(cm);
        var kg = (num("cal-st") * 14 + (num("cal-lb") || 0)) * C.LB;
        if (kg > 0) $("cal-kg").value = Math.round(kg * 10) / 10;
        var g = $("cal-gst").value === "" ? NaN : (num("cal-gst") * 14 + (num("cal-glb") || 0)) * C.LB;
        $("cal-goal").value = g > 0 ? Math.round(g * 10) / 10 : "";
      }
      calc();
    });
    ["cal-sex", "cal-act"].forEach(function (id) { $(id).addEventListener("change", calc); });
    calc();
  })();
}
