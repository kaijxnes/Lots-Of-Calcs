#!/usr/bin/env node
/* A page for each world on the weight-on-other-planets calculator:

       /weight-on-other-planets/mars/    What you'd weigh on Mars

       node tools/build-planet-pages.js

   The gravity figures and notes are read from weight-on-other-planets.js
   (NASA NSSDCA ratio-to-Earth surface gravity), so the pages and the
   calculator always agree. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const site = require("./lib/site.js");
const { esc, SITE } = site;

function bodies() {
  const el = new Proxy({}, { get: (t, k) => (k === "addEventListener" ? () => {} : k === "style" ? {} : k === "classList" ? { add() {}, remove() {}, toggle() {} } : k === "dataset" ? {} : "") });
  const ctx = { document: { getElementById: () => el, querySelector: () => null, querySelectorAll: () => [], addEventListener() {} }, window: {}, navigator: {}, console };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(site.ROOT, "weight-on-other-planets.js"), "utf8") + ";this.B=BODIES;", ctx);
  return ctx.B;
}

const LB = 2.20462262;
/* Orbital period and day length (NASA NSSDCA), shared with the age calculator */
const { ORBIT } = require("../age-on-other-planets.js");
/* Distances and travel times, for a "how long to get there" link */
const Travel = require("../space-travel.js");
const EARTH_G = 9.80665;
const slug = (b) => b.name.toLowerCase().replace(/^the /, "").replace(/[^a-z]+/g, "-");
const bare = (b) => b.name.replace(/^The /, "the ");
const one = (v) => (Math.round(v * 10) / 10).toLocaleString("en-GB");
function stone(lb) {
  let st = Math.floor(lb / 14), p = Math.round(lb - st * 14);
  if (p === 14) { st++; p = 0; }
  return `${st} st ${p} lb`;
}

function page(b, all) {
  const where = bare(b);
  const Where = b.name;
  const pct = b.g * 100;
  const url = SITE + `/weight-on-other-planets/${slug(b)}/`;
  const more = b.g > 1;
  const title = `How Much Would I Weigh on ${Where.replace(/^The /, "the ")}? — ${b.g < 1 ? one(pct) + "% of Your Earth Weight" : b.g + "× Your Earth Weight"}`;
  const desc = `On ${where} you'd weigh ${b.g < 1 ? one(pct) + "% of" : b.g + " times"} what you weigh on Earth: 70 kg becomes ${one(70 * b.g)} kg and 150 lb becomes ${one(150 * b.g)} lb. Tables in kg, stone and pounds, with the surface gravity.`;
  const kgRows = [40, 50, 60, 70, 80, 90, 100, 110, 120, 150].map((k) => [`${k} kg`, `${one(k * b.g)} kg`]);
  const lbRows = [100, 120, 140, 160, 180, 200, 220, 250, 300].map((l) => [`${l} lb (${stone(l)})`, `${one(l * b.g)} lb (${stone(l * b.g)})`]);
  const others = all.filter((x) => x !== b && !x.home).map((x) => `<a href="/weight-on-other-planets/${slug(x)}/">${esc(x.name)}</a>`).join(" ");
  const gas = /Jupiter|Saturn|Uranus|Neptune/.test(b.name);
  const q = [
    [`How much would I weigh on ${where}?`, `Multiply your Earth weight by ${b.g}. Someone who weighs 70 kg (11 st) on Earth would weigh ${one(70 * b.g)} kg on ${where}; 150 lb becomes ${one(150 * b.g)} lb.`],
    [`What is the gravity on ${where}?`, `About ${b.g} times Earth's, or roughly ${(b.g * EARTH_G).toFixed(2)} m/s² against Earth's 9.81 m/s²${gas ? ", measured at the cloud tops since there is no solid surface" : ""}.`],
    [`Would my mass change on ${where}?`, "No. Your mass — how much of you there is — is the same everywhere. What changes is weight, the force gravity pulls you down with, which is what scales measure."],
    [`Why is it ${more ? "heavier" : "lighter"} on ${where}?`, b.fact]
  ];
  const orb = ORBIT[b.name];
  const ageOn = (a) => a * ORBIT.Earth[0] / orb[0];
  const ageFmt = (v) => (v >= 10 ? Math.floor(v).toLocaleString("en-GB") : (Math.floor(v * 10) / 10).toLocaleString("en-GB"));
  if (orb) q.splice(1, 0, [`How old would I be on ${where}?`, `A year on ${where} lasts ${orb[0].toLocaleString("en-GB")} Earth days, so divide your age by ${(orb[0] / ORBIT.Earth[0]).toFixed(orb[0] < 365 ? 3 : 2)}${orb[0] < 365 ? " — you'd be older there" : ""}. At 30 you would be ${ageFmt(ageOn(30))} ${b.name} years old.`]);
  const ageSection = orb ? `
    <main class="tool">
      <p class="tool-section-title">Your age on ${esc(where)}</p>
      <p class="about-text">One ${esc(b.name)} year — a full trip round the Sun — takes ${orb[0].toLocaleString("en-GB")} Earth days${orb[0] > 3650 ? ` (${(orb[0] / ORBIT.Earth[0]).toFixed(1)} Earth years)` : ""}, and a day there, sunrise to sunrise, lasts ${orb[1].toLocaleString("en-GB")} hours${orb[1] > 48 ? ` (about ${Math.round(orb[1] / 24)} Earth days)` : ""}.</p>
${site.table(["Your age on Earth", `On ${b.name}`], [10, 18, 21, 30, 40, 50, 60, 70, 80].map((a) => [`${a}`, `${ageFmt(ageOn(a))} ${b.name} year${ageOn(a) >= 1 && ageOn(a) < 2 ? "" : "s"}`]), 300)}      <p class="tool-hint" style="margin-top:12px;">Orbital period and day length from NASA's Planetary Fact Sheet. Put in your birthday on the <a href="/age-on-other-planets/">age on other planets calculator</a>.</p>
    </main>
` : "";
  const ld = [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], ["Weight on Other Planets", SITE + "/weight-on-other-planets/"], [`Weight on ${Where}`, url]]), site.faqLd(q)];
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="/weight-on-other-planets/">← Weight on other planets</a>
      <h1 class="page-title">Your weight on ${esc(where)}</h1>
      <p class="page-subtitle">${esc(Where)}'s ${gas ? "cloud-top " : "surface "}gravity is ${b.g} times Earth's${b.g < 1 ? ` — you'd weigh ${one(pct)}% of what you do at home` : ""}.</p>
    </header>

    <main class="tool" id="planet-tool" data-g="${b.g}">
      <div class="field-row">
        <div class="field">
          <label for="p-weight">Your weight on Earth</label>
          <input type="number" id="p-weight" value="70" step="any" min="0" inputmode="decimal">
        </div>
        <div class="field">
          <label for="p-unit">Unit</label>
          <select id="p-unit"><option value="kg" selected>kg</option><option value="lb">lb</option></select>
        </div>
      </div>
      <div class="result-box" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="p-out">${one(70 * b.g)} kg</div>
          <div class="label" id="p-label">if you weigh 70 kg on Earth</div>
        </div>
      </div>
      <p class="about-text" style="margin-top:14px;">${esc(b.fact)}</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">Weight on ${esc(where)} in kilograms</p>
