#!/usr/bin/env node
/* Expat tax scheme calculators, with their tables worked out in the HTML:

       /30-percent-ruling-calculator/   the Netherlands' 30% ruling (expatregeling)
       /beckham-law-calculator/         Spain's special regime for workers moving there

       node tools/build-expat-pages.js

   Both run through tax-engine.js with the country's own tax file, where the
   scheme is an option (nl: ruling30, es: regime), so the figures match the
   salary calculator and the monthly tax check keeps them current. Runs in
   the monthly rebuild. */
const site = require("./lib/site.js");
const related = require("./related.js");
const TaxEngine = require("../tax-engine.js");
const registry = require("./tax/registry.js");
const { esc, SITE } = site;

const all = registry.readAll(), current = registry.currentFiles(all);
const m0 = (v) => TaxEngine.money(v, "EUR", true), m = (v) => TaxEngine.money(v, "EUR");
const pct1 = (v) => (Math.round(v * 10) / 10).toFixed(1) + "%";

function taxOf(r) { return r.charges.filter((c) => c.group === "tax").reduce((a, c) => a + c.amount, 0); }
function socialOf(r) { return r.charges.filter((c) => c.group === "social").reduce((a, c) => a + c.amount, 0); }

function setup(id) {
  const doc = current[id].doc, chain = registry.chainFor(doc, all);
  return { doc, chain, year: doc.taxYear.label, checked: doc.lastChecked, run: (g, o) => TaxEngine.compute(chain, g, o || {}) };
}

/* the figures the pages quote, read from the tax files so they can't drift */
function nlFacts(t) {
  const item = t.doc.items.find((x) => x.id === "nl-30-allowance").value.cases;
  return { cap: item.research.of.min[1], pct: item.research.pct, norm: item.yes.min[1].max[1].sub[1], normYoung: item.young.min[1].max[1].sub[1] };
}
function esFacts(t) {
  const b = t.doc.items.find((x) => x.id === "es-state-tax").charge.cases.beckham.of.brackets;
  return { low: b[0][1], high: b[1][1], band: b[1][0] };
}

