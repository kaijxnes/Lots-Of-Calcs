const MONTHS = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

const MIN_YEAR = 1880;

function diffYMD(start, end) {
  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
    const daysInPrevMonth = new Date(end.getFullYear(), end.getMonth(), 0).getDate();
    days += daysInPrevMonth;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { years, months, days };
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function ordinal(n) {
  const last2 = n % 100;
  if (last2 >= 11 && last2 <= 13) return n + "th";
  return n + ({ 1: "st", 2: "nd", 3: "rd" }[n % 10] || "th");
}

const dayEl = document.getElementById("dob-day");
const monthEl = document.getElementById("dob-month");
const yearEl = document.getElementById("dob-year");
const errorEl = document.getElementById("dob-error");

function setError(message) {
  errorEl.textContent = message;
  errorEl.style.display = message ? "block" : "none";
}

/* Three separate fields rather than a native date input, because a native one
   renders in the browser's own locale — which shows month-first for anyone set
   to US English, whatever the page does. */
function readDob() {
  const dayRaw = dayEl.value.trim();
  const monthRaw = monthEl.value;
  const yearRaw = yearEl.value.trim();

  if (dayRaw === "" && monthRaw === "" && yearRaw === "") {
    return { error: "Enter your date of birth as day, month and year." };
  }
  if (dayRaw === "" || monthRaw === "" || yearRaw === "") {
    return { error: "Fill in all three boxes — day, month and year." };
  }

  const day = Number(dayRaw);
  const month = Number(monthRaw);
  const year = Number(yearRaw);

  if (!Number.isInteger(day) || day < 1 || day > 31) {
    return { error: "The day has to be a whole number between 1 and 31." };
  }
  if (!Number.isInteger(year)) {
    return { error: "Enter the year in full, as four digits — 1994, not 94." };
  }

  const today = startOfDay(new Date());
  if (year < 100) {
    return { error: "Enter the year in full, as four digits — 1994, not 94." };
  }
  if (year < MIN_YEAR) {
    return { error: `Enter a year from ${MIN_YEAR} onwards.` };
  }
  if (year > today.getFullYear()) {
    return { error: "That year hasn't happened yet." };
  }

  const dob = new Date(year, month - 1, day);
  /* Dates that don't exist roll over silently, so check it came back intact */
  if (dob.getDate() !== day || dob.getMonth() !== month - 1) {
    const lastDay = new Date(year, month, 0).getDate();
    return { error: `There's no ${ordinal(day)} of ${MONTHS[month - 1]} in ${year} — that month has ${lastDay} days.` };
  }
  if (dob > today) {
    return { error: "That date is in the future — check the day and month." };
  }

  return { dob: dob, today: today };
}

function calculate() {
  const parsed = readDob();

  if (parsed.error) {
    setError(parsed.error);
    ["age-value", "birth-weekday", "days-lived", "days-until"].forEach((id) => {
      document.getElementById(id).textContent = "—";
    });
    return;
  }
  setError("");

  const dob = parsed.dob;
  const today = parsed.today;
  const age = diffYMD(dob, today);
  document.getElementById("age-value").textContent =
    `${age.years}y ${age.months}m ${age.days}d`;

  document.getElementById("birth-weekday").textContent = dob.toLocaleDateString("en-GB", {
    weekday: "long",
  });

  const msPerDay = 24 * 60 * 60 * 1000;
  const daysLived = Math.round((today - dob) / msPerDay);
  document.getElementById("days-lived").textContent = daysLived.toLocaleString("en-GB");

  let nextBirthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
  if (nextBirthday < today) {
    nextBirthday = new Date(today.getFullYear() + 1, dob.getMonth(), dob.getDate());
  }
  const daysUntil = Math.round((nextBirthday - today) / msPerDay);
  document.getElementById("days-until").textContent =
    daysUntil === 0 ? "Today! 🎉" : `${daysUntil.toLocaleString("en-GB")} day${daysUntil === 1 ? "" : "s"}`;
}

yearEl.max = String(new Date().getFullYear());

[dayEl, monthEl, yearEl].forEach((el) => {
  el.addEventListener("input", calculate);
  el.addEventListener("change", calculate);
});

calculate();
