/* Usable battery capacities, approximate, for common UK models.
   Compiled August 2026. Usable (not gross) capacity is used because that is
   what you can actually charge. Trims vary — treat these as a starting point
   and type the real figure in if you know it. */
const CAR_MODELS = [
  { name: "Tesla Model 3 (RWD)", kwh: 57.5 },
  { name: "Tesla Model Y (Long Range)", kwh: 75 },
  { name: "Nissan Leaf (40 kWh)", kwh: 39 },
  { name: "MG4 (Long Range)", kwh: 61.7 },
  { name: "Kia EV6 (Long Range)", kwh: 77.4 },
  { name: "Hyundai Ioniq 5 (73 kWh)", kwh: 74 },
  { name: "Volkswagen ID.3 (Pro)", kwh: 58 },
  { name: "Renault Zoe (R135)", kwh: 52 },
  { name: "Vauxhall Corsa Electric", kwh: 50 },
  { name: "Polestar 2 (Long Range)", kwh: 79 },
  { name: "Fiat 500e (42 kWh)", kwh: 37.3 },
  { name: "BYD Dolphin (Comfort)", kwh: 60.4 },
];

/* Indicative UK charging prices in p/kWh, set August 2026.
   These are NOT live — energy tariffs and network rates change often.
   Each preset also carries a typical charger speed and charging efficiency.
   Users can overwrite the price; the edit is stored against the active preset. */
const PRICE_PRESETS = {
  offpeak: { price: 7.5, kw: 7.4, efficiency: 90 },
  standard: { price: 25, kw: 7.4, efficiency: 90 },
  workplace: { price: 15, kw: 7.4, efficiency: 90 },
  fast: { price: 45, kw: 22, efficiency: 90 },
  rapid: { price: 79, kw: 50, efficiency: 95 },
};

const LITRES_PER_GALLON = 4.54609; /* imperial gallon */

let activePreset = "offpeak";

function num(id) {
  const v = parseFloat(document.getElementById(id).value);
  return isFinite(v) ? v : NaN;
}

function fmtMoney(value) {
  if (!isFinite(value)) value = 0;
  const rounded = Math.round(Math.abs(value) * 100) / 100;
  const sign = value < 0 && rounded !== 0 ? "-" : "";
  return sign + "£" + rounded.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtKwh(value) {
  if (!isFinite(value)) return "—";
  return value.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " kWh";
}

function fmtPence(value) {
  if (!isFinite(value)) return "—";
  return value.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "p";
}

function fmtMiles(value) {
  if (!isFinite(value)) return "—";
  return Math.round(value).toLocaleString("en-GB") + " miles";
}

function fmtDuration(hours) {
  if (!isFinite(hours) || hours < 0) return "—";
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

function showError(id, message) {
  const el = document.getElementById(id);
  el.textContent = message;
  el.style.display = message ? "block" : "none";
}

/* ---------- Model dropdown ---------- */

const modelSelect = document.getElementById("model");
CAR_MODELS.forEach((car, i) => {
  const opt = document.createElement("option");
  opt.value = String(i);
  opt.textContent = `${car.name} — ${car.kwh} kWh`;
  modelSelect.appendChild(opt);
});

modelSelect.addEventListener("change", () => {
  const idx = modelSelect.value;
  if (idx === "custom") return;
  document.getElementById("battery").value = CAR_MODELS[Number(idx)].kwh;
  calculate();
});

/* Typing your own capacity means it's no longer a listed model */
document.getElementById("battery").addEventListener("input", () => {
  const current = parseFloat(document.getElementById("battery").value);
  const match = CAR_MODELS.findIndex((c) => c.kwh === current);
  modelSelect.value = match >= 0 ? String(match) : "custom";
});

/* ---------- Price presets ---------- */

document.querySelectorAll("#price-presets .tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    activePreset = tab.dataset.preset;
    document.querySelectorAll("#price-presets .tab").forEach((t) => t.classList.toggle("active", t === tab));
    const preset = PRICE_PRESETS[activePreset];
    document.getElementById("price").value = preset.price;
    document.getElementById("charger-kw").value = preset.kw;
    document.getElementById("efficiency").value = preset.efficiency;
    calculate();
  });
});

/* Editing the price rewrites the stored preset, so switching away and back keeps it */
document.getElementById("price").addEventListener("input", () => {
  const v = parseFloat(document.getElementById("price").value);
  if (isFinite(v)) PRICE_PRESETS[activePreset].price = v;
});

/* ---------- Calculation ---------- */

