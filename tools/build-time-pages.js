#!/usr/bin/env node
/* Time and date tools, each a calculator with pages for the common searches:

       /hours-calculator/              hours between two times, and a weekly timesheet
       /hours-calculator/9am-to-5pm/   one shift, with and without breaks
       /days-from-today/  /days-from-today/90/
       /days-ago/         /days-ago/90/
       /weeks-from-today/ /weeks-from-today/12/
       /week-number/      /week-number/2026/   ISO 8601 week numbers
       /day-of-the-week/

       node tools/build-time-pages.js

   Plain arithmetic on the calendar, so nothing here goes out of date except
   which years the week-number pages cover (the current year and the next
   two) — the monthly rebuild re-runs it. Anything that depends on today's
   date ("90 days from today") is worked out live in the browser by
   time-tools.js; the pages themselves only state fixed facts. */
const site = require("./lib/site.js");
const related = require("./related.js");
const { esc, SITE } = site;

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAY = 86400000;
const utc = (y, m, d) => new Date(Date.UTC(y, m, d));
const addDays = (d, n) => new Date(d.getTime() + n * DAY);
const long = (d) => `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
const short = (d) => `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()].slice(0, 3)} ${d.getUTCFullYear()}`;
const iso = (d) => d.toISOString().slice(0, 10);
const TODAY = new Date(site.TODAY + "T00:00:00Z");
const YEAR = TODAY.getUTCFullYear();

/* ISO 8601: weeks start on Monday and week 1 is the week with the year's
   first Thursday in it (so the one containing 4 January) */
function isoWeek(d) {
  const t = new Date(d.getTime());
  t.setUTCDate(t.getUTCDate() + 3 - ((t.getUTCDay() + 6) % 7));
  const y = t.getUTCFullYear(), jan4 = utc(y, 0, 4);
  return { year: y, week: 1 + Math.round(((t - jan4) / DAY - 3 + ((jan4.getUTCDay() + 6) % 7)) / 7) };
}
function weeksOf(y) {
  const jan4 = utc(y, 0, 4), first = addDays(jan4, -((jan4.getUTCDay() + 6) % 7));
  const out = [];
  for (let m = first; isoWeek(m).year === y; m = addDays(m, 7)) out.push({ week: isoWeek(m).week, start: m, end: addDays(m, 6) });
  return out;
}
/* Checks against known ISO weeks */
[["2026-01-01", 2026, 1], ["2027-01-01", 2026, 53], ["2021-01-03", 2020, 53], ["2024-12-30", 2025, 1], ["2026-11-22", 2026, 47]].forEach(([d, y, w]) => {
  const r = isoWeek(new Date(d + "T00:00:00Z"));
  if (r.year !== y || r.week !== w) throw new Error(`ISO week of ${d}: got ${r.year}-W${r.week}, expected ${y}-W${w}`);
});
if (weeksOf(2026).length !== 53 || weeksOf(2025).length !== 52) throw new Error("weeks in year");

const faqBlock = (q) => `    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}    </main>
`;
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

${o.body}${faqBlock(o.q)}
${o.related ? related.block(o.path) : `    <main class="tool">
      <h2 class="tool-section-title">${esc(o.moreTitle)}</h2>
      <p class="salary-links">${o.more}</p>
    </main>
`}
${site.FOOTER}
  </div>
  <script src="/time-tools.js"></script>
</body>
</html>
`;
}
const row = (label, id, value, cls) => `          <div class="result-row${cls ? " " + cls : ""}"><span class="r-label">${label}</span><span class="r-value" id="${id}">${value}</span></div>`;

// ---------------------------------------------------------------- hours

