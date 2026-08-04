const rowsEl = document.getElementById("selection-rows");
const outBody = document.getElementById("dutch-out-body");

function fmtMoney(value) {
  const symbol = document.getElementById("currency").value;
  if (!isFinite(value)) value = 0;
  const rounded = Math.round(Math.abs(value) * 100) / 100;
  const sign = value < 0 && rounded !== 0 ? "-" : "";
  return sign + symbol + rounded.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function showError(message) {
  const el = document.getElementById("dutch-error");
  el.textContent = message;
  el.style.display = message ? "block" : "none";
}

function showNote(message) {
  const el = document.getElementById("dutch-note");
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

function addRow(name = "", odds = "") {
  const row = document.createElement("div");
  row.className = "dyn-row";
  row.innerHTML = `
    <span class="row-index">${rowsEl.children.length + 1}</span>
    <input class="grow" type="text" placeholder="e.g. Selection A" value="${name}" data-field="name">
    <input class="fixed-sm" type="text" placeholder="3.0" value="${odds}" data-field="odds">
    <button class="btn-remove" type="button" title="Remove">✕</button>
  `;
  row.querySelector(".btn-remove").addEventListener("click", () => {
    row.remove();
    renumber();
    calculate();
  });
  rowsEl.appendChild(row);
}

function renumber() {
  [...rowsEl.children].forEach((row, i) => {
    row.querySelector(".row-index").textContent = i + 1;
  });
}

function calculate() {
  const totalStake = parseFloat(document.getElementById("total-stake").value) || 0;

  const selections = [...rowsEl.children].map((row, i) => ({
    name: row.querySelector('[data-field="name"]').value.trim() || `Selection ${i + 1}`,
    odds: parseOdds(row.querySelector('[data-field="odds"]').value),
  }));

  function reset() {
    ["profit", "staked", "return"].forEach((id) => {
      document.getElementById(id).textContent = fmtMoney(0);
    });
    document.getElementById("book-pct").textContent = "—";
    outBody.innerHTML = "";
  }

  showNote("");

  if (totalStake <= 0) {
    showError("Enter a total stake greater than zero.");
    reset();
    return;
  }
  if (selections.length < 2) {
    showError("Add at least two selections to dutch.");
    reset();
    return;
  }
  if (selections.some((s) => !isFinite(s.odds) || s.odds <= 1)) {
    showError("Every selection needs odds above 1 — use a fraction like 5/2 or a decimal like 3.5.");
    reset();
    return;
  }

  showError("");

  const inverseSum = selections.reduce((sum, s) => sum + 1 / s.odds, 0);
  const equalReturn = totalStake / inverseSum;
  const profit = equalReturn - totalStake;

  document.getElementById("staked").textContent = fmtMoney(totalStake);
  document.getElementById("return").textContent = fmtMoney(equalReturn);
  document.getElementById("book-pct").textContent = (inverseSum * 100).toFixed(2) + "%";

  const profitEl = document.getElementById("profit");
  profitEl.textContent = fmtMoney(profit);
  profitEl.style.color = profit > 0 ? "var(--good)" : profit < 0 ? "var(--bad)" : "";

  if (inverseSum >= 1) {
    showNote("");
    showError(
      "These selections total " +
        (inverseSum * 100).toFixed(2) +
        "% implied probability, so every outcome loses money — there's no arbitrage here."
    );
  } else {
    showNote("Combined implied probability is under 100%, so this locks in a profit if one of them wins.");
  }

  outBody.innerHTML = "";
  selections.forEach((s) => {
    const stake = totalStake * (1 / s.odds) / inverseSum;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${s.name}</td>
      <td>${s.odds.toFixed(2)}</td>
      <td>${fmtMoney(stake)}</td>
      <td>${fmtMoney(stake * s.odds)}</td>
    `;
    outBody.appendChild(tr);
  });
}

document.getElementById("add-selection").addEventListener("click", () => {
  addRow();
  calculate();
});
document.getElementById("total-stake").addEventListener("input", calculate);
document.getElementById("currency").addEventListener("input", calculate);
rowsEl.addEventListener("input", calculate);

addRow("Selection A", "3.0");
addRow("Selection B", "2.0");

calculate();
