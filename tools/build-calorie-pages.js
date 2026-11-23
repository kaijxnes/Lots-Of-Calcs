#!/usr/bin/env node
/* Calorie calculator and "how long to lose" pages:

       /calorie-calculator/                  calculator
       /calorie-calculator/lose-10kg/        how long losing 10 kg takes
       /calorie-calculator/lose-2-stone/
       /calorie-calculator/lose-20lb/

       node tools/build-calorie-pages.js

   The sums are in calories.js (Mifflin-St Jeor, FAO/WHO/UNU activity
   levels, NHS weight loss advice), the same module the calculator runs. */
const site = require("./lib/site.js");
const related = require("./related.js");
const C = require("../calories.js");
const { esc, SITE } = site;

const BASE = "/calorie-calculator/";
const GOALS = [].concat(
  [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20, 25, 30, 40, 50].map((v) => ({ v, unit: "kg" })),
  [1, 2, 3, 4, 5, 6, 8, 10].map((v) => ({ v, unit: "stone" })),
  [5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 100].map((v) => ({ v, unit: "lb" }))
);
const kgOf = (g) => (g.unit === "kg" ? g.v : g.unit === "lb" ? g.v * C.LB : g.v * 14 * C.LB);
const slugOf = (g) => `lose-${g.v}${g.unit === "stone" ? "-stone" : g.unit}`;
const label = (g) => (g.unit === "stone" ? `${g.v} stone` : `${g.v}${g.unit === "kg" ? " kg" : " lb"}`);
const labelT = (g) => (g.unit === "stone" ? `${g.v} Stone` : `${g.v}${g.unit}`);
const other = (g) => { const kg = kgOf(g); return g.unit === "kg" ? `${C.n1(kg / C.LB)} lb, or ${C.stone(kg)}` : `${C.n1(kg)} kg`; };
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const longDate = (d) => `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
const NEW_YEAR = new Date(Date.UTC(+site.TODAY.slice(0, 4) + 1, 0, 1));
const addWeeks = (d, w) => new Date(d.getTime() + Math.round(w * 7) * 86400000);

const NHS_RATE = "The NHS advises aiming to lose 0.5 to 1 kg (1 to 2 lb) a week, and cutting around 600 calories a day from what you need to stay the same weight.";
const RULE = "Time from calories uses the usual rule of thumb that about 7,700 calories make up 1 kg of body fat (3,500 per lb). In practice weight loss slows over time, as a lighter body burns fewer calories, so long goals take longer than this.";
const VLCD = "Diets of 800 calories a day or less are very low calorie diets; NICE and the NHS advise them only with medical supervision.";

/* Example used for the starting figures and the hub table */
const EX = { sex: "f", age: 35, cm: 165, kg: 75, goal: 68, act: "light" };

function tool() {
  const keep = C.maintain(EX.sex, EX.kg, EX.cm, EX.age, EX.act), lose = keep - C.DEFICIT;
  const h = C.healthy(EX.cm), drop = EX.kg - EX.goal, w = C.weeks(drop), nhs = C.nhsWeeks(drop);
  const ft = Math.floor(EX.cm / C.IN / 12), inch = Math.round(EX.cm / C.IN - ft * 12);
  const st = (kg) => { const lb = kg / C.LB; const s = Math.floor(lb / 14); return [s, Math.round(lb - s * 14)]; };
  const [wst, wlb] = st(EX.kg), [gst, glb] = st(EX.goal);
  return `    <main class="tool" id="cal-tool">
      <div class="field-row">
        <div class="field"><label for="cal-sex">Sex</label><select id="cal-sex"><option value="f" selected>Female</option><option value="m">Male</option></select></div>
        <div class="field"><label for="cal-age">Age</label><input type="number" id="cal-age" value="${EX.age}" min="18" max="100" step="1" inputmode="numeric"></div>
        <div class="field"><label for="cal-units">Units</label><select id="cal-units"><option value="metric" selected>cm and kg</option><option value="imperial">ft and stone</option></select></div>
      </div>
      <div class="field-row" id="cal-metric-h">
        <div class="field"><label for="cal-cm">Height (cm)</label><input type="number" id="cal-cm" value="${EX.cm}" min="0" step="any" inputmode="decimal"></div>
      </div>
      <div class="field-row" id="cal-imp-h" style="display:none;">
        <div class="field"><label for="cal-ft">Height (ft)</label><input type="number" id="cal-ft" value="${ft}" min="0" step="1" inputmode="numeric"></div>
        <div class="field"><label for="cal-in">(in)</label><input type="number" id="cal-in" value="${inch}" min="0" step="any" inputmode="decimal"></div>
      </div>
      <div class="field-row" id="cal-metric-w">
        <div class="field"><label for="cal-kg">Weight (kg)</label><input type="number" id="cal-kg" value="${EX.kg}" min="0" step="any" inputmode="decimal"></div>
      </div>
      <div class="field-row" id="cal-imp-w" style="display:none;">
        <div class="field"><label for="cal-st">Weight (st)</label><input type="number" id="cal-st" value="${wst}" min="0" step="1" inputmode="numeric"></div>
        <div class="field"><label for="cal-lb">(lb)</label><input type="number" id="cal-lb" value="${wlb}" min="0" step="any" inputmode="decimal"></div>
      </div>
      <div class="field"><label for="cal-act">How active you are</label><select id="cal-act">${C.LEVELS.map((l) => `<option value="${l.key}"${l.key === EX.act ? " selected" : ""}>${esc(l.name)} — ${esc(l.note)}</option>`).join("")}</select></div>
      <div class="field-row" id="cal-metric-g">
        <div class="field"><label for="cal-goal">Goal weight (kg, optional)</label><input type="number" id="cal-goal" value="${EX.goal}" min="0" step="any" inputmode="decimal"></div>
      </div>
      <div class="field-row" id="cal-imp-g" style="display:none;">
        <div class="field"><label for="cal-gst">Goal (st, optional)</label><input type="number" id="cal-gst" value="${gst}" min="0" step="1" inputmode="numeric"></div>
        <div class="field"><label for="cal-glb">(lb)</label><input type="number" id="cal-glb" value="${glb}" min="0" step="any" inputmode="decimal"></div>
      </div>
      <p class="tool-hint" id="cal-error" role="alert" style="color: var(--bad); display: none;"></p>
      <div class="result-box" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="cal-keep">${C.n0(C.r10(keep))}</div>
          <div class="label">calories a day to stay the same weight</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row highlight"><span class="r-label">To lose weight (600 fewer)</span><span class="r-value" id="cal-lose">${C.n0(C.r10(lose))} kcal a day</span></div>
          <div class="result-row"><span class="r-label">At rest (Mifflin–St Jeor)</span><span class="r-value" id="cal-bmr">${C.n0(C.r10(C.bmr(EX.sex, EX.kg, EX.cm, EX.age)))} kcal a day</span></div>
          <div class="result-row"><span class="r-label">BMI</span><span class="r-value" id="cal-bmi" style="text-align:right;">${C.n1(C.bmi(EX.kg, EX.cm))} — healthy weight for your height is ${C.n1(h[0])}–${C.n1(h[1])} kg (${C.stone(h[0])} to ${C.stone(h[1])})</span></div>
          <div class="result-row"><span class="r-label">To lose</span><span class="r-value" id="cal-drop">${C.n1(drop)} kg (${C.n1(drop / C.LB)} lb)</span></div>
          <div class="result-row"><span class="r-label">Time at 600 fewer calories</span><span class="r-value" id="cal-time">${C.span(w)}</span></div>
          <div class="result-row"><span class="r-label">NHS safe rate</span><span class="r-value" id="cal-nhs">${Math.round(nhs[0])} to ${Math.round(nhs[1])} weeks at 0.5–1 kg a week</span></div>
        </div>
      </div>
      <p class="tool-hint" id="cal-warn" role="alert" style="color: var(--bad); display: none;"></p>
      <p class="tool-hint" style="margin-top:12px;">An estimate for healthy adults: needs vary from person to person, and these equations aren't meant for pregnancy, breastfeeding or under-18s. If you have a medical condition, check with your GP before changing your diet.</p>
    </main>