const hm = (mins) => { const h = Math.floor(mins / 60), m = mins % 60; return `${h} hour${h === 1 ? "" : "s"}${m ? ` ${m} minute${m === 1 ? "" : "s"}` : ""}`; };
const Hm = (mins) => hm(mins).replace(/\b[hm]/g, (c) => c.toUpperCase());
const dec = (mins) => (mins / 60).toLocaleString("en-GB", { maximumFractionDigits: 2 });
/* "9am", "5:30pm", "12pm" (noon), "12am" (midnight) */
function clock(mins) {
  const h = Math.floor(mins / 60) % 24, m = mins % 60;
  return `${h % 12 === 0 ? 12 : h % 12}${m ? ":" + String(m).padStart(2, "0") : ""}${h < 12 ? "am" : "pm"}`;
}
const hhmm = (mins) => `${String(Math.floor(mins / 60) % 24).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
const T = (h, m) => h * 60 + (m || 0);
const SHIFTS = [[T(9), T(17)], [T(9), T(17, 30)], [T(9), T(18)], [T(8), T(16)], [T(8), T(16, 30)], [T(8), T(17)], [T(8, 30), T(17)], [T(8, 30), T(17, 30)],
  [T(7), T(15)], [T(7), T(15, 30)], [T(7), T(19)], [T(8), T(20)], [T(6), T(14)], [T(6), T(18)], [T(10), T(18)], [T(10), T(19)], [T(11), T(19)],
  [T(12), T(20)], [T(14), T(22)], [T(15), T(23)], [T(9), T(13)], [T(9), T(15)], [T(19), T(7)], [T(22), T(6)], [T(23), T(7)], [T(20), T(8)]];
const len = ([a, b]) => (b - a + 1440) % 1440 || 1440;
const shiftSlug = (s) => `${clock(s[0])}-to-${clock(s[1])}`.replace(/:/g, "");
const BREAKS = [0, 15, 20, 30, 45, 60];

function hoursTool(start, end, brk) {
  return `    <main class="tool" id="hr-tool">
      <div class="field-row">
        <div class="field"><label for="hr-start">Start time</label><input type="time" id="hr-start" value="${hhmm(start)}"></div>
        <div class="field"><label for="hr-end">End time</label><input type="time" id="hr-end" value="${hhmm(end)}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label for="hr-break">Unpaid break (minutes)</label><input type="number" id="hr-break" value="${brk}" min="0" step="1" inputmode="numeric"></div>
        <div class="field"><label for="hr-rate">Hourly rate (optional)</label><input type="number" id="hr-rate" value="" min="0" step="any" inputmode="decimal" placeholder="e.g. 12.50"></div>
      </div>
      <div class="result-box" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="hr-total">${esc(hm(len([start, end]) - brk))}</div>
          <div class="label">worked</div>
        </div>
        <div class="result-grid">
${row("In decimal hours", "hr-decimal", dec(len([start, end]) - brk))}
${row("Time from start to end", "hr-span", esc(hm(len([start, end]))))}
${row("Five days a week", "hr-week", esc(hm((len([start, end]) - brk) * 5)))}
${row("Pay for the shift", "hr-pay", "—")}
        </div>
      </div>
      <p class="tool-hint" style="margin-top:12px;">An end time earlier than the start counts as finishing the next day, for night shifts.</p>
    </main>
`;
}
const TIMESHEET_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
function timesheet() {
  const rows = TIMESHEET_DAYS.map((d, i) => `            <tr><td>${d}</td><td><input type="time" id="ts-s${i}" aria-label="${d} start"${i < 5 ? ' value="09:00"' : ""}></td><td><input type="time" id="ts-e${i}" aria-label="${d} end"${i < 5 ? ' value="17:00"' : ""}></td><td><input type="number" id="ts-b${i}" aria-label="${d} break in minutes" min="0" step="1" inputmode="numeric" style="width:70px;"${i < 5 ? ' value="30"' : ""}></td><td id="ts-t${i}">${i < 5 ? "7:30" : "—"}</td></tr>`).join("\n");
  return `    <main class="tool" id="ts-tool">
      <h2 class="tool-section-title" style="margin-top:0;">Weekly timesheet</h2>
      <div class="table-scroll">
        <div style="min-width:440px;">
          <table class="out-table">
            <thead><tr><th>Day</th><th>Start</th><th>End</th><th>Break (min)</th><th>Hours</th></tr></thead>
            <tbody>
${rows}
            </tbody>
          </table>
        </div>
      </div>
      <div class="field" style="max-width:220px; margin-top:12px;"><label for="ts-rate">Hourly rate (optional)</label><input type="number" id="ts-rate" min="0" step="any" inputmode="decimal" placeholder="e.g. 12.50"></div>
      <div class="result-box" aria-live="polite">
        <div class="result-grid">
