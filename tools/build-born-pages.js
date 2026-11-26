#!/usr/bin/env node
/* "How old am I if I was born in 1990?" — a page per birth year, and one per
   month of it with every date's exact age:

       /birthday/born-in-1990/
       /birthday/born-in-1990/february/

       node tools/build-born-pages.js

   The page states the age in the year it was built and the browser updates it
   from the visitor's clock (born-page.js); re-run each January (the monthly
   check does) so the text moves on with the year. Generations follow Pew
   Research Center's definitions where Pew sets the years. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const W = require("../number-words.js");
const { esc, SITE } = site;

const NOW = Number(site.TODAY.slice(0, 4));
const YEARS = []; for (let y = 1930; y <= NOW - 1; y++) YEARS.push(y);
const leap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
function generation(y) {
  if (y < 1946) return ["the Silent Generation", "Born before the post-war baby boom."];
  if (y <= 1964) return ["the Baby Boomers", "The post-war birth surge from 1946 to 1964."];
  if (y <= 1980) return ["Generation X", "Born 1965 to 1980, in Pew Research Center's definition."];
  if (y <= 1996) return ["the Millennials (Generation Y)", "Born 1981 to 1996, in Pew Research Center's definition."];
  if (y <= 2012) return ["Generation Z", "Pew Research Center counts anyone born from 1997 as Gen Z; most researchers end it around 2012."];
  return ["Generation Alpha", "The generation after Gen Z, usually taken to start in the early 2010s."];
}
const url = (y) => `/birthday/born-in-${y}/`;
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const murl = (y, m) => `/birthday/born-in-${y}/${MONTHS[m].toLowerCase()}/`;
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const TD = new Date(site.TODAY + "T00:00:00Z");
const longDate = (t) => { const d = new Date(t); return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };
/* complete years, then whole months, then days, as the age calculator counts */
function ymd(a, b) {
  const A = new Date(a), B = new Date(b);
  let y = B.getUTCFullYear() - A.getUTCFullYear(), m = B.getUTCMonth() - A.getUTCMonth(), d = B.getUTCDate() - A.getUTCDate();
  if (d < 0) { m -= 1; d += new Date(Date.UTC(B.getUTCFullYear(), B.getUTCMonth(), 0)).getUTCDate(); }
  if (m < 0) { y -= 1; m += 12; }
  return [y, m, d];
}
const pl = (n, w) => `${n.toLocaleString("en-GB")} ${w}${n === 1 ? "" : "s"}`;
const ageText = (a) => `${pl(a[0], "year")}, ${pl(a[1], "month")}, ${pl(a[2], "day")}`;
function untilNext(dob) {
  const D = new Date(dob);
  let next = Date.UTC(TD.getUTCFullYear(), D.getUTCMonth(), D.getUTCDate());
  if (next < TD.getTime()) next = Date.UTC(TD.getUTCFullYear() + 1, D.getUTCMonth(), D.getUTCDate());
  return Math.round((next - TD.getTime()) / 86400000);
}

/* "How old am I if I was born on 14 February 2000?" — every day of one
   month, so each date's answer is on a page with the rest of its month */
