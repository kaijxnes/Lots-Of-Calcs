/* Surface gravity as a multiple of Earth's, sorted ascending so the Sun lands
   last. Gas and ice giants have no surface, so their figures are taken at the
   cloud tops — the level where atmospheric pressure matches Earth's at sea level. */
const BODIES = [
  { name: "Pluto", g: 0.063, fact: "Demoted to dwarf planet in 2006. Gravity this weak means a gentle hop would carry you several metres up, and a long way along." },
  { name: "Titan", g: 0.138, fact: "Saturn's largest moon, and the only one with a thick atmosphere — dense enough, and the gravity low enough, that you could genuinely fly by strapping on wings." },
  { name: "Ganymede", g: 0.146, fact: "Jupiter's largest moon and the biggest in the solar system, wider than Mercury — but made largely of ice, so it pulls far more gently." },
  { name: "The Moon", g: 0.166, fact: "Why the Apollo astronauts bounced rather than walked. Their suits weighed more on Earth than the astronauts did on the Moon." },
  { name: "Mars", g: 0.377, fact: "Roughly a third of Earth's, which is one of several reasons a crewed landing there is more plausible than anywhere else." },
  { name: "Mercury", g: 0.378, fact: "Almost identical to Mars despite being a good deal smaller — Mercury is far denser, with an outsized iron core taking up most of its volume." },
  { name: "Uranus", g: 0.889, fact: "An ice giant with no solid surface to stand on. This is the pull at the cloud tops." },
  { name: "Venus", g: 0.907, fact: "Near enough Earth's twin for size and gravity. The 460°C surface and pressure like a kilometre under the sea are the problem." },
  { name: "Saturn", g: 0.916, fact: "The surprise. Ninety-five times Earth's mass, yet so spread out that you would weigh slightly less at its cloud tops than you do at home." },
  { name: "Earth", g: 1, fact: "Home, and the baseline every other figure on this page is measured against.", home: true },
  { name: "Neptune", g: 1.12, fact: "The other ice giant, and the windiest place we know of — gusts have been clocked past 1,300 mph." },
  { name: "Jupiter", g: 2.36, fact: "A gas giant with no surface at all. At the cloud tops you would weigh well over twice what you do here, and the pressure would finish you long before the weight did." },
  { name: "The Sun", g: 27.9, fact: "Not somewhere you could stand, land or survive — the visible surface is 5,500°C plasma. The number is here purely for scale." }
];

/* Full-width bar is set a little past Jupiter, so the rocky bodies stay
   distinguishable. The Sun runs off the end and is marked as such. */
const BAR_MAX = 3;

const LB_PER_KG = 2.20462262;

const els = {
  kg: document.getElementById("w-kg"),
  st: document.getElementById("w-st"),
  stLb: document.getElementById("w-st-lb"),
  lb: document.getElementById("w-lb"),
  error: document.getElementById("planet-error"),
  list: document.getElementById("grav-list"),
  summary: document.getElementById("grav-summary"),
  copy: document.getElementById("copy-btn")
};

function activeUnit() {
  const tab = document.querySelector(".tab.active");
  return tab ? tab.dataset.tab : "kg";
}

function num(el) {
  const raw = el.value.trim();
  if (raw === "") return null;
  const v = Number(raw);
  return isFinite(v) ? v : NaN;
}

/* Trailing ".0" is noise, so whole numbers print clean: 70 kg, not 70.0 kg */
function fmt(v, dp) {
  return v.toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: dp });
}

/* Weights get one decimal place until they are big enough for it to be noise */
function fmtAuto(v, suffix) {
  return fmt(v, v >= 1000 ? 0 : 1) + " " + suffix;
}

function fmtStone(totalLb) {
  let stone = Math.floor(totalLb / 14);
  let pounds = Math.round((totalLb - stone * 14) * 10) / 10;
  if (pounds >= 14) {
    stone += 1;
    pounds -= 14;
  }
  if (stone === 0) return fmt(pounds, 1) + " lb";
  return fmt(stone, 0) + " st " + fmt(pounds, 1) + " lb";
}

/* Reads whichever unit is showing and returns both the number to multiply and
   a formatter, so the results come back in the same unit that went in. */
