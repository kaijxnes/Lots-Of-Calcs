#!/usr/bin/env node
/* "How long to cook a 5kg turkey?" — the turkey cooking time calculator and
   a page per weight:

       /turkey-cooking-time/          calculator
       /turkey-cooking-time/5kg/      UK guidance, with the US figure alongside
       /turkey-cooking-time/16lb/     USDA timetable, with the UK figure alongside

       node tools/build-turkey-pages.js

   Times come from turkey.js (Food Standards Scotland / FSA and USDA FSIS),
   the same module the calculator runs. */
const site = require("./lib/site.js");
const related = require("./related.js");
const T = require("../turkey.js");
const { esc, SITE } = site;

const BASE = "/turkey-cooking-time/";
const KGS = [];
for (let k = 2; k <= 10; k += 0.5) KGS.push(k);
const LBS = [];
for (let l = 8; l <= 24; l++) LBS.push(l);
const n1 = (v) => (Math.round(v * 10) / 10).toLocaleString("en-GB");
const kgSlug = (k) => String(k).replace(".", "-") + "kg";
const titleCase = (t) => t.replace(/\b([a-z])/g, (m) => m.toUpperCase()).replace(/ To /g, " to ");
const SERVE = "14:00";
const clock = (mins) => { const m = ((Math.round(mins) % 1440) + 1440) % 1440; return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0"); };
const startAt = (cookMins) => clock(14 * 60 - cookMins - T.REST);

/* Fan oven equivalent of 180°C, from the sourced oven chart (Which?, gas mark 4) */
const OVEN = JSON.parse(require("fs").readFileSync(require("path").join(site.ROOT, "data/cooking/oven.json"), "utf8"));
const GM4 = OVEN.gasMarks.find((g) => g.mark === 4);
if (GM4.c !== 180) throw new Error("oven.json gas mark 4 is no longer 180°C");
const FAN = `${GM4.fan}°C in a fan oven (the equivalent <a href="${OVEN.sources[0].url}" rel="nofollow noopener" target="_blank">Which?'s oven chart</a> gives for 180°C)`;

/* The next Christmas Day and US Thanksgiving (fourth Thursday of November) on or after the build date */
const TODAY = new Date(site.TODAY + "T00:00:00Z");
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const nextOf = (fn) => { const y = TODAY.getUTCFullYear(); return fn(y) >= TODAY ? fn(y) : fn(y + 1); };
const XMAS = nextOf((y) => new Date(Date.UTC(y, 11, 25)));
const THANKS = nextOf((y) => { const d = new Date(Date.UTC(y, 10, 1)); return new Date(Date.UTC(y, 10, 1 + ((4 - d.getUTCDay() + 7) % 7) + 21)); });
const dayName = (d) => `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
/* fully thawed by 08:00 on the day: the latest time to move it to the fridge */
function thawBy(day, hours) {
  const t = new Date(day.getTime() + 8 * 3600000 - Math.ceil(hours) * 3600000);
  return `${String(t.getUTCHours()).padStart(2, "0")}:00 on ${dayName(t)}`;
}
const SERVES = [12, 13, 14, 15, 16, 17, 18].map((h) => h * 60);
function timetable(cookMins) {
  return site.table(["Dinner at", "Turkey in the oven", "Out to rest"], SERVES.map((sv) => [clock(sv), `<strong>${clock(sv - T.REST - cookMins)}</strong>`, clock(sv - T.REST)]), 340);
}

const SRC_UK = "Food Standards Scotland's turkey cooking guide (the same times the Food Standards Agency gives)";
const SRC_US = "the USDA Food Safety and Inspection Service roasting timetable";
const CHECK = "Times are a guide: the turkey is cooked when the thickest part (between the breast and the thigh) reaches 75°C, the meat is steaming hot with no pink, and the juices run clear (Food Standards Scotland). The USDA's minimum is 165°F (74°C) in the thickest part of the breast and the innermost part of the thigh and wing.";

function tool(w, unit) {
  const kg = unit === "kg" ? w : w * T.LB, lb = kg / T.LB;
  let time, note, cookMins, defrost;
  if (unit === "kg") {
    cookMins = T.ukMinutes(kg); time = T.hm(cookMins); note = `At 180°C (Gas Mark 4), unstuffed: ${T.ukBand(kg)}.`;
    const f = T.ukDefrost(kg); defrost = `${T.daysRange(f)} in the fridge`;
  } else {
    const row = T.usRow(lb, false);
    cookMins = row[3] * 60; time = T.range(row); note = `At 325°F (about 160°C), unstuffed, for ${row[0]} to ${row[1]} lb.`;
    defrost = `${T.days(T.usDefrost(lb))} in the fridge, or ${T.hm(T.usColdWater(lb) * 60)} in cold water`;
  }
  return `    <main class="tool" id="tk-tool">
      <div class="field-row">
        <div class="field"><label for="tk-weight">Turkey weight</label><input type="number" id="tk-weight" value="${w}" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="tk-unit">Unit</label><select id="tk-unit"><option value="kg"${unit === "kg" ? " selected" : ""}>kg</option><option value="lb"${unit === "lb" ? " selected" : ""}>lb</option></select></div>
      </div>
      <div class="field-row">
        <div class="field"><label for="tk-method">Guidance</label><select id="tk-method"><option value="uk"${unit === "kg" ? " selected" : ""}>UK — 180°C, unstuffed</option><option value="us-unstuffed"${unit === "lb" ? " selected" : ""}>US — 325°F, unstuffed</option><option value="us-stuffed">US — 325°F, stuffed</option></select></div>
        <div class="field"><label for="tk-serve">Dinner at</label><input type="time" id="tk-serve" value="${SERVE}"></div>
      </div>
      <p class="tool-hint" id="tk-error" role="alert" style="color: var(--bad); display: none;"></p>
      <div class="result-box" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="tk-time">${esc(time)}</div>
          <div class="label" id="tk-note">${esc(note)}</div>
        </div>
        <div class="result-grid">
          <div class="result-row highlight"><span class="r-label">Put it in the oven at</span><span class="r-value" id="tk-start">${startAt(cookMins)}</span></div>
          <div class="result-row"><span class="r-label">Defrosting a frozen turkey</span><span class="r-value" id="tk-defrost">${esc(defrost)}</span></div>
        </div>
      </div>
      <p class="tool-hint" style="margin-top:10px;">"Put it in at" allows ${T.REST} minutes' standing before carving${unit === "lb" ? " and uses the longer end of the USDA range" : ""}. Weigh the bird after stuffing it.</p>
    </main>
`;
}

function ukTable(hi) {
  return site.table(["Weight", "Cooking time at 180°C", "In pounds"], KGS.map((k) => [k === hi ? `<strong>${n1(k)} kg</strong>` : `<a href="${BASE}${kgSlug(k)}/">${n1(k)} kg</a>`, esc(T.hm(T.ukMinutes(k))), `<span class="tool-hint">${n1(k / T.LB)} lb</span>`]), 360);
}
function usTable(hi) {
  const rows = T.US.unstuffed.map((r, i) => {
    const s = T.US.stuffed[i];
    return [`${r[0]} to ${r[1]} lb`, esc(T.range(r)), esc(T.range(s))];
  });
  return site.table(["Weight", "Unstuffed", "Stuffed"], rows, 380);
}

function common(kg, lb) {
  const f = T.ukDefrost(kg);
  return [
    [`How long does it take to defrost a ${n1(kg)} kg turkey?`, `About ${T.daysRange(f)} in a fridge at 4°C — allow 10 to 12 hours per kg (Food Standards Scotland). The USDA allows about 24 hours per 5 lb in the fridge (${T.days(T.usDefrost(lb))} for ${Math.round(lb)} lb), or 30 minutes per pound in cold water changed every 30 minutes. Cook it as soon as it has thawed.`],
    ["How do I know when it's cooked?", CHECK],
    ["Should I let it rest?", `Yes — the USDA says to let it stand ${T.REST} minutes before taking out any stuffing and carving. Cover it loosely with foil.`]
  ];
}

function kgPage(kg) {
  const url = SITE + `${BASE}${kgSlug(kg)}/`;
  const mins = T.ukMinutes(kg), lb = kg / T.LB, row = T.usRow(lb, false), srow = T.usRow(lb, true);
  const title = `How Long to Cook a ${n1(kg)}kg Turkey? — ${titleCase(T.hm(mins))} at 180°C`;
  const desc = `A ${n1(kg)} kg (${n1(lb)} lb) turkey takes ${T.hm(mins)} at 180°C (Gas Mark 4), unstuffed — ${T.ukBand(kg)}. For dinner at 2pm, put it in at ${startAt(mins)}. Defrosting takes ${T.daysRange(T.ukDefrost(kg))} in the fridge.`;
  const q = [[`How long does a ${n1(kg)} kg turkey take to cook?`, `${T.hm(mins)} in an oven preheated to 180°C (350°F, Gas Mark 4), unstuffed, using ${SRC_UK}: ${T.ukBand(kg)}. Cover it with foil and take the foil off for the last 30 minutes to brown the skin. Fan ovens may cook it more quickly.`]];
  if (row) q.push([`What about the US timing?`, `The USDA timetable at 325°F gives ${T.range(row)} unstuffed or ${T.range(srow)} stuffed for a ${row[0]} to ${row[1]} lb bird (${n1(lb)} lb is ${n1(kg)} kg). It uses a cooler oven, so the times are longer.`]);
  const xmasThaw = thawBy(XMAS, 12 * kg);
  q.push([`What time should I put a ${n1(kg)} kg turkey in for Christmas dinner?`, `For dinner at 2pm, put it in at ${startAt(mins)}: ${T.hm(mins)} in the oven, then ${T.REST} minutes resting. For 1pm, ${clock(13 * 60 - T.REST - mins)}; for 3pm, ${clock(15 * 60 - T.REST - mins)}. Preheat the oven first.`]);
  q.push([`When should I take a ${n1(kg)} kg turkey out of the freezer for Christmas?`, `Defrosting in the fridge takes ${T.daysRange(T.ukDefrost(kg))} at 10 to 12 hours per kg, so for Christmas Day (${dayName(XMAS)} ${XMAS.getUTCFullYear()}) move it to the fridge by ${xmasThaw}, to be thawed by Christmas morning.`]);
  q.push([`How many people does a ${n1(kg)} kg turkey feed?`, `About ${Math.round(lb)}, using the USDA's guide of 1 lb (about 450 g) of whole turkey per person.`]);
  q.push(...common(kg, lb));
  const ld = [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], ["Turkey Cooking Time", SITE + BASE], [`${n1(kg)} kg turkey`, url]]), site.faqLd(q)];
  const near = KGS.filter((k) => k !== kg && Math.abs(k - kg) <= 2).map((k) => `<a href="${BASE}${kgSlug(k)}/">${n1(k)} kg</a>`).join(" ");
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="${BASE}">← Turkey cooking time</a>
      <h1 class="page-title">How long to cook a ${n1(kg)} kg turkey</h1>
      <p class="page-subtitle">${esc(T.hm(mins))} at 180°C (Gas Mark 4), unstuffed. That's ${n1(lb)} lb.</p>
    </header>