${row("Total for the week", "ts-total", "37 hours 30 minutes", "highlight")}
${row("In decimal hours", "ts-decimal", "37.5")}
${row("Pay for the week", "ts-pay", "—")}
        </div>
      </div>
    </main>
`;
}

function hoursHub() {
  const q = [
    ["How do I work out hours worked?", "Take the start time from the end time, then take off any unpaid break. 8:30am to 5pm is 8 hours 30 minutes; with a 30-minute lunch, that's 8 hours worked. If the shift crosses midnight, add 24 hours to the end time first."],
    ["How do I convert minutes to decimal hours?", "Divide the minutes by 60: 15 minutes is 0.25 hours, 30 minutes 0.5, 45 minutes 0.75 and 20 minutes 0.33. So 7 hours 45 minutes is 7.75 hours — the figure payroll and timesheets usually want."],
    ["How do I work out pay for the hours?", "Multiply the decimal hours by the hourly rate: 7.5 hours at £12 is £90. Enter a rate in the calculator and it does it for the shift and the week."],
    ["How are night shifts counted?", "When the end time is earlier than the start, the calculator treats it as the next day: 10pm to 6am is 8 hours."]
  ];
  const links = SHIFTS.map((s) => `<a href="/hours-calculator/${shiftSlug(s)}/">${clock(s[0])} to ${clock(s[1])}</a>`).join(" ");
  return page({ path: "/hours-calculator/", app: "Hours Calculator", crumbs: [["Home", "/"]], crumb: "Hours Calculator", back: ["/", "All calculators"], related: true,
    title: "Hours Calculator — Hours Worked Between Two Times & Timesheet",
    desc: "Work out the hours between two times, less breaks, in hours and minutes and decimal hours — with a weekly timesheet and pay. 9am to 5pm with a 30-minute break is 7.5 hours.",
    h1: "Hours calculator", sub: "Hours worked between two times, less breaks — and a weekly timesheet with the total and pay.", q,
    body: hoursTool(T(9), T(17), 30) + timesheet() + `    <main class="tool">
      <h2 class="tool-section-title">Common shifts</h2>
      <p class="salary-links">${links}</p>
    </main>
` });
}
function shiftPage(s) {
  const L = len(s), a = clock(s[0]), b = clock(s[1]), slug = shiftSlug(s), night = s[1] <= s[0];
  const rows = BREAKS.map((br) => [br ? `${br} minutes` : "No break", hm(L - br), dec(L - br), hm((L - br) * 5)]);
  const q = [
    [`How many hours is ${a} to ${b}?`, `${hm(L)}${night ? ", finishing the next morning" : ""}. With a 30-minute unpaid break that's ${hm(L - 30)} worked (${dec(L - 30)} hours); with an hour's break, ${hm(L - 60)}.`],
    [`How many hours a week is ${a} to ${b}, five days a week?`, `${hm(L * 5)} with no breaks, or ${hm((L - 30) * 5)} (${dec((L - 30) * 5)} hours) with a 30-minute unpaid break each day.`],
    [`What is ${a} to ${b} in 24-hour time?`, `${hhmm(s[0])} to ${hhmm(s[1])}.`]
  ];
  const others = SHIFTS.filter((x) => x !== s).map((x) => `<a href="/hours-calculator/${shiftSlug(x)}/">${clock(x[0])} to ${clock(x[1])}</a>`).join(" ");
  return page({ path: `/hours-calculator/${slug}/`, crumbs: [["Home", "/"], ["Hours Calculator", "/hours-calculator/"]], crumb: `${a} to ${b}`, back: ["/hours-calculator/", "Hours calculator"],
    title: site.fitTitle(`${a} to ${b} Is How Many Hours? ${Hm(L)} (${dec(L - 30)} With a 30-Min Break)`, `${a} to ${b} Is How Many Hours? ${Hm(L)}`, `How Many Hours Is ${a} to ${b}?`),
    desc: `${a} to ${b} is ${hm(L)}. Less a 30-minute break it's ${hm(L - 30)} (${dec(L - 30)} hours), and ${dec((L - 30) * 5)} hours over a five-day week.`,
    h1: `${a} to ${b}: how many hours?`, sub: `${esc(a)} to ${esc(b)} is <strong>${esc(hm(L))}</strong>${night ? " (an overnight shift)" : ""}. Change the times or the break below.`, q,
    body: hoursTool(s[0], s[1], 0) + `    <main class="tool">
      <h2 class="tool-section-title">${esc(a)} to ${esc(b)} with breaks</h2>
${site.table(["Unpaid break", "Hours worked", "Decimal hours", "Five days a week"], rows, 460)}    </main>
`, moreTitle: "Other shifts", more: others });
}

