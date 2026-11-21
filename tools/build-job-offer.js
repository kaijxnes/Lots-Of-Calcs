#!/usr/bin/env node
/* Builds /job-offer-comparison/ with its example worked out in the HTML.

       node tools/build-job-offer.js

   Take-home pay is the salary calculator's (tax-engine.js, each place's
   default options), so it runs in the monthly rebuild with the tax rates. */
const fs = require("fs");
const path = require("path");
const site = require("./lib/site.js");
const related = require("./related.js");
const TaxEngine = require("../tax-engine.js");
const registry = require("./tax/registry.js");
const { esc, SITE } = site;

const BASE = "/job-offer-comparison/";
const all = registry.readAll(), current = registry.currentFiles(all);
const gb = registry.chainFor(current.gb.doc, all);
const YEAR = current.gb.doc.taxYear.label;
const PLACES = JSON.parse(fs.readFileSync(path.join(site.ROOT, "data/salary-places.json"), "utf8")).groups;
const m0 = (v) => TaxEngine.money(v, "GBP", true), m = (v) => TaxEngine.money(v, "GBP");

/* The example: a higher salary with a longer commute and less pension */
const EX = {
  a: { salary: 35000, bonus: 0, pension: 5, perks: 0, commute: 120, hours: 37.5 },
  b: { salary: 38000, bonus: 0, pension: 3, perks: 0, commute: 320, hours: 40 }
};
function worked(o) {
  const net = TaxEngine.compute(gb, o.salary + o.bonus, {}).net, pension = o.salary * o.pension / 100, commute = o.commute * 12;
  return { net, pension, commute, real: net + pension + o.perks - commute, perHour: (net + pension + o.perks - commute) / (o.hours * 52) };
}

function side(s, o, w) {
  const options = PLACES.map((g) => `<optgroup label="${esc(g.label)}">${g.places.map((x) => `<option value="${esc(x.id)}" data-currency="${x.currency}" data-gross="${x.gross}"${x.id === "gb" ? " selected" : ""}>${esc(x.name)}</option>`).join("")}</optgroup>`).join("");
  const f = (id, label, v, extra) => `        <div class="field"><label for="jo-${s}-${id}">${label}</label><input type="number" id="jo-${s}-${id}" value="${v}" min="0" step="any" inputmode="decimal"${extra || ""}></div>`;
  return `    <div class="jo-side">
      <p class="tool-section-title" style="margin-top:0;">Offer ${s.toUpperCase()}</p>
      <div class="field"><label for="jo-${s}-place">Where</label><select id="jo-${s}-place">${options}</select></div>
      <div class="field-row">
${f("salary", `Salary a year <span class="tool-hint" id="jo-${s}-cur">GBP</span>`, o.salary)}
${f("bonus", "Bonus a year", o.bonus)}
      </div>
      <div class="field-row">
${f("pension", "Employer pension %", o.pension)}
${f("perks", "Other benefits a year", o.perks)}
      </div>
      <div class="field-row">
${f("commute", "Commute a month", o.commute)}
${f("hours", "Hours a week", o.hours)}
      </div>
      <div class="result-box" aria-live="polite">
        <div class="result-grid">
          <div class="result-row"><span class="r-label">Take-home a year</span><span class="r-value" id="jo-${s}-net">${m0(w.net)}</span></div>
          <div class="result-row"><span class="r-label">Take-home a month</span><span class="r-value" id="jo-${s}-month">${m(w.net / 12)}</span></div>
          <div class="result-row"><span class="r-label">+ Employer pension</span><span class="r-value" id="jo-${s}-pension-out">${m0(w.pension)}</span></div>
          <div class="result-row"><span class="r-label">+ Other benefits</span><span class="r-value" id="jo-${s}-perks-out">${m0(o.perks)}</span></div>
          <div class="result-row"><span class="r-label">− Commuting</span><span class="r-value" id="jo-${s}-commute-out">−${m0(w.commute)}</span></div>
          <div class="result-row highlight"><span class="r-label">Real value a year</span><span class="r-value" id="jo-${s}-real">${m0(w.real)}</span></div>
          <div class="result-row"><span class="r-label">Per hour worked</span><span class="r-value" id="jo-${s}-hour">${m(w.perHour)}</span></div>
        </div>
      </div>
    </div>`;
}

