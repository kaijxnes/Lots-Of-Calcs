#!/usr/bin/env node
/* "How long would it take to get to Mars?" — the space travel time calculator
   and a page per destination and per speed:

       /how-long-to-get-to/                    calculator + every destination
       /how-long-to-get-to/mars/               Mars at every speed
       /how-long-to-get-to/mars/by-car/        Mars at 70 mph

       node tools/build-space-travel-pages.js

   Distances, speeds and the arithmetic come from space-travel.js, the same
   module the calculator runs in the browser. */
const site = require("./lib/site.js");
const related = require("./related.js");
const S = require("../space-travel.js");
const { esc, SITE } = site;

const BASE = "/how-long-to-get-to/";
const DEF_SPEED = "by-car";
const dur = (km, v) => S.duration(S.hours(km, v.kmh));
const titleCase = (t) => t.replace(/\b([a-z])/g, (m) => m.toUpperCase());
const Cap = (t) => t[0].toUpperCase() + t.slice(1);
const where = (d) => (d.star ? "Proxima Centauri, the nearest star" : d.name);
const distWord = (d) => (d.star ? "" : d.def === "closest" ? " at its closest" : " on average");

/* Question wording for each speed: "How long would it take to drive to Mars?" */
const ASK = {
  "walking": (n) => `How long would it take to walk to ${n}?`,
  "by-car": (n) => `How long would it take to drive to ${n}?`,
  "by-plane": (n) => `How long would it take to fly to ${n} in a plane?`,
  "speed-of-sound": (n) => `How long would it take to get to ${n} at the speed of sound?`,
  "space-station-speed": (n) => `How long would it take to get to ${n} at space station speed?`,
  "apollo-speed": (n) => `How long would it take to get to ${n} at Apollo speed?`,
  "fastest-spacecraft": (n) => `How long would it take to get to ${n} at the fastest spacecraft's speed?`,
  "speed-of-light": (n) => `How long does light take to get to ${n}?`
};
const SHORT = { "walking": "Walk", "by-car": "Drive", "by-plane": "Fly by plane", "speed-of-sound": "Speed of sound", "space-station-speed": "Space station speed", "apollo-speed": "Apollo speed", "fastest-spacecraft": "Fastest spacecraft", "speed-of-light": "Speed of light" };

const STRAIGHT = "These are straight-line times at a steady speed, as if the planets stood still. Real spacecraft can't fly straight there: they launch into a curved path round the Sun that meets the planet where it will be, so the route is longer, and they coast most of the way.";

/* The calculator, preset to a destination and speed. The figures in the
   HTML are the ones space-travel.js shows for the same settings. */
function tool(d, v) {
  const km = d.d[d.def];
  const dests = S.DEST.map((x) => `<option value="${x.slug}"${x === d ? " selected" : ""}>${esc(Cap(x.star ? "Proxima Centauri (nearest star)" : x.name))}</option>`).join("");
  const dists = ["closest", "average", "farthest"].filter((k) => d.d[k] != null).map((k) => `<option value="${k}"${k === d.def ? " selected" : ""}>${d.star ? "4.2465 light-years" : `${S.DIST_LABEL[k]} — ${S.bigNum(d.d[k])} km`}</option>`).join("");
  const speeds = S.SPEEDS.map((x) => `<option value="${x.slug}"${x === v ? " selected" : ""}>${esc(x.name)} — ${esc(x.label)}</option>`).join("") + `<option value="custom">Your own speed</option>`;
  return `    <main class="tool" id="st-tool">
      <div class="field-row">
        <div class="field"><label for="st-dest">Going to</label><select id="st-dest">${dests}</select></div>
        <div class="field"><label for="st-dist">Distance</label><select id="st-dist"${d.star ? " disabled" : ""}>${dists}</select></div>
      </div>
      <div class="field"><label for="st-speed">Speed</label><select id="st-speed">${speeds}</select></div>
      <div class="field-row" id="st-custom-row" style="display:none;">
        <div class="field"><label for="st-custom">Your speed</label><input type="number" id="st-custom" value="100" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="st-unit">Unit</label><select id="st-unit"><option value="kmh" selected>km/h</option><option value="mph">mph</option><option value="kms">km/s</option></select></div>
      </div>
      <p class="tool-hint" id="st-error" role="alert" style="color: var(--bad); display: none;"></p>
      <div class="result-box" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="st-time">${esc(dur(km, v))}</div>
          <div class="label" id="st-what">to reach ${esc(d.name)}</div>
        </div>
        <div class="result-grid">
          <div class="result-row"><span class="r-label">Distance</span><span class="r-value" id="st-km">${esc(S.distance(km))}</span></div>
          <div class="result-row"><span class="r-label">Light takes</span><span class="r-value" id="st-light">${esc(dur(km, S.speed("speed-of-light")))}</span></div>
        </div>
      </div>
    </main>
`;
}