function calculate() {
  const battery = num("battery");
  const currentPct = num("current-pct");
  const targetPct = num("target-pct");
  const price = num("price");
  const fee = num("fee");
  const efficiency = num("efficiency");
  const chargerKw = num("charger-kw");
  const miPerKwh = num("mi-per-kwh");

  const evIds = ["total-cost", "kwh-delivered", "kwh-drawn", "kwh-loss", "cost-per-pct",
                 "charge-time", "range-added", "cost-per-mile", "full-cost", "full-range"];

  function resetEv() {
    evIds.forEach((id) => { document.getElementById(id).textContent = "—"; });
    calcPetrol(NaN);
  }

  if ([battery, currentPct, targetPct, price, fee, efficiency, chargerKw, miPerKwh].some((v) => isNaN(v))) {
    showError("ev-error", "Fill in every field with a number.");
    resetEv();
    return;
  }
  if (battery <= 0) {
    showError("ev-error", "Battery capacity must be greater than zero.");
    resetEv();
    return;
  }
  if (currentPct < 0 || targetPct < 0 || currentPct > 100 || targetPct > 100) {
    showError("ev-error", "Charge percentages must be between 0 and 100.");
    resetEv();
    return;
  }
  if (targetPct <= currentPct) {
    showError("ev-error", "Target charge must be higher than the current charge.");
    resetEv();
    return;
  }
  if (efficiency <= 0 || efficiency > 100) {
    showError("ev-error", "Charging efficiency must be above 0% and no more than 100%.");
    resetEv();
    return;
  }
  if (price < 0 || fee < 0) {
    showError("ev-error", "Price and fee can't be negative.");
    resetEv();
    return;
  }

  showError("ev-error", "");

  const delivered = (battery * (targetPct - currentPct)) / 100;
  const drawn = delivered / (efficiency / 100);
  const loss = drawn - delivered;
  const cost = (drawn * price) / 100 + fee;
  const costPerPct = cost / (targetPct - currentPct);

  document.getElementById("kwh-delivered").textContent = fmtKwh(delivered);
  document.getElementById("kwh-drawn").textContent = fmtKwh(drawn);
  document.getElementById("kwh-loss").textContent =
    fmtKwh(loss) + (drawn > 0 ? ` (${((loss / drawn) * 100).toFixed(1)}% of grid draw)` : "");
  document.getElementById("total-cost").textContent = fmtMoney(cost);
  document.getElementById("cost-per-pct").textContent = fmtMoney(costPerPct);

  /* Charger power of zero is a valid "don't care" for time, so report it rather than dividing by it */
  document.getElementById("charge-time").textContent =
    chargerKw > 0 ? fmtDuration(delivered / chargerKw) : "Enter a charger power";

  const milesAdded = delivered * miPerKwh;
  document.getElementById("range-added").textContent = miPerKwh > 0 ? fmtMiles(milesAdded) : "—";

  const evPencePerMile = milesAdded > 0 ? (cost * 100) / milesAdded : NaN;
  document.getElementById("cost-per-mile").textContent =
    isFinite(evPencePerMile) ? fmtPence(evPencePerMile) : "—";

  /* Full 0-100% charge, excluding any session fee so it stays comparable */
  const fullDrawn = battery / (efficiency / 100);
  document.getElementById("full-cost").textContent = fmtMoney((fullDrawn * price) / 100);
  document.getElementById("full-range").textContent = miPerKwh > 0 ? fmtMiles(battery * miPerKwh) : "—";

  calcPetrol(evPencePerMile);
}

/* ---------- Petrol comparison ---------- */

function calcPetrol(evPencePerMile) {
  const fuelPrice = num("fuel-price");
  const mpg = num("mpg");
  const annualMiles = num("annual-miles");

  const ids = ["annual-saving", "petrol-per-mile", "ev-per-mile", "saving-per-mile"];
  function reset() {
    ids.forEach((id) => { document.getElementById(id).textContent = "—"; });
  }

  if ([fuelPrice, mpg, annualMiles].some((v) => isNaN(v))) {
    showError("petrol-error", "Fill in fuel price, mpg and annual mileage.");
    reset();
    return;
  }
  if (mpg <= 0) {
    showError("petrol-error", "Fuel economy must be greater than zero.");
    reset();
    return;
  }
  if (fuelPrice < 0 || annualMiles < 0) {
    showError("petrol-error", "Fuel price and mileage can't be negative.");
    reset();
    return;
  }
  if (!isFinite(evPencePerMile)) {
    showError("petrol-error", "Fix the charging inputs above to compare against petrol.");
    reset();
    return;
  }

  showError("petrol-error", "");

  /* An imperial gallon is 4.54609 litres */
  const petrolPencePerMile = (fuelPrice * LITRES_PER_GALLON) / mpg;
  const savingPerMile = petrolPencePerMile - evPencePerMile;
  const annualSaving = (savingPerMile * annualMiles) / 100;

  document.getElementById("petrol-per-mile").textContent = fmtPence(petrolPencePerMile);
  document.getElementById("ev-per-mile").textContent = fmtPence(evPencePerMile);

  const savingEl = document.getElementById("saving-per-mile");
  savingEl.textContent = fmtPence(savingPerMile);
  savingEl.style.color = savingPerMile > 0 ? "var(--good)" : savingPerMile < 0 ? "var(--bad)" : "";

  const annualEl = document.getElementById("annual-saving");
  annualEl.textContent = fmtMoney(annualSaving);
  annualEl.style.color = annualSaving > 0 ? "var(--good)" : annualSaving < 0 ? "var(--bad)" : "";
  document.querySelector("#petrol-results .label").textContent =
    annualSaving < 0 ? "Extra cost per year against petrol" : "Saved per year against petrol";
}

document.querySelectorAll("input, select").forEach((el) => el.addEventListener("input", calculate));

calculate();
