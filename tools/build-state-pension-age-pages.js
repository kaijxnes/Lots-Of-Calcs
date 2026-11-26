#!/usr/bin/env node
/* The State Pension age calculator and a page for each birth year:

       /state-pension-age-calculator/
       /state-pension-age-calculator/born-1954/ ... /born-1995/

       node tools/build-state-pension-age-pages.js

   The dates come from DWP's State Pension age timetable, transcribed into
   data/uk/state-pension-age.json; the pages are built from the same
   functions the calculator runs (state-pension-age.js). The build stops
   unless the timetable's own worked examples (31 July 1960, 31 December
   1960, 31 January 1961) come out the same, and unless the full State
   Pension quoted from GOV.UK matches the UK rates file. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const related = require("./related.js");
const SPA = require("../state-pension-age.js");
const { esc, SITE } = site;

const R = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/uk/state-pension-age.json"), "utf8"));
const RATES = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/uk/rates-2026-27.json"), "utf8"));
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const nice = (s) => { const p = s.split("-"); return `${+p[2]} ${MONTHS[+p[1] - 1]} ${p[0]}`; };
const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
const ageText = (a) => [plural(a.years, "year")].concat(a.months ? [plural(a.months, "month")] : []).concat(a.days ? [plural(a.days, "day")] : []).join(", ");
const m2 = (v) => "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const Q = (k) => R.rules[k].quote;

/* the timetable's own examples, and every row edge, must come out the same */
R.examples.forEach((e) => { const r = SPA.calc(R, e.dob); if (!r || r.date !== e.date) throw new Error(`state pension age: born ${e.dob} gives ${r && r.date}, but the timetable says ${e.date}`); });
for (const k of ["to66", "to67", "to68"]) for (const row of R.tables[k].rows) for (const d of [row.from, row.to].filter(Boolean)) {
  const r = SPA.calc(R, d), want = row.date || SPA.addMonths(d, row.years, row.months);
  if (!r || r.date !== want) throw new Error(`state pension age: born ${d} gives ${r && r.date}, not ${want}`);
}
const FULL = RATES.pensions.statePensionWeekly;
if (!Q("fullRate").includes(m2(FULL))) throw new Error(`state pension age: GOV.UK's quoted full rate isn't the ${m2(FULL)} in data/uk/rates-2026-27.json`);
if (!Q("monthEnd").includes("30 November 2026")) throw new Error("state pension age: the timetable's month-end note has changed");

const BASE = "/state-pension-age-calculator/", YEARS = []; for (let y = 1954; y <= 1995; y++) YEARS.push(y);
const yurl = (y) => `${BASE}born-${y}/`;
const SRC = R.sources.slice(0, 2).map((s) => `<a href="${s.url}" rel="nofollow noopener" target="_blank">${esc(s.title)}</a>`).join(" and ");
const SRC_SP = `<a href="${R.sources[3].url}" rel="nofollow noopener" target="_blank">${esc(R.sources[3].title)}</a>`;

/* the timetable rows that cover a birth year, clipped to it */
function segments(y) {
  const lo = `${y}-01-01`, hi = `${y}-12-31`, out = [];
  ["to66", "to67", "to68"].forEach((k) => R.tables[k].rows.forEach((row) => {
    const a = row.from > lo ? row.from : lo, b = row.to === null || row.to > hi ? hi : row.to;
    if (a <= b) out.push({ a, b, row, first: SPA.calc(R, a), last: SPA.calc(R, b) });
  }));
  return out;
}
const spaLabel = (row) => row.date ? nice(row.date) : row.months ? `${row.years} years and ${plural(row.months, "month")}` : `${row.years} (your ${row.years}th birthday)`;
const reached = (s) => s.first.date === s.last.date ? nice(s.first.date) : `${nice(s.first.date)} to ${nice(s.last.date)}`;
const ageOf = (s) => s.row.date ? (ageText(s.first.age) === ageText(s.last.age) ? ageText(s.first.age) : `${ageText(s.last.age)} to ${ageText(s.first.age)}`) : ageText(s.first.age);
function summary(y) {
  const sg = segments(y), ages = [...new Set(sg.map((s) => s.row.date ? null : s.row.years + (s.row.months ? ` years and ${plural(s.row.months, "month")}` : "")).filter(Boolean))];
  const years = [...new Set(sg.flatMap((s) => [s.first.date.slice(0, 4), s.last.date.slice(0, 4)]))].sort();
  return { sg, ages, years, single: sg.length === 1 && !sg[0].row.date ? sg[0].row.years : null };
}

