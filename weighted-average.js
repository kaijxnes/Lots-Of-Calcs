const rowsEl = document.getElementById("wa-rows");
const outBody = document.getElementById("wa-out-body");

let weightMode = "raw"; /* raw | pct */
let normalise = true;
let lastBreakdown = [];

function fmtNum(value, digits = 4) {
  if (!isFinite(value)) return "—";
  /* Trim trailing zeros but keep it readable */
  const rounded = Number(value.toFixed(digits));
  return rounded.toLocaleString("en-GB", { maximumFractionDigits: digits });
}

function showError(message) {
  const el = document.getElementById("wa-error");
  el.textContent = message;
  el.style.display = message ? "block" : "none";
}

function showWarning(message) {
  const el = document.getElementById("wa-warn");
  el.textContent = message;
  el.style.display = message ? "block" : "none";
}

/* Accepts "1,234.5", "£12", "45%", " 7 " — returns NaN for anything else */
function parseNumber(raw) {
  const text = String(raw == null ? "" : raw).trim();
  if (text === "") return NaN;
  const cleaned = text.replace(/[£$€¥₹,\s%]/g, "");
  if (cleaned === "" || !/^-?\d*\.?\d+(e-?\d+)?$/i.test(cleaned)) return NaN;
  return parseFloat(cleaned);
}

function addRow(label = "", value = "", weight = "") {
  const row = document.createElement("div");
  row.className = "dyn-row";
  row.innerHTML = `
    <span class="row-index">${rowsEl.children.length + 1}</span>
    <input class="grow" type="text" placeholder="e.g. Exam" value="${label}" data-field="label" aria-label="Label">
    <input class="fixed-sm" type="text" inputmode="decimal" placeholder="0" value="${value}" data-field="value" aria-label="Value">
    <input class="fixed-sm" type="text" inputmode="decimal" placeholder="0" value="${weight}" data-field="weight" aria-label="Weight">
    <button class="btn-remove" type="button" title="Remove row" aria-label="Remove row">✕</button>
  `;
  row.querySelector(".btn-remove").addEventListener("click", () => {
    row.remove();
    if (rowsEl.children.length === 0) addRow();
    renumber();
    calculate();
  });
  rowsEl.appendChild(row);
  return row;
}

function renumber() {
  [...rowsEl.children].forEach((row, i) => {
    row.querySelector(".row-index").textContent = i + 1;
  });
}

/* ---------- Spreadsheet paste ---------- */

