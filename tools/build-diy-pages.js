#!/usr/bin/env node
/* Concrete and tile calculators, with pages for the common searches:

       /concrete-calculator/                    slabs and post holes, metric or imperial
       /concrete-calculator/3m-x-3m-x-100mm/    one slab size
       /concrete-calculator/10x10-ft-4-inch/
       /tile-calculator/                        tiles and boxes for an area
       /tile-calculator/600x600-tiles-per-square-metre/

       node tools/build-diy-pages.js

   Geometry only: volumes and areas from the sizes given. Nothing that varies
   by product (how much concrete a bag makes, tiles per box, how much extra
   to allow) is assumed — the visitor enters it, and the pages say to check
   the packaging. */
const site = require("./lib/site.js");
const related = require("./related.js");
const { esc, SITE } = site;

const n2 = (v, d) => v.toLocaleString("en-GB", { maximumFractionDigits: d === undefined ? 2 : d });
const row = (label, id, value, cls) => `          <div class="result-row${cls ? " " + cls : ""}"><span class="r-label">${label}</span><span class="r-value" id="${id}">${value}</span></div>`;
const fld = (id, label, value, extra) => `        <div class="field"><label for="${id}">${label}</label><input type="number" id="${id}" value="${value}" min="0" step="any" inputmode="decimal"${extra || ""}></div>`;

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
  <script src="/diy.js"></script>
</body>
</html>
`;
}

// ---------------------------------------------------------------- concrete

const CB = "/concrete-calculator/";
const M_SLABS = [[2, 2], [2, 3], [3, 3], [3, 4], [4, 4], [4, 5], [5, 5], [3, 6], [6, 6], [5, 10]];
const M_DEPTHS = [100, 150];
const I_SLABS = [[10, 10], [12, 12], [10, 20], [12, 24], [20, 20], [24, 24], [30, 30]];
const mSlug = ([l, w], d) => `${CB}${l}m-x-${w}m-x-${d}mm/`, iSlug = ([l, w]) => `${CB}${l}x${w}-ft-4-inch/`;
const mVol = ([l, w], d) => l * w * d / 1000;
const iVol = ([l, w], inch) => l * w * inch / 12; /* cubic feet */
if (mVol([3, 3], 100) !== 0.9 || n2(iVol([10, 10], 4) / 27) !== "1.23") throw new Error("concrete volume");

function concreteTool(mode, a, b, c) {
  const metric = mode === "metric";
  const vol = metric ? a * b * c / 1000 : a * b * c / 12;
  return `    <main class="tool" id="cc-tool">
      <div class="field-row">
        <div class="field"><label for="cc-units">Units</label><select id="cc-units"><option value="metric"${metric ? " selected" : ""}>Metres and millimetres</option><option value="imperial"${metric ? "" : " selected"}>Feet and inches</option></select></div>
        <div class="field"><label for="cc-shape">Shape</label><select id="cc-shape"><option value="slab" selected>Slab, path or footing</option><option value="hole">Round post holes</option></select></div>
      </div>
      <div class="field-row" id="cc-slab">
${fld("cc-l", `Length <span class="tool-hint" id="cc-lu">${metric ? "m" : "ft"}</span>`, a)}
${fld("cc-w", `Width <span class="tool-hint" id="cc-wu">${metric ? "m" : "ft"}</span>`, b)}
${fld("cc-d", `Depth <span class="tool-hint" id="cc-du">${metric ? "mm" : "in"}</span>`, c)}
      </div>
      <div class="field-row" id="cc-hole" hidden>
${fld("cc-hd", `Hole diameter <span class="tool-hint" id="cc-hdu">${metric ? "mm" : "in"}</span>`, metric ? 300 : 12)}
${fld("cc-hh", `Hole depth <span class="tool-hint" id="cc-hhu">${metric ? "mm" : "in"}</span>`, metric ? 600 : 24)}
${fld("cc-hn", "Number of holes", 4, ' step="1"')}
      </div>
      <div class="field-row">
${fld("cc-extra", "Extra to allow (%)", 0)}
${fld("cc-bag", `Concrete one bag makes <span class="tool-hint" id="cc-bagu">${metric ? "litres" : "cu ft"}</span>`, "", ' placeholder="from the bag"')}
      </div>
      <div class="result-box" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="cc-vol">${metric ? `${n2(vol, 3)} m³` : `${n2(vol / 27)} yd³`}</div>
          <div class="label">of concrete</div>
        </div>
        <div class="result-grid">
