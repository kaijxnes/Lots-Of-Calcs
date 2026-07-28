function fmtMoney(value) {
  const symbol = document.getElementById("currency").value;
  if (!isFinite(value)) value = 0;
  const rounded = Math.round(Math.abs(value) * 100) / 100;
  const sign = value < 0 && rounded !== 0 ? "-" : "";
  return sign + symbol + rounded.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function num(id) {
  return parseFloat(document.getElementById(id).value) || 0;
}

/* ---------- Tabs ---------- */
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
    tab.classList.add("active");
    document.querySelector(`[data-panel="${tab.dataset.tab}"]`).classList.add("active");
  });
});

/* ---------- Equal split ---------- */
function calcEqual() {
  const bill = num("eq-bill");
  const tipPct = num("eq-tip");
  const people = Math.max(1, Math.floor(num("eq-people")) || 1);

  const tipAmount = bill * (tipPct / 100);
  const total = bill + tipAmount;

  document.getElementById("eq-tip-amount").textContent = fmtMoney(tipAmount);
  document.getElementById("eq-total").textContent = fmtMoney(total);
  document.getElementById("eq-per-person").textContent = fmtMoney(total / people);
}

["eq-bill", "eq-tip", "eq-people"].forEach((id) =>
  document.getElementById(id).addEventListener("input", calcEqual)
);

/* ---------- Uneven / itemized split ---------- */
const unRowsEl = document.getElementById("un-rows");

function addUnRow(name = "", amount = "") {
  const row = document.createElement("div");
  row.className = "dyn-row";
  row.innerHTML = `
    <span class="row-index">${unRowsEl.children.length + 1}</span>
    <input class="grow" type="text" placeholder="Name" value="${name}" data-field="name">
    <input class="fixed-sm" type="number" placeholder="0.00" step="any" value="${amount}" data-field="amount">
    <button class="btn-remove" type="button" title="Remove">✕</button>
  `;
  row.querySelector(".btn-remove").addEventListener("click", () => {
    row.remove();
    renumberUn();
    calcUneven();
  });
  unRowsEl.appendChild(row);
}

function renumberUn() {
  [...unRowsEl.children].forEach((row, i) => {
    row.querySelector(".row-index").textContent = i + 1;
  });
}

function calcUneven() {
  const tipPct = num("un-tip");
  const people = [...unRowsEl.children].map((row, i) => ({
    name: row.querySelector('[data-field="name"]').value || `Person ${i + 1}`,
    amount: parseFloat(row.querySelector('[data-field="amount"]').value) || 0,
  }));

  const subtotal = people.reduce((sum, p) => sum + p.amount, 0);
  const tipAmount = subtotal * (tipPct / 100);
  const total = subtotal + tipAmount;

  document.getElementById("un-subtotal").textContent = fmtMoney(subtotal);
  document.getElementById("un-tip-amount").textContent = fmtMoney(tipAmount);
  document.getElementById("un-total").textContent = fmtMoney(total);

  const outBody = document.getElementById("un-out-body");
  outBody.innerHTML = "";
  people.forEach((p) => {
    const share = subtotal !== 0 ? p.amount / subtotal : 0;
    const tipShare = tipAmount * share;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.name}</td>
      <td>${fmtMoney(p.amount)}</td>
      <td>${fmtMoney(tipShare)}</td>
      <td>${fmtMoney(p.amount + tipShare)}</td>
    `;
    outBody.appendChild(tr);
  });
}

document.getElementById("un-add-row").addEventListener("click", () => {
  addUnRow();
  calcUneven();
});
document.getElementById("un-tip").addEventListener("input", calcUneven);
unRowsEl.addEventListener("input", calcUneven);
document.getElementById("currency").addEventListener("input", () => {
  calcEqual();
  calcUneven();
});

addUnRow("Person 1", "");
addUnRow("Person 2", "");

calcEqual();
calcUneven();
