/* Rent a Room calculator (/rent-a-room-calculator/): the tax on letting a
   furnished room in your own home under the Rent a Room Scheme. Rules from
   GOV.UK and HMRC helpsheet HS223 in data/uk/rent-a-room.json (`R`):
     - gross receipts (rent plus anything paid for meals, cleaning, bills)
       up to £7,500 a year (£3,750 if someone else also gets income from
       letting in the same home) are tax-free;
     - above that, tax is on either the actual profit (Method A: receipts
       less expenses) or the receipts over the limit (Method B, no
       expenses), whichever you choose; HMRC uses Method A unless told.
   The taxable amount is added to the year's other income and taxed with
   the UK tax file's bands (UKCalcs, `cfg`). The page is built from these
   same functions (tools/build-rent-a-room-pages.js). */
var RentARoom = (function () {
  "use strict";
  var p2 = function (v) { return Math.round(v * 100) / 100; };
  /* o: receipts (a year), expenses (a year), shared (bool), other (other taxable income) */
  function calc(UK, cfg, R, o) {
    var receipts = Math.max(0, o.receipts || 0), expenses = Math.max(0, o.expenses || 0), limit = o.shared ? R.shared : R.limit, other = Math.max(0, o.other || 0);
    var tax = function (taxable) { return taxable > 0 ? p2(UK.incomeTax(cfg, other + taxable, 0).nsTax - UK.incomeTax(cfg, other, 0).nsTax) : 0; };
    var a = Math.max(0, receipts - expenses), b = Math.max(0, receipts - limit), under = receipts <= limit;
    var taxA = tax(a), taxB = tax(b), best = under ? "exempt" : taxB < taxA ? "B" : "A";
    var due = under ? 0 : Math.min(taxA, taxB);
    return { receipts: p2(receipts), limit: limit, under: under, profitA: p2(a), taxableB: p2(b), taxA: taxA, taxB: taxB, best: best, due: p2(due), keep: p2(receipts - expenses - due), saving: under ? 0 : p2(Math.abs(taxA - taxB)), loss: receipts - expenses < 0 };
  }
  return { calc: calc };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = RentARoom;
} else {
  (function () {
    var box = document.getElementById("rr-tool");
    if (!box) return;
    var D = JSON.parse(box.getAttribute("data-rules")), cfg = D.cfg, R = D.R;
    var $ = function (id) { return document.getElementById(id); };
    var num = function (id) { var s = String($(id).value).replace(/[\s,£]/g, ""); return s === "" ? 0 : Number(s); };
    var money = function (v) { return "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
    var PER = { week: 52, month: 12, year: 1 };
    var OUT = ["rr-due", "rr-receipts", "rr-limit", "rr-a", "rr-b", "rr-keep"];
    function run() {
      var err = $("rr-error"), rent = num("rr-rent"), extra = num("rr-extra"), exp = num("rr-expenses"), other = num("rr-other"), per = PER[$("rr-per").value];
      var bad = [rent, extra, exp, other].some(function (v) { return !(v >= 0) || v > 1e8; }) ? "Enter amounts of 0 or more." : "";
      err.textContent = bad; err.style.display = bad ? "block" : "none";
      if (bad) { OUT.forEach(function (id) { $(id).textContent = "—"; }); $("rr-note").textContent = ""; return; }
      var r = RentARoom.calc(UKCalcs, cfg, R, { receipts: (rent + extra) * per, expenses: exp, shared: $("rr-shared").checked, other: other });
      $("rr-due").textContent = money(r.due);
      $("rr-label").textContent = r.under ? "tax a year: within the Rent a Room limit" : "tax a year, using Method " + r.best;
      $("rr-receipts").textContent = money(r.receipts);
      $("rr-limit").textContent = money(r.limit);
      $("rr-a").textContent = r.under ? "—" : money(r.profitA) + " taxable, " + money(r.taxA) + " tax";
      $("rr-b").textContent = r.under ? "—" : money(r.taxableB) + " taxable, " + money(r.taxB) + " tax";
      $("rr-keep").textContent = money(r.keep);
      $("rr-note").textContent = r.under ? (r.loss ? "You've made a loss: you could choose to pay tax the normal way instead, so the loss can be used later." : "Tax-free automatically: you don't need to do anything.") :
        r.best === "B" ? "Method B saves " + money(r.saving) + ". HMRC uses Method A unless you tell it, on your tax return." : r.saving ? "Method A saves " + money(r.saving) + " and is what HMRC uses unless you choose otherwise." : "Both methods give the same tax.";
    }
    ["rr-rent", "rr-extra", "rr-expenses", "rr-other"].forEach(function (id) { $(id).addEventListener("input", run); });
    ["rr-per", "rr-shared"].forEach(function (id) { $(id).addEventListener("change", run); });
    run();
  })();
}
