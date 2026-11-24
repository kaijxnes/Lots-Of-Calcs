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

function parseDate(value) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function calculate() {
  const startInput = document.getElementById("dd-start").value;
  const endInput = document.getElementById("dd-end").value;

  if (!startInput || !endInput) {
    document.getElementById("dd-value").textContent = "—";
    document.getElementById("dd-days").textContent = "—";
    document.getElementById("dd-weeks").textContent = "—";
    document.getElementById("dd-months").textContent = "—";
    return;
  }

  let start = parseDate(startInput);
  let end = parseDate(endInput);
  const reversed = start > end;
  if (reversed) [start, end] = [end, start];

  const diff = diffYMD(start, end);
  const parts = [];
  if (diff.years) parts.push(`${diff.years}y`);
  if (diff.months) parts.push(`${diff.months}m`);
  parts.push(`${diff.days}d`);

  document.getElementById("dd-value").textContent = (reversed ? "-" : "") + parts.join(" ");

  const msPerDay = 24 * 60 * 60 * 1000;
  const totalDays = Math.round((end - start) / msPerDay);
  document.getElementById("dd-days").textContent = (reversed ? "-" : "") + totalDays.toLocaleString();
  document.getElementById("dd-weeks").textContent =
    (reversed ? "-" : "") + (totalDays / 7).toFixed(1);
  document.getElementById("dd-months").textContent =
    (reversed ? "-" : "") + (diff.years * 12 + diff.months + diff.days / 30.44).toFixed(1);
}

/* Opens on an example: today to the next 1 January, the days left this year */
(function () {
  const s = document.getElementById("dd-start"), e = document.getElementById("dd-end");
  if (s.value || e.value) return;
  const t = new Date(), iso = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  s.value = iso(t);
  e.value = iso(new Date(t.getFullYear() + 1, 0, 1));
})();

document.getElementById("dd-start").addEventListener("input", calculate);
document.getElementById("dd-end").addEventListener("input", calculate);
calculate();
