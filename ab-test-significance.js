let confidenceLevel = 95;
let rowId = 0;

const rowsEl = document.getElementById("variant-rows");
const outBody = document.getElementById("ab-out-body");

/* Abramowitz & Stegun 7.1.26 approximation, accurate to ~1.5e-7 */
function erf(x) {
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p * x);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
}

function normalCdf(z) {
  return 0.5 * (1 + erf(z / Math.sqrt(2)));
}

function twoTailedPValue(z) {
  return 2 * (1 - normalCdf(Math.abs(z)));
}

function fmtPercent(value, digits = 2) {
  if (!isFinite(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return sign + value.toFixed(digits) + "%";
}

function showError(message) {
  const errorEl = document.getElementById("ab-error");
  errorEl.textContent = message;
  errorEl.style.display = message ? "block" : "none";
}

function addVariantRow(name, visitors = "", conversions = "") {
  rowId += 1;
  const isControl = rowsEl.children.length === 0;
  const row = document.createElement("div");
  row.className = "dyn-row";
  row.dataset.id = rowId;
  row.innerHTML = `
    <span class="row-index">${rowsEl.children.length + 1}</span>
    <input class="grow" type="text" placeholder="e.g. Variant B" value="${name}" data-field="name">
    <input class="fixed-sm" type="number" placeholder="0" min="0" step="1" value="${visitors}" data-field="visitors">
    <input class="fixed-sm" type="number" placeholder="0" min="0" step="1" value="${conversions}" data-field="conversions">
    ${isControl ? '<span style="width:34px"></span>' : '<button class="btn-remove" type="button" title="Remove">✕</button>'}
  `;
  const removeBtn = row.querySelector(".btn-remove");
  if (removeBtn) {
    removeBtn.addEventListener("click", () => {
      row.remove();
      renumber();
      recalculate();
    });
  }
  rowsEl.appendChild(row);
}

function renumber() {
  [...rowsEl.children].forEach((row, i) => {
    row.querySelector(".row-index").textContent = i + 1;
  });
}

function setConfidence(level) {
  confidenceLevel = level;
  document.querySelectorAll(".tab[data-confidence]").forEach((tab) => {
    tab.classList.toggle("active", Number(tab.dataset.confidence) === level);
  });
  recalculate();
}

document.querySelectorAll(".tab[data-confidence]").forEach((tab) => {
  tab.addEventListener("click", () => setConfidence(Number(tab.dataset.confidence)));
});

function recalculate() {
  const rows = [...rowsEl.children].map((row) => ({
    name: row.querySelector('[data-field="name"]').value.trim() || `Variant ${row.querySelector(".row-index").textContent}`,
    visitors: parseFloat(row.querySelector('[data-field="visitors"]').value) || 0,
    conversions: parseFloat(row.querySelector('[data-field="conversions"]').value) || 0,
    hasVisitorsInput: row.querySelector('[data-field="visitors"]').value !== "",
  }));

  outBody.innerHTML = "";

  if (rows.length < 2) {
    showError("Add at least one variant to compare against the control.");
    document.getElementById("control-rate").textContent = "—";
    return;
  }

  for (const r of rows) {
    if (r.visitors < 0 || r.conversions < 0) {
      showError("Values can't be negative.");
      document.getElementById("control-rate").textContent = "—";
      return;
    }
    if (r.conversions > r.visitors) {
      showError("Conversions can't exceed visitors.");
      document.getElementById("control-rate").textContent = "—";
      return;
    }
  }

  if (rows.some((r) => r.visitors === 0)) {
    showError("Enter visitor counts for every row.");
    document.getElementById("control-rate").textContent = "—";
    return;
  }

  showError("");

  const control = rows[0];
  const controlRate = control.conversions / control.visitors;
  document.getElementById("control-name-label").textContent = `${control.name} conversion rate`;
  document.getElementById("control-rate").textContent = (controlRate * 100).toFixed(2) + "%";

  const alpha = 1 - confidenceLevel / 100;

  rows.slice(1).forEach((variant) => {
    const rate = variant.conversions / variant.visitors;
    const uplift = controlRate !== 0 ? ((rate - controlRate) / controlRate) * 100 : rate > 0 ? Infinity : 0;

    const pooled = (control.conversions + variant.conversions) / (control.visitors + variant.visitors);
    const se = Math.sqrt(pooled * (1 - pooled) * (1 / control.visitors + 1 / variant.visitors));
    const z = se !== 0 ? (rate - controlRate) / se : 0;
    const pValue = twoTailedPValue(z);
    const significant = pValue < alpha;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${variant.name}</td>
      <td>${(rate * 100).toFixed(2)}%</td>
      <td class="${uplift > 0 ? "pos" : uplift < 0 ? "neg" : ""}">${isFinite(uplift) ? fmtPercent(uplift) : "—"}</td>
      <td>${z.toFixed(2)}</td>
      <td>${pValue.toFixed(4)}</td>
      <td class="${significant ? "pos" : "neg"}">${significant ? "Significant" : "Not significant"}</td>
    `;
    outBody.appendChild(tr);
  });
}

document.getElementById("add-variant").addEventListener("click", () => {
  const nextLetter = String.fromCharCode(65 + rowsEl.children.length);
  addVariantRow(`Variant ${nextLetter}`);
  recalculate();
});

rowsEl.addEventListener("input", recalculate);

addVariantRow("Control", "5000", "250");
addVariantRow("Variant B", "5000", "300");
recalculate();
