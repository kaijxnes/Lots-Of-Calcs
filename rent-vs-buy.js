/* Rent vs buy: what you'd be worth after N years either way.

   Month by month: the buyer pays the mortgage and the running costs of the
   home; the renter pays rent. Whoever's monthly outgoings are lower invests
   the difference, and the renter also invests the deposit and buying costs
   the buyer spent on day one. At the end of each year the buyer's wealth is
   the home's value less what's owed and the cost of selling, plus anything
   invested; the renter's is their investments. Same function in the browser
   and in tools/build-rent-vs-buy.js, which bakes the default case into the
   page. */
var RentVsBuy = (function () {
  "use strict";

  function simulate(o) {
    var months = Math.round(o.years * 12);
    var loan = o.price * (1 - o.depositPct / 100);
    var n = Math.round(o.term * 12);
    var r = o.rate / 100 / 12;
    var payment = loan <= 0 ? 0 : r === 0 ? loan / n : (loan * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    var grow = Math.pow(1 + o.growth / 100, 1 / 12);
    var invest = Math.pow(1 + o.investReturn / 100, 1 / 12);

    var value = o.price;
    var balance = loan;
    var rent = o.rent;
    var upfront = o.price * (o.depositPct / 100) + o.buyingCosts;
    var renterPot = upfront;
    var buyerPot = 0;
    var paidBuying = upfront;
    var paidRenting = 0;
    var rows = [];

    for (var m = 1; m <= months; m++) {
      var pay = m <= n ? payment : 0;
      if (m <= n && balance > 0) {
        var interest = balance * r;
        balance = Math.max(0, balance - (pay - interest));
      }
      var running = value * (o.runningPct / 100) / 12;
      var buyerOut = pay + running;
      paidBuying += buyerOut;
      paidRenting += rent;

      renterPot *= invest;
      buyerPot *= invest;
      if (buyerOut > rent) renterPot += buyerOut - rent;
      else buyerPot += rent - buyerOut;

      value *= grow;
      if (m % 12 === 0) {
        var equity = value * (1 - o.sellingPct / 100) - balance;
        rows.push({
          year: m / 12, value: value, balance: balance, rent: rent,
          buyer: equity + buyerPot, renter: renterPot
        });
        rent *= 1 + o.rentRise / 100;
      }
    }

    var last = rows[rows.length - 1] || { buyer: upfront, renter: upfront };
    var breakEven = null;
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].buyer >= rows[i].renter) { breakEven = rows[i].year; break; }
    }
    return {
      payment: payment, upfront: upfront, rows: rows,
      buyer: last.buyer, renter: last.renter,
      paidBuying: paidBuying, paidRenting: paidRenting,
      breakEven: breakEven
    };
  }

  return { simulate: simulate };
})();

if (typeof module !== "undefined" && module.exports) {
  module.exports = RentVsBuy;
} else {
  (function () {
    var box = document.getElementById("rvb-tool");
    if (!box) return;
    var ids = ["price", "depositPct", "rate", "term", "buyingCosts", "sellingPct", "runningPct", "growth", "rent", "rentRise", "investReturn", "years"];
    var inputs = {};
    ids.forEach(function (k) { inputs[k] = document.getElementById("rvb-" + k); });
    var currency = document.getElementById("currency");
    var error = document.getElementById("rvb-error");
    var out = {
      verdict: document.getElementById("rvb-verdict"),
      verdictLabel: document.getElementById("rvb-verdict-label"),
      buyer: document.getElementById("rvb-buyer"),
      renter: document.getElementById("rvb-renter"),
      payment: document.getElementById("rvb-payment"),
      breakEven: document.getElementById("rvb-breakeven"),
      body: document.getElementById("rvb-body")
    };

    function money(v) {
      if (!isFinite(v)) return "—";
      var sign = v < 0 ? "−" : "";
      return sign + currency.value + Math.round(Math.abs(v)).toLocaleString("en-GB");
    }

    function read() {
      var o = {};
      for (var i = 0; i < ids.length; i++) {
        var v = Number(String(inputs[ids[i]].value).replace(/[\s,]/g, ""));
        if (!isFinite(v) || inputs[ids[i]].value === "") return null;
        o[ids[i]] = v;
      }
      return o;
    }

    function calculate() {
      var o = read();
      if (!o) return show("Fill in every box with a number.");
      if (o.price <= 0 || o.years <= 0 || o.term <= 0) return show("The price, term and years need to be above zero.");
      if (o.years > 50) return show("Compare over 50 years or fewer.");
      if (o.depositPct < 0 || o.depositPct > 100) return show("The deposit is a percentage of the price, from 0 to 100.");
      show("");
      var r = RentVsBuy.simulate(o);
      var diff = r.buyer - r.renter;
      out.verdict.textContent = money(Math.abs(diff));
      out.verdictLabel.textContent = (diff >= 0 ? "better off buying" : "better off renting") + " after " + o.years + (o.years === 1 ? " year" : " years");
      out.buyer.textContent = money(r.buyer);
      out.renter.textContent = money(r.renter);
      out.payment.textContent = money(r.payment);
      out.breakEven.textContent = r.breakEven ? "Year " + r.breakEven : "Not within " + o.years + " years";
      out.body.textContent = "";
      r.rows.forEach(function (row) {
        var tr = document.createElement("tr");
        [String(row.year), money(row.value), money(row.balance), money(row.buyer), money(row.renter), money(row.buyer - row.renter)].forEach(function (t) {
          var td = document.createElement("td");
          td.textContent = t;
          tr.appendChild(td);
        });
        out.body.appendChild(tr);
      });
    }

    function show(message) {
      error.textContent = message || "";
      error.style.display = message ? "block" : "none";
    }

    ids.forEach(function (k) { inputs[k].addEventListener("input", calculate); });
    currency.addEventListener("change", calculate);
    calculate();
  })();
}
