/* Mortgage repayment calculator (/mortgage-calculator/).

   The monthly payment on a repayment (capital and interest) or interest-only
   mortgage, the interest over the term and the balance at the end of each
   year. Payments use the standard repayment formula on a monthly rate of the
   annual rate divided by twelve, as the site's other mortgage pages do.
   tools/build-mortgage-calculator.js runs the same code to bake the example
   into the page. */
var MortgageMaths = (function () {
  "use strict";

  function payment(loan, rate, years) {
    var n = Math.round(years * 12);
    var r = rate / 100 / 12;
    if (loan <= 0 || n <= 0) return 0;
    if (r === 0) return loan / n;
    var f = Math.pow(1 + r, n);
    return (loan * r * f) / (f - 1);
  }

  /* o: { loan, rate, years, type: "repayment" | "interest" } */
  function schedule(o) {
    var r = o.rate / 100 / 12;
    var n = Math.round(o.years * 12);
    var monthly = o.type === "interest" ? o.loan * r : payment(o.loan, o.rate, o.years);
    var balance = o.loan;
    var interest = 0, yearInterest = 0, yearCapital = 0;
    var rows = [];
    for (var m = 1; m <= n; m++) {
      var i = balance * r;
      var capital = o.type === "interest" ? 0 : Math.min(balance, monthly - i);
      balance -= capital;
      interest += i;
      yearInterest += i;
      yearCapital += capital;
      if (m % 12 === 0 || m === n) {
        rows.push({ year: Math.ceil(m / 12), interest: yearInterest, capital: yearCapital, balance: Math.max(0, balance) });
        yearInterest = 0;
        yearCapital = 0;
      }
    }
    var paid = interest + (o.loan - Math.max(0, balance));
    return {
      monthly: monthly,
      interest: interest,
      total: o.type === "interest" ? interest + o.loan : paid,
      balance: Math.max(0, balance),
      rows: rows
    };
  }

  return { payment: payment, schedule: schedule };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = MortgageMaths;
} else {
  (function () {
    var box = document.getElementById("mc-tool");
    if (!box) return;
    var $ = function (id) { return document.getElementById(id); };
    var ids = ["price", "deposit", "rate", "years"];
    var symbol = $("mc-currency").value;

    function num(id) {
      var raw = String($("mc-" + id).value).replace(/[\s,£$€]/g, "");
      return raw === "" ? 0 : Number(raw);
    }
    function money(v, dp) {
      if (!isFinite(v)) return "—";
      var d = dp === undefined ? 2 : dp;
      return symbol + v.toLocaleString("en-GB", { minimumFractionDigits: d, maximumFractionDigits: d });
    }
    function error(message) {
      $("mc-error").textContent = message || "";
      $("mc-error").style.display = message ? "block" : "none";
    }

    function calculate() {
      symbol = $("mc-currency").value;
      var price = num("price"), deposit = num("deposit"), rate = num("rate"), years = num("years");
      var type = $("mc-type").value;
      if ([price, deposit, rate, years].some(function (v) { return !isFinite(v) || v < 0; })) return error("Enter positive numbers only.");
      if (years < 1 || years > 50) return error("Enter a term from 1 to 50 years.");
      if (deposit > price) return error("The deposit is more than the price.");
      error("");
      var loan = price - deposit;
      var s = MortgageMaths.schedule({ loan: loan, rate: rate, years: years, type: type });
      $("mc-monthly").textContent = money(s.monthly);
      $("mc-label").textContent = (type === "interest" ? "a month, interest only" : "a month") + " on a " + money(loan, 0) + " mortgage";
      $("mc-loan").textContent = money(loan, 0);
      $("mc-ltv").textContent = price > 0 ? Math.round((loan / price) * 100) + "%" : "—";
      $("mc-interest").textContent = money(s.interest, 0);
      $("mc-total").textContent = money(s.total, 0);
      $("mc-end").textContent = money(s.balance, 0);
      var body = $("mc-body");
      body.textContent = "";
      s.rows.forEach(function (row) {
        var tr = document.createElement("tr");
        [String(row.year), money(row.interest, 0), money(row.capital, 0), money(row.balance, 0)].forEach(function (t) {
          var td = document.createElement("td");
          td.textContent = t;
          tr.appendChild(td);
        });
        body.appendChild(tr);
      });
    }

    ids.forEach(function (k) { $("mc-" + k).addEventListener("input", calculate); });
    $("mc-type").addEventListener("change", calculate);
    $("mc-currency").addEventListener("change", calculate);
  })();
}