function realTrip(d) {
  if (!d.trip) return "";
  return `<p class="about-text"><strong>How long it really took:</strong> ${esc(d.trip.took)}. NASA's ${esc(d.trip.craft)} ${esc(d.trip.detail)}.</p>`;
}

function destTable(d) {
  const keys = ["closest", "average", "farthest"].filter((k) => d.d[k] != null);
  const head = ["Speed"].concat(keys.map((k) => (d.star ? "Time" : S.DIST_LABEL[k])));
  const rows = S.SPEEDS.map((v) => [`<a href="${BASE}${d.slug}/${v.slug}/">${esc(v.name)}</a><br><span class="tool-hint">${esc(v.label)}</span>`].concat(keys.map((k) => esc(dur(d.d[k], v)))));
  return site.table(head, rows, keys.length > 2 ? 520 : 420);
}

function destPage(d) {
  const url = SITE + `${BASE}${d.slug}/`;
  const km = d.d[d.def];
  const car = S.speed("by-car"), light = S.speed("speed-of-light"), apollo = S.speed("apollo-speed"), fast = S.speed("fastest-spacecraft");
  const title = `How Long Would It Take to Get to ${d.star ? "Proxima Centauri (the Nearest Star)" : d.name}? — By Car, Plane, Rocket and Light`;
  const desc = `${Cap(where(d))} is ${S.distance(km)} away${distWord(d)}. Driving at 70 mph would take ${dur(km, car)}; light takes ${dur(km, light)}.${d.trip ? ` NASA's ${d.trip.craft} took ${d.trip.took}.` : ""}`;
  const q = [
    [`How long does it take to get to ${d.name}?`, d.trip
      ? `${Cap(d.trip.took)} for NASA's ${d.trip.craft}, which ${d.trip.detail}. Flying in a straight line at Apollo 10's top speed (24,791 mph) would take ${dur(km, apollo)}${distWord(d)}.`
      : `At the speed of the fastest spacecraft yet, Parker Solar Probe (430,000 mph), it would take ${dur(km, fast)}. Even light takes ${dur(km, light)}.`],
    [`How far away is ${d.name}?`, d.star
      ? `4.2465 light-years, or about ${S.distance(km)}. It is the closest star to the Sun.`
      : `${Cap(S.DIST_LABEL.closest.toLowerCase())}, ${S.distance(d.d.closest)}; at its farthest, ${S.distance(d.d.farthest)}${d.d.average ? `; on average ${S.distance(d.d.average)}` : ""}. ${d.slug === "moon" || d.slug === "sun" ? "The orbit isn't a perfect circle, so the distance changes through the " + (d.slug === "moon" ? "month." : "year.") : "The distance changes as Earth and " + d.name + " go round the Sun at different speeds."}`],
    [ASK["by-car"](d.name), `${Cap(dur(km, car))} at 70 mph without stopping${distWord(d)}${d.star ? "" : `, or ${dur(d.d.farthest, car)} at its farthest`}.`],
    [ASK["speed-of-light"](d.name), `${Cap(dur(km, light))}${distWord(d)}${d.star ? "" : ` and ${dur(d.d.farthest, light)} at its farthest`}. That is also how long a radio message takes${d.star ? " — and how old the starlight you see is" : ""}.`]
  ];
  const ld = [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], ["How Long to Get There", SITE + BASE], [`To ${d.star ? "Proxima Centauri" : d.name}`, url]]), site.faqLd(q)];
  const others = S.DEST.filter((x) => x !== d).map((x) => `<a href="${BASE}${x.slug}/">${esc(Cap(x.star ? "the nearest star" : x.name))}</a>`).join(" ");
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="${BASE}">← How long to get there</a>
      <h1 class="page-title">How long to get to ${esc(d.star ? "the nearest star" : d.name)}?</h1>
      <p class="page-subtitle">${esc(Cap(where(d)))} is ${esc(S.distance(km))} away${distWord(d)}.</p>
    </header>

${tool(d, S.speed(DEF_SPEED))}
    <main class="tool">
      <p class="tool-section-title">${esc(Cap(d.star ? "Proxima Centauri" : d.name))} at every speed</p>
${destTable(d)}      ${realTrip(d)}
      <p class="tool-hint" style="margin-top:12px;">${esc(STRAIGHT)}</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">Frequently asked questions</p>
${site.faqHtml(q)}    </main>

    <div class="hub-group-title" style="margin-top:28px;">Other destinations</div>
    <p class="salary-links">${others}</p>

