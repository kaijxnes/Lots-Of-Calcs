/* Minor unit label per currency — the hundredth of the main unit */
const MINOR_UNITS = {
  "£": "p",
  "$": "¢",
  "€": "c",
  "¥": "sen",
  "₹": "p",
  "A$": "¢",
  "C$": "¢",
  "Fr": "c",
};

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

function fmtKwh(value, digits = 3) {
  if (!isFinite(value)) value = 0;
  return value.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits }) + " kWh";
}

function showError(message) {
  const el = document.getElementById("rc-error");
  el.textContent = message;
  el.style.display = message ? "block" : "none";
}

function calculate() {
  const power = num("power");
  const powerUnit = document.getElementById("power-unit").value;
  const hours = num("hours");
  const period = document.getElementById("period").value;
  const priceMinor = num("unit-price");
  const currency = document.getElementById("currency").value;

  document.getElementById("minor-label").textContent = MINOR_UNITS[currency] || "c";

  function reset() {
    document.getElementById("kwh-use").textContent = fmtKwh(0);
    document.getElementById("kwh-year").textContent = fmtKwh(0, 1);
    ["cost-use", "cost-day", "cost-week", "cost-month", "cost-year"].forEach((id) => {
      document.getElementById(id).textContent = fmtMoney(0);
    });
  }

  if (power < 0 || hours < 0 || priceMinor < 0) {
    showError("Values can't be negative.");
    reset();
    return;
  }

  showError("");

  const kW = powerUnit === "kw" ? power : power / 1000;
  const pricePerKwh = priceMinor / 100;

  /* Energy and cost for one run of the length entered */
  const kwhPerUse = kW * hours;
  const costPerUse = kwhPerUse * pricePerKwh;

  /* Put everything on a per-day basis: 365 days/yr, 7-day week, month = year/12 */
  let kwhPerDay;
  if (period === "day") kwhPerDay = kwhPerUse;
  else if (period === "week") kwhPerDay = kwhPerUse / 7;
  else kwhPerDay = (kwhPerUse * 12) / 365;

  const kwhPerYear = kwhPerDay * 365;
  const costPerDay = kwhPerDay * pricePerKwh;
  const costPerWeek = costPerDay * 7;
  const costPerYear = kwhPerYear * pricePerKwh;
  const costPerMonth = costPerYear / 12;

  document.getElementById("kwh-use").textContent = fmtKwh(kwhPerUse);
  document.getElementById("kwh-year").textContent = fmtKwh(kwhPerYear, 1);
  document.getElementById("cost-use").textContent = fmtMoney(costPerUse);
  document.getElementById("cost-day").textContent = fmtMoney(costPerDay);
  document.getElementById("cost-week").textContent = fmtMoney(costPerWeek);
  document.getElementById("cost-month").textContent = fmtMoney(costPerMonth);
  document.getElementById("cost-year").textContent = fmtMoney(costPerYear);
}

document.querySelectorAll("input, select").forEach((el) => el.addEventListener("input", calculate));

calculate();
