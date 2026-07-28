function initTabs() {
  const tabs = document.querySelectorAll(".tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
      tab.classList.add("active");
      document.querySelector(`[data-panel="${tab.dataset.tab}"]`).classList.add("active");
    });
  });
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

function num(id) {
  return parseFloat(document.getElementById(id).value) || 0;
}

function calcCostSell() {
  const cost = num("cs-cost");
  const sell = num("cs-sell");
  const profit = sell - cost;
  const margin = sell !== 0 ? (profit / sell) * 100 : 0;
  const markup = cost !== 0 ? (profit / cost) * 100 : 0;
  document.getElementById("cs-profit").textContent = fmtMoney(profit);
  document.getElementById("cs-margin").textContent = fmtPercent(margin);
  document.getElementById("cs-markup").textContent = fmtPercent(markup);
}

function calcCostMargin() {
  const cost = num("cm-cost");
  const margin = num("cm-margin");
  const sell = margin < 100 ? cost / (1 - margin / 100) : NaN;
  const profit = sell - cost;
  const markup = cost !== 0 ? (profit / cost) * 100 : 0;
  document.getElementById("cm-sell").textContent = fmtMoney(sell);
  document.getElementById("cm-profit").textContent = fmtMoney(profit);
  document.getElementById("cm-markup").textContent = fmtPercent(markup);
}

function calcCostMarkup() {
  const cost = num("ck-cost");
  const markup = num("ck-markup");
  const sell = cost * (1 + markup / 100);
  const profit = sell - cost;
  const margin = sell !== 0 ? (profit / sell) * 100 : 0;
  document.getElementById("ck-sell").textContent = fmtMoney(sell);
  document.getElementById("ck-profit").textContent = fmtMoney(profit);
  document.getElementById("ck-margin").textContent = fmtPercent(margin);
}

document.addEventListener("input", (event) => {
  if (event.target.closest('[data-panel="cost-sell"]')) calcCostSell();
  if (event.target.closest('[data-panel="cost-margin"]')) calcCostMargin();
  if (event.target.closest('[data-panel="cost-markup"]')) calcCostMarkup();
});
document.getElementById("currency").addEventListener("input", () => {
  calcCostSell();
  calcCostMargin();
  calcCostMarkup();
});

initTabs();
calcCostSell();
calcCostMargin();
calcCostMarkup();
