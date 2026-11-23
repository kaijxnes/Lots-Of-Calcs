#!/usr/bin/env node
/* Unit conversion pages for the conversions people look up one value at a
   time — heights, body weights, oven and weather temperatures, race and road
   distances:

       /convert/5-ft-8-in-to-cm/          /convert/70-kg-in-stone/
       /convert/180-c-to-f/               /convert/10-km-to-miles/

       node tools/build-conversion-pages.js

   Every figure comes from the factors and temperature functions in
   unit-converter.js (loaded, not copied), so these pages always agree with
   the full converter. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const { load } = require("./lib/load-script.js");
const { esc, SITE } = site;

const U = load("unit-converter.js", ["LENGTH_FACTORS", "WEIGHT_FACTORS", "celsiusFrom", "celsiusTo", "convertLinear"]);
const L = (v, a, b) => U.convertLinear(v, a, b, U.LENGTH_FACTORS);
const Wt = (v, a, b) => U.convertLinear(v, a, b, U.WEIGHT_FACTORS);
const T = (v, a, b) => U.celsiusTo(U.celsiusFrom(v, a), b);
if (Math.abs(L(1, "in", "cm") - 2.54) > 1e-12 || Math.abs(T(100, "C", "F") - 212) > 1e-9) throw new Error("unit-converter.js factors changed: check convert-page.js");

const range = (a, b, s) => { const o = []; for (let v = a; v <= b + 1e-9; v += s) o.push(Math.round(v * 10) / 10); return o; };
const num = (v, dp) => (Math.round(v * Math.pow(10, dp)) / Math.pow(10, dp)).toLocaleString("en-GB", { maximumFractionDigits: dp });
const vslug = (v) => (v < 0 ? "minus-" : "") + String(Math.abs(v)).replace(".", "-");
function ftin(totalIn) {
  let ft = Math.floor(totalIn / 12), i = Math.round((totalIn - ft * 12) * 10) / 10;
  if (i >= 12) { ft++; i -= 12; }
  return `${ft} ft ${num(i, 1)} in`;
}
function stlb(lb) {
  let st = Math.floor(lb / 14), l = Math.round((lb - st * 14) * 10) / 10;
  if (l >= 14) { st++; l -= 14; }
  return `${st} st ${num(l, 1)} lb`;
}
const tick = (totalIn) => `${Math.floor(totalIn / 12)}′${totalIn % 12}″`;

/* Gas marks for oven temperatures, from the sourced oven chart (Which?) */
const OVEN = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/cooking/oven.json"), "utf8"));
const OVEN_SRC = OVEN.sources[0];
const gasF = (f) => OVEN.gasMarks.find((g) => g.f === f);
const gasC = (c) => OVEN.gasMarks.find((g) => g.c === c);
const gasAnswer = (g) => `Gas mark ${g.mark} — ${g.c} °C (${g.fan} °C in a fan oven) or ${g.f} °F, which <a href="${OVEN_SRC.url}" rel="nofollow noopener" target="_blank">Which?'s oven chart</a> calls ${g.word.toLowerCase()}. The <a href="/oven-temperature-converter/">oven temperature converter</a> does fan and air fryer temperatures too.`;

