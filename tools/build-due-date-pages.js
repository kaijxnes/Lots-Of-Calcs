#!/usr/bin/env node
/* Pregnancy due date calculator and pages by the month of the last period:

       /due-date-calculator/
       /due-date-calculator/last-period-march-2026/

       node tools/build-due-date-pages.js

   The standard method, as the Government of Jersey's health pages put it:
   the due date is 280 days (40 weeks) after the first day of the last
   period, assuming a 28-day cycle. The NHS says pregnancy normally lasts
   37 to 42 weeks from that day, and that the dating scan gives a more
   accurate date. No adjustment for other cycle lengths is made, because no
   source we could cite gives one; the page sends people to the NHS
   calculator and their midwife for that.

   The month pages cover last periods from ten months before this build to
   this month, so the monthly rebuild rolls them on (and prunes old ones). */
const site = require("./lib/site.js");
const related = require("./related.js");
const { esc, SITE } = site;

const DUE = 280, EARLY = 37 * 7, LATE = 42 * 7, DAY = 86400000;
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const utc = (y, m, d) => new Date(Date.UTC(y, m, d));
const add = (d, n) => new Date(d.getTime() + n * DAY);
const long = (d) => `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
const dm = (d) => `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
const iso = (d) => d.toISOString().slice(0, 10);
const TODAY = new Date(site.TODAY + "T00:00:00Z");
const BASE = "/due-date-calculator/";
const SOURCES = [
  ["NHS — Due date calculator", "https://www.nhs.uk/pregnancy/finding-out/due-date-calculator/"],
  ["Government of Jersey — Working out your due date", "https://www.gov.je/Health/PregnancyAndBirth/YourPregnancy/Pages/DueDateCalculator.aspx"]
];
const srcLinks = SOURCES.map(([t, u]) => `<a href="${u}" rel="nofollow noopener" target="_blank">${esc(t)}</a>`).join(", ");

/* check: 1 January 2026 + 280 days = 8 October 2026 */
if (iso(add(utc(2026, 0, 1), DUE)) !== "2026-10-08") throw new Error("due date arithmetic");

/* last-period months: ten months ago to this month */
const MONTH_PAGES = [];
for (let i = 10; i >= 0; i--) { const d = utc(TODAY.getUTCFullYear(), TODAY.getUTCMonth() - i, 1); MONTH_PAGES.push([d.getUTCFullYear(), d.getUTCMonth()]); }
const mSlug = ([y, m]) => `${BASE}last-period-${MONTHS[m].toLowerCase()}-${y}/`;
const mName = ([y, m]) => `${MONTHS[m]} ${y}`;

