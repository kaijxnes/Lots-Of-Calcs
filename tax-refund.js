/* Tax refund estimator: the Income Tax due on a tax year's pay against the
   tax taken through PAYE. Uses TaxCode (tax-code.js) for the code and the
   bands; R is the same rules object the tax code checker uses. The page is
   built from these functions (tools/build-tax-refund-pages.js). */
var TaxRefund = (function () {
  "use strict";
  var TC = typeof module !== "undefined" && module.exports ? require("./tax-code.js") : TaxCode;
  function banded(bands, taxable) {
    var t = 0;
    for (var i = 0; i < bands.length; i++) {
      var lo = bands[i][0], hi = i + 1 < bands.length ? bands[i + 1][0] : Infinity;
      if (taxable > lo) t += (Math.min(taxable, hi) - lo) * bands[i][1] / 100;
    }
    return t;
  }
  /* the tax actually due for the whole year on the standard allowance, which
     falls by £1 for every £2 of income over £100,000 */
  function due(R, income, scot) {
    var pa = Math.max(0, R.personalAllowance - Math.max(0, income - R.taperFrom) / 2);
    return Math.round(banded(scot ? R.bands.sct : R.bands.ruk, Math.max(0, income - pa)) * 100) / 100;
  }
  /* tax PAYE takes on `months` equal monthly payments on a code, cumulatively
     (an emergency M1 code gives the same on equal pay) */
  function taken(R, code, monthlyPay, months) {
    var p = TC.parse(code);
    if (!p) return null;
    var pay = monthlyPay * months, f = months / 12, bands = p.region === "sct" ? R.bands.sct : R.bands.ruk;
    if (p.kind === "nt") return 0;
    if (p.kind === "flat") return Math.round(pay * R.flat[p.flatKey]) / 100;
    var taxable = p.kind === "0t" ? pay : p.kind === "k" ? pay + p.addition * f : Math.max(0, pay - p.allowance * f);
    var t = banded(bands.map(function (b) { return [b[0] * f, b[1]]; }), taxable);
    if (p.kind === "k") t = Math.min(t, pay * R.kCap / 100);
    return Math.round(t * 100) / 100;
  }
  return { due: due, taken: taken };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = TaxRefund;
} else {
  (function () {
    var tool = document.getElementById("tr-tool");
    if (!tool) return;
    var R = JSON.parse(tool.getAttribute("data-rules"));
    var $ = function (id) { return document.getElementById(id); };
    var num = function (id) { var v = parseFloat(String($(id).value).replace(/,/g, "")); return isFinite(v) && v >= 0 ? v : 0; };
    var money = function (v) { return "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
    function run() {
      var months = Math.min(12, Math.max(0, Math.round(num("tr-months")))), monthly = num("tr-monthly"), more = num("tr-more");
      var scot = $("tr-region").value === "scotland", pay = monthly * months, income = pay + more;
      var typed = $("tr-paid").value.trim() !== "";
      var est = TaxRefund.taken(R, $("tr-code").value || (scot ? "S1257L" : "1257L"), monthly, months);
      var paid = typed ? num("tr-paid") : est;
      $("tr-code-err").style.display = est === null && !typed ? "block" : "none";
      if (paid === null) { ["tr-value", "tr-due", "tr-taken", "tr-income"].forEach(function (id) { $(id).textContent = "—"; }); $("tr-label").textContent = "enter a valid tax code or the tax taken"; $("tr-next").textContent = ""; return; }
      var d = TaxRefund.due(R, income, scot), diff = Math.round((paid - d) * 100) / 100;
      $("tr-value").textContent = money(Math.abs(diff));
      $("tr-label").textContent = diff > 0.5 ? "refund you're likely owed" : diff < -0.5 ? "you may owe HMRC" : "about right: nothing to claim";
      $("tr-income").textContent = money(income);
      $("tr-due").textContent = money(d);
      $("tr-taken").textContent = money(paid) + (typed ? "" : " (estimated)");
      $("tr-next").textContent = diff > 0.5
        ? "HMRC usually works this out after 5 April and sends a P800 between June and November; claim online and it arrives within 5 working days. If you've left work, you may be able to claim sooner: check how on GOV.UK."
        : diff < -0.5 ? (Math.abs(diff) < R.collectLimit ? "HMRC usually collects underpaid tax of less than £" + R.collectLimit.toLocaleString("en-GB") + " through your tax code, in equal amounts over the next tax year." : "HMRC will write to you about how to pay.") : "";
    }
    ["tr-monthly", "tr-months", "tr-more", "tr-paid", "tr-code", "tr-region"].forEach(function (id) { $(id).addEventListener("input", run); $(id).addEventListener("change", run); });
    run();
  })();
}
