#!/usr/bin/env node
/* Time difference pages for the most-searched pairs of time zones:

       /timezone/gmt-to-est/    UK time to US Eastern, every hour, both seasons,
                                and the weeks when the gap changes

       node tools/build-timezone-pages.js

   Every offset comes from the IANA time zone database built into Node
   (Intl), so clock changes are exact, including the weeks in spring and
   autumn when the UK and US have changed their clocks on different dates.
   Pages cover this year and next, so they run in the monthly rebuild (the
   year rolls over in January). The live converter on each page uses the
   visitor's browser, which has the same database. */
const site = require("./lib/site.js");
const { SITE, esc } = site;

const BASE = "/timezone/";
const ZONES = {
  gmt: { tz: "Europe/London", name: "UK time", short: "GMT/BST", place: "London", search: "GMT" },
  utc: { tz: "UTC", name: "UTC", short: "UTC", place: "UTC", search: "UTC" },
  est: { tz: "America/New_York", name: "US Eastern time", short: "EST/EDT", place: "New York", search: "EST" },
  cst: { tz: "America/Chicago", name: "US Central time", short: "CST/CDT", place: "Chicago", search: "CST" },
  mst: { tz: "America/Denver", name: "US Mountain time", short: "MST/MDT", place: "Denver", search: "MST" },
  pst: { tz: "America/Los_Angeles", name: "US Pacific time", short: "PST/PDT", place: "Los Angeles", search: "PST" },
  cet: { tz: "Europe/Paris", name: "Central European time", short: "CET/CEST", place: "Paris", search: "CET" },
  ist: { tz: "Asia/Kolkata", name: "India Standard Time", short: "IST", place: "India", search: "IST" },
  aest: { tz: "Australia/Sydney", name: "Sydney time", short: "AEST/AEDT", place: "Sydney", search: "AEST" },
  jst: { tz: "Asia/Tokyo", name: "Japan Standard Time", short: "JST", place: "Tokyo", search: "JST" },
  gst: { tz: "Asia/Dubai", name: "Gulf Standard Time", short: "GST", place: "Dubai", search: "Dubai time" },
  sgt: { tz: "Asia/Singapore", name: "Singapore time", short: "SGT", place: "Singapore", search: "Singapore time" },
  cst_china: { tz: "Asia/Shanghai", name: "China Standard Time", short: "CST (China)", place: "Beijing", search: "China time", slug: "china" }
};
const PAIRS = [["gmt", "est"], ["gmt", "cst"], ["gmt", "mst"], ["gmt", "pst"], ["gmt", "cet"], ["gmt", "ist"], ["gmt", "aest"], ["gmt", "jst"], ["gmt", "gst"], ["gmt", "sgt"], ["gmt", "cst_china"],
  ["est", "pst"], ["est", "cst"], ["est", "ist"], ["pst", "ist"], ["cet", "ist"], ["est", "cet"], ["est", "aest"], ["utc", "est"], ["utc", "pst"], ["utc", "ist"], ["pst", "cet"]];
const zslug = (k) => ZONES[k].slug || k;
const slug = (a, b) => `${zslug(a)}-to-${zslug(b)}`;