function tool(dob) {
  const p = dob.split("-");
  return `    <main class="tool split" id="spa-tool" data-rules="${esc(JSON.stringify({ tables: R.tables }))}">
      <div class="field-row">
        <div class="field"><label for="spa-day">Day</label><input type="number" id="spa-day" value="${+p[2]}" min="1" max="31" step="1" inputmode="numeric"></div>
        <div class="field"><label for="spa-month">Month</label><select id="spa-month">${MONTHS.map((m, i) => `<option value="${i + 1}"${i + 1 === +p[1] ? " selected" : ""}>${m}</option>`).join("")}</select></div>
        <div class="field"><label for="spa-year">Year of birth</label><input type="number" id="spa-year" value="${+p[0]}" min="1900" max="2100" step="1" inputmode="numeric"></div>
      </div>
      <div class="field" id="spa-sex-row" style="display:none;"><label for="spa-sex">Born before 6 December 1953: State Pension age for</label><select id="spa-sex"><option value="">Choose</option><option value="female">Women</option><option value="male">Men</option></select></div>
      <p class="tool-hint" id="spa-error" role="alert" style="color: var(--bad); display: none;"></p>
      <div class="result-box split-aside" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="spa-date">—</div>
          <div class="label" id="spa-label">your State Pension age</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row highlight"><span class="r-label">State Pension age</span><span class="r-value" id="spa-age">—</span></div>
          <div class="result-row"><span class="r-label">Time until then</span><span class="r-value" id="spa-left">—</span></div>
          <div class="result-row"><span class="r-label">Rule</span><span class="r-value" id="spa-rule">—</span></div>
        </div>
        <p class="tool-hint" style="margin:10px 0 0;">Under current law. The rise from 67 to 68 could change after a future review.</p>
      </div>
    </main>
`;
}
const head = (title, desc, u, crumbs, q, app) => site.head({ title, desc, url: u, ld: [site.webPage(title, desc, u, R.lastChecked), site.breadcrumb(crumbs)].concat(app ? [app] : []).concat([site.faqLd(q)]) });
const amount = `    <main class="tool">
      <h2 class="tool-section-title">How much State Pension you get</h2>
      <p class="about-text">The full new State Pension is <strong>${m2(FULL)} a week</strong> (${m2(FULL * 52)} a year). You need 10 qualifying years on your National Insurance record to get any, and if your record started after April 2016, 35 qualifying years for the full amount. It goes up each year by the highest of earnings growth, CPI inflation or 2.5%. Your State Pension forecast on GOV.UK shows what you're on track for. It doesn't come automatically: you have to claim it. For the rest of your retirement income, try the <a href="/pension-drawdown-calculator/">pension drawdown calculator</a>.</p>
      <p class="tool-hint" style="margin-top:8px;">State Pension from ${SRC_SP}.</p>
    </main>
`;
const SCRIPT = `  <script src="/state-pension-age.js"></script>`;