/* Travel time at a steady speed, for the distance pages */
function dur(hours) {
  const m = Math.round(hours * 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60), r = m % 60;
  return r ? `${h} hr ${r} min` : `${h} hr`;
}
const SPEEDS = {
  mi: [["Walking", 3, "mph"], ["Running", 6, "mph"], ["Cycling", 12, "mph"], ["Driving", 30, "mph"], ["Driving", 60, "mph"], ["Driving", 70, "mph"]],
  km: [["Walking", 5, "km/h"], ["Running", 10, "km/h"], ["Cycling", 20, "km/h"], ["Driving", 50, "km/h"], ["Driving", 100, "km/h"], ["Driving", 120, "km/h"]]
};
/* Race distances, as World Athletics defines the marathon (42.195 km) */
const RACES = { "km-mi": { 5: "a 5K race", 10: "a 10K race", 21.1: "a half marathon (21.0975 km)", 42.2: "a marathon (42.195 km)" }, "mi-km": { 13.1: "a half marathon (21.0975 km)", 26.2: "a marathon (42.195 km)" } };
const EXACT = {
  "in-cm": (v) => L(v, "in", "cm"), "cm-in": (v) => L(v, "cm", "in"), "f-c": (v) => T(v, "F", "C"), "c-f": (v) => T(v, "C", "F"),
  "mi-km": (v) => L(v, "mi", "km"), "km-mi": (v) => L(v, "km", "mi"), "ft-m": (v) => L(v, "ft", "m"), "m-ft": (v) => L(v, "m", "ft"), "lb-kg": (v) => Wt(v, "lb", "kg")
};
const r1 = (x) => Math.round(x * 10) / 10;

