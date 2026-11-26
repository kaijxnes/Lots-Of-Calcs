#!/usr/bin/env node
/* The paternity and shared parental pay calculator:

       /paternity-pay-calculator/

       node tools/build-paternity-pay-pages.js

   GOV.UK's rules for Statutory Paternity Pay and Statutory Shared Parental
   Pay are quoted in data/uk/paternity-pay.json; the page is built from the
   same functions it runs (paternity-pay.js). The build stops unless the
   rate and earnings limit are in GOV.UK's quoted wording and agree with
   data/uk/rates-2026-27.json, and GOV.UK's worked examples come out. Runs
   in the monthly rebuild; the rate changes each April. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const related = require("./related.js");
const PP = require("../paternity-pay.js");
const { esc, SITE } = site;

const R = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/uk/paternity-pay.json"), "utf8"));
const RATES = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/uk/rates-2026-27.json"), "utf8"));
const m2 = (v) => "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const Q = (k) => R.rules[k].quote;
const RATE = m2(R.weeklyRate);
[["rate", RATE], ["rate", `${R.earningsPct}%`], ["shppRate", RATE], ["eligibility", `£${R.minAverageWeekly} a week`], ["shppEarnings", `£${R.minAverageWeekly} a week`], ["share", `${R.sharedLeaveMax} weeks of leave`], ["share", `${R.sharedPayMax} weeks of pay`], ["leave", `${R.paternityWeeks} weeks`]]
  .forEach(([k, s]) => { if (!Q(k).includes(s)) throw new Error(`paternity pay: "${s}" isn't in GOV.UK's quoted wording for ${k} (data/uk/paternity-pay.json)`); });
const S = RATES.statutoryPay;
if (S.sppWeekly !== R.weeklyRate || S.lowerEarningsLimit !== R.minAverageWeekly || R.taxYear !== RATES.taxYear) throw new Error("paternity pay: the rate, earnings limit or tax year differ from data/uk/rates-2026-27.json");
/* GOV.UK's examples: 22 weeks of maternity leave and pay leave 30 weeks of SPL and 17 of ShPP; £300 a week: SMP £270 for 6 weeks then the rate */
const sh = PP.shareable(R, 22, 22);
if (sh.leave !== 30 || sh.pay !== 17 || PP.smp(R, 300, 14) !== Math.round((6 * 270 + 8 * R.weeklyRate) * 100) / 100 || PP.weekly(R, 300) !== R.weeklyRate) throw new Error("paternity pay: GOV.UK's worked examples no longer come out");