function readWeight() {
  const unit = activeUnit();

  if (unit === "kg") {
    const kg = num(els.kg);
    if (kg === null) return { error: "Enter your weight in kilograms." };
    if (isNaN(kg)) return { error: "That isn't a number — enter your weight in kilograms." };
    if (kg <= 0) return { error: "Weight has to be more than zero." };
    if (kg > 1000) return { error: "That's beyond any recorded human weight — enter up to 1000 kg." };
    return { base: kg, kg: kg, format: (v) => fmtAuto(v, "kg"), entered: fmtAuto(kg, "kg") };
  }

  if (unit === "lb") {
    const lb = num(els.lb);
    if (lb === null) return { error: "Enter your weight in pounds." };
    if (isNaN(lb)) return { error: "That isn't a number — enter your weight in pounds." };
    if (lb <= 0) return { error: "Weight has to be more than zero." };
    if (lb > 2200) return { error: "That's beyond any recorded human weight — enter up to 2200 lb." };
    return { base: lb, kg: lb / LB_PER_KG, format: (v) => fmtAuto(v, "lb"), entered: fmtAuto(lb, "lb") };
  }

  const stone = num(els.st);
  const pounds = num(els.stLb);
  if (stone === null && pounds === null) return { error: "Enter your weight in stone and pounds." };
  if (isNaN(stone) || isNaN(pounds)) return { error: "That isn't a number — enter stone and pounds as figures." };
  const s = stone === null ? 0 : stone;
  const p = pounds === null ? 0 : pounds;
  if (s < 0 || p < 0) return { error: "Weight has to be more than zero." };
  const total = s * 14 + p;
  if (total <= 0) return { error: "Weight has to be more than zero." };
  if (total > 2200) return { error: "That's beyond any recorded human weight — enter up to 157 stone." };
  return { base: total, kg: total / LB_PER_KG, format: fmtStone, entered: fmtStone(total) };
}

function setError(message) {
  els.error.textContent = message;
  els.error.style.display = message ? "block" : "none";
}

let lastRows = [];

function calculate() {
  const w = readWeight();

  if (w.error) {
    setError(w.error);
    els.list.innerHTML = "";
    els.summary.textContent = "";
    els.copy.disabled = true;
    lastRows = [];
    return;
  }
  setError("");
  els.copy.disabled = false;

  const saturn = BODIES.find((b) => b.name === "Saturn");
  els.summary.innerHTML =
    `At <strong>${w.entered}</strong> here on Earth, you'd be <strong>${w.format(w.base * saturn.g)}</strong> at Saturn's cloud tops — ` +
    `lighter than you are now, despite Saturn being ninety-five times Earth's mass.`;

  lastRows = BODIES.map((b) => ({
    name: b.name,
    g: b.g,
    value: w.format(w.base * b.g)
  }));

  els.list.innerHTML = "";
  BODIES.forEach((b) => {
    const pct = Math.min(100, (b.g / BAR_MAX) * 100);
    const clipped = b.g > BAR_MAX;
    const row = document.createElement("div");
    row.className = "grav-row" + (b.home ? " home" : "");
    row.innerHTML =
      '<div class="grav-head">' +
        `<div class="grav-name">${b.name}<span class="grav-factor">×${b.g}</span></div>` +
        `<div class="grav-value">${w.format(w.base * b.g)}</div>` +
      "</div>" +
      '<div class="grav-bar">' +
        `<div class="grav-bar-fill${clipped ? " clipped" : ""}" style="width:${pct}%"></div>` +
      "</div>" +
      `<p class="grav-fact">${b.fact}</p>`;
    els.list.appendChild(row);
  });
}

function copyText() {
  const w = readWeight();
  if (w.error || !lastRows.length) return "";
  const width = Math.max(...lastRows.map((r) => r.name.length));
  const lines = lastRows.map((r) => `${r.name.padEnd(width)}  ${r.value}  (×${r.g})`);
  return [
    `My weight on other worlds — ${w.entered} on Earth`,
    "",
    ...lines,
    "",
    "lotsofcalcs.com/weight-on-other-planets/"
  ].join("\n");
}

function flashCopied(ok) {
  els.copy.textContent = ok ? "Copied ✓" : "Press Ctrl+C to copy";
  setTimeout(() => { els.copy.textContent = "Copy results"; }, 2000);
}

els.copy.addEventListener("click", () => {
  const text = copyText();
  if (!text) return;
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => flashCopied(true), () => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
});

/* execCommand is deprecated but still the only option without a secure context */
function fallbackCopy(text) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch (e) {
    ok = false;
  }
  document.body.removeChild(ta);
  flashCopied(ok);
}

/* Switching units carries the weight across rather than making people retype it */
function convertInto(unit, kg) {
  if (!isFinite(kg) || kg <= 0) return;
  if (unit === "kg") {
    els.kg.value = String(Math.round(kg * 10) / 10);
  } else if (unit === "lb") {
    els.lb.value = String(Math.round(kg * LB_PER_KG * 10) / 10);
  } else {
    const totalLb = kg * LB_PER_KG;
    const stone = Math.floor(totalLb / 14);
    let pounds = Math.round((totalLb - stone * 14) * 10) / 10;
    let st = stone;
    if (pounds >= 14) {
      st += 1;
      pounds -= 14;
    }
    els.st.value = String(st);
    els.stLb.value = String(pounds);
  }
}

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    if (tab.classList.contains("active")) return;
    const before = readWeight();
    document.querySelectorAll(".tab").forEach((t) => {
      t.classList.remove("active");
      t.setAttribute("aria-selected", "false");
    });
    document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
    tab.classList.add("active");
    tab.setAttribute("aria-selected", "true");
    document.querySelector(`[data-panel="${tab.dataset.tab}"]`).classList.add("active");
    if (!before.error) convertInto(tab.dataset.tab, before.kg);
    calculate();
  });
});

document.querySelectorAll(".tool input").forEach((el) => el.addEventListener("input", calculate));

calculate();
