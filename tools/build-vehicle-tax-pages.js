#!/usr/bin/env node
/* The car tax (VED) calculator and a page for each tax band:

       /car-tax-calculator/
       /car-tax-calculator/band-a/ ... /band-m/   (cars registered 1 March 2001 to 31 March 2017)

       node tools/build-vehicle-tax-pages.js

   GOV.UK's rate tables are transcribed into data/uk/vehicle-tax.json with
   the rules quoted; the pages are built from the same functions the
   calculator runs (vehicle-tax.js). The build stops unless the expensive
   car extra (£440) is the difference between the two GOV.UK tables, the
   thresholds are in the quoted wording, and hand-checked examples come
   out. Runs in the monthly rebuild; rates change each 1 April. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const related = require("./related.js");
const VT = require("../vehicle-tax.js");
const { esc, SITE } = site;

const R = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/uk/vehicle-tax.json"), "utf8"));
const m = (v) => "£" + v.toLocaleString("en-GB", { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 });
const m0 = (v) => "£" + v.toLocaleString("en-GB");
const Q = (k) => R.rules[k].quote;
const EXTRA = R.expensive.year - R.standard.year;
if (!Q("expensive").includes(`extra ${m0(EXTRA)} a year`) || !Q("expensive").includes(m0(R.expensiveThreshold)) || !Q("expensive").includes(m0(R.expensiveThresholdElectric)) || !Q("fiveYears").includes(`${R.expensiveYears} years`)) throw new Error("vehicle tax: the expensive car rate, thresholds or 5 years no longer match GOV.UK's quoted wording");
/* hand-checked against the tables: new petrol 120g/km £455 then £200 (6 years £1,455); new diesel (not RDE2)
   120g/km over £40,000: £560, then £640 for 5 years (£3,760); band F £225, £123.75 for 6 months */
const ex = [[{ reg: "new", fuel: "petrol", co2: 120, listPrice: 30000 }, "sixYears", 1455], [{ reg: "new", fuel: "diesel", co2: 120, listPrice: 45000 }, "sixYears", 3760], [{ reg: "2001", fuel: "petrol", co2: 145, method: "six" }, "payment", 123.75]];
if (R.from === "2026-04-01") ex.forEach(([o, k, v]) => { const r = VT.calc(R, Object.assign({ method: "year" }, o)); if (r[k] !== v) throw new Error(`vehicle tax: ${JSON.stringify(o)} gives ${k} ${r[k]}, not ${v}`); });

const BASE = "/car-tax-calculator/", burl = (b) => `${BASE}band-${b.toLowerCase()}/`;
const SRC = R.sources.map((s) => `<a href="${s.url}" rel="nofollow noopener" target="_blank">${esc(s.title)}</a>`).join(", ");
const FROM = "1 April 2026";
const co2Text = (r) => r[1] === null ? `over ${r[0] - 1}g/km` : r[0] === 0 && r[1] === 0 ? "0g/km" : r[0] === 0 ? `up to ${r[1]}g/km` : `${r[0]} to ${r[1]}g/km`;
const pay = (r) => [m(r.year), m(r.monthlyDD), r.six === null ? "N/A" : m(r.six)];