function yearPage(y) {
  const u = SITE + yurl(y), s = summary(y);
  const rows = s.sg.map((x) => [`${nice(x.a)} to ${nice(x.b)}`, esc(spaLabel(x.row)), ageOf(x), reached(x)]);
  const headline = s.single ? `${s.single}` : s.ages.length ? s.ages.join(" or ") : `between ${ageText(s.sg[s.sg.length - 1].last.age)} and ${ageText(s.sg[0].first.age)}`;
  const when = s.years.length === 1 ? `in ${s.years[0]}` : `between ${s.years[0]} and ${s.years[s.years.length - 1]}`;
  const title = site.fitTitle(`State Pension Age If Born in ${y} — When You Can Claim`, `State Pension Age Born ${y}`);
  const desc = s.single ? `Born in ${y}? Your State Pension age is ${s.single}, so you reach it on your ${s.single}th birthday, ${when}, under current law. Check the exact date and how much you could get.`
    : `Born in ${y}? Your State Pension age depends on your birthday: you reach it ${when}. See the date for each birth date under current law.`;
  const q = [
    [`What is my State Pension age if I was born in ${y}?`, s.single ? `${s.single}. You reach State Pension age on your ${s.single}th birthday, ${when}.` : `It depends on your date of birth: ${s.sg.map((x) => `born ${nice(x.a)} to ${nice(x.b)}, ${spaLabel(x.row)}`).join("; ")}.`],
    [`When can I get my State Pension if I was born in ${y}?`, `${s.single ? `On your ${s.single}th birthday` : "On the date in the table above"}, ${when}, under current law. You need to claim it; you can get it from your State Pension age, not before.`],
    ["Could my State Pension age change?", y >= 1970 ? "The rise from 67 to 68, set for people born from 6 April 1977, could change after a future review. The government has said it's committed to giving 10 years' notice of changes, and Parliament would need to approve them." : "The timetables for State Pension age to 66 and 67 aren't expected to change. The rise from 67 to 68 could change after a future review, but that affects people born from 6 April 1977."],
    ["How much is the full State Pension?", `${m2(FULL)} a week. You need 35 qualifying years on your National Insurance record for the full new State Pension (if your record started after April 2016), and at least 10 for any.`]
  ];
  const ex = s.sg[0].a, near = YEARS.filter((x) => Math.abs(x - y) <= 6 && x !== y).map((x) => `<a href="${yurl(x)}">Born ${x}</a>`).join(" ");
  return head(title, desc, u, [["Home", SITE + "/"], ["State Pension Age Calculator", SITE + BASE], [`Born ${y}`, u]], q) + `    <header class="site-header">
      <a class="back-link" href="${BASE}">← State Pension age calculator</a>
      <h1 class="page-title">State Pension age if you were born in ${y}</h1>
      <p class="page-subtitle">${s.single ? `<strong>${s.single}</strong>: you reach State Pension age on your ${s.single}th birthday, ${when}.` : `You reach State Pension age ${when}, depending on your birthday.`}</p>
    </header>

${tool(ex)}
    <main class="tool">
      <h2 class="tool-section-title">Born in ${y}: when you reach State Pension age</h2>
${site.table(["Born", "State Pension age", "Age when you reach it", "You reach it"], rows, 620)}      <p class="tool-hint" style="margin-top:8px;">From DWP's State Pension age timetable, under current law. Enter your date of birth above for your own date.</p>
    </main>

${amount}
    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}      <p class="tool-hint" style="margin-top:12px;">A guide, not advice: GOV.UK's Check your State Pension age service confirms your date. Timetable from ${SRC}. Last checked ${site.niceDate(R.lastChecked)}.</p>
    </main>

    <div class="hub-group-title" style="margin-top:28px;">Other birth years</div>
    <p class="salary-links">${near}</p>

${site.FOOTER}
  </div>
${SCRIPT}
</body>
</html>
`;
}

