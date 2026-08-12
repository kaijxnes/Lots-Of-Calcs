/* Rates are held in the markup so the list stays visible without JavaScript;
   this file only reads them. */

const els = {
  amount: document.getElementById("amount"),
  rate: document.getElementById("rate"),
  preset: document.getElementById("preset"),
  currency: document.getElementById("currency"),
  error: document.getElementById("tax-error"),
  presetNote: document.getElementById("preset-note"),
  amountLabel: document.getElementById("amount-label"),
  heroValue: document.getElementById("hero-value"),
  heroLabel: document.getElementById("hero-label"),
  outNet: document.getElementById("out-net"),
  outTax: document.getElementById("out-tax"),
  outGross: document.getElementById("out-gross"),
  taxLabel: document.getElementById("tax-label"),
  fractionRow: document.getElementById("fraction-row"),
  outFraction: document.getElementById("out-fraction")
};

function mode() {
  const tab = document.querySelector(".tab.active");
  return tab ? tab.dataset.tab : "add";
}

function round2(v) {
  return Math.round((v + Number.EPSILON) * 100) / 100;
}

function fmtMoney(v) {
  const symbol = els.currency.value;
  if (!isFinite(v)) return "—";
  const rounded = round2(Math.abs(v));
  const sign = v < 0 && rounded !== 0 ? "−" : "";
  return sign + symbol + rounded.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtRate(r) {
  return String(Math.round(r * 1000) / 1000);
}

/* Greatest common divisor, so 20% reduces to 1/6 rather than 100/600 */
function gcd(a, b) {
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

/* The share of a tax-inclusive price that is tax: rate / (100 + rate).
   UK accountants know this as the VAT fraction — 1/6 at 20%. */
function taxFraction(rate) {
  const scale = 1000;
  let numerator = Math.round(rate * scale);
  let denominator = Math.round((100 + rate) * scale);
  const d = gcd(numerator, denominator);
  if (!d) return null;
  numerator /= d;
  denominator /= d;
  if (denominator > 10000) return null;
  return `${numerator}/${denominator}`;
}

function setError(message) {
  els.error.textContent = message;
  els.error.style.display = message ? "block" : "none";
}

function clearResults() {
  els.heroValue.textContent = "—";
  els.outNet.textContent = "—";
  els.outTax.textContent = "—";
  els.outGross.textContent = "—";
  els.outFraction.textContent = "—";
}

function readInputs() {
  const amountRaw = els.amount.value.trim().replace(/[\s,]/g, "");
  const rateRaw = els.rate.value.trim();

  if (amountRaw === "") return { error: "Enter an amount." };
  const amount = Number(amountRaw);
  if (!isFinite(amount)) return { error: "That isn't a number — enter an amount like 250 or 19.99." };
  if (amount < 0) return { error: "Enter a positive amount." };

  if (rateRaw === "") return { error: "Enter a tax rate, or pick a location above." };
  const rate = Number(rateRaw);
  if (!isFinite(rate)) return { error: "That isn't a number — enter a rate like 20." };
  if (rate < 0) return { error: "A tax rate can't be negative." };
  if (rate > 100) return { error: "That rate is above 100% — check the figure you've entered." };

  return { amount: amount, rate: rate };
}

function calculate() {
  const input = readInputs();

  if (input.error) {
    setError(input.error);
    clearResults();
    return;
  }
  setError("");

  const amount = input.amount;
  const rate = input.rate;
  const adding = mode() === "add";

  /* Round one figure and derive the other from it, so the three numbers on
     screen always add up — no stray penny from rounding twice. */
  let net;
  let tax;
  let gross;
  if (adding) {
    net = round2(amount);
    tax = round2(amount * (rate / 100));
    gross = round2(net + tax);
  } else {
    gross = round2(amount);
    net = round2(amount / (1 + rate / 100));
    tax = round2(gross - net);
  }

  els.heroValue.textContent = fmtMoney(adding ? gross : net);
  els.heroLabel.textContent = adding ? "Total including tax" : "Price before tax";

  els.outNet.textContent = fmtMoney(net);
  els.outTax.textContent = fmtMoney(tax);
  els.outGross.textContent = fmtMoney(gross);
  els.taxLabel.textContent = `Tax at ${fmtRate(rate)}%`;

  /* Only meaningful when working backwards out of a gross price */
  const fraction = rate > 0 ? taxFraction(rate) : null;
  els.fractionRow.style.display = !adding && fraction ? "flex" : "none";
  els.outFraction.textContent = fraction ? fraction + " of the total" : "—";
}

function applyPreset() {
  const option = els.preset.selectedOptions[0];
  if (!option || option.value === "") {
    els.presetNote.textContent = "";
    els.presetNote.style.display = "none";
    return;
  }
  els.rate.value = option.value;
  const note = option.dataset.note || "";
  els.presetNote.textContent = note;
  els.presetNote.style.display = note ? "block" : "none";
  calculate();
}

/* Typing a rate by hand means the preset no longer describes it */
function detachPreset() {
  els.preset.value = "";
  els.presetNote.textContent = "";
  els.presetNote.style.display = "none";
}

els.preset.addEventListener("change", applyPreset);

els.rate.addEventListener("input", () => {
  detachPreset();
  calculate();
});

els.amount.addEventListener("input", calculate);
els.currency.addEventListener("change", calculate);

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    if (tab.classList.contains("active")) return;
    document.querySelectorAll(".tab").forEach((t) => {
      t.classList.remove("active");
      t.setAttribute("aria-selected", "false");
    });
    tab.classList.add("active");
    tab.setAttribute("aria-selected", "true");
    els.amountLabel.textContent = tab.dataset.tab === "add" ? "Price before tax" : "Price including tax";
    calculate();
  });
});

calculate();
