#!/usr/bin/env node
/* Oven temperatures and air fryer conversions:

       /oven-temperature-converter/                    °C, fan, °F and gas mark
       /oven-temperature-converter/180c-to-f/          one Celsius temperature
       /oven-temperature-converter/350f-to-c/          one Fahrenheit temperature
       /oven-temperature-converter/gas-mark-4/         one gas mark
       /oven-temperature-converter/180c-fan-to-conventional/
       /air-fryer-conversion/  /air-fryer-conversion/200c/

       node tools/build-oven-pages.js

   Gas marks, fan offset and air fryer rules come from data/cooking/oven.json
   (Which?, Instant Pot UK, Liana's Kitchen — cited on the pages). °C↔°F is
   exact arithmetic. Nothing here changes from month to month. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const related = require("./related.js");
const { esc, SITE } = site;

const D = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/cooking/oven.json"), "utf8"));
const GAS = D.gasMarks, FAN = D.fanLessC, AF = D.airFryer;
const toF = (c) => c * 9 / 5 + 32, toC = (f) => (f - 32) * 5 / 9;
const r0 = (v) => Math.round(v);
/* The chart row nearest a conventional °C, within 5°C of the chart's ends */
function gasFor(c) {
  if (c < GAS[0].c - 5 || c > GAS[GAS.length - 1].c + 5) return null;
  return GAS.reduce((a, g) => (Math.abs(g.c - c) < Math.abs(a.c - c) ? g : a));
}
const gasText = (c) => { const g = gasFor(c); return g ? `${g.c === c ? "" : "about "}gas mark ${g.mark}` : c < GAS[0].c ? "below gas mark 1" : "above gas mark 9"; };
const afTimes = (t) => [Math.floor(t * (1 - AF.timeLessPct[1] / 100)), r0(t * (1 - AF.timeLessPct[0] / 100))];
const SRC = D.sources.map((s) => `<a href="${s.url}" rel="nofollow noopener" target="_blank">${esc(s.title.split(" — ")[0])}</a>`);

/* checks against the sources' own examples */
if (r0(toF(180)) !== 356 || r0(toC(350)) !== 177) throw new Error("°C/°F");
[[20, "15-16"], [30, "22-24"], [15, "11-12"], [25, "18-20"]].forEach(([t, want]) => { if (afTimes(t).join("-") !== want) throw new Error(`air fryer time ${t}: ${afTimes(t)}`); });

const C_PAGES = [100, 110, 120, 130, 140, 150, 160, 170, 175, 180, 190, 200, 210, 220, 230, 240, 250, 260];
const F_PAGES = [200, 225, 250, 275, 300, 325, 350, 375, 400, 425, 450, 475, 500];
const FAN_PAGES = [120, 130, 140, 150, 160, 170, 180, 190, 200, 210, 220];
const AF_PAGES = [160, 170, 180, 190, 200, 210, 220, 230, 240];
const BASE = "/oven-temperature-converter/", AFB = "/air-fryer-conversion/";