${site.table(["On Earth", `On ${Where}`], kgRows, 300)}      <p class="tool-section-title" style="margin-top:22px;">In pounds and stone</p>
${site.table(["On Earth", `On ${Where}`], lbRows, 360)}      <p class="tool-hint" style="margin-top:12px;">Gravity factor ${b.g} — NASA's ratio-to-Earth surface gravity from the NSSDCA Planetary Fact Sheet${/Titan|Ganymede/.test(b.name) ? ", worked out from the measured surface gravity" : ""}. Compare every world at once on the <a href="/weight-on-other-planets/">weight on other planets calculator</a>.</p>${Travel.dest(slug(b)) ? `
      <p class="tool-hint" style="margin-top:8px;">How long would it take to get there? ${esc(Travel.distance(Travel.dest(slug(b)).d[Travel.dest(slug(b)).def]))} away${Travel.dest(slug(b)).def === "closest" ? " at its closest" : " on average"}: <a href="/how-long-to-get-to/${slug(b)}/">travel time to ${esc(where)}</a> by car, plane, rocket and light.</p>` : ""}
    </main>

${ageSection}
    <main class="tool">
      <p class="tool-section-title">Frequently asked questions</p>
${site.faqHtml(q)}    </main>

    <div class="hub-group-title" style="margin-top:28px;">Your weight elsewhere</div>
    <p class="salary-links">${others}</p>

${site.FOOTER}
  </div>
  <script src="/planet-page.js"></script>
</body>
</html>
`;
}

function hubBlock(all) {
  const file = path.join(site.ROOT, "weight-on-other-planets/index.html");
  const START = "    <!-- planet pages: generated by tools/build-planet-pages.js -->\n";
  const END = "    <!-- end planet pages -->\n";
  let s = fs.readFileSync(file, "utf8");
  if (s.includes(START)) s = s.slice(0, s.indexOf(START)) + s.slice(s.indexOf(END) + END.length);
  const html = `    <main class="tool">
      <p class="tool-section-title">Your weight on each world</p>
      <p class="salary-links">${all.filter((b) => !b.home).map((b) => `<a href="/weight-on-other-planets/${slug(b)}/">Weight on ${esc(b.name.replace(/^The /, "the "))}</a>`).join(" ")}</p>
    </main>

`;
  const at = s.indexOf("    <!-- related calculators: generated by tools/related.js -->");
  s = s.slice(0, at) + START + html + END + "\n" + s.slice(at);
  fs.writeFileSync(file, s);
}

const all = bodies();
const urls = [];
all.filter((b) => !b.home).forEach((b) => { site.write(`weight-on-other-planets/${slug(b)}`, page(b, all)); urls.push([`/weight-on-other-planets/${slug(b)}/`, "0.6"]); });
hubBlock(all);
site.sitemapBlock("planet pages", "tools/build-planet-pages.js", urls);
console.log(`built ${urls.length} planet pages: ${urls.map((u) => u[0].split("/")[2]).join(", ")}`);
