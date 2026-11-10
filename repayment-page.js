/* The calculator on a generated mortgage or loan page (/mortgage/…, /loan/…).

   The page's own tables are baked into the HTML; this only drives the box at
   the top, which starts on the page's amount and an example rate and term.
   Payments use the standard repayment formula on a monthly rate of the
   annual rate divided by twelve, the same as the site's loan and mortgage
   overpayment calculators. */
(function () {
  var box = document.getElementById("repay-tool");
  if (!box) return;

  var symbol = box.getAttribute("data-symbol");
  var input = {
    amount: document.getElementById("repay-amount"),
    rate: document.getElementById("repay-rate"),
    years: document.getElementById("repay-years")
  };
  var out = {
    payment: document.getElementById("repay-payment"),
    interestOnly: document.getElementById("repay-interest-only"),
    interest: document.getElementById("repay-interest"),
    total: document.getElementById("repay-total")
  };
  var error = document.getElementById("repay-error");

  function money(v) {
    if (!isFinite(v)) return "—";
    return symbol + (Math.round(v * 100) / 100).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function value(el) {
    return Number(String(el.value).replace(/[\s,]/g, ""));
  }

  function payment(amount, annualRate, months) {
    var r = annualRate / 100 / 12;
    if (r === 0) return amount / months;
    var f = Math.pow(1 + r, months);
    return (amount * r * f) / (f - 1);
  }

  function show(message) {
    error.textContent = message || "";
    error.style.display = message ? "block" : "none";
  }

  function calculate() {
    var amount = value(input.amount);
    var rate = value(input.rate);
    var years = value(input.years);
    if (!isFinite(amount) || !isFinite(rate) || !isFinite(years)) return show("Enter numbers only.");
    if (amount <= 0 || years <= 0) return show("Enter an amount and a term above zero.");
    if (rate < 0 || rate > 100) return show("Enter a rate between 0% and 100%.");
    if (years > 50) return show("Enter a term of 50 years or less.");
    show("");
    var months = Math.round(years * 12);
    var pay = payment(amount, rate, months);
    out.payment.textContent = money(pay);
    if (out.interestOnly) out.interestOnly.textContent = money((amount * rate) / 100 / 12);
    out.interest.textContent = money(pay * months - amount);
    out.total.textContent = money(pay * months);
  }

  Object.keys(input).forEach(function (k) { input[k].addEventListener("input", calculate); });
})();
