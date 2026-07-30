function num(id) {
  return parseFloat(document.getElementById(id).value) || 0;
}

function fmtMoney(value) {
  const symbol = document.getElementById("currency").value;
  if (!isFinite(value)) value = 0;
  const rounded = Math.round(Math.abs(value) * 100) / 100;
  const sign = value < 0 && rounded !== 0 ? "-" : "";
  return sign + symbol + rounded.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDuration(months) {
  if (!isFinite(months) || months <= 0) return "None";
  const years = Math.floor(months / 12);
  const rem = Math.round(months % 12);
  const parts = [];
  if (years > 0) parts.push(years + (years === 1 ? " year" : " years"));
  if (rem > 0) parts.push(rem + (rem === 1 ? " month" : " months"));
  return parts.length ? parts.join(", ") : "None";
}

function showError(message) {
  const errorEl = document.getElementById("mo-error");
  errorEl.textContent = message;
  errorEl.style.display = message ? "block" : "none";
}

/* Standard repayment mortgage payment for a balance over n months */
function monthlyPaymentFor(balance, monthlyRate, months) {
  if (months <= 0) return balance;
  if (monthlyRate === 0) return balance / months;
  const factor = Math.pow(1 + monthlyRate, months);
  return (balance * monthlyRate * factor) / (factor - 1);
}

/* Run the mortgage forward month by month until it clears */
function amortize(balance, monthlyRate, payment, overpayment) {
  let remaining = balance;
  let totalInterest = 0;
  let months = 0;
  const maxMonths = 12000; /* safety valve: 1000 years */

  while (remaining > 0.005 && months < maxMonths) {
    const interest = remaining * monthlyRate;
    let principal = payment + overpayment - interest;

    if (principal <= 0) {
      /* Payment doesn't even cover the interest — never clears */
      return { totalInterest: Infinity, months: Infinity, neverClears: true };
    }

    if (principal > remaining) principal = remaining;

    totalInterest += interest;
    remaining -= principal;
    months += 1;
  }

  return { totalInterest, months, neverClears: false };
}

function calculate() {
  const balance = num("balance");
  const annualRate = num("rate");
  const years = num("term-years");
  const months = num("term-months");
  const monthlyOverpayment = num("monthly-overpayment");
  const lumpSum = num("lump-sum");

  const compareBody = document.getElementById("compare-body");

  function reset() {
    document.getElementById("interest-saved").textContent = fmtMoney(0);
    document.getElementById("time-saved").textContent = "—";
    document.getElementById("monthly-payment").textContent = fmtMoney(0);
    document.getElementById("new-outlay").textContent = fmtMoney(0);
    compareBody.innerHTML = "";
  }

  if (balance < 0 || annualRate < 0 || years < 0 || months < 0 || monthlyOverpayment < 0 || lumpSum < 0) {
    showError("Values can't be negative.");
    reset();
    return;
  }

  const totalMonths = Math.round(years * 12 + months);
  if (totalMonths <= 0) {
    showError("Enter how long is left on your mortgage.");
    reset();
    return;
  }

  if (balance <= 0) {
    showError("Enter your outstanding balance.");
    reset();
    return;
  }

  if (lumpSum >= balance) {
    showError("Your lump sum would clear the mortgage outright.");
    reset();
    return;
  }

  showError("");

  const monthlyRate = annualRate / 100 / 12;
  const payment = monthlyPaymentFor(balance, monthlyRate, totalMonths);

  const base = amortize(balance, monthlyRate, payment, 0);
  const over = amortize(balance - lumpSum, monthlyRate, payment, monthlyOverpayment);

  document.getElementById("monthly-payment").textContent = fmtMoney(payment);
  document.getElementById("new-outlay").textContent = fmtMoney(payment + monthlyOverpayment);

  if (over.neverClears || base.neverClears) {
    showError("At that interest rate the payment doesn't cover the interest charged.");
    reset();
    return;
  }

  const interestSaved = base.totalInterest - over.totalInterest;
  const monthsSaved = base.months - over.months;

  document.getElementById("interest-saved").textContent = fmtMoney(interestSaved);
  document.getElementById("time-saved").textContent = fmtDuration(monthsSaved);

  const rows = [
    ["Time to clear", fmtDuration(base.months), fmtDuration(over.months)],
    ["Total interest", fmtMoney(base.totalInterest), fmtMoney(over.totalInterest)],
    ["Total paid", fmtMoney(balance + base.totalInterest), fmtMoney(balance + over.totalInterest)],
    ["Monthly outlay", fmtMoney(payment), fmtMoney(payment + monthlyOverpayment)],
  ];

  compareBody.innerHTML = "";
  rows.forEach(([label, withoutValue, withValue]) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${label}</td>
      <td>${withoutValue}</td>
      <td>${withValue}</td>
    `;
    compareBody.appendChild(tr);
  });
}

document.querySelectorAll("input, select").forEach((el) => el.addEventListener("input", calculate));

calculate();
