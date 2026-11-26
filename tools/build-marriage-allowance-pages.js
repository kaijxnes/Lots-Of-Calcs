#!/usr/bin/env node
/* The Marriage Allowance calculator:

       /marriage-allowance-calculator/

       node tools/build-marriage-allowance-pages.js

   The rules are in data/uk/marriage-allowance.json, each quoted from GOV.UK;
   Scotland's starter rate and band come from the Scottish tax file in force
   (data/tax/gb). The page is built from the same functions it runs
   (marriage-allowance.js), and GOV.UK's own worked example must come out
   right or the build stops. Runs in the monthly rebuild. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const related = require("./related.js");
const registry = require("./tax/registry.js");
const MA = require("../marriage-allowance.js");
const { esc, SITE } = site;

const R = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/uk/marriage-allowance.json"), "utf8"));
const sct = registry.currentFiles(registry.readAll())["gb-sct"].doc;
const br = sct.items.find((i) => i.id === "gb-income-tax").charge.brackets;
if (br[0][2] !== "Starter rate" || br[1][2] !== "Basic rate") throw new Error("marriage allowance: Scottish bands not as expected");
R.scot = { rate: br[0][1], band: br[1][0] };
const m0 = (v) => "£" + Math.round(v).toLocaleString("en-GB");
const m2 = (v) => "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* GOV.UK's worked example: £11,500 and £20,000 save £214 as a couple */
const gov = MA.calc(R, 11500, 20000, false);
if (gov.saving !== 214 || gov.yourExtraTax !== 38) throw new Error("marriage allowance: GOV.UK's example doesn't come out at £214");
const ex = MA.calc(R, 8000, 30000, false);
const back = R.backdateYears.length * R.maxSaving;

const P = "/marriage-allowance-calculator/", url = SITE + P;
const tool = `    <main class="tool split" id="ma-tool" data-rules="${esc(JSON.stringify(R))}">
      <div class="field-row">
        <div class="field"><label for="ma-lower">Lower earner's yearly income</label><input type="number" id="ma-lower" value="8000" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="ma-higher">Higher earner's yearly income</label><input type="number" id="ma-higher" value="30000" min="0" step="any" inputmode="decimal"></div>
      </div>
      <p class="tool-hint" style="margin:6px 0 0;">Wages, pensions and other taxable income before tax. If either of you has savings interest, dividends or rent, HMRC's helpline can confirm who should claim.</p>
      <div class="field-row">
        <div class="field"><label for="ma-region">Where the higher earner pays tax</label><select id="ma-region"><option value="ruk">England, Wales or Northern Ireland</option><option value="scotland">Scotland</option></select></div>
        <div class="field"><label><input type="checkbox" id="ma-back" checked> Include backdating to 6 April 2022</label></div>
      </div>
      <div class="result-box split-aside" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="ma-saving">${m0(ex.saving)}</div>
          <div class="label" id="ma-label">saved as a couple this tax year</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row"><span class="r-label">Higher earner's tax falls by</span><span class="r-value" id="ma-partner">${m2(ex.partnerSaving)}</span></div>
          <div class="result-row"><span class="r-label">Lower earner's extra tax</span><span class="r-value" id="ma-you">£0</span></div>
          <div class="result-row"><span class="r-label">Backdated ${esc(R.backdateYears[0])} to ${esc(R.backdateYears[R.backdateYears.length - 1])}</span><span class="r-value" id="ma-past">${m0(back)}</span></div>
          <div class="result-row highlight"><span class="r-label">Total if you claim now</span><span class="r-value" id="ma-total">${m0(ex.saving + back)}</span></div>
        </div>
        <p class="tool-hint" id="ma-note" style="margin:10px 0 0;"></p>
      </div>
    </main>
`;

const examples = [[5000, 25000], [10000, 40000], [11500, 20000], [12000, 35000], [8000, 13000], [9000, 55000]].map(([l, h]) => {
  const r = MA.calc(R, l, h, false);
  return [m0(l), m0(h), r.eligible ? m0(r.saving) : "Not eligible"];
});