function page() {
  const url = SITE + BASE, a = worked(EX.a), b = worked(EX.b), d = a.real - b.real;
  const title = "Job Offer Comparison Calculator — Which Salary Is Really Worth More?";
  const desc = `Compare two job offers after tax, pension, benefits and commuting — in the UK, US, Canada, Europe and more. A £38,000 job can be worth ${m0(Math.abs(d))} a year less than a £35,000 one.`;
  const q = [
    ["How do I compare two job offers?", "Compare what each leaves you with, not the headline salary: take-home pay after tax, plus what the employer puts into your pension, plus benefits with a cash value, minus the cost of getting to work. Then look at it per hour, since longer hours or a longer commute eat into a higher salary."],
    ["Is a higher salary always better?", `No. In the example above, £38,000 sounds better than £35,000, but after tax the extra £3,000 becomes about ${m0(b.net - a.net)}; a 3% instead of 5% pension and £200 a month more commuting turn it into ${m0(Math.abs(d))} a year less.`],
    ["Why is the employer pension added on top?", "Your employer's contribution is money paid for you that you'd otherwise have to save from take-home pay, and it isn't taxed as income now. Your own contribution is part of your salary, so it's already inside the take-home figure if you choose it in the salary calculator."],
    ["What counts as other benefits?", "Anything with a clear yearly cash value you'd otherwise pay for: a car allowance, private medical insurance, a gym membership, free meals or a season ticket loan's interest saved. Extra holiday is worth roughly a day's pay per day."],
    ["Can I compare jobs in different countries?", "Yes — pick each place and the tax is worked out under its own rules. The real values come out in each currency; convert one at today's exchange rate and allow for living costs, which can matter more than the tax."]
  ];
  const ld = [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], ["Job Offer Comparison", url]]),
    { "@context": "https://schema.org", "@type": "WebApplication", name: "Job Offer Comparison Calculator", url, applicationCategory: "FinanceApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } }, site.faqLd(q)];
  return site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="/">← All calculators</a>
      <h1 class="page-title">Job offer comparison</h1>
      <p class="page-subtitle">Two offers side by side after tax, pension, benefits and the commute — so you can see which is really worth more.</p>
    </header>

    <main class="tool" id="jo-tool">
      <div class="jo-grid">
${side("a", EX.a, a)}
${side("b", EX.b, b)}
      </div>
      <p class="about-text" id="jo-verdict" style="margin-top:16px; font-weight:600;">${d > 0 ? "Offer A" : "Offer B"} is worth ${m0(Math.abs(d))} more a year (${m(Math.abs(d) / 12)} a month) once tax, pension, perks and commuting are counted.</p>
      <p class="tool-hint">Take-home pay uses each place's ${YEAR} rules with its usual defaults (in the UK, no student loan and no employee pension). For those, get the take-home figure from the <a href="/salary/">salary calculator</a>. Employer pension is a percentage of salary.</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">The example: £35,000 or £38,000?</p>
      <p class="about-text"><strong>Offer A</strong> pays £35,000 with a 5% employer pension and £120 a month in travel. <strong>Offer B</strong> pays £38,000 with 3% pension, £320 a month in travel and a 40-hour week instead of 37.5.</p>
      <p class="about-text">After tax and National Insurance the £3,000 gap shrinks to ${m0(b.net - a.net)}. Offer A's pension is worth ${m0(a.pension - b.pension)} more and its commute costs ${m0(b.commute - a.commute)} less, so <strong>Offer A comes out ${m0(Math.abs(d))} a year ahead</strong> — and ${m(a.perHour - b.perHour)} more per hour worked.</p>
      <p class="tool-section-title" style="margin-top:20px;">Things that don't show up in the numbers</p>
      <p class="about-text">Holiday allowance, flexible or remote working, bonus history (a "target" bonus isn't guaranteed), share schemes, sick pay, career prospects and how secure the job is. A useful check: how much would you need to be paid to take the job you like less?</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">Frequently asked questions</p>
${site.faqHtml(q)}    </main>

${related.block(BASE)}
${site.FOOTER}
  </div>
  <script src="/tax-engine.js"></script>
  <script src="/job-offer.js"></script>
</body>
</html>
`;
}

if (!(worked(EX.a).real > worked(EX.b).real)) throw new Error("job offer example no longer makes its point");
site.write("job-offer-comparison", page());
console.log("built " + BASE);