// ---------------------------------------------------------------- days from today / ago / weeks from today

const DAY_COUNTS = [7, 10, 14, 15, 21, 28, 30, 31, 40, 45, 50, 60, 75, 90, 100, 120, 150, 180, 200, 270, 300, 365, 500, 1000];
const WEEK_COUNTS = [2, 3, 4, 6, 8, 10, 12, 13, 16, 20, 24, 26, 30, 36, 40, 52];
const KIND = {
  from: { base: "/days-from-today/", unit: "days", sign: 1, word: "from today", title: "Days From Today", counts: DAY_COUNTS },
  ago: { base: "/days-ago/", unit: "days", sign: -1, word: "ago", title: "Days Ago", counts: DAY_COUNTS },
  weeks: { base: "/weeks-from-today/", unit: "weeks", sign: 1, word: "from today", title: "Weeks From Today", counts: WEEK_COUNTS }
};
function dateTool(k, n) {
  const sel = (v, l) => `<option value="${v}"${(k.unit === v) ? " selected" : ""}>${l}</option>`;
  return `    <main class="tool" id="df-tool">
      <div class="field-row">
        <div class="field"><label for="df-n">How many</label><input type="number" id="df-n" value="${n}" min="0" step="1" inputmode="numeric"></div>
        <div class="field"><label for="df-unit">Of</label><select id="df-unit">${sel("days", "Days")}${sel("weeks", "Weeks")}<option value="months">Months</option><option value="years">Years</option></select></div>
      </div>
      <div class="field-row">
        <div class="field"><label for="df-dir">Direction</label><select id="df-dir"><option value="1"${k.sign > 0 ? " selected" : ""}>From (after)</option><option value="-1"${k.sign < 0 ? " selected" : ""}>Before (ago)</option></select></div>
        <div class="field"><label for="df-start">Starting from</label><input type="date" id="df-start"></div>
      </div>
      <div class="result-box" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="df-date">—</div>
          <div class="label" id="df-label">${esc(`${n} ${k.unit} ${k.word}`)}</div>
        </div>
        <p class="tool-hint" id="df-detail" style="text-align:center; margin-top:8px;">Worked out from today's date on your device.</p>
      </div>
    </main>
`;
}
function datePage(k, n) {
  const days = k.unit === "weeks" ? n * 7 : n;
  const what = `${n} ${k.unit} ${k.word}`, What = `${n} ${k.unit[0].toUpperCase() + k.unit.slice(1)} ${k.word === "ago" ? "Ago" : "From Today"}`;
  const table = MONTHS.map((m, i) => { const d = utc(YEAR, i, 1); return [`1 ${m} ${YEAR}`, long(addDays(d, k.sign * days))]; });
  const q = [
    [k.sign > 0 ? `What date is ${what}?` : `What date was ${what}?`, `The answer at the top is worked out live from today's date on your device. ${k.sign > 0 ? "Counting forward" : "Counting back"} ${days} days${k.unit === "weeks" ? ` (${n} weeks)` : ""} from today, with today as day 0.`],
    [`Does ${n} ${k.unit} ${k.word} count today?`, `No — today is day 0, so ${k.sign > 0 ? `1 day from today is tomorrow` : `1 day ago is yesterday`}. To count working days only, use the working days calculator.`],
    ...(k.unit === "days" && n % 7 === 0 ? [[`How many weeks is ${n} days?`, `${n / 7} weeks exactly, so ${what} falls on the same day of the week as today.`]] : k.unit === "days" ? [[`How many weeks is ${n} days?`, `${Math.floor(n / 7)} weeks and ${n % 7} day${n % 7 === 1 ? "" : "s"}${n >= 30 ? ` — about ${(n / 30.4375).toLocaleString("en-GB", { maximumFractionDigits: 1 })} months` : ""}.`]] : [[`How many days is ${n} weeks?`, `${days} days${n >= 4 ? ` — about ${(days / 30.4375).toLocaleString("en-GB", { maximumFractionDigits: 1 })} months` : ""}.`]])
  ];
  const others = k.counts.filter((x) => x !== n).map((x) => `<a href="${k.base}${x}/">${x} ${k.unit} ${k.word}</a>`).join(" ");
  const cross = k === KIND.from ? `<a href="/days-ago/${n}/">${n} days ago</a>` : k === KIND.ago ? `<a href="/days-from-today/${n}/">${n} days from today</a>` : "";
  return page({ path: `${k.base}${n}/`, crumbs: [["Home", "/"], [k.title, k.base]], crumb: what, back: [k.base, k.title],
    title: site.fitTitle(k.sign > 0 ? `What Date Is ${What}? — ${What} Calculator` : `What Date Was ${What}? — ${What} Calculator`, k.sign > 0 ? `What Date Is ${What}?` : `What Date Was ${What}?`),
    desc: `Find the date ${what}, worked out live from today's date — plus the date ${n} ${k.unit} ${k.sign > 0 ? "after" : "before"} the 1st of every month in ${YEAR}, and a calculator for any number of days, weeks or months.`,
    h1: k.sign > 0 ? `What date is ${what}?` : `What date was ${what}?`, sub: `${esc(n + " " + k.unit)} ${k.sign > 0 ? "after" : "before"} today, worked out from your device's date. Change the number or the starting date below.`, q,
    body: dateTool(k, n) + `    <main class="tool">
      <h2 class="tool-section-title">${esc(n + " " + k.unit)} ${k.sign > 0 ? "after" : "before"} the 1st of each month, ${YEAR}</h2>
${site.table(["Starting date", `${n} ${k.unit} ${k.sign > 0 ? "later" : "earlier"}`], table, 360)}      <p class="tool-hint" style="margin-top:12px;">${cross ? cross + ". " : ""}To count the days between two dates, use the <a href="/date-diff/">date difference calculator</a>.</p>
    </main>
`, moreTitle: `Other ${k.title.toLowerCase()}`, more: others });
}
function dateHub(k) {
  const n = k.unit === "weeks" ? 12 : 90;
  const q = [
    [k.sign > 0 ? `How do I work out the date ${n} ${k.unit} from today?` : `How do I work out the date ${n} days ago?`, `Count ${k.sign > 0 ? "forward" : "back"} from today, with today as day 0. The calculator does it from your device's date, and handles month lengths and leap years.`],
    ["Can I count months or years instead?", "Yes — pick months or years. Adding a month keeps the same day of the month where it exists; from 31 January, one month later is the last day of February."],
    ["What about working days?", "This counts every calendar day. The working days calculator counts weekdays less UK bank holidays."]
  ];
  const links = k.counts.map((x) => `<a href="${k.base}${x}/">${x} ${k.unit} ${k.word}</a>`).join(" ");
  const what = `${k.title.replace(/ /g, " ")}`;
  const siblings = Object.values(KIND).filter((x) => x !== k).map((x) => `<a href="${x.base}">${x.title} calculator</a>`).join(" ") + ` <a href="/date-diff/">Date difference calculator</a> <a href="/working-days/">Working days calculator</a>`;
  return page({ path: k.base, app: `${what} Calculator`, crumbs: [["Home", "/"]], crumb: what, back: ["/", "All calculators"], related: k === KIND.from, moreTitle: "More date calculators", more: siblings,
    title: `${what} Calculator — ${k.sign > 0 ? "What Date Is" : "What Date Was"} ${n} ${k.unit[0].toUpperCase() + k.unit.slice(1)} ${k.sign > 0 ? "From Today" : "Ago"}?`,
    desc: `Find the date any number of ${k.unit} ${k.word} — ${n} ${k.unit} ${k.word}, ${k.counts[k.counts.length - 1]} ${k.unit} ${k.word} or any other — or before or after any date. Worked out live from today's date.`,
    h1: `${what} calculator`, sub: `The date any number of days, weeks, months or years ${k.sign > 0 ? "from" : "before"} today — or from any date you choose.`, q,
    body: dateTool(k, n) + `    <main class="tool">
      <h2 class="tool-section-title">Common searches</h2>
      <p class="salary-links">${links}</p>
${k === KIND.from ? Object.values(KIND).filter((x) => x !== k).map((x) => `      <h2 class="tool-section-title" style="margin-top:18px;">${x.title}</h2>
      <p class="salary-links"><a href="${x.base}">${x.title} calculator</a> ${x.counts.map((n) => `<a href="${x.base}${n}/">${n} ${x.unit} ${x.word}</a>`).join(" ")}</p>
`).join("") : ""}    </main>
` });
}

