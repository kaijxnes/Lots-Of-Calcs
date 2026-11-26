/* Pro rata salary calculator (/pro-rata-salary-calculator/): a part-time
   salary from the full-time one, in proportion to the hours (or days)
   worked, and what it comes to after tax with tax-engine.js and the UK tax
   files. Because tax and National Insurance are progressive, part-time
   take-home is a bigger share of full-time take-home than the share of
   hours. The pages are built from these same functions
   (tools/build-pro-rata-pages.js). */
var ProRata = (function () {
  "use strict";
  /* hours a week worked; `days` (of a 5-day week) is turned into hours */
  function hoursOf(fullHours, mode, amount) { return mode === "days" ? fullHours * amount / 5 : amount; }
  function calc(T, chain, fullSalary, fullHours, hours, options) {
    var share = fullHours > 0 ? hours / fullHours : 0, salary = fullSalary * share;
    var ft = T.compute(chain, fullSalary, options), pt = T.compute(chain, salary, options);
    return {
      share: share, salary: salary, hourly: fullHours > 0 ? fullSalary / (fullHours * 52) : 0,
      net: pt.net, fullNet: ft.net, netShare: ft.net > 0 ? pt.net / ft.net : 0, r: pt
    };
  }
  return { hoursOf: hoursOf, calc: calc };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = ProRata;
} else {
  (function () {
    var box = document.getElementById("pp-tool");
    if (!box || typeof TaxEngine === "undefined") return;
    var $ = function (id) { return document.getElementById(id); };
    var optionsEl = $("pp-options"), chain = null, options = {}, loading = 0;
    var money = function (v, whole) { return TaxEngine.money(v, "GBP", whole); };
    var num = function (id) { return Number(String($(id).value).replace(/[\s,£]/g, "")); };
    var pct = function (v) { return (Math.round(v * 1000) / 10).toLocaleString("en-GB") + "%"; };

    function calc() {
      if (!chain) return;
      var err = $("pp-error"), full = num("pp-salary"), fh = num("pp-fullhours"), mode = $("pp-mode").value, amt = num("pp-amount");
      var max = mode === "days" ? 5 : fh;
      if (!(full > 0) || !(fh > 0) || !(amt > 0)) { err.textContent = "Enter the full-time salary, full-time hours and what you work."; err.style.display = "block"; return; }
      if (amt > max) { err.textContent = mode === "days" ? "That's more than 5 days a week." : "That's more than the full-time hours."; err.style.display = "block"; return; }
      if (full > 1e9) { err.textContent = "That's beyond what the calculator covers."; err.style.display = "block"; return; }
      err.style.display = "none";
      var h = ProRata.hoursOf(fh, mode, amt), s = ProRata.calc(TaxEngine, chain, full, fh, h, options);
      $("pp-salary-out").textContent = money(s.salary, true);
      $("pp-label").textContent = "a year pro rata: " + pct(s.share) + " of " + money(full, true) + " for " + (Math.round(h * 100) / 100).toLocaleString("en-GB") + " hours a week";
      $("pp-month").textContent = money(s.salary / 12);
      $("pp-net").textContent = money(s.net / 12);
      $("pp-full").textContent = money(s.fullNet / 12);
      $("pp-netshare").textContent = pct(s.netShare);
      $("pp-hourly").textContent = money(s.hourly);
    }

    function drawOptions(spec) {
      while (optionsEl.firstChild) optionsEl.removeChild(optionsEl.firstChild);
      options = {};
      Object.keys(spec).forEach(function (key) {
        var o = spec[key], field = document.createElement("div"), label = document.createElement("label"), el;
        options[key] = o["default"];
        field.className = "field";
        label.htmlFor = "pp-opt-" + key;
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
        el.id = "pp-opt-" + key;
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
        var prev = options;
        drawOptions(TaxEngine.merge(c).options);
        Object.keys(prev).forEach(function (k) { if (k in options && $("pp-opt-" + k)) { $("pp-opt-" + k).value = prev[k]; options[k] = prev[k]; } });
        calc();
      }).catch(function () {
        if (ticket !== loading) return;
        $("pp-error").textContent = "The tax figures couldn't be loaded — check your connection and try again.";
        $("pp-error").style.display = "block";
      });
    }
    $("pp-mode").addEventListener("change", function () {
      var days = $("pp-mode").value === "days", fh = num("pp-fullhours") || 37.5;
      $("pp-amount-label").textContent = days ? "Days a week you work" : "Hours a week you work";
      var v = num("pp-amount");
      $("pp-amount").value = days ? Math.round(v / fh * 5 * 10) / 10 : Math.round(v / 5 * fh * 100) / 100;
      calc();
    });
    ["pp-salary", "pp-fullhours", "pp-amount"].forEach(function (id) { $(id).addEventListener("input", calc); });
    $("pp-region").addEventListener("change", function () { load($("pp-region").value); });
    load($("pp-region").value);
  })();
}
