#!/usr/bin/env node
/* Area and speed tools:

       /square-footage-calculator/                 area in sq ft, m², sq yd and acres
       /square-footage-calculator/12x12-room/      a room in feet
       /square-footage-calculator/4x5-metres/      a room in metres
       /speed-distance-time/                       solve for speed, distance or time

       node tools/build-measure-pages.js

   Exact unit definitions only (1 ft = 0.3048 m, 1 mile = 1,609.344 m,
   1 acre = 43,560 sq ft, 1 nautical mile = 1,852 m). */
const site = require("./lib/site.js");
const related = require("./related.js");
const { esc, SITE } = site;

const FT = 0.3048, SQFT_M2 = FT * FT;
const n2 = (v, d) => v.toLocaleString("en-GB", { maximumFractionDigits: d === undefined ? 2 : d });
const row = (label, id, value, cls) => `          <div class="result-row${cls ? " " + cls : ""}"><span class="r-label">${label}</span><span class="r-value" id="${id}">${value}</span></div>`;
const fld = (id, label, value, extra) => `        <div class="field"><label for="${id}">${label}</label><input type="number" id="${id}" value="${value}" min="0" step="any" inputmode="decimal"${extra || ""}></div>`;
if (Math.abs(144 * SQFT_M2 - 13.378) > 0.001) throw new Error("sq ft to m²");

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
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(o.q)}    </main>

${o.related ? related.block(o.path) : `    <main class="tool">
      <h2 class="tool-section-title">${esc(o.moreTitle)}</h2>
      <p class="salary-links">${o.more}</p>
    </main>
`}
${site.FOOTER}
  </div>
  <script src="/measure.js"></script>
</body>
</html>
`;
}

// ---------------------------------------------------------------- area

const AB = "/square-footage-calculator/";
const FT_ROOMS = [[10, 10], [10, 12], [12, 12], [12, 14], [12, 15], [14, 14], [15, 15], [16, 16], [10, 20], [12, 20], [20, 20], [24, 24], [20, 30], [30, 40], [40, 60]];
const M_ROOMS = [[3, 3], [3, 4], [4, 4], [3, 5], [4, 5], [5, 5], [5, 6], [6, 6], [10, 10]];
const fSlug = ([a, b]) => `${AB}${a}x${b}-room/`, mSlug = ([a, b]) => `${AB}${a}x${b}-metres/`;

function areaTool(unit, a, b) {
  const sqm = unit === "ft" ? a * b * SQFT_M2 : a * b, sqft = sqm / SQFT_M2;
  const opt = (v, l) => `<option value="${v}"${v === unit ? " selected" : ""}>${l}</option>`;
  return `    <main class="tool" id="ar-tool">
      <div class="field-row">
        <div class="field"><label for="ar-shape">Shape</label><select id="ar-shape"><option value="rect" selected>Rectangle or square</option><option value="circle">Circle</option><option value="tri">Triangle</option></select></div>
        <div class="field"><label for="ar-unit">Measured in</label><select id="ar-unit">${opt("ft", "Feet")}${opt("in", "Inches")}${opt("yd", "Yards")}${opt("m", "Metres")}${opt("cm", "Centimetres")}</select></div>
      </div>
      <div class="field-row">
${fld("ar-a", '<span id="ar-al">Length</span>', a)}
${fld("ar-b", '<span id="ar-bl">Width</span>', b)}
      </div>
      <div class="field-row">
${fld("ar-n", "How many of these areas", 1, ' step="1"')}
${fld("ar-price", "Price per sq ft or m² (optional)", "")}
      </div>
      <div class="result-box" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="ar-sqft">${n2(sqft)} sq ft</div>
          <div class="label">square feet</div>
        </div>
        <div class="result-grid">
${row("Square metres", "ar-sqm", `${n2(sqm)} m²`, "highlight")}
${row("Square yards", "ar-sqyd", `${n2(sqft / 9)} sq yd`)}
${row("Acres", "ar-acre", n2(sqft / 43560, 4))}
${row("Cost", "ar-cost", "—")}
        </div>
      </div>
      <p class="tool-hint" style="margin-top:12px;">For an L-shaped room, split it into two rectangles and add them up. Cost uses the price per square foot if you measured in feet, inches or yards, and per square metre if you measured in metres.</p>
    </main>