function tool(o) {
  const opt = (v, t, sel) => `<option value="${v}"${sel ? " selected" : ""}>${t}</option>`;
  return `    <main class="tool split" id="vt-tool" data-rules="${esc(JSON.stringify(R))}">
      <div class="field-row">
        <div class="field"><label for="vt-reg">First registered</label><select id="vt-reg">${opt("new", "On or after 1 April 2025 (new car)", o.reg === "new")}${opt("2017", "1 April 2017 to 31 March 2025", o.reg === "2017")}${opt("2001", "1 March 2001 to 31 March 2017", o.reg === "2001")}${opt("pre2001", "Before 1 March 2001", o.reg === "pre2001")}</select></div>
        <div class="field" id="vt-fuel-row"><label for="vt-fuel">Fuel</label><select id="vt-fuel">${opt("petrol", "Petrol", o.fuel === "petrol")}${opt("alternative", "Hybrid or other alternative fuel", false)}${opt("electric", "Electric (zero emission)", o.fuel === "electric")}${opt("diesel", "Diesel", o.fuel === "diesel")}${opt("dieselRDE2", "Diesel meeting RDE2", false)}</select></div>
      </div>
      <div class="field-row">
        <div class="field" id="vt-co2-row"><label for="vt-co2">CO2 emissions (g/km)</label><input type="number" id="vt-co2" value="${o.co2 || 120}" min="0" step="1" inputmode="numeric"></div>
        <div class="field" id="vt-cc-row" style="display:none;"><label for="vt-cc">Engine size (cc)</label><input type="number" id="vt-cc" value="1400" min="0" step="1" inputmode="numeric"></div>
        <div class="field" id="vt-price-row"><label for="vt-price">List price when new</label><input type="number" id="vt-price" value="${o.listPrice || 30000}" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="vt-method">Paying</label><select id="vt-method">${opt("year", "12 months in one go", true)}${opt("yearDD", "12 months by Direct Debit", false)}${opt("monthlyDD", "Monthly by Direct Debit", false)}${opt("six", "6 months", false)}${opt("sixDD", "6 months by Direct Debit", false)}</select></div>
      </div>
      <p class="tool-hint" id="vt-error" role="alert" style="color: var(--bad); display: none;"></p>
      <p class="tool-hint" style="margin:6px 0 0;">The CO2 figure and first registration date are on the V5C registration certificate. Rates from ${FROM}.</p>
      <div class="result-box split-aside" aria-live="polite">
        <div class="result-hero">
          <div class="value" id="vt-pay">—</div>
          <div class="label" id="vt-label">car tax</div>
        </div>
        <hr class="divider">
        <div class="result-grid">
          <div class="result-row highlight"><span class="r-label">Car tax a year</span><span class="r-value" id="vt-annual">—</span></div>
          <div class="result-row"><span class="r-label">First payment (new car)</span><span class="r-value" id="vt-first">—</span></div>
          <div class="result-row"><span class="r-label">Each payment</span><span class="r-value" id="vt-after">—</span></div>
          <div class="result-row"><span class="r-label">First 6 years in total</span><span class="r-value" id="vt-six">—</span></div>
        </div>
        <p class="tool-hint" id="vt-note" style="margin:10px 0 0;"></p>
      </div>
    </main>
`;
}
const head = (title, desc, u, crumbs, q, app) => site.head({ title, desc, url: u, ld: [site.webPage(title, desc, u, R.lastChecked), site.breadcrumb(crumbs)].concat(app ? [app] : []).concat([site.faqLd(q)]) });
const SCRIPT = `  <script src="/vehicle-tax.js"></script>`;
const bandRows = R.bands2001.map((b) => [`<a href="${burl(b.band)}">Band ${b.band}</a>`, co2Text(b.co2)].concat(pay(b)));
const firstRows = R.firstYear.map((r) => [co2Text(r.co2), m(r.standard), m(r.diesel)]);

