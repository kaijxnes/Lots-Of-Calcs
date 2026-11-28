/* Take-home pay 2027/28 (/salary/2027-28/): the same salary worked out with
   this tax year's UK file and next year's (England, Wales and Northern
   Ireland), side by side. Both files are embedded in the page by
   tools/build-salary-2027-pages.js and run through tax-engine.js, the same
   engine as the salary calculator. */
(function () {
  "use strict";
  var box = document.getElementById("s27-tool");
  if (!box || typeof TaxEngine === "undefined") return;
  var D = JSON.parse(box.getAttribute("data-rules"));
  var $ = function (id) { return document.getElementById(id); };
  var money = function (v) { return "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  var OUT = ["s27-net", "s27-month", "s27-diff", "s27-tax-a", "s27-tax-b", "s27-ni-a", "s27-ni-b", "s27-loan-a", "s27-loan-b", "s27-net-a", "s27-net-b"];
  var group = function (r, g) { return r.byGroup[g] || 0; };
  function run() {
    var s = String($("s27-salary").value).replace(/[\s,£]/g, ""), gross = s === "" ? 0 : Number(s), err = $("s27-error");
    var bad = !(gross >= 0) || gross > 1e8 ? "Enter a salary of £0 or more." : "";
    err.textContent = bad; err.style.display = bad ? "block" : "none";
    if (bad) { OUT.forEach(function (id) { $(id).textContent = "—"; }); $("s27-note").textContent = ""; return; }
    var opts = { studentLoan: $("s27-loan").value, postgradLoan: $("s27-pg").checked ? "yes" : "no" };
    var a = TaxEngine.compute([D.a], gross, opts), b = TaxEngine.compute([D.b], gross, opts), diff = b.net - a.net;
    $("s27-net").textContent = money(b.net);
    $("s27-month").textContent = money(b.net / 12);
    $("s27-diff").textContent = (diff >= 0.005 ? "+" : diff <= -0.005 ? "−" : "") + money(Math.abs(diff)) + " a year";
    $("s27-tax-a").textContent = money(group(a, "tax")); $("s27-tax-b").textContent = money(group(b, "tax"));
    $("s27-ni-a").textContent = money(group(a, "social")); $("s27-ni-b").textContent = money(group(b, "social"));
    $("s27-loan-a").textContent = money(group(a, "loan")); $("s27-loan-b").textContent = money(group(b, "loan"));
    $("s27-net-a").textContent = money(a.net); $("s27-net-b").textContent = money(b.net);
    $("s27-note").textContent = Math.abs(diff) < 0.005 ? "The same as this tax year: the Personal Allowance, tax bands and National Insurance thresholds don't change." :
      "Your take-home changes by " + money(Math.abs(diff)) + " a year (" + money(Math.abs(diff) / 12) + " a month) because your student loan threshold " + (diff > 0 ? "rises." : "changes.");
  }
  $("s27-salary").addEventListener("input", run);
  ["s27-loan", "s27-pg"].forEach(function (id) { $(id).addEventListener("change", run); });
  run();
})();