/* Each kind: the values that get pages, and how to describe one */
const KINDS = {
  "ftin-cm": {
    from: "Feet and inches", to: "cm", group: "Height", values: range(48, 84, 1),
    slug: (v) => `${Math.floor(v / 12)}-ft-${v % 12}-in-to-cm`, label: (v) => `${Math.floor(v / 12)} ft ${v % 12} in`,
    answer: (v) => `${num(L(v, "in", "cm"), 1)} cm`, extra: (v) => [["In metres", `${num(L(v, "in", "m"), 2)} m`], ["In inches", `${v} in`]],
    title: (v) => `${Math.floor(v / 12)} ft ${v % 12} in to cm — ${tick(v)} Is ${num(L(v, "in", "cm"), 1)} cm`,
    how: () => "There are 12 inches in a foot and exactly 2.54 cm in an inch, so turn the height into inches and multiply by 2.54.",
    work: (v) => `${Math.floor(v / 12)} × 12 + ${v % 12} = ${v} inches; ${v} × 2.54 = ${num(L(v, "in", "cm"), 2)} cm.`,
    widget: { kind: "ftin-cm", unit: "cm", inputs: (v) => [["Feet", Math.floor(v / 12)], ["Inches", v % 12]] },
    reverse: (v) => ({ kind: "cm-ftin", v: Math.round(L(v, "in", "cm")) })
  },
  "cm-ftin": {
    from: "cm", to: "feet and inches", group: "Height", values: range(140, 210, 1),
    slug: (v) => `${v}-cm-in-feet-and-inches`, label: (v) => `${v} cm`,
    answer: (v) => ftin(L(v, "cm", "in")), extra: (v) => [["In inches", `${num(L(v, "cm", "in"), 1)} in`], ["In feet", `${num(L(v, "cm", "ft"), 2)} ft`]],
    title: (v) => `${v} cm in Feet and Inches — ${ftin(L(v, "cm", "in"))}`,
    how: () => "Divide by 2.54 to get inches, then take out whole feet of 12 inches; what's left is the inches.",
    work: (v) => `${v} ÷ 2.54 = ${num(L(v, "cm", "in"), 2)} inches = ${ftin(L(v, "cm", "in"))}.`,
    widget: { kind: "cm-ftin", unit: "", inputs: (v) => [["Centimetres", v]] },
    reverse: (v) => ({ kind: "ftin-cm", v: Math.round(L(v, "cm", "in")) })
  },
  "kg-stlb": {
    from: "kg", to: "stone and pounds", group: "Body weight", values: range(40, 150, 1),
    slug: (v) => `${v}-kg-in-stone`, label: (v) => `${v} kg`,
    answer: (v) => stlb(Wt(v, "kg", "lb")), extra: (v) => [["In pounds", `${num(Wt(v, "kg", "lb"), 1)} lb`], ["In stone (decimal)", `${num(Wt(v, "kg", "st"), 2)} st`]],
    title: (v) => `${v} kg in Stone and Pounds — ${stlb(Wt(v, "kg", "lb"))} (${num(Wt(v, "kg", "lb"), 1)} lb)`,
    how: () => "A kilogram is 2.20462 pounds and a stone is 14 pounds: convert to pounds, then take out whole stones.",
    work: (v) => `${v} × 2.20462 = ${num(Wt(v, "kg", "lb"), 2)} lb = ${stlb(Wt(v, "kg", "lb"))}.`,
    widget: { kind: "kg-stlb", factor: Wt(1, "kg", "lb"), unit: "", inputs: (v) => [["Kilograms", v]] },
    reverse: (v) => ({ kind: "st-kg", v: Math.round(Wt(v, "kg", "st")) })
  },
  "st-kg": {
    from: "Stone", to: "kg", group: "Body weight", values: range(6, 25, 1),
    slug: (v) => `${v}-stone-in-kg`, label: (v) => `${v} stone`,
    answer: (v) => `${num(Wt(v, "st", "kg"), 1)} kg`, extra: (v) => [["In pounds", `${num(Wt(v, "st", "lb"), 0)} lb`]],
    title: (v) => `${v} Stone in kg — ${num(Wt(v, "st", "kg"), 1)} kg`,
    how: () => "A stone is 14 pounds, which is 6.35029 kg.",
    work: (v) => `${v} × 6.35029 = ${num(Wt(v, "st", "kg"), 2)} kg.`,
    widget: { kind: "linear", factor: Wt(1, "st", "kg"), unit: "kg", inputs: (v) => [["Stone", v]] },
    reverse: (v) => ({ kind: "kg-stlb", v: Math.round(Wt(v, "st", "kg")) })
  },
  "lb-kg": {
    rule: { text: "Halve it, then take off a tenth of the result", est: (v) => v / 2 * 0.9, unit: "kg", dp: 1 }, decimals: (v) => false,
    from: "Pounds", to: "kg", group: "Body weight", values: range(100, 300, 5),
    slug: (v) => `${v}-lb-to-kg`, label: (v) => `${v} lb`,
    answer: (v) => `${num(Wt(v, "lb", "kg"), 1)} kg`, extra: (v) => [["In stone", stlb(v)]],
    title: (v) => `${v} lb to kg — ${num(Wt(v, "lb", "kg"), 1)} kg (${stlb(v)})`,
    how: () => "A pound is exactly 0.45359237 kg.",
    work: (v) => `${v} × 0.45359 = ${num(Wt(v, "lb", "kg"), 2)} kg.`,
    widget: { kind: "linear", factor: Wt(1, "lb", "kg"), unit: "kg", inputs: (v) => [["Pounds", v]] },
    reverse: (v) => ({ kind: "kg-stlb", v: Math.round(Wt(v, "lb", "kg")) })
  },
  "c-f": {
    rule: { text: "Double it, then add 30", est: (v) => v * 2 + 30, unit: "°F", dp: 1 }, decimals: (v) => Math.abs(v) <= 50,
    from: "°C", to: "°F", group: "Temperature", values: range(-40, -10, 5).concat(range(-9, 50, 1), range(55, 300, 5)),
    slug: (v) => `${vslug(v)}-c-to-f`, label: (v) => `${num(v, 1)} °C`,
    answer: (v) => `${num(T(v, "C", "F"), 1)} °F`, extra: (v) => [["In kelvin", `${num(T(v, "C", "K"), 2)} K`]],
    title: (v) => `${num(v, 1)}°C to °F — ${num(v, 1)} Celsius Is ${num(T(v, "C", "F"), 1)} Fahrenheit`,
    how: () => "Multiply by 9, divide by 5, then add 32 (°F = °C × 1.8 + 32).",
    work: (v) => `${num(v, 1)} × 1.8 + 32 = ${num(T(v, "C", "F"), 2)} °F.`,
    widget: { kind: "c-f", unit: "°F", inputs: (v) => [["Celsius", v]] },
    reverse: (v) => ({ kind: "f-c", v: Math.round(T(v, "C", "F")) })
  },
  "f-c": {
    rule: { text: "Take away 30, then halve it", est: (v) => (v - 30) / 2, unit: "°C", dp: 1 }, decimals: (v) => Math.abs(v) <= 120,
    from: "°F", to: "°C", group: "Temperature", values: range(-20, 120, 1).concat(range(125, 550, 25)),
    slug: (v) => `${vslug(v)}-f-to-c`, label: (v) => `${num(v, 1)} °F`,
    answer: (v) => `${num(T(v, "F", "C"), 1)} °C`, extra: (v) => [["In kelvin", `${num(T(v, "F", "K"), 2)} K`]],
    title: (v) => `${num(v, 1)}°F to °C — ${num(v, 1)} Fahrenheit Is ${num(T(v, "F", "C"), 1)} Celsius`,
    how: () => "Subtract 32, then multiply by 5 and divide by 9 (°C = (°F − 32) ÷ 1.8).",
    work: (v) => `(${num(v, 1)} − 32) ÷ 1.8 = ${num(T(v, "F", "C"), 2)} °C.`,
    widget: { kind: "f-c", unit: "°C", inputs: (v) => [["Fahrenheit", v]] },
    reverse: (v) => ({ kind: "c-f", v: Math.round(T(v, "F", "C")) })
  },
  "km-mi": {
    rule: { text: "Multiply by 5, then divide by 8", est: (v) => v * 5 / 8, unit: "miles", dp: 2 }, decimals: (v) => v < 100,
    from: "km", to: "miles", group: "Distance", values: [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 16, 20, 21.1, 25, 30, 40, 42.2, 50, 60, 70, 80, 90, 100, 120, 150, 160, 200, 250, 300, 400, 500, 1000],
    slug: (v) => `${vslug(v)}-km-to-miles`, label: (v) => `${num(v, 1)} km`,
    answer: (v) => `${num(L(v, "km", "mi"), 2)} miles`, extra: (v) => [["In metres", `${num(L(v, "km", "m"), 0)} m`]],
    title: (v) => `${num(v, 1)} km to Miles — ${num(v, 1)} Kilometres Is ${num(L(v, "km", "mi"), 2)} Miles`,
    how: () => "A mile is exactly 1.609344 km, so divide by 1.609 (or multiply by 0.6214).",
    work: (v) => `${num(v, 1)} ÷ 1.609344 = ${num(L(v, "km", "mi"), 3)} miles.`,
    widget: { kind: "linear", factor: L(1, "km", "mi"), unit: "miles", inputs: (v) => [["Kilometres", v]] },
    reverse: (v) => ({ kind: "mi-km", v: Math.round(L(v, "km", "mi")) })
  },
  "mi-km": {
    rule: { text: "Multiply by 1.6", est: (v) => v * 1.6, unit: "km", dp: 2 }, decimals: (v) => v < 100,
    from: "Miles", to: "km", group: "Distance", values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 13.1, 15, 20, 25, 26.2, 30, 40, 50, 60, 70, 75, 80, 90, 100, 150, 200, 250, 300, 500],
    slug: (v) => `${vslug(v)}-miles-to-km`, label: (v) => `${num(v, 1)} miles`,
    answer: (v) => `${num(L(v, "mi", "km"), 2)} km`, extra: (v) => [["In metres", `${num(L(v, "mi", "m"), 0)} m`]],
    title: (v) => `${num(v, 1)} Miles to km — ${num(L(v, "mi", "km"), 2)} Kilometres`,
    how: () => "A mile is exactly 1.609344 km.",
    work: (v) => `${num(v, 1)} × 1.609344 = ${num(L(v, "mi", "km"), 3)} km.`,
    widget: { kind: "linear", factor: L(1, "mi", "km"), unit: "km", inputs: (v) => [["Miles", v]] },
    reverse: (v) => ({ kind: "km-mi", v: Math.round(L(v, "mi", "km")) })
  },
  "in-cm": {
    rule: { text: "Multiply by 2.5", est: (v) => v * 2.5, unit: "cm", dp: 2 }, decimals: (v) => true,
    from: "Inches", to: "cm", group: "Length", values: range(1, 72, 1),
    slug: (v) => `${v}-inches-to-cm`, label: (v) => `${v} ${v === 1 ? "inch" : "inches"}`,
    answer: (v) => `${num(L(v, "in", "cm"), 2)} cm`, extra: (v) => [["In millimetres", `${num(L(v, "in", "mm"), 1)} mm`], ["In feet and inches", ftin(v)]],
    title: (v) => `${v} ${v === 1 ? "Inch" : "Inches"} to cm — ${v}″ Is ${num(L(v, "in", "cm"), 2)} cm`,
    how: () => "An inch is exactly 2.54 cm.",
    work: (v) => `${v} × 2.54 = ${num(L(v, "in", "cm"), 2)} cm.`,
    widget: { kind: "linear", factor: 2.54, unit: "cm", inputs: (v) => [["Inches", v]] },
    reverse: (v) => ({ kind: "cm-in", v: Math.round(L(v, "in", "cm")) })
  },
  "cm-in": {
    rule: { text: "Multiply by 0.4 (the same as dividing by 2.5)", est: (v) => v * 0.4, unit: "in", dp: 2 }, decimals: (v) => true,
    from: "cm", to: "inches", group: "Length", values: range(1, 100, 1),
    slug: (v) => `${v}-cm-to-inches`, label: (v) => `${v} cm`,
    answer: (v) => `${num(L(v, "cm", "in"), 2)} in`, extra: (v) => [["In millimetres", `${num(v * 10, 0)} mm`]],
    title: (v) => `${v} cm to Inches — ${num(L(v, "cm", "in"), 2)} Inches`,
    how: () => "Divide by 2.54, since an inch is exactly 2.54 cm.",
    work: (v) => `${v} ÷ 2.54 = ${num(L(v, "cm", "in"), 3)} inches.`,
    widget: { kind: "linear", factor: L(1, "cm", "in"), unit: "in", inputs: (v) => [["Centimetres", v]] },
    reverse: (v) => ({ kind: "in-cm", v: Math.round(L(v, "cm", "in")) })
  },
  "m-ft": {
    rule: { text: "Multiply by 3.3", est: (v) => v * 3.3, unit: "ft", dp: 2 }, decimals: (v) => v <= 20,
    from: "Metres", to: "feet", group: "Length", values: range(1, 20, 1).concat(range(25, 100, 5)),
    slug: (v) => `${v}-m-to-feet`, label: (v) => `${v} m`,
    answer: (v) => `${num(L(v, "m", "ft"), 2)} ft`, extra: (v) => [["In feet and inches", ftin(L(v, "m", "in"))], ["In yards", `${num(L(v, "m", "yd"), 2)} yd`]],
    title: (v) => `${v} Metres to Feet — ${num(L(v, "m", "ft"), 2)} ft (${ftin(L(v, "m", "in"))})`,
    how: () => "A foot is exactly 0.3048 m, so divide by 0.3048 (or multiply by 3.281).",
    work: (v) => `${v} ÷ 0.3048 = ${num(L(v, "m", "ft"), 3)} ft.`,
    widget: { kind: "m-ft", factor: L(1, "m", "ft"), unit: "ft", inputs: (v) => [["Metres", v]] },
    reverse: (v) => ({ kind: "ft-m", v: Math.round(L(v, "m", "ft")) })
  },
  "ft-m": {
    rule: { text: "Multiply by 0.3", est: (v) => v * 0.3, unit: "m", dp: 2 }, decimals: (v) => v <= 20,
    from: "Feet", to: "metres", group: "Length", values: range(1, 20, 1).concat(range(25, 100, 5)),
    slug: (v) => `${v}-feet-to-m`, label: (v) => `${v} ${v === 1 ? "foot" : "feet"}`,
    answer: (v) => `${num(L(v, "ft", "m"), 2)} m`, extra: (v) => [["In centimetres", `${num(L(v, "ft", "cm"), 1)} cm`]],
    title: (v) => `${v} ${v === 1 ? "Foot" : "Feet"} to Metres — ${num(L(v, "ft", "m"), 2)} m`,
    how: () => "A foot is exactly 0.3048 m.",
    work: (v) => `${v} × 0.3048 = ${num(L(v, "ft", "m"), 4)} m.`,
    widget: { kind: "linear", factor: 0.3048, unit: "m", inputs: (v) => [["Feet", v]] },
    reverse: (v) => ({ kind: "m-ft", v: Math.round(L(v, "ft", "m")) })
  }
};