function page(o) {
  const url = SITE + o.path;
  const ld = [site.webPage(o.title, o.desc, url), site.breadcrumb(o.crumbs.map(([n, u]) => [n, SITE + u]).concat([[o.crumb, url]]))];
  if (o.app) ld.push({ "@context": "https://schema.org", "@type": "WebApplication", name: o.app, url, applicationCategory: "UtilitiesApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } });
  ld.push(site.faqLd(o.q));
  return site.head({ title: o.title, desc: o.desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="${o.back[0]}">← ${esc(o.back[1])}</a>
      <h1 class="page-title">${esc(o.h1)}</h1>
      <p class="page-subtitle">${o.sub}</p>
    </header>

${o.body}    <main class="tool">
      <p class="tool-section-title">Frequently asked questions</p>
${site.faqHtml(o.q)}      <p class="tool-hint" style="margin-top:12px;">Sources: ${SRC.join(", ")}. Ovens vary, so check your oven's manual — and check food is piping hot all the way through before serving.</p>
    </main>

${o.related ? related.block(o.path) : `    <main class="tool">
      <p class="tool-section-title">${esc(o.moreTitle)}</p>
      <p class="salary-links">${o.more}</p>
    </main>
`}
${site.FOOTER}
  </div>
  <script src="/oven.js"></script>
</body>
</html>
`;
}
const row = (label, id, value, cls) => `          <div class="result-row${cls ? " " + cls : ""}"><span class="r-label">${label}</span><span class="r-value" id="${id}">${value}</span></div>`;

function ovenTool(value, unit) {
  const c = unit === "c" ? value : unit === "fan" ? value + FAN : unit === "f" ? toC(value) : GAS.find((g) => g.mark === value).c;
  const opt = (v, l) => `<option value="${v}"${v === unit ? " selected" : ""}>${l}</option>`;
  const g = gasFor(r0(c));
  return `    <main class="tool" id="ov-tool" data-gas='${JSON.stringify(GAS)}' data-fan="${FAN}">
      <div class="field-row">
        <div class="field"><label for="ov-temp">Temperature</label><input type="number" id="ov-temp" value="${value}" step="any" inputmode="decimal"></div>
        <div class="field"><label for="ov-unit">In</label><select id="ov-unit">${opt("c", "°C (conventional)")}${opt("fan", "°C fan")}${opt("f", "°F")}${opt("gas", "Gas mark")}</select></div>
      </div>
      <div class="result-box" aria-live="polite">
        <div class="result-grid">
${row("Conventional oven", "ov-c", `${r0(c)}°C`, unit === "c" ? "" : "highlight")}
${row("Fan oven", "ov-fan", `${r0(c - FAN)}°C`, unit === "fan" ? "" : unit === "c" ? "highlight" : "")}
${row("Fahrenheit (exact)", "ov-f", `${r0(toF(c))}°F`)}
${row("Gas mark", "ov-gas", esc(gasText(r0(c))))}
${row("Recipe chart equivalent", "ov-chart", g ? `Gas ${g.mark} · ${g.c}°C · ${g.fan}°C fan · ${g.f}°F (${esc(g.word.toLowerCase())})` : "—")}
        </div>
      </div>
      <p class="tool-hint" style="margin-top:12px;">A fan moves the hot air around, so recipes give fan temperatures about ${FAN}°C lower. Recipe charts round Fahrenheit to the nearest 25°F, so 180°C is listed as 350°F although it is exactly 356°F.</p>
    </main>
`;
}
function chart(highlight) {
  return `    <main class="tool">
      <p class="tool-section-title">Oven temperature chart</p>
${site.table(["Gas mark", "°C", "Fan °C", "°F", "Heat"], GAS.map((g) => [g.mark === highlight ? `<strong>${g.mark}</strong>` : String(g.mark), `${g.c}°C`, `${g.fan}°C`, `${g.f}°F`, g.word]), 400)}      <p class="tool-hint" style="margin-top:12px;">From the Which? conversion table. Charts disagree below gas mark 1, so no figures are given for gas ¼ and ½.</p>
    </main>
`;
}
const others = (list, href, label, skip) => list.filter((x) => x !== skip).map((x) => `<a href="${href(x)}">${label(x)}</a>`).join(" ");
const cSlug = (c) => `${BASE}${c}c-to-f/`, fSlug = (f) => `${BASE}${f}f-to-c/`, gSlug = (m) => `${BASE}gas-mark-${m}/`, fanSlug = (c) => `${BASE}${c}c-fan-to-conventional/`, afSlug = (c) => `${AFB}${c}c/`;
const allLinks = () => [others(C_PAGES, cSlug, (c) => `${c}°C to °F`), others(F_PAGES, fSlug, (f) => `${f}°F to °C`), others(GAS, (g) => gSlug(g.mark), (g) => `Gas mark ${g.mark}`), others(FAN_PAGES, fanSlug, (c) => `${c}°C fan to conventional`)].join(" ");
const crumbs = [["Home", "/"], ["Oven Temperature Converter", BASE]], back = [BASE, "Oven temperature converter"];

function hub() {
  const q = [
    ["How do I convert Celsius to Fahrenheit for an oven?", "Multiply by 9, divide by 5 and add 32: 180°C is 356°F and 200°C is 392°F. Recipes round to the nearest 25°F, so they give 180°C as 350°F and 200°C as 400°F — close enough for an oven."],
    ["How much lower should a fan oven be?", `About ${FAN}°C lower than a conventional oven, because the fan moves the hot air around: 180°C conventional is about 160°C fan. If a recipe gives a fan temperature, add ${FAN}°C for an oven without a fan.`],
    ["What is gas mark 4 in Celsius?", "180°C, or 160°C in a fan oven, and 350°F — a moderate oven, the usual temperature for cakes. Gas mark 6 is 200°C (180°C fan, 400°F)."],
    ["How do I convert an oven recipe for an air fryer?", `Set the air fryer ${AF.lessC}°C lower than the recipe's oven temperature and start checking after ${100 - AF.timeLessPct[1]}–${100 - AF.timeLessPct[0]}% of the time; the air fryer conversion calculator does it for you.`]
  ];
  return page({ path: BASE, app: "Oven Temperature Converter", crumbs: [["Home", "/"]], crumb: "Oven Temperature Converter", back: ["/", "All calculators"], related: true,
    title: "Oven Temperature Converter — °C, Fan, °F & Gas Mark Chart",
    desc: "Convert oven temperatures between Celsius, fan, Fahrenheit and gas mark, with a full chart: gas mark 4 is 180°C, 160°C fan or 350°F. Plus oven to air fryer conversion.",
    h1: "Oven temperature converter", sub: "Celsius, fan, Fahrenheit and gas mark, both ways — with the full chart and an air fryer converter.", q,
    body: ovenTool(180, "c") + chart(4) + `    <main class="tool">
      <p class="tool-section-title">Air fryer</p>
      <p class="about-text">Cooking an oven recipe in an air fryer? The <a href="${AFB}">air fryer conversion calculator</a> gives the temperature and time: ${AF.lessC}°C lower and ${AF.timeLessPct[0]}–${AF.timeLessPct[1]}% less time for fresh food.</p>
    </main>
    <main class="tool">
      <p class="tool-section-title">Common conversions</p>
      <p class="salary-links">${allLinks()}</p>
    </main>
` });
}
function cPage(c) {
  const f = toF(c), g = gasFor(c);
  const q = [
    [`What is ${c}°C in Fahrenheit?`, `${c}°C is ${r0(f)}°F (${c} × 9 ÷ 5 + 32 = ${+f.toFixed(1)}).${g && g.c === c ? ` Recipes usually round it to ${g.f}°F, the gas mark ${g.mark} figure.` : ""}`],
    [`What is ${c}°C in a fan oven?`, `About ${c - FAN}°C — fan ovens are set around ${FAN}°C lower than conventional ones.`],
    [`What gas mark is ${c}°C?`, g ? `${g.c === c ? `Gas mark ${g.mark}` : `About gas mark ${g.mark} (${g.c}°C)`} — ${g.word.toLowerCase()}.` : c < GAS[0].c ? "Below gas mark 1 (140°C). Charts disagree on the very low gas marks, so check your cooker's manual." : "Above gas mark 9 (240°C), the hottest setting on most gas ovens."]
  ];
  return page({ path: cSlug(c), crumbs, crumb: `${c}°C to °F`, back,
    title: site.fitTitle(`${c}C to F — ${c}°C Is ${r0(f)}°F${g ? ` (${g.c === c ? "" : "About "}Gas Mark ${g.mark}, ${c - FAN}°C Fan)` : ` (${c - FAN}°C Fan)`}`, `${c}C to F — ${c}°C Is ${r0(f)}°F`),
    desc: `${c}°C is ${r0(f)}°F, about ${c - FAN}°C in a fan oven, and ${gasText(c)}. Convert any oven temperature between °C, fan, °F and gas mark.`,
    h1: `${c}°C in Fahrenheit`, sub: `${c}°C is <strong>${r0(f)}°F</strong> — ${esc(gasText(c))}, or about ${c - FAN}°C in a fan oven.`, q,
    body: ovenTool(c, "c") + chart(g && g.mark), moreTitle: "Other temperatures", more: allLinks() });
}
function fPage(f) {
  const c = toC(f), g = gasFor(r0(c)), chartRow = GAS.find((x) => x.f === f);
  const q = [
    [`What is ${f}°F in Celsius?`, `${f}°F is ${r0(c)}°C ((${f} − 32) × 5 ÷ 9 = ${+c.toFixed(1)}).${chartRow ? ` Recipe charts list ${f}°F as ${chartRow.c}°C, gas mark ${chartRow.mark}.` : ""}`],
    [`What is ${f}°F in a fan oven?`, `About ${r0((chartRow ? chartRow.c : c) - FAN)}°C fan.`],
    [`What gas mark is ${f}°F?`, chartRow ? `Gas mark ${chartRow.mark} — ${chartRow.word.toLowerCase()}.` : g ? `About gas mark ${g.mark}.` : c < GAS[0].c ? "Below gas mark 1." : "Above gas mark 9."]
  ];
  return page({ path: fSlug(f), crumbs, crumb: `${f}°F to °C`, back,
    title: site.fitTitle(`${f}F to C — ${f}°F Is ${r0(c)}°C${chartRow ? ` (Gas Mark ${chartRow.mark}, ${chartRow.fan}°C Fan)` : ""}`, `${f}F to C — ${f}°F Is ${r0(c)}°C`),
    desc: `${f}°F is ${r0(c)}°C${chartRow ? `, which recipes give as ${chartRow.c}°C (${chartRow.fan}°C fan, gas mark ${chartRow.mark})` : `, ${gasText(r0(c))}`}. Convert any oven temperature between °F, °C, fan and gas mark.`,
    h1: `${f}°F in Celsius`, sub: `${f}°F is <strong>${r0(c)}°C</strong>${chartRow ? ` — listed in recipes as ${chartRow.c}°C, ${chartRow.fan}°C fan or gas mark ${chartRow.mark}` : ""}.`, q,
    body: ovenTool(f, "f") + chart(chartRow && chartRow.mark), moreTitle: "Other temperatures", more: allLinks() });
}
function gasPage(g) {
  const q = [
    [`What is gas mark ${g.mark} in Celsius?`, `${g.c}°C in a conventional oven, or ${g.fan}°C in a fan oven.`],
    [`What is gas mark ${g.mark} in Fahrenheit?`, `${g.f}°F.`],
    [`Is gas mark ${g.mark} hot?`, `It's described as ${g.word.toLowerCase()}. Gas marks run from 1 (${GAS[0].c}°C, cool) to 9 (${GAS[GAS.length - 1].c}°C, very hot).`]
  ];
  return page({ path: gSlug(g.mark), crumbs, crumb: `Gas mark ${g.mark}`, back,
    title: `Gas Mark ${g.mark} in Celsius & Fahrenheit — ${g.c}°C, ${g.fan}°C Fan, ${g.f}°F`,
    desc: `Gas mark ${g.mark} is ${g.c}°C, ${g.fan}°C in a fan oven, or ${g.f}°F — ${g.word.toLowerCase()}. The full gas mark chart and a converter for any temperature.`,
    h1: `Gas mark ${g.mark}`, sub: `Gas mark ${g.mark} is <strong>${g.c}°C</strong>, ${g.fan}°C fan or ${g.f}°F — ${esc(g.word.toLowerCase())}.`, q,
    body: ovenTool(g.mark, "gas") + chart(g.mark), moreTitle: "Other temperatures", more: allLinks() });
}
function fanPage(fan) {
  const c = fan + FAN, g = gasFor(c);
  const q = [
    [`What is ${fan}°C fan in a conventional oven?`, `About ${c}°C — conventional ovens are set around ${FAN}°C higher than fan ovens.`],
    [`What is ${fan}°C fan in Fahrenheit?`, `${fan}°C fan is ${c}°C conventional, which is ${r0(toF(c))}°F${g && g.c === c ? ` (${g.f}°F in recipe charts)` : ""}.`],
    [`What gas mark is ${fan}°C fan?`, g ? `${g.c === c ? "Gas mark" : "About gas mark"} ${g.mark}.` : c < GAS[0].c ? "Below gas mark 1." : "Above gas mark 9."]
  ];
  return page({ path: fanSlug(fan), crumbs, crumb: `${fan}°C fan to conventional`, back,
    title: site.fitTitle(`${fan}C Fan to Conventional — ${c}°C Without a Fan${g ? `, ${g.c === c ? "" : "About "}Gas Mark ${g.mark}` : ""}`, `${fan}C Fan to Conventional — ${c}°C Without a Fan`),
    desc: `${fan}°C in a fan oven is about ${c}°C in a conventional oven, ${r0(toF(c))}°F and ${gasText(c)}. Convert any oven temperature.`,
    h1: `${fan}°C fan in a conventional oven`, sub: `${fan}°C fan is about <strong>${c}°C</strong> without a fan — ${esc(gasText(c))}.`, q,
    body: ovenTool(fan, "fan") + chart(g && g.mark), moreTitle: "Other temperatures", more: allLinks() });
}

// ---------------------------------------------------------------- air fryer

function afTool(c, t) {
  return `    <main class="tool" id="af-tool" data-less="${AF.lessC}" data-pct="${AF.timeLessPct.join(",")}" data-frozen="${AF.frozenTimePct}">
      <div class="field-row">
        <div class="field"><label for="af-temp">Oven temperature in the recipe</label><input type="number" id="af-temp" value="${c}" step="any" inputmode="decimal"></div>
        <div class="field"><label for="af-unit">In</label><select id="af-unit"><option value="c" selected>°C (conventional or fan)</option><option value="f">°F</option></select></div>
      </div>
      <div class="field-row">
        <div class="field"><label for="af-time">Oven time (minutes)</label><input type="number" id="af-time" value="${t}" min="0" step="1" inputmode="numeric"></div>
        <div class="field"><label for="af-food">Food</label><select id="af-food"><option value="fresh" selected>Fresh</option><option value="frozen">Frozen</option></select></div>
      </div>
      <div class="result-box" aria-live="polite">
        <div class="result-grid">
${row("Air fryer temperature", "af-out-temp", `${c - AF.lessC}°C`, "highlight")}
${row("Air fryer time", "af-out-time", `${afTimes(t).join("–")} minutes`, "highlight")}
        </div>
      </div>
      <p class="tool-hint" id="af-hint" style="margin-top:12px;">Fresh food: ${AF.lessC}°C lower and ${AF.timeLessPct[0]}–${AF.timeLessPct[1]}% less time. Frozen food: the same temperature for about half the time. Check early, shake or turn halfway, and make sure food is piping hot all the way through.</p>
    </main>
`;
}
const TIMES = [10, 15, 20, 25, 30, 35, 40, 45, 50, 60];
function afTable(c) {
  return `    <main class="tool">
      <p class="tool-section-title">${c}°C oven times in an air fryer</p>
${site.table(["Oven", "Air fryer, fresh food", "Air fryer, frozen food"], TIMES.map((t) => [`${c}°C for ${t} minutes`, `${c - AF.lessC}°C for ${afTimes(t).join("–")} minutes`, `${c}°C for about ${r0(t * AF.frozenTimePct / 100)} minutes`]), 460)}    </main>
`;
}
function afHub() {
  const q = [
    ["How do I convert an oven recipe to an air fryer?", `For fresh food, set the air fryer ${AF.lessC}°C lower than the oven temperature in the recipe and cut the time by ${AF.timeLessPct[0]}–${AF.timeLessPct[1]}%: 200°C for 30 minutes becomes ${200 - AF.lessC}°C for ${afTimes(30).join("–")} minutes. The same starting point works whether the recipe gives a conventional or a fan temperature.`],
    ["What about frozen food?", `Keep the temperature the same and cook for about half the time — ${200}°C for 20 minutes becomes ${200}°C for about 10 minutes — then check. Frozen food's own packet instructions for an air fryer come first if it has them.`],
    ["Why do air fryers cook faster?", "An air fryer is a small, powerful fan oven: the hot air moves fast around a small space, so food cooks and browns more quickly than in a full-size oven."],
    ["How do I know it's cooked?", "Check it early, shake or turn it halfway through, and make sure it's piping hot all the way through before serving. A food thermometer in the thickest part is the surest check for meat and poultry."]
  ];
  return page({ path: AFB, app: "Air Fryer Conversion Calculator", crumbs: [["Home", "/"]], crumb: "Air Fryer Conversion", back: ["/", "All calculators"], related: true,
    title: "Oven to Air Fryer Conversion Calculator — Temperature & Time",
    desc: `Convert oven temperatures and cooking times for an air fryer: ${AF.lessC}°C lower and ${AF.timeLessPct[0]}–${AF.timeLessPct[1]}% less time for fresh food, so 200°C for 30 minutes becomes ${200 - AF.lessC}°C for ${afTimes(30).join("–")} minutes.`,
    h1: "Oven to air fryer conversion", sub: "The air fryer temperature and time for any oven recipe — fresh or frozen.", q,
    body: afTool(200, 30) + afTable(200) + `    <main class="tool">
      <p class="tool-section-title">By oven temperature</p>
      <p class="salary-links">${AF_PAGES.map((c) => `<a href="${afSlug(c)}">${c}°C oven in an air fryer</a>`).join(" ")}</p>
      <p class="tool-hint" style="margin-top:8px;">Converting between °C, fan, °F and gas mark? Use the <a href="${BASE}">oven temperature converter</a>.</p>
    </main>
` });
}
function afPage(c) {
  const q = [
    [`What is ${c}°C in an air fryer?`, `About ${c - AF.lessC}°C for fresh food, with ${AF.timeLessPct[0]}–${AF.timeLessPct[1]}% less time than the oven: ${c}°C for 30 minutes becomes ${c - AF.lessC}°C for ${afTimes(30).join("–")} minutes.`],
    [`What if the recipe says ${c}°C fan?`, `Use the same starting point — ${c - AF.lessC}°C — and check the food a little early.`],
    [`What about frozen food at ${c}°C?`, `Keep it at ${c}°C and cook for about half the oven time, then check it's piping hot all the way through.`]
  ];
  return page({ path: afSlug(c), crumbs: [["Home", "/"], ["Air Fryer Conversion", AFB]], crumb: `${c}°C oven in an air fryer`, back: [AFB, "Air fryer conversion"],
    title: site.fitTitle(`${c}°C Oven to Air Fryer — ${c - AF.lessC}°C and ${AF.timeLessPct[0]}–${AF.timeLessPct[1]}% Less Time`, `${c}°C Oven to Air Fryer — ${c - AF.lessC}°C`),
    desc: `A recipe at ${c}°C (${r0(toF(c))}°F) in the oven cooks at about ${c - AF.lessC}°C in an air fryer, for ${AF.timeLessPct[0]}–${AF.timeLessPct[1]}% less time. Times for 10 to 60 minutes, fresh and frozen.`,
    h1: `${c}°C oven in an air fryer`, sub: `An oven recipe at ${c}°C cooks at about <strong>${c - AF.lessC}°C</strong> in an air fryer, for ${AF.timeLessPct[0]}–${AF.timeLessPct[1]}% less time.`, q,
    body: afTool(c, 30) + afTable(c), moreTitle: "Other oven temperatures", more: AF_PAGES.filter((x) => x !== c).map((x) => `<a href="${afSlug(x)}">${x}°C oven in an air fryer</a>`).join(" ") + ` <a href="${BASE}">Oven temperature converter</a>` });
}

// ---------------------------------------------------------------- write

const urls = [];
const put = (url, html, pri) => { site.write(url.replace(/^\/|\/$/g, ""), html); if (pri) urls.push([url, pri]); };
put(BASE, hub());
C_PAGES.forEach((c) => put(cSlug(c), cPage(c), "0.5"));
F_PAGES.forEach((f) => put(fSlug(f), fPage(f), "0.5"));
GAS.forEach((g) => put(gSlug(g.mark), gasPage(g), "0.5"));
FAN_PAGES.forEach((c) => put(fanSlug(c), fanPage(c), "0.5"));
site.prune("oven-temperature-converter", /^(\d+(c|f)-to-(f|c)|gas-mark-\d|\d+c-fan-to-conventional)$/);
put(AFB, afHub());
AF_PAGES.forEach((c) => put(afSlug(c), afPage(c), "0.5"));
site.prune("air-fryer-conversion", /^\d+c$/);
site.sitemapBlock("oven and air fryer pages", "tools/build-oven-pages.js", urls);
console.log(`built the oven temperature converter, the air fryer converter and ${urls.length} pages`);
