#!/usr/bin/env node
/* The company car tax (benefit in kind) calculator and a page for each
   kind of car:

       /company-car-tax-calculator/
       /company-car-tax-calculator/electric/  plug-in-hybrid/  petrol/  diesel/

       node tools/build-company-car-pages.js

   HMRC's appropriate percentages (480 Appendix 2) are in
   data/uk/company-car.json with the calculation steps quoted from 480
   Chapter 12; the pages are built from the same functions the calculator
   runs (company-car.js). Income tax rates come from the UK and Scottish tax
   files in force. The build stops unless HMRC's quoted figures match the
   stored ones and hand-checked examples come out the same. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const related = require("./related.js");
const registry = require("./tax/registry.js");
const CC = require("../company-car.js");
const { esc, SITE } = site;

const R = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/uk/company-car.json"), "utf8"));
const EMP = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/uk/employer-cost.json"), "utf8"));
const all = registry.readAll(), current = registry.currentFiles(all);
const YEAR = current.gb.doc.taxYear.label;
const m2 = (v) => "£" + v.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const m0 = (v) => "£" + Math.round(v).toLocaleString("en-GB");
const Q = (k) => R.rules[k].quote;
const YEARS = Object.keys(R.tables).sort().reverse();
if (!R.tables[YEAR]) throw new Error(`company car: no appropriate percentage table for ${YEAR} in data/uk/company-car.json; add HMRC's new table from 480 Appendix 2`);
const CLASS1A = EMP.ni.rate;
if (!R.rules.class1a.quote.includes(`${CLASS1A}%`) || !Q("dieselExample").includes(`Add ${R.dieselSupplement}% diesel supplement`) || !Q("capital").includes(m0(R.capitalMax))) throw new Error("company car: Class 1A, the diesel supplement or the £5,000 cap no longer match HMRC's quoted wording");
const maxRow = R.tables[YEAR][R.tables[YEAR].length - 1];
if (maxRow.co2[1] !== null || maxRow.pct !== R.maxPct) throw new Error(`company car: the top band for ${YEAR} isn't ${R.maxPct}%`);

/* the income tax rates from the tax files, for the rate choice */
const bracketsOf = (id) => registry.chainFor(current[id].doc, all).map((f) => f.doc || f).flatMap((d) => (d.items || []).filter((i) => i.id === "gb-income-tax").map((i) => i.charge.brackets)).pop();
const RATES = [["", bracketsOf("gb")], ["Scotland: ", bracketsOf("gb-sct")]].flatMap(([pre, b]) => b.map((x) => ({ rate: x[1], label: `${pre}${x[2].toLowerCase()} (${x[1]}%)` })));
if (!RATES.length) throw new Error("company car: couldn't read the income tax rates from the UK tax files");

/* hand-checked, 2026/27: petrol 104g/km on £30,000: 26% → £7,800, £3,120 at 40%.
   Electric £40,000 + £500 accessories − £5,000 (of £6,000) contribution = £35,500 × 4% = £1,420,
   × 292/365 (73 days unavailable) = £1,136, − £100 private use = £1,036; £207.20 at 20% */
const ex1 = CC.calc(R, { year: "2026/27", fuel: "petrol", co2: 104, listPrice: 30000, taxRate: 40 });
const ex2 = CC.calc(R, { year: "2026/27", fuel: "electric", listPrice: 40000, accessories: 500, capital: 6000, unavailable: 73, privateUse: 100, taxRate: 20 });
if (ex1.benefit !== 7800 || ex1.tax !== 3120 || ex2.benefit !== 1036 || ex2.tax !== 207.2) throw new Error("company car: a hand-checked 2026/27 example no longer comes out");