const href = (kind, v) => `/convert/${KINDS[kind].slug(v)}/`;
const has = (kind, v) => KINDS[kind] && KINDS[kind].values.includes(v);

function page(kind, v) {
  const K = KINDS[kind];
  const url = SITE + href(kind, v);
  const title = K.title(v);
  const answer = K.answer(v);
  const desc = site.clipDesc(`${K.label(v)} is ${answer}. ${K.how()} With the working, a quick way to do it in your head, and a table of nearby values.`);
  const i = K.values.indexOf(v);
  const near = K.values.slice(Math.max(0, i - 6), i + 7);
  const rows = near.map((x) => [x === v ? `<strong>${esc(K.label(x))}</strong>` : `<a href="${href(kind, x)}">${esc(K.label(x))}</a>`, esc(K.answer(x))]);
  const rev = K.reverse(v);
  const revLink = has(rev.kind, rev.v) ? `<a href="${href(rev.kind, rev.v)}">${esc(KINDS[rev.kind].label(rev.v))} in ${esc(KINDS[rev.kind].to)}</a>` : "";
  const w = K.widget;
  const inputs = w.inputs(v);
  const q = [
    [`What is ${K.label(v)} in ${K.to}?`, `${K.label(v)} is ${answer}. ${K.work(v)}`],
    [`How do you convert ${K.from.replace(/^[A-Z](?=[a-z])/, (c) => c.toLowerCase())} to ${K.to}?`, K.how()]
  ];
  let more = "";
  /* a rule of thumb, worked for this value, and how far out it is */
  if (K.rule) {
    const R = K.rule, e = R.est(v), x = EXACT[kind](v), d = e - x;
    const temp = /°/.test(R.unit), sp = " ";
    const off = Math.abs(d) < Math.pow(10, -R.dp) / 2 ? "spot on" : `${num(Math.abs(d), R.dp)}${sp}${R.unit} ${d < 0 ? "under" : "over"} the exact ${num(x, R.dp)}${sp}${R.unit}`;
    const drift = temp && Math.abs(d) > 3 ? ` The shortcut is exact at ${kind === "f-c" ? "50 °F" : "10 °C"} and drifts further out the further you go from it, so for anything much hotter or colder, use the exact formula.` : "";
    const text = `${R.text}: that gives ${num(e, R.dp)}${sp}${R.unit} for ${K.label(v)} — ${off}.${drift}`;
    q.push([`How can you convert ${K.label(v)} to ${K.to} in your head?`, text]);
    more += `      <p class="about-text"><strong>In your head:</strong> ${esc(text)}</p>\n`;
  }
  /* oven temperatures: the gas mark */
  const g = kind === "f-c" ? gasF(v) : kind === "c-f" ? gasC(v) : null;
  if (g) {
    q.push([`What gas mark is ${K.label(v)}?`, `Gas mark ${g.mark}: ${g.c} °C, or ${g.fan} °C in a fan oven, and ${g.f} °F.`]);
    more += `      <p class="about-text"><strong>In the oven:</strong> ${gasAnswer(g)}</p>\n`;
  }
  /* race distances */
  const race = RACES[kind] && RACES[kind][v];
  if (race) more += `      <p class="about-text"><strong>Running:</strong> ${esc(K.label(v))} is ${esc(race)}. The <a href="/pace/">pace calculator</a> works out your pace and finish time.</p>\n`;
  let extraBlocks = "";
  /* decimals between this value and the next whole one */
  if (K.decimals && K.decimals(v)) {
    const start = Math.floor(v), dec = [];
    for (let i = 0; i < 10; i++) dec.push(r1(start + i / 10));
    const drows = dec.map((x) => [x === v ? `<strong>${esc(K.label(x))}</strong>` : esc(K.label(x)), esc(K.answer(x))]);
    extraBlocks += `    <main class="tool">
      <h2 class="tool-section-title">From ${esc(K.label(dec[0]))} to ${esc(K.label(dec[9]))}</h2>
${site.table([K.from, K.to].map((n) => (n.length > 2 && /^[a-z]/.test(n) ? n.charAt(0).toUpperCase() + n.slice(1) : n)), drows, 300)}    </main>

`;
  }
  /* how long the distance takes at a steady speed */
  if (kind === "mi-km" || kind === "km-mi") {
    const u = kind === "mi-km" ? "mi" : "km", word = u === "mi" ? (v === 1 ? "mile" : "miles") : "km";
    const trows = SPEEDS[u].map(([mode, sp, unit]) => [esc(mode), `${sp} ${unit}`, esc(dur(v / sp))]);
    q.push([`How long does it take to walk ${num(v, 1)} ${word}?`, `About ${dur(v / SPEEDS[u][0][1])} at a steady ${SPEEDS[u][0][1]} ${SPEEDS[u][0][2]}. Driving at ${SPEEDS[u][4][1]} ${SPEEDS[u][4][2]}, it takes about ${dur(v / SPEEDS[u][4][1])}.`]);
    extraBlocks += `    <main class="tool">
      <h2 class="tool-section-title">How long ${esc(num(v, 1))} ${word} takes</h2>
${site.table(["", "Steady speed", "Time"], trows, 300)}      <p class="tool-hint" style="margin-top:12px;">At a constant speed with no stops. For your own speed, use the <a href="/speed-distance-time/">speed, distance and time calculator</a>.</p>
    </main>

`;
  }
  const ld = [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], ["Unit Converter", SITE + "/unit-converter/"], [title.split(" — ")[0], url]]), site.faqLd(q)];
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="/convert/">← All conversions</a>
      <h1 class="page-title">${esc(title.split(" — ")[0])}</h1>
      <p class="page-subtitle">${esc(K.label(v))} = ${esc(answer)}</p>
    </header>

    <main class="tool" id="cv-tool" data-kind="${w.kind}" data-factor="${w.factor || ""}" data-unit="${esc(w.unit)}">
      <div class="result-box">
        <div class="result-hero">
          <div class="value">${esc(answer)}</div>
          <div class="label">${esc(K.label(v))}</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
