/* The calculator on a generated investing page (/investing/…).

   Same arithmetic as tools/build-investing-pages.js, which bakes the page's
   own example into the HTML: a starting sum plus a monthly amount paid in at
   the end of each month, growing at an annual return less any yearly fee,
   compounded so that a full year grows by exactly that rate. "In today's
   money" divides by inflation over the same years. */
var InvestingMaths = (function () {
  "use strict";

  function grow(o) {
    var monthly = Math.pow(1 + (o.rate - (o.fee || 0)) / 100, 1 / 12) - 1;
    var months = Math.round(o.years * 12);
    var value = o.lump || 0;
    var paid = o.lump || 0;
    var rows = [];
    for (var m = 1; m <= months; m++) {
      value = value * (1 + monthly) + (o.monthly || 0);
      paid += o.monthly || 0;
      if (m % 12 === 0) rows.push({ year: m / 12, paid: paid, value: value });
    }
    var real = value / Math.pow(1 + (o.inflation || 0) / 100, o.years);
    return { value: value, paid: paid, growth: value - paid, real: real, rows: rows };
  }

  return { grow: grow };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = InvestingMaths;
} else {
  (function () {
    var box = document.getElementById("invest-tool");
    if (!box) return;
    var symbol = box.getAttribute("data-symbol");
    var ids = ["monthly", "lump", "rate", "years", "fee", "inflation"];
    var inputs = {};
    ids.forEach(function (k) { inputs[k] = document.getElementById("inv-" + k); });
    var out = {
      value: document.getElementById("inv-value"),
      label: document.getElementById("inv-label"),
      paid: document.getElementById("inv-paid"),
      growth: document.getElementById("inv-growth"),
      real: document.getElementById("inv-real")
    };
    var error = document.getElementById("inv-error");

    function money(v) {
      if (!isFinite(v)) return "—";
      return symbol + Math.round(v).toLocaleString("en-GB");
    }

    function calculate() {
      var o = {};
      for (var i = 0; i < ids.length; i++) {
        var raw = String(inputs[ids[i]].value).replace(/[\s,]/g, "");
        o[ids[i]] = raw === "" ? 0 : Number(raw);
        if (!isFinite(o[ids[i]])) return show("Enter numbers only.");
      }
      if (o.years <= 0 || o.years > 80) return show("Enter a number of years from 1 to 80.");
      if (o.monthly < 0 || o.lump < 0) return show("Amounts can't be negative.");
      if (o.rate - o.fee <= -100) return show("That return is too low to work out.");
      show("");
      var r = InvestingMaths.grow(o);
      out.value.textContent = money(r.value);
      out.label.textContent = "after " + o.years + (o.years === 1 ? " year" : " years") + " at " + o.rate + "% a year" + (o.fee ? " less " + o.fee + "% fees" : "");
      out.paid.textContent = money(r.paid);
      out.growth.textContent = money(r.growth);
      out.real.textContent = money(r.real);
    }

    function show(message) {
      error.textContent = message || "";
      error.style.display = message ? "block" : "none";
    }

    ids.forEach(function (k) { inputs[k].addEventListener("input", calculate); });
  })();
}
