#!/usr/bin/env node
/* The Winter Fuel Payment calculator:

       /winter-fuel-payment-calculator/

       node tools/build-winter-fuel-payment-pages.js

   Eligibility dates, amounts and the £35,000 income rule for one winter are
   quoted from GOV.UK in data/uk/winter-fuel-payment.json; the page is built
   from the same functions it runs (winter-fuel-payment.js). The build stops
   unless every amount and date is in the quoted wording and every case on
   GOV.UK comes out. Runs in the monthly rebuild; update the data each
   autumn for the next winter. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const related = require("./related.js");
const WF = require("../winter-fuel-payment.js");
const { esc, SITE } = site;

const R = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/uk/winter-fuel-payment.json"), "utf8"));
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const nice = (s) => { const p = s.split("-"); return `${+p[2]} ${MONTHS[+p[1] - 1]} ${p[0]}`; };
const dayBefore = (s) => { const d = new Date(s + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() - 1); return d.toISOString().slice(0, 10); };
const m0 = (v) => "£" + Math.round(v).toLocaleString("en-GB");
const Q = (k) => R.rules[k].quote, A = R.amounts;
const BY = nice(R.bornBy), OLD = nice(R.olderBefore);
const need = [["who", `born on or before ${BY}`], ["who", `winter ${R.winter}`], ["where", BY], ["week", R.week], ["income", `over ${m0(R.incomeLimit)}`], ["careNot", "29 June 2026"],
  ["alone", `${m0(A.alone[0])} if you were born between ${OLD} and ${BY}`], ["alone", `${m0(A.alone[1])} if you were born before ${OLD}`],
  ["care", `${m0(A.care[0])} if you were born between`], ["care", `${m0(A.care[1])} if you were born before`],
  ["joint", `${m0(A.joint[0])} if both of you`], ["joint", `${m0(A.joint[1])} if one or both`], ["single", `${m0(A.single[0])} if you were born between`], ["single", `${m0(A.single[1])} if you were born before`],
  ["together", `${m0(A.together.yy)} if you and the person you live with were both born between`], ["together", `${m0(A.together.yo)} if you were born between ${OLD} and ${BY} but the person you live with was born before`],
  ["together", `${m0(A.together.oy)} if you were born before ${OLD} but the person you live with was born between`], ["together", `${m0(A.together.oo)} if you and the person you live with were both born before`]];
need.forEach(([k, s]) => { if (!Q(k).includes(s)) throw new Error(`winter fuel: "${s}" isn't in GOV.UK's quoted wording for ${k} (data/uk/winter-fuel-payment.json)`); });
/* every case on GOV.UK, with someone born in 1955 (younger band) and 1940 (older band) */
const y = "1955-03-01", o = "1940-03-01", cases = [
  [{ dob: y, home: "alone" }, 200], [{ dob: o, home: "alone" }, 300], [{ dob: y, home: "care" }, 100], [{ dob: o, home: "care" }, 150],
  [{ dob: y, home: "with", partnerDob: y }, 100], [{ dob: y, home: "with", partnerDob: o }, 100], [{ dob: o, home: "with", partnerDob: y }, 200], [{ dob: o, home: "with", partnerDob: o }, 150],
  [{ dob: y, home: "with", partnerDob: y, benefit: "joint" }, 200], [{ dob: y, home: "with", partnerDob: o, benefit: "joint" }, 300], [{ dob: y, home: "with", partnerDob: y, benefit: "own" }, 200], [{ dob: o, home: "with", partnerDob: y, benefit: "own" }, 300],
  [{ dob: y, home: "with", partnerDob: "1975-01-01" }, 200]];
cases.forEach(([c, want], i) => { const r = WF.calc(R, c); if (r.amount !== want) throw new Error(`winter fuel: case ${i + 1} gives ${r.amount}, not ${want}`); });
if (WF.calc(R, { dob: R.bornBy, home: "alone" }).amount !== 200 || WF.calc(R, { dob: "1960-06-28", home: "alone" }).eligible || WF.calc(R, { dob: dayBefore(R.olderBefore), home: "alone" }).amount !== 300 || WF.calc(R, { dob: R.olderBefore, home: "alone" }).amount !== 200) throw new Error("winter fuel: the birth date cut-offs come out wrong");
if (WF.calc(R, { dob: y, home: "alone", income: R.incomeLimit }).back || !WF.calc(R, { dob: y, home: "alone", income: R.incomeLimit + 1 }).back) throw new Error("winter fuel: the income limit comes out wrong");

