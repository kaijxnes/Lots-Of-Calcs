#!/usr/bin/env node
/* Finish-time pages for the four standard race distances:

       /pace/marathon-in-4-hours/     9:09 a mile, 5:41 a km, splits
       /pace/5k-in-25-minutes/        8:03 a mile, 5:00 a km

       node tools/build-pace-pages.js

   Pace = time ÷ distance. A marathon is 42.195 km and a half 21.0975 km;
   a mile is 1.609344 km. Paces are rounded to the nearest second. */
const site = require("./lib/site.js");
const { SITE } = site;

const BASE = "/pace/";
const MILE = 1.609344;
const RACES = {
  "5k": { name: "5K", km: 5, times: range(15, 45, 1).map((m) => m * 60) },
  "10k": { name: "10K", km: 10, times: range(30, 90, 5).map((m) => m * 60) },
  "half-marathon": { name: "half marathon", km: 21.0975, times: range(75, 180, 5).map((m) => m * 60) },
  "marathon": { name: "marathon", km: 42.195, times: range(150, 360, 15).map((m) => m * 60) }
};
function range(a, b, s) { const o = []; for (let v = a; v <= b; v += s) o.push(v); return o; }

const hms = (sec) => {
  sec = Math.round(sec);
  const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
};
function words(sec) {
  const h = Math.floor(sec / 3600), m = Math.round(sec % 3600 / 60);
  if (!h) return `${m} minutes`;
  if (!m) return `${h} hour${h > 1 ? "s" : ""}`;
  return `${h} hour${h > 1 ? "s" : ""} ${m} minutes`;
}
function slugTime(sec) {
  const h = Math.floor(sec / 3600), m = Math.round(sec % 3600 / 60);
  if (!h) return `${m}-minutes`;
  if (!m) return `${h}-hour${h > 1 ? "s" : ""}`;
  return `${h}-hour${h > 1 ? "s" : ""}-${m}-minutes`;
}
const slug = (r, t) => `${r}-in-${slugTime(t)}`;
const label = (r) => RACES[r].name.replace(/^./, (c) => c.toUpperCase());
const titleLabel = (r) => RACES[r].name.replace(/\b[a-z]/g, (c) => c.toUpperCase());
const sub = (r, t) => (r === "marathon" ? 4 : r === "half-marathon" ? 2 : 0);