const BASE = "/company-car-tax-calculator/";
const KINDS = {
  electric: { name: "Electric", h1: "Electric company car tax", fuel: "electric", co2: 0, range: 0, price: 40000, prices: [25000, 30000, 35000, 40000, 50000, 60000, 80000] },
  "plug-in-hybrid": { name: "Plug-in hybrid", h1: "Plug-in hybrid company car tax", fuel: "petrol", co2: 30, range: 45, price: 45000, prices: [30000, 35000, 40000, 45000, 50000, 60000] },
  petrol: { name: "Petrol", h1: "Petrol company car tax", fuel: "petrol", co2: 130, range: 0, price: 30000, prices: [20000, 25000, 30000, 35000, 40000, 50000] },
  diesel: { name: "Diesel", h1: "Diesel company car tax", fuel: "diesel", co2: 130, range: 0, price: 30000, prices: [20000, 25000, 30000, 35000, 40000, 50000] }
};
const kurl = (k) => `${BASE}${k}/`;
const SRC = R.sources.slice(0, 4).map((s) => `<a href="${s.url}" rel="nofollow noopener" target="_blank">${esc(s.title)}</a>`).join(", ");
const RULES = { tables: R.tables, dieselSupplement: R.dieselSupplement, maxPct: R.maxPct, capitalMax: R.capitalMax, class1aRate: CLASS1A };
const pctOf = (k, y) => { const K = KINDS[k]; return CC.pct(R, y || YEAR, K.fuel, K.co2, K.range); };
const taxOn = (k, price, rate) => { const K = KINDS[k]; return CC.calc(R, { year: YEAR, fuel: K.fuel, co2: K.co2, range: K.range, listPrice: price, taxRate: rate }); };