${K.extra(v).map(([a, b]) => `          <div class="result-row"><span class="r-label">${esc(a)}</span><span class="r-value">${esc(b)}</span></div>`).join("\n")}
        </div>
      </div>
      <p class="about-text" style="margin-top:14px;"><strong>How:</strong> ${esc(K.how())} ${esc(K.work(v))}</p>
${more}      <h2 class="tool-section-title" style="margin-top:18px;">Convert another value</h2>
      <div class="field-row">
${inputs.map(([lab, val], j) => `        <div class="field"><label for="cv-in${j ? "2" : ""}">${esc(lab)}</label><input type="number" id="cv-in${j ? "2" : ""}" value="${val}" step="any" inputmode="decimal"></div>`).join("\n")}
        <div class="field"><label>Result</label><p class="r-value" id="cv-out" style="font-size:1.2rem; margin:8px 0 0;">${esc(answer)}</p></div>
      </div>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">Nearby values</h2>
${site.table([K.from, K.to].map((n) => (n.length > 2 && /^[a-z]/.test(n) ? n.charAt(0).toUpperCase() + n.slice(1) : n)), rows, 300)}      <p class="tool-hint" style="margin-top:12px;">${revLink ? `The other way: ${revLink}. ` : ""}Every unit at once: the <a href="/unit-converter/">unit converter</a>.</p>
    </main>

