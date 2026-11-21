/* Sleep calculator (/sleep-calculator/): bedtimes for the recommended hours
   (CDC, by age) before a wake-up time, or wake-up times after a bedtime,
   allowing the minutes it takes to fall asleep. */
(function () {
  var box = document.getElementById("sl2-tool"); if (!box) return;
  var $ = function (id) { return document.getElementById(id); };
  function fmt(min) { min = ((Math.round(min) % 1440) + 1440) % 1440; var h = Math.floor(min / 60), m = min % 60; return ((h % 12) || 12) + ":" + String(m).padStart(2, "0") + (h < 12 ? "am" : "pm"); }
  function calc() {
    var t = $("sl2-time").value; if (!t) return;
    var at = Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5)), fall = Math.max(0, Number($("sl2-fall").value) || 0);
    var o = $("sl2-age").options[$("sl2-age").selectedIndex], lo = Number(o.getAttribute("data-min")), hi = Number(o.getAttribute("data-max")) || lo + 2;
    var hrs = [lo, Math.round((lo + hi) / 2), hi].filter(function (v, i, a) { return a.indexOf(v) === i; });
    var wake = $("sl2-mode").value === "wake";
    $("sl2-out").innerHTML = hrs.map(function (h, i) {
      var v = wake ? at - h * 60 - fall : at + fall + h * 60;
      return '<div class="result-row' + (i === 1 || hrs.length === 1 ? " highlight" : "") + '"><span class="r-label">' + (wake ? "Bedtime" : "Wake-up time") + " for " + h + " hours' sleep</span><span class=\"r-value\">" + fmt(v) + "</span></div>";
    }).join("");
  }
  ["sl2-time", "sl2-fall"].forEach(function (id) { $(id).addEventListener("input", calc); });
  ["sl2-mode", "sl2-age"].forEach(function (id) { $(id).addEventListener("change", calc); });
  calc();
})();