function tool(k) {
  const K = KINDS[k], r = taxOn(k, K.price, 20);
  const opt = (v, t, sel) => `<option value="${v}"${sel ? " selected" : ""}>${t}</option>`;
  return `    <main class="tool split" id="cc-tool" data-rules="${esc(JSON.stringify(RULES))}">
      <div class="field-row">
        <div class="field"><label for="cc-price">List price (including VAT and delivery)</label><input type="number" id="cc-price" value="${K.price}" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="cc-fuel">Fuel</label><select id="cc-fuel">${opt("electric", "Electric (zero emissions)", K.fuel === "electric")}${opt("petrol", "Petrol or hybrid", K.fuel === "petrol")}${opt("diesel", "Diesel", K.fuel === "diesel")}${opt("dieselRDE2", "Diesel meeting Euro 6d (RDE2)", false)}</select></div>
      </div>
      <div class="field-row">
        <div class="field" id="cc-co2-row"${K.fuel === "electric" ? ' style="display:none;"' : ""}><label for="cc-co2">CO2 emissions (g/km)</label><input type="number" id="cc-co2" value="${K.co2 || 120}" min="0" step="1" inputmode="numeric"></div>
        <div class="field" id="cc-range-row"${K.range ? "" : ' style="display:none;"'}><label for="cc-range">Electric range (miles)</label><input type="number" id="cc-range" value="${K.range || 40}" min="0" step="1" inputmode="numeric"></div>
        <div class="field"><label for="cc-rate">Your Income Tax rate</label><select id="cc-rate">${RATES.map((x) => opt(x.rate, x.label, x.label === "basic rate (20%)")).join("")}</select></div>
        <div class="field"><label for="cc-year">Tax year</label><select id="cc-year">${YEARS.map((y) => opt(y, y, y === YEAR)).join("")}</select></div>
      </div>
      <div class="field-row">
        <div class="field"><label for="cc-acc">Optional accessories</label><input type="number" id="cc-acc" value="0" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="cc-capital">You paid towards the car (up to ${m0(R.capitalMax)} counts)</label><input type="number" id="cc-capital" value="0" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="cc-days">Days it wasn't available</label><input type="number" id="cc-days" value="0" min="0" max="366" step="1" inputmode="numeric"></div>
        <div class="field"><label for="cc-private">You pay for private use, a year</label><input type="number" id="cc-private" value="0" min="0" step="any" inputmode="decimal"></div>
      </div>
      <p class="tool-hint" id="cc-error" role="alert" style="color: var(--bad); display: none;"></p>
      <p class="tool-hint" style="margin:6px 0 0;">Days it wasn't available count before you got the car, after you gave it back, or in a spell of 30 days or more. Fuel your employer pays for is taxed separately.</p>
      <div class="result-box split-aside" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="cc-tax">${m2(r.tax)}</div>
          <div class="label" id="cc-label">company car tax a year at 20% (${YEAR})</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row"><span class="r-label">Appropriate percentage</span><span class="r-value" id="cc-pct">${r.pct}%</span></div>
          <div class="result-row highlight"><span class="r-label">Taxable benefit (P11D value)</span><span class="r-value" id="cc-benefit">${m2(r.benefit)}</span></div>
          <div class="result-row"><span class="r-label">Tax a month</span><span class="r-value" id="cc-month">${m2(r.monthly)}</span></div>
          <div class="result-row"><span class="r-label">Employer's Class 1A NI (${CLASS1A}%)</span><span class="r-value" id="cc-1a">${m2(r.benefit * CLASS1A / 100)}</span></div>
        </div>
      </div>
    </main>
`;
}
const steps = `    <main class="tool">
      <h2 class="tool-section-title">How company car tax is worked out</h2>
      <p class="about-text">The taxable benefit is the car's <strong>list price</strong>, plus optional accessories, less anything you paid towards it (up to ${m0(R.capitalMax)}), multiplied by its <strong>appropriate percentage</strong>. The percentage depends on the car's CO2 emissions and, for cars emitting 1 to 50g/km, its electric range. Diesels that don't meet Euro 6d (RDE2) add ${R.dieselSupplement}%, up to the ${R.maxPct}% maximum. The benefit is reduced for days the car wasn't available (before you got it, after you gave it back, or a spell of 30 days or more) and by anything you pay for private use. You pay Income Tax on it at your rate, usually through your tax code, and your employer pays Class 1A National Insurance at ${CLASS1A}%.</p>
      <p class="about-text">Some plug-in hybrids are treated as emitting 1g/km: those registered from 1 January 2025 to 5 April 2028 with 51g/km or more on the registration certificate, an electric range of at least 1 mile, and no Euro 6d-ISC-FCM or Euro 6e in the Euro status section. Fuel your employer pays for private journeys is taxed separately. Rates already set: electric cars rise by 2 percentage points a year in 2028/29 and 2029/30, and 1 to 50g/km hybrids go to 18% and 19%.</p>
    </main>
`;
const head = (title, desc, u, crumbs, q, app) => site.head({ title, desc, url: u, ld: [site.webPage(title, desc, u, R.lastChecked), site.breadcrumb(crumbs)].concat(app ? [app] : []).concat([site.faqLd(q)]) });
const SCRIPT = `  <script src="/company-car.js"></script>`;
const pctTable = () => {
  const rows = R.tables[YEAR].map((r, i) => {
    const prev = (R.tables[YEARS[1]] || [])[i], co2 = r.co2[1] === null ? `${r.co2[0]} and above` : r.co2[0] === r.co2[1] ? `${r.co2[0]} (electric)` : `${r.co2[0]} to ${r.co2[1]}`;
    const range = r.range ? (r.range[1] === null ? `${r.range[0]}+ miles` : r.range[0] === 0 ? `under ${r.range[1] + 1} miles` : `${r.range[0]} to ${r.range[1]} miles`) : "";
    return [co2, range, prev ? prev.pct + "%" : "", `<strong>${r.pct}%</strong>`];
  });
  return site.table(["CO2 (g/km)", "Electric range", YEARS[1] || "", YEAR], rows, 560);
};

