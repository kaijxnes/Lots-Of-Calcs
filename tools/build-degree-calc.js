#!/usr/bin/env node
/* UK degree classification calculator: the weighted average of second- and
   final-year marks, the class it gives, and the final-year average needed
   for each class. Standard UK boundaries (first 70%, 2:1 60%, 2:2 50%,
   third 40%: Prospects, University of Bristol, UCL); the year weighting is
   the visitor's, because universities set their own.

       node tools/build-degree-calc.js */
const site = require("./lib/site.js");
const related = require("./related.js");
const { esc, SITE } = site;

const path = "/degree-classification-calculator/", url = SITE + path;
const title = "Degree Classification Calculator — What Do I Need for a First or 2:1?";
const desc = "Work out your UK degree classification from your second- and final-year averages with your university's weighting — and the final-year average you need for a first, 2:1 or 2:2.";
const SRC = [["Prospects — Understanding university grades in the UK", "https://www.prospects.ac.uk/applying-for-university/university-life/understanding-university-grades-in-the-uk/"], ["University of Bristol — A guide to degree classification", "https://www.bristol.ac.uk/academic-quality/degree-outcomes-statement/degree-classification-guide"], ["UCL — The UK honours degree system", "https://www.ucl.ac.uk/study/current-students/certificates-and-results/uk-honours-degree-system-undergraduates"]];
const need = (y2, w2, w3, target) => (target * (w2 + w3) - y2 * w2) / w3;
if (need(62, 1, 2, 60) !== 59 || need(65, 1, 2, 70) !== 72.5) throw new Error("degree maths");
const q = [
  ["How is a UK degree classification worked out?", "Usually from a weighted average of your module marks in the years that count — often the second and final years, with the final year weighted more. The usual boundaries are 70% for a first, 60% for a 2:1, 50% for a 2:2 and 40% for a third, but each university sets its own weighting and rules."],
  ["What do I need in final year for a 2:1?", `With second year counting a third and final year two-thirds (a 1:2 weighting), you need a final-year average of 1.5 × 60 − 0.5 × your second-year average. A 62% second year needs ${need(62, 1, 2, 60)}% in final year; a 55% second year needs ${need(55, 1, 2, 60)}%.`],
  ["What weighting does my university use?", "It varies: some weight the final year more heavily (1:2, 1:3, 40:60), some count only the final year, and some take the better of two methods. Check your programme handbook or degree regulations and enter the weighting here."],
  ["What happens if I'm on a borderline?", "Many universities have rules for marks just below a boundary — for example, awarding the higher class if enough of your credits are in that class. They differ between universities, so check your regulations; this calculator uses the plain boundaries."]
];
const ld = [site.webPage(title, desc, url), site.breadcrumb([["Home", SITE + "/"], ["Degree Classification Calculator", url]]),
  { "@context": "https://schema.org", "@type": "WebApplication", name: "Degree Classification Calculator", url, applicationCategory: "EducationalApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" } }, site.faqLd(q)];
const fld = (id, label, value, extra) => `        <div class="field"><label for="${id}">${label}</label><input type="number" id="${id}" value="${value}" min="0" step="any" inputmode="decimal"${extra || ""}></div>`;
const row = (label, id, value, cls) => `          <div class="result-row${cls ? " " + cls : ""}"><span class="r-label">${label}</span><span class="r-value" id="${id}">${value}</span></div>`;
const html = site.head({ title, desc, url, ld }) + `    <header class="site-header">
      <a class="back-link" href="/">← All calculators</a>
      <h1 class="page-title">Degree classification calculator</h1>
      <p class="page-subtitle">Your UK degree class from your year averages — and what you need in final year for a first, 2:1 or 2:2.</p>
    </header>

    <main class="tool" id="dg-tool">
      <div class="field-row">
${fld("dg-y2", "Second-year average (%)", 62, ' max="100"')}
${fld("dg-y3", "Final-year average (%) — leave blank if not known yet", 66, ' max="100"')}
      </div>
      <div class="field-row">
${fld("dg-w2", "Second-year weighting", 1)}
${fld("dg-w3", "Final-year weighting", 2)}
      </div>
      <p class="tool-hint">The 1 : 2 weighting filled in is only an example — enter your university's (e.g. 40 and 60, or 0 and 1 if only the final year counts).</p>
      <div class="result-box" aria-live="polite">
        <div class="result-hero"><div class="value" id="dg-class">2:1</div><div class="label" id="dg-avg">weighted average 64.67%</div></div>
        <div class="result-grid">
${row("Final-year average needed for a first (70%)", "dg-n70", "—")}
${row("…for a 2:1 (60%)", "dg-n60", "—")}
${row("…for a 2:2 (50%)", "dg-n50", "—")}
${row("…for a third (40%)", "dg-n40", "—")}
        </div>
      </div>
      <p class="tool-hint" style="margin-top:12px;">Standard boundaries: first 70%+, 2:1 60–69%, 2:2 50–59%, third 40–49%. Universities set their own weightings, rounding and borderline rules, so check your degree regulations.</p>
    </main>

    <main class="tool">
      <p class="tool-section-title">Frequently asked questions</p>
${site.faqHtml(q)}      <p class="tool-hint" style="margin-top:12px;">Sources: ${SRC.map(([t, u]) => `<a href="${u}" rel="nofollow noopener" target="_blank">${esc(t)}</a>`).join("; ")}.</p>
    </main>

${related.block(path)}
${site.FOOTER}
  </div>
  <script src="/degree.js"></script>
</body>
</html>
`;
site.write("degree-classification-calculator", html);
console.log("built " + path);
