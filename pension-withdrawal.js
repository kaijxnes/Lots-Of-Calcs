/* Pension withdrawal tax calculator (/pension-withdrawal-tax-calculator/):
   the tax on taking money out of a defined contribution pension, what the
   provider takes off a first payment on an emergency code, and the refund
   to claim (or tax still owed).

   - From a pot you haven't touched, 25% of each lump sum is tax-free, while
     the lump sum allowance (£268,275) lasts; the rest is taxable income.
     After taking tax-free cash, withdrawals are all taxable.
   - The year's tax is the Income Tax on other income plus the taxable part,
     less the tax on the other income alone (UKCalcs.incomeTax, with the
     Personal Allowance taper).
   - A first payment is taxed on the emergency code on a month 1 basis: as
     if that amount were paid every month, so a twelfth of the Personal
     Allowance and of each band applies.
   Bands and allowance (`cfg`) come from the UK tax file; the 25% and the
   allowance (`R`) from data/uk/pension-withdrawal.json. The pages are built
   from these same functions (tools/build-pension-withdrawal-pages.js). */
var PensionWithdrawal = (function () {
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
  /* tax on one month's pay on a month 1 (non-cumulative) basis, allowance not tapered */
  function monthOne(cfg, pay) {
    return p2(bands(Math.max(0, pay - cfg.pa / 12), [0, cfg.basicBand / 12, cfg.addlFrom / 12], cfg.rates));
  }
  /* o: amount, fresh (25% tax-free), other (other taxable income this tax year), used (lump sum allowance used) */
  function calc(UK, cfg, R, o) {
    var amount = Math.max(0, o.amount || 0), other = Math.max(0, o.other || 0);
    var left = Math.max(0, R.lumpSumAllowance - Math.max(0, o.used || 0));
    var free = o.fresh ? p2(Math.min(amount * R.taxFreePct / 100, left)) : 0, taxable = p2(amount - free);
    var due = p2(UK.incomeTax(cfg, other + taxable, 0).nsTax - UK.incomeTax(cfg, other, 0).nsTax);
    var emergency = monthOne(cfg, taxable);
    return {
      amount: amount, free: free, taxable: taxable, capped: o.fresh && free < p2(amount * R.taxFreePct / 100), due: due, net: p2(amount - due),
      emergency: emergency, firstNet: p2(amount - emergency), refund: p2(emergency - due), rate: amount ? due / amount : 0
    };
  }
  /* the same total taken in equal parts over `years` tax years, each with the same other income */
  function spread(UK, cfg, R, o, years) {
    var part = calc(UK, cfg, R, { amount: o.amount / years, fresh: o.fresh, other: o.other, used: o.used });
    return { years: years, each: part, due: p2(part.due * years) };
  }
  return { calc: calc, spread: spread, monthOne: monthOne };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = PensionWithdrawal;
} else {
  (function () {
    var box = document.getElementById("pw-tool");
    if (!box) return;
    var D = JSON.parse(box.getAttribute("data-rules")), cfg = D.cfg, R = D.R;
    var $ = function (id) { return document.getElementById(id); };
    var num = function (id) { var s = String($(id).value).replace(/[\s,£]/g, ""); return s === "" ? 0 : Number(s); };
    var money = function (v) { return "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
    var OUT = ["pw-net", "pw-free", "pw-taxable", "pw-due", "pw-emergency", "pw-first", "pw-refund", "pw-spread"];
    function run() {
      var err = $("pw-error"), amount = num("pw-amount"), other = num("pw-other"), used = num("pw-used"), fresh = $("pw-type").value === "fresh";
      var bad = !(amount > 0) || amount > 1e9 ? "Enter the amount you're taking out." : !(other >= 0) || other > 1e9 ? "Enter your other taxable income this tax year, or 0." : !(used >= 0) || used > 1e9 ? "Enter the lump sum allowance you've used, or 0." : "";
      err.textContent = bad; err.style.display = bad ? "block" : "none";
      if (bad) { OUT.forEach(function (id) { $(id).textContent = "—"; }); $("pw-label").textContent = "after tax"; $("pw-note").textContent = ""; return; }
      var r = PensionWithdrawal.calc(UKCalcs, cfg, R, { amount: amount, fresh: fresh, other: other, used: used });
      $("pw-net").textContent = money(r.net);
      $("pw-label").textContent = "after tax, from " + money(r.amount) + " (" + (Math.round(r.rate * 1000) / 10).toLocaleString("en-GB") + "% tax)";
      $("pw-free").textContent = money(r.free) + (r.capped ? " (lump sum allowance reached)" : "");
      $("pw-taxable").textContent = money(r.taxable);
      $("pw-due").textContent = money(r.due);
      $("pw-emergency").textContent = money(r.emergency);
      $("pw-first").textContent = money(r.firstNet);
      $("pw-refund").textContent = r.refund > 0.005 ? money(r.refund) + " to claim back" : r.refund < -0.005 ? money(-r.refund) + " more to pay later" : "None";
      var s2 = PensionWithdrawal.spread(UKCalcs, cfg, R, { amount: amount, fresh: fresh, other: other, used: used }, 2);
      $("pw-spread").textContent = s2.due < r.due - 0.005 ? money(s2.due) + " (" + money(r.due - s2.due) + " less)" : "No saving";
      $("pw-note").textContent = r.refund > 0.005 ? "A first payment is usually taxed on an emergency code. You can claim the overpayment back from HMRC: form P55 if you took part of your pension, P53Z if you took all of it, or P50Z if you've also stopped work." : r.refund < -0.005 ? "Your other income has already used your Personal Allowance, so you could owe extra tax at the end of the tax year." : "";
    }
    ["pw-amount", "pw-other", "pw-used"].forEach(function (id) { $(id).addEventListener("input", run); });
    $("pw-type").addEventListener("change", run);
    run();
  })();
}
