let outcome = "won";

function fmtMoney(value) {
  const symbol = document.getElementById("currency").value;
  if (!isFinite(value)) value = 0;
  const rounded = Math.round(Math.abs(value) * 100) / 100;
  const sign = value < 0 && rounded !== 0 ? "-" : "";
  return sign + symbol + rounded.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function showError(message) {
  const errorEl = document.getElementById("ew-error");
  errorEl.textContent = message;
  errorEl.style.display = message ? "block" : "none";
}

/* Accepts fractional ("10/1") or decimal ("11.0"); returns decimal odds */
function parseOdds(raw) {
  const text = (raw || "").trim();
  if (!text) return NaN;
  if (text.includes("/")) {
    const [a, b] = text.split("/");
    const num = parseFloat(a);
    const den = parseFloat(b);
    if (!isFinite(num) || !isFinite(den) || den <= 0 || num < 0) return NaN;
    return num / den + 1;
  }
  const dec = parseFloat(text);
  return isFinite(dec) ? dec : NaN;
}

/* Place terms are a bare fraction ("1/5"), not odds — no +1 */
function parseFraction(raw) {
  const text = (raw || "").trim();
  if (!text) return NaN;
  if (text.includes("/")) {
    const [a, b] = text.split("/");
    const num = parseFloat(a);
    const den = parseFloat(b);
    if (!isFinite(num) || !isFinite(den) || den <= 0 || num <= 0) return NaN;
    return num / den;
  }
  const dec = parseFloat(text);
  return isFinite(dec) && dec > 0 ? dec : NaN;
}

function setOutcome(next) {
  outcome = next;
  document.querySelectorAll(".tab[data-outcome]").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.outcome === outcome);
  });
  calculate();
}

document.querySelectorAll(".tab[data-outcome]").forEach((tab) => {
  tab.addEventListener("click", () => setOutcome(tab.dataset.outcome));
});

function calculate() {
  const unit = parseFloat(document.getElementById("unit-stake").value) || 0;
  const winOdds = parseOdds(document.getElementById("odds").value);
  const placeFraction = parseFraction(document.getElementById("place-terms").value);

  function reset() {
    ["total-profit", "total-staked", "win-return", "place-return", "total-return"].forEach((id) => {
      document.getElementById(id).textContent = fmtMoney(0);
    });
    document.getElementById("place-odds-note").textContent = "—";
  }

  if (unit < 0) {
    showError("Stake can't be negative.");
    reset();
    return;
  }
  if (!isFinite(winOdds) || winOdds <= 1) {
    showError("Enter odds as a fraction like 10/1 or a decimal above 1 like 11.0.");
    reset();
    return;
  }
  if (!isFinite(placeFraction) || placeFraction <= 0) {
    showError("Enter place terms as a fraction like 1/5 or 1/4.");
    reset();
    return;
  }

  showError("");

  const placeOdds = 1 + (winOdds - 1) * placeFraction;
  const totalStaked = unit * 2;

  /* A winner has also placed, so "won" pays both parts */
  const winReturn = outcome === "won" ? unit * winOdds : 0;
  const placeReturn = outcome === "won" || outcome === "placed" ? unit * placeOdds : 0;
  const totalReturn = winReturn + placeReturn;
  const profit = totalReturn - totalStaked;

  document.getElementById("total-staked").textContent = fmtMoney(totalStaked);
  document.getElementById("win-return").textContent = fmtMoney(winReturn);
  document.getElementById("place-return").textContent = fmtMoney(placeReturn);
  document.getElementById("total-return").textContent = fmtMoney(totalReturn);

  const profitEl = document.getElementById("total-profit");
  profitEl.textContent = fmtMoney(profit);
  profitEl.style.color = profit > 0 ? "var(--good)" : profit < 0 ? "var(--bad)" : "";

  document.getElementById("place-odds-note").textContent = placeOdds.toFixed(2);
}

document.querySelectorAll("input, select").forEach((el) => el.addEventListener("input", calculate));

calculate();