function page(r, t) {
  const R = RACES[r], perKm = t / R.km, perMile = perKm * MILE, kmh = R.km / (t / 3600), mph = kmh / MILE;
  const url = SITE + `${BASE}${slug(r, t)}/`, L = label(r);
  const W = words(t).replace(/\b[a-z]/g, (c) => c.toUpperCase());
  const title = site.fitTitle(`${titleLabel(r)} in ${W}: Pace ${hms(perMile)}/mile, ${hms(perKm)}/km (With Splits)`, `${titleLabel(r)} in ${W}: ${hms(perMile)}/mile, ${hms(perKm)}/km`);
  const desc = `To run a ${R.name} in ${words(t)} (${hms(t)}), hold ${hms(perKm)} per km or ${hms(perMile)} per mile — ${kmh.toFixed(1)} km/h (${mph.toFixed(1)} mph). With km and mile splits.`;
  const kmRows = [], step = R.km > 21 ? 5 : R.km > 10 ? 2 : 1;
  for (let k = step; k < R.km; k += step) kmRows.push([`${k} km`, hms(perKm * k)]);
  kmRows.push([`<strong>${R.km} km (finish)</strong>`, `<strong>${hms(t)}</strong>`]);
  const miles = R.km / MILE, mileRows = [], mstep = miles > 13 ? (miles > 20 ? 2 : 1) : 1;
  for (let m = mstep; m < miles; m += mstep) mileRows.push([`Mile ${m}`, hms(perMile * m)]);
  mileRows.push([`<strong>${(Math.round(miles * 100) / 100)} miles (finish)</strong>`, `<strong>${hms(t)}</strong>`]);
  const others = R.times.map((x) => [x === t ? `<strong>${hms(x)}</strong>` : `<a href="${BASE}${slug(r, x)}/">${hms(x)}</a>`, hms(x / R.km), hms(x / R.km * MILE)]);
  const near = site.neighbours(R.times, t, 6).concat([t]).sort((a, b) => a - b).map((x) => [x === t ? `<strong>${hms(x)}</strong>` : `<a href="${BASE}${slug(r, x)}/">${hms(x)}</a>`, hms(x / R.km), hms(x / R.km * MILE)]);
  const equiv = Object.keys(RACES).filter((o) => o !== r).map((o) => {
    /* Riegel's formula, T2 = T1 × (D2/D1)^1.06, a common predictor */
    const p = t * Math.pow(RACES[o].km / R.km, 1.06);
    return [label(o), hms(p)];
  });
  const q = [
    [`What pace do I need for a ${words(t)} ${R.name}?`, `${hms(perKm)} per kilometre, or ${hms(perMile)} per mile, held for the whole ${R.km} km.`],
    [`What speed is a ${words(t)} ${R.name}?`, `${kmh.toFixed(2)} km/h, or ${mph.toFixed(2)} mph — the number to set on a treadmill.`],
    [`What would a ${words(t)} ${R.name} predict for other distances?`, `Using Riegel's formula, a common predictor: ${equiv.map((e) => `${e[0]} ${e[1]}`).join(", ")}. Predictions for longer races assume you've trained for the distance.`]
  ];
  const ld = [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], ["Pace Calculator", SITE + BASE], [`${L} in ${words(t)}`, url]]), site.faqLd(q)];
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="${BASE}">← Pace calculator</a>
      <h1 class="page-title">${L} in ${words(t)}: what pace?</h1>
      <p class="page-subtitle">A ${hms(t)} ${R.name} is <strong>${hms(perKm)} per km</strong> or <strong>${hms(perMile)} per mile</strong> — ${kmh.toFixed(1)} km/h.</p>
    </header>

    <main class="tool">
      <div class="result-box">
        <div class="result-grid">
          <div class="result-row highlight"><span class="r-label">Pace per km</span><span class="r-value">${hms(perKm)}</span></div>
          <div class="result-row highlight"><span class="r-label">Pace per mile</span><span class="r-value">${hms(perMile)}</span></div>
          <div class="result-row"><span class="r-label">Speed</span><span class="r-value">${kmh.toFixed(2)} km/h · ${mph.toFixed(2)} mph</span></div>
          <div class="result-row"><span class="r-label">Distance</span><span class="r-value">${R.km} km (${(Math.round(miles * 100) / 100)} miles)</span></div>
        </div>
      </div>
      <p class="tool-hint" style="margin-top:12px;">Even pace throughout. For any distance and time, or your own splits, use the <a href="${BASE}">pace calculator</a>.</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">Splits</p>
      <div class="jo-grid">
        <div class="jo-side">
${site.table(["Kilometre", "Time"], kmRows, 200)}        </div>
        <div class="jo-side">
${site.table(["Mile", "Time"], mileRows, 200)}        </div>
      </div>
    </main>

    <main class="tool">
      <p class="tool-section-title">Other ${R.name} times</p>
${site.table(["Finish time", "Per km", "Per mile"], R.times.length > 14 ? near : others, 300)}      <p class="tool-section-title" style="margin-top:20px;">Equivalent times at other distances</p>
${site.table(["Race", "Predicted time"], equiv, 260)}      <p class="tool-hint" style="margin-top:12px;">Predicted with Riegel's formula (time × (distance ratio)<sup>1.06</sup>), a widely used rule of thumb.</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">Frequently asked questions</p>
${site.faqHtml(q)}    </main>

${site.FOOTER}
  </div>
</body>
</html>
`;
}

/* Hand checks: marathon in 4h = 5:41/km, 9:09/mile; 5K in 25 min = 5:00/km, 8:03/mile */
if (hms(14400 / 42.195) !== "5:41" || hms(14400 / 42.195 * MILE) !== "9:09" || hms(1500 / 5) !== "5:00" || hms(300 * MILE) !== "8:03") throw new Error("pace check");

const urls = [];
Object.keys(RACES).forEach((r) => RACES[r].times.forEach((t) => { site.write(`pace/${slug(r, t)}`, page(r, t)); urls.push([`${BASE}${slug(r, t)}/`, "0.4"]); }));
site.hubBlock(BASE, "pace pages", "tools/build-pace-pages.js", `    <main class="tool">
      <p class="tool-section-title">Pace for common finish times</p>
${Object.keys(RACES).map((r) => `      <p class="salary-links"><strong>${label(r)}:</strong> ${RACES[r].times.map((t) => `<a href="${BASE}${slug(r, t)}/">${hms(t)}</a>`).join(" ")}</p>`).join("\n")}
    </main>

`);
site.prune("pace", /^(5k|10k|half-marathon|marathon)-in-[a-z0-9-]+$/);
site.sitemapBlock("pace pages", "tools/build-pace-pages.js", urls);
console.log(`built ${urls.length} pace pages`);