${row("In other units", "cc-alt", metric ? `${n2(vol * 1000, 0)} litres · ${n2(vol * 35.3147)} cu ft` : `${n2(vol)} cu ft · ${n2(vol * 0.0283168, 3)} m³`)}
${row("Bags", "cc-bags", "Enter what one bag makes")}
        </div>
      </div>
      <p class="tool-hint" style="margin-top:12px;">Volumes only. How much concrete a bag makes depends on the product — it's printed on the bag — and how much extra to allow for uneven ground and spillage is your call.</p>
    </main>
`;
}
function mSlabPage(s, d) {
  const v = mVol(s, d), [l, w] = s;
  const q = [
    [`How much concrete do I need for a ${l}m × ${w}m slab ${d}mm deep?`, `${n2(v, 3)} cubic metres: ${l} × ${w} × ${d / 1000} = ${n2(v, 3)} m³, or ${n2(v * 1000, 0)} litres. Allow a little extra for uneven ground and waste.`],
    [`How many bags of concrete for a ${l}m × ${w}m slab?`, `Divide ${n2(v * 1000, 0)} litres by what one bag makes, which is printed on the bag. The calculator does it when you enter the bag's yield.`],
    [`What about ${M_DEPTHS.find((x) => x !== d)}mm deep?`, `${n2(mVol(s, M_DEPTHS.find((x) => x !== d)), 3)} m³.`]
  ];
  const others = M_SLABS.flatMap((x) => M_DEPTHS.map((dd) => [x, dd])).filter(([x, dd]) => !(x === s && dd === d)).map(([x, dd]) => `<a href="${mSlug(x, dd)}">${x[0]}m × ${x[1]}m × ${dd}mm</a>`).join(" ");
  return page({ path: mSlug(s, d), crumbs: [["Home", "/"], ["Concrete Calculator", CB]], crumb: `${l}m × ${w}m × ${d}mm slab`, back: [CB, "Concrete calculator"],
    title: `How Much Concrete for a ${l}m x ${w}m Slab, ${d}mm Deep? ${n2(v, 3)} m³`,
    desc: `A ${l}m × ${w}m concrete slab ${d}mm deep needs ${n2(v, 3)} m³ (${n2(v * 1000, 0)} litres) of concrete. Work out bags and other sizes with the calculator.`,
    h1: `Concrete for a ${l}m × ${w}m slab, ${d}mm deep`, sub: `You need <strong>${n2(v, 3)} m³</strong> of concrete (${n2(v * 1000, 0)} litres), before any extra for waste.`, q,
    body: concreteTool("metric", l, w, d), moreTitle: "Other slab sizes", more: others });
}
function iSlabPage(s) {
  const v = iVol(s, 4), [l, w] = s;
  const q = [
    [`How much concrete do I need for a ${l}x${w} slab 4 inches thick?`, `${n2(v / 27)} cubic yards: ${l} × ${w} × 4/12 = ${n2(v)} cubic feet, ÷ 27 = ${n2(v / 27)} yd³. Ready-mix is ordered by the cubic yard, so round up and allow a little extra.`],
    [`How many bags of concrete for a ${l}x${w} slab?`, `Divide ${n2(v)} cubic feet by what one bag makes, which is printed on the bag. Enter it in the calculator to get the number of bags.`],
    [`What about 6 inches thick?`, `${n2(iVol(s, 6) / 27)} cubic yards (${n2(iVol(s, 6))} cubic feet).`]
  ];
  const others = I_SLABS.filter((x) => x !== s).map((x) => `<a href="${iSlug(x)}">${x[0]}x${x[1]} slab, 4 inches</a>`).join(" ");
  return page({ path: iSlug(s), crumbs: [["Home", "/"], ["Concrete Calculator", CB]], crumb: `${l}x${w} slab, 4 inches`, back: [CB, "Concrete calculator"],
    title: `How Much Concrete for a ${l}x${w} Slab, 4 Inches Thick? ${n2(v / 27)} Cubic Yards`,
    desc: `A ${l} × ${w} ft concrete slab 4 inches thick needs ${n2(v / 27)} cubic yards (${n2(v)} cubic feet) of concrete. Work out bags and other sizes with the calculator.`,
    h1: `Concrete for a ${l}x${w} slab, 4 inches thick`, sub: `You need <strong>${n2(v / 27)} cubic yards</strong> (${n2(v)} cubic feet), before any extra for waste.`, q,
    body: concreteTool("imperial", l, w, 4), moreTitle: "Other slab sizes", more: others });
}
function concreteHub() {
  const q = [
    ["How do I work out how much concrete I need?", "Multiply length × width × depth in the same units. For a 3m × 3m slab 100mm deep: 3 × 3 × 0.1 = 0.9 m³. In feet, divide the cubic feet by 27 for cubic yards: a 10 × 10 ft slab 4 inches deep is 33.33 cu ft, or 1.23 yd³."],
    ["How do I work out concrete for post holes?", "Each hole is a cylinder: π × radius² × depth. A 300mm hole 600mm deep holds about 42 litres; the post itself takes up some of that, so the real figure is a little less."],
    ["How many bags of concrete do I need?", "Divide the volume by what one bag makes — the bag says, and it varies by product and bag size. Enter it in the calculator."],
    ["How much extra should I allow?", "Enough to cover uneven ground and spillage; it depends on the job and how level the base is. Add a percentage in the calculator to see the difference."]
  ];
  const links = M_SLABS.flatMap((s) => M_DEPTHS.map((d) => `<a href="${mSlug(s, d)}">${s[0]}m × ${s[1]}m × ${d}mm</a>`)).concat(I_SLABS.map((s) => `<a href="${iSlug(s)}">${s[0]}x${s[1]} ft, 4 inches</a>`)).join(" ");
  return page({ path: CB, app: "Concrete Calculator", crumbs: [["Home", "/"]], crumb: "Concrete Calculator", back: ["/", "All calculators"], related: true,
    title: "Concrete Calculator — How Much Concrete for a Slab or Post Holes?",
    desc: "Work out how much concrete you need for a slab, path, footing or post holes, in cubic metres, litres, cubic feet or cubic yards — and how many bags. A 3m × 3m slab 100mm deep needs 0.9 m³.",
    h1: "Concrete calculator", sub: "How much concrete for a slab, path, footing or post holes — in m³, litres, cubic feet or cubic yards, and bags.", q,
    body: concreteTool("metric", 3, 3, 100) + `    <main class="tool">
      <h2 class="tool-section-title">Common slab sizes</h2>
      <p class="salary-links">${links}</p>
    </main>
` });
}

