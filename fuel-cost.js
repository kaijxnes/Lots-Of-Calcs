function initTabs() {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
      tab.classList.add("active");
      document.querySelector(`[data-panel="${tab.dataset.tab}"]`).classList.add("active");
    });
  });
}

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

/* A UK (imperial) gallon is about 20% bigger than a US one, so the same
   car shows a higher MPG in the UK. UK pumps price per litre. */
const LITRES_PER_GALLON = { uk: 4.54609, us: 3.785411784 };

function calcMpg() {
  const distance = num("mpg-distance");
  const efficiency = num("mpg-efficiency");
  const price = num("mpg-price");
  const gallon = document.getElementById("mpg-gallon").value;
  const perLitre = document.getElementById("mpg-price-unit").value === "litre";

  const gallons = efficiency !== 0 ? distance / efficiency : 0;
  const litres = gallons * LITRES_PER_GALLON[gallon];
  const cost = (perLitre ? litres : gallons) * price;

  document.getElementById("mpg-cost").textContent = fmtMoney(cost);
  document.getElementById("mpg-fuel").textContent = litres.toFixed(2) + " L (" + gallons.toFixed(2) + " gal)";
}

function calcL100() {
  const distance = num("l100-distance");
  const efficiency = num("l100-efficiency");
  const price = num("l100-price");

  const fuelNeeded = (distance / 100) * efficiency;
  const cost = fuelNeeded * price;

  document.getElementById("l100-cost").textContent = fmtMoney(cost);
  document.getElementById("l100-fuel").textContent = fuelNeeded.toFixed(2) + " L";
}

["mpg-distance", "mpg-efficiency", "mpg-price", "mpg-gallon", "mpg-price-unit"].forEach((id) =>
  document.getElementById(id).addEventListener("input", calcMpg)
);
["l100-distance", "l100-efficiency", "l100-price"].forEach((id) =>
  document.getElementById(id).addEventListener("input", calcL100)
);
document.getElementById("currency").addEventListener("input", () => {
  calcMpg();
  calcL100();
});

initTabs();
calcMpg();
calcL100();
