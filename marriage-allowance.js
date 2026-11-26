/* Marriage Allowance: what transferring £1,260 of the lower earner's Personal
   Allowance saves a couple. The figures come from GOV.UK (data/uk/marriage-
   allowance.json, passed in as `R`); the page is built from these same
   functions (tools/build-marriage-allowance-pages.js). Wages and pensions
   only: savings, dividends and other income can change the answer. */
var MarriageAllowance = (function () {
  "use strict";
  /* lower: the lower earner's income; higher: the partner's; scot: Scottish taxpayer */
  function calc(R, lower, higher, scot) {
    var pa = R.personalAllowance, t = R.transfer, rate = R.rate / 100;
    var upper = scot ? R.upper.scotland : R.upper.ruk;
    var out = { eligible: false, reason: "", partnerSaving: 0, yourExtraTax: 0, saving: 0, backdate: 0, upper: upper };
    if (lower >= pa) { out.reason = "lower"; return out; }
    if (higher <= pa) { out.reason = "partner-no-tax"; return out; }
    if (higher > upper) { out.reason = "partner-higher-rate"; return out; }
    out.eligible = true;
    /* tax on a slice of taxable income: Scotland's starter band (from the
       Scottish tax file, passed in as R.scot) is taxed at the starter rate */
    var tax = function (taxable) {
      if (!scot || !R.scot) return taxable * rate;
      var s = Math.min(taxable, R.scot.band);
      return s * R.scot.rate / 100 + Math.max(0, taxable - s) * rate;
    };
    /* the partner's tax falls by up to £252, but never by more than the tax they pay */
    out.partnerSaving = Math.min(R.maxSaving, Math.round(tax(Math.max(0, higher - pa)) * 100) / 100);
    /* the lower earner's allowance drops to £11,310, so income above that is taxed */
    out.yourExtraTax = Math.round(tax(Math.max(0, lower - (pa - t))) * 100) / 100;
    out.saving = Math.max(0, Math.round((out.partnerSaving - out.yourExtraTax) * 100) / 100);
    return out;
  }
  return { calc: calc };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = MarriageAllowance;
} else {
  (function () {
    var tool = document.getElementById("ma-tool");
    if (!tool) return;
    var R = JSON.parse(tool.getAttribute("data-rules"));
    var $ = function (id) { return document.getElementById(id); };
    var num = function (id) { var v = parseFloat(String($(id).value).replace(/,/g, "")); return isFinite(v) && v >= 0 ? v : 0; };
    var money = function (v, dp) { return "£" + v.toLocaleString("en-GB", { minimumFractionDigits: dp || 0, maximumFractionDigits: dp || 0 }); };
    function run() {
      var lower = num("ma-lower"), higher = num("ma-higher"), scot = $("ma-region").value === "scotland", back = $("ma-back").checked;
      if (lower > higher) { var x = lower; lower = higher; higher = x; }
      var r = MarriageAllowance.calc(R, lower, higher, scot);
      var past = back && r.eligible ? R.backdateYears.length * r.saving : 0;
      $("ma-saving").textContent = money(r.saving);
      $("ma-label").textContent = r.eligible ? "saved as a couple this tax year" : "Marriage Allowance won't help";
      $("ma-partner").textContent = r.eligible ? money(r.partnerSaving, 2) : "—";
      $("ma-you").textContent = r.eligible ? (r.yourExtraTax ? money(r.yourExtraTax, 2) : "£0") : "—";
      $("ma-past").textContent = r.eligible ? (back ? money(past) : "Not included") : "—";
      $("ma-total").textContent = r.eligible ? money(r.saving + past) : "—";
      var why = {
        "lower": "The lower earner's income is at or above the " + money(R.personalAllowance) + " Personal Allowance, so they have no unused allowance to transfer.",
        "partner-no-tax": "The higher earner's income is within their own Personal Allowance, so they pay no Income Tax for it to reduce.",
        "partner-higher-rate": "The higher earner's income is over " + money(r.upper) + ", so they pay " + (scot ? "the higher rate or above" : "the higher rate") + " and can't receive Marriage Allowance."
      };
      $("ma-note").textContent = r.eligible
        ? "The lower earner transfers " + money(R.transfer) + " of their Personal Allowance (it falls to " + money(R.personalAllowance - R.transfer) + "), and their partner's tax falls by up to " + money(R.maxSaving) + "." + (back ? " Backdating assumes you were both eligible in each year since 6 April 2022." : "")
        : why[r.reason];
    }
    ["ma-lower", "ma-higher", "ma-region", "ma-back"].forEach(function (id) { $(id).addEventListener("input", run); $(id).addEventListener("change", run); });
    run();
  })();
}
