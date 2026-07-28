const rowsEl = document.getElementById("rows");

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

function addRow(label = "", pct = "") {
  const row = document.createElement("div");
  row.className = "dyn-row";
  row.innerHTML = `
    <span class="row-index">${rowsEl.children.length + 1}</span>
    <input class="grow" type="text" placeholder="e.g. Sale" value="${label}" data-field="label">
    <input class="fixed-sm" type="number" placeholder="0" step="any" value="${pct}" data-field="pct">
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
  const original = num("original-price");
  const discounts = [...rowsEl.children].map(
    (row) => parseFloat(row.querySelector('[data-field="pct"]').value) || 0
  );

  let price = original;
  discounts.forEach((pct) => {
    price -= price * (pct / 100);
  });

  const saved = original - price;
  const effective = original !== 0 ? (saved / original) * 100 : 0;

  document.getElementById("final-price").textContent = fmtMoney(price);
  document.getElementById("total-saved").textContent = fmtMoney(saved);
  document.getElementById("effective-discount").textContent = fmtPercent(effective);
}

document.getElementById("add-row").addEventListener("click", () => {
  addRow();
  calculate();
});
document.getElementById("original-price").addEventListener("input", calculate);
document.getElementById("currency").addEventListener("input", calculate);
rowsEl.addEventListener("input", calculate);

addRow("Discount 1", "");
calculate();
