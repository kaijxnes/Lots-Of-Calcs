/* How much can I borrow? Two lenders' rules of thumb.

   UK: lenders lend a multiple of household income (usually 4 to 4.5 times),
   less something for other monthly commitments. The page also shows the
   payment against take-home pay, worked out by tax-engine.js from the UK
   tax registry, because a multiple of gross pay says nothing about what is
   left after tax.

   US: lenders cap housing costs (principal, interest, property tax,
   insurance, HOA) at about 28% of gross monthly income, and all debts at
   about 36%. The largest home price that fits both is solved directly.

   The same functions run in the browser and in tools/build-affordability.js,
   which bakes the default case into the page. */
var Affordability = (function () {
  "use strict";

  function payment(loan, rate, years) {
    var n = Math.round(years * 12);
    var r = rate / 100 / 12;
    if (loan <= 0) return 0;
    if (r === 0) return loan / n;
    var f = Math.pow(1 + r, n);
    return (loan * r * f) / (f - 1);
  }

  /* What one unit of loan costs a month */
  function perPound(rate, years) {
    return payment(1, rate, years);
  }

  /* UK: income multiple. Lenders typically knock off about a year's worth of
     other monthly commitments times the multiple's effect; here each £1 a
     month of commitments reduces borrowing by what that £1 would have repaid. */
  function uk(o) {
    var income = (o.income || 0) + (o.partner || 0);
    var byIncome = income * o.multiple;
    var lostToDebts = (o.debts || 0) / perPound(o.rate, o.years);
    var loan = Math.max(0, byIncome - lostToDebts);
    var price = loan + (o.deposit || 0);
    var pay = payment(loan, o.rate, o.years);
    return {
      loan: loan, price: price, payment: pay,
      stressed: payment(loan, o.rate + (o.stress || 0), o.years),
      ltv: price > 0 ? (loan / price) * 100 : 0
    };
  }

  /* US: the largest loan whose PITI fits under 28% of gross monthly income,
     and whose PITI plus other debts fits under 36% */
  function us(o) {
    var monthly = (o.income || 0) / 12;
    var cap = Math.min(monthly * (o.front / 100), monthly * (o.back / 100) - (o.debts || 0));
    var k = perPound(o.rate, o.years);
    var tax = (o.taxPct || 0) / 100 / 12; // property tax, per $ of home value a month
    var fixed = (o.insurance || 0) / 12 + (o.hoa || 0);
    var loan = Math.max(0, (cap - fixed - tax * (o.down || 0)) / (k + tax));
    var price = loan + (o.down || 0);
    var pi = payment(loan, o.rate, o.years);
    return {
      loan: loan, price: price, cap: Math.max(0, cap),
      pi: pi, tax: tax * price, other: fixed,
      piti: pi + tax * price + fixed,
      ltv: price > 0 ? (loan / price) * 100 : 0
    };
  }

  return { payment: payment, uk: uk, us: us };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = Affordability;
} else {
  (function () {
    var box = document.getElementById("afford-tool");
    if (!box) return;
    var $ = function (id) { return document.getElementById(id); };
    var num = function (id) {
      var v = Number(String($(id).value).replace(/[\s,£$]/g, ""));
      return isFinite(v) ? v : 0;
    };
    var gbp = function (v) { return "£" + Math.round(v).toLocaleString("en-GB"); };
    var usd = function (v) { return "$" + Math.round(v).toLocaleString("en-US"); };
    var ukChain = null;

    document.querySelectorAll(".tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        document.querySelectorAll(".tab").forEach(function (t) { t.classList.remove("active"); });
        document.querySelectorAll(".tab-panel").forEach(function (p) { p.classList.remove("active"); });
        tab.classList.add("active");
        document.querySelector('[data-panel="' + tab.getAttribute("data-tab") + '"]').classList.add("active");
      });
    });

    /* Take-home of each earner from the UK tax registry */
    function takeHomeMonthly(income, partner) {
      if (!ukChain) return null;
      var a = income > 0 ? TaxEngine.compute(ukChain, income).perMonth : 0;
      var b = partner > 0 ? TaxEngine.compute(ukChain, partner).perMonth : 0;
      return a + b;
    }

    function calcUk() {
      var o = { income: num("uk-income"), partner: num("uk-partner"), multiple: num("uk-multiple"), deposit: num("uk-deposit"),
        debts: num("uk-debts"), rate: num("uk-rate"), years: num("uk-years"), stress: 3 };
      if (o.years <= 0) return;
      var r = Affordability.uk(o);
      $("uk-loan").textContent = gbp(r.loan);
      $("uk-price").textContent = gbp(r.price);
      $("uk-ltv").textContent = Math.round(r.ltv) + "%";
      $("uk-payment").textContent = gbp(r.payment);
      $("uk-stressed").textContent = gbp(r.stressed);
      var net = takeHomeMonthly(o.income, o.partner);
      $("uk-share").textContent = net ? Math.round((r.payment / net) * 100) + "% of " + gbp(net) : "—";
    }

    function calcUs() {
      var o = { income: num("us-income"), debts: num("us-debts"), down: num("us-down"), rate: num("us-rate"), years: num("us-years"),
        taxPct: num("us-taxpct"), insurance: num("us-insurance"), hoa: num("us-hoa"), front: 28, back: 36 };
      if (o.years <= 0) return;
      var r = Affordability.us(o);
      $("us-price").textContent = usd(r.price);
      $("us-loan").textContent = usd(r.loan);
      $("us-piti").textContent = usd(r.piti);
      $("us-pi").textContent = usd(r.pi);
      $("us-tax").textContent = usd(r.tax);
      $("us-other").textContent = usd(r.other);
      $("us-ltv").textContent = Math.round(r.ltv) + "%";
    }

    ["uk-income", "uk-partner", "uk-multiple", "uk-deposit", "uk-debts", "uk-rate", "uk-years"].forEach(function (id) { $(id).addEventListener("input", calcUk); });
    ["us-income", "us-debts", "us-down", "us-rate", "us-years", "us-taxpct", "us-insurance", "us-hoa"].forEach(function (id) { $(id).addEventListener("input", calcUs); });

    if (typeof TaxEngine !== "undefined") {
      TaxEngine.load("gb").then(function (c) { ukChain = c; calcUk(); }).catch(function () { /* the share line stays as baked */ });
    }
  })();
}
