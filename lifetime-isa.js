/* Lifetime ISA calculator (/lifetime-isa-calculator/): what a Lifetime ISA
   grows to with the 25% government bonus (up to £1,000 a year on up to
   £4,000 a year, paid in until 50), for a first home or for age 60, and
   what the 25% withdrawal charge (20% for a home over £450,000) would take.
   Rules from GOV.UK in data/uk/lifetime-isa.json (`R`). Contributions go in
   at the start of each year and the bonus with them; growth is a steady
   yearly rate. The page is built from these same functions
   (tools/build-lifetime-isa-pages.js). */
var LifetimeIsa = (function () {
  "use strict";
  var p2 = function (v) { return Math.round(v * 100) / 100; };
  /* o: age, balance (already in it), yearly, growth (% a year), goal ("home" | "sixty"), years (to the home), price */
  function calc(R, o) {
    var age = Math.floor(o.age), years = o.goal === "sixty" ? Math.max(0, R.withdrawFrom - age) : Math.max(0, Math.round(o.years || 0));
    var c = Math.min(R.yearlyMax, Math.max(0, o.yearly || 0)), g = (o.growth || 0) / 100;
    var bal = Math.max(0, o.balance || 0), paid = 0, bonus = 0, rows = [];
    for (var y = 0; y < years; y++) {
      var a = age + y, put = a < R.payInUntil ? c : 0, b = Math.min(R.bonusMax, put * R.bonusPct / 100);
      bal = (bal + put + b) * (1 + g); paid += put; bonus += b;
      rows.push({ age: a + 1, paid: p2(paid), bonus: p2(bonus), value: p2(bal) });
    }
    var value = p2(bal), start = Math.max(0, o.balance || 0);
    var homeCharge = o.goal === "home" && (o.price || 0) > R.homeMaxPrice ? p2(value * R.homeOverChargePct / 100) : 0;
    var early = p2(value * R.chargePct / 100);
    return {
      years: years, paid: p2(paid), bonus: p2(bonus), value: value, growth: p2(value - start - paid - bonus), start: start,
      homeCharge: homeCharge, afterHome: p2(value - homeCharge), early: early, afterEarly: p2(value - early),
      earlyLoss: p2(start + paid - (value - early)), rows: rows, tooOld: age >= R.openBefore && start === 0, pastFifty: age >= R.payInUntil
    };
  }
  return { calc: calc };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = LifetimeIsa;
} else {
  (function () {
    var box = document.getElementById("li-tool");
    if (!box) return;
    var R = JSON.parse(box.getAttribute("data-rules"));
    var $ = function (id) { return document.getElementById(id); };
    var num = function (id) { var s = String($(id).value).replace(/[\s,£%]/g, ""); return s === "" ? 0 : Number(s); };
    var money = function (v) { return "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
    var OUT = ["li-value", "li-paid", "li-bonus", "li-growth", "li-home", "li-early"];
    function run() {
      var err = $("li-error"), goal = $("li-goal").value, age = num("li-age");
      $("li-home-row").style.display = goal === "home" ? "" : "none";
      var bad = !(age >= R.openFrom) || age > 100 ? "Enter your age (" + R.openFrom + " or over)." :
        ["li-balance", "li-yearly", "li-growth", "li-years", "li-price"].some(function (id) { var v = num(id); return !(v >= -100) || v > 1e9; }) ? "Enter numbers." :
        num("li-yearly") > R.yearlyMax ? "You can pay in up to £" + R.yearlyMax.toLocaleString("en-GB") + " a year." :
        goal === "home" && !(num("li-years") >= 1) ? "You can only use it for a home at least 12 months after your first payment: enter 1 year or more." :
        goal === "sixty" && age >= R.withdrawFrom ? "You can already take it out without a charge at " + R.withdrawFrom + "." :
        age >= R.openBefore && num("li-balance") === 0 ? "You need to open a Lifetime ISA and pay in before you're " + R.openBefore + "." : "";
      err.textContent = bad; err.style.display = bad ? "block" : "none";
      if (bad) { OUT.forEach(function (id) { $(id).textContent = "—"; }); $("li-label").textContent = "your Lifetime ISA"; return; }
      var r = LifetimeIsa.calc(R, { age: age, balance: num("li-balance"), yearly: num("li-yearly"), growth: num("li-growth"), goal: goal, years: num("li-years"), price: num("li-price") });
      $("li-value").textContent = money(r.value);
      $("li-label").textContent = goal === "home" ? "after " + r.years + (r.years === 1 ? " year" : " years") + ", for your first home" : "at " + R.withdrawFrom + ", after " + r.years + " years";
      $("li-paid").textContent = money(r.start + r.paid);
      $("li-bonus").textContent = money(r.bonus);
      $("li-growth").textContent = money(r.growth);
      $("li-home").textContent = goal === "home" ? (r.homeCharge ? "−" + money(r.homeCharge) + " (" + R.homeOverChargePct + "% charge: price over £" + R.homeMaxPrice.toLocaleString("en-GB") + ")" : "No charge") : "—";
      $("li-early").textContent = money(r.afterEarly) + (r.earlyLoss > 0 ? " (" + money(r.earlyLoss) + " less than you paid in)" : "");
      $("li-note").textContent = r.pastFifty ? "You can't pay in from " + R.payInUntil + ", so no more bonus." : "";
    }
    ["li-age", "li-balance", "li-yearly", "li-growth", "li-years", "li-price"].forEach(function (id) { $(id).addEventListener("input", run); });
    $("li-goal").addEventListener("change", run);
    run();
  })();
}
