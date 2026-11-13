#!/usr/bin/env node
/* "How many days until Christmas?" — a countdown page per event:

       /days-until/christmas/

       node tools/build-countdown-pages.js

   Dates come from fixed calendar dates or the usual rules (Easter by the
   Gregorian computus; Mothering Sunday three weeks before Easter; US
   Thanksgiving the fourth Thursday of November, and so on). The page states
   the next date and lists the coming years; the day count itself is worked out
   live in the browser (countdown-page.js) so it is never out of date. Re-run
   after an event passes so titles name the next year (the monthly check does). */
const site = require("./lib/site.js");
const related = require("./related.js");
const { esc, SITE } = site;

/* Gregorian Easter Sunday (anonymous / Meeus-Jones-Butcher algorithm) */
function easter(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(y, month - 1, day));
}
const fixed = (m, d) => (y) => new Date(Date.UTC(y, m - 1, d));
const shift = (fn, days) => (y) => new Date(fn(y).getTime() + days * 86400000);
/* nth weekday (0 = Sunday) of a month */
const nth = (m, weekday, n) => (y) => { const first = new Date(Date.UTC(y, m - 1, 1)); return new Date(Date.UTC(y, m - 1, 1 + ((weekday - first.getUTCDay() + 7) % 7) + (n - 1) * 7)); };

const EVENTS = [
  { slug: "christmas", name: "Christmas", day: "Christmas Day", date: fixed(12, 25), note: "Christmas Day is always 25 December." },
  { slug: "christmas-eve", name: "Christmas Eve", day: "Christmas Eve", date: fixed(12, 24), note: "Christmas Eve is always 24 December." },
  { slug: "new-year", name: "New Year", day: "New Year's Day", date: fixed(1, 1), note: "New Year's Day is 1 January; New Year's Eve is the night before." },
  { slug: "easter", name: "Easter", day: "Easter Sunday", date: easter, note: "Easter Sunday is the first Sunday after the first full moon on or after 21 March (by the church's calculation), so it falls between 22 March and 25 April. Good Friday is two days before." },
  { slug: "good-friday", name: "Good Friday", day: "Good Friday", date: shift(easter, -2), note: "Good Friday is the Friday before Easter Sunday." },
  { slug: "pancake-day", name: "Pancake Day", day: "Shrove Tuesday (Pancake Day)", date: shift(easter, -47), note: "Pancake Day (Shrove Tuesday) is 47 days before Easter Sunday, the day before Lent begins on Ash Wednesday." },
  { slug: "mothers-day-uk", name: "Mother's Day (UK)", day: "Mothering Sunday", date: shift(easter, -21), note: "In the UK, Mothering Sunday is the fourth Sunday of Lent — three weeks before Easter Sunday — so the date moves every year." },
  { slug: "mothers-day-us", name: "Mother's Day (US)", day: "Mother's Day in the US", date: nth(5, 0, 2), note: "In the US, Canada and Australia, Mother's Day is the second Sunday in May." },
  { slug: "fathers-day", name: "Father's Day", day: "Father's Day", date: nth(6, 0, 3), note: "Father's Day in the UK, US and Canada is the third Sunday in June." },
  { slug: "valentines-day", name: "Valentine's Day", day: "Valentine's Day", date: fixed(2, 14), note: "Valentine's Day is always 14 February." },
  { slug: "st-patricks-day", name: "St Patrick's Day", day: "St Patrick's Day", date: fixed(3, 17), note: "St Patrick's Day is always 17 March." },
  { slug: "halloween", name: "Halloween", day: "Halloween", date: fixed(10, 31), note: "Halloween is always 31 October." },
  { slug: "bonfire-night", name: "Bonfire Night", day: "Bonfire Night", date: fixed(11, 5), note: "Bonfire Night (Guy Fawkes Night) is 5 November." },
  { slug: "thanksgiving", name: "Thanksgiving", day: "Thanksgiving in the US", date: nth(11, 4, 4), note: "US Thanksgiving is the fourth Thursday in November." },
  { slug: "black-friday", name: "Black Friday", day: "Black Friday", date: shift(nth(11, 4, 4), 1), note: "Black Friday is the day after US Thanksgiving." }
];

