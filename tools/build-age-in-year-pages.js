#!/usr/bin/env node
/* "How old will I be in 2030?" — a page per future year:

       /birthday/how-old-will-i-be-in-2030/

       node tools/build-age-in-year-pages.js

   Each page has a date-of-birth box that works out the age on 1 January,
   on the birthday and on 31 December of that year (in the browser), a table
   of every birth year from 1930 with the age that year before and after the
   birthday, who reaches each milestone age that year, and FAQs. The years
   run from next year to nine years ahead, plus 2040, 2045 and 2050, and
   move on each January (build-monthly.js runs this before the born-in
   pages, which link here). A hub block on /birthday/ lists them. */
const site = require("./lib/site.js");
const { SITE } = site;

const NOW = Number(site.TODAY.slice(0, 4));
const TARGETS = Array.from(new Set([...Array.from({ length: 9 }, (_, i) => NOW + 1 + i), 2040, 2045, 2050])).filter((t) => t > NOW).sort((a, b) => a - b);
const BIRTHS = []; for (let y = 1930; y <= NOW; y++) BIRTHS.push(y);
const url = (t) => `/birthday/how-old-will-i-be-in-${t}/`;
const born = (y) => `/birthday/born-in-${y}/`;
const leap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
const MILES = [1, 5, 10, 16, 18, 21, 30, 40, 50, 60, 65, 70, 80, 90, 100];

