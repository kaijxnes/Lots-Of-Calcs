#!/usr/bin/env node
/* The minimum wage checker:

       /minimum-wage-calculator/

       node tools/build-minimum-wage-pages.js

   National Minimum Wage and National Living Wage rates by age and for
   apprentices, quoted from GOV.UK in data/uk/minimum-wage.json. The page
   checks pay against the rates in force on the visitor's date (and the next
   published set), with the same functions (minimum-wage.js); the text is
   written for the rates in force on the build date. The build stops if the
   stored rates no longer match GOV.UK's quoted table. Runs in the monthly
   rebuild. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const related = require("./related.js");
const MW = require("../minimum-wage.js");
const { esc, SITE } = site;

const R = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/uk/minimum-wage.json"), "utf8"));
const m2 = (v) => "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const g = (v) => (Number.isInteger(v) ? "£" + v : m2(v));
R.rates.forEach((s) => {
  const row = `${s.label} ${[s.adult, s.age18to20, s.under18, s.apprentice].map(g).join(" ")}`;
  if (!R.rules.rates.quote.includes(row)) throw new Error(`minimum wage: the ${s.label} rates no longer match GOV.UK's quoted table (${row})`);
});
const cur = MW.setOn(R, site.TODAY), next = MW.nextAfter(R, site.TODAY);
const ex = { age: 25, hourly: 13 }; ex.c = MW.check(cur, ex.age, false, false, ex.hourly);
const BANDS = [["adult", "21 and over (National Living Wage)"], ["age18to20", "18 to 20"], ["under18", "Under 18"], ["apprentice", "Apprentice"]];
const rateRows = BANDS.map(([k, n]) => [n].concat(R.rates.slice().reverse().map((s) => m2(s[k]))));
const yearRows = BANDS.map(([k, n]) => [n, m2(cur[k] * 37.5 * 52), m2(cur[k] * 40 * 52)].concat(next ? [m2(next[k] * 37.5 * 52)] : []));
const SRC = `<a href="${R.sources[0].url}" rel="nofollow noopener" target="_blank">${esc(R.sources[0].title)}</a>`;
const rise = next ? Math.round((next.adult / cur.adult - 1) * 1000) / 10 : 0;

const P = "/minimum-wage-calculator/", url = SITE + P;
const tool = `    <main class="tool split" id="mw-tool" data-rules="${esc(JSON.stringify({ rates: R.rates }))}">
      <div class="field-row">
        <div class="field"><label for="mw-age">Your age</label><input type="number" id="mw-age" value="${ex.age}" min="15" max="120" step="1" inputmode="numeric"></div>
        <div class="field"><label for="mw-apprentice">Apprentice?</label><select id="mw-apprentice"><option value="no" selected>No</option><option value="first">Yes, in the first year</option><option value="later">Yes, past the first year</option></select></div>
      </div>
      <div class="field-row">
        <div class="field"><label for="mw-pay">Your pay before tax</label><input type="number" id="mw-pay" value="${ex.hourly}" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="mw-per">Per</label><select id="mw-per"><option value="hour" selected>Hour</option><option value="week">Week</option><option value="month">Month</option><option value="year">Year</option></select></div>
        <div class="field" id="mw-hours-field" style="display:none;"><label for="mw-hours">Hours a week</label><input type="number" id="mw-hours" value="37.5" min="0" step="any" inputmode="decimal"></div>
      </div>
      <div class="field-row">
        <div class="field"><label for="mw-when">Rates</label><select id="mw-when"><option value="${cur.from}" selected>Now (${esc(cur.label)} rates)</option>${next ? `<option value="${next.from}">From ${esc(next.label)}</option>` : ""}</select></div>
      </div>
      <p class="tool-hint" id="mw-error" role="alert" style="color: var(--bad); display: none;"></p>
      <div class="result-box split-aside" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="mw-min">${m2(ex.c.min)} an hour</div>
          <div class="label" id="mw-label">National Living Wage (21 and over), ${esc(cur.label)}</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row"><span class="r-label">Your pay</span><span class="r-value" id="mw-yours">${m2(ex.hourly)} an hour</span></div>
          <div class="result-row highlight"><span class="r-label">Does it meet the minimum?</span><span class="r-value" id="mw-status">${ex.c.ok ? "Yes, it meets the minimum" : "No"}</span></div>
          <div class="result-row"><span class="r-label">Shortfall</span><span class="r-value" id="mw-short">£0.00</span></div>
          <div class="result-row"><span class="r-label">The minimum over a year</span><span class="r-value" id="mw-annual">${m2(ex.c.min * 37.5 * 52)} a year on 37.5 hours a week</span></div>
        </div>
      </div>
    </main>
`;

const body = `    <main class="tool">
      <h2 class="tool-section-title">Minimum wage rates</h2>
      <p class="about-text">The minimum hourly rate depends on your age and whether you're an apprentice, and the rates change on 1 April every year. From 21 you're entitled to the National Living Wage, ${m2(cur.adult)} an hour from ${esc(cur.label)}${next ? `, rising to <strong>${m2(next.adult)}</strong> from ${esc(next.label)} (up ${rise}%)` : ""}. Workers under 21, down to school leaving age, get the National Minimum Wage for their age.</p>
${site.table(["Age"].concat(R.rates.slice().reverse().map((s) => esc(s.label))), rateRows, 560)}      <h2 class="tool-section-title" style="margin-top:18px;">Apprentices</h2>
      <p class="about-text">You get the apprentice rate (${m2(cur.apprentice)} an hour from ${esc(cur.label)}) if you're under 19, or 19 or over and in the first year of your apprenticeship. Once you're 19 or over and past the first year, you're entitled to the minimum wage for your age: GOV.UK's example is a 21-year-old apprentice who has finished their first year getting ${m2(cur.adult)}.</p>
      <h2 class="tool-section-title" style="margin-top:18px;">The minimum wage as a yearly salary</h2>
${site.table(["Age", `${esc(cur.label)}, 37.5 hours`, "40 hours"].concat(next ? [`${esc(next.label)}, 37.5 hours`] : []), yearRows, 560)}      <p class="tool-hint" style="margin-top:8px;">Hourly rate × hours × 52 weeks. For take-home pay, use the <a href="/salary/">salary calculator</a>; for part-time hours, the <a href="/pro-rata-salary-calculator/">pro rata salary calculator</a>. If you're not being paid the minimum wage and think you should be, contact Acas.</p>
    </main>
`;

const q = [
  [`What is the minimum wage in ${cur.label.replace(/ to .*/, "")}?`, `${m2(cur.adult)} an hour if you're 21 or over (the National Living Wage), ${m2(cur.age18to20)} at 18 to 20, ${m2(cur.under18)} under 18 and ${m2(cur.apprentice)} for apprentices.`],
  ...(next ? [[`What will the minimum wage be from ${next.label}?`, `${m2(next.adult)} an hour for 21 and over, ${m2(next.age18to20)} for 18 to 20, ${m2(next.under18)} for under 18s and ${m2(next.apprentice)} for apprentices.`]] : []),
  ["How much is the National Living Wage a year?", `${m2(cur.adult * 37.5 * 52)} a year on 37.5 hours a week, or ${m2(cur.adult * 40 * 52)} on 40 hours, before tax, at ${m2(cur.adult)} an hour.`],
  ["When does the minimum wage go up?", "On 1 April every year."],
  ["What is the apprentice minimum wage?", `${m2(cur.apprentice)} an hour from ${cur.label}, for apprentices under 19 or in the first year of their apprenticeship. Apprentices aged 19 or over who have finished their first year get the minimum wage for their age.`],
  ["What age do you get the National Living Wage?", "From 21. Workers aged 20 and under get the National Minimum Wage for their age group."]
];
const title = site.fitTitle(`Minimum Wage Calculator UK — ${m2(cur.adult)} National Living Wage and Rates by Age`, "Minimum Wage Calculator UK");
const desc = `Check your pay against the National Minimum Wage and National Living Wage for your age: ${m2(cur.adult)} an hour for 21 and over from ${cur.label}${next ? `, ${m2(next.adult)} from ${next.label}` : ""}. Apprentice rates and yearly salary equivalents.`;
const ld = [site.webPage(title, desc, url, R.lastChecked), site.breadcrumb([["Home", SITE + "/"], ["Personal Finance", SITE + "/personal-finance/"], ["Minimum Wage Calculator", url]]),
  { "@context": "https://schema.org", "@type": "WebApplication", name: "Minimum Wage Calculator", url, applicationCategory: "FinanceApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } }, site.faqLd(q)];

const html = site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="/personal-finance/">← Personal finance calculators</a>
      <h1 class="page-title">Minimum wage calculator</h1>
      <p class="page-subtitle">The minimum wage for your age, and whether your pay meets it, now and from next April.</p>
    </header>

${tool}
${body}
    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}      <p class="tool-hint" style="margin-top:12px;">A guide, not advice. Rates from ${SRC}. Last checked ${site.niceDate(R.lastChecked)}.</p>
    </main>

${related.block(P)}
${site.FOOTER}
  </div>
  <script src="/minimum-wage.js"></script>
</body>
</html>
`;
site.write("minimum-wage-calculator", html);
site.sitemapBlock("minimum wage pages", "tools/build-minimum-wage-pages.js", [[P, "0.6"]]);
console.log(`built the minimum wage calculator (${cur.label}: ${m2(cur.adult)}${next ? `; ${next.label}: ${m2(next.adult)}` : ""})`);
