const legRowsEl = document.getElementById("leg-rows");

function fmtMoney(value) {
  const symbol = document.getElementById("currency").value;
  if (!isFinite(value)) value = 0;
  const rounded = Math.round(Math.abs(value) * 100) / 100;
  const sign = value < 0 && rounded !== 0 ? "-" : "";
  return sign + symbol + rounded.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function showError(message) {
  const el = document.getElementById("acca-error");
  el.textContent = message;
  el.style.display = message ? "block" : "none";
}

/* Accepts fractional ("5/2") or decimal ("3.5"); returns decimal odds */
function parseOdds(raw) {
  const text = (raw || "").trim();
  if (!text) return NaN;
  if (text.includes("/")) {
    const [a, b] = text.split("/");
    const n = parseFloat(a);
    const d = parseFloat(b);
    if (!isFinite(n) || !isFinite(d) || d <= 0 || n < 0) return NaN;
    return n / d + 1;
  }
  const dec = parseFloat(text);
  return isFinite(dec) ? dec : NaN;
}

function addLeg(name = "", odds = "", result = "win") {
  const row = document.createElement("div");
  row.className = "dyn-row";
  row.innerHTML = `
    <span class="row-index">${legRowsEl.children.length + 1}</span>
    <input class="grow" type="text" placeholder="e.g. Leg ${legRowsEl.children.length + 1}" value="${name}" data-field="name">
    <input class="fixed-sm" type="text" placeholder="2.0" value="${odds}" data-field="odds">
    <select class="fixed-sm" data-field="result">
      <option value="win"${result === "win" ? " selected" : ""}>Win</option>
      <option value="void"${result === "void" ? " selected" : ""}>Void</option>
      <option value="lose"${result === "lose" ? " selected" : ""}>Lose</option>
    </select>
    <button class="btn-remove" type="button" title="Remove">✕</button>
  `;
  row.querySelector(".btn-remove").addEventListener("click", () => {
    row.remove();
    renumber();
    calculate();
  });
  legRowsEl.appendChild(row);
}

function renumber() {
  [...legRowsEl.children].forEach((row, i) => {
    row.querySelector(".row-index").textContent = i + 1;
  });
}

function calculate() {
  const stake = parseFloat(document.getElementById("stake").value) || 0;
  const bonusPct = parseFloat(document.getElementById("bonus").value) || 0;

  const legs = [...legRowsEl.children].map((row) => ({
    odds: parseOdds(row.querySelector('[data-field="odds"]').value),
    result: row.querySelector('[data-field="result"]').value,
  }));

  function reset() {
    document.getElementById("combined-odds").textContent = "—";
    ["profit", "stake-out", "bonus-out", "total-return"].forEach((id) => {
      document.getElementById(id).textContent = fmtMoney(0);
    });
  }

  if (stake < 0 || bonusPct < 0) {
    showError("Values can't be negative.");
    reset();
    return;
  }
  if (legs.length === 0) {
    showError("Add at least one leg.");
    reset();
    return;
  }

  /* Void legs settle at 1.00, so their odds don't need to be valid */
  const badLeg = legs.some((l) => l.result !== "void" && (!isFinite(l.odds) || l.odds <= 1));
  if (badLeg) {
    showError("Every non-void leg needs odds above 1 — use a fraction like 5/2 or a decimal like 3.5.");
    reset();
    return;
  }

  showError("");

  const anyLost = legs.some((l) => l.result === "lose");

  let combined = 1;
  legs.forEach((l) => {
    if (l.result === "win") combined *= l.odds;
    /* void -> multiply by 1.00, i.e. no effect */
  });

  let baseReturn;
  let profit;
  let bonus;

  if (anyLost) {
    baseReturn = 0;
    bonus = 0;
    profit = -stake;
  } else {
    baseReturn = stake * combined;
    const rawProfit = baseReturn - stake;
    bonus = rawProfit > 0 ? rawProfit * (bonusPct / 100) : 0;
    profit = rawProfit + bonus;
  }

  const totalReturn = baseReturn + bonus;

  document.getElementById("combined-odds").textContent = anyLost ? "—" : combined.toFixed(2);
  document.getElementById("stake-out").textContent = fmtMoney(stake);
  document.getElementById("bonus-out").textContent = fmtMoney(bonus);
  document.getElementById("total-return").textContent = fmtMoney(totalReturn);

  const profitEl = document.getElementById("profit");
  profitEl.textContent = fmtMoney(profit);
  profitEl.style.color = profit > 0 ? "var(--good)" : profit < 0 ? "var(--bad)" : "";
}

document.getElementById("add-leg").addEventListener("click", () => {
  addLeg();
  calculate();
});
document.getElementById("stake").addEventListener("input", calculate);
document.getElementById("bonus").addEventListener("input", calculate);
document.getElementById("currency").addEventListener("input", calculate);
legRowsEl.addEventListener("input", calculate);
legRowsEl.addEventListener("change", calculate);

addLeg("Leg 1", "2.0");
addLeg("Leg 2", "3.0");
addLeg("Leg 3", "1.5");

calculate();
