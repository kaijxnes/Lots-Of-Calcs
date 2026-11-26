/* Bonus tax calculator (/bonus-tax-calculator/): what a cash bonus adds to
   take-home pay under PAYE, from the UK tax files through tax-engine.js.

   Income Tax is worked out on the pay so far in the tax year (a normal,
   cumulative code), so by the end of the year the bonus costs the tax on
   the year's pay with it less the tax without it. National Insurance and
   student loans are worked out on each pay period on its own, so only the
   period the bonus is paid in changes: a period's charge on pay P, with the
   yearly thresholds divided by n periods, is the yearly charge on n × P
   divided by n, and n × (salary / n + bonus) is salary + n × bonus.
   The page is built from these same functions (tools/build-bonus-pages.js). */
var BonusTax = (function () {
  "use strict";
  function g(r, k) { return (r.byGroup && r.byGroup[k]) || 0; }
  function split(T, chain, salary, bonus, periods, options) {
    var base = T.compute(chain, salary, options), year = T.compute(chain, salary + bonus, options);
    var one = T.compute(chain, salary + bonus * periods, options);
    var tax = g(year, "tax") - g(base, "tax");
    var ni = (g(one, "social") - g(base, "social")) / periods;
    var loan = (g(one, "loan") - g(base, "loan")) / periods;
    var pension = g(year, "pension") - g(base, "pension");
    var keep = bonus - tax - ni - loan - pension;
    var pg = function (r) { return r.values["gb-pension-gross"] || 0; };
    return {
      tax: tax, ni: ni, loan: loan, pension: pension, keep: keep,
      rate: bonus > 0 ? (bonus - keep) / bonus : 0,
      /* the same bonus spread evenly over the year's pay instead */
      evenNi: g(year, "social") - g(base, "social"), evenLoan: g(year, "loan") - g(base, "loan"),
      adjusted: salary + bonus - pg(year), adjustedBefore: salary - pg(base),
      netBefore: base.net, netAfter: base.net + keep
    };
  }
  /* how much of the bonus falls between £100,000 and £125,140 of adjusted net income */
  function trap(s, from, to) {
    var lo = Math.max(s.adjustedBefore, from), hi = Math.min(s.adjusted, to);
    return hi > lo ? hi - lo : 0;
  }
  return { split: split, trap: trap };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = BonusTax;
} else {
  (function () {
    var box = document.getElementById("bt-tool");
    if (!box || typeof TaxEngine === "undefined") return;
    var $ = function (id) { return document.getElementById(id); };
    var TAPER = JSON.parse(box.getAttribute("data-taper"));
    var optionsEl = $("bt-options"), chain = null, options = {}, loading = 0;
    function money(v, whole) { return TaxEngine.money(v, "GBP", whole); }
    function num(id) { return Number(String($(id).value).replace(/[\s,£]/g, "")); }

    function calc() {
      if (!chain) return;
      var err = $("bt-error"), salary = num("bt-salary"), bonus = num("bt-bonus"), periods = Number($("bt-periods").value);
      if (!(salary >= 0) || !(bonus > 0)) { err.textContent = "Enter your salary and the bonus."; err.style.display = "block"; return; }
      if (salary + bonus * periods > 1e10) { err.textContent = "That's beyond what the calculator covers."; err.style.display = "block"; return; }
      err.style.display = "none";
      var s = BonusTax.split(TaxEngine, chain, salary, bonus, periods, options);
      $("bt-keep").textContent = money(s.keep);
      $("bt-label").textContent = "of your " + money(bonus, true) + " bonus is yours (" + Math.round((1 - s.rate) * 100) + "%)";
      $("bt-tax").textContent = money(s.tax);
      $("bt-ni").textContent = money(s.ni);
      $("bt-loan").textContent = money(s.loan);
      $("bt-loan-row").style.display = s.loan > 0.004 ? "" : "none";
      $("bt-pension").textContent = money(s.pension);
      $("bt-pension-row").style.display = s.pension > 0.004 ? "" : "none";
      $("bt-rate").textContent = (Math.round(s.rate * 1000) / 10).toLocaleString("en-GB") + "%";
      var t = BonusTax.trap(s, TAPER.from, TAPER.to), note = $("bt-note");
      if (t > 0) {
        note.textContent = money(t, true) + " of the bonus takes your adjusted net income over " + money(TAPER.from, true) + ", where you lose £1 of Personal Allowance for every £2. Paying " +
          money(Math.min(bonus, s.adjusted - TAPER.from), true) + " of it into your pension instead (if your employer offers bonus sacrifice, or as a personal contribution) would keep your income at " + money(TAPER.from, true) + ".";
        note.style.display = "block";
      } else note.style.display = "none";
    }

    function drawOptions(spec) {
      while (optionsEl.firstChild) optionsEl.removeChild(optionsEl.firstChild);
      options = {};
      Object.keys(spec).forEach(function (key) {
        var o = spec[key], field = document.createElement("div"), label = document.createElement("label"), el;
        options[key] = o["default"];
        field.className = "field";
        label.htmlFor = "bt-opt-" + key;
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
        el.id = "bt-opt-" + key;
        field.appendChild(label);
        field.appendChild(el);
        optionsEl.appendChild(field);
      });
    }

    function load(id) {
      var ticket = ++loading;
      TaxEngine.load(id).then(function (c) {
        if (ticket !== loading) return;
        chain = c;
        /* keep what the visitor already chose when switching between the two UK files */
        var prev = options;
        drawOptions(TaxEngine.merge(c).options);
        Object.keys(prev).forEach(function (k) { if (k in options && $("bt-opt-" + k)) { $("bt-opt-" + k).value = prev[k]; options[k] = prev[k]; } });
        calc();
      }).catch(function () {
        if (ticket !== loading) return;
        $("bt-error").textContent = "The tax figures couldn't be loaded — check your connection and try again.";
        $("bt-error").style.display = "block";
      });
    }
    ["bt-salary", "bt-bonus"].forEach(function (id) { $(id).addEventListener("input", calc); });
    $("bt-periods").addEventListener("change", calc);
    $("bt-region").addEventListener("change", function () { load($("bt-region").value); });
    load($("bt-region").value);
  })();
}