`;
}

function losePage(g) {
  const kg = kgOf(g), url = SITE + `${BASE}${slugOf(g)}/`;
  const nhs = C.nhsWeeks(kg), w = C.weeks(kg);
  const lo = Math.round(nhs[0]), hi = Math.round(nhs[1]);
  const title = `How Long Does It Take to Lose ${labelT(g)}? — ${lo === hi ? lo : `${lo} to ${hi}`} Weeks`;
  const desc = `At the NHS's advised rate of 0.5 to 1 kg a week, losing ${label(g)} (${other(g)}) takes ${lo} to ${hi} weeks. Eating 600 calories a day less than you need works out at about ${C.span(w)}.`;
  const rateRows = [0.25, 0.5, 0.75, 1].map((r) => [`${r} kg (${C.n1(r / C.LB)} lb) a week${r === 0.5 || r === 1 ? " — NHS range" : ""}`, C.span(kg / r)]);
  const defRows = [300, 500, 600, 750, 1000].map((d) => [`${d.toLocaleString("en-GB")} fewer calories a day${d === 600 ? " (NHS advice)" : ""}`, `${C.n1(d * 7 / C.KCAL_PER_KG)} kg a week`, C.span(C.weeks(kg, d))]);
  const doneBy = addWeeks(NEW_YEAR, w), doneLo = addWeeks(NEW_YEAR, nhs[0]), doneHi = addWeeks(NEW_YEAR, nhs[1]);
  const q = [
    [`How long does it take to lose ${label(g)}?`, `${lo} to ${hi} weeks at the NHS's advised 0.5 to 1 kg a week. ${label(g)} is ${other(g)}. Cutting around 600 calories a day — the NHS's suggestion — loses about ${C.n1(600 * 7 / C.KCAL_PER_KG)} kg a week, so about ${C.span(w)}.`],
    [`If I start on 1 January, when will I have lost ${label(g)}?`, `At 600 fewer calories a day, around ${longDate(doneBy)}; at 0.5 to 1 kg a week, between ${longDate(doneLo)} and ${longDate(doneHi)}.`],
    ["How many calories should I eat to lose weight?", "Work out what you need to stay the same weight — the calculator above does this from your age, height, weight and how active you are — and eat about 600 calories a day less. The NHS's 12-week plan gives most men 1,900 and most women 1,400 calories a day."],
    ["Can I lose it faster?", `${NHS_RATE} Losing weight much faster usually means eating too little to get the nutrients you need, and it's harder to keep off. ${VLCD}`],
    ["Why does weight loss slow down?", RULE]
  ];
  const ld = [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], ["Calorie Calculator", SITE + BASE], [`Lose ${label(g)}`, url]]), site.faqLd(q)];
  const same = GOALS.filter((x) => x.unit === g.unit && x !== g).map((x) => `<a href="${BASE}${slugOf(x)}/">${label(x)}</a>`).join(" ");
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="${BASE}">← Calorie calculator</a>
      <h1 class="page-title">How long does it take to lose ${esc(label(g))}?</h1>
      <p class="page-subtitle">${lo} to ${hi} weeks at the NHS's advised rate of 0.5 to 1 kg a week. ${esc(label(g))} is ${esc(other(g))}.</p>
    </header>

    <main class="tool">
      <div class="result-box">
        <div class="result-hero">
          <div class="value">${lo === hi ? lo : `${lo}–${hi}`} weeks</div>
          <div class="label">to lose ${esc(label(g))} at 0.5–1 kg a week</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row highlight"><span class="r-label">At 600 fewer calories a day</span><span class="r-value">${esc(C.span(w))}</span></div>
          <div class="result-row"><span class="r-label">Starting 1 January ${NEW_YEAR.getUTCFullYear()}</span><span class="r-value">around ${longDate(doneBy)}</span></div>
          <div class="result-row"><span class="r-label">Calories to cut in total</span><span class="r-value">about ${C.n0(Math.round(kg * C.KCAL_PER_KG / 1000) * 1000)}</span></div>
        </div>
      </div>
      <p class="tool-hint" style="margin-top:12px;">Work out the calories you need, and a date for your own goal weight, with the <a href="${BASE}">calorie calculator</a>.</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">By how fast you lose it</h2>
