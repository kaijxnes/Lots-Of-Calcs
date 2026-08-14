const ROOT3 = Math.sqrt(3);

/* Typical UK appliance loads, used to build the reference table at whatever
   voltage is entered rather than assuming 230 V */
const APPLIANCES = [
  ["LED bulb", 10],
  ["Laptop charger", 65],
  ["Television", 100],
  ["Fridge-freezer", 150],
  ["Microwave", 1000],
  ["Toaster", 1500],
  ["Dishwasher", 2000],
  ["Washing machine", 2200],
  ["Tumble dryer", 2500],
  ["Kettle", 3000],
  ["Immersion heater", 3000],
  ["Electric shower", 8500]
];

const els = {
  solveFor: document.getElementById("solve-for"),
  power: document.getElementById("power"),
  voltage: document.getElementById("voltage"),
  current: document.getElementById("current"),
  pf: document.getElementById("pf"),
  pfField: document.getElementById("pf-field"),
  voltPreset: document.getElementById("volt-preset"),
  error: document.getElementById("elec-error"),
  heroValue: document.getElementById("hero-value"),
  heroLabel: document.getElementById("hero-label"),
  outPower: document.getElementById("out-power"),
  outKw: document.getElementById("out-kw"),
  outVoltage: document.getElementById("out-voltage"),
  outCurrent: document.getElementById("out-current"),
  kvaRow: document.getElementById("kva-row"),
  outKva: document.getElementById("out-kva"),
  outImpedance: document.getElementById("out-impedance"),
  impedanceLabel: document.getElementById("impedance-label"),
  formula: document.getElementById("formula"),
  fuseNote: document.getElementById("fuse-note"),
  tableBody: document.getElementById("appliance-body"),
  tableVolts: document.getElementById("table-volts")
};

function supply() {
  const tab = document.querySelector(".tab.active");
  return tab ? tab.dataset.tab : "dc";
}

/* Small currents need more decimals than large ones — 0.043 A would round
   away to nothing at one decimal place */
function fmt(v, unit) {
  if (!isFinite(v)) return "—";
  const a = Math.abs(v);
  let dp;
  if (a === 0) dp = 0;
  else if (a < 0.1) dp = 4;
  else if (a < 1) dp = 3;
  else if (a < 100) dp = 2;
  else if (a < 10000) dp = 1;
  else dp = 0;
  const s = v.toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: dp });
  return unit ? s + " " + unit : s;
}

function setError(message) {
  els.error.textContent = message;
  els.error.style.display = message ? "block" : "none";
}

function clearResults() {
  ["outPower", "outKw", "outVoltage", "outCurrent", "outKva", "outImpedance"].forEach((k) => {
    els[k].textContent = "—";
  });
  els.heroValue.textContent = "—";
  els.formula.textContent = "";
  els.fuseNote.style.display = "none";
  els.tableBody.innerHTML = "";
}

function num(el) {
  const raw = el.value.trim().replace(/[\s,]/g, "");
  if (raw === "") return null;
  const v = Number(raw);
  return isFinite(v) ? v : NaN;
}

/* The multiplier that turns volts × amps into real watts:
     DC            P = V × I
     AC 1-phase    P = V × I × pf
     AC 3-phase    P = √3 × V × I × pf   (V is the line-to-line voltage) */
function factor(mode, pf) {
  if (mode === "dc") return 1;
  if (mode === "ac1") return pf;
  return ROOT3 * pf;
}

function formulaText(mode, target) {
  const root = mode === "ac3" ? "√3 × " : "";
  const pf = mode === "dc" ? "" : " × pf";
  if (target === "power") return `P = ${root}V × I${pf}`;
  /* Brackets only earn their place when the divisor has more than one term */
  const single = mode === "dc";
  const wrap = (inner) => (single ? inner : `(${inner})`);
  if (target === "current") return `I = P ÷ ${wrap(root + "V" + pf)}`;
  return `V = P ÷ ${wrap(root + "I" + pf)}`;
}

