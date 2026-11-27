/* Student Maintenance Loan calculator (/student-maintenance-loan-calculator/):
   the Maintenance Loan a full-time student from England can get in the
   2026 to 2027 academic year, from household income. Rules from Student
   Finance England in data/uk/maintenance-loan.json (passed in as `R`):
     - household residual income: parents' gross income less pension
       contributions and £1,130 for each other dependent child;
     - up to £25,000: the full loan;
     - above: £1 off for every £6.47 (away, outside London), £6.36 (London)
       or £6.54 (living with parents) of income over £25,000, rounded down
       to the pound, until only the non-income-assessed part is left.
   The pages are built from these same functions
   (tools/build-maintenance-loan-pages.js). */
var MaintenanceLoan = (function () {
  "use strict";
  /* o: income (household gross), pension, kids (other dependent children), option ("away" | "london" | "home") */
  function calc(R, o) {
    var op = R.options[o.option] || R.options.away;
    var residual = Math.max(0, (o.income || 0) - Math.max(0, o.pension || 0) - R.dependantAllowance * Math.max(0, Math.floor(o.kids || 0)));
    var raw = residual <= R.threshold ? 0 : Math.floor((residual - R.threshold) / op.per);
    var assessment = Math.min(op.maxAssessment, raw);
    var loan = op.max - assessment;
    return {
      residual: residual, assessment: assessment, loan: loan, max: op.max, min: op.max - op.maxAssessment, atMin: raw >= op.maxAssessment,
      full: assessment === 0, minFrom: R.threshold + op.maxAssessment * op.per, month: Math.round(loan / 12 * 100) / 100
    };
  }
  return { calc: calc };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = MaintenanceLoan;
} else {
  (function () {
    var box = document.getElementById("ml-tool");
    if (!box) return;
    var R = JSON.parse(box.getAttribute("data-rules"));
    var $ = function (id) { return document.getElementById(id); };
    var num = function (id) { var s = String($(id).value).replace(/[\s,£]/g, ""); return s === "" ? 0 : Number(s); };
    var m0 = function (v) { return "£" + Math.round(v).toLocaleString("en-GB"); };
    var OUT = ["ml-loan", "ml-month", "ml-residual", "ml-assess", "ml-max", "ml-min"];
    function run() {
      var err = $("ml-error"), inc = num("ml-income"), pen = num("ml-pension"), kids = num("ml-kids"), opt = $("ml-option").value;
      var bad = !(inc >= 0) || inc > 1e8 ? "Enter your household income before tax, or 0." : !(pen >= 0) || pen > 1e8 ? "Enter pension contributions, or 0." : !(kids >= 0) || kids > 20 || kids % 1 ? "Enter the number of other children your parents support, or 0." : "";
      err.textContent = bad; err.style.display = bad ? "block" : "none";
      if (bad) { OUT.forEach(function (id) { $(id).textContent = "—"; }); $("ml-label").textContent = "a year"; $("ml-note").textContent = ""; return; }
      var r = MaintenanceLoan.calc(R, { income: inc, pension: pen, kids: kids, option: opt });
      $("ml-loan").textContent = m0(r.loan);
      $("ml-label").textContent = "Maintenance Loan for the year (" + R.year + ")";
      $("ml-month").textContent = m0(r.loan / 12);
      $("ml-residual").textContent = m0(r.residual);
      $("ml-assess").textContent = r.assessment ? "−" + m0(r.assessment) : "None";
      $("ml-max").textContent = m0(r.max);
      $("ml-min").textContent = m0(r.min) + " (from about " + m0(r.minFrom) + ")";
      $("ml-note").textContent = r.full ? "Household income of " + m0(R.threshold) + " or less gets the full loan." : r.atMin ? "This is the lowest amount: it doesn't depend on household income." : "";
    }
    ["ml-income", "ml-pension", "ml-kids"].forEach(function (id) { $(id).addEventListener("input", run); });
    $("ml-option").addEventListener("change", run);
    run();
  })();
}