`;
}
function ftRoom(r) {
  const [a, b] = r, sqft = a * b, sqm = sqft * SQFT_M2;
  const q = [
    [`How many square feet is a ${a}x${b} room?`, `${sqft} square feet: ${a} × ${b} = ${sqft}.`],
    [`What is ${a}x${b} feet in square metres?`, `${n2(sqm)} m² — ${sqft} sq ft × 0.0929 (one square foot is exactly 0.09290304 m²).`],
    [`How many square yards is ${a}x${b}?`, `${n2(sqft / 9)} square yards — 9 square feet to the square yard.`]
  ];
  const others = FT_ROOMS.filter((x) => x !== r).map((x) => `<a href="${fSlug(x)}">${x[0]}x${x[1]} room</a>`).concat(M_ROOMS.map((x) => `<a href="${mSlug(x)}">${x[0]}m × ${x[1]}m</a>`)).join(" ");
  return page({ path: fSlug(r), crumbs: [["Home", "/"], ["Square Footage Calculator", AB]], crumb: `${a}x${b} room`, back: [AB, "Square footage calculator"],
    title: `How Many Square Feet Is a ${a}x${b} Room? ${sqft} sq ft (${n2(sqm)} m²)`,
    desc: `A ${a} × ${b} ft room is ${sqft} square feet, ${n2(sqm)} square metres or ${n2(sqft / 9)} square yards. Work out any area, and the cost at a price per square foot.`,
    h1: `${a}x${b} room in square feet`, sub: `A ${a} × ${b} ft room is <strong>${sqft} sq ft</strong> — ${n2(sqm)} m².`, q,
    body: areaTool("ft", a, b), moreTitle: "Other room sizes", more: others });
}
function mRoom(r) {
  const [a, b] = r, sqm = a * b, sqft = sqm / SQFT_M2;
  const q = [
    [`What is ${a}m × ${b}m in square feet?`, `${n2(sqft)} square feet: ${a} × ${b} = ${sqm} m², and one square metre is ${n2(1 / SQFT_M2, 3)} sq ft.`],
    [`How many square metres is ${a}m × ${b}m?`, `${sqm} m².`],
    [`What is ${a}m × ${b}m in feet?`, `About ${n2(a / FT, 1)} ft × ${n2(b / FT, 1)} ft.`]
  ];
  const others = M_ROOMS.filter((x) => x !== r).map((x) => `<a href="${mSlug(x)}">${x[0]}m × ${x[1]}m</a>`).concat(FT_ROOMS.map((x) => `<a href="${fSlug(x)}">${x[0]}x${x[1]} room</a>`)).join(" ");
  return page({ path: mSlug(r), crumbs: [["Home", "/"], ["Square Footage Calculator", AB]], crumb: `${a}m × ${b}m`, back: [AB, "Square footage calculator"],
    title: `${a}m x ${b}m in Square Feet — ${sqm} m² Is ${n2(sqft)} sq ft`,
    desc: `A ${a}m × ${b}m room is ${sqm} square metres, or ${n2(sqft)} square feet (about ${n2(a / FT, 1)} × ${n2(b / FT, 1)} ft). Work out any area in feet or metres.`,
    h1: `${a}m × ${b}m in square feet`, sub: `${a}m × ${b}m is <strong>${sqm} m²</strong> — ${n2(sqft)} sq ft.`, q,
    body: areaTool("m", a, b), moreTitle: "Other room sizes", more: others });
}
function areaHub() {
  const q = [
    ["How do I calculate square footage?", "Measure the length and width in feet and multiply them: a 12 × 14 ft room is 168 square feet. For a circle, π × radius²; for a triangle, half the base × the height."],
    ["How do I convert square feet to square metres?", "Multiply by 0.0929 (exactly 0.09290304): 100 sq ft is 9.29 m². The other way, multiply square metres by 10.764."],
    ["How do I measure an L-shaped room?", "Split it into two rectangles, work out each, and add them together. Set 'How many of these areas' to add up several the same size."],
    ["How many square feet in an acre?", "43,560 square feet, or about 4,047 square metres."]
  ];
  const links = FT_ROOMS.map((x) => `<a href="${fSlug(x)}">${x[0]}x${x[1]} room</a>`).concat(M_ROOMS.map((x) => `<a href="${mSlug(x)}">${x[0]}m × ${x[1]}m</a>`)).join(" ");
  return page({ path: AB, app: "Square Footage Calculator", crumbs: [["Home", "/"]], crumb: "Square Footage Calculator", back: ["/", "All calculators"], related: true,
    title: "Square Footage Calculator — Area in sq ft, m², Yards & Acres",
    desc: "Work out the area of a room, floor or plot in square feet, square metres, square yards and acres, from feet, inches, yards, metres or centimetres — and the cost at a price per square foot.",
    h1: "Square footage calculator", sub: "The area of a room, floor or plot in square feet and square metres — rectangles, circles and triangles.", q,
    body: areaTool("ft", 12, 14) + `    <main class="tool">
      <h2 class="tool-section-title">Common room sizes</h2>
      <p class="salary-links">${links}</p>
    </main>
