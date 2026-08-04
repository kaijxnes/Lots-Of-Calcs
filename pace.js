const MILE_KM = 1.609344;
const MAX_SPLIT_ROWS = 60;

let solveFor = "pace";

function num(id) {
  return parseFloat(document.getElementById(id).value) || 0;
}

/* mm:ss, or h:mm:ss once it passes an hour */
function fmtClock(totalSeconds) {
  if (!isFinite(totalSeconds) || totalSeconds < 0) return "—";
  const s = Math.round(totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

function showError(message) {
  const el = document.getElementById("pace-error");
  el.textContent = message;
  el.style.display = message ? "block" : "none";
}

function setSolveFor(next) {
  solveFor = next;
  document.querySelectorAll(".tab[data-solve]").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.solve === solveFor);
  });

  /* Hide whichever block we're solving for — the other two are the inputs */
  document.getElementById("distance-block").style.display = solveFor === "distance" ? "none" : "block";
  document.getElementById("time-block").style.display = solveFor === "time" ? "none" : "block";
  document.getElementById("pace-block").style.display = solveFor === "pace" ? "none" : "block";

  document.getElementById("solve-hint").textContent =
    solveFor === "pace"
      ? "Enter your distance and finish time to get the pace you ran."
      : solveFor === "time"
      ? "Enter your distance and target pace to get the finish time."
      : "Enter your time and pace to get how far you'd travel.";

  calculate();
}

document.querySelectorAll(".tab[data-solve]").forEach((tab) => {
  tab.addEventListener("click", () => setSolveFor(tab.dataset.solve));
});

document.querySelectorAll("#preset-tabs .tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    const km = parseFloat(tab.dataset.preset);
    const unit = document.getElementById("dist-unit").value;
    document.getElementById("distance").value = unit === "mi" ? (km / MILE_KM).toFixed(4) : km;
    document.querySelectorAll("#preset-tabs .tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    calculate();
  });
});

function calculate() {
  const distUnit = document.getElementById("dist-unit").value;
  const paceUnit = document.getElementById("pace-unit").value;

  const distanceInput = num("distance");
  const distanceKm = distUnit === "mi" ? distanceInput * MILE_KM : distanceInput;

  const timeSec = num("t-h") * 3600 + num("t-m") * 60 + num("t-s");

  const paceInputSec = num("p-m") * 60 + num("p-s");
  const paceSecPerKm = paceUnit === "mi" ? paceInputSec / MILE_KM : paceInputSec;

  const splitsBody = document.getElementById("splits-body");

  function reset() {
    document.getElementById("hero-value").textContent = "—";
    ["pace-km", "pace-mi", "finish-time", "dist-out", "speed"].forEach((id) => {
      document.getElementById(id).textContent = "—";
    });
    splitsBody.innerHTML = "";
  }

  let finalDistanceKm;
  let finalTimeSec;
  let finalPaceSecPerKm;

  if (solveFor === "pace") {
    if (distanceKm <= 0 || timeSec <= 0) {
      showError("Enter a distance and a finish time greater than zero.");
      reset();
      return;
    }
    finalDistanceKm = distanceKm;
    finalTimeSec = timeSec;
    finalPaceSecPerKm = timeSec / distanceKm;
  } else if (solveFor === "time") {
    if (distanceKm <= 0 || paceSecPerKm <= 0) {
      showError("Enter a distance and a pace greater than zero.");
      reset();
      return;
    }
    finalDistanceKm = distanceKm;
    finalPaceSecPerKm = paceSecPerKm;
    finalTimeSec = distanceKm * paceSecPerKm;
  } else {
    if (timeSec <= 0 || paceSecPerKm <= 0) {
      showError("Enter a time and a pace greater than zero.");
      reset();
      return;
    }
    finalTimeSec = timeSec;
    finalPaceSecPerKm = paceSecPerKm;
    finalDistanceKm = timeSec / paceSecPerKm;
  }

  showError("");

  const paceSecPerMile = finalPaceSecPerKm * MILE_KM;
  const speedKmh = 3600 / finalPaceSecPerKm;
  const speedMph = speedKmh / MILE_KM;
  const distanceMi = finalDistanceKm / MILE_KM;

  document.getElementById("pace-km").textContent = fmtClock(finalPaceSecPerKm);
  document.getElementById("pace-mi").textContent = fmtClock(paceSecPerMile);
  document.getElementById("finish-time").textContent = fmtClock(finalTimeSec);
  document.getElementById("dist-out").textContent =
    finalDistanceKm.toFixed(2) + " km · " + distanceMi.toFixed(2) + " mi";
  document.getElementById("speed").textContent =
    speedKmh.toFixed(2) + " km/h · " + speedMph.toFixed(2) + " mph";

  const hero = document.getElementById("hero-value");
  const heroLabel = document.getElementById("hero-label");
  if (solveFor === "pace") {
    hero.textContent = fmtClock(finalPaceSecPerKm) + " /km";
    heroLabel.textContent = "Pace";
  } else if (solveFor === "time") {
    hero.textContent = fmtClock(finalTimeSec);
    heroLabel.textContent = "Finish time";
  } else {
    hero.textContent = finalDistanceKm.toFixed(2) + " km";
    heroLabel.textContent = "Distance";
  }

  /* Splits in whichever unit the pace is shown in */
  const splitUnit = paceUnit === "mi" ? "mi" : "km";
  const splitLength = splitUnit === "mi" ? MILE_KM : 1;
  const splitPace = splitUnit === "mi" ? paceSecPerMile : finalPaceSecPerKm;
  document.getElementById("split-head").textContent = splitUnit === "mi" ? "Mile" : "Km";

  const fullSplits = Math.floor(finalDistanceKm / splitLength + 1e-9);
  splitsBody.innerHTML = "";

  const shown = Math.min(fullSplits, MAX_SPLIT_ROWS);
  for (let i = 1; i <= shown; i++) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${i}</td><td>${fmtClock(i * splitPace)}</td>`;
    splitsBody.appendChild(tr);
  }

  /* Final partial split, so the table always ends at the real finish */
  const remainder = finalDistanceKm / splitLength - fullSplits;
  if (fullSplits <= MAX_SPLIT_ROWS && remainder > 1e-6) {
    const tr = document.createElement("tr");
    const label = (finalDistanceKm / splitLength).toFixed(2);
    tr.innerHTML = `<td>${label} (finish)</td><td>${fmtClock(finalTimeSec)}</td>`;
    splitsBody.appendChild(tr);
  }
}

document.querySelectorAll("input, select").forEach((el) => el.addEventListener("input", calculate));

setSolveFor("pace");
