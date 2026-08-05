/* Standard feline lifestage method:
     first year  ~ 15 human years
     second year ~ +9  (so age 2 ~ 24)
     each year after adds ~4
   Size and breed barely shift feline ageing, unlike dogs, so age alone is enough. */
function humanYears(age) {
  if (!isFinite(age) || age <= 0) return NaN;
  if (age <= 1) return 15 * age;
  if (age <= 2) return 15 + 9 * (age - 1);
  return 24 + 4 * (age - 2);
}

/* Thresholds match the widely used feline scheme: kitten under 1, junior to 2,
   adult 3-6, mature 7-10, senior 11-14, geriatric 15+ */
function lifestage(human) {
  if (!isFinite(human)) return "—";
  if (human < 15) return "Kitten";
  if (human < 25) return "Junior";
  if (human < 44) return "Adult";
  if (human < 60) return "Mature";
  if (human < 76) return "Senior";
  return "Geriatric";
}

function round1(v) {
  return Math.round(v * 10) / 10;
}

function fmtYears(v) {
  if (!isFinite(v)) return "—";
  return String(round1(v));
}

function showError(message) {
  const el = document.getElementById("pet-error");
  el.textContent = message;
  el.style.display = message ? "block" : "none";
}

function calculate() {
  const raw = document.getElementById("age").value.trim();
  const age = parseFloat(raw);
  const body = document.getElementById("pet-table-body");

  function reset() {
    ["human-age", "rule-seven"].forEach((id) => {
      document.getElementById(id).textContent = "—";
    });
    document.getElementById("lifestage").textContent = "—";
    body.innerHTML = "";
  }

  if (raw === "" || !isFinite(age)) {
    showError("Enter your cat's age in years.");
    reset();
    return;
  }
  if (age <= 0) {
    showError("Age must be greater than zero — use a decimal like 0.5 for a six-month-old kitten.");
    reset();
    return;
  }
  if (age > 35) {
    showError("That's older than any recorded cat. Check the age you've entered.");
    reset();
    return;
  }

  showError("");

  const human = humanYears(age);

  document.getElementById("human-age").textContent = fmtYears(human);
  document.getElementById("lifestage").textContent = lifestage(human);
  document.getElementById("rule-seven").textContent = fmtYears(age * 7);

  const centre = Math.max(1, Math.round(age));
  const rows = [];
  for (let a = centre - 3; a <= centre + 3; a++) {
    if (a < 1 || a > 25) continue;
    rows.push(a);
  }
  body.innerHTML = "";
  rows.forEach((a) => {
    const h = humanYears(a);
    const tr = document.createElement("tr");
    const isCurrent = a === Math.round(age);
    tr.innerHTML = `
      <td>${isCurrent ? "<strong>" + a + "</strong>" : a}</td>
      <td>${isCurrent ? "<strong>" + fmtYears(h) + "</strong>" : fmtYears(h)}</td>
      <td>${lifestage(h)}</td>
    `;
    body.appendChild(tr);
  });
}

document.querySelectorAll("input, select").forEach((el) => el.addEventListener("input", calculate));

calculate();