${tool(kg, "kg")}
    <main class="tool">
      <h2 class="tool-section-title">Christmas Day timings for a ${n1(kg)} kg turkey</h2>
${timetable(mins)}      <p class="tool-hint" style="margin-top:12px;">${esc(T.hm(mins))} at 180°C (Gas Mark 4), or ${FAN}, then ${T.REST} minutes resting under foil before carving.</p>
      <p class="about-text" style="margin-top:14px;"><strong>Defrosting for Christmas:</strong> a frozen ${n1(kg)} kg turkey needs ${esc(T.daysRange(T.ukDefrost(kg)))} in the fridge, so move it from the freezer by <strong>${esc(xmasThaw)}</strong> to have it thawed by the morning of ${esc(dayName(XMAS))}.</p>
      <p class="about-text"><strong>Feeds:</strong> about ${Math.round(lb)} people, at the USDA's 1 lb (about 450 g) per person.</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">Turkey cooking times by weight</h2>
${ukTable(kg)}      <p class="tool-hint" style="margin-top:12px;">From ${esc(SRC_UK)}, for an unstuffed turkey in an oven preheated to 180°C (350°F, Gas Mark 4). ${esc(CHECK)}</p>
      <h2 class="tool-section-title" style="margin-top:22px;">Nearby weights</h2>
      <p class="salary-links">${near}</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}    </main>

