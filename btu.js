const M_TO_FT = 3.280839895;
const W_PER_BTU = 3.412142; /* 1 watt = 3.412142 BTU/hr */

let unit = "m";

function num(id) {
  return parseFloat(document.getElementById(id).value) || 0;
}

function sel(id) {
  return parseFloat(document.getElementById(id).value) || 1;
}

function fmtInt(value, suffix) {
  if (!isFinite(value)) value = 0;
  return Math.round(value).toLocaleString("en-US") + suffix;
}

function showError(message) {
  const el = document.getElementById("btu-error");
  el.textContent = message;
  el.style.display = message ? "block" : "none";
}

function setUnit(next) {
  unit = next;
  document.querySelectorAll(".tab[data-unit]").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.unit === unit);
  });
  document.querySelectorAll(".unit-label").forEach((el) => {
    el.textContent = unit === "ft" ? "ft" : "m";
  });
  calculate();
}

document.querySelectorAll(".tab[data-unit]").forEach((tab) => {
  tab.addEventListener("click", () => setUnit(tab.dataset.unit));
});

function calculate() {
  const length = num("length");
  const width = num("width");
  const height = num("height");

  function reset() {
    document.getElementById("btu-out").textContent = fmtInt(0, " BTU/hr");
    document.getElementById("watts-out").textContent = fmtInt(0, " W");
    document.getElementById("volume-out").textContent = "—";
    document.getElementById("base-out").textContent = fmtInt(0, " BTU/hr");
    document.getElementById("adjust-out").textContent = "—";
  }

  if (length < 0 || width < 0 || height < 0) {
    showError("Dimensions can't be negative.");
    reset();
    return;
  }
  if (length <= 0 || width <= 0 || height <= 0) {
    showError("Enter a length, width and height for the room.");
    reset();
    return;
  }

  showError("");

  /* Work in feet — the room-type factors are per cubic foot */
  const factor = unit === "ft" ? 1 : M_TO_FT;
  const lengthFt = length * factor;
  const widthFt = width * factor;
  const heightFt = height * factor;

  const volumeFt3 = lengthFt * widthFt * heightFt;
  const volumeM3 = volumeFt3 / Math.pow(M_TO_FT, 3);

  const roomFactor = sel("room-type");
  const baseBtu = volumeFt3 * roomFactor;

  /* One exterior wall is the baseline; +10% each extra, -10% if fully internal */
  const wallCount = parseFloat(document.getElementById("walls").value);
  const wallMultiplier = 1 + 0.1 * (wallCount - 1);

  const glazingMultiplier = sel("glazing");
  const northMultiplier = sel("north");
  const frenchMultiplier = sel("french");

  const combined = wallMultiplier * glazingMultiplier * northMultiplier * frenchMultiplier;
  const btu = baseBtu * combined;
  const watts = btu / W_PER_BTU;

  document.getElementById("btu-out").textContent = fmtInt(btu, " BTU/hr");
  document.getElementById("watts-out").textContent = fmtInt(watts, " W");
  document.getElementById("volume-out").textContent =
    volumeM3.toFixed(2) + " m³ · " + Math.round(volumeFt3).toLocaleString("en-US") + " ft³";
  document.getElementById("base-out").textContent = fmtInt(baseBtu, " BTU/hr");
  document.getElementById("adjust-out").textContent = "×" + combined.toFixed(2);
}

document.querySelectorAll("input, select").forEach((el) => el.addEventListener("input", calculate));

setUnit("m");
