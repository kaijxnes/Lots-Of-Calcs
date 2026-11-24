#!/usr/bin/env node
/* The 52-week savings challenge calculator and a page per popular version:

       /52-week-savings-challenge/            calculator, tick-off chart
       /52-week-savings-challenge/2-pound/    £2 a week rising: £2,756

       node tools/build-savings-challenge-pages.js

   Charts are dated for the coming challenge year (from September on, the
   next January), so this runs in the monthly rebuild. The maths is
   savings-challenge.js, the calculator's own code. */
const site = require("./lib/site.js");
const related = require("./related.js");
const S = require("../savings-challenge.js");
const { SITE } = site;

const BASE = "/52-week-savings-challenge/";
const START = S.upcomingStart(new Date());
const YEAR = START.slice(0, 4);
const VARIANTS = [
  { slug: "50p", mode: "classic", amount: 0.5, name: "50p 52-week savings challenge" },
  { slug: "1-pound", mode: "classic", amount: 1, name: "£1 52-week savings challenge" },
  { slug: "2-pound", mode: "classic", amount: 2, name: "£2 52-week savings challenge" },
  { slug: "5-pound", mode: "classic", amount: 5, name: "£5 52-week savings challenge" },
  { slug: "10-pound", mode: "classic", amount: 10, name: "£10 52-week savings challenge" },
  { slug: "reverse", mode: "reverse", amount: 1, name: "Reverse 52-week savings challenge" },
  { slug: "reverse-2-pound", mode: "reverse", amount: 2, name: "Reverse £2 52-week savings challenge" },
  { slug: "365-day-1p", mode: "daily", amount: 0.01, name: "1p 365-day savings challenge" },
  { slug: "365-day-2p", mode: "daily", amount: 0.02, name: "2p 365-day savings challenge" },
  { slug: "100-envelope-challenge", mode: "envelope", amount: 1, name: "100 envelope savings challenge" },
  { slug: "100-envelope-challenge-50p", mode: "envelope", amount: 0.5, name: "50p 100 envelope savings challenge" }
];
const M = (v) => S.money(v, "£");
const tc = (t) => t.replace(/(^|[\s-])([a-z])/g, (m, a, b) => a + b.toUpperCase());
const total = (v) => S.r2(v.amount * S.multiplier(v.mode));
const link = (v) => `${BASE}?mode=${v.mode}&amp;amount=${v.amount}`;

function chartTable(rows, unit) {
  return site.table([unit, "Date", "Save", "Total so far"], rows.map((r) => [String(r.label), S.niceDate(r.date), M(r.deposit), M(r.total)]), 340);
}
function monthTable(rows) {
  return site.table(["Month", "Deposits", "Saved that month"], S.byMonth(rows).map((x) => [S.monthName(x.month), String(x.n), M(x.total)]), 320);
}
function december(rows) { return S.byMonth(rows).filter((x) => x.month.endsWith("-12")).reduce((a, x) => a + x.total, 0); }