` });
}

// ---------------------------------------------------------------- speed, distance, time

function speedHub() {
  const q = [
    ["What is the formula for speed, distance and time?", "Speed = distance ÷ time; distance = speed × time; time = distance ÷ speed. 150 miles at 60 mph takes 2.5 hours — 2 hours 30 minutes."],
    ["How do I convert mph to km/h?", "Multiply by 1.609344 (a mile is exactly 1,609.344 metres): 70 mph is 112.7 km/h. To go back, divide."],
    ["How long does it take to drive 100 miles?", "At an average of 50 mph, 2 hours; at 60 mph, 1 hour 40 minutes. Real journeys average less than the speed limit once junctions, traffic and stops are included."],
    ["What is a knot?", "One nautical mile (exactly 1,852 metres) an hour — about 1.15 mph."]
  ];
  const sel = (id, opts, sel0) => `<select id="${id}">${opts.map(([v, l]) => `<option value="${v}"${v === sel0 ? " selected" : ""}>${l}</option>`).join("")}</select>`;
  const DU = [["km", "km"], ["mi", "miles"], ["m", "metres"], ["nmi", "nautical miles"]], SU = [["kmh", "km/h"], ["mph", "mph"], ["ms", "m/s"], ["kn", "knots"]];
  return page({ path: "/speed-distance-time/", app: "Speed, Distance and Time Calculator", crumbs: [["Home", "/"]], crumb: "Speed, Distance & Time", back: ["/", "All calculators"], related: true,
    title: "Speed Distance Time Calculator — Work Out Speed, Distance or Time",
    desc: "Work out speed from distance and time, distance from speed and time, or journey time from distance and speed — in km/h, mph, m/s or knots. 150 miles at 60 mph takes 2 hours 30 minutes.",
    h1: "Speed, distance and time calculator", sub: "Fill in two of the three and get the third — in km/h, mph, m/s or knots.", q,
    body: `    <main class="tool" id="sd-tool">
      <div class="field"><label for="sd-solve">Work out</label>${sel("sd-solve", [["time", "Time"], ["speed", "Speed"], ["dist", "Distance"]], "time")}</div>
      <div class="field-row" id="sd-drow">
${fld("sd-d", "Distance", 150)}
        <div class="field"><label for="sd-du">Distance unit</label>${sel("sd-du", DU, "mi")}</div>
      </div>
      <div class="field-row" id="sd-srow">
${fld("sd-s", "Speed", 60)}
        <div class="field"><label for="sd-su">Speed unit</label>${sel("sd-su", SU, "mph")}</div>
      </div>
      <div class="field-row" id="sd-trow" hidden>
${fld("sd-h", "Hours", 2, ' step="1"')}
${fld("sd-m", "Minutes", 30, ' step="1"')}
${fld("sd-sec", "Seconds", 0, ' step="1"')}
      </div>
      <div class="result-box" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="sd-out">2 hours 30 minutes</div>
          <div class="label" id="sd-label">journey time</div>
        </div>
        <div class="result-grid">
${row("Also", "sd-alt", "2.5 hours")}
        </div>
      </div>
    </main>
` });
}

const urls = [];
const put = (url, html, pri) => { site.write(url.replace(/^\/|\/$/g, ""), html); if (pri) urls.push([url, pri]); };
put(AB, areaHub());
FT_ROOMS.forEach((r) => put(fSlug(r), ftRoom(r), "0.5"));
M_ROOMS.forEach((r) => put(mSlug(r), mRoom(r), "0.5"));
site.prune("square-footage-calculator", /^\d+x\d+-(room|metres)$/);
put("/speed-distance-time/", speedHub());
site.sitemapBlock("area pages", "tools/build-measure-pages.js", urls);
console.log(`built the square footage and speed calculators and ${urls.length} area pages`);
