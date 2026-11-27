/* Payslip checker (/payslip-checker/): what a UK payslip should show for one
   pay period, and how the deductions on yours compare.

   For regular pay (the same each period), the year's figures divided by the
   number of pay periods match what PAYE takes each payday to within
   rounding:
     - Income Tax: TaxCode.annualTax on the tax code (tax-code.js), on the
       year's pay after any net pay or salary sacrifice pension;
     - National Insurance, student and postgraduate loans and the pension:
       the UK (or Scottish, for an S code) tax file through TaxEngine.
   A month with a bonus, overtime, a pay rise, a new job or a changed tax
   code can differ, because tax is worked out on the pay so far in the tax
   year. The page is built from these same functions
   (tools/build-payslip-pages.js). */
var Payslip = (function () {
  "use strict";
  var p2 = function (v) { return Math.round(v * 100) / 100; };
  /* o: gross (this period), periods (a year), code (parsed tax code), options (pensionPct, pensionType, studentLoan, postgradLoan) */
  function expected(TE, TC, chain, R, o) {
    var n = o.periods, year = o.gross * n, r = TE.compute(chain, year, o.options || {}), g = function (k) { return (r.byGroup && r.byGroup[k]) || 0; };
    var taxPay = r.values["gb-tax-pay"] !== undefined ? r.values["gb-tax-pay"] : year, t = TC.annualTax(R, o.code, taxPay);
    var tax = p2(t.tax / n), ni = p2(g("social") / n), loan = p2(g("loan") / n), pension = p2(g("pension") / n);
    return { gross: p2(o.gross), tax: tax, ni: ni, loan: loan, pension: pension, net: p2(o.gross - tax - ni - loan - pension), capped: !!t.capped };
  }
  /* compare payslip figures (null = not entered) with what's expected; within `tol` is a match */
  function compare(exp, slip, tol) {
    var out = {};
    ["tax", "ni", "loan", "pension", "net"].forEach(function (k) {
      if (slip[k] === null || slip[k] === undefined) return;
      var d = p2(slip[k] - exp[k]);
      out[k] = { diff: d, ok: Math.abs(d) <= tol };
    });
    return out;
  }
  return { expected: expected, compare: compare };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = Payslip;
} else {
  (function () {
    var box = document.getElementById("ps-tool");
    if (!box || typeof TaxEngine === "undefined" || typeof TaxCode === "undefined") return;
    var R = JSON.parse(box.getAttribute("data-rules"));
    var $ = function (id) { return document.getElementById(id); };
    var raw = function (id) { return String($(id).value).replace(/[\s,£]/g, ""); };
    var num = function (id) { var s = raw(id); return s === "" ? 0 : Number(s); };
    var opt = function (id) { var s = raw(id); return s === "" ? null : Number(s); };
    var money = function (v) { return "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
    var chains = {}, loading = {};
    var ROWS = ["tax", "ni", "loan", "pension", "net"], OUTID = { tax: "ps-tax", ni: "ps-ni", loan: "ps-loan-out", pension: "ps-pension", net: "ps-net-row" };
    function blank(msg) {
      $("ps-error").textContent = msg; $("ps-error").style.display = msg ? "block" : "none";
      ROWS.forEach(function (k) { $(OUTID[k]).textContent = "—"; $("ps-" + k + "-d").textContent = ""; });
      $("ps-net").textContent = "—"; $("ps-verdict").textContent = "";
    }
    function run() {
      var p = TaxCode.parse($("ps-code").value), gross = num("ps-gross");
      if (!(gross > 0) || gross > 1e7) return blank("Enter your gross pay for the pay period.");
      if (!p) return blank("That doesn't look like a UK tax code. Codes look like 1257L, S1257L, K475, BR, 0T or 1257L M1.");
      var region = p.region === "sct" ? "gb-sct" : "gb";
      if (!chains[region]) {
        if (!loading[region]) {
          loading[region] = true;
          TaxEngine.load(region).then(function (c) { chains[region] = c; run(); }).catch(function () { blank("The tax figures couldn't be loaded — check your connection and try again."); });
        }
        return;
      }
      blank("");
      var options = { pensionPct: num("ps-pct"), pensionType: $("ps-ptype").value, studentLoan: $("ps-loan").value, postgradLoan: $("ps-pg").value };
      var e = Payslip.expected(TaxEngine, TaxCode, chains[region], R, { gross: gross, periods: Number($("ps-per").value), code: p, options: options });
      var slip = { tax: opt("ps-s-tax"), ni: opt("ps-s-ni"), loan: opt("ps-s-loan"), pension: opt("ps-s-pension"), net: opt("ps-s-net") };
      var c = Payslip.compare(e, slip, R.tolerance), off = [];
      ROWS.forEach(function (k) {
        $(OUTID[k]).textContent = money(e[k]);
        var d = c[k], el = $("ps-" + k + "-d");
        if (!d) { el.textContent = ""; return; }
        el.textContent = d.ok ? " ✓" : " (" + (d.diff > 0 ? "+" : "−") + money(Math.abs(d.diff)) + " on yours)";
        el.style.color = d.ok ? "var(--good)" : "var(--bad)";
        if (!d.ok) off.push(k);
      });
      var names = { tax: "Income Tax", ni: "National Insurance", loan: "student loan", pension: "pension", net: "net pay" };
      $("ps-net").textContent = money(e.net);
      $("ps-label").textContent = "take-home this pay period" + (e.capped ? " (tax capped at half your pay)" : "");
      $("ps-verdict").textContent = !Object.keys(c).length ? "Enter the figures from your payslip to compare them." : !off.length ? "Your payslip matches, to within " + money(R.tolerance) + " a line." :
        "Different: " + off.map(function (k) { return names[k]; }).join(", ") + ". " + (off.indexOf("tax") >= 0 ? R.taxWhy : "") + (off.indexOf("ni") >= 0 ? " " + R.niWhy : "");
    }
    ["ps-gross", "ps-code", "ps-pct", "ps-s-tax", "ps-s-ni", "ps-s-loan", "ps-s-pension", "ps-s-net"].forEach(function (id) { $(id).addEventListener("input", run); });
    ["ps-per", "ps-ptype", "ps-loan", "ps-pg"].forEach(function (id) { $(id).addEventListener("change", run); });
    run();
  })();
}
