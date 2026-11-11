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
    loan: document.getElementById("out-loan"),
    pgl: document.getElementById("out-pgl"),
    pension: document.getElementById("out-pension"),
    net: document.getElementById("out-net")
  };
  var plan = document.getElementById("opt-studentLoan");
  var postgrad = document.getElementById("opt-postgradLoan");
  var pensionPct = document.getElementById("opt-pensionPct");
  var pensionType = document.getElementById("opt-pensionType");

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

  /* Student loan choices; "none" and "no" are the page's own defaults */
  function options() {
    return {
      studentLoan: plan ? plan.value : "none",
      postgradLoan: postgrad ? postgrad.value : "no",
      pensionPct: pensionPct ? pensionPct.value : 0,
      pensionType: pensionType ? pensionType.value : "relief"
    };
  }

  /* Anything beyond the page's own no-loan, no-pension case */
  function loansChosen() {
    var o = options();
    return o.studentLoan !== "none" || o.postgradLoan !== "no" || Number(o.pensionPct) > 0;
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
    if (els.loan) els.loan.textContent = money(r.values["gb-student-loan"]);
    if (els.pgl) els.pgl.textContent = money(r.values["gb-postgrad-loan"]);
    if (els.pension) els.pension.textContent = money(r.values["gb-pension"]);
    els.net.textContent = money(r.net);
  }

  function calculate() {
    if (!chain) return;

    var raw = String(els.salary.value).trim().replace(/[\s,£]/g, "");

    if (raw === "" && !loansChosen()) {
      setError("");
      restore();
      els.salary.value = "";
      return;
    }

    var gross = raw === "" ? Number(bakedSalary) : Number(raw);
    if (!isFinite(gross)) return fail("That isn't a number.");
    if (gross < 0) return fail("A salary can't be negative.");
    if (gross > 100000000) return fail("That is beyond what this is useful for — try something under £100m.");

    setError("");
    render(TaxEngine.compute(chain, gross, options()));

    /* Say plainly when the figures on screen no longer match the page's own
       subject, so nobody screenshots the wrong number */
    var changed = Number(bakedSalary) !== gross || loansChosen();
    els.note.innerHTML = changed
      ? "Showing <strong>" + money(gross) + "</strong>" + (loansChosen() ? " with your loans and pension" : "") +
        ". The written parts of this page still describe " + money(Number(bakedSalary)) + " with no student loan or pension."
      : "Change the figure and everything above updates. The page itself still describes " +
        money(Number(bakedSalary)) + ".";
  }

  function fail(message) {
    setError(message);
    restore();
  }

  els.salary.addEventListener("input", calculate);
  if (plan) plan.addEventListener("change", calculate);
  if (postgrad) postgrad.addEventListener("change", calculate);
  if (pensionPct) pensionPct.addEventListener("input", calculate);
  if (pensionType) pensionType.addEventListener("change", calculate);

  /* Rates come from the tax registry the page was generated from, so a
     corrected rate reaches both without touching either. If it cannot be loaded
     the baked figures simply stay as they are — the page is still complete and
     correct. */
  var checkedEl = document.getElementById("rates-checked");
  if (checkedEl) {
    TaxEngine.checked(JURISDICTION).then(function (info) {
      checkedEl.firstChild.textContent = TaxEngine.checkedLine(info) + " · ";
    }).catch(function () { /* keep the page's own wording */ });
  }

  TaxEngine.load(JURISDICTION)
    .then(function (loaded) {
      chain = loaded;
      els.salary.disabled = false;
      if (plan) plan.disabled = false;
      if (postgrad) postgrad.disabled = false;
      if (pensionPct) pensionPct.disabled = false;
      if (pensionType) pensionType.disabled = false;
    })
    .catch(function () {
      els.salary.disabled = true;
      if (plan) plan.disabled = true;
      if (postgrad) postgrad.disabled = true;
      if (pensionPct) pensionPct.disabled = true;
      if (pensionType) pensionType.disabled = true;
      els.note.textContent =
        "The live recalculation could not load its rates, so the salary box is switched off. " +
        "The figures on this page are unaffected.";
    });
})();
