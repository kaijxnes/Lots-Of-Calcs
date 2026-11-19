#!/usr/bin/env node
/* Christmas savings calculator and a page per budget:

       /christmas-savings-calculator/         any budget, dates and payday
       /christmas-savings-calculator/500/     £500 by 1 December: £X a week from next month

       node tools/build-christmas-savings-pages.js

   Pages save from the 1st of next month to 1 December of the coming
   Christmas (this year's while it's at least 8 weeks off), so they're
   rebuilt monthly. Maths: christmas-savings.js, the calculator's own code. */
const site = require("./lib/site.js");
const related = require("./related.js");
const C = require("../christmas-savings.js");
const { SITE } = site;

const BASE = "/christmas-savings-calculator/";
const BUDGETS = [200, 300, 400, 500, 600, 750, 800, 1000, 1200, 1500, 2000, 2500, 3000];
const now = new Date();
const XMAS = C.target(now), END = `${XMAS}-12-01`;
const firstOf = (offset) => { const t = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1 + offset, 1, 12)); return t.toISOString().slice(0, 10); };
const START = firstOf(0);
const g = (v) => "£" + v.toLocaleString("en-GB");
const M = (v) => C.money(v);
const monthLabel = (iso) => C.MONTHS[Number(iso.slice(5, 7)) - 1] + " " + iso.slice(0, 4);

function toolHtml(budget, s, e) {
  const r = C.plan(budget, 0, s || START, e || END, 28);
  return `    <main class="tool" id="xs-tool">
      <div class="field-row">
        <div class="field"><label for="xs-budget">Christmas budget</label><input type="number" id="xs-budget" value="${budget}" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="xs-saved">Already saved</label><input type="number" id="xs-saved" value="0" min="0" step="any" inputmode="decimal"></div>
      </div>
      <div class="field-row">
        <div class="field"><label for="xs-start">Start saving</label><input type="date" id="xs-start" value="${s}"></div>
        <div class="field"><label for="xs-end">Have it by</label><input type="date" id="xs-end" value="${e}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label for="xs-payday">Payday (day of the month)</label><input type="number" id="xs-payday" value="28" min="1" max="31" step="1" inputmode="numeric"></div>
        <div class="field"><label for="xs-cur">Currency</label><select id="xs-cur"><option value="£" selected>£</option><option value="$">$</option><option value="€">€</option></select></div>
      </div>
      <p class="tool-hint" id="xs-error" role="alert" style="color: var(--bad); display: none;"></p>
      <div class="result-box" aria-live="polite">
        <div class="result-hero"><div class="value" id="xs-week">${M(r.perWeek)}</div><div class="label" id="xs-week-label">a week for ${r.weeks} weeks</div></div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row highlight"><span class="r-label">Or each payday</span><span class="r-value" id="xs-month">${M(r.perMonth)} on each of ${r.paydays.length} paydays</span></div>
          <div class="result-row"><span class="r-label">Or every day</span><span class="r-value" id="xs-day">${M(r.perDay)} a day for ${r.days} days</span></div>
          <div class="result-row"><span class="r-label">Still to save</span><span class="r-value" id="xs-need">${M(r.need)}</span></div>
          <div class="result-row"><span class="r-label">Ready by</span><span class="r-value" id="xs-by">${C.nice(e || END)}</span></div>
        </div>
      </div>
      <p class="tool-hint" style="margin-top:12px;">Weekly deposits start on the start date and repeat every 7 days up to the date you want it by. 1 December leaves time to shop; change it to Christmas Eve if you prefer.</p>
    </main>
`;
}

function later(budget) {
  return [0, 1, 3, 6, 9].map((k) => firstOf(k)).filter((s) => s < END && C.weekly(s, END) >= 4).map((s) => {
    const r = C.plan(budget, 0, s, END, 28);
    return [monthLabel(s), String(r.weeks), M(r.perWeek), r.paydays.length ? M(r.perMonth) : "—"];
  });
}