${extraBlocks}    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}    </main>

${site.FOOTER}
  </div>
  <script src="/convert-page.js"></script>
</body>
</html>
`;
}

const GROUP_TITLES = {
  "ftin-cm": "Feet and inches to cm", "cm-ftin": "cm to feet and inches", "kg-stlb": "kg to stone and pounds", "st-kg": "Stone to kg",
  "lb-kg": "Pounds to kg", "c-f": "Celsius to Fahrenheit", "f-c": "Fahrenheit to Celsius", "km-mi": "Kilometres to miles",
  "mi-km": "Miles to kilometres", "in-cm": "Inches to cm", "cm-in": "cm to inches", "m-ft": "Metres to feet", "ft-m": "Feet to metres"
};

function hub() {
  const url = SITE + "/convert/";
  const title = "Unit Conversions — Height, Weight, Temperature & Distance Charts";
  const desc = "Look up a single conversion: heights in feet and inches or cm, body weight in kg, stone or pounds, °C and °F, km and miles, inches and cm.";
  const sections = Object.keys(KINDS).map((k) => `      <p class="salary-links-title">${esc(GROUP_TITLES[k])}</p>
      <p class="salary-links">${KINDS[k].values.map((v) => `<a href="${href(k, v)}">${esc(KINDS[k].label(v))}</a>`).join(" ")}</p>`).join("\n");
  const ld = [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], ["Unit Converter", SITE + "/unit-converter/"], ["Conversions", url]])];
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="/unit-converter/">← Unit converter</a>
      <h1 class="page-title">Unit conversions</h1>
      <p class="page-subtitle">Pick a value for the answer, the working and nearby values — or use the <a href="/unit-converter/">unit converter</a> for anything else.</p>
    </header>

    <main class="tool">
${sections}
    </main>

${site.FOOTER}
  </div>
</body>
</html>
`;
}