const YEAR = Number(site.TODAY.slice(0, 4));
function offsetMin(tz, date) {
  const v = new Intl.DateTimeFormat("en-GB", { timeZone: tz, timeZoneName: "longOffset" }).formatToParts(date).find((p) => p.type === "timeZoneName").value;
  const m = v.match(/GMT(?:([+-])(\d\d):(\d\d))?/);
  return m[1] ? (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3])) : 0;
}
/* "5 hours ahead of London", "5½ hours behind London" */
const fmtDiff = (min, of) => {
  if (min === 0) return `the same as ${of}`;
  const h = Math.floor(Math.abs(min) / 60), m = Math.abs(min) % 60, frac = { 15: "¼", 30: "½", 45: "¾" }[m] || "";
  return `${h}${frac} hour${h === 1 && !frac ? "" : "s"} ${min > 0 ? "ahead of" : "behind"} ${of}`;
};
const hhmm = (min) => { min = ((min % 1440) + 1440) % 1440; const h = Math.floor(min / 60), m = min % 60; return `${(h % 12) || 12}${m ? ":" + String(m).padStart(2, "0") : ""}${h < 12 ? "am" : "pm"}`; };
const dayShift = (from, to) => (to >= 1440 ? " (next day)" : to < 0 ? " (previous day)" : "");
const date = (d) => d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/* periods in a year when B − A is constant, at noon UTC each day */
function periods(a, b, year) {
  const out = [];
  for (let t = Date.UTC(year, 0, 1, 12); t < Date.UTC(year + 1, 0, 1, 12); t += 86400000) {
    const d = new Date(t), diff = offsetMin(ZONES[b].tz, d) - offsetMin(ZONES[a].tz, d);
    if (!out.length || out[out.length - 1].diff !== diff) out.push({ diff, from: d, to: d });
    else out[out.length - 1].to = d;
  }
  return out;
}

function page(a, b) {
  const A = ZONES[a], B = ZONES[b], url = SITE + `${BASE}${slug(a, b)}/`;
  const jan = new Date(Date.UTC(YEAR, 0, 15, 12)), jul = new Date(Date.UTC(YEAR, 6, 15, 12));
  const dJan = offsetMin(B.tz, jan) - offsetMin(A.tz, jan), dJul = offsetMin(B.tz, jul) - offsetMin(A.tz, jul);
  const ps = periods(a, b, YEAR).concat(periods(a, b, YEAR + 1));
  const counts = {}; ps.forEach((p) => (counts[p.diff] = (counts[p.diff] || 0) + (p.to - p.from) / 86400000 + 1));
  const usual = Number(Object.keys(counts).sort((x, y) => counts[y] - counts[x])[0]);
  const ex = 15 * 60, exTo = ex + usual, nd = exTo >= 1440 ? " (Next Day)" : exTo < 0 ? " (Day Before)" : "";
  const title = site.fitTitle(`${A.search} to ${B.search} — 3pm ${A.search} Is ${hhmm(exTo)} ${B.search}${nd || " (Time Difference Table)"}`, `${A.search} to ${B.search}: 3pm ${A.search} Is ${hhmm(exTo)} ${B.search}${nd}`);
  const desc = `${B.place} is usually ${fmtDiff(usual, A.place)}: 3pm ${A.short} is ${hhmm(exTo)} ${B.short}.${dJan !== dJul ? ` With daylight saving it's ${fmtDiff(dJan, A.place)} in January and ${fmtDiff(dJul, A.place)} in July.` : ""} Every hour converted.`;
  const rows = [];
  for (let h = 0; h < 24; h++) {
    const m = h * 60;
    rows.push([hhmm(m), hhmm(m + dJan) + dayShift(m, m + dJan)].concat(dJan !== dJul ? [hhmm(m + dJul) + dayShift(m, m + dJul)] : []));
  }
  const multi = ps.length > 2 || (ps.length === 2 && ps[0].diff !== ps[1].diff);
  const perRows = ps.map((p) => [`${date(p.from)} – ${date(p.to)}`, `${B.place} ${fmtDiff(p.diff, A.place)}`]);
  const q = [
    [`What is the time difference between ${A.search} and ${B.search}?`, `${B.name} is ${dJan === dJul ? fmtDiff(dJan, A.name) : `${fmtDiff(dJan, A.name)} in January and ${fmtDiff(dJul, A.name)} in July`}.${multi ? " The table of dates shows exactly when it changes." : " It doesn't change during the year."}`],
    [`What is 3pm ${A.search} in ${B.search}?`, `${hhmm(ex + usual)}${dayShift(ex, ex + usual)} for most of the year.${dJan !== dJul ? ` In ${usual === dJan ? "July" : "January"} it's ${hhmm(ex + (usual === dJan ? dJul : dJan))}.` : ""}`],
    [`What is 9am ${A.search} in ${B.search}?`, `${hhmm(540 + usual)}${dayShift(540, 540 + usual)} for most of the year.`]
  ];
  const ld = [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], ["Time Zone Converter", SITE + BASE], [`${A.search} to ${B.search}`, url]]), site.faqLd(q)];
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="${BASE}">← Time zone converter</a>
      <h1 class="page-title">${esc(A.search)} to ${esc(B.search)}</h1>
      <p class="page-subtitle">${esc(B.name)} (${esc(B.place)}) is usually <strong>${fmtDiff(usual, esc(A.name))}</strong>: 3pm ${esc(A.short)} is <strong>${hhmm(exTo)}</strong> ${esc(B.short)}.</p>
    </header>

    <main class="tool" id="tzp-tool" data-a="${A.tz}" data-b="${B.tz}" data-an="${esc(A.search)}" data-bn="${esc(B.search)}">
      <h2 class="tool-section-title" style="margin-top:0;">Convert a time</h2>
      <div class="field-row">
        <div class="field"><label for="tzp-date">Date</label><input type="date" id="tzp-date"></div>
        <div class="field"><label for="tzp-time">Time in ${esc(A.search)}</label><input type="time" id="tzp-time" value="15:00"></div>
      </div>
      <div class="result-box" aria-live="polite">
        <div class="result-grid">
          <div class="result-row highlight"><span class="r-label">In ${esc(B.search)}</span><span class="r-value" id="tzp-out">${hhmm(exTo)}</span></div>
          <div class="result-row"><span class="r-label">Right now</span><span class="r-value" id="tzp-now">—</span></div>
        </div>
      </div>
      <p class="tool-hint" style="margin-top:12px;">Uses your browser's time zone database, so daylight saving is exact for any date. Any two places: the <a href="${BASE}">time zone converter</a>. The other way: <a href="${BASE}${slug(b, a)}/">${esc(B.search)} to ${esc(A.search)}</a>.</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">Every hour, ${esc(A.search)} to ${esc(B.search)}</h2>
