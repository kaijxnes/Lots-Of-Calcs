/* The "try a different salary" box on a /salary/ landing page.

   The page already carries its own figures baked into the HTML, so this does
   nothing until the visitor types. That ordering is deliberate: the headline
   number is in the markup for anyone — or anything — reading the page without
   running scripts, and the live recalculation is an addition on top rather
   than the only way to see a result. */
(function () {
  var JURISDICTION = "gb";

  var els = {
    salary: document.getElementById("salary"),
    error: document.getElementById("salary-error"),
    note: document.getElementById("salary-note"),
    heroNet: document.getElementById("hero-net"),
    month: document.getElementById("out-month"),
    week: document.getElementById("out-week"),
    day: document.getElementById("out-day"),
    rate: document.getElementById("out-rate"),
    gross: document.getElementById("out-gross"),
    allowance: document.getElementById("out-allowance"),
    taxable: document.getElementById("out-taxable"),
    tax: document.getElementById("out-tax"),
    ni: document.getElementById("out-ni"),
    net: document.getElementById("out-net")
  };

  if (!els.salary) return;

  /* The figures the page was generated with, read back off the markup. Typing
     and then clearing the box restores these rather than blanking the page. */
  var baked = {};
  Object.keys(els).forEach(function (k) {
    if (els[k] && els[k].textContent) baked[k] = els[k].textContent;
  });
  var bakedSalary = els.salary.value;

  var chain = null;

  function money(v) {
    if (!isFinite(v)) return "—";
    var rounded = Math.round(Math.abs(v) * 100) / 100;
    var sign = v < 0 && rounded !== 0 ? "−" : "";
    return sign + "£" + rounded.toLocaleString("en-GB", {
      minimumFractionDigits: 2, maximumFractionDigits: 2
    });
  }

  function setError(message) {
    els.error.textContent = message || "";
    els.error.style.display = message ? "block" : "none";
  }

  function restore() {
    Object.keys(baked).forEach(function (k) {
      if (els[k]) els[k].textContent = baked[k];
    });
  }

  function render(r) {
    els.heroNet.textContent = money(r.net);
    els.month.textContent = money(r.perMonth);
    els.week.textContent = money(r.perWeek);
    els.day.textContent = money(r.perDay);
    els.rate.textContent = (Math.round(r.deductionRate * 10) / 10).toFixed(1) + "%";
    els.gross.textContent = money(r.gross);
    els.allowance.textContent = money(r.values["gb-personal-allowance"]);
    els.taxable.textContent = money(r.values["gb-taxable"]);
    els.tax.textContent = money(r.values["gb-income-tax"]);
    els.ni.textContent = money(r.values["gb-ni"]);
    els.net.textContent = money(r.net);
  }

  function calculate() {
    if (!chain) return;

    var raw = String(els.salary.value).trim().replace(/[\s,£]/g, "");

    if (raw === "") {
      setError("");
      restore();
      els.salary.value = "";
      return;
    }

    var gross = Number(raw);
    if (!isFinite(gross)) return fail("That isn't a number.");
    if (gross < 0) return fail("A salary can't be negative.");
    if (gross > 100000000) return fail("That is beyond what this is useful for — try something under £100m.");

    setError("");
    render(TaxEngine.compute(chain, gross));

    /* Say plainly when the figures on screen no longer match the page's own
       subject, so nobody screenshots the wrong number */
    var changed = Number(bakedSalary) !== gross;
    els.note.innerHTML = changed
      ? "Showing <strong>" + money(gross) + "</strong>. The written parts of this page still describe " +
        money(Number(bakedSalary)) + "."
      : "Change the figure and everything above updates. The page itself still describes " +
        money(Number(bakedSalary)) + ".";
  }

  function fail(message) {
    setError(message);
    restore();
  }

  els.salary.addEventListener("input", calculate);

  /* Rates come from the tax registry the page was generated from, so a
     corrected rate reaches both without touching either. If it cannot be loaded
     the baked figures simply stay as they are — the page is still complete and
     correct. */
  TaxEngine.load(JURISDICTION)
    .then(function (loaded) {
      chain = loaded;
      els.salary.disabled = false;
    })
    .catch(function () {
      els.salary.disabled = true;
      els.note.textContent =
        "The live recalculation could not load its rates, so the salary box is switched off. " +
        "The figures on this page are unaffected.";
    });
})();