/* Splits a pasted block on newlines, then tabs/commas/semicolons within each line */
function parsePastedBlock(text) {
  const lines = text.split(/\r\n|\r|\n/).map((l) => l.trim()).filter((l) => l !== "");
  const parsed = [];

  lines.forEach((line) => {
    /* Tab wins when present — that's what Excel and Sheets copy out, and it stops
       thousands separators inside a value ("1,200") being read as a column break.
       Only fall back to comma/semicolon splitting for genuine CSV, respecting quotes. */
    const rawCells = line.includes("\t")
      ? line.split("\t")
      : line.split(/;|,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
    const cells = rawCells.map((c) => c.trim().replace(/^"|"$/g, ""));
    if (cells.length === 1) {
      /* A single column of numbers: treat as values with equal weight */
      parsed.push({ label: "", value: cells[0], weight: "" });
    } else if (cells.length === 2) {
      parsed.push({ label: "", value: cells[0], weight: cells[1] });
    } else {
      parsed.push({ label: cells[0], value: cells[1], weight: cells[2] });
    }
  });

  /* Drop a header row: first row whose value cell isn't a number, when later rows are */
  if (parsed.length > 1 && isNaN(parseNumber(parsed[0].value)) && !isNaN(parseNumber(parsed[1].value))) {
    parsed.shift();
  }

  return parsed.filter((r) => r.value !== "" || r.weight !== "" || r.label !== "");
}

function applyPaste(text) {
  const parsed = parsePastedBlock(text);
  if (parsed.length === 0) return false;

  rowsEl.innerHTML = "";
  parsed.forEach((r) => addRow(r.label, r.value, r.weight));
  /* Keep at least four rows visible, matching the default layout */
  while (rowsEl.children.length < 4) addRow();
  renumber();
  calculate();
  return true;
}

rowsEl.addEventListener("paste", (event) => {
  const text = (event.clipboardData || window.clipboardData).getData("text");
  /* Only hijack a paste that actually looks like a block of data */
  if (!text || !/[\t\n\r;,]/.test(text)) return;
  event.preventDefault();
  applyPaste(text);
});

/* ---------- Mode toggles ---------- */

document.querySelectorAll(".tab[data-wmode]").forEach((tab) => {
  tab.addEventListener("click", () => {
    weightMode = tab.dataset.wmode;
    document.querySelectorAll(".tab[data-wmode]").forEach((t) => t.classList.toggle("active", t === tab));
    calculate();
  });
});

document.querySelectorAll(".tab[data-norm]").forEach((tab) => {
  tab.addEventListener("click", () => {
    normalise = tab.dataset.norm === "on";
    document.querySelectorAll(".tab[data-norm]").forEach((t) => t.classList.toggle("active", t === tab));
    document.getElementById("norm-hint").textContent = normalise
      ? "Weights are scaled so they add up to 1, which is what almost everyone means by a weighted average."
      : "Weights are used as entered and the division is skipped, giving Σ(value × weight) — a weighted total, not an average.";
    document.getElementById("weighted-avg-label").textContent = normalise ? "Weighted average" : "Weighted total";
    calculate();
  });
});

/* ---------- Calculation ---------- */

function calculate() {
  const rowEls = [...rowsEl.children];
  const rows = [];
  let badRow = null;

  rowEls.forEach((row, i) => {
    const labelEl = row.querySelector('[data-field="label"]');
    const valueEl = row.querySelector('[data-field="value"]');
    const weightEl = row.querySelector('[data-field="weight"]');

    valueEl.style.borderColor = "";
    weightEl.style.borderColor = "";

    const rawValue = valueEl.value.trim();
    const rawWeight = weightEl.value.trim();

    /* Blank rows are ignored silently */
    if (rawValue === "" && rawWeight === "") return;

    const value = parseNumber(rawValue);
    const weight = parseNumber(rawWeight);

    if (isNaN(value)) {
      valueEl.style.borderColor = "var(--bad)";
      if (!badRow) badRow = { n: i + 1, what: "value" };
      return;
    }
    if (isNaN(weight)) {
      weightEl.style.borderColor = "var(--bad)";
      if (!badRow) badRow = { n: i + 1, what: "weight" };
      return;
    }

    rows.push({
      label: labelEl.value.trim() || `Row ${i + 1}`,
      value,
      weight,
    });
  });

  function reset() {
    document.getElementById("weighted-avg").textContent = "—";
    ["plain-mean", "gap", "weight-sum", "row-count", "w-sd", "w-var", "minmax"].forEach((id) => {
      document.getElementById(id).textContent = "—";
    });
    outBody.innerHTML = "";
    lastBreakdown = [];
  }

  if (badRow) {
    showError(`Row ${badRow.n}: "${badRow.what}" isn't a number. Fix it or clear the row.`);
    showWarning("");
    reset();
    return;
  }

  if (rows.length === 0) {
    showError("Enter at least one row with a value and a weight.");
    showWarning("");
    reset();
    return;
  }

  showError("");

  /* Percentage weights are divided by 100; normalising makes this cancel out anyway */
  const effective = rows.map((r) => (weightMode === "pct" ? r.weight / 100 : r.weight));
  const weightSum = effective.reduce((a, b) => a + b, 0);
  const rawWeightSum = rows.reduce((a, r) => a + r.weight, 0);

  if (normalise && Math.abs(weightSum) < 1e-12) {
    showError("The weights add up to zero, so a weighted average can't be calculated. Adjust the weights.");
    showWarning("");
    reset();
    return;
  }

  const products = rows.map((r, i) => r.value * effective[i]);
  const productSum = products.reduce((a, b) => a + b, 0);
  const weightedAvg = normalise ? productSum / weightSum : productSum;
  const plainMean = rows.reduce((a, r) => a + r.value, 0) / rows.length;

  /* Warnings that don't stop the calculation */
  const notes = [];
  if (rows.some((r) => r.weight < 0)) {
    notes.push("Some weights are negative — allowed, but check that's intended.");
  }
  if (weightMode === "pct" && Math.abs(rawWeightSum - 100) > 0.5) {
    notes.push(`Percentage weights total ${fmtNum(rawWeightSum, 2)}%, not 100%.`);
  }
  showWarning(notes.join(" "));

  document.getElementById("weighted-avg").textContent = fmtNum(weightedAvg);
  document.getElementById("plain-mean").textContent = fmtNum(plainMean);
  const gap = weightedAvg - plainMean;
  document.getElementById("gap").textContent = (gap > 0 ? "+" : "") + fmtNum(gap);
  document.getElementById("weight-sum").textContent =
    fmtNum(rawWeightSum) + (weightMode === "pct" ? "%" : "");
  document.getElementById("row-count").textContent = String(rows.length);

  /* Weighted variance / SD, reliability-weight form */
  let wVar = NaN;
  if (Math.abs(weightSum) > 1e-12) {
    const meanForSpread = productSum / weightSum;
    wVar = rows.reduce((acc, r, i) => acc + effective[i] * Math.pow(r.value - meanForSpread, 2), 0) / weightSum;
  }
  document.getElementById("w-var").textContent = wVar >= 0 ? fmtNum(wVar) : "—";
  document.getElementById("w-sd").textContent = wVar >= 0 ? fmtNum(Math.sqrt(wVar)) : "—";
  const values = rows.map((r) => r.value);
  document.getElementById("minmax").textContent =
    fmtNum(Math.min(...values)) + " / " + fmtNum(Math.max(...values));

  /* Breakdown table */
  outBody.innerHTML = "";
  lastBreakdown = [];
  rows.forEach((r, i) => {
    const normW = Math.abs(weightSum) > 1e-12 ? effective[i] / weightSum : NaN;
    const contribution = normalise ? normW * r.value : products[i];
    lastBreakdown.push([
      r.label,
      fmtNum(r.value),
      fmtNum(r.weight) + (weightMode === "pct" ? "%" : ""),
      isFinite(normW) ? fmtNum(normW * 100, 2) + "%" : "—",
      fmtNum(contribution),
    ]);
    const tr = document.createElement("tr");
    tr.innerHTML = lastBreakdown[lastBreakdown.length - 1].map((c) => `<td>${c}</td>`).join("");
    outBody.appendChild(tr);
  });
}

/* ---------- Controls ---------- */

document.getElementById("add-row").addEventListener("click", () => {
  const row = addRow();
  row.querySelector('[data-field="label"]').focus();
  calculate();
});

document.getElementById("toggle-more").addEventListener("click", (event) => {
  const panel = document.getElementById("more-stats");
  const open = panel.style.display !== "none";
  panel.style.display = open ? "none" : "block";
  event.currentTarget.textContent = open ? "Show more statistics" : "Hide more statistics";
  event.currentTarget.setAttribute("aria-expanded", String(!open));
});

document.getElementById("copy-results").addEventListener("click", async () => {
  const status = document.getElementById("copy-status");
  if (lastBreakdown.length === 0) {
    status.textContent = "Nothing to copy yet.";
    status.style.display = "block";
    return;
  }

  const header = ["Label", "Value", "Weight", "Normalised", "Contribution"].join("\t");
  const body = lastBreakdown.map((r) => r.join("\t")).join("\n");
  const summary = [
    "",
    `${normalise ? "Weighted average" : "Weighted total"}\t${document.getElementById("weighted-avg").textContent}`,
    `Unweighted mean\t${document.getElementById("plain-mean").textContent}`,
    `Sum of weights\t${document.getElementById("weight-sum").textContent}`,
  ].join("\n");
  const tsv = `${header}\n${body}${summary}`;

  let ok = false;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(tsv);
      ok = true;
    }
  } catch (e) {
    ok = false;
  }
  if (!ok) {
    /* Fallback for non-secure contexts and older browsers */
    const ta = document.createElement("textarea");
    ta.value = tsv;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      ok = document.execCommand("copy");
    } catch (e) {
      ok = false;
    }
    document.body.removeChild(ta);
  }

  status.textContent = ok ? "Breakdown copied as TSV — paste straight into a spreadsheet." : "Couldn't copy automatically. Select the table and copy manually.";
  status.style.display = "block";
});

rowsEl.addEventListener("input", calculate);

/* Four rows to start, pre-filled with the course-grade example */
addRow("Coursework", "72", "30");
addRow("Exam", "65", "70");
addRow();
addRow();

calculate();