const PAGES = {
  nl: {
    id: "nl", path: "/30-percent-ruling-calculator/", key: "ruling30", off: "no", on: "yes", name: "The 30% ruling", offLabel: "Without the 30% ruling",
    salaries: [50000, 60000, 70000, 80000, 90000, 100000, 120000, 150000, 200000, 262000, 300000],
    example: 80000,
    page(t) {
      const f = nlFacts(t), ex = this.example, a = t.run(ex), b = t.run(ex, { ruling30: "yes" });
      const allowance = b.values["nl-30-allowance"], d = b.net - a.net;
      const atNorm = t.run(60000, { ruling30: "yes" }).values["nl-30-allowance"];
      const title = `30% Ruling Calculator ${t.year} — Dutch Take-Home Pay With and Without`;
      const desc = `Dutch take-home pay with and without the 30% ruling: on ${m0(ex)} it's worth ${m0(d)} a year. ${t.year} salary norm ${m0(f.norm)}, allowance capped at ${m0(f.cap * f.pct / 100)}.`;
      const options = Object.entries(t.doc.options.ruling30.choices).filter(([k]) => k !== "no")
        .map(([k, v]) => `<option value="${k}"${k === "yes" ? " selected" : ""}>${esc(v.replace(/^Yes — /, ""))}</option>`).join("");
      return {
        title, desc, h1: "30% ruling calculator",
        sub: "Your take-home pay in the Netherlands with and without the 30% ruling (expatregeling), on the " + t.year + " tax rates.",
        fields: `      <div class="field-row">
        <div class="field"><label for="ex-salary">Salary a year (€, including the allowance)</label><input type="number" id="ex-salary" value="${ex}" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="ex-variant">Which salary norm applies</label><select id="ex-variant" data-option="ruling30">${options}</select></div>
      </div>`,
        allowanceRow: `          <div class="result-row"><span class="r-label">Tax-free allowance</span><span class="r-value" id="ex-allowance">${m0(allowance)}</span></div>\n`,
        socialRow: false,
        a, b, d, ex,
        tableHead: ["Salary", "Tax-free allowance", "Take-home without", "Take-home with", "Better off a year", "A month"],
        tableRow(g) {
          const x = t.run(g), y = t.run(g, { ruling30: "yes" });
          return [m0(g), m0(y.values["nl-30-allowance"]), m0(x.net), m0(y.net), m0(y.net - x.net), m(( y.net - x.net) / 12)];
        },
        explain: `      <h2 class="tool-section-title">How the 30% ruling works</h2>
      <p class="about-text">If you're recruited from abroad for a job in the Netherlands, your employer can pay up to ${f.pct}% of your salary as a tax-free allowance for the extra costs of living away from home (the <em>expatregeling</em>). The ${f.pct}% is of your pay <em>including</em> the allowance: on ${m0(ex)}, ${m0(allowance)} is paid tax-free and income tax is worked out on the other ${m0(ex - allowance)}.</p>
      <p class="about-text"><strong>The salary norm.</strong> What's left after the allowance must still be more than ${m0(f.norm)} a year in ${t.year} (${m0(f.normYoung)} if you're under 30 and have a master's degree; there's no minimum for scientific researchers). Close to the norm the allowance is cut back to keep you above it — on €60,000 it's ${m0(atNorm)}, not ${m0(60000 * f.pct / 100)}.</p>
      <p class="about-text"><strong>The cap.</strong> The allowance is only paid on salary up to ${m0(f.cap)} — the top-salary limit (WNT norm) — so the most it can be is ${m0(f.cap * f.pct / 100)} for a full year.</p>
      <p class="about-text"><strong>How long.</strong> Up to 5 years, less any time you've already lived or worked in the Netherlands. You must have lived more than 150 km from the Dutch border for more than 16 of the 24 months before you started, and your employer applies to the Belastingdienst for it.</p>
      <p class="about-text"><strong>What's changing.</strong> The maximum stays at 30% in 2025 and 2026 and drops to 27% from 2027, with a higher salary norm for anyone who started using the ruling from 2025. People who had it by the end of 2023 keep 30% and the current norm for their whole 5 years.</p>`,
        faq: [
          ["What is the 30% ruling?", `A Dutch tax concession for employees recruited from abroad: the employer can pay up to ${f.pct}% of salary as a tax-free allowance for 5 years, so income tax is only charged on the rest. It's officially called the expatregeling (30%-regeling).`],
          ["How much is the 30% ruling worth?", `On ${m0(ex)} a year it adds ${m0(d)} to your take-home pay — ${m(d / 12)} a month. Because the tax saved is at your top rate on the allowance, it's worth more the more you earn, up to the cap on ${m0(f.cap)} of salary.`],
          [`What is the 30% ruling salary norm for ${t.year}?`, `Your salary not counting the tax-free allowance must be more than ${m0(f.norm)} a year in ${t.year}, or ${m0(f.normYoung)} if you're under 30 with a master's degree. Scientific researchers at designated institutions have no minimum.`],
          ["Is the 30% ruling being reduced?", "Yes, from 2027: the maximum falls from 30% to 27%, and a higher salary norm applies to people who started using it from 2025. It stays at 30% in 2025 and 2026, and people who had it by the end of 2023 keep 30% for their whole term."],
          ["Do I still get the tax credits with the 30% ruling?", "Yes. The general tax credit and the labour tax credit are worked out on your taxable pay — the salary less the allowance — so on a high salary you can get slightly more of them than you would without the ruling."],
          ["Can I still choose partial non-resident status?", "Not any more for new users: from the 2025 tax return the option of being treated as a partial non-resident for savings and investments (box 2 and box 3) was abolished. People who used the ruling before 2024 can keep it until their 2026 return."]
        ],
        links: `<a href="/salary/netherlands/">Netherlands salary calculator</a> (choose the 30% ruling there too)`
      };
    }
  },
  es: {
    id: "es", path: "/beckham-law-calculator/", key: "regime", off: "standard", on: "beckham", name: "The Beckham law", offLabel: "Normal income tax (IRPF)",
    salaries: [40000, 50000, 60000, 70000, 80000, 100000, 120000, 150000, 200000, 300000, 600000, 1000000],
    example: 100000,
    page(t) {
      const f = esFacts(t), ex = this.example, a = t.run(ex), b = t.run(ex, { regime: "beckham" }), d = b.net - a.net;
      /* the salary above which the regime starts to pay, in the default region */
      let lo = 20000, hi = 200000;
      for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (t.run(mid, { regime: "beckham" }).net > t.run(mid).net) hi = mid; else lo = mid; }
      const breakEven = Math.round(hi / 1000) * 1000;
      const regions = t.doc.options.region;
      const options = Object.entries(regions.choices).map(([k, v]) => `<option value="${k}"${k === regions.default ? " selected" : ""}>${esc(v)}</option>`).join("");
      const regionName = regions.choices[regions.default];
      const title = `Beckham Law Calculator ${t.year} — Spain's ${f.low}% Flat Tax vs Normal IRPF`;
      const desc = `Beckham law or normal IRPF? On ${m0(ex)} the ${f.low}% flat tax saves ${m0(d)} a year, but below about ${m0(breakEven)} it costs you more. ${t.year} rates by region.`;
      return {
        title, desc, h1: "Beckham law calculator",
        sub: `Your take-home pay in Spain under the special regime for workers moving there (the Beckham law) and under normal income tax, on the ${t.year} rates.`,
        fields: `      <div class="field-row">
        <div class="field"><label for="ex-salary">Salary a year (€)</label><input type="number" id="ex-salary" value="${ex}" min="0" step="any" inputmode="decimal"></div>
        <div class="field"><label for="ex-region">Region (for normal income tax)</label><select id="ex-region" data-option="region">${options}</select></div>
      </div>`,
        allowanceRow: "",
        socialRow: true,
        a, b, d, ex,
        tableHead: ["Salary", "Tax normally", "Tax, Beckham law", "Take-home normally", "Take-home, Beckham law", "Difference a year"],
        tableRow(g) {
          const x = t.run(g), y = t.run(g, { regime: "beckham" }), dd = y.net - x.net;
          return [m0(g), m0(taxOf(x)), m0(taxOf(y)), m0(x.net), m0(y.net), (dd >= 0 ? "+" : "−") + m0(Math.abs(dd))];
        },
        tableNote: `Normal income tax for ${esc(regionName)}, single, no children. Social security is the same either way.`,
        explain: `      <h2 class="tool-section-title">How the Beckham law works</h2>
      <p class="about-text">Spain's special regime for workers moving there (<em>régimen especial para trabajadores desplazados</em>, article 93 of the income tax law — nicknamed after David Beckham, one of the first to use it) taxes your Spanish employment income at a flat <strong>${f.low}% up to ${m0(f.band)}</strong> and <strong>${f.high}% above</strong>, instead of the normal progressive IRPF scales.</p>
      <p class="about-text"><strong>It's on gross pay.</strong> The ${f.low}% is charged on your whole salary: there's no personal allowance, no reduction for employment income and no deduction for social security, and the regional scales don't apply (the tax is split half to the state and half to your region on the return, but the rate is the same everywhere). That's why it only pays off above about ${m0(breakEven)} in ${esc(regionName)} — below that, normal income tax with its allowances comes out lower.</p>
      <p class="about-text"><strong>Who can use it.</strong> You mustn't have been resident in Spain in the previous 5 tax years, and you must be moving for a job with a Spanish employer (or one that posts you there, or remote work for a foreign company under Spain's international teleworking (digital nomad) visa), to become a company director, or for some entrepreneurial and highly qualified roles. You opt in on form 149 within six months of the start date on your Spanish social security registration.</p>
      <p class="about-text"><strong>How long.</strong> The year you become resident and the following five — up to six tax years. You still pay Spanish social security as normal, unless you stay in your home country's system on a posting certificate. Savings income such as dividends, interest and gains is taxed separately, at 19% to 30%.</p>`,
        faq: [
          ["What is the Beckham law?", `Spain's special tax regime for people who move there to work. Instead of normal income tax, whose top rate is well over 40% in every region, your employment income is taxed at a flat ${f.low}% up to ${m0(f.band)} a year and ${f.high}% above, for the year you arrive and the next five.`],
          ["Is the Beckham law worth it?", `On a high salary, yes: on ${m0(ex)} it saves ${m0(d)} a year in ${esc(regionName)}. On a lower salary, no — the ${f.low}% is on your gross pay with no allowances, so below about ${m0(breakEven)} you'd pay more than under normal income tax.`],
          ["Is the Beckham law tax on gross salary?", `Yes. The flat rate applies to your full employment income. The allowances and reductions in normal income tax — the personal minimum, the reduction for employment income, social security contributions — don't come off first.`],
          ["How long does the Beckham law last?", "For the tax year in which you become resident in Spain and the five following tax years — up to six years in all. You must not have been resident in Spain in the five years before you moved."],
          ["How do I apply for the Beckham law?", "File form 149 with the Agencia Tributaria within six months of the start date on your Spanish social security registration. Each year you then file form 151 instead of the normal income tax return."],
          ["Does the Beckham law depend on the region?", "No. The flat rate is the same everywhere in Spain (half is credited to the region on the return). Normal income tax does depend on the region, so whether the regime saves you money does too — pick yours above."]
        ],
        links: `<a href="/salary/spain/">Spain salary calculator</a> (choose the Beckham law there too)`
      };
    }
  }
};