${site.FOOTER}
  </div>
  <script src="/space-travel.js"></script>
</body>
</html>
`;
}

const TITLE = {
  "walking": (n) => `How Long Would It Take to Walk to ${n}?`,
  "by-car": (n) => `How Long Would It Take to Drive to ${n}?`,
  "by-plane": (n) => `How Long Would It Take to Fly to ${n} by Plane?`,
  "speed-of-sound": (n) => `How Long to Get to ${n} at the Speed of Sound?`,
  "space-station-speed": (n) => `How Long to Get to ${n} at Space Station Speed?`,
  "apollo-speed": (n) => `How Long to Get to ${n} at Apollo Speed?`,
  "fastest-spacecraft": (n) => `How Long to Get to ${n} at the Fastest Spacecraft's Speed?`,
  "speed-of-light": (n) => `How Long Does Light Take to Reach ${n}?`
};
function speedTitle(d, v, km) {
  return `${TITLE[v.slug](d.star ? "Proxima Centauri" : d.name)} — ${titleCase(dur(km, v))}${v.slug === "by-car" ? " at 70 mph" : ""}`;
}

function speedPage(d, v) {
  const url = SITE + `${BASE}${d.slug}/${v.slug}/`;
  const km = d.d[d.def];
  const light = v.slug === "speed-of-light";
  const title = speedTitle(d, v, km);
  const desc = `${v.name} (${v.label}), getting to ${where(d)} would take ${dur(km, v)}${distWord(d)}${d.star ? "" : ` and ${dur(d.d.farthest, v)} at its farthest`}. With the same speed to every planet${light ? "" : " and the speed of light"}.`;
  const ask = ASK[v.slug](d.name);
  const q = [
    [ask, `${Cap(dur(km, v))}${distWord(d)}, covering ${S.distance(km)} non-stop at ${v.label}${d.star ? "" : `. At its farthest, ${S.distance(d.d.farthest)}, it would take ${dur(d.d.farthest, v)}`}.`],
    [`How is that worked out?`, `Distance divided by speed: ${S.bigNum(km)} km ÷ ${v.kmh.toLocaleString("en-GB", { maximumFractionDigits: 2 })} km/h = ${Math.round(S.hours(km, v.kmh)).toLocaleString("en-GB")} hours. ${STRAIGHT}`]
  ];
  if (d.trip) q.push([`How long did it actually take to get to ${d.name}?`, `${Cap(d.trip.took)} for NASA's ${d.trip.craft}, which ${d.trip.detail}.`]);
  if (!light) q.push([`How long does light take to get to ${d.name}?`, `${Cap(dur(km, S.speed("speed-of-light")))}${distWord(d)}.`]);
  const ld = [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], ["How Long to Get There", SITE + BASE], [`To ${d.star ? "Proxima Centauri" : d.name}`, SITE + `${BASE}${d.slug}/`], [v.name, url]]), site.faqLd(q)];
  const keys = ["closest", "average", "farthest"].filter((k) => d.d[k] != null);
  const distRows = keys.map((k) => [d.star ? "Distance" : S.DIST_LABEL[k], esc(S.distance(d.d[k])), esc(dur(d.d[k], v))]);
  const everyRows = S.DEST.map((x) => [x === d ? `<strong>${esc(Cap(x.star ? "Proxima Centauri" : x.name))}</strong>` : `<a href="${BASE}${x.slug}/${v.slug}/">${esc(Cap(x.star ? "Proxima Centauri" : x.name))}</a>`, esc(dur(x.d[x.def], v))]);
  const speeds = S.SPEEDS.filter((x) => x !== v).map((x) => `<a href="${BASE}${d.slug}/${x.slug}/">${esc(SHORT[x.slug])}</a>`).join(" ");
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="${BASE}${d.slug}/">← How long to get to ${esc(d.star ? "the nearest star" : d.name)}</a>
      <h1 class="page-title">${esc(ask)}</h1>
      <p class="page-subtitle">${esc(Cap(dur(km, v)))}${esc(distWord(d))}. ${esc(v.name)}: ${esc(v.label)}, ${esc(v.note)}.</p>
    </header>

${tool(d, v)}
    <main class="tool">
      <p class="tool-section-title">${esc(Cap(d.star ? "Proxima Centauri" : d.name))} ${esc(v.name.toLowerCase())}</p>
${site.table(["", "Distance", "Time"], distRows, 420)}      ${realTrip(d)}
      <p class="tool-section-title" style="margin-top:22px;">Every destination ${esc(v.name.toLowerCase())}</p>
