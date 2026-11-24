/* Salary sacrifice calculator (/salary-sacrifice-calculator/): what paying
   into a pension through salary sacrifice costs out of take-home pay, against
   no pension and against a net pay pension, using the UK tax files through
   tax-engine.js. The page is built from the same function
   (tools/build-salary-sacrifice-pages.js). */
var SalarySacrifice = (function () {
  "use strict";
  /* TE: TaxEngine; chain: the UK or Scottish rules; er: { rate, threshold } employer NI */
  function compare(TE, chain, salary, amount, loan, er, passOn) {
    amount = Math.max(0, Math.min(amount, salary));
    var pct = salary > 0 ? amount / salary * 100 : 0;
    var opt = function (type) { return { pensionPct: type ? pct : 0, pensionType: type || "relief", studentLoan: loan || "none" }; };
    var base = TE.compute(chain, salary, opt(null)), ss = TE.compute(chain, salary, opt("sacrifice")), np = TE.compute(chain, salary, opt("netpay"));
    var v = function (r, id) { return r.values[id] || 0; };
    var erSaving = er.rate / 100 * Math.max(0, Math.min(amount, salary - er.threshold));
    var loans = function (r) { return v(r, "gb-student-loan") + v(r, "gb-postgrad-loan"); };
    var cost = base.net - ss.net, into = amount + (passOn ? erSaving : 0);
    return {
      amount: amount, base: base.net, net: ss.net, cost: cost, into: into,
      tax: v(base, "gb-income-tax") - v(ss, "gb-income-tax"),
      ni: v(base, "gb-ni") - v(ss, "gb-ni"),
      loan: loans(base) - loans(ss),
      erSaving: erSaving,
      perPound: into > 0 ? cost / into : 0,
      vsNetPay: ss.net - np.net
    };
  }
  return { compare: compare };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = SalarySacrifice;
} else {
  (function () {
    var box = document.getElementById("ss-tool");
    if (!box || typeof TaxEngine === "undefined") return;
    var $ = function (id) { return document.getElementById(id); };
    var ER = JSON.parse(box.getAttribute("data-employer-ni"));
    var chains = {}, busy = 0;
    var m = function (v, whole) { return TaxEngine.money(v, "GBP", whole); };
    var num = function (id) { var x = parseFloat($(id).value); return isFinite(x) && x >= 0 ? x : 0; };
    function calc() {
      var where = $("ss-where").value, chain = chains[where];
      if (!chain) {
        var mine = ++busy;
        TaxEngine.load(where).then(function (c) { chains[where] = c; if (mine === busy) calc(); });
        return;
      }
      var salary = num("ss-salary"), size = num("ss-amount");
      var amount = $("ss-unit").value === "pct" ? salary * size / 100 : size;
      var r = SalarySacrifice.compare(TaxEngine, chain, salary, amount, $("ss-loan").value, ER, $("ss-pass").checked);
      $("ss-cost").textContent = m(r.cost / 12);
      $("ss-into").textContent = "less take-home pay a month, for " + m(r.into / 12) + " a month in your pension";
      $("ss-before").textContent = m(r.base / 12) + " → " + m(r.net / 12);
      $("ss-year").textContent = m(r.into, true);
      $("ss-tax").textContent = m(r.tax);
      $("ss-ni").textContent = m(r.ni);
      $("ss-loanrow").style.display = r.loan > 0 ? "" : "none";
      $("ss-loansaved").textContent = m(r.loan);
      $("ss-per").textContent = r.into > 0 ? Math.round(r.perPound * 100) + "p" : "—";
      $("ss-vs").textContent = m(r.vsNetPay);
      $("ss-er").textContent = m(r.erSaving);
    }
    ["ss-salary", "ss-amount"].forEach(function (id) { $(id).addEventListener("input", calc); });
    ["ss-unit", "ss-where", "ss-loan", "ss-pass"].forEach(function (id) { $(id).addEventListener("change", calc); });
    calc();
  })();
}
