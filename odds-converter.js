/* Guard so writing to one field doesn't trigger a rewrite of the field being typed in */
let syncing = false;

function fmtMoney(value) {
  const symbol = document.getElementById("currency").value;
  if (!isFinite(value)) value = 0;
  const rounded = Math.round(Math.abs(value) * 100) / 100;
  const sign = value < 0 && rounded !== 0 ? "-" : "";
  return sign + symbol + rounded.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function showError(message) {
  const errorEl = document.getElementById("odds-error");
  errorEl.textContent = message;
  errorEl.style.display = message ? "block" : "none";
}

/* Conversions and fraction-matching live in /odds-utils.js, shared with
   /full-cover-bets/. Everything here is derived from decimal odds. */
function update(decimal, source) {
  const decimalEl = document.getElementById("decimal-odds");
  const americanEl = document.getElementById("american-odds");
  const probEl = document.getElementById("implied-prob");
  const fracNumEl = document.getElementById("frac-num");
  const fracDenEl = document.getElementById("frac-den");

  if (!isFinite(decimal) || decimal <= 1) {
    showError("Enter valid odds — decimal above 1 (e.g. 1.50), a fraction like 1/2, or a moneyline like −200.");
    document.getElementById("prob-hero").textContent = "—";
    document.getElementById("profit").textContent = fmtMoney(0);
    document.getElementById("total-return").textContent = fmtMoney(0);
    return;
  }

  showError("");
  syncing = true;

  if (source !== "decimal") decimalEl.value = (Math.round(decimal * 1000) / 1000).toString();

  if (source !== "american") {
    const american = Odds.decimalToAmerican(decimal);
    americanEl.value = (Math.round(american * 100) / 100).toString();
  }

  if (source !== "prob") {
    const prob = 100 / decimal;
    probEl.value = (Math.round(prob * 100) / 100).toString();
  }

  if (source !== "fraction") {
    const frac = Odds.toFraction(decimal - 1);
    fracNumEl.value = frac.num;
    fracDenEl.value = frac.den;
  }

  syncing = false;

  document.getElementById("prob-hero").textContent = (100 / decimal).toFixed(2) + "%";

  const stake = parseFloat(document.getElementById("stake").value) || 0;
  const totalReturn = stake * decimal;
  document.getElementById("profit").textContent = fmtMoney(totalReturn - stake);
  document.getElementById("total-return").textContent = fmtMoney(totalReturn);
}

function fromDecimal() {
  if (syncing) return;
  update(parseFloat(document.getElementById("decimal-odds").value), "decimal");
}

function fromAmerican() {
  if (syncing) return;
  const american = parseFloat(document.getElementById("american-odds").value);
  if (!isFinite(american) || american === 0) return update(NaN, "american");
  update(Odds.americanToDecimal(american), "american");
}

function fromProb() {
  if (syncing) return;
  const prob = parseFloat(document.getElementById("implied-prob").value);
  if (!isFinite(prob) || prob <= 0 || prob > 100) return update(NaN, "prob");
  update(100 / prob, "prob");
}

function fromFraction() {
  if (syncing) return;
  const num = parseFloat(document.getElementById("frac-num").value);
  const den = parseFloat(document.getElementById("frac-den").value);
  if (!isFinite(num) || !isFinite(den) || den <= 0 || num <= 0) return update(NaN, "fraction");
  update(num / den + 1, "fraction");
}

function recalcPayout() {
  const decimal = parseFloat(document.getElementById("decimal-odds").value);
  if (isFinite(decimal) && decimal > 1) update(decimal, "payout");
}

document.getElementById("decimal-odds").addEventListener("input", fromDecimal);
document.getElementById("american-odds").addEventListener("input", fromAmerican);
document.getElementById("implied-prob").addEventListener("input", fromProb);
document.getElementById("frac-num").addEventListener("input", fromFraction);
document.getElementById("frac-den").addEventListener("input", fromFraction);
document.getElementById("stake").addEventListener("input", recalcPayout);
document.getElementById("currency").addEventListener("input", recalcPayout);

/* Start on 3/2 — evens-plus, so every format shows something meaningful */
update(2.5, "init");
