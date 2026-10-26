/* The salary-after-tax calculator at /salary/.

   Pick where you're paid, type a salary, and every deduction for that place's
   current tax year is worked out by tax-engine.js from data/tax/. Options a
   place has (filing status, region, county…) are drawn from its data file, so
   adding a jurisdiction to the registry is enough for it to work here. The
   page is generated with the UK figures already in it; this takes over once
   the rates have loaded. */
(function () {
  var locationEl = document.getElementById("location");
  if (!locationEl || typeof TaxEngine === "undefined") return;

  var salaryEl = document.getElementById("salary");
  var currencyEl = document.getElementById("salary-currency");
  var optionsEl = document.getElementById("salary-options");
  var errorEl = document.getElementById("salary-error");
  var noteEl = document.getElementById("salary-note");
  var breakdownEl = document.getElementById("breakdown");
  var out = {
    net: document.getElementById("out-net"),
    month: document.getElementById("out-month"),
    week: document.getElementById("out-week"),
    day: document.getElementById("out-day"),
    rate: document.getElementById("out-rate")
  };

  var STORE = "salary-location";
  var chain = null;
  var currency = "GBP";
  var options = {};
  var loading = 0;

  function store(key, value) {
    try {
      if (value === undefined) return window.localStorage.getItem(key);
      window.localStorage.setItem(key, value);
    } catch (e) { /* private mode: just don't remember */ }
    return null;
  }

  function money(v, whole) { return TaxEngine.money(v, currency, whole); }

  function pct(v) { return (Math.round(v * 10) / 10).toFixed(1) + "%"; }

  function setError(message) {
    errorEl.textContent = message || "";
    errorEl.style.display = message ? "block" : "none";
  }

  function selected() { return locationEl.options[locationEl.selectedIndex]; }

  function row(label, value, highlight) {
    var div = document.createElement("div");
    div.className = "result-row" + (highlight ? " highlight" : "");
    var l = document.createElement("span");
    l.className = "r-label";
    l.textContent = label;
    var v = document.createElement("span");
    v.className = "r-value";
    v.textContent = value;
    div.appendChild(l);
    div.appendChild(v);
    return div;
  }

  function render(r) {
    out.net.textContent = money(r.net);
    out.month.textContent = money(r.perMonth);
    out.week.textContent = money(r.perWeek);
    out.day.textContent = money(r.perDay);
    out.rate.textContent = pct(r.deductionRate);

    breakdownEl.textContent = "";
    breakdownEl.appendChild(row("Gross salary", money(r.gross, true)));
    r.shown.forEach(function (s) { breakdownEl.appendChild(row(s.label, money(s.amount))); });
    r.charges.forEach(function (c) { breakdownEl.appendChild(row(c.label, money(c.amount))); });
    breakdownEl.appendChild(row("Total deductions", money(r.totalDeductions)));
    breakdownEl.appendChild(row("Effective rate", pct(r.deductionRate)));
    breakdownEl.appendChild(row("Marginal rate", Math.round(r.marginalRate) + "%"));
    breakdownEl.appendChild(row("Take-home pay", money(r.net), true));
  }

  function calculate() {
    if (!chain) return;
    var raw = String(salaryEl.value).trim().replace(/[\s,]/g, "");
    if (raw === "") {
      setError("");
      return;
    }
    var gross = Number(raw);
    if (!isFinite(gross)) return setError("That isn't a number.");
    if (gross < 0) return setError("A salary can't be negative.");
    if (gross > 1e11) return setError("That is beyond what this is useful for.");
    setError("");
    try {
      render(TaxEngine.compute(chain, gross, options));
    } catch (e) {
      setError("Something went wrong with that calculation.");
    }
  }

  /* One select per option the place's rules define; most places have none */
  function drawOptions(spec) {
    optionsEl.textContent = "";
    options = {};
    Object.keys(spec).forEach(function (key) {
      var o = spec[key];
      options[key] = o["default"];
      var field = document.createElement("div");
      field.className = "field";
      var label = document.createElement("label");
      label.htmlFor = "opt-" + key;
      label.textContent = o.label;
      var sel = document.createElement("select");
      sel.id = "opt-" + key;
      Object.keys(o.choices).forEach(function (c) {
        var opt = document.createElement("option");
        opt.value = c;
        opt.textContent = o.choices[c];
        if (c === o["default"]) opt.selected = true;
        sel.appendChild(opt);
      });
      sel.addEventListener("change", function () {
        options[key] = sel.value;
        calculate();
      });
      field.appendChild(label);
      field.appendChild(sel);
      optionsEl.appendChild(field);
    });
    optionsEl.style.display = optionsEl.children.length ? "" : "none";
  }

  function drawNote(loaded, hub) {
    var leaf = loaded[loaded.length - 1];
    noteEl.textContent = leaf.taxYear.label + " tax year. An estimate, not a payslip: it assumes one job and no other income, pension or student loan. ";
    if (hub) {
      var a = document.createElement("a");
      a.href = hub;
      a.textContent = "Full breakdown and sources for " + selected().textContent + " →";
      noteEl.appendChild(a);
    }
  }

  function switchTo(id) {
    var opt = selected();
    var newCurrency = opt.getAttribute("data-currency");
    /* A salary typed in pounds means nothing in yen, so a change of currency
       starts from that place's typical salary */
    if (newCurrency !== currency || String(salaryEl.value).trim() === "") salaryEl.value = opt.getAttribute("data-gross");
    currency = newCurrency;
    currencyEl.textContent = currency;
    store(STORE, id);

    var ticket = ++loading;
    chain = null;
    salaryEl.disabled = true;
    TaxEngine.load(id)
      .then(function (loaded) {
        if (ticket !== loading) return; // a later choice won
        chain = loaded;
        drawOptions(TaxEngine.merge(loaded).options);
        drawNote(loaded, opt.getAttribute("data-hub"));
        salaryEl.disabled = false;
        calculate();
      })
      .catch(function () {
        if (ticket !== loading) return;
        salaryEl.disabled = false;
        setError("The rates for " + opt.textContent + " could not be loaded. Check your connection and pick it again.");
      });
  }

  function has(id) {
    return !!id && Array.prototype.some.call(locationEl.options, function (o) { return o.value === id; });
  }

  locationEl.addEventListener("change", function () { switchTo(locationEl.value); });
  salaryEl.addEventListener("input", calculate);

  /* A link like /salary/#us-ca opens on that place; otherwise the last one used */
  var start = window.location.hash.slice(1);
  if (!has(start)) start = store(STORE);
  if (!has(start)) start = "gb";
  locationEl.value = start;
  switchTo(start);
})();
