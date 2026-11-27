#!/usr/bin/env node
/* The Council Tax discount calculator:

       /council-tax-discount-calculator/

       node tools/build-council-tax-discount-pages.js

   The single person discount, 50% and 100% discounts, who is disregarded
   and the Disabled Band Reduction Scheme are quoted from GOV.UK, and the
   band proportions from the Local Government Finance Act 1992 s5, in
   data/uk/council-tax-discount.json. The page is built from the same
   functions it runs (council-tax-discount.js). The build stops unless the
   figures are in the quoted wording and hand-checked cases come out.
   Runs in the monthly rebuild. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const related = require("./related.js");
const CT = require("../council-tax-discount.js");
const { esc, SITE } = site;

const R = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/uk/council-tax-discount.json"), "utf8"));
const m2 = (v) => "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const m0 = (v) => "£" + Math.round(v).toLocaleString("en-GB");
const Q = (k) => R.rules[k].quote;
[["quarter", `${R.single}% off`], ["half", `${R.allDisregarded}% off`], ["band", `${R.bandAReduction}% discount`], ["ratio", R.ratios.england.join(": ")], ["ratioWales", R.ratios.wales.join(": ")], ["smiFull", "100% discount"], ["students", "do not have to pay"], ["instalments", "10 monthly payments"]]
  .forEach(([k, s]) => { if (!Q(k).includes(s)) throw new Error(`council tax: "${s}" isn't in the quoted wording for ${k} (data/uk/council-tax-discount.json)`); });
/* hand-checked on a £2,000 band D bill in England: living alone £1,500; with 2 students £1,500; 2 adults £2,000; all students £0;
   all disregarded £1,000; disabled band reduction to band C: £2,000 × 8/9 = £1,777.78, then 25% off = £1,333.33; band A: 17% off = £1,660 */
const c = (o) => CT.calc(R, Object.assign({ bill: 2000, country: "england", band: 3 }, o));
if (c({ counted: 1 }).due !== 1500 || c({ counted: 1, students: 2 }).due !== 1500 || c({ counted: 2 }).due !== 2000 || c({ students: 2 }).due !== 0 || c({ smi: 1, other: 1 }).due !== 1000 ||
    c({ counted: 1, disabled: true }).due !== 1333.33 || c({ counted: 2, disabled: true, band: 0 }).due !== 1660)
  throw new Error("council tax: a hand-checked case no longer comes out");

