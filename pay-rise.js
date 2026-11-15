/* Pay rise calculator (/pay-rise-calculator/): what a rise adds to take-home
   pay after income tax, National Insurance and student loan, in England,
   Wales and Northern Ireland or in Scotland. The tax is worked out by
   tax-engine.js from the same data/tax/ files as the salary calculators. */
(function () {
  var box = document.getElementById("pr-tool");
  if (!box || typeof TaxEngine === "undefined") return;
  var $ = function (id) { return document.getElementById(id); };
  var chains = {};
  function money(v, whole) { return TaxEngine.money(v, "GBP", whole); }

  function calc() {
    var region = $("pr-region").value, err = $("pr-error");
    var salary = Number($("pr-salary").value), rise = Number($("pr-rise").value), type = $("pr-type").value;
    if (!(salary > 0) || !(rise > 0)) { err.textContent = "Enter your salary and the rise."; err.style.display = "block"; return; }
    var next = type === "pct" ? salary * (1 + rise / 100) : salary + rise;
    if (next > 10000000) { err.textContent = "That's beyond what the calculator covers."; err.style.display = "block"; return; }
    err.style.display = "none";
    var go = function (chain) {
      var opts = { studentLoan: $("pr-loan").value, pensionPct: Number($("pr-pension").value) || 0 };
      var a = TaxEngine.compute(chain, salary, opts), b = TaxEngine.compute(chain, next, opts);
      var extra = b.net - a.net, gross = next - salary;
      $("pr-month").textContent = money(extra / 12);
      $("pr-new").textContent = money(next, true) + " (" + (type === "pct" ? "+" + money(gross, true) : "+" + (Math.round(gross / salary * 1000) / 10).toLocaleString("en-GB") + "%") + ")";
      $("pr-year").textContent = money(extra) + " of " + money(gross, true);
      $("pr-keep").textContent = Math.round(extra / gross * 100) + "% of the rise";
      $("pr-before").textContent = money(a.net / 12) + " → " + money(b.net / 12);
    };
    if (chains[region]) return go(chains[region]);
    TaxEngine.load(region).then(function (c) { chains[region] = c; go(c); }).catch(function () {
      err.textContent = "The tax figures couldn't be loaded — check your connection and try again."; err.style.display = "block";
    });
  }
  ["pr-salary", "pr-rise", "pr-pension"].forEach(function (id) { $(id).addEventListener("input", calc); });
  ["pr-type", "pr-region", "pr-loan"].forEach(function (id) { $(id).addEventListener("change", calc); });
  calc();
})();
