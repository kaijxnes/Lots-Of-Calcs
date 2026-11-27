/* Carer's Allowance earnings calculator (/carers-allowance-calculator/):
   whether earnings are within the Carer's Allowance earnings limit, and how
   much more someone could earn. Rules from GOV.UK and the Social Security
   Benefit (Computation of Earnings) Regulations 1996 in
   data/uk/carers-allowance.json (`R`):
     - pay is turned into a weekly amount (a month × 12 ÷ 52; 4 weeks ÷ 4);
     - net earnings are gross pay less Income Tax, employee National
       Insurance and half of pension contributions (regulation 10(4));
     - care charges for the person cared for, or a child under 16, paid to
       someone who isn't a close relative, come off up to half of net
       earnings (regulation 10(3), Schedule 3);
     - the result must be no more than the weekly limit.
   Tax and National Insurance are estimated from the UK tax file (`cfg`,
   through UKCalcs) unless entered from a payslip. The page is built from
   these same functions (tools/build-carers-allowance-pages.js). */
var CarersAllowance = (function () {
  "use strict";
  var p2 = function (v) { return Math.round(v * 100) / 100; };
  var PER = { week: function (v) { return v; }, month: function (v) { return v * 12 / 52; }, four: function (v) { return v * 7 / 28; } };
  function weekly(per, v) { return (PER[per] || PER.week)(Math.max(0, v || 0)); }
  function taxNi(UK, cfg, g) { var a = g * 52; return (UK.incomeTax(cfg, a, 0).nsTax + UK.employeeNI(cfg, a)) / 52; }
  /* o: gross, per, pension, care (same period as gross), taxni (same period; null to estimate) */
  function calc(UK, cfg, R, o) {
    var g = weekly(o.per, o.gross), pen = weekly(o.per, o.pension), care = weekly(o.per, o.care);
    var tn = o.taxni === null || o.taxni === undefined ? taxNi(UK, cfg, g) : weekly(o.per, o.taxni);
    var net = Math.max(0, g - tn - pen * R.pensionShare);
    var careOff = Math.min(care, net * R.careMaxShare), counted = p2(net - careOff);
    return { gross: p2(g), taxni: p2(tn), pensionOff: p2(pen * R.pensionShare), net: p2(net), careOff: p2(careOff), counted: counted, ok: counted <= R.limit, room: p2(R.limit - counted), estimated: o.taxni === null || o.taxni === undefined };
  }
  /* the most gross weekly pay that stays within the limit, with the same weekly pension and care costs */
  function maxGross(UK, cfg, R, o) {
    var lo = 0, hi = 5000;
    for (var i = 0; i < 50; i++) {
      var mid = (lo + hi) / 2, r = calc(UK, cfg, R, { gross: mid, per: "week", pension: weekly(o.per, o.pension), care: weekly(o.per, o.care), taxni: null });
      if (r.ok) lo = mid; else hi = mid;
    }
    return Math.floor(lo * 100) / 100;
  }
  return { calc: calc, maxGross: maxGross, weekly: weekly };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = CarersAllowance;
} else {
  (function () {
    var box = document.getElementById("ca-tool");
    if (!box) return;
    var D = JSON.parse(box.getAttribute("data-rules")), cfg = D.cfg, R = D.R;
    var $ = function (id) { return document.getElementById(id); };
    var raw = function (id) { return String($(id).value).replace(/[\s,£]/g, ""); };
    var num = function (id) { var s = raw(id); return s === "" ? 0 : Number(s); };
    var money = function (v) { return "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
    var OUT = ["ca-counted", "ca-gross", "ca-taxni", "ca-pension-out", "ca-care-out", "ca-room", "ca-max"];
    function run() {
      var err = $("ca-error"), per = $("ca-per").value, gross = num("ca-gross"), pen = num("ca-pension"), care = num("ca-care"), tn = raw("ca-taxni") === "" ? null : num("ca-taxni");
      var bad = !(gross >= 0) || gross > 1e7 ? "Enter your pay before tax, or 0." : !(pen >= 0) || !(care >= 0) ? "Enter pension contributions and care costs, or 0." : tn !== null && !(tn >= 0) ? "Enter the tax and National Insurance from your payslip, or leave it blank." : "";
      err.textContent = bad; err.style.display = bad ? "block" : "none";
      if (bad) { OUT.forEach(function (id) { $(id).textContent = "—"; }); $("ca-label").textContent = "counted earnings a week"; $("ca-verdict").textContent = ""; return; }
      var r = CarersAllowance.calc(UKCalcs, cfg, R, { gross: gross, per: per, pension: pen, care: care, taxni: tn });
      $("ca-counted").textContent = money(r.counted);
      $("ca-label").textContent = "counted earnings a week (the limit is " + money(R.limit) + ")";
      $("ca-verdict").textContent = r.ok ? "Within the limit: your earnings don't stop Carer's Allowance." : "Over the limit by " + money(-r.room) + " a week: you wouldn't get Carer's Allowance for this week.";
      $("ca-verdict").style.color = r.ok ? "var(--good)" : "var(--bad)";
      $("ca-gross").textContent = money(r.gross);
      $("ca-taxni").textContent = (r.taxni ? "−" + money(r.taxni) : "None") + (r.estimated ? " (estimate)" : "");
      $("ca-pension-out").textContent = r.pensionOff ? "−" + money(r.pensionOff) : "—";
      $("ca-care-out").textContent = r.careOff ? "−" + money(r.careOff) : "—";
      $("ca-room").textContent = r.ok ? money(r.room) + " a week" : "None";
      $("ca-max").textContent = money(CarersAllowance.maxGross(UKCalcs, cfg, R, { per: per, pension: pen, care: care })) + " a week";
    }
    ["ca-gross", "ca-pension", "ca-care", "ca-taxni"].forEach(function (id) { $(id).addEventListener("input", run); });
    $("ca-per").addEventListener("change", run);
    run();
  })();
}