${site.table([esc(A.short), dJan !== dJul ? `${esc(B.short)} in January` : esc(B.short)].concat(dJan !== dJul ? [`${esc(B.short)} in July`] : []), rows, 300)}    </main>

${multi ? `    <main class="tool">
      <h2 class="tool-section-title">When the time difference changes (${YEAR}–${YEAR + 1})</h2>
${site.table(["Dates", "Difference"], perRows, 360)}      <p class="tool-hint" style="margin-top:12px;">Clocks change on different dates in different countries, so for a few weeks in spring and autumn the gap is an hour different from usual.</p>
    </main>

` : ""}    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}    </main>

${site.FOOTER}
  </div>
  <script src="/timezone-pair.js"></script>
</body>
</html>
`;
}

const urls = [], links = [];
PAIRS.forEach(([a, b]) => [[a, b], [b, a]].forEach(([x, y]) => {
  site.write(`timezone/${slug(x, y)}`, page(x, y)); urls.push([`${BASE}${slug(x, y)}/`, "0.5"]);
  links.push(`<a href="${BASE}${slug(x, y)}/">${esc(ZONES[x].search)} to ${esc(ZONES[y].search)}</a>`);
}));
site.hubBlock(BASE, "timezone pages", "tools/build-timezone-pages.js", `    <main class="tool">
      <h2 class="tool-section-title">Popular time differences</h2>
      <p class="salary-links">${links.join(" ")}</p>
    </main>

`);
site.prune("timezone", /^[a-z]+-to-[a-z]+$/);
site.sitemapBlock("timezone pages", "tools/build-timezone-pages.js", urls);
console.log(`built ${urls.length} time zone pages for ${YEAR}–${YEAR + 1}`);
