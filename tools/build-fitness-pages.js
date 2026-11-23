#!/usr/bin/env node
/* Fitness calculators, each from a published formula or reference value:

       /heart-rate-zones/  /heart-rate-zones/age-40/   CDC: max ≈ 220 − age; moderate 64–76%, vigorous 77–93%
       /body-fat-calculator/                           US Navy circumference method (Hodgdon & Beckett, 1984)
       /one-rep-max/                                   Epley and Brzycki estimates
       /protein-calculator/ /protein-calculator/70kg/  UK Reference Nutrient Intake, 0.75 g per kg (British Nutrition Foundation)

       node tools/build-fitness-pages.js

   The figures sit in FIT below with their sources, which every page cites. */
const site = require("./lib/site.js");
const related = require("./related.js");
const { esc, SITE } = site;

const FIT = {
  hr: { base: 220, moderate: [64, 76], vigorous: [77, 93] },
  navy: { men: [86.010, 70.041, 36.76], women: [163.205, 97.684, 78.387] },
  protein: { perKg: 0.75, pregnancy: 6, lactation: [11, 8], older: [1, 1.2] }
};
const SRC = {
  cdc: ["CDC — Target heart rate and estimated maximum heart rate", "https://www.cdc.gov/physicalactivity/basics/measuring/heartrate.htm"],
  navy: ["Hodgdon & Beckett — Prediction of percent body fat for U.S. Navy women from body circumferences and height (Naval Health Research Center, 1984)", "https://apps.dtic.mil/sti/html/tr/ADA146456/index.html"],
  navy2: ["LibreTexts — The U.S. Navy body fat estimation formula", "https://med.libretexts.org/Courses/Irvine_Valley_College/Physiology_Labs_at_Home/03:_Anthropometrics/3.02:_Part_B-_Circumference_Measures/3.2.04:_Part_B4-_The_U.S._Navy_body_fat_estimation_formula"],
  orm: ["One-repetition maximum (Epley and Brzycki formulas)", "https://en.wikipedia.org/wiki/One-repetition_maximum"],
  bnf: ["British Nutrition Foundation — Nutrition requirements", "https://www.nutrition.org.uk/media/nmmewdug/nutrition-requirements.pdf"],
  bhf: ["British Heart Foundation — Protein: how much do you need?", "https://www.bhf.org.uk/informationsupport/heart-matters-magazine/nutrition/ask-the-expert/how-much-protein"]
};
const src = (...keys) => keys.map((k) => `<a href="${SRC[k][1]}" rel="nofollow noopener" target="_blank">${esc(SRC[k][0])}</a>`).join("; ");
const n1 = (v, d) => v.toLocaleString("en-GB", { maximumFractionDigits: d === undefined ? 1 : d });
const row = (label, id, value, cls) => `          <div class="result-row${cls ? " " + cls : ""}"><span class="r-label">${label}</span><span class="r-value" id="${id}">${value}</span></div>`;
const fld = (id, label, value, extra) => `        <div class="field"><label for="${id}">${label}</label><input type="number" id="${id}" value="${value}" min="0" step="any" inputmode="decimal"${extra || ""}></div>`;

/* formulas, shared with fitness.js through data attributes */
const maxHr = (age) => FIT.hr.base - age;
const zone = (age, [a, b]) => [Math.round(maxHr(age) * a / 100), Math.round(maxHr(age) * b / 100)];
const navy = (sex, h, waist, neck, hip) => sex === "m"
  ? FIT.navy.men[0] * Math.log10(waist - neck) - FIT.navy.men[1] * Math.log10(h) + FIT.navy.men[2]
  : FIT.navy.women[0] * Math.log10(waist + hip - neck) - FIT.navy.women[1] * Math.log10(h) - FIT.navy.women[2];
const epley = (w, r) => r === 1 ? w : w * (1 + r / 30), brzycki = (w, r) => w * 36 / (37 - r);
/* checks: CDC's example (50-year-old: max 170); Epley/Brzycki textbook values */
if (maxHr(50) !== 170 || Math.round(epley(100, 10)) !== 133 || Math.round(brzycki(100, 10)) !== 133) throw new Error("fitness formulas");

