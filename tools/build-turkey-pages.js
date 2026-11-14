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
  return site.table(["Weight", "Cooking time at 180°C", ""], KGS.map((k) => [k === hi ? `<strong>${n1(k)} kg</strong>` : `<a href="${BASE}${kgSlug(k)}/">${n1(k)} kg</a>`, esc(T.hm(T.ukMinutes(k))), `<span class="tool-hint">${n1(k / T.LB)} lb</span>`]), 360);
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
      <p class="tool-section-title">Turkey cooking times by weight</p>
${ukTable(kg)}      <p class="tool-hint" style="margin-top:12px;">From ${esc(SRC_UK)}, for an unstuffed turkey in an oven preheated to 180°C (350°F, Gas Mark 4). ${esc(CHECK)}</p>
      <p class="tool-section-title" style="margin-top:22px;">Nearby weights</p>
      <p class="salary-links">${near}</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">Frequently asked questions</p>
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
      <p class="tool-section-title">USDA roasting timetable at 325°F</p>
${usTable()}      <p class="tool-hint" style="margin-top:12px;">Fresh or thawed whole turkey, from ${esc(SRC_US)}. The times are approximate: use a food thermometer. A boneless breast or crown cooks more quickly.</p>
      <p class="tool-section-title" style="margin-top:22px;">Nearby weights</p>
      <p class="salary-links">${near}</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">Frequently asked questions</p>
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
      <p class="tool-section-title">UK cooking times by weight (180°C)</p>
${ukTable()}      <p class="tool-hint" style="margin-top:12px;">From ${esc(SRC_UK)}, unstuffed, in an oven preheated to 180°C (350°F, Gas Mark 4). Cover with foil and uncover for the last 30 minutes. The guide's bands give a slightly shorter time just above 4.5 kg than just below it, so check with a thermometer either side of that weight.</p>
      <p class="tool-section-title" style="margin-top:22px;">US roasting timetable (325°F)</p>
${usTable()}      <p class="tool-hint" style="margin-top:12px;">From ${esc(SRC_US)}, fresh or thawed whole turkey. By pound: ${LBS.map((l) => `<a href="${BASE}${l}lb/">${l} lb</a>`).join(" ")}</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">Frequently asked questions</p>
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
