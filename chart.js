/* A small line chart for the money calculators (mortgage, loan, compound
   interest, savings goal): drawn as inline SVG into a box the page reserves,
   so it never moves anything. Hover or tap shows the figures for a year.

       MiniChart.draw(el, {
         labels: [0, 1, 2, ...],                  x values (years)
         series: [{ name, values, area }],        1 to 3 lines, same length as labels
         money: (v) => "£1,234",                  formats a value
         goal: 10000                              optional dashed target line
       });

   Colours come from the site's CSS variables, so it suits both themes. */
var MiniChart = (function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";
  function el(name, attrs, parent) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function short(v, money) {
    var a = Math.abs(v), s = money(0).replace(/[\d.,\s]/g, "").replace(/0/g, "");
    if (a >= 1e6) return s + (v / 1e6).toFixed(a >= 1e7 ? 0 : 1).replace(/\.0$/, "") + "m";
    if (a >= 1e3) return s + (a >= 1e4 || v % 1e3 === 0 ? Math.round(v / 1e3) : (v / 1e3).toFixed(1).replace(/\.0$/, "")) + "k";
    return s + Math.round(v);
  }
  function nice(max) {
    if (max <= 0) return 1;
    var p = Math.pow(10, Math.floor(Math.log10(max))), n = max / p;
    var steps = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
    for (var i = 0; i < steps.length; i++) if (n <= steps[i]) return steps[i] * p;
    return 10 * p;
  }

  function draw(box, o) {
    if (!box || !o.labels.length) return;
    var W = 600, H = 250, L = 56, R = 14, T = 12, B = 30;
    var max = 0;
    o.series.forEach(function (s) { s.values.forEach(function (v) { if (v > max) max = v; }); });
    if (o.goal && o.goal > max) max = o.goal;
    var top = nice(max * 1.05);
    var n = o.labels.length, x0 = o.labels[0], x1 = o.labels[n - 1];
    var X = function (x) { return L + (x1 === x0 ? 0 : ((x - x0) / (x1 - x0)) * (W - L - R)); };
    var Y = function (v) { return T + (1 - v / top) * (H - T - B); };

    box.textContent = "";
    var read = document.createElement("p");
    read.className = "mini-chart-read";
    box.appendChild(read);
    var svg = el("svg", { viewBox: "0 0 " + W + " " + H, class: "mini-chart-svg", role: "img" }, box);
    svg.setAttribute("aria-label", (o.title || "Chart") + ": " + o.series.map(function (s) { return s.name + " " + o.money(s.values[0]) + " to " + o.money(s.values[n - 1]); }).join("; "));

    for (var i = 0; i <= 4; i++) {
      var v = (top / 4) * i, y = Y(v);
      el("line", { x1: L, x2: W - R, y1: y, y2: y, class: "mc-grid" }, svg);
      el("text", { x: L - 8, y: y + 4, "text-anchor": "end", class: "mc-tick" }, svg).textContent = short(v, o.money);
    }
    var step = Math.max(1, Math.ceil((x1 - x0) / 6));
    o.labels.forEach(function (x) {
      if ((x - x0) % step === 0 || x === x1) el("text", { x: X(x), y: H - 10, "text-anchor": "middle", class: "mc-tick" }, svg).textContent = String(x);
    });
    if (o.goal) {
      el("line", { x1: L, x2: W - R, y1: Y(o.goal), y2: Y(o.goal), class: "mc-goal" }, svg);
    }
    o.series.forEach(function (s, k) {
      var pts = s.values.map(function (v, j) { return X(o.labels[j]).toFixed(1) + "," + Y(v).toFixed(1); });
      if (s.area) el("polygon", { points: X(x0) + "," + Y(0) + " " + pts.join(" ") + " " + X(x1) + "," + Y(0), class: "mc-area mc-s" + k }, svg);
      el("polyline", { points: pts.join(" "), class: "mc-line mc-s" + k }, svg);
    });
    var cursor = el("line", { x1: 0, x2: 0, y1: T, y2: H - B, class: "mc-cursor" }, svg);
    var dots = o.series.map(function (s, k) { return el("circle", { r: 4, class: "mc-dot mc-s" + k }, svg); });

    var legend = document.createElement("p");
    legend.className = "mini-chart-legend";
    legend.innerHTML = o.series.map(function (s, k) { return '<span><i class="mc-key mc-s' + k + '"></i>' + s.name + "</span>"; }).join("") + (o.goal ? '<span><i class="mc-key mc-goal-key"></i>Goal</span>' : "");
    box.appendChild(legend);

    function show(j) {
      var x = X(o.labels[j]);
      cursor.setAttribute("x1", x); cursor.setAttribute("x2", x);
      o.series.forEach(function (s, k) { dots[k].setAttribute("cx", x); dots[k].setAttribute("cy", Y(s.values[j])); });
      read.textContent = (o.xName || "Year") + " " + o.labels[j] + " · " + o.series.map(function (s) { return s.name + " " + o.money(s.values[j]); }).join(" · ");
    }
    function at(evt) {
      var r = svg.getBoundingClientRect(), px = ((evt.touches ? evt.touches[0].clientX : evt.clientX) - r.left) / r.width * W;
      var best = 0;
      o.labels.forEach(function (x, j) { if (Math.abs(X(x) - px) < Math.abs(X(o.labels[best]) - px)) best = j; });
      show(best);
    }
    svg.addEventListener("mousemove", at);
    svg.addEventListener("touchstart", at, { passive: true });
    svg.addEventListener("touchmove", at, { passive: true });
    svg.addEventListener("mouseleave", function () { show(n - 1); });
    show(n - 1);
  }
  return { draw: draw };
})();