${site.FOOTER}
  </div>
  <script src="/turkey.js"></script>
</body>
</html>
`;
}

function lbPage(lb) {
  const url = SITE + `${BASE}${lb}lb/`;
  const row = T.usRow(lb, false), srow = T.usRow(lb, true), kg = lb * T.LB;
  const title = `How Long to Cook a ${lb} lb Turkey? — ${titleCase(T.range(row))} at 325°F`;
  const desc = `A ${lb} lb (${n1(kg)} kg) turkey takes ${T.range(row)} unstuffed or ${T.range(srow)} stuffed at 325°F, by the USDA timetable. Thawing takes about ${T.days(T.usDefrost(lb))} in the fridge.`;
  const q = [
    [`How long does a ${lb} lb turkey take to cook?`, `${Cap(T.range(row))} unstuffed, or ${T.range(srow)} stuffed, in an oven at 325°F (about 160°C) — ${SRC_US}, which groups ${row[0]} to ${row[1]} lb birds together. Start checking with a thermometer at the shorter time.`],
    [`What is that in the UK?`, `${n1(kg)} kg at 180°C (Gas Mark 4), unstuffed, takes ${T.hm(T.ukMinutes(kg))} by Food Standards Scotland's guide: ${T.ukBand(kg)}.`],
    [`What time should I put a ${lb} lb turkey in?`, `Allowing the longer ${T.hrs(row[3])} hours unstuffed and ${T.REST} minutes' standing, put it in at ${clock(14 * 60 - T.REST - row[3] * 60)} for dinner at 2pm, ${clock(16 * 60 - T.REST - row[3] * 60)} for 4pm or ${clock(18 * 60 - T.REST - row[3] * 60)} for 6pm. Check the temperature from the shorter time.`],
    [`When should I start thawing a ${lb} lb turkey for Thanksgiving?`, `At 24 hours per 5 lb, a ${lb} lb turkey needs about ${T.days(T.usDefrost(lb))} in the fridge, so for Thanksgiving on ${dayName(THANKS)} ${THANKS.getUTCFullYear()} move it to the fridge by ${thawBy(THANKS, T.usDefrost(lb))}. Short of time, thawing in cold water takes about ${T.hm(T.usColdWater(lb) * 60)} (30 minutes per pound, changing the water every 30 minutes).`],
    ...common(kg, lb)
  ];
  const ld = [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], ["Turkey Cooking Time", SITE + BASE], [`${lb} lb turkey`, url]]), site.faqLd(q)];
  const near = LBS.filter((l) => l !== lb && Math.abs(l - lb) <= 4).map((l) => `<a href="${BASE}${l}lb/">${l} lb</a>`).join(" ");
  const people = Math.round(lb);
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="${BASE}">← Turkey cooking time</a>
      <h1 class="page-title">How long to cook a ${lb} lb turkey</h1>
      <p class="page-subtitle">${esc(Cap(T.range(row)))} at 325°F unstuffed, ${esc(T.range(srow))} stuffed. That's ${n1(kg)} kg — enough for about ${people} people at 1 lb each (USDA).</p>
    </header>

