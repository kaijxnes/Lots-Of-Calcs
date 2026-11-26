/* Second job tax calculator (/second-job-tax-calculator/): the tax PAYE takes
   from each job on its own tax code, against the tax due on both together,
   and the National Insurance each employer takes separately. Uses TaxCode
   (tax-code.js) and TaxRefund (tax-refund.js) with the same rules object as
   the tax code checker, `R`; `N` holds the National Insurance thresholds
   from the UK tax file. The page is built from these same functions
   (tools/build-second-job-pages.js). Assumes each job pays the same every
   payday through the tax year. */
var SecondJob = (function () {
  "use strict";
  var node = typeof module !== "undefined" && module.exports;
  var TC = node ? require("./tax-code.js") : TaxCode, TR = node ? require("./tax-refund.js") : TaxRefund;

  /* Class 1 National Insurance on a year's pay from one job */
  function ni(N, pay) {
    return Math.max(0, Math.min(pay, N.uel) - N.pt) * N.main / 100 + Math.max(0, pay - N.uel) * N.upper / 100;
  }
  function allowance(R, income) { return Math.max(0, R.personalAllowance - Math.max(0, income - R.taperFrom) / 2); }

  /* the code that usually fits a second job: a flat-rate code at the rate
     the top of the year's income is taxed at, or, if the main job doesn't
     use the whole allowance, the allowance split between the two */
  function suggest(R, pay1, pay2, scot) {
    var pre = scot ? "S" : "", total = pay1 + pay2, pa = allowance(R, total);
    if (pay1 < pa) {
      var c1 = Math.ceil(pay1 / 10), c2 = Math.floor((pa - c1 * 10) / 10);
      if (c2 > 0) return { split: true, code1: pre + c1 + "L", code2: pre + c2 + "L" };
    }
    var bands = scot ? R.bands.sct : R.bands.ruk;
    var at = function (x) { var r = bands[0][1]; bands.forEach(function (b) { if (x > b[0]) r = b[1]; }); return r; };
    var top = Math.max(0, total - pa), bottom = Math.max(0, pay1 - pa), rate = at(top), low = at(bottom + 0.01);
    var code = function (r) {
      var key = null;
      Object.keys(R.flat).forEach(function (k) { if (!key && R.flat[k] === r && (scot ? k.charAt(0) === "S" : /^(BR|D\d)$/.test(k))) key = k; });
      return key || pre + "BR";
    };
    /* the second job's pay spans two rates: no flat-rate code is exact */
    if (low !== rate && code(low) !== code(rate)) return { split: false, straddle: true, low: low, rate: rate, codes: [code(low), code(rate)] };
    return { split: false, code2: code(rate), rate: rate };
  }

  function calc(R, N, pay1, code1, pay2, code2, scot) {
    var t1 = TR.taken(R, code1, pay1 / 12, 12), t2 = TR.taken(R, code2, pay2 / 12, 12);
    if (t1 === null || t2 === null) return { bad: t1 === null ? 1 : 2 };
    var due = TR.due(R, pay1 + pay2, scot), n1 = ni(N, pay1), n2 = ni(N, pay2);
    return {
      tax1: t1, tax2: t2, due: due, diff: Math.round((due - t1 - t2) * 100) / 100,
      ni1: n1, ni2: n2, niOne: ni(N, pay1 + pay2),
      net1: pay1 - t1 - n1, net2: pay2 - t2 - n2,
      p1: TC.parse(code1), p2: TC.parse(code2),
      defer: pay1 >= N.deferMain && pay2 >= N.deferOther
    };
  }
  return { ni: ni, suggest: suggest, calc: calc };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = SecondJob;
} else {
  (function () {
    var tool = document.getElementById("sj-tool");
    if (!tool) return;
    var R = JSON.parse(tool.getAttribute("data-rules")), N = JSON.parse(tool.getAttribute("data-ni"));
    var $ = function (id) { return document.getElementById(id); };
    var num = function (id) { var v = parseFloat(String($(id).value).replace(/[,£\s]/g, "")); return isFinite(v) && v >= 0 ? v : 0; };
    var money = function (v, whole) { return "£" + v.toLocaleString("en-GB", { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: whole ? 0 : 2 }); };
    var sug = null;
    function run() {
      var scot = $("sj-region").value === "scotland", pay1 = num("sj-pay1"), pay2 = num("sj-pay2");
      var r = SecondJob.calc(R, N, pay1, $("sj-code1").value, pay2, $("sj-code2").value, scot);
      $("sj-err").style.display = r.bad ? "block" : "none";
      if (r.bad) {
        $("sj-err").textContent = "The tax code for job " + r.bad + " isn't recognised. Codes look like 1257L, BR, D0, S1257L or SBR.";
        ["sj-net2", "sj-tax2", "sj-ni2", "sj-net1", "sj-due", "sj-taken"].forEach(function (id) { $(id).textContent = "—"; });
        $("sj-year").textContent = ""; $("sj-ninote").textContent = ""; $("sj-suggest").style.display = "none"; return;
      }
      $("sj-net2").textContent = money(r.net2);
      $("sj-label").textContent = "a year from your second job after tax and National Insurance (" + money(r.net2 / 12) + " a month)";
      $("sj-tax2").textContent = money(r.tax2);
      $("sj-ni2").textContent = money(r.ni2);
      $("sj-net1").textContent = money(r.net1);
      $("sj-due").textContent = money(r.due);
      $("sj-taken").textContent = money(r.tax1 + r.tax2);
      var y = r.diff > 0.5 ? "PAYE takes about " + money(r.diff) + " too little over the year: HMRC usually changes a code or sends a P800 to collect it."
        : r.diff < -0.5 ? "PAYE takes about " + money(-r.diff) + " too much over the year: HMRC usually changes a code or refunds it after 5 April."
        : "These codes take about the right tax over the year.";
      var mism = (r.p1.region === "sct") !== scot || (r.p2.region === "sct") !== scot;
      if (mism) y += " Scottish codes start with S: check the codes match where you live.";
      var s = SecondJob.suggest(R, pay1, pay2, scot);
      sug = s;
      var cur1 = r.p1.code.replace(/\s/g, ""), cur2 = r.p2.code.replace(/\s/g, "");
      var fits = s.straddle ? false : s.split ? (cur1 === s.code1 && cur2 === s.code2) : cur2 === s.code2;
      $("sj-suggest-text").textContent = fits ? "" : s.straddle
        ? "Your second job's pay is taxed partly at " + s.low + "% and partly at " + s.rate + "%, so neither " + s.codes[0] + " nor " + s.codes[1] + " takes exactly the right tax: HMRC may change one of your codes, or settle the difference after 5 April."
        : s.split
        ? "Your main job doesn't use all your Personal Allowance. If HMRC splits it, the codes would be about " + s.code1 + " and " + s.code2 + "."
        : "With " + money(pay1 + pay2, true) + " in total, the top of your income is taxed at " + s.rate + "%: the usual second job code is " + s.code2 + ".";
      $("sj-use").style.display = s.straddle ? "none" : "";
      $("sj-suggest").style.display = fits ? "none" : "";
      $("sj-year").textContent = y;
      var n = "National Insurance is taken by each job separately: " + money(r.ni1 + r.ni2) + " in all, against " + money(r.niOne) + " if it were one job.";
      if (r.defer) n += " You may be able to defer National Insurance on your second job: see GOV.UK.";
      $("sj-ninote").textContent = n;
    }
    $("sj-use").addEventListener("click", function () {
      if (!sug || sug.straddle) return;
      if (sug.split) $("sj-code1").value = sug.code1;
      $("sj-code2").value = sug.code2;
      run();
    });
    $("sj-region").addEventListener("change", function () {
      var scot = $("sj-region").value === "scotland";
      ["sj-code1", "sj-code2"].forEach(function (id) {
        var v = $(id).value.trim().toUpperCase();
        if (scot && v.charAt(0) !== "S") $(id).value = "S" + v.replace(/^C/, "");
        if (!scot && v.charAt(0) === "S") $(id).value = v.slice(1);
      });
      run();
    });
    ["sj-pay1", "sj-pay2", "sj-code1", "sj-code2"].forEach(function (id) { $(id).addEventListener("input", run); });
    run();
  })();
}