function hub() {
  const u = SITE + BASE;
  const plan = [
    ["6 December 1953 to 5 October 1954", "Between 65 and 66 (a set date)", "March 2019 to September 2020"],
    ["6 October 1954 to 5 April 1960", "66", "Your 66th birthday"],
    ["6 April 1960 to 5 March 1961", "66 and 1 to 11 months", "May 2026 to February 2028"],
    ["6 March 1961 to 5 April 1977", "67", "Your 67th birthday"],
    ["6 April 1977 to 5 April 1978", "Between 67 and 68 (a set date)", "May 2044 to March 2046"],
    ["6 April 1978 or later", "68", "Your 68th birthday"]
  ];
  /* the summary rows must agree with the timetable at both ends */
  const chk = [["1953-12-06", "2019-03"], ["1954-10-05", "2020-09"], ["1960-04-06", "2026-05"], ["1961-03-05", "2028-02"], ["1977-04-06", "2044-05"], ["1978-04-05", "2046-03"]];
  chk.forEach(([d, ym]) => { if (SPA.calc(R, d).date.slice(0, 7) !== ym) throw new Error(`state pension age: the summary table is wrong for ${d}`); });
  const phaseRows = R.tables.to67.rows.filter((r) => r.months).map((r) => { const a = SPA.calc(R, r.from), b = SPA.calc(R, r.to); return [`${nice(r.from)} to ${nice(r.to)}`, `66 years and ${plural(r.months, "month")}`, `${nice(a.date)} to ${nice(b.date)}`]; });
  const grid = YEARS.map((y) => `<a href="${yurl(y)}">Born ${y}</a>`).join(" ");
  const title = site.fitTitle("State Pension Age Calculator — When Will I Get My State Pension?", "State Pension Age Calculator");
  const desc = "Find your State Pension age and the date you reach it from your date of birth: 66 now, rising to 67 between 2026 and 2028 and to 68 between 2044 and 2046 under current law.";
  const q = [
    ["What is the State Pension age now?", "66 for people born from 6 October 1954 to 5 April 1960. It's rising to 67 between 2026 and 2028 for people born from 6 April 1960, and is 67 for people born from 6 March 1961 to 5 April 1977."],
    ["When does the State Pension age go up to 67?", "Between 2026 and 2028. People born between 6 April 1960 and 5 March 1961 reach it at 66 and a number of months, from 66 years and 1 month to 66 years and 11 months; anyone born from 6 March 1961 reaches it at 67."],
    ["When does the State Pension age go up to 68?", "Under the Pensions Act 2007, between 2044 and 2046, for people born from 6 April 1977; it's 68 for anyone born on or after 6 April 1978. That timetable could change after a future review, which will reconsider the rise to 68."],
    ["What if the date doesn't exist in that month?", "You reach State Pension age on the last day of the month. The timetable's example: born 31 July 1960, you reach 66 years and 4 months on 30 November 2026."],
    ["How much is the State Pension?", `The full new State Pension is ${m2(FULL)} a week. You need at least 10 qualifying years of National Insurance to get any, and 35 for the full amount if your record started after April 2016.`]
  ];
  const app = { "@context": "https://schema.org", "@type": "WebApplication", name: "State Pension Age Calculator", url: u, applicationCategory: "FinanceApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } };
  return head(title, desc, u, [["Home", SITE + "/"], ["Personal Finance", SITE + "/personal-finance/"], ["State Pension Age Calculator", u]], q, app) + `    <header class="site-header">
      <a class="back-link" href="/personal-finance/">← Personal finance calculators</a>
      <h1 class="page-title">State Pension age calculator</h1>
      <p class="page-subtitle">When you reach State Pension age, from your date of birth, under current law.</p>
    </header>

${tool("1962-06-15")}
    <main class="tool">
      <h2 class="tool-section-title">State Pension age by date of birth</h2>
${site.table(["Born", "State Pension age", "You reach it"], plan, 620)}      <h2 class="tool-section-title" style="margin-top:18px;">The rise from 66 to 67</h2>
      <p class="about-text">The Pensions Act 2014 brought the rise to 67 forward to 2026–2028. People born between 6 April 1960 and 5 March 1961 reach State Pension age at 66 and a set number of months rather than on a fixed date. If that would be a day the month doesn't have, it's the last day of the month: born 31 July 1960, you reach 66 years and 4 months on 30 November 2026.</p>
${site.table(["Born", "State Pension age", "You reach it"], phaseRows, 620)}      <h2 class="tool-section-title" style="margin-top:18px;">The rise from 67 to 68</h2>
      <p class="about-text">Under the Pensions Act 2007, State Pension age rises from 67 to 68 between 2044 and 2046, for people born from 6 April 1977, and is 68 for anyone born on or after 6 April 1978. That part of the timetable could change after a future review: the government has said the next review will reconsider the rise to 68, and that it's committed to giving 10 years' notice of changes. Any change would need Parliament's approval.</p>
      <h2 class="tool-section-title" style="margin-top:18px;">By year of birth</h2>
      <p class="salary-links">${grid}</p>
    </main>

${amount}
    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}      <p class="tool-hint" style="margin-top:12px;">A guide, not advice: GOV.UK's Check your State Pension age service confirms your date. Timetable from ${SRC}. Last checked ${site.niceDate(R.lastChecked)}.</p>
    </main>

${related.block(BASE)}
${site.FOOTER}
  </div>
${SCRIPT}
</body>
</html>
`;
}

const urls = [[BASE, "0.6"]];
site.write("state-pension-age-calculator", hub());
YEARS.forEach((y) => { site.write(`state-pension-age-calculator/born-${y}`, yearPage(y)); urls.push([yurl(y), "0.5"]); });
site.sitemapBlock("state pension age pages", "tools/build-state-pension-age-pages.js", urls);
console.log(`built the State Pension age calculator and ${YEARS.length} birth-year pages (born 31 July 1960: ${nice(SPA.calc(R, "1960-07-31").date)})`);
