#!/usr/bin/env node
/* The notice period calculator:

       /notice-period-calculator/

       node tools/build-notice-period-pages.js

   GOV.UK's statutory notice rules are quoted in data/uk/notice-period.json;
   the page is built from the same functions it runs (notice-period.js).
   The build stops unless the stored rules still match GOV.UK's quoted
   table and hand-checked examples come out the same. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const related = require("./related.js");
const NP = require("../notice-period.js");
const { esc, SITE } = site;

const R = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/uk/notice-period.json"), "utf8"));
const Q = (k) => R.rules[k].quote;
if (!Q("employerTable").includes(`1 month to ${R.employer.oneWeekUntilYears} years At least a week`) || !Q("employerTable").includes(`12 or more years ${R.employer.maxWeeks} weeks`) || !Q("employee").includes("at least a week’s notice if you’ve been in your job for more than a month")) throw new Error("notice period: GOV.UK's quoted rules no longer match data/uk/notice-period.json");
/* hand-checked: 7 complete years → 7 weeks from 26 Nov 2026, last day 14 Jan 2027; 26 years → 12 weeks; 3 weeks' service → none */
const chk = [["employer", "2019-06-01", 7, "2027-01-14"], ["employer", "2000-01-01", 12, "2027-02-18"], ["employer", "2026-11-05", 0, null], ["employee", "2020-01-01", 1, "2026-12-03"]];
chk.forEach(([who, start, w, end]) => { const r = NP.calc(R, { who, start, given: "2026-11-26", contract: { n: 0 } }); if (r.statWeeks !== w || r.end !== end) throw new Error(`notice period: ${who} from ${start} gives ${r.statWeeks} weeks to ${r.end}, not ${w} to ${end}`); });

