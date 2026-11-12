/* Tax now or tax later? (/isa-vs-pension/, /roth-vs-traditional/, /tfsa-vs-rrsp/)

   Compares the same monthly cost to you in two kinds of account:

   - tax-free on the way out (ISA, Roth, TFSA): you pay in from taxed pay and
     everything comes out tax-free;
   - tax relief on the way in (pension, traditional 401(k)/IRA, RRSP): the
     contribution is made before tax, so the same cost to you buys a larger
     contribution, M ÷ (1 − tax rate now), but withdrawals are taxed — except
     any tax-free share (25% from a UK pension).

   Both grow at the same return, compounded monthly so a year grows by exactly
   the annual rate, paid in at the end of each month (as the site's investing
   pages do). The engine is shared by the browser and
   tools/build-tax-wrappers.js, which bakes each page's example into its HTML. */
var TaxWrapper = (function () {
  "use strict";

  function grow(monthly, rate, years) {
    var r = Math.pow(1 + rate / 100, 1 / 12) - 1;
    var n = Math.round(years * 12);
    var v = 0;
    for (var m = 0; m < n; m++) v = v * (1 + r) + monthly;
    return v;
  }

  /* o: { monthly, years, rate, taxNow, taxLater, employer, taxFree } (rates in %) */
  function compare(o) {
    var now = Math.min(99, Math.max(0, o.taxNow)) / 100;
    var later = Math.min(100, Math.max(0, o.taxLater)) / 100;
    var tf = (o.taxFree || 0) / 100;
    var free = grow(o.monthly, o.rate, o.years);
    var gross = o.monthly / (1 - now);
    var pot = grow(gross + (o.employer || 0), o.rate, o.years);
    var deferredNet = pot * (tf + (1 - tf) * (1 - later));
    return {
      paid: o.monthly * Math.round(o.years * 12),
      free: free,
      grossMonthly: gross,
      pot: pot,
      deferredTax: pot - deferredNet,
      deferred: deferredNet,
      winner: Math.abs(deferredNet - free) < 0.5 ? "same" : deferredNet > free ? "deferred" : "free",
      /* The tax rate later at which the two come out equal, with no employer money */
      breakEven: tf >= 1 ? null : Math.min(100, (now / (1 - tf)) * 100)
    };
  }

  return { grow: grow, compare: compare };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = TaxWrapper;
} else {
  (function () {
    var box = document.getElementById("tw-tool");
    if (!box) return;
    var $ = function (id) { return document.getElementById(id); };
    var symbol = box.getAttribute("data-symbol");
    var taxFree = Number(box.getAttribute("data-tax-free")) || 0;
    var names = { free: box.getAttribute("data-free"), deferred: box.getAttribute("data-deferred") };
    var ids = ["monthly", "years", "rate", "taxNow", "taxLater", "employer"];

    function money(v) { return isFinite(v) ? symbol + Math.round(v).toLocaleString("en-GB") : "—"; }
    function num(id) {
      var el = $("tw-" + id);
      if (!el) return 0;
      var raw = String(el.value).replace(/[\s,£$]/g, "");
      return raw === "" ? 0 : Number(raw);
    }
    function error(m) { $("tw-error").textContent = m || ""; $("tw-error").style.display = m ? "block" : "none"; }

    function calculate() {
      var o = {};
      for (var i = 0; i < ids.length; i++) {
        o[ids[i]] = num(ids[i]);
        if (!isFinite(o[ids[i]]) || o[ids[i]] < 0) return error("Enter positive numbers only.");
      }
      if (o.years < 1 || o.years > 60) return error("Enter 1 to 60 years.");
      if (o.taxNow >= 100 || o.taxLater > 100) return error("Tax rates must be below 100%.");
      error("");
      o.taxFree = taxFree;
      var r = TaxWrapper.compare(o);
      $("tw-free").textContent = money(r.free);
      $("tw-deferred").textContent = money(r.deferred);
      $("tw-gross").textContent = money(r.grossMonthly + o.employer) + " a month";
      $("tw-pot").textContent = money(r.pot);
      $("tw-deferred-tax").textContent = money(r.deferredTax);
      $("tw-paid").textContent = money(r.paid);
      var diff = Math.abs(r.deferred - r.free);
      $("tw-verdict").textContent = r.winner === "same" ? "About the same" : money(diff) + " more";
      $("tw-verdict-label").textContent = r.winner === "same" ? "either way, after tax" : "after tax in the " + names[r.winner];
    }

    ids.forEach(function (k) { var el = $("tw-" + k); if (el) el.addEventListener("input", calculate); });
  })();
}
