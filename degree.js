/* UK degree classification calculator (tools/build-degree-calc.js) */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  if (!$("dg-tool")) return;
  var CLASSES = [[70, "First"], [60, "2:1"], [50, "2:2"], [40, "Third"]];
  function val(id) { var v = parseFloat($(id).value); return isFinite(v) ? v : null; }
  function f(v) { return (Math.round(v * 100) / 100).toLocaleString("en-GB"); }
  function run() {
    var y2 = val("dg-y2"), y3 = val("dg-y3"), w2 = Math.max(0, val("dg-w2") || 0), w3 = Math.max(0, val("dg-w3") || 0);
    if (!(w2 + w3 > 0)) return;
    if (y3 !== null && (y2 !== null || w2 === 0)) {
      var avg = ((y2 || 0) * w2 + y3 * w3) / (w2 + w3), c = CLASSES.filter(function (k) { return avg >= k[0]; })[0];
      $("dg-class").textContent = c ? c[1] : "Below a third";
      $("dg-avg").textContent = "weighted average " + f(avg) + "%";
    } else { $("dg-class").textContent = "—"; $("dg-avg").textContent = "enter your final-year average to see your class"; }
    CLASSES.forEach(function (k) {
      var el = $("dg-n" + k[0]);
      if (!w3) { el.textContent = "—"; return; }
      var n = (k[0] * (w2 + w3) - (y2 || 0) * w2) / w3;
      el.textContent = n <= 0 ? "Already secured" : n > 100 ? "Not reachable (" + f(n) + "%)" : f(n) + "%";
    });
  }
  ["dg-y2", "dg-y3", "dg-w2", "dg-w3"].forEach(function (id) { $(id).addEventListener("input", run); });
  run();
})();