${site.table(["Destination", "Time"], everyRows.map((r, i) => [r[0] + (S.DEST[i].star ? "" : `<br><span class="tool-hint">${esc(S.DIST_LABEL[S.DEST[i].def].toLowerCase())}</span>`), r[1]]), 360)}      <p class="tool-hint" style="margin-top:12px;">${esc(STRAIGHT)} Distances from NASA's planetary fact sheets.</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">Frequently asked questions</p>
${site.faqHtml(q)}    </main>

    <div class="hub-group-title" style="margin-top:28px;">${esc(Cap(d.star ? "Proxima Centauri" : d.name))} at other speeds</div>
    <p class="salary-links">${speeds}</p>

${site.FOOTER}
  </div>
  <script src="/space-travel.js"></script>
</body>
</html>
`;
}

function hub() {
  const url = SITE + BASE;
  const mars = S.dest("mars");
  const title = "How Long Would It Take to Get to Mars? — Space Travel Time Calculator";
  const desc = `How long to reach the Moon, Mars, every planet or the nearest star by car, plane, rocket or at the speed of light. Mars at its closest: ${dur(mars.d.closest, S.speed("by-car"))} by car, ${dur(mars.d.closest, S.speed("speed-of-light"))} for light.`;
  const cols = ["by-car", "by-plane", "apollo-speed", "speed-of-light"].map(S.speed);
  const rows = S.DEST.map((d) => [`<a href="${BASE}${d.slug}/">${esc(Cap(d.star ? "Proxima Centauri" : d.name))}</a>`].concat(cols.map((v) => `<a href="${BASE}${d.slug}/${v.slug}/">${esc(dur(d.d[d.def], v))}</a>`)));
  const q = [
    ["How long would it take to get to Mars?", `NASA's Perseverance rover took ${mars.trip.took}. In a straight line at its closest, ${S.distance(mars.d.closest)}, it would take ${dur(mars.d.closest, S.speed("by-car"))} by car, ${dur(mars.d.closest, S.speed("apollo-speed"))} at Apollo 10's top speed, and ${dur(mars.d.closest, S.speed("speed-of-light"))} for light.`],
    ["Why don't spacecraft go in a straight line?", STRAIGHT],
    ["What is the fastest spacecraft?", "NASA's Parker Solar Probe, which reached about 430,000 mph (692,000 km/h) on its closest pass of the Sun in December 2024 — faster than any other object people have made."],
    ["How long does light from the Sun take to reach us?", `About ${dur(S.dest("sun").d.average, S.speed("speed-of-light"))}, so you see the Sun as it was that long ago. Moonlight takes ${dur(S.dest("moon").d.average, S.speed("speed-of-light"))}.`]
  ];
  const ld = [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], ["How Long to Get There", url]]),
    { "@context": "https://schema.org", "@type": "WebApplication", name: "Space Travel Time Calculator", url, applicationCategory: "EducationalApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } }, site.faqLd(q)];
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="/">← All calculators</a>
      <h1 class="page-title">How long to get there?</h1>
      <p class="page-subtitle">Travel time to the Moon, the Sun, every planet and the nearest star — by car, plane, rocket or light.</p>
    </header>

${tool(mars, S.speed(DEF_SPEED))}
    <main class="tool">
      <p class="tool-section-title">Every destination</p>
${site.table(["Destination", "By car", "By plane", "Apollo speed", "Light"], rows, 560)}      <p class="tool-hint" style="margin-top:12px;">Planets at their closest to Earth; the Moon and Sun at their average distance. Pick a destination for every speed, the farthest distances and how long real spacecraft took. ${esc(STRAIGHT)}</p>
      <p class="tool-section-title" style="margin-top:22px;">Speeds used</p>
${site.table(["Speed", "", "Where it comes from"], S.SPEEDS.map((v) => [esc(v.name), esc(v.label), esc(Cap(v.note))]), 480)}    </main>

    <main class="tool">
      <p class="tool-section-title">Frequently asked questions</p>
${site.faqHtml(q)}    </main>

${related.block(BASE)}
${site.FOOTER}
  </div>
  <script src="/space-travel.js"></script>
</body>
</html>
`;
}

const urls = []; /* the hub itself is in the sitemap with the calculators */
site.write("how-long-to-get-to", hub());
S.DEST.forEach((d) => {
  site.write(`how-long-to-get-to/${d.slug}`, destPage(d));
  urls.push([`${BASE}${d.slug}/`, "0.6"]);
  S.SPEEDS.forEach((v) => { site.write(`how-long-to-get-to/${d.slug}/${v.slug}`, speedPage(d, v)); urls.push([`${BASE}${d.slug}/${v.slug}/`, "0.5"]); });
});
site.sitemapBlock("space travel pages", "tools/build-space-travel-pages.js", urls);
console.log(`built ${urls.length} space travel pages`);