function monthPage(y, m) {
  const name = `${MONTHS[m]} ${y}`, loc = SITE + murl(y, m);
  const days = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const asOf = longDate(TD.getTime());
  const rows = [];
  for (let d = 1; d <= days; d++) {
    const t = Date.UTC(y, m, d), a = ymd(t, TD.getTime()), lived = Math.round((TD.getTime() - t) / 86400000), u = untilNext(t);
    rows.push({ d, t, a, lived, u, wd: DAYS[new Date(t).getUTCDay()] });
  }
  const ex = rows[Math.min(14, days) - 1];
  const first = rows[0], last = rows[rows.length - 1];
  const title = site.fitTitle(`Born in ${name}? Your Exact Age by Date — Years, Months & Days`, `Born in ${name}? Your Exact Age by Date`);
  const desc = `How old you are if you were born in ${name}: your exact age in years, months and days for every date from 1 to ${days} ${MONTHS[m]} ${y}, the day of the week you were born, and days lived.`;
  const q = [
    [`How old am I if I was born on ${ex.d} ${name}?`, `On ${asOf} you are ${ageText(ex.a)} old, and you have lived ${ex.lived.toLocaleString("en-GB")} days. You were born on a ${ex.wd}.`],
    [`What day of the week was 1 ${name}?`, `${first.wd}. ${name} ended on a ${last.wd}, ${days} ${MONTHS[m]}.`],
    [`How old is someone born in ${name}?`, `On ${asOf}, between ${ageText(last.a)} (born ${days} ${MONTHS[m]}) and ${ageText(first.a)} (born 1 ${MONTHS[m]}). Find your date in the table for your exact age.`]
  ];
  if (m === 1 && days === 29) q.push([`When does someone born on 29 February ${y} celebrate their birthday?`, "On 29 February in leap years. In other years most people celebrate on 28 February or 1 March; in UK law you come of age on 1 March in a year without a 29 February."]);
  const ld = [site.webPage(title, desc, loc), site.breadcrumb([["Home", SITE + "/"], ["Age Calculator", SITE + "/birthday/"], [`Born in ${y}`, SITE + url(y)], [MONTHS[m], loc]]), site.faqLd(q)];
  const link = (r) => `/birthday/?dob-day=${r.d}&amp;dob-month=${m + 1}&amp;dob-year=${y}`;
  const months = MONTHS.map((n, i) => (i === m ? `<strong>${n}</strong>` : `<a href="${murl(y, i)}">${n}</a>`)).join(" ");
  const years = YEARS.filter((x) => x !== y && Math.abs(x - y) <= 3).map((x) => `<a href="${murl(x, m)}">${MONTHS[m]} ${x}</a>`).join(" ");
  return site.head({ title, desc, url: loc, ld }) + `    <header class="site-header">
      <a class="back-link" href="${url(y)}">← Born in ${y}</a>
      <h1 class="page-title">Born in ${name}: how old are you?</h1>
      <p class="page-subtitle">Your exact age in years, months and days for every date in ${name}, with the day of the week you were born.</p>
    </header>

    <main class="tool">
      <p class="about-text">Find your date of birth below. Ages are on <strong class="bm-asof">${asOf}</strong>; tap a date for your age in weeks, hours, minutes and seconds.</p>
      <div class="table-scroll">
        <div style="min-width:560px;">
          <table class="out-table" id="bm-table">
            <thead><tr><th>Born on</th><th>Day</th><th>Age on <span class="bm-asof">${asOf}</span></th><th>Days lived</th><th>Next birthday in</th></tr></thead>
            <tbody>
${rows.map((r) => `<tr id="${MONTHS[m].toLowerCase()}-${r.d}" data-dob="${y}-${String(m + 1).padStart(2, "0")}-${String(r.d).padStart(2, "0")}"><td><a href="${link(r)}">${r.d} ${MONTHS[m]}</a></td><td>${r.wd}</td><td>${ageText(r.a)}</td><td>${r.lived.toLocaleString("en-GB")}</td><td>${r.u === 0 ? "Today!" : pl(r.u, "day")}</td></tr>`).join("\n")}
            </tbody>
          </table>
        </div>
      </div>
      <p class="tool-hint" style="margin-top:12px;">Counted the way you'd count on a calendar: complete years, then whole months since your last birthday, then the days left over. The <a href="/birthday/">age calculator</a> works it out for any date.</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}    </main>

    <div class="hub-group-title" style="margin-top:28px;">Other months in ${y}</div>
    <p class="salary-links">${months}</p>
    <div class="hub-group-title" style="margin-top:18px;">${MONTHS[m]} in other years</div>
    <p class="salary-links">${years} <a href="${url(y)}">Born in ${y}</a></p>

${site.FOOTER}
  </div>
  <script src="/born-month.js"></script>
</body>
</html>
`;
}

