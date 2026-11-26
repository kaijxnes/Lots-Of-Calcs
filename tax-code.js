/* UK tax code checker: reads a tax code (1257L, S1257L, K475, BR, 0T, 1257L M1…),
   explains it in GOV.UK's words and estimates a year's tax on a given pay.
   The meanings and rules are in data/uk/tax-codes.json and the bands come
   from the tax files in force, passed in together as `R`; the pages are
   built from these same functions (tools/build-tax-code-pages.js). */
var TaxCode = (function () {
  "use strict";
  var CORE = /^([SC])?(?:(K)(\d{1,4})|(\d{1,4})([LMNT])|(0T|BR|D0|D1|D2|D3|NT))$/;
  var EMERGENCY = /^(.+?)\s*(W1|M1|X|NONCUM)$/;

  function core(s) {
    var m = CORE.exec(s);
    if (!m) return null;
    var region = m[1] === "S" ? "sct" : m[1] === "C" ? "wal" : "ruk", p = { region: region, prefix: m[1] || "" };
    if (m[2]) { p.kind = "k"; p.number = +m[3]; p.letter = "K"; }
    else if (m[4]) { p.kind = "allowance"; p.number = +m[4]; p.letter = m[5]; }
    else {
      var w = m[6];
      if (w === "NT") { if (m[1]) return null; p.kind = "nt"; p.letter = "NT"; }
      else if (w === "0T") { p.kind = "0t"; p.letter = "0T"; }
      else {
        if ((w === "D2" || w === "D3") && region !== "sct") return null;
        p.kind = "flat"; p.letter = w; p.flatKey = (m[1] || "") + w;
      }
    }
    return p;
  }

  /* returns null if it isn't a tax code */
  function parse(code) {
    var s = String(code || "").toUpperCase().replace(/[^A-Z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
    if (!s) return null;
    var p = core(s.replace(/ /g, ""));
    if (p) { p.emergency = false; }
    else {
      var e = EMERGENCY.exec(s);
      if (!e) return null;
      p = core(e[1].replace(/ /g, ""));
      if (!p) return null;
      p.emergency = e[2];
    }
    p.code = s;
    if (p.kind === "allowance") p.allowance = p.number * 10;
    if (p.kind === "k") p.addition = p.number * 10;
    return p;
  }

  function banded(bands, taxable) {
    var t = 0;
    for (var i = 0; i < bands.length; i++) {
      var lo = bands[i][0], hi = i + 1 < bands.length ? bands[i + 1][0] : Infinity;
      if (taxable > lo) t += (Math.min(taxable, hi) - lo) * bands[i][1] / 100;
    }
    return t;
  }

  /* a year's tax through PAYE on this code, if paid the same every period */
  function annualTax(R, p, pay) {
    var bands = p.region === "sct" ? R.bands.sct : R.bands.ruk;
    var taxable, tax;
    if (p.kind === "nt") return { taxable: 0, tax: 0 };
    if (p.kind === "flat") return { taxable: pay, tax: pay * R.flat[p.flatKey] / 100, rate: R.flat[p.flatKey] };
    if (p.kind === "0t") taxable = pay;
    else if (p.kind === "k") taxable = pay + p.addition;
    else taxable = Math.max(0, pay - p.allowance);
    tax = banded(bands, taxable);
    var capped = false;
    if (p.kind === "k" && tax > pay * R.kCap / 100) { tax = pay * R.kCap / 100; capped = true; }
    return { taxable: taxable, tax: Math.round(tax * 100) / 100, capped: capped };
  }

  /* plain-English lines about the code, GOV.UK's wording first */
  function explain(R, p) {
    var L = R.letters, out = [], money = function (v) { return "£" + v.toLocaleString("en-GB"); };
    var std = R.personalAllowance;
    if (p.region === "sct" && p.kind !== "flat" && p.kind !== "0t") out.push(L.S);
    if (p.region === "wal" && p.kind !== "flat" && p.kind !== "0t") out.push(L.C);
    if (p.kind === "allowance") {
      out.push(L[p.letter]);
      out.push("You can earn " + money(p.allowance) + " tax-free from this job or pension in the tax year (about " + money(Math.floor(p.allowance / 12)) + " a month).");
      if (p.letter === "M") out.push(p.allowance === std + R.transfer ? "That's the standard " + money(std) + " plus the " + money(R.transfer) + " your partner transferred." : "With Marriage Allowance the usual code is " + (std + R.transfer) / 10 + "M; yours differs, so something else is adjusting your allowance too.");
      else if (p.letter === "N") out.push(p.allowance === std - R.transfer ? "That's the standard " + money(std) + " less the " + money(R.transfer) + " you transferred." : "After transferring Marriage Allowance the usual code is " + (std - R.transfer) / 10 + "N; yours differs, so something else is adjusting your allowance too.");
      else if (p.allowance < std) out.push("That's " + money(std - p.allowance) + " less than the standard " + money(std) + ": HMRC takes off things like company benefits, untaxed income (such as savings interest over your allowance or part-time earnings) or tax you owe from an earlier year. Your tax code notice or HMRC app shows the breakdown.");
      else if (p.allowance > std) out.push("That's " + money(p.allowance - std) + " more than the standard " + money(std) + ", usually because of tax relief on expenses you claim.");
      else out.push("That's the standard Personal Allowance: the usual code for someone with one job or pension.");
    } else if (p.kind === "k") {
      out.push(L.K.replace(/\.$/, "") + ", for example company benefits, the State Pension, or tax owed from an earlier year.");
      out.push(money(p.addition) + " is added to your taxable pay from this job or pension, so you pay tax on more than you earn here. The tax taken each payday can't be more than half your pay.");
    } else if (p.kind === "flat") {
      out.push(L[p.flatKey]);
      out.push("Every pound is taxed at " + R.flat[p.flatKey] + "%, with no tax-free allowance on this job or pension.");
    } else out.push(L[p.letter]);
    if (p.emergency) out.push(L.EMERGENCY + " This is usually temporary: giving your employer your P45 helps, and HMRC normally sorts it within 35 days of starting a job.");
    return out;
  }
  return { parse: parse, annualTax: annualTax, explain: explain };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = TaxCode;
} else {
  (function () {
    var tool = document.getElementById("tc-tool");
    if (!tool) return;
    var R = JSON.parse(tool.getAttribute("data-rules"));
    var $ = function (id) { return document.getElementById(id); };
    var money = function (v, dp) { return "£" + v.toLocaleString("en-GB", { minimumFractionDigits: dp || 0, maximumFractionDigits: dp || 0 }); };
    try { var q = new URLSearchParams(location.search).get("code"); if (q) $("tc-code").value = q; } catch (e) {}
    function run() {
      var p = TaxCode.parse($("tc-code").value), pay = parseFloat(String($("tc-pay").value).replace(/,/g, "")) || 0;
      var err = $("tc-error");
      err.style.display = p ? "none" : "block";
      if (!p) { err.textContent = "That doesn't look like a UK tax code. Codes look like 1257L, S1257L, K475, BR, 0T or 1257L M1."; $("tc-lines").innerHTML = ""; $("tc-tax").textContent = "—"; $("tc-free").textContent = "—"; $("tc-month").textContent = "—"; return; }
      $("tc-lines").innerHTML = "";
      TaxCode.explain(R, p).forEach(function (s) { var li = document.createElement("li"); li.textContent = s; $("tc-lines").appendChild(li); });
      var t = TaxCode.annualTax(R, p, pay);
      $("tc-free").textContent = p.kind === "allowance" ? money(p.allowance) : p.kind === "k" ? "−" + money(p.addition) : p.kind === "nt" ? "All of it" : "£0";
      $("tc-tax").textContent = money(t.tax);
      $("tc-month").textContent = money(t.tax / 12, 2);
      $("tc-label").textContent = "Income Tax a year on " + money(pay) + (t.capped ? " (capped at half your pay)" : "");
    }
    ["tc-code", "tc-pay"].forEach(function (id) { $(id).addEventListener("input", run); });
    run();
  })();
}