function converterBlock() {
  const file = path.join(site.ROOT, "unit-converter/index.html");
  const START = "    <!-- conversion pages: generated by tools/build-conversion-pages.js -->\n";
  const END = "    <!-- end conversion pages -->\n";
  let s = fs.readFileSync(file, "utf8");
  if (s.includes(START)) s = s.slice(0, s.indexOf(START)) + s.slice(s.indexOf(END) + END.length).replace(/^\n/, "");
  const pick = { "ftin-cm": [60, 64, 66, 68, 70, 72], "kg-stlb": [50, 60, 70, 80, 90, 100], "c-f": [-10, 0, 20, 37, 100, 180, 200], "f-c": [32, 70, 98, 350, 400], "km-mi": [5, 10, 21.1, 42.2, 100], "cm-ftin": [160, 170, 180] };
  const html = `    <main class="tool">
      <h2 class="tool-section-title">Popular conversions</h2>
      <p class="salary-links">${Object.keys(pick).map((k) => pick[k].filter((v) => has(k, v)).map((v) => `<a href="${href(k, v)}">${esc(KINDS[k].label(v))} → ${esc(KINDS[k].answer(v))}</a>`).join(" ")).join(" ")} <a href="/convert/">All conversions →</a></p>
    </main>

`;
  const at = s.indexOf("    <!-- related calculators: generated by tools/related.js -->");
  s = s.slice(0, at) + START + html + END + "\n" + s.slice(at);
  fs.writeFileSync(file, s);
}

const urls = [["/convert/", "0.6"]];
let count = 0;
Object.keys(KINDS).forEach((k) => KINDS[k].values.forEach((v) => {
  site.write(href(k, v).replace(/^\/|\/$/g, ""), page(k, v));
  urls.push([href(k, v), "0.5"]);
  count++;
}));
site.write("convert", hub());
converterBlock();
const pruned = site.prune("convert", /-to-|-in-/);
site.sitemapBlock("conversion pages", "tools/build-conversion-pages.js", urls);
console.log(`built ${count} conversion pages and the hub; ${pruned} removed`);
