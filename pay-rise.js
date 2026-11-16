/* Pay rise calculator (/pay-rise-calculator/): what a rise adds to take-home
   pay, wherever you're paid. Pick a place and its rules load from data/tax/
   through tax-engine.js — the same data and the same options (filing
   status, student loan, pension, church tax...) as the salary calculator,
   which also remembers the place chosen there. */
(function () {
  var box = document.getElementById("pr-tool");
  if (!box || typeof TaxEngine === "undefined") return;
  var $ = function (id) { return document.getElementById(id); };
  var loc = $("pr-location"), optionsEl = $("pr-options");
  var STORE = "salary-location";
  var chain = null, currency = "GBP", options = {}, loading = 0;
  function money(v, whole) { return TaxEngine.money(v, currency, whole); }
  function selected() { return loc.options[loc.selectedIndex]; }
  function store(v) {
    try { if (v === undefined) return window.localStorage.getItem(STORE); window.localStorage.setItem(STORE, v); } catch (e) { /* private mode */ }
    return null;
  }

  function calc() {
    if (!chain) return;
    var err = $("pr-error");
    var salary = Number(String($("pr-salary").value).replace(/[\s,]/g, "")), rise = Number($("pr-rise").value), type = $("pr-type").value;
    if (!(salary > 0) || !(rise > 0)) { err.textContent = "Enter your salary and the rise."; err.style.display = "block"; return; }
    var next = type === "pct" ? salary * (1 + rise / 100) : salary + rise;
    if (next > 1e11) { err.textContent = "That's beyond what the calculator covers."; err.style.display = "block"; return; }
    err.style.display = "none";
    var a = TaxEngine.compute(chain, salary, options), b = TaxEngine.compute(chain, next, options);
    var extra = b.net - a.net, gross = next - salary;
    $("pr-month").textContent = money(extra / 12);
    $("pr-new").textContent = money(next, true) + " (" + (type === "pct" ? "+" + money(gross, true) : "+" + (Math.round(gross / salary * 1000) / 10).toLocaleString("en-GB") + "%") + ")";
    $("pr-year").textContent = money(extra) + " of " + money(gross, true);
    $("pr-keep").textContent = Math.round(extra / gross * 100) + "% of the rise";
    $("pr-before").textContent = money(a.net / 12) + " → " + money(b.net / 12);
  }

  /* One field per option the place's rules define, as on the salary calculator */
  function drawOptions(spec) {
    while (optionsEl.firstChild) optionsEl.removeChild(optionsEl.firstChild);
    options = {};
    Object.keys(spec).forEach(function (key) {
      var o = spec[key], field = document.createElement("div"), label = document.createElement("label"), el;
      options[key] = o["default"];
      field.className = "field";
      label.htmlFor = "pr-opt-" + key;
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
      el.id = "pr-opt-" + key;
      field.appendChild(label);
      field.appendChild(el);
      optionsEl.appendChild(field);
    });
  }

  function switchTo(id, first) {
    var opt = selected(), nextCurrency = opt.getAttribute("data-currency");
    /* a salary in pounds means nothing in yen: a new currency starts from that place's typical salary */
    if (!first && nextCurrency !== currency) $("pr-salary").value = opt.getAttribute("data-gross");
    currency = nextCurrency;
    $("pr-currency").textContent = currency;
    if (!first) store(id);
    var ticket = ++loading;
    TaxEngine.load(id).then(function (c) {
      if (ticket !== loading) return;
      chain = c;
      drawOptions(TaxEngine.merge(c).options);
      calc();
    }).catch(function () {
      if (ticket !== loading) return;
      $("pr-error").textContent = "The tax figures for " + opt.textContent + " couldn't be loaded — check your connection and try again.";
      $("pr-error").style.display = "block";
    });
  }

  ["pr-salary", "pr-rise"].forEach(function (id) { $(id).addEventListener("input", calc); });
  $("pr-type").addEventListener("change", calc);
  loc.addEventListener("change", function () { switchTo(loc.value, false); });

  /* the page's own place unless the visitor chose another on the salary
     calculator or here (or a link like #us-ca); the page's own salary is
     kept only while the currency matches */
  function has(id) { return !!id && Array.prototype.some.call(loc.options, function (o) { return o.value === id; }); }
  var start = window.location.hash.slice(1);
  if (!has(start) && box.getAttribute("data-remember") === "1") start = store();
  if (has(start) && start !== loc.value) {
    loc.value = start;
    switchTo(start, false);
  } else switchTo(loc.value, true);
})();