// ---------------------------------------------------------------- tiles

const TB = "/tile-calculator/";
const TILES = [[100, 100], [150, 150], [200, 200], [75, 150], [100, 200], [300, 300], [250, 400], [300, 600], [400, 400], [450, 450], [600, 600], [800, 800], [600, 1200], [200, 1200]];
const tSlug = ([w, h]) => `${TB}${w}x${h}-tiles-per-square-metre/`;
const perM2 = ([w, h]) => 1e6 / (w * h);
if (perM2([600, 600]) !== 1e6 / 360000 || Math.abs(perM2([300, 600]) - 5.5556) > 0.001) throw new Error("tiles per m²");

function tileTool(w, h, area) {
  return `    <main class="tool" id="tl-tool">
      <div class="field-row">
${fld("tl-l", "Area length (m)", "", ' placeholder="or enter the area"')}
${fld("tl-wd", "Area width (m)", "")}
${fld("tl-area", "Or the area (m²)", area)}
      </div>
      <div class="field-row">
${fld("tl-w", "Tile width (mm)", w)}
${fld("tl-h", "Tile length (mm)", h)}
      </div>
      <div class="field-row">
${fld("tl-extra", "Extra for cuts and breakages (%)", 10)}
${fld("tl-box", "Tiles in a box (optional)", "", ' step="1"')}
      </div>
      <div class="result-box" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="tl-n">${Math.ceil(perM2([w, h]) * area * 1.1)} tiles</div>
          <div class="label" id="tl-label">including 10% extra</div>
        </div>
        <div class="result-grid">
${row("Tiles per m²", "tl-per", n2(perM2([w, h])))}
${row("Without extra", "tl-exact", `${n2(perM2([w, h]) * area)} tiles`)}
${row("Boxes", "tl-boxes", "Enter tiles in a box")}
        </div>
      </div>
      <p class="tool-hint" style="margin-top:12px;">Tile sizes only, ignoring grout lines (which slightly reduce the number needed). The extra for cuts is a starting point you can change — more for diagonal layouts or lots of cutting.</p>
    </main>
`;
}
function tilePage(t) {
  const [w, h] = t, p = perM2(t);
  const q = [
    [`How many ${w}×${h} tiles in a square metre?`, `${n2(p)} tiles: one square metre is 1,000,000 mm², and each tile covers ${w} × ${h} = ${(w * h).toLocaleString("en-GB")} mm², so 1,000,000 ÷ ${(w * h).toLocaleString("en-GB")} = ${n2(p)}.`],
    [`How many ${w}×${h} tiles for 10 square metres?`, `${n2(p * 10)} tiles before any extra — ${Math.ceil(p * 10 * 1.1)} with 10% added for cuts and breakages.`],
    ["Does grout change the number?", "Slightly — grout lines mean each tile covers a little more than its own size, so you need a few fewer. The figures here ignore them, which leaves a small margin."]
  ];
  const others = TILES.filter((x) => x !== t).map((x) => `<a href="${tSlug(x)}">${x[0]}×${x[1]} tiles per m²</a>`).join(" ");
  return page({ path: tSlug(t), crumbs: [["Home", "/"], ["Tile Calculator", TB]], crumb: `${w}×${h} tiles per m²`, back: [TB, "Tile calculator"],
    title: `How Many ${w}x${h} Tiles in a Square Metre? ${n2(p)} per m²`,
    desc: `There are ${n2(p)} tiles of ${w} × ${h}mm in a square metre. Work out the tiles and boxes for any area, with extra for cuts.`,
    h1: `${w} × ${h}mm tiles per square metre`, sub: `<strong>${n2(p)} tiles</strong> cover one square metre.`, q,
    body: tileTool(w, h, 10), moreTitle: "Other tile sizes", more: others });
}
function tileHub() {
  const q = [
    ["How do I work out how many tiles I need?", "Work out the area in square metres (length × width), multiply by the tiles per square metre for your tile size, then add extra for cuts and breakages. 10 m² of 600 × 600 tiles is 27.8 tiles, so 31 with 10% extra."],
    ["How many tiles are in a square metre?", "1,000,000 ÷ (tile width × length in mm). For 300 × 300 tiles that's 11.11; for 600 × 600, 2.78; for 300 × 600, 5.56."],
    ["How much extra should I buy?", "Enough for cuts, breakages and a few spares in case one needs replacing later; more for diagonal layouts or rooms with lots of corners. The calculator starts at 10%, which you can change."],
    ["How many boxes do I need?", "Divide the tiles needed by the number in a box (it's on the box) and round up. Enter it in the calculator."]
  ];
  return page({ path: TB, app: "Tile Calculator", crumbs: [["Home", "/"]], crumb: "Tile Calculator", back: ["/", "All calculators"], related: true,
    title: "Tile Calculator — How Many Tiles Do I Need? (Tiles per m²)",
    desc: "Work out how many tiles and boxes you need for a floor or wall, with extra for cuts and breakages, and how many tiles of any size are in a square metre.",
    h1: "Tile calculator", sub: "How many tiles and boxes for a floor or wall, with extra for cuts — for any tile size.", q,
    body: tileTool(600, 600, 10) + `    <main class="tool">
      <h2 class="tool-section-title">Tiles per square metre</h2>
${site.table(["Tile size", "Tiles per m²"], TILES.map((t) => [`<a href="${tSlug(t)}">${t[0]} × ${t[1]}mm</a>`, n2(perM2(t))]), 300)}    </main>
` });
}

// ---------------------------------------------------------------- write

const urls = [];
const put = (url, html, pri) => { site.write(url.replace(/^\/|\/$/g, ""), html); if (pri) urls.push([url, pri]); };
put(CB, concreteHub());
M_SLABS.forEach((s) => M_DEPTHS.forEach((d) => put(mSlug(s, d), mSlabPage(s, d), "0.5")));
I_SLABS.forEach((s) => put(iSlug(s), iSlabPage(s), "0.5"));
site.prune("concrete-calculator", /^(\d+m-x-\d+m-x-\d+mm|\d+x\d+-ft-4-inch)$/);
put(TB, tileHub());
TILES.forEach((t) => put(tSlug(t), tilePage(t), "0.5"));
site.prune("tile-calculator", /^\d+x\d+-tiles-per-square-metre$/);
site.sitemapBlock("concrete and tile pages", "tools/build-diy-pages.js", urls);
console.log(`built the concrete and tile calculators and ${urls.length} pages`);