function kindPage(k) {
  const K = KINDS[k], u = SITE + kurl(k), p = pctOf(k), rates = [20, 40, 45];
  const rows = K.prices.map((pr) => [m0(pr), m2(pr * p / 100)].concat(rates.map((t) => m2(taxOn(k, pr, t).tax))));
  const desc0 = k === "electric" ? `${p}% of the list price in ${YEAR}` : k === "plug-in-hybrid" ? `${p}% of the list price in ${YEAR} for a 30g/km plug-in hybrid with a 45-mile electric range` : `${p}% of the list price in ${YEAR} at ${K.co2}g/km`;
  const ex = taxOn(k, K.price, 20), ex40 = taxOn(k, K.price, 40);
  const title = site.fitTitle(`${K.name} Company Car Tax ${YEAR} — BIK Rates and Calculator`, `${K.name} Company Car Tax ${YEAR}`);
  const desc = `${K.name} company car tax: the taxable benefit is ${desc0}. On a ${m0(K.price)} car that's ${m2(ex.tax)} a year at 20% or ${m2(ex40.tax)} at 40%.`;
  const q = [
    [`What is the BIK rate for ${k === "electric" ? "an electric" : `a ${K.name.toLowerCase()}`} company car in ${YEAR}?`, k === "electric" ? `${p}% of the list price (${pctOf(k, YEARS[1])}% in ${YEARS[1]}).` : k === "plug-in-hybrid" ? `It depends on the electric range: for 1 to 50g/km, from ${CC.pct(R, YEAR, "petrol", 30, 130)}% with 130 miles or more to ${CC.pct(R, YEAR, "petrol", 30, 10)}% under 30 miles. Above 50g/km it follows the CO2 bands.` : k === "diesel" ? `The CO2 band's percentage plus ${R.dieselSupplement}% unless the car meets Euro 6d (RDE2), up to ${R.maxPct}%. At ${K.co2}g/km that's ${p}%.` : `It follows the CO2 band, up to ${R.maxPct}%. At ${K.co2}g/km it's ${p}%.`],
    [`How much tax is there on a ${m0(K.price)} ${K.name.toLowerCase()} company car?`, `The benefit is ${m2(ex.benefit)} a year, so ${m2(ex.tax)} at 20%, ${m2(ex40.tax)} at 40% and ${m2(taxOn(k, K.price, 45).tax)} at 45% (${YEAR}${k === "electric" ? "" : `, ${K.co2}g/km`}${K.range ? `, ${K.range}-mile range` : ""}).`],
    ["How do I pay company car tax?", "Usually through your tax code: HMRC updates it so the tax comes out of your pay. Tell HMRC if your car or fuel details change, for example when you get a company car or give one back."],
    ["Does my employer pay anything?", `Yes: Class 1A National Insurance at ${CLASS1A}% of the benefit, ${m2(ex.benefit * CLASS1A / 100)} on this car.`]
  ];
  const others = Object.keys(KINDS).filter((x) => x !== k).map((x) => `<a href="${kurl(x)}">${KINDS[x].name}</a>`).join(" ");
  return head(title, desc, u, [["Home", SITE + "/"], ["Company Car Tax Calculator", SITE + BASE], [KINDS[k].name, u]], q) + `    <header class="site-header">
      <a class="back-link" href="${BASE}">← Company car tax calculator</a>
      <h1 class="page-title">${K.h1} ${esc(YEAR)}</h1>
      <p class="page-subtitle">The taxable benefit is <strong>${desc0}</strong>.</p>
    </header>

${tool(k)}
    <main class="tool">
      <h2 class="tool-section-title">${K.name} company car tax by list price</h2>
${site.table(["List price", "Taxable benefit", "Tax at 20%", "At 40%", "At 45%"], rows, 620)}      <p class="tool-hint" style="margin-top:8px;">A year, ${esc(YEAR)}, ${k === "electric" ? "zero emissions" : `${K.co2}g/km`}${K.range ? `, ${K.range}-mile electric range` : ""}${k === "diesel" ? ", not Euro 6d" : ""}, no accessories, contributions or private use payments.</p>
    </main>

${steps}
    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}      <p class="tool-hint" style="margin-top:12px;">A guide, not advice. Rules from HMRC: ${SRC}. Last checked ${site.niceDate(R.lastChecked)}.</p>
    </main>

    <div class="hub-group-title" style="margin-top:28px;">Other cars</div>
    <p class="salary-links">${others}</p>

${site.FOOTER}
  </div>
${SCRIPT}
</body>
</html>
`;
}

