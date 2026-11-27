/* Redundancy and termination pay tax calculator (/redundancy-tax-calculator/):
   how much of a payment for leaving a job is tax-free, how much is taxed,
   and roughly what comes off it. Rules from GOV.UK and HMRC's employer
   guide CWG2 in data/uk/termination-pay.json (`R`):
     - unpaid wages, holiday pay, bonuses and pay in lieu of notice are
       earnings: Income Tax and National Insurance;
     - for notice you don't work, the part of severance or enhanced
       redundancy equal to the pay you'd have earned (Post-Employment Notice
       Pay, PENP) is also earnings, but never more than that severance;
       statutory redundancy pay is never PENP;
     - the rest of the statutory redundancy, severance and non-cash benefits
       is tax-free up to a combined £30,000; above that it pays Income Tax
       but not employee National Insurance;
     - with your final pay, PAYE runs normally (cumulative code) and NI uses
       your usual earnings period; after your P45, PAYE uses 0T on a month 1
       basis and NI a weekly earnings period.
   Tax for the year assumes no more income after you leave. Bands from the
   UK tax file (`cfg`, England, Wales and Northern Ireland). The page is
   built from these same functions (tools/build-termination-pay-pages.js). */
var TerminationPay = (function () {
  "use strict";
  var p2 = function (v) { return Math.round(v * 100) / 100; };
  function bands(amount, edges, rates) {
    var tax = 0;
    for (var i = 0; i < rates.length; i++) {
      var lo = edges[i], hi = i + 1 < edges.length ? edges[i + 1] : Infinity;
      if (amount > lo) tax += (Math.min(amount, hi) - lo) * rates[i] / 100;
    }
    return tax;
  }
  /* PAYE to date in tax month m on a cumulative code with the full allowance (1257L) */
  function cumulative(cfg, pay, m) {
    var f = m / 12;
    return bands(Math.max(0, pay - cfg.pa * f), [0, cfg.basicBand * f, cfg.addlFrom * f], cfg.rates);
  }
  /* PAYE on one month's payment on 0T, month 1 basis: no allowance */
  function zeroT(cfg, pay) { return bands(pay, [0, cfg.basicBand / 12, cfg.addlFrom / 12], cfg.rates); }
  /* employee NI in one earnings period of 1/n of a year */
  function periodNI(UK, cfg, pay, n) { return UK.employeeNI(cfg, pay * n) / n; }
  /* split the payment: o.statutory, o.severance (enhanced redundancy, severance and
     non-cash benefits), o.noticePay (pay for notice not worked and not paid
     separately), o.earnings (unpaid wages, holiday pay, bonus, PILON) */
  function split(R, o) {
    var st = Math.max(0, o.statutory || 0), sev = Math.max(0, o.severance || 0);
    var penp = Math.min(Math.max(0, o.noticePay || 0), sev), pot = st + sev - penp;
    var earn = p2(Math.max(0, o.earnings || 0) + penp), free = p2(Math.min(R.taxFreeLimit, pot)), over = p2(Math.max(0, pot - R.taxFreeLimit));
    return { penp: p2(penp), earnings: earn, free: free, over: over, taxable: p2(earn + over), total: p2(st + sev + Math.max(0, o.earnings || 0)) };
  }
  /* o: the split's inputs plus salary (a year), month (tax month you leave, 1 = April), afterP45 */
  function calc(UK, cfg, R, o) {
    var s = split(R, o), sal = Math.max(0, o.salary || 0), m = Math.min(12, Math.max(1, Math.round(o.month || 1)));
    var toDate = sal * m / 12, month = sal / 12;
    var year = p2(UK.incomeTax(cfg, toDate + s.taxable, 0).nsTax - UK.incomeTax(cfg, toDate, 0).nsTax);
    var paye = o.afterP45 ? p2(zeroT(cfg, s.taxable)) : p2(cumulative(cfg, toDate + s.taxable, m) - cumulative(cfg, toDate, m));
    var ni = o.afterP45 ? p2(periodNI(UK, cfg, s.earnings, 52)) : p2(periodNI(UK, cfg, month + s.earnings, 12) - periodNI(UK, cfg, month, 12));
    return Object.assign(s, { year: year, paye: paye, ni: ni, net: p2(s.total - paye - ni), back: p2(paye - year) });
  }
  return { split: split, calc: calc, zeroT: zeroT, cumulative: cumulative };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = TerminationPay;
} else {
  (function () {
    var box = document.getElementById("tp-tool");
    if (!box) return;
    var D = JSON.parse(box.getAttribute("data-rules")), cfg = D.cfg, R = D.R;
    var $ = function (id) { return document.getElementById(id); };
    var num = function (id) { var s = String($(id).value).replace(/[\s,£]/g, ""); return s === "" ? 0 : Number(s); };
    var money = function (v) { return "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
    var OUT = ["tp-net", "tp-free", "tp-earn", "tp-over", "tp-paye", "tp-ni", "tp-year"];
    function run() {
      var err = $("tp-error"), v = { statutory: num("tp-statutory"), severance: num("tp-severance"), weeks: num("tp-weeks"), weekly: num("tp-weekly"), earnings: num("tp-earnings"), salary: num("tp-salary") };
      var bad = Object.keys(v).some(function (k) { return !(v[k] >= 0) || v[k] > 1e8; }) ? "Enter amounts of 0 or more." : v.weeks > 520 ? "Enter the weeks of notice you didn't work (up to 520)." : "";
      err.textContent = bad; err.style.display = bad ? "block" : "none";
      if (bad) { OUT.forEach(function (id) { $(id).textContent = "—"; }); $("tp-note").textContent = ""; return; }
      var r = TerminationPay.calc(UKCalcs, cfg, R, { statutory: v.statutory, severance: v.severance, noticePay: v.weeks * v.weekly, earnings: v.earnings, salary: v.salary, month: Number($("tp-month").value), afterP45: $("tp-p45").checked });
      $("tp-net").textContent = money(r.net);
      $("tp-free").textContent = money(r.free);
      $("tp-earn").textContent = money(r.earnings) + (r.penp ? " (incl. " + money(r.penp) + " notice pay)" : "");
      $("tp-over").textContent = money(r.over);
      $("tp-paye").textContent = money(r.paye);
      $("tp-ni").textContent = money(r.ni);
      $("tp-year").textContent = money(r.year);
      $("tp-note").textContent = r.taxable === 0 ? "All of it is under the £30,000 tax-free limit and none of it counts as earnings, so no tax or National Insurance." :
        r.back > 1 ? "About " + money(r.back) + " more than the tax for the year comes off, if you have no more income this tax year. If you think you've paid too much tax, contact HMRC." :
        r.back < -1 ? "About " + money(-r.back) + " less than the tax for the year comes off, so you may owe it later." : "The tax taken off is about right for the year, if you have no more income this tax year.";
    }
    ["tp-statutory", "tp-severance", "tp-weeks", "tp-weekly", "tp-earnings", "tp-salary"].forEach(function (id) { $(id).addEventListener("input", run); });
    ["tp-month", "tp-p45"].forEach(function (id) { $(id).addEventListener("change", run); });
    run();
  })();
}
