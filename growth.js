const rowsEl = document.getElementById("rows");
const outBody = document.getElementById("out-body");
const cumulativeEl = document.getElementById("cumulative");
let rowId = 0;

function fmtPercent(value) {
  if (!isFinite(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return sign + value.toFixed(2) + "%";
}

function addRow(label = "", value = "") {
  rowId += 1;
  const row = document.createElement("div");
  row.className = "dyn-row";
  row.dataset.id = rowId;
  row.innerHTML = `
    <span class="row-index">${rowsEl.children.length + 1}</span>
    <input class="grow" type="text" placeholder="e.g. Jan 2026" value="${label}" data-field="label">
    <input class="fixed-sm" type="number" placeholder="0.00" step="any" value="${value}" data-field="value">
    <button class="btn-remove" type="button" title="Remove">✕</button>
  `;
  row.querySelector(".btn-remove").addEventListener("click", () => {
    row.remove();
    renumber();
    recalculate();
  });
  rowsEl.appendChild(row);
}

function renumber() {
  [...rowsEl.children].forEach((row, i) => {
    row.querySelector(".row-index").textContent = i + 1;
  });
}

function recalculate() {
  const rows = [...rowsEl.children].map((row) => ({
    label: row.querySelector('[data-field="label"]').value || `#${row.querySelector(".row-index").textContent}`,
    value: parseFloat(row.querySelector('[data-field="value"]').value) || 0,
  }));

  outBody.innerHTML = "";
  rows.forEach((r, i) => {
    const tr = document.createElement("tr");
    let mom = "—";
    let momClass = "";
    if (i > 0) {
      const prev = rows[i - 1].value;
      const pct = prev !== 0 ? ((r.value - prev) / prev) * 100 : NaN;
      mom = fmtPercent(pct);
      momClass = pct > 0 ? "pos" : pct < 0 ? "neg" : "";
    }
    let yoy = "—";
    let yoyClass = "";
    if (i >= 12) {
      const prior = rows[i - 12].value;
      const pct = prior !== 0 ? ((r.value - prior) / prior) * 100 : NaN;
      yoy = fmtPercent(pct);
      yoyClass = pct > 0 ? "pos" : pct < 0 ? "neg" : "";
    }
    tr.innerHTML = `
      <td>${r.label}</td>
      <td>${r.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
      <td class="${momClass}">${mom}</td>
      <td class="${yoyClass}">${yoy}</td>
    `;
    outBody.appendChild(tr);
  });

  if (rows.length >= 2 && rows[0].value !== 0) {
    const cumulative = ((rows[rows.length - 1].value - rows[0].value) / rows[0].value) * 100;
    cumulativeEl.textContent = fmtPercent(cumulative);
  } else {
    cumulativeEl.textContent = "—";
  }
}

document.getElementById("add-row").addEventListener("click", () => {
  addRow();
  recalculate();
});

rowsEl.addEventListener("input", recalculate);

[["Jan", "1000"], ["Feb", "1100"], ["Mar", "1250"], ["Apr", "1400"]].forEach(([m, v]) => addRow(m, v));
recalculate();