function calculatorPage() {
  const url = SITE + BASE, r = C.plan(500, 0, START, END, 28);
  const title = `Christmas Savings Calculator — How Much to Save a Week for Christmas ${XMAS}`;
  const desc = `Work out how much to save each week, payday or day to have your Christmas budget ready by 1 December ${XMAS}. Starting in ${monthLabel(START)}, £500 is ${M(r.perWeek)} a week.`;
  const q = [
    [`How much do I need to save a week for Christmas ${XMAS}?`, `Divide your budget by the weeks left. Starting on ${C.nice(START)}, there are ${r.weeks} weekly deposits before 1 December ${XMAS}, so £500 is ${M(r.perWeek)} a week and £1,000 is ${M(r.perWeek * 2)}.`],
    ["Is it better to save weekly or monthly?", "Whichever matches how you're paid. A standing order the day after payday is the easiest to stick to, because the money moves before it can be spent."],
    ["What if I start late?", "The same budget is shared over fewer weeks, so each one is bigger — the table on each budget page shows how much. Starting even a month earlier makes a noticeable difference."],
    ["Where should I keep Christmas savings?", "A separate easy-access savings account or pot, so it isn't spent by accident and you can take it out in December without a penalty."]
  ];
  const ld = [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], ["Christmas Savings Calculator", url]]),
    { "@context": "https://schema.org", "@type": "WebApplication", name: "Christmas Savings Calculator", url, applicationCategory: "FinanceApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } }, site.faqLd(q)];
  const rows = BUDGETS.map((b) => { const x = C.plan(b, 0, START, END, 28); return [`<a href="${BASE}${b}/">${g(b)}</a>`, M(x.perWeek), M(x.perMonth), M(x.perDay)]; });
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="/">← All calculators</a>
      <h1 class="page-title">Christmas savings calculator</h1>
      <p class="page-subtitle">How much to put aside each week, payday or day to have your Christmas budget ready in time.</p>
    </header>

${toolHtml(500, "", "")}
    <main class="tool">
      <p class="tool-section-title">Starting in ${monthLabel(START)}, for 1 December ${XMAS}</p>
${site.table(["Budget", "A week", "Each payday", "A day"], rows, 380)}      <p class="tool-hint" style="margin-top:12px;">${r.weeks} weekly deposits from ${C.nice(START)} and ${r.paydays.length} paydays on the 28th. Each budget has its own page with the cost of starting later.</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">Making it easy</p>
      <p class="about-text"><strong>Set a budget first.</strong> Add up presents, food and drink, travel, cards and wrapping, and going out — then save for that figure rather than for "as much as possible".</p>
      <p class="about-text"><strong>Automate it.</strong> A weekly or payday standing order into a separate pot does the saving for you. If smaller, rising steps suit you better, the <a href="/52-week-savings-challenge/">52-week savings challenge</a> started in January reaches £1,378 by Christmas Eve.</p>
      <p class="about-text"><strong>Keep the rest of the year in view.</strong> The <a href="/50-30-20-budget/">50/30/20 budget calculator</a> shows how Christmas fits in your monthly pay, and an <a href="/emergency-fund-calculator/">emergency fund</a> stops January's bills going on a credit card.</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">Frequently asked questions</p>
${site.faqHtml(q)}    </main>

${related.block(BASE)}
${site.FOOTER}
  </div>
  <script src="/christmas-savings.js"></script>
</body>
</html>
`;
}

function budgetPage(b) {
  const url = SITE + `${BASE}${b}/`, r = C.plan(b, 0, START, END, 28);
  const title = site.fitTitle(`Save ${g(b)} for Christmas ${XMAS} — ${M(r.perWeek)} a Week`, `${g(b)} for Christmas ${XMAS} — ${M(r.perWeek)} a Week`);
  const desc = `To have ${g(b)} ready by 1 December ${XMAS}, save ${M(r.perWeek)} a week from ${C.nice(START)} (${r.weeks} weeks), or ${M(r.perMonth)} on each of ${r.paydays.length} paydays. What it costs to start later, too.`;
  const lr = later(b);
  const q = [
    [`How much a week to save ${g(b)} for Christmas ${XMAS}?`, `${M(r.perWeek)} a week for ${r.weeks} weeks, starting ${C.nice(START)}, has ${g(b)} ready by 1 December ${XMAS}.`],
    [`How much a month to save ${g(b)} for Christmas?`, `${M(r.perMonth)} on each of ${r.paydays.length} paydays (the 28th of each month) from ${monthLabel(START)} to November ${XMAS}.`],
    ["What if I start later?", lr.length > 1 ? `Starting in ${lr[lr.length - 1][0]} instead, it's ${lr[lr.length - 1][2]} a week.` : "With this little time left, every week's delay makes each deposit noticeably bigger."]
  ];
  const ld = [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], ["Christmas Savings Calculator", SITE + BASE], [`${g(b)} for Christmas`, url]]), site.faqLd(q)];
  const others = BUDGETS.map((x) => x === b ? `<strong>${g(x)}</strong>` : `<a href="${BASE}${x}/">${g(x)}</a>`).join(" ");
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="${BASE}">← Christmas savings calculator</a>
      <h1 class="page-title">Saving ${g(b)} for Christmas ${XMAS}</h1>
      <p class="page-subtitle">Save <strong>${M(r.perWeek)} a week</strong> from ${C.nice(START)} and you'll have ${g(b)} ready by 1 December ${XMAS}.</p>
    </header>

${toolHtml(b, START, END)}
    <main class="tool">
      <p class="tool-section-title">If you start later</p>
${site.table(["Start", "Weeks", "A week", "Each payday"], lr, 340)}      <p class="tool-hint" style="margin-top:12px;">For ${g(b)} by 1 December ${XMAS}, paydays on the 28th.</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">Frequently asked questions</p>
${site.faqHtml(q)}    </main>

    <div class="hub-group-title" style="margin-top:28px;">Other budgets</div>
    <p class="salary-links">${others}</p>

${site.FOOTER}
  </div>
  <script src="/christmas-savings.js"></script>
</body>
</html>
`;
}

/* Hand checks: 1 Jan to 1 Dec 2027 has 48 weekly deposits (1 Jan + 47 × 7 = 26 Nov) and 11 paydays on the 28th */
{
  const r = C.plan(480, 0, "2027-01-01", "2027-12-01", 28);
  if (r.weeks !== 48 || r.perWeek !== 10 || r.paydays.length !== 11 || C.target(new Date(2026, 10, 19)) !== 2027 || C.target(new Date(2026, 8, 1)) !== 2026) throw new Error("christmas check");
}

const urls = [];
site.write("christmas-savings-calculator", calculatorPage());
BUDGETS.forEach((b) => { site.write(`christmas-savings-calculator/${b}`, budgetPage(b)); urls.push([`${BASE}${b}/`, "0.5"]); });
site.prune("christmas-savings-calculator", /^\d+$/);
site.sitemapBlock("christmas savings pages", "tools/build-christmas-savings-pages.js", urls);
console.log(`built ${BASE} and ${BUDGETS.length} budget pages, ${C.nice(START)} to ${C.nice(END)}`);
