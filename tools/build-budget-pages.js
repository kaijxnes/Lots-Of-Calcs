#!/usr/bin/env node
/* The 50/30/20 budget calculator and a page per UK salary:

       /50-30-20-budget/              calculator, any place or take-home pay
       /50-30-20-budget/30000/        £30,000: £2,093 a month → £1,047 / £628 / £419

       node tools/build-budget-pages.js

   Take-home pay is the salary calculator's: tax-engine.js on the current
   UK rules (England, Wales and Northern Ireland, with Scotland alongside),
   default options. Runs in the monthly rebuild, since it uses the rates. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const related = require("./related.js");
const TaxEngine = require("../tax-engine.js");
const registry = require("./tax/registry.js");
const config = require("./salary-pages-config.js");
const links = require("./page-links.js");
const { esc, SITE } = site;

const BASE = "/50-30-20-budget/";
const all = registry.readAll(), current = registry.currentFiles(all);
const CH = { gb: registry.chainFor(current.gb.doc, all), "gb-sct": registry.chainFor(current["gb-sct"].doc, all) };
const YEAR = current.gb.doc.taxYear.label;
const CHECKED = (() => { const d = CH.gb.map((x) => x.lastChecked); return d.every(Boolean) ? d.sort()[0] : undefined; })();
const SALARIES = config.SALARIES.GBP.slice();
const PLACES = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/salary-places.json"), "utf8")).groups;
const m = (v) => TaxEngine.money(v, "GBP"), m0 = (v) => TaxEngine.money(v, "GBP", true);
const month = (id, s) => TaxEngine.compute(CH[id], s, {}).net / 12;
const SPLITS = [[50, 30, 20], [60, 20, 20], [70, 20, 10], [40, 30, 30]];

function tool(amount, remember) {
  const options = `<option value="manual">I'll enter my take-home pay</option>` + PLACES.map((g) => `<optgroup label="${esc(g.label)}">${g.places.map((x) => `<option value="${esc(x.id)}" data-currency="${x.currency}" data-gross="${x.gross}"${x.id === "gb" ? " selected" : ""}>${esc(x.name)}</option>`).join("")}</optgroup>`).join("");
  const mm = month("gb", amount), p = (k) => mm * k / 100;
  const row = (k, label, pct) => `          <tr><td><strong>${label}</strong> <span id="bg-${k}-pct">${pct}%</span></td><td id="bg-${k}-m">${m(p(pct))}</td><td id="bg-${k}-w">${m(p(pct) * 12 / 52)}</td><td id="bg-${k}-y">${m0(p(pct) * 12)}</td></tr>`;
  return `    <main class="tool" id="bg-tool" data-remember="${remember ? 1 : 0}">
      <div class="field-row">
        <div class="field"><label for="bg-location">Where you're paid</label><select id="bg-location">${options}</select></div>
        <div class="field"><label for="bg-amount"><span id="bg-amount-label">Salary a year, before tax</span> <span id="bg-cur-note" class="tool-hint">in GBP</span></label><input type="number" id="bg-amount" value="${amount}" min="0" step="any" inputmode="decimal"></div>
      </div>
      <p class="tool-section-title">The split</p>
      <div class="field-row">
        <div class="field"><label for="bg-needs">Needs %</label><input type="number" id="bg-needs" value="50" min="0" max="100" step="any" inputmode="decimal"></div>
        <div class="field"><label for="bg-wants">Wants %</label><input type="number" id="bg-wants" value="30" min="0" max="100" step="any" inputmode="decimal"></div>
        <div class="field"><label for="bg-save">Savings %</label><input type="number" id="bg-save" value="20" min="0" max="100" step="any" inputmode="decimal"></div>
      </div>
      <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:12px;">${SPLITS.map((s) => `<button class="btn btn-ghost" type="button" data-split="${s.join("/")}">${s.join("/")}</button>`).join("")}</div>
      <p class="tool-hint" id="bg-error" role="alert" style="color: var(--bad); display: none;"></p>
      <div class="result-box" aria-live="polite">
        <div class="result-grid">
          <div class="result-row highlight" id="bg-takehome-row"><span class="r-label">Take-home pay</span><span class="r-value" id="bg-takehome">${m(mm)} a month</span></div>
        </div>
        <div class="table-scroll" style="margin-top:12px;">
          <div style="min-width:340px;">
            <table class="out-table">
              <thead><tr><th>Share</th><th>A month</th><th>A week</th><th>A year</th></tr></thead>
              <tbody>
${row("needs", "Needs", 50)}
${row("wants", "Wants", 30)}
${row("save", "Savings", 20)}
              </tbody>
            </table>
          </div>
        </div>
        <div class="result-grid" style="margin-top:12px;">
          <div class="result-row"><span class="r-label">A 3-month emergency fund</span><span class="r-value" id="bg-fund">${m0(p(50) * 3)} — about ${Math.ceil(p(50) * 3 / p(20))} months of the savings share</span></div>
        </div>
      </div>
      <p class="tool-hint" style="margin-top:12px;">Take-home pay is after income tax and National Insurance (or the local equivalents), with no pension or student loan; for those, use the <a href="/salary/">salary calculator</a> and enter its monthly figure here.</p>
    </main>
`;
}

function explain() {
  return `    <main class="tool">
      <p class="tool-section-title">How the 50/30/20 rule works</p>
      <p class="about-text">The 50/30/20 rule splits what you take home, after tax, into three:</p>
      <p class="about-text"><strong>50% for needs</strong> — what you'd have to pay whatever happened: rent or mortgage, council tax, energy and water, food shopping, insurance, getting to work, minimum debt repayments and childcare.</p>
      <p class="about-text"><strong>30% for wants</strong> — everything you choose: eating out, takeaways, holidays, subscriptions, clothes beyond the basics, hobbies and nights out.</p>
      <p class="about-text"><strong>20% for savings</strong> — building an emergency fund first, then saving for goals, paying off debt faster than the minimum, and investing or pension top-ups.</p>
      <p class="about-text">It's a starting point, not a rule. Where rent is high, needs often take 60–70%, so 70/20/10 or 60/20/20 is more realistic; on a higher income, 40/30/30 saves more. The buttons above switch between them.</p>
    </main>
`;
}

/* ---------------------------------------------------------------- calculator */
function calculatorPage() {
  const url = SITE + BASE, ex = month("gb", 30000);
  const title = "50/30/20 Budget Calculator — Split Your Take-Home Pay";
  const desc = `Split your take-home pay into needs, wants and savings with the 50/30/20 rule. On a £30,000 salary that's ${m(ex * 0.5)} for needs, ${m(ex * 0.3)} for wants and ${m(ex * 0.2)} to save each month. UK, US, Europe and more.`;
  const q = [
    ["What is the 50/30/20 rule?", "A simple budget: half of your take-home pay goes on needs, 30% on wants and 20% on savings and paying off debt. It works on pay after tax, not your salary."],
    ["How much is 50/30/20 on £30,000?", `£30,000 a year is about ${m(ex)} a month after tax and National Insurance in England (${YEAR}). That gives ${m(ex * 0.5)} for needs, ${m(ex * 0.3)} for wants and ${m(ex * 0.2)} for savings.`],
    ["Does rent count as a need?", "Yes, along with council tax, utilities, food shopping, insurance, transport to work and minimum debt payments. If your needs come to more than half your pay, try 60/20/20 or 70/20/10 and look at the biggest bills first."],
    ["What should the 20% go towards?", "An emergency fund of three to six months of needs first, then any expensive debt, then longer-term saving such as a pension or ISA. The emergency fund calculator works out the target and how long it takes."],
    ["Is 50/30/20 based on gross or net pay?", "Net — what actually reaches your bank account. Pension contributions taken from your pay can count towards the 20%."]
  ];
  const ld = [site.webPage(title, desc, url, CHECKED), site.breadcrumb([["Home", SITE + "/"], ["50/30/20 Budget Calculator", url]]),
    { "@context": "https://schema.org", "@type": "WebApplication", name: "50/30/20 Budget Calculator", url, applicationCategory: "FinanceApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } }, site.faqLd(q)];
  const GRID = [20000, 25000, 30000, 35000, 40000, 45000, 50000, 60000, 70000, 80000, 100000];
  const gridRows = GRID.map((s) => { const x = month("gb", s); return [`<a href="${BASE}${s}/">${m0(s)}</a>`, m(x), m(x * 0.5), m(x * 0.3), m(x * 0.2)]; });
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="/">← All calculators</a>
      <h1 class="page-title">50/30/20 budget calculator</h1>
      <p class="page-subtitle">Your take-home pay split into needs, wants and savings — from your salary anywhere the salary calculator covers, or from what reaches your account.</p>
    </header>

${tool(30000, true)}
${explain()}
    <main class="tool">
      <p class="tool-section-title">50/30/20 on UK salaries (${YEAR})</p>
${site.table(["Salary", "Take-home a month", "Needs 50%", "Wants 30%", "Savings 20%"], gridRows, 480)}      <p class="tool-hint" style="margin-top:12px;">England, Wales and Northern Ireland, after income tax and National Insurance. Every salary from £15,000 to £200,000 has its own page:</p>
      <p class="salary-links">${SALARIES.map((s) => `<a href="${BASE}${s}/">${m0(s)}</a>`).join(" ")}</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">Frequently asked questions</p>
${site.faqHtml(q)}    </main>

${related.block(BASE)}
${site.FOOTER}
  </div>
  <script src="/tax-engine.js"></script>
  <script src="/budget.js"></script>
</body>
</html>
`;
}

/* ---------------------------------------------------------------- salary pages */
function salaryPage(s) {
  const url = SITE + `${BASE}${s}/`, x = month("gb", s), sct = month("gb-sct", s);
  const title = site.fitTitle(`50/30/20 Budget on ${m0(s)} — ${m0(x * 0.5)} Needs, ${m0(x * 0.3)} Wants, ${m0(x * 0.2)} Savings`, `50/30/20 Budget on ${m0(s)} a Year (${YEAR})`);
  const desc = `On ${m0(s)} you take home ${m(x)} a month in England (${YEAR}). The 50/30/20 rule gives ${m(x * 0.5)} for needs, ${m(x * 0.3)} for wants and ${m(x * 0.2)} for savings.`;
  const splitRows = SPLITS.map((sp) => [sp.join("/"), m(x * sp[0] / 100), m(x * sp[1] / 100), m(x * sp[2] / 100)]);
  const sal = links.salaryUk(s);
  const fundMonths = Math.ceil(x * 0.5 * 3 / (x * 0.2));
  const q = [
    [`What is the 50/30/20 budget on ${m0(s)}?`, `${m0(s)} is ${m(x)} a month after tax and National Insurance in England, Wales and Northern Ireland (${YEAR}): ${m(x * 0.5)} for needs, ${m(x * 0.3)} for wants and ${m(x * 0.2)} for savings.`],
    ["What about in Scotland?", `Scottish income tax bands give ${m(sct)} a month on ${m0(s)}, so ${m(sct * 0.5)} for needs, ${m(sct * 0.3)} for wants and ${m(sct * 0.2)} for savings.`],
    [`How much should I save on ${m0(s)}?`, `20% of take-home pay is ${m(x * 0.2)} a month, or ${m0(x * 0.2 * 12)} a year. Saved for ${fundMonths} months, that builds a three-month emergency fund of ${m0(x * 0.5 * 3)}.`],
    [`How much rent can I afford on ${m0(s)}?`, `If rent is your biggest need, keeping it to around a third of take-home pay — ${m(x / 3)} a month — leaves room in the 50% for bills, food and transport. Many people in high-rent areas spend more and use a 60/20/20 or 70/20/10 split instead.`]
  ];
  const ld = [site.webPage(title, desc, url, CHECKED), site.breadcrumb([["Home", SITE + "/"], ["50/30/20 Budget Calculator", SITE + BASE], [`${m0(s)}`, url]]), site.faqLd(q)];
  const near = site.neighbours(SALARIES, s, 5).map((y) => `<a href="${BASE}${y}/">${m0(y)}</a>`).join(" ");
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="${BASE}">← 50/30/20 budget calculator</a>
      <h1 class="page-title">50/30/20 budget on ${m0(s)}</h1>
      <p class="page-subtitle">${m0(s)} a year is <strong>${m(x)} a month</strong> after tax in England (${YEAR}): ${m(x * 0.5)} for needs, ${m(x * 0.3)} for wants and ${m(x * 0.2)} to save.</p>
    </header>

${tool(s, false)}
    <main class="tool">
      <p class="tool-section-title">Other splits on ${m0(s)}</p>
${site.table(["Split", "Needs", "Wants", "Savings"], splitRows, 340)}      <p class="tool-hint" style="margin-top:12px;">A month, from ${m(x)} take-home in England, Wales and Northern Ireland. In Scotland it's ${m(sct)} a month.${sal ? ` The full breakdown of tax and National Insurance is on the <a href="${sal}">${m0(s)} after tax</a> page.` : ""}</p>
    </main>

${explain()}
    <main class="tool">
      <p class="tool-section-title">Frequently asked questions</p>
${site.faqHtml(q)}    </main>

    <div class="hub-group-title" style="margin-top:28px;">Other salaries</div>
    <p class="salary-links">${near}</p>

${site.FOOTER}
  </div>
  <script src="/tax-engine.js"></script>
  <script src="/budget.js"></script>
</body>
</html>
`;
}

/* Check: take-home matches the salary pages' engine — £30,000 in England is £25,119.60 a year (${YEAR}) */
if (!(month("gb", 30000) > 1500 && month("gb", 30000) < 2600)) throw new Error("budget check");

const urls = [];
site.write("50-30-20-budget", calculatorPage());
SALARIES.forEach((s) => { site.write(`50-30-20-budget/${s}`, salaryPage(s)); urls.push([`${BASE}${s}/`, "0.5"]); });
site.prune("50-30-20-budget", /^\d+$/);
site.sitemapBlock("budget pages", "tools/build-budget-pages.js", urls);
console.log(`built ${BASE} and ${SALARIES.length} salary pages (${YEAR})`);
