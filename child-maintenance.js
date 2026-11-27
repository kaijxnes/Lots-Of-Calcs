/* Child maintenance calculator (/child-maintenance-calculator/): the weekly
   amount the Child Maintenance Service works out for a paying parent, from
   their gross income, the number of children, other children they support
   and nights of shared care. Rules from the Child Support Act 1991
   (Schedule 1), the 2012 calculation regulations and GOV.UK, in
   data/uk/child-maintenance.json (passed in as `R`):
     - yearly income ÷ 365 × 7, less pension contributions not already taken
       off under net pay; anything over £3,000 a week is ignored;
     - on benefits: the flat £7 (nil with 52+ nights of shared care);
     - under £7 a week: nil; £7 to £100: flat £7;
     - over £100 and under £200: reduced rate, F + (A × T);
     - £200 or more: basic rate, after taking 11/14/16% off the income for
       other children, 12/16/19% of the first £800 and 9/12/15% above;
     - shared care takes off sevenths (half, and £7 more per child, from 175
       nights), but not below £7.
   The pages are built from these same functions
   (tools/build-child-maintenance-pages.js). */
var ChildMaintenance = (function () {
  "use strict";
  var p2 = function (v) { return Math.round(v * 100) / 100; };
  function weekly(R, yearly) { return p2(yearly / R.daysInYear * 7); }
  /* o: income (gross weekly), children (1+), others (0+), benefits (bool), nights (a year, each child) */
  function calc(R, o) {
    var n = Math.max(1, Math.floor(o.children || 1)), ci = Math.min(n, 3) - 1, oi = Math.min(Math.max(0, Math.floor(o.others || 0)), 3);
    var w = Math.max(0, o.income || 0), nights = Math.max(0, Math.floor(o.nights || 0));
    var band = null;
    R.shared.forEach(function (b) { if (nights >= b.from && nights <= b.to) band = b; });
    var out = { children: n, others: oi, income: p2(w), counted: p2(Math.min(w, R.cap)), capped: w > R.cap, band: band, sharedOff: 0, halfOff: 0, floored: false, sharedNil: false };
    var base;
    if (o.benefits) { out.rate = "flat"; base = R.flat; if (band) { out.sharedNil = true; } }
    else if (w < R.nilBelow) { out.rate = "nil"; base = 0; }
    else if (w <= R.reducedFrom) { out.rate = "flat"; base = R.flat; }
    else if (w < R.basicFrom) { out.rate = "reduced"; out.T = R.reducedT[ci][oi]; base = R.flat + (w - R.reducedFrom) * out.T / 100; }
    else {
      out.rate = "basic";
      var inc = out.counted * (1 - (oi ? R.otherPct[oi - 1] : 0) / 100);
      out.afterOthers = p2(inc);
      base = Math.min(inc, R.band1) * R.basicPct[ci] / 100 + Math.max(0, inc - R.band1) * R.abovePct[ci] / 100;
    }
    base = p2(base);
    out.before = base;
    var amt = base;
    if (out.sharedNil) amt = 0;
    else if (band && (out.rate === "reduced" || out.rate === "basic")) {
      out.sharedOff = p2(base * band.sevenths / 7);
      out.halfOff = band.sevenths === 3.5 ? R.halfExtra * n : 0;
      amt = p2(base - out.sharedOff - out.halfOff);
      if (amt < R.flat) { amt = R.flat; out.floored = true; }
    }
    out.weekly = amt;
    out.month = p2(amt * 52 / 12);
    out.year = p2(amt * 52);
    return out;
  }
  return { calc: calc, weekly: weekly };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = ChildMaintenance;
} else {
  (function () {
    var box = document.getElementById("cm-tool");
    if (!box) return;
    var R = JSON.parse(box.getAttribute("data-rules"));
    var $ = function (id) { return document.getElementById(id); };
    var num = function (id) { var s = String($(id).value).replace(/[\s,£]/g, ""); return s === "" ? 0 : Number(s); };
    var money = function (v) { return "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
    var RATE = { nil: "Nil rate", flat: "Flat rate", reduced: "Reduced rate", basic: "Basic rate" };
    var OUT = ["cm-weekly", "cm-month", "cm-year", "cm-income-out", "cm-rate", "cm-before", "cm-shared"];
    function run() {
      var err = $("cm-error"), per = Number($("cm-per").value), benefits = $("cm-benefits").checked;
      var inc = num("cm-income"), pen = num("cm-pension"), kids = num("cm-children"), others = num("cm-others");
      $("cm-income-row").style.opacity = benefits ? "0.5" : "";
      var bad = !benefits && (!(inc >= 0) || inc > 1e9) ? "Enter the paying parent's income before tax." :
        !(pen >= 0) || pen > 1e9 ? "Enter pension contributions, or 0." :
        !(kids >= 1) || kids > 20 || kids % 1 ? "Enter how many children the maintenance is for (1 or more)." :
        !(others >= 0) || others > 20 || others % 1 ? "Enter how many other children live with the paying parent, or 0." : "";
      err.textContent = bad; err.style.display = bad ? "block" : "none";
      if (bad) { OUT.forEach(function (id) { $(id).textContent = "—"; }); $("cm-label").textContent = "a week"; $("cm-note").textContent = ""; return; }
      var yearly = Math.max(0, inc * per - pen * per);
      var w = per === 52 ? Math.max(0, inc - pen) : ChildMaintenance.weekly(R, yearly);
      var r = ChildMaintenance.calc(R, { income: w, children: kids, others: others, benefits: benefits, nights: Number($("cm-nights").value) });
      $("cm-weekly").textContent = money(r.weekly);
      $("cm-label").textContent = "a week, " + (kids === 1 ? "for 1 child" : "for " + kids + " children");
      $("cm-month").textContent = money(r.month);
      $("cm-year").textContent = money(r.year);
      $("cm-income-out").textContent = benefits ? "On benefits" : money(r.income) + (r.capped ? " (£" + R.cap.toLocaleString("en-GB") + " counted)" : "");
      $("cm-rate").textContent = RATE[r.rate];
      $("cm-before").textContent = money(r.before);
      $("cm-shared").textContent = r.sharedNil ? "Nothing to pay" : r.band && (r.rate === "reduced" || r.rate === "basic") ? "−" + money(r.sharedOff + r.halfOff) : r.band ? "No change at the flat rate" : "None";
      var note = r.rate === "nil" ? "Under £" + R.nilBelow + " a week, nothing is paid." :
        r.floored ? "Shared care can't take it below £" + R.flat + " a week." :
        r.capped ? "Income over £" + R.cap.toLocaleString("en-GB") + " a week is ignored; the receiving parent can apply to the courts for more." :
        r.rate === "basic" && r.others ? "Income counted after " + R.otherPct[Math.min(r.others, 3) - 1] + "% off for other children: " + money(r.afterOthers) + " a week." : "";
      $("cm-note").textContent = note;
    }
    ["cm-income", "cm-pension", "cm-children", "cm-others"].forEach(function (id) { $(id).addEventListener("input", run); });
    ["cm-per", "cm-nights", "cm-benefits"].forEach(function (id) { $(id).addEventListener("change", run); });
    run();
  })();
}
