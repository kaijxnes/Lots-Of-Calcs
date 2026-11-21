#!/usr/bin/env node
/* "BTU for a 4m × 5m room" — radiator output by room size:

       /btu/4m-x-5m-room/     living room, bedroom, kitchen…; BTU and watts

       node tools/build-btu-pages.js

   The same rule of thumb as the BTU calculator (btu.js): room volume in
   cubic feet × 5 for living rooms and bathrooms, 4 for bedrooms and halls,
   3 for kitchens, then +10% for each outside wall beyond one, × 0.9 for
   double glazing, +15% for north-facing, +20% for French windows. Pages
   assume a 2.4 m ceiling, one outside wall and double glazing, and show
   the other cases in a table. The factors are read from the calculator's
   own page so the two can't disagree. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const { SITE } = site;

const BASE = "/btu/";
const FT = 3.280839895, W_PER_BTU = 3.412142, CEILING = 2.4;
const SIZES = [[2, 2], [2, 3], [2.5, 3], [3, 3], [3, 3.5], [3, 4], [3.5, 4], [4, 4], [3, 5], [4, 4.5], [4, 5], [4.5, 5], [5, 5], [4, 6], [5, 6], [6, 6], [5, 7], [6, 7], [6, 8], [7, 8], [8, 8], [8, 10]];

/* the calculator's room types and glazing factors */
const calc = fs.readFileSync(path.join(site.ROOT, "btu/index.html"), "utf8");
const block = (id) => calc.slice(calc.indexOf(`id="${id}"`), calc.indexOf("</select>", calc.indexOf(`id="${id}"`)));
const opts = (id) => [...block(id).matchAll(/<option value="([\d.]+)"[^>]*>([^<]+)<\/option>/g)].map((m) => ({ v: Number(m[1]), label: m[2] }));
const ROOMS = opts("room-type"), GLAZE = opts("glazing");
const DOUBLE = GLAZE.find((g) => /Double/.test(g.label)).v;
if (ROOMS.length < 4 || !DOUBLE) throw new Error("btu: couldn't read the calculator's factors");

const n = (v) => Math.round(v).toLocaleString("en-GB");
const dim = (x) => String(x);
const slug = ([l, w]) => `${dim(l)}m-x-${dim(w)}m-room`;
function btu([l, w], factor, walls, glaze) {
  const ft3 = (l * FT) * (w * FT) * (CEILING * FT);
  return ft3 * factor * (1 + 0.1 * ((walls === undefined ? 1 : walls) - 1)) * (glaze === undefined ? DOUBLE : glaze);
}

function page(sz) {
  const [l, w] = sz, living = ROOMS[0], bed = ROOMS.find((r) => /Bedroom/.test(r.label));
  const b = btu(sz, living.v), url = SITE + `${BASE}${slug(sz)}/`, area = l * w;
  const title = site.fitTitle(`BTU for a ${l}m × ${w}m Room — ${n(b)} BTU (${n(b / W_PER_BTU)} W) Radiator`, `BTU for a ${l}m × ${w}m Room: ${n(b)} BTU`);
  const desc = `A ${l}m × ${w}m living room (${area} m², 2.4 m ceiling) needs about ${n(b)} BTU/hr — ${n(b / W_PER_BTU)} watts of radiator output. A bedroom that size needs about ${n(btu(sz, bed.v))} BTU. Table by room type, walls and glazing.`;
  const rows = ROOMS.map((r) => [r.label, `${n(btu(sz, r.v))} BTU`, `${n(btu(sz, r.v) / W_PER_BTU)} W`]);
  const walls = [0, 1, 2, 3].map((k) => [k === 0 ? "None (internal room)" : `${k} outside wall${k > 1 ? "s" : ""}`, ...GLAZE.map((g) => `${n(btu(sz, living.v, k, g.v))} BTU`)]);
  const q = [
    [`How many BTU do I need for a ${l}m × ${w}m room?`, `About ${n(b)} BTU/hr for a living room with a 2.4 m ceiling, one outside wall and double glazing; ${n(btu(sz, bed.v))} BTU for a bedroom. More outside walls, single glazing or a north-facing room need more.`],
    [`How many watts of radiator for a ${l}m × ${w}m room?`, `About ${n(b / W_PER_BTU)} W for a living room (1 W = 3.412 BTU/hr). Radiator outputs are usually quoted at a 50°C temperature difference (ΔT50); a heat pump or low flow temperature system needs a bigger radiator for the same room.`],
    ["How accurate is this?", "It's a rule of thumb used for sizing a single radiator. For a whole new heating system or a heat pump, a heating engineer should do a room-by-room heat loss calculation, which allows for insulation, floor and ceiling and air changes."]
  ];
  const ld = [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], ["BTU Calculator", SITE + BASE], [`${l}m × ${w}m room`, url]]), site.faqLd(q)];
  const near = site.neighbours(SIZES.map(slug), slug(sz), 5).map((s) => SIZES.find((x) => slug(x) === s))
    .map((x) => [slug(x) === slug(sz) ? `<strong>${x[0]}m × ${x[1]}m</strong>` : `<a href="${BASE}${slug(x)}/">${x[0]}m × ${x[1]}m</a>`, `${n(btu(x, living.v))} BTU`, `${n(btu(x, living.v) / W_PER_BTU)} W`]);
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="${BASE}">← BTU calculator</a>
      <h1 class="page-title">BTU for a ${l}m × ${w}m room</h1>
      <p class="page-subtitle">A ${l}m × ${w}m living room needs about <strong>${n(b)} BTU/hr</strong> — <strong>${n(b / W_PER_BTU)} W</strong> of radiator output.</p>
    </header>

    <main class="tool">
      <p class="tool-section-title">By room type</p>
${site.table(["Room", "Heat needed", "In watts"], rows, 320)}      <p class="tool-hint" style="margin-top:12px;">${area} m² floor, ${CEILING} m ceiling, one outside wall, double glazing. For your exact room, ceiling height and windows, use the <a href="${BASE}">BTU calculator</a>.</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">Living room: outside walls and glazing</p>
${site.table(["Outside walls", ...GLAZE.map((g) => g.label)], walls, 460)}      <p class="about-text" style="margin-top:12px;">North-facing: add 15%. French windows or patio doors: add 20%.</p>
      <p class="tool-section-title" style="margin-top:20px;">Other room sizes (living room)</p>
${site.table(["Room", "BTU", "Watts"], near, 300)}    </main>

    <main class="tool">
      <p class="tool-section-title">Frequently asked questions</p>
${site.faqHtml(q)}    </main>

${site.FOOTER}
  </div>
</body>
</html>
`;
}

const urls = [];
SIZES.forEach((sz) => { site.write(`btu/${slug(sz)}`, page(sz)); urls.push([`${BASE}${slug(sz)}/`, "0.4"]); });
site.hubBlock(BASE, "btu pages", "tools/build-btu-pages.js", `    <main class="tool">
      <p class="tool-section-title">BTU by room size</p>
      <p class="salary-links">${SIZES.map((sz) => `<a href="${BASE}${slug(sz)}/">${sz[0]}m × ${sz[1]}m</a>`).join(" ")}</p>
    </main>

`);
site.prune("btu", /^[\d.]+m-x-[\d.]+m-room$/);
site.sitemapBlock("btu pages", "tools/build-btu-pages.js", urls);
console.log(`built ${urls.length} BTU pages`);
