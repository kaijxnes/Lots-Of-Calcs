function initTabs() {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
      tab.classList.add("active");
      document.querySelector(`[data-panel="${tab.dataset.tab}"]`).classList.add("active");
      calculate();
    });
  });
}

function num(id) {
  return parseFloat(document.getElementById(id).value) || 0;
}

function activeMode() {
  return document.querySelector(".tab.active").dataset.tab;
}

function categoryFor(bmi) {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal weight";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

/* Weight in pounds as "11st 7lb" — how UK scales and the NHS write it */
function stonesAndPounds(lb) {
  let st = Math.floor(lb / 14);
  let rest = Math.round(lb - st * 14);
  if (rest === 14) {
    st += 1;
    rest = 0;
  }
  return st + "st " + rest + "lb";
}

/* The weights that give a BMI of 18.5 to 24.9 at this height */
const HEALTHY_LOW = 18.5;
const HEALTHY_HIGH = 24.9;

function calculate() {
  const mode = activeMode();
  let bmi = 0;
  let range = "—";

  if (mode === "metric") {
    const heightCm = num("m-height");
    const weightKg = num("m-weight");
    const heightM = heightCm / 100;
    bmi = heightM > 0 ? weightKg / (heightM * heightM) : 0;
    if (heightM > 0) {
      range = (HEALTHY_LOW * heightM * heightM).toFixed(1) + " – " + (HEALTHY_HIGH * heightM * heightM).toFixed(1) + " kg";
    }
  } else {
    const feet = num("i-feet");
    const inches = num("i-inches");
    const weightLb = num("i-stone") * 14 + num("i-weight");
    const totalInches = feet * 12 + inches;
    bmi = totalInches > 0 ? (703 * weightLb) / (totalInches * totalInches) : 0;
    if (totalInches > 0) {
      const sq = totalInches * totalInches;
      range = stonesAndPounds((HEALTHY_LOW * sq) / 703) + " – " + stonesAndPounds((HEALTHY_HIGH * sq) / 703);
    }
  }

  document.getElementById("bmi-range").textContent = range;

  if (bmi > 0) {
    document.getElementById("bmi-value").textContent = bmi.toFixed(1);
    document.getElementById("bmi-category").textContent = categoryFor(bmi);
  } else {
    document.getElementById("bmi-value").textContent = "—";
    document.getElementById("bmi-category").textContent = "Enter your height and weight";
  }
}

["m-height", "m-weight", "i-feet", "i-inches", "i-stone", "i-weight"].forEach((id) =>
  document.getElementById(id).addEventListener("input", calculate)
);

initTabs();
calculate();
