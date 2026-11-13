#!/usr/bin/env node
/* Builds /age-on-other-planets/ with an example worked out in the HTML.

       node tools/build-planet-age.js */
const site = require("./lib/site.js");
const related = require("./related.js");
const PA = require("../age-on-other-planets.js");
const { esc, SITE } = site;

const EX_BORN = "1990-01-01";

function page() {
  const born = new Date(EX_BORN + "T00:00:00");
  const now = new Date(site.TODAY + "T00:00:00");
  const rows = PA.ages(born, now);
  const fmtAge = (v) => (v >= 10 ? Math.floor(v).toLocaleString("en-GB") : (Math.floor(v * 100) / 100).toLocaleString("en-GB"));
  const fmtDate = (d) => (d.getFullYear() > 9999 ? "—" : d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }));
  const body = rows.map((r) => `<tr><td>${r.name === "Earth" ? "<strong>Earth</strong>" : r.name}</td><td>${fmtAge(r.age)}</td><td>${fmtDate(r.next)}</td></tr>`).join("\n");
  const mars = rows.find((r) => r.name === "Mars"), merc = rows.find((r) => r.name === "Mercury");
  const url = SITE + "/age-on-other-planets/";
  const title = "Age on Other Planets Calculator — How Old Would I Be on Mars?";
  const desc = "Put in your date of birth to see how old you'd be on Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune and Pluto, and when your next birthday on each would be.";
  const q = [
    ["How old would I be on Mars?", `A Mars year is ${PA.ORBIT.Mars[0]} Earth days, about 1.88 Earth years, so divide your age by 1.88. Someone born on 1 January 1990 is ${fmtAge(mars.age)} in Mars years.`],
    ["Where would I be oldest?", `Mercury, which goes round the Sun every ${PA.ORBIT.Mercury[0]} days: the same person is ${fmtAge(merc.age)} in Mercury years. On Neptune and Pluto, whose years last 164 and 248 Earth years, nobody has yet reached their first birthday.`],
    ["What is a planet's year?", "The time it takes to go once round the Sun. Planets further out travel further, and more slowly, so their years are longer."],
    ["Is a day the same length too?", `No — a day (sunrise to sunrise) is ${PA.ORBIT.Mars[1]} hours on Mars, ${PA.ORBIT.Jupiter[1]} on Jupiter, and ${PA.ORBIT.Venus[1].toLocaleString("en-GB")} hours on Venus, where a day is longer than its year.`]
  ];
  const ld = [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], ["Age on Other Planets", url]]), site.faqLd(q)];
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="/">← All calculators</a>
      <h1 class="page-title">Age on other planets</h1>
      <p class="page-subtitle">How old you'd be on every planet, and when your next birthday there falls.</p>
    </header>

    <main class="tool">
      <div class="field" style="max-width:280px;">
        <label for="ap-born">Date of birth</label>
        <input type="date" id="ap-born" value="${EX_BORN}">
      </div>
      <p class="tool-hint" id="ap-error" role="alert" style="color: var(--bad); display: none;"></p>
      <div class="table-scroll">
        <div style="min-width:320px;">
          <table class="out-table">
            <thead><tr><th>Planet</th><th>Your age</th><th>Next birthday there</th></tr></thead>
            <tbody id="ap-body">
${body}
            </tbody>
          </table>
        </div>
      </div>
      <p class="tool-hint" style="margin-top:12px;">You've been alive <span id="ap-days">${Math.floor(rows[0].days).toLocaleString("en-GB")} days</span>. Orbital periods from NASA's Planetary Fact Sheet.</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">How long a year lasts</p>
${site.table(["Planet", "One year (Earth days)", "One day (hours)"], Object.keys(PA.ORBIT).map((n) => [n, PA.ORBIT[n][0].toLocaleString("en-GB"), PA.ORBIT[n][1].toLocaleString("en-GB")]), 360)}      <p class="tool-hint" style="margin-top:12px;">Your weight is different on each world too: <a href="/weight-on-other-planets/">weight on other planets</a>, or one planet at a time: ${["mars", "moon", "jupiter", "venus"].map((s) => `<a href="/weight-on-other-planets/${s}/">${s === "moon" ? "the Moon" : s[0].toUpperCase() + s.slice(1)}</a>`).join(", ")}.</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">Frequently asked questions</p>
${site.faqHtml(q)}    </main>

${related.block("/age-on-other-planets/")}
${site.FOOTER}
  </div>
  <script src="/age-on-other-planets.js"></script>
</body>
</html>
`;
}

site.write("age-on-other-planets", page());
console.log("built /age-on-other-planets/");