const iso = (d) => d.toISOString().slice(0, 10);
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const long = (d) => `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
const today = new Date(site.TODAY + "T00:00:00Z");

function upcoming(e) {
  const y = today.getUTCFullYear();
  const list = [];
  for (let yr = y; list.length < 6 && yr < y + 8; yr++) { const d = e.date(yr); if (d >= today) list.push(d); }
  return list;
}

function page(e) {
  const dates = upcoming(e);
  const next = dates[0];
  const yr = next.getUTCFullYear();
  const url = SITE + `/days-until/${e.slug}/`;
  const title = `How Many Days Until ${e.name} ${yr}? — Live Countdown`;
  const desc = `${e.day} ${yr} is on ${long(next)}. A live countdown in days, hours and sleeps, plus the dates for the next few years.`;
  const q = [
    [`When is ${e.name} ${yr}?`, `${long(next)}. ${e.note}`],
    [`How many sleeps until ${e.name}?`, `The countdown at the top shows days, hours, minutes and sleeps, worked out from your device's clock, so it is right wherever you are.`],
    [`When is ${e.name} in ${yr + 1}?`, `${long(dates[1])}.`]
  ];
  const others = EVENTS.filter((x) => x !== e).map((x) => `<a href="/days-until/${x.slug}/">${esc(x.name)}</a>`).join(" ");
  const ld = [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], ["Countdowns", SITE + "/days-until/"], [`Days until ${e.name}`, url]]), site.faqLd(q)];
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="/days-until/">← All countdowns</a>
      <h1 class="page-title">Days until ${esc(e.name)}</h1>
      <p class="page-subtitle">${esc(e.day)} ${yr} is on ${esc(long(next))}.</p>
    </header>

    <main class="tool" id="cd-tool" data-dates="${dates.map(iso).join(",")}" data-name="${esc(e.name)}">
      <div class="result-box" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="cd-days">${esc(long(next).split(" ").slice(1).join(" "))}</div>
          <div class="label" id="cd-label">${esc(e.day)} ${yr}</div>
        </div>
        <p class="tool-hint" id="cd-detail" style="text-align:center; margin-top:8px;"></p>
      </div>
      <p class="about-text" style="margin-top:14px;">${esc(e.note)}</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">${esc(e.name)} dates</p>
${site.table(["Year", "Date"], dates.map((d) => [String(d.getUTCFullYear()), long(d)]), 300)}      <p class="tool-hint" style="margin-top:12px;">To count the days between any two dates, use the <a href="/date-diff/">date difference calculator</a>.</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">Frequently asked questions</p>
${site.faqHtml(q)}    </main>

    <div class="hub-group-title" style="margin-top:28px;">Other countdowns</div>
    <p class="salary-links">${others}</p>

${site.FOOTER}
  </div>
  <script src="/countdown-page.js"></script>
</body>
</html>
`;
}

function hub() {
  const url = SITE + "/days-until/";
  const title = "Countdowns — Days Until Christmas, Easter, Halloween & More";
  const desc = "Live countdowns to Christmas, New Year, Easter, Pancake Day, Mother's Day, Father's Day, Halloween, Bonfire Night, Thanksgiving and more, with the dates for the coming years.";
  const rows = EVENTS.map((e) => { const d = upcoming(e)[0]; return [`<a href="/days-until/${e.slug}/">${esc(e.name)}</a>`, esc(long(d))]; });
  const ld = [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], ["Countdowns", url]])];
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="/date-diff/">← Date difference calculator</a>
      <h1 class="page-title">Countdowns</h1>
      <p class="page-subtitle">Pick an event for a live countdown in days, hours and sleeps.</p>
    </header>

    <main class="tool">
${site.table(["Event", "Next date"], rows, 320)}      <p class="tool-hint" style="margin-top:12px;">For any other date, the <a href="/date-diff/">date difference calculator</a> counts the days between two dates.</p>
    </main>

${related.block("/days-until/")}
${site.FOOTER}
  </div>
</body>
</html>
`;
}

/* Sanity checks on the rules against known dates */
const known = { 2026: { easter: "2026-04-05", "mothers-day-uk": "2026-03-15", "pancake-day": "2026-02-17", thanksgiving: "2026-11-26", "fathers-day": "2026-06-21", "mothers-day-us": "2026-05-10" }, 2027: { easter: "2027-03-28" } };
Object.keys(known).forEach((y) => Object.keys(known[y]).forEach((slug) => {
  const got = iso(EVENTS.find((e) => e.slug === slug).date(Number(y)));
  if (got !== known[y][slug]) throw new Error(`${slug} ${y}: got ${got}, expected ${known[y][slug]}`);
}));

const urls = []; /* the hub itself is in the sitemap with the calculators */
EVENTS.forEach((e) => { site.write(`days-until/${e.slug}`, page(e)); urls.push([`/days-until/${e.slug}/`, "0.6"]); });
site.write("days-until", hub());
site.sitemapBlock("countdown pages", "tools/build-countdown-pages.js", urls);
console.log(`built ${EVENTS.length} countdown pages`);