function bandPage(b) {
  const u = SITE + burl(b.band), i = R.bands2001.indexOf(b), prev = R.bands2001[i - 1], next = R.bands2001[i + 1];
  const title = site.fitTitle(`Tax Band ${b.band} Car Tax — ${m(b.year)} a Year (${co2Text(b.co2)})`, `Band ${b.band} Car Tax — ${m(b.year)} a Year`);
  const desc = `Car tax band ${b.band} (${co2Text(b.co2)}, cars registered 1 March 2001 to 31 March 2017) costs ${m(b.year)} for 12 months${b.six === null ? "" : `, ${m(b.six)} for 6 months`}, or ${m(b.monthlyDD)} in total by monthly Direct Debit, from ${FROM}.`;
  const q = [
    [`How much is band ${b.band} car tax?`, `${m(b.year)} for 12 months from ${FROM}, or ${m(b.monthlyDD)} in total paid monthly by Direct Debit.${b.six === null ? " There's no 6-month option in this band." : ` 6 months costs ${m(b.six)} (${m(b.sixDD)} by Direct Debit).`}`],
    [`Which cars are in tax band ${b.band}?`, `Cars first registered between 1 March 2001 and 31 March 2017 with CO2 emissions of ${co2Text(b.co2)}${b.band === "K" ? ", plus cars over 225g/km registered before 23 March 2006" : ""}. The CO2 figure is on the V5C registration certificate.`],
    ["Does a newer car pay the same?", `No. Cars registered from 1 April 2017 pay a first payment based on CO2, then the standard rate of ${m(R.standard.year)} a year, plus ${m0(EXTRA)} a year for 5 years if the list price was over ${m0(R.expensiveThreshold)} (${m0(R.expensiveThresholdElectric)} for an electric car).`]
  ];
  const nav = [prev && `<a href="${burl(prev.band)}">← Band ${prev.band}</a>`, next && `<a href="${burl(next.band)}">Band ${next.band} →</a>`].filter(Boolean).join(" ");
  return head(title, desc, u, [["Home", SITE + "/"], ["Car Tax Calculator", SITE + BASE], [`Band ${b.band}`, u]], q) + `    <header class="site-header">
      <a class="back-link" href="${BASE}">← Car tax calculator</a>
      <h1 class="page-title">Tax band ${b.band}: ${m(b.year)} a year</h1>
      <p class="page-subtitle">Car tax for band ${b.band} (${co2Text(b.co2)}), for cars registered 1 March 2001 to 31 March 2017, from ${FROM}.</p>
    </header>

${tool({ reg: "2001", fuel: "petrol", co2: b.co2[1] === null ? b.co2[0] + 10 : b.co2[1] })}
    <main class="tool">
      <h2 class="tool-section-title">Band ${b.band} car tax</h2>
${site.table(["Paying", "Cost"], [["12 months", m(b.year)], ["12 months by Direct Debit", m(b.yearDD)], ["12 monthly Direct Debits, in total", m(b.monthlyDD)], ["6 months", b.six === null ? "Not available" : m(b.six)], ["6 months by Direct Debit", b.sixDD === null ? "Not available" : m(b.sixDD)]], 420)}      <p class="salary-links" style="margin-top:10px;">${nav}</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}      <p class="tool-hint" style="margin-top:12px;">Rates from GOV.UK: ${SRC}. Last checked ${site.niceDate(R.lastChecked)}.</p>
    </main>

${site.FOOTER}
  </div>
${SCRIPT}
</body>
</html>
`;
}