// ---------------------------------------------------------------- week numbers

const WEEK_YEARS = [YEAR, YEAR + 1, YEAR + 2];
function weekTable(y) {
  return site.table(["Week", "Starts (Monday)", "Ends (Sunday)"], weeksOf(y).map((w) => [`Week ${w.week}`, short(w.start), short(w.end)]), 380);
}
function weekTool() {
  const now = isoWeek(TODAY);
  return `    <main class="tool" id="wk-tool">
      <div class="result-box" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="wk-now">Week ${now.week}</div>
          <div class="label" id="wk-now-label">this week, ${now.year} (ISO 8601)</div>
        </div>
      </div>
      <div class="field" style="max-width:260px; margin-top:14px;"><label for="wk-date">Week number of a date</label><input type="date" id="wk-date" value="${iso(TODAY)}"></div>
      <div class="result-box" aria-live="polite">
        <div class="result-grid">
${row("Week number", "wk-num", `Week ${now.week} of ${now.year}`, "highlight")}
${row("That week runs", "wk-range", "—")}
${row("Day of the week", "wk-day", DAYS[TODAY.getUTCDay()])}
        </div>
      </div>
    </main>
`;
}
const weekQ = (y) => {
  const w = weeksOf(y);
  return [
    [`How many weeks are there in ${y}?`, `${w.length} ISO weeks. Week 1 starts on Monday ${short(w[0].start)} and week ${w.length} ends on Sunday ${short(w[w.length - 1].end)}.`],
    ["How are week numbers counted?", "By the ISO 8601 standard used across Europe and in most business software: weeks run Monday to Sunday, and week 1 is the week containing the year's first Thursday (the week with 4 January in it). So a few days at the start or end of January can belong to the previous or next year's weeks."],
    ["Why does my calendar show a different week number?", "Some calendars and spreadsheets count week 1 as the week containing 1 January, starting on Sunday — Excel's WEEKNUM does this by default, while ISOWEEKNUM gives the ISO number. The two can differ by one."]
  ];
};
function weekHub() {
  const now = isoWeek(TODAY);
  const q = [["What week number is it?", `The box at the top shows this week's ISO week number, worked out live from your device's date. When this page was last built it was week ${now.week} of ${now.year}.`]].concat(weekQ(YEAR));
  return page({ path: "/week-number/", app: "Week Number Calculator", crumbs: [["Home", "/"]], crumb: "Week Number", back: ["/", "All calculators"], related: true,
    title: `What Week Is It? — Week Number Calculator & ${YEAR} Week Numbers`,
    desc: `This week's ISO week number, worked out live, the week number of any date, and every week of ${YEAR} with its start and end dates.`,
    h1: "What week number is it?", sub: "This week's number, the week of any date, and the dates of every week in the year (ISO 8601, Monday to Sunday).", q,
    body: weekTool() + `    <main class="tool">
      <h2 class="tool-section-title">Week numbers ${YEAR}</h2>
${weekTable(YEAR)}      <p class="salary-links" style="margin-top:12px;">${WEEK_YEARS.map((y) => `<a href="/week-number/${y}/">Week numbers ${y}</a>`).join(" ")} <a href="/tax-week-calendar/">UK tax weeks (payroll)</a></p>
    </main>
` });
}
function weekYear(y) {
  const w = weeksOf(y);
  return page({ path: `/week-number/${y}/`, crumbs: [["Home", "/"], ["Week Number", "/week-number/"]], crumb: `Week numbers ${y}`, back: ["/week-number/", "What week is it?"],
    title: `Week Numbers ${y} — All ${w.length} Weeks With Dates`,
    desc: `Every ISO week number in ${y} with its Monday start and Sunday end: week 1 starts ${short(w[0].start)} and week ${w.length} ends ${short(w[w.length - 1].end)}.`,
    h1: `Week numbers ${y}`, sub: `All ${w.length} weeks of ${y}, Monday to Sunday (ISO 8601).`, q: weekQ(y),
    body: weekTool() + `    <main class="tool">
      <h2 class="tool-section-title">Weeks of ${y}</h2>
${weekTable(y)}    </main>
`, moreTitle: "Other years", more: WEEK_YEARS.filter((x) => x !== y).map((x) => `<a href="/week-number/${x}/">Week numbers ${x}</a>`).join(" ") + ` <a href="/week-number/">This week's number</a>` });
}