${tool(lb, "lb")}
    <main class="tool">
      <h2 class="tool-section-title">When to put a ${lb} lb turkey in</h2>
${timetable(row[3] * 60)}      <p class="tool-hint" style="margin-top:12px;">Using the longer ${esc(T.hrs(row[3]))} hours of the USDA's range for an unstuffed bird at 325°F (allow up to ${esc(T.hrs(srow[3]))} hours stuffed), then ${T.REST} minutes' standing. Start checking with a thermometer at ${esc(T.hrs(row[2]))} hours.</p>
      <h2 class="tool-section-title" style="margin-top:22px;">When to start thawing a frozen ${lb} lb turkey</h2>
${site.table(["Holiday", "Move it to the fridge by", "Or cold water"], [[`Thanksgiving, ${esc(dayName(THANKS))} ${THANKS.getUTCFullYear()}`, esc(thawBy(THANKS, T.usDefrost(lb))), esc(T.hm(T.usColdWater(lb) * 60))], [`Christmas, ${esc(dayName(XMAS))} ${XMAS.getUTCFullYear()}`, esc(thawBy(XMAS, T.usDefrost(lb))), esc(T.hm(T.usColdWater(lb) * 60))]], 380)}      <p class="tool-hint" style="margin-top:12px;">Thawed by 08:00 on the day, at the USDA's 24 hours per 5 lb in the fridge (${esc(T.days(T.usDefrost(lb)))}). Cold water: 30 minutes per pound, changing the water every 30 minutes, and cook it straight away.</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">USDA roasting timetable at 325°F</h2>
${usTable()}      <p class="tool-hint" style="margin-top:12px;">Fresh or thawed whole turkey, from ${esc(SRC_US)}. The times are approximate: use a food thermometer. A boneless breast or crown cooks more quickly.</p>
      <h2 class="tool-section-title" style="margin-top:22px;">Nearby weights</h2>
      <p class="salary-links">${near}</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}    </main>

${site.FOOTER}
  </div>
  <script src="/turkey.js"></script>
