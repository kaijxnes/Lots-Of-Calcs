/* Net to gross (/net-to-gross-salary/): the salary you need to take home a
   given amount, wherever you're paid. Uses tax-engine.js with the same
   data and options as the salary calculator; the place's rules load from
   data/tax/. Some places have cliffs where a little more pay takes home
   less, so the solver doesn't assume take-home always rises: it steps up
   until take-home reaches the target, then narrows that step down to the
   lowest salary that gets there. The pages are built from these same
   functions (tools/build-net-to-gross-pages.js). */
var NetToGross = (function () {
  "use strict";
  /* the lowest yearly gross whose yearly take-home is at least `net`, to the whole unit */
  function solve(T, chain, net, options) {
    var at = function (g) { return T.compute(chain, g, options).net; };
    if (!(net > 0)) return 0;
    if (at(0) >= net) return 0;
    var step = Math.max(1, net / 50), g = 0, i = 0;
    while (at(g + step) < net) {
      g += step; i++;
      if (i % 100 === 0) step *= 2;
      if (i > 2000) return null;
    }
    var lo = g, hi = g + step;
    for (var k = 0; k < 60 && hi - lo > 0.005; k++) {
      var mid = (lo + hi) / 2;
      if (at(mid) >= net) hi = mid; else lo = mid;
    }
    /* to the whole unit, rounding up, unless that crosses a cliff: then the exact figure */
    var whole = Math.ceil(hi - 0.01);
    if (at(whole) >= net - 0.005) return whole;
    if (at(whole + 1) >= net - 0.005) return whole + 1;
    return Math.round(hi * 100) / 100;
  }
  return { solve: solve };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = NetToGross;
} else {
  (function () {
    var box = document.getElementById("ng-tool");
    if (!box || typeof TaxEngine === "undefined") return;
    var $ = function (id) { return document.getElementById(id); };
    var loc = $("ng-location"), optionsEl = $("ng-options"), STORE = "salary-location";
    var chain = null, currency = "GBP", options = {}, loading = 0;
    var PER = { month: 12, year: 1, week: 52 };
    function money(v, whole) { return TaxEngine.money(v, currency, whole); }
    function selected() { return loc.options[loc.selectedIndex]; }
    function store(v) {
      try { if (v === undefined) return window.localStorage.getItem(STORE); window.localStorage.setItem(STORE, v); } catch (e) { /* private mode */ }
      return null;
    }
    function row(label, value, cls) {
      var d = document.createElement("div"), a = document.createElement("span"), b = document.createElement("span");
      d.className = "result-row" + (cls ? " " + cls : ""); a.className = "r-label"; b.className = "r-value";
      a.textContent = label; b.textContent = value; d.appendChild(a); d.appendChild(b);
      return d;
    }

    function calc() {
      if (!chain) return;
      var err = $("ng-error"), per = $("ng-per").value, target = Number(String($("ng-net").value).replace(/[\s,]/g, ""));
      if (!(target > 0)) { err.textContent = "Enter the take-home pay you want."; err.style.display = "block"; return; }
      var yearly = target * PER[per], g = NetToGross.solve(TaxEngine, chain, yearly, options);
      if (g === null || g > 1e11) { err.textContent = "That's beyond what the calculator covers."; err.style.display = "block"; return; }
      err.style.display = "none";
      var r = TaxEngine.compute(chain, g, options), grid = $("ng-rows");
      $("ng-gross").textContent = money(g, true);
      $("ng-label").textContent = "a year before tax to take home " + money(target, target % 1 === 0) + " a " + per;
      while (grid.firstChild) grid.removeChild(grid.firstChild);
      grid.appendChild(row("Gross a month", money(g / 12)));
      r.charges.forEach(function (c) { if (Math.abs(c.amount) >= 0.005) grid.appendChild(row(c.label + " (a year)", money(c.amount))); });
      grid.appendChild(row("Take-home a " + per, money(r.net / PER[per]), "highlight"));
      grid.appendChild(row("Deductions", (Math.round(r.deductionRate * 10) / 10).toLocaleString("en-GB") + "% of gross"));
    }

    function drawOptions(spec) {
      while (optionsEl.firstChild) optionsEl.removeChild(optionsEl.firstChild);
      options = {};
      Object.keys(spec).forEach(function (key) {
        var o = spec[key], field = document.createElement("div"), label = document.createElement("label"), el;
        options[key] = o["default"];
        field.className = "field";
        label.htmlFor = "ng-opt-" + key;
        label.textContent = o.label;
        if (o.type === "number") {
          el = document.createElement("input");
          el.type = "number"; el.value = o["default"]; el.step = o.step || "any"; el.inputMode = "decimal";
          if (o.min !== undefined) el.min = o.min;
          if (o.max !== undefined) el.max = o.max;
          el.addEventListener("input", function () { options[key] = el.value; calc(); });
        } else {
          el = document.createElement("select");
          Object.keys(o.choices).forEach(function (c) {
            var opt = document.createElement("option");
            opt.value = c; opt.textContent = o.choices[c];
            if (c === o["default"]) opt.selected = true;
            el.appendChild(opt);
          });
          el.addEventListener("change", function () { options[key] = el.value; calc(); });
        }
        el.id = "ng-opt-" + key;
        field.appendChild(label);
        field.appendChild(el);
        optionsEl.appendChild(field);
      });
    }

    function switchTo(id, first) {
      var opt = selected(), nextCurrency = opt.getAttribute("data-currency");
      /* an amount in pounds means nothing in yen: a new currency starts from that place's typical take-home */
      if (!first && nextCurrency !== currency) {
        var n = Number(opt.getAttribute("data-net"));
        /* data-net is that place's typical take-home a month */
        if (n) $("ng-net").value = Math.round(n * 12 / PER[$("ng-per").value]);
      }
      currency = nextCurrency;
      $("ng-currency").textContent = currency;
      if (!first) store(id);
      var ticket = ++loading;
      TaxEngine.load(id).then(function (c) {
        if (ticket !== loading) return;
        chain = c;
        drawOptions(TaxEngine.merge(c).options);
        calc();
      }).catch(function () {
        if (ticket !== loading) return;
        $("ng-error").textContent = "The tax figures for " + opt.textContent + " couldn't be loaded — check your connection and try again.";
        $("ng-error").style.display = "block";
      });
    }

    $("ng-net").addEventListener("input", calc);
    $("ng-per").addEventListener("change", calc);
    loc.addEventListener("change", function () { switchTo(loc.value, false); });
    function has(id) { return !!id && Array.prototype.some.call(loc.options, function (o) { return o.value === id; }); }
    var start = window.location.hash.slice(1);
    if (!has(start) && box.getAttribute("data-remember") === "1") start = store();
    if (has(start) && start !== loc.value) {
      loc.value = start;
      switchTo(start, false);
    } else switchTo(loc.value, true);
  })();
}