function page(y) {
  const after = NOW - y, before = after - 1;
  const [gen, genNote] = generation(y);
  const loc = SITE + url(y);
  const title = `Born in ${y}? How Old You Are in ${NOW} — ${before} or ${after}`;
  const desc = `If you were born in ${y}, you are ${after} in ${NOW} once you've had your birthday, or ${before} before it. With your generation and the year you turn every milestone age.`;
  const miles = [18, 21, 30, 40, 50, 60, 65, 70, 80, 90, 100].map((a) => [`${a}`, `${y + a}`, y + a < NOW ? "Done" : y + a === NOW ? "This year" : `In ${y + a - NOW} year${y + a - NOW === 1 ? "" : "s"}`]);
  const future = Array.from(new Set([NOW + 1, NOW + 2, NOW + 3, NOW + 4, 2030, 2035, 2040, 2045, 2050].filter((t) => t > NOW))).sort((a, b) => a - b);
  /* link the year to its "how old will I be in…" page (tools/build-age-in-year-pages.js) */
  const ahead = future.map((t) => [fs.existsSync(path.join(site.ROOT, "birthday", `how-old-will-i-be-in-${t}`, "index.html")) ? `<a href="/birthday/how-old-will-i-be-in-${t}/">${t}</a>` : String(t), `${t - y - 1} or ${t - y}`]);
  const q = [
    [`How old will I be in 2030 if I was born in ${y}?`, `${2030 - y} once your birthday has passed in 2030, or ${2030 - y - 1} before it. In ${NOW + 1} you'll be ${NOW + 1 - y} after your birthday.`],
    [`How old am I if I was born in ${y}?`, `In ${NOW} you are ${after} if your birthday has already been this year, or ${before} if it's still to come.`],
    [`What generation is someone born in ${y}?`, `${W.cap(gen)}. ${genNote}`],
    [`Was ${y} a leap year?`, leap(y) ? `Yes — ${y} had a 29 February.` : `No. ${y} had 365 days.`],
    [`How do you write ${y} in words?`, `As a year it's said "${W.yearSpoken(y)}"; in full, ${W.british(y)}. In Roman numerals it's ${W.roman(y)}.`]
  ];
  const near = YEARS.filter((x) => x !== y && Math.abs(x - y) <= 5).map((x) => `<a href="${url(x)}">Born in ${x}</a>`).join(" ");
  const ld = [site.webPage(title, desc, loc), site.breadcrumb([["Home", SITE + "/"], ["Age Calculator", SITE + "/birthday/"], [`Born in ${y}`, loc]]), site.faqLd(q)];
  return site.head({ title, desc, url: loc, ld }) + `    <header class="site-header">
      <a class="back-link" href="/birthday/">← Age calculator</a>
      <h1 class="page-title">Born in ${y}: how old are you?</h1>
      <p class="page-subtitle">Your age now, your generation, and when you reach each milestone.</p>
    </header>

    <main class="tool" id="born-tool" data-year="${y}">
      <div class="result-box">
        <div class="result-hero">
          <div class="value" id="born-age">${before} or ${after}</div>
          <div class="label" id="born-label">years old in ${NOW} — ${after} once you've had your birthday this year, ${before} before it</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row"><span class="r-label">Generation</span><span class="r-value">${esc(W.cap(gen.replace(/^the /, "")))}</span></div>
          <div class="result-row"><span class="r-label">Leap year</span><span class="r-value">${leap(y) ? "Yes" : "No"}</span></div>
          <div class="result-row"><span class="r-label">In Roman numerals</span><span class="r-value"><a href="/roman-numerals/${y}/">${W.roman(y)}</a></span></div>
          <div class="result-row"><span class="r-label">Said as a year</span><span class="r-value"><a href="/number-to-words/${y}/">${esc(W.cap(W.yearSpoken(y)))}</a></span></div>
        </div>
      </div>
      <p class="tool-hint" style="margin-top:12px;">For your exact age in years, months and days, and the day of the week you were born, use the <a href="/birthday/">age calculator</a>.</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">Your exact age, by the month you were born</h2>
      <p class="salary-links">${MONTHS.map((n, m) => `<a href="${murl(y, m)}">${n} ${y}</a>`).join(" ")}</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">How old you'll be in…</h2>
${site.table(["Year", "Age that year"], ahead, 260)}      <p class="tool-hint" style="margin-top:12px;">The lower age before your birthday that year, the higher one after it.</p>
      <h2 class="tool-section-title" style="margin-top:20px;">When you turn each age</h2>
${site.table(["Age", "Year", ""], miles, 300)}    </main>

    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}    </main>

    <div class="hub-group-title" style="margin-top:28px;">Other birth years</div>
    <p class="salary-links">${near}</p>

${site.FOOTER}
  </div>
  <script src="/born-page.js"></script>
</body>
</html>
`;
}

function hubBlock() {
  const file = path.join(site.ROOT, "birthday/index.html");
  const START = "    <!-- born pages: generated by tools/build-born-pages.js -->\n";
  const END = "    <!-- end born pages -->\n";
  let s = fs.readFileSync(file, "utf8");
  if (s.includes(START)) s = s.slice(0, s.indexOf(START)) + s.slice(s.indexOf(END) + END.length).replace(/^\n/, "");
  const decades = []; for (let d = 1930; d < NOW; d += 10) decades.push(d);
  const html = `    <main class="tool">
      <h2 class="tool-section-title">How old am I if I was born in…</h2>
${decades.map((d) => `      <p class="salary-links">${YEARS.filter((y) => y >= d && y < d + 10).map((y) => `<a href="${url(y)}">${y}</a>`).join(" ")}</p>`).join("\n")}
    </main>

`;
  const at = s.indexOf("    <!-- related calculators: generated by tools/related.js -->");
  s = s.slice(0, at) + START + html + END + "\n" + s.slice(at);
  fs.writeFileSync(file, s);
}

const urls = [];
YEARS.forEach((y) => {
  site.write(`birthday/born-in-${y}`, page(y)); urls.push([url(y), "0.5"]);
  MONTHS.forEach((n, m) => { site.write(`birthday/born-in-${y}/${n.toLowerCase()}`, monthPage(y, m)); urls.push([murl(y, m), "0.4"]); });
});
hubBlock();
site.prune("birthday", /^born-in-\d+$/);
site.sitemapBlock("born pages", "tools/build-born-pages.js", urls);
console.log(`built ${YEARS.length} born-in pages and ${YEARS.length * 12} month pages (${YEARS[0]}–${YEARS[YEARS.length - 1]}) for ${site.TODAY}`);