</body>
</html>
`;
}
const Cap = (t) => t[0].toUpperCase() + t.slice(1);

function hub() {
  const url = SITE + BASE;
  const title = "Turkey Cooking Time Calculator — How Long to Cook a Turkey per kg";
  const desc = `How long to cook and defrost a turkey by weight, and when to put it in for Christmas dinner. A 5 kg turkey takes ${T.hm(T.ukMinutes(5))} at 180°C; UK (FSA) and US (USDA) times in kg and lb.`;
  const q = [
    ["How long do you cook a turkey per kg?", `At 180°C (Gas Mark 4), unstuffed: 45 minutes per kg plus 20 minutes under 4.5 kg, 40 minutes per kg from 4.5 to 6.5 kg, and 35 minutes per kg over 6.5 kg (Food Standards Scotland). A 5 kg turkey takes ${T.hm(T.ukMinutes(5))}.`],
    ["How long do you cook a turkey per pound?", "The USDA gives times by weight band at 325°F rather than per pound: 2¾ to 3 hours for 8 to 12 lb, 3 to 3¾ hours for 12 to 14 lb, 3¾ to 4¼ for 14 to 18 lb, 4¼ to 4½ for 18 to 20 lb and 4½ to 5 hours for 20 to 24 lb, unstuffed."],
    ["How long does a turkey take to defrost?", "In the fridge, about 10 to 12 hours per kg (Food Standards Scotland), or 24 hours per 5 lb (USDA) — a large bird can take three or four days, so take it out of the freezer in good time."],
    ["How big a turkey do I need?", "The USDA suggests 1 lb (about 450 g) per person, so a 5 kg turkey feeds about 11 and a 16 lb turkey about 16."],
    ["How do I know when it's cooked?", CHECK]
  ];
  const ld = [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], ["Turkey Cooking Time", url]]),
    { "@context": "https://schema.org", "@type": "WebApplication", name: "Turkey Cooking Time Calculator", url, applicationCategory: "LifestyleApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } }, site.faqLd(q)];
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="/">← All calculators</a>
      <h1 class="page-title">Turkey cooking time</h1>
      <p class="page-subtitle">How long to roast and defrost your turkey, and what time to put it in for dinner.</p>
    </header>

${tool(5, "kg")}
    <main class="tool">
      <h2 class="tool-section-title">UK cooking times by weight (180°C)</h2>
${ukTable()}      <p class="tool-hint" style="margin-top:12px;">From ${esc(SRC_UK)}, unstuffed, in an oven preheated to 180°C (350°F, Gas Mark 4). Cover with foil and uncover for the last 30 minutes. The guide's bands give a slightly shorter time just above 4.5 kg than just below it, so check with a thermometer either side of that weight.</p>
      <h2 class="tool-section-title" style="margin-top:22px;">US roasting timetable (325°F)</h2>
${usTable()}      <p class="tool-hint" style="margin-top:12px;">From ${esc(SRC_US)}, fresh or thawed whole turkey. By pound: ${LBS.map((l) => `<a href="${BASE}${l}lb/">${l} lb</a>`).join(" ")}</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}    </main>

${related.block(BASE)}
${site.FOOTER}
  </div>
  <script src="/turkey.js"></script>
</body>
</html>
`;
}

/* The UK bands against the published examples: under 4.5 kg 45/kg + 20, 4.5 to 6.5 kg 40/kg, over 6.5 kg 35/kg */
[[4, 200], [4.5, 180], [5, 200], [6.5, 260], [7, 245]].forEach(([k, m]) => { if (T.ukMinutes(k) !== m) throw new Error(`UK ${k} kg: ${T.ukMinutes(k)} != ${m}`); });
if (T.range(T.usRow(16, false)) !== "3¾ to 4¼ hours" || T.range(T.usRow(12, true)) !== "3 to 3½ hours") throw new Error("US timetable lookup");

const urls = [];
site.write("turkey-cooking-time", hub());
KGS.forEach((k) => { site.write(`turkey-cooking-time/${kgSlug(k)}`, kgPage(k)); urls.push([`${BASE}${kgSlug(k)}/`, "0.6"]); });
LBS.forEach((l) => { site.write(`turkey-cooking-time/${l}lb`, lbPage(l)); urls.push([`${BASE}${l}lb/`, "0.5"]); });
site.sitemapBlock("turkey pages", "tools/build-turkey-pages.js", urls);
console.log(`built ${urls.length + 1} turkey pages`);
