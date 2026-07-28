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

function calculate() {
  const bill = num("bill");
  const tipPercent = num("tip-percent");
  const people = Math.max(1, Math.floor(num("people")) || 1);

  const tipAmount = bill * (tipPercent / 100);
  const total = bill + tipAmount;

  document.getElementById("tip-amount").textContent = fmtMoney(tipAmount);
  document.getElementById("total").textContent = fmtMoney(total);
  document.getElementById("tip-per-person").textContent = fmtMoney(tipAmount / people);
  document.getElementById("total-per-person").textContent = fmtMoney(total / people);
}

document.querySelectorAll("#tip-presets .tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#tip-presets .tab").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("tip-percent").value = btn.dataset.tip;
    calculate();
  });
});

document.getElementById("tip-percent").addEventListener("input", () => {
  const val = document.getElementById("tip-percent").value;
  document.querySelectorAll("#tip-presets .tab").forEach((b) => {
    b.classList.toggle("active", b.dataset.tip === val);
  });
  calculate();
});

document.getElementById("bill").addEventListener("input", calculate);
document.getElementById("people").addEventListener("input", calculate);
document.getElementById("currency").addEventListener("input", calculate);

calculate();