function page(o) {
  const url = SITE + o.path;
  const ld = [site.webPage(o.title, o.desc, url), site.breadcrumb(o.crumbs.map(([n, u]) => [n, SITE + u]).concat([[o.crumb, url]]))];
  if (o.app) ld.push({ "@context": "https://schema.org", "@type": "WebApplication", name: o.app, url, applicationCategory: "HealthApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } });
  ld.push(site.faqLd(o.q));
  return site.head({ title: o.title, desc: o.desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="${o.back[0]}">← ${esc(o.back[1])}</a>
      <h1 class="page-title">${esc(o.h1)}</h1>
      <p class="page-subtitle">${o.sub}</p>
    </header>

${o.body}    <main class="tool">
      <p class="tool-section-title">Frequently asked questions</p>
${site.faqHtml(o.q)}      <p class="tool-hint" style="margin-top:12px;">An estimate only, not medical advice. Your midwife or GP will confirm your due date, usually at the dating scan. Sources: ${srcLinks}.</p>
    </main>

${o.related ? related.block(o.path) : `    <main class="tool">
      <p class="tool-section-title">${esc(o.moreTitle)}</p>
      <p class="salary-links">${o.more}</p>
    </main>
`}
${site.FOOTER}
  </div>
  <script src="/due-date.js"></script>
</body>
</html>
`;
}
const row = (label, id, value, cls) => `          <div class="result-row${cls ? " " + cls : ""}"><span class="r-label">${label}</span><span class="r-value" id="${id}">${value}</span></div>`;

function tool(lmp) {
  return `    <main class="tool" id="dd-tool" data-due="${DUE}" data-early="${EARLY}" data-late="${LATE}">
      <div class="field" style="max-width:280px;"><label for="dd-lmp">First day of your last period</label><input type="date" id="dd-lmp" value="${iso(lmp)}"></div>
      <div class="result-box" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="dd-due">${esc(dm(add(lmp, DUE)))}</div>
          <div class="label" id="dd-due-label">estimated due date (${esc(DAYS[add(lmp, DUE).getUTCDay()])})</div>
        </div>
        <div class="result-grid">
${row("How far along today", "dd-now", "—", "highlight")}
${row("Days to the due date", "dd-left", "—")}
${row("37 weeks (full term from)", "dd-early", esc(dm(add(lmp, EARLY))))}
${row("42 weeks", "dd-late", esc(dm(add(lmp, LATE))))}
        </div>
      </div>
      <p class="tool-hint" style="margin-top:12px;">The due date is 280 days (40 weeks) after the first day of your last period, assuming a 28-day cycle. If your cycle is usually longer or shorter, the <a href="${SOURCES[0][1]}" rel="nofollow noopener" target="_blank">NHS due date calculator</a> lets you adjust for it, and your dating scan gives a more accurate date.</p>
    </main>
`;
}
const baseQ = [
  ["How is a due date worked out?", "By adding 280 days — 40 weeks — to the first day of your last period, assuming a 28-day cycle. Weeks of pregnancy are counted from that day, not from conception."],
  ["How accurate is the due date?", "It's an estimate. Pregnancy normally lasts from 37 to 42 weeks from the first day of your last period, so your baby may well arrive some days before or after the due date. The dating scan, usually at around 12 weeks, measures the baby and gives a more accurate estimate."],
  ["What if my cycle isn't 28 days?", "The standard calculation assumes 28 days. The NHS due date calculator lets you adjust the cycle length, and your midwife will use the dating scan to set the date that's used for your care."],
  ["What if I don't know when my last period was?", "Speak to your GP or midwife — the dating scan can estimate how far along you are without it."]
];

function hub() {
  const lmp = add(TODAY, -8 * 7);
  const q = [["How many weeks pregnant am I?", "Count the weeks from the first day of your last period: enter it in the calculator and it shows how far along you are today, in weeks and days, and the days left to your due date."]].concat(baseQ);
  return page({ path: BASE, app: "Due Date Calculator", crumbs: [["Home", "/"]], crumb: "Due Date Calculator", back: ["/", "All calculators"], related: true,
    title: "Due Date Calculator — When Is My Baby Due? (Pregnancy Calculator)",
    desc: "Work out your baby's due date from the first day of your last period, how many weeks pregnant you are today, and the 37- to 42-week window — using the standard 280-day method.",
    h1: "Pregnancy due date calculator", sub: "Your estimated due date from the first day of your last period, and how many weeks pregnant you are today.", q,
    body: tool(lmp) + `    <main class="tool">
      <p class="tool-section-title">Due dates by the month of your last period</p>
      <p class="salary-links">${MONTH_PAGES.slice().reverse().map((m) => `<a href="${mSlug(m)}">Last period in ${mName(m)}</a>`).join(" ")}</p>
    </main>
` });
}
function monthPage(ym) {
  const [y, m] = ym, n = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const first = utc(y, m, 1), lastDay = utc(y, m, n);
  const rows = [];
  for (let d = 1; d <= n; d++) { const l = utc(y, m, d); rows.push([dm(l), long(add(l, DUE)), dm(add(l, EARLY)), dm(add(l, LATE))]); }
  const a = add(first, DUE), b = add(lastDay, DUE);
  const span = a.getUTCMonth() === b.getUTCMonth() ? `${MONTHS[a.getUTCMonth()]} ${a.getUTCFullYear()}` : `${MONTHS[a.getUTCMonth()]}${a.getUTCFullYear() === b.getUTCFullYear() ? "" : " " + a.getUTCFullYear()} or ${MONTHS[b.getUTCMonth()]} ${b.getUTCFullYear()}`;
  const mid = utc(y, m, 15);
  const q = [
    [`If my last period was in ${mName(ym)}, when is my baby due?`, `Between ${dm(a)} and ${dm(b)} — in ${span} — depending on the day it started. The table gives the date for each day.`],
    [`What is the due date if my last period started on 15 ${MONTHS[m]} ${y}?`, `${long(add(mid, DUE))}, 280 days later. Full term (37 weeks) starts on ${dm(add(mid, EARLY))}, and 42 weeks is ${dm(add(mid, LATE))}.`]
  ].concat(baseQ.slice(0, 3));
  const others = MONTH_PAGES.filter((x) => x !== ym).slice().reverse().map((x) => `<a href="${mSlug(x)}">Last period in ${mName(x)}</a>`).join(" ") + ` <a href="${BASE}">Due date calculator</a>`;
  return page({ path: mSlug(ym), crumbs: [["Home", "/"], ["Due Date Calculator", BASE]], crumb: `Last period in ${mName(ym)}`, back: [BASE, "Due date calculator"],
    title: site.fitTitle(`Last Period in ${mName(ym)}? Your Due Date Is in ${span}`, `Last Period ${mName(ym)} — Due Date in ${span}`, `Due Date for a Last Period in ${mName(ym)}`),
    desc: `If your last period started in ${mName(ym)}, your baby is due between ${dm(a)} and ${dm(b)}. The due date for every day of the month, with 37- and 42-week dates.`,
    h1: `Last period in ${mName(ym)}: when is my baby due?`, sub: `A last period starting in ${esc(mName(ym))} gives a due date between <strong>${esc(dm(a))}</strong> and <strong>${esc(dm(b))}</strong>.`, q,
    body: tool(mid) + `    <main class="tool">
      <p class="tool-section-title">Due dates for a last period in ${esc(mName(ym))}</p>
${site.table(["First day of last period", "Due date (40 weeks)", "37 weeks", "42 weeks"], rows, 520)}    </main>
`, moreTitle: "Other months", more: others });
}

const urls = [];
site.write("due-date-calculator", hub());
MONTH_PAGES.forEach((ym) => { site.write(mSlug(ym).replace(/^\/|\/$/g, ""), monthPage(ym)); urls.push([mSlug(ym), "0.5"]); });
site.prune("due-date-calculator", /^last-period-[a-z]+-\d{4}$/);
site.sitemapBlock("due date pages", "tools/build-due-date-pages.js", urls);
console.log(`built the due date calculator and ${urls.length} month pages`);