const P = "/council-tax-discount-calculator/", u = SITE + P;
const SRC = R.sources.map((s) => `<a href="${s.url}" rel="nofollow noopener" target="_blank">${esc(s.title)}</a>`).join(", ");
const RULES = { single: R.single, allDisregarded: R.allDisregarded, bandAReduction: R.bandAReduction, ratios: R.ratios };
const def = c({ counted: 1 });
const num = (id, label, value) => `<div class="field"><label for="${id}">${label}</label><input type="number" id="${id}" value="${value}" min="0" step="1" inputmode="numeric"></div>`;
const L = "ABCDEFGHI";
const bandRows = R.ratios.england.map((r, i) => [`Band ${L[i]}`, `${r}/9`, i ? `Band ${L[i - 1]} (${R.ratios.england[i - 1]}/9)` : `${R.bandAReduction}% off`]);
const tool = `    <main class="tool split" id="ct-tool" data-rules="${esc(JSON.stringify(RULES))}">
      <div class="field-row">
        <div class="field"><label for="ct-bill">Full Council Tax for the year</label><input type="number" id="ct-bill" value="2000" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="ct-country">Where</label><select id="ct-country"><option value="england" selected>England</option><option value="wales">Wales</option></select></div>
      </div>
      <p class="tool-hint" style="margin:0 0 10px;">Adults aged 18 or over who live there as their main home, including you. Children don't count.</p>
      <div class="field-row">
        ${num("ct-counted", "Adults who count (not in the groups below)", 1)}
        ${num("ct-students", "Full-time students", 0)}
      </div>
      <div class="field-row">
        ${num("ct-smi", "Severely mentally impaired", 0)}
        ${num("ct-other", "Other disregarded (carers, apprentices, 18–19 at school…)", 0)}
      </div>
      <div class="field-row">
        <div class="field"><label><input type="checkbox" id="ct-disabled" style="width:auto; margin-right:8px;">Disabled Band Reduction Scheme</label></div>
        <div class="field"><label for="ct-band">Your band</label><select id="ct-band">${L.slice(0, 8).split("").map((l, i) => `<option value="${i}"${i === 3 ? " selected" : ""}>Band ${l}</option>`).join("")}</select></div>
      </div>
      <p class="tool-hint" id="ct-error" role="alert" style="color: var(--bad); display: none;"></p>
      <p class="tool-hint" style="margin:6px 0 0;">England and Wales. Enter the full amount for your band, before any discounts.</p>
      <div class="result-box split-aside" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="ct-due">${m2(def.due)}</div>
          <div class="label">Council Tax to pay for the year</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row" id="ct-band-row" style="display:none;"><span class="r-label">Band reduction</span><span class="r-value" id="ct-bandsave">${m2(def.bandSaving)}</span></div>
          <div class="result-row"><span class="r-label">Discount</span><span class="r-value" id="ct-disc">${def.pct}% (${m2(def.discount)})</span></div>
          <div class="result-row highlight"><span class="r-label">You save a year</span><span class="r-value" id="ct-saving">${m2(def.saving)}</span></div>
          <div class="result-row"><span class="r-label">Over 10 monthly payments</span><span class="r-value" id="ct-m10">${m2(def.monthly10)}</span></div>
          <div class="result-row"><span class="r-label">Over 12 monthly payments</span><span class="r-value" id="ct-m12">${m2(def.monthly12)}</span></div>
        </div>
        <p class="tool-hint" id="ct-note" style="margin:10px 0 0;"></p>
      </div>
    </main>
`;
const body = `    <main class="tool">
      <h2 class="tool-section-title">The single person discount</h2>
      <p class="about-text">A full Council Tax bill is based on at least 2 adults living in a home. You get <strong>${R.single}% off</strong> if you pay Council Tax and either you live on your own or everyone else in your home is disregarded. You get <strong>${R.allDisregarded}% off</strong> if everyone living in your household is disregarded, and households where everyone is a full-time student don't have to pay at all. On a ${m0(2000)} bill, the single person discount saves ${m0(500)} a year.</p>
      <p class="about-text"><strong>Who is disregarded:</strong> people under 18; people on certain apprentice schemes; 18 or 19 year olds in full-time education; full-time students at college or university; under 25s funded by the Education and Skills Funding Agency; student nurses; foreign language assistants registered with the British Council; people who are severely mentally impaired; live-in carers for someone who isn't their partner, spouse or child under 18; and diplomats.</p>
      <p class="about-text">You need to apply to your council for a discount, even if you're disregarded. If you get a discount by mistake, you must contact your council, or you could get a fine. Bills are usually split into 10 monthly payments; your council can spread them over 12 if you're having trouble paying.</p>
      <h2 class="tool-section-title" style="margin-top:18px;">Disabled Band Reduction Scheme</h2>
      <p class="about-text">If you live in a larger home than you'd need if you or someone you live with weren't disabled (for example an extra bathroom, kitchen or room, or extra space for a wheelchair), your bill can be reduced to the next band down. In band A it's ${R.bandAReduction}% off instead. Bands are charged in fixed proportions of band D:</p>
${site.table(["Band", "Share of band D", "With the reduction you pay"], bandRows, 520)}      <p class="tool-hint" style="margin-top:8px;">England. Wales has a band I at 21/9.</p>
    </main>
`;
const q = [
  ["How much is the single person discount?", `${R.single}% off your Council Tax if you're the only adult who counts in your home. On a ${m0(2000)} bill that's ${m0(500)} a year, leaving ${m0(1500)}.`],
  ["Do students count for Council Tax?", "No: full-time students are disregarded. If you live with only full-time students you get 25% off, and a home where everyone is a full-time student doesn't have to pay."],
  ["Do children count for Council Tax?", "No: people under 18 are disregarded, so a single parent living only with children under 18 can get the 25% single person discount."],
  ["What if everyone in the home is disregarded?", `You get ${R.allDisregarded}% off, or 100% off if everyone is severely mentally impaired or a full-time student.`],
  ["Do I have to apply for the single person discount?", "Yes: you need to apply to your council, even if you're disregarded. If you get a discount by mistake you must contact your council, or you could get a fine, and the council may ask you to pay the discount back."]
];
const title = site.fitTitle("Council Tax Single Person Discount Calculator (25%)", "Council Tax Discount Calculator");
const desc = "Work out your Council Tax with the 25% single person discount, 50% or 100% off when everyone is disregarded, student exemptions and the Disabled Band Reduction Scheme.";
const app = { "@context": "https://schema.org", "@type": "WebApplication", name: "Council Tax Discount Calculator", url: u, applicationCategory: "FinanceApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } };
const html = site.head({ title, desc, url: u, ld: [site.webPage(title, desc, u, R.lastChecked), site.breadcrumb([["Home", SITE + "/"], ["Personal Finance", SITE + "/personal-finance/"], ["Council Tax Discount Calculator", u]]), app, site.faqLd(q)] }) + `    <header class="site-header">
      <a class="back-link" href="/personal-finance/">← Personal finance calculators</a>
      <h1 class="page-title">Council Tax discount calculator</h1>
      <p class="page-subtitle">Your Council Tax with the ${R.single}% single person discount, other discounts and the Disabled Band Reduction Scheme.</p>
    </header>

${tool}
${body}
    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}      <p class="tool-hint" style="margin-top:12px;">A guide, not advice. Rules from ${SRC}. You may also get Council Tax Reduction if you're on a low income. Last checked ${site.niceDate(R.lastChecked)}.</p>
    </main>

${related.block(P)}
${site.FOOTER}
  </div>
  <script src="/council-tax-discount.js"></script>
</body>
</html>
`;
site.write("council-tax-discount-calculator", html);
site.sitemapBlock("council tax discount pages", "tools/build-council-tax-discount-pages.js", [[P, "0.6"]]);
console.log(`built the Council Tax discount calculator (${m0(2000)} living alone: ${m2(def.due)})`);
