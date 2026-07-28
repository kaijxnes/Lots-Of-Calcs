const peopleRowsEl = document.getElementById("people-rows");
const billRowsEl = document.getElementById("bill-rows");

let peopleMode = "pct";

function getCurrency() {
  return document.getElementById("currency").value;
}

function fmtMoney(value) {
  const symbol = getCurrency();
  if (!isFinite(value)) value = 0;
  const rounded = Math.round(Math.abs(value) * 100) / 100;
  const sign = value < 0 && rounded !== 0 ? "-" : "";
  return sign + symbol + rounded.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtPercent(value) {
  if (!isFinite(value)) return "0%";
  return value.toFixed(1) + "%";
}

function updateIncomeColumnLabel() {
  const isIncome = peopleMode === "income";
  document.getElementById("people-col-label").textContent = isIncome
    ? `Income (${getCurrency()})`
    : "Share %";
}

/* ---------- Mode toggle ---------- */
function setMode(mode) {
  if (mode === peopleMode) return;
  peopleMode = mode;
  document.querySelectorAll('.tab[data-mode]').forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.mode === mode);
  });

  document.querySelectorAll('#people-rows [data-field="value"]').forEach((input) => {
    input.value = "";
  });

  const isIncome = mode === "income";
  updateIncomeColumnLabel();
  document.getElementById("people-total-label").textContent = isIncome
    ? "Total household income"
    : "Total share entered";
  document.getElementById("people-mode-hint").textContent = isIncome
    ? "Each person's share is worked out from their income as a proportion of total household income."
    : "Shares are split proportionally, so they don't need to add up to exactly 100%.";
  document.getElementById("split-col-input").textContent = isIncome ? "Income" : "Share entered";

  document.querySelectorAll('#people-rows [data-field="value"]').forEach((input) => {
    input.placeholder = isIncome ? "e.g. 35000" : "0";
  });

  calculate();
}

document.querySelectorAll('.tab[data-mode]').forEach((tab) => {
  tab.addEventListener("click", () => setMode(tab.dataset.mode));
});

/* ---------- People ---------- */
function addPersonRow(name = "", value = "") {
  const row = document.createElement("div");
  row.className = "dyn-row";
  row.innerHTML = `
    <span class="row-index">${peopleRowsEl.children.length + 1}</span>
    <input class="grow" type="text" placeholder="Name" value="${name}" data-field="name">
    <input class="fixed-sm" type="number" placeholder="0" step="any" value="${value}" data-field="value">
    <button class="btn-remove" type="button" title="Remove">✕</button>
  `;
  row.querySelector(".btn-remove").addEventListener("click", () => {
    row.remove();
    renumber(peopleRowsEl);
    calculate();
  });
  peopleRowsEl.appendChild(row);
}

/* ---------- Bills ---------- */
function addBillRow(name = "", amount = "") {
  const row = document.createElement("div");
  row.className = "dyn-row";
  row.innerHTML = `
    <span class="row-index">${billRowsEl.children.length + 1}</span>
    <input class="grow" type="text" placeholder="e.g. Rent" value="${name}" data-field="name">
    <input class="fixed-sm" type="number" placeholder="0.00" step="any" value="${amount}" data-field="amount">
    <button class="btn-remove" type="button" title="Remove">✕</button>
  `;
  row.querySelector(".btn-remove").addEventListener("click", () => {
    row.remove();
    renumber(billRowsEl);
    calculate();
  });
  billRowsEl.appendChild(row);
}

function renumber(container) {
  [...container.children].forEach((row, i) => {
    row.querySelector(".row-index").textContent = i + 1;
  });
}

function calculate() {
  const isIncome = peopleMode === "income";
  const people = [...peopleRowsEl.children].map((row, i) => ({
    name: row.querySelector('[data-field="name"]').value || `Person ${i + 1}`,
    value: parseFloat(row.querySelector('[data-field="value"]').value) || 0,
  }));

  const bills = [...billRowsEl.children].map((row) => ({
    name: row.querySelector('[data-field="name"]').value,
    amount: parseFloat(row.querySelector('[data-field="amount"]').value) || 0,
  }));

  const totalValue = people.reduce((sum, p) => sum + p.value, 0);
  const totalBills = bills.reduce((sum, b) => sum + b.amount, 0);

  document.getElementById("people-total").textContent = isIncome
    ? fmtMoney(totalValue)
    : fmtPercent(totalValue);
  document.getElementById("bills-total").textContent = fmtMoney(totalBills);

  const outBody = document.getElementById("split-out-body");
  outBody.innerHTML = "";
  people.forEach((p) => {
    const share = totalValue !== 0 ? p.value / totalValue : 0;
    const owed = share * totalBills;
    const inputDisplay = isIncome ? fmtMoney(p.value) : fmtPercent(p.value);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.name}</td>
      <td>${inputDisplay}</td>
      <td>${fmtPercent(share * 100)}</td>
      <td>${fmtMoney(owed)}</td>
    `;
    outBody.appendChild(tr);
  });
}

document.getElementById("add-person").addEventListener("click", () => {
  addPersonRow();
  calculate();
});
document.getElementById("add-bill").addEventListener("click", () => {
  addBillRow();
  calculate();
});
peopleRowsEl.addEventListener("input", calculate);
billRowsEl.addEventListener("input", calculate);
document.getElementById("currency").addEventListener("input", () => {
  updateIncomeColumnLabel();
  calculate();
});

addPersonRow("Person 1", "50");
addPersonRow("Person 2", "50");
addBillRow("Rent", "");
addBillRow("Utilities", "");

calculate();