const P = "/winter-fuel-payment-calculator/", u = SITE + P;
const SRC = `<a href="${R.sources[0].url}" rel="nofollow noopener" target="_blank">GOV.UK: ${esc(R.sources[0].title)}</a>`;
const RULES = { winter: R.winter, bornBy: R.bornBy, olderBefore: R.olderBefore, incomeLimit: R.incomeLimit, amounts: A, bornByText: BY, olderBeforeText: OLD };
const table = [
  ["You live alone, or no one you live with is eligible", m0(A.alone[0]), m0(A.alone[1])],
  ["You live with someone eligible, neither on the benefits below", m0(A.together.yy), `${m0(A.together.oy)} if they were born ${OLD} to ${BY}, ${m0(A.together.oo)} if they were born before ${OLD}`],
  ["You and your partner claim the benefits jointly (paid to one of you)", m0(A.joint[0]), `${m0(A.joint[1])} if one or both of you are`],
  ["You get the benefits on your own (not a joint claim)", m0(A.single[0]), m0(A.single[1])],
  ["You live in a care home", m0(A.care[0]), m0(A.care[1])]
];
const tool = `    <main class="tool split" id="wf-tool" data-rules="${esc(JSON.stringify(RULES))}">
      <div class="field-row">
        <div class="field"><label for="wf-dob">Your date of birth</label><input type="date" id="wf-dob" value="1955-03-01" min="1900-01-01" max="2010-12-31"></div>
        <div class="field"><label for="wf-home">During ${esc(R.week)} you lived</label><select id="wf-home"><option value="alone" selected>Alone (or with no one else eligible)</option><option value="with">With someone else who's eligible</option><option value="care">In a care home</option></select></div>
      </div>
      <div class="field-row" id="wf-with-row" style="display:none;">
        <div class="field"><label for="wf-pdob">Their date of birth</label><input type="date" id="wf-pdob" value="1956-01-01" min="1900-01-01" max="2010-12-31"></div>
        <div class="field"><label for="wf-benefit">Pension Credit, Universal Credit or income-related ESA</label><select id="wf-benefit"><option value="none" selected>Neither of us gets them</option><option value="own">I get one in my own name</option><option value="joint">We claim one jointly</option></select></div>
      </div>
      <div class="field"><label for="wf-income">Your own total income for the tax year, before deductions</label><input type="number" id="wf-income" value="20000" min="0" step="any" inputmode="decimal"></div>
      <p class="tool-hint" id="wf-error" role="alert" style="color: var(--bad); display: none;"></p>
      <p class="tool-hint" style="margin:6px 0 0;">For people who usually live in England, Wales or Northern Ireland. Your partner's income doesn't count towards the ${m0(R.incomeLimit)}.</p>
      <div class="result-box split-aside" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="wf-amount">${m0(A.alone[0])}</div>
          <div class="label" id="wf-label">Winter Fuel Payment, winter ${esc(R.winter)}</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row"><span class="r-label">Your age group</span><span class="r-value" id="wf-band">Born ${OLD} to ${BY}</span></div>
          <div class="result-row"><span class="r-label">HMRC</span><span class="r-value" id="wf-hmrc">Nothing to pay back</span></div>
          <div class="result-row highlight"><span class="r-label">You keep</span><span class="r-value" id="wf-keep">${m0(A.alone[0])}</span></div>
        </div>
        <p class="tool-hint" id="wf-note" style="margin:10px 0 0;"></p>
      </div>
    </main>
`;
const body = `    <main class="tool">
      <h2 class="tool-section-title">Winter Fuel Payment amounts, winter ${esc(R.winter)}</h2>
${site.table(["Your situation in the qualifying week", `Born ${OLD} to ${BY}`, `Born before ${OLD}`], table, 680)}      <p class="tool-hint" style="margin-top:8px;">The benefits are Pension Credit, Universal Credit and income-related Employment and Support Allowance. The qualifying week is ${esc(R.week)}.</p>
      <h2 class="tool-section-title" style="margin-top:18px;">Who gets it and when</h2>
      <p class="about-text">You can get a Winter Fuel Payment for winter ${esc(R.winter)} if you were born on or before <strong>${BY}</strong> and usually live in England, Wales or Northern Ireland. Most people get it automatically and receive a letter in October or November; most are paid in November or December 2026. If you need to claim, the deadline is 31 March 2027. It doesn't affect your other benefits. In Scotland you can't get it, but you might get Pension Age Winter Heating Payment. If you live in a care home, you're not eligible if you get Universal Credit, Pension Credit or income-related ESA and have lived there the whole time from 29 June 2026 or earlier.</p>
      <p class="about-text"><strong>If your own total income is over ${m0(R.incomeLimit)}</strong>, HMRC takes the payment back, usually through your tax code, or through your Self Assessment tax bill if you send a return. Your partner's income doesn't count. You can opt out of getting it instead.</p>
    </main>
`;
const q = [
  ["Who gets the Winter Fuel Payment?", `People born on or before ${BY} who usually live in England, Wales or Northern Ireland, for winter ${esc(R.winter)}. Your circumstances in the qualifying week, ${esc(R.week)}, set the amount.`],
  ["How much is the Winter Fuel Payment?", `Between ${m0(A.care[0])} and ${m0(A.alone[1])}: ${m0(A.alone[0])} if you live alone and were born between ${OLD} and ${BY}, or ${m0(A.alone[1])} if you were born before ${OLD}. Less each if you live with someone else who's eligible and neither of you gets Pension Credit, Universal Credit or income-related ESA.`],
  ["What's the income limit for the Winter Fuel Payment?", `If your own total income is over ${m0(R.incomeLimit)}, HMRC takes the payment back, usually through your tax code. Your partner's income doesn't count towards it.`],
  ["When is the Winter Fuel Payment paid?", "Most eligible people are paid in November or December 2026, after a letter in October or November saying how much they'll get."],
  ["Do I need to claim the Winter Fuel Payment?", "Usually not: you get it automatically if you get the State Pension or certain other benefits. If you've never had it before, or have deferred your State Pension since your last one, you may need to claim by 31 March 2027."]
];
const title = site.fitTitle(`Winter Fuel Payment Calculator ${R.winter.replace(" to ", "/")} — Am I Eligible?`, "Winter Fuel Payment Calculator");
const desc = `Check if you'll get the Winter Fuel Payment for winter ${R.winter}, how much (${m0(A.care[0])} to ${m0(A.alone[1])}), and whether HMRC takes it back because your income is over ${m0(R.incomeLimit)}.`;
const app = { "@context": "https://schema.org", "@type": "WebApplication", name: "Winter Fuel Payment Calculator", url: u, applicationCategory: "FinanceApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } };
const html = site.head({ title, desc, url: u, ld: [site.webPage(title, desc, u, R.lastChecked), site.breadcrumb([["Home", SITE + "/"], ["Personal Finance", SITE + "/personal-finance/"], ["Winter Fuel Payment Calculator", u]]), app, site.faqLd(q)] }) + `    <header class="site-header">
      <a class="back-link" href="/personal-finance/">← Personal finance calculators</a>
      <h1 class="page-title">Winter Fuel Payment calculator</h1>
      <p class="page-subtitle">Whether you'll get it for winter ${esc(R.winter)}, how much, and whether HMRC takes it back.</p>
    </header>

${tool}
${body}
    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}      <p class="tool-hint" style="margin-top:12px;">A guide, not advice: the Winter Fuel Payment Centre decides. Rules from ${SRC}. Last checked ${site.niceDate(R.lastChecked)}.</p>
    </main>

${related.block(P)}
${site.FOOTER}
  </div>
  <script src="/winter-fuel-payment.js"></script>
</body>
</html>
`;
site.write("winter-fuel-payment-calculator", html);
site.sitemapBlock("winter fuel payment pages", "tools/build-winter-fuel-payment-pages.js", [[P, "0.6"]]);
console.log(`built the Winter Fuel Payment calculator (winter ${R.winter}, born by ${BY}, ${m0(A.care[0])} to ${m0(A.alone[1])})`);