${site.table(["Rate", "Time"], rateRows, 340)}      <h2 class="tool-section-title" style="margin-top:22px;">By how many calories you cut</h2>
${site.table(["Eating", "Loss", "Time"], defRows, 420)}      <p class="tool-hint" style="margin-top:12px;">${esc(NHS_RATE)} ${esc(RULE)}</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}    </main>

    <div class="hub-group-title" style="margin-top:28px;">Other goals</div>
    <p class="salary-links">${same}</p>

${site.FOOTER}
  </div>
</body>
</html>
`;
}

function hub() {
  const url = SITE + BASE;
  const title = "Calorie Calculator — How Many Calories to Eat to Lose Weight";
  const keepF = C.maintain("f", EX.kg, EX.cm, EX.age, EX.act);
  const desc = `Work out the calories you need a day to stay the same weight and to lose weight, and how long your goal will take. Uses the Mifflin–St Jeor equation and the NHS's advice to cut around 600 calories a day.`;
  const exF = { sex: "f", age: 35, cm: 165, kg: 70 }, exM = { sex: "m", age: 35, cm: 178, kg: 85 };
  const actRows = C.LEVELS.map((l) => [`${esc(l.name)}<br><span class="tool-hint">${esc(l.note)}</span>`, C.n0(C.r10(C.maintain(exF.sex, exF.kg, exF.cm, exF.age, l.key))), C.n0(C.r10(C.maintain(exM.sex, exM.kg, exM.cm, exM.age, l.key)))]);
  const q = [
    ["How many calories should I eat to lose weight?", `About 600 fewer than you need to stay the same weight, as the NHS advises. For a 35-year-old woman who is 165 cm, 75 kg and lightly active that's about ${C.n0(C.r10(keepF - 600))} a day (from ${C.n0(C.r10(keepF))}). The NHS 12-week weight loss plan gives most men 1,900 and most women 1,400 calories a day.`],
    ["How many calories do I need a day?", "On average about 2,000 for women and 2,500 for men (NHS), but it depends on your size, age and how active you are — the calculator works out an estimate for you."],
    ["How is it worked out?", "Resting energy comes from the Mifflin–St Jeor equation: 10 × weight in kg + 6.25 × height in cm − 5 × age, plus 5 for men or minus 161 for women. That's multiplied by a physical activity level from the FAO/WHO/UNU report on human energy requirements: 1.40–1.69 for a sedentary or light lifestyle, 1.70–1.99 active, 2.00–2.40 vigorous."],
    ["How fast should I lose weight?", `${NHS_RATE} ${VLCD}`],
    ["How accurate is it?", "In studies comparing the common equations with measured resting energy, Mifflin–St Jeor was the most likely to come within 10% — but some people's needs are still higher or lower. Track your weight for a few weeks and adjust: if you aren't losing at about the rate expected, eat a little less or move a little more."]
  ];
  const ld = [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], ["Calorie Calculator", url]]),
    { "@context": "https://schema.org", "@type": "WebApplication", name: "Calorie Calculator", url, applicationCategory: "HealthApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } }, site.faqLd(q)];
  const groups = ["kg", "stone", "lb"].map((u) => `      <p class="salary-links-title">${u === "kg" ? "Kilograms" : u === "stone" ? "Stone" : "Pounds"}</p>
      <p class="salary-links">${GOALS.filter((x) => x.unit === u).map((x) => `<a href="${BASE}${slugOf(x)}/">Lose ${label(x)}</a>`).join(" ")}</p>`).join("\n");
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="/">← All calculators</a>
      <h1 class="page-title">Calorie calculator</h1>
      <p class="page-subtitle">The calories you need a day — to stay the same weight and to lose weight — and how long your goal will take.</p>
    </header>

${tool()}
    <main class="tool">
      <h2 class="tool-section-title">Calories a day to stay the same weight, by activity</h2>
${site.table(["How active", "Woman, 35, 165 cm, 70 kg", "Man, 35, 178 cm, 85 kg"], actRows, 460)}      <p class="tool-hint" style="margin-top:12px;">Examples only — put in your own figures above. Take off about 600 for weight loss.</p>
      <h2 class="tool-section-title" style="margin-top:22px;">How long does it take to lose…</h2>
${groups}
    </main>

    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}    </main>

${related.block(BASE)}
${site.FOOTER}
  </div>
  <script src="/calories.js"></script>
</body>
</html>
`;
}

/* Checks: the Mifflin-St Jeor equation by hand, and the NHS 600 kcal rate */
if (C.bmr("f", 75, 165, 35) !== 1445.25 || C.bmr("m", 85, 178, 35) !== 1792.5) throw new Error("Mifflin-St Jeor check");
if (Math.abs(C.weeks(10) - 18.33) > 0.01) throw new Error("weeks check");

const urls = [];
site.write("calorie-calculator", hub());
GOALS.forEach((g) => { site.write(`calorie-calculator/${slugOf(g)}`, losePage(g)); urls.push([`${BASE}${slugOf(g)}/`, "0.5"]); });
site.sitemapBlock("calorie pages", "tools/build-calorie-pages.js", urls);
console.log(`built ${urls.length + 1} calorie pages`);