function hub() {
  const u = SITE + BASE, ev = taxOn("electric", 40000, 20);
  const kinds = Object.keys(KINDS).map((k) => [`<a href="${kurl(k)}">${KINDS[k].name}</a>`, pctOf(k) + "%", m2(taxOn(k, 35000, 20).tax), m2(taxOn(k, 35000, 40).tax)]);
  const title = site.fitTitle(`Company Car Tax Calculator ${YEAR} — Benefit in Kind (BIK)`, `Company Car Tax Calculator ${YEAR}`);
  const desc = `Work out company car tax (benefit in kind) for ${YEAR} from the list price, CO2 and electric range: electric cars are ${pctOf("electric")}%, so a ${m0(40000)} car costs ${m2(ev.tax)} a year at 20%.`;
  const q = [
    ["How is company car tax calculated?", `List price plus accessories, less up to ${m0(R.capitalMax)} you paid towards it, times the appropriate percentage for its CO2 (and electric range for 1 to 50g/km). Then reductions for days it wasn't available and payments for private use. The result is taxed at your Income Tax rate.`],
    [`What is the BIK rate for electric cars in ${YEAR}?`, `${pctOf("electric")}% (it was ${pctOf("electric", YEARS[1])}% in ${YEARS[1]}). It rises by 2 percentage points a year in 2028/29 and 2029/30.`],
    ["What is the diesel supplement?", `${R.dieselSupplement}% added to the appropriate percentage for diesel cars that don't meet Euro 6d (RDE2), up to the ${R.maxPct}% maximum.`],
    ["Is fuel included?", "No. If your employer pays for fuel for private journeys, that's a separate taxable benefit."],
    ["What list price is used?", "The manufacturer's published price on the day before the car was first registered, including standard accessories, VAT and delivery but not the registration fee. It isn't the price paid, which may include discounts. Second-hand cars use the same list price as when new."]
  ];
  const app = { "@context": "https://schema.org", "@type": "WebApplication", name: "Company Car Tax Calculator", url: u, applicationCategory: "FinanceApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } };
  return head(title, desc, u, [["Home", SITE + "/"], ["Personal Finance", SITE + "/personal-finance/"], ["Company Car Tax Calculator", u]], q, app) + `    <header class="site-header">
      <a class="back-link" href="/personal-finance/">← Personal finance calculators</a>
      <h1 class="page-title">Company car tax calculator</h1>
      <p class="page-subtitle">The benefit in kind on a company car and the tax you pay on it (${esc(YEAR)}).</p>
    </header>

${tool("petrol")}
    <main class="tool">
      <h2 class="tool-section-title">By kind of car</h2>
${site.table(["Car", "Appropriate percentage", `${m0(35000)} car at 20%`, "At 40%"], kinds, 560)}      <h2 class="tool-section-title" style="margin-top:18px;">Appropriate percentages</h2>
${pctTable()}      <p class="tool-hint" style="margin-top:8px;">HMRC's table for petrol and hybrid cars (WLTP and NEDC are the same from 2022/23). Diesels not meeting Euro 6d add ${R.dieselSupplement}%, up to ${R.maxPct}%.</p>
    </main>

${steps}
    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}      <p class="tool-hint" style="margin-top:12px;">A guide, not advice. Rules from HMRC: ${SRC}. Last checked ${site.niceDate(R.lastChecked)}.</p>
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
site.write("company-car-tax-calculator", hub());
Object.keys(KINDS).forEach((k) => { site.write(`company-car-tax-calculator/${k}`, kindPage(k)); urls.push([kurl(k), "0.5"]); });
site.sitemapBlock("company car tax pages", "tools/build-company-car-pages.js", urls);
console.log(`built the company car tax calculator and ${Object.keys(KINDS).length} pages (${YEAR}: electric ${pctOf("electric")}%, petrol 130g/km ${pctOf("petrol")}%)`);