function calculate() {
  const mode = supply();
  const target = els.solveFor.value;

  els.pfField.style.display = mode === "dc" ? "none" : "";
  els.kvaRow.style.display = mode === "dc" ? "none" : "flex";
  els.impedanceLabel.textContent = mode === "dc" ? "Resistance" : "Impedance";

  /* Whichever quantity is being solved for becomes an output, not an input */
  [["power", els.power], ["voltage", els.voltage], ["current", els.current]].forEach(([name, el]) => {
    const isTarget = name === target;
    el.readOnly = isTarget;
    el.closest(".field").classList.toggle("field-output", isTarget);
  });

  const pfRaw = mode === "dc" ? 1 : num(els.pf);
  const pf = mode === "dc" ? 1 : pfRaw;

  if (mode !== "dc") {
    if (pfRaw === null) { setError("Enter a power factor, or use 1 for a purely resistive load."); clearResults(); return; }
    if (isNaN(pfRaw)) { setError("The power factor isn't a number — enter a value between 0.01 and 1."); clearResults(); return; }
    if (pfRaw <= 0 || pfRaw > 1) { setError("The power factor has to be greater than 0 and no more than 1."); clearResults(); return; }
  }

  const needed = ["power", "voltage", "current"].filter((n) => n !== target);
  const labels = { power: "power in watts", voltage: "voltage in volts", current: "current in amps" };
  const values = {};

  for (const name of needed) {
    const v = num(els[name]);
    if (v === null) { setError(`Enter the ${labels[name]}.`); clearResults(); return; }
    if (isNaN(v)) { setError(`The ${labels[name]} isn't a number.`); clearResults(); return; }
    if (v <= 0) { setError(`The ${labels[name]} has to be greater than zero.`); clearResults(); return; }
    values[name] = v;
  }

  setError("");

  const k = factor(mode, pf);
  let power, voltage, current;

  if (target === "power") {
    voltage = values.voltage;
    current = values.current;
    power = k * voltage * current;
  } else if (target === "current") {
    power = values.power;
    voltage = values.voltage;
    current = power / (k * voltage);
  } else {
    power = values.power;
    current = values.current;
    voltage = power / (k * current);
  }

  const solved = { power: power, voltage: voltage, current: current }[target];
  const unit = { power: "W", voltage: "V", current: "A" }[target];
  els[target === "power" ? "power" : target === "voltage" ? "voltage" : "current"].value =
    Number(solved.toPrecision(6)).toString();

  els.heroValue.textContent = fmt(solved, unit);
  els.heroLabel.textContent = { power: "Power", voltage: "Voltage", current: "Current" }[target];

  els.outPower.textContent = fmt(power, "W");
  els.outKw.textContent = fmt(power / 1000, "kW");
  els.outVoltage.textContent = fmt(voltage, "V");
  els.outCurrent.textContent = fmt(current, "A");

  /* Apparent power ignores the phase difference, so it is what the cables and
     supply have to carry even though only the real power does useful work */
  const apparent = (mode === "ac3" ? ROOT3 : 1) * voltage * current;
  els.outKva.textContent = fmt(apparent / 1000, "kVA");
  els.outImpedance.textContent = fmt(voltage / current, "Ω");

  els.formula.textContent = formulaText(mode, target);

  /* A UK 13 A plug tops out around 3 kW, which is exactly why kettles sit there.
     A nominal 3 kW at 230 V computes to 13.04 A, so leave a little headroom
     before calling it out — a kettle plainly does not need its own circuit. */
  if (mode !== "ac3" && voltage >= 200 && voltage <= 260) {
    const a = fmt(current, "A");
    if (current > 13.5) {
      els.fuseNote.textContent = `${a} is more than a UK 13 A plug fuse will carry — a load this size needs its own circuit, wired in by an electrician.`;
    } else if (current > 13) {
      els.fuseNote.textContent = `${a} sits right on the 13 A limit of a UK plug fuse, which is exactly why 3 kW is the ceiling for a plug-in appliance.`;
    } else if (current > 3) {
      els.fuseNote.textContent = `${a} is within the 13 A a UK plug top can carry.`;
    } else {
      els.fuseNote.textContent = `${a} is a light load — comfortably inside a 3 A fuse.`;
    }
    els.fuseNote.style.display = "block";
  } else {
    els.fuseNote.style.display = "none";
  }

  buildTable(voltage, mode, pf);
}

function buildTable(voltage, mode, pf) {
  const k = factor(mode, pf);
  els.tableVolts.textContent = fmt(voltage, "V");
  els.tableBody.innerHTML = "";
  APPLIANCES.forEach(([name, watts]) => {
    const amps = watts / (k * voltage);
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${name}</td><td>${fmt(watts, "W")}</td><td>${fmt(amps, "A")}</td>`;
    els.tableBody.appendChild(tr);
  });
}

els.voltPreset.addEventListener("change", () => {
  if (els.voltPreset.value === "") return;
  els.voltage.value = els.voltPreset.value;
  if (els.solveFor.value === "voltage") els.solveFor.value = "current";
  calculate();
});

[els.power, els.voltage, els.current, els.pf].forEach((el) =>
  el.addEventListener("input", () => {
    if (el === els.voltage) els.voltPreset.value = "";
    calculate();
  })
);

els.solveFor.addEventListener("change", calculate);

document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    if (tab.classList.contains("active")) return;
    document.querySelectorAll(".tab").forEach((t) => {
      t.classList.remove("active");
      t.setAttribute("aria-selected", "false");
    });
    tab.classList.add("active");
    tab.setAttribute("aria-selected", "true");
    calculate();
  });
});

calculate();
