/* Recipe scaler (tools/build-recipe-scaler.js): scales the first quantity
   on each ingredient line — 2, 1.5, 1/2, 1 1/2, ½, 1½ or a range 2-3. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  if (!$("rs-tool")) return;
  var VULGAR = { "¼": 0.25, "½": 0.5, "¾": 0.75, "⅓": 1 / 3, "⅔": 2 / 3, "⅛": 0.125, "⅜": 0.375, "⅝": 0.625, "⅞": 0.875 };
  var V = "¼½¾⅓⅔⅛⅜⅝⅞";
  /* a quantity: "1 1/2", "1½", "1/2", "½", "1.5", "2" */
  var Q = "(?:\\d+\\s+\\d+\\/\\d+|\\d+\\s*[" + V + "]|\\d+\\/\\d+|[" + V + "]|\\d+(?:[.,]\\d+)?)";
  var RE = new RegExp("^(\\D*?)(" + Q + ")(?:(\\s*(?:-|–|to)\\s*)(" + Q + "))?");
  function val(s) {
    s = s.trim();
    var m;
    if ((m = s.match(/^(\d+)\s+(\d+)\/(\d+)$/))) return +m[1] + m[2] / m[3];
    if ((m = s.match(new RegExp("^(\\d+)\\s*([" + V + "])$")))) return +m[1] + VULGAR[m[2]];
    if ((m = s.match(/^(\d+)\/(\d+)$/))) return m[1] / m[2];
    if (VULGAR[s] !== undefined) return VULGAR[s];
    return parseFloat(s.replace(",", "."));
  }
  /* back to a kitchen-friendly number: whole, or a common fraction, or 1 decimal */
  function show(v, wasFraction) {
    if (v >= 20 || !wasFraction) {
      var r = v >= 100 ? Math.round(v) : Math.round(v * 10) / 10;
      return r.toLocaleString("en-GB");
    }
    var whole = Math.floor(v), frac = v - whole, best = null;
    [[0, ""], [0.25, "¼"], [1 / 3, "⅓"], [0.5, "½"], [2 / 3, "⅔"], [0.75, "¾"], [1, ""]].forEach(function (f) { if (!best || Math.abs(frac - f[0]) < Math.abs(frac - best[0])) best = f; });
    if (Math.abs(frac - best[0]) > 0.06) return (Math.round(v * 100) / 100).toLocaleString("en-GB");
    if (best[0] === 1) return String(whole + 1);
    return (whole ? whole : "") + best[1] || "0";
  }
  function run() {
    var from = parseFloat($("rs-from").value), to = parseFloat($("rs-to").value);
    if (!(from > 0) || !(to >= 0)) return;
    var k = to / from;
    $("rs-factor").textContent = "× " + (Math.round(k * 100) / 100).toLocaleString("en-GB");
    $("rs-out").textContent = $("rs-in").value.split("\n").map(function (line) {
      var m = line.match(RE);
      if (!m) return line;
      var frac = /[\/¼½¾⅓⅔⅛⅜⅝⅞]/.test(m[2] + (m[4] || ""));
      var out = m[1] + show(val(m[2]) * k, frac) + (m[4] ? m[3] + show(val(m[4]) * k, frac) : "");
      return out + line.slice(m[0].length);
    }).join("\n");
  }
  ["rs-from", "rs-to", "rs-in"].forEach(function (id) { $(id).addEventListener("input", run); });
  Array.prototype.forEach.call(document.querySelectorAll("#rs-tool [data-x]"), function (b) {
    b.addEventListener("click", function () { $("rs-to").value = +(parseFloat($("rs-from").value) * Number(b.getAttribute("data-x"))).toFixed(2); run(); });
  });
  run();
})();
