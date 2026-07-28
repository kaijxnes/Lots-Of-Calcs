function fmtMoney(value, symbol) {
  if (!isFinite(value)) value = 0;
  const rounded = Math.round(Math.abs(value) * 100) / 100;
  const sign = value < 0 && rounded !== 0 ? "-" : "";
  return sign + symbol + rounded.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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

  const yearRows = [];
  let yearStartBalance = principal;
  let yearContributed = 0;
  let monthlyContributionThisYear = contribution;

  for (let month = 1; month <= periods; month++) {
    if ((month - 1) % 12 === 0) {
      monthlyContributionThisYear = contribution;
    }

    balance = balance * (1 + monthlyRate) + contribution;
    totalContributed += contribution;
    yearContributed += contribution;

    const isYearEnd = month % 12 === 0;
    const isLastMonth = month === periods;

    if (isYearEnd || isLastMonth) {
      yearRows.push({
        year: Math.ceil(month / 12),
        monthlyContribution: monthlyContributionThisYear,
        contributed: yearContributed,
        interest: balance - yearStartBalance - yearContributed,
        balance,
      });
      yearStartBalance = balance;
      yearContributed = 0;
    }

    if (isYearEnd) {
      contribution *= 1 + annualIncrease / 100;
    }
  }

  const futureValue = balance;
  const totalInterest = futureValue - totalContributed;

  document.getElementById("future-value").textContent = fmtMoney(futureValue, symbol);
  document.getElementById("total-contributed").textContent = fmtMoney(totalContributed, symbol);
  document.getElementById("total-interest").textContent = fmtMoney(totalInterest, symbol);

  const yearlyBody = document.getElementById("yearly-body");
  yearlyBody.innerHTML = "";
  yearRows.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.year}</td>
      <td>${fmtMoney(row.monthlyContribution, symbol)}</td>
      <td>${fmtMoney(row.contributed, symbol)}</td>
      <td>${fmtMoney(row.interest, symbol)}</td>
      <td>${fmtMoney(row.balance, symbol)}</td>
    `;
    yearlyBody.appendChild(tr);
  });
}

document.querySelectorAll("input, select").forEach((el) => el.addEventListener("input", calculate));
calculate();