/* ---------------------------------------------------------------- calculator */
function calculatorPage() {
  const url = SITE + BASE;
  const rows = S.plan("classic", 1, START), rev = S.plan("reverse", 1, START);
  const title = "52 Week Savings Challenge Calculator — Chart, Totals & Tracker";
  const desc = `Save £1 in week 1, £2 in week 2 and so on, and you'll have £1,378 after 52 weeks. Work out any version, print the chart and tick off each week as you go.`;
  const versions = VARIANTS.map((v) => {
    const r = S.plan(v.mode, v.amount, START), first = r[0].deposit, last = r[r.length - 1].deposit;
    return [`<a href="${BASE}${v.slug}/">${v.name}</a>`, M(first), M(last), `<strong>${M(total(v))}</strong>`];
  });
  const dec1 = december(rows), decR = december(rev);
  const q = [
    ["How much do you save with the 52-week challenge?", "£1,378 if you start at £1 and add £1 each week: £1 + £2 + … + £52. Starting at £2 doubles it to £2,756, and £5 a week rising gives £6,890. The total is always the starting amount × 1,378."],
    ["What is the reverse 52-week challenge?", `The same deposits in the opposite order: £52 in week 1 down to £1 in week 52. You still save £1,378, but the big amounts come in January rather than December, when money is tightest — December needs ${M(decR)} instead of ${M(dec1)}.`],
    ["How much is the 1p a day challenge?", "£667.95. You save 1p on day 1, 2p on day 2 and so on to £3.65 on day 365. The 2p version saves £1,335.90."],
    ["What is the 100 envelope challenge?", "100 envelopes numbered 1 to 100. Each day you pick one and put in that many pounds, so after 100 days you've saved £5,050. The calculator shuffles the order for you and dates each envelope; the 50p version saves £2,525."],
    ["How do I save £1,000 with the 52-week challenge?", "Start at 73p and add 73p each week: 73p × 1,378 = £1,005.94. Put a target into the calculator's 'Aim for a total' box and it works out the amount for any total."],
    ["Where should I keep the money?", "Somewhere separate that you won't dip into but can reach if you need to, such as an easy-access savings account or a cash ISA. The interest is a bonus; add the rate to see roughly what it adds."],
    ["What if I miss a week?", "Catch up the next week or spread it over the following few. The chart keeps a running total, so you can always see where you should be."]
  ];
  const ld = [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], ["52 Week Savings Challenge", url]]),
    { "@context": "https://schema.org", "@type": "WebApplication", name: "52 Week Savings Challenge Calculator", url, applicationCategory: "FinanceApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } }, site.faqLd(q)];
  const staticRows = rows.map((r) => `<tr><td>${r.i}</td><td>${S.niceDate(r.date)}</td><td>${M(r.deposit)}</td><td>${M(r.total)}</td><td><input type="checkbox" aria-label="Saved week ${r.i}"></td></tr>`).join("\n");
  const staticMonths = S.byMonth(rows).map((x) => `<tr><td>${S.monthName(x.month)}</td><td>${x.n}</td><td>${M(x.total)}</td></tr>`).join("\n");
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link no-print" href="/">← All calculators</a>
      <h1 class="page-title">52 week savings challenge</h1>
      <p class="page-subtitle">Save a little more each week and finish the year with £1,378 — or pick your own amount, start date and version.</p>
    </header>

    <main class="tool" id="sc-tool">
      <div class="no-print">
      <div class="field-row">
        <div class="field"><label for="sc-mode">Challenge</label><select id="sc-mode"><option value="classic" selected>Classic: a bit more each week</option><option value="reverse">Reverse: biggest week first</option><option value="daily">365 days: a bit more each day</option><option value="envelope">100 envelopes: one a day, any order</option></select></div>
        <div class="field"><label for="sc-amount">Amount (first deposit and each increase)</label><input type="number" id="sc-amount" value="1" min="0.01" step="any" inputmode="decimal"></div>
      </div>
      <div class="field-row">
        <div class="field"><label for="sc-start">Start date</label><input type="date" id="sc-start" value=""></div>
        <div class="field"><label for="sc-cur">Currency</label><select id="sc-cur"><option value="£" selected>£</option><option value="$">$</option><option value="€">€</option></select></div>
      </div>
      <div class="field-row">
        <div class="field"><label for="sc-target">Aim for a total (optional)</label><input type="number" id="sc-target" placeholder="e.g. 1000" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="sc-aer">Savings rate, AER % (optional)</label><input type="number" id="sc-aer" placeholder="e.g. 4" min="0" step="any" inputmode="decimal"></div>
      </div>
      <p class="tool-hint" id="sc-error" role="alert" style="color: var(--bad); display: none;"></p>
      </div>
      <div class="result-box" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="sc-total">£1,378</div>
          <div class="label" id="sc-total-label">saved by ${S.niceDate(rows[51].date)}</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row"><span class="r-label">Biggest deposit</span><span class="r-value" id="sc-biggest">£52 (week 52)</span></div>
          <div class="result-row"><span class="r-label">On average</span><span class="r-value" id="sc-average">${M(S.r2(1378 / 12))} a month</span></div>
          <div class="result-row"><span class="r-label">Interest</span><span class="r-value" id="sc-interest">Add a savings rate to see it</span></div>
          <div class="result-row highlight"><span class="r-label">Total with interest</span><span class="r-value" id="sc-with-interest">£1,378</span></div>
        </div>
      </div>

      <h2 class="tool-section-title" style="margin-top:20px;">Your chart</h2>
      <p class="tool-hint" id="sc-progress">Tick each week as you save it. Your ticks stay in this browser.</p>
      <div class="no-print" style="display:flex; gap:8px; flex-wrap:wrap; margin:8px 0 12px;">
        <button class="btn btn-ghost" id="sc-print" type="button"><svg class="ico" aria-hidden="true"><use href="/icons.svg#printer"></use></svg> Print the chart</button>
        <button class="btn btn-ghost" id="sc-clear" type="button">Clear ticks</button>
      </div>
      <div class="table-scroll sc-chart">
        <div style="min-width:340px;">
          <table class="out-table">
            <thead><tr><th id="sc-unit-head">Week</th><th>Date</th><th>Save</th><th>Total so far</th><th>Done</th></tr></thead>
            <tbody id="sc-rows">
${staticRows}
            </tbody>
          </table>
        </div>
      </div>
      <h2 class="tool-section-title" style="margin-top:20px;">Month by month</h2>
      <div class="table-scroll">
        <div style="min-width:300px;">
          <table class="out-table">
            <thead><tr><th>Month</th><th>Deposits</th><th>Saved that month</th></tr></thead>
            <tbody id="sc-months">
${staticMonths}
            </tbody>
          </table>
        </div>
      </div>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">Which version?</h2>
${site.table(["Challenge", "First deposit", "Last deposit", "Total"], versions, 420)}      <p class="tool-hint" style="margin-top:12px;">Each has its full dated chart for ${YEAR}, starting 1 January. Any start date works in the calculator.</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">How it works</h2>
      <p class="about-text">In week 1 you save the starting amount, in week 2 twice it, and so on up to 52 times it in week 52. Add those up and you get <strong>1,378 × the starting amount</strong>: £1,378 from £1, £2,756 from £2, £689 from 50p.</p>
      <p class="about-text"><strong>The catch is the end of the year.</strong> Starting on 1 January, the classic version asks for ${M(dec1)} in December, just when Christmas costs land. The reverse version front-loads it, so December needs only ${M(decR)}; it's the same £1,378 either way.</p>
      <p class="about-text"><strong>The 365-day version</strong> goes up a little every day instead: 1p on day 1, 2p on day 2 and £3.65 on day 365, for £667.95. Smaller steps, but you have to remember daily.</p>
      <p class="about-text"><strong>Making it stick:</strong> set up a weekly standing order into a separate savings account, print the chart for the fridge, or tick off each week here and the page remembers your progress. If you'd rather save the same amount every week, the <a href="/savings-goal/">savings goal calculator</a> works out what you need, and the <a href="/compound-interest/">compound interest calculator</a> shows what it grows to.</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}    </main>

${related.block(BASE)}
${site.FOOTER}
  </div>
  <script src="/savings-challenge.js"></script>
</body>
</html>
`;
}

/* ---------------------------------------------------------------- versions */
function variantPage(v, i) {
  const url = SITE + `${BASE}${v.slug}/`;
  const rows = S.plan(v.mode, v.amount, START), m = S.MODES[v.mode], t = total(v);
  const first = rows[0].deposit, last = rows[rows.length - 1].deposit, dec = december(rows);
  const daily = v.mode === "daily", env = v.mode === "envelope";
  const lastDate = S.niceDate(rows[rows.length - 1].date);
  const title = site.fitTitle(`${tc(v.name)} — Save ${M(t)} (${YEAR} Chart)`, `${tc(v.name)} — ${M(t)}`);
  const how = env
    ? `Fill 100 envelopes, one a day in any order, with ${M(v.amount)} to ${M(v.amount * 100)} — envelope n gets ${v.amount === 1 ? "£n" : M(v.amount) + " × n"}`
    : daily
    ? `Save ${M(first)} on day 1, ${M(rows[1].deposit)} on day 2 and so on up to ${M(last)} on day 365`
    : v.mode === "reverse"
      ? `Save ${M(first)} in week 1, ${M(rows[1].deposit)} in week 2 and so on down to ${M(last)} in week 52`
      : `Save ${M(first)} in week 1, ${M(rows[1].deposit)} in week 2 and so on up to ${M(last)} in week 52`;
  const desc = `${how}, and you'll have ${M(t)}. The full dated chart for ${YEAR}, month-by-month totals and a tracker to tick off each ${m.unit.toLowerCase()}.`;
  const q = [
    [`How much does the ${v.name} save?`, `${M(t)}: ${M(v.amount)} × ${S.multiplier(v.mode).toLocaleString("en-GB")}. ${how}.`],
    env ? ["How long does it take?", `100 days at one envelope a day: starting on 1 January ${YEAR}, the last goes in on ${lastDate}. Doing two a week instead takes a year — any pace works, as long as every envelope gets filled.`]
      : [`How much do I need in December?`, `${M(dec)} if you start on 1 January ${YEAR}${v.mode === "classic" ? ", the heaviest month; the reverse version puts the big deposits in January instead" : ""}.`],
    ["Can I start on a different date?", `Yes. Open it in the <a href="${link(v)}">savings challenge calculator</a>, set your start date and tick off each ${m.unit.toLowerCase()} as you go; your progress is saved in your browser.`]
  ];
  const ld = [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], ["52 Week Savings Challenge", SITE + BASE], [v.name, url]]), site.faqLd(q.map(([a, b]) => [a, b.replace(/<[^>]+>/g, "")]))];
  const others = VARIANTS.filter((x) => x !== v).map((x) => `<a href="${BASE}${x.slug}/">${x.name} (${M(total(x))})</a>`).join(" ");
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link no-print" href="${BASE}">← Savings challenge calculator</a>
      <h1 class="page-title">${v.name}</h1>
      <p class="page-subtitle">${how}: <strong>${M(t)}</strong> by ${S.niceDate(rows[rows.length - 1].date)}.</p>
    </header>

    <main class="tool">
      <div class="result-box">
        <div class="result-hero"><div class="value">${M(t)}</div><div class="label">saved over ${env ? "100 days" : daily ? "365 days" : "52 weeks"}</div></div>
        <hr class="divider">
        <div class="result-grid">
