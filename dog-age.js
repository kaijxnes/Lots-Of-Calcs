/* Size-adjusted lifestage method:
     first year  ~ 15 human years
     second year ~ +9  (so age 2 ~ 24)
     each year after adds 4 (small), 5 (medium), 6 (large), 7 (giant) */
function humanYears(age, perYear) {
  if (!isFinite(age) || age <= 0) return NaN;
  if (age <= 1) return 15 * age;
  if (age <= 2) return 15 + 9 * (age - 1);
  return 24 + perYear * (age - 2);
}

/* Epigenetic estimate from DNA methylation research (UC San Diego, 2020).
   Undefined at or below zero, and goes negative for very young puppies. */
function epigeneticYears(age) {
  if (!isFinite(age) || age <= 0) return NaN;
  return 16 * Math.log(age) + 31;
}

/* Stages are keyed off the human-equivalent age, so a giant breed reaches
   each one earlier than a small breed without needing a separate table */
function lifestage(human) {
  if (!isFinite(human)) return "—";
  if (human < 15) return "Puppy";
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
  const perYear = parseFloat(document.getElementById("size").value);
  const body = document.getElementById("pet-table-body");

  function reset() {
    ["human-age", "epigenetic", "rule-seven"].forEach((id) => {
      document.getElementById(id).textContent = "—";
    });
    document.getElementById("lifestage").textContent = "—";
    body.innerHTML = "";
  }

  if (raw === "" || !isFinite(age)) {
    showError("Enter your dog's age in years.");
    reset();
    return;
  }
  if (age <= 0) {
    showError("Age must be greater than zero — use a decimal like 0.5 for a six-month-old puppy.");
    reset();
    return;
  }
  if (age > 30) {
    showError("That's older than any recorded dog. Check the age you've entered.");
    reset();
    return;
  }

  showError("");

  const human = humanYears(age, perYear);
  const epi = epigeneticYears(age);

  document.getElementById("human-age").textContent = fmtYears(human);
  document.getElementById("lifestage").textContent = lifestage(human);
  /* The formula goes negative below about 0.14 years, so don't show nonsense */
  document.getElementById("epigenetic").textContent = isFinite(epi) && epi > 0 ? fmtYears(epi) : "n/a for very young puppies";
  document.getElementById("rule-seven").textContent = fmtYears(age * 7);

  /* Surrounding whole ages, clamped to sensible bounds */
  const centre = Math.max(1, Math.round(age));
  const rows = [];
  for (let a = centre - 3; a <= centre + 3; a++) {
    if (a < 1 || a > 25) continue;
    rows.push(a);
  }
  body.innerHTML = "";
  rows.forEach((a) => {
    const h = humanYears(a, perYear);
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