function build(cfg) {
  const t = setup(cfg.id), p = cfg.page(t), url = SITE + cfg.path;
  const rows = cfg.salaries.map((g) => p.tableRow(g));
  const side = (k, r) => `          <div class="result-row"><span class="r-label">Income tax</span><span class="r-value" id="ex-${k}-tax">${m0(taxOf(r))}</span></div>
${p.socialRow ? `          <div class="result-row"><span class="r-label">Social security</span><span class="r-value" id="ex-${k}-social">${m0(socialOf(r))}</span></div>\n` : ""}          <div class="result-row highlight"><span class="r-label">Take-home a year</span><span class="r-value" id="ex-${k}-net">${m0(r.net)}</span></div>
          <div class="result-row"><span class="r-label">Take-home a month</span><span class="r-value" id="ex-${k}-month">${m(r.net / 12)}</span></div>
          <div class="result-row"><span class="r-label">Income tax rate</span><span class="r-value" id="ex-${k}-rate">${pct1(taxOf(r) / p.ex * 100)}</span></div>`;
  const verdict = Math.abs(p.d) < 1 ? "" : p.d > 0
    ? `${cfg.name} leaves you ${m0(p.d)} a year better off — ${m(p.d / 12)} a month more take-home pay.`
    : `${cfg.name} would cost you ${m0(-p.d)} a year (${m(-p.d / 12)} a month) at this salary, so it isn't worth opting in.`;
  const ld = [site.webPage(p.title, p.desc, url, t.checked), site.breadcrumb([["Home", SITE + "/"], [p.h1.replace(/^./, (c) => c.toUpperCase()), url]]),
    { "@context": "https://schema.org", "@type": "WebApplication", name: p.h1.replace(/^./, (c) => c.toUpperCase()), url, applicationCategory: "FinanceApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" } }, site.faqLd(p.faq)];
  const sources = t.doc.sources.slice(-(cfg.id === "nl" ? 2 : 3)).map((s) => `<a href="${esc(s.url)}" rel="noopener">${esc(s.title)}</a>`).join("; ");
  return site.head({ title: p.title, desc: p.desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="/">← All calculators</a>
      <h1 class="page-title">${esc(p.h1.replace(/^./, (c) => c.toUpperCase()))}</h1>
      <p class="page-subtitle">${esc(p.sub)}</p>
    </header>

    <main class="tool" id="ex-tool" data-place="${cfg.id}" data-option="${cfg.key}" data-off="${cfg.off}" data-on="${cfg.on}" data-currency="EUR" data-name="${esc(cfg.name)}">
${p.fields}
      <p class="error-msg" id="ex-error" style="display:none;"></p>
${p.allowanceRow ? `      <div class="result-box" style="margin-bottom:16px;">\n        <div class="result-grid">\n${p.allowanceRow}        </div>\n      </div>\n` : ""}      <div class="jo-grid">
        <div class="jo-side">
          <h2 class="tool-section-title" style="margin-top:0;">${esc(cfg.offLabel)}</h2>
          <div class="result-box"><div class="result-grid">
${side("off", p.a)}
          </div></div>
        </div>
        <div class="jo-side">
          <h2 class="tool-section-title" style="margin-top:0;">With ${esc(cfg.name.replace(/^The /, "the "))}</h2>
          <div class="result-box"><div class="result-grid">
${side("on", p.b)}
          </div></div>
        </div>
      </div>
      <p class="about-text" id="ex-verdict" style="margin-top:16px; font-weight:600;" aria-live="polite">${verdict}</p>
      <p class="tool-hint">${t.year} rates, single, employment income only, no pension contributions. For other options use the ${p.links}. Rates last checked ${t.checked}.</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">${esc(cfg.name)} at common salaries (${t.year})</h2>
${site.table(p.tableHead, rows, 680)}      <p class="tool-hint" style="margin-top:12px;">${p.tableNote ? p.tableNote + " " : ""}A full year on the scheme.</p>
    </main>

    <main class="tool">
${p.explain}
      <p class="tool-hint">Sources: ${sources}.</p>
    </main>

    <main class="tool">
      <h2 class="tool-section-title">Frequently asked questions</h2>
${site.faqHtml(p.faq)}    </main>

${related.block(cfg.path)}
${site.FOOTER}
  </div>
  <script src="/tax-engine.js"></script>
  <script src="/expat.js"></script>
</body>
</html>
`;
}

Object.values(PAGES).forEach((cfg) => site.write(cfg.path.replace(/^\/|\/$/g, ""), build(cfg)));
console.log("built " + Object.values(PAGES).map((c) => c.path).join(" "));