${env ? `          <div class="result-row"><span class="r-label">Smallest and biggest envelope</span><span class="r-value">${M(v.amount)} and ${M(v.amount * 100)}</span></div>
          <div class="result-row"><span class="r-label">Last envelope in</span><span class="r-value">${lastDate}</span></div>
` : `          <div class="result-row"><span class="r-label">First ${m.unit.toLowerCase()}</span><span class="r-value">${M(first)}</span></div>
          <div class="result-row"><span class="r-label">Last ${m.unit.toLowerCase()}</span><span class="r-value">${M(last)}</span></div>
          <div class="result-row"><span class="r-label">December ${YEAR}</span><span class="r-value">${M(dec)}</span></div>
`}
          <div class="result-row highlight"><span class="r-label">Total</span><span class="r-value">${M(t)}</span></div>
        </div>
      </div>
      <p class="tool-hint no-print" style="margin-top:12px;"><a href="${link(v)}">Open this in the calculator</a> to change the start date, add interest, and tick off each ${m.unit.toLowerCase()} as you save.</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">Month by month</h2>
${monthTable(rows)}    </main>

    <main class="tool">
      <h2 class="tool-section-title">The full chart, starting 1 January ${YEAR}</h2>
      <div class="sc-chart">
${chartTable(rows, m.unit)}      </div>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${q.map(([a, b]) => `      <h3 class="faq-q">${a}</h3>\n      <p class="about-text">${b}</p>\n`).join("")}    </main>

    <div class="hub-group-title no-print" style="margin-top:28px;">Other versions</div>
    <p class="salary-links no-print">${others}</p>

${site.FOOTER}
  </div>
</body>
</html>
`;
}

/* Hand checks: £1 rising for 52 weeks = £1,378; 1p a day for 365 days = £667.95; reverse matches */
if (total(VARIANTS[9]) !== 5050 || S.plan("envelope", 1, START)[99].total !== 5050 || new Set(S.plan("envelope", 1, START).map((r) => r.label)).size !== 100 || total(VARIANTS[1]) !== 1378 || total(VARIANTS[7]) !== 667.95 || S.plan("reverse", 1, START)[51].total !== 1378 || S.plan("daily", 0.01, START)[364].total !== 667.95) throw new Error("challenge check");

const urls = [];
site.write("52-week-savings-challenge", calculatorPage());
VARIANTS.forEach((v, i) => { site.write(`52-week-savings-challenge/${v.slug}`, variantPage(v, i)); urls.push([`${BASE}${v.slug}/`, "0.6"]); });
site.prune("52-week-savings-challenge", /^[a-z0-9-]+$/);
site.sitemapBlock("savings challenge pages", "tools/build-savings-challenge-pages.js", urls);
console.log(`built ${BASE} and ${VARIANTS.length} versions for ${YEAR}`);