const P = "/notice-period-calculator/", u = SITE + P;
const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;
const rows = [["Less than 1 month", "None", "None (check your contract)"], ["1 month to 2 years", "1 week", "1 week"]]
  .concat([2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((y) => [`${y} complete years`, plural(NP.statutory(R, "employer", { months: y * 12, years: y }), "week"), "1 week"]))
  .concat([["12 years or more", plural(R.employer.maxWeeks, "week"), "1 week"]]);
const SRC = R.sources.map((s) => `<a href="${s.url}" rel="nofollow noopener" target="_blank">${esc(s.title)}</a>`).join(", ");
const tool = `    <main class="tool split" id="np-tool" data-rules="${esc(JSON.stringify({ employer: R.employer, employee: R.employee }))}">
      <div class="field-row">
        <div class="field"><label for="np-who">Who's giving notice</label><select id="np-who"><option value="employer" selected>My employer (I'm being dismissed or made redundant)</option><option value="employee">Me (I'm resigning)</option></select></div>
      </div>
      <div class="field-row">
        <div class="field"><label for="np-start">Date you started the job</label><input type="date" id="np-start" value="2019-06-01"></div>
        <div class="field"><label for="np-given">Date notice is given</label><input type="date" id="np-given" value=""></div>
      </div>
      <div class="field-row">
        <div class="field"><label for="np-cn">Notice in your contract</label><input type="number" id="np-cn" value="0" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="np-cu">In</label><select id="np-cu"><option value="weeks" selected>Weeks</option><option value="months">Months</option></select></div>
        <div class="field"><label for="np-pay">Average weekly pay (optional)</label><input type="number" id="np-pay" value="" min="0" step="any" inputmode="decimal" placeholder="e.g. 600"></div>
      </div>
      <p class="tool-hint" id="np-error" role="alert" style="color: var(--bad); display: none;"></p>
      <p class="tool-hint" id="np-who-note" style="margin:6px 0 0;"></p>
      <div class="result-box split-aside" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="np-end">—</div>
          <div class="label" id="np-label">last day of notice</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row highlight"><span class="r-label">Statutory minimum</span><span class="r-value" id="np-stat">—</span></div>
          <div class="result-row"><span class="r-label">Contract notice ends</span><span class="r-value" id="np-contract">—</span></div>
          <div class="result-row"><span class="r-label">Complete service</span><span class="r-value" id="np-service">—</span></div>
          <div class="result-row"><span class="r-label">Notice pay at your weekly pay</span><span class="r-value" id="np-pay-out">—</span></div>
        </div>
        <p class="tool-hint" style="margin:10px 0 0;">Notice usually runs from the day after it's given. Some dismissals, for example for violence, can be immediate.</p>
      </div>
    </main>
`;

const body = `    <main class="tool">
      <h2 class="tool-section-title">Statutory notice periods</h2>
${site.table(["Length of service", "Your employer must give", "You must give"], rows, 560)}      <p class="about-text">These are the legal minimums. <strong>Your employer</strong> must give at least the notice in your contract or the statutory minimum, whichever is longer: a week from one month's service, then a week for every complete year from 2 years, up to 12 weeks after 12 years. <strong>You</strong> must give at least a week once you've been in the job for more than a month; if your contract asks for more, you may be in breach of contract if you give less. Notice usually runs from the start of the day after it's handed in.</p>
      <h2 class="tool-section-title" style="margin-top:18px;">Pay during your notice</h2>
      <p class="about-text">You'll usually get your normal pay rate during your notice, with bonuses and commission unless your contract says otherwise. When an employer works out notice pay for redundancy, it's based on your average weekly pay over the 12 weeks before notice starts. Your employer can ask you not to come in (garden leave) on the same pay and benefits, or pay you in lieu of notice if your contract allows it or you agree; tax and National Insurance come off that payment. If you're being made redundant, the <a href="/redundancy-pay-calculator/">redundancy pay calculator</a> works out the lump sum.</p>
    </main>
`;
const q = [
  ["What is the statutory notice period?", `If your employer ends your job, at least a week once you've worked there a month, then a week for every complete year from 2 years, up to ${R.employer.maxWeeks} weeks after 12 years. If you resign, at least a week once you've worked there more than a month.`],
  ["Does my contract's notice period or the statutory one apply?", "Whichever is longer. GOV.UK: you must be given at least the notice stated in your contract or the statutory minimum notice period, whichever is longer."],
  ["How much notice do I get after 5 years?", "At least 5 weeks from your employer, or more if your contract says so."],
  ["When does my notice period start?", "Usually from the start of the day after you hand in (or are given) notice. Handing in a week's notice on a Monday, your last day is the following Monday."],
  ["Do I get paid during my notice period?", "Usually your normal pay rate, plus bonuses and commission unless your contract says otherwise. Your employer can pay you in lieu of notice if it's in your contract or you agree."]
];
const title = site.fitTitle("Notice Period Calculator UK — Statutory Notice and Your Last Day", "Notice Period Calculator UK");
const desc = "Work out your notice period and last day: the statutory minimum (a week per year of service from 2 years, up to 12 weeks) or your contract's, whichever is longer, counted from the day after notice is given.";
const ld = [site.webPage(title, desc, u, R.lastChecked), site.breadcrumb([["Home", SITE + "/"], ["Personal Finance", SITE + "/personal-finance/"], ["Notice Period Calculator", u]]),
  { "@context": "https://schema.org", "@type": "WebApplication", name: "Notice Period Calculator", url: u, applicationCategory: "BusinessApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } }, site.faqLd(q)];
const html = site.head({ title, desc, url: u, ld }) + `    <header class="site-header">
      <a class="back-link" href="/personal-finance/">← Personal finance calculators</a>
      <h1 class="page-title">Notice period calculator</h1>
      <p class="page-subtitle">How much notice you must get or give, and the last day of your notice period.</p>
    </header>

${tool}
${body}
    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}      <p class="tool-hint" style="margin-top:12px;">A guide, not advice: your contract and Acas can confirm what applies. Rules from GOV.UK: ${SRC}. Last checked ${site.niceDate(R.lastChecked)}.</p>
    </main>

${related.block(P)}
${site.FOOTER}
  </div>
  <script src="/notice-period.js"></script>
</body>
</html>
`;
site.write("notice-period-calculator", html);
site.sitemapBlock("notice period pages", "tools/build-notice-period-pages.js", [[P, "0.6"]]);
console.log("built the notice period calculator (7 years' service: 7 weeks)");
