const rowsEl = document.getElementById("category-rows");
const els = {
  fee: document.getElementById("fee"),
  currency: document.getElementById("currency"),
  error: document.getElementById("cb-error"),
  heroValue: document.getElementById("hero-value"),
  outMonthly: document.getElementById("out-monthly"),
  outAnnual: document.getElementById("out-annual"),
  outFee: document.getElementById("out-fee"),
  feeRow: document.getElementById("fee-row"),
  outNet: document.getElementById("out-net"),
  netRow: document.getElementById("net-row"),
  outSpend: document.getElementById("out-spend"),
  outEffective: document.getElementById("out-effective"),
  breakEvenRow: document.getElementById("break-even-row"),
  outBreakEven: document.getElementById("out-break-even"),
  verdict: document.getElementById("verdict"),
  tableBody: document.getElementById("breakdown-body"),
  addBtn: document.getElementById("add-category")
};

const DEFAULT_ROWS = [
  ["Supermarkets", "400", "1"],
  ["Fuel", "120", "1"],
  ["Travel & flights", "150", "3"],
  ["Dining out", "100", "2"],
  ["Everything else", "500", "0.5"]
];

function money(v) {
  const symbol = els.currency.value;
  if (!isFinite(v)) return "—";
  const rounded = Math.round(Math.abs(v) * 100) / 100;
  const sign = v < 0 && rounded !== 0 ? "−" : "";
  return sign + symbol + rounded.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function pct(v) {
  if (!isFinite(v)) return "—";
  return (Math.round(v * 1000) / 1000).toLocaleString("en-GB") + "%";
}

function escapeAttr(s) {
  return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renumber() {
  [...rowsEl.children].forEach((row, i) => {
    row.querySelector(".row-index").textContent = String(i + 1);
  });
}

function addRow(name = "", spend = "", rate = "") {
  const row = document.createElement("div");
  row.className = "dyn-row";
  row.innerHTML = `
    <span class="row-index">${rowsEl.children.length + 1}</span>
    <input class="grow" type="text" placeholder="Category" value="${escapeAttr(name)}" data-field="name" aria-label="Category name">
    <input class="fixed-sm" type="number" placeholder="0" step="any" min="0" value="${escapeAttr(spend)}" data-field="spend" aria-label="Monthly spend">
    <input class="fixed-sm" type="number" placeholder="0" step="any" min="0" value="${escapeAttr(rate)}" data-field="rate" aria-label="Cashback rate percent">
    <button class="btn-remove" type="button" title="Remove">✕</button>
  `;
  row.querySelector(".btn-remove").addEventListener("click", () => {
    row.remove();
    renumber();
    calculate();
  });
  rowsEl.appendChild(row);
}

function readRows() {
  return [...rowsEl.children].map((row, i) => {
    const name = row.querySelector('[data-field="name"]').value.trim();
    const spendRaw = row.querySelector('[data-field="spend"]').value.trim();
    const rateRaw = row.querySelector('[data-field="rate"]').value.trim();
    return {
      index: i + 1,
      name: name || `Category ${i + 1}`,
      spend: spendRaw === "" ? 0 : Number(spendRaw),
      rate: rateRaw === "" ? 0 : Number(rateRaw),
      spendRaw: spendRaw,
      rateRaw: rateRaw
    };
  });
}

function setError(message) {
  els.error.textContent = message;
  els.error.style.display = message ? "block" : "none";
}

function clearResults() {
  els.heroValue.textContent = "—";
  ["outMonthly", "outAnnual", "outFee", "outNet", "outSpend", "outEffective", "outBreakEven"].forEach((k) => {
    els[k].textContent = "—";
  });
  els.verdict.style.display = "none";
  els.tableBody.innerHTML = "";
}

function calculate() {
  const rows = readRows();

  if (!rows.length) {
    setError("Add at least one spending category.");
    clearResults();
    return;
  }

  for (const r of rows) {
    if (!isFinite(r.spend)) return fail(`The monthly spend on row ${r.index} isn't a number.`);
    if (r.spend < 0) return fail(`The monthly spend on row ${r.index} can't be negative.`);
    if (!isFinite(r.rate)) return fail(`The cashback rate on row ${r.index} isn't a number.`);
    if (r.rate < 0) return fail(`The cashback rate on row ${r.index} can't be negative.`);
    if (r.rate > 100) return fail(`A cashback rate of ${r.rate}% on row ${r.index} is above 100% — check the figure.`);
  }

  const feeRaw = els.fee.value.trim();
  const fee = feeRaw === "" ? 0 : Number(feeRaw);
  if (!isFinite(fee)) return fail("The annual fee isn't a number.");
  if (fee < 0) return fail("The annual fee can't be negative.");

  const totalSpend = rows.reduce((s, r) => s + r.spend, 0);
  if (totalSpend <= 0) {
    setError("Enter some monthly spend to see what you'd earn.");
    clearResults();
    return;
  }

  setError("");

  const monthlyCashback = rows.reduce((s, r) => s + r.spend * (r.rate / 100), 0);
  const annualCashback = monthlyCashback * 12;
  const net = annualCashback - fee;
  const effective = (monthlyCashback / totalSpend) * 100;

  els.heroValue.textContent = money(net);
  els.outMonthly.textContent = money(monthlyCashback);
  els.outAnnual.textContent = money(annualCashback);
  els.outFee.textContent = fee > 0 ? "−" + money(fee) : money(0);
  els.outNet.textContent = money(net);
  els.outSpend.textContent = `${money(totalSpend)} a month, ${money(totalSpend * 12)} a year`;
  els.outEffective.textContent = pct(effective);

  els.feeRow.style.display = fee > 0 ? "flex" : "none";
  els.netRow.style.display = fee > 0 ? "flex" : "none";
  els.netRow.classList.toggle("good", fee > 0 && net > 0);
  els.netRow.classList.toggle("bad", fee > 0 && net < 0);

  /* The spend that would just cover the fee, at the blend of rates entered */
  if (fee > 0 && effective > 0) {
    const breakEvenAnnual = fee / (effective / 100);
    els.breakEvenRow.style.display = "flex";
    els.outBreakEven.textContent = `${money(breakEvenAnnual / 12)} a month`;
    els.verdict.innerHTML = net >= 0
      ? `At this spend the card earns <strong>${money(net)}</strong> a year after the ${money(fee)} fee. ` +
        `You would need to spend ${money(breakEvenAnnual / 12)} a month at the same blend of rates just to break even.`
      : `At this spend the fee costs you <strong>${money(-net)}</strong> a year more than the cashback returns. ` +
        `You would need to spend ${money(breakEvenAnnual / 12)} a month at the same blend of rates before the card starts paying for itself.`;
    els.verdict.style.display = "block";
  } else {
    els.breakEvenRow.style.display = "none";
    if (fee === 0) {
      els.verdict.innerHTML = `No annual fee, so the whole <strong>${money(annualCashback)}</strong> a year is yours.`;
      els.verdict.style.display = "block";
    } else {
      els.verdict.style.display = "none";
    }
  }

  els.tableBody.innerHTML = "";
  rows.forEach((r) => {
    const monthly = r.spend * (r.rate / 100);
    const share = monthlyCashback > 0 ? (monthly / monthlyCashback) * 100 : 0;
    const tr = document.createElement("tr");
    tr.innerHTML =
      `<td>${escapeAttr(r.name)}</td>` +
      `<td>${money(r.spend)}</td>` +
      `<td>${pct(r.rate)}</td>` +
      `<td>${money(monthly * 12)}</td>` +
      `<td>${pct(share)}</td>`;
    els.tableBody.appendChild(tr);
  });
}

function fail(message) {
  setError(message);
  clearResults();
}

els.addBtn.addEventListener("click", () => {
  addRow();
  calculate();
});

rowsEl.addEventListener("input", calculate);
els.fee.addEventListener("input", calculate);
els.currency.addEventListener("change", calculate);

DEFAULT_ROWS.forEach(([n, s, r]) => addRow(n, s, r));
calculate();
