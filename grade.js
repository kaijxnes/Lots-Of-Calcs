function num(id) {
  return parseFloat(document.getElementById(id).value) || 0;
}

function fmtPercent(value) {
  if (!isFinite(value)) return "0%";
  return value.toFixed(2) + "%";
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

/* ---------- Grade boundaries ---------- */
const boundaryRowsEl = document.getElementById("boundary-rows");

function addBoundaryRow(letter = "", minPct = "") {
  const row = document.createElement("div");
  row.className = "dyn-row";
  row.innerHTML = `
    <input class="grow" type="text" placeholder="e.g. A" value="${letter}" data-field="letter">
    <input class="fixed-sm" type="number" placeholder="0" step="any" value="${minPct}" data-field="min">
    <button class="btn-remove" type="button" title="Remove">✕</button>
  `;
  row.querySelector(".btn-remove").addEventListener("click", () => {
    row.remove();
    calcSingle();
  });
  boundaryRowsEl.appendChild(row);
}

function calcSingle() {
  const score = num("single-score");
  const total = num("single-total");
  const pct = total !== 0 ? (score / total) * 100 : 0;

  const boundaries = [...boundaryRowsEl.children]
    .map((row) => ({
      letter: row.querySelector('[data-field="letter"]').value || "?",
      min: parseFloat(row.querySelector('[data-field="min"]').value) || 0,
    }))
    .sort((a, b) => b.min - a.min);

  let letter = "—";
  for (const b of boundaries) {
    if (pct >= b.min) {
      letter = b.letter;
      break;
    }
  }

  document.getElementById("single-pct").textContent = fmtPercent(pct);
  document.getElementById("single-letter").textContent = letter;
}

document.getElementById("add-boundary").addEventListener("click", () => {
  addBoundaryRow();
  calcSingle();
});
boundaryRowsEl.addEventListener("input", calcSingle);
document.getElementById("single-score").addEventListener("input", calcSingle);
document.getElementById("single-total").addEventListener("input", calcSingle);

addBoundaryRow("A", "90");
addBoundaryRow("B", "80");
addBoundaryRow("C", "70");
addBoundaryRow("D", "60");
addBoundaryRow("F", "0");

/* ---------- Weighted average ---------- */
const wtRowsEl = document.getElementById("wt-rows");

function addWtRow(name = "", score = "", total = "", weight = "") {
  const row = document.createElement("div");
  row.className = "dyn-row";
  row.innerHTML = `
    <span class="row-index">${wtRowsEl.children.length + 1}</span>
    <input class="grow" type="text" placeholder="Assignment" value="${name}" data-field="name">
    <input class="fixed-sm" type="number" placeholder="0" step="any" value="${score}" data-field="score">
    <input class="fixed-sm" type="number" placeholder="100" step="any" value="${total}" data-field="total">
    <input class="fixed-sm" type="number" placeholder="0" step="any" value="${weight}" data-field="weight">
    <button class="btn-remove" type="button" title="Remove">✕</button>
  `;
  row.querySelector(".btn-remove").addEventListener("click", () => {
    row.remove();
    renumberWt();
    calcWeighted();
  });
  wtRowsEl.appendChild(row);
}

function renumberWt() {
  [...wtRowsEl.children].forEach((row, i) => {
    row.querySelector(".row-index").textContent = i + 1;
  });
}

function calcWeighted() {
  const items = [...wtRowsEl.children].map((row) => ({
    score: parseFloat(row.querySelector('[data-field="score"]').value) || 0,
    total: parseFloat(row.querySelector('[data-field="total"]').value) || 0,
    weight: parseFloat(row.querySelector('[data-field="weight"]').value) || 0,
  }));

  const weightUsed = items.reduce((sum, i) => sum + i.weight, 0);
  let weightedSum = 0;
  items.forEach((i) => {
    const pct = i.total !== 0 ? (i.score / i.total) * 100 : 0;
    weightedSum += pct * i.weight;
  });
  const average = weightUsed !== 0 ? weightedSum / weightUsed : 0;

  document.getElementById("wt-weight-used").textContent = fmtPercent(weightUsed);
  document.getElementById("wt-average").textContent = fmtPercent(average);
}

document.getElementById("wt-add-row").addEventListener("click", () => {
  addWtRow();
  calcWeighted();
});
wtRowsEl.addEventListener("input", calcWeighted);

addWtRow("Assignment 1", "", "100", "50");
addWtRow("Assignment 2", "", "100", "50");

/* ---------- Letter grade average (4.0 scale, College Board) ---------- */
const LG_POINTS = { A: 4, B: 3, C: 2, D: 1, F: 0 };
const lgRowsEl = document.getElementById("lg-rows");

function addLgRow(name = "", letter = "A", credits = "1") {
  const row = document.createElement("div");
  row.className = "dyn-row";
  row.innerHTML = `
    <span class="row-index">${lgRowsEl.children.length + 1}</span>
    <input class="grow" type="text" placeholder="Class" value="${name}" data-field="name">
    <select class="fixed-sm" data-field="letter">${Object.keys(LG_POINTS).map((l) => `<option${l === letter ? " selected" : ""}>${l}</option>`).join("")}</select>
    <input class="fixed-sm" type="number" step="any" min="0" value="${LG_POINTS[letter]}" data-field="points" aria-label="Grade points">
    <input class="fixed-sm" type="number" step="any" min="0" value="${credits}" data-field="credits" aria-label="Credits">
    <button class="btn-remove" type="button" title="Remove">✕</button>
  `;
  row.querySelector('[data-field="letter"]').addEventListener("change", (e) => {
    row.querySelector('[data-field="points"]').value = LG_POINTS[e.target.value];
    calcLetters();
  });
  row.querySelector(".btn-remove").addEventListener("click", () => {
    row.remove();
    [...lgRowsEl.children].forEach((r, i) => { r.querySelector(".row-index").textContent = i + 1; });
    calcLetters();
  });
  lgRowsEl.appendChild(row);
}

function calcLetters() {
  let credits = 0, sum = 0;
  [...lgRowsEl.children].forEach((row) => {
    const pts = parseFloat(row.querySelector('[data-field="points"]').value);
    const cr = parseFloat(row.querySelector('[data-field="credits"]').value);
    if (isFinite(pts) && cr > 0) { credits += cr; sum += pts * cr; }
  });
  if (!credits) {
    document.getElementById("lg-gpa").textContent = "—";
    document.getElementById("lg-letter").textContent = "add a grade to see the average";
    document.getElementById("lg-credits").textContent = "—";
    return;
  }
  const gpa = sum / credits;
  const scale = Object.keys(LG_POINTS).map((l) => [l, LG_POINTS[l]]);
  const exact = scale.find(([, p]) => Math.abs(p - gpa) < 0.005);
  const below = scale.filter(([, p]) => p <= gpa)[0], above = scale.filter(([, p]) => p > gpa).pop();
  document.getElementById("lg-gpa").textContent = gpa.toFixed(2);
  document.getElementById("lg-letter").textContent = exact ? `a straight ${exact[0]} average on a 4.0 scale`
    : below && above ? `between ${below[0]} (${below[1]}) and ${above[0]} (${above[1]}) on a 4.0 scale` : "on a 4.0 scale";
  document.getElementById("lg-credits").textContent = credits.toLocaleString("en-GB");
}

document.getElementById("lg-add-row").addEventListener("click", () => { addLgRow(); calcLetters(); });
lgRowsEl.addEventListener("input", calcLetters);
addLgRow("English", "A", "1");
addLgRow("Maths", "B", "1");
addLgRow("Science", "B", "1");
addLgRow("History", "C", "1");

calcSingle();
calcWeighted();
calcLetters();
