/* Self Assessment: payments on account, and penalties and interest for filing
   or paying late. The rules come from GOV.UK (data/uk/self-assessment.json,
   passed in as `rules`); the pages are built from the same functions
   (tools/build-self-assessment-pages.js), so they can't disagree. */
var SelfAssessment = (function () {
  "use strict";
  var DAY = 86400000;
  function utc(y, m, d) { return new Date(Date.UTC(y, m, d)); }
  function addMonths(d, n) { return utc(d.getUTCFullYear(), d.getUTCMonth() + n, d.getUTCDate()); }
  function days(a, b) { return Math.round((b - a) / DAY); }

  /* What's due on 31 January and 31 July.
     bill: income tax and Class 4 NI for the year just ended
     other: capital gains tax and student loan for that year (balancing payment only)
     paid: payments on account already made towards that year
     atSource: more than 80% of last year's tax was paid outside Self Assessment */
  function payments(rules, bill, other, paid, atSource) {
    var p = rules.paymentsOnAccount;
    var balancing = bill + other - paid;
    var needed = bill >= p.minBill && !atSource;
    var poa = needed ? bill * p.share : 0;
    return {
      balancing: balancing,
      poa: poa,
      needed: needed,
      reason: needed ? "" : (bill < p.minBill ? "under" : "atSource"),
      january: Math.max(0, balancing) + poa,
      july: poa,
      refund: balancing < 0 ? -balancing : 0
    };
  }

  /* Penalties and interest on a return and bill due on `due` (31 January).
     filed / paid: dates, or null for "not yet" (counted to `asOf`). */
  function penalties(rules, tax, due, filed, paid, asOf) {
    var f = rules.penalties.filing, pay = rules.penalties.payment;
    var out = { filing: [], payment: [], interest: 0, interestDays: 0 };
    var fEnd = filed || asOf, pEnd = paid || asOf;
    if (fEnd > due) {
      out.filing.push(["Late filing: initial penalty", f.initial]);
      /* daily penalties start once the return is 3 months late: 31 January
         plus 3 months rolls over to 1 May */
      var dailyFrom = addMonths(due, f.dailyAfterMonths);
      if (fEnd >= dailyFrom) {
        var n = Math.min(f.dailyMax / f.daily, days(dailyFrom, fEnd) + 1);
        out.filing.push(["Daily penalties: " + n + " day" + (n === 1 ? "" : "s") + " at £" + f.daily, n * f.daily]);
      }
      if (fEnd > addMonths(due, 6)) out.filing.push(["6 months late: " + f.sixMonthPct + "% of the tax or £" + f.sixMonthMin, Math.max(tax * f.sixMonthPct / 100, f.sixMonthMin)]);
      if (fEnd > addMonths(due, 12)) out.filing.push(["12 months late: " + f.twelveMonthPct + "% of the tax or £" + f.twelveMonthMin, Math.max(tax * f.twelveMonthPct / 100, f.twelveMonthMin)]);
    }
    if (tax > 0 && pEnd > due) {
      if (pEnd > new Date(due.getTime() + 30 * DAY)) out.payment.push(["Unpaid at 30 days: " + pay.pct + "%", tax * pay.pct / 100]);
      if (pEnd > addMonths(due, 6)) out.payment.push(["Unpaid at 6 months: " + pay.pct + "%", tax * pay.pct / 100]);
      if (pEnd > addMonths(due, 12)) out.payment.push(["Unpaid at 12 months: " + pay.pct + "%", tax * pay.pct / 100]);
      out.interestDays = days(due, pEnd);
      out.interest = tax * rules.interest.latePaymentRate / 100 * out.interestDays / 365;
    }
    var sum = function (l) { return l.reduce(function (a, x) { return a + x[1]; }, 0); };
    out.filingTotal = sum(out.filing);
    out.paymentTotal = sum(out.payment);
    out.total = out.filingTotal + out.paymentTotal + out.interest;
    return out;
  }

  return { payments: payments, penalties: penalties, utc: utc };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = SelfAssessment;
} else {
  (function () {
    var $ = function (id) { return document.getElementById(id); };
    var money = function (v) { return "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
    var num = function (id) { var v = parseFloat($(id).value); return isFinite(v) && v >= 0 ? v : 0; };
    var parseDate = function (s) { if (!s) return null; var p = s.split("-"); return SelfAssessment.utc(+p[0], +p[1] - 1, +p[2]); };
    var rows = function (el, list) {
      el.innerHTML = list.map(function (r) { return '<div class="result-row"><span class="r-label">' + r[0] + '</span><span class="r-value">' + money(r[1]) + "</span></div>"; }).join("");
    };

    var poaTool = $("poa-tool");
    if (poaTool) {
      var R = JSON.parse(poaTool.getAttribute("data-rules"));
      var calcPoa = function () {
        var r = SelfAssessment.payments(R, num("poa-bill"), num("poa-other"), num("poa-paid"), $("poa-source").checked);
        $("poa-jan").textContent = money(r.january);
        $("poa-bal").textContent = r.refund ? "Overpaid by " + money(r.refund) : money(r.balancing);
        $("poa-first").textContent = money(r.poa);
        $("poa-july").textContent = money(r.july);
        $("poa-note").textContent = r.needed ? "" : r.reason === "under" ? "No payments on account: your bill is under £" + R.paymentsOnAccount.minBill.toLocaleString("en-GB") + "." : "No payments on account: more than 80% of your tax was paid outside Self Assessment.";
      };
      ["poa-bill", "poa-other", "poa-paid"].forEach(function (id) { $(id).addEventListener("input", calcPoa); });
      $("poa-source").addEventListener("change", calcPoa);
      calcPoa();
    }

    var penTool = $("pen-tool");
    if (penTool) {
      var P = JSON.parse(penTool.getAttribute("data-rules"));
      var due = parseDate(penTool.getAttribute("data-due"));
      var calcPen = function () {
        var asOf = parseDate($("pen-asof").value) || new Date();
        var r = SelfAssessment.penalties(P, num("pen-tax"), due, parseDate($("pen-filed").value), parseDate($("pen-paid").value), asOf);
        $("pen-total").textContent = money(r.total);
        rows($("pen-filing"), r.filing.length ? r.filing : [["No late filing penalty", 0]]);
        rows($("pen-payment"), r.payment.length ? r.payment : [["No late payment penalty", 0]]);
        $("pen-interest").textContent = money(r.interest) + (r.interestDays ? " (" + r.interestDays + " days at " + P.interest.latePaymentRate + "%)" : "");
      };
      ["pen-tax", "pen-filed", "pen-paid", "pen-asof"].forEach(function (id) { $(id).addEventListener("input", calcPen); });
      calcPen();
    }
  })();
}
