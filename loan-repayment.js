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

function fmtPercent(value) {
  if (!isFinite(value)) return "0%";
  return value.toFixed(2) + "%";
}

function showError(message) {
  const errorEl = document.getElementById("loan-error");
  errorEl.textContent = message;
  errorEl.style.display = message ? "block" : "none";
}

function calculate() {
  const amount = num("amount");
  const apr = num("apr");
  const years = num("term-years");
  const months = num("term-months");

  const amortBody = document.getElementById("amort-body");

  function reset() {
    document.getElementById("monthly-payment").textContent = fmtMoney(0);
    document.getElementById("total-interest").textContent = fmtMoney(0);
    document.getElementById("total-repaid").textContent = fmtMoney(0);
    document.getElementById("interest-pct").textContent = "0%";
    amortBody.innerHTML = "";
  }

  if (amount < 0 || apr < 0 || years < 0 || months < 0) {
    showError("Values can't be negative.");
    reset();
    return;
  }

  const totalMonths = Math.round(years * 12 + months);
  if (totalMonths <= 0) {
    showError("Enter a loan term greater than zero.");
    reset();
    return;
  }

  if (amount <= 0) {
    showError("Enter the amount you're borrowing.");
    reset();
    return;
  }

  showError("");

  const monthlyRate = apr / 100 / 12;
  let payment;
  if (monthlyRate === 0) {
    payment = amount / totalMonths;
  } else {
    const factor = Math.pow(1 + monthlyRate, totalMonths);
    payment = (amount * monthlyRate * factor) / (factor - 1);
  }

  /* Walk the loan month by month so the yearly summary and totals always agree */
  let balance = amount;
  let totalInterest = 0;
  const yearRows = [];
  let yearInterest = 0;
  let yearPrincipal = 0;

  for (let month = 1; month <= totalMonths; month++) {
    const interest = balance * monthlyRate;
    let principal = payment - interest;
    if (principal > balance) principal = balance;

    balance -= principal;
    totalInterest += interest;
    yearInterest += interest;
    yearPrincipal += principal;

    if (month % 12 === 0 || month === totalMonths) {
      yearRows.push({
        year: Math.ceil(month / 12),
        interest: yearInterest,
        principal: yearPrincipal,
        balance,
      });
      yearInterest = 0;
      yearPrincipal = 0;
    }
  }

  const totalRepaid = amount + totalInterest;

  document.getElementById("monthly-payment").textContent = fmtMoney(payment);
  document.getElementById("total-interest").textContent = fmtMoney(totalInterest);
  document.getElementById("total-repaid").textContent = fmtMoney(totalRepaid);
  document.getElementById("interest-pct").textContent = fmtPercent((totalInterest / amount) * 100);

  amortBody.innerHTML = "";
  yearRows.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.year}</td>
      <td>${fmtMoney(row.interest)}</td>
      <td>${fmtMoney(row.principal)}</td>
      <td>${fmtMoney(row.balance)}</td>
    `;
    amortBody.appendChild(tr);
  });
}

document.querySelectorAll("input, select").forEach((el) => el.addEventListener("input", calculate));

calculate();
