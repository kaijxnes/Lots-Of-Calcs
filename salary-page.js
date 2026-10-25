/* The live calculator on a generated salary page (/salary/.../).

   The page already carries its own figures baked into the HTML, so this does
   nothing until the visitor changes the salary or an option. The headline
   numbers stay readable without scripts, and recalculation is an addition on
   top. Rows are matched by data attributes the generator writes:
     [data-out="net|month|week|day|deductions|rate|marginal"]
     [data-item="<registry item id>"]
   and the options (filing status, county, region…) are <select data-option>. */
(function () {
  var tool = document.getElementById("salary-tool");
  if (!tool || typeof TaxEngine === "undefined") return;

  var id = tool.getAttribute("data-tax-id");
  var currency = tool.getAttribute("data-currency");
  var bakedGross = Number(tool.getAttribute("data-gross"));
  var input = document.getElementById("salary");
  var error = document.getElementById("salary-error");
  var note = document.getElementById("salary-note");
  var selects = Array.prototype.slice.call(document.querySelectorAll("select[data-option]"));
  var outs = Array.prototype.slice.call(document.querySelectorAll("[data-out], [data-item]"));

  /* What the page was generated with, so clearing the box restores it */
  var baked = outs.map(function (el) { return el.textContent; });
  var bakedOptions = selects.map(function (s) { return s.value; });

  var chain = null;

  function money(v) { return TaxEngine.money(v, currency); }

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

  function changed(gross) {
    if (gross !== bakedGross) return true;
    return selects.some(function (s, i) { return s.value !== bakedOptions[i]; });
  }

  function calculate() {
    if (!chain) return;
    var raw = String(input.value).trim().replace(/[\s,]/g, "");

    if (raw === "" && !changed(bakedGross)) {
      setError("");
      restore();
      note.textContent = "Change the salary or the options and everything above updates.";
      return;
    }

    var gross = raw === "" ? bakedGross : Number(raw);
    if (!isFinite(gross)) return fail("That isn't a number.");
    if (gross < 0) return fail("A salary can't be negative.");
    if (gross > 1e11) return fail("That is beyond what this is useful for.");

    setError("");
    try {
      render(TaxEngine.compute(chain, gross, options()));
    } catch (e) {
      return fail("Something went wrong with that calculation.");
    }

    /* Say plainly when the figures no longer match the page's own subject, so
       nobody screenshots the wrong number */
    note.textContent = changed(gross)
      ? "Showing your figures. The written parts of this page still describe " + TaxEngine.money(bakedGross, currency, true) + " with the default options."
      : "Change the salary or the options and everything above updates.";
  }

  function fail(message) {
    setError(message);
    restore();
  }

  input.addEventListener("input", calculate);
  selects.forEach(function (s) { s.addEventListener("change", calculate); });

  /* If the registry cannot be loaded the baked figures simply stay — the page
     is still complete and correct, it just can't recalculate */
  TaxEngine.load(id)
    .then(function (loaded) {
      chain = loaded;
      input.disabled = false;
      selects.forEach(function (s) { s.disabled = false; });
    })
    .catch(function () {
      input.disabled = true;
      selects.forEach(function (s) { s.disabled = true; });
      note.textContent = "The live recalculation could not load its rates, so it is switched off. The figures on this page are unaffected.";
    });
})();