function page(t) {
  const loc = SITE + url(t), away = t - NOW;
  const title = site.fitTitle(`How Old Will I Be in ${t}? Age Calculator and Table by Birth Year`, `How Old Will I Be in ${t}? Age by Birth Year`);
  const desc = `How old you'll be in ${t}: enter your date of birth for your age on 1 January, on your birthday and on 31 December ${t}, or find your birth year in the table.`;
  const rows = BIRTHS.slice().reverse().map((y) => [y < NOW ? `<a href="${born(y)}">${y}</a>` : String(y), String(t - y - 1), String(t - y)]);
  const miles = MILES.filter((a) => t - a >= 1900).map((a) => [String(a), t - a < NOW && t - a >= 1930 ? `<a href="${born(t - a)}">${t - a}</a>` : String(t - a)]);
  const q = [
    [`How old will I be in ${t} if I was born in 2000?`, `${t - 2000} once you've had your birthday in ${t}, or ${t - 2001} before it.`],
    [`How old will I be in ${t} if I was born in 1990?`, `${t - 1990} after your birthday in ${t}, or ${t - 1991} before it.`],
    [`How old will I be in ${t} if I was born in 1980?`, `${t - 1980} after your birthday in ${t}, or ${t - 1981} before it.`],
    [`How do I work out how old I'll be in ${t}?`, `Take your birth year from ${t}: that's your age after your birthday in ${t}. Before your birthday you're one year younger. Someone born in 1995 is ${t - 1995} after their ${t} birthday and ${t - 1996} before it.`],
    [`Who turns 18 in ${t}?`, `Anyone born in ${t - 18}. People born in ${t - 21} turn 21, and those born in ${t - 65} turn 65.`],
    [`How many years until ${t}?`, `${t} is ${away} year${away === 1 ? "" : "s"} after ${NOW}. ${leap(t) ? `It's a leap year, with a 29 February.` : `It isn't a leap year.`}`]
  ];
  const others = TARGETS.filter((x) => x !== t).map((x) => `<a href="${url(x)}">How old will I be in ${x}?</a>`).join(" ");
  const ld = [site.webPage(title, desc, loc), site.breadcrumb([["Home", SITE + "/"], ["Age Calculator", SITE + "/birthday/"], [`How old will I be in ${t}?`, loc]]), site.faqLd(q)];
  return site.head({ title, desc, url: loc, ld }) + `    <header class="site-header">
      <a class="back-link" href="/birthday/">← Age calculator</a>
      <h1 class="page-title">How old will I be in ${t}?</h1>
      <p class="page-subtitle">Your age at the start of ${t}, on your birthday and at the end of the year — or find your birth year in the table.</p>
    </header>

    <section class="tool" id="aiy" data-year="${t}">
      <h2 class="tool-section-title">Date of birth</h2>
      <div class="field-row field-row-3" style="max-width:420px;">
        <div class="field">
          <label for="aiy-day">Day</label>
          <input type="number" id="aiy-day" min="1" max="31" step="1" placeholder="DD" inputmode="numeric" autocomplete="bday-day" value="15">
        </div>
        <div class="field">
          <label for="aiy-month">Month</label>
          <select id="aiy-month" autocomplete="bday-month">
${["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((n, i) => `            <option value="${i + 1}"${i === 5 ? " selected" : ""}>${n}</option>`).join("\n")}
          </select>
        </div>
        <div class="field">
          <label for="aiy-year">Year</label>
          <input type="number" id="aiy-year" min="1880" max="${t}" step="1" placeholder="YYYY" inputmode="numeric" autocomplete="bday-year" value="1990">
        </div>
      </div>
      <p class="tool-hint" id="aiy-error" role="alert" style="color: var(--bad); display: none;"></p>
      <div class="result-box" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="aiy-age">${t - 1990}</div>
          <div class="label" id="aiy-label">your age after your birthday in ${t}</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row"><span class="r-label">On 1 January ${t}</span><span class="r-value" id="aiy-start">${t - 1991}</span></div>
          <div class="result-row highlight"><span class="r-label">Your birthday in ${t}</span><span class="r-value" id="aiy-bday">—</span></div>
          <div class="result-row"><span class="r-label">On 31 December ${t}</span><span class="r-value" id="aiy-end">${t - 1990}</span></div>
        </div>
      </div>
      <p class="tool-hint" style="margin-top:12px;">For your exact age today in years, months, days and hours, use the <a href="/birthday/">age calculator</a>.</p>
    </section>

    <main class="tool">
      <h2 class="tool-section-title">Age in ${t} by birth year</h2>
${site.table(["Born in", `Before your ${t} birthday`, `After your ${t} birthday`], rows, 360)}      <p class="tool-hint" style="margin-top:12px;">Each birth year links to that year's page: your age now, your generation and when you reach each milestone.</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">Who turns what in ${t}</h2>
${site.table(["Turning", "Born in"], miles, 260)}    </main>

    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}    </main>

    <div class="hub-group-title" style="margin-top:28px;">Other years</div>
    <p class="salary-links">${others}</p>

${site.FOOTER}
  </div>
  <script>
(function () {
  var T = ${t}, M = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  var W = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var $ = function (id) { return document.getElementById(id); };
  function run() {
    var d = +$("aiy-day").value, m = +$("aiy-month").value, y = +$("aiy-year").value, err = $("aiy-error");
    var dt = new Date(Date.UTC(y, m - 1, d));
    var ok = d && m && y >= 1880 && y <= T && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
    err.style.display = ok ? "none" : "block";
    if (!ok) { err.textContent = y > T ? "That date is after " + T + "." : "Enter a real date of birth."; return; }
    var noLeap = m === 2 && d === 29 && new Date(Date.UTC(T, 1, 29)).getUTCMonth() !== 1;
    var bd = new Date(Date.UTC(T, m - 1, d)), after = T - y;
    $("aiy-age").textContent = after;
    $("aiy-label").textContent = after === 0 ? "born in " + T : "your age after your birthday in " + T;
    $("aiy-start").textContent = y === T ? "Not born yet" : (m === 1 && d === 1 ? after : after - 1);
    $("aiy-bday").textContent = noLeap ? "No 29 February in " + T + " (28 February or 1 March): you turn " + after
      : y === T ? "Born " + W[bd.getUTCDay()] + " " + bd.getUTCDate() + " " + M[bd.getUTCMonth()] : W[bd.getUTCDay()] + " " + bd.getUTCDate() + " " + M[bd.getUTCMonth()] + ": you turn " + after;
    $("aiy-end").textContent = after;
  }
  ["aiy-day", "aiy-month", "aiy-year"].forEach(function (id) { $(id).addEventListener("input", run); $(id).addEventListener("change", run); });
  run();
})();
  </script>
</body>
</html>
`;
}

const urls = [];
TARGETS.forEach((t) => { site.write(`birthday/how-old-will-i-be-in-${t}`, page(t)); urls.push([url(t), "0.5"]); });
site.prune("birthday", /^how-old-will-i-be-in-\d+$/);
site.hubBlock("/birthday/", "age in year pages", "tools/build-age-in-year-pages.js", `    <main class="tool">
      <h2 class="tool-section-title">How old will I be in…</h2>
      <p class="salary-links">${TARGETS.map((t) => `<a href="${url(t)}">${t}</a>`).join(" ")}</p>
    </main>

`);
site.sitemapBlock("age in year pages", "tools/build-age-in-year-pages.js", urls);
console.log(`built ${TARGETS.length} how-old-will-I-be pages (${TARGETS.join(", ")})`);