const P = "/paternity-pay-calculator/", u = SITE + P, cross = Math.round(R.weeklyRate / (R.earningsPct / 100) * 100) / 100;
const SRC = R.sources.map((s) => `<a href="${s.url}" rel="nofollow noopener" target="_blank">${esc(s.title)}</a>`).join(", ");
const def = PP.calc(R, { awe: 30000 / 52, paternityWeeks: 2, motherLeave: 39, motherPay: 39, shppWeeks: 0 });
const tool = `    <main class="tool split" id="pp2-tool" data-rules="${esc(JSON.stringify({ weeklyRate: R.weeklyRate, earningsPct: R.earningsPct, minAverageWeekly: R.minAverageWeekly, paternityWeeks: R.paternityWeeks, smpWeeks: R.smpWeeks, smpHigherWeeks: R.smpHigherWeeks, leaveWeeks: R.leaveWeeks, compulsoryWeeks: R.compulsoryWeeks, sharedLeaveMax: R.sharedLeaveMax, sharedPayMax: R.sharedPayMax }))}">
      <div class="field-row">
        <div class="field"><label for="pp2-pay">Your average pay before tax</label><input type="number" id="pp2-pay" value="30000" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="pp2-per">Per</label><select id="pp2-per"><option value="1">Year</option><option value="12">Month</option><option value="52">Week</option></select></div>
        <div class="field"><label for="pp2-weeks">Paternity Leave</label><select id="pp2-weeks"><option value="2" selected>2 weeks</option><option value="1">1 week</option><option value="0">None</option></select></div>
      </div>
      <div class="field-row">
        <div class="field"><label for="pp2-ml">Weeks of maternity (or adoption) leave your partner takes</label><input type="number" id="pp2-ml" value="39" min="0" max="${R.leaveWeeks}" step="1" inputmode="numeric"></div>
        <div class="field"><label for="pp2-mp">Weeks of maternity pay they take</label><input type="number" id="pp2-mp" value="39" min="0" max="${R.smpWeeks}" step="1" inputmode="numeric"></div>
        <div class="field"><label for="pp2-sw">Weeks of Shared Parental Pay you take</label><input type="number" id="pp2-sw" value="0" min="0" max="${R.sharedPayMax}" step="1" inputmode="numeric"></div>
      </div>
      <div class="field"><label><input type="checkbox" id="pp2-26" checked style="width:auto; margin-right:8px;">I'll have worked for my employer for 26 weeks by the 15th week before the due date</label></div>
      <p class="tool-hint" id="pp2-error" role="alert" style="color: var(--bad); display: none;"></p>
      <p class="tool-hint" id="pp2-note" style="margin:6px 0 0;"></p>
      <div class="result-box split-aside" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="pp2-total">${m2(def.total)}</div>
          <div class="label" id="pp2-label">statutory pay before tax for 2 weeks</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row highlight"><span class="r-label">A week</span><span class="r-value" id="pp2-weekly">${m2(def.weekly)}</span></div>
          <div class="result-row"><span class="r-label">Statutory Paternity Pay</span><span class="r-value" id="pp2-pat">${m2(def.paternity)}</span></div>
          <div class="result-row"><span class="r-label">Statutory Shared Parental Pay</span><span class="r-value" id="pp2-shpp">${m2(def.shpp)}</span></div>
          <div class="result-row"><span class="r-label">Left to share</span><span class="r-value" id="pp2-left">${def.share.leave} weeks of leave, ${def.share.pay} weeks of pay</span></div>
        </div>
        <p class="tool-hint" style="margin:10px 0 0;">Tax and National Insurance come off, as with wages. Your employer may pay more under a company scheme, never less.</p>
      </div>
    </main>
`;
const earnRows = [120, 150, 200, cross, 300, 500, 800].map((a) => { const w = a < R.minAverageWeekly ? 0 : PP.weekly(R, a); return [m2(a), w ? m2(w) : "Not eligible", w ? m2(w * 2) : "—", w ? m2(w * R.sharedPayMax) : "—"]; });
const shareRows = [2, 6, 13, 22, 26, 39].map((w) => { const s = PP.shareable(R, w, Math.min(w, R.smpWeeks)); return [`${w} weeks`, `${s.leave} weeks`, `${s.pay} weeks`]; });
const body = `    <main class="tool">
      <h2 class="tool-section-title">How much Paternity Pay is</h2>
      <p class="about-text">Statutory Paternity Pay is <strong>${RATE} a week</strong> or ${R.earningsPct}% of your average weekly earnings, whichever is lower (${esc(R.taxYear)}), for up to ${R.paternityWeeks} weeks of Paternity Leave. On average earnings of ${m2(cross)} a week or more you get the full ${RATE}. You can take the 2 weeks together or as two separate weeks, from the birth until 52 weeks after it, and you get the same leave for twins. To get the pay you must earn an average of at least £${R.minAverageWeekly} a week, have worked for your employer for 26 weeks by the 15th week before the due date, still be employed up to the birth, and give the right notice. Paternity Leave itself is a right from your first day as an employee.</p>
${site.table(["Average weekly earnings", "Paternity Pay a week", "For 2 weeks", `${R.sharedPayMax} weeks of Shared Parental Pay`], earnRows, 620)}      <h2 class="tool-section-title" style="margin-top:18px;">Shared Parental Leave and Pay</h2>
      <p class="about-text">You can share up to ${R.sharedLeaveMax} weeks of leave and up to ${R.sharedPayMax} weeks of pay between you, in the first year after the birth or adoption, by your partner ending maternity or adoption leave and pay early. Statutory Shared Parental Pay is the same ${RATE} a week or ${R.earningsPct}% of earnings, whichever is lower (unlike maternity pay, there's no 90% of full pay for the first 6 weeks). GOV.UK's example: after 22 weeks of maternity leave and pay, you can share 30 weeks of leave and 17 weeks of pay. The mother must take at least the compulsory 2 weeks after the birth (4 in a factory), and you need to give your employer 8 weeks' notice. The <a href="/maternity-pay-calculator/">maternity pay calculator</a> covers the mother's side.</p>
${site.table(["Maternity leave and pay taken", "Shared leave left", "Shared pay left"], shareRows, 520)}    </main>
`;
const q = [
  ["How much is Statutory Paternity Pay?", `${RATE} a week or ${R.earningsPct}% of your average weekly earnings, whichever is lower, for up to ${R.paternityWeeks} weeks (${esc(R.taxYear)}). Two weeks at the full rate is ${m2(R.weeklyRate * 2)} before tax.`],
  ["Who gets Paternity Pay?", `You need to earn an average of at least £${R.minAverageWeekly} a week, have been employed by the same employer for 26 weeks by the 15th week before the due date, still be employed up to the birth, and give the right notice.`],
  ["How much is Shared Parental Pay?", `The same as Paternity Pay: ${RATE} a week or ${R.earningsPct}% of average weekly earnings, whichever is lower, for up to ${R.sharedPayMax} weeks shared between you.`],
  ["How much Shared Parental Leave can we get?", `Up to ${R.sharedLeaveMax} weeks of leave and ${R.sharedPayMax} weeks of pay, less whatever maternity or adoption leave and pay has been used. After 22 weeks of maternity leave and pay, that's 30 weeks of leave and 17 of pay.`],
  ["Is Paternity Pay taxed?", "Yes. It's paid like your wages, weekly or monthly, with tax and National Insurance taken off."]
];
const title = site.fitTitle(`Paternity Pay Calculator ${R.taxYear} — Paternity and Shared Parental Pay`, `Paternity Pay Calculator ${R.taxYear}`);
const desc = `Work out Statutory Paternity Pay (${RATE} a week or ${R.earningsPct}% of earnings, whichever is lower) and Shared Parental Pay, and how much shared leave and pay is left after maternity leave (${R.taxYear}).`;
const ld = [site.webPage(title, desc, u, R.lastChecked), site.breadcrumb([["Home", SITE + "/"], ["Personal Finance", SITE + "/personal-finance/"], ["Paternity Pay Calculator", u]]),
  { "@context": "https://schema.org", "@type": "WebApplication", name: "Paternity Pay Calculator", url: u, applicationCategory: "FinanceApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } }, site.faqLd(q)];
const html = site.head({ title, desc, url: u, ld }) + `    <header class="site-header">
      <a class="back-link" href="/personal-finance/">← Personal finance calculators</a>
      <h1 class="page-title">Paternity pay calculator</h1>
      <p class="page-subtitle">Statutory Paternity Pay and Shared Parental Pay: ${RATE} a week or ${R.earningsPct}% of your pay, whichever is lower.</p>
    </header>

${tool}
${body}
    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}      <p class="tool-hint" style="margin-top:12px;">A guide, not advice: your employer works out the exact amount. Rules from GOV.UK: ${SRC}. Last checked ${site.niceDate(R.lastChecked)}.</p>
    </main>

${related.block(P)}
${site.FOOTER}
  </div>
  <script src="/paternity-pay.js"></script>
</body>
</html>
`;
site.write("paternity-pay-calculator", html);
site.sitemapBlock("paternity pay pages", "tools/build-paternity-pay-pages.js", [[P, "0.6"]]);
console.log(`built the paternity pay calculator (${RATE} a week; 2 weeks on £30,000: ${m2(def.total)})`);