function page(o) {
  const url = SITE + o.path;
  const ld = [site.webPage(o.title, o.desc, url), site.breadcrumb(o.crumbs.map(([n, u]) => [n, SITE + u]).concat([[o.crumb, url]]))];
  if (o.app) ld.push({ "@context": "https://schema.org", "@type": "WebApplication", name: o.app, url, applicationCategory: "HealthApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } });
  ld.push(site.faqLd(o.q));
  return site.head({ title: o.title, desc: o.desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="${o.back[0]}">← ${esc(o.back[1])}</a>
      <h1 class="page-title">${esc(o.h1)}</h1>
      <p class="page-subtitle">${o.sub}</p>
    </header>

${o.body}    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(o.q)}      <p class="tool-hint" style="margin-top:12px;">An estimate for general information, not medical advice. Source: ${o.sources}.</p>
    </main>

${o.related ? related.block(o.path) : `    <main class="tool">
      <h2 class="tool-section-title">${esc(o.moreTitle)}</h2>
      <p class="salary-links">${o.more}</p>
    </main>
`}
${site.FOOTER}
  </div>
  <script src="/fitness.js"></script>
</body>
</html>
`;
}

// ---------------------------------------------------------------- heart rate

const HB = "/heart-rate-zones/", AGES = [20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80];
const hrTool = (age) => `    <main class="tool" id="hr-zones" data-hr='${JSON.stringify(FIT.hr)}'>
      <div class="field" style="max-width:200px;"><label for="hz-age">Age</label><input type="number" id="hz-age" value="${age}" min="1" max="110" step="1" inputmode="numeric"></div>
      <div class="result-box" aria-live="polite">
        <div class="result-grid">
${row("Estimated maximum heart rate", "hz-max", `${maxHr(age)} bpm`)}
${row(`Moderate intensity (${FIT.hr.moderate.join("–")}%)`, "hz-mod", `${zone(age, FIT.hr.moderate).join("–")} bpm`, "highlight")}
${row(`Vigorous intensity (${FIT.hr.vigorous.join("–")}%)`, "hz-vig", `${zone(age, FIT.hr.vigorous).join("–")} bpm`, "highlight")}
        </div>
      </div>
      <p class="tool-hint" style="margin-top:12px;">Maximum heart rate estimated as 220 minus your age, with the CDC's target ranges. Some medicines, such as beta blockers, lower heart rate — ask your doctor what's right for you.</p>
    </main>
`;
function hrHub() {
  const q = [
    ["How do I work out my maximum heart rate?", `The usual estimate is 220 minus your age: ${maxHr(40)} beats a minute at 40, ${maxHr(50)} at 50. It's an average — your own maximum can be higher or lower.`],
    ["What is my target heart rate for exercise?", `The CDC gives ${FIT.hr.moderate.join("–")}% of your maximum for moderate-intensity exercise and ${FIT.hr.vigorous.join("–")}% for vigorous. At 50 that's ${zone(50, FIT.hr.moderate).join("–")} bpm for moderate and ${zone(50, FIT.hr.vigorous).join("–")} bpm for vigorous.`],
    ["How do I check my heart rate?", "Count your pulse at the wrist or neck for 30 seconds and double it, or use a heart rate monitor or watch."]
  ];
  return page({ path: HB, app: "Heart Rate Zones Calculator", crumbs: [["Home", "/"]], crumb: "Heart Rate Zones", back: ["/", "All calculators"], related: true, sources: src("cdc"),
    title: "Target Heart Rate Calculator — Heart Rate Zones by Age",
    desc: `Your estimated maximum heart rate and target heart rate for moderate and vigorous exercise, by age, using the CDC's ranges. At 40: ${zone(40, FIT.hr.moderate).join("–")} bpm moderate, ${zone(40, FIT.hr.vigorous).join("–")} bpm vigorous.`,
    h1: "Target heart rate calculator", sub: "Your estimated maximum heart rate and the target ranges for moderate and vigorous exercise.", q,
    body: hrTool(40) + `    <main class="tool">
      <h2 class="tool-section-title">Target heart rate by age</h2>
${site.table(["Age", "Maximum", "Moderate", "Vigorous"], AGES.map((a) => [`<a href="${HB}age-${a}/">${a}</a>`, `${maxHr(a)} bpm`, `${zone(a, FIT.hr.moderate).join("–")} bpm`, `${zone(a, FIT.hr.vigorous).join("–")} bpm`]), 420)}    </main>
` });
}
function hrAge(age) {
  const q = [
    [`What is the maximum heart rate for a ${age}-year-old?`, `About ${maxHr(age)} beats a minute: 220 − ${age} = ${maxHr(age)}.`],
    [`What is a good target heart rate at ${age}?`, `${zone(age, FIT.hr.moderate).join("–")} bpm for moderate-intensity exercise (${FIT.hr.moderate.join("–")}% of maximum) and ${zone(age, FIT.hr.vigorous).join("–")} bpm for vigorous (${FIT.hr.vigorous.join("–")}%), using the CDC's ranges.`]
  ];
  return page({ path: `${HB}age-${age}/`, crumbs: [["Home", "/"], ["Heart Rate Zones", HB]], crumb: `Age ${age}`, back: [HB, "Target heart rate calculator"], sources: src("cdc"),
    title: `Target Heart Rate for a ${age} Year Old — Max ${maxHr(age)} bpm`,
    desc: `At ${age}, estimated maximum heart rate is ${maxHr(age)} bpm. Target: ${zone(age, FIT.hr.moderate).join("–")} bpm for moderate exercise, ${zone(age, FIT.hr.vigorous).join("–")} bpm for vigorous (CDC ranges).`,
    h1: `Target heart rate at ${age}`, sub: `Estimated maximum <strong>${maxHr(age)} bpm</strong> — moderate exercise ${zone(age, FIT.hr.moderate).join("–")} bpm, vigorous ${zone(age, FIT.hr.vigorous).join("–")} bpm.`, q,
    body: hrTool(age), moreTitle: "Other ages", more: AGES.filter((a) => a !== age).map((a) => `<a href="${HB}age-${a}/">Age ${a}</a>`).join(" ") });
}

// ---------------------------------------------------------------- body fat

function bodyFat() {
  const ex = navy("m", 70, 34, 15);
  const q = [
    ["How does the US Navy body fat method work?", "It estimates body fat from tape measurements: neck and waist (and hips for women) and height, using equations published by the Naval Health Research Center (Hodgdon and Beckett, 1984). Measurements go into the formula in inches; the calculator converts centimetres for you."],
    ["Where do I measure?", "Neck just below the larynx; waist at the navel for men, at the narrowest point for women; hips at the widest point. Keep the tape flat and snug without squeezing, and measure two or three times."],
    ["How accurate is it?", "It's an estimate from a few measurements — useful for tracking change over time with the same method, less so as an exact figure for one person."],
    ["What does an example give?", `A man 5 ft 10 in (70 in) tall with a 34 in waist and 15 in neck comes out at about ${n1(ex)}% body fat.`]
  ];
  return page({ path: "/body-fat-calculator/", app: "Body Fat Calculator", crumbs: [["Home", "/"]], crumb: "Body Fat Calculator", back: ["/", "All calculators"], related: true, sources: src("navy", "navy2"),
    title: "Body Fat Calculator — US Navy Tape Measure Method",
    desc: "Estimate your body fat percentage from your height, neck, waist and hip measurements with the US Navy formula, in centimetres or inches — plus fat and lean mass.",
    h1: "Body fat calculator", sub: "Your estimated body fat percentage from a few tape measurements (US Navy method).", q,
    body: `    <main class="tool" id="bf-tool" data-navy='${JSON.stringify(FIT.navy)}'>
      <div class="field-row">
        <div class="field"><label for="bf-sex">Sex</label><select id="bf-sex"><option value="m" selected>Male</option><option value="f">Female</option></select></div>
        <div class="field"><label for="bf-unit">Measurements in</label><select id="bf-unit"><option value="cm" selected>Centimetres</option><option value="in">Inches</option></select></div>
      </div>
      <div class="field-row">
${fld("bf-h", "Height", 178)}
${fld("bf-neck", "Neck", 38)}
      </div>
      <div class="field-row">
${fld("bf-waist", "Waist", 86)}
${fld("bf-hip", "Hips (women)", 100)}
      </div>
${fld("bf-wt", "Weight in kg (optional, for fat and lean mass)", "")}
      <div class="result-box" aria-live="polite">
        <div class="result-hero"><div class="value" id="bf-pct">—</div><div class="label">estimated body fat</div></div>
        <div class="result-grid">
${row("Fat mass", "bf-fat", "—")}
${row("Lean mass", "bf-lean", "—")}
        </div>
      </div>
    </main>
` });
}

// ---------------------------------------------------------------- one rep max

function oneRep() {
  const q = [
    ["How do I estimate my one rep max?", "Lift a weight you can do for a few clean reps, then use a formula: Epley's is weight × (1 + reps ÷ 30), Brzycki's is weight × 36 ÷ (37 − reps). 100 kg for 5 reps gives about 117 kg (Epley) or 113 kg (Brzycki)."],
    ["Which formula is more accurate?", "Both are estimates and are closest at low reps — roughly up to 10. Beyond that they drift apart; testing your actual one rep max (safely, with a spotter) is the only way to know it."],
    ["How do I use the percentages?", "Training plans often give loads as a percentage of your one rep max. The table shows the weight for each percentage, and roughly how many reps that load allows by Epley's formula."]
  ];
  return page({ path: "/one-rep-max/", app: "One Rep Max Calculator", crumbs: [["Home", "/"]], crumb: "One Rep Max Calculator", back: ["/", "All calculators"], related: true, sources: src("orm"),
    title: "One Rep Max Calculator (1RM) — Epley & Brzycki Formulas",
    desc: "Estimate your one rep max from the weight and reps you can lift, with the Epley and Brzycki formulas, and a table of training weights by percentage of your 1RM.",
    h1: "One rep max calculator", sub: "Your estimated one rep max from any set — and the weights for each percentage of it.", q,
    body: `    <main class="tool" id="orm-tool">
      <div class="field-row">
${fld("orm-w", "Weight lifted", 100)}
${fld("orm-r", "Reps", 5, ' step="1" max="20"')}
      </div>
      <div class="result-box" aria-live="polite">
        <div class="result-hero"><div class="value" id="orm-1">${n1(epley(100, 5))}</div><div class="label">estimated one rep max (Epley)</div></div>
        <div class="result-grid">
${row("Brzycki estimate", "orm-b", n1(brzycki(100, 5)))}
${row("Average of the two", "orm-avg", n1((epley(100, 5) + brzycki(100, 5)) / 2))}
        </div>
      </div>
      <div class="table-scroll" style="margin-top:12px;"><div style="min-width:300px;"><table class="out-table"><thead><tr><th>% of 1RM</th><th>Weight</th><th>Reps (approx.)</th></tr></thead><tbody id="orm-table"></tbody></table></div></div>
    </main>
` });
}

// ---------------------------------------------------------------- protein

const PB = "/protein-calculator/", WEIGHTS = [50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100, 110, 120];
const protTool = (kg) => `    <main class="tool" id="pr-tool" data-p='${JSON.stringify(FIT.protein)}'>
      <div class="field-row">
${fld("pr-kg", "Body weight (kg)", kg)}
        <div class="field"><label for="pr-who">Situation</label><select id="pr-who"><option value="adult" selected>Adult</option><option value="preg">Pregnant</option><option value="bf1">Breastfeeding, first 6 months</option><option value="bf2">Breastfeeding, after 6 months</option><option value="older">Aged 65 or over</option></select></div>
      </div>
      <div class="result-box" aria-live="polite">
        <div class="result-hero"><div class="value" id="pr-g">${n1(kg * FIT.protein.perKg)} g</div><div class="label" id="pr-label">protein a day</div></div>
      </div>
      <p class="tool-hint" style="margin-top:12px;">The UK Reference Nutrient Intake is ${FIT.protein.perKg} g per kg of body weight a day — enough for nearly everyone — plus ${FIT.protein.pregnancy} g in pregnancy and ${FIT.protein.lactation[0]} g (${FIT.protein.lactation[1]} g after six months) when breastfeeding. For people over 65 the British Heart Foundation suggests ${FIT.protein.older.join("–")} g per kg.</p>
    </main>
`;
function protHub() {
  const q = [
    ["How much protein do I need a day?", `The UK Reference Nutrient Intake for adults is ${FIT.protein.perKg} g per kg of body weight: ${n1(60 * FIT.protein.perKg)} g for a 60 kg adult, ${n1(80 * FIT.protein.perKg)} g at 80 kg. It's set to cover the needs of nearly all adults.`],
    ["Do I need more if I exercise?", "Possibly — the British Heart Foundation says people who are more active may need more than the reference intake, which is set for the general population. For sports targets, ask a dietitian or your coach."],
    ["How much protein in pregnancy?", `An extra ${FIT.protein.pregnancy} g a day on top of the adult figure, and an extra ${FIT.protein.lactation[0]} g a day while breastfeeding in the first six months (${FIT.protein.lactation[1]} g after).`]
  ];
  return page({ path: PB, app: "Protein Calculator", crumbs: [["Home", "/"]], crumb: "Protein Calculator", back: ["/", "All calculators"], related: true, sources: src("bnf", "bhf"),
    title: "Protein Calculator — How Much Protein Do I Need a Day?",
    desc: `How much protein you need a day from your weight, using the UK Reference Nutrient Intake of ${FIT.protein.perKg} g per kg — with pregnancy, breastfeeding and over-65 figures.`,
    h1: "Protein calculator", sub: "How much protein you need a day, from your body weight.", q,
    body: protTool(70) + `    <main class="tool">
      <h2 class="tool-section-title">Protein by body weight</h2>
${site.table(["Body weight", "Protein a day"], WEIGHTS.map((w) => [`<a href="${PB}${w}kg/">${w} kg</a>`, `${n1(w * FIT.protein.perKg)} g`]), 280)}    </main>
` });
}
function protKg(kg) {
  const g = kg * FIT.protein.perKg;
  const q = [
    [`How much protein do I need at ${kg} kg?`, `${n1(g)} g a day: ${kg} × ${FIT.protein.perKg} g, the UK Reference Nutrient Intake for adults.`],
    [`How much protein at ${kg} kg if I'm over 65?`, `${n1(kg * FIT.protein.older[0])}–${n1(kg * FIT.protein.older[1])} g a day, at the ${FIT.protein.older.join("–")} g per kg the British Heart Foundation suggests for older adults.`],
    [`What about ${kg} kg and pregnant?`, `${n1(g + FIT.protein.pregnancy)} g a day — the adult figure plus ${FIT.protein.pregnancy} g.`]
  ];
  return page({ path: `${PB}${kg}kg/`, crumbs: [["Home", "/"], ["Protein Calculator", PB]], crumb: `${kg} kg`, back: [PB, "Protein calculator"], sources: src("bnf", "bhf"),
    title: `How Much Protein Do I Need at ${kg}kg? ${n1(g)}g a Day`,
    desc: `At ${kg} kg, the UK Reference Nutrient Intake is ${n1(g)} g of protein a day (${FIT.protein.perKg} g per kg) — with figures for pregnancy, breastfeeding and over-65s.`,
    h1: `Protein for ${kg} kg`, sub: `At ${kg} kg you need about <strong>${n1(g)} g</strong> of protein a day.`, q,
    body: protTool(kg), moreTitle: "Other weights", more: WEIGHTS.filter((w) => w !== kg).map((w) => `<a href="${PB}${w}kg/">${w} kg</a>`).join(" ") });
}

// ---------------------------------------------------------------- write

const urls = [];
const put = (url, html, pri) => { site.write(url.replace(/^\/|\/$/g, ""), html); if (pri) urls.push([url, pri]); };
put(HB, hrHub()); AGES.forEach((a) => put(`${HB}age-${a}/`, hrAge(a), "0.5")); site.prune("heart-rate-zones", /^age-\d+$/);
put("/body-fat-calculator/", bodyFat());
put("/one-rep-max/", oneRep());
put(PB, protHub()); WEIGHTS.forEach((w) => put(`${PB}${w}kg/`, protKg(w), "0.5")); site.prune("protein-calculator", /^\d+kg$/);
site.sitemapBlock("fitness pages", "tools/build-fitness-pages.js", urls);
console.log(`built the heart rate, body fat, one rep max and protein calculators and ${urls.length} pages`);