// ---------------------------------------------------------------- day of the week

function dayOfWeek() {
  const ex = [[1969, 6, 20, "the Moon landing"], [2000, 0, 1, "1 January 2000"], [YEAR, 11, 25, `Christmas Day ${YEAR}`]];
  const q = [
    ["What day of the week was I born?", "Enter your date of birth: the calculator gives the day, and the age calculator also shows it with your exact age."],
    ["How does it work out the day?", "From the calendar itself — it counts the days from a date whose weekday is known, using the Gregorian calendar (the one in use in Britain since 1752)."],
    ...ex.map(([y, m, d, label]) => [`What day was ${label}?`, `${long(utc(y, m, d))}.`])
  ];
  return page({ path: "/day-of-the-week/", app: "Day of the Week Calculator", crumbs: [["Home", "/"]], crumb: "Day of the Week", back: ["/", "All calculators"], related: true,
    title: "Day of the Week Calculator — What Day Was or Will Any Date Be?",
    desc: "Find the day of the week for any date, past or future — the day you were born, a historic date or a date years ahead — with its week number and day of the year.",
    h1: "Day of the week calculator", sub: "What day of the week any date falls on — with its week number and day of the year.", q,
    body: `    <main class="tool" id="dw-tool">
      <div class="field" style="max-width:260px;"><label for="dw-date">Date</label><input type="date" id="dw-date" value="${iso(TODAY)}"></div>
      <div class="result-box" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="dw-day">${DAYS[TODAY.getUTCDay()]}</div>
          <div class="label" id="dw-label">${esc(long(TODAY).split(" ").slice(1).join(" "))}</div>
        </div>
        <div class="result-grid">
${row("ISO week number", "dw-week", `Week ${isoWeek(TODAY).week}`)}
${row("Day of the year", "dw-doy", "—")}
${row("Days from today", "dw-from", "Today")}
        </div>
      </div>
    </main>
` });
}

// ---------------------------------------------------------------- write

const urls = [];
const put = (rel, html, pri) => { site.write(rel, html); if (pri) urls.push([`/${rel}/`, pri]); };
put("hours-calculator", hoursHub());
SHIFTS.forEach((s) => put(`hours-calculator/${shiftSlug(s)}`, shiftPage(s), "0.5"));
site.prune("hours-calculator", /^\d+(am|pm)-to-\d+(am|pm)$/);
Object.values(KIND).forEach((k) => {
  const rel = k.base.replace(/^\/|\/$/g, "");
  put(rel, dateHub(k));
  k.counts.forEach((n) => put(`${rel}/${n}`, datePage(k, n), "0.5"));
  site.prune(rel, /^\d+$/);
});
put("week-number", weekHub());
WEEK_YEARS.forEach((y) => put(`week-number/${y}`, weekYear(y), "0.5"));
site.prune("week-number", /^\d{4}$/);
put("day-of-the-week", dayOfWeek());
site.sitemapBlock("time and date pages", "tools/build-time-pages.js", urls);
console.log(`built the time and date tools and ${urls.length} pages`);