function hub() {
  const u = SITE + BASE, ex1 = VT.calc(R, { reg: "new", fuel: "petrol", co2: 120, listPrice: 30000, method: "year" });
  const title = site.fitTitle("Car Tax Calculator UK — How Much Is My Vehicle Tax? (VED)", "Car Tax Calculator UK");
  const desc = `Work out UK car tax (VED) from ${FROM}: the first payment by CO2, the ${m(R.standard.year)} standard rate, the extra ${m0(EXTRA)} on cars over ${m0(R.expensiveThreshold)}, and bands A to M for older cars.`;
  const q = [
    ["How much is car tax a year?", `For cars registered from 1 April 2017, the standard rate is ${m(R.standard.year)} a year from ${FROM}, for petrol, diesel, electric and alternative fuel cars alike. Older cars pay by CO2 band (${m(R.bands2001[0].year)} to ${m(R.bands2001[R.bands2001.length - 1].year)}) or engine size.`],
    ["Do electric cars pay car tax?", `Yes. An electric car registered now pays ${m(VT.firstYear(R, "electric", 0))} for the first year, then the standard ${m(R.standard.year)}. The extra ${m0(EXTRA)} applies if its list price was over ${m0(R.expensiveThresholdElectric)}, but not to a zero emission car registered before 1 April 2025.`],
    ["What is the expensive car tax?", `An extra ${m0(EXTRA)} a year on top of the standard rate, for 5 years from the second time the car is taxed, if its list price was over ${m0(R.expensiveThreshold)} (${m0(R.expensiveThresholdElectric)} for an electric car). The list price is the published price before any discounts.`],
    ["How much is the first year's car tax?", `It depends on CO2: from ${m(R.firstYear[0].standard)} at 0g/km to ${m(R.firstYear[R.firstYear.length - 1].standard)} over 255g/km. Diesels that don't meet RDE2 pay more. A 120g/km petrol car pays ${m(ex1.first)}.`],
    ["Is it cheaper to pay car tax monthly?", `No, slightly dearer: ${m(R.standard.year)} in one go or ${m(R.standard.monthlyDD)} in total by monthly Direct Debit, at the standard rate.`]
  ];
  const app = { "@context": "https://schema.org", "@type": "WebApplication", name: "Car Tax Calculator", url: u, applicationCategory: "FinanceApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } };
  return head(title, desc, u, [["Home", SITE + "/"], ["Everyday", SITE + "/everyday/"], ["Car Tax Calculator", u]], q, app) + `    <header class="site-header">
      <a class="back-link" href="/everyday/">← Everyday calculators</a>
      <h1 class="page-title">Car tax calculator</h1>
      <p class="page-subtitle">How much vehicle tax (VED) you'll pay on a car in the UK, from ${FROM}.</p>
    </header>

${tool({ reg: "new", fuel: "petrol", co2: 120, listPrice: 30000 })}
    <main class="tool">
      <h2 class="tool-section-title">Cars registered from 1 April 2017</h2>
      <p class="about-text">The first payment, when the car is registered, depends on its CO2 emissions and covers 12 months. After that it's the <strong>standard rate of ${m(R.standard.year)} a year</strong> for petrol, diesel, electric and alternative fuel cars (hybrids, bioethanol and LPG). If the list price was over ${m0(R.expensiveThreshold)} (${m0(R.expensiveThresholdElectric)} for an electric car), you pay an extra ${m0(EXTRA)} a year, ${m(R.expensive.year)} in all, for 5 years from the second time it's taxed; a zero emission car registered before 1 April 2025 doesn't.</p>
      <h3 class="tool-section-title" style="margin-top:14px;">First payment by CO2</h3>
${site.table(["CO2", "Petrol, alternative fuel, electric, RDE2 diesel", "Other diesels"], firstRows, 560)}      <h2 class="tool-section-title" style="margin-top:18px;">Cars registered 1 March 2001 to 31 March 2017</h2>
${site.table(["Band", "CO2", "12 months", "Monthly DD (total)", "6 months"], bandRows, 620)}      <p class="tool-hint" style="margin-top:8px;">Band K includes cars over 225g/km registered before 23 March 2006. Cars registered before 1 March 2001 pay ${m(R.pre2001[0].year)} (up to 1549cc) or ${m(R.pre2001[1].year)} (over 1549cc).</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(q)}      <p class="tool-hint" style="margin-top:12px;">Rates from GOV.UK: ${SRC}. Last checked ${site.niceDate(R.lastChecked)}.</p>
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
site.write("car-tax-calculator", hub());
R.bands2001.forEach((b) => { site.write(`car-tax-calculator/band-${b.band.toLowerCase()}`, bandPage(b)); urls.push([burl(b.band), "0.5"]); });
site.sitemapBlock("car tax pages", "tools/build-vehicle-tax-pages.js", urls);
console.log(`built the car tax calculator and ${R.bands2001.length} band pages (standard rate ${m(R.standard.year)}, from ${FROM})`);
