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

/* ---------- Tabs ---------- */
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
    tab.classList.add("active");
    document.querySelector(`[data-panel="${tab.dataset.tab}"]`).classList.add("active");
  });
});

/* ---------- VAT ---------- */
let vatEditing = null;

function calcVat() {
  const rate = num("vat-rate");
  const netInput = document.getElementById("vat-net");
  const grossInput = document.getElementById("vat-gross");

  let net = parseFloat(netInput.value);
  let gross = parseFloat(grossInput.value);

  if (vatEditing === "gross" && !isNaN(gross)) {
    net = gross / (1 + rate / 100);
    netInput.value = net ? net.toFixed(2) : "";
  } else if (!isNaN(net)) {
    gross = net * (1 + rate / 100);
    grossInput.value = net ? gross.toFixed(2) : "";
  }

  const vatAmount = (gross || 0) - (net || 0);
  document.getElementById("vat-amount").textContent = fmtMoney(vatAmount);
}

document.getElementById("vat-net").addEventListener("input", () => {
  vatEditing = "net";
  calcVat();
});
document.getElementById("vat-gross").addEventListener("input", () => {
  vatEditing = "gross";
  calcVat();
});
document.getElementById("vat-rate").addEventListener("input", calcVat);

/* ---------- Income tax bands ---------- */
const bandRowsEl = document.getElementById("band-rows");

function addBandRow(upto = "", rate = "") {
  const row = document.createElement("div");
  row.className = "dyn-row";
  row.innerHTML = `
    <input class="grow" type="number" placeholder="blank = no limit" step="any" value="${upto}" data-field="upto">
    <input class="fixed-sm" type="number" placeholder="0" step="any" value="${rate}" data-field="rate">
    <button class="btn-remove" type="button" title="Remove">✕</button>
  `;
  row.querySelector(".btn-remove").addEventListener("click", () => {
    row.remove();
    calcIncomeTax();
  });
  bandRowsEl.appendChild(row);
}

function calcIncomeTax() {
  const income = num("income");
  const bands = [...bandRowsEl.children].map((row) => {
    const uptoRaw = row.querySelector('[data-field="upto"]').value;
    const upto = uptoRaw === "" ? Infinity : parseFloat(uptoRaw);
    const rate = parseFloat(row.querySelector('[data-field="rate"]').value) || 0;
    return { upto: isNaN(upto) ? Infinity : upto, rate };
  });

  let prevThreshold = 0;
  let remaining = income;
  let totalTax = 0;
  const breakdownEl = document.getElementById("band-breakdown");
  breakdownEl.innerHTML = "";

  bands.forEach((band) => {
    const bandWidth = band.upto - prevThreshold;
    const taxable = Math.max(0, Math.min(remaining, bandWidth));
    const tax = taxable * (band.rate / 100);
    totalTax += tax;
    remaining -= taxable;

    const row = document.createElement("div");
    row.className = "result-row";
    const uptoLabel = band.upto === Infinity ? "no limit" : band.upto.toLocaleString("en-US");
    row.innerHTML = `<span class="r-label">Up to ${uptoLabel} @ ${band.rate}% (${fmtMoney(taxable)} taxed)</span><span class="r-value">${fmtMoney(tax)}</span>`;
    breakdownEl.appendChild(row);

    prevThreshold = band.upto;
  });

  const takeHome = income - totalTax;
  const effectiveRate = income !== 0 ? (totalTax / income) * 100 : 0;

  document.getElementById("total-tax").textContent = fmtMoney(totalTax);
  document.getElementById("take-home").textContent = fmtMoney(takeHome);
  document.getElementById("effective-rate").textContent = fmtPercent(effectiveRate);
}

document.getElementById("add-band").addEventListener("click", () => {
  addBandRow();
  calcIncomeTax();
});
bandRowsEl.addEventListener("input", calcIncomeTax);
document.getElementById("income").addEventListener("input", calcIncomeTax);
document.getElementById("currency").addEventListener("input", () => {
  calcVat();
  calcIncomeTax();
});

addBandRow("12570", "0");
addBandRow("50270", "20");
addBandRow("125140", "40");
addBandRow("", "45");

calcVat();
calcIncomeTax();
