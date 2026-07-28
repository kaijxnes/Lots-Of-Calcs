let mode = "compound";

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

function showError(message) {
  const errorEl = document.getElementById("goal-error");
  errorEl.textContent = message;
  errorEl.style.display = message ? "block" : "none";
}

function showNote(message) {
  const noteEl = document.getElementById("goal-note");
  noteEl.textContent = message;
  noteEl.style.display = message ? "block" : "none";
}

function setMode(newMode) {
  mode = newMode;
  document.querySelectorAll(".tab[data-mode]").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.mode === mode);
  });
  document.getElementById("interest-fields").style.display = mode === "simple" ? "none" : "block";
  calculate();
}

document.querySelectorAll(".tab[data-mode]").forEach((tab) => {
  tab.addEventListener("click", () => setMode(tab.dataset.mode));
});

function calculate() {
  const goal = num("goal-amount");
  const current = num("current-savings");
  const years = num("tf-years");
  const months = num("tf-months");
  const annualRate = num("annual-rate");
  const compounding = document.getElementById("compounding").value;

  showNote("");

  if (goal < 0 || current < 0 || years < 0 || months < 0 || annualRate < 0) {
    showError("Values can't be negative.");
    return;
  }

  const totalMonths = Math.round(years * 12 + months);
  if (totalMonths <= 0) {
    showError("Enter a time frame greater than zero.");
    return;
  }

  if (goal <= current) {
    showError("Your goal must be greater than your current savings.");
    return;
  }

  showError("");

  let monthlyRate = 0;
  if (mode === "compound" && annualRate > 0) {
    monthlyRate = compounding === "annual"
      ? Math.pow(1 + annualRate / 100, 1 / 12) - 1
      : annualRate / 100 / 12;
  }

  const currentFutureValue = current * Math.pow(1 + monthlyRate, totalMonths);
  const annuityFactor = monthlyRate !== 0
    ? (Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate
    : totalMonths;

  let requiredContribution = (goal - currentFutureValue) / annuityFactor;

  if (requiredContribution < 0) {
    requiredContribution = 0;
    showNote("Your current savings are already projected to reach your goal — no further contributions needed!");
  }

  const totalContributed = current + requiredContribution * totalMonths;
  const projectedBalance = currentFutureValue + requiredContribution * annuityFactor;
  const totalInterest = projectedBalance - totalContributed;

  document.getElementById("monthly-contribution").textContent = fmtMoney(requiredContribution);
  document.getElementById("total-contributed").textContent = fmtMoney(totalContributed);
  document.getElementById("total-interest-earned").textContent = fmtMoney(totalInterest);
  document.getElementById("projected-balance").textContent = fmtMoney(projectedBalance);
}

document.querySelectorAll("input, select").forEach((el) => el.addEventListener("input", calculate));

calculate();
