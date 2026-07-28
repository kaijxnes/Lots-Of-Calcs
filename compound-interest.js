function fmtMoney(value, symbol) {
  if (!isFinite(value)) value = 0;
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  return sign + symbol + abs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function num(id) {
  return parseFloat(document.getElementById(id).value) || 0;
}

function calculate() {
  const principal = num("principal");
  const annualRate = num("rate");
  const years = num("years");
  const startingContribution = num("contribution");
  const annualIncrease = num("contribution-growth");
  const symbol = document.getElementById("currency").value;

  const monthlyRate = annualRate / 100 / 12;
  const periods = Math.round(years * 12);

  let balance = principal;
  let totalContributed = principal;
  let contribution = startingContribution;

  for (let month = 1; month <= periods; month++) {
    balance = balance * (1 + monthlyRate) + contribution;
    totalContributed += contribution;
    if (month % 12 === 0) {
      contribution *= 1 + annualIncrease / 100;
    }
  }

  const futureValue = balance;
  const totalInterest = futureValue - totalContributed;

  document.getElementById("future-value").textContent = fmtMoney(futureValue, symbol);
  document.getElementById("total-contributed").textContent = fmtMoney(totalContributed, symbol);
  document.getElementById("total-interest").textContent = fmtMoney(totalInterest, symbol);
}

document.querySelectorAll("input, select").forEach((el) => el.addEventListener("input", calculate));
calculate();
