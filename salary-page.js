/* The live calculator on a generated salary page (/salary/.../).

   The page already carries its own figures baked into the HTML, so this does
   nothing until the visitor changes the salary or an option. The headline
   numbers stay readable without scripts, and recalculation is an addition on
   top. The page is annual, hourly or monthly (data-mode): the box takes a
   salary, an hourly rate with hours a week, or monthly pay, and everything is
   worked out from the annual equivalent. Rows are matched by data attributes
   the generator writes:
     [data-out="net|month|week|day|hour|deductions|rate|marginal|gross"]
     [data-item="<registry item id>"]
   and the options (filing status, county, region…) are <select data-option>. */
(function () {
  var tool = document.getElementById("salary-tool");
  if (!tool || typeof TaxEngine === "undefined") return;

  var id = tool.getAttribute("data-tax-id");
  var currency = tool.getAttribute("data-currency");
  var mode = tool.getAttribute("data-mode") || "annual";
  var input = document.getElementById("salary");
  var hoursInput = document.getElementById("hours");
  var bakedValue = Number(input.value);
  var bakedHours = hoursInput ? Number(hoursInput.value) : 0;
  var error = document.getElementById("salary-error");
  var note = document.getElementById("salary-note");
  var selects = Array.prototype.slice.call(document.querySelectorAll("select[data-option]"));
  var outs = Array.prototype.slice.call(document.querySelectorAll("[data-out], [data-item]"));

  /* What the page was generated with, so clearing the box restores it */
  var baked = outs.map(function (el) { return el.textContent; });
  var bakedNote = note.textContent;
  var bakedOptions = selects.map(function (s) { return s.value; });

  var chain = null;

  function money(v) { return TaxEngine.money(v, currency); }

  function hours() {
    var h = hoursInput ? Number(String(hoursInput.value).replace(/[\s,]/g, "")) : 0;
    return isFinite(h) && h > 0 ? h : bakedHours;
  }

  /* The annual salary the box describes */
  function annual(value) {
    if (mode === "hourly") return value * hours() * 52;
    if (mode === "monthly") return value * 12;
    return value;
  }

  function setError(message) {
    error.textContent = message || "";
    error.style.display = message ? "block" : "none";
  }

  function restore() {
    outs.forEach(function (el, i) { el.textContent = baked[i]; });
  }

  function render(r) {
    var byOut = {
      net: money(r.net), month: money(r.perMonth), week: money(r.perWeek), day: money(r.perDay),
      hour: mode === "hourly" ? money(r.net / (hours() * 52)) : undefined,
      deductions: money(r.totalDeductions),
      rate: (Math.round(r.deductionRate * 10) / 10).toFixed(1) + "%",
      marginal: Math.round(r.marginalRate) + "%",
      gross: TaxEngine.money(r.gross, currency, true)
    };
    outs.forEach(function (el) {
      var key = el.getAttribute("data-out");
      if (key) {
        if (byOut[key] !== undefined) el.textContent = byOut[key];
        return;
      }
      var item = el.getAttribute("data-item");
      if (Object.prototype.hasOwnProperty.call(r.values, item)) el.textContent = money(r.values[item]);
    });
  }

  function options() {
    var o = {};
    selects.forEach(function (s) { o[s.getAttribute("data-option")] = s.value; });
    return o;
  }

  function changed(value) {
    if (value !== bakedValue || (hoursInput && hours() !== bakedHours)) return true;
    return selects.some(function (s, i) { return s.value !== bakedOptions[i]; });
  }

  function calculate() {
    if (!chain) return;
    var raw = String(input.value).trim().replace(/[\s,]/g, "");

    if (raw === "" && !changed(bakedValue)) {
      setError("");
      restore();
      note.textContent = bakedNote;
      return;
    }

    var value = raw === "" ? bakedValue : Number(raw);
    if (!isFinite(value)) return fail("That isn't a number.");
    if (value < 0) return fail("Pay can't be negative.");
    if (hoursInput && hours() > 168) return fail("A week only has 168 hours.");
    var gross = annual(value);
    if (gross > 1e11) return fail("That is beyond what this is useful for.");

    setError("");
    try {
      render(TaxEngine.compute(chain, gross, options()));
    } catch (e) {
      return fail("Something went wrong with that calculation.");
    }

    /* Say plainly when the figures no longer match the page's own subject, so
       nobody screenshots the wrong number */
    note.textContent = changed(value)
      ? "Showing your figures. The written parts of this page still describe " + describe(bakedValue) + " with the default options."
      : bakedNote;
  }

  function describe(value) {
    var m = TaxEngine.money(value, currency, value === Math.round(value));
    if (mode === "hourly") return m + " an hour for " + bakedHours + " hours a week";
    if (mode === "monthly") return m + " a month";
    return m;
  }

  function fail(message) {
    setError(message);
    restore();
  }

  input.addEventListener("input", calculate);
  if (hoursInput) hoursInput.addEventListener("input", calculate);
  selects.forEach(function (s) { s.addEventListener("change", calculate); });

  /* If the registry cannot be loaded the baked figures simply stay — the page
     is still complete and correct, it just can't recalculate */
  /* "Rates last checked" comes from the index rather than the HTML, so the
     monthly check updates it without rewriting every page */
  var checkedEl = document.getElementById("rates-checked");
  if (checkedEl) {
    TaxEngine.checked(id).then(function (info) {
      checkedEl.firstChild.textContent = TaxEngine.checkedLine(info) + " · ";
    }).catch(function () { /* keep the page's own wording */ });
  }

  TaxEngine.load(id)
    .then(function (loaded) {
      chain = loaded;
      input.disabled = false;
      if (hoursInput) hoursInput.disabled = false;
      selects.forEach(function (s) { s.disabled = false; });
    })
    .catch(function () {
      input.disabled = true;
      if (hoursInput) hoursInput.disabled = true;
      selects.forEach(function (s) { s.disabled = true; });
      note.textContent = "The live recalculation could not load its rates, so it is switched off. The figures on this page are unaffected.";
    });
})();