const body = `    <main class="tool">
      <h2 class="tool-section-title">How Marriage Allowance works</h2>
      <p class="about-text">If you're married or in a civil partnership and one of you earns less than the <strong>${m0(R.personalAllowance)} Personal Allowance</strong>, that person can transfer <strong>${m0(R.transfer)}</strong> of their allowance to the other. The other partner's tax falls by up to <strong>${m0(R.maxSaving)}</strong> a year (20% of ${m0(R.transfer)}). The partner receiving it must pay tax at the basic rate, which usually means an income between ${m0(R.personalAllowance + 1)} and ${m0(R.upper.ruk)} (${m0(R.personalAllowance + 1)} to ${m0(R.upper.scotland)} in Scotland, where the starter, basic and intermediate rates count).</p>
      <p class="about-text">The lower earner's own allowance falls to ${m0(R.personalAllowance - R.transfer)}, so if they earn more than that they pay a little tax themselves, but the couple still comes out ahead. In GOV.UK's example, a lower earner on ${m0(11500)} and a partner on ${m0(20000)} save <strong>${m0(gov.saving)}</strong> between them: ${m0(gov.partnerSaving)} off the partner's tax, less ${m0(gov.yourExtraTax)} the lower earner now pays.</p>
${site.table(["Lower earner", "Higher earner", "Saved a year"], examples, 380)}      <p class="about-text" style="margin-top:14px;"><strong>Backdating.</strong> You can backdate a claim to 6 April 2022 for any year you were both eligible. The Personal Allowance was ${m0(R.personalAllowance)} in each of those years, so each one is worth up to ${m0(R.maxSaving)}: up to <strong>${m0(back)}</strong> for ${esc(R.backdateYears.join(", "))}, paid as a lump sum, on top of this year's saving.</p>
      <p class="about-text">The lower earner applies, online or through Self Assessment, and the allowance carries on each year until you cancel it. Your tax codes change: the receiving partner's ends in <strong>M</strong> and the transferring partner's in <strong>N</strong>. If either of you was born before 6 April 1935, Married Couple's Allowance is usually worth more instead. To see what the change does to monthly take-home pay, use the <a href="/salary/">salary calculator</a>.</p>
    </main>
`;

const q = [
  ["How much is Marriage Allowance worth?", `Up to ${m0(R.maxSaving)} a year: the lower earner transfers ${m0(R.transfer)} of their Personal Allowance and the partner's tax falls by 20% of it. Backdated to 6 April 2022 it can add up to ${m0(back)} more.`],
  ["Who can claim Marriage Allowance?", `Married couples and civil partners where one earns less than ${m0(R.personalAllowance)} and the other pays tax at the basic rate, usually an income between ${m0(R.personalAllowance + 1)} and ${m0(R.upper.ruk)} (up to ${m0(R.upper.scotland)} in Scotland). Couples who live together but aren't married or in a civil partnership can't claim.`],
  ["Can I get Marriage Allowance if my partner is a higher-rate taxpayer?", `No. The partner receiving the allowance must not pay the higher rate, so with an income over ${m0(R.upper.ruk)} (${m0(R.upper.scotland)} in Scotland) they can't receive it.`],
  ["How far back can I claim Marriage Allowance?", `To 6 April 2022, the 2022 to 2023 tax year, for any year you were both eligible. That's up to ${m0(R.maxSaving)} for each of ${esc(R.backdateYears.join(", "))}.`],
  ["What if the lower earner earns between £11,310 and £12,570?", `Transferring ${m0(R.transfer)} leaves them with a ${m0(R.personalAllowance - R.transfer)} allowance, so they pay 20% on income above that. The couple usually still saves: on ${m0(12000)} the lower earner pays ${m2(MA.calc(R, 12000, 30000, false).yourExtraTax)} and the couple saves ${m2(MA.calc(R, 12000, 30000, false).saving)}.`],
  ["What do the M and N tax codes mean?", "A tax code ending in M means you receive a transferred Marriage Allowance; one ending in N means you've transferred it to your partner. With the usual codes that's 1383M and 1131N."]
];

const title = site.fitTitle(`Marriage Allowance Calculator — Save up to £${R.maxSaving} a Year, Backdated to 2022`, "Marriage Allowance Calculator UK");
const desc = `Check if you can claim Marriage Allowance and what it saves: transfer £${R.transfer.toLocaleString("en-GB")} of Personal Allowance to your spouse for up to £${R.maxSaving} a year, plus up to £${back.toLocaleString("en-GB")} backdated to April 2022.`;
const ld = [site.webPage(title, desc, url, R.lastChecked), site.breadcrumb([["Home", SITE + "/"], ["Personal Finance", SITE + "/personal-finance/"], ["Marriage Allowance Calculator", url]]),
  { "@context": "https://schema.org", "@type": "WebApplication", name: "Marriage Allowance Calculator", url, applicationCategory: "FinanceApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } },
  site.faqLd(q)];
const SRC = (o) => `<a href="${o.url}" rel="nofollow noopener" target="_blank">${esc(o.title)}</a>`;

const html = site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="/personal-finance/">← Personal finance calculators</a>
      <h1 class="page-title">Marriage Allowance calculator</h1>
      <p class="page-subtitle">Whether you can claim, what it saves you as a couple, and what backdating to 2022 is worth.</p>
    </header>

${tool}
${body}
    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}      <p class="tool-hint" style="margin-top:12px;">A guide, not advice. Rules from ${SRC(R.source)}; Personal Allowance from ${SRC(R.paSource)}; Scotland's ${R.scot.rate}% starter rate from the Scottish tax file. Last checked ${site.niceDate(R.lastChecked)}.</p>
    </main>

${related.block(P)}
${site.FOOTER}
  </div>
  <script src="/marriage-allowance.js"></script>
</body>
</html>
`;
site.write("marriage-allowance-calculator", html);
site.sitemapBlock("marriage allowance pages", "tools/build-marriage-allowance-pages.js", [[P, "0.6"]]);
console.log(`built the Marriage Allowance calculator (${m0(R.transfer)} transfer, up to ${m0(R.maxSaving)} a year; GOV.UK example ${m0(gov.saving)})`);
