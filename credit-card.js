/* Credit card payoff (/credit-card-payoff/): month by month, interest at
   APR ÷ 12 on the balance, then the payment — a fixed amount, or the
   card's minimum (a % of the balance plus that month's interest, with a
   floor). Stops when cleared, or reports that it never clears. */
const CreditCard = (function () {
  function payoff(o) {
    let bal = o.balance, months = 0, interest = 0, first = null;
    const r = (o.apr || 0) / 100 / 12;
    while (bal > 0.005 && months < 1200) {
      const add = bal * r;
      const due = o.mode === "fixed" ? o.amount : Math.max(o.floor || 0, bal * (o.pct || 0) / 100 + add);
      if (due <= add + 1e-9) return { never: true, months: Infinity, interest: Infinity, first: due };
      const pay = Math.min(bal + add, due);
      if (first === null) first = pay;
      bal = bal + add - pay; interest += add; months++;
    }
    return { never: false, months, interest, first: first || 0 };
  }
  return { payoff };
})();
if (typeof module !== "undefined" && module.exports) module.exports = CreditCard;
else (function () {
  var box = document.getElementById("cc-tool"); if (!box) return;
  var $ = function (id) { return document.getElementById(id); };
  function n(id) { var v = Number(String($(id).value).replace(/[\s,£$€]/g, "")); return isFinite(v) ? v : NaN; }
  function span(m) { if (!isFinite(m)) return "Never — the payment doesn't cover the interest"; var y = Math.floor(m / 12), mo = m % 12; return (y ? y + " year" + (y > 1 ? "s" : "") : "") + (y && mo ? ", " : "") + (mo || !y ? mo + " month" + (mo === 1 ? "" : "s") : ""); }
  function calc() {
    var c = $("cc-cur").value, money = function (v, dp) { return isFinite(v) ? c + v.toLocaleString("en-GB", { minimumFractionDigits: dp || 0, maximumFractionDigits: dp || 0 }) : "—"; };
    var bal = n("cc-balance"), apr = n("cc-apr"), err = $("cc-error");
    if (!(bal > 0) || !(apr >= 0)) { err.textContent = "Enter the balance and the interest rate."; err.style.display = "block"; return; }
    err.style.display = "none";
    var mn = CreditCard.payoff({ balance: bal, apr: apr, mode: "min", pct: n("cc-pct") || 0, floor: n("cc-floor") || 0 });
    var fx = CreditCard.payoff({ balance: bal, apr: apr, mode: "fixed", amount: n("cc-amount") || 0 });
    $("cc-min-time").textContent = span(mn.months); $("cc-min-int").textContent = money(mn.interest); $("cc-min-first").textContent = money(mn.first, 2);
    $("cc-fx-time").textContent = span(fx.months); $("cc-fx-int").textContent = money(fx.interest);
    $("cc-saved").textContent = isFinite(mn.interest) && isFinite(fx.interest) ? money(mn.interest - fx.interest) : "—";
  }
  ["cc-balance", "cc-apr", "cc-amount", "cc-pct", "cc-floor"].forEach(function (id) { $(id).addEventListener("input", calc); });
  $("cc-cur").addEventListener("change", calc);
  calc();
})();
