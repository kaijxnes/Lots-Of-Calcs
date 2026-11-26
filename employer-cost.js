/* Employer cost calculator (/employer-cost-calculator/): what an employee
   costs on top of their salary: employer (secondary) Class 1 National
   Insurance, less any Employment Allowance used against it, and the
   employer's pension contribution, from GOV.UK's figures in
   data/uk/employer-cost.json (passed in as `R`). Under-21s and apprentices
   under 25 pay no employer NI up to the upper secondary threshold. The
   pages are built from these same functions
   (tools/build-employer-cost-pages.js). */
var EmployerCost = (function () {
  "use strict";
  var p2 = function (v) { return Math.round(v * 100) / 100; };
  /* category: "standard" | "under21" | "apprentice" */
  function ni(R, salary, category) {
    var from = category === "under21" || category === "apprentice" ? Math.max(R.ni.secondaryThreshold, R.ni.upperSecondaryThreshold) : R.ni.secondaryThreshold;
    return p2(Math.max(0, salary - from) * R.ni.rate / 100);
  }
  /* pension basis: "qualifying" (earnings between the lower and upper limits) or "full" (all salary) */
  function pensionable(R, salary, basis) {
    return basis === "full" ? salary : Math.max(0, Math.min(salary, R.pension.upper) - R.pension.lower);
  }
  function calc(R, o) {
    var salary = Math.max(0, o.salary || 0), employerNI = ni(R, salary, o.category);
    var allowance = o.allowance ? Math.min(employerNI, Math.max(0, R.employmentAllowance - Math.max(0, o.allowanceUsed || 0))) : 0;
    var pension = p2(pensionable(R, salary, o.basis) * Math.max(0, o.pensionPct || 0) / 100);
    var extra = p2(employerNI - allowance + pension + Math.max(0, o.other || 0)), total = p2(salary + extra);
    return {
      salary: salary, ni: employerNI, allowance: p2(allowance), niPaid: p2(employerNI - allowance), pension: pension,
      pensionable: pensionable(R, salary, o.basis), other: Math.max(0, o.other || 0), extra: extra, total: total,
      onTop: salary > 0 ? extra / salary : 0, autoEnrol: salary >= R.pension.autoEnrolFrom
    };
  }
  return { calc: calc, ni: ni, pensionable: pensionable };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = EmployerCost;
} else {
  (function () {
    var box = document.getElementById("ec-tool");
    if (!box) return;
    var R = JSON.parse(box.getAttribute("data-rules"));
    var $ = function (id) { return document.getElementById(id); };
    var num = function (id) { var s = String($(id).value).replace(/[\s,£]/g, ""); return s === "" ? 0 : Number(s); };
    var money = function (v) { return "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
    var OUT = ["ec-total", "ec-month", "ec-ni", "ec-ea-out", "ec-pension", "ec-extra"];
    function run() {
      var err = $("ec-error"), per = +$("ec-per").value, salary = num("ec-salary") * per;
      var bad = !(salary > 0) ? "Enter the salary before tax." : salary > 1e8 ? "That's beyond what the calculator covers." :
        !(num("ec-pct") >= 0) || num("ec-pct") > 100 ? "Enter the employer's pension contribution as a percentage." :
        !(num("ec-other") >= 0) ? "Enter other costs as 0 or more." : "";
      err.textContent = bad; err.style.display = bad ? "block" : "none";
      if (bad) { OUT.forEach(function (id) { $(id).textContent = "—"; }); $("ec-label").textContent = "total cost a year"; $("ec-note").textContent = ""; return; }
      var r = EmployerCost.calc(R, { salary: salary, category: $("ec-cat").value, basis: $("ec-basis").value, pensionPct: num("ec-pct"), allowance: $("ec-ea").checked, other: num("ec-other") });
      $("ec-total").textContent = money(r.total);
      $("ec-label").textContent = "total cost a year: " + (Math.round(r.onTop * 1000) / 10).toLocaleString("en-GB") + "% on top of the salary";
      $("ec-month").textContent = money(r.total / 12);
      $("ec-ni").textContent = money(r.ni);
      $("ec-ea-out").textContent = $("ec-ea").checked ? "−" + money(r.allowance) : "not used";
      $("ec-pension").textContent = money(r.pension);
      $("ec-extra").textContent = money(r.extra);
      $("ec-note").textContent = r.autoEnrol ? "" : "Below £" + R.pension.autoEnrolFrom.toLocaleString("en-GB") + " a year the employer doesn't have to enrol the employee into a pension automatically.";
    }
    ["ec-salary", "ec-pct", "ec-other"].forEach(function (id) { $(id).addEventListener("input", run); });
    ["ec-per", "ec-cat", "ec-basis", "ec-ea"].forEach(function (id) { $(id).addEventListener("change", run); });
    run();
  })();
}
